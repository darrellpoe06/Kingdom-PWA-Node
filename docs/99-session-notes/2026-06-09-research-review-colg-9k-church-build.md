# Research Review — COLG $9k Church Build (FINAL / RATIFIED): whole-building surveillance + a 48 GB CUDA node

**Date:** 2026-06-09
**Author:** Claude (research-review on Darrell's commission, per `feedback-research-first`)
**Triggered by:** Darrell — a **$9,000** church build covering BOTH whole-building surveillance (PoE, 4K, AI) AND a CUDA node for 24/7 congregation support + real-time scene analysis. Church of the Living God, ~44,000 sqft, 312 E. Bradley Ave, Champaign IL.
**Status:** **FINAL — choices RATIFIED with Darrell 2026-06-09 ([DR-0016], which supersedes [DR-0015]).** **PLAN ONLY — specs what to buy and what it unlocks; no purchase is executed. Darrell/PoeTech procures + self-assembles.** June-2026 pricing, cited; re-verify at order time.
**Pairs with:** [DR-0016] (finalization), [DR-0015] (superseded), [DR-0014] (COLG node), [DR-0012] (GPU topology), [DR-0001]/[DR-0003] (Cage + ISO tiers); the PoeTech labor invoice `docs/invoices/2026-06-09-poetech-colg-cabling-labor-invoice.md`; `infra/ai-orchestrator/` (the Cage); `COMMUNITY-FIRST-MISSION`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`.

---

## TL;DR — the ratified build

- **Surveillance = open-source path (LOCKED).** ONVIF 4K PoE cameras → **Frigate** (headless detection engine on the GPU node) → a **PoeTech App "Surveillance" MODULE** as the front end (live view, AI event feed, clips, alerts). **No UniFi Protect, no vendor cloud.** (Premise corrected: UniFi Protect is proprietary, not open-source.)
- **GPU = 48 GB dual-RTX-3090 node, self-assembled by Darrell (LOCKED).** Parts cost only, no integrator labor. 48 GB runs Frigate detection + an **event-driven VLM** + a congregation-support **LLM** concurrently.
- **Real-time analysis (LOCKED):** an **event-driven VLM (Qwen2.5-VL class)** reads scenes **on Frigate events** (not every frame); an **agent executes allowlisted actions through the Cage.** **Guardrail:** autonomous is OK for *alert / log / notify / illuminate*; anything **irreversible or safety-critical** (calling authorities, egress-affecting door locks, etc.) sits behind a **human gate** or a **pre-authorized, tightly-scoped rule with strict permission checks.**
- **Cabling = DIY by PoeTech (LOCKED).** **$0 labor against the $9k** — only Cat6 materials count. A **separate PoeTech labor invoice** documents the fair-market value (~$1,600–4,000) for the church's records; the church pays a **variable/reduced balance** (PoeTech does not charge full freight — give-from-understanding).
- **The $9k is now PURE HARDWARE** (labor is $0 in-budget / invoiced separately), so whole-building **and** the 48 GB node both fit.
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

- **Frigate** is the open-source detection/recording engine (no UI lock-in); it ingests RTSP from any ONVIF camera, records to local disk, and emits object/zone events.
- **The PoeTech App "Surveillance" Module is the front end** — a **reusable Module-Library module**: live view, AI event feed, clip review, alerts/notifications. It integrates with the **four-entity identity/roles** (staff-gated, ISO-2), **events-as-data** (`INSTITUTIONAL-MEMORY-EVENTS` — every detection/alert is an Event), and the **notification path** (ntfy/dual-channel). **No UniFi Protect app; no vendor cloud; footage local-only.**
- **TLC firewall:** this Module is church-scoped (ISO-2); it carries **no** TLC/PHI data path (ISO-1 holds).

---

## 2. Whole-building camera layout (~44,000 sqft) — 24 cameras

4K PoE, ONVIF, Frigate-managed. Final count **24** (matches the ratified allocation; tune on a site walkthrough).

| Zone | Cameras | Notes |
|---|---|---|
| Exterior building perimeter | 5 | 4K, IR/night, weatherproof |
| Parking lot(s) | 3 | wide / varifocal, plate-legible |
| Entrances / doors | 4 | main, side, fellowship, rear — face-height |
| Sanctuary | 3 | wide congregation + 2 angles |
| Fellowship hall / multipurpose | 2 | wide coverage |
| Hallways / corridors | 4 | choke points between wings |
| Classrooms / children's wing | 2 | wing corridors + entries |
| Office / count room | 1 | giving/financial area (ISO-2, staff-gated) |
| **Total** | **24** | ~24 cable drops (DIY) |

**Storage (flag — retention-tunable):** 24× 4K is disk-hungry. **2× 12 TB CMR surveillance HDD (~$225 ea)** = 24 TB raw (mirror → 12 TB usable, or JBOD 24 TB). Frigate's record-on-event tiering (full 4K only on motion/object, low-res continuous otherwise) stretches this to weeks; **retention is a dial — set it to the church's policy and add drives later if needed.**

---

## 3. GPU/CUDA node (LOCKED) — 48 GB dual-RTX-3090, self-assembled

48 GB lets the node run **three jobs at once**: Frigate detection (offloaded to a $60 Coral), an **event-driven VLM** for scene understanding, and a **congregation-support LLM** — concurrently, which a single 24 GB card could not.

| Component | Spec | ~Cost |
|---|---|---|
| **GPU ×2** | 2× used **RTX 3090 24 GB** → **48 GB** | $1,500–1,800 |
| Base | Ryzen / used dual-PCIe workstation, **128 GB RAM** | $700–1,000 |
| PSU | **1300 W** 80+ Platinum (two 3090s ≈ 700 W) | $200–250 |
| Storage | 2 TB NVMe (OS + models) + the surveillance HDDs (§2) | $150 |
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
| **24× 4K PoE ONVIF cameras** | ~$130/cam (Amcrest IP8M / Reolink RLC-811A class) | **$3,120** |
| **24-port PoE+ switch** | managed, sufficient PoE budget for 24× 4K | **$500** |
| **Cat6 materials** | bulk box + connectors + mounts (DIY install) | **$350** |
| **Storage 2× 12 TB CMR** | surveillance-grade; **retention-tunable** | **$450** |
| **UPS** | ride-through for node/switch/NVR (size ~1500 VA for the dual-3090) | **$300** |
| **Coral TPU** | offloads detection → frees 48 GB for VLM + LLM | **$60** |
| **Buffer** | price drift / extra mounts / a spare camera | **$620** |
| **TOTAL** | | **$9,000** |

**Cabling labor = $0 against the $9k** (DIY by PoeTech). Only the **$350 Cat6 materials** count. The fair-market labor value is **invoiced separately** (§6).

> **Power/thermal honesty:** two 3090s draw ~700 W under *full* load — more than a single card. But detection is on the Coral and the VLM is event-driven + the LLM reactive, so the **24/7 duty cycle is partial**; realistic power ~**$25–50/mo**. Needs a **ventilated closet/rack, good airflow, and the UPS sized for the pair** (~1500 VA). This is the cost of running VLM + LLM + detection on one sovereign box.

---

## 6. PoeTech labor invoice (separate deliverable) — fair-market value, reduced balance

Cabling is **DIY by PoeTech**, so it costs the church **$0 in cash labor**. To keep honest books and document the gift, a **separate fair-market-value invoice** sits beside the hardware plan: `docs/invoices/2026-06-09-poetech-colg-cabling-labor-invoice.md`.

- **Fair-market labor value:** ~24 cable drops @ $50–150 = **~$1,200–3,600**, plus GPU build + integration **~$400** → **~$1,600–4,000** (representative midpoint **~$2,500**).
- **Balance the church pays:** **variable / reduced** — PoeTech does not charge full freight (give-from-understanding; the Black-church-as-economic-powerhouse ethos). The invoice shows the value contributed and a reduced/at-discretion amount due, so the church can account for the in-kind blessing.
- **Honest framing on the invoice:** it is a **pro-forma fair-market-value estimate** (PLAN), not a bill for completed work.

---

## 7. Cost + sovereignty screens; ties to the COLG node + the Cage

- **Sovereignty:** fully open-source + portable — Frigate, ONVIF cameras (a swappable standard), Linux+Docker+CUDA, the PoeTech App Module as front end. No vendor lock, footage local-only (`DATA-AS-EMPOWERMENT-NOT-EXTRACTION`).
- **Cost screen:** security + ministry investment, not arbitrage. Open-source cameras ≈ ⅓ of UniFi; one 48 GB node does detection + VLM + LLM; DIY cabling removes the line that would have busted the budget. `COMMUNITY-FIRST` justifies the spend.
- **Ties to the Cage / COLG node:** this is the COLG sovereign-node compute from [DR-0014], here **scoped to surveillance + congregation support** (separate from the A/V switcher Node 2 and from the heavy-reasoning PoeTech farm). Registry/events on the church NAS; agent actions through `guarded-action` + ledger + health-gate.
- **24/7 vs 24/6.5 (reconciled):** surveillance/Frigate is 24/7; congregation support is reactive 24/7; the **24/6.5 Sabbath + ±1 h service blackout ([DR-0001]) govern the autonomous *review* fleet, not security recording or reactive congregation Q&A.** The three-brakes still bound any autonomous agent behavior.

---

## 8. Recommendation + rationale (RATIFIED — decisions-with-rationale)

All four choices are **locked with Darrell (2026-06-09)**; rationale recorded for the institutional memory:

1. **Open-source Frigate + ONVIF + a PoeTech App Surveillance Module**, not UniFi — *because* UniFi Protect is proprietary and ⅓-more-expensive, and a sovereign Module front-end is reusable, integrates with our identity/events/notification fabric, and keeps footage local with no vendor cloud.
2. **48 GB dual-3090, self-assembled** — *because* 48 GB runs detection + an event-driven VLM + a congregation LLM concurrently (a single 24 GB card can't), and self-assembly removes integrator labor; parts-only ~$3,600.
3. **Event-driven VLM + Cage agent with the autonomy guardrail** — *because* per-frame VLM is wasteful and unsafe-by-default; event-driven scene reads are cheap, and the alert/notify/illuminate-autonomous vs. authorities/locks-gated split keeps physical-security automation safe ([DR-0010]).
4. **DIY cabling ($0 in-budget) + a separate reduced-balance labor invoice** — *because* it keeps the $9k pure hardware (so whole-building + the 48 GB node both fit) while documenting the fair-market gift honestly for the church's books.
5. **DO NOT imply any purchase** — PLAN; PoeTech/Darrell procures + assembles; site walkthrough + church-NAS confirmation precede ordering.
6. **DO NOT auto-fire irreversible/safety-critical actions** — those stay behind a human gate or a strict pre-authorized rule; locks fail-safe to egress-open.

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
