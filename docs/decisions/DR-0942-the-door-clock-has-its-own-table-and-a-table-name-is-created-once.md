# DR-0942 — The door's clock has its own table, and a table name is created by one migration only

**Date:** 2026-10-10
**Status:** accepted
**Area:** migrations 0262–0269 (`door_events`), `scripts/table-name-reuse-guard.mjs`, the CI database chains
**Principle:** DR-0076 (proven to catch), DR-0107 (a merge is done only when it is deployed AND migrated)

## Context

#2096 merged as c3856c23b. The Cloudflare deploy succeeded (run 38091850495). db-migrate failed (run 38091870801):

> replay: applied 1 this run, ledger 267/272, frontier: 0262-rent-is-reported-the-way-it-is-paid-and-every-change-keeps-its-time.sql FAILED: … NOTICE: relation "record_events" already exists, skipping ERROR: column "subject" does not exist
> replay: 9 migration file(s) are NOT applied; the first is 0262-…

The app that needs 0262–0270 was live while the live database stopped at 0261.

## What was measured

- **The collision.** 0262 named the door's event clock `public.record_events`. **0052 (systems of record) created a different `record_events` long before**: the generic append-only history behind Inventory, Books and transactions, which `family-books-probe.yml` reads. On the live database, 0262's `CREATE TABLE IF NOT EXISTS` was a silent no-op. Its next statement (an index on `subject`) failed.
- **What did land.** The replay runs each file without one wrapping transaction. So 0262's statements before the failure (lines 48–136: `rent_payee`, its policies and function, the new `rent_records` columns) committed. They are idempotent and are re-applied as written. No trigger writing to the old table was created; the failure came before any.
- **Why CI was green.** Neither CI chain (the door-work leg, `scripts/e2e/build-door-db.sh`) applied 0052, so `record_events` did not exist there and 0262 created it.
- **Reproduced.** With 0052 added to the e2e chain, the ORIGINAL 0262 (from c3856c23b) fails with the live error, `column "subject" does not exist`.

## Impact

Until the fix migrates, the live app reads columns and tables that 0262–0270 create, so those reads fail: door money, stays and bookings, cameras by request, system pictures, the area map and signing. The history log behind Inventory and Books was never touched.

## Decision

1. **The door's clock is `public.door_events`.** This covers its indexes, policy, trigger functions (`door_events_from_rent`, `door_events_from_work`), subject check and every insert in 0262–0269, their smokes, the Properties app (`cloud.js` reads `door_events`), the flow registry and the door journeys. The old `record_events` is untouched.
2. **Both CI chains apply 0052**, so the real `record_events` exists where the door work is tested.
3. **`table-name-reuse-guard`.** No two migrations may CREATE the same table name, because IF NOT EXISTS turns a reuse into a silent no-op on any database that ran the first. One pre-existing reuse is listed as known with its reason: `lesson_versions` (0240 and 0243, different shapes). Its review is tracked separately.

## Verification

- **The guard.** It finds no unreviewed reuse in the repository. **Proven to catch:** the incident pair (0052 and the old 0262 both creating `record_events`) is flagged (`table-name-reuse-guard.test.js`, 4 tests).
- **The door-work leg**, locally, on a fresh PostgreSQL with 0052 in the chain: all ten smokes pass, from DOOR WORK to AREA MAP.
- **The door journeys**, locally, on a database built by `build-door-db.sh` (now with 0052): 9 of 9 steps pass.
- **The live database.** Its next db-migrate re-runs 0262 in full (idempotent) and continues through 0270. That run is the proof this record waits on; it is watched after merge.
