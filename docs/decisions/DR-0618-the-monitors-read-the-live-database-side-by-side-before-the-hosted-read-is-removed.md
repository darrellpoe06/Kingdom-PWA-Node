# DR-0618 — The monitors read the live database side by side before the hosted read is removed

- **Status:** accepted
- **Tier:** A (additive monitoring steps; no schema, nothing removed)
- **Type:** fix
- **Date:** 2026-09-24
- **Scope:** `scripts/live-sql.sh` (new); `.github/workflows/harvest-health.yml`, `.github/workflows/ops-queue-health.yml` (a side-by-side live reading and a comparison in the run summary)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), DR-0310 / DR-0442 (the sovereign database is the live one), DR-0107 (proof before trust), SPEAK-ESTABLISHED-FACT (DR-0100)
- **Grounds:** Darrell, 2026-09-24: *"No redundant workflows unless they serve a purpose we have expressed"* and *"We are creating a new pipeline... make sure it works end to end before dismantling anything... make sense?!!!"*

## Context — the question

The workflow evaluation (2026-09-24) found five monitors still reading the hosted project through `SUPABASE_DB_URL`, which `.github/workflows/transcript-backfill.yml:86` itself calls "the RETIRED hosted project": the app has read the NAS's own database since REPOINT-ARMED (2026-08-19). Their green and red describe a database the app does not use.

## What was measured

| monitor | reads | file:line |
| --- | --- | --- |
| harvest-health | hosted | `.github/workflows/harvest-health.yml:83` |
| ops-queue-health | hosted | `.github/workflows/ops-queue-health.yml:74` |
| rls-isolation | hosted | `.github/workflows/rls-isolation.yml:190` |
| corpus-reconcile | hosted (writes) | `.github/workflows/corpus-reconcile.yml:81` |
| site-health backend step | hosted health | `.github/workflows/site-health.yml:86` |

## Impact

Unresolved: a stall on the live database would never be seen, and a stall on the dead one could raise a false alarm. Resolved in two steps, proof first: both readings side by side now; the hosted read removed only after the live readings are proven on real runs.

## Decision

1. **One path to the live database for every monitor:** `scripts/live-sql.sh`, SQL in, `psql -At` rows out, over the road every sovereign lane already uses (tailnet, ssh, `docker exec psql` in `supabase-db`). `ON_ERROR_STOP=1`: a failed query is a non-zero exit, never an empty answer.
2. **Side by side first (his rule):** harvest-health and ops-queue-health run the same query on the live database beside the hosted one, and the run summary prints both. The live step cannot fail the run while it is being proven.
3. **Then the switch:** after proven runs, the verdict moves to the live reading and the hosted read is removed; rls-isolation, corpus-reconcile and site-health's backend step follow the same two steps.

## Verification

- The workflow guard suites (603) green; both files parse; `bash -n scripts/live-sql.sh` clean.
- Proof on real runs: harvest-health and ops-queue-health dispatched on this branch; each run's summary shows the hosted and the live reading together.
- **Measured 2026-09-24, on commit 4922e28e.** Both runs joined the tailnet and read the live database through `scripts/live-sql.sh`.
  - harvest-health, run 36028450599: hosted **752 / 874** transcribed, newest success **235 h** old. Live **754 / 874**, newest success **51 h** old. The hosted reading called the pipeline SILENT, commented on incident #1617 and dispatched a heal (run 36028499586). Both came from the dead database's ten-day-old picture. The live pipeline has written in the last three days. It is still 3 h past the 48 h threshold, so a stall on the live side remains a real reading, not a false one.
  - ops-queue-health, run 36028453391: both databases show **0** stuck commands. The oldest-row field differs: hosted 34,251, live 116,114. The live queue holds the real history.
  - This shows the harvest monitor's alarm was raised from the wrong database. The switch (step 3) is the fix.

## Limits, stated

1. The switch (step 3) is a later change, made only with the proven runs cited. `re-review: 2026-09-26`.
