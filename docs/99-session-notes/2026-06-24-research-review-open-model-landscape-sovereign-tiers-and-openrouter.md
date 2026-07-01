# Research Review — Open-Model Landscape for the Sovereign Tiers + OpenRouter Access

**Date:** 2026-06-24
**Author:** Claude (research-review on Darrell's commission, per `feedback-research-first` + Verification Doctrine DR-0076)
**Status:** Research-review. **Read-only advisory. No model pulled, no routing changed, no payment wired.** Benchmark numbers labeled VENDOR unless corroborated.
**Triggered by:** Darrell — "don't evaluate GLM alone; compare the OPEN-MODEL LANDSCAPE for local/sovereign tiers + Model Lab: GLM, Qwen3, Gemma, MiniMax, current Ollama models. Verify CURRENT versions (the video's 'GLM 2.5/5.2, Qwen 3.6, Gemma 4, GPT 5.5' are unverified). Plus evaluate OpenRouter honestly as a non-sovereign aggregator/fallback."
**Pairs with / extends:** the GLM deep-dive (`2026-06-24-research-review-glm-zhipu-sovereign-local-llm-candidate.md`), `LOCAL-LLM-MODEL-PICKS.md`, `MODEL-LAB-SPEC.md`, `LOCAL-LLM-HARDWARE-RECOMMENDATION.md`, DR-0073 (routing), DR-0012 (GPU topology), `pre-authorized-policies.yaml`. Lanes: `local_132b8f90`, `local_00897763`, `project-model-lab-user-eval`, `success-metric-247-local-wakes-vendor`.

---

## TL;DR (the honest answer)

- **The video's model names were roughly right but imprecise. Verified real names:** GLM-5.2 (real, 744B flagship), **Qwen3.6** (real — `Qwen3.6-27B` dense is the current "consumer-hardware king"), **Gemma 4** (real, and now **Apache-2.0** — a big licensing upgrade), and **"GPT-5.5" is OpenAI's *closed* model — NOT an open/sovereign candidate.** OpenAI's open-weight models are **`gpt-oss-20b` / `gpt-oss-120b`** (Apache-2.0) — those are the sovereign ones.
- **The whole open-weight field is now permissively licensed** (MIT / Apache-2.0) — *with one trap: `MiniMax-M2.7` flipped to a non-commercial license.* Stick to MIT/Apache for our commercial-grade family platform.
- **Our two best box-fit sovereign coders, head-to-head:** **`Qwen3.6-27B` (dense, Apache, vendor SWE-bench Verified 77.2)** vs **`GLM-4.7-Flash` (30B-A3B, MIT)**, with **`gpt-oss-20b`** as the strong always-warm small/router model (runs in 16GB). That's the Model Lab matchup to run.
- **OpenRouter:** genuinely useful as a *cheap, one-key, crypto-payable* gateway to hundreds of models — **but data LEAVES; it is NOT sovereign.** Position it as an **optional non-sovereign burst/fallback for NON-sensitive heavy jobs only.** Local weights remain the sovereign default for anything family/clinical/finance/church/private — the firewall already forbids any cloud path there. **We do not wire payments; crypto/billing is Darrell's hand.**

---

## 1. Verified current versions (de-confusing the video)

| Video said | Real, verified (2026-06-24) | Notes |
|---|---|---|
| "GLM 2.5 / 5.2" | **GLM-5.2** (744B/40B MoE, 1M ctx, MIT) — flagship; **GLM-4.7-Flash** (30B/3.6B, MIT) is the local one | see GLM deep-dive doc |
| "Qwen 3.6" | **Qwen3.6-27B** (dense 27B, 256K, Apache, Apr 22 2026) + **Qwen3.6-35B-A3B** (MoE) | real; 27B dense is "the new king" on consumer GPUs |
| "Gemma 4" | **Gemma 4** (E2B/E4B/26B-A4B/31B-dense, **Apache-2.0**, Apr 2 2026) | real; now Apache (was restrictive custom license through Gemma 3) |
| "GPT 5.5" | **closed/proprietary — not open.** Open OpenAI models = **gpt-oss-20b / gpt-oss-120b** (Apache-2.0) | GPT-5.5 cannot be self-hosted; gpt-oss can |

---

## 2. Open-model comparison table (size → license → hardware tier → best-for)

Hardware tiers: **A = church 2×RTX 4070 (~24GB combined / ~12GB each)** · **B = planned GPU box (RTX 5090 32GB, or RTX PRO 6000 96GB)** · **C = needs more (multi-GPU server)**. Footprints are Q4 unless noted.

| Model | Total / Active | License | Footprint (Q4) | Tier | Best-for |
|---|---|---|---|---|---|
| **gpt-oss-20b** | 21B / 3.6B MoE | Apache-2.0 | ~13–16GB | **A** (single card) | **Router/always-warm + small coder**; o3-mini-class |
| **Gemma 4 E4B** | ~4.5B eff. | Apache-2.0 | ~4–6GB | **A** / phone | Router/classifier, **multimodal** (img/video/audio), edge |
| **Gemma 4 31B (dense)** | 31B | Apache-2.0 | ~18–20GB | **A** (split) / **B** | Multimodal reasoning, vision/tool-calling; Arena #3 text |
| **GLM-4.7-Flash** | 30B / 3.6B MoE | MIT | ~18GB | **A** (split) / **B** | **Coder/agent** — sovereign GLM candidate |
| **Qwen3.6-27B (dense)** | 27B | Apache-2.0 | ~16–18GB | **A** (split) / **B** | **Coder/daily-driver** — vendor SWE-bench Verified 77.2; multimodal |
| **Qwen3.6-35B-A3B** | 35B / 3B MoE | Apache-2.0 | ~20GB | **A** (split) / **B** | Fast all-round MoE coder |
| **qwen3:30b-a3b** (incumbent) | 30B / 3B MoE | Apache-2.0 | ~18–20GB | **A** / **B** | Current daily-driver pick (the baseline to beat) |
| **Qwen3-Coder-Next** | 80B / 3B MoE | Apache-2.0 | ~45GB | **B** (PRO 6000; 5090 w/ offload) | Heavy agentic coder, 256K ctx |
| **gpt-oss-120b** | 117B / 5.1B MoE | Apache-2.0 | single 80GB GPU | **B** (PRO 6000 96GB) | **Heavy reasoning** — o4-mini-class on one card |
| **DeepSeek-R1 / V4** | large MoE | MIT | 40GB+ | **B**/**C** | Reasoning specialist |
| **MiniMax-M2 / M2.5** | 230B / 10B MoE | **MIT** | ~130GB | **C** | Long-horizon agentic/coding (server) |
| **MiniMax-M2.7** | 230B-class | **non-commercial "Modified-MIT"** ⚠️ | ~130GB | **C** | **Avoid — license trap** for commercial use |
| **MiniMax-M3** | 230B-class, 1M ctx + vision | check per-card | ~130GB+ | **C** | Huge-context multimodal (server) |
| **GLM-4.6 / 4.7** | 357–358B / 32B MoE | MIT | 135GB+ (2-bit) | **C** (PRO 6000 only at 2-bit, degraded) | Flagship coder (server) |
| **Qwen3.5-397B-A17B** | 397B / 17B MoE | Apache-2.0 | ~230GB | **C** | Flagship reasoning (server) |
| **Qwen3-Coder-480B** | 480B / 35B MoE | Apache-2.0 | ~270GB | **C** | Flagship coder, Sonnet-4-class (server) |
| **GLM-5.2** | 744B / 40B MoE | MIT | ~250GB+ | **C** | Flagship, 1M ctx (server) |
| **Kimi K2.6** | ~1T-class MoE | modified MIT | huge | **C** | Frontier coding (server) |
| *GPT-5.5 (closed)* | — | proprietary | — | **API-only** | Not sovereign; reference only |

**Reading:** Tier-A/B (what we can actually run sovereign) is now a *rich* field of 20–35B-class Apache/MIT models. Tier-C flagships (GLM-5.2, Qwen3.5/480B, MiniMax, Kimi) are all server-class — API or future multi-GPU only.

---

## 3. Per-task-tier head-to-head fit

| Task tier | On 2×4070 (A) — sovereign | On GPU box (B) — sovereign | Needs-more (C) |
|---|---|---|---|
| **Router / classifier** (tiny, always-warm) | **gpt-oss-20b**, Gemma 4 E4B, Qwen3-4B-class (incumbent `qwen3:4b`) | same, instant | — |
| **Coder / daily-driver** | **Qwen3.6-27B** vs **GLM-4.7-Flash** vs `qwen3:30b-a3b` vs `qwen2.5-coder` | + Qwen3-Coder-Next 80B, gpt-oss-120b | Qwen3-Coder-480B, GLM-4.7 flagship |
| **Clinical / sensitive** (ollama-only, ALWAYS local — firewall) | **Qwen3.6-27B** or **GLM-4.7-Flash** or Gemma 4 31B; **never any cloud** | same, higher quality | **C never used** for clinical (must stay local) |
| **Heavy reasoning** | limited — best is a 30B-class MoE (offload); honest gap at this tier | **gpt-oss-120b** (o4-mini-class) or DeepSeek-R1; 2-bit flagships | GLM-5.2 / Qwen3.5 (API or server) |

**Honest gaps:**
- The **2×4070 tier has no great heavy-reasoning option** — 30B-class is the ceiling. Heavy reasoning wants the box (gpt-oss-120b on PRO 6000) or stays a vendor/escalation task per DR-0073.
- The **church 4070s may not be free for LLM at all** — they're earmarked for live-mix AI / transcription once Presenter retires ProPresenter. If consumed, all Tier-A models move to the box.
- **Clinical never escalates to Tier-C or any cloud** — the firewall (`pre-authorized-policies.yaml` Tier-0) forces `ollama` only. Local quality *is* the ceiling for clinical, which is why a strong local coder/reasoner (Qwen3.6-27B / GLM-4.7-Flash / Gemma 4 31B) matters most there.

---

## 4. Sovereign-vs-OpenRouter access split (the honest framing)

**OpenRouter is a cloud aggregator** — one API key + one OpenAI-compatible endpoint brokering hundreds of models (open *and* closed) across many providers. Real upsides: **cheap pay-per-token, no per-vendor accounts, crypto payment accepted, instant access to models too big to self-host.** Verified data posture:

- **By default OpenRouter does not log prompts/completions**, but stores **request metadata** (timestamp, model, token counts, latency) for billing.
- It offers a **Zero-Data-Retention (ZDR) mode** — but ZDR only holds if the **downstream provider** you route to also offers ZDR on that endpoint. The request still **transits OpenRouter + a third party**.
- **Optional prompt logging** gives a 1% discount **but grants OpenRouter an irrevocable commercial-use right** to those inputs/outputs — **never enable this.**
- **Crypto payments are non-refundable.**

**Verdict: data LEAVES. OpenRouter is NOT sovereign** — even with ZDR, prompts leave our infrastructure to OpenRouter and a third-party provider. It cannot be trusted with anything family/clinical/finance/church/private.

**The split:**

| | **Sovereign default (LOCAL weights)** | **OpenRouter (optional, non-sovereign)** |
|---|---|---|
| Data | Stays 100% local, offline | Leaves to OpenRouter + provider |
| Use for | **Everything sensitive** — TLC/clinical, family finance, COLG, any private/family data | **Non-sensitive heavy bursts only** — public research, throwaway scratch, capacity overflow when the box is busy |
| Cost | $0 marginal (owned/planned hardware) | Cheap per-token; **payment is Darrell's hand — we do not wire it** |
| Firewall | Required path for Tier-0 work | **Categorically blocked** for all Tier-0 (private) work |

**Routing-policy note (proposed for DR-0073 / `pre-authorized-policies.yaml`, not changed here):** add an **`openrouter` provider as an *optional non-sovereign burst lane*** in the **non-private, `vendor-first` path only** — peer to Claude/Gemini, behind the same Tier-0 firewall that forces `ollama`-only for TLC/finance/counseling/COLG. **Sovereign-local stays the default;** OpenRouter is opt-in overflow for non-sensitive heavy work, never a default, never for private data. Payment/keys are Darrell's to provision.

---

## 5. Model-Lab head-to-head plan

Per `MODEL-LAB-SPEC.md` (human-judged, every number traces to a real run — DR-0076). **No vendor benchmark in this doc is trusted until it runs on our own tasks.**

1. **Round 1 — Coder/daily-driver (Tier A/B, all sovereign-local):**
   `Qwen3.6-27B` vs `GLM-4.7-Flash` vs incumbent `qwen3:30b-a3b` vs `qwen2.5-coder` — on our **real fix-class + agentic tasks** (DR-0063 local-authors-plan loop). Winner earns the code-driver/base slot and feeds `success-metric-247-local-wakes-vendor`.
2. **Round 2 — Router/always-warm (Tier A):**
   `gpt-oss-20b` vs `Gemma 4 E4B` vs incumbent `qwen3:4b` — on classify/route latency + accuracy.
3. **Round 3 — Clinical-safe local (Tier A, ollama-only):**
   `Qwen3.6-27B` vs `GLM-4.7-Flash` vs `Gemma 4 31B` — judged on pastoral/counsel quality + refusal safety. **Local-only; no cloud entrant.**
4. **Round 4 — Heavy reasoning (Tier B, box):**
   `gpt-oss-120b` vs `DeepSeek-R1` — when the box lands. Establishes whether local can own heavy reasoning or it stays a vendor escalation.
5. **Non-sovereign reference (optional, Darrell-funded):** if/when OpenRouter is enabled, run flagship `GLM-5.2` / `Qwen3-Coder-480B` via OpenRouter as a **ceiling reference** on *non-sensitive* tasks only — to quantify the local↔flagship gap, never as a routed default.

**Recommendation:** Add `Qwen3.6-27B`, `GLM-4.7-Flash`, and `gpt-oss-20b` to the Model Lab menu (lanes `local_132b8f90` / `local_00897763`) as the priority entrants. All Apache/MIT, all box-fit, all $0 to trial. Park Tier-C flagships and OpenRouter as roadmap/optional. Avoid `MiniMax-M2.7` (license trap).

---

## Sources

- [Qwen/Qwen3.6-27B · Hugging Face](https://huggingface.co/Qwen/Qwen3.6-27B) + [Qwen3.6-27B blog](https://qwen.ai/blog?id=qwen3.6-27b) (dense 27B, 256K, Apache, SWE-bench Verified 77.2)
- [Qwen/Qwen3-Coder-Next · Hugging Face](https://huggingface.co/Qwen/Qwen3-Coder-Next) (80B/3B MoE, 256K, Apache, Feb 4 2026)
- [Gemma 4 — Google blog](https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/) + [Gemma releases](https://ai.google.dev/gemma/docs/releases) (E2B/E4B/26B-A4B/31B, Apache-2.0, Apr 2 2026)
- [MiniMax-M2 · GitHub](https://github.com/MiniMax-AI/MiniMax-M2) (230B/10B MoE, MIT) + [M2.7 license controversy — BigGo](https://finance.biggo.com/news/9eATkZ0BvbjfYyetcbwH) (M2.7 non-commercial Modified-MIT)
- [Introducing gpt-oss — OpenAI](https://openai.com/index/introducing-gpt-oss/) + [openai/gpt-oss-120b · HF](https://huggingface.co/openai/gpt-oss-120b) (117B/5.1B + 21B/3.6B, Apache-2.0, 128K, 120b on single 80GB / 20b on 16GB)
- [Ollama library](https://ollama.com/library) + [Top Ollama Models June 2026 — PromptQuorum](https://www.promptquorum.com/local-llms/top-open-source-models-ollama) (Qwen3.6-27B, Kimi K2.6, gpt-oss:20b, qwen3:30b, DeepSeek, Gemma 4, MiniMax M3)
- [zai-org/GLM-4.7 · HF](https://huggingface.co/zai-org/GLM-4.7), [GLM-4.6 · HF](https://huggingface.co/zai-org/GLM-4.6), [GLM-5.2 — eigent.ai](https://www.eigent.ai/blog/glm-5-2) (MIT family; 744B/40B flagship; 30B-A3B Flash)
- [OpenRouter ZDR docs](https://openrouter.ai/docs/guides/features/zdr) + [Provider Logging](https://openrouter.ai/docs/guides/privacy/provider-logging) + [Data Collection](https://openrouter.ai/docs/guides/privacy/data-collection) (default no prompt logging; metadata retained; ZDR depends on downstream provider; prompt-logging opt-in grants irrevocable commercial-use right; crypto non-refundable)
