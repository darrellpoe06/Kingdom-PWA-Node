# DR-1440: Courses earn crowns, the record starts with them, and the crowns rest on the Word

**Date:** 2026-11-12
**Status:** Accepted
**Tier:** A (how his own record is shown; no data changed)
**Type:** decision
**Area:** `app/src/lib/course-pace.js` (`courseAwards`, `crownCount`, `coursesUnderstood`), `lib/course-crowns.js` (new), `components/LearnersPanel.jsx` (the crown count first; "Courses rewarded")
**Sent in by:** Darrell, 2026-11-12, on the record screen, in substance: courses should be rewarded; courses should earn crowns; the record should start with how many crowns; the crowns should rest on the biblical Scriptures' crown references.
**Pairs with:** DR-1417 (a lesson earns a Black Lion), DR-1439 (understanding by repetition), DR-0076 (verbatim), DR-0210 (our voice, never inside a quote)

## Context
A lesson earned a Black Lion. A whole course had only counts, and nothing at the top of the record said what had been finished.

## What was measured
- **Courses showed only as counts.** They appeared in "Where you stand" (read in full, fully completed), with no mark that a person earned them.
- **The crown already existed.** The app's own self-hosted artwork includes it (`RECORD_MARKS`), so no device emoji is needed.
- **The verses come from the repository's KJV corpus, word for word:**
  - Proverbs 14:18: "the prudent are crowned with knowledge";
  - Proverbs 4:7-9: "with all thy getting get understanding ... a crown of glory shall she deliver to thee";
  - 1 Corinthians 9:25: "every man that striveth for the mastery ... a corruptible crown; but we an incorruptible".

## Impact
The record now opens with what was finished. Each course earns a crown, and understanding at 100% earns the full crown. The Word says what each crown is worth.

## Decision
- **The record starts with its crowns:** "N crowns", one for each course completed, with how many are at 100%.
  - Beneath the count is 1 Corinthians 9:25, quoted.
  - In our voice: these crowns are earned here, by study; the incorruptible one is the Lord's to give. No app awards His crowns (2 Timothy 4:8; James 1:12; 1 Peter 5:4).
- **Each course earns its highest award:**
  - **crown**: completed, every lesson read and its exam passed (Proverbs 14:18);
  - **crown at 100%**: every lesson understood (Proverbs 4:7-9);
  - **book**: every lesson read, with exams still to pass.
- **Labels in words.** Each award's label and verse travel with its mark in words, so nothing depends on seeing the picture.
- **Nothing earned, nothing scolded.** A course with no award shows nothing, never a scolding. No red is used.

## Verification
- **`course-crowns.test.js`, 5 green.** Each verse matches the corpus word for word. Proven to catch: one changed word fails. No quote carries "Yahweh".
- **`course-pace.test.js`, 25 green.** Crown at 100%, crown and book are each earned by their rule, and an empty record earns 0 crowns.
- **`learners-panel.test.jsx`, 27 green.**
  - "1 crown" opens the record, before every other figure, with its verse.
  - The completed course carries the crown.
- **`record-marks` green; lint clean.**
