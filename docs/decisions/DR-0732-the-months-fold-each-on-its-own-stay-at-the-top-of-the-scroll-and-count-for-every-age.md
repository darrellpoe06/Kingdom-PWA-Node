# DR-0732 — The months fold, each on its own, stay at the top of the scroll, and count the lessons written for every age

- **Status:** accepted
- **Tier:** A (the lesson list's own headings; no data, no money, no new door)
- **Type:** feature
- **Date:** 2026-10-01
- **Scope:** `app/src/lib/lesson-month-fold.js` (new: fold state, remembered per course on the device); `app/src/lib/lesson-order.js` (`withMonthHeadings` carries `aged`, the count written for every age); `app/src/components/ChurchLearn.jsx` (sticky, folding month headings; the fold-all control; both numbers); `app/src/lib/feature-registry.json` (`learn-month-fold`, `learn-months-fold-all`); tests `lesson-month-fold.test.js` (new), `living-lessons-order.test.jsx`.
- **Principles:** THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), VERIFICATION-DOCTRINE (DR-0076), DR-0726 (registered controls), DR-0687 (month headings in number order), DR-0121 (counts derived, never typed).
- **Grounds:** Darrell, 2026-10-01, on the Church > The Word list: *"Allow the months to be condensed to get to other months faster and to see the count of lessons each month if they are all collapsed... Allow them to work independently and depending on each section separate so all options are available"*; *"keep the date and the count at the top of the scroll until the month is out of the picture and bring that month's data then keep it at the top"*; *"Total number and the other number based of age of competence so parents remember to have their kids review the lessons in the Learn tab."*

## Context

In number order and newest-first, the lesson list heads each run of lessons with the month they were added and its count (DR-0687). July 2026 alone carries 69 lessons, so reaching September meant scrolling past them all, and the month heading scrolled away with its first lesson.

## What was measured

- The headings are rows in one scrolling `<ol>` (`max-h-[45vh] overflow-y-auto`), so `position: sticky; top: 0` on a heading row pins it inside that scroll until the next heading reaches it: the browser's own behaviour, no scroll listener.
- Every one of the 201 Living Lessons carries all four age readings today (`living-lessons-order.test.jsx` derives the number from the modules themselves, never typed), so each month's second number equals its first there; in other courses it can be smaller, which is exactly what a parent should see.
- The Word's division headings stay labels, never folds (Darrell 2026-09-24).

## Impact

A month heading is now a fold: tap it and its lessons close to one line that still says the month, its total, and how many are written for every age; tap again and they open. Each month folds on its own; one control folds or opens them all, so a long course reads as a table of contents. The month being read stays pinned at the top of the scroll until the next month pushes it off. Folds are remembered per course on the device.

## Decision

- `lesson-month-fold.js`: `monthKeys`, `visibleItems`, `toggleFold`, `foldAll`/`openAll`, `foldAllOffer`, `rememberedFolds`/`rememberFolds` (per course, `poetech.lessonMonthFold.v1`).
- The heading row is `sticky top-0` with the list's own background; its whole width is one button (`aria-expanded`, 44 px), reading "▾ July 2026 · 69 · 69 for every age" with a title that tells parents their children can review those lessons at their level in the Learn tab.
- Division headings are untouched.

## Verification

- `lesson-month-fold.test.js` 7/7: only month headings fold; folding one hides only its lessons and keeps its count; months toggle independently; fold all / open all; the offer reads the state; folds remembered per course and junk reads as none; **proven to catch**: without `visibleItems` every lesson shows.
- `living-lessons-order.test.jsx`: on the real Learn tree, July's heading is sticky, folds on a tap (its count of rows leaves, June's L1 stays), opens again; fold-all leaves headings whose counts sum to the catalog and whose for-every-age counts sum to the derived number; the fold survives leaving and coming back.
- `feature-presence` finds both controls; `ui-standards-set` and `consistency-guard` green.
- Not measured here: the sticky heading on the Fold at Big Print. **re-review: 2026-10-08** against Darrell's screen.
