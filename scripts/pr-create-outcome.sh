#!/usr/bin/env bash
# pr-create-outcome -- classify one `gh pr create` attempt so the merge lane
# stops calling a correct state a failure.
#
# WHY (2026-11-26, measured). auto-open-pr.yml guarded creation with
# `gh pr list --head <branch>`, which reads GitHub's SEARCH index. That index
# lags the database by seconds to minutes, so a second push on the same branch
# read "no PR open", tried to create, and GitHub refused -- a red lane run for a
# state that is entirely correct (the PR exists). Of the 30 most recent failed
# auto-open-pr runs, 15 are exactly this; 13 are the pre-2026-09-22
# "No commits between" class the `ahead=0` guard already closed; 2 are genuine
# transport faults (connection reset, HTTP 499). So the race is the ONLY live
# failure class in that workflow.
#
# A live read narrows the window but cannot close it -- two runs can both read
# "none" and both create. So the refusal itself becomes the authority: an
# "already exists" answer means ADOPT the PR that exists, and anything else
# still fails loudly.
#
# Usage:  printf '%s' "$create_output" | pr-create-outcome.sh "$exit_code"
# Prints exactly one of:
#   created <number>   the attempt opened a PR (number taken from its URL)
#   exists             a PR for this branch already exists -- re-read and adopt
#   error              a real failure; the caller prints the output and exits 1
#
# Deliberately conservative in both directions: a zero exit with no PR number is
# `error` (the caller cannot arm auto-merge without a number), and only the two
# measured "already exists" refusal shapes read as `exists`. A title-too-long, a
# reset connection, an HTTP 499 and a "No commits between" all stay `error`.
#
# Proven-to-catch: app/src/__tests__/pr-create-outcome.test.js runs this script
# on the real log lines of all six measured shapes and asserts each verdict,
# including that a transport fault is NEVER adopted as `exists`.
set -euo pipefail
rc="${1-1}"
out="$(cat)"

if [ "$rc" = "0" ]; then
  # gh prints the new PR's URL on success; the number is its last path segment.
  # `|| true` on BOTH stages: grep exits 1 when it matches nothing, and under
  # `set -o pipefail` that would kill the script instead of answering `error`.
  # A test pinned this (a zero exit with no URL) and caught it.
  num="$( { printf '%s' "$out" | grep -oE 'https://[^[:space:]]*/pull/[0-9]+' || true; } \
          | { grep -oE '[0-9]+$' || true; } | tail -1)"
  if [ -n "$num" ]; then
    printf 'created %s' "$num"
  else
    printf 'error'
  fi
  exit 0
fi

# The two refusal shapes GitHub actually returns for this race, measured in the
# logs of runs 44308027454 (GraphQL) and 43228136302 (gh's own pre-check):
#   pull request create failed: GraphQL: A pull request already exists for <owner>:<branch>. (createPullRequest)
#   a pull request for branch "<branch>" into branch "main" already exists:
if printf '%s' "$out" | grep -qiE 'a pull request (already exists|for branch .* already exists)'; then
  printf 'exists'
  exit 0
fi

printf 'error'
