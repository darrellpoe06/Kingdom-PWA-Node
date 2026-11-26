# DR-1668: the lane called a correct state a failure

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B — the merge lane itself; DR-0107 applies, so the deploy is proven on a real merge
**Type:** orchestration
**Area:** `.github/workflows/auto-open-pr.yml`, `scripts/pr-open-or-adopt.sh`, `scripts/pr-create-outcome.sh`, their two suites in `app/src/__tests__/`
**Pairs with:** DR-0103 (the lane), DR-0107 (prove the deploy), DR-0239 (surface-says-truth), DR-0076 §3 and §4, DR-0621
**Session note:** `docs/99-session-notes/2026-11-24-both-roads-shut-then-the-queue-named-its-rows.md`

## Context

A red run in the merge lane must mean something. Its idempotency guard asked
`gh pr list --head <branch>` whether a PR was open — a read of GitHub's **search
index**, which lags the database — so a second push on one branch read "none",
created, and GitHub refused because the PR existed. Red for a correct state.

## What was measured

Classified the **30 most recent failed `auto-open-pr` runs** from their own job
logs: **15** are `a pull request already exists` — this race; **13** are
`No commits between main and …`, all pre-2026-09-22, the class the `ahead=0`
guard closed; **2** are transport faults (reset, HTTP 499) that must stay red.
So the race is the **only live failure class** here, in both refusal shapes —
GraphQL's (run 44308027454) and gh's pre-check (43228136302). Per-run table and
the live REST read: the session note.

## Impact

The lane stops filing a correct state as a failure; a genuine fault stays red.
Nothing about the brake changes — a red PR still never merges.

## Decision

1. **Read the database, not the index** — `pulls?head=<owner>:<branch>` in place
   of `gh pr list --head`.
2. **A live read narrows the window; it cannot close it** — two runs can both
   read "none" and both create — so the refusal is the authority:
   `pr-create-outcome.sh` answers `created <n>` / `exists` / `error`.
3. **`exists` adopts, and must produce a number** — re-read, then fail loudly.
   It never passes without a PR to arm auto-merge on.
4. **Only the two measured refusal shapes adopt.** A reset, an HTTP 499, a
   too-long title and "No commits between" all still fail.

## Verification

- **18 cases green.** 10 classify the REAL log line of each shape; 8 drive the
  whole resolution with a stub `gh`, so the adopt path and its retry run as the
  runner will — a classifier test alone cannot catch a mis-wired adopt.
- **Proven to catch three ways**, each failing by name: reverting to
  `gh pr list` → 4 fail; adopting any non-zero exit → 7; letting `exists` pass
  with no number → 1. Green again when restored.
- **A case caught a real defect while being written:** `grep`'s no-match exit
  killed the script under `pipefail`, so a zero exit with no PR URL answered
  nothing instead of `error`. Guarded, and the case pins it.
- The logic moved OUT of the workflow into tested scripts: its `run` block is 46
  lines against 47 before, and `.github/workflows` is back at its ceiling.
- **Not claimed:** the race is not reproduced live — it needs two concurrent
  pushes on one branch, and the stub proves the handling, not the timing. The
  next real one is the proof. `re-review: 2026-12-03`.
