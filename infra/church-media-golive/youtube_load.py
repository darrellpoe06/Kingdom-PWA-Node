#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""youtube_load — archive the channel's livestreams into The Word's library.

THE MISSING STEP (2026-07-14). The latest livestreams show in Church -> Worship
(that surface embeds the CHANNEL directly, so it needs no database), but they
were NOT landing in The Word section: The Word reads `choir_sermons`, and nothing
was writing the channel's videos into it unless the in-app importer ran with a
YouTube API key. youtube_index.py lists the uploads but only fed the whisper
queue; it never wrote the archive. This is that loader: the youtube index ->
one message row per video -> upsert into `choir_sermons`, so every past stream
becomes watchable history in The Word.

Sibling of proclaim_load.py (that loads BG's emailed outlines into
choir_sermons + sermon_prep; this loads the VIDEOS into choir_sermons). Same
tables, same Way. Precedence is preserved: an email/prep row is ground truth
(source='email'), so this loader NEVER overwrites a title/scripture on a row
that already came from email — it only fills the youtube_url + fields that are
still empty. A brand-new video with no email becomes its own draft row.

DATE, ALWAYS (Darrell 2026-07-14, "add dates etc to each video so users know"):
service_date comes from the TITLE first (BG dates his titles), else the video's
UPLOAD date (youtube_index.py's `published`). A video with no date ANYWHERE is
reported and skipped, never guessed. service_type is classified from the TITLE
(funeral / conference / wednesday / sunday) — mirrors app/src/lib/service-day.js
so the off-cycle conference + funeral streams land under the right label.

THE WAY (DR-0083, like proclaim_load.py / load-transcripts.py):
  - Plain Python 3, stdlib only. No n8n, no UI.
  - DRY-RUN BY DEFAULT — prints what it would write; --commit to actually write.
  - Idempotent — keyed by youtube video id (then instance); a re-run updates in
    place, never duplicates.
  - Multi-tenant — resolves the church instance by --slug (default 'colg').
  - Ships INERT — nothing schedules it; the nas-loops runner owns the three
    brakes (budget / single-instance lock / kill-switch) when it is armed.
  - Run-state emitted to events.jsonl beside the script.

Secrets (first found wins): env SUPABASE_URL + SUPABASE_SERVICE_KEY, else a JSON
file at --secrets (default /volume1/PoeTech/secrets/supabase.json) shaped
    { "url": "https://xxxx.supabase.co", "service_key": "eyJ..." }

Usage (on the NAS / tower):
  python3 youtube_index.py <channel-url> --out yt-index.json     # step 1: list
  python3 youtube_load.py yt-index.json                          # dry-run report
  python3 youtube_load.py yt-index.json --commit                 # write
  python3 youtube_load.py yt-index.json --slug colg --commit
"""
import argparse
import html
import json
import os
import re
import sys
import urllib.request
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

RUN_EVENTS = Path(__file__).with_name("events.jsonl")
DEFAULT_SECRETS = "/volume1/PoeTech/secrets/supabase.json"

# --- pure title parsing (unit-tested; no network) -----------------------------
# ONE rule with the app: mirrors app/src/lib/youtube-title-parse.js
# (parseServiceTitle) + app/src/lib/service-day.js (classifyServiceType), so a
# video classifies IDENTICALLY whether the in-app importer or this NAS loader
# writes it.

FUNERAL_RE = re.compile(
    r"\b(funeral|home[\s-]?going|homegoing|celebration of life|memorial service|"
    r"in loving memory|going home celebration|repast)\b", re.I)
CONFERENCE_RE = re.compile(
    r"\b(conference|convocation|holy convocation|assembly|convention|congress|"
    r"summit|conclave)\b", re.I)
WEDNESDAY_RE = re.compile(r"wednesday|bible\s*study", re.I)
# Dash/slash date anywhere ('6 -10 - 2026', '3/5/2025', '1- 7 -26').
DATE_SEP_RE = re.compile(r"(\d{1,2})\s*[-/]\s*(\d{1,2})\s*[-/]\s*(\d{2,4})")
# Space-separated date at the START ('3 26 25 Bishop...').
DATE_SPACE_RE = re.compile(r"^\s*(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})\b")
QUOTE_RE = re.compile(r"[“\"]\s*([^“”\"]+?)\s*[”\"]")
SPEAKER_RE = re.compile(r"Bishop[^\"“]*?Gwin", re.I)


def classify_service_type(title):
    t = str(title or "")
    if FUNERAL_RE.search(t):
        return "funeral"
    if CONFERENCE_RE.search(t):
        return "conference"
    if WEDNESDAY_RE.search(t):
        return "wednesday"
    return "sunday"


def parse_service_title(raw):
    """rawTitle -> {service_date, service_type, title, speaker}. Pure."""
    title = html.unescape(str(raw or ""))
    dm = DATE_SEP_RE.search(title) or DATE_SPACE_RE.search(title)
    service_date = None
    if dm:
        mo, day, yr = int(dm.group(1)), int(dm.group(2)), int(dm.group(3))
        if yr < 100:
            yr += 2000
        if 1 <= mo <= 12 and 1 <= day <= 31:
            service_date = f"{yr:04d}-{mo:02d}-{day:02d}"
    qm = QUOTE_RE.search(title)
    message_title = qm.group(1).strip() if qm else None
    sm = SPEAKER_RE.search(title)
    speaker = re.sub(r"\s+", " ", sm.group(0)).strip() if sm else None
    return {"service_date": service_date, "service_type": classify_service_type(title),
            "title": message_title, "speaker": speaker}


def video_to_row(video, instance_id):
    """One youtube-index entry -> a choir_sermons row (id minted on write), or
    None if it has no date anywhere (reported by the caller). `published` is the
    upload-date fallback youtube_index.py captured."""
    vid = video.get("id")
    if not vid:
        return None
    raw_title = video.get("title") or ""
    p = parse_service_title(raw_title)
    upload = video.get("published")
    upload = upload if (isinstance(upload, str) and re.match(r"^\d{4}-\d{2}-\d{2}", upload)) else None
    service_date = p["service_date"] or upload
    if not service_date:
        return None
    # A readable title even when the video has no quoted message title: fall back
    # to the cleaned raw title so the card never shows a blank.
    title = p["title"] or html.unescape(raw_title).strip() or None
    return {
        "instance_id": instance_id,
        "video_id": vid,
        "youtube_url": f"https://www.youtube.com/watch?v={vid}",
        "title": title,
        "speaker": p["speaker"],
        "service_date": service_date,
        "service_type": p["service_type"],
        "source": "youtube",
        "status": "active",
    }


# --- Supabase REST (service key; mirrors proclaim_load.py) ---------------------

def load_secrets(path):
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if url and key:
        return url.rstrip("/"), key
    try:
        d = json.loads(Path(path).read_text())
        return d["url"].rstrip("/"), (d.get("service_key") or d.get("service_role_key"))
    except Exception:
        return None, None


def _req(url, key, method, path, params=None, body=None):
    q = ("?" + urllib.parse.urlencode(params)) if params else ""
    headers = {"apikey": key, "Authorization": f"Bearer {key}",
               "Content-Type": "application/json", "Prefer": "return=representation"}
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url + "/rest/v1/" + path + q, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read().decode()
        return json.loads(raw) if raw else []


def resolve_instance(url, key, slug):
    rows = _req(url, key, "GET", "instances", params={"slug": f"eq.{slug}", "select": "id"})
    return rows[0]["id"] if rows else None


# Fields this loader owns on a video row. On a row that already exists from EMAIL
# (BG's authored outline, ground truth), we NEVER overwrite the human title /
# speaker / scripture — we only attach the video (url + id) and fill blanks.
def _merge_for_existing(row, existing):
    src = (existing.get("source") or "").lower()
    if src == "email":
        patch = {"video_id": row["video_id"], "youtube_url": row["youtube_url"]}
        for k in ("speaker", "service_type"):
            if not existing.get(k) and row.get(k):
                patch[k] = row[k]
        return patch
    # A youtube/transcript row is ours to refresh in place.
    return row


def upsert_video(url, key, row):
    """Idempotent by (instance_id, video_id): update else insert; returns (id, action)."""
    found = _req(url, key, "GET", "choir_sermons",
                 params={"instance_id": f"eq.{row['instance_id']}",
                         "video_id": f"eq.{row['video_id']}", "select": "id,source,speaker,service_type"})
    if found:
        sid = found[0]["id"]
        patch = _merge_for_existing(row, found[0])
        _req(url, key, "PATCH", "choir_sermons", params={"id": f"eq.{sid}"}, body=patch)
        return sid, ("kept-email" if (found[0].get("source") or "").lower() == "email" else "updated")
    ins = _req(url, key, "POST", "choir_sermons", body=row)
    return ins[0]["id"], "inserted"


def emit(ok, processed, note):
    with RUN_EVENTS.open("a") as ev:
        ev.write(json.dumps({"at": datetime.now(timezone.utc).isoformat(),
                             "script": "youtube_load", "ok": ok,
                             "processed": processed, "note": note}) + "\n")


def main():
    ap = argparse.ArgumentParser(description="Archive the channel's videos into choir_sermons (The Word).")
    ap.add_argument("index", help="yt-index.json produced by youtube_index.py")
    ap.add_argument("--slug", default="colg", help="church instance slug (default: colg)")
    ap.add_argument("--secrets", default=DEFAULT_SECRETS)
    ap.add_argument("--commit", action="store_true", help="actually write (default: dry-run report only)")
    ap.add_argument("--limit", type=int, default=0, help="cap videos (0 = all)")
    args = ap.parse_args()

    try:
        doc = json.loads(Path(args.index).read_text())
    except Exception as e:
        print(f"ERROR: cannot read index {args.index}: {e}", file=sys.stderr)
        return 2
    videos = doc.get("videos") or []
    if args.limit:
        videos = videos[: args.limit]

    url = key = instance_id = None
    if args.commit:
        url, key = load_secrets(args.secrets)
        if not url or not key:
            print("ERROR: no Supabase credentials (SUPABASE_URL + SUPABASE_SERVICE_KEY or --secrets).", file=sys.stderr)
            return 2
        instance_id = resolve_instance(url, key, args.slug)
        if not instance_id:
            print(f"ERROR: no instance with slug '{args.slug}'.", file=sys.stderr)
            return 2

    written = skipped = 0
    for v in videos:
        row = video_to_row(v, instance_id or f"<{args.slug}>")
        if not row:
            skipped += 1
            print(f"  SKIP (no date anywhere): {v.get('id')} {v.get('title')}")
            continue
        label = f"{row['service_date']} · {row['service_type']} · {row['title']} [{row['video_id']}]"
        if not args.commit:
            print(f"  would archive: {label}")
            written += 1
            continue
        _sid, action = upsert_video(url, key, row)
        print(f"  {action}: {label}")
        written += 1

    note = f"{'committed' if args.commit else 'dry-run'} slug={args.slug} archived={written} skipped={skipped}"
    print(note)
    if args.commit:
        emit(True, written, note)
    return 0


if __name__ == "__main__":
    sys.exit(main())
