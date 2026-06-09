---
id: DR-0014
title: Hardware budget directive (2026-06-09) — PoeTech $5k farm + Church >=$5k node; procure to collapse Phase 4
date: 2026-06-09
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [poetech, church]
grounds: [SOVEREIGN-FIRST, COST-DISCIPLINE, COMMUNITY-FIRST, CAGE, DATA-DRIVEN-LIVING]
source: 2026-06-09 conversation — Darrell's budget directive: independence ASAP, funding hardware now.
---

## Context
Darrell wants independence ASAP and is funding hardware now to collapse the hardware-gated Phase 4 ([DR-0013]) from 2027 into the near term. **This DR is a PLAN: it specs what to buy and what it unlocks. No purchase is executed — Darrell procures.**

## Decision (budget + recommended spec)
- **PoeTech: $5,000** for a business-systems **farm** (sovereign inference + the build/automation loop: n8n, Cage jobs, CI/CD + business-systems hosting). **Recommended: Option A — dual used RTX 3090 (48 GB), chassis/PSU sized for a 3rd card (→72 GB).** ~$2,800–4,200; 70B-class Q4 (frontier-adjacent) + CPU/RAM headroom for the multi-purpose farm; open Linux+Docker stack, no vendor lock. Rejected: single 5090 (can't hold 70B), unified-memory mini (weak for the concurrent farm), quad-3090 now (power/heat — it's the upgrade lane).
- **Church: >= $5,000** for the COLG sovereign node (separate on-site box, ISO-2): dual-3090 inference box (~$2.8–3.5k) + NAS/registry on the church Synology or a new DS-class (+drives/backup) + managed network/UPS; ~$5–6.5k scaled to budget. Tied to the Cage (registry on NAS, inference on GPU box, guarded-action + ledger + health-gate). Member data + financial reports stay sovereign, staff-gated.

## Rationale (incl. cost screen)
Because the farm is the price of independence-now and a multi-purpose compute asset — **not** API arbitrage: vs the $25 soft / $50 hard monthly vendor cap, a ~$3,500 farm is ~70 months to "break even," so it is justified by sovereignty + capability + data-control + the farm role, stated honestly, not by beating a small API bill. The church node is a COMMUNITY-FIRST mission investment. VRAM is the binding constraint (48 GB → 70B-class); dual-3090 is the best $/VRAM in June-2026 pricing.

## Consequences
- Recompresses [DR-0013] Phase 4: bring-up ~3–5 weeks from procurement go → **full vendor-optional incl. heavy reasoning ~Jul–Aug 2026** (was 2027).
- The §3 eval re-runs at the 48 GB envelope; router cutover defaults heavy reasoning to local, vendor → optional (swappable lane, never locked in).
- Honest caveats: used-GPU sourcing variance; the newest frontier-open MoE may want the 72–96 GB upgrade lane (a card-add, not a 2027 wait). Church NAS exact model UNCONFIRMED — confirm before ordering.
- **PLAN not purchase** — no order placed by this DR.

## Links
[DR-0013] (roadmap recompressed), [DR-0012] (the shared-4070 stays the creative box; the farm is separate), [DR-0004] (living estimates), `AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md`, research-review §14.
