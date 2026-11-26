# DR-1672: One place and one set of sections for every lesson, whichever screen opens it

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (every member's lesson screen; no schema; the place stays device-local, exactly DR-0631's bright line)
**Type:** fix
**Area:** `app/src/components/learn-studio/lesson-sections.js`, `lesson-place.js`, `ReadSections.jsx` (new), `LessonExperience.jsx`, `landing-guard.js` (renamed from `lesson-landing.js`), `lesson-experience.css`; `app/src/__tests__/lesson-sections.test.js`, `lesson-place-is-shared.test.jsx`
**Sent in by:** Darrell, 2026-11-26 (phone): "Where are the chapters?!!!! How can we go back or to a chapter without chapters?!!!!!!!!!!" (a 55-minute lesson whose Chapters list showed one chapter, 0:00 to 51:14); "I just ended on chapter 6 and I can't go back to chapter 6 in that exact same lesson, even though while in the lesson it showed me that I ended at chapter 6 out of 12 chapters."
**Grounds:** DR-0262 (every lesson its own space; opening it records the place in `learn-resume.js`), DR-0385 (numbered points and the speaker's index: the count stated, every point listed, the current one marked, a tap to jump), DR-0520 (`lessonSectionPlan`: the numbers belong to the lesson, one plan per text), DR-0631 (one place per lesson, down to the sentence, matched by fingerprint)
**Pairs with:** DR-1662 to DR-1669 (the new look), DR-1671 (the place survives the landing)

## Context

The new look's lesson screen (DR-1662 onward) was built beside the place and section system Learn has had since September, not on it. None of DR-1662 to DR-1671 cites DR-0385, DR-0520 or DR-0631. The screen kept its own paragraph number per level on the device and found chapters with its own small heading test. The older Learn code underneath the new look still kept the real place and the real section count. So the lesson could say "6 of 12" while open, and reopening it read the other record.

## What was measured

- **Chapters.** The screen's heading test recognized a capitalised lead only at the start of a paragraph. 754 of 995 lessons rendered with at most one chapter, because many long lessons are stored as one paragraph with their sections inside it (ll136: ONE. to TWELVE. inside a single block, two of them stored with no space before the number, e.g. `(John 8:46)FIVE.`). Lesson 140's sections are capitalised leads ("BELIEVING ALL THINGS WHICH ARE WRITTEN.", "KNOWN BY LOVE.") that `lessonSectionPlan` counts as 13.
- **Place.** Read saved `poe-lesson-experience:<id>:<level>:read-page` only; the per-lesson record in `learn-resume.js` was never written or read by the screen, so a place saved by one surface was invisible to the other.
- **Going back.** Read had no list of sections at all; Listen's list had no "you are here".

## Decision

1. **The sections are the lesson's plan** (`lesson-sections.js`): Read's paragraphs break at every heading `lessonSectionPlan` finds, plus the author's spelled numbers it cannot see (a number glued to a reference). Only whitespace changes: every lesson and level reads and speaks the same characters (pinned across all 995 lessons). 823 lessons gain sections.
2. **One place** (`lesson-place.js`): Read writes the sentence that opens your paragraph to the lesson's shared place (`recordPlace`, keyed course and lesson, sentence by fingerprint), and opening Read lands on the paragraph holding the saved sentence, whichever surface saved it. The old per-level key is read only as a fallback. A finished reading or a sentence not in this rendering lands nowhere new (never a guess, DR-0631), and a finished reading is never moved by a scroll: the write skips it, exactly as ChurchLearn's eye-scroll writer does, because a move starts a new reading and would clear the finish just credited (DR-1386; caught by `lesson-experience-public.test.jsx`'s PROGRESS ON EVIDENCE case, which failed without the guard).
3. **Go back to any section** (`ReadSections.jsx`): Read shows "N sections · you are in K"; tapping lists every section numbered, marks "You are here", and goes there. Listen's Chapters list numbers its chapters from the same sections and marks the one playing.
4. **A lone mark between verses joins its verse** (`lesson-verses.jsx`, Darrell 2026-11-26 with a screenshot of lesson 140: "Too much room in-between the paragraphs!!!"). DR-1669 kept leading `;`/`.` with the verse before; a fragment that is ONLY joining marks, such as a lone "—" between 1 Peter 2:10 and 1 Peter 2:9, still stood as its own block. It now joins the verse whole. Measured in Chromium on lesson 140's Read page: that gap 48 px before, 8 px after (the same as any two adjacent verses); no lone `;`. His screenshot was taken at 13:03, three minutes after DR-1669's deploy finished (13:00:33), so it showed the build before that fix. A catalog-wide test fails on any lone mark between verses in any lesson.
5. **No duplicate landing file.** DR-1671's settle guard is renamed `landing-guard.js`, so it no longer shares a name with `lib/lesson-landing.js` (the classic sentence finder); they do different jobs.

## Impact

- Every lesson opened in the new look now has its sections as chapters in Read and Listen, numbered as the rest of Learn numbers them.
- The place is one record per lesson on the device; a lesson read to section 6 reopens on section 6 from Recently opened, from a course, or after an update.
- Nothing a reader can do is removed.

## Verification after merge

- `lesson-place-is-shared.test.jsx` (3): a place saved at section 6 of lesson 140 opens Read there and says "you are in 6"; choosing section 4 in Read writes the shared place; ll136 lists all twelve numbered sections. Each fails with its part switched off (shared read off: 1 fails; shared write off: 1 fails; section plan off: 3 fail), run 2026-11-26.
- `lesson-sections.test.js` (4): ll136's twelve sections; lesson 140 matches `lessonSectionPlan`'s count; only whitespace changes across every lesson and level; the measured gain.
- Live: reopen lesson 140 from Recently opened after reading to a later section; it lands there and the section list marks it.

`re-review: 2026-12-03`
