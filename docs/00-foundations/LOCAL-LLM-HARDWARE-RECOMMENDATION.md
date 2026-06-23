# LOCAL-LLM-HARDWARE-RECOMMENDATION.md

**Status:** RECOMMENDATION (2026-06-23). Advisory only — makes NO purchase. The buy is Darrell's hand (GOVERNANCE-EXECUTION-ADVISORY).

**Purpose:** Pick the best PRIVATE, SOVEREIGN local-LLM box to run PoeTech's primary AI work OUTSIDE vendor cloud LLMs. Privacy / legal exposure is a PRIMARY driver — cloud AI chats are subpoena-able and discoverable; nothing should leave Darrell's control; air-gappable matters. The bar is NOT cloud parity — it is "what I need and more for my programming projects," private and capable enough.

> **Verification doctrine (DR-0076):** every price / tok-s number below is cited to a June-2026 source (§9) or explicitly flagged as an estimate. "Looks right" is not a status. Where a single-stream decode rate was not directly published for a config, it is marked *(est., bandwidth-bound)* with the math shown.

---

## 0. TL;DR — the ONE recommendation

**Build a single-GPU RTX 5090 CUDA workstation now** (Linux + Ollama), run **Qwen2.5-Coder-32B** as the daily coding driver wired to **OpenClaw**, and **size the chassis/PSU for a second RTX 5090** — adding it (→ 64GB, native dense-70B) only when measured load proves the need.

**X not Y because Z:**
- **CUDA RTX 5090 workstation, NOT NVIDIA DGX Spark** — the Spark's 273 GB/s memory bandwidth caps dense single-stream decode at **~2.7 tok/s on 70B** and roughly single-digit-to-low-teens on a 32B coder; that is too slow for the *primary interactive coding* job. (The Spark is a strong *batch/concurrency* and *128GB-capacity* box, not an interactive-coder box.)
- **CUDA RTX 5090 workstation, NOT Mac Studio M3 Ultra** — the Mac has fine throughput (32B coder ~23–30 tok/s) and is quiet/low-power, but it **has no CUDA**, which forfeits the entire planned media pipeline (Stable Diffusion / FLUX / ComfyUI / Coqui XTTS are all CUDA-first) and breaks from the repo's already-ratified **Linux + Ollama** sovereign plan (DR-0014 / DR-0053).
- **Start single, phase to dual, NOT buy dual/RTX-6000 up front** — a single RTX 5090 already delivers **48 tok/s on the 32B coder** (the actual daily driver), fully offline, for a ~$5–5.5K build. Buying 64–96GB of VRAM *before* the workload proves it needs dense-70B violates the cost-efficiency screen and DR-0053's "don't buy VRAM before measured load binds it" discipline.

**This box AUGMENTS the NAS, it does not replace it.** DS1621xs stays the data home + n8n orchestration + always-on small-classifier/embeddings host; the 5090 box is the GPU "brain" for interactive coding, dense-70B-when-needed, and media generation.

---

## 1. Where this fits the existing plan (repo grounding)

This is not a fresh decision — it is the **trigger event** the repo already designed for.

