# Sovereign Mesh — node/capability registry

`nodes.json` is the **declarative source of truth** for capability-routed federation across the
PoeTech NAS mesh (home DS1621xs + church site). It is read by the job router; it is **not** an
active service and editing it **arms nothing**.

> Full design + rationale: `docs/99-session-notes/2026-06-29-research-review-sovereign-mesh-two-nas-replication-federation.md`

## How routing uses it

1. A job declares what it **needs** (`requires: ["gpu"]`, `["cpu"]`, `["whisper"]`, …).
2. The router picks the node whose declared `caps` is a **superset** of `requires`, is
   **health-green**, cheapest/closest first. This is the same picker shape as
   `scripts/wake-router.mjs` + DR-0073, generalized from a *vendor* axis to a *node* axis.
3. **No matching healthy node → the job HOLDS** (logged), it never runs on the wrong hardware.
4. Selection is **deterministic** ([[project-deterministic-first-ai-only-necessary]]) — no model in
   the dispatch decision. The LLM is only ever the *worker* on the chosen node.

## Invariants (binding)

- **Private/sovereign work → local-only, ALWAYS.** A `private: true` job class never falls back to
  a cloud vendor; if its node is offline it **waits** (TLC firewall / DR-0073).
- **Brakes still gate everything.** Routing passes through each node's Cage brakes
  (`infra/ai-orchestrator/portable/orchestrator/lib/brakes.sh`: KILL_SWITCH / ARM / lock / budget)
  **plus** the mesh-wide kill-switch, which **fails closed** (unreachable = engaged).
- **`SME-CONFIRM` = offline.** Any node/endpoint still marked `SME-CONFIRM` is treated as offline by
  the router. Real values are filled in by Darrell/BG (church hardware, GPU-endpoint IP, church NAS
  access — research-review §6). Never fabricate an IP or a spec.

## The two church towers are local-coder workers (not just inference)

`church-tower-1` and `church-tower-2` each run **Aider + Ollama + `qwen2.5-coder:14b`** (the Cage's
existing `OLLAMA_CODER_MODEL`, fits one 4070 per DR-0012) as a **networked sovereign coding worker**
addressable across Tailscale. Two towers = **two routine build/transcription/voice jobs in parallel**
+ the home NAS. Tiered dispatch:

- **`code-reasoning-hard`** (heavy / novel / ambiguous) → **vendor Claude** (`vendor-only`).
- **`code-build-routine`** (well-scoped / bounded) → **local towers, in parallel** (`local-first`).
- **Honest limit (DR-0076):** local coders are weaker on hard reasoning → **well-scoped tasks only**;
  on a task that proves hard, **escalate** — never ship a confident-wrong diff. A local diff passes the
  same gates (tests / build / guards) before it is trusted. (Ties the Aider auto-commit lane —
  2026-06-01 sovereign-LLM-teams review; `local_7e8eed31` Hermes/OpenClaw.)

One large model is resident at a time per 12 GB box (DR-0012), so coder vs whisper/voice **contend** —
schedule, don't co-pin; and DR-0012 service-time preemption stops heavy model work during live service.

## DB layer — DR-0080 (hybrid edge-shield + sovereign canonical)

The `db_topology` block in `nodes.json` encodes **DR-0080**, the DB instantiation of this mesh's
single-writer-per-datum invariant:

- **Supabase cloud = the PUBLIC edge/shield** — all internet exposure + auth (GoTrue). Not a mesh
  node; the buffer in front of it. A home outage never takes down poetech.us.
- **Home NAS = the PRIVATE sovereign canonical** — reachable only over Tailscale/LAN, **never a
  public port**. It participates as a **subscriber that dials OUT** (zero inbound exposure).
- **One-way sync per tier** (no datum has two writers): **Tier-P** (public/operational) → Supabase
  writes, replicate downstream cloud→NAS via Postgres logical replication; **Tier-S** (family
  financial/legal, TLC/PHI, DR-0003) → NAS writes, stays home, never pushed to cloud.
- **Church NAS = encrypted sealed-blob backup** — stores, never reads.

Execution is dependency-gated on Darrell's per-phase go (DR-0080 P0→P4); nothing arms unattended.
The **always-on build driver** (`scripts/orchestrator-v0/v05.mjs`) is resident on `home-ds1621xs`
and dispatches build lanes through this registry — see
`docs/99-session-notes/2026-07-01-sovereign-mesh-both-sites-go-turnkey.md`.

## Reality note (2026-06-29)

The home node is verified and live (CPU-only). The two church towers and the church RackStation are
**not on the mesh yet** (2026-06-10 probe: firewalled / GPU boxes absent). This registry is *ready*
for them; it does not assume they exist. The 2× RTX 4070 live in the OBS/ProPresenter boxes on the
church LAN, **not** in the Synology — `church-tower-1/2` are the GPU+coder nodes, `church-rs` is the
storage node.
