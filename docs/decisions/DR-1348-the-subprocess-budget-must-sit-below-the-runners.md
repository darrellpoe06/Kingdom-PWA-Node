# DR-1348: The subprocess budget must sit below the runner's — the tie that read as a flake three times, and the memory that had gone stale under it

**Date:** 2026-11-05
**Status:** Accepted
**Tier:** A (test-only fix, one new deterministic gate wired into `verify:gates`, one Layer 0 memory line corrected by measurement; no product code, no schema, no money, no surface)
**Type:** correction + new gate
**Declared by:** Darrell, 2026-11-05, reporting the failing case with the mechanism already measured — *"a timeout budget tie that makes one case fail intermittently in CI. It is not a flake; it is a race by construction."*
**Area:** `app/src/__tests__/the-deploy-has-more-than-one-road.test.js` · `app/src/__tests__/a-backup-on-request.test.js` · `scripts/subprocess-budget-guard.mjs` (new) · `app/src/__tests__/subprocess-budget-guard.test.js` (new) · `app/package.json` (`verify:gates`) · `CLAUDE.md` (the `feedback_no_coauthor_trailer` memory line)
**Found by:** Darrell, from CI run `42081880950` shard 1/4, while shipping an unrelated lesson (sov68, DR-1338) whose diff touches neither file — and deliberately NOT fixed there, to keep that PR from widening.
**Considered, not built:** giving `served-anon-key.py` a total wall-clock deadline of its own (it has only per-fetch timeouts). That would make one number bound the whole run instead of a multiplier, but it changes a script the deploy lane depends on to fix a test-only defect. `re-review: 2026-12-05`.
**Pairs with:** **DR-1269** (the two roads these tests prove), **DR-0076** (§3 proven-to-catch, §4 measure don't claim, §5 characterize before you change), **DR-0239** (gate-the-class), **DR-0075** (perpetual improvement — a why + a date, or it improves), P54 in `app/vitest.config.js` (the same shape one layer up)

## Context

A case in `the-deploy-has-more-than-one-road.test.js` failed in CI and passed everywhere else. The reflex reading is *flake, re-run it*. The reading was wrong, and the evidence said so before any code was touched:

- CI run `42081880950`, shard 1/4: `Error: Test timed out in 5000ms`, the case clocked at **5009 ms**.
- The failure was **always a timeout, never an assertion**. No expectation in the case has ever been observed wrong.
- The siblings in the same `describe` passed in **517 ms** and **1059 ms**. The failing case is the only one that scans all three chunks **and succeeds**, so it does the most work.
- 18/18 locally, three consecutive runs.

A 9 ms overrun against an exactly-equal budget is not randomness. The helper granted the spawned script `--timeout 5`; the case carried no vitest ceiling, so it ran under the default **5000 ms**. The inner budget *equalled* the outer one, and **the runner kills the case rather than waiting for the script**. The tie was written down.

## What was measured

**The budget relationship was worse than a tie — by 4×.** `--timeout` is `served-anon-key.py`'s **per-fetch** allowance (`urlopen(..., timeout=)` at `scripts/served-anon-key.py:38`), not a total wall clock. The script fetches the shell (line 61), then every hashed asset the shell names, **sequentially** (line 76). The failing fixture serves three chunks, so the real worst case was **4 × 5 s = 20 s** under a 5000 ms ceiling.

This killed the obvious fix. Lowering the per-fetch value alone to 3 s still allows **4 × 3 = 12 s > 5000 ms**. Both ends had to be pinned: **3 s per fetch, and an explicit 20000 ms runner ceiling.**

**The mechanism was reproduced rather than asserted** (DR-0076 §3). A repro delaying each fixture response 1500 ms — four fetches, ~6 s of real work, every fetch far inside its own allowance, so only the runner's ceiling is crossed:

| budget pair | result |
|---|---|
| 5 s inner, 5000 ms default | **FAIL at 5007 ms**, `Test timed out in 5000ms` — within 2 ms of the CI signature |
| 3 s inner, 20000 ms explicit | **PASS at 6085 ms** |

**The ceiling went on every spawning case, not only the one seen to fail.** A case that is quick because its fixture refuses early is quick *by fixture*, still tied *by budget*. That instruction is what found the rest.

**The same tie was in the same file a second time, and in another file a third.** `SOVEREIGN_REPLAY_TIMEOUT` was also `'5'` against the same 5000 ms default — and the single-flight case invokes `replay-on-clock.sh` **twice**, so its worst case was 10 s. Then `a-backup-on-request.test.js` passed `execFileSync { timeout: 60000 }` while every case carried a `60000` ms ceiling: a dead tie at 60 s, never reached only because the job returns as soon as `BACKUP_WAIT_S` elapses.

**Three recurrences of a class is a gate, not a comment** (DR-0239). The shape is already documented one layer up as **P54** in `app/vitest.config.js:30-46`, where an inherited DNS wait made 11 tests fail at `~5002 ms` in a loaded suite and pass alone in 1.7 s. Four instances across two layers.

## What changed

**`scripts/subprocess-budget-guard.mjs`** (new, wired into `verify:gates` before `no-prompt-guard`). For each test case that can reach a spawn, it fails the build when the file's declared subprocess budget is **>= that case's runner ceiling** (its third argument to `it()`/`test()`, or vitest's 5000 ms default). It reads budgets in their own units — a `child_process` `timeout:` option as ms, a `--timeout` flag and a `*_TIMEOUT` env value as seconds — resolves one held in a named constant, and declines to guess a computed one. Spawns usually sit inside a helper, so it marks helpers that spawn and helpers that call those, to a fixpoint.

**Its stated limit, in the file:** it compares ONE budget against the ceiling and does not know how many times a case invokes the script. Several of these budgets are per-fetch or per-invocation, so a case can satisfy the guard and still be tied through a multiplier. That residual stays in the test file next to the fixtures that set the count — `budgetsAreOrdered` in `the-deploy-has-more-than-one-road.test.js` pins (fetches × per-fetch) and (invocations × per-run). The guard is the floor; the test is the ceiling for its own fixtures.

**Proven-to-catch, end to end and in units.** Run against the tree before the second fix, the CLI flagged all five tied cases in `a-backup-on-request.test.js` and correctly skipped the one case in that file that reaches no spawn. `subprocess-budget-guard.test.js` feeds it the three shapes that actually shipped and requires a finding for each, then the corrected shapes and requires silence. `budgetsAreOrdered` was run against the old pair and fails it (`expected 20000 to be less than 5000`), and against a replay-side reintroduction (`expected 30000 to be less than 20000`).

**A defect in the gate's own exemption, found by its own test.** The proof suite must be exempt — its fixtures are tied shapes on purpose. The first exemption matched the guard's **file name** anywhere in the source, so the comment added to `a-backup-on-request.test.js` naming its enforcer **exempted that file from the gate**: documenting the rule would have been how to escape it. The exemption now requires a real `from '…subprocess-budget-guard.mjs'` import, with comments masked first, and a case asserts that naming the guard in a comment exempts nothing.

**One Layer 0 memory corrected by measurement.** `feedback_no_coauthor_trailer` said this repo's commits carry no Claude co-author trailer. Measured: **49 of the last 51 commits carry `Co-Authored-By: Claude …` plus a `Claude-Session:` line**, consistently since `586e75d` (2026-10-29). The memory line is now marked superseded with the measurement and the date, rather than deleted, because it still loads and would otherwise be obeyed. This is exactly the staleness that section's own closing line warns about — *memories reflect what was true when written* — and it is the first time that warning has been exercised against one of its own bullets.

## Impact

**What this obligates.** The guard is wired into `verify:gates` AND `.github/workflows/ci.yml`, so this record touches the CI lane, and **P26 / DR-0107 binds: a merge/CI/deploy-lane change is not done until a real merge has produced a real deploy.** CI-green is not deploy-proof. The edit adds one step to an existing job and alters no trigger, no concurrency group and no deploy dispatch, so no downstream `push`-triggered effect changes shape — but the proof is the real merge, read by **exact `head_sha`** and never from the first row of a runs list (P62).

**What this does NOT do, stated rather than discovered later.** The guard compares ONE declared budget against one ceiling. It cannot see how many times a case invokes the script, and neither inner budget here is a total wall clock — `--timeout` is per fetch, `SOVEREIGN_REPLAY_TIMEOUT` per invocation — so **a case can satisfy this guard and still be tied through a multiplier.** That residual is deliberately left with the fixtures that set the count, in `budgetsAreOrdered`; the guard is the floor, that test is the ceiling for its own fixtures. A guard that claimed to cover the multiplier would be the more dangerous artifact.

**Two tooling findings left open rather than fixed here.** `claim-decision-number.mjs` answers confidently and wrongly when a branch's refs are not fetched locally, and says nothing about what it could not see — it reported `DR-1345` free while an unlanded branch held 1345 and 1346. And nothing prevents the number collision itself, which DR-1021 already dates as a Governor's call about the shared-pointer convention rather than a tooling change. Both are reported on the PR; neither is this record's to close. `re-review: 2026-12-05`.

**What it cost to land.** Three base merges and two renumbers (DR-1334 → DR-1347 → DR-1348), which is DR-1021's measured renumber cost paid twice, and DR-1136's warning that a second repair yields to a merged one proved exactly right when #2553 landed holding DR-1347.

## Verification

- `the-deploy-has-more-than-one-road.test.js`: **19/19**; **20/20** consecutive runs idle; **5/5** under 12 busy loops on 4 cores (3× oversubscription).
- `a-backup-on-request.test.js`: **6/6**. `subprocess-budget-guard.test.js`: **14/14**.
- `verify-covers-ci-guards.test.js`: **9/9** — it is what caught the guard being in `verify:gates` and not in `ci.yml`, DR-1308's reverse direction finding its twelfth instance.
- **222/222** across the 13 suites that read `ci.yml`, plus this branch's three.
- `eslint --max-warnings 0` clean on every touched file; `ci.yml` parses; `workflow-list-order-guard` OK.
- `npm run verify:gates`: every gate passes, including the new one in sequence, **with one honest exception** — the chain exits **2** on its last step, `lesson-dates:check`, because `derive-lesson-dates` needs full git history and the verifying container has a shallow clone. It exits 2 identically on clean `origin/main`, so it is environmental and pre-existing, not this change's. An earlier draft of this record called the chain "green ... exit 0"; that came from reading a `tail`'s exit code instead of npm's — the same mistake DR-1136 records making with a guard, repeated here a fortnight later, which is why the measured statement replaced it.
- `scripts/served-anon-key.py`, `replay-on-clock.sh`, `ops-runner.py` and the deploy workflow are **untouched** — no product behavior changes.

## The rule, for the next session

**A spawned script's own budget must stay strictly below the test runner's timeout, because the runner kills the case rather than waiting for the script.** Equal budgets are a race by construction: the case dies as `Test timed out in Nms`, no assertion is ever wrong, and it passes on an idle machine — so it reads as a flake and gets re-run instead of fixed. Size the inner budget against its real worst case, which may be a multiplier rather than the number written down, and put the ceiling on every spawning case, not only the one that has been seen to fail.
