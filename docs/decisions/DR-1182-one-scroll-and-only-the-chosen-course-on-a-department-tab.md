# DR-1182: One scroll, and only the chosen course on a department tab — the Courses tab is where everything lives

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (one surface, Church → Learn; no data, no money, no new door; the shelf and the cross-list declarations are untouched as libraries)
**Type:** surface
**Area:**
- `app/src/components/ChurchLearn.jsx` (the course index, the finder and shelf, the latest list, the continue offer, the catalog line and download-all, the lessons bar, the cross-listed block)
- `app/src/components/LatestLessons.jsx` (`scope` prop; the list rides the page)
- `app/src/__tests__/lesson-lists-reach-the-whole-list-on-a-tv.test.jsx`, `lesson-age-versions-count.test.jsx`, `learn-crosslisted-shelf.test.jsx`, `living-lessons-shelf-crosslist.test.jsx`, `learn-crosslisted-in-the-picker.test.jsx`, `learn-course-picker-is-first.test.jsx` (the six pins of the old behaviour, rewritten to pin the new)
- `docs/99-session-notes/2026-10-21-learn-one-scroll-course-only-tabs.md` (the build log)

**Amends:** DR-1183 on one point (the course index joins the blocks that wait for a chosen course); DR-0448 and DR-0598 on ONE point: the "also taught across the curriculum" rows no longer render on a department tab (the declarations in `lib/learn-crosslist.js` stand; DR-0516's course-level pointers stay in the picker). DR-0732's sticky month headings stand and now stick against the page's own scroll. Grounds: DR-0061 (reality-trace), DR-0075 (perpetual improvement), DR-0076 (measure, don't claim; proven-to-catch), DR-0219 (SHOULD → ARE → GAPS → CLOSE), DR-0432 (Learn is one program of departments), DR-0686 (the latest list), DR-0795.
**Declared by:** Darrell, 2026-10-21, in the same spoken word that carried L258 (DR-1181).

## Context

**His words (rendered for meaning).** "I need it to work in a way where it's not confusing. Not necessarily get rid of the functions, but I only want what we need in the space. I don't want 3 or 4 different scroll bars in a space. I want all of the options in one scroll bar. Put all the features in one scroll bar. This is a comprehensive reevaluation and assessment, and then an implementation of a better system for not being confusing and for getting directly to what are the courses, and then the lessons that are in that specific course that's chosen. Do not put any other lessons out there other than that, period. The only time you're going to do all that other stuff is in the main Courses tab where everything lives. On those specific tabs that are isolating out Living Lessons or History or whatever it is specifically, only have the course information in that one for that list so it could actually sort to that. Or else we're just putting the same thing every time, every situation. We want only what we're choosing to be there."

**SHOULD (DR-0219).** Church → Learn is one program of departments (DR-0432): the Courses tab is the whole catalog; a department tab narrows to its own courses and the chosen course follows. A reader on a department tab should see that department's courses in the picker and the chosen course's lessons, in one page that scrolls once, with the options (sort, shelf, fold, search) acting on that one list. Everything that spans every course belongs on the Courses tab.

