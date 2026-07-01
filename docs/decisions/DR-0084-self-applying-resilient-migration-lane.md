---
id: DR-0084
title: The migration lane is self-applying and resilient — one poison file can never wedge the rest, a ledger is the receipt, and schema state is verifiable from inside the app
date: 2026-07-01
status: accepted
supersedes: []
superseded-by: null
tier: infra (standing requirement; applies to every migration under infra/supabase/migrations-auto/)
entities: [all]
grounds: [VERIFICATION-DOCTRINE, THREE-BRAKES, GOVERN-EXECUTE-ADVISE, DECISION-RECORDS, PERPETUAL-IMPROVEMENT, DATA-AS-EMPOWERMENT]
source: 2026-07-01 — Darrell, standing directive: "Stop waiting for me... I go offline to go to bed and still want work done based on requirements. Applying schema migrations the requirements already call for is NOT something to wait on me for." Root-cause of the wait was found the same day: the db-migrate lane had been RED on every run since 2026-06-29 (verified: runs 28418277549 … 28490570347 all `failure`), dying at `0055-relationship-permissions.sql:139: column "tenancy_id" does not exist` and — under `set -e` + ON_ERROR_STOP — aborting every migration behind it. board_tasks, 0056-fix-instances-policy-recursion, 0057-family-messaging, 0058-video-transcripts all silently never applied.
---

## Context

Database changes already ride a self-applying lane (`.github/workflows/db-migrate.yml`,
established 2026-06-12): merge an idempotent `.sql` under
`infra/supabase/migrations-auto/` to `main` and it applies itself to the cloud DB
via `psql` using the `SUPABASE_DB_URL` secret. Good idea — but the runner was
**brittle in exactly one way that mattered**: it applied every file in a single
loop under `set -e` + `ON_ERROR_STOP=1`. The first file that errored aborted the
whole step, so every migration *sorting after it* never ran and there was no
signal naming what was skipped.

On 2026-06-30 a real collision triggered this. `0055-relationship-permissions.sql`
declared a `maintenance_requests` table (columns `tenancy_id/...`) whose name
already belonged to the pre-existing rentals table `maintenance_requests`
(`schema-v2.2-rentals.sql`, columns `rental_id/renter_id`). `CREATE TABLE IF NOT
EXISTS` no-op'd against the wrong table, then `CREATE INDEX ... (tenancy_id)`
errored, and the lane died there. Because it died there, the migrations behind it
— including `board_tasks` (the Monday.com boards backbone) and the
instances-policy-recursion fix — "waited for a human" indefinitely. That wait is
the precise thing Darrell's standing directive forbids.

This is a VERIFICATION-DOCTRINE case: the lane *looked* like a working
self-applying path, and was, until one file quietly took the rest hostage with no
visible accounting of what didn't land.

## Decision

**1. The collision is fixed forward, not parked.** The relationship-permissions
table is renamed `tenant_maintenance_requests` (its own name for its own data
model — the recorded rentals-model call is *not* to rewrite the rentals table).
Forward, additive, no data dropped, no RLS loosened. The file re-applies cleanly.

**2. The runner is resilient (`scripts/db-migrate-apply.sh`).** Standing rules for
the lane from now on:
   - **Per-file atomicity.** Each migration applies in its OWN
     `--single-transaction`. A mid-file error rolls that file back cleanly — no
     half-applied state (the thing that made this incident confusing to diagnose).
   - **Continue-on-error.** A failing migration is recorded and the run CONTINUES
     to the next file. One poison file can never again block unrelated migrations.
   - **Still visibly RED.** The run exits non-zero if anything failed, emitting a
     `::warning::` naming each failed file. Resilience is not silence — a green
     check must still mean everything applied (DR-0076).
   - **A ledger is the receipt.** `public._schema_migrations` (filename, checksum,
     status, applied_at) records every apply; unchanged files (checksum match) are
     skipped. The ledger is the machine-checkable truth of what is on the DB.

**3. Schema state is verifiable from inside the app.** A SECURITY-DEFINER,
family-gated `schema_migrations_health()` RPC exposes the ledger + the repo-expected
set (pending = repo − applied) to an in-app Admin **DB Health** surface, so a
governor can SEE what is applied / pending / failed without opening a shell or
Studio. (Built as the second half of this work; the ledger table here is its data
source.)

**4. This stays deploy-path, inside the Cage.** The lane runs only on push to
`main` (a human merged a migration) or manual dispatch. It is NOT timer-driven and
does NOT self-arm — it needs no three-brakes review because it is not autonomous
automation; it is a deterministic step triggered by a human action. The in-app
"apply" control is a governed TRIGGER of this same deploy lane, never in-browser
DDL execution and never an embedded database credential.

## Consequences

- The lane unwedges: `tenant_maintenance_requests`, `board_tasks` (0059),
  `0056-fix-instances-policy-recursion`, `0057-family-messaging`,
  `0058-video-transcripts` all apply on the next run.
- Migrations stop "waiting for a human." A future collision fails ONE file, names
  it, and lets the other twenty land — the blast radius of a bad migration is now
  that one migration, not the whole tail.
- `board_tasks` is renumbered `0059` (0058 is already claimed on main by
  `0058-video-transcripts.sql`) — claim-your-number housekeeping, no behavior
  change.

## How this could be wrong / re-review

- **`--single-transaction` assumes every migration is transaction-safe.** Verified
  true for all 71 current files (no `CONCURRENTLY` / `VACUUM` / `ALTER TYPE ... ADD
  VALUE`). If a future migration genuinely needs a non-transactional statement, the
  runner must grow a per-file opt-out marker. re-review: on the first migration
  that needs `CREATE INDEX CONCURRENTLY`.
- **Checksum-skip trusts the ledger.** If the ledger and the real schema drift
  (e.g. someone applies SQL by hand in Studio), a checksum-match could skip a file
  that isn't really applied. Mitigation: migrations are idempotent, so a manual
  `workflow_dispatch` re-run (which the DB Health panel surfaces) re-applies safely.

Pairs with: DR-0076 (verification — the ledger is the evidence; RED still means
RED), the three-brakes rule (this is deliberately outside it — deploy-path, not
autonomous), and the standing "app is the primary artifact" grounding (schema
state made visible *inside* the app).
