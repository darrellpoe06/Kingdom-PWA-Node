# Church CUDA Orchestration — Verified Positions & Plan (2026-07-08)

**Status:** foundation landed + verified. Telemetry + self-orchestrator scaffolds are the next passes and **ship INERT** (Tier C, three brakes). Reality-trace per DR-0061/P15; every fact below was proven tonight, not assumed (Verification Doctrine / DR-0076).

## 1. The verified positions (the "new positions" the orchestration builds on)

Driven headless over SSH from `kingdom-home` (Darrell's home laptop) using one key: `C:\Users\dpoe\.ssh\id_ed25519_tlc`. Each command is a one-shot session; nothing resident is left on the boxes.

| Node | Tailscale | SSH user | Toolchain | GPU (nvidia-smi) | Ollama :11434 | App build |
|---|---|---|---|---|---|---|
| **tlcmediadpt** (register `dev-gpu-node-1`) | `100.69.19.13` | `creed` | node 24.18.0 / npm 11.16.0 / git 2.55.0 | **RTX 4070, 12282 MiB, drv 595.95 — VERIFIED** | **NOT responding — llm-inference UNVERIFIED** | **`npm ci` + `vite build` PASS** |
| **livestream-main-pc** (register `dev-gpu-node-2`) | `100.72.5.90` | `itdepartment` | node 24.18.0 / npm 11.16.0 / git 2.55.0 | **RTX 4070, 12282 MiB, drv 595.95 — VERIFIED** | **LIVE — qwen2.5:14b-instruct-q4_K_M, qwen2.5-coder:14b, nomic-embed-text — VERIFIED** | **`npm ci` + `vite build` PASS** |

**Fleet context:** `kingdom-home` (orchestrator seat, holds the key) · `poetech` NAS `100.70.190.47`/`192.168.1.26` (home primary, n8n Funnel, active) · `tlcrackstation` `100.66.173.22` (linux, offline ~28d — GPU-named, church location UNCONFIRMED) · plus the phone.

**Honesty line (what is NOT proven):** transcription (whisper :8771), voice-clone (XTTS :8770) and video-encode were **not** probed on either box. `llm-inference` is proven on the RIGHT box only. Those capabilities remain intent in the register (`smeNeeded:true`) until probed.

## 2. What landed this pass (ACTIVE)

- `app/src/lib/church-devices.js` — new `build` capability token; both GPU-node entries updated to verified identity (hostname, Tailscale IP, SSH user, toolchain, repo path, verified GPU, per-node Ollama status). GPU-job capabilities kept as flagged intent where unproven. **Verified:** 53/53 tests green (`gpu-scheduler`, `device-inventory-render`, `church-av-devices`) — the proven-to-catch Cage gate still holds.

## 3. What is next, and what ships INERT

Darrell's chosen shape (2026-07-08): telemetry = **build_runs (real) + heartbeat (inert)**; orchestrator = **box self-orchestrates**. Both the heartbeat and the self-orchestrator are autonomous/timer-driven → **CLAUDE.md "Autonomous Automation Requires Three Brakes" + RELEASE-TIERS Tier C**. They ship INERT (kill-switch engaged, ARMED absent, budgets 0, single-flight lock, append-only log) and are armed only by Darrell, attended.

1. **`build_runs` (ACTIVE):** Supabase table of REAL runs the orchestrator records (node, git SHA, PASS/FAIL, timestamp, duration). Needs RLS + authenticated grants on creation (else 403 — known trap). Surfaced in `DeviceInventory` + Ari's report. No fabricated "online" dots — the surface shows the real last run per node.
2. **`node_heartbeat` (INERT scaffold):** self-report table + the box-side poster, shipped off; arms into continuous live state later.
3. **Self-orchestrator (INERT, Tier C):** the box-side agent/loop that consumes the existing `gpu-scheduler.js` plan; ships behind all three brakes with an in-app arm/kill + observe surface.
4. **Ari reporting:** reads the single source (register + `build_runs`), no duplicated state.

## 4. Opportunities

- **On-demand GPU builds from home:** `main` can be built + smoke-tested on church RTX 4070 silicon headless — a sovereign build/verify tier independent of Vercel/Cloudflare/GitHub runners.
- **Sovereign LLM tier is real:** the RIGHT box already serves qwen2.5:14b + a coder model + an embedder — usable for llm-review, RAG, harvest title-ID, class-tutor without a cloud vendor.
- **Deterministic idle-GPU routing already exists** (`gpu-scheduler.js`) and now has two verified nodes to route to once GPU jobs are proven + armed.

## 5. Constraints (binding)

- **DR-0012 live-service guard:** never run inference on `livestream-main-pc` while it encodes the stream — it doubles as the livestream/Presenter box.
- **Three brakes / Tier C:** nothing autonomous self-activates; armed only attended, never while Darrell travels (2026-06-06 runaway precedent).
- **The key is the wall:** church-box remote access reduces to one passphrase-less key on `kingdom-home`; its protection = the laptop's security. Re-review whether to add a passphrase / scope `authorized_keys` to specific commands.
- **LEFT-box Ollama down:** `tlcmediadpt` cannot serve LLM jobs until Ollama is verified up there.
- **`tlcrackstation` offline ~28d;** not a usable node and its church location is unconfirmed.

## 6. Re-review (DR-0075)

- **2026-07-22:** re-review the SSH key posture (passphrase / command-scoping) and whether LEFT-box Ollama should be stood up.
- **Before any GPU job arms:** probe + verify whisper :8771 and XTTS :8770 on both boxes; do not advertise those capabilities as routable until then.
