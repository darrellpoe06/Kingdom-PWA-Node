#!/usr/bin/env bash
# =============================================================================
# resume-disarm.sh  --  withdraw bounded auto-resume consent. The cap-resume lane
#                       keeps OBSERVING + planning (plan-only), but resumes nothing.
#                       Always safe to run.
# =============================================================================
# This turns OFF only the resume consent (removes state/RESUME_ARMED). The
# orchestrator stays armed and the scheduler can still run cap-resume in plan-only
# mode (it logs what it WOULD resume), but no vendor is called. For a full panic
# stop (force inert, every lane), use ./disarm.sh --on.
#
# Usage:
#   ./resume-disarm.sh     # remove RESUME_ARMED (resume off; planning continues)
# =============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESUME_ARMED="$DIR/state/RESUME_ARMED"

if [ -f "$RESUME_ARMED" ]; then
  rm -f "$RESUME_ARMED"
  echo "resume-disarm: RESUME_ARMED removed -- bounded auto-resume is OFF. Planning + logging continue."
else
  echo "resume-disarm: RESUME_ARMED already absent -- resume was already off."
fi
echo "resume-disarm: full panic stop (force inert, all lanes) is ./disarm.sh --on"
