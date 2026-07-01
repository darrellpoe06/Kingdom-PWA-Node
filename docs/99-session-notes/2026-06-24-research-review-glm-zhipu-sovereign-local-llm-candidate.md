# Research Review — GLM (Z.ai / Zhipu) as a Sovereign Local-LLM Candidate

**Date:** 2026-06-24
**Author:** Claude (research-review on Darrell's commission, per `feedback-research-first` + Verification Doctrine DR-0076)
**Status:** Research-review. **Read-only advisory. No model is pulled, no routing is changed, no hardware is bought by this doc.** All benchmark numbers are labeled VENDOR unless independently corroborated.
**Triggered by:** Darrell — "can PoeTech use the GLM open model from Z.ai/Zhipu (he referenced 'GLM 5.2', MIT, claims beating GPT/Gemini, 1M context, strong coding) as a SOVEREIGN local-LLM candidate? Evaluate honestly."
**Pairs with / extends:** `LOCAL-LLM-MODEL-PICKS.md` (the menu), `MODEL-LAB-SPEC.md` (the arena), `LOCAL-LLM-HARDWARE-RECOMMENDATION.md` (the box), DR-0073 (capability-aware routing), DR-0012 (GPU topology), `docs/governance/pre-authorized-policies.yaml` (the firewall). Lanes: `local_00897763` (Model Lab head-to-head), `local_132b8f90` (local-LLM model picks), `project-model-lab-user-eval`, `success-metric-247-local-wakes-vendor`.

---

## TL;DR (the honest answer)

**Yes — but the right GLM for sovereign/local is NOT the one Darrell named.**

- The GLM family is genuinely **open-weight under the permissive MIT license** (confirmed on the Hugging Face model cards for GLM-4.5, GLM-4.6, GLM-4.7, and GLM-5.2). That clears the sovereignty/legal bar: commercial use, fine-tuning, and self-hosting are all permitted. This is a real strength.
- **GLM-5.2 (the one Darrell named) is the 744B flagship — it does NOT run sovereign/local on any hardware we have or have planned.** It needs a multi-GPU server. Treat it as an **API-only or far-future** option, not a local candidate.
- **The actionable local candidate is `GLM-4.7-Flash` — a 30B-A3B MoE (~3.6B active params).** It is the same weight class and the same box-fit as our current daily-driver pick `qwen3:30b-a3b`, it is MIT, and it is coding/agent-optimized. **Recommendation: add GLM-4.7-Flash to the Model Lab as a direct head-to-head challenger to qwen3:30b-a3b.** Zero new hardware, zero marginal cost to trial (just pull the weights).
- **Provenance flag (fact for Darrell to weigh, not a blocker):** Zhipu / Z.ai is a China-origin company. For **local weights run offline this is irrelevant to data residency** — no telemetry, weights are inert files. For the **hosted Z.ai API it is a real consideration** — data leaves to a Chinese provider — and our routing firewall already forbids that path for all private/sovereign work regardless.

---

## 1. Verified model facts

The "GLM 5.2" Darrell referenced is real, and the family has moved fast. Here is the current lineup as of 2026-06-24, with vendor claims labeled.

| Model | Released | Total / Active params | Architecture | Context | License | Role |
|---|---|---|---|---|---|---|
| **GLM-4.5** | Jul 2025 | 355B / ~32B | MoE | 128K | **MIT** | superseded flagship |
| **GLM-4.5-Air** | Jul 2025 | ~106B / ~12B | MoE | 128K | **MIT** | mid-tier |
| **GLM-4.6** | Sep 2025 | **357B / ~32B** | MoE | **200K** | **MIT** (HF card: `license: mit`) | flagship (prev gen) |
| **GLM-4.7** | Jan 2026 | **358B / ~32B** | MoE | 200K (131K max output) | **MIT** | flagship (current dense-class) |
| **GLM-4.7-Flash** | Jan 2026 | **30B / ~3.6B** | MoE | 128K | **MIT** | **local/edge coding — our candidate** |
| **GLM-5.2** | Jun 13 2026 | **744B / ~40B** | MoE + "IndexShare" sparse attention | **up to 1,000,000** | **MIT** (open weights released) | flagship (the one Darrell named) |

**License — verified.** The Hugging Face model cards state `License: mit` directly for GLM-4.6 and GLM-4.7. GLM-5.2's weights were released on Hugging Face under MIT after first shipping to GLM Coding Plan subscribers on 2026-06-13. (One secondary blog claimed Apache-2.0 for GLM-4.6; the authoritative HF model card says MIT — the HF card governs.)

**Benchmark standing — these are VENDOR claims unless noted:**
- GLM-4.6 (vendor): LiveCodeBench v6 **82.8%** (up from GLM-4.5's 63.3%), SWE-bench **~68%**, AIME-25 **93.9%**. Vendor positions it at/above Claude Sonnet 4 on those.
- GLM-4.6 **CC-Bench (human-evaluated, vendor-run):** **48.6% win rate vs Claude Sonnet 4** on multi-turn dev tasks — i.e. vendor's own framing is "roughly half," which is an honest "competitive, not dominant" read.
- GLM-5.2 (vendor): SWE-bench Pro **62.1**, AIME-2026 **99.2**.
- **Independent corroboration:** GLM-4.5/4.6 have a real, sustained reputation in the open-weight coding community (r/LocalLLaMA, the Claude-Code-with-GLM ecosystem) as a credible Sonnet-class coder — that part is not just marketing. **But "beats GPT/Gemini" is a vendor headline; treat as unverified.** No claim here is accepted as fact for our purposes without a Model Lab run on our own tasks (DR-0076 §4: measure, don't claim).

---

## 2. Hardware fit — the honest VRAM table

Our hardware reality: **(a)** church **2× RTX 4070 (~12GB each, ~24GB combined)** — *and note these are earmarked to be freed for live-mix AI / transcription once Presenter retires ProPresenter, so they may not be available for LLM duty*; **(b)** the planned single big GPU box — **RTX 5090 (32GB)** per `LOCAL-LLM-HARDWARE-RECOMMENDATION.md`, or the **RTX PRO 6000 Blackwell (96GB)** alternative; **(c)** anything bigger = a multi-GPU server we do not have.

Footprints below are from Unsloth's published GGUF guides and Ollama VRAM references.

| GLM variant | Quant | Footprint | Church 2×4070 (~24GB) | Single RTX 5090 (32GB) | RTX PRO 6000 (96GB) |
|---|---|---|---|---|---|
| **GLM-4.7-Flash** (30B/3.6B) | Q4 | ~18GB | ✅ runs (split across both, or 1 card + small RAM offload) | ✅ fast, fits easily | ✅ fast |
| **GLM-4.7-Flash** | Q3/Q2 | ~10–13GB | ✅ fits a **single** 12GB 4070 | ✅ | ✅ |
| **GLM-4.6 / 4.7 flagship** (357–358B/32B) | Q2_K_XL (2-bit dyn) | ~135GB disk; **1×24GB GPU + 128GB RAM** | ❌ no (no 128GB+ RAM rig; would crawl) | ⚠️ only with **128GB+ system RAM + MoE offload — slow** | ⚠️ mostly fits 96GB at 2-bit — **runs, but 2-bit degrades quality** |
| **GLM-4.6 / 4.7 flagship** | Q4 | ~205GB RAM + 1×40GB GPU for 5+ tok/s | ❌ | ❌ | ⚠️ heavy RAM offload, slow |
| **GLM-4.6 / 4.7 flagship** | BF16 (full) | ~700GB+ | ❌ | ❌ | ❌ |
| **GLM-5.2** (744B/40B, 1M ctx) | Q2+ | ~250GB+ | ❌ | ❌ | ❌ — needs **multi-GPU server** |

**Plain reading:**
- **GLM-4.7-Flash is the only GLM that fits our boxes well.** On the church 4070s it's a peer of `qwen3:30b-a3b` (same 30B-A3B MoE shape). On the 5090/PRO-6000 it flies. This is the candidate.
- **The flagship (GLM-4.6/4.7, 355–358B) does NOT have a good local home on planned hardware.** Best case is the **RTX PRO 6000 96GB at 2-bit**, which runs but at compromised quality — not a daily-driver-grade sovereign deployment. On the planned RTX 5090 it only runs via massive system-RAM offload (slow). **If we want flagship-GLM quality locally, that is a different, bigger purchase decision** (multi-GPU server) and should be its own DR with measured evidence, not assumed here.
- **GLM-5.2 (744B) is not local on anything we have or plan.** API or future server only.

---

## 3. Sovereignty verdict

| Path | Data residency | Verdict |
|---|---|---|
| **Local weights** (Ollama / vLLM / llama.cpp / SGLang) | Stays 100% local; weights are inert files, no telemetry, runs offline | ✅ **Fully sovereign.** This is the only path that satisfies DR-0073's invariant (private work → local-only, always). |
| **Z.ai hosted API** | Data leaves to Zhipu (China-origin provider) | ❌ **Not sovereign.** Same exclusion the firewall already applies to *all* vendor APIs. Additionally carries China data-residency/governance exposure. |

- **MIT license = the legal half of sovereignty is fully satisfied** — we may self-host, fine-tune, and use commercially without restriction. That is materially better than a research-only or non-commercial license.
- **Provenance (neutral fact):** Zhipu/Z.ai is Chinese. For **local** use this is a non-issue for data (nothing transmits) and only a question of "do we trust the weights' behavior" — which the Model Lab + our task-grounded eval answers empirically, the same as for any model. For the **hosted API**, China provenance is a genuine factor for Darrell to weigh; but our `pre-authorized-policies.yaml` Tier-0 firewall already forces `ollama` only for TLC/finance/counseling/COLG, so the API could never touch private work regardless of origin.
- **Bottom line:** GLM-4.7-Flash **as local weights** is sovereignty-clean. GLM via Z.ai API is in the same "non-private vendor lane" as Claude/Gemini, with an added provenance caveat.

---

## 4. Integration

**Runs locally today?** Yes.
- **Ollama:** GLM-4.7-Flash and the flagship GGUFs (Unsloth dynamic quants) run in Ollama natively. Pull and go.
- **vLLM / SGLang:** officially documented by Zhipu for local inference — the production path for the bigger variants / higher throughput.

**Can it be Claude Code's model?** Yes, two ways — and the distinction is the whole sovereignty story:
1. **Via Z.ai hosted API (NOT sovereign):** Z.ai ships an **Anthropic-compatible endpoint**. Set in `~/.claude/settings.json`:
   ```json
   { "env": {
       "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
       "ANTHROPIC_AUTH_TOKEN": "<z.ai key>"
   } }
   ```
   Claude Code then drives GLM server-side. **Data leaves to Zhipu** — excluded for private work by our firewall; only ever usable for non-private tasks, same lane as any vendor.
2. **Via LOCAL weights (sovereign) — the one that matters for us:** Claude Code speaks the **Anthropic Messages API**; local Ollama/vLLM speak the **OpenAI-compatible API**. So a **local** GLM cannot be Claude Code's model directly — it needs a tiny **Anthropic↔OpenAI translation shim** in front of local vLLM/Ollama (e.g. `claude-code-router` or LiteLLM in Anthropic-passthrough mode). Point `ANTHROPIC_BASE_URL` at the local shim instead of `api.z.ai`. This is exactly the **local code-driver** path behind `success-metric-247-local-wakes-vendor` (a local model handling code-driver wakes instead of waking the vendor).

**Fit into existing policy:**
- **Routing (DR-0073):** GLM-4.7-Flash slots in as a **local provider option** under `ollama`. It is eligible for private work *only as local weights*. The Z.ai API, if ever enabled, is a `vendor-first` non-private fallback alongside Claude/Gemini — and is redundant with Claude there, so low priority.
- **Sovereign-LLM-team tiers (`pre-authorized-policies.yaml`):** Flash is a candidate **base model** for the four teams (devops/family_finance/counseling/church_colg), all of which are `ollama`-only. It would compete with `qwen2.5:14b` / `qwen3:30b-a3b` for that base slot — decided by Model Lab results, not by this doc.
- **Local code-driver:** Flash's coding/agentic optimization makes it a strong candidate for the code-driver lane specifically — the head-to-head to run is **Flash vs qwen2.5-coder vs qwen3:30b-a3b** on our real fix-class tasks.

---

## 5. Model-Lab plan + recommendation

**Recommendation: ADD `GLM-4.7-Flash` to the local model lineup as a Model Lab candidate. Do NOT add GLM-5.2 or the GLM flagship to the local lineup.**

Concretely:

1. **Add to `LOCAL-LLM-MODEL-PICKS.md` watch-list + Model Lab menu (lane `local_132b8f90` / `local_00897763`):**
   - `glm-4.7-flash` (Q4) as a **challenger to the incumbent `qwen3:30b-a3b`** in the daily-driver / code-driver slot. Same box-fit, same MoE class, MIT, coding-tuned.
2. **The head-to-head to run** (`project-model-lab-user-eval`): GLM-4.7-Flash vs qwen3:30b-a3b vs qwen2.5-coder, on our **real fix-class + agentic tasks** (DR-0063 local-authors-plan loop), human-judged per MODEL-LAB-SPEC. Winner can earn the code-driver/base slot. **No benchmark claim from §1 is trusted until this runs** (DR-0076).
3. **Cost / cost-efficiency screen:**
   - **Local GLM-4.7-Flash = $0 marginal** — runs on hardware already planned/owned; just pull weights. Cheapest possible trial.
   - **Z.ai GLM Coding Plan (API)** is inexpensive vs Claude, but it is **non-sovereign** (data leaves, China provenance) and **redundant with Claude** in the vendor lane. **Not recommended** to wire in — it buys little we don't have and adds exposure. If ever trialed, restrict to non-private bulk-coding experiments only.
4. **Sovereign-mesh tier placement:**
   - **Edge/church tier (4070s):** GLM-4.7-Flash is a fit — *if* the 4070s aren't fully consumed by live-mix/transcription. Otherwise it lives on the big box.
   - **Big-box tier (5090 / PRO 6000):** GLM-4.7-Flash as a fast always-warm coder/agent.
   - **Flagship tier:** **parked** as a "GPU-server-era" roadmap item. Revisit only if/when a multi-GPU server (or PRO 6000 at acceptable 2-bit quality) is justified by measured load — its own DR, with evidence, per DR-0012's Phase-5 discipline. `re-review:` when the big-box lands and real coding load is measured (est. Q3 2026).
   - **GLM-5.2 / 1M-context flagship:** **not local.** Only revisit as an API option if a specific non-private, huge-context job appears that Claude can't serve cost-effectively — unlikely; no action now.

**One-line verdict for the orchestrator:** *Pull GLM-4.7-Flash into the Model Lab as the qwen3:30b-a3b challenger; it's MIT, sovereign-as-local-weights, and box-fitting. The flagship GLM-5.2 Darrell saw is real and impressive but is server-class — not a local candidate on our hardware.*

---

## Sources

- [zai-org/GLM-4.6 · Hugging Face](https://huggingface.co/zai-org/GLM-4.6) (license: mit; 357B; 200K context)
- [zai-org/GLM-4.7 · Hugging Face](https://huggingface.co/zai-org/GLM-4.7) (license: MIT; 358B; MoE)
- [zai-org/GLM-4.5 · Hugging Face](https://huggingface.co/zai-org/GLM-4.5) / [GLM-4.5-Air](https://huggingface.co/zai-org/GLM-4.5-Air) (MIT)
- [zai-org/GLM-5.2 · Hugging Face](https://huggingface.co/zai-org/GLM-5.2)
- [GLM-5.2: Zhipu AI's 1M-Token Open-Weight Coding Model — eigent.ai](https://www.eigent.ai/blog/glm-5-2) (744B / ~40B active, 1M context, MIT)
- [Zhipu AI Releases GLM-4.7-Flash: A 30B-A3B MoE Model — MarkTechPost](https://www.marktechpost.com/2026/01/20/zhipu-ai-releases-glm-4-7-flash-a-30b-a3b-moe-model-for-efficient-local-coding-and-agents/)
- [GLM-4.7-Flash: How To Run Locally — Unsloth](https://unsloth.ai/docs/models/tutorials/glm-4.7-flash) (Q4 ~18GB; 24GB recommended)
- [GLM-4.6: Run Locally Guide — Unsloth](https://docs.unsloth.ai/models/glm-4.6-how-to-run-locally) (2-bit Q2_K_XL ~135GB, 1×24GB GPU + 128GB RAM; 4-bit needs ~205GB RAM)
- [Zhipu AI Releases GLM-4.6 — MarkTechPost](https://www.marktechpost.com/2025/09/30/zhipu-ai-releases-glm-4-6-achieving-enhancements-in-real-world-coding-long-context-processing-reasoning-searching-and-agentic-ai/) (vendor benchmarks)
- [GLM-4.6: An Open-Source AI for Coding vs. Sonnet & GPT-5 — IntuitionLabs](https://intuitionlabs.ai/articles/glm-4-6-open-source-coding-model) (355B / ~32B active; CC-Bench 48.6% vs Sonnet 4)
- [Claude Code — Z.AI Developer Document](https://docs.z.ai/devpack/tool/claude) (ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic config)
- [How to Run GLM 5.2 in Claude Code, Pi & OpenCode — explainx.ai](https://www.explainx.ai/blog/how-to-run-glm-5-2-coding-plan-agent-harnesses-2026)
- Claude Code custom-endpoint mechanism: `ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN` env in `settings.json` (support.claude.com Claude Code docs).
