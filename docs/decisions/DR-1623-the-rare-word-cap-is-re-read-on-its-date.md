# DR-1623: The rare-word cap is re-read on its date

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** A (one decided threshold in the intake's "already decided" match; no schema, no money)
**Type:** re-review
**Area:** `app/src/lib/intake-outcome.js` (`DECIDED_MATCH.rareMaxDocs`)
**Pairs with:** DR-1028 (set the cap and dated this review), DR-0248, DR-0110, DR-1619

## Context

DR-1028 set `rareMaxDocs: 65` (a word counts as rare when at most 65 decided records hold it), chose it from the measured gap between two bracketing notes, and dated its own re-review for **2026-11-14**. The review was not taken. On 2026-11-24 CI's `intake-outcome.test.js` failed on PR #2844: the kill-switch note answered with DR-0110 in place of DR-0248, which amends it.

## What was measured

Measured on the real ledger: 1366 decided records on this branch, 1363 on `main`.

- **The must-match note** ("the kill switch should be back on the deterministic automation loops") shares with DR-0248 the words `kill` (df 33), `deterministic` (41), `loop` (65 on main, 66 here) and `switch` (68).
  - `switch` was already over 65 on `main`, so DR-0248 matched on exactly three rare words, with `loop` sitting at the cap itself.
  - DR-1619 mentions the NAS loops, which took `loop` to 66. That left DR-0248 with two rare words, so DR-0110 (with `kill`, `deterministic`, `automation` 17) won.
- **The must-not-match note** ("add the giving link from the church website") has only `website` (3) and `giv` (31) under any cap below `church` (131) and `link` (133).
- **The safe window is now [66, 130].** DR-1028's window was [54, 78].

## Impact

At 65, a note asking for the kill switch back would have been told the older record governs, citing DR-0110 instead of DR-0248, the one that changed it. That is the wrong reason given to a person.

## Decision

`rareMaxDocs: 80`. That is 12 clear of `switch`, the highest word the true positive needs, and 51 below `church`, the nearest word that must not count. Everything else in DR-1028 stands: an absolute cap, a decided number, matching that only gets harder as the ledger grows. The code comment beside the number carries today's measurements.

## Verification

- `intake-outcome.test.js` and the other suites that read `DECIDED_MATCH` pass: 126 tests.
- **Proven to catch:** the same test failed on CI at 65 against this ledger (PR #2844, run 45335625770, shard 1).

`re-review: 2027-01-24`, or the first time the suite flags this edge again, whichever comes first.
