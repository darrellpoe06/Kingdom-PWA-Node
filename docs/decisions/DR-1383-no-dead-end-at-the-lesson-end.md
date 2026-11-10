# DR-1383: No dead end at the end of a lesson — Previous, All lessons and Next, one tap to the top of where you go

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (a reader control and its gate; no door, no schema, no money)
**Type:** surface
**Area:** Living Lessons and every course in the Learn space (ChurchLearn)
**Sent in by:** Darrell — a screenshot of the end of an open lesson and three messages, 2026-11-10
**Pairs with:** DR-0631 (the reader's own order), DR-0749 (the sticky bar slides away while reading), DR-0880 (All lessons lands at the top of the list), DR-0438 (the bar's short words on a phone)

## Context

His words, rendered for meaning (DR-0331): readers have no next or previous lesson when they are not using the voice reader, which advances on its own; "fix it"; "We don't like dead-ends"; "make sure we don't need 3 moves to get to all lessons or the next one... it goes to the bottom of the lesson, not the top with all lessons... one tap and you're where you want to be".

## What was measured

- The sticky bar already had Prev and Next, but on a phone they are bare arrows, and the bar slides away while reading (DR-0749).
- The end of an open lesson (his screenshot) carried Close the guide, Play, Share, Copy, Download, Present and Done, with no way on. Getting to the next lesson took a scroll back up, a reveal of the bar and a tap.

## Impact

**What this obligates.** Every open lesson ends with a way on. All lessons is always one of the doors, so it is never a dead end. Previous and Next name their number and title. Each door lands at the top of where it goes after the new screen paints: Next at the top of the next lesson, with its guide open, and All lessons at the lessons bar. **Honest limits.** The jsdom gate runs frames after the render, the way a browser does; the live check is the chrome-layout sweep and Darrell's own phone.

## Decision

1. `LessonNeighbors.jsx` renders Previous (when there is one), All lessons (always), and Next (when there is one), each a 48-pixel door with its label capped as chrome and its title in reading type.
2. `ChurchLearn.jsx` mounts it after the foot row of every open lesson (guide open, or the lesson's own space). `goToLesson` opens the neighbor with its guide and lands at the top after the paint; All lessons closes the space and lands at the lessons bar.

## Verification

- `no-dead-end-at-the-lesson-end.test.jsx`: 5 cases. Next opens the next lesson ready to read. Previous walks back. At both ends All lessons stands alone. One tap lands at the top (frames run after the render). A caller without a way back renders nothing, so it is caught. Neighbour gates green (lesson space, width, the dropdown tail).
