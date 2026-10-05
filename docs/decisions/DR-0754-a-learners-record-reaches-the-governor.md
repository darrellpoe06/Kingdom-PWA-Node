# DR-0754 — A learner's record reaches the Governor

**Date:** 2026-10-05
**Status:** Accepted
**Declared by:** Darrell

> "Also... my son is reading the lessons testing the app and seeing how it flows for him... we want to keep analytics on what he's completion rates are and competency scores based on the exams in the lessons.. make sense?" (Darrell, 2026-10-05.)

## Context

Darrell's son is reading the lessons on his own phone. Darrell asked for two things by name: **completion rates** and **competency scores based on the exams in the lessons.** The ask is a father's, not an administrator's, so the answer has to be a real record of what the boy actually read and actually answered, kept where his father can look at it.

The curriculum already graded exams honestly. `app/src/lib/learn-framework.js` grades a quiz against its own answers (`gradeQuiz`, pass line `QUIZ_PASS_RATIO` = 0.7) and `courseAssessment` folds progress and quiz results into a per-course summary. What was missing was never the arithmetic. It was that none of it left the device.

Word-first: *"Give an account of thy stewardship"* (Luke 16:2). A record kept is a stewardship shown. The Resources Yahweh supplies — Knowledge, Understanding, Wisdom — are measured by what they actually build (cf. Proverbs 24:3-4), and a lesson read is only visible as a lesson read if something honest wrote it down.

## What was measured

Traced end-to-end on 2026-10-05 against `origin/main` at `d1c75c6b`, before any change:

| Question | What the code actually did |
| --- | --- |
| Where does a learner's completion live? | `data.classProgress` in the shell — a map of module id to the moment it was marked read (`poe-financial-mvp-v28.jsx`, `toggleClassModule`). |
| Where does an exam score live? | `data.classQuiz` — module id to `{passed, pct, at}` (`recordClassQuiz`). |
| Is either in a synced table? | **No.** Neither appears in any `lib/*-sync.js` rail, and neither is in the `supabase_realtime` publication list added by migration 0245. Both are device-local. |
| So what crosses to another device? | **Nothing.** A son reading on his phone and then on a tablet starts over, and his father on a third device sees none of it. |
| What could the Governor see? | One aggregate: `aggregateEngagementByAge` over feedback rows — an engagement **band by age group**. No learner, no completion rate, no score. |
| Was an attempt count kept? | **No.** `recordClassQuiz` overwrote the module's record, so a second attempt erased the first and nothing counted how many times an exam was answered. |

So the honest answer to Darrell's question, before this change, was that the app had no completion rate and no competency score for his son, on any screen, by design of what was never wired.

## Impact

- **A father can answer his own question.** Lessons read, exams taken, exams passed, average and best score, competency band, and completion against each course's real lesson count — per learner, on real rows.
- **The record follows the learner, not the phone.** He can read on a phone and a tablet and it is one record.
- **Attempts are counted** for the first time, so "passed on the third try" is distinguishable from "passed first time."
- **A learner keeps his own record.** He reads and writes his own rows and nobody else's. The Governor watches and cannot rewrite what a learner did, which is what makes the record worth reading.
- **Nothing is painted.** An untested learner reads "Not yet tested", never 0%. A course whose lesson count this screen does not know shows a dash and says why, rather than inventing a percentage (P15).

## Decision

1. **One table, one row per learner per lesson.** `public.learner_lesson_records` (`infra/supabase/migrations-auto/0250-a-learners-record-reaches-the-governor.sql`): `PRIMARY KEY (user_id, lesson_id)`, `user_id` defaulting to `auth.uid()`, carrying `course_key`, `learner_label`, `age_band`, `completed_at`, `quiz_pct`, `quiz_passed`, `quiz_attempts`, `quiz_at`, `updated_at`. Check constraints refuse a score outside 0-100 at the wall.
2. **The walls, not the screen, decide who sees what** (DR-0060). A learner selects, inserts, updates and deletes only rows where `user_id = auth.uid()`. The Governor — `public.is_lesson_governor()`, his own declared email list, not a role and not an instance — reads **every** learner's rows and writes **none**: there is deliberately no governor clause on insert, update or delete. `anon` reads nothing.
3. **The arithmetic is pure and tested.** `app/src/lib/learner-records.js` maps rows to records and back, folds rows into the device's maps, and rolls up per learner and per course. Competency bands take their pass line from `QUIZ_PASS_RATIO`, so one number governs both the gate a learner feels and the band his father reads.
4. **The device copy stays the fast path.** `learner-records-sync.js` upserts on `(user_id, lesson_id)` as a lesson is marked read and as an exam is answered; on sign-in the rows are fetched and merged, and the device's own copy **wins** on a module it already knows, because that is what the learner is looking at. Demo mode writes nothing, ever.
5. **The surface lives where its scope lives** (P68). The class record is a whole-class view, so it is a fold at Learn level beside the courses, not inside one open lesson. Its summary line is live: it says what the record holds before anyone opens it, and says plainly when it holds nothing.
6. **The wiring lives outside the frozen shell.** `app/src/lib/use-learner-records.js` owns the device maps, the cloud record, the hydrate-on-sign-in and the live subscription; `poe-financial-mvp-v28.jsx` makes one call. The shell is bug-fixes only (DR-0078), and `monolith-budget-guard` caught the first attempt, which had added 32 lines of feature to it. After the extraction the shell is **5298 lines, 14 below its old frozen budget**, and the ratchet is re-frozen there — it trends down, never up.
7. **An RLS smoke belongs in the isolation matrix.** The `rls-isolation-matrix-guard` caught the smoke as an ORPHAN — a file full of assertions that no leg ran. A `learner-records` leg in `.github/workflows/rls-isolation.yml` runs it alongside the required `ci.yml` job, matching 0248's precedent.
8. **The client never names the owner.** The upsert payload carries no `user_id`; the column defaults to `auth.uid()` and the write wall refuses any other account.

