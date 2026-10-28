# DR-1264: Every exam attempt is kept, with its moment and its score, and the best score stands — take the exam again, read it again

**Date:** 2026-10-28
**Status:** Accepted
**Tier:** B (a schema change on a learner's own record: one column and one trigger on `learner_lesson_records`, additive, idempotent, proven on PostgreSQL in CI before it reaches the live database through `db-migrate`)
**Type:** build
**Area:** Learn · Class record · learner records
**Sent in by:** Darrell, 2026-10-28, with his Class Record open — "56 lessons read, 5 exams taken, 5 passed, 6 attempts, average 100%": **"How did I take 6 test and no know what happened and when? I also should be able to keep 100% by using that test again or read it again make sense?"** and then **"Taking the test again"**.
**Follows:** DR-0754 (the class record on real rows), DR-1255 / DR-1257 (which version was read, recorded naturally), DR-1261 (the record announced), DR-0060 (RLS is the wall; the screen is the view), DR-0076 (§1 evidence, §3 proven to catch, §4 measure don't claim), USER-ACCOUNTS-AND-HISTORIES-STANDARD (a user's own history is preserved and exportable; each sees only their own)

## Context

He had answered six exams and his record could tell him only the number six. **Measured before building:** `learner_lesson_records` (0250) holds one row per learner per lesson, with `quiz_pct`, `quiz_passed`, `quiz_at` and a `quiz_attempts` **count** the device sends. Which lesson each attempt was on, when, and what it scored were not held anywhere; the row carried whatever the **last** attempt wrote. So the "6 attempts" line was the whole of what the record knew, and a retake that scored lower would have overwritten a pass. Nothing on the screen offered the exam again or the reading again; both lived only inside an open lesson.

His two sentences name two facts: the record must show *what happened and when*, and taking an exam again must be safe for the record.

## What was measured

**The row's semantics, before:** last attempt wins; attempts is a client count; no per-attempt history. **After:** the wall keeps the ledger itself.

- **`quiz_history jsonb`** (0313), one entry per attempt — `{ at, pct, passed, band }` — appended by a BEFORE trigger from the columns the row is written with. A value the client sends for `quiz_history` is **ignored**; a device cannot rewrite or shorten what happened. Smoke: three attempts (60 fail, 100 pass, 40 fail) make three entries in order; a client-sent `'[]'` on the third write leaves the three.
- **`quiz_pct` / `quiz_passed` are the best**, kept by the same trigger — the 40 after the 100 leaves the row at 100 and passed. "Keep 100% by using that test again" is the wall's rule, not the screen's.
- **`quiz_attempts` never shrinks** and never reads below the ledger's length; `quiz_at` keeps the latest attempt's moment; an update that names no new attempt (a mark-read) leaves the ledger, the best and the moment alone.
- **The device keeps the same ledger** (`use-learner-records.js`): each answered exam joins `history`, `pct`/`passed` on the device are the best so far, `last` is this attempt, and the row is written with this attempt's own score so the wall can append it. Rows merging back into a device that never saw them carry their ledger with them.
- **The app's reading** (`learner-records.js`): `cleanQuizHistory` (malformed entries dropped, never guessed), `examAttempts` (every attempt, newest first, each knowing the record's best), `examAttemptsByLesson`. A row written before 0313 yields its one attempt from the columns, marked `fromColumns`, so no count reads lower than the record.
- **The Class record** (`LearnersPanel.jsx`): *Every exam attempt — N attempts on M lessons; the best score stands*, each tested lesson by name with its best, every attempt under it with date, time, its own score and verdict; on **his own** record, two doors per lesson — **Take the exam again** (opens the lesson at its Apply stage, where the exam sits, by moving the lesson's own saved place there) and **Read it again** (the reading from the first sentence, the same door Continue uses). The Governor sees another learner's attempts with no doors into them.

**Measured:** record smoke **PASS** on PostgreSQL 16 after 0250, 0312 and 0313 each applied twice (idempotent); `learner-records` 8 new cases, `use-learner-records` 1, `learners-panel` 6 — 69 across the five record suites green; the Learn suites that mount the record and the strip green; lint clean.

## Impact

- **Nothing a learner did is lost from here on**, and nothing already recorded is lost either: a pre-0313 row still shows its last attempt and says so.
- **The average on the card is the average of best scores per lesson**, which is what "keep 100%" asks for; the per-attempt scores are visible in the list, so the honest history and the motivating headline are both there (DR-1261's purpose).
- **Honest limit:** attempts answered before this ships cannot be reconstructed individually — the wall never held them. The list says "recorded before each attempt was kept; this is the last of N" rather than inventing six rows.
- **Honest limit:** a retake opens the lesson at its Apply stage; the exam block sits inside that stage with the hands-on text above it, so a long Apply stage may need one scroll. If that reads as a second tap, the exam block gets its own anchor. `re-review: 2026-11-11`.
- **`db-migrate` applies 0313 on merge** (the lane's own migration step); CI's learner-record-walls job applies 0250, 0312 and 0313 twice and runs the smoke before any merge.

## Decision

`infra/supabase/migrations-auto/0313-every-exam-attempt-is-kept-and-the-best-score-stands.sql` (column, shape check, trigger, receipt); the smoke's section 10; `learner-records.js` (`cleanQuizHistory`, `quizHistory` on a record, `examAttempts`, `examAttemptsByLesson`, the ledger merged into a device); `learner-records-sync.js` reads `quiz_history`; `use-learner-records.js` keeps best + history on the device and writes each attempt's own score; `LearnersPanel.jsx` `ExamHistory` with `titleOf`, `onRetake`, `onReadAgain`; `ChurchLearn.jsx` `retakeExam`, `readAgain`, `lessonTitleOf`.

## Verification

- `infra/supabase/tests/0250-learner-records-smoke.sql` §10 — PASS locally on PostgreSQL 16; the same file runs in CI's learner-record-walls job after 0313 (wired in `ci.yml`).
- `learner-records.test.js` — the ledger cleaned, never written by the client, every attempt listed newest first with its best, pre-ledger rows from columns, no painted zero, grouped by lesson, one learner only, merged into the device.
- `use-learner-records.test.jsx` — a lower retake does not lower the device's best; both attempts held; the row carries the attempt's own score.
- `learners-panel.test.jsx` — each tested lesson by name with its best and every attempt with its moment and score; proven to catch (the headline reads the best, not the last); the two doors name their lesson and course back; the Governor sees attempts with no doors; a pre-ledger row says so; an untested learner has no list.
- `lint` clean on every changed file.
