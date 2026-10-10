# DR-0943 — A chain halfway through is not a revert: the witness reads again while an isolation run is applying

**Date:** 2026-10-10
**Status:** accepted
**Area:** `.github/workflows/db-migrate.yml` (Witness the LIVE definitions), `scripts/live-definition-witness-settle.mjs`
**Principle:** DR-0076 (proven to catch; a false alarm is a broken gate), DR-0831 (per-file apply in the isolation matrix)

## Context

After #2104 merged (a276e5c2c), db-migrate run 38093283977 applied 0262–0270 and its witness passed at 22:59:35. A second dispatch on the same commit, run 38093330311, failed at 23:03:21 in "Witness the LIVE definitions" on the hosted project:

> document_route — live definition is older than 0204-the-days-post-and-the-child-who-sorts-it.sql
> obligation_record — live definition is older than 0203-a-mortgage-in-line-items-and-what-each-door-costs-against-what-it-collects.sql

Its own hosted apply was `applied=0 skipped=271`, and its sovereign replay passed with the frontier at none. Nothing in that run changed either function.

## What was measured

- The isolation run dispatched by 38093283977 (rls-isolation 38093504020) ran its **product-forms** leg from **23:02:44 to 23:03:41**. That leg applies 0200 → 0213 against the hosted project.
- Since DR-0831, the files after the pre-step group each commit in their own transaction, so the hosted project held 0202's `document_route` and `obligation_record` until 0203 and 0204 committed seconds later. The witness read at 23:03:21, inside that window.
- The two workflows have separate concurrency groups (`db-migrate`, `rls-isolation`), so nothing kept the witness from reading while the matrix was applying.
- **The rls-isolation run reports `queued` at run level while its legs run.** The API returned `in_progress: 0, queued: 1` for 38093504020 during its legs. A check on `in_progress` alone would have missed this incident.
- The app reads the sovereign database (REPOINT-ARMED), which this window never touched.

## Decision

1. **The witness settles before it judges.**
   - `scripts/live-definition-witness-settle.mjs` builds the query with `live-definition-witness.mjs --sql` and judges each read with `--check`.
   - On an "older" finding, it asks the API whether an `rls-isolation` run is queued or in progress. If one is, it reads again every 20 s until one of three things happens:
     - a read is clean (pass);
     - the isolation run ends, after which one last read decides;
     - the 20-minute budget is spent (fail).
2. **Nothing else is softened.**
   - An "older" finding with no isolation run in motion fails at once, exactly as before.
   - A plumbing fault (exit 2) never retries.
   - If the API cannot be reached, it counts as "not busy", so a missing observation never buys a wait.
3. **No shared concurrency group.** GitHub keeps one pending run per group. A dispatched isolation run would therefore cancel a db-migrate waiting behind it, which is the worse failure.

## Verification

- `live-definition-witness-settle.test.js` has 8 tests, covering:
  - the incident: older, then clean once the chain moves on;
  - an immediate fail with no isolation run;
  - a fail after one last read;
  - the run ending between a read and the look;
  - the budget;
  - a fault never retries;
  - the workflow wiring.
- **Proven to catch:**
  - With "older and not busy" mutated to pass, two tests fail by name.
  - With the budget removed, the budget test fails by name.
- **Real CLI runs:**
  - Against an unreachable database: exit 2 after one read.
  - Against a local PostgreSQL holding only the door chain: 37 findings, exit 1 after one read, with no wait.
- **Not yet observed:** a live db-migrate settling through an isolation window. The next db-migrate that overlaps a matrix run is the proof. `re-review: 2026-10-24`.
