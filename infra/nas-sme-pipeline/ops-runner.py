#!/usr/bin/env python3
# =============================================================================
# ops-runner.py -- the NAS half of the app-first operations queue (DR-0088)
# =============================================================================
# The PoeTech app is the front door for operations; the NAS is plumbing. A
# steward (owner/admin) taps a button in the app's Admin card, which INSERTs a
# row into ops_commands (migration 0068). This runner polls that table over the
# Supabase REST API (outbound-only -- the cloud can never reach the LAN, P18),
# executes the whitelisted job, and streams status + log tail back into the
# row. The app watches the row move queued -> running -> done live via
# realtime. The user never opens a NAS shell to operate the system again.
#
# THE WHITELIST IS HERE, NOT IN THE DATABASE. A command row names a job; only
# jobs in JOBS below ever execute, each mapped to a FIXED argv array with
# numeric params clamped (never shell strings, never user-supplied paths).
# An unknown job is marked status='skipped'. Adding a job = a reviewed code
# change to this file.
#
# THREE BRAKES (CLAUDE.md autonomous-automation rule):
#   (1) Budget      -- at most MAX_COMMANDS_PER_CYCLE per poll; each command
#                      runs under a hard subprocess timeout; param caps below.
#   (2) Lock        -- single-instance lock file; a second runner SKIPS.
#   (3) Kill-switch -- 3 consecutive RUNNER failures (exceptions/timeouts, not
#                      a job's honest non-zero exit) write out/.ops-runner-paused
#                      and the runner refuses to start until a human deletes it.
#                      A 'resume-ops' is deliberately NOT a queue job: un-pausing
#                      the pauser itself requires a human at the NAS.
#
# SHIPS INACTIVE. Nothing here autostarts. Arm it once (with someone watching)
# as a DSM Task Scheduler "triggered task" on Boot-up, user dpoe:
#     python3 /volume1/PoeTech/ops-runner.py --loop
# or run --once from cron/scheduler at whatever cadence you like. After that
# one-time arming, all triggering happens from inside the app.
#
# Requires: Python 3 stdlib only.
# Secrets:  same file as the loaders -- /volume1/PoeTech/secrets/supabase.json
# =============================================================================
import argparse
import json
import os
import subprocess
import sys
import time
import urllib.parse
import urllib.request

_DIR = os.path.dirname(os.path.abspath(__file__))
_OUT_DIR = os.path.join(_DIR, "out")
LOCK_PATH = os.path.join(_OUT_DIR, ".ops-runner.lock")
PAUSE_FLAG = os.path.join(_OUT_DIR, ".ops-runner-paused")
FAIL_COUNT = os.path.join(_OUT_DIR, ".ops-runner-failures")
DEFAULT_SECRETS = "/volume1/PoeTech/secrets/supabase.json"

# The transcript loader lives next to this file in the repo; on the NAS both
# are dropped into /volume1/PoeTech (see bootstrap note in the PR).
LOADER_CANDIDATES = (
    os.path.join(_DIR, "load-transcripts.py"),
    "/volume1/PoeTech/load-transcripts-fixed.py",
    "/volume1/PoeTech/load-transcripts.py",
)
LOADER_PAUSE_FLAG_CANDIDATES = (
    os.path.join(_OUT_DIR, ".transcripts-paused"),
    "/volume1/PoeTech/out/.transcripts-paused",
)
LOADER_BLOCKED_COUNT_CANDIDATES = (
    os.path.join(_OUT_DIR, ".transcripts-blocked-runs"),
    "/volume1/PoeTech/out/.transcripts-blocked-runs",
)

MAX_COMMANDS_PER_CYCLE = 3
COMMAND_TIMEOUT_S = 3600
POLL_INTERVAL_S = 60
LOG_TAIL_CHARS = 4000


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def _clamp_int(value, lo, hi, default):
    try:
        return max(lo, min(hi, int(value)))
    except (TypeError, ValueError):
        return default


def _loader_path():
    for p in LOADER_CANDIDATES:
        if os.path.exists(p):
            return p
    return None


