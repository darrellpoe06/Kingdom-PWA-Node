#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""stream_length_sync -- every service video keeps its length (DR-1045).

WHY (2026-10-15). Darrell: "the YouTube streams on Sunday can be used to see if
we as a team kept the proper timetable... did we keep the time within our
agreed upon constraints and how well do we do weekly according to the data
driven information?" and "Did we go over or under time based on the video stream
that day?" Measured that morning (church-video-witness run 38740116010): the
10-11-2026 service is on record, but nothing in the database holds how long
the stream ran, so the question could not be answered.

THE ROAD. Exactly choir_dates_sync.py's: yt-dlp reads each video's own page from
the NAS's residential address (CI runners are bot-checked and the stored
Data-API key is rejected), and the row is PATCHed through youtube_load.py's REST
helpers on the database the app reads (DR-0442). Only rows whose stream_seconds
IS NULL are touched, and the PATCH re-asserts stream_seconds=is.null, so a
length is written once and never overwritten.

THE WAY (DR-0083): plain Python 3, stdlib only, DRY-RUN BY DEFAULT (the
installer passes --commit). BUDGETED (DR-0248: budget + lock): at most --chunk
videos and --time-budget seconds per run; the services-sync runner owns the
lock and the outer timeout. Newest services first, so each new Sunday and
Wednesday is read on the first cycle after its row exists; the back catalogue
since --since drains behind it.

TRUTHFUL-OR-ABSENT (DR-0076): the length is what YouTube reports for the video.
A live stream's length includes whatever ran before the first line and after
the benediction, so the app reads it as an UPPER BOUND on the service, never as
its clocked length. A video yt-dlp cannot read stays NULL and is counted; a
video YouTube no longer serves is named in --unreadable and never re-read.

Usage (NAS, via infra/church-media-golive/stream_length_install.sh):
  python3 stream_length_sync.py                 # dry-run report
  python3 stream_length_sync.py --commit
  python3 stream_length_sync.py --selftest      # pure-logic gate (CI)
"""
import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

RUN_EVENTS = HERE / "events" / "events.jsonl"
MAX_SECONDS = 86400  # mirrors choir_sermons_stream_seconds_sane (0295)


# --- pure logic (gated by --selftest) -----------------------------------------

def parse_length_lines(stdout):
    """'id<TAB>duration<TAB>release_timestamp' lines -> {id: {seconds, started_at}}.

    duration is whole or fractional seconds; a missing ('NA'), zero, negative or
    absurd one is dropped (never guessed). release_timestamp is epoch seconds
    for a stream's actual start, 'NA' for an upload that was never live."""
    out = {}
    for line in (stdout or "").splitlines():
        parts = line.strip().split("\t")
        if len(parts) != 3 or not parts[0]:
            continue
        try:
            secs = int(round(float(parts[1])))
        except (TypeError, ValueError):
            continue
        if secs <= 0 or secs >= MAX_SECONDS:
            continue
        started = None
        try:
            if parts[2] and parts[2] != "NA":
                started = datetime.fromtimestamp(float(parts[2]), tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        except (TypeError, ValueError, OverflowError, OSError):
            started = None
        out[parts[0]] = {"seconds": secs, "started_at": started}
    return out


def patch_for(reading, read_at):
    """The PATCH body for one read video."""
    body = {"stream_seconds": reading["seconds"], "stream_read_at": read_at}
    if reading.get("started_at"):
        body["stream_started_at"] = reading["started_at"]
    return body


def ytdlp_args(video_ids):
    """The read-only metadata call (choir_dates_sync's flags: no download, no
    playable format needed, keep going past a bad video)."""
    args = ["--skip-download", "--no-warnings", "--ignore-errors", "--ignore-no-formats-error",
            "--print", "%(id)s\t%(duration)s\t%(release_timestamp)s"]
    return args + [f"https://www.youtube.com/watch?v={v}" for v in video_ids]


def plan_chunk(rows, unreadable, chunk):
    """The rows a cycle reads: no length yet, not named unreadable, at most chunk."""
    pending = [r for r in rows if r.get("video_id") and r.get("video_id") not in unreadable]
    return pending[:chunk], len(pending)


def say_length(seconds):
    """1:32:10 for a log line a person reads."""
    s = int(seconds)
    return f"{s // 3600}:{(s % 3600) // 60:02d}:{s % 60:02d}"


# --- yt-dlp page read (NAS residential IP) ------------------------------------

def fetch_lengths(video_ids, time_budget_s, commands=None):
    """One yt-dlp invocation over the chunk -> (lengths, gone). The binary lookup
    and the gone-vs-refused split are choir_dates_sync's, reused, not copied."""
    from choir_dates_sync import ytdlp_commands, gone_from_stderr
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
            return parse_length_lines(dec(e.stdout)), gone_from_stderr(dec(e.stderr))
        lengths, gone = parse_length_lines(out), gone_from_stderr(err)
        if lengths or gone or rc == 0:
            return lengths, gone
        tail = " | ".join(ln.strip() for ln in err.strip().splitlines()[-2:] if ln.strip())
        ran.append(f"{cmd[0]} exit {rc}: {tail[:200] or '(no stderr)'}")
    if ran:
        raise RuntimeError("yt-dlp ran but printed nothing -- " + "; ".join(ran))
    raise RuntimeError("yt-dlp not available (no yt-dlp could be started)")


def load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def save_json(path, data):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    tmp = str(path) + ".part"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=1, sort_keys=True)
    Path(tmp).replace(path)


