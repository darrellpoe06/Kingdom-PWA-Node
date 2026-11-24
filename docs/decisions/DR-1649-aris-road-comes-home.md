# DR-1649: Ari's road comes home

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** B (a request-driven service the NAS starts unattended on its armed services-sync clock; no timer of its own; one public Funnel mount, added only after the door answers on loopback)
**Type:** decision
**Area:** `infra/nas-llm/` (`install.sh`, `poetech-llm.service`, `llm_server.py`, `ollama_health.py` `chat_gate`); `infra/nas-loops/services.json` (`llm`); `funnel_watchdog.py` `SOVEREIGN_MOUNTS`; `.github/workflows/funnel-health.yml`, `llm-road-probe.yml`; `infra/nas-transport/RECORDED-STATE.md`; `scripts/system-flow-registry.mjs`
**Sent in by:** Darrell, 2026-11-24, a child answered "Ari is resting right now" on a one-word question: *"What happened?!!!! Kids can't ask simple questions?!!!"*
**Pairs with:** DR-1647 (the watchdog asks as the app does), DR-1645 (the house reads Ari's road), DR-1634 (Ari says why), DR-1119 (a service comes home by one Way), DR-0218 (zero n8n), DR-0236, DR-0076

## Context

DR-1647 merged at 19:22Z. On its next cycle the house sent its first report ever (`nas-funnel-report` run 45471214852, 19:32Z). That confirms DR-1647's cause: the watchdog now reads 502 where it read "up".

## What was measured

From the box's own readout, at head `386e019a6`, uptime 33 days:

- Fourteen ports listen in the house's range. None answers `/llm/health`. Every port that answers `/health` already belongs to another mounted service.
- The Funnel carries twelve path rows. `/llm` is not one of them.
- Ollama listens on 11434.
- `llm_server.py` has been in the repo since 2026-07-21 with no installer and no entry in `services.json`. Its README said to start it by hand, on port 8791, which is Scribe's.
- With `LLM_BRIDGE_TOKEN` unset the server answered every caller. On a public mount that is an open model.

Not measured: which models Ollama holds. `/llm/health` lists them once the door is up.

## Impact

Ari, talk-about and the thought pass have had no backend on the NAS. Every question fell to the authored fallback.

## Decision

1. `infra/nas-llm/install.sh` joins services-sync as `llm`, enabled (DR-0247). It reads the existing family bridge key and never makes one, builds the venv once, keeps `poetech-llm.service` on `127.0.0.1:8804` following the repo's code, and mounts `/llm` only after the door answers on loopback.
2. The door fails closed: with no key it refuses every chat (503, with the reason); a wrong key is 401. Health is open and says why in words.
3. Each route answers with and without the `/llm` prefix, because the Funnel strips the mount path.
4. `/llm` becomes a recorded row the watchdog restores and the Funnel witness asks, at the port the unit names; a test holds the three to one number.

## Verification

`test_ollama_health.py` 13 green (10 before): no key refuses everyone, the right key opens, a wrong or missing key is refused. `test_funnel_watchdog.py` 35 green. The server was run under FastAPI's test client: both paths of both routes answer, 401 without the key, 503 with none set. `a-service-comes-home` 15 green with `llm` on the Way; interconnect-guard 0 findings. After merge: the box installs on its next cycle and sends `llm-healed`, or `/llm/health` says in words what is missing.

## What is NOT in this record

Whether `qwen2.5` is pulled on the box, and how long the first answer takes on its hardware. If the model is absent Ari still cannot answer, and the health door will say so. A device with no family key provisioned is refused by design. `re-review: 2026-11-25`.
