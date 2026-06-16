#!/usr/bin/env bash
# =============================================================================
# conflict-map.sh — the anti-collision map for parallel branches (orchestration).
# =============================================================================
# THE QUESTION THIS ANSWERS (Darrell, 2026-06-16): "how can I know if anything
# conflicts" before two parallel branches land on top of each other. It reads
# every in-flight branch (ahead of origin/main) and reports, for each:
#   - conflicts-with-main? (a real 3-way dry-run, never a guess)
#   - which files OVERLAP another in-flight branch (esp. the monolith)
#   - migration-number collisions across branches
#   - PARALLEL-SAFE (disjoint files -> land freely) vs MUST-SERIALIZE (shares a
#     file -> one in flight, the next rebases onto main after the prior merges)
# and prints a priority-ordered LAND ORDER (least-conflict-first within the
# serialized lane).
#
# git-only + unattended-safe: it does NOT shell out to gh/vercel (the
# no-interactive-cli-guard forbids that in this directory), so promote.sh and
# the orchestrator can call it every cycle without risk of an interactive hang.
#
# Usage:
#   scripts/orchestration/conflict-map.sh                 # map all in-flight branches
#   scripts/orchestration/conflict-map.sh <br> [<br> ...] # map a specific set
#   scripts/orchestration/conflict-map.sh --gate <br>...  # exit 1 if 2+ of the
#                                                           given branches are
#                                                           MUST-SERIALIZE (the
#                                                           orchestrator must not
#                                                           land them concurrently)
# =============================================================================
set -euo pipefail

# Files that force a serialized lane when shared. The monolith is the big one;
# the migration directory is a strictly-ordered sequence, so any two branches
# adding migrations must serialize to keep numbering monotonic.
SHARED_HOTSPOTS=(
  "app/src/poe-financial-mvp-v28.jsx"
)
MIGRATIONS_DIR="infra/supabase/migrations-auto"

ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"

GATE=0
if [ "${1:-}" = "--gate" ]; then GATE=1; shift; fi

echo "==> fetch --all --prune (always-now)" >&2
git fetch --all --prune -q

MAIN="origin/main"
MAIN_SHA="$(git rev-parse --short "$MAIN")"

# Resolve the branch set: explicit args, else every remote branch ahead of main.
branches=()
if [ "$#" -ge 1 ]; then
  for b in "$@"; do branches+=("${b#origin/}"); done
else
  while read -r ref; do
    b="${ref#refs/remotes/origin/}"
    case "$b" in main|HEAD) continue;; esac
    ahead="$(git rev-list --count "$MAIN..origin/$b" 2>/dev/null || echo 0)"
    [ "$ahead" -gt 0 ] && branches+=("$b")
  done < <(git for-each-ref --format='%(refname)' refs/remotes/origin)
fi

if [ "${#branches[@]}" -eq 0 ]; then
  echo "No in-flight branches ahead of $MAIN ($MAIN_SHA)."
  exit 0
fi

# Per-branch facts (parallel arrays keyed by index).
declare -a B_CONF B_MONO B_MIG B_BEHIND B_NFILES B_LANE
declare -A FILES_OF
for i in "${!branches[@]}"; do
  b="${branches[$i]}"
  ref="origin/$b"
  mb="$(git merge-base "$MAIN" "$ref" 2>/dev/null || echo "")"
  # Real 3-way dry-run conflict count (legacy merge-tree, git < 2.38).
  conf=0
  if [ -n "$mb" ]; then
    conf="$(git merge-tree "$mb" "$MAIN" "$ref" 2>/dev/null | grep -c '^<<<<<<<' || true)"
  fi
  files="$(git diff --name-only "$mb" "$ref" 2>/dev/null || true)"
  FILES_OF["$b"]="$files"
  nfiles="$(printf '%s\n' "$files" | grep -c . || true)"
  behind="$(git rev-list --count "$ref..$MAIN" 2>/dev/null || echo 0)"
  mono=no
  for h in "${SHARED_HOTSPOTS[@]}"; do
    if printf '%s\n' "$files" | grep -qxF "$h"; then mono=YES; fi
  done
  mig="$(printf '%s\n' "$files" | grep "$MIGRATIONS_DIR/" | sed 's#.*/##' | tr '\n' ' ' || true)"
  B_CONF[$i]="$conf"; B_MONO[$i]="$mono"; B_MIG[$i]="$mig"
  B_BEHIND[$i]="$behind"; B_NFILES[$i]="$nfiles"
done