def emit(ok, processed, note):
    RUN_EVENTS.parent.mkdir(parents=True, exist_ok=True)
    with RUN_EVENTS.open("a") as ev:
        ev.write(json.dumps({"at": datetime.now(timezone.utc).isoformat(),
                             "script": "stream_length_sync", "ok": ok,
                             "processed": processed, "note": note}) + "\n")


# --- selftest (CI merge gate) --------------------------------------------------

def selftest():
    import os
    import tempfile
    checks = []
    got = parse_length_lines(
        "skY8rJWxoZ4\t5530\t1791734400\n"        # a live Sunday stream
        "up1\t2710.6\tNA\n"                      # an upload, never live
        "na1\tNA\t1760198400\n"                  # no length: dropped
        "zero\t0\tNA\nhuge\t90000\tNA\n"         # absurd: dropped
        "noise line\n")
    checks.append(("a live stream keeps its length and its real start",
                   got.get("skY8rJWxoZ4") == {"seconds": 5530, "started_at": "2026-10-11T16:00:00Z"}))
    checks.append(("an upload keeps its length with no start", got.get("up1") == {"seconds": 2711, "started_at": None}))
    checks.append(("a missing, zero or absurd length is never written",
                   set(got) == {"skY8rJWxoZ4", "up1"}))
    checks.append(("the patch carries the length, the read time, and the start only when known",
                   patch_for({"seconds": 5530, "started_at": None}, "T") == {"stream_seconds": 5530, "stream_read_at": "T"}
                   and patch_for({"seconds": 1, "started_at": "S"}, "T")["stream_started_at"] == "S"))
    checks.append(("the read never downloads and never needs a playable format",
                   "--skip-download" in ytdlp_args(["a"]) and "--ignore-no-formats-error" in ytdlp_args(["a"])
                   and "%(duration)s" in " ".join(ytdlp_args(["a"]))))
    rows = [{"video_id": v} for v in ("g1", "a1", "a2", "a3")] + [{"video_id": None}]
    picked, left = plan_chunk(rows, {"g1": "gone"}, 2)
    checks.append(("a cycle skips the unreadable and reaches the next ones",
                   [r["video_id"] for r in picked] == ["a1", "a2"] and left == 3))
    checks.append(("a length reads as hours, minutes, seconds", say_length(5530) == "1:32:10"))
    with tempfile.TemporaryDirectory() as td:
        answers = os.path.join(td, "yt-dlp-ok")
        with open(answers, "w") as fh:
            fh.write("#!/bin/sh\nprintf 'a1\\t4800\\tNA\\n'\n")
        os.chmod(answers, 0o755)
        checks.append(("an answering yt-dlp gives the length",
                       fetch_lengths(["a1"], 30, commands=[[answers]]) == ({"a1": {"seconds": 4800, "started_at": None}}, {})))
        refused = os.path.join(td, "yt-dlp")
        with open(refused, "w") as fh:
            fh.write("#!/bin/sh\necho 'ERROR: [youtube] a1: Sign in to confirm you are not a bot' >&2\nexit 1\n")
        os.chmod(refused, 0o755)
        try:
            fetch_lengths(["a1"], 30, commands=[[refused]])
            msg = ""
        except RuntimeError as e:
            msg = str(e)
        checks.append(("a refused yt-dlp is named refused, with its own words",
                       "ran but printed nothing" in msg and "not a bot" in msg))
        gone = os.path.join(td, "yt-dlp-gone")
        with open(gone, "w") as fh:
            fh.write("#!/bin/sh\necho 'ERROR: [youtube] g1: Video unavailable' >&2\nexit 1\n")
        os.chmod(gone, 0o755)
        checks.append(("a gone video is an answer, not a failure",
                       fetch_lengths(["g1"], 30, commands=[[gone]]) == ({}, {"g1": "Video unavailable"})))
    ok = all(passed for _, passed in checks)
    for name, passed in checks:
        print(("PASS" if passed else "FAIL"), "-", name)
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", default="colg")
    ap.add_argument("--secrets", default="/volume1/PoeTech/secrets/supabase.json")
    ap.add_argument("--since", default="2026-01-01", help="oldest service date to read (newest first)")
    ap.add_argument("--chunk", type=int, default=40)
    ap.add_argument("--time-budget", type=int, default=240)
    ap.add_argument("--commit", action="store_true")
    ap.add_argument("--unreadable", default=str(HERE / "state" / "stream-unreadable.json"),
                    help="videos yt-dlp names as gone: never given a length, never re-read")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()

    from youtube_load import load_secrets, _req, resolve_instance
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
        "instance_id": f"eq.{inst}", "stream_seconds": "is.null", "video_id": "not.is.null",
        "service_date": f"gte.{a.since}", "select": "id,video_id,service_date",
        "order": "service_date.desc", "limit": "2000",
    }) or []
    unreadable = load_json(a.unreadable)
    rows, pending_n = plan_chunk(rows, unreadable, a.chunk)
    if not rows:
        print(f"stream-length: every service video since {a.since} has its length "
              f"({len(unreadable)} named unreadable).")
        emit(True, 0, "current")
        return 0

    t0 = time.monotonic()
    try:
        lengths, gone = fetch_lengths([r["video_id"] for r in rows], a.time_budget)
    except RuntimeError as e:
        print(f"stream-length: {e}", file=sys.stderr)
        emit(False, 0, str(e)[:200])
        return 1

    read_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    written = 0
    for r in rows:
        reading = lengths.get(r["video_id"])
        if not reading:
            continue
        line = f"  {r.get('service_date')}  {r['video_id']}  {say_length(reading['seconds'])}"
        if a.commit:
            _req(url, key, "PATCH", "choir_sermons",
                 params={"id": f"eq.{r['id']}", "stream_seconds": "is.null"},
                 body=patch_for(reading, read_at))
            written += 1
            print(line + "  written")
        else:
            print(line + "  (dry run)")
    if gone and a.commit:
        unreadable.update(gone)
        save_json(a.unreadable, unreadable)
    missed = len(rows) - len(lengths) - len(gone)
    note = (f"{len(lengths)} read, {written} written, {len(gone)} gone, {missed} unanswered, "
            f"{max(0, pending_n - len(rows))} still to read, {time.monotonic() - t0:.0f}s")
    print("stream-length: " + note)
    # Nothing read while work remains is RED, so the runner's ntfy sees it.
    ok = bool(lengths) or bool(gone)
    emit(ok, written, note)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
