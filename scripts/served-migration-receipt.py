#!/usr/bin/env python3
"""served-migration-receipt.py -- the live database says what it has applied (DR-1398).

DR-1360 made it the standard: the NAS initiates every road and the lane never
reaches in. The NAS already APPLIES every merged migration on its own clock
(replay-on-clock.sh, DR-1269). This is the PROOF read the same way: no tailnet,
no key, no hand. It asks the live database, over the public road the app itself
uses (poetech.us/sb, the anon key the site already ships), which of the
migration files in this checkout it has NOT applied
(public.sovereign_migration_receipt, migration 0317).

It waits for the NAS's own clock, within a budget, rather than reaching in to
hurry it: one services-sync cycle is about 15 minutes, so a migration merged a
minute ago is expected to be missing for a while, and the wait is how long the
lane gives the house to do its own work.

It REFUSES rather than guesses (DR-0076 section 8, unknown is never current):
  exit 0   every migration file in the checkout is on the live ledger
  exit 2   no anon key was given (SOVEREIGN_ANON_KEY)
  exit 14  the live database could not be reached when the wait ended
  exit 20  the wait ended with files still missing (they are named)
  exit 21  the receipt function is not on the live database yet (0317 itself
           has not been applied), when the wait ended
  exit 22  the database that answered has no sovereign ledger: the wrong
           database answered, so nothing is claimed
The key is read from the environment and never printed.
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime

UA = "poetech-migration-receipt/1 (DR-1398)"


def migration_files(directory):
    return sorted(f for f in os.listdir(directory) if f.endswith(".sql"))


def ask(origin, key, files, timeout):
    """One read of the receipt. Returns (code, detail) without raising."""
    body = json.dumps({"p_files": files}).encode("utf-8")
    req = urllib.request.Request(
        origin.rstrip("/") + "/sb/rest/v1/rpc/sovereign_migration_receipt",
        data=body,
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
        try:
            err = json.loads(e.read().decode("utf-8", "replace") or "{}")
        except ValueError:
            err = {}
        if e.code == 404 or (isinstance(err, dict) and err.get("code") == "PGRST202"):
            return 21, "the receipt (migration 0317) is not on the live database yet"
        return 14, f"the live database answered HTTP {e.code}"
    except (urllib.error.URLError, OSError, ValueError) as e:
        return 14, f"the live database could not be reached ({e.__class__.__name__})"
    if not isinstance(data, dict) or "ledger" not in data:
        return 14, "the answer was not a receipt"
    if not data.get("ledger"):
        return (
            22,
            "the database that answered has no sovereign ledger (the wrong database answered)",
        )
    missing = [m for m in data.get("missing") or [] if isinstance(m, str)]
    if missing:
        return 20, data
    return 0, data


def clock_diagnosis(origin, key, timeout, now=None):
    """When files are still missing, the house's own clock report says why (DR-1399).

    Reads public.nas_heartbeat_receipt() (migration 0318) and returns one line
    that tells a stopped clock from a failing migration from a checkout that
    has not pulled the commit yet. Never changes the exit code: a diagnosis,
    not a verdict. Never raises.
    """
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
            hb = json.loads(r.read().decode("utf-8", "replace") or "null")
    except (urllib.error.URLError, OSError, ValueError) as e:
        return f"the house's clock report could not be read ({e.__class__.__name__}), so the cause is not known from here"
    if not isinstance(hb, dict) or not hb.get("seen"):
        return "the house has written no heartbeat, so the cause is not known from here"
    try:
        at = datetime.fromisoformat(str(hb.get("at"))).timestamp()
    except ValueError:
        at = None
    age_min = int(((now or time.time()) - at) // 60) if at else None
    lc = hb.get("last_cycle") if isinstance(hb.get("last_cycle"), dict) else None
    if age_min is not None and age_min > 30:
        return f"the NAS clock last wrote its heartbeat {age_min} min ago: the clock has stopped, so nothing is applying (the clock is the thing to look at, not the migration)"
    if lc is None:
        return "the NAS clock is running, but its heartbeat does not carry the last cycle, so the replay's own result is not known from here"
    if "sovereign-replay" in (lc.get("failed") or []):
        return "the NAS clock is running and its last cycle names sovereign-replay as FAILED: the migration itself is failing on the live database (its reason is in the box's sovereign-replay/status.json)"
    if "sovereign-replay" in (lc.get("degraded") or []):
        return "the NAS clock is running and sovereign-replay could not run its last cycle (busy, timed out, or the database not answering); it retries every cycle"
    if lc.get("ok") is False:
        return "the NAS clock is running but its last cycle did not finish, and named no service"
    return "the NAS clock is running and sovereign-replay ran clean last cycle, so the missing files are not yet in the checkout it replays from (the NAS has not pulled this commit)"


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--origin", default="https://poetech.us")
    ap.add_argument(
        "--dir",
        default=os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "..",
            "infra",
            "supabase",
            "migrations-auto",
        ),
    )
    ap.add_argument(
        "--wait",
        type=int,
        default=0,
        help="seconds to keep asking while the NAS clock works",
    )
    ap.add_argument("--interval", type=int, default=60)
    ap.add_argument("--timeout", type=int, default=30, help="seconds for one request")
    a = ap.parse_args(argv)

    key = (os.environ.get("SOVEREIGN_ANON_KEY") or "").strip()
    if not key:
        print(
            "migration-receipt: no anon key (SOVEREIGN_ANON_KEY); nothing asked",
            file=sys.stderr,
        )
        return 2
    files = migration_files(a.dir)
    deadline = time.monotonic() + max(0, a.wait)
    asks = 0
    while True:
        asks += 1
        code, detail = ask(a.origin, key, files, a.timeout)
        if code == 0 or code == 22 or time.monotonic() + a.interval > deadline:
            break
        what = (
            f"{len(detail.get('missing') or [])} file(s) not applied yet"
            if isinstance(detail, dict)
            else detail
        )
        print(
            f"migration-receipt: ask {asks}: {what}; the NAS clock applies them, asking again in {a.interval}s",
            flush=True,
        )
        time.sleep(a.interval)

    lines = []
    if code in (0, 20):
        missing = detail.get("missing") or []
        lines.append(
            f"migration-receipt: the live database holds {detail.get('applied')} migrations, newest "
            f"{detail.get('newest')}, last written {detail.get('last_applied_at')}; "
            f"{len(files)} in this checkout, {len(missing)} not applied (after {asks} ask(s))"
        )
        for m in missing[:50]:
            lines.append(f"  not applied: {m}")
    else:
        lines.append(f"migration-receipt: {detail} (after {asks} ask(s))")
    if code in (20, 21):
        lines.append(
            "migration-receipt: why, by the house's own clock report: "
            + clock_diagnosis(a.origin, key, a.timeout)
        )
    for line in lines:
        print(line)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as fh:
            fh.write("## The live database says what it has applied (DR-1398)\n\n")
            fh.write("\n".join("- " + ln.strip() for ln in lines) + "\n")
    return code


if __name__ == "__main__":
    sys.exit(main())
