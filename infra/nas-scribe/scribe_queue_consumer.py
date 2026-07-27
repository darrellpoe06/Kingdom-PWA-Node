#!/usr/bin/env python3
"""
scribe_queue_consumer.py -- the GPU-side consumer for Scribe recordings:
whisper-queue.jsonl -> whisper-gpu transcript -> nas-llm minutes.

Built under DR-0236 (nothing waits) the same day the queue was born: the
timer-driven class is BUILT now with its three brakes designed in and
proven-to-catch (DR-0068 / DR-0225), ships INACTIVE, and activates only by the
Governor's hand with someone watching. This file is the consumer the ingest
server (scribe_ingest_server.py) queues work for.

Pipeline per queue entry:
  1. POST the assembled recording to whisper-gpu (env WHISPER_URL,
     church-gpu-node/whisper-gpu/server.py) -> transcript.json in the session dir
  2. POST the transcript to nas-llm (env LLM_URL) for minutes -> minutes.md
  3. Mark the session id in processed.jsonl (idempotent -- a re-run skips it)

THE THREE BRAKES (all enforced BEFORE and DURING every run):
  BUDGET       -- MAX_ITEMS_PER_RUN (default 3) and MAX_RUN_SECONDS (default
                  1800). Hitting either ceiling TERMINATES the run cleanly.
  CONCURRENCY  -- a lockfile (consumer.lock). A fire that finds a live lock
                  SKIPS; it never stacks. A stale lock (> LOCK_MAX_AGE_SECONDS)
                  is broken and noted.
  KILL-SWITCH  -- a PAUSED file halts everything, and the consumer WRITES IT
                  ITSELF after MAX_CONSECUTIVE_FAILURES (default 3) failures in
                  a row. It never auto-continues out of a pause; only a human
                  removes the file.

INACTIVE BY DEFAULT: without SCRIBE_CONSUMER_ACTIVE=1 in the environment the
consumer exits immediately reporting inactive. Shipping this file does NOT
start it (DR-0225); scheduling it (cron/systemd timer) is the his-hand
activation step, taken with the standing witnesses live.

Run (activation is the Governor's step, not the merge's):
    SCRIBE_CONSUMER_ACTIVE=1 SCRIBE_DATA=/data/poetech-scribe \
      WHISPER_URL=http://127.0.0.1:8771 LLM_URL=http://127.0.0.1:8772 \
      python3 scribe_queue_consumer.py
"""
import json
import os
import time

DATA = os.environ.get("SCRIBE_DATA", "/data/poetech-scribe")
MAX_ITEMS_PER_RUN = int(os.environ.get("SCRIBE_MAX_ITEMS_PER_RUN", "3"))
MAX_RUN_SECONDS = int(os.environ.get("SCRIBE_MAX_RUN_SECONDS", "1800"))
LOCK_MAX_AGE_SECONDS = int(os.environ.get("SCRIBE_LOCK_MAX_AGE", "3600"))
MAX_CONSECUTIVE_FAILURES = int(os.environ.get("SCRIBE_MAX_FAILURES", "3"))


# --- pure helpers (unit-tested; no I/O beyond the paths passed in) -----------

def is_active(env=None):
    """Brake 0 -- inactive by default (DR-0225). Only an explicit '1' activates."""
    env = env if env is not None else os.environ
    return env.get("SCRIBE_CONSUMER_ACTIVE", "") == "1"


def paused_path(data_dir):
    return os.path.join(data_dir, "PAUSED")


def is_paused(data_dir):
    """KILL-SWITCH read side: a PAUSED file halts everything."""
    return os.path.isfile(paused_path(data_dir))


def pause(data_dir, reason):
    """KILL-SWITCH write side: the consumer pauses ITSELF; never auto-resumes."""
    with open(paused_path(data_dir), "w", encoding="utf-8") as f:
        json.dump({"reason": reason, "pausedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}, f)


def lock_path(data_dir):
    return os.path.join(data_dir, "consumer.lock")


def acquire_lock(data_dir, now=None):
    """CONCURRENCY brake: single instance. Returns True if acquired.
    A live lock -> SKIP (False). A stale lock (older than LOCK_MAX_AGE_SECONDS)
    is broken -- a crashed run must not wedge the queue forever."""
    now = now if now is not None else time.time()
    p = lock_path(data_dir)
    if os.path.isfile(p):
        try:
            age = now - os.path.getmtime(p)
        except OSError:
            age = 0
        if age <= LOCK_MAX_AGE_SECONDS:
            return False
        os.remove(p)  # stale -- break it and take over
    with open(p, "w", encoding="utf-8") as f:
        f.write(str(os.getpid()))
    return True


def release_lock(data_dir):
    try:
        os.remove(lock_path(data_dir))
    except OSError:
        pass


class RunBudget:
    """BUDGET brake: items + wall-clock. exceeded() flips permanently once hit."""

    def __init__(self, max_items=MAX_ITEMS_PER_RUN, max_seconds=MAX_RUN_SECONDS, clock=time.monotonic):
        self.max_items = max_items
        self.max_seconds = max_seconds
        self._clock = clock
        self._started = clock()
        self.items_done = 0

    def note_item(self):
        self.items_done += 1

    def exceeded(self):
        if self.items_done >= self.max_items:
            return "item-budget"
        if (self._clock() - self._started) >= self.max_seconds:
            return "time-budget"
        return ""


def read_queue(data_dir):
    """The append-only queue the ingest server writes. Bad lines are skipped, never fatal."""
    path = os.path.join(data_dir, "whisper-queue.jsonl")
    entries = []
    if not os.path.isfile(path):
        return entries
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                e = json.loads(line)
                if e.get("sessionId"):
                    entries.append(e)
            except json.JSONDecodeError:
                continue
    return entries


def read_processed(data_dir):
    path = os.path.join(data_dir, "processed.jsonl")
    done = set()
    if not os.path.isfile(path):
        return done
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                done.add(json.loads(line).get("sessionId"))
            except json.JSONDecodeError:
                continue
    return done


def mark_processed(data_dir, session_id, status):
    with open(os.path.join(data_dir, "processed.jsonl"), "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId": session_id, "status": status,
                            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}) + "\n")


