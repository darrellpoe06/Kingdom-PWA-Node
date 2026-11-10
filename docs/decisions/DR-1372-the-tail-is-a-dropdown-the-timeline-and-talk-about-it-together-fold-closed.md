# DR-1372: The tail is a dropdown — the lesson timeline and TALK ABOUT IT TOGETHER fold closed, optional, and the voice reads the teaching and the stories, not the tail

**Date:** 2026-11-06
**Status:** Accepted
**Tier:** A (reader presentation and the spoken flow; no text changed, no gate relaxed, no door, no schema, no money)
**Type:** surface + ways
**Area:** Living Lessons reader (ChurchLearn, LessonFigures), the Read Aloud flow
**Sent in by:** Darrell — two screenshots and four messages into the app on the evening of 2026-11-06
**Pairs with:** DR-1296 (the picture a lesson talks about is shown), DR-1308 (the timeline lives in the Bible tab; a lesson links to it), DR-0733 (TALK ABOUT IT TOGETHER in every lesson), DR-0811 (parables keep their fiction), DR-0075 (feel, flow and smoothness), DR-0076 (§3 proven to catch)

## Context

**His words, rendered for meaning (DR-0331).** Scrolling the sixteen-book timeline inside a lesson: "This list should be in a tab we can link to, not in every lesson, it takes too long... maybe it can be a drop-down option for reading each lesson, hidden by default also... the asking others for their testimony should be a drop down too... not read each time!" Then, sharpening: "The timelines should be a possible drop-down, like a story we add at the end to summarize the points... however I like us reading those... not some things... make sense?" Then: "When the 34 books this lesson is about should be a drop-down that can be reviewed." Then: "Not mandatory!" And, of the stories: "Parables are 🔥."

**SHOULD / ARE (DR-0219).** The timeline already lives in the Bible tab and a lesson links to it (DR-1308), but the lesson still rendered the whole WHEN THE BOOKS WERE WRITTEN chart open, above the stories, and the TALK ABOUT IT TOGETHER tail rendered as a wall of prose every time; the voice (`readAloudTextFromArc`) read every teach segment, tail included. The stories were never the complaint: he wants them read.

## What was measured

- A lesson quoting thirty-four books rendered a thirty-four-row chart open, inside the reading, before the parables (his screenshot). The TALK tail in L288 is four paragraphs after the heading; the voice read all four on every Read All.
- After: `LessonFigures` is one closed `<details>` whose summary names the chart; `LessonProse` cuts at the first item that starts with the heading and renders everything after it inside a closed `<details>`; the standalone prompts block is a closed `<details>`; `readAloudTextFromArc` stops at the seam unless asked (`includeTalk`). The stories are read exactly as before.

## Impact

**What this obligates.** The tail of a lesson is optional, never mandatory: on the page it is a dropdown the reader opens, and in the voice it is skipped unless asked. The teaching and the stories are read whole every time. Nothing is removed from the text: the TALK part stays in every band and every gate (DR-0733), the timeline stays derived from the lesson's own citations and still links to the Bible tab (DR-1308). **Honest limits.** The chrome-layout sweep on the folded page is the CI witness, not a hand measurement; a Read Aloud of the tail on request is reachable by the API today and surfaces as a control in the next reader pass (re-review 2026-11-13).

## Decision

1. **The timeline and figures fold closed, after the stories.** `LessonFigures.jsx` renders a closed `<details>` with a summary that names the chart and says it is optional; `ChurchLearn.jsx` mounts it after `LessonStories`, so it reads like a story added at the end. The Bible link stays inside.
2. **TALK ABOUT IT TOGETHER is a dropdown.** `talk-together.js` gains `splitTalkTogether`, `isTalkHeading` and `segmentsWithoutTalkTail`; `LessonProse` folds the tail closed under its heading; the prompts block folds closed.
3. **The voice reads the teaching and the stories.** `readAloudTextFromArc(arc, { includeTalk })` leaves the tail out by default, even when it spans several paced segments, and reads it only when asked.

## Verification

- `the-tail-is-a-dropdown.test.jsx`: seven cases — the split, the cross-segment cut, the default voice without the tail and `includeTalk` restoring it word for word (proven to catch), L288 live, LessonProse folds the TALK section and leaves a lesson without it unfolded, LessonFigures closed with the Bible link inside. Neighbours green: lesson-figures (17), the-timeline-lives-in-the-bible, read-all-reads-every-step, talk-together, learn-lesson-space, the three LessonProse gates. ESLint clean on every touched file.
