#!/usr/bin/env python3
# =============================================================================
# load-transcripts.py -- climb the Harvest % past 22%, deterministically.
# =============================================================================
# Darrell 2026-06-30: the Harvest % was stuck at 22% because the transcript-gated
# harvests (lessons / discernment / testimony / trivia / full Scripture sweep)
# had no transcript to derive from. The prior "fix" (#399) shipped the extractors
# but left the transcript source as a 3-step MANUAL dance nobody ran (captions ->
# a Node SQL generator -> hand-applied SQL). This script IS the source, made a
# single deterministic step: fetch YouTube's OWN auto-captions and write them
# STRAIGHT into the cloud `video_transcripts` table (migration 0058). The served
# app (harvest-ledger.js) then derives the transcript harvests LIVE off that row,
# and the % climbs. No GPU, no Whisper, no n8n, no login, no browser.
#
# THE DIRECTION (DR-0083, "n8n -> plain Python on the NAS"): this mirrors
# infra/nas-finance-ingest/imported_snapshot.py -- stdlib + one pip dep, reads a
# service-role key from a NAS secrets file, writes over the Supabase REST API.
#
# CONSISTENCY / NEVER-SILENTLY-STALLS (the other half of the complaint):
#   * INCREMENTAL  -- a video already carrying text (or a recorded no-caption
#                     verdict) is skipped, so every run ADVANCES.
#   * RESUMABLE    -- each video is upserted immediately; a crash keeps all prior
#                     work; re-running picks up where it left off.
#   * IDEMPOTENT   -- upsert on (instance_id, video_id); re-running is a no-op.
#   * BOUNDED      -- --max caps videos per run (the budget brake).
#   * STALL-GUARD  -- prints the stage per video and a final coverage line
#                     (transcribed / total); exits non-zero if a run advanced 0
#                     videos while gaps remain, so a scheduler surfaces the stall
#                     instead of it hanging silently.
#
# THREE BRAKES (CLAUDE.md autonomous-automation rule): (1) --max budget; (2) a
# single-instance lock file (a second run SKIPS); (3) ships MANUAL/inactive --
# arm the DSM schedule only with someone watching. No autostart in this file.
#
# Requires: pip install youtube-transcript-api   (stdlib for everything else)
#
# Secrets (first found wins): env SUPABASE_URL + SUPABASE_SERVICE_KEY, else a JSON
# file at --secrets (default /volume1/PoeTech/secrets/supabase.json) shaped:
#     { "url": "https://xxxx.supabase.co", "service_key": "eyJ..." }
#
# Usage (from anywhere):
#   python load-transcripts.py --slug colg --max 25          # pull ids from cloud choir_sermons
#   python load-transcripts.py --slug colg --ids BQC4nYa33vo,xsjO93qBw5I
#   python load-transcripts.py --slug colg --channel UC821pJh7YR5llBNnWUJj-ZA --max 25
#   python load-transcripts.py --slug colg --dry-run         # fetch, print coverage, write nothing
# =============================================================================
import argparse
import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse

CHANNEL_RSS = "https://www.youtube.com/feeds/videos.xml?channel_id={}"
LOCK_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", ".load-transcripts.lock")
DEFAULT_SECRETS = "/volume1/PoeTech/secrets/supabase.json"


def log(msg):
    print(msg, file=sys.stderr, flush=True)


# --- secrets ----------------------------------------------------------------

def load_secrets(path):
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if url and key:
        return url.rstrip("/"), key
    if path and os.path.exists(path):
        with open(path, "r", encoding="utf-8") as fh:
            d = json.load(fh)
        url = (d.get("url") or "").rstrip("/")
        key = d.get("service_key") or d.get("service_role_key")
        if url and key:
            return url, key
    log("ERROR: no Supabase credentials. Set SUPABASE_URL + SUPABASE_SERVICE_KEY, "
        f"or provide {path} as {{\"url\":..., \"service_key\":...}}.")
    sys.exit(2)


