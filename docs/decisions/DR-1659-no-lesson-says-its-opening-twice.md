# DR-1659: No lesson says its opening twice

**Date:** 2026-11-25
**Status:** Accepted
**Tier:** A (display only; no lesson words changed or removed)
**Type:** fix
**Area:** `app/src/components/kids/KidsAdventure.jsx`, `app/src/components/learn-studio/LessonExperience.jsx`, `app/src/__tests__/no-lesson-says-it-twice.test.js` (new), `app/src/__tests__/lesson-experience-prototype.test.jsx`
**Sent in by:** Darrell, 2026-11-25: "at times it looks like in some places the first few paragraphs of the lessons are repeated... why?"
**Pairs with:** DR-1654 (the new look), DR-1658 (both views for kids and adults)

## Context

Darrell saw the start of some lessons twice.

## What was measured

- The lessons' own text never repeats a paragraph: 0 of 337 Living Lessons.
- The Kids lesson showed the age's opening in the guide's bubble, and section one began with the same words: 946 of 946 Kids, Youth and Teen lessons.
- The new look's Key Teaching box showed the big idea after the first paragraph; in 40 of 337 lessons the big idea is already in the lesson's own text (ll338 among them).
- The classic lesson page was not measured: the test harness did not open a lesson there (0 matches of anything), so no claim is made about it.

## Decision

1. **The Kids bubble says the first of opening / title / big idea that the reading does not already begin with**, and nothing when all three would repeat it (3 lessons whose title is their first line).
2. **Key Teaching shows only when the text does not already carry the big idea.**
3. Every word of every lesson still renders; only the repeated copy above it is dropped.

## Impact

- A child reads the opening once. 297 of 337 lessons keep their Key Teaching box; 40 drop a duplicate.

## Verification after merge

- `no-lesson-says-it-twice.test.js`: no Kids/Youth/Teen lesson's bubble repeats its first section (it caught the 3 title cases on its first run). 95 of 95 across the Kids and new-look suites; 9 of 9 in the other files that touch the bubble.
- Darrell sends a screenshot if he still sees a repeat, with where (classic page is unmeasured).

`re-review: 2026-12-02`
