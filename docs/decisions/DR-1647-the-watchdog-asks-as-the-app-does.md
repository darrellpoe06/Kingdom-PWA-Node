# DR-1647: The watchdog asks as the app does

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** B (code the NAS runs unattended on its armed watchdog clock; one request header; the restore's own brakes are unchanged)
**Type:** decision
**Area:** `infra/nas-loops/loops/funnel_watchdog.py` (`probe`, `PROBE_UA`); `infra/nas-loops/test_funnel_watchdog.py`
**Sent in by:** Darrell, 2026-11-24, a child answered "Ari is resting": *"What happened?!!!! Kids can't ask simple questions?!!!"*
**Pairs with:** DR-1645 (the house reads Ari's road), DR-1619 and DR-1624 (the watchdog watches the family's road and reports first), DR-0268 (the bounded restore), DR-0076

## Context

DR-1645 merged at 18:14Z. Forty minutes and two clock cycles later the house had sent no report on Ari's road, and `nas-funnel-report` had never run once since it was written, the night of the 2026-11-23 outage included.

## What was measured

- The house's clock runs: its own heartbeat, read over `poetech.us/sb` in loops-health run 45462407361, says services-sync last fired at 18:32:42Z. One loop failed in that cycle (`bg-message-lessons`); the rest were ok.
- The house's GitHub token works: `lesson-waiting` dispatches from the same token file arrived at 18:17Z, 18:31Z and 18:42Z.
- The house pulls main at the head of every cycle (`services-sync.sh`, `pull --ff-only`).
- `probe()` sent no `User-Agent`, so urllib named itself `Python-urllib`. The repo already holds the measurement of what Cloudflare does with that name on this host: run 39477326790 got 403 on all 168 requests in under a second each, the refusal coming before the Function runs (`scripts/voice-clarity-witness.py`).
- `is_up()` counts 200 through 499 as an answer from the house. A 403 from Cloudflare therefore read as "the road is up", on `/sb` and on `/llm` alike.

Not measured: the 403 itself on `/sb` and `/llm` from the box. No session can stand on the box (the runner's tailnet key no longer exists). The report that follows this change is the measurement.

## Impact

The watchdog on the family's road has likely read every outage as healthy since DR-1619 pointed it at `poetech.us`. It could not report and could not heal what it could not see.

## Decision

1. `probe()` names itself as a browser (`PROBE_UA`), as the app and the other witnesses do.
2. Nothing else changes. `is_up()`, the restore, its spacing and its one bounded restart are as they were; `/llm` is still read and never mounted.

## Verification

`test_funnel_watchdog.py` 35 green (33 before). Proven to catch: with the header removed the new test fails. After merge the box pulls on its next cycle; the proof is an `llm-dark` report in the `nas-funnel-report` job log, carrying the listening ports.

## What is NOT in this record

Ari does not answer yet. The service and the mount are written from the box's readout. If the watchdog now truly sees `/sb` dark some night, it will run its bounded restore as designed. `re-review: 2026-11-25`.
