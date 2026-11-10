# DR-1404: Every lesson has a test the reader can take — 171 lessons had none, and the guard now walks every mounted course

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (generated quizzes from existing lesson content, three written quizzes, one reshaped; no schema, no money)
**Type:** surface + verification
**Area:** `eternal-algorithms-course.js`, `healthy-living-course.js`, `world-issues-class.js`, the Learn quiz
**Sent in by:** Darrell, 2026-11-10: "Lessons with no tests?!!!!!!", with a screenshot of "Open the Door → He Comes In to Sup", Pattern 3 of 8
**Pairs with:** DR-1386 (taking is kept apart from grading; the test is the evidence of understanding), DR-0076 §3 (proven to catch), DR-0075 (a ratchet with a re-review date)

## Context

The exam is how the record knows a reading was understood (DR-1386). He opened an Eternal Algorithms pattern and found no test on it at all.

## What was measured

Every course the Learn space mounts was walked, 917 lessons in all. 171 had no test the reader could see:

- **Eternal Algorithms (156).** All 156 patterns across the five courses. ChurchLearn mounts these beside the catalog, so a catalog-only check never saw them.
- **Healthy Living (12).** All 12 lessons.
- **World Issues (3).** Three lessons. Two had no test. The third had one written as a bare array with `choices`, a shape the quiz screen never reads, so it never appeared.

Beyond those, 145 older lessons carry a thin test (one or two questions), and 15 carry a question with no explanation.

## Impact

Every lesson in every course now has a test, and the thin ones are counted and may only shrink. A lesson can no longer ship without a test, and a misshaped test can no longer hide.

## Decision

- **Eternal Algorithms.** `quizFromAlgorithm` builds three or four questions from the pattern’s own catalog words: its IF, its THEN, its anchor passage, and its outcome. Wrong options are the same field from the nearest other patterns, so each question checks that the reader knows this pattern from its neighbors. The answer position is fixed per question by a stable hash: a retake meets the same test, and the right answer is not always first (202, 182 and 240 across the three positions).
- **Healthy Living.** `quizFromWitness` asks which passage the lesson sets beside each cited finding, and who the witness is. A witness’s own quoted phrase is carried in single quotes, because double quotes are reserved for the Word.
- **World Issues.** Two four-question discernment tests were written from the lessons’ own claims and lens. The misshaped test was reshaped to `{ questions: [{ options }] }`.
- **The guard.** `every-lesson-has-a-test` walks the catalog and the Eternal Algorithms courses. It fails any lesson without a well-formed test. It holds the thin and unexplained counts at or below 145 and 15. `re-review: 2026-11-24` — strengthen the thin tests course by course.

## Verification

- **The guard.** `every-lesson-has-a-test.test.js` has 8 cases: the walk covers 917 lessons, 156 of them Eternal Algorithms; every one has a well-formed test; the 171 now carry three or more questions; the ratchet holds; the generators use only the lesson’s own words and are stable.
- **Proven to catch.** No quiz, a bare array, an empty list, a single option and an out-of-range answer are each named. Removing the pattern generator turns four cases red.
- **On screen.** `the-pattern-test-shows-on-screen.test.jsx` renders the real QuizBlock for the screenshot’s pattern and finds every question and every option on screen.
