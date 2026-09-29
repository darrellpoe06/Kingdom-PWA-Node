# openclaw-tower — OpenClaw on the 4070 tower, local-first, behind our brakes

**Decision:** DR-0670 (Darrell, 2026-09-29: *"Can we make the open claw work on the towers?"*), answering the pending STEP 4 §4.6 entry in `docs/00-foundations/HYBRID-MODULAR-IMPLEMENTATION-PLAN.md`.

## What runs where

| Piece | Where | What it is |
|---|---|---|
| `church-ollama` | tlcmediadpt (LEFT tower, RTX 4070 12 GB, Windows, ssh as `creed`) | `infra/church-gpu-node` compose, `:11434`, `OLLAMA_KEEP_ALIVE=0` (DR-0012) |
| `poetech-openclaw` | same tower | the official image `ghcr.io/openclaw/openclaw:2026.9.6` pinned by digest, `127.0.0.1:18789` only |
| `plugin/poetech-gate.mjs` + `gate.mjs` | loaded by the gateway | the approval gate in front of every tool call |
| `run.mjs` + `brakes.mjs` + `lane.mjs` | run inside the image by the lane | the braked report-only pilot |
| `.github/workflows/openclaw-tower.yml` | GitHub runner, on the tailnet | ship, brake, fire, measure, record |
| `app/src/lib/openclaw-tower*.js` + OpsBoard strip | the app | the live status, unknown when unknown |

The model is **`qwen3:8b`**. From `docs/00-foundations/LOCAL-LLM-MODEL-PICKS.md` §1: Qwen3-8B beats qwen2.5:14b on ~15 benchmarks and Hermes 3 8B as well, at 8B speed. At Q4 it leaves room for OpenClaw's 32,768-token local context on 12 GB. A dense 14B at Q4 (~9 GB) does not leave that room. `params.keep_alive: 0` goes on every request, so OpenClaw cannot hold VRAM longer than DR-0012 allows.

## The configs (verified, not invented)

The keys in `openclaw.json` and `report.json` come from the docs shipped inside the `openclaw@2026.9.6` npm package: `providers/ollama/recipes.md`, `gateway/sandboxing.md`, `gateway/config-tools/tool-policy.md`, `gateway/config-extensions.md`, `gateway/config-channels/shared-policies.md` and `gateway/config-gateway.md`. Both files pass `openclaw config validate --json` under the real 2026.9.6 CLI on Node 24 (`valid: true`). The same validator rejects an invented key: it rejected `channels.defaults.dmPolicy`, so that key is not used here. The lane runs `config validate` again inside the pinned image on the tower **before** it starts the gateway.

- **Local-first, local-only:** one provider, `ollama`, at `http://host.docker.internal:11434` (the documented Docker path to a host Ollama). Every model reference is `ollama/…`. There are no fallbacks, no cloud host and no vendor key.
- **Sandbox:** `agents.defaults.sandbox.mode: "non-main"`. The Docker socket is **not** mounted, because giving the gateway the host's Docker would hand it the machine. Non-main sessions therefore have no sandbox backend, and their tool execution does not fall through to the host. *Unverified until the first armed run:* what OpenClaw reports when a sandboxed session's backend is absent. `re-review: 2026-10-06`.
- **DM policy:** `pairing` (unknown senders get a one-time code, and the owner must approve). It is written on the one channel block present, `channels.telegram`, which is `enabled: false`. **No channel is paired.**
- **Tools:** the `messaging` profile, with the runtime, nodes, automation and UI groups denied, plus loop detection. `report.json` denies every group.

## The approval gate (`gate.mjs`, loaded as `poetech-gate`)

The order is the policy:

1. **Bright line anywhere in the call → DENY.** The lines are money, credentials, PHI, the family's theological voice (on anything that sends or changes state) and irreversible OS actions. No approval can lift them.
2. **Report role asking to change state → DENY.**
3. **Known read → ALLOW.**
4. **Known send, post, write or state change → a human APPROVES it first.** OpenClaw's own contract is that an unanswered approval denies. `allow-always` is withheld, so the question is asked every time.
5. **Anything else → DENY** (default-deny, allowlist-up).

The gate also sets a per-run ceiling of 12 tool calls. Past that ceiling, every call in the run is blocked.

The real OpenClaw 2026.9.6 CLI loads it (`plugins inspect poetech-gate --runtime --json` → `status: loaded`, `activated: true`, typed hook `before_tool_call` at priority 1000).

## The three brakes (the AI class keeps all three)

| Brake | Where it bites |
|---|---|
| **Budget** | `--timeout` on every run, a hard wall-clock kill at timeout + 30 s, `max_turns` and `max_tool_calls` judged from the run's JSON envelope, `max_runs_per_day` per role, the gate's per-run tool-call ceiling, and `agents.defaults.timeoutSeconds` on the gateway |
| **Lock** | one gateway container; `run.mjs` takes an atomic lockdir, and a second fire that finds it held **skips**. A lock older than `stale_lock_seconds` is reclaimed. |
| **Kill** | `enabled: false` in `registry.json`, or deleting `ARMED-BY-RECORD`, in a PR. The lane reads both from main on every fire and **stops** the gateway / refuses the run. An overrun, or `max_consecutive_failures` failures, **auto-pauses** the role until a PR raises its `arm_epoch`. |
| **Hold** | `infra/gpu-scheduler/state/STREAMING_HOLD` present → the pilot does not run (DR-0012). |

## Roles

- **(b) chat-ops pilot, `chat-ops-report`: live, report-only.** Each fire, the lane reads the same lane facts the OpsBoard reads and carries them to the tower. One `openclaw agent exec` turn with no tools writes a short report into the witness record.
- **(a) family agent, `family-agent-eval`: evaluate.** The gateway is up on the tower's loopback with the gate loaded. No chat channel is paired: pairing a family channel is a new family-facing identity and needs a bot token only Darrell holds.
- **(c) build/CI: not adopted, ever** (STEP 4).

## Arming

Merging a change to this folder runs `openclaw-tower.yml`, which ships the folder, brings up Ollama, pulls `qwen3:8b`, validates, and starts the gateway. The schedule (every 6 h) fires the pilot and rewrites the witness record. The one precondition is the road: the tower must trust the CI key. `arm-voice-studio.yml` owns placing that key (DR-0581). Until it is placed, every fire records `unreachable` and goes red, and the OpsBoard strip reads **unknown**, with the reason given.
