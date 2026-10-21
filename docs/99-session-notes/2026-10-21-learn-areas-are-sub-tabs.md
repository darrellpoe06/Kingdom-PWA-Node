# 2026-10-21 — Church → Learn: the areas are sub-tabs, and only the lessons scroll

**Decision record:** DR-1186
**Source:** Darrell's word of 2026-10-21, sent while DR-1182 was being verified: "Visual needs to look nice and
we need to be using subtabs not long scrolling except on the lessons we have an option and it defaults to
scroll... All other locations we expect users to be using need to be able to be seen."

## What changed

One chip row under the course picker (`SectionTabs variant="sub"`, `idBase="learn-area"`): **Lessons** (default,
the one that scrolls; "Courses" while nothing is chosen), **Continue** (with its live count), **Latest**, **Find**,
**Record**, **Downloads**. Navigation only: every block kept its place
and its order in `ChurchLearn.jsx` and is gated by the area it belongs to.

| area | what it shows |
|---|---|
| Lessons | the course header (title, catalog line, plain words, Share), the landmark bar, the Word-first lead, the by-title index, the cards; or the one list of courses while nothing is chosen (DR-1183) |
| Continue | the Pick-up-where-you-left-off offer (every course on Courses; this course on a department tab); the Continue chip stays on the bar on every area |
| Latest | the latest-lessons list (the sort's "Latest lessons" option opens this area) |
| Find | the finder, with the every-course shelf under it on the Courses tab |
| Record | the class record |
| Downloads | Download this course, and on the Courses tab the catalog line with Download every lesson |

Three mechanics that the first run taught:

1. **A lesson requested from Latest or Find must land in Lessons at once.** The course view is what reports a
   lesson open, and it is mounted only in Lessons, so waiting for its report deadlocked (the sort suite's
   latest-row tap rendered zero cards). An effect on the request itself (`resumeLessonId` / `presentRequest`)
   switches the area; the focus report keeps doing so as a second belt.
2. **The Eternal Algorithms study is not an area of its own.** A first cut gave it a Study tab and opened the
   department on it; `course-duration` then failed, because it pins the course's progress bar on every
   department tab and the bar lives with the course in Lessons. The study stays above the course in Lessons on
   that tab, where the old Church route lands.
3. **The landmark bar's "All lessons" opens Find and focuses the box once it mounts** (a pending-focus ref
   consumed by an effect), instead of scrolling to a box that is no longer on the page.

## What the checks caught

- **Four courses rendered "Week 1 · … date TBD" while registered as self-paced lessons.** `little-learners`,
  `mathematics`, `rent-to-own-business` and `development` carry `unitCap: 'Lesson'` in `learn-catalog.js` but
  their META declared no `unit`, so `unitLabels` fell back to weeks. `learn-catalog-render`'s pin
  `/(Lesson)\s*1/` had passed for months because the every-course shelf printed "Lesson 1" for them elsewhere on
  the page; the moment the shelf moved into its area the pin read the course's own cards and failed. Each META
  now declares the lesson unit, with the reason beside it.
- **The presence walk could not see the lesson shelf.** The registered "Lesson shelf (filter by part of the
  Word)" went missing because the walk chose the "latest" sort (which now opens the Latest area) and then a
  course, never returning to Lessons. The walk now opens every area tab, with and without a course chosen, and
  the six area tabs are registered controls.
- **The first full run: 35 failures in 13 files**, every one a suite reaching for a block now behind its area.
  Each got the tap a reader makes (`openArea`), with its reason beside it; the order pins inside Lessons were
  untouched and still pass. The index-is-next suite now pins the stronger thing: in Lessons nothing at all sits
  between the course and its lessons, and Find is one tap away with the finder under the picker.

## Suites run

The full Learn-surface set (every `learn-*`, the Living Lessons order and sections suites, the TV and age-versions
suites, continue-a-lesson, the derived lesson count, lesson downloads, feature presence, the three church-learn
suites, the overview, leaving-a-lesson, L127, the room, the title, lesson-opens-fast, the DR-1183 suites, the
reading and place suites, decision-chain, business-systems-guard, course-band-coverage, and the four courses'
own suites). Final result: recorded in the line below once the run finished.
