---
id: DR-0687
title: Every lesson in every course carries the day it was created, derived from git, so Latest lessons lists all of them
status: accepted
date: 2026-09-30
tier: A
type: surface
declared_by: Darrell
scope:
  - scripts/lesson-dates-core.mjs (new: the rule, the git scanner, the judge that keeps a day true)
  - scripts/derive-lesson-dates.mjs (new: the generator and its --check mode; `npm run lesson-dates`, `npm run lesson-dates:check`)
  - app/src/lib/lesson-dates.json (new, generated: one day and its commit per lesson, 549 lessons in 49 courses)
  - app/src/lib/lesson-dates.js (new: lessonCreatedDay, datedSchedule, withLessonDates, undatedReason)
  - app/src/lib/learn-catalog.js, app/src/lib/eternal-algorithms-course.js (schedules carry `added`)
  - app/src/components/ChurchLearn.jsx (every mounted course gets its days; "oldest first" is claimed only where the days follow the numbers)
  - app/src/lib/lesson-order.js (datesFollowNumbers; ordersFor takes numberIsOldest)
  - app/src/lib/learn-organize.js (latestLessons names the undated lessons; latestCountLine)
  - app/src/components/LatestLessons.jsx (the header states the true count)
  - app/package.json (two scripts), .github/workflows/ci.yml (guards job: full history + the check)
  - app/src/__tests__/lesson-dates.test.js (new), app/src/__tests__/learn-sort-every-option.test.jsx (measurements updated)
principles: [VERIFICATION-DOCTRINE (DR-0076), DERIVED-NEVER-PAINTED (DR-0121), REALITY-TRACE (DR-0061), HOLD-THE-HAND (DR-0621)]
grounds:
  - DR-0686 — the top sort and Latest lessons; its "Left out" named this work with re-review 2026-10-13, now closed
  - DR-0626 — living-lessons-dates.js, the method (the commit day each lesson first landed)
---

## Context — his words (verbatim)

Darrell, 2026-09-30, on Church → Learn → "Latest lessons, every course". The header read *"One course records the day each lesson was added · 549 lessons in other courses have no recorded day, so they are not listed"*:

> "Add all the days the lessons were created so we can have all of them in each course so they can get done."

## What was measured

- **The real data.** No lesson object carries a creation day. Only Living Lessons had one, in a hand-kept table (`living-lessons-dates.js`, 199 lines, each the commit day the lesson first landed). The cohort courses' `date` fields are *scheduled class days* computed from a cohort start, so they are not creation days and are not read. The mounted catalog holds **748 lessons in 50 courses**. 199 are in Living Lessons and **549 are in the other 49**, which is the "549" on his screen.
- **The source of the day.** The repository has its full history on this machine (not shallow, 2,248 commits from 2026-04-27). The day a lesson was created is the author date (UTC) of the **earliest commit that added the line defining it**: `id: '<lesson id>'`, or `"id": "…"` in a JSON-shaped block, anywhere under `app/src` except tests. Every first definition was checked against the lesson's current home file: all 549 were first defined in the file that holds them today.
- **Three shapes needed care.**
  - **Who He Is** defines each lesson as a key of `WHO_HE_IS_LESSON_SPECS`, so that form is read for that file.
  - **The Eternal Algorithms** (149 lessons) build each lesson from a pattern: `ea-${alg.id}` over `godhead-study.js`.
  - **Healthy Living** (12 lessons) builds each lesson from a witness: `hl-${source.id}` over `third-witness.js`.

  A derived lesson did not exist until its record AND its builder existed, so its day is the later of the two commits. The Eternal Algorithms builder landed 2026-07-08 (`dcb2d376`) and the Healthy Living builder 2026-08-10 (`3c72a1f8`).
