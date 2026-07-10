#!/usr/bin/env python3
# =============================================================================
# load-transcripts.py -- climb the Harvest % past 22%, deterministically.
# =============================================================================
# SOURCE-ADAPTER DECLARATION (scripts/source-adapter-guard.mjs checks this):
PLATFORM = "youtube"

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
# single-instance lock file (a second run SKIPS); (3) a kill-switch: after 3
# consecutive all-blocked runs the loader writes out/.transcripts-paused and
# refuses to run until a human deletes it -- a scheduled task can never grind
# against a blocked IP unattended. Ships MANUAL/inactive -- arm the DSM
# schedule only with someone watching. No autostart in this file.
#
# TRICKLE MODE (Darrell 2026-07-03, after YouTube IP-blocked the NAS at ~50
# fetches in one burst): a small daily budget at randomized times, sized to
# finish the backfill in days-to-weeks and then keep pace with the channel's
# ~2-3 uploads/week forever. Recommended DSM Task Scheduler daily command:
#   python3 /volume1/PoeTech/load-transcripts-fixed.py --slug colg \
#     --max 10 --sleep-min 20 --sleep-max 60 --start-jitter 900
# --max is the pace knob: 10/day clears 89 gaps in ~9 days; 3/day in ~a month.
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
import calendar
import json
import os
import random
import re
import sys
import time
import urllib.request
import urllib.parse

CHANNEL_RSS = "https://www.youtube.com/feeds/videos.xml?channel_id={}"
_OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
LOCK_PATH = os.path.join(_OUT_DIR, ".load-transcripts.lock")
PAUSE_FLAG = os.path.join(_OUT_DIR, ".transcripts-paused")
BLOCKED_RUNS = os.path.join(_OUT_DIR, ".transcripts-blocked-runs")
DEFAULT_SECRETS = "/volume1/PoeTech/secrets/supabase.json"

# YouTube can take a couple of days (longer for long services) to finish
# generating a video's auto-captions. A "no captions" result on a video newer
# than this window is TRANSIENT -- the track is still processing -- so we retry it
# later instead of burning a durable no-caption verdict on a fresh upload
# (Darrell 2026-07-06: "there's not closed captions for that video yet... takes a
# couple days for YouTube to process them"). Older than this, a no-caption result
# is a real verdict about the video -> Whisper-on-NAS fallback.
CAPTION_GRACE_DAYS = 4

# Exception class names that are durable verdicts about the video itself
# (mirrors transcript-backfill-ci.py; verified against youtube-transcript-api's
# _errors module). Everything else -- RequestBlocked, IpBlocked, network
# failures -- is environmental: write NOTHING, retry next run (DR-0076: a
# blocked request is a fact about the runner, not the video).
VERDICT_ERRORS = (
    "TranscriptsDisabled", "NoTranscriptFound", "VideoUnavailable",
    "InvalidVideoId", "AgeRestricted", "VideoUnplayable",
    "NotTranslatable", "TranslationLanguageNotAvailable",
)


def is_verdict(err):
    """True when a stored/new error string is a durable no-caption verdict."""
    return bool(err) and err.split(":", 1)[0].strip() in VERDICT_ERRORS


def within_caption_grace(service_date, now_ms=None, grace_days=CAPTION_GRACE_DAYS):
    """True when a video is new enough that a missing caption track most likely
    just means YouTube has not finished processing it yet (retry later) rather
    than a durable no-caption verdict. `service_date` is 'YYYY-MM-DD' (from
    choir_sermons) or None. An unknown/unparseable date returns False -- treat it
    as old, i.e. let the verdict stand -- the conservative default that never
    leaves a genuinely caption-less old video looping forever. `now_ms` is epoch
    SECONDS (injected in tests; defaults to time.time())."""
    if not service_date:
        return False
    try:
        vid_epoch = calendar.timegm(time.strptime(str(service_date)[:10], "%Y-%m-%d"))
    except (ValueError, TypeError):
        return False
    now = now_ms if now_ms is not None else time.time()
    return (now - vid_epoch) < grace_days * 86400


