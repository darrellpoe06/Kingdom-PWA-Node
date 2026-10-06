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
import os
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

def ytdlp_args(video_ids):
    """The read-only metadata call. --ignore-no-formats-error (DR-0723): a
    current yt-dlp without a JS runtime may be offered no playable format, and
    we never want one -- only the stamp -- so that is not a reason to print
    nothing."""
    args = ["--skip-download", "--no-warnings", "--ignore-errors", "--ignore-no-formats-error",
            "--print", "%(id)s\t%(release_timestamp,upload_date)s"]
    return args + [f"https://www.youtube.com/watch?v={v}" for v in video_ids]


# A video YouTube no longer serves can never be dated by reading its page.
# These are yt-dlp's own words for that (stderr "ERROR: [youtube] <id>: ...").
GONE_MARKERS = (
    "Video unavailable", "Private video", "This video is private",
    "This video has been removed", "This video is no longer available",
    "account associated with this video has been terminated",
)


def gone_from_stderr(stderr):
    """'ERROR: [youtube] <id>: <why>' lines -> {id: why} for DURABLE gone only.

    A bot check, a rate limit or a network error is about this IP today, not
    about the video, so it is never recorded (DR-0076: a refusal is a fact
    about the runner)."""
    out = {}
    for line in (stderr or "").splitlines():
        line = line.strip()
        if not line.startswith("ERROR: [youtube] "):
            continue
        rest = line[len("ERROR: [youtube] "):]
        vid, _, why = rest.partition(": ")
        if vid and any(m in why for m in GONE_MARKERS):
            out[vid] = why[:160]
    return out


# Where the NAS actually installs yt-dlp. infra/nas-yt-dlp/install.sh and
# choir_dates_install.sh both write YTDLP_HOME, default /volume1/PoeTech/yt-dlp;
# the older per-service copy sat beside this file in state/.
#
# Measured 2026-10-06 by voice-intake-health, on the NAS: that binary answers
# (`/volume1/PoeTech/yt-dlp/yt-dlp --version -> exit 0: 2026.08.19`) and dated
# two real videos in the same run. But the rider, called with the PATH the
# installer sets (`.../church-media-golive/state:/usr/bin:/bin`), raised
# `FileNotFoundError [Errno 2] No such file or directory: 'yt-dlp'`, because the
# state copy is absent and the installed one is not on that PATH. So choir-dates
# had been DEGRADED since 2026-10-02 over a name lookup, with a working tool on
# the same disk the whole time.
#
# Absolute paths are tried first. The bare name still follows it, for a box that
# does have it on PATH and for anyone running this by hand.
YTDLP_PATHS = (
    os.environ.get("YTDLP_BIN") or "",
    os.path.join(os.environ.get("YTDLP_HOME") or "/volume1/PoeTech/yt-dlp", "yt-dlp"),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "state", "yt-dlp"),
)


def ytdlp_commands(paths=None):
    """The commands to try, in order: the binaries the NAS installs, then the
    bare name, then the module. A path that is not an executable file is left
    out, so a half-finished install never becomes a confusing exec failure."""
    cmds = [[p] for p in (YTDLP_PATHS if paths is None else paths)
            if p and os.path.isfile(p) and os.access(p, os.X_OK)]
    cmds.append(["yt-dlp"])
    cmds.append([sys.executable, "-m", "yt_dlp"])
    return tuple(cmds)


def fetch_stamps(video_ids, time_budget_s, commands=None):
    """One yt-dlp invocation over the chunk -> (dates, gone).

    Two different failures, two different messages (DR-0723). "not available"
    means no yt-dlp could be STARTED. A yt-dlp that ran and printed nothing,
    and named no video as gone, was refused or broken, and says so with its own
    last words -- the 2026-10-01 log said "not available" for both.
    """
    args = ytdlp_args(video_ids)
    ran = []
    for cmd in (commands or ytdlp_commands()):
        try:
            r = subprocess.run(cmd + args, capture_output=True, text=True, timeout=time_budget_s)
            out, err, rc = r.stdout or "", r.stderr or "", r.returncode
        except FileNotFoundError:
            continue
        except subprocess.TimeoutExpired as e:
            dec = lambda b: (b.decode("utf-8", "replace") if isinstance(b, bytes) else (b or ""))
            return parse_print_lines(dec(e.stdout)), gone_from_stderr(dec(e.stderr))
        dates, gone = parse_print_lines(out), gone_from_stderr(err)
        if dates or gone or rc == 0:
            return dates, gone
        tail = " | ".join(ln.strip() for ln in err.strip().splitlines()[-2:] if ln.strip())
        ran.append(f"{cmd[0]} exit {rc}: {tail[:200] or '(no stderr)'}")
    if ran:
        raise RuntimeError("yt-dlp ran but printed nothing -- " + "; ".join(ran))
    raise RuntimeError("yt-dlp not available (no yt-dlp could be started)")


