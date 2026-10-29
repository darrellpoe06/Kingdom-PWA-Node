# DR-1285 — A backup on request: the family database is backed up when a steward asks, through the queue that needs no tailnet key

**Date:** 2026-10-29
**Status:** Accepted
**Tier:** B (one NAS-side job pair on the existing ops queue; no change to merge, CI or deploy; no schema change; the backup never writes to the live database)
**Area:** `infra/nas-sme-pipeline/ops-runner.py` (jobs `db-backup`, `db-backup-status`); `app/src/lib/ops-commands.js` (two buttons); `app/src/__tests__/a-backup-on-request.test.js`
**Pairs with:** DR-1113 (the sovereign database's own nightly backup), DR-0088 (the app-first operations queue), DR-1269 (the second-road pattern), DR-1283 / DR-1284 (the refused tailnet key), DR-0076 (verification doctrine), DR-1280 (the Money release that asked for the backup)

## Context

The Money redesign (DR-1280) was approved for release on the condition that a recoverable backup of the family's financial data is taken first. The family's data lives in the sovereign database on the NAS (REPOINT-ARMED; DR-0317), not in the hosted project the Supabase connector reads (DR-1270 measured they are different databases).

The NAS already backs that database up every night (DR-1113): `db_backup.sh` on the services-sync clock, a whole-database `pg_dump` verified by `pg_restore --list`, a weekly restore drill, `status.json` for `nas-health` to judge. But on 2026-10-28 the runner's `TS_AUTHKEY` began answering `invalid key` (DR-1283), and every road from a GitHub runner to the NAS closed with it: `nas-health`, `sovereign-read`, `live-sql.sh`. So nothing outside the box could confirm last night's backup, and nothing could ask for a new one.

Asked to use the roads already built rather than hand the step to a person (Darrell, 2026-10-29: *"There is another fix for the database we have used tonight... You should know and use solutions"*; *"Bypassing on not needing to use cloudflare"*; *"Can it be triggered by a work requests instead of a timer?"*), the road is the one DR-0088 built for exactly this: the app inserts a row into `ops_commands` through its own `/sb` door, the NAS runner drains it on its own clock, and the verdict comes back on the row. It needs neither the runner's tailnet key nor Cloudflare. It only lacked the job.

## What was measured

- **The last verdict anything outside the NAS could read:** `nas-health` run 40594648175 (2026-10-27 22:26 UTC) — `{"ok":true,"at":"2026-10-27T07:00:39Z","file":"poetech-db-20261027T070039Z.dump","bytes":284794025,"toc_entries":6925,"drill":"skipped","kept":8}`. Every `nas-health` run since (40640824694, 40694571619, 40781951958, 40794363283) failed at the tailnet join with `invalid key`.
- **The queue is drained on the NAS clock, not a timer outside it:** `ops-runner` is a registered services-sync rider (`infra/nas-loops/services.json`, `--once` per 15-minute cycle, 3 commands per cycle, single-instance lock, time-decayed pause). Its whitelist held two jobs, both for transcripts.
- **Who may ask:** `ops_commands` insert is owner/admin only (migration 0068, `user_role_in_instance`); no anon policy. The buttons render in Church → Harvest Ledger for staff.
- **Why the job detaches:** services-sync kills its whole tree at the 600-second cycle ceiling; a 285 MB dump inside a shared cycle can outlast what is left. `install.sh` already launches `db_backup.sh` with `nohup … &` for this reason.

## Impact

- A steward gets a verified backup of the whole family database in one tap, at any hour, and reads its verdict on the same row — without a shell, without the tailnet key, without Cloudflare.
- A release that must be preceded by a backup no longer waits on a person at a keyboard.
- The nightly backup is unchanged and still runs on its own; an on-request success touches the same `.last-ok` stamp, so the night after does not take a second dump hours later.
- Latency is the runner's clock: up to 15 minutes from the tap to the start. That is a property of the outbound-only design (P18: nothing outside can reach the LAN), not a defect; see Decision 4.

## Decision

1. **`db-backup`** starts `db_backup.sh` detached (`BACKUP_DRILL=always`, so every on-request backup is also restored into a scratch database and counted against the live one; its own `timeout 3600` wall), then waits up to 240 s for a NEW `status.json` (a different `at` than before the request). A new verdict returns on the row: `done` when `ok:true`, `error` when not. A dump still running after 240 s returns `done` with `ok: null` and says to ask `db-backup-status` — never a claimed verdict.
2. **`db-backup-status`** returns the newest verdict and whether a run holds the lock.
3. **A run already in progress is refused, not doubled** (the `.lock` directory `db_backup.sh` itself takes). Christina asked that the backup taken before the Money release be shown restorable, so the on-request run always drills; the nightly keeps its weekly drill.
4. **Triggered by a request, drained on the NAS clock.** An instant wake (a Postgres `LISTEN/NOTIFY` listener on the NAS's own database) is possible because the database is local to the runner, but it is a long-lived process — the class that died for eight weeks once already (ops-queue-health's own history) and that the three-brakes rule governs. Not built here; re-review: 2026-11-12, with the measured latency of real requests as the input.

## Verification

- `a-backup-on-request.test.js` — 6 cases running the REAL `ops-runner.py` job functions against a stand-in `db_backup.sh`: both jobs offered and whitelisted; a request returns the new verdict and stamps `.last-ok`; a failed backup returns `error` with its reason and no stamp; a held lock is refused; a dump that outlasts the wait says "still running"; the status job reads the verdict.
- **Proven to catch:** with the verdict mapping changed to always return `done`, the failed-backup case goes red (1 failed of 6); restored, 6 of 6.
- `ops-commands.test.js` (9) still guards that every job the app offers exists in the runner's whitelist; `the-harvest-ledger-says-when-the-road-is-dark.test.jsx` (3) green.
- **Live proof owed, and named:** the first real request's row (`status`, `log`, `result.verdict`) after this merge reaches the NAS (it pulls `main` every 15 minutes).