def unprocessed(queue, done):
    """Idempotent selection: only entries never processed, oldest first, deduped."""
    seen = set()
    out = []
    for e in queue:
        sid = e.get("sessionId")
        if sid in done or sid in seen:
            continue
        seen.add(sid)
        out.append(e)
    return out


def run_once(data_dir=DATA, transcribe=None, summarize=None, env=None, clock=time.monotonic):
    """One consumer run under all three brakes. transcribe/summarize are
    injectable (the tests prove the brakes without a GPU). Returns a report dict
    -- the honest record of what the run did and why it stopped (DR-0076)."""
    report = {"ran": False, "processed": [], "failed": [], "stopped": ""}
    if not is_active(env):
        report["stopped"] = "inactive"
        return report
    if is_paused(data_dir):
        report["stopped"] = "paused"
        return report
    if not acquire_lock(data_dir):
        report["stopped"] = "locked-skip"
        return report
    try:
        report["ran"] = True
        budget = RunBudget(clock=clock)
        consecutive_failures = 0
        for entry in unprocessed(read_queue(data_dir), read_processed(data_dir)):
            why = budget.exceeded()
            if why:
                report["stopped"] = why
                break
            sid = entry["sessionId"]
            try:
                transcript = transcribe(entry) if transcribe else None
                if transcript is None:
                    raise RuntimeError("no-transcriber")
                if summarize:
                    summarize(entry, transcript)
                mark_processed(data_dir, sid, "ok")
                report["processed"].append(sid)
                consecutive_failures = 0
            except Exception as e:  # try-catch every external I/O (PERPETUAL-PIPELINE-HEALTH)
                report["failed"].append({"sessionId": sid, "error": str(e)})
                consecutive_failures += 1
                if consecutive_failures >= MAX_CONSECUTIVE_FAILURES:
                    pause(data_dir, f"{consecutive_failures} consecutive failures; last: {e}")
                    report["stopped"] = "auto-paused"
                    break
            budget.note_item()
        if not report["stopped"]:
            report["stopped"] = "queue-drained"
        return report
    finally:
        release_lock(data_dir)


def _default_transcribe(entry):
    """POST the recording to whisper-gpu. Import-light so tests never need requests."""
    import urllib.request
    url = os.environ.get("WHISPER_URL", "http://127.0.0.1:8771") + "/transcribe"
    with open(entry["path"], "rb") as f:
        body = f.read()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/octet-stream"})
    with urllib.request.urlopen(req, timeout=600) as res:
        transcript = json.loads(res.read().decode("utf-8"))
    sdir = os.path.dirname(entry["path"])
    with open(os.path.join(sdir, "transcript.json"), "w", encoding="utf-8") as f:
        json.dump(transcript, f, indent=2)
    return transcript


def _default_summarize(entry, transcript):
    """POST the transcript to nas-llm for minutes; best-effort (a missing LLM
    never loses the transcript)."""
    import urllib.request
    url = os.environ.get("LLM_URL", "")
    if not url:
        return
    prompt = ("Write faithful meeting minutes (decisions, actions, who said what) "
              "from this transcript:\n" + json.dumps(transcript)[:24000])
    req = urllib.request.Request(url + "/generate",
                                 data=json.dumps({"prompt": prompt}).encode("utf-8"),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as res:
        minutes = json.loads(res.read().decode("utf-8")).get("text", "")
    sdir = os.path.dirname(entry["path"])
    with open(os.path.join(sdir, "minutes.md"), "w", encoding="utf-8") as f:
        f.write(minutes)


if __name__ == "__main__":
    out = run_once(transcribe=_default_transcribe, summarize=_default_summarize)
    print(json.dumps(out, indent=2))
