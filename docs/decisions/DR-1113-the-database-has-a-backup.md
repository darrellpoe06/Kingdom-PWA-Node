# DR-1113: The sovereign database has a backup — one verified dump a night, a restore drill a week, and a witness that judges it

**Date:** 2026-10-19
**Status:** accepted
**Tier:** B (a new NAS rider that reads the live database every night; additive, read-only toward the database, self-deploying on merge)
**Type:** infrastructure
**Area:**
- `infra/nas-db-backup/db_backup.sh` and `install.sh` (new)
- `infra/nas-loops/services.json` (the `db-backup` rider, right after `supabase`)
- `.github/workflows/nas-health.yml` (reads and judges the verdict; gains a concurrency lock)
- `scripts/system-flow-registry.mjs` (the rider's place in the flow graph)
- `app/src/__tests__/the-database-has-a-backup.test.js` (new)

**Amends:** nothing. Carries out `infra/nas-supabase/README.md` lines 105–106, written when the stack was stood up (DR-0306) and never acted on: *"Backups. Hosted Supabase did this invisibly. On the NAS it is ours, and it is not optional for the family's data."* Grounds: DR-0076 (a backup never restored is a claim), DR-0247 (agreed work starts itself through the lane), DR-1111 (the system ledger that found it).
**Declared by:** found by the full-system trace Darrell asked for on 2026-10-19 (*"the ability to reverse any undermining processes because every system is interdependent"*). That trace, `docs/99-session-notes/2026-10-19-the-system-inside-and-out.md` §12, names this the single largest risk to reversibility. Every other layer can be rebuilt from git; the family's data cannot.

---

## Context

The reversal trace (DR-1111) found:
- no backup job for the sovereign database;
- no point-in-time restore;
- Hyper Backup and Btrfs snapshots only as setup instructions (`docs/01-architecture/SETUP-TODAY.md`);
- the one restic job covering n8n's folder alone.

Migrations are forward-only, and the `BASELINE-REFRESH` path drops the public schema and restores from a hosted dump that has been stale since 2026-08-19. A bad migration, a failed disk, or a mistaken refresh therefore had nothing to restore from.

## Decision

**What one run does, stopping at the first failure:**
1. Take a single-flight lock.
2. Refuse to start without room for twice the last dump.
3. `pg_dump -Fc` the **whole** database: every schema, `auth` included. It runs inside `supabase-db`, so the client version always matches the server.
4. Verify the archive with `pg_restore --list`. It must list `auth.users` and a public table.
5. Write its sha256 beside it, then rename it into place.
6. **Only then** retire archives beyond `KEEP` (14).
7. Weekly, restore into a scratch database, compare `auth.users` and the public table count with the live database, and drop the scratch database.
8. Write `status.json`.

**When it runs.** It rides the already-armed services-sync clock (the transcript-trickle pattern). That costs milliseconds unless the local hour is 2–4 and the last success is over 20 hours old. It then launches detached under its own one-hour wall clock, because run.mjs kills the whole services-sync tree at 600 seconds.

**How it is witnessed.** nas-health reads `status.json` and writes `::error::` when the last backup failed or is over 36 hours old.

**Not covered, said plainly.** Uploaded files in Storage live on the storage volume, not in the database. The archive holds their rows, not their bytes. Hyper Backup of `/volume1/docker/supabase` is their road, and it is carried as the next step on the same queue.

## Verification

- `the-database-has-a-backup.test.js`, 9 cases, which run the **real** `db_backup.sh` against a fake `docker`:
  - a good night: one archive, a checksum that `sha256sum -c` accepts, a drill passed with exact counts, and no lock or partial file left behind;
  - retention keeps the newest `KEEP`, always including the new archive;
  - a failed dump deletes nothing and leaves no partial file;
  - an archive without `auth.users` is refused and nothing is retired;
  - a drill that comes back short is a failed backup, but the archive is kept;
  - a held lock means busy;
  - the rider is a no-op outside the window and after a fresh success;
  - the manifest places it right after `supabase`.
- **Proven to catch, twice:**
  - with the `auth.users` check removed, one case fails;
  - with the partial-file cleanup removed, the failed-dump case fails.
  Both mutations were restored byte-identical.
- `interconnect-guard`: 190 nodes, 477 connections, 74 workflows and 31 NAS riders all placed, 0 findings. Before the rider was given a place in the graph, the guard refused it.
- **Live proof** is the first night after merge: nas-health's next run shows `database backup ok: poetech-db-…dump`, with its drill line.
- `re-review: 2026-10-21`, after two nights:
  - read nas-health's backup line;
  - confirm one restore drill passed with matching counts;
  - start Hyper Backup for the Storage volume.
