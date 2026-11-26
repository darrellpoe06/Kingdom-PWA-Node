# DR-1686: pictures first on the Learn home, and a fuller Relationships shelf

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (layout and a curated list; nothing removed)
**Type:** product
**Area:** `learn-studio/LearnStudio.jsx`, `learn-studio/LessonsInOrder.jsx`, `learn-studio/learn-studio.css`, `lib/learn-presentation/presentation.js`
**Pairs with:** DR-1661 (lessons first, kept, now in pictures), DR-1666 (Relationships shelf), DR-1684

## Context

Darrell, 2026-11-26, circling the search box, course picker and list on his phone:
"We have pictures. Why are we showing words all the time? More images at the
top of the app." And: "Make sure the lessons that should be in the relationship
sections are there."

## What was measured

- On a 390px phone the home opened on search, a "Lessons" header, two pickers,
  filters and text rows; the carousel sat at y=2617px, below the dashboard.
- His phone had remembered View: List (`ls-view:lesson-view`).
- Relationships held 19 lessons. A title scan found 14 more that teach
  relationships; a full-text scan of all 976 found 2 more (soft answer; family
  patterns). Darrell then widened the definition (relating to Yahweh, to self,
  to others; the fruit of the Spirit): that re-sort runs as its own work.

## Decision

1. On the home the carousel leads, then the lessons as pictures in order, then
   Continue, Closest to Finished, Relationships, Discover, Recently Added; the
   dashboard's words follow. Phone carousel is square (was 4:5, a full screen).
2. In Pictures view the pickers and filters sit under the pictures; in List they
   stay above. Fold all only in List. Every device opens in Pictures once
   (`lesson-view-2`); List stays one tap away.
3. Relationships grows from 19 to 35 lessons, grouped by subject.

## Impact

First screen on a phone: the carousel and the first lesson pictures. Nothing
removed; DR-1661's lessons-first holds, in pictures.

## Verification

Learn suites 58/58 and 27/27; two order tests updated to the new order and
proven to catch (carousel moved back below: both fail). Live dev app at 390 and
1024px: carousel at the top, lesson pictures next, no horizontal overflow.
`re-review: 2026-12-03`
