# DR-1023: A run in flight is a run — every road that dispatches db-migrate asks first whether one is still applying main's tip

**Date:** 2026-10-14
**Status:** accepted
**Area:**
- `.github/workflows/migrate-freshness.yml` (the CI-completion hook and the cron: before walking main for the last SUCCESSFUL run, count the db-migrate runs for main's tip that have not finished; any → "ALREADY IN FLIGHT", stand down)
- `.github/workflows/auto-merge.yml` (the settled-tip re-check beneath the deploy poll: the same question, after its success read and before its dispatch)
- `.github/workflows/public-shelf-witness.yml` (the incident step is keyed on the COMPARISON's outcome, never on the job's; carried in the same PR)
- `scripts/bus-witness.mjs` (routes grouped by name across MTD's several route_ids; "1 bus"; carried in the same PR)
- `scripts/place-doors-over-tailnet.sh` (two different nothings: a door that had its area and could not be read again is not "no house matched"; carried in the same PR)
- `app/src/__tests__/migration-dispatch-lane.test.js` (+2; proven to catch), `app/src/__tests__/the-city-bus-says-how-close.test.js` (two pins sharpened; proven to catch)

**Amends:** DR-1017 (the sweep's poll asks whether db-migrate has a run for the tip; the hook and the re-check now ask too), DR-1012 (the hooks that hear CI), DR-0458 (deploy-freshness's own "ALREADY IN FLIGHT", which the migration hook never had), DR-0973 (the shelf witness's incident ledger)
**Declared by:** the lane's own measurement, 2026-10-14, while proving #2171 (DR-1022 / 0291)

## Context

DR-1017 (this morning) closed one road: a person-started sweep whose heal jobs started 23 minutes late dispatched a third db-migrate for a tip two other roads had already migrated. Its fix was placed in the sweep's poll function only. Two other roads ask the same question with a different filter: `migrate-freshness.yml` (the cron, and since DR-1012 a hook on CI completing) and the auto-merge re-check step beneath the deploy poll both read db-migrate's runs for main's tip WITH `status=success`. A run that is applying the tip at that moment is not a success yet, so to those two roads it does not exist.

## What was measured

- **#2171 merged 16:20:30 as `aa4078dd4`.** db-migrate **38597283265** (run 703) was created 16:20:46 and applied 0291 on the hosted database at 16:22:03 (`applied=1 skipped=289`), passed the live-definition witness (40 functions match the newest migration), and replayed it on the sovereign database at 16:22:49 (`applied 1 this run, ledger 295/291`).
- **migrate-freshness 38597189803** fired on CI completing for the PREVIOUS tip (`f8de528`, #2170) at 16:20:08, settled its 75 s, read main's tip as `aa4078dd4` at 16:21:34, walked main for a SUCCESSFUL run on it, found none (703 was 50 s into applying), and dispatched **38597404534** (run 704) at 16:21:36. Run 704 applied nothing (idempotent), re-ran the witness and the sovereign replay, and dispatched a second rls-isolation matrix (23 legs) behind it. Its log says exactly why: "main's migrations differ from what db-migrate last applied (882852a03 -> aa4078dd4) — dispatching."
- **deploy-freshness 38597189582**, fired by the same CI completion at the same second, stood down on its second look: "ALREADY IN FLIGHT: a deploy run exists for main aa4078dd4; not dispatching." The deploy hook has asked the in-flight question since DR-0458. The migration hook was written without it.
- **The auto-merge re-check step** (`Re-check for a migration once the deploy wait has resolved`) reads `runs?status=success&head_sha=` and dispatches when that is empty and the tip touched a migration; it did not fire this time only because the sweep that would run it (38595887789) was never started by GitHub (held `pending`). The hole is the same shape.
- **public-shelf-witness 38597741280** (dispatched 16:23:55 to read 0291 live): the database reading was **40 pictures on each of the two beds at 805 and 16 on the whole unit**; the browser read 3 cards; the comparison said "the shelf agrees with what the doors are called." Then the run-log write (`gh issue list`) got a GraphQL error from GitHub ("Something went wrong while executing your query"), the step went red, and the incident step — `if: failure()`, keyed on the JOB — appended "the public shelf disagrees with what the doors are called, or could not be read" to issue #2127. Both readings had agreed. The ledger carries a finding that was never found.
- **bus-witness 38597296070** (16:20:51, main at `aa4078dd4`, the first run with the calendar_dates fix): every route now has days and a count. At one corner it printed "70 Grey — Sat · about 23 buses" and, four lines down, "70 Grey — Sat · about 9 buses": MTD carries one route name on several `route_id`s (weekday / Saturday / Sunday / seasonal patterns), and the witness grouped by id. It also printed "about 1 buses".

## Impact

- A migration-carrying merge now runs db-migrate ONCE where it ran twice (and, under DR-1017's measured case, three times), and one isolation matrix instead of two or three. Each spare run costs about five minutes of runner time plus a 23-leg matrix behind it, and a second DDL run against the same database is the class DR-0831 already had to serialize.
- A failed run still re-fires the hook: the in-flight count excludes completed runs, so a red lane is still "behind the repo" (the cron's standing rule). Only a run that has not finished counts as the work being done.
- The shelf's incident ledger says "the shelf disagrees" only when the comparison said so. A log line that could not be written leaves the job red (the run-log's own silence rule, DR-0973) and files nothing on the shelf's name.
- The bus witness names a route once per corner, with its days unioned and its busiest day's whole count.

## Decision

1. **Every road that can dispatch db-migrate asks, before dispatching, whether a run for main's exact tip is still in flight** (`status != completed`), and stands down if one is. The sweep's poll asks (DR-1017), and now the CI-completion hook / cron and the deploy-side re-check ask too. An unreadable answer reads as "none in flight" and falls through to the success read, which still dispatches (DR-0076 §8).
2. **The in-flight read never replaces the success read.** A finished failure is not a run that did the work; the cron keeps dispatching on a red lane.
3. **A witness files a finding on the ledger it was dispatched to judge only when its own judgement failed** — the comparison step's outcome, never the job's.
4. **Routes are named once** per stop in the bus witness, by name, with trips summed per date across the agency's several ids for one name.

Not done, and said: the sweep's poll (DR-1017) treats ANY run for the tip, a finished failure included, as "another road got there first"; the hook and the re-check treat only an unfinished run so. The two readings differ on a failed run; the poll's is the looser. `re-review: 2026-10-21` with the next five migration-carrying merges: count db-migrate runs per sha (expected 1) and read which road dispatched each.

## Verification

- **`migration-dispatch-lane` (32):** the hook counts `select(.status != "completed")` for `head_sha=$main_sha&per_page=10` BEFORE it walks main for the last success and prints "ALREADY IN FLIGHT: a db-migrate run exists for main's tip"; the re-check does the same after its success read and before `gh workflow run db-migrate.yml`. **Proven to catch:** with the two workflow files and the witness script stashed and the tests kept, 4 fail (the hook pin, the re-check pin, the route-grouping pin, the report pin); restored, 41 pass across the two suites.
- **`the-city-bus-says-how-close` (9):** the fixture carries one name on two ids (R7 and R7B, "7 Grey") and a one-trip route; the corner names "7 Grey" once with its two trips summed, and "9 Brown — Mon–Fri · about 1 bus".
- The three workflows parse (PyYAML); lint clean; the 20 gates green.
- **Live proof of #2171 (DR-1022), read this session:** Deploy 38597269575 green, boot-check 16:23:20; db-migrate 703 applied 0291 hosted + sovereign (above); rls-isolation 38597583379's poe-properties leg green at 16:26:23 with `BORROW BOTH WAYS SMOKE: PASS`; public-shelf witness: 40 and 40 on the two beds, 16 on the unit.
- **Placer 38597571793 (dispatched by the 16:22 deploy, 16:23 to 16:31):** read 7 doors (3 with an area and `nearby` NULL, 4 never placed); the three Danville houses matched again and Overpass timed out on each again (about 2.5 minutes a door at 90 s of server patience over two mirrors), so by DR-1019's rule nothing was written; the four misses are the family's hand (DR-1017's list). The wrapper then printed "no door could be placed this run (the lookups found no house that matched)", which was false for this run: it now says the two nothings apart (`the-lane-places-the-doors` +2 pins, 10; proven to catch with the script stashed: 1 fails). The Danville Overpass trouble itself stands as measured in DR-1019; the lane keeps asking.
- **DR-0107 proof owed:** the next migration-carrying merge's migrate-freshness hook log must read either "ALREADY IN FLIGHT" or "dispatching" exactly once across the roads, with ONE db-migrate run for that sha. Read at the re-review.
