# LOCAL-LLM-MODEL-PICKS.md

**Status:** RESEARCH-REVIEW + RECOMMENDATION (2026-06-23). READ-ONLY. Advisory only — pulls NO model, makes NO purchase. Per-tier model picks for the **current CPU-only NAS (NOW)** and the **GPU box being procured (LATER)**.

**Companion to** [`LOCAL-LLM-HARDWARE-RECOMMENDATION.md`](LOCAL-LLM-HARDWARE-RECOMMENDATION.md) (which box) — this doc answers **which models** run on each box, per task tier, and gives the direct **Hermes 3 (8B) vs qwen2.5:14b** verdict Darrell asked for.

> **Verification doctrine (DR-0076):** every tok/s figure below is cited to a current source (§Sources) or explicitly flagged as an **estimate** with the reasoning shown. The local-LLM field moves weekly; figures marked *(fast-moving)* may already have shifted. "Looks right" is not a status — where a number was not directly published for *this* CPU, it is derived and labeled.

> **One correction to reconcile:** the hardware doc lists the NAS at **32GB ECC**; this task brief states **~62GB RAM**. This doc uses **~62GB** (the figure Darrell gave), and it matters — 62GB is what lets a 30–35B Mixture-of-Experts model sit resident in RAM, which is the headline NOW upgrade. **Action flag:** confirm the real installed RAM before pulling the 30B MoE; if it is actually 32GB, the MoE still fits at Q4 (~18–20GB) but with less headroom.

---

## 0. TL;DR — the three things to act on

1. **Hermes 3 (8B) is NOT a general upgrade over qwen2.5:14b for our uses.** It is a *side-grade* that wins only for narrow jobs (agentic tool-calling, structured-output reliability, uncensored/persona drafting). For the daily-driver *quality* jobs (reasoning, coding, clinical tagging), an 8B Llama-3.1 fine-tune sits **below** a 14B Qwen on knowledge/reasoning/math/code. **Verdict in §1.**

2. **The real NOW win is not "Hermes vs 14B" — it's switching the daily driver to a 3B-active MoE.** `qwen2.5:14b` is dense, so the CPU decodes all 14B params per token → **2–4 tok/s** (sub-conversational). A **Qwen3-30B-A3B** (or **Qwen3.5-35B-A3B**) Mixture-of-Experts activates only **~3B params per token** → **~12–23 tok/s on CPU** *and* higher quality than the dense 14B. Same RAM home, **3–6× the speed, better answers.** This is the single biggest lever on the current box.

3. **The GPU box is the leap, not a tweak.** On CPU every dense model ≥14B is a compromise; coding on the NAS is effectively off-limits. On the RTX PRO 6000 (96GB) the coder tier (Qwen3-Coder / Qwen2.5-Coder-32B) and a heavy-reasoning MoE (Qwen3.5-122B-A10B) both become real-time. **Per-tier picks in §4–§5.**

**Honest framing:** the CPU is the limiter now. Every NOW pick below is "best *given* a CPU," not "good." The MoE switch makes the NAS genuinely usable for chat/draft/reasoning; coding and real-time transcription wait for the GPU.

---

## 1. The Hermes verdict (the headline question)

**Question:** is **Hermes 3 (8B)** better than the current **qwen2.5:14b** for our uses?

**Answer: No — not as a daily driver.** It's a specialist, not a general upgrade. Pull it *in addition to* a strong general model for the jobs it's actually good at; do not pull it *instead of* one.

### What Hermes 3 (8B) actually is

Hermes 3 is Nous Research's fine-tune of **Meta Llama 3.1 8B** (also 70B / 405B), released **Aug 2024**, trained on ~390M tokens of synthetic data. Its design goals: **agentic capability, reliable function-calling + structured output, "neutral alignment" (steerable / largely uncensored), strong multi-turn + roleplay/persona, 128K context.** It reaches SOTA *among open-weight 8B models* on ARC / BoolQ / HellaSwag / IFEval / Winogrande, matching or beating Meta's own Llama 3.1 8B Instruct. [§a, §b, §c]

The key fact: **Hermes 3 8B's ceiling is the Llama 3.1 8B base.** The fine-tune makes it more *steerable and tool-reliable*, not more *knowledgeable or smarter* than its base class.

### Head-to-head, on our axes

