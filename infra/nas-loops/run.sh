#!/usr/bin/env bash
# =============================================================================
# run.sh — DSM Task Scheduler entry for the braked deterministic NAS loop runner.
# =============================================================================
# Synology DSM Task Scheduler (Control Panel -> Task Scheduler -> Create ->
# Scheduled Task, User = root, User-defined script) calls THIS with the loop name.
# It is thin glue: resolve the repo checkout, verify Node, then exec the runner
# (run.mjs), which owns every brake. It does NOT loop on a clock of its own — it
# runs ONCE per DSM fire and exits (the June-6 runaway rule; a script that exits
# holds no RAM and cannot wedge a shared process).
#
# Governance is the PARAMETERS + humans, not a --run ceremony (DR-0096). The single
# arm is LOOPS_ARMED (env or infra/nas-loops/.env); once armed, a fire RUNS the loop
# behind the three brakes. Disarmed => it stays inert. --dry-run previews only.
#
# DSM examples (register by hand in the DSM UI — see README.md):
#   Scheduled Task, every 10 min, root (arm persistently via .env first):
#     bash /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-loops/run.sh health-check
#   Put LOOPS_ARMED=1 in infra/nas-loops/.env to arm; remove it (or touch
#   state/KILL_SWITCH) to stop. No --run needed.
#
# Usage:
#   ./run.sh <loop-name>            # runs it if armed + brakes GO; inert if disarmed
#   ./run.sh <loop-name> --dry-run  # preview the decision, execute nothing
#   ./run.sh --list                 # show the registry + brake state
# =============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$DIR/run.mjs"

if ! command -v node >/dev/null 2>&1; then
  echo "nas-loops run.sh: REFUSED -- node not found on PATH. The runner needs Node + the repo checkout." >&2
  exit 1
fi
if [ ! -f "$RUNNER" ]; then
  echo "nas-loops run.sh: REFUSED -- runner not found at $RUNNER." >&2
  exit 1
fi

# --list passthrough (no --loop= needed).
if [ "${1:-}" = "--list" ]; then
  exec node "$RUNNER" --list
fi

LOOP="${1:-}"
if [ -z "$LOOP" ]; then
  echo "nas-loops run.sh: REFUSED -- provide a loop name (or --list)." >&2
  exit 1
fi
shift || true

# Remaining args (e.g. --run) pass through to the runner unchanged.
exec node "$RUNNER" "--loop=$LOOP" "$@"
