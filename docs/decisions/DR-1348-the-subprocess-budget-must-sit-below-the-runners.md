# DR-1348: The subprocess budget must sit strictly below the test runner's

**Date:** 2026-11-05 · **Status:** Accepted · **Type:** correction + new gate · **Tier:** A (test fix, one gate, one `ci.yml` step, one Layer 0 line corrected by measurement; no product code, schema, money or surface)
**Declared by:** Darrell, 2026-11-05, mechanism already measured — *"a timeout budget tie that makes one case fail intermittently in CI. It is not a flake; it is a race by construction."*
**Area:** `__tests__/the-deploy-has-more-than-one-road.test.js` · `…/a-backup-on-request.test.js` · `scripts/subprocess-budget-guard.mjs` + its test (new) · `app/package.json` · `.github/workflows/ci.yml` · `CLAUDE.md`
**Found by:** Darrell, CI run `42081880950` shard 1/4, while shipping sov68 (DR-1338), whose diff touches neither file — deliberately not fixed there.
**Session note** (narrative, repro table, the four errors of mine that CI and the hooks caught): [`99-session-notes/2026-11-05-subprocess-budget-tie.md`](../99-session-notes/2026-11-05-subprocess-budget-tie.md)
**Considered, not built:** a total wall-clock deadline inside `served-anon-key.py`, which has only per-fetch timeouts — one number would bound the whole run instead of a multiplier, but it changes a script the deploy lane depends on to fix a test-only defect. `re-review: 2026-12-05`.
**Pairs with:** DR-1269, DR-0076 (§3, §4), DR-0239, DR-1308 (the gate that caught this one), DR-1136, P26/DR-0107, P54.

## Context

A case failed in CI and passed everywhere else; the reflex reading is *flake, re-run it*, and it was wrong. Shard 1/4 died at **5009 ms** against the default **5000 ms** ceiling — a 9 ms overrun on an exactly-equal budget, always a timeout and never an assertion, 18/18 locally. The helper granted the spawned script `--timeout 5` and the case carried no vitest ceiling, so inner equalled outer, and **the runner kills the case rather than waiting for the script.**

## What was measured

**Worse than a tie, by 4×.** `--timeout` is `served-anon-key.py`'s **per-fetch** allowance (`served-anon-key.py:38`), not a total wall clock, and it fetches the shell then every hashed asset **sequentially** — worst case **4 × 5 s**. Lowering that value alone still leaves 12 s under 5000 ms, so both ends are pinned: 3 s per fetch, explicit 20000 ms ceiling.

**Reproduced, not asserted.** Delaying each fixture response 1500 ms fails the old pair at **5007 ms** with the runner's own timeout, within 2 ms of the CI signature, and passes the new pair at 6085 ms.

**The same tie twice more**, found by ceilinging every spawning case rather than the one seen to fail: `SOVEREIGN_REPLAY_TIMEOUT` was also `'5'` with its single-flight case invoking the script twice (10 s), and `a-backup-on-request` had `{ timeout: 60000 }` under a 60000 ms ceiling. Four instances counting P54 one layer up.

## Decision

**A spawned script's budget stays strictly below the runner's timeout**, sized against its real worst case — which may be a multiplier, not the number written down — on every spawning case, not only one seen to fail.

`scripts/subprocess-budget-guard.mjs` enforces it, in `verify:gates` **and** `ci.yml`, because a guard CI never runs is not a guard (DR-0076 §3). It reads budgets in their own units (ms option, seconds flag, seconds env), resolves one held in a constant, declines to guess a computed one, and marks helpers that spawn to a fixpoint, since the spawn is never inside the case.

`CLAUDE.md`'s `feedback_no_coauthor_trailer` is **inverted by measurement**: 49 of the last 51 commits carry the Claude trailer, since `586e75d`. Marked superseded rather than deleted, because it still loads.

## Impact

**It obligates the deploy proof.** Touching `ci.yml` puts this under **P26 / DR-0107**: not done until a real merge produces a real deploy, read by exact `head_sha`, never a runs list's first row (P62). The edit adds one step and alters no trigger, concurrency group or deploy dispatch.

**What it does NOT do.** The guard compares ONE budget against one ceiling and cannot see a multiplier, so a case can pass it and still be tied. That residual stays with the fixtures that set the count, in `budgetsAreOrdered`. A guard claiming to cover the multiplier would be the more dangerous artifact.

**Left open, dated.** `claim-decision-number.mjs` answers confidently and wrongly when branch refs are unfetched, and says nothing about what it could not see; and nothing prevents the collision itself, which DR-1021 dates as a Governor's call. Both reported on the PR. `re-review: 2026-12-05`.

## Verification

- 19/19, 6/6, 14/14 on the three suites; **20/20** consecutive idle runs; 5/5 under 12 busy loops on 4 cores.
- `verify-covers-ci-guards` **9/9** — it caught the guard missing from `ci.yml`, DR-1308's twelfth instance; **222/222** across the 13 suites reading `ci.yml`.
- `decision-chain` and `claude-md-budget` green once this record gained Impact and Layer 0 was folded to 57880 B.
- Every `verify:gates` gate passes. **Honest exception:** the chain exits non-zero on its last step, `lesson-dates:check`, which needs full git history and exits the same on clean `origin/main` — environmental and pre-existing. An earlier draft called it "green, exit 0" from a `tail`'s exit code rather than npm's; see the session note.
- `served-anon-key.py`, `replay-on-clock.sh`, `ops-runner.py` and the deploy workflow are **untouched**.
