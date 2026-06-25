# LOCAL-LLM HARDWARE RECOMMENDATION

**Date:** 2026-06-23
**Author:** Claude (advisory) — for Darrell's decision (he holds the purchase)
**Status:** RESEARCH-REVIEW → SINGLE RECOMMENDATION. **Authorizes no purchase.** Money moves only on Darrell's greenlight.
**Layer:** 3 reference (decision support), built on Layer-4 research and the hardware Decision Records.

> **Verification note (DR-0076 / Verification Doctrine).** Every price and tok/s figure below carries a citation fetched June 2026. Prices are volatile (active DRAM/GPU memory crisis through mid-2026) — confirm the exact street price the day of purchase; do not trust this doc's number as still-current at buy time. Figures I could not measure directly are marked **(est.)** with the basis stated.

---

## 0. Why this doc exists now (the trigger)

Darrell has lost trust in cloud Claude over the last four weeks; **today the weekly usage cap stalled the local-LLM cutover work** — the exact failure this purchase is meant to end. The binding need is **continuity**: a sovereign box that keeps the build moving when the vendor is capped, down, or refusing. This is a research-first decision for a **$4–6k+** purchase (Darrell's research-first rule).

**This is a re-open at a higher budget, not a re-derivation.** The repo already concluded a **deferred dual-RTX-3090 (~$2k, 48 GB)** farm-augment ([DR-0014](../decisions/DR-0014-hardware-budget-directive-procurement-plan.md), [DR-0053](../decisions/DR-0053-cuda-box-decoupled-from-r4-no-purchase-yet.md), [AI-INFRASTRUCTURE-HARDWARE-OPTIONS](_future/AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md)). The **delta**: coding is now the **primary** workload (build the modular PoeTech app + n8n pipeline), continuity is **urgent**, and the budget is raised. That changes the math — see §6.

---

## 1. What's already concluded (build on, don't re-derive)

| Prior decision | What it set | Status |
|---|---|---|
| [DR-0014](../decisions/DR-0014-hardware-budget-directive-procurement-plan.md) | PoeTech farm budget **$5k**; honest break-even ~70 months vs the $25–50/mo cap → justified by **sovereignty + capability + data-control + farm role, not by beating an API bill** | PLAN |
| [DR-0053](../decisions/DR-0053-cuda-box-decoupled-from-r4-no-purchase-yet.md) | GPU purchase **deferred** until live load proves VRAM binding; default pick = used dual-3090; CUDA-native preferred | ACCEPTED |
| [DR-0012](../decisions/DR-0012-gpu-topology-conservative-single-4070-creative-preemption.md) | Daily reasoner locked to 14B-class on a 12 GB 4070; **Darrell's creative apps (Premiere/AE/C4D/Photoshop/OBS) get absolute GPU preemption** | ACCEPTED |
| [DR-0056](../decisions/DR-0056-tiered-llm-orchestrator-perpetual-fix.md) / [DR-0073](../decisions/DR-0073-orchestrator-capability-aware-routing.md) | Tiered local→vendor→local ladder; `ORCH_MODE=vendor-first` **now** (local 3B-on-CPU too weak), flips to **local-first the moment a real GPU box lands** | ACCEPTED |
| [DR-0062](../decisions/DR-0062-local-llm-source-of-truth-vendor-evaluated-against-it.md) | App is **vendor-independent**; local LLM is source of truth; vendor output is evaluated against local before use | ACCEPTED |

**Current sovereign infra (probed 2026-06-10, [research review](../99-session-notes/2026-06-10-research-review-network-infra-for-local-llms.md)):** Synology **DS1621xs**, Xeon D-1527, 32 GB ECC, **no GPU**, dual 10 GbE, on Tailscale. Runs Ollama 0.24, n8n, Postgres+pgvector, `nomic-embed-text`, and small Qwen models at CPU speed (14B ≈ 1–3 tok/s — batch-only). **This box is the registry/automation tier and stays exactly that.** The question is what GPU box augments it.

---

## 2. Verified comparison table (June 2026)

All-in build = GPU + workstation parts (CPU, 128 GB RAM, PSU, NVMe, case) where the GPU is a bare card. tok/s = single-stream decode (generation) at Q4 unless noted.

| Path | VRAM / mem | GPU price (verified) | Realistic all-in | 70B Q4 tok/s | **32B coder Q4 tok/s** | CUDA? | Power | Noise |
|---|---|---|---|---|---|---|---|---|
| **Single RTX 5090** (★ rec.) | 32 GB GDDR7 | ~$2,900–3,500 AIB; FE MSRP $1,999 unobtanium [1] | **~$4,800–5,400** | n/a single-card (needs ~40 GB → CPU spill, slow) | **~45–55 (est.)** [4][7] | ✅ native | ~575 W card | high under load |
| **Dual RTX 5090** | 64 GB | 2×~$3,000 = ~$6,000 [1] | **~$8,000+** | **~27** [3] | ~45–55 (est.) | ✅ native | ~1,150 W card → 1500 W PSU | very high |
| **RTX PRO 6000 Blackwell** | 96 GB GDDR7 ECC | **~$8,250–9,200** (NVIDIA list $13,250) [2] | **~$10,000–11,000** | ~30–40 (est., 1.8 TB/s, single-card no PCIe split) | ~50–60 (est.) | ✅ native | 600 W, blower | moderate (workstation blower) |
| **NVIDIA DGX Spark** | 128 GB unified LPDDR5x | **$4,699** (was $3,999, raised Feb 2026) [5] | **$4,699** (appliance) | **2.7 (Q4) → 7.8 (NVFP4)** [5] | ~8–12 (est., 273 GB/s bound) | ✅ native | ~240 W | quiet |
| **Mac Studio M3 Ultra 96 GB** | 96 GB unified (819 GB/s) | **$3,999** (96/1TB base; ~$3,749 on sale) [6] | **$3,999** (appliance) | **12–18** [8] | **12–22** [8] | ❌ **no CUDA** | ~160–270 W | near-silent |
| *Dual RTX 3090 (prior pick, anchor)* | 48 GB | ~$1,800–2,200 used [DR-0053] | ~$2,800–4,200 | ~15–20 (est.) | ~32 (single 3090) [7] | ✅ native | ~700 W | high |

**Citations:** [1] gpudeals/trackalacker/pcprice — RTX 5090 street ~$2.9–3.5k AIB, FE MSRP $1,999 but unavailable. [2] thundercompute/videocardz — RTX PRO 6000 Blackwell ~$8.25–9.2k street, NVIDIA list $13,250. [3] databasemart 2×RTX 5090 Ollama bench: Llama 3.3 70B Q4 **26.85**, DeepSeek-R1 70B **27.03**, Qwen2.5 72B **24.15** tok/s (beats single H100 single-stream). [4] markaicode RTX 5090: Llama 8B Q4 ~48 tok/s vLLM, ~290 W. [5] explainx/toolhalla/intuitionlabs DGX Spark: $4,699, 128 GB, 273 GB/s, 70B **2.7→7.8** tok/s, 120B-MoE 35–80 tok/s. [6] Apple/tomshardware/macrumors: M3 Ultra 96 GB/1 TB = $3,999; 512 GB option **pulled** Mar 2026, 256 GB upgrade raised to +$2,000 (DRAM crisis). [7] localaimaster/medium: Qwen2.5-Coder 32B Q4 on single 3090 ~32 tok/s (5090 ~1.8× bandwidth → ~45–55 est.). [8] insiderllm Mac 2026 guide: Qwen 32B/Coder 32B **12–22**, Llama 70B **8–15** tok/s.

> **Why the est. for 5090 32B coder is sound:** decode is memory-bandwidth-bound. RTX 5090 ≈ 1.79 TB/s vs 3090 ≈ 0.94 TB/s (~1.9×). A 3090 measures ~32 tok/s on Qwen2.5-Coder 32B Q4 [7]; scaling by bandwidth lands ~50 tok/s, derated to ~45–55 for overhead. **This is the single most decision-relevant number and it should be confirmed on the actual card before final sign-off** (DR-0076).

---

## 3. Map to Darrell's actual needs (weighted)

| Need (weight) | What it requires | Best fit |
|---|---|---|
| **Agentic coding — build the modular app + n8n (HIGHEST)** | A 24–32B coder (Qwen2.5-Coder 32B / Devstral) running **fast** (40+ tok/s) for real daily offload | **5090** (45–55) ≫ Mac (12–22) ≫ Spark (8–12) |
| **Continuity when cloud is capped (HIGH — the trigger)** | Box is up and snappy without any vendor | Any CUDA box; 5090 best for coding-shaped continuity |
| **Transcription (Whisper-class)** | faster-whisper / WhisperX — **CUDA-native, far faster on NVIDIA** | CUDA boxes; Mac runs MLX-Whisper but slower |
| **NDI / CUDA media future** | NDI + CUDA encode/decode, TensorRT, Frigate GPU detection — **all CUDA-only** | CUDA boxes only — **Mac is a dead-end here** |
| **Per-industry sovereign LLM teams** | Run several models concurrently → wants VRAM headroom (vLLM) | 96 GB (PRO 6000) > 64 GB (dual 5090) > 32 GB (single 5090, swaps) |
| **Sovereign / low ongoing cost** | Self-hosted, no per-token bill | All qualify |

**Honest gap (DR-0076, no overselling):** the best open coders today — **Qwen2.5-Coder 32B** and **Devstral Small 24B** — are excellent for completion, single-file generation, refactors, mechanical multi-file edits, code review, and n8n-node scaffolding. They are **not** at Claude-Opus level on the *hardest* multi-file agentic build tasks (deep cross-module reasoning, long-horizon tool-use chains). **Realistic split: local carries ~70–80% of daily build work and 100% of continuity; vendor escalation (the existing DR-0056 ladder) covers the hard ~20%.** No local box on this list closes that last 20% in June 2026. Buy the box to *own the 80% and never stall* — not to fully replace cloud coding on day one.

---

## 4. Darrell's screens applied

**Cost-efficiency (growth justification · unit cost · lean alternative · break-even):**
- *Break-even, stated honestly:* vs a $25–50/mo cap, a ~$5k box is **~100+ months** to pay back on the API bill alone. **It is NOT justified by beating the bill** (consistent with DR-0014). It is justified by: **continuity** (today's cap stalled the cutover — that recurs), **sovereignty + data-control**, the **CUDA media future** (Mac/cloud can't serve it), and the **farm role** (coding + transcription + VLM + per-industry teams on one owned asset).
- *Unit cost:* single 5090 build ≈ **$4.8–5.4k** for ~50 tok/s sovereign coding + full CUDA stack. Lowest $/coding-throughput in the CUDA-capable set under $6k.
- *Lean alternative (documented):* **used dual-3090 ~$2.8–4.2k** (48 GB, holds 70B, CUDA) — the prior pick. Still valid if budget must compress to ~$3k; trade-offs = used-market risk (no warranty during a cap event) and ~1.8× slower 32B decode.

**Sovereign-mesh compatibility (tier 1–4):**
- **Tier 1 (full sovereign + augments the CUDA mesh):** RTX 5090, dual 5090, RTX PRO 6000, DGX Spark — all CUDA-native, join Tailscale, serve the media pipeline.
- **Tier 3 (sovereign for text, but breaks the CUDA pipeline):** **Mac Studio** — excellent local text box, but **no CUDA** strands NDI/TensorRT/Frigate/faster-whisper. Disqualifying for *this* role given the named media future.

**MVP-pragmatism:** buy the box that unblocks coding-continuity **now** at the smallest sufficient spend — not the maximal 96 GB box. Single 5090 clears the binding constraint (fast 32B coder + CUDA) inside budget. 96 GB / multi-model-team capacity is a *later, evidence-triggered* upgrade, not a now-buy.

**Fit with the NAS (DS1621xs, no GPU) — augment or replace?** **Augments, never replaces.** NAS stays the always-on registry/automation tier (Postgres+pgvector, n8n, embeddings, `nomic-embed-text`, the orchestrator brake-host). The GPU box is the **inference + coding + media** tier that the NAS routes to. Clean split, already the architecture in the [2026-06-09 orchestrator design](../99-session-notes/2026-06-09-sovereign-ai-orchestrator-architecture.md).

---

## 5. THE RECOMMENDATION

### Buy a single **RTX 5090 (32 GB) workstation now — NOT the DGX Spark, NOT the Mac Studio, NOT (yet) the dual-5090 or RTX PRO 6000 — built dual-GPU-ready so the second card is a drop-in.**

**X not Y because Z:**
- **5090 not DGX Spark** — because the daily win is **32B-coder decode speed**, and the 5090 does ~45–55 tok/s vs the Spark's ~8–12 (the Spark's 273 GB/s bandwidth bottlenecks exactly the dense-model decode coding needs). The Spark wins only on huge-model *capacity* and low power — neither is Darrell's binding constraint. Same price tier ($4.7k vs ~$5k built).
- **5090 not Mac Studio M3 Ultra** — because **CUDA**. The NDI/CUDA media pipeline, faster-whisper, vLLM/TensorRT, and Frigate GPU detection are CUDA-native; the Mac strands all of them. The Mac's one edge (96 GB unified → 70B at 12–18 tok/s) is neutralized: a fast 32B + vendor escalation covers the 70B need without abandoning the media future.
- **5090 not dual-5090 / RTX PRO 6000 (yet)** — MVP-pragmatism. A single 5090 clears the binding constraint inside the $4–6k envelope; 64 GB / 96 GB is an evidence-triggered upgrade (when per-industry multi-model teams or 70B-resident actually bind), built into the spec as a drop-in second card.
- **5090 not the prior used dual-3090** — because coding is now *primary* and continuity is *urgent*: new-with-warranty (a used card dying mid-cap is the failure we're fixing), ~1.8× faster 32B decode, and a clean upgrade lane. Dual-3090 stays the documented lean fallback at ~$3k.

### Exact box to buy (~$4,800–5,400 all-in)

| Part | Spec | Why |
|---|---|---|
| GPU | **1× NVIDIA RTX 5090 32 GB** (AIB: ASUS TUF / MSI / Gigabyte) | fast 32B coder + 14B + Whisper concurrently; CUDA-native |
| CPU | AMD Ryzen 9 9950X (16c) | strong CPU-spill + general; no bottleneck |
| RAM | **128 GB DDR5** | CPU-offload of 70B when needed + big-model loading headroom |
| Mobo | X870E with **2× PCIe 5.0 x16 (x8/x8)** | **second 5090 is a drop-in — no rebuild** |
| PSU | **1500 W 80+ Platinum** | runs one 5090 now, both later — buy once |
| Storage | 2 TB Gen5 NVMe (models) + 4 TB NVMe (data) | fast model load + workspace |
| Case/cooling | high-airflow, 2-GPU clearance | dual-card thermals |
| OS/stack | Ubuntu 24.04 LTS + Docker + **Ollama + vLLM** | matches the sovereign portable stack |

### Models to run on it (per tier)

- **Coder (primary, the daily offload):** `qwen2.5-coder:32b` Q4_K_M (~22 GB) · alt `devstral-small` (24B) for agentic tool-use chains.
- **General reasoning (fast, fits alongside):** `qwen2.5:14b` / `qwen3:14b` Q4.
- **70B (when needed):** `llama3.3:70b` Q4 — CPU+GPU split on the single card (slow); becomes resident after the 2nd card (64 GB).
- **Transcription:** `faster-whisper` / WhisperX `large-v3` (CUDA) — fast on the 5090.
- **Vision / media future:** `qwen2.5-vl:7b` (→ 32B after 2nd card).
- **Embeddings/RAG:** `nomic-embed-text` — **stays on the NAS** (already live).

---

## 6. Phased buy / implement plan

- **Phase 0 — Buy + stand up (week 1).** Confirm 5090 street price day-of; buy the build above. Ubuntu + Docker + Ollama + vLLM; join Tailscale mesh. NAS unchanged.
- **Phase 1 — Coding continuity (week 1–2).** Pull `qwen2.5-coder:32b`; verify ~45–55 tok/s on the real card (DR-0076 — measure, don't assume). Wire into orchestrator **v0 advisory** ([DR-0056](../decisions/DR-0056-tiered-llm-orchestrator-perpetual-fix.md)); flip `ORCH_MODE` toward **local-first for coding** once verified ([DR-0073](../decisions/DR-0073-orchestrator-capability-aware-routing.md)). **Goal met: the build keeps moving when cloud is capped.**
- **Phase 2 — Transcription + media groundwork (week 3–4).** faster-whisper; first NDI/CUDA pipeline probe; Qwen2.5-VL for vision tasks.
- **Phase 3 — Per-industry LLM teams (month 2+).** Multiple models via vLLM. **If VRAM binds → drop in the 2nd RTX 5090 (→ 64 GB)** — PSU/mobo already specced, no rebuild.
- **Phase 4 — Long-horizon consolidation (evidence-gated).** Only if 70B-resident + heavy concurrent multi-model teams prove binding → **RTX PRO 6000 Blackwell 96 GB** as the single-card consolidation. Not before the data demands it.

---

## 7. Upgrade / rollback path

- **Upgrade:** +2nd RTX 5090 → **64 GB** (declared lane, drop-in) → if still binding, **RTX PRO 6000 96 GB**. Each step is evidence-triggered, not pre-committed.
- **Rollback / no-stranded-asset:** if the box underdelivers for *coding*, it does **not** become dead weight — it's a top-tier CUDA workstation that directly serves Darrell's **creative apps** (Premiere/AE/C4D/OBS per [DR-0012](../decisions/DR-0012-gpu-topology-conservative-single-4070-creative-preemption.md)) and the media pipeline, and `ORCH_MODE=vendor-first` still covers coding. The 5090 holds resale value far better than a used 3090. Downside is bounded.

---

## 8. Top 2 risks

1. **Local 32B won't match cloud Claude on the hardest agentic coding.** Honest gap (§3). *Mitigation:* keep the DR-0056 vendor-escalation ladder for the hard ~20%; local owns the routine ~80% **and** all continuity. Buying this box ends the *stall*, not the *need for vendor on the hardest tasks* — set that expectation up front.
2. **Price/power/availability volatility + 32 GB ceiling.** 5090 street prices run well above MSRP through the mid-2026 memory crisis [1] and a single 32 GB card **can't hold 70B resident** (CPU-spill until the 2nd card). A dual-5090 build draws ~1,150 W card power → **plan home electrical, cooling, and noise** before committing to the 2-card endpoint. *Mitigation:* confirm price day-of; the single-card build + vendor escalation covers 70B-class needs until the evidence-gated 2nd card.

---

*Decision record to follow once Darrell greenlights: a new DR citing this review (do not rewrite DR-0014/0053 — new directive = new DR, per DR-0011).*
