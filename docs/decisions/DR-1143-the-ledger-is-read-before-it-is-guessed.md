# DR-1143: The ledger is read before it is guessed — a failed ledger read stops db-migrate, and a re-applied file replays the newer definitions after it

**Date:** 2026-10-20
**Status:** accepted
**Tier:** B (the migration lane's runner; no schema change of its own; carried with its proof against the real script)
**Type:** infra (delivery lane) + incident
**Area:**
- `scripts/db-migrate-apply.sh` (`ledger_checksum()` with three tries that STOPS the run when the ledger cannot be read; `functions_defined_by()` + `REDEFINED` so a later file holding the newer body of a function an earlier file just (re-)defined is applied again)
- `app/src/__tests__/the-ledger-is-read-before-it-is-guessed.test.js` (new, 10 cases, the real script under a stub psql)
- `infra/supabase/migrations-auto/0205-the-sum-rule-refuses-inside-the-function-not-at-commit.sql` (a dated comment only, so its checksum changes and the lane applies it once more: the live heal)

**Amends:** DR-0944 (the live-definition witness: a chain halfway through is not a revert) by closing the case where the chain is re-entered by the RUNNER itself; DR-0332 (the ledger is the receipt, not the truth). Grounds: DR-0076 (a gate that fails must mean something; a read that failed is not a zero), DR-0621 (a flag is where the work starts).
**Declared by:** the session, 2026-10-20, from the measurement below; the rule it states is DR-0076 §1 applied to the runner's own reads.

---

## Context

db-migrate is the deploy-path runner for the hosted database: for each migration file it reads the ledger (`_schema_migrations`) for that file's applied checksum, skips the file when the checksum matches, and otherwise applies it and writes the receipt. Since 2026-09-06 (DR-0332 class) the receipt write is checked. The READ was not: `prev=$(psql ... 2>/dev/null || echo "")` sent the read's failure to nowhere and turned it into the empty string, and the empty string had always meant "never applied, apply it".

## What was measured

- **db-migrate run 39501068881 (main 458171d53, 21:31Z):** `=== applying 0203-a-mortgage-in-line-items...sql ===` then `=== applying 0304-...sql ===`, `summary: applied=2 skipped=301 failed=0`. 0304 was the one new file. `git diff dcf1e59a 458171d5 -- infra/supabase/migrations-auto` touches only 0304: 0203 had not changed and its ledger row was the one written on its first apply. The only way the runner applies an unchanged file is an empty answer to the checksum read, and the only way that answer is empty with the row present is a failed read.
- **The same job, one step later:** `live-definition-witness: obligation_set_lines — live definition is older than 0205-the-sum-rule-refuses-inside-the-function-not-at-commit.sql` (missing tokens `come, count, items, must, payment, total, v_amount, v_count, v_total`: the sum rule). 0203 and 0205 are the only two files in the repo that define `obligation_set_lines`; 0203 re-applied alone put the pre-sum-rule body back. **The sum rule (DR-0363) was off on the live database from 21:32Z** until this record's heal applies.
- **Run 39501477917 (f0b0977be, 21:34Z):** `applied=0 skipped=303`, the same witness failure: the runner cannot heal what it did, because it skips any file whose checksum matches (DR-0944's "db-migrate can never HEAL one").
- **Ruled out:** the isolation matrix. Its last run (39362027628, 03:00Z) applied 0203, 0204, 0205 in order on the product-forms leg and ended on 0205's body; the witness in db-migrate 725 (02:58Z) was green; no isolation run happened between 03:16Z and 21:31Z. Nothing in the repo deletes a ledger row.

## Decision

1. **A failed read is not an empty read.** `ledger_checksum()` reads the checksum with its stderr kept, retries a failed read three times with a growing pause, and when the ledger still cannot be read the run STOPS at that file with the reason, applying nothing on a guess. "No row" is psql exit 0 with no output; "could not read" is a non-zero exit. The summary names `stopped-at=`.
2. **The newest definition wins, inside the runner.** When a file applies (new, changed, or re-applied) the functions it defines are remembered; a later file whose checksum matches is nonetheless applied again when it defines one of those functions, printed as `re-applying <file>: it holds the newer definition of <fn>, redefined by <file> earlier this run`. A chain re-entered in the middle ends on the body the repo ships, the rule the isolation matrix already follows (newest-definition-replay-guard).
3. **The live heal rides the lane.** 0205 carries a dated comment so its checksum changes and the next db-migrate applies it once more; the witness in that run is the proof. No ledger row is deleted by hand (DR-0944 §"the cost of a false finding").

## Impact

- The lane cannot again revert a function by re-applying an older file: either the read succeeds and the file is skipped, or the file applies and every newer definition after it applies too, or the run stops and says why.
- A transient pooler failure costs at most two short pauses instead of a silent re-apply.
- Not done, with a why and a date: the same read pattern on the SOVEREIGN replay (`_sovereign_replay`, keyed by filename, no checksum) is a different mechanism and did not fail here; its reads are reviewed under DR-1143 `re-review: 2026-10-27`.

## Verification

- `the-ledger-is-read-before-it-is-guessed.test.js` runs the REAL `scripts/db-migrate-apply.sh` against a stub psql: with every row current, `applied=0 skipped=4`; a read that keeps failing for 0204 exits non-zero with `ledger could not be read for 0204-days.sql after three tries` and `stopped-at=0204-days.sql`, applies nothing and never prints the all-clear; a read that fails twice then answers logs two `(try N of 3)` warnings and the run is green; a stale 0203 applies and `0205-sum-rule.sql` is re-applied by name and cause while 0204 and 0206 (other functions, unchanged) are skipped, `applied=2 skipped=2`. Proven-to-catch: against the previous script the failing-read case applies 0204 and exits 0, and the stale-0203 case leaves 0205 skipped.
- `db-migrate-ledger-rejection.test.js` (the 2026-09-06 gate) still passes on the changed script.
- **Live, after merge:** the db-migrate run for this commit applies 0205 once more and its live-definition witness reads clean; recorded below when read.