def fetch_dates(video_ids, time_budget_s, commands=None):
    """The dates only (see fetch_stamps)."""
    return fetch_stamps(video_ids, time_budget_s, commands)[0]


def load_undateable(path):
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def save_undateable(path, data):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    tmp = str(path) + ".part"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=1, sort_keys=True)
    Path(tmp).replace(path)


def plan_chunk(rows, undateable, chunk):
    """The rows a cycle reads: undated, not already named gone, at most chunk.

    Before DR-0723 every cycle read the same oldest `chunk` rows; when those
    were videos YouTube no longer serves, the rider read them forever and never
    reached a row it could date."""
    pending = [r for r in rows if r.get("video_id") not in undateable]
    return pending[:chunk], len(pending)


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
    checks.append(("metadata read never needs a playable format",
                   "--ignore-no-formats-error" in ytdlp_args(["a1"]) and "--skip-download" in ytdlp_args(["a1"])))
    import tempfile, os
    with tempfile.TemporaryDirectory() as td:
        refused = os.path.join(td, "yt-dlp")
        with open(refused, "w") as fh:
            fh.write("#!/bin/sh\necho 'ERROR: [youtube] a1: Sign in to confirm you are not a bot' >&2\nexit 1\n")
        os.chmod(refused, 0o755)
        try:
            fetch_dates(["a1"], 30, commands=[[refused]])
            msg = ""
        except RuntimeError as e:
            msg = str(e)
        checks.append(("a refused yt-dlp is named refused, with its own words",
                       "ran but printed nothing" in msg and "not a bot" in msg and "not available" not in msg))
        try:
            fetch_dates(["a1"], 30, commands=[[os.path.join(td, "absent")]])
            msg = ""
        except RuntimeError as e:
            msg = str(e)
        checks.append(("a missing yt-dlp is named not available", "not available" in msg))
        answers = os.path.join(td, "yt-dlp-ok")
        with open(answers, "w") as fh:
            fh.write("#!/bin/sh\nprintf 'a1\\t20260930\\n'\n")
        os.chmod(answers, 0o755)
        checks.append(("an answering yt-dlp dates the row",
                       fetch_dates(["a1"], 30, commands=[[answers]]) == {"a1": "2026-09-30"}))
        # The 2026-10-06 failure, replayed: the installed binary is NOT on PATH,
        # and the rider must still find it by its own path. PROVEN-TO-CATCH --
        # with the old candidate list (bare name first and only), this is the
        # exact FileNotFoundError the NAS raised.
        checks.append(("the installed binary is tried before the bare name",
                       ytdlp_commands([answers])[0] == [answers]
                       and ["yt-dlp"] in ytdlp_commands([answers])))
        checks.append(("a path that is not there is left out, not executed",
                       [os.path.join(td, "absent")] not in ytdlp_commands([os.path.join(td, "absent")])))
        checks.append(("a path that is not executable is left out",
                       [__file__] not in ytdlp_commands([__file__])))
        checks.append(("the bare name is still a candidate on a box that has it",
                       ["yt-dlp"] in ytdlp_commands([])))
    checks.append(("a gone video is named; a bot check never is",
                   gone_from_stderr("ERROR: [youtube] g1: Video unavailable. This video has been removed by the uploader\n"
                                    "ERROR: [youtube] p2: Private video. Sign in if you've been granted access\n"
                                    "ERROR: [youtube] b3: Sign in to confirm you're not a bot\n"
                                    "WARNING: [youtube] w4: Video unavailable\n")
                   .keys() == {"g1", "p2"}))
    rows = [{"video_id": v} for v in ("g1", "p2", "a1", "a2", "a3")]
    picked, left = plan_chunk(rows, {"g1": "x", "p2": "y"}, 2)
    checks.append(("a cycle never re-reads a row named gone, and reaches the next ones",
                   [r["video_id"] for r in picked] == ["a1", "a2"] and left == 3))
    with tempfile.TemporaryDirectory() as td:
        mixed = os.path.join(td, "yt-dlp")
        with open(mixed, "w") as fh:
            fh.write("#!/bin/sh\necho 'ERROR: [youtube] g1: Video unavailable' >&2\nexit 1\n")
        os.chmod(mixed, 0o755)
        try:
            got = fetch_stamps(["g1"], 30, commands=[[mixed]])
        except RuntimeError:
            got = None
        checks.append(("a chunk of gone videos is an answer, not a failure", got == ({}, {"g1": "Video unavailable"})))
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
    ap.add_argument("--undateable", default=str(HERE / "state" / "undateable.json"),
                    help="videos yt-dlp names as gone (unavailable/private/removed): never dated, never re-read")
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
        "order": "created_at.asc", "limit": "5000",
    }) or []
    undateable = load_undateable(a.undateable)
    rows, pending_n = plan_chunk(rows, undateable, a.chunk)
    if not rows and undateable and pending_n == 0:
        # Every undated row left is one YouTube no longer serves. Done, never
        # guessed: they stay NULL and are named in the undateable file.
        print(f"choir-dates: backlog drained — every undated row left ({len(undateable)}) is a video "
              f"YouTube no longer serves; named in {a.undateable}, never given a date.")
        if a.done_marker and a.commit:
            Path(a.done_marker).parent.mkdir(parents=True, exist_ok=True)
            Path(a.done_marker).write_text(datetime.now(timezone.utc).isoformat() + "\n")
        emit(True, 0, f"drained; {len(undateable)} undateable")
        return 0
    if not rows:
        print("choir-dates: backlog drained — nothing undated remains.")
        if a.done_marker and a.commit:
            Path(a.done_marker).parent.mkdir(parents=True, exist_ok=True)
            Path(a.done_marker).write_text(datetime.now(timezone.utc).isoformat() + "\n")
        emit(True, 0, "drained")
        return 0

    t0 = time.monotonic()
    try:
        dates, gone = fetch_stamps([r["video_id"] for r in rows], a.time_budget)
    except RuntimeError as e:
        # The tool itself is absent or refused (the docker-backed wrapper could
        # not run). Degraded, not broken — see the exit-3 note below.
        print(f"choir-dates: DEGRADED — {e}", file=sys.stderr)
        emit(False, 0, f"degraded: {e}")
        return 3
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
    new_gone = {v: w for v, w in gone.items() if v not in undateable and v not in dates}
    if new_gone and a.commit:
        stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        for v, w in new_gone.items():
            undateable[v] = f"{stamp} {w}"
        save_undateable(a.undateable, undateable)
    if new_gone:
        print(f"choir-dates: {len(new_gone)} of {len(rows)} are videos YouTube no longer serves "
              f"(e.g. {next(iter(new_gone))}: {next(iter(new_gone.values()))[:80]}); named, never dated.")
    took = round(time.monotonic() - t0, 1)
    mode = "committed" if a.commit else "DRY-RUN (no writes; pass --commit)"
    print(f"choir-dates: {mode} {dated} of {len(rows)} chunk rows in {took}s; backlog continues next cycle.")
    emit(dated > 0, dated, f"{mode}; chunk {len(rows)}; {took}s")
    if dated == 0 and not new_gone:
        # A whole chunk yielding nothing means the page read is blocked or the
        # remainder is genuinely undateable — either way, say so loudly (DR-0076).
        # EXIT 3, NOT 1 (2026-09-23): this is DEGRADED, not broken. The loader
        # is stamp-gated and has its own witness (harvest-health files the
        # incident when the count stops advancing). Returning 1 here made the
        # WHOLE services-sync fleet read red on every 15-minute cycle for a
        # YouTube read that no installer can fix, and a red that never clears
        # teaches everyone to stop reading it. The runner reports exit 3 as
        # DEGRADED by name and keeps the fleet green.
        print(f"choir-dates: DEGRADED — dated 0 of {len(rows)}; page metadata unavailable; NOT marking done.", file=sys.stderr)
        return 3
    return 0


if __name__ == "__main__":
    sys.exit(main())
