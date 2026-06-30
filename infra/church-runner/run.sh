#!/bin/sh
# =============================================================================
# run.sh -- one braked, single-shot run of the church-LAN probe.
# =============================================================================
# Fired by DSM Task Scheduler (or `docker compose run`) on a cadence. Single-shot
# by design: no internal infinite loop -- the scheduler is the clock, so a hung
# run cannot spin, and the single-flight lock guarantees runs never stack.
#
# Sequence:
#   1. Source the Cage brakes.
#   2. If the PROBE brakes are not GO -> log inert + exit 0 (this is the normal
#      shipped state: kill-switch engaged / not armed).
#   3. Acquire the single-flight lock; if held, SKIP (another run is live).
#   4. Run the read-only probe (node probe.mjs). Release the lock no matter what.
#
# This script NEVER dispatches work to a GPU tower or summons an LLM. That is the
# separately-armed dispatch path (DISPATCH_ARMED + $ budget), intentionally not
# wired here so the read-only look ships safe on its own. ASCII only.
# =============================================================================
set -eu

HERE="$(cd "$(dirname "$0")" && pwd)"
STATE_DIR="${STATE_DIR:-$HERE/state}"
EVENTS_DIR="${EVENTS_DIR:-$HERE/events}"
export STATE_DIR EVENTS_DIR

# shellcheck source=brakes.sh
. "$HERE/brakes.sh"

mkdir -p "$EVENTS_DIR"
_log() {
  printf '{"ts":"%s","runner":"church-runner","event":"%s","detail":"%s"}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$2" >> "$EVENTS_DIR/events.jsonl" 2>/dev/null || true
}

if ! probe_brakes_go; then
  _log "runner_inert" "$(inert_reason)"
  exit 0
fi

if ! acquire_lock; then
  _log "runner_skip" "single-flight lock held by another run"
  exit 0
fi
trap 'release_lock' EXIT INT TERM

_log "runner_go" "probe brakes clear"
node "$HERE/probe.mjs" || _log "runner_error" "probe.mjs exited non-zero"

# Lock released by the EXIT trap.