def build_api(YouTubeTranscriptApi):
    """YouTubeTranscriptApi, routed through a residential proxy when configured.

    2026-07-03 reality check: YouTube IP-blocked the NAS's own residential IP
    after ~180 requests in a day (IpBlocked on every fetch), so even the NAS
    route needs either patience (rate-limit cool-off + small --max) or a proxy.
    Set WEBSHARE_PROXY_USERNAME + WEBSHARE_PROXY_PASSWORD (rotating residential)
    or YT_PROXY_URL (any http(s) proxy URL) in the environment.
    """
    ws_user = (os.environ.get("WEBSHARE_PROXY_USERNAME") or "").strip()
    ws_pass = (os.environ.get("WEBSHARE_PROXY_PASSWORD") or "").strip()
    proxy_url = (os.environ.get("YT_PROXY_URL") or "").strip()
    if ws_user and ws_pass:
        from youtube_transcript_api.proxies import WebshareProxyConfig
        log("Proxy: Webshare rotating residential")
        return YouTubeTranscriptApi(proxy_config=WebshareProxyConfig(
            proxy_username=ws_user, proxy_password=ws_pass))
    if proxy_url:
        from youtube_transcript_api.proxies import GenericProxyConfig
        log("Proxy: generic (YT_PROXY_URL)")
        return YouTubeTranscriptApi(proxy_config=GenericProxyConfig(
            http_url=proxy_url, https_url=proxy_url))
    return YouTubeTranscriptApi()


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
    """video_id -> {'has_text': bool, 'has_verdict': bool} for what's already loaded.

    has_verdict is True only for durable no-caption verdicts (VERDICT_ERRORS).
    A row holding a transient error (RequestBlocked etc., recorded before the
    verdict/transient split) reads as neither -> it gets retried this run.
    """
    rows = rest(url, key, "GET",
                "video_transcripts?select=video_id,words,error&instance_id=eq." + instance_id) or []
    out = {}
    for r in rows:
        out[r["video_id"]] = {"has_text": (r.get("words") or 0) > 0,
                              "has_verdict": is_verdict(r.get("error"))}
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
    """Return [(video_id, service_date)] newest-first. service_date drives the
    caption-grace check -- a brand-new upload's missing captions are transient."""
    rows = rest(url, key, "GET",
                "choir_sermons?select=video_id,service_date&instance_id=eq." + instance_id
                + "&video_id=not.is.null&order=service_date.desc") or []
    return [(r["video_id"], r.get("service_date")) for r in rows if r.get("video_id")]


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


# --- caption cues -> WebVTT (mirrors app captions.js so both paths match) ----
# The sovereign caption track: the SAME timestamped cues YouTube generates,
# stored as WebVTT so OUR surfaces (the app follow-along panel, the Presenter
# overlay) can render captions without the YouTube player. The `text` blob we
# already store is the UNtimed transcript; `vtt` + `cue_count` are what make it a
# caption (migration 0095). build_vtt/cues_from_segments are byte-for-byte the
# same algorithm as youtube-captions.py and app/src/lib/captions.js.

