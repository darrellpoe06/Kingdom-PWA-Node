# DR-1525: The books ask the house whether they are ready — the backup verdict and the Money schema ride the public road, so no Money step waits on a key

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** B (one NAS rider, one keyless witness workflow, migration 0334: two read-only anon-callable functions; no row, no money)
**Type:** ways + verification
**Area:** `infra/nas-loops/db-backup-receipt.py`, `infra/supabase/migrations-auto/0334-the-house-says-its-backup-and-the-books-readiness.sql`, `app/src/lib/money-readiness.js`, `scripts/served-money-readiness.py`, `.github/workflows/money-readiness.yml`, `scripts/readiness-receipt-replay.sh`
**Sent in by:** "We should have pipelines with no keys needed", then "Always check the DR's and what told you this time after checking the record?" (2026-11-18, the FOS Money thread)
**Pairs with:** DR-1360 (the NAS initiates every road), DR-1269 (migrations apply on the NAS clock), DR-1398 (the proof rides the public road), DR-1399 / DR-1511 (a census is the house's write, read through a whitelisting receipt), DR-1113 (the backup), DR-0108 (review our Ways), DR-0076 §8
**Corrects:** the FOS Money Phase 1.4 handoff (`docs/99-session-notes/2026-11-17-fos-money-phase-1-4-handoff.md`), whose preconditions routed through `TS_AUTHKEY` and a ConnectBot paste

## Context

Christina set three conditions before any FOS Money migration: authorized database access, a confirmed backup, a tested migration. The handoff sent the first two through the runner's Tailscale key ("only Darrell can mint") and a phone paste. That repeated the exact miss DR-1511 records: a road called absent without reading the record.

## What was measured

- **The record already answered the first condition.** DR-1269: the NAS applies merged migrations on its own clock (`replay-on-clock.sh`); DR-1398: their proof is read over poetech.us. No key.
- **Two facts had no keyless reader.** The backup verdict (`status.json`, read only by `nas-health.yml` over ssh, refused since 2026-11-04), and the books' schema (which Phase 1.4 columns exist, whether a CHECK limits categories, whether the obligations tables are live).
- **Proven on a real PostgreSQL 16** with a hostile backup row planted (a dump file name, a host path, error words quoting an address, a name, an extra secret key) and a newer row of the wrong source: anon received only whitelisted fields, none of the planted words, and was still refused `agent_inbox` and `transactions`. Proven to catch: dropping the source filter lets the forged 2099 row through and the replay fails.

## Impact

"May the migration be applied?" is answered by the house itself, in the app (`lib/money-readiness.js`) and by a keyless daily witness, with no tailnet, no ssh and no hand. The backup counts only when verified within 36 h with a passing restore drill within 8 d; an absent or unreadable receipt reads NOT CONFIRMED, never ready. The rider is NOT YET PROVEN (P66) until its first receipt is read live.

## Decision

1. **The rider.** `db-backup-receipt` (services-sync clock) reads `status.json` and patches one `agent_inbox` row: ok, time, size, entries, kept, drill verdict with its counts, an error flag. Never a file name, path, host or error words.
2. **The receipts (0334).** `db_backup_receipt()` rebuilds only typed, whitelisted fields from the NAS's own row; `money_readiness_receipt()` reads the catalog, never a financial row, and carries the backup. Definer, fixed search path, anon and authenticated.
3. **The witness.** `money-readiness.yml` asks the receipt over poetech.us/sb with the served anon key, prints where the install stands, and is red when not ready or unreadable. It never applies anything.
4. **The Way.** A Money step that needs a NAS-held value or state is answered by the house's own write first (DR-1360); a key or a paste is named as a gap to close, never a precondition.
