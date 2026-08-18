# DR-0308 — The hosted database is the baseline, not the files: the replay dumps the truth and keeps the ledger for the future

- **date:** 2026-08-17
- **status:** decided
- **type:** infrastructure / orchestration
- **declared by:** the standing "drive it now until done" directive (DR-0307), executed through the premise-conflict rule (Layer 0: surface a verifiably-wrong premise before the irreversible step)
- **pairs with:** DR-0307 (the sprint), DR-0306 (the stack + verifier), DR-0076 (measure, don't claim), DR-0084 (self-applying migrations)
- **amends:** DR-0307 decision 1 (replay-by-files), which stands as the ledger DISCIPLINE but not as the baseline SOURCE

## The premise, measured wrong by its own instrument

DR-0307 decision 1 assumed the repo's SQL files, applied in order, reproduce
the hosted schema. The replay's own frontier receipts falsified that in three
consecutive cycles:

1. `0003` ALTERed a `feedback` table no migrations-auto file creates — the
   schema-v* era predates the migration discipline (first frontier).
2. `schema-v2.1` RENAMES the live v1 tables in place (`tenants`→`instances`,
   `tenant_id`→`instance_id` across every table) — the v1 and v2 series are
   one continuous in-place history, not layered creates (second frontier).
3. `schema-v2.2.2` requires a `rentals.links` column **no file in the repo
   ever adds**, and `schema-v2.2.1`'s own header declares a dependency on
   `schema-v2.8` — the hosted apply order was not the version order, and the
   dashboard era left hand-applied state that has no file at all (third
   frontier, the falsifying one).

A file-by-file replay of an unfaithful history converges on divergence, one
cured wall at a time, forever. The hosted DATABASE is the only faithful
record of itself.

## The decisions

1. **The baseline is a `pg_dump` of hosted's `public` schema — schema AND
   data** — taken by the sovereign db container over the pinned Supabase
   prod CA with `sslmode=verify-full` (verification is never disabled),
   applied once through the same `public._sovereign_replay` ledger under the
   marker `hosted-baseline.sql`. Each attempt resets the sovereign `public`
   schema first — destructive only to the scratch build surface, read-only
   against hosted. Restore runs under `session_replication_role = replica`
   so rows referencing `auth.users` load before the account copy; hosted's
   own FK validity plus the full AS-IS account copy (DR-0307 decision 2)
   restores integrity.

2. **Public data rides the baseline.** This closes the gap DR-0307 left
   unnamed: parity counted schema shapes and auth rows, but the family's
   projects, finances, and church records were in no copy leg — a repoint
   would have opened an empty app. The dump carries every row. (A re-dump
   before the final repoint refreshes the snapshot: delete the marker row,
   let the next cycle re-take it.)

3. **The migrations-auto ledger remains the FUTURE discipline.** Every
   migrations-auto file already lives inside the dumped state (hosted ran
   them all), so they pre-ledger at baseline time; files that land after the
   baseline replay normally — filename order, stop-at-first-failure, the
   frontier naming itself (DR-0084 / DR-0307's proven loop, unchanged).

4. **Storage blobs remain the DR-0307 named gap** (re-review 2026-08-22).
   `auth.users` / `auth.identities` still copy via `cutover_sync` AS-IS.

## The proof discipline

The dump/restore prints its byte count and its ledger line in the
installer's LAST lines and in `cutover.status` (the fourth-blindness fix);
`migrate_verify` still measures hosted-vs-sovereign parity independently
before any repoint — with the truth itself as baseline, every non-storage
metric should now match by construction, and a mismatch is a real finding.
