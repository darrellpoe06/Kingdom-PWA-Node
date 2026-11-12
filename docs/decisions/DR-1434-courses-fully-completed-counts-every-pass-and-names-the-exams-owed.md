# DR-1434: Courses fully completed counts every pass the record holds, and each course names the exams still owed

**Date:** 2026-11-12
**Status:** Accepted
**Tier:** A (the reading of his own record; no data changed)
**Type:** decision
**Area:** `app/src/lib/course-pace.js` (`attemptsOf`, `isPass`, `examsOwed`), `app/src/components/LearnersPanel.jsx` (`ExamsOwed`, the Exams passed pair)
**Sent in by:** Darrell, 2026-11-12, with two screenshots of his Learners record. Courses fully completed read 2 of 51. Below it, kingdom-economics, business-research-wars, rent-to-own-business and buying-terms each read 9 of 9 or 8 of 8 at a 100% average, and eternal-revelation read 8 of 8. His words: more than 2 courses are completed, fix it.
**Pairs with:** DR-1422 (done is read AND passed), DR-1393 (the course list), migration 0313

## Context
DR-1422 defines a course as fully completed when every lesson is read and its exam passed. The course list beneath that count showed only reading, under the line "Every lesson in this course is on the record".

## What was measured
- **The count dropped passes the row holds.** `attemptsOf` read only `quiz_history` whenever it held anything. Migration 0313 began keeping history on the day it was applied, but its own comment says the row's `quiz_passed` and `quiz_pct` is the BEST of every attempt. A lesson passed before 0313, and tried once after, therefore showed no pass, and its course could not count.
- **A 100% score with `passed` empty was not a pass.**
- **The list could not show the gap.** Average covers only the lessons whose exam was taken, so 9 of 9 read at a 100% average can still hide an untaken exam. eternal-revelation shows no average at all. Its exams were only added on 2026-11-11.

## Impact
The count and the list now agree on one screen. Where a course is short, it says exactly which exams it waits on.

## Decision
- **A pass the row holds stands beside history that lacks it.** A 100% score counts as a pass whatever the pass mark; an attempt marked failed stays failed (`isPass`).
- **Each course shows Exams passed X of Y**, from the same standing the top count uses.
- **The exams still owed are named.** Under each course, every read lesson whose exam is not yet passed is listed, and on your own record each one is a tap to take it. The definition stands: read AND passed (DR-1422).

## Verification
- **`course-pace.test.js`, 21 green (3 new).**
  - Proven to catch: a pre-0313 pass beside a later history now completes the course, and the test fails by name when the fix is removed.
  - A 100% score with `passed` empty passes; `passed: false` stays failed.
  - A course with one exam owed is not complete, and `examsOwed` names that lesson.
- **Related suites green.** `learners-panel` 26, `course-standing-on-the-list` 8, `family-standing` 21. Lint is clean.

**Not measured:** his live rows. They are on the NAS, which this session cannot read. Confirm on the live build that the count rises and the owed exams are named. `re-review: 2026-11-13`.
