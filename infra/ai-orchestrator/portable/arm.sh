#!/usr/bin/env bash
# =============================================================================
# arm.sh  --  deliberately set the ARM flag (autonomy intent). AUDITED.
# =============================================================================
# Arming is a deliberate, Tier C act (RELEASE-TIERS.md): turn it on only with
# someone watching, never while the principal is traveling (June-6 runaway rule).
#
# IMPORTANT: in this SKELETON, arming changes NOTHING dangerous. The supervisor
# has no self-drive logic; even fully armed it only logs "standing by". This
# script exists so the arm action is real, single-purpose, and auditable from
# day one -- the live Cage wires the actual dispatch behind it later.
#
# Arming requires ALL of: kill-switch disengaged, budgets configured (> 0), and
# this flag set. arm.sh checks the first two and refuses if either is missing.
#
# Usage:
#   ./arm.sh            # set the ARM flag (after the preconditions pass)
#   ./disarm.sh         # remove it (and re-engage the kill-switch)
# =============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="$DIR/state"
KILL_SWITCH="$STATE_DIR/KILL_SWITCH"
ARMED="$STATE_DIR/ARMED"
ENV_FILE="$DIR/.env"

mkdir -p "$STATE_DIR"

# Precondition 1: kill-switch must be disengaged.
if [ -f "$KILL_SWITCH" ]; then
  echo "arm: REFUSED -- kill-switch is engaged. Disengage it first (./disarm.sh --off or delete state/KILL_SWITCH)." >&2
  echo "arm: (and remember: arming is Tier C -- only with someone watching.)" >&2
  exit 1
fi

# Precondition 2: budgets must be configured (> 0) -- a missing budget is a
# missing brake. Read from .env if present.
per=0; day=0
if [ -f "$ENV_FILE" ]; then
  per="$(grep -E '^BUDGET_PER_TASK_USD=' "$ENV_FILE" | tail -n1 | cut -d= -f2 | tr -d '[:space:]' || true)"
  day="$(grep -E '^BUDGET_DAILY_USD='    "$ENV_FILE" | tail -n1 | cut -d= -f2 | tr -d '[:space:]' || true)"
fi
per="${per:-0}"; day="${day:-0}"
if ! awk -v p="$per" -v d="$day" 'BEGIN{ exit (p+0 > 0 && d+0 > 0) ? 0 : 1 }'; then
  echo "arm: REFUSED -- budgets not configured. Set BUDGET_PER_TASK_USD and BUDGET_DAILY_USD (> 0) in .env first." >&2
  exit 1
fi

printf 'ARMED at %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$ARMED"
echo "arm: ARM flag set ($ARMED)."
echo "arm: NOTE -- skeleton has no self-drive logic; the orchestrator will log 'standing by', not act."
echo "arm: restart so the supervisor re-reads state:  docker compose restart"
