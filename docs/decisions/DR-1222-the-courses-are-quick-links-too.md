# DR-1222: The courses are quick links too — a tappable chip row of every course above the select

**Date:** 2026-10-27
**Status:** accepted
**Tier:** A (additive: a chip row on Church → Learn beside the existing select; no count, credit, route or schema changes)
**Type:** surface
**Area:**
- `app/src/components/ChurchLearn.jsx` (the quick-link rows inside the picker block; `openCourseKey`, the one handler the select and the chips share)
- `app/src/components/SectionTabs.jsx` (two opt-in props: `allowNone`, `chipClassName`; every existing caller unchanged)
- `app/src/__tests__/learn-courses-are-quick-links.test.jsx` (its gate, 9 cases, proven to catch)

**Amends:** nothing. **Grounds:** DR-0516 (a cross-listed course is a POINTER — one home, one count, one credit), DR-0432 (the department row is a row of tabs), DR-1183 (nothing is open until chosen; the heading says so), DR-0598 (the picker is at the top of every department tab), DR-0076 (measured, not claimed; proven to catch).
**Principles:** APP-IS-PRIMARY, REALITY-TRACE, VERIFICATION-DOCTRINE.
**Declared by:** Darrell, 2026-10-27, from his phone on Church → Learn (Courses): *"Need the courses options to be quick links too... fix it"*.

## Context

On Learn, the DEPARTMENTS were already quick links — one row of sliding tabs (`SectionTabs`, "Learn departments", DR-0432), one tap each. The COURSES were not. The only control that opened a course was the native `<select id="learn-course-pick">`: on a phone that is a tap, the picker wheel, a scroll through up to 51 options, and a second tap. The department row and the course control sat one above the other, one of them a row of chips and the other a dropdown, and the reader had to learn two different ways to do the same kind of thing.

The select itself is pinned by six suites and stays: it is FIRST in DOM order (`learn-course-picker-is-first`), it never displays the open course (`learn-course-picker-is-a-selector`), it carries the "Also serves" optgroup (`learn-crosslisted-in-the-picker`), and its counts are the department's OWN courses (DR-0516). None of that was the complaint. The complaint was that the courses had no fast road.

## What was measured

**Reality trace (DR-0061).** Real data: `visibleCourses` (the department's own courses, or every course), ordered by `organizeCourses(visibleCourses, sortNow, sortCtx)` — the same list the select lists, in the same order; and `gatheredCourses` (`resolveCourseCrossListed(dept.label, courses)`), the courses that only SERVE an open department. Real screen: Church → Learn, the picker block (`visibleCourses.length >= 1 && !lessonFocus`), under the department row and above the select. Real handler: the select's `onChange` body, lifted into `openCourseKey(k)` and called by both controls — a gathered course drops the department filter (`setDeptId('all')`, `setResumeOpenGuide(false)`) before `setActiveKey(k)`, exactly as the select did.

**Chromium, dev server, `/poetech-app/?view=learn`, Learn as a reader meets it** (playwright-core, `/opt/pw-browsers/chromium`):

| width | page scrollWidth | chips (all courses) | chip height min/max | row box scrollWidth / clientWidth | chips above select |
|---|---|---|---|---|---|
| 360 | 360 (no page overflow) | 51 | 36 / 36 px | 19280 / 295 (scrolls) | yes |
| 768 | 768 | 51 | 36 / 36 px | 19280 / 679 (scrolls) | yes |
| 1280 | 1280 | 51 | 36 / 36 px | 19280 / 943 (scrolls) | yes |

On the **Business** tab at every width: 2 own chips ("Quick links · 2 courses" — the pointer rule holds, the heading still says 2, never 27), 25 "Also serves Business" chips at 36px, none of them highlighted (none is the open course on that tab), page scrollWidth equal to the viewport. Tapping the first chip at every width set the `<h2>` to the course the chip names (`BUS-101 · Rent to Own — Business Operating Systems from the Store Floor` → `Rent to Own — Business Operating Systems from the Store Floor`).

**Why `allowNone` exists.** `SectionTabs` in controlled mode fell back to its FIRST section whenever `activeId` matched nothing. For a quick-link row that is wrong twice: on arrival nothing is chosen (DR-1183 — the heading says "Choose a course", so no chip may claim to be open), and the gathered group never contains the open course. With `allowNone` a non-matching `activeId` selects nothing, no panel renders, the first chip keeps the roving-tabindex stop, and Arrow keys still reach every chip. Default off; every existing caller behaves as before (lint clean, the SectionTabs suites green).

## Impact

- **One tap to any course**, in the same gesture the departments already take; the chip row scrolls sideways with the same `TabScroll` primitive (native momentum, "Show all" to wrap when it overflows) and never widens the page.
- **The select stays** — the phone's own picker, the sort control, the count the tests pin — and the chips sit ABOVE it, so every DOM-order gate holds unchanged.
- **Counts and credits do not move** (DR-0516): the own row counts own courses; the gathered row is labelled as courses taught elsewhere; a tap on one opens it in its home with the filter dropped.
- Every chip declares `min-h-[36px]` and measures 36px.

## Decision

The courses on Church → Learn are quick links as well as select options. The chip row of the view's courses — and, on a department, a second labelled row of the courses that serve it — renders inside the picker block, under the department row and above the select, built on `SectionTabs variant="sub"` and driven by the one shared handler. The select is kept. Nothing about course counts, credits or cross-listing changes.

## Verification

- `learn-courses-are-quick-links.test.jsx` — 9 cases on the real component: one chip per select option in the same order; code · title labels; nothing selected until chosen, then the open chip; a tap moves the course and the `<h2>`; Business carries its 25 gathered chips in a separate labelled group with the own count untouched; a gathered tap clears the filter and opens the course in its home; the select stays the prompt and the chips sit above it; every chip declares ≥ 36px. **Proven to catch:** with the row removed from `ChurchLearn.jsx`, 7 of 9 fail (the two that pass assert only the select and the chip class on an empty list).
- The six pinned suites still green: `learn-course-picker-is-first`, `learn-course-picker-is-a-selector`, `learn-crosslisted-in-the-picker`, `learn-a-tab-is-navigation-not-a-resume`, `learn-is-a-school`, `church-learn-play-and-courses` — 66 tests across 7 files.
- `npm run lint` clean (max-warnings 0); `monolith-budget-guard` OK (the shell did not grow).
- The Chromium measurements above, at 360 / 768 / 1280, all-courses and Business.
