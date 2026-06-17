#!/usr/bin/env bash
# =============================================================================
# wake-disarm.sh  --  withdraw vendor-summon consent. The wake bridge keeps
#                     SCHEDULING + logging due handoffs, but summons no vendor.
#                     Always safe to run.
# =============================================================================
# This turns OFF only the summon consent (removes state/WAKE_SUMMON). The
# orchestrator stays armed and keeps observing/scheduling; it just won't call a
# vendor on a due handoff. For a full panic stop (force inert), use ./disarm.sh --on.
#
# Usage:
#   ./wake-disarm.sh     # remove WAKE_SUMMON (summon off; scheduling continues)
# =============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WAKE_SUMMON="$DIR/state/WAKE_SUMMON"

if [ -f "$WAKE_SUMMON" ]; then
  rm -f "$WAKE_SUMMON"
  echo "wake-disarm: WAKE_SUMMON removed -- vendor-summon is OFF. Scheduling + logging continue."
else
  echo "wake-disarm: WAKE_SUMMON already absent -- summon was already off."
fi
echo "wake-disarm: full panic stop (force inert) is ./disarm.sh --on"
