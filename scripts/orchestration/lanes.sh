#!/usr/bin/env bash
# =============================================================================
# lanes.sh — the swimlane re-attach reader (standing orchestration engine).
# =============================================================================
# Prints the lane model + the live per-lane in-flight count (from the durable
# PR labels) + the re-attach checklist, then hands off to conflict-map.sh for the
# collision map and land order. This is step 2 of the "Claude comes back after
# offline" re-attach flow (see docs/orchestration/SWIMLANES.md §4): a returning
# session reads lane state from DURABLE sources (PR labels, this repo) instead of
# spawning blind.
#
# git + curl only (no gh / vercel) so it is unattended-safe and never prompts.
# Per-lane counts come from the PUBLIC repo's issues-by-label API; if curl is
# unavailable or the repo is unreachable it degrades to "unknown", never a guess.
#
# Usage:  scripts/orchestration/lanes.sh
# =============================================================================
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"

REMOTE="$(git remote get-url origin 2>/dev/null || echo '')"
SLUG="$(printf '%s' "$REMOTE" | sed -E 's#.*github.com[:/]([^/]+/[^/]+)(\.git)?$#\1#; s#\.git$##')"

# Priority-ordered lanes. Lower number lands first. Conference is drop-everything.
LANES=(
  "lane:1-conference|Conference-critical (NOW, not July) — drop-everything"
  "lane:2-church|Church / COLG / Body surfaces"
  "lane:3-personal|Personal / family surfaces"
  "lane:4-infra|Auth / serving (off-Vercel) / orchestration / DB"
  "lane:5-research|Research / specs / decision records"
  "lane:6-hardening|Cleanup / tests / hardening"
)

# Best-effort live count of OPEN PRs+issues per lane label (public API, no token).
count_lane() {
  local label="$1"
  if [ -z "$SLUG" ] || ! command -v curl >/dev/null 2>&1; then echo "?"; return; fi
  local resp
  resp="$(curl -fsS --max-time 8 "https://api.github.com/repos/${SLUG}/issues?state=open&per_page=100&labels=${label}" 2>/dev/null || true)"
  [ -z "$resp" ] && { echo "?"; return; }
  printf '%s' "$resp" | grep -c '"number":' || echo 0
}

echo "=============================================================="
echo " SWIMLANES — standing orchestration engine (re-attach reader)"
echo " repo: ${SLUG:-unknown}    spec: docs/orchestration/SWIMLANES.md"
echo "=============================================================="
echo ""
echo "LANES (priority order — lower lands first):"
for entry in "${LANES[@]}"; do
  label="${entry%%|*}"; desc="${entry#*|}"
  n="$(count_lane "$label")"
  printf '  %-20s  open=%-3s  %s\n' "$label" "$n" "$desc"
done

cat <<'EOF'

CONFERENCE CRITICAL PATH: EventCenter is on main (#192). The blocker is SERVING
— off-Vercel -> Cloudflare Pages is built+merged (#210, gated by CF_PAGES_ENABLED).
The ONE human step is Darrell's DNS flip (paste-ready):
  docs/99-session-notes/2026-06-16-cutover-plan-vercel-to-cloudflare-pages.md
Conference-usable = the moment that flip lands.

RE-ATTACH CHECKLIST (run in order; attach to the highest-priority unblocked lane):
  1. scripts/orchestration/ground.sh        # git HEAD + CI verdict + branches
  2. scripts/orchestration/lanes.sh         # (this) lane model + live counts
  3. scripts/orchestration/conflict-map.sh  # collision map + land order  (runs below)
  4. gh pr list --state open --json number,labels   # which PR in which lane
  5. master fix list + Events spine         # outstanding work + outcomes

PARTITION: disjoint files land in parallel across lanes; shared-core (the monolith
poe-financial-mvp-v28.jsx / migration sequence) serializes within reach. Mechanical
ordering is NOT a person-hold. New surface => new module.
EOF

echo ""
echo "=== conflict map + land order (live) ============================"
if [ -x scripts/orchestration/conflict-map.sh ]; then
  scripts/orchestration/conflict-map.sh || echo "(conflict-map.sh returned non-zero — see output above)"
else
  echo "(scripts/orchestration/conflict-map.sh not found or not executable)"
fi
