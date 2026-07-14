#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""proclaim_load — load the indexed PROCLAIM archive into The Word's tables.

THE MISSING STEP (2026-07-14). gmail_ingest.py pulls BG's weekly PROCLAIM .docx
and proclaim_docx_index.py extracts each file's {date, title, scripture, preacher,
paragraphs}. Nothing then wrote those into the DB The Word reads, so the library
sat empty though the data was in the mailbox all along. This is that loader:
index/entry -> structured numbered POINTS + SCRIPTURES -> upsert into
`choir_sermons` (the message) + `sermon_prep` (his outline).

GROUND TRUTH (DR-0076): BG authored the .docx, so every row is source='email',
needs_review=false — it outranks any transcript-derived draft (precedence
prep > harvest > transcript). Points come ONLY from real numbered header lines;
a reference-only line goes to scriptures, never masquerades as a point. Anything
unparseable is REPORTED, never guessed.

THE WAY (DR-0083, like nas-finance-ingest / load-transcripts):
  - Plain Python 3, stdlib only. No n8n, no UI.
  - DRY-RUN BY DEFAULT — prints what it would write; --commit to actually write.
  - Idempotent — keyed by (instance_id, service_date, title); a re-run updates in
    place, never duplicates.
  - Multi-tenant — resolves the church instance by --slug (default 'colg'); no
    hardcoded id. Writes ONLY that instance's rows.
  - Ships INERT — nothing schedules it; the nas-loops runner owns the three brakes
    (budget / single-instance lock / kill-switch) when it is armed.
  - Run-state emitted to events.jsonl beside the script (observing never breaks it).

Secrets (first found wins): env SUPABASE_URL + SUPABASE_SERVICE_KEY, else a JSON
file at --secrets (default /volume1/PoeTech/secrets/supabase.json) shaped
    { "url": "https://xxxx.supabase.co", "service_key": "eyJ..." }

Usage (on the NAS / tower):
  python3 proclaim_load.py proclaim-index.json                 # dry-run report
  python3 proclaim_load.py proclaim-index.json --commit        # write
  python3 proclaim_load.py proclaim-index.json --slug colg --commit
