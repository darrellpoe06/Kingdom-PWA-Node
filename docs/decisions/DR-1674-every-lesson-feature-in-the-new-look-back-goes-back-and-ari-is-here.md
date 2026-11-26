# DR-1674: Every lesson feature in the new look: Back goes back, Ari is here, and what you read is kept

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (every member's Learn; no schema; the place stays device-local)
**Type:** fix
**Area:** `app/src/components/learn-studio/LearnStudio.jsx`, `LearnStudioPreview.jsx`, `AskAri.jsx` (new), `LessonExperience.jsx`, `lesson-experience.css`; `app/src/lib/learn-studio-bridge.js`, `app/src/lib/learn-resume.js`; `app/src/components/ChurchLearn.jsx`; `app/src/index.css` (Institute hero); tests `lesson-experience-prototype.test.jsx`, `the-new-look-keeps-what-you-read.test.jsx`
**Sent in by:** Darrell, 2026-11-26 (phone): "Back button should go to the last page the user was on!!!" / "Not close the app or start over"; "All features should still be here... we need to check of a list of features"; "where's the Ai's!!!!!! Ari... claude..."; "Not showing what I was just reading!!!!!!! No where!!!!! ... can't find it"; "Make sure the image is good in any font size" (the Institute portrait).
**Grounds:** DR-0262 (the device Back exits the space, `useHistoryValue`), DR-0631 (one place per lesson), DR-1384/1386 (read on evidence), DR-1664 (the new look for every member), DR-1667 (the Institute at every text size)
**Pairs with:** DR-1672, DR-1673

## Context

The new look was built beside the classic Learn page's lesson space. A feature inventory against the classic page (ChurchLearn.jsx, read line by line on 2026-11-26) found that the lesson screen opened from the new look was handed only its quiz hooks, and that the new Learn screens took no history steps.

## What was measured

- **Back:** `useHistoryValue` / `useHistoryToggle` appear nowhere in `learn-studio/`. Opening a course, a shelf, a lesson's cover or a lesson pushed no history entry, so the phone's Back left Learn or closed the app.
- **Ari:** the classic lesson guide's tutor (`TutorPanel`, `askTutor`) had no counterpart in the new lesson screen.
- **What you read:** the new-look path passed `onSeen`, `onHeard` and `onLevel` as empty functions and no `place`, `downloads`, `levelFirst`. Reading or listening there wrote nothing a Continue list reads, and never credited READ.
- **Continue lists:** `placeInProgress` counted only a stage, step or sentence; a lesson listened to (heard) or read with paced evidence (seen) and no sentence never appeared under Continue (Institute or Learn).
- **Institute portrait:** stacked at a large text size it stopped short of the card's right edge with its open side hanging; side by side the gold arc ran through the Bishop's name.

## Decision

1. **Back goes to the last page.** A course page, a shelf, a lesson's cover and an open lesson each take one history step (`useHistoryValue`); Back closes the one on top; their own Back to Learn gives the step back.
2. **Ari is in the lesson screen**, first in Study: the same `askTutor` to the church's own model, the same "test what it tells you" line, the same honest fallback when it cannot be reached.
3. **The new look hands the lesson screen the classic space's own tools** (`experienceTools`, the same builder the classic door uses) through `lessonToolsFor`, with `studioSavePlace`: CourseView's write (the version read) and its credit at READ_FLOOR on fresh evidence. Downloads, Copy, the age-first step, the resume offer and reading credit now work from the new look.
4. **Seen or heard past 2% is progress** (`BEGUN_FLOOR`, the threshold the resume offer already uses), so a lesson read or listened to appears under Continue. Paced seen means a flick cannot reach it.
5. **The Institute portrait bleeds to the card's edges at every size**, and the arc sits behind it.

Still open from the inventory, with reasons: step-by-step paced reading, Show the Word (tap a verse), the lesson's real video, print/present/facilitator guide and the keep-screen-on hint are reachable through the classic tools panel but not yet on the new lesson screen; each is tracked here for the next pass. `re-review: 2026-12-03`.

## Impact

- The phone's Back never leaves the app from inside Learn.
- What a member reads in the new look is kept, credited, and found again under Continue.

## Verification after merge

- `lesson-experience-prototype.test.jsx`: Back closes an open lesson and a course page, one step each (both fail with the steps removed); Ari asks with this lesson and shows the reply marked as Ari, says so honestly when offline, and is in Study (fails with Ari removed).
- `the-new-look-keeps-what-you-read.test.jsx`: a part-read lesson is on the Continue list and is credited at the floor (fails with the old in-progress rule); the new look hands the full tools (fails without `lessonToolsFor`). Run 2026-11-26.
- Live: open a lesson from the new Learn, read part of it, press Back, find it under Continue.

`re-review: 2026-12-03`
