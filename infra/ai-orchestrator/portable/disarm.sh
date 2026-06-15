#!/usr/bin/env bash
# =============================================================================
# disarm.sh  --  return to the safe default. Removes the ARM flag; can also
#                RE-ENGAGE the kill-switch. Always safe to run.
# =============================================================================
# Usage:
#   ./disarm.sh           # remove the ARM flag (autonomy intent off)
#   ./disarm.sh --off     # also DISENGAGE the kill-switch (a precondition for
#                         #   a later arm) -- use deliberately
#   ./disarm.sh --on      # RE-ENGAGE the kill-switch (force inert) + unarm.
#                         #   This is the panic button: full stop.
# =============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="$DIR/state"
KILL_SWITCH="$STATE_DIR/KILL_SWITCH"
ARMED="$STATE_DIR/ARMED"

mkdir -p "$STATE_DIR"
MODE="${1:-}"

# Always remove the ARM flag.
if [ -f "$ARMED" ]; then rm -f "$ARMED"; echo "disarm: ARM flag removed."; else echo "disarm: ARM flag already absent."; fi

case "$MODE" in
  --on)
    printf 'ENGAGED at %s -- forced inert via disarm.sh --on\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$KILL_SWITCH"
    echo "disarm: kill-switch RE-ENGAGED (panic stop). Orchestrator is inert."
    ;;
  --off)
    if [ -f "$KILL_SWITCH" ]; then rm -f "$KILL_SWITCH"; echo "disarm: kill-switch DISENGAGED (still disarmed -- arming needs ./arm.sh too)."; else echo "disarm: kill-switch already disengaged."; fi
    ;;
  "")
    : # default: just unarmed; leave kill-switch as-is
    ;;
  *)
    echo "usage: $0 [--off | --on]" >&2; exit 2 ;;
esac

echo "disarm: restart so the supervisor re-reads state:  docker compose restart"
