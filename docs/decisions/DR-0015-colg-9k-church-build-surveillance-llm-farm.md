---
id: DR-0015
title: COLG $9k church build — open-source Frigate surveillance + double-duty CUDA LLM node (PLAN, not purchase)
date: 2026-06-09
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [church]
grounds: [SOVEREIGN-FIRST, COST-DISCIPLINE, COMMUNITY-FIRST, CAGE, DATA-AS-EMPOWERMENT, SURFACE-PREMISE]
source: 2026-06-09 conversation — Darrell: a $9k church build for whole-building 4K AI surveillance + a CUDA LLM system for 24/7 congregation-services support.
---

## Context
COLG (~44,000 sqft, 312 E. Bradley Ave, Champaign IL) wants whole-building PoE 4K AI surveillance AND a sovereign CUDA LLM for 24/7 congregation support, within **$9,000**. Darrell said "open-source Ubiquiti 4K cameras" — but **UniFi Protect is proprietary, not open-source** (premise corrected, `SURFACE-PREMISE`), and at $379–499/camera a ~30-cam whole-building deployment is $11k+ in cameras alone, over the whole budget before any GPU.

## Decision (PLAN only — Darrell procures; no purchase executed)
- **Camera path: (B) open-source Frigate NVR + ONVIF/RTSP 4K PoE cameras** (Reolink/Amcrest, ~$50–130), NOT UniFi. Sovereign, portable, swappable-standard, ~⅓ the per-camera cost — the only path that fits whole-building + a GPU inside $9k.
- **One GPU does double duty:** a single **RTX 3090 (24 GB)** node runs Frigate object-detection (light; optionally offloaded to a $60 Coral) **and** a **14B-class congregation-support LLM** (service times, scripture, events, FAQ, prayer intake), behind the Cage.
- **Layout:** ~28–32 cameras across exterior/parking/entrances/sanctuary/halls/classrooms-wing/office (table in the research-review).
- **Allocation across $9k:** ~$6,850 hardware (cameras $2,800 / switches $700 / cabling materials $400 / storage $650 / GPU node $2,000 / UPS $300) + ~$2,150 contingency for cabling LABOR.
- **PHASED fallback (recommended default):** Phase 1 (~$5–5.5k) = GPU node + Frigate + ~15 priority cameras (exterior, parking, entrances, sanctuary) live now; Phase 2 (~$3.5–4k) = remaining interior cameras + cabling. De-risks the labor unknown.

## Rationale
Because whole-building 4K AI + a capable GPU does NOT fit $9k on the proprietary UniFi path but DOES on the open-source path, which also matches the sovereignty stance and enables the one-GPU-double-duty efficiency. Cabling labor across 44k sqft is the line that can break the budget, so phasing is the safe default. A 14B LLM fits 24 GB with room for detection; heavy reasoning stays on the separate PoeTech farm ([DR-0014]).

## Consequences
- This is the COLG sovereign-node compute from [DR-0014], here scoped to **surveillance + congregation support** (separate from the A/V switcher Node 2 and from the heavy-reasoning farm).
- **24/7 vs 24/6.5:** surveillance is 24/7; congregation support is reactive 24/7; the 24/6.5 Sabbath + ±1 h service blackout ([DR-0001]) apply to the autonomous *review* fleet, NOT to security recording or reactive congregation Q&A. Three-brakes still bound any autonomous behavior.
- Footage local-only on the church's own disks; no vendor lock (`DATA-AS-EMPOWERMENT`).
- **No purchase** — PLAN; church NAS/site walkthrough confirms final counts before ordering.

## Links
[DR-0014] (COLG ≥$5k node), [DR-0012] (GPU topology), [DR-0001] (Sabbath/blackout scope), [DR-0003] (ISO-2 church tier), research-review `docs/99-session-notes/2026-06-09-research-review-colg-9k-church-build.md`.
