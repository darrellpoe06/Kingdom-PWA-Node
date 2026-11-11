# DR-1422: The goal, the gap, and the date this pace reaches it

**Date:** 2026-11-11
**Status:** Accepted
**Tier:** A (one pure reader and one strip on a record the stewards already see; no schema, no door, no money)
**Type:** surface
**Area:** `app/src/lib/course-pace.js`, `app/src/components/LearnersPanel.jsx` (`StandingAndPace`), `app/src/__tests__/course-pace.test.js` (18), `app/src/__tests__/learners-panel.test.jsx` (+4)
**Sent in by:** Darrell, 2026-11-11, on the exam figures: "Completed courses... mastery at 100% tested... should need the goal and measurements", then "Read and tested...", then "Fully completed courses... x amount x to go... on pace for completing by x date at this pace", then "Say the total passed and mastered with testing and reading... so it will be sought after".
**Pairs with:** DR-1386 (taking and grading kept apart), DR-1416 (Understood is mastery), DR-0061 / P15 (a surface is a live view of real state), DR-0076 §4 (measure, never claim), DR-1186 (unknown is never zero), DR-0677 (counts are derived, never hand-written)

## Context

The learner's record counted lessons read, exams taken, exams passed and an average, and each course carried a completion percent. Every one of those is a count of the PAST. Nothing stated a GOAL, nothing said how far was left, and nothing in `app/src/lib` computed a completed COURSE or a date — so the figures could grow all week without answering "am I going to finish, and when".

## What was measured

- **Nothing existed to extend.** A sweep of `app/src/lib` and `app/src/components` for a completed-course count, a projection or a pace found none; DR-1419, the nearest neighbour, is a lesson-row label.
- **Two defects were found by the checks, not by reading.** (1) A true rate of 0.0019 lessons a week rounded to `0` at one decimal place — a real pace rendering as none. (2) `rowToRecord` fills `quizHistory` ONLY from a `quiz_history` column, so a record keeping the single-attempt summary (`quiz_passed`, `quiz_pct`, `quiz_at`) arrives with an EMPTY history; reading only the array showed a learner "Read and tested 0 of 2" on the same screen that said "Exams passed 2".

## Impact

The second defect is the one worth remembering: the unit test passed because it fabricated the `quizHistory` array that live rows do not carry, and only the RENDER check against the real row shape caught it. A test that builds its own convenient shape can agree with a broken reader. `test-integrity.js` reads the same array and skips a record whose history is empty — not changed here, and reported.

## Decision

1. **Done is read AND tested**, in his words: the reading on the record and the exam passed. Read alone is not done; a pass with nothing read is not done (that case is already its own figure, DR-1386).
2. **Mastery at 100% rides beside it, never inside it**, and **both say their total** so the remainder is visible: "Mastered at 100% — 1 of 2 · 1 still to master". A bare count is a pat on the back; the count against the whole is something to go and get.
3. **The date is measured or it is not shown.** The pace is this learner's own finished lessons over the days they span. Fewer than two, or all in one moment, yields NO date and says why. An unreachable pace reads "longer than ten years" rather than a precise day in the next century. A rate never rounds to zero while it is real.
4. **A course whose lesson ids are unknown is not counted at all** — an unknown goal must never render as a reached one.

## Verification

18 checks on the reader, each proven to catch: read-but-untested and tested-but-unread both refuse to close a course; one finished lesson yields no date; an unknown goal is not counted; the slow-rate false zero fails against the old rounding; the summary-column record is a pass. 4 render checks on the real panel, one of them proving no date is printed without a basis. Guards clean (format, file-budget, record-length, workflow-register, flow registry); lint clean across `app/src`.

`re-review: 2026-11-25` — read the strip on the live build at Big Print size, and decide with Darrell whether the pace belongs on the course list too.
