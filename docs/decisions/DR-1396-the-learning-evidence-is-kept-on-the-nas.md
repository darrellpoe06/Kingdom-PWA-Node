# DR-1396: The learning evidence is kept on the NAS: the reading on evidence, and how each exam attempt was taken, stored by the wall and readable as plain SQL

**Date:** 2026-11-10
**Status:** Accepted (completes DR-1386)
**Tier:** B (schema; additive, idempotent, rides the migration lane)
**Type:** schema + record
**Area:** learner_lesson_records (infra/supabase/migrations-auto/0316), lib/learner-records*.js, lib/use-learner-records.js, lib/test-integrity.js
**Sent in by:** Darrell, 2026-11-10
**Pairs with:** DR-1386, DR-0754 (the class record), DR-1264 (0313, the exam ledger), DR-0317 (the sovereign replay), DR-0374 (the hosted project is the mirror)

## Context

DR-1386 kept how an exam attempt was taken on the device only. It parked carrying it to the record behind a re-review date of 2026-11-24. Darrell's replies:

- "Storage on the nas?!!!!!!! What are we waiting for?!!!!!!"
- "We need processes built on the spot for the critical systems workflows.. nas first..."
- "Python and sql.... we can build anything then model from there."

## What was measured

- The live database is the NAS Supabase (`infra/nas-supabase/REPOINT-ARMED`). The migration lane replays every `migrations-auto` file onto it (DR-0317), so nothing stood between the build and the NAS.
- **Correction:** the two `agent_inbox` rows DR-1386 names (`474cfe54`, `ced55234`) were written through the hosted Supabase tool. That is the mirror, not the live NAS database (DR-0374). The schema row is now done by this record; the brain-measurement row stands as research.

## Impact

**What this obligates.**

- The record now tells a reading from a mark, and carries how each attempt was taken (after, partly or before the reading; seconds a question; quick or not; first try; reading and reader paces). The data is on the NAS and readable by any later Python model as plain SQL.
- The wall keeps the ledger: a device can add only the known keys, and it cannot rewrite an attempt.
- A deploy that lands before the migration loses nothing; the write and the read fall back to the old columns.

## Decision

- **Migration `0316`** adds two columns, cleaned by `learner_attempt_taken`:
  - `read_evidence_at`: a ratchet. The first evidenced moment stands; it is never cleared or moved later, and a time in the future is refused.
  - `quiz_taken`: the latest attempt's how-taken. The wall copies it into that attempt's ledger entry as `taken`.
- **View `learner_exam_attempts`** (security_invoker): one row per attempt with plain columns.
- **The app sends both:** a finished reading carries `readEvidenceAt`, and an exam attempt carries `taken`.
- **The app reads both:** the read falls back when the columns are missing (42703), and the write retries without the new columns (PGRST204).
- **The KPIs** prefer the attempt's own account of the reading, then the evidenced reading, then the mark.

## Verification

**Database.** The real migrations, from the curriculum bootstrap through 0316, were applied twice on a scratch Postgres 16, on a fresh database and again. The smoke test's new section 11 passes, and it checks:
- `taken` lands cleaned and unknown keys are dropped;
- the row keeps the latest attempt, and a mark-read leaves it alone;
- the reading ratchet holds, and a future time is refused;
- a non-object is never stored;
- the view shows both attempts, and another learner sees none.

It was shown to fail with the ratchet trigger dropped ("a later moment replaced the first evidenced reading"). CI's learner-record job now applies 0316 twice before the smoke.

**App.**
- `the-evidence-reaches-the-record.test.js`: 7 tests.
- Neighbour gates green: `learner-records-sync`, `test-integrity`, `use-learner-records`, `a-read-is-filed-with-its-version`, `learners-panel` (64 tests).
- All 100 gates that read `migrations-auto` pass (1,749 tests).
