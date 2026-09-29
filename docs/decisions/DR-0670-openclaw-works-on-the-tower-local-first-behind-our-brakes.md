---
id: DR-0670
title: OpenClaw works on the tower, local-first and behind our brakes; the chat-ops pilot reports, the family agent is evaluated, build/CI never
date: 2026-09-29
status: accepted
supersedes: []
superseded-by: null
tier: C (an autonomous AI agent; ships with its proof and all three brakes, and starts through the lane per DR-0247)
entities: [poetech]
grounds: [THREE-BRAKES, VERIFICATION-DOCTRINE, REALITY-TRACE, APP-IS-PRIMARY-ARTIFACT, NOTHING-WAITS, DRIVE-DONT-DELEGATE, SOVEREIGN-PYTHON-AND-LOCAL-AI]
source: Darrell, 2026-09-29, verbatim -- "Can we make the open claw work on the towers?" -- his decision on the pending HYBRID-MODULAR-IMPLEMENTATION-PLAN STEP 4 s4.6 entry
---

## Context

STEP 4 of `docs/00-foundations/HYBRID-MODULAR-IMPLEMENTATION-PLAN.md` evaluated OpenClaw on 2026-06-17 and held a decision entry open (s4.6, `DECISION: ____`). Its verdict had seven parts. OpenClaw is MIT and self-hostable. It is sovereign only when configured Ollama-local-first. It has no per-action approval gate of its own, so it sits behind our brakes with a gate in front. The bright lines are hard-denied: money, credentials, PHI, the family's theological voice, and irreversible OS actions. Role (a), the family/community action agent, is EVALUATE. Role (b), chat-ops, is a report-only pilot. It stays out of build/CI.

Darrell answered it on 2026-09-29: *"Can we make the open claw work on the towers?"* His words authorize making it work on the towers. They change nothing else in the verdict, so the verdict stands.

## Reality-trace (what was verified, and what could not be)

**The towers.** `infra/device-availability/pipeline-nodes.json` lists two:

- **LEFT, `tlcmediadpt`** (tailnet 100.69.19.13, LAN 192.168.1.75). Windows, reached over OpenSSH as `creed` with PowerShell (DR-0579). RTX 4070, 12,282 MiB (nvidia-smi 2026-07-08). It is *"THE designated AI worker"*, does not feed the NovaStar, and is `required` + `expected_always_on`. **This is the target.**
- **RIGHT, `livestream-main-pc`**. Also a 4070, and it ran Ollama 2026-07-08 (qwen2.5:14b-instruct, qwen2.5-coder:14b, nomic-embed-text). But it feeds the wall, is `required:false`, and DR-0012 gives live work absolute priority there. **Not a target.**

**The road.** `arm-voice-studio.yml` reaches the 4070: tailnet via `TS_AUTHKEY`, ssh as `creed` with `NAS_SSH_KEY`, and the folders shipped by scp. **The premise that "CI's SSH key was placed on it for the voice studio" is NOT true today.** The last arm run, 36005924144 on 2026-09-24, recorded the following:

- *"the tower refuses the CI key for creed"*
- *"the NAS holds no key road"*
- `secrets.TOWER_CREED_PASSWORD set: false`
- `dialect=none`

The earlier runs 1-3 were refused too (DR-0568 / DR-0579). The voice studio has therefore never been armed on the 4070 by CI. The NAS reaches the tower only as an HTTP client (`infra/voice-studio/install.sh` probes `tlcmediadpt:8770`); it does not deploy to it.

**Ollama and models.** `infra/church-gpu-node/docker-compose.yml` declares `church-ollama` for the tower, with `OLLAMA_KEEP_ALIVE=0`. **Whether it is running on tlcmediadpt is not verified**: no run has ever got inside the box, and the device manifest lists no Ollama there. For the model, `LOCAL-LLM-MODEL-PICKS.md` has no row for a 12 GB card, so the pick reads its §1:

- Qwen3-8B beats qwen2.5:14b on ~15 benchmarks.
- Qwen3-8B dominates Hermes 3 8B.
- Hermes 3's GGUF ships an 8K default context.

A dense 14B at Q4 (~9 GB) leaves no room on 12 GB for OpenClaw's 32,768-token local context. **Choice: `qwen3:8b`, `num_ctx` 32768, `keep_alive: 0`.** The VRAM fit is an estimate until the first armed run measures it.

**OpenClaw itself** was verified against its official artifacts rather than taken from memory. `docs.openclaw.ai` is blocked by this sandbox's egress, so the evidence came from the package, the registry and the tagged repo:

| Fact | Evidence |
|---|---|
| Package and version | npm `openclaw` latest = **2026.9.6**, MIT, Node >=24.16 |
| Official image | `ghcr.io/openclaw/openclaw:2026.9.6`, index digest `sha256:0a5ff5e6…12e15` |
| Config keys | the docs shipped inside the 2026.9.6 package |
| Gateway command and hardening | the official `docker-compose.yml` at tag v2026.9.6 |
| Both configs are valid | `openclaw config validate --json` under the real 2026.9.6 CLI on Node 24.21 returned `valid: true` for both |
| The validator catches invented keys | it rejected `agents.defaults.sandbox.madeUpKey` and `channels.defaults.dmPolicy` (the second is therefore not used) |
| The gate plugin loads | `plugins inspect poetech-gate --runtime --json` returned `status: loaded`, `activated: true`, typed hook `before_tool_call` at priority 1000 |

