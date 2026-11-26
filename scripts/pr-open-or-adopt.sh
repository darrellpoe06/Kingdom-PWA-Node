#!/usr/bin/env bash
# pr-open-or-adopt -- the merge lane's PR resolution: find the open PR for a
# branch, or open one, or adopt the one a concurrent run just opened. Prints
# ONLY the PR number on stdout, or nothing in --probe mode when none is open.
#
# WHY (2026-11-26, DR-1668). auto-open-pr.yml guarded creation with
# `gh pr list --head`, a read of GitHub's SEARCH index, which lags the database.
# A second push on one branch read "no PR open", created, and GitHub refused
# because the PR existed -- red for a state that is entirely correct. Of the 30
# most recent failed runs of that workflow, 15 are exactly this; 2 are genuine
# transport faults that must stay red.
#
# Two fixes, because the first alone is not enough: read the DATABASE
# (repos/{repo}/pulls?head=owner:branch), and then treat the refusal itself as
# the authority -- a live read narrows the race window but cannot close it,
# since two runs can both read "none" and both create.
#
# Modes:
#   --probe                 print the open PR number for BRANCH, or nothing
#   --open <title> <body>   open a PR, or adopt the one that already exists
#
# Reads REPO (owner/name) and BRANCH from the environment. GH, SLEEP and
# RETRIES are overridable so a test can drive every path with a stub gh --
# app/src/__tests__/pr-open-or-adopt.test.js does exactly that, including that a
# reset connection is NEVER adopted as "it must already exist".
set -euo pipefail

GH="${GH:-gh}"
SLEEP="${SLEEP:-sleep}"
RETRIES="${RETRIES:-5}"
REPO="${REPO:?REPO must be set to owner/name}"
BRANCH="${BRANCH:?BRANCH must be set}"
owner="${REPO%%/*}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# `|| true`: a transient read must not kill the job. In --probe that reads as
# "none open" and the caller's own `ahead` check still applies; in --open the
# create step handles the race itself, so nothing is lost by an empty answer.
live_number() {
  "$GH" api "repos/$REPO/pulls?head=$owner:$BRANCH&state=open" \
    --jq '.[0].number // empty' 2>/dev/null || true
}

case "${1-}" in
  --probe)
    live_number
    ;;
  --open)
    title="${2-}"
    body="${3-}"
    set +e
    created="$("$GH" pr create --repo "$REPO" --base main --head "$BRANCH" \
                 --title "$title" --body "$body" 2>&1)"
    rc=$?
    set -e
    outcome="$(printf '%s' "$created" | bash "$here/pr-create-outcome.sh" "$rc")"
    case "$outcome" in
      # The classifier already read the number out of the PR URL; taking it
      # from there rather than re-parsing keeps one source of truth.
      created*)
        printf '%s' "${outcome#created }"
        ;;
      exists)
        # Raced a concurrent run. The winner's PR can still be being written,
        # so re-read a few times -- but never pass without a number, because
        # the caller has to arm auto-merge on an actual PR.
        num=""
        for _ in $(seq 1 "$RETRIES"); do
          num="$(live_number)"
          [ -n "$num" ] && break
          "$SLEEP" 3
        done
        if [ -z "$num" ]; then
          printf '%s\n' "$created" >&2
          echo "::error::GitHub says a PR already exists for $BRANCH but none could be read back." >&2
          exit 1
        fi
        echo "A PR for $BRANCH was opened concurrently; adopting #$num. Not an error." >&2
        printf '%s' "$num"
        ;;
      *)
        printf '%s\n' "$created" >&2
        echo "::error::gh pr create failed for $BRANCH (exit $rc)." >&2
        exit 1
        ;;
    esac
    ;;
  *)
    echo "usage: pr-open-or-adopt.sh --probe | --open <title> <body>" >&2
    exit 2
    ;;
esac
