# DR-1288: How much of the lesson is left, in its own words, by two witnesses

**Date:** 2026-10-29
**Status:** Accepted
**Tier:** A (additive: two fields on the device-only saved place, one line in the lesson's sticky block, a suffix on the Continue row, one event from the reader; no schema, nothing sent anywhere)
**Type:** surface
**Area:** Learn · every course's lesson space (`app/src/lib/reading-progress.js`, `app/src/lib/learn-resume.js`, `app/src/components/ChurchLearn.jsx`, `app/src/components/LessonContinue.jsx`, `app/src/components/TTSControl.jsx`)
**Declared by:** Darrell, 2026-10-29, in three messages:

> "I would also like to know what percentage of the lesson is left in each so that I and users can verify the full reading of each lesson... make sense?"
>
> "Hopefully helps with the reader as well so it's timed perfectly with the words in each lesson no matter the speed... make sense?"
>
> "Or merged version of both so it can be accurate both ways..."

**Pairs with:** DR-0076 (§4 measure, don't claim), DR-0381 (never a painted surface), DR-0631 (one place per lesson), DR-0749 (the place follows the eye), DR-1255 (which version), DATA-AS-EMPOWERMENT-NOT-EXTRACTION (the reader's own record, on the device)

## Context

A reader could see "Step 4 of 10", and only in the paced bands. Steps are uneven chunks, so step 4 of 10 is not 40% of the words. The adult band shows the whole lesson as one step, so it had no measure at all. The reader said nothing about how much of the lesson was left. Nothing let a person check that a lesson had actually been read through, by eye or by ear.

## What was measured

- `AgePacedLesson` reported the step only (`onStepChange(i, total)`); with one segment (the adult band) it reported nothing, and the sticky bar requires `total > 1`.
- The reader already writes the sentence it is on to the place, and already marks the lesson finished when the last sentence is spoken (`TTSControl`, `finishPlace`).
- The place is device-only `localStorage` (`poe-learn-places`); `normPlace` drops any field it does not name.

## Decision

1. **Count words, not steps or minutes.** A word is the same word at every level, every speed and every screen size.
2. **Two witnesses, kept apart, merged into one number.** `seen` is the furthest share of the reading's words whose paragraph has had its last line on screen. Steps already passed count in full, and paragraphs scrolled above the screen still count. `heard` is the furthest share the reader has spoken: the words of the sentences before the one now playing, and every word once the last sentence is spoken. Each only rises. The lesson's number is the larger of the two, and both are named under it ("seen 40% · heard 62%"), so either way can be checked against the other.
3. **Time left is measured, never assumed.** The reader's pace is words spoken over the time spent speaking them, in this reading at this speed. A speed change, a jump back or a pause of 20 seconds or more starts the measure again. Until 30 words and 8 seconds have been heard, no minutes are shown.
4. **Each reading is verified on its own.** A finished lesson started again starts both witnesses at zero, so last week's reading never stands in for this one.
5. **Where it shows.** A new line under the step bar in the lesson's sticky block ("62% left · seen 40% · heard 62% · about 6 min left at 1.5×", with its own bar). On every lesson row, Continue reads "Continue · 62% left". Neither shows anything until something has been measured.
6. **Whose it is.** The two fractions live in the lesson's existing saved place on this device. Nothing is sent, Start over clears them with the place, and it is a reader's own check on a reading, never a streak.

## Impact

- Every lesson in every course carries the line, in every band, including the adult band, which had no measure before.
- The reader, at any speed, says how much is left in words, and how long that is at the pace it measured.
- The existing step bar and its tests are untouched; the new line is a sibling under it, capped as chrome (`ts-chrome-region`).

## Verification

`reading-progress.test.jsx` (18 tests), proven to catch:

- **Words:** words are counted the way a reader counts them, and a lesson is never "0% left" before its last word.
- **Seen:** weighted by words; paragraphs above the screen count.
- **Witnesses:** each ratchets, and the larger one wins.
- **Pace:** nothing is claimed until it is measured; a new speed, a pause or a jump back each restarts the measure.
- **The place:**
  - scrolling back never lowers what was read;
  - a witness write does not clear the step or the sentence;
  - heard to the end is every word;
  - a new reading starts fresh;
  - a place written before this shipped reads as nothing measured.
- **The row:** "Continue · 62% left" with both witnesses in the title; plain "Continue" when nothing was measured.
- **The meter settles.** Found before this shipped: the lesson rebuilds its plan on every render, and the first draft keyed the meter on the plan's identity. Each render reset it and reported again, which saved the place, re-rendered, and looped; the real lesson screen hung its test for sixteen minutes. The meter now keys on what the plan is (version, cut, words), and the host only re-renders on a real change. The new test rebuilds the plan on every render the way the real host does. Proven to catch: with the old keys restored it fails with "expected 20 to be ≤ 3", and with the fix it passes.

The existing pins on the sticky step bar (`the-place-is-visible-and-continue-stays`, `lesson-chrome-is-capped`) still pass.

## Open

- The lesson's measure covers the paced reading (the core lesson). The reader's measure covers whatever its target reads for that lesson. Both are per lesson and both are honest, but they are not the same span of text. Whether to align them, so the reader and the page count exactly the same words, is open. **re-review: 2026-11-12.**