- **`DR-0014` (Hardware Budget Directive, 2026-06-09):** ratified a ~$5K PoeTech GPU farm; rationale is **sovereignty + capability + data-control**, stated honestly, *not* beating a small API bill (~70-month "break-even" vs a $25–50/mo vendor cap).
- **`DR-0053` (CUDA box decoupled, no purchase yet, 2026-06-11):** GPU purchase **deferred until measured workload proves VRAM binding**. Default pick when triggered was used dual-3090 (~$2K, 48GB) — this doc *updates* that pick to current-gen 5090 economics (3090 supply has dried up; 5090 is the live 32GB card in June 2026).
- **`AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` / `AI-INFRASTRUCTURE-SYNOLOGY.md`:** DS1621xs (Xeon D-1527, 32GB ECC, **no GPU**) does 3–8 tok/s on 7B CPU-only — sub-conversational. Confirmed: the NAS cannot be the interactive-coder host; it is storage + orchestration.
- **`UNIFIED-INPUT-AND-OFFLOAD-REVIEW.md`:** the sovereign offload layer is *fully designed and scaffolded but NOT deployed*; the single gating dependency is **GPU hardware**. This doc removes that gate.
- **`AI-MEDIA-PRODUCTION-PLATFORM-VISION.md`:** the media vision (Stable Diffusion/FLUX image, Stable Video Diffusion, Coqui XTTS voice, ComfyUI orchestration) is **CUDA-first** — this is the decisive reason the recommendation stays on NVIDIA/CUDA rather than Apple Silicon.
- **`FEATURE-WORKFLOW-REGISTER.md` (#284):** `wf-class-tutor` (qwen2.5 on NAS Ollama), `36-quality-gatekeeper`, `wf-llm-review`, `16-cross-verify-engine`, `17-gemini-deeper-reasoning` are the workflow rows waiting on local inference — they become "local-able at conversational latency" the moment this box stands up.
- **Three-brakes rule (`feedback_autonomous_automation_three_brakes`):** any timer-driven use of this box ships with budget + concurrency-lock + kill-switch. Interactive OpenClaw use is human-driven and not in that class.

---

## 2. Requirements & screens (Darrell's filters)

| Screen | What it demands here |
|---|---|
| **Privacy / sovereignty (PRIMARY)** | Offline-capable, air-gappable, nothing leaves the home. All four candidates satisfy this once weights are local — so it is a *gate*, not a differentiator. The differentiator is *which* sovereign box does the actual job well. |
| **Open coding throughput per $ (weighted)** | The daily driver is a 32B coder. Single RTX 5090 = 48 tok/s/$3.7K-card wins this axis outright. |
| **Cost-efficiency** (growth justification / unit cost / lean alternative / break-even) | Lean alternative = **single 5090 now**, dual later only on proven load. Break-even is *sovereignty*, not arbitrage (DR-0014). |
| **Sovereign-mesh-compat** | Linux + Ollama + Tailscale; reachable from the PWA via the same `/n8n`-style same-origin pattern; no vendor lock. CUDA box fits; Mac breaks the Linux/Ollama mesh assumption. |
| **MVP-pragmatism** | Don't buy 64–96GB before the 32B coder proves insufficient. Ship the one card that does the job. |
| **Fit with NAS (DS1621xs, no GPU)** | **Augment.** NAS = data + orchestration + small models; GPU box = the brain. Not a replacement. |

---

## 3. The three candidate paths (VERIFIED, June 2026)

### 3.1 Path A — CUDA GPU workstation (RTX 5090 / dual 5090 / RTX PRO 6000 Blackwell)

**RTX 5090 (32GB GDDR7), single card**
- **Price:** MSRP $1,999; **street ~$3,658–$4,199** (June 2026) — inflated 75%+ over MSRP by the GDDR7/DRAM shortage. [§9-a,b]
- **Power/noise:** ~575W TGP per card; ~850W full system; audible under load but fine on a standard 15A office circuit.
- **Measured:** **Qwen2.5 32B @ 48 tok/s** (Ollama); Qwen2.5-Coder-7B @ 5,841 tok/s batch-8. [§9-c,d] A dense 70B Q4 (~40GB) **does not fit** in 32GB — needs dual.
- **Full single-card build:** card + Ryzen 9 / Threadripper-lite + 128GB RAM + 1000W PSU + NVMe + case ≈ **$5,000–$5,500**.

**Dual RTX 5090 (64GB combined)**
- **Measured (Ollama, dual 5090):** **Llama 3.3 70B Q4 = 26.85 tok/s**; DeepSeek-R1 70B = 27.03; Qwen 2.5 72B = 24.15 tok/s — *faster than H100 / dual-A100-40GB for 70B inference at ~25% the cost.* [§9-e]
- **Power/noise:** ~1,150W GPU → 1,600W PSU, 20A circuit advisable, loud under sustained load; real heat in a closed room.
- **Full build:** ≈ **$9,000–$11,000**.

**RTX PRO 6000 Blackwell (96GB GDDR7 ECC), single card**
- **Price:** retail **$8,000–$9,200** (NVIDIA list $13,250); 600W single-slot. [§9-f]
- **Capability:** runs dense-70B Q4 *and* a 32B coder concurrently on one quiet card, with headroom for Qwen3-Coder-Next (80B/3B-active). Best capability-density; quietest/simplest CUDA path; **but ~$10–12K full build** — premature for the current workload.

### 3.2 Path B — NVIDIA DGX Spark

- **Price:** **$4,699** (raised from $3,999 launch, Feb 2026, memory-supply). [§9-g,h]
- **Specs:** GB10 Grace Blackwell, **128GB unified LPDDR5X**, **273 GB/s** bandwidth, ~1 petaFLOP (FP4 sparse), ~240W, near-silent, 1.2kg, CUDA-native, air-gappable. Runs up to ~200B params resident.
- **Measured:** **Llama 3.1 70B FP8 = 803 tok/s prefill / 2.7 tok/s decode** — the decode rate is the *bandwidth wall*. [§9-i] On GPT-OSS 120B (MXFP4 MoE): 1,723 prefill / 38.55 decode. DeepSeek-R1 14B FP8 **batch-8 = 2,074 tok/s aggregate** (83.5/req). [§9-g,j]
- **32B coder, single-stream:** *(est. ~8–11 tok/s, bandwidth-bound: 273 GB/s ÷ ~20GB Q4 ≈ 13 tok/s ceiling, ~0.7 real-world efficiency)* — usable but not snappy for interactive agentic coding.
- **Verdict:** brilliant **batch / concurrency / capacity** box and a genuinely sovereign one — but **single-stream dense decode is its weakness**, which is exactly the interactive-coder workload.

### 3.3 Path C — Mac Studio M3 Ultra

- **Price/configs (post-pullback):** base **$3,999** (M3 Ultra, 96GB, 1TB). **512GB option REMOVED (March 2026)**; 256GB now **+$2,000** ($5,999); only **96GB and 256GB** remain. [§9-k,l,m] Driven by the DRAM shortage.
- **Specs:** 800 GB/s unified bandwidth — ~3× the Spark — quiet, ~vs-200W, fully offline.
- **Measured/est.:** **70B Q4 ≈ 12–18 tok/s**; **Qwen2.5-Coder-32B Q4 (MLX) ≈ 22.7 tok/s** on M2/M3 Max, higher on M3 Ultra (~25–30). [§9-n,o]
- **Decisive limit:** **NO CUDA.** MLX/llama.cpp only. This forfeits the planned media pipeline (Stable Diffusion / FLUX / ComfyUI / Coqui XTTS are CUDA-first) and diverges from the ratified Linux+Ollama sovereign stack. Good throughput per dollar; wrong ecosystem for *this* roadmap.

---

## 4. The 3-path price / tok-s comparison table

| Path | Box | Buy price (Jun 2026) | Full build | VRAM/unified | 32B coder (interactive, single-stream) | Dense 70B Q4 (single-stream) | Power / noise | CUDA / media pipeline | Sovereign / air-gap |
|---|---|---|---|---|---|---|---|---|---|
| **A (rec.)** | **Single RTX 5090** | ~$3,658–4,199 card | **~$5–5.5K** | 32GB | **48 tok/s** ✅ | ✗ (no fit) | ~850W, audible | ✅ full | ✅ |
| A+ | Dual RTX 5090 | ~$7.3–8.4K cards | ~$9–11K | 64GB | ~48 tok/s ✅ | **24–27 tok/s** ✅ | ~1,150W GPU, loud | ✅ full | ✅ |
| A++ | RTX PRO 6000 Blackwell | ~$8–9.2K card | ~$10–12K | 96GB | fast ✅ | ✅ + headroom | 600W, quiet | ✅ full | ✅ |
| **B** | DGX Spark | **$4,699** | $4,699 (turnkey) | 128GB unified | ~8–11 tok/s *(est.)* | **2.7 tok/s** ✗ | ~240W, silent | ✅ (CUDA), weak decode | ✅ |
| **C** | Mac Studio M3 Ultra | **$3,999** (96GB) | $3,999 / $5,999 (256GB) | 96 / 256GB unified | ~23–30 tok/s ✅ | **12–18 tok/s** ✅ | low, quiet | ✗ **no CUDA** | ✅ |

Reading the table for Darrell's weighting (open coding throughput per $, fully private): **single RTX 5090 wins the daily-driver axis**, the Mac wins on quiet-throughput-per-dollar *but loses CUDA*, the Spark wins capacity/concurrency *but loses interactive decode*, and dual-5090 / RTX-6000 are the proven, in-house *upgrade path* for dense-70B — bought later, on evidence.

---

## 5. Open models to run (per tier)

All Apache-2.0 / MIT, all Ollama-pullable, all fully offline once downloaded.

- **Coder (daily driver):** **Qwen2.5-Coder-32B** — 91.0% HumanEval (matches GPT-4o), fits one 5090 at Q4 (~20GB), 48 tok/s. [§9-c,p]
- **Coder (agentic, leaner):** **Devstral Small 2 (24B)** — 68% SWE-bench Verified, agent-first (Cline/Aider/OpenHands), runs single 5090 / 32GB Mac. [§9-p] Use this as the OpenClaw agentic default; Qwen2.5-Coder-32B for raw generation quality.
- **Coder (reach, dual-5090/RTX-6000 only):** **Qwen3-Coder-Next (80B/3B-active MoE)** — 70.6% SWE-bench at 3B active; tool-calling + long-horizon. Add when 64GB+ lands.
- **General reasoning (dense-70B, dual-5090):** **Llama 3.3 70B** or **Qwen 2.5 72B** (Q4) — for the heavy cross-verify / deep-reasoning workflow rows (`16-cross-verify-engine`, `17-*`).
- **General small (always-on, NAS-able):** **Qwen 2.5 3B / 7B** — classification, audit, tagging, scripture-version lookup (the offload "always local" tier).
- **Transcription:** **Whisper large-v3** (already in stack) on the GPU box — real-time on 5090; the media/sermon pipeline lives here.

---

## 6. Phased build / implementation plan

**Phase 0 — procure (Darrell's hand).** Single RTX 5090 + host (Ryzen 9 / 128GB / 1000W PSU sized to add a 2nd card / NVMe / case). ~$5–5.5K. *No purchase made by this session.*

**Phase 1 — stand up the sovereign brain.** Ubuntu LTS + NVIDIA driver/CUDA + Docker + **Ollama**. `ollama pull qwen2.5-coder:32b`, `devstral`, `qwen2.5:7b`, `whisper` path. Tailscale-join the mesh (LAN + Funnel), same-origin reachable like `/n8n`. Verify with a tok/s smoke test (expect ~48 tok/s on the 32B coder) — *measure, don't claim* (DR-0076).

**Phase 2 — wire the workflows.** Point the local-able Register rows at the box: `wf-class-tutor`, `36-quality-gatekeeper`, `wf-llm-review`, the always-local small-model tier. NAS keeps orchestration + data; box does inference.

**Phase 3 — wire OpenClaw to local** (§7) and make it Darrell's offline coding agent.

**Phase 4 — media pipeline.** ComfyUI + Stable Diffusion/FLUX + Coqui XTTS on the same CUDA box (the `AI-MEDIA-PRODUCTION-PLATFORM-VISION` payload).

**Phase 5 — upgrade trigger (evidence-gated).** *Only when* measured load shows the 32B coder is insufficient or dense-70B is needed in the daily loop: add the 2nd RTX 5090 (→64GB, native 70B at 24–27 tok/s). This is the DR-0053 discipline honored, not bypassed. Record it as a DR with the measured trigger.

---

## 7. Wiring OpenClaw to the LOCAL model (offline coding agent)

OpenClaw speaks to Ollama's OpenAI-compatible endpoint — **no API keys, fully offline once models are pulled.** [§9-q,r]

1. **On the GPU box:** install Ollama, `ollama pull qwen2.5-coder:32b` (and `devstral`). Confirm the server: `http://<box-ip>:11434/v1`.
2. **Simplest path:** `ollama launch openclaw --model qwen2.5-coder:32b` — runs OpenClaw entirely local against that model.
3. **Config path (OpenClaw config file):** add the provider + default model —
   ```json
   {
     "models": { "providers": { "ollama": { "apiBase": "http://<box-ip>:11434/v1" } } },
     "agents": { "defaults": { "model": { "primary": "ollama/qwen2.5-coder:32b" } } }
   }
   ```
   Use `localhost` if OpenClaw runs on the box; use the box's Tailscale IP from Darrell's laptop.
4. **Set context ≥ 64k** for local coding (OpenClaw's own recommendation for local models). Set `OLLAMA_NUM_CTX`/model `num_ctx` accordingly; the 5090's 32GB holds 32B-Q4 + a 64k window.
5. **Restart OpenClaw**, confirm a request shows up in `ollama ps` / box GPU load — that's the proof it's routing local, not to a vendor. Air-gap test: pull the box's WAN and confirm OpenClaw still answers.
6. **Agentic default:** point agent tool-calling at `devstral` (agent-first training); keep `qwen2.5-coder:32b` for generation-heavy turns.

---

## 8. Top risks

1. **GPU price/supply volatility (DRAM shortage).** The 5090 is 75%+ over MSRP and prices move weekly; the same shortage already killed the Mac's 512GB option and raised the Spark to $4,699. *Mitigation:* track [bestvaluegpu.com](https://bestvaluegpu.com) for the dip; the recommendation's single-card start caps exposure (~$3.7K, not ~$8K) and the phased upgrade buys the 2nd card later when supply/price may ease.
2. **"32B is enough" could prove wrong for the hardest reasoning.** If the daily loop genuinely needs dense-70B/closed-frontier quality, the single 5090 won't deliver it single-stream and you'll hit the Phase-5 upgrade sooner. *Mitigation:* this is *designed in* — the build is sized for the 2nd card, and the honest fallback is hybrid (local 32B for the 95% case, an explicit opt-in vendor call for the rare heavy case), exactly the offload-review's Phase-2 posture. Privacy is preserved because the *default* and all routine coding stay local; only a deliberately-chosen hard case would ever leave, and that's Darrell's call, not automatic.

---

## 9. Sources

- **a.** RTX 5090 price history — bestvaluegpu.com, "RTX 5090 Price Tracker US – Jun 2026"
- **b.** RTX 5090 street vs MSRP / DRAM increase — ofzenandcomputing.com; tweaktown.com (FE sellouts)
- **c.** RTX 5090 Ollama 32B @ 48 tok/s — databasemart.com, "RTX 5090 Ollama Benchmark"
- **d.** RTX 5090 Qwen2.5-Coder-7B batch-8 5,841 tok/s — markaicode.com
- **e.** Dual RTX 5090 70B Q4 26.85 / DeepSeek-R1 70B 27.03 / Qwen2.5-72B 24.15 tok/s — databasemart.com, "2×RTX 5090 Ollama Benchmark"
- **f.** RTX PRO 6000 Blackwell 96GB $8–9.2K retail / $13,250 list / 600W — thundercompute.com; videocardz.com; newegg.com
- **g.** DGX Spark $4,699 / 128GB / 273 GB/s / decode numbers — a-bots.com; intuitionlabs.ai
- **h.** DGX Spark price raise $3,999→$4,699 — intuitionlabs.ai
- **i.** DGX Spark Llama 3.1 70B FP8 803 prefill / 2.7 decode — github.com/ggml-org/llama.cpp Discussion #16578; lmsys.org review
- **j.** DGX Spark concurrency 695–2,074 tok/s aggregate — dendro-logic.com; ollama.com/blog/nvidia-spark-performance
- **k.** Mac Studio M3 Ultra base $3,999 / configs — apple.com/shop
- **l.** 512GB option removed, 256GB +$ — tomshardware.com; macrumors.com; notebookcheck.net
- **m.** DRAM-shortage cause — macrumors.com; pcguide.com
- **n.** M3 Ultra 70B ~12–18 tok/s / 800 GB/s — llmcheck.net; github.com/ml-explore/mlx Discussion #3209
- **o.** Qwen2.5-Coder-32B MLX 22.7 tok/s on M2/M3 — insiderllm.com; medium.com (Vashchuk)
- **p.** Open coding models (Qwen2.5-Coder-32B 91% HumanEval; Devstral Small 2 24B 68% SWE-bench; Qwen3-Coder-Next 80B/3B 70.6%) — kilo.ai/open-source-models; pinggy.io; siliconflow.com; localaimaster.com
- **q.** OpenClaw + Ollama integration / config — docs.ollama.com/integrations/openclaw; docs.openclaw.ai/providers/ollama
- **r.** OpenClaw local offline / 64k context guidance — ollama.com/blog/openclaw; codersera.com (2026 setup guide)

---

*Recorded as an advisory under the hardware-decision lineage DR-0014 → DR-0053. A purchase, if made, becomes a new dated DR carrying the measured trigger.*
