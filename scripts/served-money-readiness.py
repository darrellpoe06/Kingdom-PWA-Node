"""served-money-readiness.py -- may the FOS Money Phase 1.4 migration be applied?
Asked of the house over the public road, with no key (DR-1360; migration 0334).

Calls public.money_readiness_receipt() at poetech.us/sb with the anon key the
site ships (scripts/served-anon-key.py reads it from the served bundle). The
receipt carries schema facts and the NAS's own backup verdict; never a row,
an amount or a name.

It prints where the install stands before any verdict: whether the receipt
answered, when the db-backup-receipt rider last wrote, the backup's own time
and verdict, the drill, and the Phase 1.4 columns already present. Then the
verdict, judged the way app/src/lib/money-readiness.js judges it:
  exit 0  ready: a verified backup within 36 h and a passing drill within 8 d
  exit 1  not ready, with the reason (the job goes red; nothing is applied)
  exit 2  the receipt could not be read (unknown is never ready, DR-0076)
The key is read from the environment and never printed.
"""

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import UTC, datetime

UA = "poetech-money-readiness/1 (DR-1360)"
COLUMNS = ("outstanding", "cleared_on", "pending", "source", "doc_id")


def ask(origin, key, timeout=20):
    req = urllib.request.Request(
        origin.rstrip("/") + "/sb/rest/v1/rpc/money_readiness_receipt",
        data=b"{}",
        method="POST",
        headers={
            "apikey": key,
            "Authorization": "Bearer " + key,
            "Content-Type": "application/json",
            "User-Agent": UA,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8")), ""
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except (OSError, ValueError) as e:
        return None, e.__class__.__name__


def hours_since(iso, now):
    try:
        return (now - datetime.fromisoformat(str(iso))).total_seconds() / 3600
    except (TypeError, ValueError):
        return None


def judge(r, now):
    """(ready, reasons, lines) for one receipt. Pure."""
    b = r.get("backup") if isinstance(r, dict) else None
    lines, reasons = [], []
    if not isinstance(b, dict) or b.get("seen") is not True:
        reasons.append(
            "no backup receipt: the db-backup-receipt rider has not written (not yet run, or no credential)"
        )
        lines.append("rider: never written")
    else:
        w = hours_since(b.get("written_at"), now)
        lines.append(f"rider: last wrote {'?' if w is None else round(w, 1)} h ago")
        if w is None or w > 1:
            reasons.append(
                "the rider has not written within an hour: the services-sync clock may not be running it"
            )
        age = hours_since(b.get("at"), now)
        lines.append(
            f"backup: ok={b.get('ok')} at={b.get('at')} ({'?' if age is None else round(age, 1)} h) kept={b.get('kept')}"
        )
        if b.get("ok") is not True:
            reasons.append("the last backup did not verify")
        elif age is None or age > 36:
            reasons.append("no verified backup within 36 hours")
        d = b.get("drill") or {}
        dage = hours_since(b.get("last_drill_at"), now)
        lines.append(
            f"drill: {d.get('verdict')} ({'?' if dage is None else round(dage / 24, 1)} d), tables {d.get('tables')}/{d.get('tables_live')}"
        )
        if d.get("verdict") != "passed" or dage is None or dage > 8 * 24:
            reasons.append("no passing restore drill within 8 days")
    cols = (r or {}).get("transactions_columns") or {}
    lines.append(
        "phase 1.4 columns present: "
        + (", ".join(c for c in COLUMNS if cols.get(c) is True) or "none")
    )
    lines.append(
        f"category CHECK: {(r or {}).get('category_check')}  obligations tables: {(r or {}).get('obligations_table')}/{(r or {}).get('obligation_settlements_table')}"
    )
    if (r or {}).get("category_check") is True:
        reasons.append("a CHECK limits categories: 'tithes' must be added to it first")
    return not reasons, reasons, lines


def main():
    key = os.environ.get("SOVEREIGN_ANON_KEY", "")
    origin = os.environ.get("SITE_ORIGIN", "https://poetech.us")
    if not key:
        print(
            "where the install stands: no anon key could be read from the served site"
        )
        return 2
    r, why = ask(origin, key)
    print("## Money readiness -- where the install stands")
    if r is None:
        print(
            f"- the receipt did not answer ({why}); migration 0334 may not be applied yet"
        )
        return 2
    ready, reasons, lines = judge(r, datetime.now(UTC))
    for line in lines:
        print("- " + line)
    print(
        "**READY** for the Phase 1.4 migration."
        if ready
        else "**NOT READY:** " + "; ".join(reasons)
    )
    return 0 if ready else 1


if __name__ == "__main__":
    sys.exit(main())
