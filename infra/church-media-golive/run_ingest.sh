#!/bin/sh
# =============================================================================
# run_ingest.sh -- one braked, single-shot, DETERMINISTIC media-ingest run.
# =============================================================================
# THE FIX FOR LIVE RELAY (Darrell 2026-07-14): "it takes you too long to respond
# in live situations ... no help if you're not pre-setup to execute
# deterministically." Correct. The value is NOT a human-in-the-loop typing
# commands during a service -- it is THIS: pre-armed on an always-on church box
# (DSM Task Scheduler / cron / the church-runner), so after every service the
# recordings + the YouTube streams archive themselves into The Word with NOBODY
# touching it. No back-and-forth, no one standing in the building.
#
# It chains the deterministic loaders already in this dir, in order, each
# idempotent so a re-run is safe and a run always advances:
#   1. youtube_index.py  -- list the channel (yt-dlp, NO API key)         -> index
#   2. youtube_load.py   -- upsert videos into choir_sermons (dated,
#                           conference/funeral classified)                -> The Word
#   3. prep_from_transcript.py -- points+scriptures for the email-less
#                           messages, from the transcript (scriptures
#                           deterministic; points via Ari if configured)  -> outline
#
# THREE BRAKES (CLAUDE.md "Autonomous Automation Requires Three Brakes", DR-0083),
# same contract as infra/church-runner/brakes.sh -- this is the timer-driven,
# self-triggering class, so it SHIPS INERT and never self-arms:
#   1. KILL-SWITCH  -- state/KILL_SWITCH present => INERT. Shipped PRESENT.
#   2. SINGLE-FLIGHT LOCK -- mkdir lock; a run that finds it held SKIPS, never
#                            stacks on a prior run.
#   3. BUDGET (wall-clock) -- INGEST_TIMEOUT_SEC caps the whole run; an overrun
#                            is killed, not left to spin.
# ARMED only when: KILL_SWITCH removed AND state/INGEST_ARMED present. WRITES to
# the DB only when state/INGEST_COMMIT is also present (else every loader stays in
# its dry-run default -- a safe rehearsal that changes nothing).
#
# Run-state to events.jsonl beside the script. POSIX sh, ASCII only. No LLM is
# summoned here; the Ari points step is a plain HTTP call inside prep_from_transcript
# and only fires if ARI_POINTS_URL is set -- itself off by default.
#
# Usage (on an always-on church node, fired by the scheduler):
#   sh run_ingest.sh
# Arm it (with someone watching, per the three-brakes rule):
#   rm -f state/KILL_SWITCH ; touch state/INGEST_ARMED ; touch state/INGEST_COMMIT
# Disarm / stop instantly:
#   touch state/KILL_SWITCH
# =============================================================================
set -eu

HERE="$(cd "$(dirname "$0")" && pwd)"
STATE_DIR="${STATE_DIR:-$HERE/state}"
EVENTS_DIR="${EVENTS_DIR:-$HERE/events}"
KILL_SWITCH="$STATE_DIR/KILL_SWITCH"
ARMED_FILE="$STATE_DIR/INGEST_ARMED"
COMMIT_FILE="$STATE_DIR/INGEST_COMMIT"
LOCK_DIR="$STATE_DIR/ingest.lock"

CHANNEL_URL="${CHANNEL_URL:-https://www.youtube.com/@thelovecorner/videos}"
SLUG="${SLUG:-colg}"
INGEST_TIMEOUT_SEC="${INGEST_TIMEOUT_SEC:-1800}"   # wall-clock budget: 30 min
PY="${PY:-python3}"

mkdir -p "$STATE_DIR" "$EVENTS_DIR"

_log() {
  printf '{"ts":"%s","runner":"media-ingest","event":"%s","detail":"%s"}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$2" >> "$EVENTS_DIR/events.jsonl" 2>/dev/null || true
}

# --- BRAKE 1: kill-switch (shipped present) + armed gate ----------------------
if [ -f "$KILL_SWITCH" ]; then
  _log "inert" "kill-switch engaged"
  exit 0
fi
if [ ! -f "$ARMED_FILE" ]; then
  _log "inert" "not armed (no INGEST_ARMED)"
  exit 0
fi

# --- BRAKE 2: single-flight lock (mkdir is atomic) ---------------------------
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  _log "skip" "single-flight lock held by another run"
  exit 0
fi
echo "$$" > "$LOCK_DIR/pid" 2>/dev/null || true
trap 'rm -rf "$LOCK_DIR" 2>/dev/null || true' EXIT INT TERM

# WRITE only when explicitly committed; otherwise every step is a dry-run rehearsal.
COMMIT_ARG=""
MODE="dry-run"
if [ -f "$COMMIT_FILE" ]; then COMMIT_ARG="--commit"; MODE="commit"; fi
_log "go" "armed; mode=$MODE; budget=${INGEST_TIMEOUT_SEC}s"

# --- BRAKE 3: wall-clock budget wraps the whole chain ------------------------
# `timeout` if present (coreutils / busybox); else run bare (scheduler is the
# outer clock and the single-shot design cannot loop).
_run() {
  if command -v timeout >/dev/null 2>&1; then
    timeout "$INGEST_TIMEOUT_SEC" "$@"
  else
    "$@"
  fi
}

INDEX="$HERE/yt-index.json"
rc=0

# Step 1 -- enumerate the channel (no API key). A failure here aborts the chain
# (nothing to load), but the lock still releases and the next fire retries.
if _run "$PY" "$HERE/youtube_index.py" "$CHANNEL_URL" --out "$INDEX"; then
  _log "index_ok" "$INDEX"
else
  rc=$?
  _log "index_fail" "youtube_index rc=$rc (no network / no yt-dlp?); aborting chain"
  exit 0
fi

# Step 2 -- archive the videos (idempotent upsert).
if _run "$PY" "$HERE/youtube_load.py" "$INDEX" --slug "$SLUG" $COMMIT_ARG; then
  _log "load_ok" "mode=$MODE"
else
  rc=$?; _log "load_fail" "youtube_load rc=$rc"
fi

# Step 3 -- fill points+scriptures for the email-less messages from the transcript.
# Best-effort: a failure here never blocks the archive that already landed.
if _run "$PY" "$HERE/prep_from_transcript.py" --slug "$SLUG" $COMMIT_ARG; then
  _log "prep_ok" "mode=$MODE"
else
  rc=$?; _log "prep_fail" "prep_from_transcript rc=$rc"
fi

_log "done" "mode=$MODE"
# Lock released by the EXIT trap.
exit 0