# Pairwise file overlap -> which branches collide on a shared file.
declare -A OVERLAPS
for i in "${!branches[@]}"; do
  for j in "${!branches[@]}"; do
    [ "$j" -le "$i" ] && continue
    common="$(comm -12 \
      <(printf '%s\n' "${FILES_OF[${branches[$i]}]}" | sort -u) \
      <(printf '%s\n' "${FILES_OF[${branches[$j]}]}" | sort -u) | grep -c . || true)"
    if [ "$common" -gt 0 ]; then
      OVERLAPS[$i]="${OVERLAPS[$i]:-} ${branches[$j]}"
      OVERLAPS[$j]="${OVERLAPS[$j]:-} ${branches[$i]}"
    fi
  done
done

# Lane: MUST-SERIALIZE if it touches a hotspot, adds a migration, or overlaps a
# file with another in-flight branch. Else PARALLEL-SAFE.
for i in "${!branches[@]}"; do
  lane="PARALLEL-SAFE"
  if [ "${B_MONO[$i]}" = "YES" ] || [ -n "${B_MIG[$i]}" ] || [ -n "${OVERLAPS[$i]:-}" ]; then
    lane="MUST-SERIALIZE"
  fi
  B_LANE[$i]="$lane"
done

# Migration-number collisions across the in-flight set.
mig_dupes="$(
  for i in "${!branches[@]}"; do
    for m in ${B_MIG[$i]}; do echo "${m%%-*}"; done
  done | sort | uniq -d | tr '\n' ' '
)"

printf '\n=== CONFLICT MAP  (in-flight vs %s %s) ===\n' "$MAIN" "$MAIN_SHA"
printf '%-38s %-10s %-7s %-10s %-15s %s\n' "BRANCH" "CONFLICTS" "BEHIND" "MONOLITH" "LANE" "OVERLAPS / MIGRATIONS"
printf -- '%.0s-' {1..120}; printf '\n'
for i in "${!branches[@]}"; do
  extra=""
  [ -n "${OVERLAPS[$i]:-}" ] && extra="overlaps:${OVERLAPS[$i]}"
  [ -n "${B_MIG[$i]}" ] && extra="$extra mig:${B_MIG[$i]}"
  cflag="${B_CONF[$i]}"
  [ "$cflag" = "0" ] && cflag="clean" || cflag="CONFLICT($cflag)"
  printf '%-38s %-10s %-7s %-10s %-15s %s\n' \
    "${branches[$i]}" "$cflag" "${B_BEHIND[$i]}" "${B_MONO[$i]}" "${B_LANE[$i]}" "$extra"
done

if [ -n "$mig_dupes" ]; then
  printf '\n!! MIGRATION-NUMBER COLLISION across in-flight branches: %s\n' "$mig_dupes"
  printf '   (run the allocator: scripts/orchestration/migration-order-check.mjs --next)\n'
fi

# Land order: PARALLEL-SAFE first (land freely), then the serialized lane ordered
# least-behind-first (the freshest rebases cheapest). Priority weighting by name
# prefix: fix/ (incident) > docs/ (family-voice/governance) > feat/ (feature).
prio() { case "$1" in fix/*) echo 0;; merge/*) echo 1;; docs/*) echo 2;; feat/*) echo 3;; *) echo 4;; esac; }
printf '\n=== SUGGESTED LAND ORDER (priority: incident > governance > feature; least-conflict first) ===\n'
{
  for i in "${!branches[@]}"; do
    [ "${B_LANE[$i]}" = "PARALLEL-SAFE" ] && printf 'A %s %s %s PARALLEL-SAFE\n' "$(prio "${branches[$i]}")" "${B_BEHIND[$i]}" "${branches[$i]}"
  done
  for i in "${!branches[@]}"; do
    [ "${B_LANE[$i]}" = "MUST-SERIALIZE" ] && printf 'B %s %s %s MUST-SERIALIZE(rebase-each-onto-main)\n' "$(prio "${branches[$i]}")" "${B_BEHIND[$i]}" "${branches[$i]}"
  done
} | sort -k1,1 -k2,2n -k3,3n | nl -w2 -s'. ' | awk '{ $2=""; print }'

# Gate mode: refuse concurrent landing of 2+ shared-file branches.
if [ "$GATE" = "1" ]; then
  serialize_count=0
  for i in "${!branches[@]}"; do [ "${B_LANE[$i]}" = "MUST-SERIALIZE" ] && serialize_count=$((serialize_count+1)); done
  if [ "$serialize_count" -ge 2 ]; then
    printf '\nGATE FAIL: %s MUST-SERIALIZE branches in flight. Land ONE, rebase the rest onto main, then re-run.\n' "$serialize_count" >&2
    exit 1
  fi
  printf '\nGATE OK: at most one shared-file branch in flight.\n'
fi
