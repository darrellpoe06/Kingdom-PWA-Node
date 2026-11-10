# DR-1412: The record's figures are sized by their text, so Big Print never runs them into each other

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (layout of three figure rows on the learner record; no data, no schema)
**Type:** bug fix
**Area:** `app/src/components/LearnersPanel.jsx` (`Figure`, `FIGURE_GRID`)
**Sent in by:** Darrell, 2026-11-10, a Big Print (A44) screenshot of his record, YOU · ADULT, with the five figures run together: "LESSONSVERSIONS", "Child,35", "attempts100%". "Fix it"
**Pairs with:** DR-1393 (the course table on the same record, stacked for Big Print), DR-0076 (measure, don't claim)

## Context

The record shows five figures in a row: lessons read, versions read, exams taken, exams passed and average score. Two more rows use the same tiles: how the exams were taken, and the class totals for a governor.

## What was measured

- **The cause.** All three rows counted their columns by the screen, five columns from 640px wide (`sm:grid-cols-5`). Big Print makes the words 2.75 times larger but leaves the screen the same, so a five-column row kept five columns its words no longer fit.
- **The measurement.** I rendered the tiles' own markup and CSS in Chromium at Big Print 44, at four widths:

  | Width | Old rule: tiles spilling | Page scrolls sideways | New rule: tiles spilling |
  |---|---|---|---|
  | 768px | 3 | yes | 0 |
  | 360px | all 5 | yes | 0 |
  | 1920px, 1280px | 0 | no | 0 |

  Under the new rule, the 1920px row wraps to 4 columns, 1280px to 3, and 768px and 360px to 1.

## Impact

At any text size and any width, each figure stays inside its own box, and the row wraps to fewer columns instead of overlapping. This applies to the record, how the exams were taken, and the class totals.

## Decision

- **Columns are sized by the text.** `FIGURE_GRID` is `repeat(auto-fit, minmax(min(100%, 9em), 1fr))`. A figure is at least 9 of its own em wide, so Big Print widens it and the row wraps.
- **Long words wrap inside their box.** A figure carries `min-w-0` and `overflow-wrap: anywhere`, so a long word breaks inside its box instead of crossing into the next.
- **All three rows use it.**

## Verification

- **The real-browser measurement** in the table above.
- **`the-record-figures-fit-at-big-print.test.js`**, 3 cases:
  - all three rows use the text-sized grid;
  - **proven to catch:** a screen-counted `sm:grid-cols-5` coming back is refused;
  - every figure wraps its own words.
- The 36 tests that touch `LearnersPanel` pass.
