#!/usr/bin/env python3
"""
tax_ingest.py -- the sovereign tax-document archive builder (Books -> Taxes).

Darrell 2026-07-21: "Annual tax information is the PDF of years of taxes -- where
should Christina import... still printable later... use those artifacts to help
build their behavioral strategies... we have most of this." We do -- this is the
SAME deterministic-Python-on-the-NAS pattern the finance ledger already runs
(imported_snapshot.py, DR-0083), pointed at tax documents.

FLOW (all sovereign, no third party, no n8n):
  1. Christina drops PDFs on the NAS bind mount, one folder per entity + year:
       /volume1/PoeTech/tax-documents/<entityId>/<year>/<name>.pdf
     Optionally a verified sidecar next to a PDF supplies the KEY FIGURES the
     behavioral-strategy layer reads (hand-entered + checked, never OCR-guessed
     -- a wrong figure is worse than none, DR-0076):
       /volume1/PoeTech/tax-documents/<entityId>/<year>/<name>.figures.json
         { "grossIncome": 110000, "agi": 98000, "totalTax": 13500, "refund": 600 }
  2. This job copies each PDF INTO the Caddy site so it is served SAME-ORIGIN and
     stays PRINTABLE anytime:  /taxes/files/<entityId>/<year>/<name>.pdf
  3. It writes a LIGHT JSON snapshot the PWA reads same-origin (GET
     /taxes/archive.json), consumed by app/src/lib/tax-archive.js ->
     tax-documents.js (groupByYear + buildTaxHistory). The app carries only the
     light data + a pointer; the heavy original lives on sovereign disk.

Deterministic + stdlib only. Idempotent: re-running fully rewrites the archive
and re-syncs the served PDFs. MANUAL/one-shot writer; any scheduled refresh ships
inactive-until-armed per the three-brakes rule (DR autonomous-automation).

Run on the NAS (SSH / ConnectBot):
    python3 /volume1/PoeTech/tax-documents/tax_ingest.py
"""
import json
import os
import re
import shutil
import sys
import hashlib
from datetime import datetime, timezone

SRC = "/volume1/PoeTech/tax-documents"
SITE = "/volume1/PoeTech/caddy/site/poetech-app/taxes"
OUT = os.path.join(SITE, "archive.json")
FILES = os.path.join(SITE, "files")

FIGURE_KEYS = ("grossIncome", "agi", "totalTax", "refund")


def infer_kind(filename):
    """Best-effort document KIND from the filename (matches TAX_DOC_KINDS)."""
    s = str(filename or "").lower()
    if "1099" in s:
        return "1099-received"
    if re.search(r"w-?2", s):
        return "w2"
    if re.search(r"k-?1", s):
        return "k1"
    if "1040" in s or "return" in s:
        return "return"
    if "schedule" in s or re.search(r"\bsch\b", s):
        return "schedule"
    if "receipt" in s:
        return "receipt"
    return "other"


def stable_id(entity, year, kind, filename):
    basis = "%s|%s|%s|%s" % (entity, year, kind, str(filename).lower())
    return "tax-" + hashlib.sha1(basis.encode()).hexdigest()[:12]


def read_figures(pdf_path):
    """Verified figures from a sidecar <name>.figures.json, or None."""
    side = os.path.splitext(pdf_path)[0] + ".figures.json"
    if not os.path.isfile(side):
        return None
    try:
        with open(side, "r", encoding="utf-8") as fh:
            raw = json.load(fh)
    except Exception:
        return None
    figs = {}
    for k in FIGURE_KEYS:
        v = raw.get(k)
        if isinstance(v, (int, float)):
            figs[k] = float(v)
    return figs or None


def build():
    documents = []
    if not os.path.isdir(SRC):
        return {"documents": [], "served_at": datetime.now(timezone.utc).isoformat(), "note": "no tax-documents dir yet"}
    for entity in sorted(os.listdir(SRC)):
        ent_dir = os.path.join(SRC, entity)
        if not os.path.isdir(ent_dir):
            continue
        for year in sorted(os.listdir(ent_dir)):
            yr_dir = os.path.join(ent_dir, year)
            if not os.path.isdir(yr_dir) or not re.fullmatch(r"\d{4}", str(year)):
                continue
            for fn in sorted(os.listdir(yr_dir)):
                if not fn.lower().endswith(".pdf"):
                    continue
                src_pdf = os.path.join(yr_dir, fn)
                kind = infer_kind(fn)
                # Copy into the Caddy site so the ORIGINAL is served + printable.
                dest_dir = os.path.join(FILES, entity, str(year))
                os.makedirs(dest_dir, exist_ok=True)
                try:
                    shutil.copy2(src_pdf, os.path.join(dest_dir, fn))
                except Exception:
                    pass
                rec = {
                    "id": stable_id(entity, year, kind, fn),
                    "year": int(year),
                    "entityId": entity,
                    "kind": kind,
                    "filename": fn,
                    "storageRef": "/taxes/files/%s/%s/%s" % (entity, year, fn),
                    "bytes": os.path.getsize(src_pdf) if os.path.isfile(src_pdf) else None,
                    "status": "stored",
                }
                figs = read_figures(src_pdf)
                if figs:
                    rec["figures"] = figs
                documents.append(rec)
    # Deterministic order: newest year first, then kind, then filename.
    kind_rank = {"return": 0, "w2": 1, "1099-received": 2, "k1": 3, "schedule": 4, "receipt": 5, "other": 6}
    documents.sort(key=lambda r: (-r["year"], kind_rank.get(r["kind"], 9), r["filename"]))
    return {"documents": documents, "served_at": datetime.now(timezone.utc).isoformat()}


def main():
    out = OUT
    if len(sys.argv) > 1:
        out = sys.argv[1]
    snap = build()
    os.makedirs(os.path.dirname(out), exist_ok=True)
    tmp = out + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(snap, fh, ensure_ascii=False, indent=2, sort_keys=True)
    os.replace(tmp, out)
    print("wrote %d tax document(s) -> %s" % (len(snap["documents"]), out))


if __name__ == "__main__":
    main()
