# DR-0088 — App-first operations: the ops_commands queue (the NAS is plumbing, never the front door)

- **Status:** accepted
- **Tier:** C (new architectural surface: a control plane; ships as a reviewed PR, runner ships inactive)
- **Scope:** transcript pipeline now; every NAS job over time
- **Date:** 2026-07-03
- **Principles:** APP-IS-PRIMARY, THREE-BRAKES, VERIFICATION-DOCTRINE, REALITY-TRACE, DATA-EMPOWERMENT, GOVERN-EXECUTE-ADVISE, DECISION-RECORDS

## Directive

Darrell, 2026-07-03, after being handed NAS-shell steps and a DSM Task Scheduler screen to operate the transcript pipeline:

> "Can we have all triggers like these inside the app[?] I don't [want] when I have to go into the NAS for anything... why not have that be the first place I go... I want all loops and responsibilities to be based on the PoeTech App as my assistant, I want everything inside and working, and secure, have an admin space in the app not with [Tailscale] or whatever[,] based on my ... profile, this should be intuitive."

This is DR-0065 ("the app is the primary artifact") applied to **operations**: triggering, observing, and governing the system's own loops happens inside the app, gated on the steward's profile. The NAS shell is bootstrap-only, never workflow.

## Constraint (stated first, per Reality-Trace)

The cloud app cannot reach the LAN-only NAS (P18), and infra secrets (the service-role key) never ship to the client. So the app cannot push to the NAS; the two meet in the database both already reach.

## Decision

A **command-queue control plane**, three pieces:

1. **`infra/supabase/migrations-auto/0068-ops-commands.sql`** — the `ops_commands` table. RLS: owner/admin only in every direction (the "admin space" wall is the user's profile role, not a network location). Realtime-published so the surface watches commands move `queued → running → done` live. `job` is a free string; the executable whitelist deliberately does NOT live in the DB.
2. **`infra/nas-sme-pipeline/ops-runner.py`** — the NAS half. Outbound-only poll (~1 min) with the service key; executes ONLY whitelisted jobs (`transcript-backfill`, `resume-transcripts`), each mapped to a fixed argv array with clamped numeric params — never shell strings. Three brakes: per-cycle budget + hard subprocess timeout; single-instance lock; kill-switch after 3 consecutive runner failures (`out/.ops-runner-paused`, human-cleared — the pauser's own un-pause is deliberately not a queue job). **Ships inactive**; armed once by hand as a DSM boot task, after which the NAS is never part of the operating workflow.
3. **`app/src/lib/ops-commands.js` + the steward card in `HarvestLedger.jsx`** — the app half. `queueCommand`/`cancelCommand`/`subscribeOpsCommands` mirror the harvest-ledger conventions (`instance_id` + `requested_by` stamped, soft-fail, realtime refresh). The card renders only for `access.canEdit` (owner/admin) and shows: trigger buttons, live status rows with log output, cancel-on-queued, and an honest `runnerHint` ("still queued — is the NAS runner armed?") when a command sits queued past 5 minutes, so a dead runner is a visible state, not a silent hang.

## Guards (proven-to-catch)

`app/src/__tests__/ops-commands.test.js`: every job the app offers exists in the runner's whitelist (the cross-seam drift that would silently no-op a button); the lib writes the RLS-keyed columns; the migration walls to owner/admin with no anon grant and publishes realtime; the surface gates the card on `canEdit`; cancel only touches still-queued rows.

## Consequences

- Adding a new operable job = one handler in `ops-runner.py` + one entry in `OPS_JOBS` (+ the guard test passes) — a reviewed code change, never a migration or a new surface.
- The DSM daily-trickle schedule (DR/PR #515) remains valid as a *schedule*; this DR covers *on-demand* triggering and observation. A follow-up may move schedule config itself into the app (the runner reading a stored config), at which point DSM holds only the boot task.
- Bootstrap: one-time placement of `ops-runner.py` on the NAS + one DSM boot task. Documented in PR; after that, operations are app-only.
