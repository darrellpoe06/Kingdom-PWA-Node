# DR-1398: The house says what it has applied — a migration's proof rides the public road the app already uses, and the runner's reach-in is support, never the authority

**Date:** 2026-11-10
**Status:** Accepted (applies DR-1360 §2 to the migration lane; narrows DR-1283)
**Tier:** B (the migration lane's pass/fail rule and one read-only, anon-callable function; no data written, no money)
**Type:** ways + verification
**Area:** `.github/workflows/db-migrate.yml`, `infra/supabase/migrations-auto/0317-the-house-says-what-it-has-applied.sql`, `scripts/served-migration-receipt.py`
**Sent in by:** Darrell, 2026-11-10, on being told the runner's road needed a new Tailscale credential
**Pairs with:** DR-1360 (the NAS initiates every road; the OAuth client withdrawn as the fix), DR-1269 (the NAS applies migrations on its own clock), DR-1283 (a dead key is never silent), DR-1396 (migration 0316, the first one this proves), DR-0076 §8 (unknown is never current), DR-0317 (the sovereign database is the one the app reads)

## Context

His words: "Why can't we do it another way. Same outcome. Don't need anything because we designed it. What is that look like." Then: "Another path.. or process etc. Thinking".

The agent's report on #2595 had told him migration 0316 was waiting because the runner's tailnet key is dead, and named a Tailscale OAuth client as the way to restore that road. That advice was wrong twice over: DR-1360 withdrew the OAuth client on 2026-11-06 ("it changes which outside system the house depends on, not whether it depends") and set the standard that the NAS initiates every road. This record is the correction carried into the lane.

## What was measured

- The APPLY half already met DR-1360: `infra/nas-supabase/replay-on-clock.sh` runs the same `replay_migrations.sh` against the same ledger on the NAS's own services-sync clock (DR-1269), and the ledger `public._sovereign_replay` records one row per applied file name (`replay_migrations.sh`, its `INSERT INTO public._sovereign_replay`).
- The PROOF half still reached in. db-migrate run 42807915370 (main `680030271f`, #2595) failed with `backend error: invalid key: API key does not exist` and `NAS unreachable - nothing was applied`. The lane learned nothing about the database; it learned that the key is dead, which incident #2517 already said.
- The public road to the live database exists and needs nothing new: `app/functions/sb/[[path]].js` proxies `poetech.us/sb` to the NAS, and `scripts/served-anon-key.py` already reads the public anon key back off the served site for the deploy (DR-1269).

## Impact

A merged migration is proven on the live database by the database's own receipt, read over the road every family browser uses. No tailnet key, no OAuth client, no SSH and no hand is needed for the lane to be green and true. The tailnet key goes back to being what DR-1360 says it is, a support road. The incident ledger is written only when the house itself could not prove the migrations landed, so it stops counting an outage that no longer blocks anything here.

## Decision

1. **The receipt (migration 0317).** `public.sovereign_migration_receipt(p_files text[])` answers: is there a sovereign ledger, how many migrations it holds, the newest one, when the last row was written, and which of the given files are NOT applied. It runs as its definer with a fixed search path. Input is at most 1000 names, each shaped like a migration file name, and anything else is dropped. It gives out only file names that are already public in the repository. Granted to `anon` and `authenticated` only. On a database with no sovereign ledger (the hosted mirror) it returns `ledger: false`, never an empty missing list.
2. **The reader.** `scripts/served-migration-receipt.py` sends the checkout's migration file names to `poetech.us/sb/rest/v1/rpc/sovereign_migration_receipt` with the served anon key. It waits for the NAS's clock within a budget rather than reaching in to hurry it. It refuses rather than guesses: 0 all applied; 20 files still missing, named; 21 the receipt itself not applied yet; 22 the wrong database answered; 14 unreachable; 2 no key.
3. **The lane.** In db-migrate the tailnet join and the SSH replay carry `continue-on-error`: they may still hurry the NAS when the key works, and their failure no longer reddens anything. The new step `Read the live database's own receipt over the served road` runs on every armed run with a 30-minute ceiling (`--wait 1500`, one NAS cycle is about 15 minutes) and is the authority. The DR-1283 incident step fires only when the reach-in failed AND the receipt could not prove the migrations either.
4. **Chicken and egg, named.** On the merge that carries 0317, the receipt function itself reaches the live database by the NAS's clock. The reader keeps asking while it answers 404 (exit 21), so this very merge proves itself if the NAS cycle runs inside the budget.

## Verification

- `the-house-says-what-it-applied.test.js` (14): the real Python reader against a local stand-in for the live database. It checks every exit code; the files and key it sends; that it waits through one "missing" answer to "applied"; that the key is never printed; the migration's narrowness (definer, search path, the 1000 cap, the name shape, the grants, `ledger: false`); and the workflow wiring (continue-on-error on the reach-in only, the receipt's condition, timeout, mask and order, the incident's new condition, the trigger path). Proven to catch: a reader that returns 0 for the wrong database fails it.
- Migration 0317 applied twice on a real local PostgreSQL 16 with and without a `_sovereign_replay` ledger. Hosted gives `{"ledger": false}`. A malformed name and a duplicate are dropped (asked 3 of 5). 1500 names are capped at 1000. A role without the grant is refused. The re-run is idempotent.
- `a-tailnet-join-is-not-a-witness.test.js`: db-migrate joins the named list of lanes with a second road, with its reason, which is exactly what that list exists to show. `a-dead-tailnet-key-is-never-silent` (15) and `sovereign-migration-parity` (10) are still green.
- Workflow lines 22716 under the 22722 ceiling, with no raise; the receipt's lines were paid for by shortening three comments whose story lives in DR-1283.
- **Honest limits.** The sandbox cannot reach poetech.us, so the first live receipt is read from the db-migrate run on this merge, not from here. If the NAS clock is not running, that run says so by name (exit 21 or 20), and that observation is itself new: until now the clock's own state was readable only over the dead key.