One s4.3 finding moved. OpenClaw now has exec approvals (`tools.exec`, session permission modes) and a plugin `before_tool_call` hook that can block or require approval. That hook is the mechanism our gate uses. It is not a general gate *of OpenClaw's own* on sends and posts, so the condition "a gate in front, supplied by us" still holds, and we supply it.

## Impact

- **If unresolved:** the s4.6 entry stays `DECISION: ____`, open since 2026-06-17, and Darrell's ask to make OpenClaw work on the towers is not built.
- **What the call obligates:** an autonomous AI agent on a family machine runs only with all three brakes and our gate in front of every tool call. The bright lines (money, credentials, PHI, the family's theological voice, irreversible OS actions) are denied, and no approval lifts them. Role (a) stays unpaired until Darrell's word and his bot token. Build/CI is never in its reach. The OpsBoard strip never reads green without a fresh record.
- **Until the CI key is trusted on the tower:** every fire records *unreachable* and goes red, and the strip reads unknown with that reason. Gateway health, the model's VRAM fit and the sandbox behaviour stay unmeasured until the first fire after the key is placed.

## Decision

1. **OpenClaw runs on `tlcmediadpt`.** It uses the official image pinned by tag and digest, is published on `127.0.0.1:18789` only, and runs with no docker socket. Our config and gate are mounted read-only. The model is `church-ollama` on the same box, reached through `host.docker.internal`. The config has one provider, no fallbacks, no cloud host and no vendor key. Non-main sessions are sandboxed. DM policy is `pairing`, and no channel is enabled. Folder: `infra/openclaw-tower/`.
2. **The approval gate sits in front of every tool call** (`gate.mjs`, loaded as the `poetech-gate` plugin). It applies these rules in order:
   - Any bright line → **deny**; no approval lifts it.
   - The report role asking to change state → **deny**.
   - A known read → **allow**.
   - A known send, post, write or state change → **a human approves first**. Asked every time; an unanswered request is a no.
   - Anything else → **deny**.
   The gate also holds a per-run ceiling of 12 tool calls.
3. **All three brakes.** OpenClaw is the AI class, which keeps all three under the 2026-07-29 amendment.
   - *Budget:* `--timeout`; a wall-clock kill at timeout + 30 s; `max_turns` and `max_tool_calls` judged from the run envelope; `max_runs_per_day`; `agents.defaults.timeoutSeconds`.
   - *Lock:* one gateway; an atomic lockdir in the runner; a second fire skips.
   - *Kill:* `registry.json` `enabled:false` or deleting `ARMED-BY-RECORD`, in a PR. The lane reads both from main every fire and stops the gateway or refuses the run. An overrun or repeated failure auto-pauses a role until a PR raises its `arm_epoch`.
   `STREAMING_HOLD` is honored (DR-0012).
4. **Roles.**
   - (b) `chat-ops-report` is **live and report-only**. Each fire hands it the lane facts the OpsBoard reads; it runs one `openclaw agent exec` turn with no tools and writes a short report.
   - (a) `family-agent-eval` is **evaluate**. The gateway is up with the gate loaded, but **no channel is paired**. Pairing a family chat channel is a new family-facing identity and needs a bot token only Darrell holds (a DR-0111 carve-out 1 item), so it waits on his word.
   - (c) build/CI: **never**.
5. **It starts itself through the lane** (DR-0247). The committed `ARMED-BY-RECORD` is the arm. `.github/workflows/openclaw-tower.yml` fires on every merge that touches the folder: it ships the folders, brings up Ollama, pulls the model, runs `config validate` inside the pinned image *before* starting the gateway, fires the pilot, and measures. It also fires every 6 h to enforce the kill, fire the pilot and measure.
6. **In the app.** An OpsBoard strip shows *OpenClaw — the 4070 tower*: up/down, the model, the last run, and the brakes. It reads live from the `openclaw-tower` issue that the lane rewrites. If there is no record, the tower was unreachable, the record is stale (>13 h) or the health was not read, the strip shows **unknown** with the reason in words, never green.

## What only Darrell can do

**The tower must trust the CI key.** That needs one value only he holds: creed's Windows password, set once as the repository secret `TOWER_CREED_PASSWORD`. `arm-voice-studio.yml` then places the key (DR-0581), and the secret can be deleted afterwards. After that, the next `openclaw-tower` fire deploys with no one watching. Until then every fire records *unreachable*, goes red, and the strip reads unknown with that reason.

## Verification

- `app/src/__tests__/openclaw-tower.test.js`: **82 tests**. They cover:
  - every bright line denied;
  - state changes routed to approval, and the report role limited to reads;
  - unknown tools denied;
  - the per-run budget in the real handler;
  - the registry rules;
  - kill, hold, lock and budget in order;
  - the overrun and failure pauses;
  - the real `run.mjs` against a fake OpenClaw CLI: runs; no-go on kill, lock, budget and hold; auto-pauses on a timeout and refuses the next fire; passes the pinned config, model and timeout;
  - the config (local-only, the 4070 model, keep_alive 0, sandbox, pairing, no vendor key, image pinned by digest, loopback, no docker socket, validate-before-start);
  - the record round trip;
  - the surface derivation, with every unknown case.
- **Proven to catch** by mutation:
  - removing the bright-line check → 11 red;
  - disabling the lock → 2 red;
  - bypassing the auto-pause → 2 red.
- The workflow parses. Every `run:` block passes `bash -n`. Its two inline node steps run locally: record → body → parse.
- **Not yet measured:** gateway health on the box, the model's VRAM fit, and the no-backend sandbox behaviour. All three wait on the first fire after the key is placed. `re-review: 2026-10-06`.
