# LOCAL-LLM HARDWARE RECOMMENDATION

**Date:** 2026-06-23
**Author:** Claude (advisory) — for Darrell's decision (he holds the purchase)
**Status:** RESEARCH-REVIEW → SINGLE RECOMMENDATION. **Authorizes no purchase.** Money moves only on Darrell's greenlight.
**Layer:** 3 reference (decision support), built on Layer-4 research and the hardware Decision Records.

> **Verification note (DR-0076 / Verification Doctrine).** Every price and tok/s figure below carries a citation fetched June 2026. Prices are volatile (active DRAM/GPU memory crisis through mid-2026) — confirm the exact street price the day of purchase; do not trust this doc's number as still-current at buy time. Figures I could not measure directly are marked **(est.)** with the basis stated.

---

## 0. Why this doc exists now (the trigger + the goal)

Darrell has lost trust in cloud Claude over the last four weeks; **today the weekly usage cap stalled the local-LLM cutover work**. But the cap is the symptom, not the goal.

**The goal, stated plainly (Darrell, 2026-06-23): the best PRIVATE, SOVEREIGN coding rig he can afford, OUTSIDE vendor cloud LLMs. "What I need and more for programming — not cloud-grade."**

The **primary drivers** are, in order:

1. **Privacy / legal exposure (PRIMARY).** No questions, no code, no context should go to any cloud where it could be **logged, retained, subpoenaed, or used against him**. Nothing leaves his control. The rig must be **fully offline-capable and air-gappable** — coding must work with the network unplugged.
2. **Strong OPEN coding-model throughput per dollar.** Best open-coder tok/s per dollar, running locally.
3. **Continuity.** The build never stalls on a cap, an outage, or a refusal.

**Cloud-parity is explicitly NOT the bar.** This box is not trying to match Claude/Opus on the hardest agentic tasks — it is trying to be **more than enough for his programming, on his own hardware, with his data never leaving the building.** Throughput-per-dollar and data-never-leaves outrank benchmark parity in every screen below.

**This is a re-open at a higher budget, not a re-derivation.** The repo already concluded a **deferred dual-RTX-3090 (~$2k, 48 GB)** farm-augment ([DR-0014](../decisions/DR-0014-hardware-budget-directive-procurement-plan.md), [DR-0053](../decisions/DR-0053-cuda-box-decoupled-from-r4-no-purchase-yet.md), [AI-INFRASTRUCTURE-HARDWARE-OPTIONS](_future/AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md)). The **delta**: coding is now the **primary** workload (build the modular PoeTech app + n8n pipeline), **privacy/air-gap is now a primary driver**, and the budget is raised. That changes the math — see §6.

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
| **Privacy / air-gappable — data never leaves (HIGHEST)** | Coding works fully offline; no code/context to any cloud; network-unpluggable | **Every local box qualifies equally** — privacy is a property of *local*, not of one vendor's box |
| **Open-coder throughput per dollar (HIGHEST)** | A 24–32B open coder (Qwen2.5-Coder 32B / Devstral) running **fast** (40+ tok/s) per dollar spent | **5090** (45–55) ≫ Mac (12–22) ≫ Spark (8–12) |
| **Continuity (HIGH — the trigger)** | Box is up and snappy with **zero** dependence on a vendor | Any CUDA box; 5090 best for coding-shaped continuity |
| **Transcription (Whisper-class)** | faster-whisper / WhisperX — **CUDA-native, far faster on NVIDIA** | CUDA boxes; Mac runs MLX-Whisper but slower |
| **NDI / CUDA media future** | NDI + CUDA encode/decode, TensorRT, Frigate GPU detection — **all CUDA-only** | CUDA boxes only — **Mac is a dead-end here** |
| **Per-industry sovereign LLM teams** | Run several models concurrently → wants VRAM headroom (vLLM) | 96 GB (PRO 6000) > 64 GB (dual 5090) > 32 GB (single 5090, swaps) |

**Privacy is the great equalizer here:** *every* box on the list keeps data fully on-premises and is air-gappable — that's inherent to running the model locally, and it is the same whether the box is a 5090, a Spark, or a Mac. So privacy does **not** pick the box; it **rules out cloud** and makes the rest of the decision about *open-coder throughput per dollar* and *the CUDA media future*. On those, the 5090 wins.

**The capability gap, reframed (parity is not the goal):** the best open coders — **Qwen2.5-Coder 32B** and **Devstral Small 24B** — are excellent for completion, single-file generation, refactors, mechanical multi-file edits, code review, and n8n-node scaffolding. They are not Claude-Opus on the *hardest* long-horizon agentic chains — **and that is fine, because matching Opus is explicitly not what Darrell is buying.** He is buying *more than enough for his programming, fully private, on his own hardware.* The rig is sized so the **open coder alone, offline, is the daily driver** — not a fallback waiting on a vendor. Vendor escalation ([DR-0056](../decisions/DR-0056-tiered-llm-orchestrator-perpetual-fix.md)) remains *available* but is **OFF by default for code** (privacy default = local-only); it is an opt-in convenience for a specific hard task, never a dependency and never automatic for source he wants kept private.

