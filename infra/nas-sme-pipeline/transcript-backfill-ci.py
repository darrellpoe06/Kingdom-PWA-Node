#!/usr/bin/env python3
# =============================================================================
# transcript-backfill-ci.py -- CI transcript + channel-sync pipeline
# =============================================================================
# SOURCE-ADAPTER DECLARATION (scripts/source-adapter-guard.mjs checks this):
PLATFORM = "youtube"

# Two-phase runner for GitHub Actions. Uses DATABASE_URL (= SUPABASE_DB_URL, the
# direct PostgreSQL session-pooler URL) which gives superuser-equivalent access
# and bypasses RLS entirely -- no service-role JWT needed. Mirrors the logic of
# load-transcripts.py but suitable for CI where only SUPABASE_DB_URL is a secret.
#
# PHASE 1 -- channel sync: pull the @thelovecorner YouTube RSS feed and INSERT
#   any new video IDs into choir_sermons (idempotent ON CONFLICT DO NOTHING).
#   Covers today's new uploads (1pm Bible study + choir rehearsal) the moment
#   YouTube publishes them to the channel feed.
#
# PHASE 2 -- transcript backfill: for every video in choir_sermons lacking a
#   transcript row (or an error verdict), fetch YouTube auto-captions and upsert
#   into video_transcripts. The served app (harvest-ledger.js) derives lessons /
#   discernment / testimony / trivia / Scripture sweep LIVE off these rows --
#   no GPU, no Whisper, no n8n.
#
# THREE BRAKES (CLAUDE.md autonomous-automation rule):
#   (1) --max: cap videos fetched THIS run (budget brake; default 50).
#   (2) GitHub Actions concurrency group in the workflow YAML
#       (cancel-in-progress: false) -- one run at a time, never stacked.
#   (3) Workflow ships with workflow_dispatch ONLY -- no schedule without
#       explicit human enable. Ships inactive-until-armed per the rule.
#
# STALL-GUARD: exits non-zero if 0 videos were advanced while gaps remain,
#   and ALSO when every attempt was IP-blocked (a blocked run is NOT progress;
#   a green check must mean transcripts moved -- DR-0076).
# IDEMPOTENT: choir_sermons upsert = ON CONFLICT DO NOTHING; transcript
#   upsert = ON CONFLICT DO UPDATE, guarded so an empty fetch never clobbers
#   a row that already has real text.
# RESUMABLE: each video is written immediately; a crash keeps all prior work.
#
# VERDICT vs TRANSIENT (DR-0076). Only an exception that states a durable fact
# about the VIDEO (captions disabled, video gone, age-restricted...) is written
# to video_transcripts.error as a no-caption verdict. RequestBlocked/IpBlocked
# and network failures are facts about the RUNNER (GitHub-hosted IPs are widely
# blocked by YouTube) -- those write NOTHING and are retried next run. Rows
# whose stored error is a transient class are also retried, which self-heals
# any blocked rows recorded before this distinction existed.
#
# PROXY. GitHub Actions egress IPs are datacenter IPs YouTube blocks. Set ONE of
# these repo secrets to fetch through a residential proxy, or run
# load-transcripts.py from the NAS (residential IP) instead:
#   WEBSHARE_PROXY_USERNAME + WEBSHARE_PROXY_PASSWORD  (rotating residential)
#   YT_PROXY_URL  (any http(s) proxy URL, credentials inline)
#
# Requires: pip install youtube-transcript-api psycopg2-binary
# Env:      DATABASE_URL  (set from secrets.SUPABASE_DB_URL in the workflow)
#           YT_PROXY_URL / WEBSHARE_PROXY_USERNAME / WEBSHARE_PROXY_PASSWORD
# =============================================================================
import argparse
import os
import re
import sys
import time
import urllib.request

COLG_CHANNEL_ID = "UC821pJh7YR5llBNnWUJj-ZA"
CHANNEL_RSS = "https://www.youtube.com/feeds/videos.xml?channel_id={}"

# Exception class names that are durable verdicts about the video itself
# (verified against youtube-transcript-api's _errors module). Everything else
# -- RequestBlocked, IpBlocked, YouTubeRequestFailed, PoTokenRequired, plain
# network errors -- is environmental: retry next run, never record as resolved.
VERDICT_ERRORS = (
    "TranscriptsDisabled", "NoTranscriptFound", "VideoUnavailable",
    "InvalidVideoId", "AgeRestricted", "VideoUnplayable",
    "NotTranslatable", "TranslationLanguageNotAvailable",
)


