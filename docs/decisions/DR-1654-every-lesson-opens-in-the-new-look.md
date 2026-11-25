# DR-1654: Every lesson opens in the new look

**Date:** 2026-11-25
**Status:** Accepted
**Tier:** B (owner-device preview; no other reader's app changes)
**Type:** product
**Area:** `app/src/components/learn-studio/LearnStudioPreview.jsx`, `app/src/components/learn-studio/LessonExperience.jsx`, `app/src/__tests__/lesson-experience-prototype.test.jsx`
**Sent in by:** Darrell, 2026-11-25: "What happened to the new lessons format?!!!!!!!" then "Update them to our new look?!!!!!! Yet?!!!!" and "How can a lesson not have text?"
**Pairs with:** #2874 (the one-lesson prototype, ll338), #2875 (Watch keeps the player in view), DR-0111 (do the work)

## Context

The Lesson Experience (Watch / Read / Listen / Study) was built as a private prototype for ONE lesson, ll338, awaiting Darrell's approval before any wider build. Every other lesson's Read, Listen, Watch Video and age chip still handed off to the classic reader, and a More Lessons row left the new look. Darrell saw the classic reader on another lesson and approved the rollout.

## What was measured

- Of the 994 lessons in the catalog, 957 carry their own adult text (`lesson`). The other 37 (Church Offices 7, The Word Out 5, Project Management 13, Software Project Management 12) carry only age versions (child / youth / teen / senior). None has no words at all.
- Before this change the hand-off opened the Experience only for `ll338`; a test pinned "a DIFFERENT lesson still hands off to the classic reader".

## Decision

1. **Every lesson opens in the Experience** on the owner devices (the same signal that already defaults Learn Studio on). Read, Watch Video, Listen and the age chips open it in the matching mode.
2. **A More Lessons row stays in the new look** and opens that lesson in the Experience.
3. **An age-only lesson reads its oldest age version as the full reading** (senior, then teen, youth, child). Its own words, never empty, never invented.
4. Off the owner devices nothing changes: every lesson still opens in the classic reader.

## Impact

- On Darrell's and Christina's devices all 994 lessons open in the new look. No other reader sees a change.
- No new art, audio or paid asset: each lesson uses its approved cover where one exists, and the Experience renders without one where none does yet.

## Verification after merge

- `lesson-experience-prototype.test.jsx` + Learn Studio suites: 70 of 70 pass. New cases: a different lesson opens in the Experience; off the owner device it still hands off; a More Lessons row opens that lesson in place; `textFor` finds words for every one of the 994.
- Darrell confirms on his phone that a lesson other than 338 opens in the new look.

`re-review: 2026-12-02`
