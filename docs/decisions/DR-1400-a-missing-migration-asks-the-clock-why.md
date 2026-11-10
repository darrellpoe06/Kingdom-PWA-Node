# DR-1400: A missing migration asks the clock why — the two house receipts work together, and each still stands alone

**Date:** 2026-11-10
**Status:** Accepted (joins DR-1398 and DR-1399)
**Tier:** A (a diagnosis line in a reader; no verdict, exit code, schema or money changes)
**Type:** verification
**Area:** `scripts/served-migration-receipt.py`
**Sent in by:** Darrell, 2026-11-10: "Do they work well together and or separately?"
**Pairs with:** DR-1398 (the migration receipt), DR-1399 (the clock report), DR-0076 §8 (unknown is never a cause)

## Context

He asked whether the two receipts built today work together, separately, or both. The answer was traced on the live runs before writing this.

## What was measured

- **Separately, both proven live.**
  - The migration receipt ran alone on db-migrate run 42813212175 (12:16 UTC), before migration 0318 existed: green, 0 of 316 missing.
  - The clock report ran on loops-health run 42826042122 (13:40 UTC) without the migration receipt: PASS, all 12 loops ok. On that run the cycle had last fired 8 minutes earlier, by the house's own heartbeat.
  - Neither reads the other's function or file.
- **Together, the same road.** Both read through the served anon key and `poetech.us/sb`, which is the road the family's browsers use. If that road is down, both go red, and so does the app, which site-health reports.
- **The gap.** When files were still missing after the 25-minute wait, the migration reader could say only *that* they were missing. The house already publishes *why* in its clock report: a stopped clock, a failing replay, a replay that could not run, or a checkout that has not pulled the commit. The reader did not ask.

## Impact

A red migration lane now names its cause from the house's own words, so the first look tells a dead clock from a broken migration from a stale checkout. Nothing changes when everything lands: the clock is not asked. Nothing changes the verdict.

## Decision

On exit 20 or 21 only, `served-migration-receipt.py` asks `nas_heartbeat_receipt()` and adds one line:

- a heartbeat older than 30 minutes is a stopped clock;
- `sovereign-replay` named failed is the migration itself failing;
- named degraded means it could not run that cycle;
- a cycle that did not finish says so;
- a clean replay on a running clock means the files are not in the checkout it replays from;
- an unreadable or unwritten report says the cause is not known from here.

The exit code is unchanged.

## Verification

`the-house-says-what-it-applied.test.js` +6 cases:

- each cause is named;
- an unreadable report never guesses a cause and leaves exit 20;
- when everything is applied the clock is never asked.

Proven to catch: disabling the stopped-clock check turns its case red. The suite's earlier 14 cases are unchanged and green.