def is_verdict(err):
    """True when a stored/new error string is a durable no-caption verdict."""
    return bool(err) and err.split(":", 1)[0].strip() in VERDICT_ERRORS


def log(msg):
    print(msg, flush=True)


# --- DB helpers (psycopg2, direct connection -- bypasses RLS) ----------------

def connect(db_url):
    try:
        import psycopg2
    except ImportError:
        log("ERROR: pip install psycopg2-binary")
        sys.exit(2)
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    return conn


def resolve_instance(cur, slug):
    cur.execute("SELECT id FROM instances WHERE slug = %s", (slug,))
    row = cur.fetchone()
    if not row:
        log(f"ERROR: no instance with slug '{slug}'")
        sys.exit(2)
    return str(row[0])


# --- Phase 1: channel sync ---------------------------------------------------

def fetch_channel_rss(channel_id):
    """Return list of {video_id, title, published} from YouTube RSS (latest ~15)."""
    url = CHANNEL_RSS.format(channel_id)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        data = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
    except Exception as e:
        log(f"  RSS fetch error: {e}")
        return []
    entries = []
    for entry in re.findall(r"<entry>(.*?)</entry>", data, re.DOTALL):
        vid = re.search(r"<yt:videoId>([^<]+)</yt:videoId>", entry)
        title = re.search(r"<title>([^<]+)</title>", entry)
        published = re.search(r"<published>([^<]+)</published>", entry)
        if vid:
            entries.append({
                "video_id": vid.group(1).strip(),
                "title": title.group(1).strip() if title else None,
                "published": published.group(1).strip()[:10] if published else None,
            })
    return entries


def _service_type_from_title(title, published_date):
    """Heuristic: 'wednesday' or 'sunday' from title keywords or upload day."""
    if title:
        t = title.lower()
        if any(w in t for w in ["wednesday", "bible study", "wed", " w b"]):
            return "wednesday"
        if "rehearsal" in t or "choir" in t:
            return "rehearsal"
        if any(w in t for w in ["sunday", "sun service"]):
            return "sunday"
    if published_date:
        try:
            from datetime import date
            d = date.fromisoformat(published_date[:10])
            return "wednesday" if d.weekday() == 2 else "sunday"
        except Exception:
            pass
    return "sunday"


def sync_channel(cur, instance_id, channel_id, dry_run):
    """Phase 1: fetch RSS, insert new choir_sermons rows. Returns count added."""
    log(f"\n[Phase 1] Syncing channel {channel_id} -> choir_sermons ...")
    entries = fetch_channel_rss(channel_id)
    if not entries:
        log("  No entries from RSS feed.")
        return 0

    # Which video_ids are already in choir_sermons?
    cur.execute("SELECT video_id FROM choir_sermons WHERE instance_id = %s AND video_id IS NOT NULL",
                (instance_id,))
    known = {r[0] for r in cur.fetchall()}
    log(f"  Channel RSS returned {len(entries)} videos; {len(known)} already in choir_sermons.")

    added = 0
    for e in entries:
        vid = e["video_id"]
        if vid in known:
            continue
        service_type = _service_type_from_title(e["title"], e["published"])
        yt_url = f"https://www.youtube.com/watch?v={vid}"
        log(f"  NEW: {vid} ({e['published']}) {service_type!r} -- {(e['title'] or '')[:60]}")
        if not dry_run:
            cur.execute("""
                INSERT INTO choir_sermons
                  (instance_id, video_id, youtube_url, service_date, service_type,
                   title, speaker, source)
                VALUES (%s, %s, %s, %s, %s, %s, NULL, 'youtube')
                ON CONFLICT (instance_id, video_id) WHERE video_id IS NOT NULL DO NOTHING
            """, (instance_id, vid, yt_url, e["published"], service_type, e["title"]))
        added += 1

    log(f"  Phase 1 done: {added} new videos added to choir_sermons.")
    return added


# --- Phase 2: transcript backfill --------------------------------------------