def _vtt_timestamp(seconds):
    total = seconds if (seconds and seconds > 0) else 0.0
    whole = int(total)
    millis = int(round((total - whole) * 1000))
    if millis >= 1000:
        whole += 1
        millis -= 1000
    return "%02d:%02d:%02d.%03d" % (whole // 3600, (whole % 3600) // 60, whole % 60, millis)


def _clean_cue_text(text):
    t = str(text or "").replace(">>", " ").replace("\r", " ").replace("\n", " ")
    return re.sub(r"\s+", " ", t).strip()


def cues_from_segments(segs):
    default_hold = 4.0
    raw = []
    for s in segs:
        text = _clean_cue_text(getattr(s, "text", ""))
        if not text:
            continue
        start = float(getattr(s, "start", 0.0) or 0.0)
        dur = getattr(s, "duration", None)
        dur = float(dur) if (dur is not None and float(dur) > 0) else default_hold
        raw.append({"start": start, "end": start + dur, "text": text})
    raw.sort(key=lambda c: (c["start"], c["end"]))
    for i in range(len(raw) - 1):
        if raw[i]["end"] > raw[i + 1]["start"]:
            raw[i]["end"] = raw[i + 1]["start"]
        if raw[i]["end"] < raw[i]["start"]:
            raw[i]["end"] = raw[i]["start"]
    return raw


def build_vtt(cues):
    lines = ["WEBVTT", ""]
    n = 0
    for cue in cues:
        text = _clean_cue_text(cue["text"])
        if not text:
            continue
        start = cue["start"] if cue["start"] > 0 else 0.0
        end = cue["end"] if cue["end"] > start else start + 0.001
        n += 1
        lines.append(str(n))
        lines.append("%s --> %s" % (_vtt_timestamp(start), _vtt_timestamp(end)))
        lines.append(text)
        lines.append("")
    return "\n".join(lines)


# --- caption fetch (YouTube auto-captions; no GPU) --------------------------

def fetch_caption(api, vid):
    """Return (text, words, vtt, cue_count, error). text='' + vtt='' when
    captions are unavailable. `vtt` is the timestamped WebVTT caption track built
    from the SAME segments the joined `text` comes from (migration 0095)."""
    try:
        segs = list(api.fetch(vid, languages=["en"]))
        text = " ".join(_clean_cue_text(s.text) for s in segs if _clean_cue_text(getattr(s, "text", "")))
        if not text:  # fetch succeeded but the track is empty: a durable verdict
            return "", 0, "", 0, "NoTranscriptFound: empty caption track"
        cues = cues_from_segments(segs)
        return text, len(text.split()), build_vtt(cues), len(cues), None
    except Exception as e:  # noqa: BLE001 -- classified verdict-vs-transient by caller
        return "", 0, "", 0, f"{type(e).__name__}: {str(e)[:180]}"


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


# Kill-switch (brake 3): 3 consecutive all-blocked runs -> auto-pause. A
# scheduled task must never grind against a blocked IP unattended; a human
# deletes the flag to resume once the block has cleared.

def _consecutive_blocked():
    try:
        with open(BLOCKED_RUNS, "r", encoding="utf-8") as fh:
            return int(fh.read().strip() or 0)
    except (OSError, ValueError):
        return 0


def record_blocked_run():
    n = _consecutive_blocked() + 1
    os.makedirs(_OUT_DIR, exist_ok=True)
    with open(BLOCKED_RUNS, "w", encoding="utf-8") as fh:
        fh.write(str(n))
    log(f"All-blocked run #{n} in a row.")
    if n >= 3:
        with open(PAUSE_FLAG, "w", encoding="utf-8") as fh:
            fh.write(f"auto-paused after {n} consecutive all-blocked runs\n")
        log(f"KILL-SWITCH: {n} consecutive all-blocked runs -> auto-paused.")
        log(f"To resume once the block clears: rm {PAUSE_FLAG}")


def clear_blocked_runs():
    try:
        os.remove(BLOCKED_RUNS)
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
    ap.add_argument("--caption-grace-days", type=int, default=CAPTION_GRACE_DAYS,
                    help="a no-caption result on a video newer than this many days is treated "
                         "as transient (YouTube still processing the captions), not a durable "
                         f"verdict; such a video is retried on a later run (default {CAPTION_GRACE_DAYS})")
    ap.add_argument("--dry-run", action="store_true", help="fetch + report, write nothing")
    ap.add_argument("--secrets", default=DEFAULT_SECRETS, help="path to Supabase secrets JSON")
    ap.add_argument("--sleep-min", type=float, default=1.0,
                    help="min seconds between fetches (trickle pacing; default 1)")
    ap.add_argument("--sleep-max", type=float, default=4.0,
                    help="max seconds between fetches (trickle pacing; default 4)")
    ap.add_argument("--start-jitter", type=int, default=0,
                    help="sleep a random 0..N seconds before starting, so a fixed "
                         "daily schedule fires at a different time each day "
                         "(recommend 900; capped at 1800 to stay under the lock's "
                         "stale threshold)")
    args = ap.parse_args()

    # Kill-switch gate: refuse to run while auto-paused (see record_blocked_run).
    if os.path.exists(PAUSE_FLAG):
        log(f"PAUSED: {PAUSE_FLAG} exists (kill-switch: repeated all-blocked runs).")
        log(f"Once the IP block has cleared, resume with: rm {PAUSE_FLAG}")
        sys.exit(4)

    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        log("ERROR: pip install youtube-transcript-api")
        sys.exit(2)

    url, key = load_secrets(args.secrets)
    instance_id = resolve_instance(url, key, args.slug)

    # Assemble the id worklist (explicit sources first, else the cloud corpus).
    svc_date = {}  # video_id -> service_date (cloud), drives the caption-grace check
    ids = []
    if args.ids:
        ids += [s.strip() for s in args.ids.split(",") if s.strip()]
    if args.ids_file:
        ids += ids_from_file(args.ids_file)
    if args.channel:
        ids += channel_video_ids(args.channel)
    if not ids:
        for _vid, _sd in video_ids_from_cloud(url, key, instance_id):
            ids.append(_vid)
            svc_date[_vid] = _sd
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
        if args.start_jitter > 0:
            wait = random.uniform(0, min(args.start_jitter, 1800))
            log(f"Start jitter: sleeping {int(wait)}s (of --start-jitter {args.start_jitter}).")
            time.sleep(wait)

        state = existing_state(url, key, instance_id)
        api = build_api(YouTubeTranscriptApi)
        fetched = no_caption = blocked = pending = skipped = 0
        total = len(ordered)
        for i, vid in enumerate(ordered, 1):
            prior = state.get(vid)
            recent = within_caption_grace(svc_date.get(vid), grace_days=args.caption_grace_days)
            # A recorded no-caption VERDICT counts as resolved -- UNLESS the video
            # is still inside the caption-processing window, where that verdict may
            # be premature (YouTube had not generated captions yet). Re-fetching a
            # recent, verdict-marked video is how a mistaken early verdict SELF-HEALS
            # once the captions land (no manual cleanup needed).
            resolved = prior and (prior["has_text"] or (prior["has_verdict"] and not recent))
            if resolved and not args.refetch:
                skipped += 1
                continue
            if args.max and (fetched + no_caption + blocked + pending) >= args.max:
                log(f"--max {args.max} reached; stopping (re-run to continue).")
                break
            log(f"[{i}/{total}] fetching captions for {vid} ...")
            text, words, vtt, cue_count, err = fetch_caption(api, vid)
            if text:
                upsert_transcript(url, key, instance_id, vid,
                                  {"text": text, "words": words, "source": "youtube-asr",
                                   "lang": "en", "error": None,
                                   "vtt": vtt, "cue_count": cue_count}, args.dry_run)
                fetched += 1
                log(f"    ok  {words} words, {cue_count} caption cues -> video_transcripts")
            elif is_verdict(err) and recent:
                # No caption track YET, but the upload is new enough that YouTube is
                # very likely still processing it (Darrell 2026-07-06). Treat like a
                # transient miss: write NOTHING so a later run retries once captions
                # land -- never burn a durable verdict on a fresh upload.
                pending += 1
                log(f"    PENDING ({err}) -> uploaded < {args.caption_grace_days}d ago; captions still processing, will retry")
            elif is_verdict(err):
                upsert_transcript(url, key, instance_id, vid,
                                  {"text": "", "words": 0, "source": "youtube-asr",
                                   "error": err}, args.dry_run)
                no_caption += 1
                log(f"    MISS ({err}) -> verdict recorded; Whisper-on-NAS fallback")
            else:
                # Environmental failure (IP block, network). NOT a fact about
                # the video: write nothing so the next run retries it.
                blocked += 1
                log(f"    BLOCKED ({err}) -> not recorded; will retry next run")

            # Trickle pacing: a slow, jittered gap between fetches keeps the
            # request pattern under the burst threshold that got the IP blocked.
            if args.sleep_max > 0:
                time.sleep(random.uniform(max(args.sleep_min, 0), max(args.sleep_max, args.sleep_min)))

        # STALL-GUARD: coverage after this run. Non-zero exit if we advanced 0 while
        # gaps remain, so a scheduler flags the stall instead of it hanging silent.
        after = existing_state(url, key, instance_id) if not args.dry_run else state
        with_text = sum(1 for v in after.values() if v.get("has_text"))
        gaps = total - with_text
        log("")
        log(f"This run: {fetched} fetched, {no_caption} no-caption verdicts, "
            f"{pending} pending (too new; will retry), {blocked} blocked (will retry), "
            f"{skipped} already resolved.")
        log(f"Coverage: {with_text}/{total} videos transcribed ({gaps} still owe a transcript).")
        if fetched > 0:
            clear_blocked_runs()  # real progress resets the kill-switch counter
        # Only trip the IP-block kill-switch when EVERY attempt was refused -- a run
        # that got any real answer (a fetch, a verdict, or a still-processing
        # pending) proves the IP is reaching YouTube.
        if blocked > 0 and (fetched + no_caption + pending) == 0:
            log(f"BLOCKED: all {blocked} attempts were rejected (YouTube is blocking this IP). Nothing advanced.")
            if not args.dry_run:
                record_blocked_run()
            sys.exit(3)
        # A true STALL is nothing happening at all while gaps remain -- NOT the
        # healthy case where the only work left is pending brand-new uploads.
        if (fetched + no_caption + blocked + pending) == 0 and gaps > 0 and not args.refetch:
            log("STALL: 0 videos advanced while gaps remain. Check credentials / caption availability.")
            sys.exit(3)
        if fetched > 0:
            log("Done. The served Harvest ledger derives these transcripts live -- the % climbs.")
    finally:
        release_lock()


if __name__ == "__main__":
    main()
