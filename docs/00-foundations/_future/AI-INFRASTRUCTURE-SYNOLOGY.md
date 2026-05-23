# SKOS AI Infrastructure on Synology — Vision Notes (FUTURE / UNRATIFIED)

> **STATUS: PARKING LOT.** This document captures the initiative direction for the SKOS AI pipeline running on Darrell's Synology DS1621xs. It is NOT a ratified foundation. It is NOT a committed plan. It is a structured holding place for vision so nothing is lost. Revisit when the Counseling sub-tab has shipped, MVP-1 (the Sovereign Family Financial OS) has stabilized, and the open questions below have been answered by Darrell.

> *"The plans of the diligent lead surely to abundance, but everyone who is hasty comes only to poverty."* — Proverbs 21:5 (ESV)

> *"Unless the LORD builds the house, those who build it labor in vain."* — Psalm 127:1 (ESV)

---

## What This Document Is

A vision sketch for **self-hosted AI infrastructure on Darrell's Synology DS1621xs** that, over time, becomes the brain behind SKOS's AI surfaces — beginning with the Counseling sub-tab in Church (Council Chamber) and extending to every future surface that needs an AI loop. The founder framing, in Darrell's own words on 2026-05-23:

> *"I want to use my Synology DS1621xs with the infrastructure to produce the best pipeline for producing using Ai. maybe use models in parallel on that system."*

This document is captured here honestly — including the hard parts (the DS1621xs is a CPU-only NAS without a GPU; "models in parallel" can mean five different things) — so the direction can be evaluated soberly later, not chased prematurely.

---

## Vision

Self-hosted AI on the family's own hardware is **the natural fit for the Sovereign in Sovereign Family Financial OS.** Local-first data, per `_root/IN-PLACE-FIRST.md`, is the same posture extended to the AI itself: prompts, journal entries, conversation context, scripture lookups, and any cross-surface reasoning live on hardware the family owns and controls. The Anthropic-direct call in PR #3 (Counseling sub-tab MVP) is acknowledged as a Phase-0 stepping stone — the browser-side API key and direct-to-vendor pattern are MVP-only. The long-term arc is **either hybrid (Synology gateway + hosted model for the hard prompts) or fully local (Synology serves everything)**, with Darrell's decision on which long-term shape is the goal as one of the open questions below.

This is the same sovereignty thesis SKOS applies to financial data, tenant communications, and contractor relationships, applied one layer deeper: the model itself becomes part of the family-controlled stack. The work the AI does on behalf of the family stays close to the family.

Religion AND relationship. Religion-side: server-side enforcement of the system prompt, the drift tests from `_root/THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`, the banned-clinical-language audit, the four-section response posture from `_root/BEHAVIORAL-MIRROR.md`. Relationship-side: the family's prompts and the user's frustration at 11 PM on a Tuesday never leave hardware the family owns, except — and only when — Darrell has explicitly approved a hybrid call.

---

## Why This Matters

Three reasons.

**For the Counseling sub-tab specifically.** A person opens the Counseling sub-tab when they are frustrated, hurting, in a hard place. What they type into that surface is among the most personally sensitive content SKOS ever holds. Today, in PR #3, that content travels to Anthropic with a browser-side API key as a deliberate MVP-only posture. Moving that loop server-side onto the Synology — even before any local-model work begins — closes the browser-side-key risk and gives the family one trusted hop instead of two.

