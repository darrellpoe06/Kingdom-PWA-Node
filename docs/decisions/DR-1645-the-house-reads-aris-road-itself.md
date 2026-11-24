# DR-1645: The house reads Ari's road itself

**Date:** 2026-11-24
**Status:** Accepted (the reading; the mount and the service follow from what the box sends)
**Tier:** B (code the NAS runs unattended on its armed watchdog clock; read-only; a budget and a spacing; no mount, no restart)
**Type:** decision
**Area:** `infra/nas-loops/loops/funnel_watchdog.py` (`llm_step`, `llm_readout`, `listening_ports`, `llm_report_due`); `infra/nas-loops/test_funnel_watchdog.py`; `.github/workflows/nas-funnel-report.yml`; `scripts/workflow-budget.json`
**Sent in by:** Darrell, 2026-11-24, a child answered "Ari is resting": *"What happened?!!!! Kids can't ask simple questions?!!!"* His standing order on roads to a value the NAS holds (DR-1159): a runner over the tailnet first, his phone second, his hand last.
**Pairs with:** DR-1643 (the runner's probe), DR-1634 (Ari says why), DR-1360 (the NAS initiates the road), DR-1619 and DR-1624 (the watchdog reports first), DR-1159, DR-0076

## Context

DR-1643's probe ran once on main (run 45449773373, 17:33Z). It answered half the question and could not reach the other half.

## What was measured

- From a runner, with no key: `https://poetech.us/llm/health` answered 502 `error code: 502`; `https://poetech.tail5a2f35.ts.net/llm/health` answered 502 with an empty body. The road reaches the house and nothing behind `/llm` answers.
- The tailnet join failed five times with `backend error: invalid key: API key does not exist`. The key is gone, not merely expired.
- **A correction to DR-1643.** That record says "the tailnet join works again", read from the deploy's `Join the tailnet (repoint armed only)` step concluding success. That step concludes success without joining. The statement was wrong and is withdrawn here.
- The watchdog already runs on the box every 15 minutes and already sends its own state to GitHub by `repository_dispatch`. It reported only when `/sb` was dark, and its receiver wrote to a run summary no sandbox session can read.

## Impact

The box says what serves `/llm` without a key, a tailnet or a hand. Ari's outage becomes an incident on the ledger, opened by the house itself.

## Decision

1. On each pass where the public road is up, the watchdog asks `poetech.us/llm/health`. When it is dark it sends one `llm-dark` report: the ports that listen in the house's range and what each answers to `/llm/health` and `/health`, with the Funnel's own status. When it answers again it sends `llm-healed` once.
2. Brakes: at most sixteen ports, two three-second asks each; one dark report every six hours; a report that was not sent is tried again; a failure in this step is caught and never stops the watchdog. The rider's own lock holds the rest.
3. It mounts nothing and restarts nothing. `/llm` is still not a row in `SOVEREIGN_MOUNTS`, and a test holds that.
4. The receiver prints the box's words to the job log and opens the incident for `llm-dark`.

## Verification

`test_funnel_watchdog.py` 33 green (24 before): the ports parsed from `ss` and from `netstat`; only listening ports asked; the cap; dark, spacing, healed once, silence when never dark; one report sent and state kept; a failed send retried. Proven to catch that it is read-only: the only commands run are `ss` and `netstat`. The receiver parses and its script passes `node --check`. After merge: the box pulls main on its own clock, and its first `llm-dark` report is read from the `nas-funnel-report` job log.

## What is NOT in this record

Ari does not answer yet. If the box's checkout does not advance, or its GitHub token is absent, no report comes and that is the next thing to read. `re-review: 2026-11-25`.