**ARE, before this record (traced on the real component, `ChurchLearn.jsx`, with line references as they stood).** On a department tab the page rendered, top to bottom: the tab strip; the course picker (the department's own courses plus the "Also serves" pointers); when the sort was "latest", **the latest lessons of EVERY course** (`LatestLessons courses={courses}`); **every in-progress lesson of EVERY course** (`ContinueOffer items={inProgress}`); the chosen course's own index as **a box with its own scrollbar** (`max-h-[45vh] overflow-y-auto`); the **"Also taught across the curriculum" block of OTHER courses' lessons** (`learn-crosslisted`, DR-0448 / DR-0598); the finder, whose blank state was **a second list of the department's lessons in a second scroll box** (`lesson-browse-all`, `max-h-[55vh] overflow-y-auto`), labelled "all N lessons, every course"; the course title; the catalog line **"N courses · N lessons — every finished lesson in the PoeTech App, in one place"** and the **download-every-lesson** control; the sticky lessons bar carrying **the catalog's totals**; then the course's cards. The latest list was a third scroll box (`max-h-[45vh] overflow-y-auto`). So a reader on the Living Lessons tab met up to four vertical scrollbars (the page plus three boxes), the same course's lessons listed twice (index and shelf) and a third time as cards, and three places that showed lessons from courses they had not chosen.

**GAPS.** (1) Three inner scroll boxes where he asked for one scroll. (2) Other courses' lessons on a department tab in three places: the latest list, the continue offer, the cross-listed block. (3) The same list twice: the index and the shelf both listed the chosen course. (4) Every-course furniture on a department tab: the catalog line, download-all, the lessons bar's totals, the finder's "any course" label.

**CLOSE.** Each gap is closed below, and each closure is pinned by a test that proves the old shape cannot come back unnoticed.

## What was measured

Measured on the source and on the real component tree, 2026-10-21.

| what | before | after |
|---|---|---|
| inner vertical scroll boxes on the Learn page (`overflow-y-auto` in `ChurchLearn.jsx` + `LatestLessons.jsx`) | 3 (index 45vh, shelf 55vh, latest 45vh) | 0 — the page is the one scroll |
| places on a department tab that listed lessons from courses not chosen | 3 (latest, continue, cross-listed block) | 0 |
| lists of the chosen course's lessons on a department tab (besides the cards) | 2 (index, shelf) | 1 (index) |
| every-course controls on a department tab | 4 (catalog line, download-all, bar totals, "any course" finder) | 0 (all on the Courses tab; the bar counts this course; the finder searches this course) |
| the Courses tab | unchanged in what it carries | unchanged in what it carries; its three lists now ride the page scroll |
| `lib/learn-crosslist.js` declarations and the "Also serves" optgroup (DR-0516) | present | present, untouched |

## Decision

1. **One scroll.** The course index, the browse shelf and the latest list are no longer boxes with their own scrollbars. They ride the page. The month folds (DR-0732) and the shelf picker are how a long list is kept short; the sticky month headings now stick against the page's scroll. The TV rule in `index.css` stays for any other box under `main`, but has nothing of these lists left to flatten.
2. **Only the chosen course on a department tab.** On a department tab: the latest list is the chosen course's (`scope="this course"`); the continue offer is filtered to the chosen course; the cross-listed lesson block does not render; the finder searches the chosen course and its blank state shows nothing (the index above IS the list); the catalog line and download-all do not render; the lessons bar counts this course.
3. **The Courses tab is where everything lives.** Every course in the picker, the latest lessons of every course, every in-progress lesson, the finder over every course with the every-course shelf under it, the catalog line and download-all — unchanged in what it carries.
4. **The chosen course's index renders only for a course that is open.** DR-1183 (merged the same hour by a parallel session) made nothing open on the Courses tab until a course is chosen, but left the by-title index of the fallback course rendering under "Choose a course". Unboxed by this record, that index would have been a page-long title page for a course nobody picked, so it now waits on `courseOpen` like the rest of the course's blocks. A department tab counts as a choice (DR-0432 / DR-0433), as DR-1183 scoped it.
5. **Functions are kept, not removed.** Sort, shelf, fold, search, play, continue, share and download all remain; what changed is their scope on a department tab and the number of scrollbars.

**Re-review.** `re-review: 2026-10-28`: Darrell reads the Living Lessons tab and the History tab on his phone; if the cross-listed lessons (DR-0448) are missed, their surface is the Courses tab's shelf or a chip in the picker, never a block of other courses' lessons on a department tab.

## Impact

A reader who taps Living Lessons sees the Living Lessons courses, picks one, and scrolls one page of that course's lessons with every option acting on that list. A reader who taps History sees History's three courses and the chosen one's lessons and nothing from Living Lessons. A reader on Courses still has everything, on one scroll. Nobody meets a list that scrolls inside a page that scrolls.

## Verification

- `lesson-lists-reach-the-whole-list-on-a-tv.test.jsx` pins that neither list element carries an inner scrollbar again (and that the course index and latest list carry exactly the one-scroll class), with the TV rule still present for other boxes.
- `lesson-age-versions-count.test.jsx` pins the latest list rides the page.
- `learn-crosslisted-shelf.test.jsx`, `living-lessons-shelf-crosslist.test.jsx`, `learn-crosslisted-in-the-picker.test.jsx` pin that the A.I., Living Lessons and History tabs render no block of other courses' lessons while their declarations still resolve, with a proven-to-catch on the block's own test id.
- `learn-course-picker-is-first.test.jsx` walks every department tab on the real catalog and pins: no cross-listed block, no every-course shelf, and the picker before the course index wherever a picker exists.
- The unchanged pins that still hold: the Courses tab's shelf spans every course (`learn-browse-without-choosing`), the latest list on the Courses tab is every course (`learn-sort-every-option`), the picker precedes everything (`learn-course-picker-is-first`), the index comes next (`learn-lesson-index-is-next`), a department narrows the picker (`learn-is-a-school`), the registry's selectors are present (`feature-presence`).
- `church-learn-play-and-courses`, `learn-course-picker-is-a-selector`, `learn-play-from-the-list` re-pointed to a chosen course (the index now waits for one): the play controls and the by-title index are reached by the tap a reader makes; a month-heading fold is not counted as a title.
- **Measured on the final tree: 53 files, 549 cases, all passing; lint 0.** Suites run locally against the change: every `learn-*` suite plus the Living Lessons order and sections suites, the TV and age-versions suites, continue-a-lesson, the derived lesson count, lesson downloads, feature presence, the three church-learn suites, the overview, leaving-a-lesson, L127, the room, the title and lesson-opens-fast — results recorded in the session note.
