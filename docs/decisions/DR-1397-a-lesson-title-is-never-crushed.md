# DR-1397: A lesson row's title is never crushed by its buttons: it claims 12rem before it shares the line

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (layout; no data)
**Type:** surface fix
**Area:** Learn lists (LatestLessons.jsx, the course list in ChurchLearn.jsx)
**Sent in by:** Darrell — an A++ screenshot and "Fix it", 2026-11-10
**Pairs with:** DR-1385 (the doors stack at Big Print), DR-1393 (no cut-off fields)

## Context

His screenshot of the Latest list at A++ showed the row "Nov 6, 2026 · Living Lessons from the Word · L287 · Spoken in the Break, Heard in the Light..." one word per line. The CONTINUE · ALL READ and ▶ PLAY buttons sat over the middle of it.

## What was measured

- Each row is a wrapping flex row: a title button (`flex-1 min-w-0`), the place mark (`shrink-0`) and Play (`shrink-0`).
- `min-w-0` with no basis lets the title shrink to almost nothing. The buttons never wrapped, because the title always "fit" by collapsing.
- The course list in `ChurchLearn.jsx` carries the identical row.

## Impact

**What this obligates.**

- At any text size, a lesson's title keeps a readable width.
- When the buttons do not fit beside it, they move to their own line under it.
- A long word wraps inside the title, so it does not push the row wider than the screen.

## Decision

- Both rows' titles become `flex-[1_1_12rem] min-w-0` with `[overflow-wrap:anywhere]`.
- 12rem scales with the text size, so at A++ the floor is wider and the buttons wrap sooner, as they should.

## Verification

- `a-lesson-title-is-never-crushed.test.jsx` (3 tests):
  - the Latest list's rows carry the floor and wrap, with Play still in the row;
  - the course list's row carries the floor;
  - the crushable class is gone from both files. Proven to catch: that check fails on the old class.
- Neighbour gates green: `ui-standards-set`, `consistency-guard`, the-latest-list, lesson-lists-on-a-tv, lesson-index, `large-print-guard` (82).
- **Honest limit:** jsdom does not lay out pixels. The CI chrome-layout probe and a real phone at A++ are the pixel check.
