#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""prep_from_transcript — points + scriptures for EVERY message, not just the ones
BG emailed (Darrell 2026-07-14).

THE LAST STEP OF THE LOOP. Today a message shows its numbered points + scriptures
ONLY when BG emailed a PROCLAIM .docx for it (proclaim_load.py -> sermon_prep,
source='email'). The conference streams, the guest preachers (Pastor Ken McCray),
and any Sunday without an email show a DATE but no points. Darrell's rule for
filling them:

    "Points and Scriptures for each video either from documents and or
     transcription -- after checking for YouTube's transcriptions already,
     then 2 or 3 or 4 days later then we do it with Ari."

So the sourcing ORDER, top wins, is:
  1. DOCUMENT  — BG's emailed PROCLAIM outline. Ground truth. (proclaim_load.py)
  2. TRANSCRIPT— YouTube's OWN auto-captions first (youtube-captions.py / load-
     transcripts.py, NO GPU); Whisper-on-GPU only for a video with no captions.
  3. ARI       — days later, for a message STILL without an email outline, derive
     BG-style numbered points from that transcript. A DRAFT (needs_review=true),
     never overwriting the email row.

THIS SCRIPT is step 3's loader. For each choir_sermon that (a) has a transcript,
(b) has NO email-sourced sermon_prep, and (c) is at least --min-age-days old (the
"2/3/4 days later" wait, so a late email still wins), it writes a sermon_prep row:
  - scriptures[]  -- extracted DETERMINISTICALLY from the transcript (find_refs),
                     so every verse the message cites lands even with no model.
  - points[]      -- BG-style numbered outline, derived by ARI. This is the ONE
                     model step: it POSTs the transcript to the Ari points endpoint
                     (env ARI_POINTS_URL / ARI_POINTS_KEY, e.g. the church GPU
                     node). NOT configured -> points stay [] and the row is a
                     scriptures-only draft. The script NEVER fabricates points.
  - source='transcript', needs_review=true  -- a DRAFT · VERIFY row. Precedence
    (sermon-points.js: prep-email > harvest > transcript) means it NEVER outranks
    or overwrites BG's own email outline; if an email arrives later, proclaim_load
    upserts source='email' over it.

THE WAY (DR-0083, like proclaim_load.py / youtube_load.py):
  - Plain Python 3, stdlib only. No n8n, no UI.
  - DRY-RUN BY DEFAULT — prints what it would write; --commit to write.
  - Idempotent — one prep row per (instance, sermon); a re-run refreshes the
    transcript row in place, never duplicates, never touches an email row.
  - Multi-tenant — resolves the church instance by --slug (default 'colg').
  - Ships INERT — nothing schedules it; the nas-loops runner owns the three brakes
    (budget / single-instance lock / kill-switch) when it is armed. The Ari step is
    Tier C (model-generated content) and stays off until a human arms it.
  - Run-state emitted to events.jsonl beside the script.

Secrets (first found wins): env SUPABASE_URL + SUPABASE_SERVICE_KEY, else a JSON
file at --secrets (default /volume1/PoeTech/secrets/supabase.json) shaped
    { "url": "https://xxxx.supabase.co", "service_key": "eyJ..." }

Usage (on the NAS / tower):
  python3 prep_from_transcript.py                        # dry-run report (all eligible)
  python3 prep_from_transcript.py --commit               # write scriptures-only drafts
  ARI_POINTS_URL=http://gpu:8100/points python3 prep_from_transcript.py --commit
  python3 prep_from_transcript.py --min-age-days 4 --slug colg --commit
