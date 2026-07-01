#!/usr/bin/env python3
"""
imported_snapshot.py -- deterministic replacement for n8n workflow 18.

Reads the sovereign finance-events tree the family already ingests
(/volume1/PoeTech/finance-events/) and writes a static JSON snapshot in the
exact shape Books -> Imported (app/src/components/Imported.jsx) consumes:

    { transactions[], gmail_events[], counts{...}, served_at }

The snapshot is written INTO the Caddy site directory so the PWA reads it
SAME-ORIGIN (GET /finance/imported.json) instead of calling n8n across the
Tailscale Funnel. No n8n, no cross-origin round-trip, no "Failed to fetch."

Deterministic + stdlib only. Idempotent: re-running fully rewrites the snapshot.
Part of the Sovereign Kingdom OS direction (DR-0083): replace fragile n8n
dependencies with plain Python on the NAS. This is a MANUAL/one-shot writer;
the scheduled refresh ships inactive-until-armed per the three-brakes rule.
"""
import json
import os
import re
import sys
import hashlib
from datetime import datetime, timezone

EVENTS = "/volume1/PoeTech/finance-events"
OUT = "/volume1/PoeTech/caddy/site/poetech-app/finance/imported.json"


def clean_institution(raw):
    """chase7206_activity_20260527.qfx -> 'Chase 7206'; transaction_report -> 'Transaction Report'."""
    s = str(raw or "")
    m = re.search(r"chase(\d{3,4})", s, re.I)
    if m:
        return "Chase " + m.group(1)
    base = re.sub(r"\.qfx$", "", s, flags=re.I)
    base = re.sub(r"_activity.*$", "", base, flags=re.I)
    base = base.replace("_", " ").strip()
    return base.title() if base else "Unknown"


def read_bank():
    rows = []
    bank = os.path.join(EVENTS, "bank")
    if not os.path.isdir(bank):
        return rows
    for dirpath, _dirs, files in os.walk(bank):
        for fn in files:
            if fn == "_balance.json" or not fn.endswith(".json"):
                continue
            fp = os.path.join(dirpath, fn)
            try:
                with open(fp, "r", encoding="utf-8") as fh:
                    d = json.load(fh)
            except Exception:
                continue
            t = d.get("transaction")
            if not isinstance(t, dict):
                continue
            inst = clean_institution(d.get("institution") or d.get("source_file"))
            fitid = t.get("fitid")
            # Stable id: fitid within institution, else content hash (dedup-safe).
            if fitid:
                rid = "b-" + hashlib.sha1((inst + "|" + str(fitid)).encode()).hexdigest()[:16]
            else:
                rid = "b-" + hashlib.sha1(json.dumps(t, sort_keys=True).encode()).hexdigest()[:16]
            amt = t.get("amount")
            rows.append({
                "id": rid,
                "posted": t.get("posted"),
                "institution": inst,
                "name": t.get("name"),
                "memo": t.get("memo"),
                "amount": float(amt) if isinstance(amt, (int, float)) else None,
                "fitid": fitid,
                # Faithful to current wf18 output: no cross-verify yet -> everything
                # unexplained. A gmail<->bank matcher is a later improvement.
                "status": "unexplained",
            })
    # Deterministic order: newest first, then id for stability.
    rows.sort(key=lambda r: (str(r.get("posted") or ""), r["id"]), reverse=True)
    return rows


def read_gmail():
    rows = []
    gm = os.path.join(EVENTS, "gmail")
    if not os.path.isdir(gm):
        return rows
    for fn in sorted(os.listdir(gm)):
        if not fn.endswith(".json"):
            continue
        try:
            with open(os.path.join(gm, fn), "r", encoding="utf-8") as fh:
                d = json.load(fh)
        except Exception:
            continue
        ex = d.get("extracted") or {}
        amt = ex.get("amount") if isinstance(ex, dict) else None
        has_amt = isinstance(amt, (int, float))
        rows.append({
            "id": "g-" + hashlib.sha1(str(d.get("gmail_id") or fn).encode()).hexdigest()[:16],
            "internal_date": d.get("internal_date") or d.get("captured_at"),
            "amount": float(amt) if has_amt else None,
            "direction": (ex.get("direction") if isinstance(ex, dict) else None),
            "subject": d.get("subject"),
            "from": d.get("from"),
            "status": "unconfirmed" if has_amt else "no-amount",
        })
    rows.sort(key=lambda r: str(r.get("internal_date") or ""), reverse=True)
    return rows


def build():
    bank = read_bank()
    gmail = read_gmail()
    institutions = sorted({r["institution"] for r in bank if r.get("institution")})
    status_counts = {}
    for r in bank:
        status_counts[r["status"]] = status_counts.get(r["status"], 0) + 1
    return {
        "transactions": bank,
        "gmail_events": gmail,
        "counts": {
            "total_bank": len(bank),
            "total_gmail": len(gmail),
            "status_counts": status_counts,
            "institutions": institutions,
        },
        "served_at": datetime.now(timezone.utc).isoformat(),
    }


def main():
    out = OUT
    if len(sys.argv) > 1:
        out = sys.argv[1]
    snap = build()
    os.makedirs(os.path.dirname(out), exist_ok=True)
    tmp = out + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(snap, fh, ensure_ascii=False)
    os.replace(tmp, out)  # atomic
    c = snap["counts"]
    print("wrote %s" % out)
    print("  bank=%d gmail=%d institutions=%s" % (c["total_bank"], c["total_gmail"], c["institutions"]))
    print("  status_counts=%s" % c["status_counts"])


if __name__ == "__main__":
    main()