# --- REST helpers (service role, RLS-exempt) --------------------------------

def rest(url, key, method, path, body=None, extra_headers=None):
    headers = {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url + "/rest/v1/" + path, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=45) as resp:
        raw = resp.read().decode("utf-8", "ignore")
    return json.loads(raw) if raw.strip() else None


def resolve_instance(url, key, slug):
    rows = rest(url, key, "GET", "instances?select=id&slug=eq." + urllib.parse.quote(slug))
    if not rows:
        log(f"ERROR: no instance with slug '{slug}'.")
        sys.exit(2)
    return rows[0]["id"]


def existing_state(url, key, instance_id):
    """video_id -> {'has_text': bool, 'has_error': bool} for what's already loaded."""
    rows = rest(url, key, "GET",
                "video_transcripts?select=video_id,words,error&instance_id=eq." + instance_id) or []
    out = {}
    for r in rows:
        out[r["video_id"]] = {"has_text": (r.get("words") or 0) > 0, "has_error": bool(r.get("error"))}
    return out


def upsert_transcript(url, key, instance_id, vid, record, dry_run):
    row = {"instance_id": instance_id, "video_id": vid, "fetched_at": _isonow(), **record}
    if dry_run:
        return
    rest(url, key, "POST",
         "video_transcripts?on_conflict=instance_id,video_id",
         body=[row],
         extra_headers={"Prefer": "resolution=merge-duplicates,return=minimal"})


def video_ids_from_cloud(url, key, instance_id):
    rows = rest(url, key, "GET",
                "choir_sermons?select=video_id&instance_id=eq." + instance_id
                + "&video_id=not.is.null&order=service_date.desc") or []
    return [r["video_id"] for r in rows if r.get("video_id")]


# --- id sources -------------------------------------------------------------

def channel_video_ids(channel_id):
    req = urllib.request.Request(CHANNEL_RSS.format(channel_id), headers={"User-Agent": "Mozilla/5.0"})
    data = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
    return re.findall(r"<yt:videoId>([^<]+)</yt:videoId>", data)


def ids_from_file(path):
    with open(path, "r", encoding="utf-8") as fh:
        raw = fh.read()
    try:
        arr = json.loads(raw)
        out = []
        for r in arr:
            vid = (r.get("videoId") or r.get("video_id")) if isinstance(r, dict) else r
            if vid:
                out.append(vid)
        return out
    except json.JSONDecodeError:
        return [ln.strip() for ln in raw.splitlines() if ln.strip()]


# --- caption fetch (YouTube auto-captions; no GPU) --------------------------

def fetch_caption(api, vid):
    """Return (text, words, error). text='' when captions are unavailable."""
    try:
        segs = list(api.fetch(vid, languages=["en"]))
        text = " ".join(s.text.replace("\n", " ").strip() for s in segs if s.text.strip())
        return text, len(text.split()), None
    except Exception as e:  # noqa: BLE001 -- any failure = no usable caption; record it
        return "", 0, f"{type(e).__name__}: {str(e)[:180]}"


def _isonow():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


# --- brakes -----------------------------------------------------------------

def acquire_lock():
    os.makedirs(os.path.dirname(LOCK_PATH), exist_ok=True)
    if os.path.exists(LOCK_PATH):
        try:
            age = time.time() - os.path.getmtime(LOCK_PATH)
        except OSError:
            age = 0
        if age < 3600:  # a fresh lock => a prior run is live; SKIP (concurrency brake)
            log(f"Another run holds the lock ({int(age)}s old). Skipping.")
            sys.exit(0)
        log("Stale lock (>1h); taking over.")
    with open(LOCK_PATH, "w", encoding="utf-8") as fh:
        fh.write(str(os.getpid()))


def release_lock():
    try:
        os.remove(LOCK_PATH)
    except OSError:
        pass


