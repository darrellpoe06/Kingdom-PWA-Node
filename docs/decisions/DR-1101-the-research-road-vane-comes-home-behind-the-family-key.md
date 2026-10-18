# DR-1101: The research road: Vane comes home behind the family key

**Date:** 2026-10-18
**Status:** accepted
**Tier:** B (a new self-deploying NAS service and a new public Funnel path, both behind the family key; additive, request-driven, no timer)
**Type:** infrastructure
**Area:**
- `infra/nas-research/` (`docker-compose.yml`, `searxng.seed.yml`, `research_forwarder.py`, `poetech-research.service`, `install.sh`)
- `infra/nas-loops/services.json` (the `research` entry, registered last) and `infra/nas-loops/loops/funnel_watchdog.py` (the `/research` mount healed with the sovereign rows)
- `infra/nas-transport/RECORDED-STATE.md` (the `/research` row)
- `app/functions/research/[[path]].js`, `app/public/_routes.json`, `infra/cf-roads-worker/worker.js` and `wrangler.toml` (the same-origin road and its second door)
- `app/src/lib/research.js`, `app/src/components/ResearchTry.jsx`, mounted in `OpenSourceCandidates.jsx` on the Infra Plan
- `.github/workflows/research-health.yml` (the witness) and `.github/workflows/ci.yml` (the forwarder's selftest gates merge)
- `scripts/system-flow-registry.mjs` (the app node, the witness, the NAS rider and `http:research`)
- `app/src/lib/open-source-candidates.js` (Vane's next step now names what was built)

**Amends:** nothing. Carries out DR-1099's first pilot. Grounds: DR-0076 (verification; nothing unverified is presented as checked), DR-0756 (the locked-door forwarder shape the cameras use), DR-0247 (agreed work starts itself through the lane), DR-0266 (pinned images).
**Declared by:** Darrell, 2026-10-18: "Go get all these repos and integrate them into our technology stacks..." and then "When should I expect those github repositories to be operational and test ready for me to use them and see their capabilities? Timeline...."

## Context

DR-1099 weighed the ten repositories Darrell sent and named five to bring home. Vane was first, on the NAS, with a stated next step: "Vane slim plus SearxNG, loopback only, a /research forwarder behind the family key, and a witness that asks one question and checks a source URL comes back." Its review date was 2026-10-25. Everything that step needs can be built and verified from here, so it was built the same day (DR-0236).

Three facts read from the source at the pin decided the shape:
- **No login.** Vane has no authentication of any kind; its README lists login as a future feature. So nothing of Vane may be reachable from outside the box. The forwarder is not a proxy: it serves `GET /health` and `POST /ask` and answers 404 to every other path, Vane's pages and API included.
- **The single image's sudo.** The single image adds passwordless sudo for its bundled search user (Dockerfile line 71). The slim image is used instead, with our own SearxNG container beside it.
- **Headless setup.** Vane seeds its model provider and search engine from `OLLAMA_BASE_URL` and `SEARXNG_API_URL` on start (`src/lib/config/index.ts`, `initializeFromEnv`), so no setup screen is ever needed. Provider ids are random UUIDs made on first start, so the forwarder looks them up on every question and never stores one.

## What was measured

- **Image pins, read from Docker Hub on 2026-10-18:**
  - Vane `slim-v1.12.2` is digest `sha256:d2878cf9…`, the same v1.12.2 release whose source (git `9e8d8837`) was read for DR-1099.
  - SearxNG `2026.10.13-22c64b8d3` is digest `sha256:9b61996e…`, AGPL-3.0, run unmodified, on loopback, serving only Vane.
- **Listening addresses:**
  - SearxNG listens on 8080 inside its container (`GRANIAN_PORT`, container Dockerfile) and is published on `127.0.0.1:8798` only.
  - Vane's Next.js standalone server takes `HOSTNAME` and `PORT`, so it binds `127.0.0.1:3017` on the host network.
  - Host networking is what lets Vane reach the tower's Ollama over the tailnet, the way go2rtc reaches the cameras.
- **Models:** the right tower (`100.72.5.90`, `pipeline-nodes.json`) serves `qwen2.5:14b-instruct-q4_K_M` and `nomic-embed-text:latest` (`llm-providers.js`). Those are the chat and embedding models the forwarder prefers.
- **`research_forwarder.py --selftest`:** 38 checks, all passing, against a fake Vane on loopback.
  - Proven to catch: a copy with the bearer check replaced by `return True` and the URL filter removed fails 2 checks (the wrong key, and a `javascript:` or `file:` source).
- **`research-road.test.jsx`:** 15 tests on the app side. It pins the mirrored length cap against the forwarder's own constant, and shows that a `javascript:`, `file:` or `data:` link is never drawn. It also shows that a 200 without `ok: true` never reads as live, that no question is sent without the family key, and that the whole road is wired end to end.
- **The repo's own gates:** the services-sync, funnel-actuation, pages-routing, second-door, client-path-parity and n8n-is-gone tests pass, as do the interconnect guard (189 nodes, 473 connections, 0 findings) and `verify:gates`.

## Decision

The research road is built and self-deploys on merge (DR-0247). The installer starts nothing unless the family key exists AND a reachable Ollama serves both a qwen chat model and `nomic-embed-text`. It tries the right tower by tailnet IP, then by name, then the NAS's own CPU Ollama. It seeds SearxNG's settings once with a fresh secret and never overwrites them. It mounts `/research` on the Funnel only after SearxNG answers `/healthz`, Vane answers `/api/providers` and the forwarder answers `/health` 200.

Every answer leaves the NAS marked `verified: false` with a sentence saying the `[n]` marks are the model's, unchecked. Only http(s) sources are passed on, and the app re-checks that before it draws a link. A research answer enters a lesson only through the verification gates, never straight from this road (DR-0076).

The brakes are not the timer class (request-driven, no clock), but a public door still has bounds: one question in flight (the next is refused at once, never queued), 500 characters, 180 seconds per answer. The witness asks one question a day and on dispatch, with a ten-minute ceiling and one run at a time.

## Impact

Darrell can try the first of his ten tools in the app: Infra Plan, "Open-source tools, weighed", "Try Vane". The panel reads the road's own `/health`, so it says "Not ready" with the NAS's own reason until the road is up, and "Live on the NAS · answering with qwen2.5:14b…" when it is. Research that needs sources now has a search we own, on a model we own, with no vendor key and nothing private sent to a vendor. The cost is one more public path on the Funnel. It is closed by the family key, and nothing behind it can do more than answer a question.

What it does not do yet: no lesson reads from it. Wiring research answers into the lesson builder waits until the witness has passed on the live road and the verification gate for sourced claims exists. `re-review: 2026-10-25`.

## Verification

- CI: `research forwarder selftest` (ci.yml), `research-road.test.jsx`, and the transport, routing and flow-graph gates named above.
- Live: `research-health.yml` asks one question through the real door from a runner on the tailnet. It passes only when an answer and an http(s) source come back still marked unverified. A failure opens one rolling issue labelled `incident` + `research-incident`, which the OpsBoard ledger reads; the next pass closes it.
- `re-review: 2026-10-25`. The witness has passed live (or its incident names why not); the answer quality on three real research questions has been read by a person; and the decision on wiring it into the lesson builder has been made.
