---
id: DR-0050
title: COLG $9k build — NAS REPLACEMENT (new chassis primary, old→backup) + church-owned drives + supplementary Wyze cams
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
1. **This is a NAS REPLACEMENT, not just added storage.** The church's ~50 TB Synology is **OLD**; the **6–8 owned loose 10–12 TB drives were bought to build its replacement.**
2. **Buy a new Synology chassis (~$1,050, DS1821+ 8-bay class)** as the **new PRIMARY NAS**, populated by the **owned** loose drives (**drives = $0**). Hosts **Church Plus + member + financial reports + a separate surveillance volume.**
3. **Migrate** data off the old box → **demote the old NAS to a backup target** → real **3-2-1 backup** for sensitive member/financial data.
4. **Architecture — RECOMMENDED: separate NAS (storage) + separate GPU node (Frigate+LLM)** — clean split, DSM-native Church Plus, robustness, 3-2-1 backup. **ALTERNATIVE: all-in-one** (drives in the GPU server) saves ~$1k but couples storage+compute and complicates Church Plus. **PENDING Darrell.**
5. **Data isolation:** surveillance on a **dedicated volume**, separate from financial/member volumes on the same chassis (access-segregated). Frigate active cache on the node's existing 2 TB NVMe; bulk retention to the surveillance volume over SMB/NFS (network-link flag: 22× 4K continuous write — solid wired uplink; detection-based recording default).
6. **Retention = policy choice, not a storage limit** (effectively unconstrained with ~60–96 TB owned drives): recommend **30–90 days continuous + indefinite for flagged events.**
7. **Trim cameras 24 → 22** to fund the chassis; buffer **$970 → $280**.
8. **Supplementary Wyze floodlight cams (Floodlight Pro + Floodlight, count TBC):** bonus exterior/deterrent only, WiFi+AC (no Cat6), bridged via `docker-wyze-bridge` where clean (Floodlight Pro spottier). Backbone stays ONVIF 4K PoE. Net ~no change to $9k; **count pending Darrell.**

**Revised $9k (pure hardware):** dual-3090 $3,600 · **new Synology chassis $1,050** · **22× 4K cams $2,860** · PoE+ switch $500 · Cat6 $350 · UPS $300 · Coral $60 · **buffer $280** = **$9,000**.

## Rationale
The loose drives were bought to replace the aging NAS, so a new chassis (drives owned → $0) is the right spend, not an expansion shelf. The separate-NAS layout keeps DSM-native Church Plus, isolates surveillance from member/financial volumes, and demotes the old box to a real backup (3-2-1) — a resilience upgrade. Owned drives → zero added vendor dependency (`DATA-AS-EMPOWERMENT`). Wyze units stay supplementary (cloud-tied) to keep the backbone sovereign (`SOVEREIGN-FIRST`).

## Consequences
- **PENDING Darrell inputs:** (a) **separate-NAS vs all-in-one**; (b) **Wyze unit counts**; (c) **old-NAS-as-backup + CMR/surveillance-rated drives** confirm; plus the **site walkthrough** for final camera/drop counts.
- The new chassis is the church sovereign-node storage substrate (Church Plus + member + financial) — surveillance shares it with **volume/quota separation**, access-segregated; old NAS = backup.
- **No purchase** — PLAN.

## Links
supersedes [DR-0016] (→ [DR-0015]); [DR-0014] (COLG node), [DR-0003] (ISO-2), [DR-0001] (Sabbath scope). Research-review `docs/99-session-notes/2026-06-09-research-review-colg-9k-church-build.md` §2.1/§5/§8; invoice `docs/invoices/2026-06-09-poetech-colg-cabling-labor-invoice.md`.
