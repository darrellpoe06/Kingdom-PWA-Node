# DR-1385: The lesson-end doors stack at Big Print — Next first, full width, and a long word wraps inside its door

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (layout of one control row; no door, no schema, no money)
**Type:** surface
**Area:** Learn space, the end-of-lesson row (LessonNeighbors.jsx)
**Sent in by:** Darrell — a Big Print screenshot of L7 on his phone, 2026-11-10, after DR-1383 deployed
**Pairs with:** DR-1383 (no dead end at the end of a lesson), DR-0410 (the words grow, the frame stays a frame), DR-0438 (one row on a 360px phone)

## Context

DR-1383 put Previous, All lessons and Next side by side. His screenshot at A+++ shows each door a third of the phone wide. The titles broke out of their boxes ("borrowing", "sweareth", "changeth"), and All lessons was a tall empty column between them.

## What was measured

- Three equal doors on a phone leave roughly a hundred pixels each. A Fraunces title at the Big Print scale fits one short word per line, and a long word overflows the border.
- The All door stretched to the height of its tallest neighbor while carrying only its two-word label.

## Impact

**What this obligates.** At every text size the doors read whole: each is the full width, so a title wraps across the phone instead of down a sliver, and a single long word wraps inside its border. Next stands first because it is what a finished reader wants most. All lessons is a short bar at the end and still always present, so there is still no dead end. **Honest limits.** The jsdom gate pins the classes and the order. The pixels are measured by the CI chrome-layout sweep and on Darrell's own phone.

## Decision

1. `LessonNeighbors.jsx`: the row is a column (`flex-col`); every door is `w-full`; the order is Next, Previous, All lessons; titles carry `[overflow-wrap:anywhere]`.

## Verification

- `no-dead-end-at-the-lesson-end.test.jsx`: a sixth case pins the column, the order, full width on every door, and wrapping on both titles; all six pass. Lint clean.