# --- job whitelist -----------------------------------------------------------
# Each handler returns (status, log_text, result_dict). Params arrive as a
# dict from the command row's jsonb; every value is clamped/validated here.

def job_transcript_backfill(params):
    """Run the transcript loader once with a bounded budget."""
    loader = _loader_path()
    if not loader:
        return "error", "loader script not found on the NAS (expected load-transcripts[-fixed].py)", {"exit": None}
    max_videos = _clamp_int(params.get("max"), 1, 25, 10)          # brake: <= 25/run from the app
    sleep_min = _clamp_int(params.get("sleep_min"), 1, 120, 20)
    sleep_max = _clamp_int(params.get("sleep_max"), sleep_min, 300, max(60, sleep_min))
    argv = [sys.executable or "python3", loader,
            "--slug", "colg",
            "--max", str(max_videos),
            "--sleep-min", str(sleep_min),
            "--sleep-max", str(sleep_max)]
    proc = subprocess.run(argv, capture_output=True, text=True, timeout=COMMAND_TIMEOUT_S)
    out = ((proc.stdout or "") + "\n" + (proc.stderr or "")).strip()
    status = "done" if proc.returncode == 0 else "error"
    return status, out[-LOG_TAIL_CHARS:], {"exit": proc.returncode, "max": max_videos}


def job_resume_transcripts(params):
    """Clear the transcript loader's kill-switch (after an IP block clears)."""
    removed = []
    for p in LOADER_PAUSE_FLAG_CANDIDATES + LOADER_BLOCKED_COUNT_CANDIDATES:
        try:
            os.remove(p)
            removed.append(p)
        except OSError:
            pass
    if removed:
        return "done", "cleared: " + ", ".join(removed), {"cleared": len(removed)}
    return "done", "loader was not paused (no flags found)", {"cleared": 0}


JOBS = {
    "transcript-backfill": job_transcript_backfill,
    "resume-transcripts": job_resume_transcripts,
}


# --- secrets + REST (mirrors load-transcripts.py) -----------------------------

def load_secrets(path):
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if url and key:
        return url.rstrip("/"), key
    if path and os.path.exists(path):
        with open(path, "r", encoding="utf-8") as fh:
            d = json.load(fh)
        url = (d.get("url") or "").rstrip("/")
        key = d.get("service_key") or d.get("service_role_key")
        if url and key:
            return url, key
    log(f"ERROR: no Supabase credentials (env or {path}).")
    sys.exit(2)


def rest(url, key, method, path, body=None, extra_headers=None):
    headers = {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url + "/rest/v1/" + path, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=45) as resp:
        raw = resp.read().decode("utf-8", "ignore")
    return json.loads(raw) if raw.strip() else None


def _isonow():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


# --- brakes -------------------------------------------------------------------

def acquire_lock():
    os.makedirs(_OUT_DIR, exist_ok=True)
    if os.path.exists(LOCK_PATH):
        try:
            age = time.time() - os.path.getmtime(LOCK_PATH)
        except OSError:
            age = 0
        if age < 2 * POLL_INTERVAL_S + COMMAND_TIMEOUT_S:
            log(f"Another ops-runner holds the lock ({int(age)}s old). Skipping.")
            sys.exit(0)
        log("Stale lock; taking over.")
    with open(LOCK_PATH, "w", encoding="utf-8") as fh:
        fh.write(str(os.getpid()))


def touch_lock():
    try:
        os.utime(LOCK_PATH, None)
    except OSError:
        pass


def release_lock():
    try:
        os.remove(LOCK_PATH)
    except OSError:
        pass


def _consecutive_failures():
    try:
        with open(FAIL_COUNT, "r", encoding="utf-8") as fh:
            return int(fh.read().strip() or 0)
    except (OSError, ValueError):
        return 0


