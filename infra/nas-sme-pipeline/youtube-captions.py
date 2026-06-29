#!/usr/bin/env python3
# =============================================================================
# youtube-captions.py — source the service transcript from YouTube auto-captions.
# =============================================================================
# THE UNBLOCK (Darrell 2026-06-29): the Harvest % stalled ~22% because the
# transcript-derived harvests (lessons / discernment / testimony / trivia) were
# gated on a Whisper-on-NAS (GPU) run that never happened. But YouTube
# AUTO-GENERATES captions for every @thelovecorner service video — that IS the
# transcript, already produced, no GPU. This script pulls those captions per video
# and writes a transcripts.json the loader feeds to the harvest extractors.
#
# Whisper-on-NAS (transcribe.py) is now only the FALLBACK for a video that has no
# captions at all (rare). Videos with no captions are recorded as such so they are
# surfaced for the fallback and not retried forever.
#
# CONSISTENCY (the other half of Darrell's complaint — "stuck / stalled partway"):
#   * INCREMENTAL  — videos already in the output are skipped (unless --refetch).
#   * RESUMABLE    — output is merged + written after EACH video, so a crash keeps
#                    everything fetched so far; re-running picks up where it left off.
#   * IDEMPOTENT   — re-running yields the same output; no duplicates.
#   * BOUNDED      — --max caps videos per run (a budget brake); a no-caption video
#                    is marked and skipped next time, so a run always advances.
# THREE BRAKES (CLAUDE.md): manual-run only — no cron, no watcher, no autostart.
#
# Requires: pip install youtube-transcript-api
#
# Usage:
#   python youtube-captions.py --channel UC821pJh7YR5llBNnWUJj-ZA --max 25
#   python youtube-captions.py --ids BQC4nYa33vo,xsjO93qBw5I
#   python youtube-captions.py --ids-file ../../scripts/out/choir-sermons-backfill.json
#   (default output: ./out/transcripts.json — point the loader at it)
# =============================================================================
import argparse
import json
import os
import re
import sys
import urllib.request

CHANNEL_RSS = "https://www.youtube.com/feeds/videos.xml?channel_id={}"


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def channel_video_ids(channel_id):
    """Recent uploads from the channel RSS (no API key needed)."""
    url = CHANNEL_RSS.format(channel_id)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    data = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")
    return re.findall(r"<yt:videoId>([^<]+)</yt:videoId>", data)


def ids_from_file(path):
    """Pull video ids from a JSON array of {videoId|video_id} or a plain id-per-line file."""
    with open(path, "r", encoding="utf-8") as fh:
        raw = fh.read()
    try:
        arr = json.loads(raw)
        out = []
        for r in arr:
            vid = r.get("videoId") or r.get("video_id") if isinstance(r, dict) else r
            if vid:
                out.append(vid)
        return out
    except json.JSONDecodeError:
        return [ln.strip() for ln in raw.splitlines() if ln.strip()]


def fetch_one(api, vid):
    """Return (text, error). text is '' when captions are unavailable."""
    try:
        segs = list(api.fetch(vid, languages=["en"]))
        text = " ".join(s.text.replace("\n", " ").strip() for s in segs if s.text.strip())
        return text, None
    except Exception as e:  # noqa: BLE001 — any failure = no usable caption; record it
        return "", f"{type(e).__name__}: {str(e)[:160]}"


def main():
    ap = argparse.ArgumentParser(description="Source service transcripts from YouTube auto-captions.")
    ap.add_argument("--channel", help="YouTube channel_id (UC...) — fetch recent uploads via RSS")
    ap.add_argument("--ids", help="comma-separated video ids")
    ap.add_argument("--ids-file", help="JSON array (videoId/video_id) or id-per-line file")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "out", "transcripts.json"))
    ap.add_argument("--max", type=int, default=0, help="cap videos fetched THIS run (0 = no cap)")
    ap.add_argument("--refetch", action="store_true", help="re-fetch ids already present")
    args = ap.parse_args()

    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        log("ERROR: pip install youtube-transcript-api")
        sys.exit(2)

    ids = []
    if args.ids:
        ids += [s.strip() for s in args.ids.split(",") if s.strip()]
    if args.ids_file:
        ids += ids_from_file(args.ids_file)
    if args.channel:
        ids += channel_video_ids(args.channel)
    # de-dup, keep order
    seen, ordered = set(), []
    for v in ids:
        if v not in seen:
            seen.add(v)
            ordered.append(v)
    if not ordered:
        log("No video ids. Pass --channel, --ids, or --ids-file.")
        sys.exit(1)

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    existing = {}
    if os.path.exists(args.out):
        try:
            existing = json.load(open(args.out, "r", encoding="utf-8"))
        except json.JSONDecodeError:
            existing = {}

    api = YouTubeTranscriptApi()
    fetched = skipped = no_caption = 0
    for vid in ordered:
        prior = existing.get(vid)
        # INCREMENTAL: skip ids we already have text OR a recorded no-caption verdict.
        if prior and not args.refetch and (prior.get("text") or prior.get("error")):
            skipped += 1
            continue
        if args.max and fetched + no_caption >= args.max:
            log(f"--max {args.max} reached; stopping (re-run to continue).")
            break
        text, err = fetch_one(api, vid)
        if text:
            existing[vid] = {"text": text, "source": "youtube-asr", "lang": "en", "words": len(text.split())}
            fetched += 1
            log(f"  ok   {vid}  {len(text.split())} words")
        else:
            existing[vid] = {"text": "", "error": err or "no-captions", "source": "youtube-asr"}
            no_caption += 1
            log(f"  MISS {vid}  ({err}) -> Whisper-on-NAS fallback")
        # RESUMABLE: persist after every video.
        json.dump(existing, open(args.out, "w", encoding="utf-8"), ensure_ascii=False)

    with_text = sum(1 for v in existing.values() if v.get("text"))
    log("")
    log(f"Done. This run: {fetched} fetched, {no_caption} no-caption, {skipped} already had.")
    log(f"Corpus now: {with_text} transcripts on disk ({args.out}).")
    log("Next: node scripts/harvest-from-transcripts.mjs " + args.out)


if __name__ == "__main__":
    main()
