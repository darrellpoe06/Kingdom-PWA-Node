# DR-1469: The newest lesson's day is checked as a rule, not a pinned date

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (one test; no lesson content, no behavior)
**Type:** decision
**Area:** `app/src/__tests__/living-lessons-order.test.jsx`
**Sent in by:** DR-1468's own `re-review: 2026-11-16` (Darrell 2026-11-13: build the parallel lesson pipeline and allow parallel branches)
**Pairs with:** DR-1468 (one file per lesson, numbers reserved on origin), DR-0076 §3 (proven to catch)

## Context
DR-1468 freed every per-lesson edit but one: `living-lessons-order.test.jsx` pinned the newest lesson's day by hand (`'2026-11-13'` for L306). Every lesson branch rewrote that one line, so two lessons built in parallel collided there.

## What was measured
- The pin was rewritten by each lesson batch: its comment holds a dated paragraph for every lesson batch since L245.
- The L302–L306 branch, the reason DR-1468 left it, landed on main as #2653.

## Impact
A new lesson no longer edits this test. Parallel lesson branches share no line in it.

## Decision
The pinned date becomes a rule, `newestDayProblem`. The highest-numbered lesson carries a real day, that day is the latest any lesson carries, and it is not in the future. The existing check that number order never runs backward in time stays.

## Verification
`living-lessons-order.test.jsx`: 20 tests pass, including the new proven-to-catch case. A newest lesson with no day, with an older day, or with a future day each fails by name. The number was reserved with `claim-decision-number --reserve` (refs/heads/reserve/dr-1469), proving DR-1468's road from a second session.
