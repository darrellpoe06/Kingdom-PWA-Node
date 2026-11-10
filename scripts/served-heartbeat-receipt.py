#!/usr/bin/env python3
"""served-heartbeat-receipt.py -- the house says how its clock ran (DR-1399).

loops-health.yml asks the NAS over SSH, on the runner's tailnet key, what each
loop on the services-sync clock did last. When that road is shut (the key died
on 2026-11-04), this asks the house instead, over the public road the app uses
(poetech.us/sb, the anon key the site ships): public.nas_heartbeat_receipt(),
migration 0318, which reads the heartbeat the NAS writes itself every cycle.

It prints a witness in the SAME shape the SSH step writes (/tmp/witness.json),
so loops-health's judge, report and incident steps run unchanged:
  {"reachable", "road": "served", "why", "at", "checkout", "credential",
   "cron_log_lines", "clock": {last_run_at, age_s, event, summary},
   "loops": {name: {last_run, why, own_lines, ledger, ledger_age_s, installer}}}

It never claims what it did not read (DR-0076 section 8):
  - the receipt unreachable or unseen  -> reachable false, with why
  - a heartbeat with no last cycle     -> every loop "unknown", with why
  - a cycle that did not finish and named no service -> "unknown"
  - installer is None: the house's receipt does not say, and the judge skips
    that check on the served road rather than reading None as present.
It always prints a witness and exits 0; the judge decides. The key is read
from the environment and never printed.
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime

UA = "poetech-heartbeat-receipt/1 (DR-1399)"


def ask(origin, key, timeout):
    """One read of the receipt: (dict, '') or (None, why)."""
    req = urllib.request.Request(
        origin.rstrip("/") + "/sb/rest/v1/rpc/nas_heartbeat_receipt",
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
            data = json.loads(r.read().decode("utf-8", "replace") or "null")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return (
                None,
                "the heartbeat receipt (migration 0318) is not on the live database yet",
            )
        return None, f"the live database answered HTTP {e.code}"
    except (urllib.error.URLError, OSError, ValueError) as e:
        return None, f"the live database could not be reached ({e.__class__.__name__})"
    if not isinstance(data, dict) or "seen" not in data:
        return None, "the answer was not a heartbeat receipt"
    return data, ""


def epoch(stamp):
    if not isinstance(stamp, str) or not stamp:
        return None
    try:
        return int(datetime.fromisoformat(stamp).timestamp())
    except ValueError:
        return None


def witness(receipt, why, loops, now):
    """The SSH witness shape, built only from what the receipt says."""
    base = {
        "road": "served",
        "at": now,
        "checkout": None,
        "credential": None,
        "cron_log_lines": None,
    }
    if receipt is None or not receipt.get("seen"):
        base.update(
            {
                "reachable": False,
                "why": why
                or "the house has written no heartbeat (nas_heartbeat_receipt: seen false)",
                "clock": {},
                "loops": {},
            }
        )
        return base
    lc = (
        receipt.get("last_cycle")
        if isinstance(receipt.get("last_cycle"), dict)
        else None
    )
    beat = epoch(receipt.get("at"))
    cyc = epoch(lc.get("at")) if lc else None
    newest = max([t for t in (beat, cyc) if t is not None], default=None)
    failed = set(lc.get("failed") or []) if lc else set()
    degraded = set(lc.get("degraded") or []) if lc else set()
    ok = lc.get("ok") if lc else None
    clock = {
        "last_run_at": (lc or {}).get("at") or receipt.get("at"),
        "age_s": (now - newest) if newest is not None else None,
        "event": "loop_run_done"
        if ok is True
        else ("loop_run_fail" if ok is False else None),
        "summary": "read from the house's own heartbeat over poetech.us (service names only)"
        + (f"; failed: {', '.join(sorted(failed))}" if failed else "")
        + (f"; degraded: {', '.join(sorted(degraded))}" if degraded else ""),
    }
    out = {}
    for name in loops:
        e = {
            "last_run": None,
            "why": None,
            "own_lines": [],
            "ledger": None,
            "ledger_age_s": None,
            "installer": None,
        }
        if lc is None:
            e["last_run"] = "unknown"
            e["why"] = (
                "the house's heartbeat does not carry its last cycle yet (heartbeat.py before DR-1399)"
            )
        elif name in failed:
            e["last_run"] = "failed"
            e["why"] = "services-sync's last run, by the house's own heartbeat: failed"
        elif name in degraded:
            e["last_run"] = "degraded"
            e["why"] = (
                "services-sync's last run, by the house's own heartbeat: could not work this cycle"
            )
        elif ok is False and not failed:
            e["last_run"] = "unknown"
            e["why"] = "services-sync itself did not finish, and named no service"
        else:
            e["last_run"] = "ok"
        out[name] = e
    base.update({"reachable": True, "why": "", "clock": clock, "loops": out})
    return base


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--origin", default="https://poetech.us")
    ap.add_argument("--loops", default="", help="comma-separated loop names to judge")
    ap.add_argument(
        "--needed",
        metavar="WITNESS",
        help="exit 0 when the SSH witness at this path is missing, unreadable or unreachable "
        "(the house must be asked), 1 when the box already answered; prints nothing",
    )
    ap.add_argument("--timeout", type=int, default=30)
    a = ap.parse_args(argv)
    if a.needed:
        try:
            with open(a.needed, encoding="utf-8") as fh:
                answered = json.load(fh).get("reachable") is True
        except (OSError, ValueError, AttributeError):
            answered = False
        return 1 if answered else 0
    loops = [n.strip() for n in a.loops.split(",") if n.strip()]
    if not loops:
        ap.error("--loops is required unless --needed is given")
    key = (os.environ.get("SOVEREIGN_ANON_KEY") or "").strip()
    if not key:
        receipt, why = None, "no anon key (the served site gave none); nothing asked"
    else:
        receipt, why = ask(a.origin, key, a.timeout)
    print(json.dumps(witness(receipt, why, loops, int(time.time()))))
    return 0


if __name__ == "__main__":
    sys.exit(main())