**For every future SKOS AI surface.** Counseling is the first AI surface; it will not be the last. Marketing pipeline (Christina's TLC, per `MARKETING-PIPELINE-NOTES.md`), discipleship study paths in Spiritual Life, scope-of-work review in Premium tier, Dev/Ops opportunity matching — each future AI surface needs the same things: a system prompt grounded in foundation docs, drift tests, a banned-language audit, a scripture-version selector. A Synology-hosted gateway centralizes those rails so each surface doesn't reimplement them.

**For the sovereignty story end-to-end.** If a family is on SKOS for financial data, tenant portals, contractor relationships, legal matters — and the AI that helps them think through those things is a black-box call to a vendor every time — the sovereignty story has a hole in it. Self-hosting the brain closes the hole. (To the degree that's possible; see the honest hardware realities below.)

---

## Hardware Reality — Honest Capabilities of the DS1621xs

The DS1621xs is a serious NAS. It is **not** a serious AI workstation. Both things are true at once, and the design has to take both seriously.

**What the DS1621xs is:**

- **CPU:** Intel Xeon D-1527 — 4 cores / 8 threads at 2.2 GHz base (turbo to 2.7 GHz). Server-grade, ECC-capable, but several generations old and CPU-only.
- **RAM:** 8 GB ECC stock; 32 GB ECC maximum (registered DIMMs). The 32 GB upgrade is the single biggest leverage move for AI workloads on this box.
- **Storage:** 6 SATA bays + dual NVMe cache slots. The NVMe cache slots can hold model weights for fast loading.
- **Network:** Dual 10 GbE. Plenty of headroom — networking is not the bottleneck.
- **GPU:** **None.** No discrete GPU, no integrated GPU on the Xeon D-1527.
- **Expansion:** One PCIe Gen3 x8 slot (currently used by the 10 GbE add-in card on some configurations — confirm Darrell's specific build). **No Thunderbolt**, so eGPU on the Synology itself is not a viable path.
- **OS:** Synology DSM (Linux underneath). Container Manager / Docker is supported and is the right surface for the AI workload.

**Realistic capabilities for AI workloads on this hardware:**

- **CPU-only inference of small-to-medium quantized models** via Ollama, llama.cpp, or vLLM (CPU mode). Models in the **≤13B-parameter range comfortably**, up to ~30B with heavy quantization (Q4_K_M or smaller) if the 32 GB RAM upgrade is in place.
- **Throughput is slow on CPU-only.** Realistic ballpark: a few tokens per second for a 7B Q4 model; under one token per second for 30B-class quantized models. **Acceptable for journal/preparation/drafting use cases** where the user is reflecting, not real-time chatting. **Not acceptable** for the user's expectation of conversational responsiveness if they expect to type a question and see a fluent paragraph appear in two seconds.
- **The 32 GB RAM upgrade + NVMe cache populated with model weights significantly help** model load time, swap pressure, and concurrent-request handling — but they do not change the fundamental tokens-per-second ceiling that comes from being CPU-only.
- **True parallel multi-model responsive inference probably requires a GPU.** The DS1621xs has no GPU and no Thunderbolt for eGPU. Options for the GPU question:
  - **Stay CPU-only and design the UX for slower turn times.** Journal-style "reflect, submit, see the response a minute later" works; real-time chat does not.
  - **PCIe-slot GPU directly into the Synology** (with caveats: airflow not designed for it; DSM does not officially support discrete GPU passthrough; community-led with no warranty story).
  - **Separate small workstation alongside the Synology** that holds the GPU (a NUC with Thunderbolt + eGPU, a Mac Mini M-series, a Linux box with a consumer GPU like a 4070 / 4080 / 4090 / 5070 / 5080 / 5090) — Synology hosts storage and orchestration; the workstation hosts inference. **This is probably the cleanest path if GPU inference becomes required.**
  - **Hybrid forever:** local for the cheap/fast/safety-classifier tasks, Anthropic for the hard prompts. Acknowledges the hardware reality without trying to fight it.

The honest read: **the DS1621xs is a good orchestrator and a serviceable host for small models that don't need to be fast.** It is not a serious inference rig for the four-section response posture being delivered in real time, unless either (a) the user expectation is reset to "slow but ours," or (b) a GPU is added somewhere in the stack.

---

## "Models in Parallel" — Interpretation Menu

Darrell's founder framing names "models in parallel" without specifying which kind. There are at least five distinct meanings, and they each imply different architectures, different costs, and different success criteria. Naming them so the actual choice can be made deliberately:

1. **Ensemble voting** — multiple models answer the same prompt; an aggregator picks the best response, or merges them, or has them vote on a single answer. *Use case:* high-stakes outputs where one model's hallucination should be caught by another. *Cost:* N× inference for N models per turn. *Open question:* what's the aggregation rule?
2. **Specialization (router-based)** — different models for different tasks. *Example for SKOS:* a small/fast model for the banned-clinical-language audit, a small model for scripture-version lookup, the main response model for the four-section Counseling reply, a separate small classifier for drift-test safety check. *Use case:* matches the actual shape of SKOS AI surfaces (each does several things, not one thing). *Cost:* lower than ensemble — only the routed model runs for each task. *This is probably the highest-leverage interpretation for SKOS specifically* — flag for serious proposal.
3. **Throughput parallelism** — multiple concurrent users hit the same model simultaneously. *Use case:* when SKOS has enough users that one user's prompt should not wait behind another's. *Cost:* requires either multiple model instances or a batched inference server (vLLM with continuous batching, etc.). *Open question:* what's the concurrency target — 1 family, 10 families, 100?
4. **A/B testing** — route a fraction of traffic to a candidate model for comparison against the incumbent. *Use case:* model upgrades, prompt-engineering iterations, evaluation work. *Cost:* infrastructure, not just inference — needs logging, eval rubrics, comparison surface.
5. **Mixture-of-experts-style routing (learned)** — a classifier model picks the right specialist model for each prompt. *Use case:* sophisticated version of specialization where the routing itself is learned rather than rule-based. *Cost:* training the router; usually overkill until the rule-based specialization has been live for a while.

**The proposed interpretation to pursue first: #2 — Specialization (router-based).** It matches the actual shape of SKOS AI surfaces (audit + scripture lookup + main response + drift test are all separate kinds of work). It uses small models for the cheap tasks (where CPU-only inference is acceptable) and reserves the hard prompt for the one model that's optimized for that. It does not require GPU on day one. It generalizes naturally to #3 (throughput) when concurrency demands it.

The others are flagged as open — pursue them only after #2 is live and a real reason emerges.

---

## In-Scope Capabilities (Initial Pass)

These are the capabilities the gateway should eventually deliver, ordered toward the phased delivery sketch below.

- **API gateway hosted on the Synology** that the PWA points at instead of calling Anthropic directly. Same call shape from the PWA's perspective (one HTTPS endpoint, one model-agnostic request body), gateway routes underneath.
- **Pluggable model backends** — Ollama for local-CPU models, the Anthropic SDK for hosted Claude, room for OpenAI / Google / xAI / Mistral / others as needed. Backend choice is a routing decision at the gateway, not a PWA concern.
- **Server-side enforcement** of:
  - **The system prompt** baked from foundation docs (`THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`, `BEHAVIORAL-MIRROR.md`, `MIND-OF-CHRIST.md`, `COUNCIL-CHAMBER.md`, the Counseling-specific extensions). The PWA never sends or holds the system prompt.
  - **The two drift tests** from the Worldview doc (the relationship-or-the-receiving test and the first-death test) — applied to every response before it returns to the PWA.
  - **The banned-clinical-language audit** — a small classifier or rule-based filter that catches "diagnose," "treatment plan," "DSM," "therapeutic intervention," etc., before the response goes back, with a fallback rewrite request to the main model.
  - **The four-section posture** — DATA → TRUTH → IDENTITY → INVITATION from `BEHAVIORAL-MIRROR.md`. Either enforced by prompt-engineering and validated by the audit, or enforced structurally by parsing the response.
  - **Scripture-version selection** — the dropdown from PR #3 (ESV / KJV / NIV / NASB / CSB / NLT) is honored at the gateway; scripture verses in the response are looked up against the correct version rather than recalled from the model's memory.
- **API-key custody on the Synology**, not in the browser. Removes the PR #3 MVP-only browser-side-key risk.
- **Request/response logging** (privacy-respecting) for evaluation, drift detection, and the eventual Phase-3 quality-bar measurement.
- **Health and capacity dashboard** — a SKOS surface (likely Dev/Ops sub-tab) showing model availability, queue depth, recent latencies, and current backend split (local vs. hosted). Operators see the system; the system does not become invisible infrastructure.

---

## Non-Goals (To Prevent Sprawl)

- **No training of custom models from scratch.** Phase N+ at earliest, and only if there is a specific capability that no available open-weights model can deliver. Training is expensive, time-consuming, and out of scope for the foreseeable future.
- **No replacing the foundation-doc-derived system prompt with model-internalized fine-tuning** in early phases. The foundation docs are the source of truth; the prompt is derived from them; the model reads the prompt. Fine-tuning a model to "know" the foundations is Phase N+ and only if there is a measured benefit — until then, fine-tuning makes the foundations harder to update.
- **No real-time voice synthesis on-device.** Speech-to-text is in-scope (Web Speech is acceptable; a server-side STT model can replace it later). Text-to-speech of the model's response is **out** for the first few phases — slower and more compute than it's worth on CPU-only hardware.
- **No autonomous action-taking by the AI.** The AI advises, drafts, surfaces — it does not commit changes to the user's data, send messages on the user's behalf, or take any action without explicit user confirmation. (Aligns with the marketing-pipeline non-goal of the same shape.)
- **No spillover into clinical territory.** The `LEGAL-PRIVACY-BOUNDARY.md` bright line holds regardless of where the model runs. Therapy Notes handles HIPAA-bound clinical work; the Synology gateway does not.
- **No cross-instance data leakage.** When other SKOS instance operators eventually run their own Synologys, no instance's prompts or responses cross into another's storage or context. Federation, if it ever happens, is opt-in and explicit.

---

## Phased Delivery Sketch

Each phase ends with a deliberate go/no-go decision. Pause is always permitted.

### Phase 0 — Current State (PWA → Anthropic Directly)

- The Counseling sub-tab in PR #3 calls Anthropic directly from the browser, with a browser-side API key.
- Acknowledged as MVP-only. Not safe at scale; not aligned with the sovereignty thesis long-term.
- **Go/no-go decision:** as soon as PR #3 is merged and Counseling has been live for any reasonable usage period, begin Phase 1.

### Phase 1 — Synology Gateway, Anthropic Backend

- A Node.js (or equivalent) API gateway runs on the Synology under Docker / DSM Container Manager.
- The PWA points at the gateway instead of Anthropic. Same call shape from the PWA's side.
- The gateway proxies to Anthropic. The API key lives on the Synology, not in the browser.
- Server-side enforcement begins here: system prompt, drift tests, banned-clinical-language audit, scripture-version lookup, four-section posture. All applied to every request before the response returns to the PWA.
- **Go/no-go decision:** has the gateway been stable for 30 days? Have the drift tests caught at least one bad response that would have shipped without them? If yes, Phase 2.

### Phase 2 — Hybrid Routing (Local for Cheap Tasks, Anthropic for Main Response)

- Ollama runs on the Synology with one or two small models (candidates: a small audit/classifier model, a small scripture-lookup helper).
- The gateway routes the **banned-clinical-language audit** and the **drift-test safety check** to the local small model. Cheap, fast, never leaves the family hardware.
- The **main four-section response** still routes to Anthropic. The hard prompt still goes to the model best equipped to handle it.
- This is **Specialization interpretation #2** from the menu above, in its first concrete form.
- **Go/no-go decision:** is the local audit catching the same drift cases the hosted model would? Is latency acceptable? If yes, Phase 3.

### Phase 3 — Local Model Serves the Primary Response; Anthropic Optional Fallback

- A local model (candidates: Llama-3.1-8B-Instruct quantized, Mistral-Small-3, Qwen2.5-7B-Instruct, etc.) serves the four-section response as the default.
- Anthropic remains available as an explicit fallback or as a "ask the better model" surface for prompts the local model can't handle.
- Quality bar: **no regression on the drift tests and the banned-language audit, no regression on Christina's clinical-sanity-check rubric.** If the local model fails the quality bar, this phase pauses and the rubric is reapplied.
- **Go/no-go decision:** is the quality bar met? Is the user expectation of latency aligned with reality? If yes, Phase 4.

### Phase 4 — Parallel Models per Chosen Interpretation

- Whichever interpretation Darrell selects from §"Models in Parallel" gets implemented here. Recommendation: full **router-based specialization** (#2), with **A/B testing infrastructure** (#4) layered on so model swaps can be evaluated empirically.
- Measurable improvement on a defined metric is the gate — not novelty.
- **Go/no-go decision:** if Phase-4 work does not measurably improve a real metric, it does not ship. SKOS is not a research lab; it is a family OS.

---

## Open Questions for Darrell

Answer these before any of the phases above gets serious build work.

1. **Which interpretation of "in parallel" is the actual goal?** See the §"Models in Parallel" menu — ensemble, specialization, throughput, A/B, mixture-of-experts. Recommendation is specialization first; confirm or redirect.
2. **Network exposure plan for the Synology.** Tailscale + DDNS (private mesh, no public port)? Cloudflare Tunnel (no inbound ports, public web fronted by Cloudflare)? VPN-only (family-only access; no remote use)? Other?
3. **GPU plan.** Stay CPU-only and design the UX for slower turn times; add a PCIe-slot GPU directly into the Synology (with the airflow / official-support caveats); or run a separate small workstation alongside the Synology that holds the GPU?
4. **Migration vs. coexistence with hosted Anthropic.** Is the long-term goal **fully local** (Phase 3 endpoint), or **hybrid forever** (specialization + Anthropic for the hard prompts indefinitely)? Either is defensible; the architecture is meaningfully different.
5. **Counseling-sub-tab PIN-encryption boundary with a Synology-hosted backend.** Today the journal is encrypted at rest in the browser via PIN + AES-GCM (PBKDF2 150k, 15-min idle re-lock). When the gateway runs on the Synology, is the Synology trusted as part of the encryption boundary (decrypted in transit to the gateway), or does encryption-at-rest extend through the API call (gateway never sees plaintext journal content, only the user's typed prompt for that turn)? The second is harder and more sovereign-honest; the first is easier.
6. **Multi-tenant federation story.** If other SKOS instance operators eventually run their own Synologys, what's the federation / discovery / cross-instance story? Default-no (every Synology is an island) is the safe answer; federation is opt-in and explicit if/when it ever happens.
7. **32 GB RAM upgrade — already done, or part of this initiative?** Single biggest hardware leverage point for the AI workload. Confirm current state and whether the upgrade is in scope of this initiative or already in place.

---

## Connection to Existing Foundations

| This Document | Connects To |
|---|---|
| The living spine that holds the active workstream entry for this initiative | `../../PROJECT-FRAMEWORK.md` |
| The sibling future / unratified initiative doc | `MARKETING-PIPELINE-NOTES.md` |
| The intellectual spine that grounds the system prompt | `../_root/THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` |
| The four-section response posture enforced at the gateway | `../_root/BEHAVIORAL-MIRROR.md` |
| The mental-stewardship Test applied at the audit step | `../_root/MIND-OF-CHRIST.md` |
| The surface that is the first AI workload this gateway serves | `../_root/COUNCIL-CHAMBER.md` |
| The bright line that holds regardless of where the model runs | `../_root/LEGAL-PRIVACY-BOUNDARY.md` |
| The local-first sovereignty thesis this initiative deepens | `../_root/IN-PLACE-FIRST.md` |
| The scripture-version dropdown honored by the gateway | `../_root/SCRIPTURE-REFERENCE-STANDARD.md` |
| The quality bar applied to every response before it returns | `../_root/EXCELLENCE-STANDARD.md` |
| The meta-frame everything serves | `../_root/THE-WAY.md` |
| The Counseling card — the first AI surface that would migrate to this gateway | `../../01-architecture/task-cards/2026-05-22-counseling-subtab-inside-church.md` |

---

## Sequencing — When To Revisit

This document should NOT be acted on now. Pursuing self-hosted AI infrastructure while PR #3 (the Counseling sub-tab MVP) is still awaiting click-through, and while MVP-1 is still landing, would violate the diligent-not-hasty principle.

**Suggested revisit triggers:**

1. PR #3 is merged and the Counseling sub-tab has been live for at least 30 days.
2. MVP-1 (Sovereign Family Financial OS) has shipped and has stable users.
3. Darrell has answered the open questions above (especially #1, #3, and #4 — interpretation, GPU plan, migration vs. coexistence).
4. There is bandwidth to support a Phase-1 gateway build — design time on the gateway, infra time on the Synology Docker setup, evaluation time on the drift-test rubric.

Until then: **this vision is parked here, safe, and waiting.** Nothing is lost. Everything is captured.

---

## Religion AND Relationship in This Initiative

**Religion-side:** Server-side enforcement of the system prompt, the drift tests, the banned-clinical-language audit, the four-section response posture. The foundation docs are the source of truth and the gateway honors them mechanically — religion as backbone. Phased delivery with go/no-go gates. The Test (Philippians 4:8) applied to every response that returns to the PWA: is it TRUE, HONORABLE, JUST, PURE, LOVELY, COMMENDABLE, EXCELLENT, PRAISEWORTHY before it goes back?

**Relationship-side:** The family's prompts stay close to the family. The Counseling user at 11 PM on a Tuesday is met by a system whose brain lives on hardware their family owns. The cost of that — slower tokens-per-second on CPU-only, hardware upgrade decisions, network-exposure decisions — is the cost of sovereignty taken seriously, and the trade is named honestly.

Both.

---

*See also:* `MARKETING-PIPELINE-NOTES.md` (sibling future doc — owner-operator marketing automation), `../../PROJECT-FRAMEWORK.md` (the living spine — read first), `../_root/THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` (the worldview the system prompt is derived from), `../_root/COUNCIL-CHAMBER.md` (the first AI surface this gateway serves), `../_root/IN-PLACE-FIRST.md` (the sovereignty thesis deepened).

**This document is UNRATIFIED and FUTURE. Do not act on it without deliberate evaluation at the revisit triggers above.**
