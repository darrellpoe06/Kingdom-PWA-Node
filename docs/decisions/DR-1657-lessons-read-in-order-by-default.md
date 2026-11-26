# DR-1657: Lessons read in order by default

**Date:** 2026-11-25
**Status:** Accepted
**Tier:** A (order of a list; nothing removed)
**Type:** product
**Area:** `app/src/lib/kids/lesson-library.js`, `app/src/components/kids/KidsZone.jsx`, `app/src/__tests__/kids-lesson-library.test.js`, `app/src/components/learn-studio/learn-studio.css`, `app/src/components/learn-studio/lesson-experience.css`
**Sent in by:** Darrell, 2026-11-25: "Show lessons in chronological order as the default however let them be sorted in all options available... I want to read these in order especially the living lessons" and "Have to scroll to see the first lessons!!!!!!!"
**Pairs with:** DR-1606 (Learn opens on Latest; this changes the Kids library's default order, not Learn's Latest shelf), DR-0076

## Context

The Kids Zone library listed Living Lessons newest first (L341 at the top), so L1 sat at the bottom of 337 and a reader had to scroll to begin at the beginning.

## What was measured

- Before: `libraryLessons('child')[0]` was ll341. After: it is the first Living Lesson with a Kids version (ll1).
- Living Lessons carry a child version on 337 of 337, teen 337, senior 337, youth 272 (65 have no Youth version yet, so the Youth age lists 272).

## Decision

1. **In order by default** for every age: the course's own sequence, first lesson first.
2. **Every order on offer:** In order, Newest first, A to Z, Z to A (`LIBRARY_SORTS`), a picker beside the count.
3. Contrast, measured by exact CSS math on the new look: the Stories & Perspectives section now sits on its component's own surface (#faf8f4), taking its green label from 4.43:1 to 5.3:1. The hero buttons over photos move from white glass to dark glass (white on 55% black: at least 4.7:1 over any picture). The photo headlines gain a tight dark edge. Measured improvement, not yet a measured pass over every photo.

## Impact

- Kids, Youth and Teen open at L1; Little Ones keeps its teaching order. No lesson added or removed.

## Verification after merge

- `kids-lesson-library.test.js` + `kids-zone-render.test.jsx`: 17 of 17, including the default order and each of the four sorts.
- Darrell opens Kids Zone > Lessons and sees L1 first.

`re-review: 2026-12-02`
