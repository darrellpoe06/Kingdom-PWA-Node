# DR-1696: the retry repairs the draft, it does not rewrite it

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A — the retry prompt only; the standard, the gates and the brakes are untouched
**Type:** orchestration
**Area:** `infra/nas-lesson-builder/lesson_builder.py`, `lesson_writer.py`, `test_lesson_builder.py`
**Pairs with:** DR-1552 (the faults are named), DR-1641 + DR-1676 (the budget raises), DR-0621, DR-0076 §4
**Session note:** `docs/99-session-notes/2026-11-24-both-roads-shut-then-the-queue-named-its-rows.md`

## Context

The root cause of a two-week stall, found by reading the prompt rather than
guessing. Three changes shipped today, and a full rebuild of 29 teachings moved
the queue **33 → 32. One row.**

## What was measured

Across the five receipts from 14:04Z to 18:14Z every returned row read `failed
after 5` or `rate-limited after 7`, and the fault classes never changed: at
18:14Z `not-the-verse` on **27** of 32, the bare "God" on **26**, and
`span-without-reference` on 18.

Then the prompt (`lesson_writer.py:364`, before this change): it carried the
standard, the verbatim KJV verses, the fault list and the teaching — and **not
the draft that failed.** Each attempt wrote a *fresh* 2000+ word lesson carrying
100+ quotations, told only "a previous draft failed these checks".

That cannot converge. A clean draft needs every quotation right **at once**, so
per-draft success is roughly per-quotation accuracy to the hundredth power: ~37%
at 99%, ~5% at 97%. Fixing the one named verse while the other hundred are
rewritten re-rolls the dice — five independent rolls, which is what is seen.

## Impact

Attempts stop being independent: each starts from the closest draft and fixes
only what the gates named, so progress accumulates. Nothing about the standard
or the gates changes — a repaired draft faces the same checks, so quality is
protected by construction.

## Decision

1. **With a repairable earlier draft, the retry REPAIRS it** — the faults first
   as the task, then the draft, then: keep every other word, quotation,
   reference, movement, band and field unchanged.
2. **`best_previous_draft()` picks the CLOSEST** — fewest problems, then the most
   recent of those. A draft that PASSED was published and is never a candidate; a
   reply that never became a lesson object cannot be repaired.
3. **A first attempt is never a repair**, and an unreadable store answers None
   rather than raising — it is then the fresh write it always was.

## Verification

- **140 cases green** (3 new). Proven to catch four ways: revert to regenerate
  → 1 fails; offer a PASSED draft → 2; pick the farthest draft → 1; drop the
  "change nothing else" instruction → 1. Green when restored.
- The existing retry case proved it end to end on its first run: the real prompt carried the named fault, the correct verse text AND the draft.
- **Not claimed:** no live proof. Whether repair converges is the next receipt's
  measurement, and the honest risk is the opposite failure: a writer that returns
  the draft unchanged makes no progress either. `re-review: 2026-12-03`.
