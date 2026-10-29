# DR-1297: CI runs once per commit

**Date:** 2026-10-29
**Status:** Accepted
**Tier:** C (a change to the merge / CI lane: DR-0107 governs it, and it is not done until a real merge has produced a real deploy)
**Type:** orchestration
**Area:** `.github/workflows/ci.yml` (the `on:` block and the concurrency comment), `app/src/__tests__/ci-runs-once-per-commit.test.js` (new)
**Declared by:** Darrell, 2026-10-29. Four PRs sat with most of their CI jobs queued, and he asked: *"We don't have enough runners? Design issue? Orchestration issues?"* He was shown the measurement and two safe designs, and chose this one: *"A1"*.
**Pairs with:** DR-0645 (named this doubling and dated its fix), DR-0644 (keep-prs-current), DR-0107 (prove the deploy), DR-0103 (move without being pushed)

## Context

`ci.yml` fired on both `pull_request` and `push`. Each event gives a run its own ref (`refs/pull/N/merge` and `refs/heads/<branch>`). So DR-0645's superseded-run cancel, which groups runs by ref, never cancelled one run with the other. Every commit pushed to a branch with an open PR ran the whole suite twice on the same SHA.

DR-0645 measured exactly this on 2026-09-24: "Each commit pushed to a branch with an open PR runs CI twice … That doubles runner use." It set `re-review: 2026-10-08` to bring the dedup as its own DR. That date passed with nothing built.

DR-0645 also named the trap that makes a naive dedup dangerous. A job skipped by `if:` posts a **skipped** `app — lint + vitest` on the same SHA, and a skipped required check reads as passing. Skipping either of the two runs would put a passing-looking required check beside the real one, and which of them GitHub honors was never measured.

## What was measured

- **One commit, two complete runs.** On 2026-10-29, #2490's head `29c84ff3` had push run **40816305549** (event `push`, created 04:11:01) and pull_request run **40816309086** (event `pull_request`, created 04:11:03). The two are the same workflow, on the same SHA, with about 19 jobs each.
- **The pile-up.** #2487 merged to main. Its new INDEX row put every open PR in a ledger conflict, and keep-prs-current cannot push the fix without `LANE_PUSH_TOKEN` (DR-0644 §7). Four PRs (#2489, #2490, #2493, #2496) were merged up by hand within minutes, which asked for about 150 jobs at once. At 04:3x, 19 workflow runs were queued across the repository, the deploy-freshness healer among them.
- **Branches outside the push list exist and have PRs.** `git ls-remote --heads origin` shows 1,078 branches, and more than 30 of them fall outside the old push filter `[main, feat/**, fix/**, merge/**, docs/**, claude/**, ccr-**]`. Among them are `money/phase-2-safe-to-spend` (#2464) and the `dependabot/*` branches. For those PRs, the `pull_request` run was the only run that posted the required check.
- **Nothing reads the event.** No job in `ci.yml` reads `github.event.pull_request`, `github.base_ref` or `github.head_ref`. No workflow or script filters CI runs by `event=pull_request`; the only match, in `fleet-census.yml`, filters issues. `rls-isolation.yml` is scheduled, and `ci.yml` was the only workflow triggered by both events.

## Decision

1. **`pull_request` is removed from `ci.yml`.** Nothing is skipped, so no skipped required check is ever posted. There is one run per commit.
2. **`push` runs on every branch (`'**'`).** A PR from any branch of this repository gets `app — lint + vitest` on its head SHA from the push run. Token-opened PRs have always passed this way (see `auto-open-pr.yml`). `merge_group` and `workflow_dispatch` stay, so keep-prs-current's dispatch after a token push still lands the check (DR-0644).
3. **The concurrency group is unchanged:** `ci-${{ github.ref }}`, with main never cancelled. Every run of a branch now shares one ref, so a newer commit cancels the older run of the same branch.

**What was given up, stated plainly:**
- CI tests the branch head, no longer GitHub's trial merge with main. Live PRs are kept current with main by hand and by keep-prs-current (DR-0644), and a branch behind main is flagged.
- A PR from a fork would get no run. This repository takes no fork PRs.
- A branch pushed with no PR (`probe/*`, `proof/*`) now runs CI, where before it ran none. Those pushes are rare, and each one runs once.

## Impact

- **About half the runner load per commit.** Each PR commit costs one run of about 19 jobs instead of two. Four PRs refreshed together ask for about 76 jobs, where they used to ask for about 150.
- **The deploy-freshness healer and main's own runs** wait behind half as much.
- **The required check, its name and the auto-merge lane are unchanged.** `auto-merge.yml` waits on the required check by name and sweeps on `check_suite: completed`, which the push run's suite emits.
- **Still open:** the ledger-conflict treadmill (DR-0644 §7). Every merge still knocks every open PR out of date until `LANE_PUSH_TOKEN` exists. That needs a token only Darrell can mint. **re-review: 2026-11-12.**

## Verification

- **`ci-runs-once-per-commit.test.js`: 7 tests.** They read the real `ci.yml`:
  - it fires on push, merge_group and workflow_dispatch, and never on pull_request;
  - push runs on `'**'`;
  - the concurrency group is per ref, and main is never cancelled;
  - the required check keeps its name, and the aggregator still runs `if: always()`.
- **Proven to catch.** With main's `ci.yml` restored, two cases fail: "never on pull_request" and "a push to any branch". With this change, all 7 pass.
- **Every test that reads `ci.yml`:** 25 files, 555 tests, all passing (`verify-covers-ci-guards`, `keep-prs-current-lane`, `deploy-freshness-lane`, `quality-manifest`, `system-flow-graph` and the rest).
- **On the lane itself (DR-0107), recorded in the PR thread:**
  - this PR's own head gets exactly one CI run, event `push`, and no `pull_request` run;
  - its required check goes green, and auto-merge merges it;
  - the deploy run's `head_sha` equals main's new tip;
  - the next PR commit after merge gets exactly one run.
