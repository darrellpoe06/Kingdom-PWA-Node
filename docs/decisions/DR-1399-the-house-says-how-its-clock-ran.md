# DR-1399: The house says how its clock ran — the heartbeat carries the last cycle by service name, the app shows it, and the loops witness reads it over the public road when the key is dead

**Date:** 2026-11-10
**Status:** Accepted (applies DR-1360 §2 to loops-health; extends DR-1360 §3)
**Tier:** B (a witness lane's second road and one read-only, anon-callable function; no data written beyond the heartbeat's own row, no money)
**Type:** ways + verification + surface
**Area:** `infra/nas-loops/heartbeat.py`, `infra/supabase/migrations-auto/0318-the-house-says-how-its-clock-ran.sql`, `scripts/served-heartbeat-receipt.py`, `.github/workflows/loops-health.yml`, `app/src/lib/nas-heartbeat.js`, OpsBoard
**Sent in by:** Darrell, 2026-11-10 ("Why can't we do it another way. Same outcome. Don't need anything because we designed it."), carried forward after DR-1398 with his "Okay."
**Pairs with:** DR-1398 (the same pattern for migrations, proven live that day), DR-1360 (the NAS initiates every road; the house's own heartbeat), DR-1269 (the NAS clock), DR-1283 / DR-1284 (a dead key is never silent; a join is not a witness), DR-0076 §3 and §8

## Context

DR-1398 turned the migration proof outward and it worked on its first live run: the runner's tailnet key was refused, the NAS applied migration 0317 on its own clock at 12:15:24, and the lane read the live ledger over poetech.us a minute later, green with nothing missing. His word covers every road the house was designed to own, so the next one is the widest: `loops-health.yml`, the daily witness of the twelve loops on the services-sync clock, which could only ask the NAS over SSH on that same dead key.

## What was measured

- 65 workflows still join the tailnet (counted on main `0cdcfcac`); `loops-health.yml` is the one that witnesses the clock itself.
- The NAS already writes one heartbeat row each cycle into `agent_inbox` (DR-1360), with the time, the host and the service count but not how the cycle went. The outcome lived only in `infra/nas-loops/events/events.jsonl` on the box: the runner's services-sync line with its `FAILED:` and `DEGRADED:` sections (`infra/nas-loops/loops/services-sync.sh`).
- `infra/nas-loops/test_heartbeat.py` (DR-1360) was called by no workflow and no test, measured by searching `.github` and the test tree.

## Impact

The house now says how its clock ran, by service name, in the row it already writes. The OpsBoard shows that line under "NAS last seen". The loops witness reaches the same answer with no key when the box cannot be asked, and its judge, report and incident ledger run unchanged on it. A runner road that only watched the NAS is reversed into the house reporting itself, which is DR-1360's direction.

## Decision

1. **The heartbeat carries the previous cycle.** `heartbeat.py` adds `last_cycle: {at, ok, failed, degraded}` from the newest services-sync event line. The names are matched from `services.json` with the rule loops-health already reads with, never split out of the free-text reasons, which stay on the box. No readable line, no field.
2. **The receipt (migration 0318).** `public.nas_heartbeat_receipt()` reads the newest row tagged `nas-heartbeat` with `source = 'nas-loops'` and rebuilds only the time, the service count, and the last cycle's time, ok and failed / degraded names, each checked for type and shape. No host name, no reason, no row text. Definer with a fixed search path; `anon` and `authenticated` only.
3. **The app.** `lastCycleLine` names every failed and degraded service, says "every service ran" only when the cycle finished, and "did not finish, and named no service" otherwise, never all-well. The OpsBoard shows it under the heartbeat.
4. **The witness.** loops-health's join carries `continue-on-error`. When the SSH witness says `reachable: false`, `served-heartbeat-receipt.py` writes the same witness shape from the receipt: failed and degraded by name; "unknown" when no last cycle is carried or the cycle did not finish and named no one; `installer` left `None`, and the judge skips that check on the served road instead of reading it as missing. The clock's age comes from the heartbeat, so a stale house reads "not firing"; an unreachable house says both roads failed and why.
5. **The heartbeat's own tests run.** `test_heartbeat.py` now runs inside the required vitest job.

## Verification

- `test_heartbeat.py`: 13 cases, 6 new (clean cycle; names from the registry while a reason mentions another service; newest cycle wins; no log, no cycle; the body carries the cycle only when known). Proven to catch: a plain substring match turns two red.
- `the-house-says-how-its-clock-ran.test.js` (15): the real reader against a local stand-in for the live database, then **loops-health's own judge lifted verbatim from the workflow** on what it wrote: a failed loop is the one problem; clean passes; an unreachable house names both roads; a three-hour-old heartbeat reads not firing; `--needed` for every SSH outcome; no key asks nothing; the loop lists match; 0318 is narrow. Proven to catch: restoring the installer check on the served road turns two red.
- `nas-heartbeat.test.js` +5: every name in the line; clean and older heartbeats; proven that an unfinished cycle never reads as all well; only service-shaped names; the OpsBoard renders it.
- 0318 applied twice on a real local PostgreSQL 16: no row gives `seen: false`; a real row's host, reason and a malformed name are dropped; another source is ignored; a garbled body gives `seen` with the row's time; an ungranted role is refused; idempotent.
- `a-tailnet-join-is-not-a-witness` names loops-health's second road with its reason. Workflow ceiling 22722 to 22727, the measured total, reason recorded in `scripts/workflow-budget.json`.

## Honest limits

- A member can append to `agent_inbox`, though only rows they own; one who writes `source = 'nas-loops'` could put a row ahead of the NAS's. The heartbeat is a witness, not a lock, and SSH reads the box's own ledgers whenever the key works.
- The served road does not carry each loop's own ledger (db-backup's `ok`, lesson-voice's `stopped`, the installer on disk); those checks run only over SSH.
- Until the first heartbeat with `last_cycle` is written after this merge syncs, the served road honestly reads every loop "unknown".
