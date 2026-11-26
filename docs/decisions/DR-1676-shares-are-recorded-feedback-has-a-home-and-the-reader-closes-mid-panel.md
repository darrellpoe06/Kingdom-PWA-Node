# DR-1676: Shares from the new look are recorded, Feedback has a home on the church door, and the reader closes mid-panel

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (every member's share, feedback entry and reader panel; no schema)
**Type:** fix
**Area:** `app/src/components/learn-studio/LearnStudio.jsx` (LessonCover share and landing), `app/src/components/shell/LoveCornerHeader.jsx`, `LoveCornerMenus.jsx`, `app/src/components/TTSControl.jsx`; tests `the-new-look-share-is-recorded.test.jsx`, `lovecorner-header-render.test.jsx`, `reader-floats-and-docks.test.jsx`
**Sent in by:** Darrell, 2026-11-26: "structural data collection for interest and understanding our stakeholders"; "Give us a list we need to update based on the latest and feedback from our users"; "No longer see a feedback option!!!!!!"; "put a close button in the middle of the screen so the reader can be closed where the thumb already is".
**Grounds:** DR-0698 (the share record), DR-1484 (the door's bar has no More; the header's sheet carries everything), DR-1673 (lesson link previews)

## Context

Darrell asked for the image and title of a shared lesson as a way to understand the people the lessons reach, and for a list of what to update from members' feedback. Both depend on two records: the share record (DR-0698) and the feedback the app collects. The live database was read before anything was built.

## What was measured (the live database, 2026-11-26)

- `lesson_shares`: **0 rows, ever**; `lesson_share_opens`: 0. Lessons were being shared (Darrell texted one at 07:38). The new look's Share sent a bare link: no token, no record, no lesson note, and so no preview either. A link opened from a share waited for the classic card (`learn-lesson-<id>`), which the new look never draws, so every such open would have been recorded as failed.
- `feedback`: 151 rows, **the last on 2026-08-19**, every one still `new` (never triaged); `door_feedback`: 0 rows ever. On the church door, DR-1484 removed the bar's More (which held Feedback) and pointed to the header's All Features sheet, but the header never passed `onFeedback` to that sheet, so its Feedback button never drew.
- The church door files feedback under instance `colg` (2 members); RLS admits only members of that instance, so a church member who is not a `colg` member cannot file feedback there. Left for a decision (below).

## Decision

1. **The new look's Share is the classic share:** `lessonSharePayload` with a fresh token on the preview link, `shareLink`, and `recordLessonShare`. The cover carries `learn-lesson-<id>` and reports a shared open as landed.
2. **Feedback has a home on the church door:** the header hands `onFeedback` to the All Features sheet; the button reads "Send feedback: what works, what does not".
3. **Every voice reaches the office** (Darrell: "We want to understand users all of them!!! Fix feedback!!! Use another channel if needed"). A note the `feedback` table cannot take -- signed out, refused by the membership rule, or a failed membership step -- is filed through the door channel (`door_feedback_submit`, 0216: anon-callable, flood-braked) to the space of the door it was given in (`colg` for the church door, `poe-family` for the family app), with the page it came from. The Governor's feedback board now also reads those door notes (marked "door channel"), so it is one list.
4. **A second Close in the middle of the reader panel**, full width under Pop out, closing exactly as the corner ×.

## Impact

- Shares and opens from the new look start filling the record the Governor reads (who shared which lesson; whether it opened).
- Members can find Feedback again from the menu.
- Every note now reaches the office: a signed-out visitor's and a non-member's through the door channel.
- **Open:** the 151 untriaged notes since June are being read for low-hanging fruit as a standing loop.

## Verification after merge

- `the-new-look-share-is-recorded.test.jsx` (2): the share carries a token on the `/l/lovecorner/` link and is recorded; a shared open reports landed. Removing the record call fails it.
- `lovecorner-header-render.test.jsx`: the menu offers Send feedback and it opens the form. Removing the handoff fails it.
- `reader-floats-and-docks.test.jsx`: the panel carries the middle Close and it closes the panel.
- `every-voice-reaches-the-office.test.js` (3): a signed-out note on the church door goes to `colg` through the door channel; a refused member's note still arrives; a door note shows on the board. Restoring the old signed-out skip fails the first.
- Live: share a lesson from the new look; a row appears in `lesson_shares`; open it; a row appears in `lesson_share_opens` with `ok`.

`re-review: 2026-12-03`
