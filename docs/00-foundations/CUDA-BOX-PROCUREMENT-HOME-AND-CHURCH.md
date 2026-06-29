# CUDA-BOX-PROCUREMENT-HOME-AND-CHURCH.md

**Status:** BUY-READY PROCUREMENT BOM (2026-06-23). **Advisory only — this session makes NO purchase.** Darrell places every order by his own hand (GOVERNANCE-EXECUTION-ADVISORY). This document gives links + a bill-of-materials so the buy is one click away; it never buys.

**Purpose:** Two complete, buy-ready procurement bills-of-materials for the CUDA boxes Darrell is buying THIS WEEKEND:
1. **HOME** — Darrell's sovereign coding / dev box (single RTX PRO 6000 96GB workstation; 70B+ with headroom; CUDA; simpler/quieter).
2. **CHURCH (COLG)** — the bigger 128GB+/192GB multi-GPU media + AI node that drives the Sanctuary LED video wall, Whisper transcription, local LLM, and concurrent users.

> **Verification doctrine (DR-0076):** every price below was **read off a live retailer/vendor product page on 2026-06-23** by a research pass, with the source domain named. Nothing is from memory. Prices are volatile (the 2026 DRAM/NAND crunch is real and climbing) — **every line carries a "verify at checkout" note, because prices move weekly.** Where a part was out of stock or a price could not be machine-verified today, it is FLAGGED as such rather than guessed.

> **Grounding:** This is the procurement layer under [`LOCAL-LLM-HARDWARE-RECOMMENDATION.md`](LOCAL-LLM-HARDWARE-RECOMMENDATION.md) (the single-5090 rec + RTX PRO 6000 / dual path), `DR-0014` (hardware budget directive), `DR-0053` (CUDA box decoupled, buy-on-evidence), `DR-0050`/`DR-0016` (the COLG $9k NAS+camera build), the COLG Sanctuary LED video-wall install ([`docs/99-session-notes/2026-06-23-colg-video-wall-install-start-event.md`](../99-session-notes/2026-06-23-colg-video-wall-install-start-event.md)), and the NDI/CUDA sovereign media pipeline ([`AI-MEDIA-PRODUCTION-PLATFORM-VISION.md`](_root/AI-MEDIA-PRODUCTION-PLATFORM-VISION.md)).

---

## 0. The tier delta — honored, with the honest engineering note

The earlier recommendation defaulted to a **single RTX 5090 (32GB)** and phased to dual / RTX PRO 6000 *only on measured load* (DR-0053). **Darrell has now chosen the 128GB+ VRAM / 70B+ parameter tier up front.** This document honors that choice. The honest engineering note that goes with it:

- **A 70B model at Q4 is ~40–48GB.** It fits in **one 96GB card** with a large context window and room to spare. So the **70B+ goal is fully met by a single RTX PRO 6000 96GB** — that is the HOME recommendation, and it is *simpler, quieter, and one PCIe slot.*
- **128GB+ is not needed to run 70B.** What 128GB+/192GB actually buys is: **FP16 70B** (full precision, not Q4), **120B+ class models** (e.g., GPT-OSS-120B, Qwen3-Coder-Next 80B+), **multiple models resident at once**, and **concurrency headroom** (many simultaneous users / batch media jobs). That is exactly the **CHURCH node's** job — many congregants + the LED-wall media pipeline + Whisper + an LLM all at once — so the 128GB+/192GB tier is honored *there*, where the workload genuinely binds it.
- **Net:** HOME = 96GB single card (meets 70B+ with headroom, per the cost-discipline screen). CHURCH = 192GB multi-GPU (the 128GB+ tier, where concurrency + media + FP16/120B actually need it). Buying dual-card 128GB *at home* would be premature against DR-0053; buying it *at the church* is the workload.

---

## 1. Verified GPU prices (read live 2026-06-23)

These are the cards both builds are priced around. **Verify at checkout — prices move weekly.**

