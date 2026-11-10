# DR-1410: The timeline's dates fit on the axis, and every book's date says why it stands

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (axis layout; a reasons table read from the KJV on disk; no schema)
**Type:** bug fix + content
**Area:** `lib/lesson-figures.js` (`spanTicks`, `tickGap`), `components/LessonFigures.jsx`, `lib/progress-of-revelation-basis.js`
**Sent in by:** Darrell, 2026-11-10, with a screenshot of the Progress of Revelation chart at Big Print, the axis reading "14001200 BC1000 BC800 BC 600400 BC": "Fix the dates..." Then: "Also review them against knowledge of dates... research their standards so we have a reason to have the ones we have... make sense?"
**Pairs with:** DR-0098 (the Word explains the Word), DR-0100 (state what is established; flag narrowly what is open), DR-0076

## Context

The chart's dates are a line-for-line transcription of one printed chart. Its own header said they had never been compared with anything.

## What was measured

- **The axis.** Six date labels were always drawn. Big Print grows the labels but not the axis. At 330px with 20px text the labels overlap, and the test shows it.
- **The dates.** All 66 books were checked against the Word's own markers, using 78 phrases read from the KJV on disk.
  - **Fixed, 26 books.** The Word names the king, year or event, such as Daniel 10:1 and Haggai 1:1.
  - **Bounded, 25.** The Word gives an edge, such as 1 Kings 6:1's 480 years, or Proverbs 25:1's men of Hezekiah.
  - **Inferred, 12.** The Word does not state a date and the chart reasons one, such as Song of Solomon or 1 Timothy.
  - **Silent, 3.** The Word gives no date at all: Job, Joel and Obadiah.
- **Where the Word refines the chart.**
  - Jeremiah 52:31 records 561 BC, after the chart's end of 570. Jeremiah 51:64 marks the end of Jeremiah's own words.
  - The Word dates Zechariah 1 to 8 at 520 to 518 BC. The chart's 480 to 470 is its estimate for chapters 9 to 14.
- **The standard.** The chart follows the conservative evangelical dating. The publisher's pages could not be reached from here, so the source volume is not claimed.

## Impact

The axis shows only the dates that fit, at any text size. Every book on the chart shows, under its bar, why its date stands, or that the Word gives none.

## Decision

- **The axis.** `spanTicks` takes a minimum gap between ticks (`tickGap`). It is measured from the axis width and the label size Big Print gives, so the step grows until no two dates touch.
- **The reasons.** `PROGRESS_BASIS` gives every book a grade, a one-line reason and its anchors. `DATING_STANDARD` names the school. The chart's dates are unchanged: the reasons explain them, and the notes say where the Word refines them.
- **The debate.** Later dates proposed elsewhere chiefly set aside a book's own heading, such as Daniel 10:1 or Isaiah 1:1. This is named once, and the chart keeps the heading (DR-0098).

## Verification

- `the-dates-on-the-axis-fit.test.js` checks widths from 300 to 900px at text sizes from 9 to 28px, with no overlap. **Proven to catch:** the screenshot's six dates overlap.
- `every-date-has-a-reason.test.jsx` has 7 cases:
  - all 66 books are covered;
  - every anchor phrase is verbatim, and a single changed word is named (**proven to catch**);
  - the silent books are exactly Job, Joel and Obadiah;
  - the refinement notes are present;
  - 66 reason lines render on screen.
- The 9 test files that touch the chart and the Bible reader pass (154 tests).
