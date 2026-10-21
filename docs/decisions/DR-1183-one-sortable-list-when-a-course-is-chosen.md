# DR-1183: One sortable list, and no course is open until it is chosen

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (what a reader meets on arrival at Learn — the front door of the catalog)
**Type:** word
**Area:**
- `app/src/lib/learn-course-choice.js` (`courseChoiceRows`, `standingWords`, `choiceWords` — pure)
- `app/src/components/CourseChoiceList.jsx` (the one list)
- `app/src/components/ChurchLearn.jsx` (the heading, the course blocks, the landmark bar's three course-owned parts)
- `app/src/__tests__/one-sortable-list-when-a-course-is-chosen.test.jsx` (16 cases)
- `app/src/__tests__/church-learn-render.test.jsx`, `church-learn-play-and-courses.test.jsx`, `learn-course-picker-is-first.test.jsx`, `learn-deep-link.test.jsx` (18 existing cases re-pointed, each with its reason in place)

**Grounds:** Darrell, 2026-10-21, with two screenshots of Learn: **"It's like a title page saying your inside living lessons... we need one list when choosing a course... with all options to sort that one list... make sense.... only have that sortable list when it is chosen!!!!!!!!!!!!!!! Obviously.... make sense?!!!!!!!!"**
**Principles:** DR-0076 §8 (a surface says what is true, and says what it does not know); DR-0061 / reality trace (the surface a reader actually meets); DR-1161 (pinning a promise, not whatever implementation was there first); DR-0121 (derived, never typed); DR-0149 / DR-0516 / DR-0598 (the picker this sits beside)

## Context

Learn had a course picker, a sort control, a lesson finder with a full shelf, and a sticky landmark bar. What it did not have was an answer to *"which course am I in?"* on arrival — because it always answered *"Living Lessons"*, whether or not anybody had said so.

## What was measured

- **The file named its own defect before he did.** `ChurchLearn.jsx`'s comment at the `activeKey` state: *"`active` below still falls back to the A.I. course for the CONTENT, so nothing under the picker is ever empty; only the select tells the truth about whether a choice was made."* `chosenCourse` is null until somebody picks; `active` falls back to `defaultCourse`. So eight things rendered as a course that nobody opened: the `<h2>` title, the catalog line (code · department · level · count), the plain-words line, Share this course, Download this course, the sticky bar's course name and Continue, the Word-first lead, and the whole lesson schedule. That is the title page.
- **The order was grouped, so "one list" did not exist.** The picker's order came from `organizeCourses`, which is `learnDepartments(courses).map((d) => ({ ..., courses: sortCourses(d.courses, sortKey, ctx) }))` — a sort **inside each department**. Over the live catalog that is one little list per department, not one list, and reading them top to bottom is not the catalog's order in the chosen sort. Pinned by measurement in the new suite: on a three-course fixture across two departments, the grouped reading order is `zeta, alpha, mid` while one-list-by-title is `alpha, mid, zeta`.
- **The landmark bar had to stay.** Its grounds are Christina, 2026-08-31 — *"How do I get to the rest of the lessons?"* — a reader browsing **without** choosing. The first cut of this change gated the whole bar and three cases in `learn-browse-without-choosing.test.jsx` went red naming exactly that. They were right and the gate was wrong.

## Impact

- Arriving at Learn with no choice made shows **one list of every course offered**, in whatever order the sort control is set to, each row one tap. The heading reads **"Choose a course"**.
- Each row carries only what it can prove: the catalog code and department (derived by `learnDepartments`), the real lesson count from the schedule, the level **where the course declares one**, the plain words where it declares them, and this device's standing (`not started` / `in progress · 3 of 9 read` / `finished`).
- **A reader meets the list once, not every visit.** `rememberCourseKey` already stores the choice per device, so the next arrival opens straight into that course. Pinned as a case.
- Every order the control offers now reorders the whole list: title A–Z and Z–A, most and fewest lessons, recently added, last opened, in progress, not started, completed.
- An empty catalog **says it is empty** rather than rendering nothing, so a catalog that failed to mount cannot read as a tab with no courses in it.

## Decision

**Nothing is presented as open until it is chosen, and while nothing is chosen the page is one sortable list of the courses.**

- The `<h2>` **stays** (the section is `aria-labelledby="learn-h"`) and says `courseChosen ? active.meta.title : 'Choose a course'`.
- The course's own blocks wait for a chosen course: the catalog line, the plain-words line, Share, Download, the Word-first lead, and `CourseView`.
- **The sticky landmark bar renders either way** — that is its whole purpose — and the three things inside it that belong to a course wait for one: the unit noun (`All lessons` until a course names its unit), the course's name (`No course chosen yet`), and its Continue chip. Its "All lessons" button and its derived catalog totals are unchanged, so the landmark Christina asked for is in the same place with the same shape whether or not a course is open.
- **The order is one sort over the whole list** (`sortCourses` on the flat catalog), driven by the same control that orders the picker — the same orders, one list.
- The codes come from the **whole** catalog, so a course's code does not change when a department tab narrows the list. Proven to catch: the same course alone renders `…-101` and, with the catalog, `…-102`.

## Verification

- **16 new cases**, covering the order across the whole list against the grouped order it replaces, every sort key, the counts read from real schedules, a level only when declared, the whole-catalog codes, the words the list says, standing read from the device's places, and the list on the screen (one `<ul>`, one tap per row, 56px targets with a focus ring, an empty catalog that says so).
- **18 existing cases re-pointed, and that is the honest number.** Each change is a promise kept on a surface that moved, with its reason written beside it: tests about what is *inside* a course now open one first (`openCourse()`, the same tap a reader makes); the heading cases assert both halves (`Choose a course` on arrival, the course's title after choosing); `learn-deep-link`'s two no-link cases assert the one list is the page, which is what *"never a dead screen"* now means. **Nothing was relaxed:** `church-learn-render.test.jsx` is strictly stronger, because it also clears `localStorage` between cases — it had been depending on whichever course happened to be remembered in that worker.
- **The first cut was caught by an existing suite, not by me.** Gating the landmark bar turned three cases in `learn-browse-without-choosing.test.jsx` red. The bar came back and the parts inside it were narrowed instead.
- 12 Learn/browse cases green, 14 play-and-courses, 5 church-learn-render, 21 deep-link + picker-order, 16 new. Lint 0 on all three changed files.

## What this does not do

- **Nobody has seen it rendered.** This sandbox has no route to poetech.us or to a preview, so the live pass is the stewards' after deploy (DR-0104).
- **`defaultCourse` still governs one path with no assertion on it:** when a *department* tab is open with no chosen course, `active` falls back to `dept.courses[0] || defaultCourse`. Nothing renders from it now on the all-courses view, and the case that used to pin "the default is Living Lessons, not A.I." has been re-pointed to what is observable. The department-fallback path needs its own case. **`re-review: 2026-10-28`.**
- **The dropdown picker remains beside the list.** Two ways to choose is one more than necessary, and collapsing them is a separate decision with its own order constraints (DR-0598 requires the control at the top of every department tab). **`re-review: 2026-10-28`.**
- **The list is not themed.** Like the rest of Learn it uses literal hex, not theme tokens; `contrast-guard` and `legibility-guard` both pass, so this is consistency debt, not legibility debt. **`re-review: 2026-10-28`** with the other token work.