# --- main -------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Load YouTube auto-caption transcripts into video_transcripts (climb the Harvest %).")
    ap.add_argument("--slug", default="colg", help="instance slug (default colg)")
    ap.add_argument("--ids", help="comma-separated video ids")
    ap.add_argument("--ids-file", help="JSON array (videoId/video_id) or id-per-line file")
    ap.add_argument("--channel", help="YouTube channel_id (UC...) -- recent uploads via RSS")
    ap.add_argument("--max", type=int, default=25, help="cap videos fetched THIS run (budget brake; 0 = no cap)")
    ap.add_argument("--refetch", action="store_true", help="re-fetch ids already loaded")
    ap.add_argument("--dry-run", action="store_true", help="fetch + report, write nothing")
    ap.add_argument("--secrets", default=DEFAULT_SECRETS, help="path to Supabase secrets JSON")
    args = ap.parse_args()

    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        log("ERROR: pip install youtube-transcript-api")
        sys.exit(2)

    url, key = load_secrets(args.secrets)
    instance_id = resolve_instance(url, key, args.slug)

    # Assemble the id worklist (explicit sources first, else the cloud corpus).
    ids = []
    if args.ids:
        ids += [s.strip() for s in args.ids.split(",") if s.strip()]
    if args.ids_file:
        ids += ids_from_file(args.ids_file)
    if args.channel:
        ids += channel_video_ids(args.channel)
    if not ids:
        ids = video_ids_from_cloud(url, key, instance_id)
    seen, ordered = set(), []
    for v in ids:
        if v not in seen:
            seen.add(v)
            ordered.append(v)
    if not ordered:
        log("No video ids (no --ids/--ids-file/--channel and choir_sermons is empty).")
        sys.exit(1)

    acquire_lock()
    try:
        state = existing_state(url, key, instance_id)
        api = YouTubeTranscriptApi()
        fetched = no_caption = skipped = 0
        total = len(ordered)
        for i, vid in enumerate(ordered, 1):
            prior = state.get(vid)
            if prior and not args.refetch and (prior["has_text"] or prior["has_error"]):
                skipped += 1
                continue
            if args.max and (fetched + no_caption) >= args.max:
                log(f"--max {args.max} reached; stopping (re-run to continue).")
                break
            log(f"[{i}/{total}] fetching captions for {vid} ...")
            text, words, err = fetch_caption(api, vid)
            if text:
                upsert_transcript(url, key, instance_id, vid,
                                  {"text": text, "words": words, "source": "youtube-asr",
                                   "lang": "en", "error": None}, args.dry_run)
                fetched += 1
                log(f"    ok  {words} words -> video_transcripts")
            else:
                upsert_transcript(url, key, instance_id, vid,
                                  {"text": "", "words": 0, "source": "youtube-asr",
                                   "error": err or "no-captions"}, args.dry_run)
                no_caption += 1
                log(f"    MISS ({err}) -> recorded; Whisper-on-NAS fallback")

        # STALL-GUARD: coverage after this run. Non-zero exit if we advanced 0 while
        # gaps remain, so a scheduler flags the stall instead of it hanging silent.
        after = existing_state(url, key, instance_id) if not args.dry_run else state
        with_text = sum(1 for v in after.values() if v.get("has_text"))
        gaps = total - with_text
        log("")
        log(f"This run: {fetched} fetched, {no_caption} no-caption, {skipped} already had.")
        log(f"Coverage: {with_text}/{total} videos transcribed ({gaps} still owe a transcript).")
        if fetched == 0 and no_caption == 0 and gaps > 0 and not args.refetch:
            log("STALL: 0 videos advanced while gaps remain. Check credentials / caption availability.")
            sys.exit(3)
        log("Done. The served Harvest ledger derives these transcripts live -- the % climbs.")
    finally:
        release_lock()


if __name__ == "__main__":
    main()
