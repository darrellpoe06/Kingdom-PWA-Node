# 2026-10-21 — Church → Learn: one scroll, and only the chosen course on a department tab

**Decision record:** DR-1182
**Source:** Darrell's spoken word of 2026-10-21 (the second half of the message that carried L258 / DR-1181).

## What he asked for, rendered for meaning

- Not confusing. Keep the functions, but only what we need in the space.
- Not three or four scroll bars in a space; all the options in one scroll bar.
- Get directly to the courses, then the lessons of the course that was chosen.
- On a specific tab (Living Lessons, History, any department) do not put any other lessons out there, period;
  only that course's information, so the list can sort to that. Otherwise it is the same thing every time.
- The main Courses tab is where everything lives; that is the only place for all the other stuff.

## SHOULD → ARE → GAPS → CLOSE (DR-0219)

**SHOULD.** One program of departments (DR-0432). A department tab narrows to its courses and the chosen course's
lessons, on one page scroll, with the options acting on that one list. Everything that spans every course is the
Courses tab's.

**ARE (traced on `app/src/components/ChurchLearn.jsx` and `LatestLessons.jsx` before the change).** A department
tab rendered, in order: tabs; picker; the latest lessons of every course (when sorted by latest); every course's
in-progress lessons; the chosen course's index in a 45vh scroll box; the "also taught across the curriculum" block of
other courses' lessons; the finder with a second list of the department's lessons in a 55vh scroll box; the course
title; the every-course catalog line and download-all; a sticky bar carrying the catalog's totals; the cards. The
latest list was a third 45vh scroll box.

**GAPS.** Three inner scrollbars. Other courses' lessons in three places. The chosen course listed twice. Four
every-course controls on a department tab.

**CLOSE.**

| gap | change | file |
|---|---|---|
| three inner scroll boxes | the index, the shelf and the latest list ride the page; folds keep them short; the month headings stick against the page scroll | `ChurchLearn.jsx` (index `ol`, shelf `div`), `LatestLessons.jsx` (`ol`) |
| latest list of every course on a department tab | `courses={dept ? [active] : courses}` with `scope="this course"` | `ChurchLearn.jsx`, `LatestLessons.jsx` (`scope` prop) |
| every course's in-progress lessons on a department tab | `inProgress` filtered to the chosen course when a department is open | `ChurchLearn.jsx` |
| the cross-listed lesson block | removed from the page; the declarations stay in `lib/learn-crosslist.js`; the picker's "Also serves" pointers (DR-0516) stay | `ChurchLearn.jsx` |
| the second list (shelf) on a department tab | the shelf renders only on the Courses tab; the finder searches the chosen course there and says so | `ChurchLearn.jsx` |
| catalog line, download-all, bar totals | Courses tab only; the bar counts this course on a department tab | `ChurchLearn.jsx` |

## Reconciled with DR-1183 (merged by a parallel session while this was being built)

DR-1183 made the Courses tab show one sortable list of courses and nothing open until a course is chosen. The
two changes are complementary and merged without a code conflict (only the ledger's Next ID line collided).
One leftover: the chosen course's by-title index was not among the blocks DR-1183 gated, so on arrival it still
rendered the fallback course's lessons under "Choose a course"; unboxed, that would be a page-long title page.
It now waits on the same `courseOpen` as the rest of the course's blocks (a department tab counts as a choice).

## What was measured

- Inner vertical scroll boxes in the two components: 3 before, 0 after (`grep overflow-y-auto`).
- Places on a department tab showing lessons from courses not chosen: 3 before, 0 after.
- `npx eslint` on both components and the six rewritten tests: clean.

## Tests rewritten (each pinned the old shape; each now pins the new, with the reason in its comment)

- `lesson-lists-reach-the-whole-list-on-a-tv.test.jsx` — no inner scrollbar on any of the three lists, on any device.
- `lesson-age-versions-count.test.jsx` — the latest list rides the page.
- `learn-crosslisted-shelf.test.jsx` — the A.I. tab renders no block of other courses' lessons while it still declares them; proven-to-catch on the block's test id.
- `living-lessons-shelf-crosslist.test.jsx` — the Living Lessons tab renders no such block; the declarations still resolve.
- `learn-crosslisted-in-the-picker.test.jsx` — History: dropdown, then its own index, no block, no every-course shelf.
- `learn-course-picker-is-first.test.jsx` — every department tab: no block, no every-course shelf, picker before the index.

## Suites run

Every `learn-*` suite, the Living Lessons order and sections suites, the TV and age-versions suites,
continue-a-lesson, the derived lesson count, lesson downloads, feature presence, the three church-learn suites,
the course overview, leaving-a-lesson, L127, the room, the title, lesson-opens-fast, the DR-1183 suites
(one-sortable-list, reader-learn-follow, read-one-full-lesson, the-highlight, lesson-share-public-route,
course-duration), continue-begins-the-reading, the-place-is-visible, lesson-format, decision-chain and
business-systems-guard.

**Result on the final tree (after the DR-1183 merge and the index gating): 53 files, 549 cases, all passing.**
On the way there the post-merge run showed 10 failures in 4 files, every one the same cause: a suite mounted
Learn and reached for the course index without choosing a course, which DR-1183 plus the index gating no
longer shows. Each was re-pointed to the tap a reader makes (`openCourse`, DR-1183's own helper), the
play-from-the-list suite now counts lesson rows and not month-heading folds, and the every-department walk
in learn-course-picker-is-first got a 120 s budget because each tab is a full re-render of the whole catalog.
Lint: 0 on every changed file.