## Verification

Evidence attached, nothing claimed on the agent's word (DR-0076):

- **The walls, on a real PostgreSQL 16, locally before CI.** Migration 0250 applied **twice** (idempotent) against the CI bootstrap, then `infra/supabase/tests/0250-learner-records-smoke.sql` printed `LEARNER RECORD SMOKE: PASS`. It proves: a learner keeps and reads his own record; the row lands under his own account even when the payload names another; a second reading corrects the row instead of duplicating it; an out-of-range score is refused; one learner cannot read, correct or delete another's; the Governor reads every learner's and can write none; `anon` reads nothing.
- **Proven to catch — three walls opened, three failures.** Opening the read policy to any signed-in person failed with `LEAK: another learner read 2 rows (expected only their own)`. Letting the Governor update a learner's row failed with `LEAK: the Governor rewrote a learner's record`. Letting an insert name any account failed with `LEAK: a learner filed a record under another account`. Restoring the policies returned the smoke to PASS.
- **The gate rides every push.** A `learner-records` job in `.github/workflows/ci.yml` runs that same apply-twice-then-smoke on a `postgres:16` service, and is a required leg of `app — lint + vitest`.
- **The arithmetic.** `app/src/__tests__/learner-records.test.js`, 18 tests passing, including the proven-to-catch pair: an untested learner must not band as a failing one, and a lesson with no exam must not drag the average to 60 instead of 90.
- **The sync.** `app/src/__tests__/learner-records-sync.test.js`, 13 tests passing against an injected client: the upsert key, the absent `user_id`, demo writing nothing, signed-out writing nothing, a refused write reported rather than thrown, and the first read still arriving on a client with no realtime.
- **The surface, with its copy.** `app/src/__tests__/learners-panel.test.jsx`, 11 tests passing: each never-blank state is rendered and its words read (DR-0691), the untested learner shows no `0%`, the measured completion reads `3 of 12` and `25%`, the unknown count says why there is a dash, and a plain learner handed another learner's row still sees only his own.
- **The control is registered and really renders.** `learn-class-record` added to `app/src/lib/feature-registry.json`; `feature-presence.test.jsx` passes 18 tests, rendering the real Learn surface and finding it (DR-0726).
- **The flow graph places the new table.** `scripts/interconnect-guard.mjs`: 13/13 live loops wired, 0 broken; 140 nodes, 358 connections, 0 findings. Before registering the two surfaces it failed with `table learner_lesson_records ... has no declared place in the flow graph`.
- **The hook, in a real render.** `app/src/__tests__/use-learner-records.test.jsx`, 9 tests passing: the course key reaches the record on both paths, un-marking files a null completion, the subscription fills in what the device never saw while the device copy wins on what it knows, the subscription is handed back on unmount, and demo and signed-out write nothing. Proven to catch: `attempts` is `2` after a second answer, where the shipped behavior kept no count at all.
- **Two guards caught real defects in the first attempt, and both are now green.** `monolith-budget-guard` failed with `MONOLITH GREW past the freeze ... 5344 > 5312 (+32)`, which is why the wiring was extracted; `rls-isolation-matrix-guard` failed with `ORPHAN SMOKE — infra/supabase/tests/0250-learner-records-smoke.sql exists and NO leg runs it, so it proves nothing`, which is why the matrix leg exists. Neither was a false alarm, and neither was worked around.
- **Lint clean** on every file touched (`eslint src`, 0 problems, `--max-warnings 0`).
- **The lane change is proven by a real deploy** (P26, DR-0107): this PR touches `ci.yml`, so the merge is watched through to a `Deploy (Cloudflare Pages)` run on a `main` SHA that contains it.

## Re-review

**re-review: 2026-11-05.** Two things to look at with real rows in hand: whether a per-lesson breakdown (which exam he struggled on, not only the average) is what Darrell wants next, and whether completion should count a lesson's exam as part of "complete" the way `courseAssessment` already does for graduation.
