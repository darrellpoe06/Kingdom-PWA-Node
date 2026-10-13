# DR-0309 — the baseline refreshes by nonce, and the refresh rides the lane

- **status:** accepted
- **date:** 2026-08-19
- **declared by:** Darrell (standing directives: DR-0307 sprint autonomy; DR-0108 review-our-ways — "I'm not doing that, you are... follow our Ways"); mechanism authored by the agent
- **extends:** DR-0308 (the hosted database is the baseline, not the files)

## Decision

The sovereign baseline re-dump is triggered from the repository, through the
delivery lane, with no hands on the NAS: `infra/nas-supabase/BASELINE-REFRESH`
holds a single nonce token, and `replay_migrations.sh` joins it into the
ledger marker name (`hosted-baseline.sql@<nonce>`). Bumping the nonce in a
commit makes the sovereign ledger "forget" the baseline; the next
services-sync cycle re-runs the whole DR-0308 dump flow — RESET, fresh hosted
pg_dump (schema + data as of that moment), accounts-first copy, restore,
re-ledger under the new marker.

## Why now

Hosted gained data AFTER the 2026-08-17 baseline dump: migration 0138
(`family_plans` + both overlay re-runs) and the family's plan document row
(Christina, 2026-08-19). A repoint onto the stale sovereign baseline would
open the Plan tab onto an empty table — the exact empty-tables class DR-0308
closed. **Standing rule: the repoint merge waits for the re-dump receipt**
(nas-health shows the new marker in the ledger and the refreshed row counts).

## The brake

The nonce is a committed file: reverting the commit (or `hold` on the PR) is
the stop-path. The refresh is deterministic-class (budget: one services-sync
cycle; lock: the existing loops lock; DR-0248 applies — no manual kill-switch).

## First use

Nonce `20260819a` — carries family_plans (1 plan row) + 0138 to the sovereign
box ahead of the repoint.
