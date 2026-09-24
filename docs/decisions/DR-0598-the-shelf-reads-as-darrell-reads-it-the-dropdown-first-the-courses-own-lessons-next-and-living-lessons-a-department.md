# DR-0598 — The shelf reads as Darrell reads it: the dropdown at the top of every department tab, the course’s own lessons before the gathered ones, and Living Lessons a department of its own

- **Status:** accepted
- **Tier:** A (one Learn surface’s order and one catalog row’s category; no schema, no transport, no money)
- **Type:** fix
- **Date:** 2026-09-24
- **Scope:** `app/src/components/ChurchLearn.jsx` (the picker renders on every department tab with a course; the "also taught across the curriculum" block moves below the course’s own pick-a-lesson index); `app/src/lib/learn-catalog.js` (Living Lessons’ category becomes its own department); `app/src/__tests__/learn-crosslisted-in-the-picker.test.jsx` (+2 pins)
- **Principles:** DO-NOT-RE-ASK (DR-0111 — he said it twice), REALITY-TRACE (DR-0061 — the running app as he sees it), PERPETUAL-IMPROVEMENT (DR-0075), VERIFICATION-DOCTRINE (DR-0076)
- **Grounds:** Darrell 2026-09-24, three screenshots from his Fold: *"Already said this but the drop down needs to be at the top of the tab for choices!"* (History reading "1 course · 8 lessons · 17 more lessons taught across the curriculum" with no dropdown at all); *"This should be at the top!"* (the course’s own "pick a lesson by title" list rendered BELOW the gathered rows); *"I was thinking Living Lessons could be a department... why not?"* and *"It has more content than most other departments."*

## Context

Three things on the Learn shelf were not in the order he reads it. The course picker rendered only when a department had two places to go (its own courses plus the courses serving it), so a one-course department with nothing serving it had no dropdown, and its gathered lessons were the first thing on the tab. The gathered-lessons block was rendered inside the picker’s row, so on every department that gathers lessons it sat between the dropdown and the course’s own lessons. And Living Lessons sat as one row under The Word & The Way although it carries more lessons than any department.

## What was measured

| what | measured |
| --- | --- |
| the picker rule before | `(visibleCourses.length + gatheredCourses.length) > 1`; History on his screen had 1 own course and 0 serving courses → no control |
| the order before | picker row → gathered block (inside the row) → pick-a-lesson index; his screenshot of History shows the Prophetic Voices rows above "Historical Truth · pick a lesson by title · 8" |
| Living Lessons | 189 lessons; the whole school is 712 lessons in 49 courses; no other department holds 189 |
| after | the dropdown renders whenever a department has a course (a one-course tab reads "This department’s course · 1 · pick it to open"); the gathered block renders after the by-title index; "Living Lessons" is a department (code LL, derived from its label as every code is), first on the shelf because its row is first in the registry; The Word & The Way keeps its other seven courses |
| gates | learn-crosslisted-in-the-picker 13 pins (two new: a two-course mount with History alone shows the dropdown; on History the dropdown precedes the index and the index precedes the gathered block), learn-course-picker-is-first, learn-lesson-index-is-next, learn-organize, learn-department-registry, learn-is-a-school, learn-crosslist, living-lessons-sections, course-band-coverage, history-course — 174 tests green in one run; eslint 0 warnings; legibility scan unchanged |

## Impact

A reader on any department tab meets the dropdown first, then the course’s own lessons, then what the rest of the school teaches on that subject. Living Lessons is found where its size puts it, as a department, and its eight sections (DR-0596) still shelve its 189 lessons inside. Course counts do not move (a department is derived from a category; a pointer never inflates a count, DR-0516). His tablet still showed the pre-#1756 build ("47 courses · 695 lessons") at 01:0xZ; the served build is fresh (DR-0595) and the app takes it on its next open.

## Decision

1. The picker renders on every department tab that has a course; the prompt names the one course when there is only one.
2. The course’s own pick-a-lesson index precedes the gathered "also taught across the curriculum" block, pinned in the picker suite.
3. Living Lessons is a department of its own, derived from its category like every other; the sections inside it stay.

## Verification

- The suites named above, 174/174; the two new pins fail on the previous condition and the previous order.
- Caught by CI on the PR (run 35946373759, `learn-access-tiers`): a department the access-tier list did not know defaulted to *vocational*, so Living Lessons — the Word itself — read as sellable for the length of one CI run. `FORMATION_DEPARTMENTS` now names 'Living Lessons' beside 'The Word & The Way' (`app/src/lib/learn-access-tiers.js`); the by-name pin that caught it stands.
- After merge: DR-0104 live review on his Fold — Church → Learn: the dropdown at the top of History, the course’s lessons above the gathered rows, and "Living Lessons" as the first department tab.
- re-review: 2026-10-07 — whether any other block has crept between the dropdown and the course’s own lessons on any department (the order test guards History; a sweep across departments is the next pin).
