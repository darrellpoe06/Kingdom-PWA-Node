# Research Review — COLG $9k Church Build: whole-building surveillance + a double-duty CUDA LLM farm

**Date:** 2026-06-09
**Author:** Claude (research-review on Darrell's commission, per `feedback-research-first`)
**Triggered by:** Darrell — a **$9,000** church build covering BOTH whole-building surveillance (PoE, 4K, AI cameras) AND a CUDA LLM system for 24/7 congregation-services support. Church of the Living God, ~44,000 sqft, 312 E. Bradley Ave, Champaign IL.
**Status:** Research-review. **PLAN ONLY — specs what to buy and what it unlocks; no purchase is executed. Darrell procures.** June-2026 pricing, cited; re-verify at order time.
**Decision:** [DR-0015]. **Pairs with:** [DR-0014] (COLG ≥$5k node), [DR-0012] (GPU topology), [DR-0001]/[DR-0003] (the Cage + ISO tiers), the 2026-06-08 church-LLM research-review §14; `infra/ai-orchestrator/` (the Cage); `COMMUNITY-FIRST-MISSION`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`, `project-cost-discipline-with-growth-permission`.

---

## TL;DR

- **Premise correction (head-on):** Darrell asked for **"open-source Ubiquiti 4K cameras."** Those two don't coexist — **UniFi Protect is a polished, self-hosted-but PROPRIETARY ecosystem, not open-source.** And at **$379 (G5 Pro) / $499 (AI Pro)** per camera, a ~30-camera whole-building deployment is **$11k+ in cameras alone — over the entire $9k before a single GPU.**
- **The honest budget tension:** whole-building 4K AI **+** a capable GPU farm **does not fit $9k on the UniFi path.** It **does** fit on the **open-source path** — and that path also matches Darrell's sovereignty stance and enables the key efficiency below.
- **Recommended path: (B) Frigate NVR (open-source) + ONVIF/RTSP 4K PoE cameras + one CUDA GPU doing double duty** — Frigate object-detection (light) **and** the sovereign congregation-support LLM (heavy), gated by the §4 human-priority/blackout logic. Sovereign, portable, and the only path that lands whole-building + GPU inside $9k.
- **Recommended allocation:** ~30 cameras + PoE/switching + storage + a single **RTX 3090 (24 GB) double-duty node**, with a **contingency buffer for cabling labor** — and a **phased fallback** (GPU + priority cameras now, remaining cameras next) because professional cabling labor across 44k sqft is the one cost that can blow the budget.
- **24/7 vs 24/6.5 reconciled:** surveillance + congregation-support are **24/7** (security never sleeps; congregation help is reactive). The **24/6.5 Sabbath + service blackout (DR-0001) apply to the autonomous *review* fleet, not to security or reactive congregation Q&A.**

---

## 1. The two camera paths (with the premise corrected)

| | **(A) UniFi Protect** | **(B) Frigate + ONVIF (RECOMMENDED)** |
|---|---|---|
| **Cameras** | UniFi G5 Pro 4K **$379** / AI Pro 4K **$499** | ONVIF/RTSP 4K PoE — Reolink RLC-810A **~$50**, RLC-811A varifocal **~$80–100**, Amcrest IP8M **~$80–130** |
| **NVR** | UNVR **$299** (18 cams) / UNVR Pro **$499** (24 cams) | **Frigate** (open-source, $0) running on the GPU node |
| **AI detection** | On-camera / UniFi proprietary | **The GPU does it** (Frigate + CUDA), or a $60 Coral TPU offloads it |
| **Openness / sovereignty** | **Proprietary, self-hosted, local/no-cloud — but a closed ecosystem; vendor-locked** | **Fully open-source, portable, ONVIF-standard cameras are swappable; no lock-in** |
| **Ease / polish** | Highest — turnkey, warranty, slick app | Moderate — more setup; integrates directly with the LLM farm |
| **~30-camera cost (cameras only)** | **~$11,400 (G5 Pro) / ~$15,000 (AI Pro) — OVER the whole $9k budget alone** | **~$2,100–3,300** |

**Verdict:** UniFi is the easier, more polished system, but (1) it is **not open-source** (correcting the premise), (2) it **cannot do whole-building + a GPU within $9k**, and (3) it doesn't give us the **one-GPU-double-duty** efficiency. **Recommend Path B (Frigate).** Honest trade-off: Path B costs setup effort and forgoes UniFi's warranty/polish; it buys openness, portability, swappable standard cameras, and the shared-GPU efficiency that makes the whole build fit the budget. (UniFi remains a reasonable *partial* or *phased-later* option if the church later prioritizes polish over budget on a subset of cameras.)

---

## 2. Whole-building camera layout (~44,000 sqft)

A thorough-but-reasonable count for a 44k sqft church. 4K PoE, ONVIF, Frigate-managed.

| Zone | Cameras | Notes |
|---|---|---|
| Exterior building perimeter | 6 | 4K, IR/night, weatherproof; covers walls + approaches |
| Parking lot(s) | 4 | wide-angle / varifocal for plate-legible coverage |
| Entrances / doors | 5 | main, side, fellowship, office, rear — face-height framing |
| Sanctuary | 3 | wide congregation + 2 angle views |
| Fellowship hall / multipurpose | 2 | wide coverage |
| Hallways / corridors | 6 | choke-point coverage between wings |
| Classrooms / children's wing | 3 | wing corridors + entries (rooms themselves per policy) |
| Office / admin / count room | 2 | giving/financial handling areas (ISO-2, staff-gated) |
| **Total** | **~31** | tune on a walkthrough; round to **28–32** |

**Storage math:** ~30× 4K cameras on continuous + event recording needs substantial disk. Plan **3× 12 TB surveillance-grade HDD (~$150–230 ea)** for a few weeks of retention; Frigate's detect-vs-record tiering (record at full 4K only on motion/object) stretches this considerably. Tune retention to the church's policy.

---

## 3. GPU/CUDA node — double duty (Frigate AI + 24/7 congregation LLM)

**Key efficiency: one GPU serves both.** Frigate object-detection is light (10–30 ms/frame on a modern GPU, or offloadable to a $60 Coral TPU); the congregation-support LLM is the heavy tenant. They share the card under the §4 priority logic.

| Component | Spec | ~Cost |
|---|---|---|
| **GPU** | **1× used RTX 3090 (24 GB)** | **$700–900** |
| Base | Ryzen/used-workstation, 64–128 GB RAM, B650/X-class board | $600–900 |
| PSU | 850–1000 W 80+ | $130–180 |
| Storage | 2 TB NVMe (OS + models) + the surveillance HDDs above | $150 (NVMe) |
| Case + cooling | airflow tower | $120–200 |
| (optional) Coral TPU | offloads ALL camera AI → frees the full 24 GB for the LLM | $60 |
| **Node subtotal** | | **~$1,700–2,300** |

**VRAM → model class (24 GB):** comfortably runs a **14B-class congregation-support model** (`qwen2.5`/`qwen3:14b`, S1) **with headroom for Frigate detection**; or **~32B Q4** if camera AI is offloaded to the Coral. For congregation-facing support — service times, scripture lookup, event info, directions, FAQ, prayer-request intake — a **14B is more than sufficient**, and leaves VRAM for detection. (Heavy reasoning lives on the separate PoeTech farm per [DR-0014]; this node is congregation-facing + security.)

**Ties to the Cage:** congregation-support runs behind the Cage (guarded-action + append-only ledger + health-gate); registry on the church NAS; this node is the COLG sovereign-node compute from [DR-0014], here **scoped to surveillance + congregation support** rather than heavy reasoning.

---

## 4. Budget allocation across $9,000 (open-source path)

**Recommended single-budget split:**

| Line | Allocation |
|---|---|
| ~30× 4K PoE ONVIF cameras (mix fixed/varifocal) | **$2,800** |
| 2× 24-port PoE+ managed switches (or 1× 48-port) | **$700** |
| Cat6 cabling materials (bulk + connectors + mounts) | **$400** |
| Surveillance storage (3× 12 TB HDD) | **$650** |
| GPU double-duty node (RTX 3090 build + optional Coral) | **$2,000** |
| UPS (NVR/switch/GPU ride-through) | **$300** |
| **Hardware subtotal** | **~$6,850** |
| **Contingency / cabling LABOR buffer** | **~$2,150** |
| **Total** | **$9,000** |

**The honest flag — cabling labor is the variable that can break the budget.** ~30 cable drops across a 44k sqft building, professionally installed, can run **$50–150/drop ($1,500–4,500)**. The $2,150 buffer covers a modest/volunteer or partial-professional install; a full union/contractor pull likely **exceeds it**.

**Therefore — recommended PHASED fallback (the safe default):**
- **Phase 1 (~$5,000–5,500):** GPU double-duty node + Frigate + the **~15 highest-value cameras** (all exterior, all parking, all entrances, sanctuary) + switch + storage + UPS + their cabling. Security + congregation LLM **live now.**
- **Phase 2 (~$3,500–4,000):** remaining interior cameras (halls, classrooms wing, fellowship, office) + their cabling labor.

Phasing de-risks the labor unknown and gets the high-value coverage + the 24/7 LLM standing up first. If cabling is volunteer/low-cost, the single-budget split above does the whole building at once.

---

## 5. Cost + sovereignty screens; 24/7 power/thermal; 24/7-vs-24/6.5

- **Sovereignty screen:** Path B is fully open-source + portable (Frigate, ONVIF cameras are a swappable standard, Linux+Docker+CUDA) — no vendor lock, matching `DATA-AS-EMPOWERMENT-NOT-EXTRACTION` and the sovereignty stance. Footage stays on the church's own NAS/disks, local-only. UniFi would have been local-but-proprietary.
- **Cost screen:** this is a **security + ministry investment**, not arbitrage. The open-source path costs ~⅓ of UniFi per camera and reuses the GPU for both jobs — the cheapest route to whole-building + sovereign LLM. `COMMUNITY-FIRST` (COLG-first) justifies the spend.
- **24/7 power/thermal:** a single 3090 idles low and draws ~350 W under LLM load (vs ~700 W for the dual-card farm) — **far more 24/7-friendly thermally and on the power bill** (~$10–20/mo). Cameras/PoE are low-draw. Put the node in a ventilated closet/rack with the UPS.
- **24/7 vs the 24/6.5 Sabbath — reconciled (important):** **surveillance/Frigate is genuinely 24/7** (security never rests). **Congregation-support is reactive 24/7** (it answers when asked). The **24/6.5 Sabbath + the ±1 h service blackout ([DR-0001]) apply to the autonomous *review/automation* fleet** — the timer-driven jobs that carry runaway risk — **not** to security recording or to a reactive congregation Q&A endpoint. This church node is **separate from the A/V switcher (Node 2)**, so it is not subject to the A/V service contention; it can serve congregation support during services. The three-brakes still bound any autonomous behavior on it.

---

## 6. Recommendation + rationale (decisions-with-rationale)

**Recommended: Path B (open-source Frigate + ONVIF 4K PoE) with a single RTX 3090 double-duty node; phase the camera rollout; reserve UniFi as an optional later polish layer. PLAN only — Darrell procures.**

1. **DO go open-source (Frigate + ONVIF), not UniFi** — *because* UniFi Protect is proprietary (correcting the premise), busts $9k for whole-building before any GPU, and forgoes the shared-GPU efficiency. Frigate is sovereign, portable, ⅓ the per-camera cost, and integrates with the LLM farm.
2. **DO use ONE GPU for double duty** (Frigate detection + 14B congregation LLM), optionally with a $60 Coral to offload detection — *because* it is the efficiency that makes both fit one budget; a 24 GB 3090 covers both with headroom.
3. **DO phase the rollout** (GPU + ~15 priority cameras now, interior cameras next) — *because* cabling labor across 44k sqft is the one line that can exceed the budget; phasing de-risks it and stands up security + the 24/7 LLM first.
4. **DO keep this node congregation-facing + security only**; heavy reasoning stays on the separate PoeTech farm ([DR-0014]) — *because* a 14B fits 24 GB with room for detection, and scope-separation keeps the church node simple and sovereign.
5. **DO NOT imply any purchase** — this is a PLAN; the church procures.
6. **DO NOT subject security recording or reactive congregation support to the 24/6.5 Sabbath** — *because* those are not the autonomous review fleet; security is 24/7 and congregation help is reactive. The Sabbath/blackout governs autonomous timer-driven jobs.

**If Darrell prefers UniFi's polish despite the premise:** the honest split is **UniFi cameras for a *partial* high-value set (~12–15 cams ≈ $5–6k) + the GPU node**, deferring whole-building — i.e., UniFi forces either partial coverage or a higher budget. Stated so the trade is explicit.

---

## Sources (June 2026 — re-verify at order time)

- [UniFi Camera G5 Pro — Ubiquiti Store](https://store.ui.com/us/en/products/uvc-g5-pro) — G5 Pro 4K $379.
- [UniFi Camera AI Pro — Ubiquiti Store](https://store.ui.com/us/en/products/uvc-ai-pro) — AI Pro 4K $499.
- [UNVR / UNVR Pro pricing — iFeeltech](https://ifeeltech.com/blog/unifi-unvr-vs-unvr-pro-comparison) — UNVR $299 (18 cams), UNVR Pro $499 (24 cams).
- [UniFi Protect is proprietary; community API reverse-engineered — hjdhjd/unifi-protect](https://github.com/hjdhjd/unifi-protect) — confirms Protect itself is not open-source.
- [Frigate recommended hardware (open-source NVR)](https://docs.frigate.video/frigate/hardware/) — GPU/Coral/CPU detection; ONVIF/RTSP cameras.
- [Frigate setup with PoE cameras 2026 — CCTV Info](https://cctvinfo.com/guides/frigate-setup-poe-cameras) — Reolink RLC-810A 4K ~$50; Amcrest IP8M; ~$350 baseline serious setup.
- [Frigate + Coral TPU local AI cameras — Botmonster](https://botmonster.com/posts/local-ai-security-cameras-frigate-with-google-coral-tpu/) — Coral ~$60, <5 W, 10–30 ms/frame; GPU alternative.
- GPU pricing (used RTX 3090 ~$600–900) — see the 2026-06-08 church-LLM research-review §14 Sources (hostrunway / XDA / BSWEN).

---

*Security never sleeps; the congregation is helped whenever it asks. One sovereign GPU watches the building and answers the people, on the church's own hardware, footage on the church's own disks, nothing locked to a vendor. We plan diligently and buy only what serves. PLAN, not purchase. We all win. We create. Amen.*
