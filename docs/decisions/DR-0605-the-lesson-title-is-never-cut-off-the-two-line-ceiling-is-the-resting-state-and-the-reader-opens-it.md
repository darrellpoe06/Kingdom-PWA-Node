# DR-0605 — The lesson title is never cut off: the two-line ceiling is the resting state, a measured fold control opens the whole title inside the sticky block, and the full title stands in the flow at the head of the lesson

- **Status:** accepted
- **Tier:** A (one reader surface; no schema, no transport, no money)
- **Type:** fix (post-screenshot)
- **Date:** 2026-09-24
- **Scope:** `app/src/components/ChurchLearn.jsx` (the sticky lesson title gains `titleOpen` state, an overflow measurement on the element, and a fold control `lesson-space-title-toggle` rendered only when the title overflows two lines; opening removes the clamp; the next lesson folds it again); `app/src/__tests__/the-title-stays-in-view.test.jsx` (+5 render pins with a layout stand-in for jsdom, incl. proven-to-catch that a fitting title shows no control); `app/src/__tests__/nothing-hovers-over-the-word.test.js` (+1 source pin keeping the control beside the clamp)
- **Principles:** REALITY-TRACE (DR-0061 — measured on the element, never guessed from the title's length), VERIFICATION-DOCTRINE (DR-0076 §3 proven-to-catch, §4 measure), DO-NOT-RE-ASK (DR-0111), feedback_surface_premise_conflicts (three standing words reconciled, none dropped), DR-0410 / DR-0432 (the control is chrome and stays capped; the title is text and grows)
- **Grounds:** Darrell 2026-09-24, two Big Print screenshots of Lesson 101 whose sticky title ended in "…": *"The title to lessons are getting cut off!!!!!! Fix it..."*

## Context — the question

Three of his words govern this one element and all three must hold:

1. **2026-09-17:** *"The title to these lessons should stay at the top... so that people can remember what we're talking about"* — the title rides the sticky block.
2. **2026-09-22:** *"these types of words covering the Word... are not wanted"* — at Big Print a three-line sticky title was a lid on the lesson, so the title was capped at two lines (`nothing-hovers-over-the-word`).
3. **2026-09-24:** the cap, met on a long title at A44, reads as a title cut off.

Dropping any one of the three to satisfy another is the premise conflict this record refuses. A title that scrolls away breaks the first; an unbounded sticky title breaks the second; a silent clamp breaks the third.

## What was measured

| what | measured |
| --- | --- |
| the element before | `-webkit-line-clamp: 2`, `max-height: 2.8em`, `overflow-hidden`, the full title on the `title` attribute only — reachable by hover, which a phone does not have |
| Lesson 101's title | 116 characters; at A44 (2.75×) on his Fold it fills two lines and is cut mid-word |
| the lesson card in the flow | already renders `Lesson 101 · <full title>` at the head of the card (`ChurchLearn.jsx`, the `learn-lesson-<id>` list item), so the whole title is on screen on arrival before any tap |
| after | resting state unchanged (two lines, clamp, ceiling); a 44px fold control beside the title, rendered only when `scrollHeight > clientHeight` on the title element; one tap opens the whole title inside the sticky block (clamp and ceiling removed, `data-open="true"`, `aria-expanded="true"`); a second tap folds it; opening another lesson folds it; the measurement re-runs on resize and on every text-size change through `subscribeTextSize` |
| gates | `the-title-stays-in-view` 19/19 (five new), `nothing-hovers-over-the-word` 17/17 (one new); eslint 0 |

## Decision

1. **The two-line ceiling stays as the resting state.** A sticky label still never covers the Word by default.
2. **The reader owns the lid.** When, and only when, the title actually overflows two lines, a fold control renders beside it; a tap opens the whole title inside the sticky block, a tap folds it, and the next lesson folds it. The control is chrome (`ts-chrome-region`, 44px) and the title is text (grows with Big Print), per DR-0410.
3. **Overflow is measured, never guessed.** jsdom lays nothing out, so the render pins stand in for layout with a getter on the one element and prove both branches: an overflowing title gets the handle; a fitting one gets none.
4. **The full title in the flow is confirmed and pinned**, so a reader meets the whole title on arrival without a tap; the sticky copy is the landmark for the long read.

## Limits, stated

1. **A hand on the fold control is one tap per lesson.** If he finds himself tapping it on every long lesson, the next step is a remembered preference (open by default) in the reader's settings; the state is already per-lesson so the change is one line. `re-review: 2026-10-07`.
2. **The stand-in layout in the pins is not the browser's.** The DR-0104 live review after merge is the real measurement: Lesson 101 at A44 on his Fold, the handle visible, one tap, the whole title, no lid.

## Verification

- The suites above; the proven-to-catch pin fails the build if a fitting title ever grows a control, and the source pin fails if the control is removed from beside the clamp.
- After merge: DR-0104 live review on his Fold — Church → Learn → Living Lessons → Lesson 101 at A44: the resting two lines with the handle, the tap, the whole title, the fold on Next.
