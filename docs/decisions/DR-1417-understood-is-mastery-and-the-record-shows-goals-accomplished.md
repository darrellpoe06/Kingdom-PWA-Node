# DR-1417: Understood is mastery, and the record shows it as goals accomplished

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** B (changes what a figure on the learner record means; no schema)
**Type:** bug fix + feature
**Area:** `app/src/lib/test-integrity.js` (`isMastery`, `testIntegrityKpis`, `attemptIntegrityLine`), `app/src/components/UnderstoodGoals.jsx`, `LearnersPanel.jsx`, one line in `ChurchLearn.jsx`, `lib/emoji.js` (the sword)
**Sent in by:** Darrell, 2026-11-10, his record reading "Understood 11": "Understanding is Mastered and understood when the test and lessons are read in full 100%... Fix it"; "Make it look nice like accomplished goals are occurring and some black lions for 100% etc... some sword of the spirit etc... emojis"; then: "its saying 11 understood lessons because the test were taken after, that isn't correct... every one knows that... fix it to make sense based on known understanding about learning"
**Pairs with:** DR-1386 (credit where it is due; evaluation, never condemnation), DR-1396, DR-0099 (no red), DR-0076

## The defect

`understood` counted a lesson when any PASS (70% or more) came at or after the lesson went on the record, and a lesson goes on the record at 90% read. So a 70% score on a lesson nine-tenths read was "understood", and so was a 100% reached thirty seconds after a miss. When a test was sat proves nothing about what was learned.

## Decision

- **Understood is all of these, on one attempt:** the lesson read in full (100%), the exam at 100%, taken after the reading, not answered faster than the questions can be read, and not a retake within a minute of the last try. The last two are 100% without the understanding: the answers given back, not the lesson. This rests on what learning research calls retrieval, stated here from general knowledge of that research and not fetched for this record.
- **No credit is lost from view.** The old measure stays as its own figure, "Read and passed". A rushed or instant 100% is still kept as a pass.
- **An attempt from before reading was measured** carries no read percentage; for those, the lesson being on the record first is the most the record can say, and it is accepted.
- **The learner is told at the exam,** under the score: understood, or exactly what is left (the lesson N% read, the exam at N%), with no limit on tries.
- **It looks like goals accomplished.** A band at the top of "How the exams were taken": the Black Lion on a gold seal, "N of M lessons tested", a gold bar, and one Black Lion for each lesson understood (twelve drawn, then "and N more"). A crown when every lesson tested is understood. The sword marks "Read and passed"; "the sword of the Spirit" is the Word's own phrase (KJV, Ephesians 6:17, checked against `lib/scripture-kjv.js`). The lion is ink on gold so it is black in every theme. No red.

## What was measured

Chromium at 360px in cream and midnight, at 768px, and at Big Print 44: the band and figures draw with no sideways scroll and no element spilling; all nine images loaded from the app's own emoji set.

## Verification

- `test-integrity.test.js`, 8 new cases, **proven to catch:** 70, 88 and 99% are never understood; 100% with the lesson 90, 95 or 99% read is never understood; 100% before reading is not; a retake within a minute is not while the same retake ten minutes later is; a rushed 100% is not.
- `learners-panel.test.jsx`, 3 new cases: the count, the lions, the bar, the way forward, the crown, twelve drawn of fourteen.

## Not done, and why

- **Darrell's own figure is not known.** His 11 will change under this rule; the sandbox cannot read the live record, so the new number is his to see on the Record. `re-review: 2026-11-12`.
- **That reading can reach a full 100% on a phone** is not proven on a device; if a lesson tops out at 98 or 99, that is a reading-meter defect to fix, not a reason to lower this line. `re-review: 2026-11-12`.
- **Retention over days** (a second 100% after time has passed) is the stronger evidence and is not required yet. `re-review: 2026-12-01`.