| Axis | Hermes 3 **8B** (CPU NAS) | qwen2.5 **14B** (CPU NAS) | Winner |
|---|---|---|---|
| **CPU-runnability** | Dense 8B, ~4.7GB Q4 — runs comfortably in 62GB | Dense 14B, ~9GB Q4 — runs, but heavy per-token | Hermes (lighter) |
| **Speed (this NAS class)** | **~8–15 tok/s** *(est.; dense-8B CPU, ~1.7× the 14B's decode cost)* | **2–4 tok/s** (measured, current daily driver) | **Hermes** (~3× faster) |
| **General reasoning / knowledge** | 8B-class; below 14B | 14B-class; broader, deeper | **14B** |
| **Math** | 8B Llama-class (weak) | Qwen2.5-14B ≈ 75.6% MATH [§d] | **14B** |
| **Coding** | 8B Llama-class (weak, ~Llama3 8B) | Qwen2.5-14B ≈ 72.5% HumanEval [§d] | **14B** |
| **Multilingual / scripture-language nuance** | Llama 3.1 (good EN, narrower) | Qwen 29-language coverage | **14B** |
| **Agentic tool-calling / function-calling** | **Purpose-built, reliable structured output** | Capable but not its focus | **Hermes** |
| **Uncensored / steerable / persona drafting** | **"Neutral alignment," highly steerable** | More guard-railed/refusal-prone | **Hermes** (for that job) |
| **Long-context coherence** | 128K trained; some GGUF quants ship an **8K default ctx — set num_ctx explicitly** [§b] | 128K, 32K practical | tie (mind Hermes' ctx default) |

### When Hermes 3 wins → pull it for these
- **Agentic / function-calling surfaces** where reliable JSON / tool-call structure matters more than raw IQ (the workflow-dispatch and structured-extraction rows).
- **Persona / drafting** where a steerable, less-refusing voice helps and the content is low-risk.
- **Speed-sensitive 8B jobs on the CPU** where 14B's 2–4 tok/s is too slow and an 8B's answer is good enough.

### When qwen2.5:14b wins → keep it over Hermes for these
- **Reasoning, math, coding, knowledge, multilingual** — anything where answer *quality/correctness* is the job. A 14B Qwen beats an 8B Llama fine-tune on essentially all of these.
- **Clinical / scripture / governance content** where being *wrong* is expensive (DR-0076) — the larger, more knowledgeable model is the safer default.

### The twist that makes the whole question semi-moot
You shouldn't pick **Hermes 8B vs qwen2.5:14b** at all for the daily driver — **both are beaten by newer small models:**
- **Qwen3-8B beats Qwen2.5-14B on ~15 benchmarks** [§e] — so if you want an 8B daily driver, `qwen3:8b` dominates *both* Hermes 3 8B and qwen2.5:14b, at 8B speed.
- A **30B-A3B MoE** beats the 14B on quality *and* runs 3–6× faster on CPU (§2). That's the move.

**Bottom line:** Hermes 3 8B earns a place as the **agentic / tool-calling / steerable-draft specialist** — pull it for *that*. It does **not** replace the general daily driver, and the general daily driver itself should move off qwen2.5:14b to a Qwen3-class model.

---

## 2. Why MoE changes the CPU story (the core insight)

On a CPU, **decode speed is set by how many parameters activate per token × RAM bandwidth** — not total model size.

- **Dense `qwen2.5:14b`:** all ~14B params fire every token → **2–4 tok/s** on the Xeon D-1527. Painful.
- **MoE `Qwen3-30B-A3B`:** 30B total *resident in RAM*, but a router fires only **~3B params per token** → **~12–15 tok/s** on a modern desktop CPU at Q4, and **~23 tok/s** with a reduced-expert (4-of-8) variant. [§f] The Xeon D-1527 is older/slower than those test CPUs, so **expect the low end — call it ~8–14 tok/s** *(est., scaled down for the D-1527's lower clock + RAM bandwidth)*. Even the conservative estimate is **2–4× faster than the dense 14B, with better answers.**

Cost: the full 30B sits in RAM (~18–20GB at Q4). With ~62GB that's comfortable; at 32GB it still fits but eats most of the headroom — **verify RAM first (§intro flag).** The bottleneck on CPU MoE is **RAM speed**, not core count [§f] — so faster DIMMs help more than more cores.

This is the lever the hardware doc didn't have when it was written for *dense* models; MoE-with-tiny-active-experts is what makes a "30B-quality" answer affordable on a CPU.

---

## 3. Model survey — viable on these specs (June 2026), CITED

Rough tok/s: **CPU** = this NAS class (Xeon D-1527, no GPU); **GPU** = the procured box (RTX PRO 6000-class). Quality notes are relative to the local-model field, not to frontier cloud.

| Model | Params (active) | CPU tok/s (this NAS) | GPU tok/s | Quality / role notes | Source |
|---|---|---|---|---|---|
| **Hermes 3** | 8B dense | ~8–15 *(est.)* | fast | Agentic, function-calling, steerable/uncensored, 128K. 8B knowledge ceiling. | §a,b,c |
| **Hermes 3 70B** | 70B dense | **~0.7–1.5** *(est., unusable)* | ~24–27 (dual-GPU) | Strong agentic 70B; **CPU-prohibitive** — GPU only. | §a |
| **Qwen2.5** | 7B / 14B / 32B dense | 7B ~6–10; 14B **2–4**; 32B ~1–2 | 32B ~40–48 | Solid 2024-class; 14B = current driver. **Superseded by Qwen3.** | §d,§g |
| **Qwen2.5-Coder** | 7B / 32B dense | 7B ~6–10 (usable); 32B too slow | 32B ~48 | **Best open coder of the 2.5 line** (32B ≈ 91% HumanEval). 7B is the only CPU-viable coder. | §g |
| **Qwen3** | 8B / 14B / 32B dense + **30B-A3B MoE** | 8B ~8–14; **30B-A3B ~8–14** *(est.)*; 14B/32B dense slow | dense 8B ~120–175; 30B-A3B very fast | **Thinking-mode toggle.** Qwen3-8B > Qwen2.5-14B; Qwen3-4B ≈ Qwen2.5-72B. **30B-A3B is the CPU sweet spot.** | §e,§f,§h |
| **Qwen3.5** *(Feb 2026)* | 9B/4B/2B dense; **35B-A3B**, 27B, 122B-A10B MoE | 9B ~7–12; **35B-A3B ~8–14** *(est.)* | fast | Current Qwen line. **9B beats gpt-oss-120B on several benches.** 35B-A3B = newer 30B-A3B. 122B-A10B = GPU heavy-reasoning. | §i |
| **Qwen3-Coder** | 480B-A35B (+ smaller MoE) | ✗ (too big) | GPU/cluster | Flagship agentic coder, **≈ Claude Sonnet 4 on agentic coding**; smaller A3B coder variants are the GPU-box pick. | §i,§j |
| **Qwen3.6** *(very recent)* | 27B dense; **35B-A3B** | 35B-A3B ~ MoE-class | ~30 tps on 6GB VRAM | *(fast-moving / verify)* "Flagship-level coding in 27B"; agentic 35B-A3B coder. Bleeding edge — confirm before relying. | §f,§k |
| **Llama 3.3** | 70B dense (+ 3.1 8B) | 70B ✗; 8B ~8–15 | 70B ~26–27 (dual-GPU) | 70B = strong general/reasoning **GPU-only**; 8B is the Hermes base. | §d,§g |
| **Gemma 3** | 4B / 12B / 27B dense | 4B ~12–20 (4.2GB); 12B ~3–6 | fast | **RAM-efficient**, strong multilingual + vision variants. 4B = great tiny CPU model; 12B ≈ 14B-class quality. | §d |
| **Phi-4** | 14B dense | ~2–4 (dense-14B) | fast | **Reasoning/math specialist** (80.4% MATH, beats Qwen2.5-14B on math) — but dense-14B = slow on CPU. Best on GPU or as a targeted call. | §d |
| **Mistral / Devstral** | 7B / 24B | 7B ~6–10; 24B slow | 24B fast | Mistral 7B = fastest decent general; **Devstral Small 2 (24B)** = agent-first coder (68% SWE-bench), GPU-tier. | §d,§g |
| **Whisper (faster-whisper)** | large-v3 / **v3-turbo** / distil-v3 | **batch only**, see §4 | real-time | Transcription. v3-turbo = 8× faster decode; distil-v3 = 6× faster, −1% WER (EN). CTranslate2 INT8 on CPU. | §l,§m |

**Reading the table for the CPU box:** the only models that are *both* CPU-runnable at conversational speed *and* high quality are the **3B-active MoEs** (Qwen3-30B-A3B / Qwen3.5-35B-A3B) and the **strong small dense models** (Qwen3-8B, Gemma 3 4B/12B). Everything dense ≥14B is a quality/speed compromise on this hardware.

---

## 4. NOW — concrete picks for the CPU NAS (Xeon D-1527, ~62GB, no GPU)

| Tier | Pull this | Speed (CPU) | Why |
|---|---|---|---|
| **Daily driver (general chat / draft / reasoning)** | **`qwen3:30b-a3b`** (MoE) — Qwen3-30B-A3B | ~8–14 tok/s *(est.)* | Better than dense 14B, **3–6× faster** on CPU; thinking-mode toggle covers the reasoning tier too. **The upgrade off qwen2.5:14b.** |
| → *lighter fallback if RAM/stability bites* | **`qwen3:8b`** | ~8–14 tok/s | Beats qwen2.5:14b on ~15 benches at 8B footprint; safe, small, fast. |
| **Reasoning (hard)** | same **`qwen3:30b-a3b`** with **thinking on**; targeted **Phi-4** call for pure math | MoE conversational; Phi-4 slow | One model, thinking toggle. Reach for Phi-4 only when a problem is math/logic-heavy and worth the wait. |
| **Router / classifier (deterministic, fast)** | **`qwen3:4b`** (replaces `qwen2.5:3b`) | ~12–20 tok/s | Qwen3-4B ≈ Qwen2.5-72B quality at router cost; keep thinking **off** for routing latency. Keep `qwen2.5:3b` only if 4B regresses latency. |
| **Coder** | **`qwen2.5-coder:7b`** (only if coding on the NAS is truly needed) | ~6–10 tok/s | CPU coding is a compromise. 7B is the ceiling that stays usable; **real coding waits for the GPU box.** Do not run 32B coders on CPU. |
| **Narrow tagging / clinical / structured extraction** | **`qwen3:4b`** for tagging; **`hermes3:8b`** when tool-call / JSON-structure reliability is the job | 4B ~12–20; Hermes ~8–15 | Small + fast for high-volume tagging; Hermes 3 8B is the **function-calling / structured-output specialist** (its real niche). |
| **Transcription** | **faster-whisper `large-v3-turbo` (INT8, CTranslate2)** — batch | **batch, not real-time** | On a Xeon CPU, large-v3 took >10 min for 13 min audio; **turbo's 8× faster decode** brings batch sermon/meeting transcription into minutes. Real-time needs the GPU. Use `distil-large-v3` if EN-only and speed > the last 1% WER. |

**Net NOW change:** retire `qwen2.5:14b` as the driver → **`qwen3:30b-a3b`**; bump the router `qwen2.5:3b` → **`qwen3:4b`**; add **`hermes3:8b`** as the tool-calling specialist (not the driver); add **faster-whisper turbo** for batch transcription. Verify installed RAM before pulling the 30B MoE.

---

## 5. LATER — concrete picks for the GPU box (RTX PRO 6000 96GB / dual options)

On 96GB the box runs a coder **and** a heavy-reasoning model concurrently; everything below is real-time.

| Tier | Pull this | Why |
|---|---|---|
| **Coder (daily driver)** | **Qwen2.5-Coder-32B** (proven, ~48 tok/s, ≈91% HumanEval) **or** a **Qwen3-Coder A3B** variant for agentic tool-use | Hardware doc's ratified pick; Qwen3-Coder closes the agentic gap (≈ Sonnet-4-class on agentic coding). Pull both, A/B on real tasks. |
| **Coder (agentic default)** | **Devstral Small 2 (24B)** or **Qwen3.6-35B-A3B** *(verify)* | Agent-first training for Cline/Aider/OpenClaw tool-calling. |
| **Heavy reasoning / cross-verify** | **Qwen3.5-122B-A10B** (MoE, 10B active — fits 96GB) **or** dense **Llama 3.3 70B / Qwen3-32B (thinking)** | The `16-cross-verify` / `17-deeper-reasoning` workflow rows; 122B-A10B gives near-frontier reasoning at MoE speed on one card. |
| **Router / small / always-on** | **`qwen3:4b`** / **Gemma 3 4B** | Instant on GPU; same models as NOW, now free-speed. |
| **Tagging / structured / agentic glue** | **`hermes3:8b`** (or 70B if a job needs it) | Function-calling specialist, now real-time. |
| **Transcription** | **Whisper large-v3 (full)**, real-time | The media/sermon pipeline lives here; GPU finishes 13-min audio in <1 min. |

This matches the hardware doc's §5 model list, **updated** for the Qwen3 / Qwen3.5 generation that shipped since (Qwen3-Coder, Qwen3.5-122B-A10B, the A3B agentic coders).

---

## 6. PHONE / on-device tier — Samsung Z Fold 7 (Android)

Darrell wants a **private, offline LLM on the phone itself.** This is real and useful — but be honest about the ceiling: **phone models are small (1B–4B, ~8B at the top), for quick / private / offline / draft work — NOT heavy reasoning.** Anything hard still routes to the NAS (now) or the GPU box (later). The phone is the "answer in my pocket with no signal, nothing leaves the device" tier.

**Device note (Z Fold 7):** 2025 flagship, Snapdragon 8 Elite-class SoC, ~12–16GB RAM — comfortably runs **up to ~8B** quantized, and **3–4B is the sweet spot** (snappy + leaves RAM for the OS). **Termux does NOT install on the Z Fold 7**, so the picks below are **native Play-Store apps**, not terminal/llama.cpp-from-source.

### Apps (native, no terminal)

| App | Best for | Notes | Source |
|---|---|---|---|
| **MLC Chat** *(best single pick)* | **Most users — fastest, zero setup** | Installs from Play in <1 min; **compiles each model to the phone's exact chip** (uses the GPU/NPU), so it's the fastest path; pre-optimized model list. Fully offline after download. | §n,§o |
| **PocketPal AI** *(power pick)* | **Loading custom GGUF models** | Hugging Face-integrated in-app model search; pick any GGUF + quant (Q4_K_M is the right default); great when you want a specific model MLC doesn't ship. Open-source. | §n,§p |
| **Google AI Edge Gallery** | **Google's mobile-first Gemma models** | Google's open-source on-device app; runs Gemma 3n / Gemma 4 edge (E2B/E4B) and other LiteRT models fully offline via MediaPipe LLM Inference. | §n,§q |

**Recommendation:** install **MLC Chat first** (speed + no setup), add **PocketPal** when you want to pull a specific GGUF (e.g. a Qwen3-4B quant) that MLC doesn't carry. AI Edge Gallery is worth it specifically to try Google's mobile-tuned Gemma.

### Models (flagship Android, rough on-phone speed)

| Model | Size | On-phone tok/s (flagship) | Good for | Source |
|---|---|---|---|---|
| **Gemma 3n / Gemma 4 E4B** *(best single pick)* | ~4B (mobile-optimized; E2B lighter) | **~8–25 tok/s** | **Purpose-built for phones** — best quality-per-watt on-device; multimodal-capable; Google-tuned for NPU/GPU. | §q,§r |
| **Qwen3 4B** | 4B dense | **~15–30 tok/s** | Best **general/reasoning** small model; Qwen3-4B ≈ Qwen2.5-72B quality; thinking-toggle. The quality pick if you load custom GGUF in PocketPal. | §e,§r |
| **Llama 3.2 3B** | 3B dense | ~20–30 tok/s | Fast, reliable general chat/draft; Meta-backed, well-quantized. | §r |
| **Phi-3.5-mini** | 3.8B dense | ~12–20 tok/s | **Reasoning/math** in a tiny footprint (Phi line punches above weight). | §r |
| **Llama 3.2 1B / Gemma 3 1B** | 1–1.3B | 1B can hit **2,500+ tok/s on mobile GPU** (MLC) | Instant autocomplete / classify / on-device routing; lowest quality. | §q,§r |

**Phone recommendation:** **best single pick = Gemma 3n/4-E4B in MLC Chat** (mobile-tuned, fastest sanctioned path). **Quality alternative = Qwen3-4B via PocketPal** (best reasoning for the size). Keep a **1–3B** (Llama 3.2 1B/3B) around for instant lightweight tasks. Use phone models for: quick private Q&A offline, draft text, on-device classify/summarize of something you don't want leaving the phone. **Do not** expect them to match the NAS MoE or the GPU box — that's the whole tiering.

---

## 7. Source-of-truth — learn about new local LLMs FIRST

The field moves **monthly** (Qwen3 → 3.5 → 3.6 inside ~14 months; Gemma 3 → 3n → 4). This is the watch-list so a new model doesn't surprise us, plus how to wire it into the continuous-reel so it surfaces automatically.

### The watch-list (ranked by signal speed)

| # | Source | URL | What it catches | Feed-able? |
|---|---|---|---|---|
| 1 | **Hugging Face — trending models** | https://huggingface.co/models?sort=trending | New weights the day they drop; filter `?apps=ollama&sort=trending` for runnable ones | **API** (`huggingface.co/api/models?sort=trendingScore`) — pollable JSON |
| 2 | **r/LocalLLaMA** | https://www.reddit.com/r/LocalLLaMA/ | Community-surfaced releases + real-world tok/s before docs exist; **fastest practical signal** | **RSS** (`/r/LocalLLaMA/new/.rss`, `/top/.rss?t=day`) |
| 3 | **Ollama model library** | https://ollama.com/library | When a model is **pull-ready** for our stack (the "can I run it tonight" gate) | Scrape (no official RSS); watch `/library?sort=newest` |
| 4 | **Qwen blog** | https://qwenlm.github.io/blog/ · https://qwen.ai/blog | Our primary model family's releases first-hand | **RSS** (`qwenlm.github.io/index.xml`) |
| 5 | **Meta Llama** | https://ai.meta.com/blog/ · https://www.llama.com | Llama line (Hermes base, Llama 3.x) | RSS (Meta AI blog feed) |
| 6 | **Google AI / DeepMind** | https://developers.googleblog.com/ · https://deepmind.google/discover/blog/ | Gemma + Gemma-3n/4 edge (the phone tier) | **RSS** (developers blog has per-tag feeds) |
| 7 | **Mistral AI** | https://mistral.ai/news | Mistral / Devstral releases | RSS / news page |
| 8 | **Nous Research** | https://nousresearch.com/ · https://x.com/NousResearch | Hermes line | X/RSS (sparse; watch HF org `huggingface.co/NousResearch`) |
| 9 | **Unsloth docs / blog** | https://unsloth.ai/docs · https://unsloth.ai/blog | Earliest *run-locally* guides + quants for brand-new models (often same-day) | RSS / scrape |

**Tip:** sources 1 + 2 are the **earliest** signals (weights + community buzz); sources 3 + 9 tell you when it's **actually runnable** on our hardware; sources 4–8 are the **authoritative why**. Watch all three layers.

### Wire it into the continuous-reel (behind the brakes)

A small NAS-side tracker turns the watch-list into reel events so new models surface in-app automatically — built to the established rules:

1. **`wf-model-watch` (n8n, NAS):** on a schedule (daily is plenty — this is monthly-cadence news), poll the **RSS feeds** (4–9) and the **HF trending API** (1) + **r/LocalLLaMA `.rss`** (2). Where there's no feed (Ollama library, 3), a polite low-frequency scrape of `?sort=newest`. **Respect robots/ToS — RSS/API first, scrape only where allowed.**
2. **Dedup + material-only-fire:** keep a seen-set (`/data/poetech-briefing/_model_watch_seen.json`); emit a reel event **only** for a genuinely new model/family (not every re-post). This is the **material-only-fire** discipline — the reel doesn't get noisy. (Per `project-continuous-feedback-reel`: material-only-fire is a noise filter, **not** a substitute for the kill-switch.)
3. **Append to the reel:** write one JSONL line per new model to `/data/poetech-briefing/_reel.jsonl` (the existing append-only event reel; Dispatch-status convention) → it shows in the in-app/NAS readout newest-first.
4. **Three brakes (binding — `feedback_autonomous_automation_three_brakes`):** this is timer-driven automation, so it ships with **(a) budget** — capped feed count + wall-clock per run; **(b) concurrency lock** — single-instance, a new fire skips if the prior run is mid-flight; **(c) kill-switch** — auto-pause on repeated fetch failures / missed heartbeat. **Ship it inactive; turn on only when watched** (Tier C, never Tier A — it's autonomous, even though it's "just news").
5. **Optional human gate:** route a "new model worth trying?" one-tap into the Governor surface rather than auto-pulling anything. Discovery is automatic; **pulling/running a model stays Darrell's hand** (GOVERNANCE-EXECUTION-ADVISORY).

This keeps us first-to-know without a runaway: read-only polling, deduped, braked, and a model only ever gets *pulled* by a human decision.

---

## 8. Honest limits & uncertainty (DR-0076)

- **CPU tok/s for this exact Xeon D-1527 are estimates.** Published MoE-on-CPU numbers (12–23 tok/s) are from newer desktop CPUs (Ryzen 9 7950X3D, Ryzen 5 5600G). The D-1527 (2016, 4-core, lower clock + RAM bandwidth) will land **at or below the low end** — I scaled to ~8–14 tok/s but **this must be measured on the box** (`ollama run --verbose`, watch eval rate) before it's trusted. *Measure, don't claim.*
- **The 62GB vs 32GB RAM discrepancy is unresolved in-doc.** Confirm before pulling a 30B MoE.
- **Qwen3.6 is bleeding-edge** (very recent, multiple sources but young) — treat its figures as provisional; **Qwen3 / Qwen3.5 are the safe current picks.**
- **Release-date noise:** sources disagree on Qwen3's date (GitHub: Apr 2025; one blog: Apr 2026). Qwen3.5 is consistently **Feb 2026**. The *capability ordering* (Qwen3 > Qwen2.5; 3B-active MoE >> dense-14B on CPU) is robust regardless of exact dates.
- **No model was pulled or benchmarked in this session** — this is research + recommendation only. The Phase-1 smoke test in the hardware doc is the verification step that turns these estimates into measured fact.
- **Phone tok/s are flagship-class estimates, not Z-Fold-7-measured.** Published figures are from Pixel 9 Pro / Snapdragon 8 Gen 3–Elite; the Z Fold 7 is in that class but **measure in-app** (MLC Chat / PocketPal show eval rate). On-device speed swings hard with quant, context length, and NPU-vs-GPU-vs-CPU path. **Termux-not-installable on the Z Fold 7 is asserted from Darrell's report — native apps sidestep it regardless.**
- **Gemma naming is in flux** — "Gemma 3n" (mobile) and a newer "Gemma 4 E2B/E4B" edge line both appear in current sources; treat the *specific* edge variant as *(verify the latest in AI Edge Gallery / MLC at pull time)*. The pattern (Google ships a mobile-tuned small Gemma) is stable.
- **The watch-list is the durable output:** these picks are a June-2026 snapshot. Wiring §7's `wf-model-watch` is what keeps this doc from going stale — the feed surfaces the next Qwen/Gemma/Hermes before we have to ask.

---

## Sources

- **a.** Hermes 3 — Nous Research model card + technical report (Llama 3.1 8B/70B/405B fine-tune, Aug 2024, agentic/function-calling/neutral-alignment, 128K, ARC/BoolQ/HellaSwag/IFEval/Winogrande SOTA among open-weight) — huggingface.co/NousResearch/Hermes-3-Llama-3.1-8B; arxiv.org/pdf/2408.11857; interconnects.ai "On Nous Hermes 3"
- **b.** Hermes 3 8B GGUF / Ollama (16GB Q4 / 24GB BF16; ctx-default caveat) — huggingface.co/NousResearch/Hermes-3-Llama-3.1-8B-GGUF; ollama.com/finalend/hermes-3-llama-3.1:8b
- **c.** Hermes 3 capability summary — fast.io/resources/hermes-3-model-guide
- **d.** CPU-local model comparison (Phi-4 80.4% MATH; Qwen2.5-14B 75.6% MATH / 72.5% HumanEval; Llama 3.3 8B; Gemma 3 4B 4.2GB; Mistral 7B; "<8B for CPU") — sitepoint.com/best-local-llm-models-2026; localaimaster.com/blog/small-language-models-guide-2026; promptquorum.com/local-llms
- **e.** Qwen3-8B beats Qwen2.5-14B on ~15 benchmarks; Qwen3-4B ≈ Qwen2.5-72B — qwenlm.github.io/blog/qwen3; pricepertoken.com (Hermes 2 Pro vs Qwen3 14B)
- **f.** Qwen3-30B-A3B CPU speed (12–15 tok/s Q4; 23 tok/s 4-expert variant; RAM-speed bottleneck) + Qwen3.6-35B-A3B ~30 tps on 6GB VRAM via llama.cpp — mychen76.medium.com (Run Qwen3.6-35B-A3B); huggingface.co/DavidAU/Qwen3-30B-A1.5B-High-Speed; arsturn.com (Qwen3-Coder 30B hardware)
- **g.** Qwen2.5 / Qwen2.5-Coder + RTX 5090 32B ~48 tok/s; Qwen2.5-7B CPU ~45 tok/s on Xeon 8480+ — ollama.com/library/qwen2.5-coder; qwen.readthedocs.io speed benchmark; databasemart.com
- **h.** Qwen3 sizes / thinking-mode / Ollama (0.6B–32B dense + 30B-A3B/235B-A22B MoE) — github.com/QwenLM/Qwen3; ollama.com/library/qwen3; serverman.co.uk how-to-run-qwen3
- **i.** Qwen3.5 (Feb 16 2026 flagship 397B-A17B; Feb 24 122B-A10B/35B-A3B/27B; Mar 2 9B/4B/2B/0.8B; 9B beats gpt-oss-120B) + Qwen3-Coder 480B-A35B ≈ Sonnet 4 — techie007.substack.com; digitalapplied.com; remoteopenclaw.com/blog/best-qwen-models-2026
- **j.** Qwen3-Coder agentic coding benchmarks — unsloth.ai/docs/models/tutorials/qwen3-coder-how-to-run-locally
- **k.** Qwen3.6 (27B dense "flagship-level coding"; 35B-A3B agentic) *(fast-moving, verify)* — github.com/QwenLM/Qwen3.6; qwen.ai/blog qwen3.6-27b / qwen3.6-35b-a3b
- **l.** faster-whisper (CTranslate2 INT8, 2× CPU / 4× GPU; large-v3 >10 min for 13 min on Xeon CPU; turbo 8× faster decode; distil-v3 6× faster −1% WER) — github.com/SYSTRAN/faster-whisper; localaimaster.com/blog/faster-whisper-guide; promptquorum.com local-whisper-stt-comparison-2026
- **m.** Whisper large-v3 / v3-turbo model cards — huggingface.co/openai/whisper-large-v3
- **n.** Android on-device LLM apps (MLC Chat fastest/zero-setup + chip-compiled; PocketPal custom-GGUF + HF search; AI Edge Gallery for Gemma; 4GB min / 8GB for 7B) — localaimaster.com/blog/run-llm-on-phone; promptquorum.com/prompt-bites/best-local-llm-apps-android; itsfoss.com/android-on-device-ai
- **o.** MLC Chat / MLC-LLM (per-device compile, GPU/NPU) — github.com (mlc-ai/mlc-llm); ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/android
- **p.** PocketPal AI (open-source, GGUF + Q4_K_M default) — github.com/a-ghorbani/pocketpal-ai; discuss.privacyguides.net/t/pocketpal
- **q.** Gemma 3n / Gemma 4 E2B-E4B edge + AI Edge Gallery (mobile-first; 1B 2,500+ tok/s mobile GPU; 8–25 tok/s flagship) — developers.googleblog.com/en/introducing-gemma-3n-developer-guide; mindstudio.ai/blog/gemma-4-edge-deployment-e2b-e4b-models; ai.google.dev/edge
- **r.** On-phone tok/s (flagship 15–30 tok/s; Qwen3-4B & Llama 3.2 ~15–30 on SD8Gen3; Gemma 8–25; Phi-3.5-mini) — dev.to/alichherawalla (run local AI on Android 2026); localaimaster.com/blog/small-language-models-guide-2026; github.com/ggml-org/llama.cpp Discussion #8273
- **s.** Source-of-truth feeds (HF trending `?apps=ollama&sort=trending` + models API; Ollama library ~4,500 models; HF 45K GGUF; community quants) — huggingface.co/models?apps=ollama&sort=trending; huggingface.co/docs/hub/ollama; ollama.com/library; promptquorum.com/local-llms/top-open-source-models-ollama

---

*Advisory under the hardware-decision lineage (DR-0014 → DR-0053) and the AI-infrastructure foundation. No model pulled, no purchase made. The Phase-1 tok/s smoke test in `LOCAL-LLM-HARDWARE-RECOMMENDATION.md` is the verification step that converts the CPU estimates here into measured fact.*
