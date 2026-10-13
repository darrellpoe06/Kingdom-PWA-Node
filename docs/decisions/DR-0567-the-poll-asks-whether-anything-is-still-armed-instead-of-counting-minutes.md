# DR-0567 — The heal poll asks whether anything is still armed, instead of counting minutes

- **Status:** accepted
- **Tier:** C (a change to the merge / CI / deploy lane — DR-0107 governs; proven by real merges producing real deploys, below)
- **Type:** orchestration
- **Date:** 2026-09-22
- **Shipped in:** #1728 (the 40-minute raise), this record's PR (the constant removed)
- **Scope:** `.github/workflows/auto-merge.yml` (`heal-deploy` and `heal-migrate` loops), `app/src/__tests__/migration-dispatch-lane.test.js` (the pin is now a shape)
- **Principles:** UPTIME-OUTRANKS-VELOCITY (DR-0107), VERIFICATION-DOCTRINE (DR-0076 — measured on the six most recent CI runs), GATE-THE-CLASS (DR-0239 dim 7), THREE-BRAKES (a ceiling, not a timer that spawns work)
- **Grounds:** DR-0458 (the seventh miss, and the event hook), the workflow's own comment history (2 → 6 → 12 → 40 minutes), PRs #1727 and #1728 (misses eight and nine, 2026-09-22)
- **Relates to:** DR-0458 — read together

## What was measured

| | |
| --- | --- |
| CI wall-clock, six most recent runs | 16.9, 16.8, 18.0, 17.1, 18.8, 11.6 min (19,208 tests) |
| #1727: sweep armed / gave up / merge | 15:57:52 / 16:09:52 / ~16:14 — **missed by 4 min** |
| #1728: sweep (old file) / gave up / merge | 16:38:49 / 16:51:23 / 16:56:26 — **missed by 5 min** |
| DR-0458's `workflow_run` hook | fired at 16:10:49 on the sweep's end, looked ~3 min, ended before the merge — **also missed** |
| After the 40-minute raise: #1729, #1730, #1732 | deployed by `github-actions[bot]` **16 s, 11 s, 7 s** after each merge |

## What was decided, and the honest relationship to DR-0458

DR-0458 chose *not* to raise the timer again and instead made the healer hear the merge. It was right about the timer and it still missed today, because its hook is chained to the sweep's end — and a sweep shorter than CI ends before the merge it is waiting for, so the hook fires early. The 40-minute raise in #1728 fixed the symptom (three catches) and would have been the fifth constant to go stale.

**So the constant is removed.** Both heal loops now poll **while any PR remains armed**, re-asking every 15 seconds, and leave after one last look once none is — under a **60-minute ceiling that is a brake, not a target**. The sweep now lives as long as a merge can land, which is also exactly what makes DR-0458's hook fire after the merge rather than before it. The two nets stop disagreeing about when a merge can happen.

## The ninth miss, found while this record was being written (2026-09-23)

#1735 merged at **23:57:36** with the 40-minute sweep **alive and polling** (heal-deploy of run 35796585068, 23:20:22 → past 00:03). No deploy was dispatched. A live poll that watches a merge and does nothing has a different cause from a poll that ended early, and the old loop could produce it two ways, both silently: every `gh` error went to `/dev/null` and read as "nothing to do" — and two loops × two calls every 15 s is ~960 calls/hour against `GITHUB_TOKEN`'s 1,000/hour, a budget the whole repo shares; and a failed `gh workflow run` still set `dispatched_for`, so one refusal became a permanent skip for the rest of the window.

**So the loop was rewritten again before this record merged:** 30-second passes (half the budget), the armed re-check on every fourth pass, every API error printed with the API's own words, and `dispatched_for` set only after a dispatch that returned 0. The pin now also asserts that no `gh` read in the lane is swallowed. **The sweep finished, and it was neither of those two.** Run 35796585068's heal-deploy ended `failure` at **00:08:22 — exactly 48:00 after it started — with its only step still `in_progress`** and no log ever uploaded (the API answers 404 for it). A rate-limited call returns at once; this step never returned at all. A `gh` call with no timeout hung, and the watcher froze while looking alive, through the merge and until something killed it. So, in the same PR: **every `gh` call in both heal loops carries `timeout 25`** (eleven of them), and both heal jobs carry an explicit `timeout-minutes: 75` so the ceiling is the workflow's and not a mystery. The pin asserts both.

## Verification

- `migration-dispatch-lane`: the pin asserts the shape — two armed re-checks, two exit conditions, the 240-iteration ceiling — not a number. `deploy-freshness-lane` unchanged and green. Both YAML files parse.
- DR-0107's proof: watched on the next merges through this record's own PR; recorded on the PR when observed.