def fetch_caption(api, vid):
    """Return (text, words, error). text='' when captions are unavailable."""
    try:
        segs = list(api.fetch(vid, languages=["en"]))
        text = " ".join(s.text.replace("\n", " ").strip() for s in segs if s.text.strip())
        if not text:  # fetch succeeded but the track is empty: a durable verdict
            return "", 0, "NoTranscriptFound: empty caption track"
        return text, len(text.split()), None
    except Exception as e:  # classified verdict-vs-transient by caller
        return "", 0, f"{type(e).__name__}: {str(e)[:180]}"


def build_api(YouTubeTranscriptApi):
    """YouTubeTranscriptApi, routed through a residential proxy when configured."""
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


def existing_transcript_state(cur, instance_id):
    """Return {video_id: {has_text, has_verdict}} for rows already in video_transcripts.

    has_verdict is True only for durable no-caption verdicts (VERDICT_ERRORS).
    A row holding a transient error (RequestBlocked etc., recorded before the
    verdict/transient split) reads as neither -> it gets retried this run.
    """
    cur.execute("""
        SELECT video_id, words, error FROM video_transcripts
        WHERE instance_id = %s
    """, (instance_id,))
    return {r[0]: {"has_text": (r[1] or 0) > 0, "has_verdict": is_verdict(r[2])}
            for r in cur.fetchall()}


def backfill_transcripts(cur, instance_id, api, max_videos, refetch, dry_run, ids_override):
    """Phase 2: fetch captions and upsert into video_transcripts."""
    log("\n[Phase 2] Transcript backfill ...")

    # Ordered worklist: explicit ids or full corpus newest-first.
    if ids_override:
        video_ids = [v.strip() for v in ids_override.split(",") if v.strip()]
    else:
        cur.execute("""
            SELECT video_id FROM choir_sermons
            WHERE instance_id = %s AND video_id IS NOT NULL
            ORDER BY service_date DESC NULLS LAST
        """, (instance_id,))
        video_ids = [r[0] for r in cur.fetchall()]

    log(f"  Corpus size: {len(video_ids)} videos")

    state = existing_transcript_state(cur, instance_id)
    already = sum(1 for v in state.values() if v["has_text"])
    log(f"  Already transcribed: {already}  Confirmed no-caption verdicts: {sum(1 for v in state.values() if v['has_verdict'])}")

    fetched = no_caption = blocked = skipped = 0

    for i, vid in enumerate(video_ids, 1):
        prior = state.get(vid)
        if prior and not refetch and (prior["has_text"] or prior["has_verdict"]):
            skipped += 1
            continue
        if max_videos and (fetched + no_caption + blocked) >= max_videos:
            log(f"  --max {max_videos} reached; stopping (re-run to continue).")
            break

        log(f"  [{i}/{len(video_ids)}] {vid} ...")
        text, words, err = fetch_caption(api, vid)

        if text:
            log(f"    ok  {words} words -> video_transcripts")
            fetched += 1
        elif is_verdict(err):
            log(f"    MISS ({err}) -> verdict recorded; Whisper-on-NAS fallback")
            no_caption += 1
        else:
            # Environmental failure (IP block, network). NOT a fact about the
            # video: write nothing so the next run retries it.
            log(f"    BLOCKED ({err}) -> not recorded; will retry next run")
            blocked += 1
            time.sleep(0.3)
            continue

        if not dry_run:
            # Guarded upsert: an empty fetch (verdict) never overwrites a row
            # that already holds real text.
            cur.execute("""
                INSERT INTO video_transcripts
                  (instance_id, video_id, text, words, source, lang, error, fetched_at)
                VALUES (%s, %s, %s, %s, 'youtube-asr', %s, %s, now())
                ON CONFLICT (instance_id, video_id) DO UPDATE SET
                  text       = EXCLUDED.text,
                  words      = EXCLUDED.words,
                  source     = EXCLUDED.source,
                  lang       = EXCLUDED.lang,
                  error      = EXCLUDED.error,
                  fetched_at = EXCLUDED.fetched_at
                WHERE video_transcripts.words = 0 OR EXCLUDED.words > 0
            """, (instance_id, vid, text, words, "en" if text else None, err))

        time.sleep(0.3)  # gentle rate-limit on YouTube's transcript API

    return video_ids, fetched, no_caption, blocked, skipped


