#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""choir_dates_sync — drain the undated choir_sermons backlog from the NAS.

WHY (2026-08-04, "Run the choir pipeline now don't wait for Thursday"). The
corpus-reconcile CI lane now DATES existing rows (guarded DO UPDATE), and the
widened title parser dated ~130 of the backlog in one run — but ~530 videos
carry NO date in their title, and both CI-side routes to YouTube's own record
of when each stream happened are blocked from a datacenter runner: the stored
Data-API key is rejected ("API key not valid") and per-video watch pages are
bot-checked (run 30869702958 dated 4 of 545). From the NAS's residential IP
the same yt-dlp reads those pages fine. This job is that read, riding the
ALREADY-ARMED services-sync clock (DR-0247: agreed work starts itself; the
sibling youtube_load.py shipped inert and the backlog sat) — a bounded chunk
per cycle until the backlog is drained, then a DONE marker makes every later
cycle a no-op.

THE WAY (DR-0083, like youtube_load.py beside it):
  - Plain Python 3, stdlib only. DRY-RUN BY DEFAULT; the shim passes --commit.
  - Idempotent: only rows whose service_date IS NULL are ever touched, and the
    PATCH itself re-asserts service_date=is.null — a hand-set date can never be
    overwritten, and re-runs re-date nothing.
  - BUDGETED (deterministic class, DR-0248: budget + lock): at most --chunk
    videos and --time-budget seconds of page reads per run; the services-sync
    runner owns the lock/timeout above this. ~90/cycle on the 15-min clock
    drains ~530 in under two hours, unattended.
  - Truthful-or-absent (DR-0076): a stream's release_timestamp (its actual
    start) is the service date, converted to the church's America/New_York
    calendar day; date-only upload_date passes through. A video yt-dlp cannot
    date is left NULL and counted loudly — never guessed. Zero-resolved with
    work remaining exits RED so the runner's ntfy sees it.
  - Run-state appended to events/events.jsonl beside this script.

Usage (NAS, via infra/church-media-golive/choir_dates_install.sh):
  python3 choir_dates_sync.py                 # dry-run report
  python3 choir_dates_sync.py --commit --done-marker state/choir-dates.DONE
  python3 choir_dates_sync.py --selftest      # pure-logic gate (CI)