"""
import argparse
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
BG_DEFAULT = "Bishop Lloyd E. Gwin"

# --- pure parsing (unit-tested; no network) ----------------------------------

# A numbered/roman point opener: "1. ", "1) ", "I. ", "II) " + a title.
POINT_RE = re.compile(r"^\s*(?:(\d{1,2})|([IVX]{1,4}))[.)]\s+(\S.*)$")
# BG writes refs "MATTHEW 5.13-16 NIV" / "1 JOHN 4.8" — book + ch(.|:)vs(-vs).
REF_RE = re.compile(
    r"\b([1-3]\s+)?([A-Z][A-Za-z]+)\s+(\d{1,3})[.:](\d{1,3}(?:-\d{1,3})?)"
    r"(?:\s+(NIV|NKJV|KJV|ESV|NLT|AMP|NASB|NRSV|MSG|CEV))?\b"
)
_ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8}


def find_refs(text):
    """Every scripture ref in `text`, normalized to 'BOOK CH:VS'. Evidence-backed:
    each literally appears in the source (DR-0076)."""
    out = []
    for m in REF_RE.finditer(text or ""):
        book = (m.group(1) or "") + m.group(2)
        out.append(f"{book.strip()} {m.group(3)}:{m.group(4)}")
    return out


def structure_points(paragraphs, limit=20):
    """Paragraphs -> BG's numbered outline [{n, text, scriptures:[refs]}], in order.
    A point's scriptures = refs in its own line + the lines until the next opener.
    Reference-only lines never count as points. Sequential numbering (1,2,3...)."""
    paras = [p.strip() for p in (paragraphs or []) if p and p.strip()]
    points = []
    cur = None
    for line in paras:
        m = POINT_RE.match(line)
        # a real opener: numbered/roman AND the title is not just a scripture ref
        title = m.group(3).strip() if m else ""
        is_opener = bool(m) and not REF_RE.match(title)
        if is_opener:
            cur = {"n": len(points) + 1, "text": title, "scriptures": find_refs(title)}
            points.append(cur)
            if len(points) >= limit:
                cur = None
        elif cur is not None:
            for r in find_refs(line):
                if r not in cur["scriptures"]:
                    cur["scriptures"].append(r)
    return points


def all_refs(paragraphs, headline_ref=None):
    """Distinct refs across the doc, headline first (the Scripture-surface feed)."""
    seen = []
    for r in ([headline_ref] if headline_ref else []) + [x for p in (paragraphs or []) for x in find_refs(p)]:
        r = (r or "").strip()
        if r and r not in seen:
            seen.append(r)
    return seen


def normalize_headline_ref(raw):
    """The filename scripture ('MATTHEW 5.13-16 NIV') -> 'MATTHEW 5:13-16'."""
    refs = find_refs(raw or "")
    return refs[0] if refs else None


def entry_to_rows(entry, instance_id):
    """One index entry -> (sermon, prep) row dicts (ids minted on write)."""
    paras = entry.get("paragraphs") or []
    headline = normalize_headline_ref(entry.get("scripture"))
    points = structure_points(paras)
    scriptures = all_refs(paras, headline)
    title = entry.get("title") or None
    preacher = entry.get("preacher") or BG_DEFAULT
    date = entry.get("date") or None
    sermon = {
        "instance_id": instance_id, "title": title, "speaker": preacher,
        "scripture_ref": headline or (scriptures[0] if scriptures else None),
        "service_date": date, "service_type": _service_type(date),
        "source": "email", "status": "draft",
    }
    prep = {
        "instance_id": instance_id, "points": points, "scriptures": scriptures,
        "theme": title, "source": "email", "needs_review": False,
    }
    return sermon, prep


def _service_type(iso):
    if not iso:
        return "service"
    try:
        d = datetime.strptime(iso, "%Y-%m-%d")
    except ValueError:
        return "service"
    wd = d.weekday()  # Mon=0 ... Sun=6
    return "sunday" if wd == 6 else ("wednesday" if wd == 2 else "service")


# --- Supabase REST (service key; mirrors load-transcripts.py) -----------------

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


def upsert_sermon(url, key, sermon):
    """Idempotent by (instance_id, service_date, title): update else insert; returns id."""
    params = {"instance_id": f"eq.{sermon['instance_id']}", "select": "id"}
    if sermon.get("service_date"):
        params["service_date"] = f"eq.{sermon['service_date']}"
    if sermon.get("title"):
        params["title"] = f"eq.{sermon['title']}"
    found = _req(url, key, "GET", "choir_sermons", params=params)
    if found:
        sid = found[0]["id"]
        _req(url, key, "PATCH", "choir_sermons", params={"id": f"eq.{sid}"}, body=sermon)
        return sid, "updated"
    row = _req(url, key, "POST", "choir_sermons", body=sermon)
    return row[0]["id"], "inserted"


def upsert_prep(url, key, sermon_id, prep):
    body = dict(prep, sermon_id=sermon_id)
    found = _req(url, key, "GET", "sermon_prep",
                 params={"sermon_id": f"eq.{sermon_id}", "select": "sermon_id"})
    if found:
        _req(url, key, "PATCH", "sermon_prep", params={"sermon_id": f"eq.{sermon_id}"}, body=body)
        return "updated"
    _req(url, key, "POST", "sermon_prep", body=body)
    return "inserted"


def emit(ok, processed, note):
    with RUN_EVENTS.open("a") as ev:
        ev.write(json.dumps({"at": datetime.now(timezone.utc).isoformat(),
                             "script": "proclaim_load", "ok": ok,
                             "processed": processed, "note": note}) + "\n")


def main():
    ap = argparse.ArgumentParser(description="Load the PROCLAIM index into choir_sermons + sermon_prep (The Word).")
    ap.add_argument("index", help="proclaim-index.json produced by proclaim_docx_index.py")
    ap.add_argument("--slug", default="colg", help="church instance slug (default: colg)")
    ap.add_argument("--secrets", default=DEFAULT_SECRETS)
    ap.add_argument("--commit", action="store_true", help="actually write (default: dry-run report only)")
    ap.add_argument("--limit", type=int, default=0, help="cap entries (0 = all)")
    args = ap.parse_args()

    try:
        doc = json.loads(Path(args.index).read_text())
    except Exception as e:
        print(f"ERROR: cannot read index {args.index}: {e}", file=sys.stderr)
        return 2
    entries = doc.get("entries") or []
    if args.limit:
        entries = entries[: args.limit]

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
    for e in entries:
        sermon, prep = entry_to_rows(e, instance_id or f"<{args.slug}>")
        if not sermon["title"] or not sermon["service_date"]:
            skipped += 1
            print(f"  SKIP (missing title/date): {e.get('file')}")
            continue
        label = f"{sermon['service_date']} · {sermon['title']} · {len(prep['points'])} pts · {len(prep['scriptures'])} refs"
        if not args.commit:
            print(f"  would load: {label}")
            written += 1
            continue
        sid, s_act = upsert_sermon(url, key, sermon)
        p_act = upsert_prep(url, key, sid, prep)
        print(f"  {s_act}/{p_act}: {label}")
        written += 1

    note = f"{'committed' if args.commit else 'dry-run'} slug={args.slug} written={written} skipped={skipped}"
    print(note)
    if args.commit:
        emit(True, written, note)
    return 0


if __name__ == "__main__":
    sys.exit(main())
