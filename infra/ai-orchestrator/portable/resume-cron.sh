#!/usr/bin/env bash
# =============================================================================
# resume-cron.sh  --  NAS scheduler entrypoint for BOUNDED auto-resume.
# =============================================================================
# The always-on NAS (NOT subject to the desktop vendor cap) fires this AFTER the
# vendor cap-reset window. It runs the host-side runner (scripts/cap-resume.mjs)
# from the repo checkout that contains this bundle. The runner enforces every brake
# itself -- this wrapper just provides the clock + a small retry for transient
# network/API hiccups. It is INERT until ./resume-arm.sh is set (the runner refuses).
#
# It does NOT loop on a clock of its own: it runs ONCE per invocation and exits.
# The cap window + the approved-queue gate inside the runner are the real triggers;
# this is a poll, not a self-driving loop (June-6 runaway rule).
#
# Schedule it from the NAS (see resume/RESUME-CONTRACT.md for the exact lines):
#   cron:    35 4 * * *  /volume1/PoeTech/<repo>/infra/ai-orchestrator/portable/resume-cron.sh  >> /var/log/poetech-resume.log 2>&1
#            (04:35 local handles the 04:30 reset + buffer; the runner re-checks the window)
#   systemd: a .timer at OnCalendar=*-*-* 04:35:00 America/Chicago calling this script
#   n8n:     a Schedule node (cron 35 4 * * *) -> Execute Command node running this script
#
# Usage:
#   ./resume-cron.sh            # one bounded resume pass (LIVE; runner gates it)
#   ./resume-cron.sh --plan     # plan-only pass (no --run; logs what it WOULD do)
# =============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Bundle is at <repo>/infra/ai-orchestrator/portable -> repo root is three up.
REPO="$(cd "$DIR/../../.." && pwd)"
RUNNER="$REPO/scripts/cap-resume.mjs"

MODE_FLAG="--run"
if [ "${1:-}" = "--plan" ]; then MODE_FLAG=""; fi

RETRIES="${RESUME_CRON_RETRIES:-3}"
SLEEP_SECS="${RESUME_CRON_SLEEP_SECS:-60}"

if ! command -v node >/dev/null 2>&1; then
  echo "resume-cron: REFUSED -- node not found on PATH. The runner needs Node + the repo checkout." >&2
  exit 1
fi
if [ ! -f "$RUNNER" ]; then
  echo "resume-cron: REFUSED -- runner not found at $RUNNER. Is this bundle inside the repo checkout?" >&2
  exit 1
fi

echo "resume-cron: $(date -u +%Y-%m-%dT%H:%M:%SZ) starting (mode=${MODE_FLAG:-plan-only}, repo=$REPO)"

attempt=1
while [ "$attempt" -le "$RETRIES" ]; do
  # BUNDLE_DIR points the runner at THIS bundle's state/.env. Run from the repo so
  # relative paths in the runner resolve. The runner is idempotent + single-flight,
  # so a retry after a transient failure can never double-resume a 'done' item.
  if BUNDLE_DIR="$DIR" node "$RUNNER" $MODE_FLAG; then
    echo "resume-cron: $(date -u +%Y-%m-%dT%H:%M:%SZ) done (attempt $attempt)"
    exit 0
  fi
  echo "resume-cron: attempt $attempt failed; retrying in ${SLEEP_SECS}s ..." >&2
  attempt=$((attempt + 1))
  [ "$attempt" -le "$RETRIES" ] && sleep "$SLEEP_SECS"
done

echo "resume-cron: $(date -u +%Y-%m-%dT%H:%M:%SZ) GAVE UP after $RETRIES attempts." >&2
exit 1
