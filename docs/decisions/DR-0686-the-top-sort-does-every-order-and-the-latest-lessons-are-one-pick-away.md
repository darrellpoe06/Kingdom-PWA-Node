---
id: DR-0686
title: The top sort on Learn does every order the app has, and the latest lessons across every course are one pick away
status: accepted
date: 2026-09-29
tier: A
type: surface
declared_by: Darrell
scope:
  - app/src/lib/learn-organize.js (COURSE_SORTS grows; courseSortsFor, sortCourses, courseAddedSpan, courseStanding, latestLessons, rememberedCourseSort / rememberCourseSort)
  - app/src/lib/lesson-order.js (LESSON_ORDERS gains Course order, A to Z, Z to A; the by-number order on a dated course reads "By number, oldest first")
  - app/src/components/LatestLessons.jsx (new: the newest lessons across every course)
  - app/src/components/ChurchLearn.jsx (the top sort offers what courseSortsFor returns, remembers the pick, shows LatestLessons when it is picked; the lesson list and Prev/Next honor the title orders)
  - app/src/__tests__/learn-sort-every-option.test.jsx (new)
  - app/src/__tests__/living-lessons-order.test.jsx (the option lists it pins now include the new orders)
  - app/src/lib/legibility-health.json (regenerated: one new component page, passing)
principles: [REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076), DERIVED-NEVER-PAINTED (DR-0121), APP-IS-PRIMARY (DR-0065)]
grounds:
  - DR-0626 — the lesson order inside a course (by number, newest first, by the Word's divisions)
  - DR-0631 — the saved places, one per lesson, that "Recently opened" and the progress orders read
  - DR-0432 — Learn as departments; the picker groups by department
---

## Context — his words (verbatim)

Darrell, 2026-09-29, with two phone screenshots of Church → Learn:

> "Can we make the top sort work to do all sorting options? Also the latest created lessons?"

The first screenshot showed the top sort (above "Where you left off") offering only *Course order · A to Z · Most lessons · Shortest first*. The second showed the lesson sort inside Living Lessons ("All lessons · 197") offering *By number, first to last · Newest first · By the Word's divisions*.

## What was measured — the reality trace, before the code

- **Real data.** Course titles and lesson counts come from the mounted course descriptors. The only per-lesson creation days in the app are `added` on Living Lessons (`lib/living-lessons-dates.js`: the git commit day each lesson first landed, one line per lesson). Measured on the real catalog: of 30+ mounted courses, **only Living Lessons carries a recorded day** (the test pins this). The cohort courses' `date` fields are *scheduled class dates* computed from a cohort start, not creation days, so they are not used. Where a reader has been comes from this device's saved places (`lib/learn-resume.js`, `listPlaces`, stamped `at`, `done`, `started`) and the signed-in lesson record (`progress`, keyed by lesson id).
- **The surface he uses.** The top sort is `#learn-course-sort` in `ChurchLearn.jsx`. It orders courses within each department group of the `#learn-course-pick` dropdown. The lesson sort is `#learn-lesson-order` in the course's own lesson index.
- **Premise stated.** "All the sorting options" means every order whose data exists, applied at the level it sorts. An order with no data behind it is not offered.

## Impact

Before this change, a reader who wanted the courses in any order other than the four offered, or wanted to see what had been added lately, had no way to do it from the top of Learn. The newest lessons could be seen only by opening Living Lessons and switching its own list to Newest first. Now the top sort is the one place for every order, and the newest lessons across the whole program are one pick away. The layout everyone else meets does not change: the picker stays first, and "Where you left off" stays directly under it unless the reader picks Latest lessons. The top sort had no memory before, and now it keeps the pick on the device.

## Decision

**The top sort offers every order whose data exists:**

| Option | Reads | Offered when |
| --- | --- | --- |
| Course order | registry order | always |
| A to Z / Z to A | course title | always |
| Most lessons / Fewest lessons first | live schedule length | always ("Shortest first" renamed to say what it measures) |
| Recently added | newest recorded lesson day in the course; courses with none follow in course order | at least one course records days |
| Oldest first | earliest recorded lesson day | **two or more** courses record days |
| Recently opened by you | newest saved place per course | this device has a saved place |
| In progress first / Not started first / Completed first | lesson record + saved places (done = record or finished place; begun = an open place) | the reader has any progress |
| Latest lessons, every course | every lesson with a recorded day | at least one course records days |

Ties keep course order. The pick is kept on the device (`poetech.learn.courseSort`, localStorage in try/catch, the same pattern as the remembered course). A stored pick whose data has gone falls back to Course order.

**Latest lessons lives in the top sort.** Picking "Latest lessons, every course" shows the list directly under the picker row. Each row shows the day, the home course and the lesson number, newest first with month labels, and a tap opens the lesson in its home course. Why there and not a strip at the top of Learn: the top of Learn is guarded picker-first (`learn-course-picker-is-first`, `learn-lesson-index-is-next`), and Darrell has asked more than once that nothing be stacked above the picker or between it and where you left off. Putting it inside the control he was already using keeps that layout for everyone and gives the list to whoever asks for it. The list states how many courses record days and how many lessons are left out for having none.

**The lesson sort matches where it applies.** Every course with a lesson index now offers A to Z and Z to A. A course whose lessons carry no number offers Course order as its default. On a dated course the by-number order is labelled **"By number, oldest first"**. It is oldest first: `living-lessons-order.test.jsx` holds that the days never go backwards in number order. So there is one option, not two identical ones. Prev/Next inside a lesson follow the title orders too.

## Left out, and why

- **Oldest first (courses):** only one course records its days today, so this order would give the same list as Recently added. It is built and tested, and it appears on its own once a second course records its days.
- **By department / shelf:** the picker already groups every order by department (DR-0432). A department sort would add nothing.
- **Recently updated:** no record of when a lesson was *edited* exists in the app. Only the day it was added exists. Not invented.
- **Days for courses other than Living Lessons:** no generated dates file exists for them, so their lessons are undated and not listed in Latest lessons (counted in its header instead). Generating one from git history is its own piece of work (the living-lessons-dates.js method). **re-review: 2026-10-13.**
- **Recently opened / progress orders inside a course:** the lesson index already has its "Recently opened" row and per-row Continue / Finished marks. A per-lesson progress sort was not asked for.

## Verification

- `learn-sort-every-option.test.jsx` (14 tests) proves every course order on the real mounted catalog. Each check is also run on the opposite order and must fail. A mutation run flipped the A-to-Z comparator and the date comparator in `sortCourses`, and three tests failed. The Latest list is proven to pull every dated lesson in the catalog, newest first, to merge across courses by day (a second course given a synthetic later day leads), to exclude a malformed day, and, in a real render, to open the tapped lesson in its home course starting from a different course, with the saved place recording `living-lessons`.
- Existing Learn suites green (living-lessons-order, learn-organize, picker-is-first, lesson-index-is-next, lesson-space, catalog-render, deep-link, browse, crosslisted, school, resume-render). The contrast, consistency, legibility (health regenerated for the one new page) and layout-probe-selftest guards are green, and so is lint.
