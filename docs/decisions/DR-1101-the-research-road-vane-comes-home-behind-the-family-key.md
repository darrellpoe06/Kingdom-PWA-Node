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

## Governor's decision: the public door (2026-10-19)

Darrell said "Go" to `/research` as a new public path on the Funnel. The line that finishes it is `'/research/'` in `REHOMED_ROUTES` (`app/src/lib/native-shell.js`), so the installed app reaches the road the same way the website does.

**Opportunities**
- **Research from any device.** From a phone off the home network, a question is searched by our own SearxNG and answered by our own model. No vendor key is used, and nothing private goes to a vendor.
- **The pattern for the next four tools.** InvokeAI, ACE-Step, OpenShorts and Upscayl (DR-1099) can come home the same way: a loopback service, a forwarder with two verbs, the family key, and a daily witness.
- **A future input for lessons.** The lesson builder can draw on sourced research once the sourced-claim gate exists and the witness has passed live.

**Constraints, and what holds each one**
- **It is reachable from the internet.**
  - *What holds it:* the family key is checked on the NAS itself, and every path but `GET /health` and `POST /ask` gets a 404. Vane, which has no login, is never exposed; it listens on 127.0.0.1 only.
  - *What is left:* anyone can see that the door exists, and `/health` answers without the key. `/health` shows only whether the road is up and which model names it uses.
- **It costs compute.**
  - *What holds it:* one question at a time (a second is refused at once), 500 characters, 180 seconds, and the witness asks only once a day.
  - *What is left:* a holder of the family key could keep the tower's GPU busy one question after another. The key is the boundary.
- **The answers are unchecked.**
  - *What holds it:* every answer is marked `verified: false`; only http(s) sources are passed on, and the app checks that again.
  - *What is left:* a reader can still trust a wrong sentence. The panel says so, and nothing reaches a lesson until the gate for sourced claims exists.
- **There is one more thing to watch.**
  - *What holds it:* the `funnel_watchdog` re-mounts `/research` after a Funnel reset, and `research-health.yml` opens a rolling incident when the road goes dark.
  - *What is left:* it is one more service on the NAS that needs care.
- **The way to close it is plain.**
  - Set the services.json `research` entry to `enabled:false` and drop the Funnel mount. The app then shows "Not ready", and nothing else depends on the road.

## First live answers: the wrong machine was answering (2026-10-19)

**What happened.** The road installed itself and `/health` answered 200 with both models found. Yet the first three live witnesses all returned 504 "no answer within 180s". The diagnostic step (#2256) timed each stage on the NAS:
- **The tower URL Vane was given:** `http://127.0.0.1:11434`, the NAS's own CPU Ollama, not a GPU tower. The installer had fallen back to it because neither tower answered at 01:46 UTC.
- **That CPU with qwen2.5:14b:** it could not answer "Say OK." in 150 seconds. The NAS is a Xeon D-1527 with no GPU, and its Ollama unloads the model after each call (DR-0012), so every question reloaded 9 GB.
- **Vane's own log:** `HeadersTimeoutError` while waiting on that model.
- **SearxNG:** it was fine, with 20 results in 2.8 seconds. Brave rate-limited the search and DuckDuckGo showed a CAPTCHA, and the other engines covered for them.

**The mistake was mine.** I gave the installer the wrong machines, in the wrong order. It tried the RIGHT tower first, which is not expected to be always on and which feeds the stream. It never tried the LEFT tower, which `pipeline-nodes.json` names "THE designated AI worker". And it kept the NAS CPU as a last resort that cannot do this work.

**Fixed:**
- **Installer:** it tries GPU towers only, LEFT first, and never the NAS CPU. It records the tower it chose, or that none answered, in `/volume1/docker/research/ollama.url`.
- **Forwarder:** before `/health` or `/ask` it checks that tower directly, with a 4-second timeout. It also refuses during the DR-0012 streaming hold, which is the presence of `infra/gpu-scheduler/state/STREAMING_HOLD` in the NAS mirror. When a check fails, `/health` says why in plain words and a question is refused in seconds instead of hanging for three minutes.
- **Self-test:** it gains 7 checks. Proven to catch: when the tower check is mutated to always pass, 6 of them fail.

**Still open:** this fix makes the road honest. It does not turn a tower on. If both towers are off, or the LEFT tower's Ollama listens only on its own machine, the app will say so in those words until a tower answers. The installer looks again every 15 minutes.

**The second witness after the fix (2026-10-19, 03:09 UTC) was still a 504.** Vane still pointed at `127.0.0.1:11434`, and a question still hung for 180 seconds. That fits only two cases. Either the box had not pulled #2257 yet, or the installer found no tower and stopped. The second case was a second mistake of mine: the forwarder restart sat after the tower check, so with no tower the installer exited first. The old forwarder kept hanging, and the reason the new one would have given went unread.
- **Fixed:** the restart is now one step, `forwarder_follows_code`, that runs on both paths. With no tower, the forwarder still moves onto the new code before the installer stops, so the app hears why.
- **Proven:**
  - a stubbed run with no tower answering restarts the unit and stamps the code;
  - the new `research-road` test fails on the old installer.
- **The witness now says where the install stands.** It reports:
  - the box's checkout;
  - the tower it chose (or that `ollama.url` is absent);
  - the forwarder code that is running against the repo's;
  - whether each tower answers `/api/tags` from the NAS, with its models.

**What the new witness measured (2026-10-19, 03:29 UTC, run 39193961242):**
- **The box:** on `46b28e6` (#2257), before #2258.
- **The installer:** ran and found no tower; `ollama.url` was empty.
- **The forwarder:** still running the old code (`6840f585…`, against the repo's `415d7317…`). This is exactly the early exit #2258 removes.
- **From the NAS, port 11434 timed out on both towers** (`100.69.19.13` and `100.72.5.90`, 6 s each), and the OpenClaw lane's SSH to `tlcmediadpt` has failed since 2026-10-18. Neither tower was reachable that night.
- **What the next cycle does:** once the NAS pulls #2258, the app says "No AI tower was answering…" in seconds instead of hanging.
- **What it takes to answer:** the LEFT tower awake, with `church-ollama` up and both `qwen2.5:14b-instruct-q4_K_M` and `nomic-embed-text` pulled. The installer then picks the tower within 15 minutes.
