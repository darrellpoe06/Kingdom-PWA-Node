#!/usr/bin/env sh
# =============================================================================
# entrypoint.sh  --  the portable orchestrator supervisor (SKELETON, inert).
# =============================================================================
# What this is: a self-contained supervisor that stands up on ANY new NAS,
# reads its Charter from a mounted config dir, and gives you a live, observable,
# fully-braked presence -- WITHOUT any autonomous vendor-summoning or self-drive.
#
# What this is NOT (yet): the live autonomy logic. Self-drive and vendor-LLM
# summoning are deliberately NOT implemented here. Even when fully ARMED with all
# brakes clear, this skeleton only logs "standing by" -- it never reaches out.
# That logic arms later, behind the full Cage, with Darrell's explicit go.
#
# Loop each tick:
#   1. read the Charter (mounted, read-only) -- the policy is data, not code.
#   2. evaluate the three brakes + kill-switch + ARM flag.
#   3. write one heartbeat event to the append-only JSONL log.
#   4. if (and only if) every brake is GO AND the Charter says self-drive is
#      implemented -> it WOULD dispatch. The Charter ships self_drive_implemented:
#      false, so the skeleton logs "standing by" and does nothing. Safe by design.
#
# POSIX sh (busybox / alpine). No external downloads at runtime.
# =============================================================================
set -eu

APP_DIR="${APP_DIR:-/app}"
CHARTER_DIR="${CHARTER_DIR:-/charter}"
CHARTER_FILE="${CHARTER_FILE:-$CHARTER_DIR/charter.yml}"
STATE_DIR="${STATE_DIR:-/state}"
EVENTS_DIR="${EVENTS_DIR:-/events}"
HEARTBEAT_SECONDS="${HEARTBEAT_SECONDS:-30}"

# shellcheck source=lib/eventlog.sh
. "$APP_DIR/lib/eventlog.sh"
# shellcheck source=lib/brakes.sh
. "$APP_DIR/lib/brakes.sh"
# shellcheck source=lib/wake.sh
. "$APP_DIR/lib/wake.sh"

mkdir -p "$STATE_DIR" "$EVENTS_DIR" "$STATE_DIR/handoffs" 2>/dev/null || true

# --- Charter read (policy as mounted config) --------------------------------
# The supervisor reads ONE senior safety value from the Charter: whether live
# self-drive is implemented. The skeleton ships this false; the supervisor honors
# it as a hard gate ABOVE the ARM flag, so a stray ARM file can never trip
# autonomy that does not exist.
charter_self_drive_implemented() {
  [ -f "$CHARTER_FILE" ] || { echo "false"; return; }
  _v="$(grep -E '^[[:space:]]*self_drive_implemented:' "$CHARTER_FILE" \
        | head -n1 | sed -E 's/.*:[[:space:]]*//' | tr -d '"[:space:]')"
  case "$_v" in true) echo "true" ;; *) echo "false" ;; esac
}

# --- Clean shutdown ---------------------------------------------------------
shutdown() {
  log_event "shutdown" "received signal; releasing lock and stopping cleanly"
  release_lock
  exit 0
}
trap shutdown TERM INT

# --- Boot -------------------------------------------------------------------
if [ ! -f "$CHARTER_FILE" ]; then
  log_event "boot_error" "Charter not found at $CHARTER_FILE; refusing to run without policy"
  echo "orchestrator: FATAL -- no Charter at $CHARTER_FILE" >&2
  exit 1
fi

# Single-instance: a second container/process that finds the lock held SKIPS.
if ! acquire_lock; then
  log_event "concurrency_skip" "another instance holds $LOCK_DIR; this one exits (single-instance brake)"
  echo "orchestrator: another instance is running; exiting (concurrency brake)" >&2
  exit 0
fi

SELF_DRIVE="$(charter_self_drive_implemented)"
log_event "boot" "portable orchestrator up | charter=$CHARTER_FILE self_drive_implemented=$SELF_DRIVE | per_task=\$$BUDGET_PER_TASK_USD daily=\$$BUDGET_DAILY_USD | $(inert_reason)"
echo "orchestrator: up. INERT by default. $(inert_reason). Ctrl-C / SIGTERM to stop." >&2

# --- Supervisor loop --------------------------------------------------------
while true; do
  # Wake-scheduler: scan the handoff inbox every tick and log which handoffs are
  # DUE / pending / deferred. This NEVER summons a vendor -- the bundle carries no
  # vendor stack (self-contained guarantee); the live summon is host-side
  # (scripts/wake-router.mjs), behind every brake. The scheduler is the always-on,
  # GPU-free presence that turns a real handoff event into a scheduled wake.
  scan_handoffs

  if all_brakes_go && [ "$SELF_DRIVE" = "true" ]; then
    # NOTE: this branch is intentionally unreachable in the skeleton --
    # self_drive_implemented ships false. When the live Cage arms autonomy,
    # the dispatch call goes HERE, gated by every brake above.
    log_event "armed_standby" "all brakes GO but self-drive dispatch is not implemented in the skeleton; standing by (no vendor summon)"
  elif all_brakes_go; then
    log_event "armed_standby" "all brakes GO; charter self_drive_implemented=false -> standing by, no action (safe scaffold)"
  else
    log_event "heartbeat" "inert: $(inert_reason)"
  fi
  sleep "$HEARTBEAT_SECONDS"
done
