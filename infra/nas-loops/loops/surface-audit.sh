#!/usr/bin/env bash
# =============================================================================
# surface-audit.sh — the PROACTIVE surface-audit loop (DR-0086), deterministic.
# =============================================================================
# Runs the human-needs rubric against EVERY served surface (scripts/surface-audit.mjs),
# writes the findings artifact the in-app Concerns & Solutions board reads through,
# and appends a line to the event reel. This is the standing pass that catches the
# class of miss Darrell had to name on 2026-07-01 (endless-scroll list, static
# tiles, admin unreachable, dead-ends) BEFORE he sees it — he is the Governor, not
# the QA.
#
# Like health-check.sh, this loop NEVER calls an LLM and makes NO new decisions —
# it only OBSERVES and writes the artifact. It does NOT commit or merge (the build
# driver / a session lands the artifact). That read-only discipline is exactly why
# it keeps running headless whether or not Claude/Dispatch is online.
#
# Brakes are enforced by the runner (run.mjs), NOT here: the wall-clock timeout,
# per-day call cap, single-flight lock, kill-switch, and LOOPS_ARMED all gate this
# script's invocation. This file only runs the audit.
#
# Env (set by run.mjs): REPO_ROOT (the NAS repo checkout). REEL_FILE is inherited
# so the finding summary lands on the same reel the Dispatch Status surface reads.
# =============================================================================
set -uo pipefail

ROOT="${REPO_ROOT:-$(cd "$(dirname "$0")/../../.." && pwd)}"

if ! command -v node >/dev/null 2>&1; then
  echo "surface-audit: REFUSED -- node not found on PATH"
  exit 2
fi

cd "$ROOT" || { echo "surface-audit: cannot cd to repo root $ROOT"; exit 2; }

# --write updates app/src/lib/audit-findings.json + appends the event reel.
# We do NOT pass --fail-on: the loop is an observer; a finding is filed to the
# board, it does not fail the NAS cycle. (Merge-time gating is CI's job via the
# quality manifest, where --fail-on can be used.)
node scripts/surface-audit.mjs --write
rc=$?

if [ "$rc" -ne 0 ]; then
  echo "surface-audit: audit exited $rc"
  exit "$rc"
fi

echo "surface-audit: ok (findings artifact refreshed)"
exit 0
