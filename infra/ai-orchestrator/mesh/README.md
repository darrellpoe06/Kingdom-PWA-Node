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

## Reality note (2026-06-29)

The home node is verified and live (CPU-only). The church GPU node and church RackStation are
**not on the mesh yet** (2026-06-10 probe: firewalled / GPU boxes absent). This registry is *ready*
for them; it does not assume they exist. The 2× RTX 4070 live in companion CUDA boxes on the church
LAN, **not** in the Synology — `church-cuda` is the GPU node, `church-rs` is the storage node.
