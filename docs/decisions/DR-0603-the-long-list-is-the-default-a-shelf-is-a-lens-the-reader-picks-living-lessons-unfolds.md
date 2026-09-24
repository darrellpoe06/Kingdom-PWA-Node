# DR-0603 — The long list is the default; a shelf is a lens the reader picks: Living Lessons unfolds, and the Word’s divisions become a select above the same flat list every course renders

- **Status:** accepted
- **Tier:** A (one Learn surface; no schema, no transport, no money; lesson ids, URLs, progress and pins untouched)
- **Type:** fix (supersedes the render half of DR-0596; the helper stands)
- **Date:** 2026-09-24
- **Scope:** `app/src/components/ChurchLearn.jsx` (the by-title index renders ONE flat list for every course; a course of 30+ lessons adds a `Show` select — the whole course first, then the Word’s eight divisions with counts — that narrows the same list; the collapsed `<details>` sections are removed; the pick belongs to the course and is forgotten on leaving it); `app/src/__tests__/living-lessons-sections.test.jsx` (the real-tree pins rewritten: 11 checks, incl. proven-to-catch that no `<details>` returns)
- **Principles:** DO-NOT-RE-ASK (DR-0111 — he stated the preference; pick the default and proceed), REALITY-TRACE (DR-0061 — the running app as he met it), PERPETUAL-IMPROVEMENT (DR-0075 — the path not taken carries a re-review date), VERIFICATION-DOCTRINE (DR-0076 §3 proven-to-catch, §6 the real tree), DR-0219 (SHOULD → ARE → GAPS → CLOSE)
- **Grounds:** Darrell 2026-09-24, with a screenshot of Living Lessons on his Fold folded into collapsed sections: *"I would rather have the long list than this! Or give actual lessons inside of multiple courses inside of the department like we already do and did!!!!!!!!!!!!!!!!! This is just totally different feel and process!!!!!! Why?!!!!!!!!"* — and, minutes later, the clarification that shaped the final form: *"I do like the the lessons sections say what they should be associated with... just felt locked out of the flow and intuitive system."*

## Context — the question

His question was "Why?", with the screenshot. The answer is two records shipped from his own words in the last day; the fix is the feel he named.

## Why it looked different — the answer to his question

Two records shipped in the last day from his own words, and together they changed the feel of one course:

1. **DR-0596** (2026-09-23, #1757) read *"Living Lessons may need their own Sections..."* as sections INSIDE the course and folded the 189 lessons into eight collapsed `<details>` shelves by the Word’s divisions, one open at a time. DR-0596 stated the other reading as an assumption to re-review: that he might have meant a department of its own.
2. **DR-0598** (2026-09-24, #1759) then made Living Lessons its own department from *"I was thinking Living Lessons could be a department... why not?"*, and put a dropdown on every department tab from *"the drop down needs to be at the top of the tab for choices!"* — which on a one-course department reads a one-item prompt.

So on his screen the newest department opened to a dropdown with one course in it, above a list where seven of eight shelves were closed. Every other course opens to a flat list of its lessons. That is the "totally different feel and process": the folding, not the data.

## SHOULD / ARE / GAPS / CLOSE (DR-0219)

- **SHOULD:** every course lists its lessons the same way, and a long course gets help finding a lesson without changing the process (his words 2026-09-24; DR-0596’s own stated purpose — "the reader who wants ‘the ones in Proverbs’ has nothing to hold").
- **ARE (before):** `ChurchLearn.jsx` rendered `<details>` sections at or above `SECTION_MIN_LESSONS` and the flat `<ol>` below it; `living-lessons-sections.test.jsx` pinned exactly one section open.
- **GAPS:** the fold changed the process for one course; a reader met 22 rows and seven closed shelves instead of the course.
- **CLOSE:** this record.

## Decision

1. **The flat list is the default for every course, whatever its length.** No lesson is folded away on arrival. **The division names stay, as inline heading rows inside the one scrolling list** (his clarification): each division's name and count stands above its lessons in canonical order, a label and never a fold, so every lesson shows what it belongs with while the flow stays one list.
2. **A course of 30+ lessons adds a `Show` select above the list** (`#learn-lesson-shelf`): the first option is the whole course with its count; the others are the Word’s divisions with their counts, from `lib/lesson-sections.js` (real data — each lesson’s own first anchor, DR-0596’s helper unchanged). Picking a division narrows the SAME flat list to that shelf; picking the first option restores the whole course.
3. **The pick belongs to the course.** Leaving Living Lessons and returning shows the whole course again. Nothing is persisted.
4. **DR-0598 stands as written** — the dropdown on every department tab, the course’s own lessons before the gathered ones, Living Lessons a department. This record does not reopen it.
5. **The other road he named — "actual lessons inside of multiple courses inside of the department" — is recorded, not taken today.** Splitting Living Lessons into eight registered courses moves 189 lesson ids under new course keys, which touches saved places, share links, progress rows, the cross-listing registry (DR-0516) and the per-lesson verse pins. It is a Tier B change with a migration, not a surface fix. The shelf select gives the reader the same eight doors today without moving a single id. **re-review: 2026-10-07** — with the question put to him plainly: does he want eight true courses under the Living Lessons department (with the migration carried), or does the lens suffice?

## What was measured

| what | measured |
| --- | --- |
| the real tree, Living Lessons picked | 189 lesson rows in one `ol` under 8 inline division heading rows (The Law first, keys in canonical order, the 22 Law lessons directly beneath their heading); zero `<details>`; the `Show` select renders inside the by-title index above the list; its first option reads `All lessons · 189`; the eight division options’ counts sum to 189 |
| picking `The Law` | 22 rows, still one flat `ol`, no heading rows (a narrowed shelf needs none), `data-shelf="law"`; picking `All` restores 189 under their headings |
| leaving and returning | after opening Business Research (no select there) and returning, 189 rows again |
| a short course | Business Research: flat list, 9 rows, no select |
| gates | `living-lessons-sections` 11/11 (heading rows, their order and their holding pinned), `learn-crosslisted-in-the-picker` 13/13, `learn-course-picker-is-first`, `learn-lesson-index-is-next` — 40 in one run; eslint 0 on the component and the test |

## Limits, stated

1. **The eight-true-courses road is not taken today** (Decision item 5): a surface-only split keeps every lesson id, saved place, share link and progress row where it is. `re-review: 2026-10-07` with the question put to him plainly.
2. **The pick is per session and per course, not remembered.** A reader who wants "The Letters" every time will pick it every time. If that friction is real, the remembered-course store in `learn-organize.js` is where a remembered shelf would live. `re-review: 2026-10-07`.
3. **Only Living Lessons crosses the 30-lesson threshold today** (the next-longest courses are 18, 17, 14), so the select has one live course to prove itself on; the pin covers the threshold both ways.

## Verification

- The suites above; the proven-to-catch pin fails the moment a `<details>` returns to the by-title index.
- After merge: DR-0104 live review on his Fold — Church → Learn → Living Lessons: the long list on arrival, the `Show` select above it, one division picked and the list narrowed, the whole course back.