| GPU | VRAM / power | Verified price (2026-06-23) | Where | Note |
|---|---|---|---|---|
| **RTX PRO 6000 Blackwell — Workstation Edition** | 96GB GDDR7 ECC / 600W | **$11,829.99** Newegg-direct; **~$8,500–$9,200** via authorized partners | [Newegg](https://www.newegg.com/nvidia-blackwell-rtx-pro-6000-96gb-graphic-card/p/N82E16814132106); partner range per [thundercompute.com](https://www.thundercompute.com/blog/nvidia-rtx-pro-6000-pricing) | The card for both builds. NVIDIA list MSRP $13,250 ([mlq.ai](https://mlq.ai/news/nvidia-raises-rtx-pro-6000-blackwell-msrp-to-13250-a-55-hike-in-one-year/)). **Best value = an authorized partner near $8.5–9.2K; Newegg-direct is the guaranteed-in-stock fallback.** In stock. |
| RTX PRO 6000 Blackwell — Max-Q | 96GB / **300W** (2-slot) | $14,999 (thin) | [Newegg (3rd-party seller)](https://www.newegg.com/nvidia-900-5g153-2200-000-rtx-pro-6000-96gb-graphics-card/p/N82E16814132105) | Same 96GB at half the power/heat — ideal for **dense multi-GPU** (4× fits air-cooled). Only a single low-review marketplace listing today; **vet the seller.** |
| RTX PRO 6000 Blackwell — Server Edition | 96GB / 600W passive | $13,399.99 | [Newegg](https://www.newegg.com/nvidia-900-2g153-0000-000-rtx-pro-6000-96gb-graphics-card/p/N82E16814132104) | Passive — **requires server-chassis airflow**, not a desktop. Context only. |
| **GeForce RTX 5090** | 32GB GDDR7 / 575W | **$4,199–$4,299** in-stock (Newegg AIB); **~$2,650** chase-stock (B&H PNY) | [Newegg 5090 listings](https://www.newegg.com/p/pl?d=rtx+5090); [B&H](https://www.bhphotovideo.com/c/buy/rtx-5090/ci/60217) | MSRP $1,999 but real street ~2× ([Tom's Hardware](https://www.tomshardware.com/pc-components/gpus/b-and-h-photo-undercuts-prime-day-pricing-pny-rtx-5090-is-the-lowest-priced-rtx-5090-right-now)). Founders Edition ~$1,999 sells out in minutes. **Weekend-dependable number = ~$4,200 Newegg.** |

---

## 2. HOME — Darrell's sovereign coding / dev box

**Recommendation: 1× RTX PRO 6000 Blackwell 96GB workstation.** One quiet 600W card runs a 70B coder *and* a 32B coder concurrently with a big context window, drives the full CUDA media stack (Stable Diffusion / FLUX / ComfyUI / Coqui XTTS), and leaves headroom — without the noise, heat, and 20A-circuit demands of a dual-card box. This is the *simpler/quieter* path the workload actually calls for at home.

### 2A. HOME — DIY BOM (sovereign build, full cost transparency)

Two host tiers are priced. **TRX50 (recommended)** gives ECC memory, far more PCIe lanes, and a clean drop-in path for a 2nd card later. **AM5** is cheaper and quieter but non-ECC and lane-limited. *Note the socket: TRX50 is sTR5 and needs an sTR5 cooler — not the AM5 AIO.*

| # | Component | Recommended part | Verified price (2026-06-23) | Link |
|---|---|---|---|---|
| 1 | **GPU** | NVIDIA RTX PRO 6000 Blackwell WS Edition 96GB | **$8,500–$11,830** (partner→Newegg-direct) | [Newegg](https://www.newegg.com/nvidia-blackwell-rtx-pro-6000-96gb-graphic-card/p/N82E16814132106) |
| 2 | **CPU** | AMD Threadripper 7960X (24-core, sTR5) | **$1,170.99** | [Newegg](https://www.newegg.com/amd-ryzen-threadripper-7000-series-ryzen-threadripper-7960x-storm-peak-socket-str5-desktop-cpu-processor/p/N82E16819113804) |
| 3 | **Motherboard** | ASUS Pro WS TRX50-SAGE WIFI | **$899.99** | [Newegg](https://www.newegg.com/asus-pro-ws-trx50-sage-wifi-ceb-form-factor-12-inch-x-11-inch-motherboards-amd-amd-trx50-str5/p/N82E16813119666) |
| 4 | **RAM** | 128GB (4×32GB) DDR5-5600 ECC RDIMM (V-COLOR) | **$4,569.99** ⚠ DRAM crunch | [Newegg](https://www.newegg.com/v-color-128gb/p/2SJ-004R-00023) |
| 5 | **PSU** | Seasonic PRIME TX-1300 (1300W 80+ Titanium, ATX 3.1) | **$458.99** (backordered) | [Newegg](https://www.newegg.com/seasonic-usa-atx-3-0-compatible-1300-w-80-plus-titanium-certified-power-supply-ssr-1300tr2/p/N82E16817151261) |
| 6 | **NVMe SSD** | WD Black SN850X 4TB (Gen4) | **$649.99** | [Newegg](https://www.newegg.com/western-digital-4tb-black-sn850x-nvme/p/N82E16820250244) |
| 7 | **Chassis** | Fractal Design Define 7 XL (full tower) | **$239.99** | [Newegg](https://www.newegg.com/fractal-design-atx-full-tower-define-7-xl-steel-computer-case-black-fd-c-def7x-01/p/N82E16811352118) |
| 8 | **CPU cooler** | Noctua NH-U14S TR5-SP6 (sTR5) | **$139.69** | [Newegg](https://www.newegg.com/noctua-nh-u14s-tr5-sp6/p/13C-0005-00336) |
| 9 | **UPS** | CyberPower OR2200PFCRT2U (2000VA / 1540W) | **$740.95** | [Newegg](https://www.newegg.com/cyberpower-or2200pfcrt2u-nema-5-20r/p/N82E16842102129) |

**HOME-DIY (TRX50) total: ~$17,400 (partner GPU) to ~$20,700 (Newegg-direct GPU).**
- Power draw: ~850–950W under full load; fine on a standard 15A office circuit. UPS covers it with headroom.

**Cheaper AM5 alternative** (non-ECC, simpler, quieter — swap items 2/3/4/8): Ryzen 9 9950X **$549.99** ([Newegg](https://www.newegg.com/amd-ryzen-9-9000-series-ryzen-9-9950x-granite-ridge-socket-am5-desktop-cpu-processor/p/N82E16819113841)) + ASUS ProArt X870E-Creator WiFi **$505.99** ([Newegg](https://www.newegg.com/asus-proart-x870e-creator-wifi-atx-motherboard-amd-x870-am5/p/N82E16813119688)) + 96–128GB DDR5 non-ECC (**⚠ FLAG: Corsair Vengeance 96/128GB kits OUT OF STOCK on Newegg today, price stripped — expect ~$650–$900, backorder or marketplace**) + NZXT Kraken 360 AM5 AIO **$209.33** ([Newegg](https://www.newegg.com/nzxt-liquid-cooling-394-mm-intel-socket-lga-1700-1200-115x-amd-socket-am5-am4-strx4-tr4-black/p/N82E16835146120)). **AM5 total: ~$12,900 (partner GPU) to ~$15,900 (Newegg-direct GPU).**

### 2B. HOME — Prebuilt alternative (skip the build, get a warranty)

| Vendor | Product | Config | Price | Link |
|---|---|---|---|---|
| **BIZON (best fit)** | BIZON X3000 | Ryzen 9000, up to 192GB DDR5, configure **1× RTX PRO 6000 96GB**; pre-set for Ollama/vLLM/llama.cpp | base **$3,754**; **~$12K–$14K configured** with the 96GB card | [bizon-tech.com](https://bizon-tech.com/workstation-hardware-local-llm) |
| Puget Systems | Single-GPU Generative AI Workstation | Ryzen 9 9900X; swap base 5090 → **RTX PRO 6000 96GB** in configurator | starting **$4,553**; **$9,874 as-configured w/ 5090** (PRO 6000 raises it) | [pugetsystems.com](https://www.pugetsystems.com/solutions/photo-editing-workstations/generative-ai/) |

**HOME verdict:** Darrell builds — **DIY (TRX50)** is the sovereign, ECC, growth-ready pick at ~$17.4–20.7K (sourcing the GPU from an authorized partner near $8.5–9.2K is the single biggest lever — it saves ~$3K vs Newegg-direct). If he'd rather skip the build and get a warranty, **BIZON X3000 configured with the 96GB card** is the cleanest prebuilt. Either way it's ONE 96GB card — 70B+ with headroom.

### 2C. HOME — models to run

- **Coder (daily driver):** Qwen2.5-Coder-32B (91% HumanEval; ~20GB Q4) — leaves the rest of the 96GB for a big context window + a second model.
- **Coder (agentic):** Devstral Small 2 (24B) — agent-first; the OpenClaw tool-calling default.
- **Reach (now possible on one card):** dense **70B Q4** (Llama 3.3 70B / Qwen 2.5 72B, ~40–48GB) for heavy reasoning — *the capability the 96GB card unlocks at home.*
- **Media:** Stable Diffusion / FLUX + ComfyUI + Coqui XTTS (all CUDA-first).
- **Transcription:** Whisper large-v3 (real-time on this card).

---

## 3. CHURCH (COLG) — media + AI node (the 128GB+/192GB tier)

**Recommendation: 2× RTX PRO 6000 Blackwell = 192GB.** This is the cleaner build than 4× RTX 5090 (128GB) for a church node, for concrete engineering reasons:
- **It fits.** Two cards on the WRX90 board's spaced PCIe 5.0 ×16 slots, **one 1600W PSU on one circuit.** Four triple-slot RTX 5090s **do not** fit standard spacing, draw ~2,300W of GPU alone (**dual-PSU + a 240V/dedicated circuit + riser cabling**), and run hot and loud — wrong for a church AV room.
- **More usable VRAM (192 > 128GB), ECC, quieter, supportable.** 192GB runs FP16 70B *or* a 120B coder *or* several models at once for many concurrent congregants — the actual concurrency the LED wall + Whisper + LLM workload demands.
- **For a 4× density build, use the Max-Q (300W) card,** not the 600W WS Edition — that's how the validated 4× air-cooled builds are done (Exxact Valence, §3B).

### 3A. CHURCH — DIY BOM (2× RTX PRO 6000 = 192GB)

| # | Component | Recommended part | Verified price (2026-06-23) | Link |
|---|---|---|---|---|
| 1 | **GPU ×2** | 2× RTX PRO 6000 Blackwell WS 96GB (=192GB) | **$17,000–$23,660** (partner→Newegg-direct, ×2) | [Newegg](https://www.newegg.com/nvidia-blackwell-rtx-pro-6000-96gb-graphic-card/p/N82E16814132106) |
| 2 | **CPU** | AMD Threadripper PRO 7975WX (32-core, sTR5) | **$3,799.99** | [Newegg](https://www.newegg.com/amd-ryzen-threadripper-7000-series-ryzen-threadripper-pro-7975wx-storm-peak-socket-str5-desktop-cpu-processor/p/N82E16819113807) |
| 3 | **Motherboard** | ASUS Pro WS WRX90E-SAGE SE (7× PCIe 5.0 ×16) | **$1,292.99** | [Newegg](https://www.newegg.com/asus-pro-ws-wrx90e-sage-se-eeb-motherboard-amd-wrx90-str5/p/N82E16813119667) |
| 4 | **RAM** | 256GB (8×32GB) DDR5-5600 ECC RDIMM (V-COLOR) | **$8,339.99** ⚠ DRAM crunch | [Newegg](https://www.newegg.com/v-color-256gb/p/2SJ-004R-00074) |
| 5 | **PSU** | Seasonic PRIME TX-1600 (1600W 80+ Titanium) | **$459.99**–$899 (seller-dependent) | [Newegg](https://www.newegg.com/seasonic-prime-tx-1600-1600-w/p/N82E16817151255) |
| 6 | **NVMe SSD ×2** | 2× WD Black SN850X 4TB (OS + media scratch) | **$1,299.98** | [Newegg](https://www.newegg.com/western-digital-4tb-black-sn850x-nvme/p/N82E16820250244) |
| 7 | **Chassis** | Fractal Meshify 2 XL (tower) **or** SilverStone RM44 4U (rack) | **$219.99** tower / **$449.83** 4U | [Tower](https://www.newegg.com/fractal-design-atx-full-tower-meshify-2-xl-steel-computer-case-black-fd-c-mes2x-02/p/N82E16811352137) · [4U](https://www.newegg.com/p/2KH-0030-00258) |
| 8 | **CPU cooler** | Noctua NH-U14S TR5-SP6 (sTR5) | **$139.69** | [Newegg](https://www.newegg.com/noctua-nh-u14s-tr5-sp6/p/13C-0005-00336) |
| 9 | **UPS** | CyberPower PR3000RT2UC (3000VA / 3000W) | **$1,843.95** | [Newegg](https://www.newegg.com/cyberpower-pr3000rt2uc-8-x-nema-5-20r-1-x-nema-l5-30r/p/2FT-0008-004E2) |

**CHURCH-DIY (2× RTX PRO 6000, tower) total: ~$33,400 (partner GPUs) to ~$41,100 (Newegg-direct GPUs).**
- Power draw: ~1,550W GPU (2×600W) + ~350W CPU → **~2,000W under full load.** The TX-1600 covers GPUs+CPU; size the **UPS at 3000VA/3000W** and put the node on a **dedicated 20A (ideally L5-30R / 240V) circuit.** ⚠ A "2200VA" UPS only delivers ~1540W — under-rated; the 3000VA unit above is the right size.

### 3B. CHURCH — alternative & prebuilt options

| Option | Config | Price | Link | Note |
|---|---|---|---|---|
| **4× RTX 5090 (128GB) DIY** | swap item 1 → 4× RTX 5090; **dual-PSU + 240V + riser spacing required** | **~$30,800 (chase-stock 5090) – $37,000 (Newegg 5090)** | [Newegg 5090](https://www.newegg.com/p/pl?d=rtx+5090) | More raw tok/s per dollar, but **messier, hotter, louder, harder to power** — not recommended for an AV room. |
| **BIZON X4000 (prebuilt, best fit)** | up to **4× RTX PRO 6000**; Threadripper; pre-set LLM stack | base **$6,046**; **~$24K–$28K configured** (2× RTX PRO 6000) | [bizon-tech.com](https://bizon-tech.com/workstation-hardware-local-llm) | Exact 2×/4× RTX PRO 6000 match; verify the **RAM amount** in the quote (the DIY's 256GB ECC is the cost driver). |
| Exxact Valence (validated 4× build) | **4× RTX PRO 6000 Max-Q**; TR PRO 9000; 1TB ECC | **quote** (budget $40K+) | [exxactcorp.com](https://www.exxactcorp.com/blog/news/exxact-validates-4x-nvidia-rtx-pro-6000-blackwell-max-q-in-a-workstation) | The reference for a clean air-cooled **4× = 384GB** box if the church ever needs it. |
| Puget multi-GPU rackmount | TR PRO 9965WX; up to 4× RTX 6000 Max-Q; 5U | starting **$21,841**; **$24,506 as-configured** | [pugetsystems.com](https://www.pugetsystems.com/solutions/photo-editing-workstations/generative-ai/) | Credible warrantied alternate. |

**CHURCH verdict:** For COLG — elderly tech-novice staff, an AV room, mission-critical Sunday service (COMMUNITY-FIRST-MISSION) — a **warrantied, thermally-validated prebuilt is the right call**, not a DIY the church can't service. **Primary recommendation: BIZON X4000 configured with 2× RTX PRO 6000 (192GB)** (~$24–28K, confirm RAM in quote), or **Exxact Valence** if 4×/384GB is wanted. The DIY BOM above (~$33–41K) stands as the **cost-transparency reference and the sovereign-build option** if the church prefers to own the build. **⚠ Scope note:** this 192GB node is a *major step up* from the ~$9k COLG NAS+camera build (DR-0050) and the ~$14–19k figure in earlier notes — it is a **separate, larger capital line**; reconcile it on the Video Wall capital-project surface before greenlight (per the video-wall install event's gating note).

### 3C. CHURCH — models to run

- **Coder + general (concurrent):** 70B-class (Llama 3.3 70B / Qwen 2.5 72B) **at FP16** *or* Qwen3-Coder-Next (80B/3B-active) + a 120B-class general model — 192GB holds **multiple models resident** for many users at once.
- **Transcription:** Whisper large-v3 — real-time sermon/stream transcription feeding the broadcast + accessibility captions.
- **Media generation:** Stable Diffusion / FLUX (image), Stable Video Diffusion (video), ComfyUI orchestration, Coqui XTTS (voice) — the CUDA payload that generates LED-wall content. This is the compute behind the NDI/CUDA pipeline the video wall consumes.

---

## 4. OpenClaw-local wiring (both boxes)

Both boxes run **Ubuntu LTS + NVIDIA driver/CUDA + Docker + Ollama**, Tailscale-joined to the mesh, reachable same-origin like `/n8n` (never the absolute Funnel URL — see `project_n8n_same_origin_rewrite`). OpenClaw speaks to Ollama's OpenAI-compatible endpoint — **no API keys, fully offline once weights are pulled.** Full wiring (config block, 64k context, air-gap proof) is in [`LOCAL-LLM-HARDWARE-RECOMMENDATION.md` §7](LOCAL-LLM-HARDWARE-RECOMMENDATION.md). Short form:

```json
{
  "models": { "providers": { "ollama": { "apiBase": "http://<box-ip>:11434/v1" } } },
  "agents": { "defaults": { "model": { "primary": "ollama/qwen2.5-coder:32b" } } }
}
```

`ollama pull qwen2.5-coder:32b devstral llama3.3:70b whisper`, point OpenClaw at the box's Tailscale IP, set context ≥ 64k, confirm via `ollama ps` + a WAN-pull air-gap test. The CHURCH node additionally hosts the media pipeline (ComfyUI/SD/FLUX/XTTS) and Whisper for the broadcast.

---

## 5. Procurement summary — the two configs

| | **HOME (Darrell's dev box)** | **CHURCH (COLG media+AI node)** |
|---|---|---|
| **Recommended** | 1× RTX PRO 6000 96GB workstation | 2× RTX PRO 6000 = **192GB** node |
| **DIY total (verified)** | **~$17,400–$20,700** (TRX50, ECC) | **~$33,400–$41,100** (tower) |
| **Cheaper DIY** | ~$12,900–$15,900 (AM5, non-ECC) | — |
| **Prebuilt** | BIZON X3000 ~$12–14K | BIZON X4000 ~$24–28K *(recommended for church)* |
| **VRAM tier** | 96GB (70B+ w/ headroom) | 192GB (FP16 70B / 120B / concurrency) |
| **Power / circuit** | ~850–950W, 15A OK | ~2,000W, 3000VA UPS + 20A/240V circuit |
| **Top GPU link** | [RTX PRO 6000 — Newegg](https://www.newegg.com/nvidia-blackwell-rtx-pro-6000-96gb-graphic-card/p/N82E16814132106) | same card ×2 |

**Single biggest cost lever (both):** source the RTX PRO 6000 from an **authorized partner near $8.5–9.2K** rather than Newegg-direct ($11,830) — saves ~$3K/card. **DRAM is the second:** ECC RDIMM is at 3–4× historical pricing; if the budget bites, the HOME AM5 (non-ECC) path or a smaller RAM config on the church box is where to flex.

**Verify at checkout — every price above moves weekly. This document buys nothing; Darrell places the orders.**

---

## 6. Sources

All prices read live on **2026-06-23** from: newegg.com (GPUs, CPUs, motherboards, RAM, PSUs, SSDs, chassis, coolers, UPS — primary), bizon-tech.com, pugetsystems.com, boxx.com, exxactcorp.com, lambda.ai, thinkmate.com (prebuilt vendors), thundercompute.com + mlq.ai (RTX PRO 6000 street/MSRP), tomshardware.com + bhphotovideo.com (RTX 5090). Unverifiable-today items (B&H/Amazon automated-fetch blocks, paywalled VideoCardz drop, out-of-stock kits) are flagged inline above. Models + OpenClaw wiring per `LOCAL-LLM-HARDWARE-RECOMMENDATION.md` §5/§7.

---

*Recorded as procurement projects in the PoeTech app — **HOME node** (`pr-cuda-home-box`) and **COLG node** (`pr-cuda-colg-node`) — in the Projects hub, linked to the COLG video-wall capital project (`sanctuary-video-wall`) and the NDI/CUDA media pipeline. Advisory under the hardware lineage DR-0014 → DR-0053. A purchase, when made, becomes a new dated DR carrying the measured trigger + actual paid prices.*
