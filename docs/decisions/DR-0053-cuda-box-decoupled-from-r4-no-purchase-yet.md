---
id: DR-0053
title: CUDA box decoupled from R4 — Cage stands up NOW on owned hardware; GPU purchase deferred until workload data proves VRAM binding; dual-3090 is the pick when triggered
date: 2026-06-11
status: accepted
supersedes: []
superseded-by: null
tier: n/a
entities: [all]
grounds: [COST-DISCIPLINE, DATA-DRIVEN-LIVING, SOVEREIGN-FIRST, GOVERN-EXECUTE-ADVISE]
source: 2026-06-11 session — Darrell asked "cuda box, you make a decision — or both: why is it stopping work?" and delegated the call. This DR is the answer and the record.
---

## Context

The Build Roadmap carried R4 (Cage + local LLM runner stand-up) as **blocked-on "CUDA box + deploy"** — and because R4 gates R5, R6, R11, and R12, that single line froze the largest chain on the roadmap. But the ratified orchestrator architecture (2026-06-09 session note, `infra/ai-orchestrator/`) already names **Node 1 = the Legion PC with its RTX 4070 (12 GB)** running Qwen 2.5 14B — hardware the family already owns. Separately, the founders' open-questions list carries an **eGPU/upgrade** question (used dual RTX 3090 ~$2k vs Mac Studio M4 Max ~$2.8k+ vs RTX 5090 DIY vs CPU-only). The roadmap conflated the two: a pending *upgrade* decision was recorded as if it blocked the *stand-up*, which it does not. That conflation — not hardware — is what was stopping work.

## Decision

1. **Decouple.** The R4 Cage + runner stand-up does NOT wait on any purchase. It proceeds on owned hardware per the ratified architecture: Legion PC RTX 4070 as Node 1, Registry on the NAS, the church switcher as Node 2 within its schedule boundaries. R4's true remaining blockers are reclassified as **deploy + real-infra values** (UniFi controller URL/auth, Netgate/pfSense host, NetBird-vs-Tailscale mesh choice, protected VLAN IDs) — awaiting-input items only Darrell can supply.
2. **No GPU purchase now.** The upgrade is deferred until live workload data from the running R4 stack shows VRAM as the binding constraint (model-swap thrash, queue depth, or a named workload that cannot fit 12 GB). Estimates are data-driven and living [DR-0004]; buying ahead of measured need fails COST-DISCIPLINE.
3. **When the data triggers it, the default pick is the used dual-RTX-3090 build (~$2k, 48 GB combined VRAM).** It is CUDA-native (the entire stack — Ollama on Linux, the church build pattern in [DR-0016]/[DR-0050] — is already CUDA-shaped), roughly $800+ cheaper than the Mac Studio path (which abandons CUDA), and avoids RTX 5090 cost/availability risk. This names the default so the eventual purchase is a greenlight, not a re-litigation.
4. **Money still moves only on Darrell's greenlight.** This DR authorizes no purchase; it removes a phantom blocker and pre-decides the default.

## Rationale

The roadmap's job is to carry true blockers. "CUDA box" on R4 was a category error: the stand-up needs software work and infra values, not procurement. Decoupling restores the propose → govern → build cadence — the system proceeds on what it has, measures, and brings Darrell a purchase case grounded in observed load instead of speculation. We all win, and we create rather than extract — including not extracting from the family's own budget ahead of need.

## Consequences

- `BUILD-ROADMAP.md` R4 row updated: blocker becomes "deploy + real-infra values (UniFi / pfSense / mesh choice / VLAN IDs)"; CUDA box drops off.
- The eGPU founders' question is ANSWERED (deferred-with-named-default) and comes off the open list; what remains open for Darrell is the infra-values list above.
- R5/R6/R11/R12 sequencing now keys on R4's software stand-up, not procurement.
- If measured load later proves 12 GB sufficient for the family's actual cadence, the purchase never happens — that is the system working, not a delay.

## Links

`docs/99-session-notes/2026-06-09-sovereign-ai-orchestrator-architecture.md`, `infra/ai-orchestrator/README.md`, `docs/00-foundations/_root/BUILD-ROADMAP.md` (R4), [DR-0004] (data-driven living estimates), [DR-0016]/[DR-0050] (dual-3090 precedent in the church build), `CLAUDE.md` three-brakes rule (any autonomous run on the stack still ships caged).