"""
import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from youtube_load import load_secrets, _req, resolve_instance  # noqa: E402

RUN_EVENTS = HERE / "events" / "events.jsonl"
# Church-local time. DSM's python3 can predate zoneinfo (3.9+); the fixed
# EST offset fallback still lands every real service on its correct calendar
# day (services never start in the 00:00-01:00 local sliver where -5 vs -4
# could differ across midnight).
try:
    from zoneinfo import ZoneInfo
    CHURCH_TZ = ZoneInfo("America/New_York")
except Exception:  # pragma: no cover - NAS fallback
    CHURCH_TZ = timezone(timedelta(hours=-5), "EST")


# --- pure logic (gated by --selftest) -----------------------------------------

def stamp_to_date(stamp):
    """yt-dlp print '%(release_timestamp,upload_date)s' -> 'YYYY-MM-DD' | None.

    release_timestamp is epoch seconds (a stream's ACTUAL start) — converted to
    the church's local calendar day, because an 8pm EST Wednesday stream is
    01:00 UTC Thursday and must not file on the wrong night. upload_date is
    date-only 'YYYYMMDD' (no timezone to correct). Anything else -> None.
    """
    s = (stamp or "").strip()
    if not s or s == "NA":
        return None
    if len(s) == 8 and s.isdigit():
        return f"{s[0:4]}-{s[4:6]}-{s[6:8]}"
    try:
        return datetime.fromtimestamp(float(s), tz=timezone.utc).astimezone(CHURCH_TZ).strftime("%Y-%m-%d")
    except (ValueError, OverflowError, OSError):
        return None


def weekday_type(date_str):
    """Weekday-derived service_type fill: sunday/wednesday, else None (an
    off-day date proves nothing — funerals/conferences keep their own label)."""
    try:
        wd = datetime.strptime(date_str, "%Y-%m-%d").weekday()
    except (ValueError, TypeError):
        return None
    return {6: "sunday", 2: "wednesday"}.get(wd)


def patch_for(row, date_str):
    """The guarded PATCH body for one dated row: the date, plus a weekday
    service_type ONLY when the row has none (never clobbers a stored label)."""
    body = {"service_date": date_str}
    if not row.get("service_type"):
        st = weekday_type(date_str)
        if st:
            body["service_type"] = st
    return body


def parse_print_lines(stdout):
    """'id<TAB>stamp' lines -> {id: 'YYYY-MM-DD'} (undateable lines skipped)."""
    out = {}
    for line in (stdout or "").splitlines():
        parts = line.strip().split("\t")
        if len(parts) != 2:
            continue
        date = stamp_to_date(parts[1])
        if parts[0] and date:
            out[parts[0]] = date
    return out


# --- yt-dlp page read (NAS residential IP) ------------------------------------

def fetch_dates(video_ids, time_budget_s):
    """One yt-dlp invocation over the chunk; bounded by time_budget_s."""
    args = ["--skip-download", "--no-warnings", "--ignore-errors",
            "--print", "%(id)s\t%(release_timestamp,upload_date)s"]
    args += [f"https://www.youtube.com/watch?v={v}" for v in video_ids]
    for cmd in (["yt-dlp"], [sys.executable, "-m", "yt_dlp"]):
        try:
            r = subprocess.run(cmd + args, capture_output=True, text=True, timeout=time_budget_s)
        except FileNotFoundError:
            continue
        except subprocess.TimeoutExpired as e:
            return parse_print_lines(e.stdout or "")
        if r.stdout.strip() or r.returncode == 0:
            return parse_print_lines(r.stdout)
    raise RuntimeError("yt-dlp not available (pip install yt-dlp)")


def emit(ok, processed, note):
    RUN_EVENTS.parent.mkdir(parents=True, exist_ok=True)
    with RUN_EVENTS.open("a") as ev:
        ev.write(json.dumps({"at": datetime.now(timezone.utc).isoformat(),
                             "script": "choir_dates_sync", "ok": ok,
                             "processed": processed, "note": note}) + "\n")


# --- selftest (CI merge gate; proven-to-catch in ci.yml) -----------------------

def selftest():
    checks = []
    # A 8pm EST Wednesday stream is 01:00 UTC Thursday — must file Wednesday.
    checks.append(("est-evening stream stays on its night",
                   stamp_to_date("1702515600") == "2023-12-13"))  # 2023-12-14 01:00 UTC
    checks.append(("date-only upload_date passes through", stamp_to_date("20231108") == "2023-11-08"))
    checks.append(("NA/garbage never invents a date",
                   stamp_to_date("NA") is None and stamp_to_date("") is None and stamp_to_date("soon") is None))
    checks.append(("sunday/wednesday classify; off-days stay unclaimed",
                   weekday_type("2026-08-02") == "sunday" and weekday_type("2026-08-05") == "wednesday"
                   and weekday_type("2026-08-03") is None))
    checks.append(("patch never clobbers a stored service_type",
                   patch_for({"service_type": "funeral"}, "2026-08-02") == {"service_date": "2026-08-02"}
                   and patch_for({"service_type": None}, "2026-08-02")
                   == {"service_date": "2026-08-02", "service_type": "sunday"}))
    checks.append(("print-line parse keeps only dateable rows",
                   parse_print_lines("a1\t20231108\nb2\tNA\nnoise\nc3\t1702515600")
                   == {"a1": "2023-11-08", "c3": "2023-12-13"}))
    ok = all(passed for _, passed in checks)
    for name, passed in checks:
        print(("PASS" if passed else "FAIL"), "-", name)
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", default="colg")
    ap.add_argument("--secrets", default="/volume1/PoeTech/secrets/supabase.json")
    ap.add_argument("--chunk", type=int, default=90)
    ap.add_argument("--time-budget", type=int, default=300)
    ap.add_argument("--commit", action="store_true")
    ap.add_argument("--done-marker", default=None)
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()

    url, key = load_secrets(a.secrets)
    if not (url and key):
        print("ERROR: no Supabase credentials (SUPABASE_URL + SUPABASE_SERVICE_KEY or --secrets).", file=sys.stderr)
        emit(False, 0, "no credentials")
        return 1
    inst = resolve_instance(url, key, a.slug)
    if not inst:
        print(f"ERROR: no instance for slug {a.slug}", file=sys.stderr)
        emit(False, 0, f"no instance {a.slug}")
        return 1

    rows = _req(url, key, "GET", "choir_sermons", params={
        "instance_id": f"eq.{inst}", "service_date": "is.null",
        "video_id": "not.is.null", "select": "id,video_id,service_type",
        "order": "created_at.asc", "limit": str(a.chunk),
    })
    if not rows:
        print("choir-dates: backlog drained — nothing undated remains.")
        if a.done_marker and a.commit:
            Path(a.done_marker).parent.mkdir(parents=True, exist_ok=True)
            Path(a.done_marker).write_text(datetime.now(timezone.utc).isoformat() + "\n")
        emit(True, 0, "drained")
        return 0

    t0 = time.monotonic()
    dates = fetch_dates([r["video_id"] for r in rows], a.time_budget)
    dated = 0
    for r in rows:
        d = dates.get(r["video_id"])
        if not d:
            continue
        if a.commit:
            # is.null re-asserted in the filter: a concurrently-set date wins.
            _req(url, key, "PATCH", "choir_sermons",
                 params={"id": f"eq.{r['id']}", "service_date": "is.null"},
                 body=patch_for(r, d))
        dated += 1
    took = round(time.monotonic() - t0, 1)
    mode = "committed" if a.commit else "DRY-RUN (no writes; pass --commit)"
    print(f"choir-dates: {mode} {dated} of {len(rows)} chunk rows in {took}s; backlog continues next cycle.")
    emit(dated > 0, dated, f"{mode}; chunk {len(rows)}; {took}s")
    if dated == 0:
        # A whole chunk yielding nothing means the page read is blocked or the
        # remainder is genuinely undateable — either way, say so RED (DR-0076).
        print(f"choir-dates: dated 0 of {len(rows)} — page metadata unavailable; NOT marking done.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
