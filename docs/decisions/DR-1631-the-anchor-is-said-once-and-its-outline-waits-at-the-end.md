# DR-1631: The anchor is said once, and its outline waits at the end

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** A (where one block of a lesson is drawn and whether the reader speaks it; no lesson text changed)
**Type:** decision
**Area:** `app/src/components/ChurchLearn.jsx` (`renderStage` Open and Send-off, `LessonAnchorReference`, the lesson card's anchor block)
**Sent in by:** Darrell, 2026-11-24, with the reader on L339's Anchor block: *"This section should not be read... just go from the anchor to 1st point... not talking to computers!!!!!!!!!!!! ... Saying scripture referenced on the screen 25 times in a row makes you forget what users were about to listen to"*, *"For each lesson"*, then *"can the be at the end of the lessons not read... however their for their reference"*.
**Pairs with:** DR-0391 and DR-0402 (the anchor's references open), the 2026-09-13 reference-run rule (`collapseReferenceRuns`), DR-0299 (controls are not content), DR-0076

## Context

A lesson's anchor theme can be a numbered outline with a parenthetical of references after every point. The reader summarises a run of references as one sentence ("N Scripture references are listed on the screen"), which is right for one run and was spoken once per point: eight times on L339 before a word of teaching.

## What was measured

L339's anchor: reference `Ecclesiastes 5:9`, theme beginning `ONE:` with eight points and twenty-two references. After: the reader's own map (`buildFollowMap`, the text that is spoken) over an Open line, a first point and the reference block holds "Anchor — Ecclesiastes 5:9." and the first point, and none of the outline, the references or the block's heading. Proven to catch: the same outline without the skip is in the map. `the-anchor-outline-is-not-read.test.jsx` 6 green; the six suites that already pin the lesson reader, 62 green.

## Impact

A listener hears the anchor's reference and then the lesson. A reader still has the outline and every reference, each opening its verse in place, at the end.

## Decision

1. The Open stage draws only the anchor's own reference, one short line.
2. The outline and the reference chips are drawn at the end of the lesson, in the Send-off stage, under "Scripture in this lesson · for your reference".
3. That block, and the lesson card's own anchor block, carry `data-read-skip`: shown, tappable, never read aloud.
4. This is one render path, so it holds for every lesson in every course.

## What is NOT in this record

The Kids adventure and the presentation deck draw the anchor by their own paths and were not changed. `re-review: 2026-12-01` to listen to both.
