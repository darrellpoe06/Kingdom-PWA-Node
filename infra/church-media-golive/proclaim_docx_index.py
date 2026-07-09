#!/usr/bin/env python3
"""proclaim_docx_index — index the Proclaim team's local .docx archive.

Runs on tower 2 (or wherever the archive lives). Stdlib only — a .docx is a zip
holding word/document.xml; no python-docx needed. Extracts per file:
  date, title, scripture, preacher (from the filename BG uses), plus the
  paragraph text (the points / order segments) for downstream template work.

Usage:
  python proclaim_docx_index.py <folder> [--out proclaim-index.json]

Read-only over the archive; writes the index + one run-state line. Honest by
design: anything unparseable lands under "unparsed" instead of being guessed.
"""
import json
import re
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

RUN_EVENTS = Path(__file__).with_name("events.jsonl")

# BG's filename convention (observed 2026-07-03):
#   "07-01-2026 - PROCLAIM - TITLE WORDS - ELIJAH AND ELISHA - PASTOR MCCRAY!.docx"
DATE_RE = re.compile(r"(\d{2})-(\d{2})-(\d{4})")
SCRIPTURE_RE = re.compile(
    r"\b([1-3]?\s?[A-Z][A-Za-z]+\.?\s?\d+[.:]\d+(?:-\d+)?(?:\s?(?:NIV|NKJV|KJV|ESV|AMP))?)\b"
)
PREACHER_RE = re.compile(r"(PASTOR|BISHOP|ELDER|EVANGELIST|MINISTER)\s+[A-Z'\-]+", re.I)


def docx_text(path):
    """Paragraph texts from a .docx (zip -> word/document.xml -> strip tags)."""
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8", "replace")
    paras = re.split(r"</w:p>", xml)
    out = []
    for p in paras:
        text = "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", p))
        if text.strip():
            out.append(text.strip())
    return out


def index_file(path):
    name = path.stem
    entry = {"file": path.name, "unparsed": []}
    m = DATE_RE.search(name)
    if m:
        mm, dd, yyyy = m.groups()
        entry["date"] = f"{yyyy}-{mm}-{dd}"
    else:
        entry["unparsed"].append("date")
    sm = SCRIPTURE_RE.search(name)
    if sm:
        entry["scripture"] = sm.group(1)
    pm = PREACHER_RE.search(name)
    if pm:
        entry["preacher"] = pm.group(0).title()
    # Title = the filename with date/labels stripped, best-effort but honest.
    title = DATE_RE.sub("", name)
    title = re.sub(r"\bPROCLAIM( SCRIPTURES AND POINTS( FROM)?)?\b", "", title, flags=re.I)
    entry["title"] = re.sub(r"\s*-\s*", " - ", title).strip(" -!") or None
    try:
        entry["paragraphs"] = docx_text(path)
    except Exception as e:  # unreadable file stays visible, never silently skipped
        entry["error"] = f"{type(e).__name__}: {e}"
    return entry


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    folder = Path(sys.argv[1])
    out_path = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else Path("proclaim-index.json")
    files = sorted(folder.rglob("*.docx"))
    entries = [index_file(f) for f in files]
    out_path.write_text(json.dumps({"generated": datetime.now(timezone.utc).isoformat(),
                                    "source": str(folder), "count": len(entries),
                                    "entries": entries}, indent=2))
    with RUN_EVENTS.open("a") as ev:
        ev.write(json.dumps({"at": datetime.now(timezone.utc).isoformat(),
                             "script": "proclaim_docx_index", "ok": True,
                             "processed": len(entries), "note": str(out_path)}) + "\n")
    print(f"indexed {len(entries)} docx -> {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
