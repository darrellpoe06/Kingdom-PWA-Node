# DR-1676: the gate changed under the rows, so the measurement must be re-taken

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A — one bounded retry count; every brake unchanged (DR-1202's reasoning)
**Type:** orchestration
**Area:** `infra/nas-lesson-builder/lesson_builder.py`, `test_lesson_builder.py`
**Pairs with:** DR-1641 (4, not 2), DR-1202 (a bounded count is not a brake), DR-1670 + DR-1672 (the gate that changed), DR-0075, DR-0076 §4
**Session note:** `docs/99-session-notes/2026-11-24-both-roads-shut-then-the-queue-named-its-rows.md`

## Context

DR-1670 and DR-1672 are **live** — proven by exact content hash, not assumed:
the 14:04Z receipt reads `code: 98a82136aec37d6a`, the value `origin/main`
computes for the builder's three files. And the queue did not move, because it
cannot: every waiting row is past its budget.

## What was measured

The 14:04Z receipt (run after merge `b237084ce5b`), across all 33 rows:
**29 read `failed after 4`** and **4 read `rate-limited after 6`** — the two
ceilings exactly. So not one of the 33 would ever be offered to the changed
gate. `generic-God-not-Yahweh` refused **25** of them, and that is the cause
DR-1672 relaxed for the covenant construct.

DR-1551's re-review concluded earlier today that **more attempts do not help** —
DR-1641's raise extended the queue one cycle without clearing it. That holds
*for the gate it was measured against*, and **that gate is gone**: the premise
changed, so the measurement must be re-taken rather than cited.

## Impact

The 33 are offered to the new gate exactly once. How many clear is then a
measured number instead of an estimate — and whichever way it falls, it says
where the remaining work is (`not-the-verse` sits on 23 of 33 and nothing has
touched it).

## Decision

1. **`MAX_ATTEMPTS` 4 → 5.** One attempt, because the gate changed — explicitly
   NOT because more tries help, which was measured and refuted.
2. **Every brake unchanged**, by DR-1202's reasoning: `BUILD_MAX_SECONDS`, the
   per-row lock, the stop-paths. Bounded, never a loop.
3. **The precise mechanism is deliberately not built.** A failure's tags are
   `build:failed@<ts>` and `build-reason:<text>` and carry **no builder code**,
   so "the gate changed, try once more" cannot reach a row that failed under the
   old code. Recording the code on each failure would make that bounded retry
   possible for the next gate change instead of a blanket raise — this being the
   second instance of the same friction (DR-0075). `re-review: 2026-12-03`.

## Verification

- **137 cases green.** Proven to catch both directions: removing the budget
  (99999) → 3 fail; leaving it at 4, where the 33 never reach the new gate → 3
  fail. Green at 5.
- A case pins the point of the raise: four spent attempts are offered once more,
  five are spent — one attempt, not a loop. Literals kept, since a case reading
  the constant could not catch it being raised to a loop.
- **Not claimed:** nothing is measured live yet. The proof is the receipt
  reading the new builder hash and the attempt counts moving off 4.
