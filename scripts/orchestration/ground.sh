#!/usr/bin/env bash
# =============================================================================
# ground.sh — always-now ground truth for a re-attaching session (step 1).
# =============================================================================
# SWIMLANES.md §4 names this as the first re-attach step, and cited it from
# 2026-06-16 while no file existed — the gap was found by the 2026-07-29
# orchestration research pass (DR-0244) and closed by building the script to
# its own one-line spec: "git HEAD + CI verdict + branches ahead of main
# (always-now truth, never memory)."
#
# git + curl only (no gh / vercel) so it is unattended-safe and never prompts.
# CI verdict comes from the public check-runs API; unreachable degrades to
# "unknown", never a guess (DR-0076 — unknown freshness never reads as fresh).
#
# Usage:  scripts/orchestration/ground.sh
# =============================================================================
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"

REMOTE="$(git remote get-url origin 2>/dev/null || echo '')"
SLUG="$(printf '%s' "$REMOTE" | sed -E 's#.*github.com[:/]([^/]+/[^/]+)(\.git)?$#\1#; s#\.git$##')"
# A remote that is not github.com (a proxy, a bare path) yields no owner/repo
# slug — degrade to empty so every API caller answers "unknown", never garbage.
case "$SLUG" in */*) : ;; *) SLUG="" ;; esac
case "$SLUG" in *://*|*@*) SLUG="" ;; esac

HEAD_SHA="$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
HEAD_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
HEAD_SUBJECT="$(git log -1 --format=%s 2>/dev/null || echo '')"

# CI verdict for the main branch tip (the deployable truth), best-effort.
ci_verdict() {
  local ref="$1"
  if [ -z "$SLUG" ] || ! command -v curl >/dev/null 2>&1; then echo "unknown"; return; fi
  local resp
  resp="$(curl -fsS --max-time 8 -H 'Accept: application/vnd.github+json' \
    "https://api.github.com/repos/${SLUG}/commits/${ref}/check-runs?per_page=100" 2>/dev/null || true)"
  [ -z "$resp" ] && { echo "unknown"; return; }
  local total failed pending
  total="$(printf '%s' "$resp" | grep -c '"conclusion"' || true)"
  failed="$(printf '%s' "$resp" | grep -c '"conclusion": *"\(failure\|timed_out\|cancelled\)"' || true)"
  pending="$(printf '%s' "$resp" | grep -c '"status": *"\(queued\|in_progress\)"' || true)"
  if [ "${total:-0}" -eq 0 ]; then echo "unknown"
  elif [ "${failed:-0}" -gt 0 ]; then echo "RED (${failed} failing)"
  elif [ "${pending:-0}" -gt 0 ]; then echo "pending (${pending} running)"
  else echo "green (${total} checks)"
  fi
}

echo "=============================================================="
echo " GROUND — always-now truth, never memory (re-attach step 1)"
echo " repo: ${SLUG:-unknown}    spec: docs/orchestration/SWIMLANES.md §4"
echo "=============================================================="
echo ""
echo "HEAD:   ${HEAD_SHA} (${HEAD_BRANCH})"
echo "        ${HEAD_SUBJECT}"

git fetch origin main --quiet 2>/dev/null || true
MAIN_SHA="$(git rev-parse origin/main 2>/dev/null || echo 'unknown')"
echo "main:   ${MAIN_SHA}"
echo "CI:     $(ci_verdict "${MAIN_SHA}")"
echo ""
echo "BRANCHES AHEAD OF origin/main (work in flight, durable — not memory):"
FOUND=0
for ref in $(git for-each-ref refs/heads refs/remotes/origin --format='%(refname:short)' 2>/dev/null); do
  case "$ref" in origin/main|main|origin/HEAD|origin) continue ;; esac
  AHEAD="$(git rev-list --count "origin/main..${ref}" 2>/dev/null || echo 0)"
  if [ "${AHEAD:-0}" -gt 0 ]; then
    FOUND=1
    printf '  %-50s  +%s\n' "$ref" "$AHEAD"
  fi
done
[ "$FOUND" -eq 0 ] && echo "  (none — everything is landed or nothing is fetched)"
echo ""
echo "Next: scripts/orchestration/lanes.sh (lane state), then conflict-map.sh."
