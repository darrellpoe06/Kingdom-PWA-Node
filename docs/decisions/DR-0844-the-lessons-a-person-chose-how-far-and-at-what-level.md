# DR-0844 — The lessons a person chose, how far, and at what level: the measure framed by the goal

- **Status:** accepted
- **Tier:** A (a read of rows the governor and the learner already read, under 0250's walls; no table, no policy)
- **Type:** feature
- **Date:** 2026-10-09
- **Scope:** `app/src/lib/lessons-walked.js` (new, pure: `lessonsWalked`, `walkedLine`), `app/src/components/LessonsWalked.jsx` (new), `app/src/components/AccessUsageMetrics.jsx` (inside the Usage fold, DR-0840), `app/src/components/PersonRecord.jsx` (the Known fold, compact), `app/src/__tests__/lessons-walked.test.jsx` (3).
- **Principles:** 0250 (a learner's record reaches the governor; a learner reads their own), DR-0677 class (bands from the framework's own pass line), DR-0840 and DR-0843 (each person understood, when and how much), DR-0076 (what is not held per lesson, the opens, is said rather than counted), the Worldview (the goal is Yahweh's perspective, the Highest Authority and Level; the count is how far along His way, never the goal), DR-0331 (his words rendered for meaning).
- **Grounds:** Darrell, 2026-10-09: *"Different lessons I choose to learn from how many times and which levels?"*; *"Lesson the goal is to fill up with Yahweh's Perspectives explicitly... Highest Authority And Level..."*; *"So its easy to See From Deeper space... Yahweh's Way Of Getting Life Done With Him..."*; and *"Also for me and what I did and do inside and outside of the app based on user profiles and data analytics make sense?"*

## Context

The Learners panel rolls every learner up per course for the Governor (0250). Nothing answered, for one person, which lessons they chose, at what level, how many times tested, how far completed, and when last, beside the rest of what the app knows about them. And the frame Darrell gave is the point: the measure is not taps; it is how far a person has walked into Yahweh's own perspective, the Highest Authority and Level, so that life is seen from the deeper place and done His way with Him.

## What was measured

- `learner_lesson_records` (0250): per person per lesson, `course_key`, `age_band` (the level the lesson was taken at), `completed_at`, `quiz_pct`, `quiz_passed`, `quiz_attempts`, `quiz_at`, `updated_at`; read by the owner and by `is_lesson_governor()`.
- What is not held: a lesson's own opens. `usage_events` records the Learn tab (DR-0819 records uses), not the lesson id, so "how many times" is honestly the times tested and completed, and the fold says so.
- The build's catalog names a lesson (`findLessonInCatalog`), with its L-number for the living lessons.

## Impact

- Unresolved: a parent or the governor cannot see one person's walk through the lessons where they look at that person; the Learners panel is per course for everyone.
- The call obligates: one person's lessons newest first, named by the build, banded by the framework's own pass line, counted by course and by level, with the goal stated above the numbers and the gap (opens per lesson) stated below them.

## Decision

1. **The walk** (`lessonsWalked`): one person's records, each lesson named, its course, its level (the age band), completed or open, the band and score and attempts, when last; counts of lessons, completed, tested, attempts and bands; by course; by level; the last date.
2. **Where:** inside the signups row's Usage fold (DR-0840) in full, and in the Known fold compactly; the governor's own row like anyone's.
3. **The frame, in our voice, above the numbers:** the goal is to be filled with Yahweh's perspectives, explicitly, the Highest Authority and Level, so it is easy to see from the deeper place His way of getting life done with Him; the numbers say how far along that way and are not the goal.
4. **Said plainly:** times are times tested and completed; a lesson's opens are not recorded per lesson. What a person does outside the app is not held (DR-0828).

## Verification

- `lessons-walked.test.jsx`: one person's lessons newest first, named from the catalog, banded (mastered, passing, not yet tested), counted by course and level, the line; nobody's walk reads as none; the fold renders the goal, the line, each row with level and band, the gap sentence; compact keeps the line; a refused read is said.
- The signups, seats and roster suites still green; eslint clean.
- `re-review: 2026-10-23`: whether to record a lesson's opens per lesson (a `kind='lesson'` use with the lesson id) so "how many times" can mean opened, judged against whether that count serves the goal or only the counting.
