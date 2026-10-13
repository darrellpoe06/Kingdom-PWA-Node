#!/bin/sh
# =============================================================================
# run_ingest.sh -- one single-shot, DETERMINISTIC media-ingest run that RUNS.
# =============================================================================
# Darrell 2026-07-14: "there should be no breaks other than the 5700 plus checks
# while building our processes -- it goes straight to production... you did
# nothing today." Correct. The first cut shipped INERT behind an arming ceremony
# (KILL_SWITCH present + INGEST_ARMED + INGEST_COMMIT), so it archived nothing --
# the brakes became the failure. This version RUNS when fired and writes to
# production by default. The tests are the gate (DR-0186 relaxes DR-0083's
# ships-inert clause for THIS class: single-shot, bounded I/O, idempotent, spawns
# NO compute and NO LLM -- so it is not the runaway class the inert rule targets).
#
# It chains the deterministic loaders in this dir, in order, each idempotent so a
# re-run is safe and a run always advances:
#   1. youtube_index.py        -- list the channel (yt-dlp, NO API key)  -> index
#   2. youtube_load.py         -- upsert videos into choir_sermons (dated,
#                                 conference/funeral classified)          -> The Word
#   3. prep_from_transcript.py -- points+scriptures for the email-less
#                                 messages (scriptures deterministic)     -> outline
#
# The three DR-0083 brakes that prevent MALFUNCTION stay (they never gate a normal
# run -- they only stop it breaking):
#   * SINGLE-FLIGHT LOCK -- a fire that finds a run live SKIPS; runs never stack.
#   * WALL-CLOCK BUDGET  -- INGEST_TIMEOUT_SEC caps the whole run; an overrun is
#                           killed, never left to spin (this + single-shot is why
#                           it cannot become the 2026-06-06 runaway).
#   * KILL-SWITCH (stop valve) -- Darrell's emergency OFF: `touch state/KILL_SWITCH`
#                           halts it instantly. Ships ABSENT, so it RUNS by default.
#
# Dry-run override for a rehearsal (no writes): set INGEST_DRYRUN=1. Otherwise it
# commits. Run-state to events.jsonl. POSIX sh, ASCII only. No LLM is summoned
# here; the Ari points step is a plain HTTP call inside prep_from_transcript and
# only fires if ARI_POINTS_URL is set (off by default).
#
# Fire it on a cadence on an always-on church node (DSM Task Scheduler / cron):
#   sh run_ingest.sh
# Stop it instantly:  touch state/KILL_SWITCH
# =============================================================================
set -eu

HERE="$(cd "$(dirname "$0")" && pwd)"
STATE_DIR="${STATE_DIR:-$HERE/state}"
EVENTS_DIR="${EVENTS_DIR:-$HERE/events}"
KILL_SWITCH="$STATE_DIR/KILL_SWITCH"
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

# --- Kill-switch: the ONE stop valve (ships ABSENT => runs) -------------------
if [ -f "$KILL_SWITCH" ]; then
  _log "stopped" "kill-switch engaged (Darrell's manual halt)"
  exit 0
fi

# --- Single-flight lock (mkdir is atomic): never stack ------------------------
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  _log "skip" "single-flight lock held by another run"
  exit 0
fi
echo "$$" > "$LOCK_DIR/pid" 2>/dev/null || true
trap 'rm -rf "$LOCK_DIR" 2>/dev/null || true' EXIT INT TERM

# Writes to production by default; INGEST_DRYRUN=1 for a no-write rehearsal.
COMMIT_ARG="--commit"
MODE="commit"
if [ "${INGEST_DRYRUN:-0}" = "1" ]; then COMMIT_ARG=""; MODE="dry-run"; fi
_log "go" "mode=$MODE; budget=${INGEST_TIMEOUT_SEC}s"

# --- Wall-clock budget wraps the whole chain ---------------------------------
_run() {
  if command -v timeout >/dev/null 2>&1; then
    timeout "$INGEST_TIMEOUT_SEC" "$@"
  else
    "$@"
  fi
}

INDEX="$HERE/yt-index.json"

# Step 1 -- enumerate the channel (no API key). A failure aborts the chain
# (nothing to load); the lock releases and the next fire retries.
if _run "$PY" "$HERE/youtube_index.py" "$CHANNEL_URL" --out "$INDEX"; then
  _log "index_ok" "$INDEX"
else
  _log "index_fail" "youtube_index failed (no network / no yt-dlp?); aborting chain"
  exit 0
fi

# Step 2 -- archive the videos (idempotent upsert).
if _run "$PY" "$HERE/youtube_load.py" "$INDEX" --slug "$SLUG" $COMMIT_ARG; then
  _log "load_ok" "mode=$MODE"
else
  _log "load_fail" "youtube_load failed"
fi

# Step 3 -- fill points+scriptures for the email-less messages from the transcript.
# Best-effort: a failure here never blocks the archive that already landed.
if _run "$PY" "$HERE/prep_from_transcript.py" --slug "$SLUG" $COMMIT_ARG; then
  _log "prep_ok" "mode=$MODE"
else
  _log "prep_fail" "prep_from_transcript failed"
fi

_log "done" "mode=$MODE"
# Lock released by the EXIT trap.
exit 0
