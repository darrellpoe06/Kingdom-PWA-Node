# DR-1643: Ari's road is read before it is mounted

**Date:** 2026-11-24
**Status:** Accepted (the probe; the mount and the service are the next record, written from what it reads)
**Tier:** A (one dispatch-only, read-only workflow; nothing on the NAS is restarted, written or mounted)
**Type:** decision
**Area:** `.github/workflows/llm-road-probe.yml` (new); `scripts/system-flow-registry.mjs` (`http:llm`); `scripts/workflow-budget.json`; `app/src/lib/workflow-register.json`
**Sent in by:** Darrell, 2026-11-24, a child's question answered "Ari is resting": *"What happened?!!!! Kids can't ask simple questions?!!!"* DR-1634 fixed what the screen says and left the cause not verified.
**Pairs with:** DR-1634 (Ari says why), DR-0218 (the house's own model on `/llm`), DR-1619 and DR-1624 (the Funnel watchdog), DR-1360 (the NAS initiates), DR-1409 (a workflow that does not parse runs nothing), DR-0076

## Context

Ari's answers travel `poetech.us/llm/chat` to the house's own model on the NAS. After the outage of 2026-11-23 to 24 the twelve watched doors answer again; `/llm` is not one of them, and no session has seen what serves it.

## What was measured

- `/llm` is in neither `funnel_watchdog.py SOVEREIGN_MOUNTS` nor `funnel-health.yml MOUNTS`.
- `infra/nas-loops/services.json` installs no LLM server. `infra/nas-llm/llm_server.py` and its README give it port 8791; `services.json` gives 8791 to the installed `poetech-scribe.service`; `scribe_queue_consumer.py` gives the LLM 8772, which the watchdog gives to `/voice-lite`. Three files, three answers.
- The system flow graph had no node for `/llm` at all.
- The sandbox cannot read it: `curl` to `poetech.us/llm/health` and to the Funnel name both end at the proxy with 403.
- No dispatchable workflow reads the NAS's ports without also acting: `scribe-health`, `libraries-health` and `immich-health` each print one port and only on a failed verdict; `nas-signin-heal` restarts containers.
- The tailnet join works again: the deploy of `134c2fa` joined at 16:36Z (run 45438069885).

## Impact

The next change to Ari's road is written from a reading of the box, not from three files that disagree. Until then nothing about the NAS changes.

## Decision

1. A dispatch-only workflow, `llm-road-probe.yml`, reads and prints: `/llm/health` from outside on both public names; then over the tailnet the Funnel's mounts, the listening ports in the house's range, which port answers `/llm/health` and `/health`, Ollama's model list, the `poetech-*` units, and any Caddy route naming `llm`. Output is scrubbed of anything key-shaped and cut to 240 characters a line.
2. It writes nothing, restarts nothing and mounts nothing. Its brakes are a timeout of eight minutes and a concurrency group.
3. `/llm` is added to the watchdog and the witness only with the port this prints, in the record that follows.
4. `http:llm` is declared in the flow graph with its outside source named.

## Verification

The workflow parses (`yaml.safe_load`; five steps, one trigger) and every `run` block passes `bash -n`. The first draft did not parse: a one-line `run:` held a colon and a space (DR-1409's fault), caught before the push. `interconnect-guard`: 258 nodes, 0 findings. `workflow-register`: 108 workflows, 23,649 lines, at the ceiling raised by hand with its reason. After merge: dispatched once, its output read, and the reading written into the next record.

## What is NOT in this record

Ari does not answer yet. Whether his server was running before the outage is not known. `re-review: 2026-11-26`.