# --- main --------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(
        description="Phase 1: sync new @thelovecorner uploads to choir_sermons. "
                    "Phase 2: backfill YouTube auto-captions into video_transcripts.")
    ap.add_argument("--slug", default="colg")
    ap.add_argument("--channel", default=COLG_CHANNEL_ID,
                    help="YouTube channel ID for Phase 1 RSS sync")
    ap.add_argument("--skip-channel-sync", action="store_true",
                    help="Skip Phase 1 (transcript backfill only)")
    ap.add_argument("--max", type=int, default=50,
                    help="Cap videos fetched THIS run (budget brake; 0=no cap)")
    ap.add_argument("--refetch", action="store_true",
                    help="Re-fetch even videos already in video_transcripts")
    ap.add_argument("--ids", help="Comma-separated video IDs to process (skips full corpus)")
    ap.add_argument("--dry-run", action="store_true",
                    help="Fetch and report but write nothing to the DB")
    args = ap.parse_args()

    db_url = (os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL") or "").strip()
    if not db_url:
        log("ERROR: set DATABASE_URL (or SUPABASE_DB_URL) to the Supabase session-pooler URL.")
        sys.exit(2)

    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        log("ERROR: pip install youtube-transcript-api")
        sys.exit(2)

    conn = connect(db_url)
    cur = conn.cursor()

    instance_id = resolve_instance(cur, args.slug)
    log(f"Instance: {instance_id} ({args.slug})")
    if args.dry_run:
        log("DRY RUN -- nothing will be written to the DB.")

    # Phase 1: channel sync
    if not args.skip_channel_sync and not args.ids:
        sync_channel(cur, instance_id, args.channel, args.dry_run)

    # Phase 2: transcript backfill
    api = build_api(YouTubeTranscriptApi)
    video_ids, fetched, no_caption, blocked, skipped = backfill_transcripts(
        cur, instance_id, api, args.max, args.refetch, args.dry_run, args.ids)

    # Final coverage report. Split stored errors into durable verdicts vs
    # transient leftovers (pre-split RequestBlocked rows) awaiting retry.
    if not args.dry_run:
        cur.execute("""
            SELECT
              COUNT(*) FILTER (WHERE words > 0) AS with_text,
              COUNT(*) FILTER (WHERE words = 0 AND error IS NOT NULL
                               AND split_part(error, ':', 1) = ANY(%s)) AS with_verdict,
              COUNT(*) FILTER (WHERE words = 0 AND error IS NOT NULL
                               AND NOT (split_part(error, ':', 1) = ANY(%s))) AS with_transient
            FROM video_transcripts WHERE instance_id = %s
        """, (list(VERDICT_ERRORS), list(VERDICT_ERRORS), instance_id))
        row = cur.fetchone()
        with_text, with_verdict, with_transient = (row[0] or 0), (row[1] or 0), (row[2] or 0)
    else:
        with_text = with_verdict = with_transient = 0

    cur.close()
    conn.close()

    total = len(video_ids)
    gaps = total - with_text
    log("")
    log(f"This run  : {fetched} fetched, {no_caption} no-caption verdicts, "
        f"{blocked} blocked (will retry), {skipped} already resolved.")
    log(f"Coverage  : {with_text}/{total} videos transcribed  |  {with_verdict} confirmed no-captions  |  "
        f"{with_transient} stale transient rows pending retry  |  {gaps} gaps remaining")
    if fetched > 0:
        log("Done. The served Harvest ledger derives transcripts LIVE -- the % climbs now.")

    # A green check must mean transcripts moved (DR-0076). All-blocked = red.
    if blocked > 0 and fetched == 0:
        log(f"BLOCKED: all {blocked} attempts were rejected (YouTube blocks this runner's IP).")
        log("Fix: set WEBSHARE_PROXY_USERNAME/WEBSHARE_PROXY_PASSWORD or YT_PROXY_URL as repo")
        log("secrets (residential proxy), or run load-transcripts.py from the NAS (residential IP).")
        sys.exit(3)
    if fetched == 0 and no_caption == 0 and gaps > 0 and not args.refetch:
        log("STALL: 0 videos advanced while gaps remain. Check credentials / caption availability.")
        sys.exit(3)


if __name__ == "__main__":
    main()
