---
id: DR-0051
title: ROI reframe — the sovereign stack replaces paid IT and frees church budget for mission (PRIMARY justification)
date: 2026-06-09
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [church, poetech]
grounds: [COMMUNITY-FIRST, COST-DISCIPLINE, SOVEREIGN-FIRST, CAGE, GOVERN-EXECUTE-ADVISE]
source: 2026-06-09 conversation — Darrell ratified the ROI reframe as the church build's PRIMARY cost justification.
---

## Context
The earlier cost framing led with API-arbitrage break-even (which is weak — ~70 months vs the $25/$50 cap). Darrell ratified a stronger, truer justification and made it the headline.

## Decision (PLAN/justification — no purchase)
**PRIMARY justification (the lead):** the sovereign stack + Tailscale mesh means **the church never pays for a network engineer or a managed-IT contract** (no monthly retainer; no $100–150/hr per-incident). The **LLM farm runs an IT/Ops module** (an instance of the role-module pattern): **monitor** the mesh / NAS / cameras, **alert**, and **apply SAFE changes behind the Cage** — doing the work the church would otherwise hire out. The chain is the return:

> **replaces paid IT → frees recurring church budget → redirected to communities and missions.**

That is the ROI, **not** "cheaper than a vendor API." Managed IT for a 44k-sqft facility runs **~$6,000–24,000/yr** (or $100–150/hr break-fix); the freed budget flows to the mission. Tie: **3 John 1:2** (*"…that all may go well with you and that you may be in good health, as it goes well with your soul"* — soul-prosperity → all prosperity), the **Father's Business** anchor, and the **Black-church-as-economic-powerhouse** frame.

**Guardrail (infra is high-stakes — binding):** the IT/Ops module's **monitoring, alerting, and safe config are AUTONOMOUS**; **risky changes — firewall rules, access changes, anything that can lock people out or drop the network — are HUMAN-GATED.** Same Cage + four-brakes model ([DR-0010]); the 2026-06 runaway is the lesson that high-stakes autonomy ships only behind the brakes.

**Secondary (honest footnote):** the vendor-API break-even is real but minor (~70 months vs the cap) — it stays a footnote, not the headline.

## Rationale
The avoided-IT-labor + freed-mission-budget case is both larger and truer than API arbitrage, and it ties the spend directly to the mission (`COMMUNITY-FIRST`). Making it the headline aligns the justification with why the church should want this at all.

## Consequences
- The church build research-review (§7) now leads with this ROI; API-arbitrage is demoted to a footnote.
- Adds an **IT/Ops role module** to the church node's scope (monitor/alert/safe-config autonomous; risky changes human-gated).
- Generalizes: the same avoided-IT-labor ROI applies to the PoeTech farm and other sovereign-node deployments.

## Links
[DR-0050] (the build it justifies), [DR-0010] (bounded autonomy / four brakes), [DR-0014] (COLG node), `COMMUNITY-FIRST-MISSION`. Research-review §7.
