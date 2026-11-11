# DR-1418: The lesson row says what was read, not what is left

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (one label; no data)
**Type:** bug fix
**Area:** `app/src/lib/reading-progress.js` (`readLabel`), `app/src/components/LessonContinue.jsx`
**Sent in by:** Darrell, 2026-11-10, a screenshot of four lessons each reading "CONTINUE · 99% LEFT": "How could I have 99% and not have read it... is the test complete? Fix it?!!!!!!!!"
**Pairs with:** DR-1293 (the percentage on each row), DR-0381 (a surface says what is true)

## What was wrong

The row said how much of the lesson was LEFT. Beside the word Continue, on a bright button, a bare "99%" is read as 99% done. Those four lessons were about 1% read; the label was arithmetically right and said the opposite of what a person takes from it. The tests are not complete on those lessons, and nothing recorded them as read: the Record on the same day names all four as not on the record yet.

## Decision

- **The row says what was READ, in that word:** "Continue · 1% read". At the end it says "all read", as before.
- **Both figures stay for those who want them:** the button's spoken name and its tooltip carry "1% read, 99% left" with the seen and heard marks.
- **Inside a lesson** the bar keeps "N% left" because it sits beside "seen N% · heard N%" and the time left.

## Verification

`reading-progress.test.jsx`, **proven to catch:** a lesson 1.2% read draws "Continue · 1% read" and no "99" anywhere on the button; 38% read draws "38% read" with "38% read, 62% left" in its spoken name.

## Not done, and why

- **Why four unopened-looking lessons each carried about 1%** is not diagnosed. A first screen briefly in view is enough to count its words; whether that is what happened is not known from a screenshot. `re-review: 2026-11-13`.
