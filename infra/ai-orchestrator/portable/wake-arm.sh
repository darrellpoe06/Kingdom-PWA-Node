#!/usr/bin/env bash
# =============================================================================
# wake-arm.sh  --  consent to autonomous vendor-SUMMONING on wake. AUDITED.
# =============================================================================
# The dedicated, explicit 4th gate of the wake / handoff bridge. Even a generally
# ARMED orchestrator will NOT summon vendors when a handoff comes due unless this
# WAKE_SUMMON consent is also set. Arming standby and consenting to vendor-summon
# are two separate deliberate acts (defense in depth; June-6 runaway rule).
#
# This is a Tier C act (RELEASE-TIERS.md): turn it on only with someone watching,
# never while the principal is traveling.
#
# Refuses unless ALL preconditions already hold:
#   1. kill-switch DISENGAGED  (./disarm.sh --off)
#   2. ARM flag SET            (./arm.sh)
#   3. budgets configured > 0  (.env BUDGET_PER_TASK_USD + BUDGET_DAILY_USD)
#
# Usage:
#   ./wake-arm.sh        # set WAKE_SUMMON (after the preconditions pass)
#   ./wake-disarm.sh     # remove it (summon back OFF; scheduling continues)
# =============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="$DIR/state"
KILL_SWITCH="$STATE_DIR/KILL_SWITCH"
ARMED="$STATE_DIR/ARMED"
WAKE_SUMMON="$STATE_DIR/WAKE_SUMMON"
ENV_FILE="$DIR/.env"

mkdir -p "$STATE_DIR"

if [ -f "$KILL_SWITCH" ]; then
  echo "wake-arm: REFUSED -- kill-switch is engaged. Disengage first: ./disarm.sh --off" >&2
  exit 1
fi
if [ ! -f "$ARMED" ]; then
  echo "wake-arm: REFUSED -- not armed. Set the ARM flag first: ./arm.sh" >&2
  exit 1
fi

per=0; day=0
if [ -f "$ENV_FILE" ]; then
  per="$(grep -E '^BUDGET_PER_TASK_USD=' "$ENV_FILE" | tail -n1 | cut -d= -f2 | tr -d '[:space:]' || true)"
  day="$(grep -E '^BUDGET_DAILY_USD='    "$ENV_FILE" | tail -n1 | cut -d= -f2 | tr -d '[:space:]' || true)"
fi
per="${per:-0}"; day="${day:-0}"
if ! awk -v p="$per" -v d="$day" 'BEGIN{ exit (p+0 > 0 && d+0 > 0) ? 0 : 1 }'; then
  echo "wake-arm: REFUSED -- budgets not configured. Set BUDGET_PER_TASK_USD and BUDGET_DAILY_USD (> 0) in .env." >&2
  exit 1
fi

printf 'WAKE_SUMMON consented at %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$WAKE_SUMMON"
echo "wake-arm: WAKE_SUMMON set ($WAKE_SUMMON)."
echo "wake-arm: the host router (scripts/wake-router.mjs --summon) will now summon vendors on a DUE handoff, within budget."
echo "wake-arm: panic stop any time:  ./disarm.sh --on   (or ./wake-disarm.sh to turn summon off only)"
