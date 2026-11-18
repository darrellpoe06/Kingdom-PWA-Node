# DR-1481: The record's course lists open to their lessons

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (one learner surface made navigable; no schema, no money, no new route)
**Type:** decision
**Area:** `app/src/components/LearnersPanel.jsx`, `app/src/lib/course-pace.js`, `app/src/components/ChurchLearn.jsx`, `scripts/file-budgets.json`
**Sent in by:** Darrell, 2026-11-13, reading his record at Big Print (A44). Rendered for meaning: the Most studied and Most opportunities lists should be links; each course a drop-down so there is less to scroll; inside it the lessons in chronological order; each lesson a link to its page.
**Pairs with:** DR-1439 (the two lists), DR-1393 (the record's folds), DR-1233 (one course door), DR-0061, DR-0219, DR-0076 §3

## Context

SHOULD (DR-1439, `LearnersPanel.jsx` Most studied / Most opportunities): rank the courses studied most and the courses with the most lessons still short of 100%. ARE: each row was one line of text, the course by its KEY (`living-lessons: tested 30 times, 61 of 306 read`), with no way to see or reach the lessons behind the figure. GAPS: a key where the catalog has a title; no lessons; no door; and at A44 nothing to fold, so the list was read by scrolling.

Reality-trace. Real data: `learner_lesson_records` rows through `learner-records-sync` (`learnerRecords` in ChurchLearn), read by `courseStanding` against `courseLessonIds` from the mounted catalog's `schedule`. Assumption written first: the lessons a figure counts can be derived from the same reading that makes the figure, so the two cannot disagree. The live site cannot be reached from the sandbox (DR-0125), so end to end is proven on the real ChurchLearn with the real catalog.

## What was measured

- `standing()` already walked every lesson to count `read`, `tested` and `grow`; it kept no list. It now keeps each studied lesson (read or tested) with its marks and best score, from the very loop that counts.
- Chronological order: the Lessons list's own "by number, oldest first" (`lesson-order.js` `inNumberOrder`; for Living Lessons the dates never go backwards by number, `living-lessons-dates.js`). The authored course holds L61 before L60; the record now lists L60 first. A course with no lesson numbers keeps its own order. The record reads it from the lesson ids (`chronologicalIds`); against the full schedules of all 44 mounted courses that order was identical, so ChurchLearn passes no second order. Its wiring is net +6 lines; `file-budgets.json` is raised 6006 to 6012, the measured size.
- Chrome 360px and 412px wide, Normal and A44, the built CSS, six course rows, 133 lessons (61 Living Lessons with real titles): page scroll width equals the viewport at all four, no element past the right edge, every fold closed on load, every tap target 44px or more (154px at A44). At A44 and 360px the six folds take 2,364px closed; opened they add 52,531px.

## Impact

Each course row is a native fold, closed by default, named by its catalog title, its figures on the fold. Opened: the course's own door, then its lessons oldest first, each one tap to that lesson. Most studied lists every studied lesson with read, tested and best marks, and its fold says how many (`tested N times, X of Y read, Z lessons studied`, Z the length of the list). Opportunities lists exactly the lessons still short of 100%, each with its best. Course by course and the crowns show titles too.

## Decision

1. A course's figures and its list come from one reading (`studiedLessons`, `lessonsToGrow`), and the fold's count is the list's length.
2. A lesson opens through Learn's existing list door, the one the Latest list used, now named `openLessonFromList` and shared by both. A course opens through `openCourseKey` (DR-1233). No new route.
3. The Governor viewing another learner may open the lessons (reading, not acting on the record); the retake and reread doors stay the learner's own.
4. Color: green focus rings and gray marks; no true red.

`re-review: 2026-11-27` (does a 61-lesson fold at A44 want its own month headings, as the Lessons list has).

## Verification

`the-record-lists-open-to-their-lessons.test.jsx` (9): closed by default, title not key, oldest first, each item opens its lesson, the course opens, counts equal lists, and on the real ChurchLearn a lesson picked on the record opens. All 9 fail against the previous panel; three mutations (no sort, key for title, read count for studied count) each fail named tests. `course-pace.test.js` +3. Existing record suites pass; eslint clean; `npm run build` passes.
