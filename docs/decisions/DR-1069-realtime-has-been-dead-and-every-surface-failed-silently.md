# DR-1069: Realtime has been dead, and every surface that depends on it failed silently

**Date:** 2026-10-16
**Status:** accepted
**Tier:** C (the live-update path under 32 tables on the family's and the church's own stack)
**Type:** orchestration
**Area:**
- `.github/workflows/nas-health.yml` (a read-only probe of `_realtime.tenants`)
- the finding itself, which is the deliverable

**Grounds:** Measured, not reported. `nas-health` run 38859433402 (2026-10-16 06:08 UTC), dispatched to confirm DR-1065's new rider was firing, carried this in the realtime container's own words — every ten seconds:
```
TenantNotFound: Tenant not found: realtime
```
**Principles:** DR-0076 §4 (measure, do not claim) and §8 (honest uncertainty); DR-0125 (the thing has its own witness); DR-1058 (a surface must not wait on a WebSocket to show its own work); DR-0330 (a surface tells the truth about its own state)

## Context

DR-1065 shipped a NAS rider, and merging it is not the same as it running, so
`nas-health` was dispatched to prove the clock had picked it up. It had
(`services-sync: exit=0 | all services synced`, mirror HEAD at 05:48, past the
05:17 merge). The realtime failure was found while reading that log for
something else entirely.

## What was measured

1. **`TenantNotFound: Tenant not found: realtime`, repeating every ten
   seconds** in `supabase-realtime`'s log. Realtime is itself a multi-tenant
   server; it cannot find the tenant row it is supposed to serve.
2. **The string appears NOWHERE in `docs/`.** Nobody had recorded it. It has
   been failing without a single report, which is the whole point of this
   record.
3. **The database side is healthy and is not the problem.** The same run
   reports `books realtime publication: whole` — the tables are in the
   publication, so Postgres is publishing. The *server* cannot route.
4. **The blast radius, counted:** 32 tables behind the generic
   `makeSubscriber`, 32 components subscribing, 36 files calling `.channel(`.
5. **The severity, bounded by reading the code rather than assuming it.**
   `makeSubscriber` does `const initial = await fetchAll(); if (initial) onChange(initial);`
   **before** it subscribes (`choir-sync.js:529`). So:
   - **initial load works** — every surface shows its data when opened;
   - **live updates do not** — nothing changes while you are looking at it;
   - the one place it reads as outright *broken* is a control whose **only**
     refresh path is the realtime callback.
6. **The configuration intends to seed itself.** `SEED_SELF_HOST: "true"` is
   set, with `DB_AFTER_CONNECT_QUERY: SET search_path TO _realtime`. So the
   tenant row is supposed to exist and does not — the question is whether it
   was never seeded, seeded under a different `external_id`, or lost when
   `replay_migrations.sh` drops a squatter `public.tenants` (it drops one only
   when it carries realtime's `jwt_secret` column, which is realtime's shape).
   `install.sh:126` already records *"No tenant was ever seeded"* from an
   earlier incident, so never-seeded is the leading candidate — **and it is a
   candidate, not a finding.**

## Impact

**This is the measured cause of DR-1058, and it confirms an inference I had
honestly weakened.** On the Campus Rentals checkbox I wrote that realtime
probably was not delivering; then DR-1054's new cross-origin probe measured the
app's HTTP road **healthy** (`XO_POST: 400, XO_BYTES: 81`) and I corrected the
record to say the explanation was no longer supported. Both corrections were
right: the HTTP half genuinely is fine, the WebSocket half genuinely is broken,
and they were never the same road. A REST call and a long-lived socket fail
independently — which is exactly why DR-1058's fix (apply the write's own
result; never learn your own outcome only from an event) was correct
**regardless** of cause, and is now correct for a known one.

**DR-1058's dated sweep stops being scheduled and becomes due.** It reads:
*"Any surface whose only `setX` is a realtime callback has this defect; that
sweep is its own change (`re-review: 2026-10-22`)."* The cause is now measured,
so the sweep has a reason rather than a date.

## Decision

1. **Record it, because an unrecorded silent failure is the expensive kind.**
   The finding is the deliverable; this file is where it stops being invisible.
2. **Measure the cause before changing anything** (DR-0076 §5). A read-only
   probe is added to the witness that found it: the tenant count, the
   `external_id`s, whether a secret is present (never its value), and whether a
   squatter `public.tenants` exists. Those three readings tell a **missing** row
   from a **mis-keyed** one from a **wrong-schema** one, which are three
   different fixes.
3. **The repair is NOT taken in this record.** Restarting or re-seeding the
   realtime container is a change to a live service on Darrell's own NAS, and
   the right fix depends on a reading that does not exist yet. Guessing between
   three repairs on a family's stack at six in the morning is how a broken
   live-update path becomes a broken database.

## Verification

- The quoted log line is from run 38859433402's own output, not from memory.
- The severity claim is read off `choir-sync.js:501-541`, not assumed: the
  `await fetchAll()` that precedes `.subscribe()` is what makes "initial load
  works" true, and it is quoted above.
- The counts (32 / 32 / 36) are `grep` over `app/src`, stated as counts of call
  sites rather than of affected screens.
- `nas-health.yml` parses as YAML; workflow-list-order and his-hand guards
  green.
- **No claim is made about the cause.** Three candidates are named and the
  probe that distinguishes them is shipped. `install.sh`'s own note makes
  never-seeded the leading one; it is labelled a candidate.

## What this does not do

- **It does not fix realtime.** Nothing in this record makes a live update
  arrive. **`re-review: 2026-10-17`** — read the probe's first output, then
  apply the one repair it indicates.
- **It does not sweep the 32 surfaces.** DR-1058's follow-through is now
  justified rather than merely dated, and it is still its own change with its
  own proof.
- **It does not explain the 843 storage restarts** seen in the same run, or the
  missing `church-team-documents` objects (DR-1062's open gap, which this same
  log answered separately). Each is its own finding.
