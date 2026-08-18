#!/usr/bin/env bash
# =============================================================================
# ship.sh - fast, lean, race-safe commit -> PR -> merge for this repo
# =============================================================================
# Encodes the commit procedures learned the hard way this repo (see the README
# section at the bottom and docs/01-architecture/COMMIT-PROCEDURES.md):
#   1. Branch off FRESH origin/main      - main jumps mid-session.
#   2. Lint + vitest gate BEFORE pushing - catch it locally, not in CI.
#   3. Push the commit OBJECT to the      - survives the two-session git race
#      branch (sha:refs/heads/<branch>)     (a concurrent session switching the
#                                            working-tree branch can't misplace
#                                            or lose the commit).
#   4. Wait for the required "lint +      - branch protection REJECTS an early
#      vitest" check to PASS before merge   merge; don't fight it.
#   5. Squash-merge + delete branch.
#   6. Plain commit subject, no co-author trailer (repo convention).
#
# Usage:
#   scripts/ship.sh <branch> "<title>" [--tier a|b|c] [--no-test] [file ...]
#
#   <branch>   short branch name, e.g. fix/photo-count
#   <title>    commit subject + PR title (one line)
#   file ...   files to stage; if omitted, whatever is already `git add`ed
#
# Procedures (tier maps to docs/00-foundations/_root/RELEASE-TIERS.md):
#   --tier a   (DEFAULT) ship now: commit -> push -> PR -> wait CI -> squash-merge
#   --tier b   soak: commit -> push -> PR, NO auto-merge (leave on the preview)
#   --tier c   governed: same as b (PR only), for review + sign-off
#   --no-test  skip the lint/vitest gate (docs/scripts-only changes)
#
# Examples:
#   scripts/ship.sh fix/blank-tiles "fix(photos): hide thumbless tiles" app/src/components/LifeGallery.jsx
#   scripts/ship.sh feat/portal "feat(portal): tenant login" --tier b
#   scripts/ship.sh docs/notes "docs: session note" --no-test --  docs/99-session-notes/x.md
# =============================================================================
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "usage: scripts/ship.sh <branch> \"<title>\" [--tier a|b|c] [--no-test] [file ...]" >&2
  exit 2
fi

BRANCH="$1"; TITLE="$2"; shift 2
TIER="a"
RUN_TESTS=1
FILES=()
while [ "$#" -gt 0 ]; do
  case "$1" in
    --tier) TIER="$2"; shift 2 ;;
    --no-test) RUN_TESTS=0; shift ;;
    --) shift ;;
    *) FILES+=("$1"); shift ;;
  esac
done

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

echo "==> fetch origin (main jumps)"
git fetch origin -q

# 1. Stage. Explicit files win; else use what's already staged.
if [ "${#FILES[@]}" -gt 0 ]; then git add -- "${FILES[@]}"; fi
if git diff --cached --quiet; then
  echo "ship: nothing staged. Pass files, or 'git add' them first." >&2
  exit 1
fi

# 2. Lint + test gate (app/). Cheap insurance against a red CI cycle.
if [ "$RUN_TESTS" -eq 1 ]; then
  echo "==> lint + vitest (local gate)"
  ( cd app && npm run lint && npm run test:run )
else
  echo "==> skipping tests (--no-test)"
fi

# 3. Commit, then push the commit OBJECT (race-safe).
echo "==> commit"
git commit -q -m "$TITLE"
SHA="$(git rev-parse HEAD)"
echo "    commit $SHA"
echo "==> push object -> $BRANCH (survives a concurrent session)"
git push -q origin "$SHA:refs/heads/$BRANCH"

# 4. PR.
echo "==> open PR"
PR_URL="$(gh pr create --base main --head "$BRANCH" --title "$TITLE" --body "$TITLE

Shipped via scripts/ship.sh (tier $TIER).")"
PR_NUM="$(printf '%s' "$PR_URL" | grep -oE '[0-9]+$')"
echo "    $PR_URL"

if [ "$TIER" != "a" ]; then
  echo "==> tier $TIER: PR open for soak/review, NOT auto-merging. Done."
  exit 0
fi

# 5. Wait for the required check to PASS, then squash-merge. Branch protection
#    rejects a merge before "lint + vitest" is green - so wait for it.
echo "==> wait for required check (lint + vitest)"
i=0
until gh pr checks "$PR_NUM" 2>/dev/null | grep -qE "lint \+ vitest.*pass" \
   || gh pr checks "$PR_NUM" 2>/dev/null | grep -qiE "lint \+ vitest.*(fail|error)" \
   || [ "$i" -ge 60 ]; do sleep 5; i=$((i+1)); done

if gh pr checks "$PR_NUM" 2>/dev/null | grep -qiE "lint \+ vitest.*(fail|error)"; then
  echo "ship: CI FAILED on PR #$PR_NUM - not merging. See: $PR_URL" >&2
  exit 1
fi

# The loop above can also end by EXHAUSTING its budget (i >= 60, ~5 minutes)
# without the check ever reporting pass OR fail - a slow queue, a runner outage,
# or gh being unable to read the checks at all. That is UNKNOWN, and it must not
# fall through to the merge below: silence is not a pass (DR-0310). Say so and
# stop; re-run ship once CI has actually reported.
if ! gh pr checks "$PR_NUM" 2>/dev/null | grep -qE "lint \+ vitest.*pass"; then
  echo "ship: could NOT observe 'lint + vitest' reporting pass on PR #$PR_NUM after ~5 minutes - not merging." >&2
  echo "ship: this is UNKNOWN, not green. Check the run, then re-run ship. See: $PR_URL" >&2
  exit 1
fi

echo "==> squash-merge + delete branch"
gh pr merge "$PR_NUM" --squash --delete-branch
echo "==> shipped: PR #$PR_NUM merged to main"
