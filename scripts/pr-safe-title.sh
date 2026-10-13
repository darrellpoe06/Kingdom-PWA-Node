#!/usr/bin/env bash
# pr-safe-title — emit a GitHub-safe PR title (<= 256 chars) from a commit
# subject. GitHub caps a PR title at 256 characters; a longer subject makes
# `gh pr create` hard-fail ("GraphQL: Title is too long"), leaving the branch
# with NO PR (the 2026-07-30 incident, REV-0217). auto-open-pr.yml calls this so
# a long subject truncates instead of failing; the caller carries the full
# subject into the PR body when the title differs, so nothing is lost.
#
# Truncates to 250 chars + a short "..." marker (<= 253, safely under 256). A
# UTF-8 locale is forced so ${#subject} and the substring are CHARACTER-based
# (not byte-based, which a C locale would use — 256 is GitHub's CHARACTER cap,
# and byte counting would both mis-measure and risk a mid-character cut). The
# caller carries the full subject into the PR body when it truncated, so the
# short marker loses nothing. Prints the title to stdout; no newline.
#
# Proven-to-catch: app/src/__tests__/pr-safe-title.test.js runs this script with
# a >256-char subject (incl. multibyte em-dashes) and asserts the output is
# <= 256 characters (and unchanged for a short subject).
set -euo pipefail
export LC_ALL=C.UTF-8 2>/dev/null || export LC_ALL=en_US.UTF-8 2>/dev/null || true
subject="${1-}"
if [ "${#subject}" -gt 256 ]; then
  printf '%s...' "${subject:0:250}"
else
  printf '%s' "$subject"
fi