def record_runner_failure(reason):
    n = _consecutive_failures() + 1
    os.makedirs(_OUT_DIR, exist_ok=True)
    with open(FAIL_COUNT, "w", encoding="utf-8") as fh:
        fh.write(str(n))
    log(f"Runner failure #{n} in a row: {reason}")
    if n >= 3:
        with open(PAUSE_FLAG, "w", encoding="utf-8") as fh:
            fh.write(f"auto-paused after {n} consecutive runner failures: {reason}\n")
        log(f"KILL-SWITCH: {n} consecutive runner failures -> auto-paused.")
        log(f"To resume: rm {PAUSE_FLAG}")


def clear_runner_failures():
    try:
        os.remove(FAIL_COUNT)
    except OSError:
        pass


# --- one poll cycle ------------------------------------------------------------

def run_cycle(url, key):
    """Claim and execute up to MAX_COMMANDS_PER_CYCLE queued commands."""
    rows = rest(url, key, "GET",
                "ops_commands?status=eq.queued&order=created_at.asc&limit="
                + str(MAX_COMMANDS_PER_CYCLE)) or []
    for row in rows:
        cid = row["id"]
        job = (row.get("job") or "").strip()
        params = row.get("params") if isinstance(row.get("params"), dict) else {}

        # Claim: only flip queued -> running (a concurrent runner loses the race
        # harmlessly -- PostgREST returns the updated row only on a real match).
        claimed = rest(url, key, "PATCH",
                       f"ops_commands?id=eq.{cid}&status=eq.queued",
                       body={"status": "running", "started_at": _isonow()},
                       extra_headers={"Prefer": "return=representation"})
        if not claimed:
            continue

        handler = JOBS.get(job)
        if not handler:
            rest(url, key, "PATCH", f"ops_commands?id=eq.{cid}",
                 body={"status": "skipped", "finished_at": _isonow(),
                       "log": f"unknown job '{job}' -- not in the runner whitelist"})
            log(f"[{cid[:8]}] skipped unknown job '{job}'")
            continue

        log(f"[{cid[:8]}] running {job} {params}")
        try:
            status, log_text, result = handler(params)
        except subprocess.TimeoutExpired:
            status, log_text, result = "error", f"timed out after {COMMAND_TIMEOUT_S}s", {"exit": None}
        except Exception as e:  # noqa: BLE001 -- recorded to the row, never crashes the loop
            status, log_text, result = "error", f"runner exception: {type(e).__name__}: {e}", {"exit": None}
        rest(url, key, "PATCH", f"ops_commands?id=eq.{cid}",
             body={"status": status, "finished_at": _isonow(),
                   "log": log_text, "result": result})
        log(f"[{cid[:8]}] {job} -> {status}")
        touch_lock()
    return len(rows)


def main():
    ap = argparse.ArgumentParser(description="PoeTech ops-runner: execute app-queued commands on the NAS (DR-0088).")
    ap.add_argument("--secrets", default=DEFAULT_SECRETS)
    ap.add_argument("--once", action="store_true", help="run one poll cycle and exit")
    ap.add_argument("--loop", action="store_true", help="poll forever (arm via DSM boot task)")
    ap.add_argument("--poll", type=int, default=POLL_INTERVAL_S, help="seconds between polls in --loop mode")
    args = ap.parse_args()

    if os.path.exists(PAUSE_FLAG):
        log(f"PAUSED: {PAUSE_FLAG} exists (kill-switch). Resume with: rm {PAUSE_FLAG}")
        sys.exit(4)
    if not (args.once or args.loop):
        log("Pick a mode: --once (single cycle) or --loop (poll forever).")
        sys.exit(2)

    url, key = load_secrets(args.secrets)
    acquire_lock()
    try:
        while True:
            try:
                run_cycle(url, key)
                clear_runner_failures()
            except Exception as e:  # noqa: BLE001 -- count, maybe pause, keep honest
                record_runner_failure(f"{type(e).__name__}: {e}")
                if os.path.exists(PAUSE_FLAG):
                    sys.exit(4)
            if args.once:
                break
            touch_lock()
            time.sleep(max(15, args.poll))
    finally:
        release_lock()


if __name__ == "__main__":
    main()
