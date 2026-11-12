# DR-1440: Courses are rewarded: the crown, the sword and the book

**Date:** 2026-11-12
**Status:** Accepted
**Tier:** A (how his own record is shown; no data changed)
**Type:** decision
**Area:** `app/src/lib/course-pace.js` (`courseAwards`, `coursesUnderstood`), `components/LearnersPanel.jsx` ("Courses rewarded")
**Sent in by:** Darrell, 2026-11-12, on the record screen: courses should be rewarded.
**Pairs with:** DR-1417 (a lesson earns a Black Lion), DR-1439 (understanding by repetition; reading counts on its own)

## Context
A lesson earns a Black Lion when it is understood (DR-1417, DR-1439). Nothing on the card rewarded a whole course.

## What was measured
- **Courses already appear only as counts.** The record shows them in "Where you stand" (read in full, fully completed), with no mark that a person earned them.
- **The marks already exist.** The app's own artwork has the crown, the sword and the book (`RECORD_MARKS`, DR-1417), all self-hosted, so no device emoji is used.

## Impact
Each course a person finishes is named, with a mark for how far it was taken. The highest award, the crown, is for understanding, the thing that matters most.

## Decision
- **Each course earns its highest award:**
  - **crown**: understood, with every lesson read in full and its exam at 100%;
  - **sword**: completed, with every lesson read and its exam passed;
  - **book**: read in full, with every lesson read.
- **Placement.** "Courses rewarded" opens "Where you stand". It gives the three counts (understood, completed, read in full), then a mark and name for each course earned, highest first. Each mark carries its meaning in words, so nothing depends on seeing the picture.
- **Rules carried over.** A course with no award shows nothing, never a scolding (DR-1386). No red (DR-0099).

## Verification
- **`course-pace.test.js`, 25 green.** Crown, sword and book are each earned by their rule; an empty record earns nothing.
- **`learners-panel.test.jsx`, 27 green.** A course read and passed shows "Courses rewarded: 0 understood, 1 completed, 1 read in full" with the sword.
- **`record-marks.test.js` green, lint clean.**
