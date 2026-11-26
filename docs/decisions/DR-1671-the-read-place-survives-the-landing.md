# DR-1671: The Read place survives the landing

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (every member's lesson Read mode; no schema; the place stays in the same local key)
**Type:** fix
**Area:** `app/src/components/learn-studio/lesson-landing.js` (new; renamed `landing-guard.js` by DR-1672), `app/src/components/learn-studio/LessonExperience.jsx`; `app/src/__tests__/lesson-experience-prototype.test.jsx`
**Sent in by:** Darrell, 2026-11-26 (phone): "Notice I had history and then when the update came it didn't take me back to paragraph 6 out of 12?!!!!!!!!! Or whatever we should be doing!!!!!!!" (lesson 140 reopened from Recently opened, landed at the top of Read).
**Pairs with:** DR-1669 (resume after an ended pause), DR-1664 (the new look for every member)

## Context

Read mode saves the reader's paragraph per lesson and age level (`poe-lesson-experience:<id>:<level>:read-page`) and lands on it once when Read opens. A window scroll listener keeps the place current from the scroll position.

## What was measured

- The landing scrolled to the saved paragraph the moment Read mounted, while the cover picture and fonts were still loading, with a smooth scroll.
- Anything that then moved the page (the picture arriving and pushing the text down, the new Learn resetting to the top on opening a lesson, `LearnStudio.jsx` `window.scrollTo(0, 0)`) fired the same scroll listener, which read paragraph 0 at the reading line and saved it over the real place. Reopened, the lesson started at the top.
- A test that lays the page out at paragraph 0 right after a landing on paragraph 6 saves 0 with the guard removed (fails) and keeps 5 (zero-based) with it (passes).
- Read showed nothing to say it had picked up a place, so a reader could not tell a landing from a fresh start.

## Decision

1. **For 1.5 seconds after a landing, a scroll is the page settling, not the reader moving** (`useLanding`): the place is not rewritten from it. The reader's own touch, pointer, wheel or key ends the guard at once, so a reader who scrolls right away is followed exactly as before.
2. **The landing is re-applied** at 350 ms and 1100 ms, instantly, unless the reader has already moved, so a late picture or a reset to the top cannot leave the reader at the top.
3. **Read says where it picked up**: "Picked up where you left off: paragraph N of M" with **Start from the top**.

Nothing the reader can do is removed: reading, scrolling, Read Aloud, highlights and the narrator's own place are unchanged.

## Impact

- A desktop scrollbar drag counts as the reader's own move (pointerdown).
- If the place still fails on a device, the next step is a shared server-side place for the new look (`lessonTools.place`), which today only the classic course page passes.

## Verification after merge

- CI: the two DR-1671 tests in `lesson-experience-prototype.test.jsx` pass; the first fails with `settling()` forced to false (run 2026-11-26).
- Live: reopen a lesson read to paragraph 6 from Recently opened; it lands on paragraph 6 with the "Picked up where you left off" line.

`re-review: 2026-12-03` (confirm on Darrell's phone that a reopened lesson lands on its paragraph after an update).