---

## 4. Darrell's screens applied

**Cost-efficiency (growth justification · unit cost · lean alternative · break-even):**
- *The right metric here is **$ per private open-coder tok/s**, not break-even-vs-API.* Privacy means the work *can't* go to the cheap cloud at all — so there is no API bill to break even against for the code Darrell wants kept private. The box is justified by **privacy/legal exposure avoided**, **continuity**, the **CUDA media future**, and the **farm role**.
- *Unit cost:* single 5090 build ≈ **$4.8–5.4k** for ~45–55 tok/s **fully-private, offline** coding + full CUDA stack. **Lowest $ per private-coder-tok/s in the set** — the Mac is cheaper but ~2.5× slower on the coder and CUDA-dead; the Spark is similar price but ~5× slower on the coder.
- *Lean alternative (documented):* **used dual-3090 ~$2.8–4.2k** (48 GB, holds 70B, CUDA, equally private/air-gappable) — the prior pick. Still valid if budget must compress to ~$3k; trade-offs = used-market risk (no warranty) and ~1.8× slower 32B decode.

**Sovereign-mesh compatibility (tier 1–4) — and air-gappability:**
- **All local boxes are equally private and air-gappable** — coding runs with the network unplugged on every one of them. That's the privacy floor; it does not differentiate them.
- **Tier 1 (full sovereign + augments the CUDA mesh, *and* runs air-gapped):** RTX 5090, dual 5090, RTX PRO 6000, DGX Spark — CUDA-native, optionally join Tailscale for *convenience*, but coding never depends on the mesh being up.
- **Tier 3 (private for text, but breaks the CUDA pipeline):** **Mac Studio** — equally air-gappable for text, but **no CUDA** strands NDI/TensorRT/Frigate/faster-whisper. Disqualifying for *this* role given the named media future.

**MVP-pragmatism:** buy the box that unblocks coding-continuity **now** at the smallest sufficient spend — not the maximal 96 GB box. Single 5090 clears the binding constraint (fast 32B coder + CUDA) inside budget. 96 GB / multi-model-team capacity is a *later, evidence-triggered* upgrade, not a now-buy.

**Fit with the NAS (DS1621xs, no GPU) — augment or replace?** **Augments, never replaces.** NAS stays the always-on registry/automation tier (Postgres+pgvector, n8n, embeddings, `nomic-embed-text`, the orchestrator brake-host). The GPU box is the **inference + coding + media** tier that the NAS routes to. Clean split, already the architecture in the [2026-06-09 orchestrator design](../99-session-notes/2026-06-09-sovereign-ai-orchestrator-architecture.md).

---

## 5. THE RECOMMENDATION

### The best affordable private coding rig + the open coder to run on it + OpenClaw wired to it locally.

**The rig:** a single **RTX 5090 (32 GB) workstation**, built dual-GPU-ready so a second card is a drop-in — NOT the DGX Spark, NOT the Mac Studio, NOT (yet) the dual-5090 or RTX PRO 6000.
**The coder:** **Qwen2.5-Coder 32B** (Q4) as the daily driver, **Devstral Small 24B** as the agentic/tool-use alt.
**The agent:** **OpenClaw** (already installed) pointed at the **local Ollama** — his offline coding agent, no key to any cloud. Hermes on the NAS *now*, the 5090's coder *later* (§6).

This is "what he needs and more for programming, fully private," not "closest to cloud."

**X not Y because Z (privacy-and-throughput framing):**
- **5090 not DGX Spark** — both are equally private/air-gappable, so it comes down to the open-coder speed per dollar: the 5090 does ~45–55 tok/s on the 32B coder vs the Spark's ~8–12 (the Spark's 273 GB/s bandwidth bottlenecks exactly the dense decode coding needs). Same price tier; ~5× the daily coding throughput.
- **5090 not Mac Studio M3 Ultra** — both equally air-gappable for text, but the Mac has **no CUDA**, stranding the NDI media future + faster-whisper + vLLM/TensorRT, and runs the coder ~2.5× slower. Privacy doesn't rescue the Mac here; the CUDA media future does the deciding.
- **5090 not dual-5090 / RTX PRO 6000 (yet)** — MVP-pragmatism. A single 5090 is more-than-enough for his programming inside the $4–6k envelope; 64 GB / 96 GB is an evidence-triggered upgrade (per-industry multi-model teams or 70B-resident), built into the spec as a drop-in second card.
- **5090 not the prior used dual-3090** — coding is now *primary*: new-with-warranty (a dead used card is its own continuity failure), ~1.8× faster 32B decode, clean upgrade lane. Dual-3090 stays the documented lean fallback at ~$3k (equally private).

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

