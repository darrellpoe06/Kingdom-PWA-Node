---
id: DR-0050
title: COLG $9k build — church-provided storage (existing ~50TB NAS + loose HDDs) + supplementary Wyze cams
date: 2026-06-09
status: accepted
supersedes: [DR-0016]
superseded-by: null
tier: C
entities: [church]
grounds: [SOVEREIGN-FIRST, COST-DISCIPLINE, COMMUNITY-FIRST, DATA-AS-EMPOWERMENT, CAGE, SURFACE-PREMISE]
source: 2026-06-09 conversation — Darrell: church already owns a ~50TB Synology NAS + ~6–8 loose HDDs; also has new-in-box Wyze floodlight cameras.
---

## Context
Refines the ratified build ([DR-0016]) with existing church-owned hardware: a **~50 TB Synology NAS** (the church's own box, hosting Church Plus + member data + monthly financial reports) and **~6–8 loose HDDs (~10–12 TB ea, ~60–96 TB raw)** not yet installed; plus new-in-box **Wyze floodlight cameras**. Materially changes the storage line + allocation, so this **supersedes DR-0016**.

## Decision (PLAN only — no purchase)
1. **Storage drives = $0 from the $9k.** Drop the 2× 12 TB purchase (–$450). Use the church's **~50 TB NAS + loose HDDs** (confirm CMR / surveillance-rated). Storage is effectively unconstrained.
2. **Node local cache (~$100)** holds Frigate's active buffer; bulk retention to the church NAS over **SMB/NFS**. Network-link flag: 24× 4K continuous write is real bandwidth — solid wired uplink (2.5–10 GbE / same switch); detection-based recording cuts it sharply.
3. **Recommended layout — data isolation:** loose HDDs as a **dedicated surveillance volume** (Synology **DX517 expansion ~$200–550** or a second NAS body), keeping the ~50 TB NAS for **Church Plus + member + financial data**. Separates heavy video I/O from the member/financial store and enforces surveillance-volume ≠ financial/member-volume.
4. **Retention is now a policy choice, not a storage limit:** recommend **30–90 days continuous + indefinite for flagged events**; rest of the pool available.
5. **Reallocate freed ~$350 → buffer ($620 → $970)**; the buffer can fund the DX517 if no free bays, extra cameras, or sit as contingency.
6. **Supplementary Wyze floodlight cams (Floodlight Pro + Floodlight, count TBC):** bonus exterior/deterrent only, WiFi+AC (no Cat6), bridged via `docker-wyze-bridge` where they bridge cleanly (Floodlight Pro spottier). Backbone stays ONVIF 4K PoE. Net ~no change to $9k; **count pending Darrell.**

**Revised $9k (pure hardware):** dual-3090 $3,600 · 24× 4K cams $3,120 · PoE+ switch $500 · Cat6 $350 · **local cache $100** · UPS $300 · Coral $60 · **buffer $970** = **$9,000**.

## Rationale
Reusing church-owned drives makes storage $0 and retention unconstrained while *adding zero vendor dependency*; the dedicated-surveillance-volume layout reinforces data isolation (`DATA-AS-EMPOWERMENT`). Wyze units are free bonus coverage but cloud-tied, so they stay supplementary to keep the backbone sovereign (`SOVEREIGN-FIRST`).

## Consequences
- **Pre-order dependencies:** confirm HDDs are CMR/surveillance-rated; confirm **bay availability** (NAS open bays vs. a DX517/second body from buffer); confirm **Wyze quantity**; site walkthrough for final drop count.
- The ~50 TB NAS is the church sovereign-node storage substrate (Church Plus + member + financial) — surveillance shares the hardware with **volume/quota separation**, access-segregated.
- **No purchase** — PLAN.

## Links
supersedes [DR-0016] (→ [DR-0015]); [DR-0014] (COLG node), [DR-0003] (ISO-2), [DR-0001] (Sabbath scope). Research-review `docs/99-session-notes/2026-06-09-research-review-colg-9k-church-build.md` §2.1/§5/§8; invoice `docs/invoices/2026-06-09-poetech-colg-cabling-labor-invoice.md`.
