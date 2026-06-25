#!/usr/bin/env bash
# =============================================================================
# resume-arm.sh  --  consent to BOUNDED auto-resume of approved work. AUDITED.
# =============================================================================
# The dedicated, explicit consent flag for the cap-resume lane (scripts/cap-resume.mjs).
# It is the LOWER-risk sibling of wake-arm.sh: cap-resume only continues an explicitly
# APPROVED queue and makes no new decisions. Even so, it ships INERT and stays inert
# until this flag is deliberately set -- arming is the ONE thing reserved for Darrell.
#
# This is a Tier C act (RELEASE-TIERS.md): turn it on only with someone watching,
# never while the principal is traveling (June-6 runaway rule).
#
# Refuses unless ALL preconditions already hold:
#   1. kill-switch DISENGAGED      (./disarm.sh --off)
#   2. ARM flag SET                (./arm.sh)
#   3. $ budgets configured > 0    (.env BUDGET_PER_TASK_USD + BUDGET_DAILY_USD)
#   4. count caps configured > 0   (.env RESUME_MAX_TASKS_PER_RUN + RESUME_MAX_CALLS_PER_DAY)
#
# Usage:
#   ./resume-arm.sh        # set RESUME_ARMED (after the preconditions pass)
#   ./resume-disarm.sh     # remove it (resume back OFF; scheduling/observing continues)
# =============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="$DIR/state"
KILL_SWITCH="$STATE_DIR/KILL_SWITCH"
ARMED="$STATE_DIR/ARMED"
RESUME_ARMED="$STATE_DIR/RESUME_ARMED"
ENV_FILE="$DIR/.env"

mkdir -p "$STATE_DIR"

if [ -f "$KILL_SWITCH" ]; then
  echo "resume-arm: REFUSED -- kill-switch is engaged. Disengage first: ./disarm.sh --off" >&2
  exit 1
fi
if [ ! -f "$ARMED" ]; then
  echo "resume-arm: REFUSED -- not armed. Set the ARM flag first: ./arm.sh" >&2
  exit 1
fi

read_env() {
  if [ -f "$ENV_FILE" ]; then
    grep -E "^$1=" "$ENV_FILE" | tail -n1 | cut -d= -f2 | tr -d '[:space:]' || true
  fi
}
per="$(read_env BUDGET_PER_TASK_USD)"; per="${per:-0}"
day="$(read_env BUDGET_DAILY_USD)"; day="${day:-0}"
maxrun="$(read_env RESUME_MAX_TASKS_PER_RUN)"; maxrun="${maxrun:-0}"
maxday="$(read_env RESUME_MAX_CALLS_PER_DAY)"; maxday="${maxday:-0}"

if ! awk -v p="$per" -v d="$day" 'BEGIN{ exit (p+0 > 0 && d+0 > 0) ? 0 : 1 }'; then
  echo "resume-arm: REFUSED -- \$ budgets not configured. Set BUDGET_PER_TASK_USD and BUDGET_DAILY_USD (> 0) in .env." >&2
  exit 1
fi
if ! awk -v r="$maxrun" -v c="$maxday" 'BEGIN{ exit (r+0 > 0 && c+0 > 0) ? 0 : 1 }'; then
  echo "resume-arm: REFUSED -- count caps not configured. Set RESUME_MAX_TASKS_PER_RUN and RESUME_MAX_CALLS_PER_DAY (> 0) in .env." >&2
  exit 1
fi

printf 'RESUME_ARMED consented at %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$RESUME_ARMED"
echo "resume-arm: RESUME_ARMED set ($RESUME_ARMED)."
echo "resume-arm: the NAS scheduler (resume-cron.sh -> scripts/cap-resume.mjs --run) will now resume APPROVED queue items after the cap-reset window, within budget + caps."
echo "resume-arm: panic stop any time:  ./disarm.sh --on   (or ./resume-disarm.sh to turn resume off only)"
