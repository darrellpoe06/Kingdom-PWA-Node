# DR-1658: Both views for kids and adults

**Date:** 2026-11-25
**Status:** Accepted
**Tier:** B (child-facing; hides, adds nothing a child can post)
**Type:** product
**Area:** `app/src/components/learn-studio/LessonExperience.jsx`, `app/src/components/learn-studio/lesson-experience.css`, `app/src/__tests__/lesson-experience-prototype.test.jsx`, `app/src/__tests__/kids-lesson-library.test.js`
**Sent in by:** Darrell, 2026-11-25: "Unless we want to be able to use both views for kids or adults... why not?" then "Build it your way and finish the test."
**Pairs with:** DR-1654 (every lesson in the new look), DR-0855 (stories and perspectives, steward-reviewed), DR-1657 (lessons in order; ages aligned)

## Context

The Kids Zone promises "Safe here: no profile, no chat, no scoreboard." The new look ends every lesson with Stories & Perspectives, which reads other people's reviewed posts and invites the reader to add one. Darrell wants either view usable by kids or adults.

## What was measured

- Every row of every Kids Zone age opens at that age's own written version: Little Ones 9, Kids 337, Youth 272, Teen 337; 955 of 955, none falling back, none at the wrong level.
- The new look's age buttons already switch the reading to Child, Youth, Teen, Adult or Senior.

## Decision

1. **At Child, Youth and Teen**, the new look keeps the lesson's own taught stories and charts, reads no one else's posts, and offers no posting. The Kids Zone promise travels with the child.
2. **At Adult and Senior**, Stories & Perspectives is unchanged.
3. **A "Kids Zone" link** sits in the new look's header for grown-ups (and kids) to cross over; the Kids Zone already links back to Learn.
4. **The age alignment is a standing test**: every age's rows open at their own version.

## Impact

- No feature removed. A child in the new look sees the teaching, not the community.

## Verification after merge

- 93 of 93 pass across the Lesson Experience, Learn Studio and Kids Zone suites. Proven to catch: with the young-level rule disabled, the kids case fails; restored, it passes.
- Darrell switches a lesson to Child in the new look and sees "Stories", no posts.

`re-review: 2026-12-02`
