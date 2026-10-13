# DR-0305 — The audit log refreshes by delta; the front door was 402 while the database was healthy

- **Status:** accepted
- **Tier:** A (defect fix + guard in the sync core; ships through the normal lane — merged in PR #1239)
- **Scope:** every table wired through `createTableSync`; the four apps' shared Supabase backend; the sign-in surface's error copy
- **Date:** 2026-08-14
- **Principles:** VERIFICATION-DOCTRINE, COST-DISCIPLINE, DATA-DRIVEN-LIVING, SURFACE-PREMISE, DECISION-RECORDS
- **Supersedes:** []

## Directive

Darrell, 2026-08-14, with five screenshots of every sign-in path failing:

> "No matter how I try I can't reach or login to my admin account for PoeTech App.... and other users as well..."

and, pointing at the error text itself:

> "notices the words on the error..."

## What was actually true (measured, not recalled)

The project was **hard-restricted by Supabase**, verbatim from the `/auth/v1/authorize` response Darrell surfaced:

> `{"message":"Service for this project is restricted due to the following violations: exceed_egress_quota. The project owner must upgrade their plan or remove spend caps to restore service."}`

Measured against the live project:

| Fact | Value |
| --- | --- |
| Organization plan | **free** (5 GB monthly egress cap) |
| Project status | `ACTIVE_HEALTHY` |
| Database | **healthy** — PG 17.6, 23 users, answers in milliseconds over the direct pooler |
| Last successful sign-in by ANY user | **2026-08-11 03:04:53 UTC** |
| Sign-ins in the following 48 h | **0** |
| Outage length at diagnosis | **~85.5 hours** |

The database was never the fault. The **API gateway** is what 402s, which is why
`list_projects` reads `ACTIVE_HEALTHY` while nobody can sign in — and why the
earlier incident note recording "~20 hours" understated it by more than 3×.
`last_sign_in_at` is per-user, so a maximum of Aug 11 means *not one* of the 23
users got in, on any of the four apps, for three and a half days.

## The cause

`record_events` is the generic audit log — one row per change to ANY tracked
record. Measured in production: **20,129 rows, 15 MB of payload, largest single
row 1.18 MB** of `before`/`after` JSON.

`createTableSync`'s `subscribe()` called `fetchAll()` on **every realtime
change**, debounced only 400 ms. So ten inventory edits meant ten full 15 MB
re-downloads, on every connected device. 5 GB of free-tier egress is roughly
**340** of those refetches.

**The sharpest part of this record.** The pagination loop inside `fetchAll` was
added as a *correctness* fix — a plain `.select()` silently truncates at 1,000
rows, which had quietly dropped about half of Christina's transaction ledger on
device. That fix turned a capped 1,000-row pull into a guaranteed 20,129-row
one. **It made the egress bill strictly worse, and because nothing measured
egress, it stayed invisible until service was cut off.** A correctness fix with
an unmeasured cost dimension is exactly the class DR-0076 §4 exists for, and it
had no gate.

## Decision

1. **`createTableSync` gains an opt-in `appendOnly` mode.** The first load still
   reads the whole table; every later refresh fetches only rows newer than the
   newest one already held, paged and ordered identically. `record_events` opts
   in.

2. **Opt-in per table, never a default.** It is sound *there specifically*
   because `mergeRemoteRecordEvents` is a **union**: handing the consumer only
   the new rows folds them in without losing held history. Append-only is what
   makes that true — the DB grants SELECT + INSERT only (migration 0052), so a
   row cannot change after it is written and an incremental read cannot miss an
   edit. A consumer that *replaces* its list would lose history.

3. **Cheaper is never allowed to mean less correct.** A failed delta returns
   null and falls back to the FULL read; a **partial** full read does not
   advance the watermark (which would otherwise leave a permanent silent gap);
   `gt` not `gte`; the delta pages identically so a burst over 1,000 rows is not
   truncated; every read stays tenant-scoped.

4. **Restoring service is the owner's, and only the owner's.** Supabase names
   the remedy — upgrade the plan or remove spend caps. The fix in this record
   prevents recurrence; it **cannot** restore a quota already spent. Recommended
   and surfaced: upgrade to Pro. This is the DR-0111 carve-out (real money, the
   account holder's card), and it is *not* the spend DR-0237 §5 guards against —
   that governs new discretionary vendors, while this is the backbone of four
   live apps.

## Proven-to-catch (DR-0076 §3)

9 tests, and verified by deliberate regression: reverting the delta so `refresh`
calls `fetchAll()` again **fails** the assertion the outage turns on; restoring
it passes. The test drives the real path — it captures the realtime handler
`subscribe()` registers and fires a change through it, past the 400 ms debounce.

**The first draft of that test was theater and is recorded here as such:** it
called a `fetchDeltaForTest` hook that did not exist, hit an early `return`, and
reported green while asserting nothing. It was caught and replaced before merge.
A green test proving nothing is the same failure class as the incident itself.

## Consequences and what is NOT closed

- **`transactions` is the second burner and is NOT fixed.** Measured: 2,953 rows
  / 3.4 MB / **17,374 lifetime writes**. It takes updates and deletes, so
  `appendOnly` is unsound there; a correct fix needs `updated_at` watermarking
  plus tombstones. Deliberately not attempted in the same pass — that table is
  the books ledger, and it already carries the scar that produced the pagination
  above. **re-review: 2026-08-21** (DR-0075: a stated why plus a date).
- **The error copy is a half-truth and stays open.** *"This is on our end —
  nothing you typed was wrong, and your account is fine"* is accurate. *"Please
  try again in a little while"* is a **false promise** for a quota or billing
  stop, which never self-heals — it tells every user to wait for something that
  will not happen, and hides a state only the owner can clear. **re-review:
  2026-08-21.**
- **Nothing watched egress at all.** `site-health` gained a USABLE backend check
  the same day (DR-0303), which catches the *symptom*. The *cost* dimension —
  egress trending toward a cap — still has no witness.
- Two repo-root guards in `ci.yml` ran without `working-directory` while that job
  defaults to `app`, dying `MODULE_NOT_FOUND`; the table-a11y gate therefore
  never executed on the commit that introduced it. Fixed in the same PR.

## Links

PR #1239. `app/src/lib/table-sync.js`, `app/src/lib/record-events-sync.js`,
`app/src/__tests__/table-sync-append-only-delta.test.js`. DR-0303 (the backend
witness), DR-0076 (verification), DR-0107 (a down site outranks velocity),
DR-0237 §5 (vendor spend), DR-0060 (RLS remains the data gate).
