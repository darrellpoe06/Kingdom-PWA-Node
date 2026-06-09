# Sovereign AI Orchestrator — Architecture Blueprint (2026-06-09)

Layer 4 working artifact. Production blueprint for the PoeTech sovereign AI
engine ("The Cage"): local-first inference, an immutable audit registry, and
hard governance boundaries on what an autonomous agent may touch.

Deployable configs live in `infra/ai-orchestrator/`. This doc is the *why* and
the *map*; the compose files and Cage scripts are the *what*.

## 1. Node map (ratified 2026-06-09)

| Node | Hardware | Role | AI compute window |
|------|----------|------|-------------------|
| **Node 1** — Legion PC (Pristine AI Core / OBS) | 1x RTX 4070, 12 GB VRAM | Ollama (GPU) + n8n + Uptime Kuma | Mon–Sat / off-hours only |
| **Node 2** — Church Production Switcher | 1x RTX 4070, 12 GB VRAM | NDI Router, Studio Monitor, Proclaim | **Forbidden** during church hours |
| **Registry** — Synology NAS | DS-class, Docker | Postgres 16 + pgvector (immutable Master Registry + backups) | n/a |

**Correction carried in from the source spec:** an earlier draft described Node 1
as a "dual RTX 4070 cluster." The real topology is **two separate single-4070
machines** — Node 1 and Node 2 — not a two-GPU cluster in one box. Two physically
separate hosts are not an inference cluster; Ollama runs one model on one card.
The v2 spec corrected this and it is reflected above.

**Registry placement:** the immutable ledger lives on the **NAS, not Node 1**, so
it survives an OBS-box reimage and the agent that writes to the ledger cannot also
rebuild the box that stores it. Compute is ephemeral; the registry is sovereign
truth.

## 2. Model strategy on a 12 GB 4070

- **Architect:** `qwen2.5:14b-instruct-q4_K_M` (~9 GB) — fits VRAM, no CPU spillover.
- **Builder:** `qwen2.5-coder:14b` (~9 GB) — the model used for actual coding/build work.
- **Embeddings:** `nomic-embed-text` (~275 MB) — feeds NAS pgvector.

Only **one 14B is resident at a time** on a 4070; Ollama swaps on demand. The
spec's "never 32B+" rule is correct — a 32B Q4 (~20 GB) spills to CPU and crawls.

## 3. The Cage — enforced governance boundaries

Every autonomous action passes through `infra/ai-orchestrator/scripts/guarded-action.sh`.
These are enforced in code, not just stated:

1. **Allowlist** — only action scripts present in `actions/` AND named in
   `ACTIONS_ALLOWLIST` may run. Unknown action → `refused` ledger row, no side effect.
2. **VLAN guard** — any action whose params reference a protected VLAN
   (`PROTECTED_VLANS`, e.g. tithing/financials + live production) is refused
   before execution. The AI cannot alter routing on those VLANs.
3. **Append-only audit** — each lifecycle step (`proposed → executed |
   rolled_back | refused`) is INSERTed into `ai_audit_ledger`. UPDATE/DELETE are
   blocked by both role privilege (the `ai_agent` role gets INSERT+SELECT only)
   and a trigger that raises for everyone. Rows are SHA-256 hash-chained, so a
   single tampered/removed row breaks the chain (verify via `ai_audit_ledger_verify()`).
4. **Health gate + 120 s rollback** — after `apply`, the action only sticks if
   Uptime Kuma's status-page heartbeat reports all monitors UP within
   `ROLLBACK_DEADLINE` (120 s). Otherwise the action's own `rollback` runs
   automatically and the ledger records `rolled_back`.
5. **Schedule boundary** — heavy compute is operator-scheduled to off-hours;
   Node 2 AI workloads are forbidden during church hours (Sun/Wed).

Action scripts implement a three-verb contract — `snapshot` / `apply` /
`rollback` — so rollback is always defined before apply runs.
`actions/example-action.sh` is the safe template.

## 4. Network & sovereignty

- **Mesh:** Tailscale / NetBird ZTNA for remote visibility and governance —
  bypasses manual Netgate firewall passwords. No service binds to the public side;
  the mesh + Synology firewall is the security boundary (matches the existing
  `infra/n8n` posture).
- **Data sovereignty:** zero cloud inference, zero vendor telemetry
  (`N8N_DIAGNOSTICS_ENABLED=false`). Aligns with DATA-AS-EMPOWERMENT-NOT-EXTRACTION
  and AI-FOUNDATION-INTERNAL-OPERATIONS (internal surfaces stay sovereign).

## 5. Deploy order

1. **Registry (NAS):** `infra/ai-orchestrator/registry/` → Postgres + pgvector +
   `sql/001-audit-ledger.sql`. The ledger must exist before any guarded action.
2. **Node 1 compute:** `infra/ai-orchestrator/node1/` → Ollama (GPU) + n8n +
   Uptime Kuma; n8n points at the NAS registry over Tailscale.
3. **The Cage:** `scripts/guarded-action.sh` wraps every pre-approved action.

## 6. Open questions — real-infra values I will NOT fabricate

The two real network actions stay stubbed until these are provided. Inventing
them risks black-holing a live VLAN on a Sunday:

- **UniFi controller** URL + auth method (API key vs session) for `isolate_mac_address.sh`.
- **Netgate / pfSense** host + auth, and whether DNS blacklisting lands there or on
  a Pi-hole/AdGuard for `update_dns_blacklist.sh`.
- **NetBird vs Tailscale** — pick one as the canonical mesh (the configs reference
  "Tailscale/NetBird"; production should name one).
- **Protected VLAN IDs** — confirm the exact IDs for tithing/financials and live
  production so `PROTECTED_VLANS` is correct.

Once these land, the two action scripts get written against real endpoints and
added to `ACTIONS_ALLOWLIST` — fully inside the Cage.
