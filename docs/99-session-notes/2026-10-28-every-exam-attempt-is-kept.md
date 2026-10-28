# 2026-10-28 — Every exam attempt is kept, and the best score stands

**Record:** [DR-1264](../decisions/DR-1264-every-exam-attempt-is-kept-and-the-best-score-stands.md)
**Migration:** `infra/supabase/migrations-auto/0313-every-exam-attempt-is-kept-and-the-best-score-stands.sql`

## What he said

With his Class Record open, reading "5 exams taken · 5 passed · 6 attempts · average 100%": *"How did I take 6 test and no know what happened and when? I also should be able to keep 100% by using that test again or read it again make sense?"* Then: *"Taking the test again."*

## What was measured first

One row per learner per lesson. `quiz_attempts` was a count the device sent; `quiz_pct`, `quiz_passed` and `quiz_at` were whatever the last attempt wrote. The six attempts had no lesson, no moment and no score of their own anywhere, and a retake that scored lower would have replaced the pass. Neither the exam nor the reading could be reached from the record.

## What his word became

- **The wall keeps the ledger** (0313): `quiz_history`, one entry per attempt (`at`, `pct`, `passed`, `band`), appended by the table's own trigger from the columns the row is written with; a value the client sends for it is ignored. `quiz_pct` and `quiz_passed` are the best; attempts never shrink; a mark-read leaves the exam alone.
- **The device keeps the same ledger** and shows the best; each attempt is written to the row with its own score.
- **The Class record lists every attempt**, newest lesson first, each lesson with its best and under it every attempt with date, time, score and verdict. His own record has **Take the exam again** (the lesson opens at its Apply stage, where the exam is) and **Read it again** (from the first sentence, read aloud). The Governor sees another learner's attempts without the doors.

## Proven

| proof | where |
| --- | --- |
| three attempts (60 fail, 100 pass, 40 fail) make three ledger entries in order; the row reads 100, passed; attempts 3; a client-sent `'[]'` is ignored; a read leaves it all alone | `0250-learner-records-smoke.sql` §10, PASS on PostgreSQL 16 after 0250/0312/0313 each applied twice |
| a lower retake does not lower the device; both attempts held; the row carries the attempt's own score | `use-learner-records.test.jsx` |
| the ledger cleaned, never written by the client, listed newest first with its best, pre-ledger rows from columns, no painted zero | `learner-records.test.js` (8) |
| the panel lists each tested lesson with its best and every attempt; the headline reads the best, not the last; the two doors call back with lesson and course; the Governor gets no doors | `learners-panel.test.jsx` (6) |

## Honest limits

- The six attempts he already made cannot be reconstructed one by one; the wall never held them. His row shows its last attempt and says it was recorded before each attempt was kept.
- A retake lands on the Apply stage; the exam sits inside it under the hands-on text. If that needs a scroll, the exam block gets its own anchor. `re-review: 2026-11-11`.
