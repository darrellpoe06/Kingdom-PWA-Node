---
id: DR-0622
title: The lessons list in number order by default — each row carries the lesson's own number and the day it was added, the order is the reader's pick and the device remembers it, and the .md export and print run in number order too
status: accepted
date: 2026-09-24
tier: A
type: fix
declared_by: Darrell
scope:
  - app/src/lib/lesson-order.js (new — the lesson's own number, the orders, month labels, the remembered pick)
  - app/src/lib/living-lessons-dates.js (new — the day each Living Lesson was added, with the commit that proves it)
  - app/src/lib/living-lessons-class.js (the schedule and the export carry `added`)
  - app/src/lib/church-classes.js (the .md export prints a numbered self-paced course in number order under each lesson's own number)
  - app/src/components/ChurchLearn.jsx (the Order select beside Show; rows show "L192 · Sep 24, 2026 · The Law"; the lesson card, the Lord's Matrix, the print view and the resume line print the lesson's own number; the course sort reads "Sort courses")
  - app/src/__tests__/living-lessons-order.test.jsx (new, 17 checks), app/src/__tests__/living-lessons-sections.test.jsx (the divisions view is now one pick away)
principles: [VERIFICATION-DOCTRINE (DR-0076), HOLD-THE-HAND (DR-0621), DO-NOT-RE-ASK (DR-0111), SPEC-CONFORMANCE (DR-0219), PERPETUAL-IMPROVEMENT (DR-0075)]
grounds:
  - DR-0603 — the long list is the default and a division is a lens; this record changes the list's default ORDER and keeps the divisions view whole, one pick away
  - DR-0596 — the Word's divisions helper, unchanged
source: 2026-09-24 — Darrell, with a screenshot of Church → Learn → Living Lessons
supersedes_in_part: DR-0603 Decision item 1 (the division heading rows are the default) and item 3 (nothing is persisted, for the order only)
---

## Context

Darrell, 2026-09-24, with a screenshot of Church → Learn → Living Lessons ("pick a lesson by title · 191", the "Show: All lessons · 191" select, and the long list grouped under the Word's divisions):

> "There's no way to see the list in chronological order?!!! Fix that!!!"
> "MD too"
> "They are numbered!!!!!!!!"

and a few minutes later:

> "There are dates in the lessons maybe we should capitalize on that somehow..."

The list opened grouped by the Word's divisions (DR-0603), so the lesson numbers ran L21, L27, L30 … under The Law, then jumped. There was no way to read the course first to last.

**"MD too"** is read as the **Download .md** button on the course's "Paper & print" panel. No course, department or course code abbreviates to MD (every department and course code was listed from the live catalog: LL, RE, WW, SH, AI, SM, KLS, PM, BUS, HIS, MAT, DEV). The .md export printed the lessons in authored order under their position, so it had the same fault as the list.

## What was measured

- **The number on the row was the position, not the lesson's number.** `buildLivingLessonsSchedule` sets `week: i + 1`, and the row printed `Lesson {week}`. Living Lessons has no L79, and the authored array holds L61 before L60 and L94 before L90–L93. Measured: **115 of 191** Living Lessons showed a number that is not their own. For example, L192 read "Lesson 191". The .md export and the print view carried the same numbers.
- **Where the dates are.** No lesson object carries a date field. The course's own lesson log (the comment on `LIVING_LESSONS_META.weeks`) names a day for **37** entries, from L153 onward only. The full git history of `living-lessons-class.js` (unshallowed, 237 commits from 2026-06-24) gives, for every lesson, the commit that first carried its id: **191 of 191 dated**. The commit day (UTC) agrees with the log's day on **34 of 37**. The 3 that differ (L153, L164, L189) are each off by one day, and for those the log's day is kept. (Central time was also tried; it agreed on only 32 of 37 and broke the order once, so it was not used.)
- **Number order is date order.** With those days, in lesson-number order the days never go backwards: L1 = 2026-06-24 … L192 = 2026-09-24. A separate "by date" order would list exactly what "by number" lists, so it is not offered as a separate choice. It is the same control (DR-0621: similar workflows combine).
- **Which courses are numbered.** A course counts as numbered when every lesson's id carries a number and no two lessons share one. 39 of the 43 catalog courses qualify. Healthy Living (`hl-w3-…`), World Issues (`wi-…`) and Prophetic Voices (`pv-…`) carry no number. Historical Research's ids all read `hr1-…` ("Level 1"). Those four keep their authored order and their week count, because inventing a number would be painting.
- **Layout, measured with Playwright on the rendered index** (component rendered in the real tree, dumped, styled with the app's own Tailwind build, Chromium 1194):
  - At 360 px and at 768 px, the page never scrolls sideways (`scrollWidth` = viewport).
  - Selects are 44 px tall. At 360 px they stack full-width (302 px) so the option text reads whole; at 768 px they sit side by side.
  - Every ▶ Play button stays 58×44 px and inside the card.
  - The row's number line is 11 px mono and holds one line, except where a long division name ("Wisdom & Poetry") meets a three-digit number at 360 px. There it wraps whole at the " · ", never mid-word.

## Impact

Darrell opens Living Lessons and sees the course first to last: L1 at the top, and every row reads like "L192 · Sep 24, 2026 · The Law" over its title. Month labels ("September 2026 · 79") head each run. They are labels, never folds. An **Order** select sits beside **Show**, with three choices:

- By number, first to last (the default)
- Newest first
- By the Word's divisions, which is today's grouped view exactly as DR-0603 pinned it, with the lessons inside each division now in number order

The pick is kept per course on the device. Every other numbered course gets the same Order control (first to last, and newest first, which reads "Last to first" where no day is recorded). The .md download and the printout list the lessons in number order under their own numbers, with "Added Sep 24, 2026" under each Living Lesson. The lesson card heading, the Lord's Matrix links and the "Pick up where you left off" line now print the lesson's own number too.

## Decision

1. **A numbered course's lesson list opens in number order, first to last.** DR-0603 made the flat list the default. That still stands. What changes is its default order. Nothing in DR-0596 or DR-0603 required the divisions view to be the default: DR-0603 kept the division names because Darrell liked them saying what each lesson belongs with. So in number order each row names its division in small type, and the full divisions view is one pick away.
2. **The number a row shows is the lesson's own, read from its id**, never its position (`lib/lesson-order.js`, `lessonNumber`). A course without its own numbers keeps its week count.
3. **The order is the reader's pick and the device remembers it per course.** It is stored in `localStorage` under `poetech.learn.lessonOrder.v1`, and every read and write is guarded, so a blocked store just opens in number order. The Show (division shelf) pick still belongs to the visit, as DR-0603 set it.
4. **The course-level "Sort" select is a different control and stays separate.** It orders the COURSES in the picker (Course order / A to Z / Most lessons / Shortest first); it cannot order a course's lessons. Its label now reads **"Sort courses"** so the two are not mistaken for each other.
5. **A new Living Lesson joins with its day (DR-0621).** `living-lessons-order.test.jsx` fails when a lesson has no line in `living-lessons-dates.js`, when that file names a lesson that does not exist, or when a day would run backwards against the numbers.
6. **The .md export and the print view run in number order** for every numbered self-paced course. A dated cohort course keeps its dated weeks.

## Verification

- `living-lessons-order.test.jsx` has 17 checks, 3 of them on the real Learn tree (createRoot + act):
  - By number puts L1 first and the numbers only rise.
  - Newest first puts L192 first.
  - Rows render "L1 · Jun 24, 2026 · …" and "L192 · Sep 24, 2026".
  - No division heading rows appear in number order.
  - The pick survives an unmount and a fresh mount.
  - A short numbered course (Sovereign A.I.) gets the Order control without the divisions view.
  - The .md prints Lesson 1 first, Lesson 192 last, ascending, with "*Added Sep 24, 2026*".
  - Storage that throws never breaks the list.
- **Proven-to-catch:** the list in the Word's-divisions order (the old default) fails the by-number assertion. And `lessonNumber` on L192 returns 192 where the old position read 191.
- `living-lessons-sections.test.jsx` has 11 checks, all green. They now assert that number order carries no division headings, then pick "By the Word's divisions" and hold every DR-0603 pin.
- Guards: `consistency-guard` OK, `ui-standards-guard` 0 regressions, `legibility --check` PASS, and `legibility:health` unchanged (248/261).
- Screenshots of the rendered index at 360 and 768 px (number, newest and divisions orders, plus Sovereign A.I.) were taken with the fonts falling back, because the web fonts are not loaded offline.
- After merge: a DR-0104 live review on his Fold. Church → Learn → Living Lessons should open on L1, with the Order select beside Show. Pick Newest first and check that L192 is on top; leave and return and check that Newest first is kept. Download .md and check that it starts at Lesson 1.

## Limits, stated

1. **"MD" is an inference.** It is read as the .md export, because nothing else in Learn is called MD. If he meant something else, the order control and the helper are the fix to reuse. `re-review: 2026-10-01`.
2. **The day is the day the lesson entered the app**, not necessarily the day Darrell first spoke it. For L2–L12 (all 2026-07-04) that is the day the series was brought in as a batch. Where the course's own log names a day, the log's day is kept.
3. **The lesson screen's "191 / 191" counter and Prev/Next still follow the authored order.** That counter is a position ("where you are of how many"), not a lesson number. Prev/Next belongs to the continue-a-lesson work in flight on `claude/continue-a-lesson-way-better`, so this record does not touch it. `re-review: 2026-10-01`: check whether Prev/Next should follow number order too.
4. **Legacy Provisions was authored with its lesson 7 before its lesson 6.** By number, the .md and the default list now put 6 before 7. The ids say 6 and 7. If the authored order was the teaching, the fix is to renumber the ids, not to hide the numbers.
