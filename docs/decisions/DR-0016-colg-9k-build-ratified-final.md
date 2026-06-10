---
id: DR-0016
title: COLG $9k church build — RATIFIED FINAL (open-source Frigate + 48GB dual-3090 + VLM agent + DIY cabling)
date: 2026-06-09
status: superseded
supersedes: [DR-0015]
superseded-by: DR-0050
tier: C
entities: [church]
grounds: [SOVEREIGN-FIRST, COST-DISCIPLINE, COMMUNITY-FIRST, CAGE, DATA-AS-EMPOWERMENT, EARN-AUTONOMY, SURFACE-PREMISE]
source: 2026-06-09 conversation — Darrell ratified/locked the COLG $9k build choices.
---

## Context
Finalizes [DR-0015] (which recommended the open-source path + a single-3090 + phasing). Darrell locked the choices 2026-06-09; several specifics changed (single→dual 3090; DIY cabling; a PoeTech App Surveillance Module front end; an event-driven VLM + Cage agent), so this DR **supersedes DR-0015**.

## Decision (RATIFIED — PLAN only; PoeTech/Darrell procures + self-assembles)
1. **Cabling = DIY by PoeTech** → **$0 labor against the $9k**; only Cat6 materials (~$350) count. A **separate pro-forma PoeTech labor invoice** documents fair-market value (~$1,600–4,000, midpoint ~$2,500) and a **reduced/variable balance** (give-from-understanding; `COMMUNITY-FIRST`). The $9k stays pure hardware.
2. **GPU = 48 GB dual-RTX-3090 node, self-assembled** (parts only, no integrator labor) → runs Frigate detection + an event-driven VLM + a congregation LLM concurrently.
3. **Surveillance = open-source path**: ONVIF 4K PoE cameras → **Frigate** (headless, on the node) → a **PoeTech App "Surveillance" Module** front end (live view, AI event feed, clips, alerts). Reusable Module-Library module; integrates with four-entity identity/roles + events-as-data + the notification path. **No UniFi Protect, no vendor cloud. TLC walled off (ISO-2, no TLC data path).**
4. **Real-time analysis + execution**: an **event-driven VLM (Qwen2.5-VL class)** reads scenes **on Frigate events** (not every frame); an **agent executes allowlisted actions through the Cage**. **Guardrail:** autonomous OK for alert/log/notify/illuminate; **irreversible/safety-critical** (authorities, egress-affecting door locks, etc.) behind a **human gate or a pre-authorized tightly-scoped rule with strict permission checks** (locks fail-safe to egress-open). VLM added to the model list.

**Final $9k allocation (pure hardware):** dual-3090 48 GB node ~$3,600 · 24× 4K PoE ONVIF cams ~$3,120 · 24-port PoE+ switch ~$500 · Cat6 materials ~$350 · storage 2×12 TB CMR ~$450 (retention-tunable) · UPS ~$300 · Coral TPU ~$60 · buffer ~$620 = **$9,000**.

## Rationale
DIY cabling removes the one line that busted the budget, so whole-building **and** the 48 GB node both fit pure-hardware. 48 GB (vs single-24 GB in DR-0015) is what lets detection + VLM + LLM run concurrently. The open-source Module front end is sovereign, reusable, and integrates with our identity/events/notification fabric. The VLM is event-driven for cost + safety; the Cage + the autonomy guardrail keep physical-security automation safe ([DR-0010]).

## Consequences
- Power/thermal: dual-3090 ~700 W full load (partial 24/7 duty cycle ~$25–50/mo); needs ventilation + ~1500 VA UPS.
- 24/7 vs 24/6.5: surveillance + reactive support are 24/7; the Sabbath/blackout ([DR-0001]) governs the autonomous review fleet, not security/reactive support.
- Deliverables: build research-review (regenerated to FINAL) + the pro-forma labor invoice (`docs/invoices/2026-06-09-poetech-colg-cabling-labor-invoice.md`).
- **No purchase** — site walkthrough + church-NAS confirmation precede ordering.

## Links
supersedes [DR-0015]; [DR-0014] (COLG node), [DR-0012] (GPU), [DR-0010] (bounded autonomy), [DR-0001] (Sabbath scope), [DR-0003] (ISO-2). Research-review `docs/99-session-notes/2026-06-09-research-review-colg-9k-church-build.md`; invoice `docs/invoices/2026-06-09-poetech-colg-cabling-labor-invoice.md`.
