# Research Review — COLG $9k Church Build (FINAL / RATIFIED): whole-building surveillance + a 48 GB CUDA node

**Date:** 2026-06-09
**Author:** Claude (research-review on Darrell's commission, per `feedback-research-first`)
**Triggered by:** Darrell — a **$9,000** church build covering BOTH whole-building surveillance (PoE, 4K, AI) AND a CUDA node for 24/7 congregation support + real-time scene analysis. Church of the Living God, ~44,000 sqft, 312 E. Bradley Ave, Champaign IL.
**Status:** **FINAL — choices RATIFIED with Darrell 2026-06-09 ([DR-0050] storage/NAS-replacement, which supersedes [DR-0016] → [DR-0015]; [DR-0051] = the ROI / avoided-IT-labor justification).** Rev. reframes storage as a **NAS replacement** (new chassis as primary, old → backup) and leads with the **ROI: the sovereign stack replaces paid IT and frees church budget for mission.** **PLAN ONLY — specs what to buy and what it unlocks; no purchase is executed. Darrell/PoeTech procures + self-assembles.** June-2026 pricing, cited; re-verify at order time.
**Pairs with:** [DR-0050] (storage/NAS-replacement), [DR-0051] (ROI/avoided-IT-labor), [DR-0016]/[DR-0015] (superseded), [DR-0014] (COLG node), [DR-0012] (GPU topology), [DR-0001]/[DR-0003] (Cage + ISO tiers), [DR-0010] (bounded autonomy); the PoeTech labor invoice `docs/invoices/2026-06-09-poetech-colg-cabling-labor-invoice.md`; `infra/ai-orchestrator/` (the Cage); `COMMUNITY-FIRST-MISSION`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`.

---

## TL;DR — the ratified build

- **ROI is the headline (§7, [DR-0051]):** the real return is **NOT "cheaper than a vendor API."** The sovereign stack + Tailscale mesh means **the church never pays a network engineer / managed-IT contract** ($100–150/hr, or $6–24k/yr); the LLM farm runs an **IT/Ops module** (monitor + alert + SAFE changes behind the Cage). **Replaces paid IT → frees recurring budget → redirected to communities + missions** — *3 John 1:2*, Father's Business, the Black-church-as-economic-powerhouse. **Guardrail:** monitoring/alerting/safe-config autonomous; **risky changes (firewall, access, anything that locks people out / drops the network) HUMAN-GATED** (Cage + four brakes; the 2026-06 runaway lesson). API-arbitrage break-even = honest footnote.
- **Surveillance = open-source path (LOCKED).** ONVIF 4K PoE cameras → **Frigate** (headless detection engine on the GPU node) → a **PoeTech App "Surveillance" MODULE** as the front end (live view, AI event feed, clips, alerts). **No UniFi Protect, no vendor cloud.** (Premise corrected: UniFi Protect is proprietary, not open-source.)
- **GPU = 48 GB dual-RTX-3090 node, self-assembled by Darrell (LOCKED).** Parts cost only, no integrator labor. 48 GB runs Frigate detection + an **event-driven VLM** + a congregation-support **LLM** concurrently.
- **Real-time analysis (LOCKED):** an **event-driven VLM (Qwen2.5-VL class)** reads scenes **on Frigate events** (not every frame); an **agent executes allowlisted actions through the Cage.** **Guardrail:** autonomous is OK for *alert / log / notify / illuminate*; anything **irreversible or safety-critical** (calling authorities, egress-affecting door locks, etc.) sits behind a **human gate** or a **pre-authorized, tightly-scoped rule with strict permission checks.**
- **Cabling = DIY by PoeTech (LOCKED).** **$0 labor against the $9k** — only Cat6 materials count. A **separate PoeTech labor invoice** documents the fair-market value (~$1,600–4,000) for the church's records; the church pays a **variable/reduced balance** (PoeTech does not charge full freight — give-from-understanding).
- **The $9k is now PURE HARDWARE** (labor is $0 in-budget / invoiced separately), so whole-building **and** the 48 GB node both fit.
- **Storage = NAS REPLACEMENT, not just added storage (§2.1).** The church's ~50 TB Synology is **OLD**; the **6–8 owned loose 10–12 TB drives were bought to build its replacement.** Budget a **new Synology chassis (~$1,050, DS1821+ 8-bay)** as the **new PRIMARY NAS** (Church Plus + member + financial + a separate surveillance volume); **migrate, then demote the old NAS to a backup target → real 3-2-1 backup.** **Drives = $0** (owned). Retention is a **policy choice** (effectively unconstrained). RECOMMENDED layout = **separate NAS + separate GPU node** (clean split, DSM-native Church Plus); all-in-one saves ~$1k but couples storage+compute — **pending Darrell's choice.**
- **Supplementary Wyze floodlight cameras (BONUS, count TBC):** church-owned, new-in-box Wyze Floodlight Pro/Floodlight units for exterior/deterrent — bridged into Frigate where they bridge cleanly; **not the backbone** (cloud-tied). Net ~no change to $9k. Count **pending Darrell**.
- **TLC walled off:** the Surveillance Module is church (ISO-2); it touches no TLC data path (ISO-1 firewall holds).
- **24/7 vs 24/6.5:** surveillance + reactive congregation support are 24/7; the 24/6.5 Sabbath + service blackout (DR-0001) govern the autonomous *review* fleet, not security or reactive support.

---

## 1. Surveillance architecture (LOCKED) — Frigate engine + PoeTech App Module

```
ONVIF 4K PoE cameras --RTSP--> Frigate (headless, on the 48GB GPU node; Coral does detection)
        |                                   |
        |                          object/zone events
        v                                   v
  PoeTech App "Surveillance" MODULE  <--  event-driven VLM (Qwen2.5-VL) reads the scene
  (live view, AI event feed, clips,        |
   alerts; four-entity identity/roles,     v
   events-as-data, notification path)   agent --> Cage (allowlist + ledger + health-gate) --> scoped actions
```

- **Frigate** is the open-source detection/recording engine (no UI lock-in); it ingests RTSP from any ONVIF camera, buffers to the node's NVMe cache and retains to the **new primary Synology NAS's dedicated surveillance volume** (§2.1) over SMB/NFS, and emits object/zone events.
- **The PoeTech App "Surveillance" Module is the front end** — a **reusable Module-Library module**: live view, AI event feed, clip review, alerts/notifications. It integrates with the **four-entity identity/roles** (staff-gated, ISO-2), **events-as-data** (`INSTITUTIONAL-MEMORY-EVENTS` — every detection/alert is an Event), and the **notification path** (ntfy/dual-channel). **No UniFi Protect app; no vendor cloud; footage local-only.**
- **TLC firewall:** this Module is church-scoped (ISO-2); it carries **no** TLC/PHI data path (ISO-1 holds).

---

## 2. Whole-building camera layout (~44,000 sqft) — 22 cameras

4K PoE, ONVIF, Frigate-managed. **Trimmed 24 → 22** to fund the new Synology chassis (§2.1); the **Wyze floodlight cams (§8) backfill exterior corners**, so deterrent coverage holds. Tune on a site walkthrough.

| Zone | Cameras | Notes |
|---|---|---|
| Exterior building perimeter | 4 | 4K, IR/night, weatherproof (Wyze floodlights backfill corners) |
| Parking lot(s) | 3 | wide / varifocal, plate-legible |
| Entrances / doors | 4 | main, side, fellowship, rear — face-height |
| Sanctuary | 3 | wide congregation + 2 angles |
| Fellowship hall / multipurpose | 2 | wide coverage |
| Hallways / corridors | 3 | choke points between wings |
| Classrooms / children's wing | 2 | wing corridors + entries |
| Office / count room | 1 | giving/financial area (ISO-2, staff-gated) |
| **Total** | **22** | ~22 cable drops (DIY); **+ supplementary Wyze floodlight cams (count TBC, §8)** augment exterior/deterrent beyond this backbone |

### 2.1 Storage (NAS REPLACEMENT — the loose drives build the church's NEW primary NAS)

**Reframe (Darrell):** the church's current **~50 TB Synology NAS is OLD**; the **6–8 loose 10–12 TB drives were bought to build its REPLACEMENT.** This is a **NAS replacement**, not just added storage.

- **New primary NAS — budget a new Synology chassis (~$1,050, DS1821+ 8-bay class)**, populated by the church's **owned** loose drives (**no drive purchase — $0 for drives**). It becomes the **new PRIMARY NAS**: hosts **Church Plus + member data + financial reports + a separate surveillance volume.**
- **Migrate** data off the old ~50 TB box, then **demote the old NAS to a backup target** → a real **3-2-1 backup** for the church's sensitive member/financial data (a resilience upgrade it doesn't have today).
- **Confirm the loose drives are CMR / NAS- or surveillance-rated** (WD Red/Purple, Seagate IronWolf/Skyhawk) before populating.

**Data isolation (kept):** surveillance footage lives on a **dedicated volume**, **separate from the financial/member volumes** on the same chassis (volume/quota separation, access-segregated). Heavy 24/7 video write I/O never shares a volume with Church Plus / financial data.

**On the GPU node:** the node's existing 2 TB NVMe (§3) holds Frigate's active recording buffer; clips retain to the new NAS's surveillance volume over **SMB/NFS**. **Network-link flag:** 22× 4K *continuous* write is real bandwidth — put the NAS on a solid wired uplink (node + NAS on the same switch / 2.5–10 GbE); **detection-based recording is the recommended default** and cuts this sharply.

**Retention — a POLICY choice, not a storage limit.** With ~60–96 TB of owned drives in an 8-bay chassis, retention is effectively *as long as you want* (reference: ~50 TB ≈ 2.5–10 months of 22× 4K; the full pool → a year+). **Recommended default: 30–90 days continuous + indefinite for flagged/event clips.** Tune in Frigate.

### 2.2 Architecture choice — separate NAS + GPU node (RECOMMENDED) vs all-in-one

**RECOMMENDED — separate Synology (storage) + separate GPU node (Frigate + LLM).**
- **Clean split:** storage and compute fail/upgrade independently — a GPU reboot doesn't drop the NAS, and vice versa.
- **DSM-native Church Plus:** Church Plus + member/financial data run on Synology **DSM** where they belong (native apps, snapshots, Hyper Backup, DSM permissions) — not bolted onto a Linux GPU box.
- **Robustness:** the sensitive member/financial store sits on purpose-built NAS hardware with its own RAID **+ the old box as backup.**
- **Cost:** +~$1,050 for the chassis (drives owned).

**ALTERNATIVE — all-in-one (loose drives in the GPU server).** Saves **~$1,000**, but **couples storage + compute** (one box's failure/maintenance takes down surveillance recording AND the member/financial store) and **complicates Church Plus** (DSM apps don't run cleanly on a generic Linux box; you'd reimplement backup/permissions by hand). Acceptable only if budget is the hard constraint and the church accepts the coupling.

**Recommendation: the separate-NAS layout** — for a store holding member + financial data, the clean split + DSM-native Church Plus + the 3-2-1 backup are worth the ~$1k.

> **PENDING Darrell inputs (do NOT finalize):** (a) **separate-NAS vs all-in-one** choice; (b) **Wyze unit counts** (§8); (c) **confirm old-NAS-as-backup** + drives are CMR/surveillance-rated. Site walkthrough confirms final camera/drop counts.

---

## 3. GPU/CUDA node (LOCKED) — 48 GB dual-RTX-3090, self-assembled

48 GB lets the node run **three jobs at once**: Frigate detection (offloaded to a $60 Coral), an **event-driven VLM** for scene understanding, and a **congregation-support LLM** — concurrently, which a single 24 GB card could not.

| Component | Spec | ~Cost |
|---|---|---|
| **GPU ×2** | 2× used **RTX 3090 24 GB** → **48 GB** | $1,500–1,800 |
| Base | Ryzen / used dual-PCIe workstation, **128 GB RAM** | $700–1,000 |
| PSU | **1300 W** 80+ Platinum (two 3090s ≈ 700 W) | $200–250 |
| Storage | 2 TB NVMe (OS + models) + a small Frigate active-recording cache (§5); **bulk retention to the church NAS (§2.1)** | $150 |
| Case + cooling | airflow tower / open frame | $150–250 |
| **Coral TPU** | offloads ALL camera detection → frees the full 48 GB for VLM + LLM | $60 |
| **Node total (self-assembled, parts only)** | | **~$3,600** |

**VRAM → model class (48 GB):** runs e.g. a **14B congregation LLM** (`qwen2.5`/`qwen3:14b`) **+ Qwen2.5-VL 7B** (event-driven scene analysis) **+** Frigate (Coral) **concurrently**, with headroom; or a **32B** LLM if the VLM is swapped on demand. Heavy *reasoning* still lives on the separate PoeTech farm ([DR-0014]); this node is **surveillance + congregation support**.

---

## 4. Real-time LLM analysis + execution (LOCKED) — event-driven VLM + Cage agent

- **Event-driven, not per-frame.** Frigate detects an object/zone event → only **then** does the **VLM (Qwen2.5-VL class)** read the scene ("person at the rear door after hours," "vehicle in the fire lane," "fall in the hallway"). This keeps GPU load low and leaves the LLM responsive — far cheaper than running a VLM on every frame.
- **Agent executes through the Cage.** A small agent maps VLM/Frigate events to **allowlisted actions** via `guarded-action` (allowlist + append-only ledger + health-gate/auto-rollback).
- **Autonomy guardrail (explicit, binding):**
  - **Autonomous OK (reversible / non-safety-critical):** raise an alert, log/record the event, notify staff (ntfy/dual-channel), **illuminate** (turn on lights), tag a clip.
  - **HUMAN GATE or pre-authorized tightly-scoped rule + strict permission checks (irreversible / safety-critical):** contacting authorities, **egress-affecting door locks**, anything that could trap, endanger, or can't be rolled back. These never fire on a bare model judgment — they require a human decision or a narrowly-scoped, permission-checked pre-authorization (and even then, fail-safe defaults: locks fail to *egress-open*).
- This is the §8 "LLMs do the work, bounded by the Cage" pattern ([DR-0010]) applied to physical security: the brakes + the irreducible-judgment gate keep autonomy safe.

---

## 5. FINAL allocation across $9,000 (PURE HARDWARE — cabling labor is $0 in-budget)

| Line | June-2026 basis | Allocation |
|---|---|---|
| **Dual-3090 48 GB node** (self-assembled, parts) | 2× 3090 ($1.5–1.8k) + base/128GB/1300W/NVMe/case | **$3,600** |
| **New Synology chassis** (new PRIMARY NAS) | DS1821+ 8-bay class; **owned loose drives populate it — $0 for drives** | **$1,050** |
| **22× 4K PoE ONVIF cameras** | ~$130/cam (Amcrest IP8M / Reolink RLC-811A class); trimmed 24 → 22 to fund the chassis | **$2,860** |
| **24-port PoE+ switch** | managed, sufficient PoE budget for 22× 4K | **$500** |
| **Cat6 materials** | bulk box + connectors + mounts (DIY install) | **$350** |
| **UPS** | ride-through for node/switch/NAS (size ~1500 VA for the dual-3090) | **$300** |
| **Coral TPU** | offloads detection → frees 48 GB for VLM + LLM | **$60** |
| **Buffer / headroom** | price drift / extra mounts / contingency | **$280** |
| **TOTAL** | | **$9,000** |

**Storage drives stay $0** (church-owned loose drives populate the new chassis); **cabling labor stays $0** (DIY by PoeTech; only the $350 Cat6 materials count; fair-market value invoiced separately, §6). The **new ~$1,050 chassis** (the NAS replacement, §2.1) is funded by trimming cameras 24 → 22 and drawing down the buffer ($970 → $280). Frigate's active cache lives on the node's existing 2 TB NVMe (no separate line).

> **Power/thermal honesty:** two 3090s draw ~700 W under *full* load — more than a single card. But detection is on the Coral and the VLM is event-driven + the LLM reactive, so the **24/7 duty cycle is partial**; realistic power ~**$25–50/mo**. Needs a **ventilated closet/rack, good airflow, and the UPS sized for the pair** (~1500 VA). This is the cost of running VLM + LLM + detection on one sovereign box.

---

## 6. PoeTech labor invoice (separate deliverable) — fair-market value, reduced balance

Cabling is **DIY by PoeTech**, so it costs the church **$0 in cash labor**. To keep honest books and document the gift, a **separate fair-market-value invoice** sits beside the hardware plan: `docs/invoices/2026-06-09-poetech-colg-cabling-labor-invoice.md`.

- **Fair-market labor value:** ~22 cable drops @ $50–150 = **~$1,100–3,300**, plus GPU build + integration **~$400** → **~$1,500–3,700** (representative midpoint **~$2,400**).
- **Balance the church pays:** **variable / reduced** — PoeTech does not charge full freight (give-from-understanding; the Black-church-as-economic-powerhouse ethos). The invoice shows the value contributed and a reduced/at-discretion amount due, so the church can account for the in-kind blessing.
- **Honest framing on the invoice:** it is a **pro-forma fair-market-value estimate** (PLAN), not a bill for completed work.

---

## 7. Why this pays for itself — the ROI (avoided IT labor → freed budget → mission)

### 7.1 PRIMARY justification — the sovereign stack replaces paid IT, and the savings fund the mission

The lead reason this build pays for itself is **not** that local inference is cheaper than a vendor API. It is that **the sovereign stack + the Tailscale mesh means the church never pays for a network engineer or a managed-IT contract** — no monthly retainer, no **$100–150/hr** per-incident call-out.

The **LLM farm runs an IT/Ops module** (an instance of the role-module pattern): it **monitors** the mesh, the NAS, and the cameras; **alerts** on trouble; and **applies SAFE changes behind the Cage** — doing the work the church would otherwise hire out. The chain is the whole point:

> **replaces paid IT → frees recurring church budget → redirected to communities and missions.**

That is the return — not "cheaper than API." Managed IT for a 44k-sqft facility with this much infrastructure runs **easily $6,000–24,000/year** (or $100–150/hr break-fix); every dollar not spent on a contractor is a dollar the church sends to its mission. This is the **Father's Business** anchor and the **Black-church-as-economic-powerhouse** frame: technology that lifts the Body and frees its resources to flow outward.

**ESV — 3 John 1:2:** *"Beloved, I pray that all may go well with you and that you may be in good health, as it goes well with your soul."* Soul-prosperity precedes and produces all prosperity; a church whose infrastructure **serves** it instead of **draining** it is freed to prosper outward — toward the communities and missions it exists to serve.

**Guardrail (infra is high-stakes — restated):** the IT/Ops module's **monitoring, alerting, and safe config are autonomous**; **risky changes — firewall rules, access changes, anything that can lock people out or drop the network — are HUMAN-GATED.** Same **Cage + four-brakes** model ([DR-0010]); the **2026-06 runaway** is the lesson that high-stakes autonomy ships only behind the brakes.

### 7.2 Secondary (honest footnote) — the API-arbitrage break-even

The vendor-API comparison is real but **minor**: the node does also run inference locally, but against the **$25 soft / $50 hard** monthly vendor cap that alone is **~70 months** to "break even" on hardware. So API arbitrage is a **footnote**; the avoided-IT-labor + freed-mission-budget case (§7.1) is the lead. (Camera economics still hold too: open-source cameras ≈ ⅓ of UniFi; one 48 GB node does detection + VLM + LLM; DIY cabling + church-owned drives keep the build inside $9k.)

### 7.3 Sovereignty + Cage + isolation

- **Sovereignty:** fully open-source + portable — Frigate, ONVIF cameras (a swappable standard), Linux+Docker+CUDA, the PoeTech App Module as front end. No vendor lock, footage local-only (`DATA-AS-EMPOWERMENT-NOT-EXTRACTION`). `COMMUNITY-FIRST` justifies the spend.
- **Ties to the Cage / COLG node:** this is the COLG sovereign-node compute from [DR-0014], here **scoped to surveillance + congregation support** (separate from the A/V switcher Node 2 and from the heavy-reasoning PoeTech farm). Registry/events on the church NAS; agent actions through `guarded-action` + ledger + health-gate.
- **Storage data-isolation (reinforced):** the new primary Synology chassis carries **Church Plus + member + financial data on their volumes AND surveillance on a separate dedicated volume** — **surveillance volume ≠ financial/member volume**, access-segregated; heavy 24/7 video write I/O never shares a volume with the member/financial store (§2.1). The **old NAS becomes a backup target → real 3-2-1 backup** for the sensitive data. Owned drives populate the new chassis → **$0 drive spend, zero added vendor dependency.**
- **24/7 vs 24/6.5 (reconciled):** surveillance/Frigate is 24/7; congregation support is reactive 24/7; the **24/6.5 Sabbath + ±1 h service blackout ([DR-0001]) govern the autonomous *review* fleet, not security recording or reactive congregation Q&A.** The three-brakes still bound any autonomous agent behavior.

---

## 8. Supplementary church-owned assets — Wyze floodlight cameras (BONUS; count TBC)

The church also has, **new-in-box**, **Wyze Cam Floodlight Pro** (180° ultra-wide, 3000 lumens, 2K, AI motion) **+ Wyze Cam Floodlight** units (**count TBC — pending Darrell's confirmation**).

- **Role: SUPPLEMENTARY exterior/deterrent coverage** — corners, entrances, parking — **NOT the backbone.** They are **WiFi + AC-powered** (no Cat6 drop; mount where floodlight wiring already exists), so they add coverage without new cabling.
- **Sovereignty caveat (stated plainly):** **Wyze is cloud-tied.** Integrate into Frigate / the PoeTech Surveillance Module via **`docker-wyze-bridge`** (works for many models; leans on the Wyze cloud/API; the **newer Floodlight Pro has spottier bridge support**). The **core whole-building system stays on ONVIF 4K PoE cameras with clean local streams** — the Wyze units are bonus, not load-bearing, so the sovereignty of the backbone is unaffected.
- **Budget:** **free assets.** If they bridge cleanly they *could* shave 1–2 purchased cameras (~$130 ea), but **bank that as BONUS coverage, not a counted reduction** — **net ~no change to the $9k.**
- **Pending input:** final Wyze quantity (Darrell confirming) → then we decide which exterior corners they cover vs. the ONVIF backbone. Do not finalize camera counts until that lands + the site walkthrough.

---

## 9. Recommendation + rationale (RATIFIED — decisions-with-rationale)

All choices are **locked with Darrell (2026-06-09)**; rationale recorded for the institutional memory:

1. **Open-source Frigate + ONVIF + a PoeTech App Surveillance Module**, not UniFi — *because* UniFi Protect is proprietary and ⅓-more-expensive, and a sovereign Module front-end is reusable, integrates with our identity/events/notification fabric, and keeps footage local with no vendor cloud.
2. **48 GB dual-3090, self-assembled** — *because* 48 GB runs detection + an event-driven VLM + a congregation LLM concurrently (a single 24 GB card can't), and self-assembly removes integrator labor; parts-only ~$3,600.
3. **Event-driven VLM + Cage agent with the autonomy guardrail** — *because* per-frame VLM is wasteful and unsafe-by-default; event-driven scene reads are cheap, and the alert/notify/illuminate-autonomous vs. authorities/locks-gated split keeps physical-security automation safe ([DR-0010]).
4. **DIY cabling ($0 in-budget) + a separate reduced-balance labor invoice** — *because* it keeps the $9k pure hardware (so whole-building + the 48 GB node both fit) while documenting the fair-market gift honestly for the church's books.
5. **NAS replacement: a new Synology chassis (~$1,050) as the new primary; old NAS → backup; owned drives = $0** — *because* the loose drives were bought to replace the aging NAS; the separate-NAS layout keeps DSM-native Church Plus + isolates surveillance from member/financial volumes + gives the church a real 3-2-1 backup. Funded by trimming cameras 24 → 22.
6. **Lead with the ROI: replaces paid IT → frees budget → mission ([DR-0051], §7)** — *because* the real return is the avoided network-engineer / managed-IT cost ($6–24k/yr or $100–150/hr), not API arbitrage; the LLM IT/Ops module does that work behind the Cage, and the freed budget flows to communities + missions (3 John 1:2; Father's Business). **Risky infra changes are human-gated; monitoring/alerting/safe-config autonomous** (Cage + four brakes; 2026-06 runaway lesson).
7. **Use the Wyze floodlight cams as BONUS exterior/deterrent only** — *because* they are cloud-tied and bridge imperfectly; the ONVIF PoE backbone stays load-bearing and sovereign.
8. **DO NOT imply any purchase** — PLAN; PoeTech/Darrell procures + assembles. **PENDING Darrell:** (a) **separate-NAS vs all-in-one**, (b) **Wyze unit counts**, (c) **old-NAS-as-backup + CMR/surveillance-rated drives** confirm; plus the **site walkthrough** for final camera/drop counts.
9. **DO NOT auto-fire irreversible/safety-critical actions** — those stay behind a human gate or a strict pre-authorized rule; locks fail-safe to egress-open; **infra changes (firewall/access/network) are human-gated.**

---

## Sources (June 2026 — re-verify at order time)

- [UniFi Camera G5 Pro $379 — Ubiquiti Store](https://store.ui.com/us/en/products/uvc-g5-pro); [AI Pro $499](https://store.ui.com/us/en/products/uvc-ai-pro) — the proprietary path, for contrast.
- [UniFi Protect is proprietary (community-reverse-engineered API) — hjdhjd/unifi-protect](https://github.com/hjdhjd/unifi-protect).
- [Frigate recommended hardware (open-source NVR)](https://docs.frigate.video/frigate/hardware/) — GPU/Coral/CPU detection; ONVIF/RTSP cameras.
- [Frigate setup with PoE cameras 2026 — CCTV Info](https://cctvinfo.com/guides/frigate-setup-poe-cameras) — Reolink RLC-810A 4K ~$50; Amcrest IP8M ~$80–130.
- [Frigate + Coral TPU local AI cameras — Botmonster](https://botmonster.com/posts/local-ai-security-cameras-frigate-with-google-coral-tpu/) — Coral ~$60, <5 W, 10–30 ms/frame.
- GPU pricing (used RTX 3090 ~$600–900 each; dual = 48 GB; ~700 W → 1300 W PSU) — 2026-06-08 church-LLM research-review §14 Sources ([hostrunway](https://www.hostrunway.com/blog/rtx-5090-vs-rtx-4090-used-3090-in-2026-is-the-upgrade-worth-it-for-local-llms/) / [XDA](https://www.xda-developers.com/used-rtx-3090-still-best-for-local-ai-in-value/) / [BSWEN](https://docs.bswen.com/blog/2026-03-15-rtx-5090-vs-dual-3090-local-ai/)).
- Qwen2.5-VL (vision-language) — see the model list in the 2026-06-08 church-LLM research-review §1 (added as the surveillance VLM).

---

*Security never sleeps; the congregation is helped whenever it asks; the building is watched by a sovereign eye on the church's own hardware, footage on the church's own disks, nothing locked to a vendor. The hands do the cable work as a gift, valued honestly and charged gently. Autonomy serves where it is safe and waits for a human where it is not. PLAN, not purchase. We all win. We create. Amen.*