"""
import argparse
import json
import os
import re
import sys
import urllib.request
import urllib.parse
from datetime import datetime, timezone, date
from pathlib import Path

RUN_EVENTS = Path(__file__).with_name("events.jsonl")
DEFAULT_SECRETS = "/volume1/PoeTech/secrets/supabase.json"
DEFAULT_MIN_AGE_DAYS = 3  # the "2 or 3 or 4 days later" wait; a late email still wins

# --- pure logic (unit-tested; no network) -------------------------------------

# BG writes refs "MATTHEW 5.13-16 NIV" / "1 JOHN 4.8"; captions say "Matthew 5:14".
# Same matcher family as proclaim_load.find_refs, plus a spoken/caption form
# ("first John four eight" is NOT matched — we only take written chapter:verse, so
# a scripture is EVIDENCE-BACKED, never guessed from speech; DR-0076).
REF_RE = re.compile(
    r"\b([1-3]\s+)?([A-Z][A-Za-z]+)\s+(\d{1,3})[.:](\d{1,3}(?:-\d{1,3})?)"
    r"(?:\s+(NIV|NKJV|KJV|ESV|NLT|AMP|NASB|NRSV|MSG|CEV))?\b"
)


def find_refs(text):
    """Every written scripture ref in `text`, normalized 'BOOK CH:VS', in order,
    de-duplicated. Each literally appears in the transcript (DR-0076)."""
    out = []
    for m in REF_RE.finditer(text or ""):
        book = (m.group(1) or "") + m.group(2)
        ref = f"{book.strip()} {m.group(3)}:{m.group(4)}"
        if ref not in out:
            out.append(ref)
    return out


def _age_days(service_date, today):
    """Whole days between a 'YYYY-MM-DD' service_date and `today` (a date). None if
    the date is missing/bad — an undated row is NOT eligible (we can't age-gate it)."""
    if not service_date:
        return None
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", str(service_date))
    if not m:
        return None
    try:
        d = date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    except ValueError:
        return None
    return (today - d).days


def is_eligible(sermon, existing_prep, has_transcript, today, min_age_days):
    """Should Ari draft points for this message? True only when ALL hold:
      - it has a transcript to derive from,
      - it has NO email-sourced prep (BG's own outline wins and is never touched),
      - it is at least `min_age_days` old (the wait, so a late email still wins).
    A transcript/manual prep may be refreshed; an email prep is a hard stop."""
    if not has_transcript:
        return False
    if existing_prep and (existing_prep.get("source") or "").lower() == "email":
        return False
    age = _age_days(sermon.get("service_date"), today)
    if age is None or age < min_age_days:
        return False
    return True


def build_prep(sermon_id, instance_id, transcript_text, theme, points):
    """The sermon_prep row for a transcript-derived draft. `points` come from Ari
    (may be [] when the endpoint isn't configured — a scriptures-only draft).
    scriptures are extracted deterministically from the transcript."""
    scriptures = find_refs(transcript_text)
    # roll each point's own refs into the surface feed too, order-preserving.
    for p in points or []:
        for r in p.get("scriptures", []) or []:
            if r not in scriptures:
                scriptures.append(r)
    excerpt = (transcript_text or "")[:4000]  # provenance without storing the whole track
    return {
        "instance_id": instance_id,
        "sermon_id": sermon_id,
        "theme": theme or None,
        "raw_text": excerpt,
        "points": points or [],
        "scriptures": scriptures,
        "source": "transcript",
        "source_ref": "youtube-captions",
        "needs_review": True,
    }


# --- Ari points step (the ONE model call; inert until configured) -------------

def derive_points_via_ari(transcript_text, theme, url, key, timeout=120):
    """POST the transcript to the Ari points endpoint (the church GPU node's
    BG-style outliner) and return [{n,text,scriptures:[],subpoints:[...]}].
    Returns [] when the endpoint is not configured OR on any error — the loader
    then writes a scriptures-only draft. NEVER fabricates points locally."""
    if not url:
        return []
    body = json.dumps({"transcript": transcript_text, "theme": theme, "style": "bg"}).encode()
    headers = {"Content-Type": "application/json"}
    if key:
        headers["Authorization"] = f"Bearer {key}"
    try:
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = json.loads(r.read().decode() or "{}")
        pts = data.get("points") if isinstance(data, dict) else None
        return pts if isinstance(pts, list) else []
    except Exception as e:  # endpoint down / bad response -> scriptures-only draft
        print(f"  ::warning:: Ari points endpoint error ({e}); writing scriptures-only draft.")
        return []


# --- Supabase REST (service key; mirrors proclaim_load.py) --------------------

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


def fetch_sermons(url, key, instance_id):
    return _req(url, key, "GET", "choir_sermons",
                params={"instance_id": f"eq.{instance_id}",
                        "select": "id,video_id,title,service_date,service_type"})


def fetch_prep_by_sermon(url, key, instance_id):
    rows = _req(url, key, "GET", "sermon_prep",
                params={"instance_id": f"eq.{instance_id}", "select": "sermon_id,source"})
    return {r["sermon_id"]: r for r in rows}


def fetch_transcript_by_video(url, key, instance_id):
    rows = _req(url, key, "GET", "video_transcripts",
                params={"instance_id": f"eq.{instance_id}", "select": "video_id,text",
                        "text": "not.is.null"})
    return {r["video_id"]: (r.get("text") or "") for r in rows if r.get("video_id")}


def upsert_prep(url, key, prep):
    """Idempotent by (instance_id, sermon_id). Refreshes a transcript/manual row;
    a caller must have already excluded email rows (is_eligible does)."""
    found = _req(url, key, "GET", "sermon_prep",
                 params={"instance_id": f"eq.{prep['instance_id']}",
                         "sermon_id": f"eq.{prep['sermon_id']}", "select": "sermon_id,source"})
    if found:
        if (found[0].get("source") or "").lower() == "email":
            return "kept-email"  # belt-and-suspenders; is_eligible already excluded it
        _req(url, key, "PATCH", "sermon_prep",
             params={"instance_id": f"eq.{prep['instance_id']}", "sermon_id": f"eq.{prep['sermon_id']}"},
             body=prep)
        return "updated"
    _req(url, key, "POST", "sermon_prep", body=prep)
    return "inserted"


def emit(ok, processed, note):
    with RUN_EVENTS.open("a") as ev:
        ev.write(json.dumps({"at": datetime.now(timezone.utc).isoformat(),
                             "script": "prep_from_transcript", "ok": ok,
                             "processed": processed, "note": note}) + "\n")


def main():
    ap = argparse.ArgumentParser(description="Draft points + scriptures from the transcript for messages BG did not email (The Word).")
    ap.add_argument("--slug", default="colg", help="church instance slug (default: colg)")
    ap.add_argument("--secrets", default=DEFAULT_SECRETS)
    ap.add_argument("--commit", action="store_true", help="actually write (default: dry-run report only)")
    ap.add_argument("--min-age-days", type=int, default=DEFAULT_MIN_AGE_DAYS,
                    help="wait this many days after the service before Ari drafts (a late email still wins)")
    ap.add_argument("--today", default=None, help="override today as YYYY-MM-DD (testing/backfill)")
    ap.add_argument("--limit", type=int, default=0, help="cap messages processed (0 = all)")
    args = ap.parse_args()

    if args.today:
        m = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", args.today)
        if not m:
            print("ERROR: --today must be YYYY-MM-DD", file=sys.stderr)
            return 2
        today = date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    else:
        today = datetime.now(timezone.utc).date()

    ari_url = os.environ.get("ARI_POINTS_URL", "")
    ari_key = os.environ.get("ARI_POINTS_KEY", "")

    url, key = load_secrets(args.secrets)
    if not url or not key:
        print("ERROR: no Supabase credentials (SUPABASE_URL + SUPABASE_SERVICE_KEY or --secrets).", file=sys.stderr)
        return 2
    instance_id = resolve_instance(url, key, args.slug)
    if not instance_id:
        print(f"ERROR: no instance with slug '{args.slug}'.", file=sys.stderr)
        return 2

    sermons = fetch_sermons(url, key, instance_id)
    prep_by_sermon = fetch_prep_by_sermon(url, key, instance_id)
    transcript_by_video = fetch_transcript_by_video(url, key, instance_id)

    if not ari_url:
        print("NOTE: ARI_POINTS_URL not set — writing SCRIPTURES-ONLY drafts (no model points).")

    written = skipped = 0
    for s in sermons:
        existing = prep_by_sermon.get(s["id"])
        transcript = transcript_by_video.get(s.get("video_id") or "")
        has_transcript = bool(transcript and transcript.strip())
        if not is_eligible(s, existing, has_transcript, today, args.min_age_days):
            skipped += 1
            continue
        points = derive_points_via_ari(transcript, s.get("title"), ari_url, ari_key)
        prep = build_prep(s["id"], instance_id, transcript, s.get("title"), points)
        label = f"{s.get('service_date')} · {s.get('title')} · {len(prep['points'])} pts · {len(prep['scriptures'])} refs"
        if not args.commit:
            print(f"  would draft: {label}")
            written += 1
        else:
            action = upsert_prep(url, key, prep)
            print(f"  {action}: {label}")
            written += 1
        if args.limit and written >= args.limit:
            break

    note = (f"{'committed' if args.commit else 'dry-run'} slug={args.slug} "
            f"drafted={written} skipped={skipped} ari={'on' if ari_url else 'off'} "
            f"min_age_days={args.min_age_days}")
    print(note)
    if args.commit:
        emit(True, written, note)
    return 0


if __name__ == "__main__":
    sys.exit(main())