- **Phase 0 — OpenClaw on the NAS *now* (this week, $0).** Don't wait for the box. Wire the already-installed **OpenClaw** to the NAS's existing **Ollama** so Darrell has an offline coding agent today (slow, CPU-speed, but real and private). Run a **Hermes** model (Llama-based, instruction/agent-tuned) on the NAS — there is a documented OpenClaw + Hermes + Ollama path. Config (verified June 2026, [Ollama docs · OpenClaw](https://docs.ollama.com/integrations/openclaw)):
  - `openclaw configure --section llm` → provider `ollama`, Base URL `http://192.168.1.26:11434` (NAS, or `http://localhost:11434` on-box), model = the Hermes tag exactly as pulled.
  - OpenClaw expects a key value even though Ollama ignores it: set `OLLAMA_API_KEY="ollama-local"` (any value works).
  - Use a **64k+ context** model build (agents need long context for multi-step/file work).
  - **Air-gap check:** skip the web-search provider → the agent still runs shell, files, and coding fully offline. **This proves the offline workflow before any money is spent.**
- **Phase 1 — Buy + stand up the rig (week 1).** Confirm 5090 street price day-of; buy the build in §5. Ubuntu + Docker + Ollama + vLLM. Mesh is *optional* (convenience only — coding must work unplugged). NAS unchanged.
- **Phase 2 — Repoint OpenClaw to the box's coder (week 1–2).** Pull `qwen2.5-coder:32b`; verify ~45–55 tok/s on the real card (DR-0076 — measure, don't assume). Re-run `openclaw configure --section llm` → Base URL = the box's Ollama, model `qwen2.5-coder:32b`. **OpenClaw is now Darrell's fast, fully-private, offline coding agent — Hermes-on-NAS was the warm-up, this is the workhorse.** Optionally register with orchestrator **v0 advisory** ([DR-0056](../decisions/DR-0056-tiered-llm-orchestrator-perpetual-fix.md)) with `ORCH_MODE` **local-first and vendor OFF by default for code** ([DR-0073](../decisions/DR-0073-orchestrator-capability-aware-routing.md)).
- **Phase 3 — Transcription + media groundwork (week 3–4).** faster-whisper; first NDI/CUDA pipeline probe; Qwen2.5-VL for vision tasks.
- **Phase 4 — Per-industry LLM teams (month 2+).** Multiple models via vLLM. **If VRAM binds → drop in the 2nd RTX 5090 (→ 64 GB)** — PSU/mobo already specced, no rebuild.
- **Phase 5 — Long-horizon consolidation (evidence-gated).** Only if 70B-resident + heavy concurrent multi-model teams prove binding → **RTX PRO 6000 Blackwell 96 GB** single-card consolidation. Not before the data demands it.

---

## 7. Upgrade / rollback path

- **Upgrade:** +2nd RTX 5090 → **64 GB** (declared lane, drop-in) → if still binding, **RTX PRO 6000 96 GB**. Each step is evidence-triggered, not pre-committed.
- **Rollback / no-stranded-asset:** if the box underdelivers for *coding*, it does **not** become dead weight — it's a top-tier CUDA workstation that directly serves Darrell's **creative apps** (Premiere/AE/C4D/OBS per [DR-0012](../decisions/DR-0012-gpu-topology-conservative-single-4070-creative-preemption.md)) and the media pipeline, and `ORCH_MODE=vendor-first` still covers coding. The 5090 holds resale value far better than a used 3090. Downside is bounded.

---

## 8. Top 2 risks

1. **Accidental privacy egress — the one failure that defeats the whole purpose.** The risk is no longer "the local model is weaker than Opus" (that's accepted by design — parity isn't the goal). The real risk is that some tool *silently* routes his code or prompts to a cloud anyway — an editor's built-in AI, a copilot extension, OpenClaw's web-search provider, or an orchestrator `ORCH_MODE` left on `vendor-first`. *Mitigation:* **vendor OFF by default for code**; OpenClaw configured ollama-only with web-search disabled (air-gap proven in Phase 0); audit that no IDE/extension has a cloud-AI feature live; treat any vendor call on private source as an explicit, deliberate opt-in — never a default or an automatic escalation. The box only delivers privacy if nothing else is leaking around it.
2. **Price/power/availability volatility + 32 GB ceiling.** 5090 street prices run well above MSRP through the mid-2026 memory crisis [1] and a single 32 GB card **can't hold 70B resident** (CPU-spill until the 2nd card). A dual-5090 build draws ~1,150 W card power → **plan home electrical, cooling, and noise** before committing to the 2-card endpoint. *Mitigation:* confirm price day-of; the single-card build runs the 32B coder — Darrell's actual daily need — comfortably; 70B is the evidence-gated 2nd-card upgrade, not a day-one requirement.

---

*Decision record to follow once Darrell greenlights: a new DR citing this review (do not rewrite DR-0014/0053 — new directive = new DR, per DR-0011).*