- **Result, per course (dated / lessons, by the course's own title).** Every course is fully dated; **0 lessons could not be traced**:
  - Living Lessons from the Word 199/199 (its own table)
  - The Epistles 45/45, The Gospels 38/38, Wisdom & Psalms 22/22, Torah & History 19/19, The Prophets 17/17, Revelation 8/8 (each "Deep Processing")
  - Sovereign A.I.: Why We Build Local 31/31 · Thinking It Through: World Issues & Discernment 19/19 · Made in Time 18/18 · Who He Is 14/14 · PoeTech Data Systems & Infrastructure 14/14 · Healthy Living 12/12 · Project Management: Count the Cost 12/12
  - The Infrastructure 10/10 · Software Project Management 10/10 · The Broadcast 9/9 · Business Research, Level 1 9/9
  - 8/8 each: Learning A.I. The Way · Mathematics · Rent to Own · Development · Running the Board · Buying · Leasing and Tenant Selection · Maintenance, Repairs and the Trades · Partnerships · Financing · Taxes and Records · Banking · Stocks · Bonds · The World Market · How Investing Actually Works · Appraisal · Evictions Handled Righteously · Inspections · Insurance and Risk · Management Is Stewardship · Why Owned Property Is a Principle · Historical Truth · Historical Research, Level 1: The 1619 Project · Kingdom Economics
  - The Functions of the House 7/7 · Secure the Legacy 7/7 · AI Legal Blueprint 6/6 · Little Learners 6/6 · Prophetic Voices 6/6 · Getting the Word Out 5/5 · Handed Forward 5/5

  In all: **748 of 748** dated, from 2026-06-15 to 2026-09-29 (65 in June, 242 in July, 94 in August, 347 in September).
- **Living Lessons disagreements (reported, not overwritten).** On five lessons git's first-commit day on main is one day LATER than the recorded day:
  - **L164:** recorded 2026-09-15, git 2026-09-16 (`b91cab53`)
  - **L189:** recorded 2026-09-19, git 2026-09-20 (`26662721`)
  - **L193:** recorded 2026-09-24, git 2026-09-25 (`dda90fac`)
  - **L194:** recorded 2026-09-24, git 2026-09-25 (`e5bffdc2`)
  - **L195:** recorded 2026-09-24, git 2026-09-25 (`a4b657e4`)

  L164 and L189 were already noted in the table as the course log's own day. L193 to L195 were recorded "added with the lesson" on the day they were written, and they reached main in a squash merge after midnight UTC. The recorded days are kept. The script prints these five on every run.
- **The number order still holds.** In all 40 numbered courses the days never go backwards in number order. So "By number, oldest first" is true wherever it is shown.

## Impact

Before this change, Latest lessons listed 199 of 748 lessons and "Oldest first" was not offered, because only one course had days. Now:

- **Latest lessons** lists every lesson in the program by the day it was created, with the header *"All 748 lessons across 50 courses, each on the day it was first added to the app."*
- **Oldest first** is offered at the top sort, because 50 courses now carry days.
- **Recently added** ranks every course by its newest lesson.
- **Inside every course**, Newest first sorts by real days and shows month labels.

A lesson that lands without a day cannot pass the gate. The header also counts any lesson that is ever left out and says why ("too new to have its day recorded yet" or "whose first day the record cannot trace"). It is never dated by guess.

## Decision

1. **Days are generated, never typed.** `scripts/derive-lesson-dates.mjs` reads the mounted catalog, which is the same builders Learn renders. It scans `git log -p` over `app/src` once (about 15 s) and writes `app/src/lib/lesson-dates.json`, one `[day, commit]` per lesson. It records a reason for any lesson it cannot trace. The rule and its exceptions live in `scripts/lesson-dates-core.mjs`.
2. **Living Lessons stays authoritative.** Its hand-kept days (DR-0626) are never written into the generated file or replaced by it. `withLessonDates` never overwrites a day a lesson already carries.
3. **The days are attached where the courses are built.** The catalog descriptors and the Eternal Algorithms builder attach them, and ChurchLearn attaches them to every mounted course (the cohort and A.I. courses included). `added` is the one field every Learn order already reads.
4. **Drift is a red build.** The CI guards job checks out full history and runs `npm run lesson-dates:check`. The check re-derives every day and fails when a committed day or commit is not git's first, or when the file is not what the script writes. The fix it prints is: *"cd app && npm run lesson-dates, then commit app/src/lib/lesson-dates.json. Never edit its days by hand."*
5. **A new lesson joins at birth (DR-0621).** `lesson-dates.test.js` fails when a mounted lesson has neither a day nor a recorded reason, and names the same command. A lesson dated on its branch keeps its branch day after a squash merge. The judge accepts it when the day is on or before its first day on main and within 14 days, so main does not go red at midnight. The file holds only days and reasons. Counts and the Living Lessons report are printed by the script, not committed, so two lesson branches do not collide on a totals line.
6. **"Oldest first" is claimed only where it is true.** `datesFollowNumbers` gates the label and the month labels on number order. Today it is true for all 40 numbered courses.

## Verification

- **Real history.** `npm run lesson-dates:check` passes: "748 of 748 lessons dated, 0 undated, 5 Living Lessons day(s) differ from git". A proven-to-catch run replaced Banking L1's day with 2026-01-01, and the check failed with *"banking/bank1-a-deposit-is-not-storage: recorded 2026-01-01, but commit 653cbb9a is dated 2026-09-19"*. The real file was then restored.
- **`lesson-dates.test.js` (16 tests).**
  - It pins the generated file on the real catalog: 748 lessons, every one dated, no stale rows, real ISO days with 8-hex commits, and known first commits (Who He Is `2a308544`, Eternal Algorithms `dcb2d376`, Healthy Living `3c72a1f8`).
  - Proven-to-catch: a planted new lesson with no day fails, in a generated course and in Living Lessons.
  - The judge rejects a planted wrong day, a wrong commit, a day after git's day, and a day past the squash grace.
  - The scanner prefers the earliest definition, ignores test files, reads the keyed form, and takes the later of record and builder.
  - `datesFollowNumbers` fails when a later-numbered lesson is made older.
  - The header line states the true count and the reasons.
- **`learn-sort-every-option.test.jsx` (14 tests).** It now measures every course as dated. Oldest first is offered, and the proof it is withheld with only one dated course is kept. Latest lessons lists all 748 mounted lessons across 50 courses in a real render, and a tap still opens the lesson in its home course.
- **Other suites and gates.** `living-lessons-order.test.jsx`, the Learn suites that import the catalog, `decision-chain.test.js`, the ledger guards and lint are all green (see the PR).
