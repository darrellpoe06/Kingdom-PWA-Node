# Decision Brief — The Sovereign AI Stack: One Consolidated Direction

**Date:** 2026-06-24
**Author:** Claude (advisory), at Darrell's direction
**Status:** DECISION-READY. Synthesis of eight in-flight evals/builds landed today and over the prior two weeks. Cites verified numbers (vendor-reported figures labeled as such; Model Lab establishes ground truth per DR-0076).
**Format:** Darrell's — OPPORTUNITIES → CONSTRAINTS → HOW (and should) we make it happen → WHY this is the BEST path.
**Framing (binding):** STRATEGIC DEVELOPMENT, *always building on current situations.* Anchored on the live system as it is today — main `9e73782` (on `8debc77`'s Scripture library + today's merged work), the running Supabase realtime, the shipped content/lessons/voice/lead-handling, the 2× RTX 4070 on hand, the modular work already started. Default = extend what exists; start over only where a clean slate gives a better forward position toward the vision. Decision lens + generative-programming build method below.
**Ledger:** Recommended for ratification as a Tier-C operating-direction decision record (consolidates DR-0078, DR-0079-pending, DR-0073, DR-0076 and the procurement DRs into one through-line).

---

## Headline Recommendation

**Extend the system we already have — the live app on main, the running Supabase realtime, the shipped content/lessons/voice/lead-handling, the 2× RTX 4070 on hand — into the sovereign AI substrate, in a strict dependency order where each phase builds on the prior phase and on the real current state.** This is strategic *development*, not a greenfield rebuild: the stack is not a product to buy or a blank slate to start from, it is a substrate we *assemble on top of what is already running and proven.* We do the cheap, reversible moves first (off-Vercel, modular seam, voice/realtime pilots on the 4070s — each a small extension of something already live), harden the reusable engines, and only then arm the conductor and buy the GPU box that unlocks heavy autonomy.

**The one-line version:** *Build on current reality; start over only where a clean slate gives a better forward position toward the vision. Sovereign + cost-sustainable + mission-aligned is the only sequence that delivers all three at once — and every phase stands on the one before it.*

---

## Framing — Strategic Development, Built on the Current Situation

This is **strategic development**, and the standing posture is **always building on current situations.** The default is to *extend what already exists and works*, never to restart for its own sake. The substrate is assembled by leveraging real, present assets — not imagined ones:

- **The live app** — main at `9e73782` (building on `8debc77`'s merged Scripture library and the rest of today's shipped work). ~80% already modularized: 69 components, 67 lib modules, 90 tests.
- **The running Supabase realtime** — `table-sync.js`'s change-ping → scoped-refetch is in production today; the self-host container already sits in the repo (`infra/supabase/docker-compose.yml:104-127`).
- **The shipped content, lessons, voices, and lead-handling** — the lesson-flow arc, Scripture library, choir song/rendition model, the read-aloud `tts.js` seam, and the TLC client-acquisition lead pipeline are all live and feeding this substrate already.
- **The 2× RTX 4070 on hand now** — owned hardware, mesh-reachable, available to pilot the local intelligence layer *this week* without buying anything.
- **The modular work already started** — DR-0078 ratified; the `surfaces.js` seam extends the modularization that's already 80% done.

Each recommendation below is framed as the **next increment on top of these** — extend, don't replace — *unless* the decision lens below says a fresh start wins.

---

## The Decision Lens — Build-On vs Start-Over, Reasoned Forward

The framing is **not dogmatically incremental.** For every major choice the question is: **does extending what exists, or starting fresh, give the BEST FORWARD POSITION toward where we want to go?** The criterion is the *destination*, never sunk cost or attachment to existing code.

- **DEFAULT: extend what exists** — no rebuild for its own sake, no waste, leverage what's proven.
- **BUT: start fresh** when a clean slate genuinely yields a better forward position toward the vision and the desires. (The modular rebuild itself is exactly this — a *chosen partial start-over* of the mount layer, because it serves the destination better than patching the monolith forever.)
- **The judgment is made FORWARD** — an informed projection, not guesswork — grounded in two things:
  1. **A comprehensive understanding of the VISION** — the *full* PoeTech picture, not a fragment: sovereign, enterprise-grade capability at family/church scale, Father's-Business / serve-not-extract, the cognitive-sovereignty moat, the whole arc through to a community-owned economic powerhouse.
  2. **Realistic EXPECTATIONS** — what is genuinely attainable, grounded in three evidence bases:
     - **What we CAN do** — proven/demonstrated capability + the hardware and tools actually on hand.
     - **What we HAVE done** — our own track record: what's already shipped and worked in this repo.
     - **What HAS BEEN DONE anywhere** — external proven precedent in the field/industry/research. If someone, somewhere has shipped it, it is realistically attainable for us — that widens the evidence beyond our own history.

So each recommendation is reasoned forward against the comprehensive vision and realistic expectations, citing *both* our demonstrated work *and* external precedent — and the build-on-vs-start-over verdict is chosen by best-forward-position, with rationale. The per-phase verdicts appear under the sequencing table.

---

## The Build Method — Generative Programming as Primary, Held in Balance

**Generative programming is the LLM's superpower, and it is our primary build method.** LLMs generate and *re*generate code fast — and that single fact is *why* the build-on-vs-start-over choice is cheap and why a rebuild is not scary. When regeneration is fast, sunk cost shrinks toward zero: the decision tilts cleanly toward *whatever gives the best forward position*, without fear of "throwing away work," because reproducing or replacing that work is itself fast.

The posture is **balanced — committed but not rigid, open but not thrashing:**

- **Commit** to the best, most-effective way to build *right now* — lean into generative programming as the engine.
- **Stay flexible** — we may discover new or better ways to do anything (better methods, models, tools), and the approach must stay open to adopting them. This is *why* the architecture itself is built to swap: the modular `surfaces.js` seam (mount-as-data), the `tts.js` provider seam, the realtime change-ping seam, and the Model Lab head-to-head all exist so a better engine/model/tool drops in behind a stable boundary without a rewrite.
- **Avoid both failure modes** — no dogma (don't lock rigid to today's choice), and no thrash (don't chase every shiny new thing). Balanced between commitment and openness.

**Implication for this brief:** because generative programming makes regeneration cheap, every build-on-vs-start-over verdict below is made *without sunk-cost fear* — purely on forward position. And every engine is specified behind a flexible seam so the open-model evals (which model), the Model Lab (which wins on real tasks), and future tools can be adopted as they prove out. The substrate is designed to *keep getting better* (DR-0075) by construction, not by rewrite.

---

## The Sequencing (the spine of the whole brief)

| # | Phase | What lands | Hardware | Gate to start | Who |
|---|---|---|---|---|---|
| **1** | **Foundation** | Off-Vercel cutover (Cloudflare Pages → kills the 100/day cap) + modular `surfaces.js` registry seam (kills the monolith collision) | none (cloud + existing repo) | now (off-Vercel: Darrell's DNS flip; registry: post-conference) | Darrell flips DNS; executor ships registry |
| **2** | **Substrate on the 4070s** | Pilot the local intelligence layer on hardware we already have: voice (Voicebox/Kokoro), sovereign realtime (self-host Supabase Realtime), Model Lab head-to-head of the box-fit coders | church 2× RTX 4070 (~24 GB combined) | Phase 1 foundation in place | executor stands up pilots; Darrell reviews quality |
| **3** | **Reusable engines** | Harden the proven pilots into build-once engines behind stable seams: `tts.js` voice provider, realtime broker, shared CRM tenancy/capability layer, the auto-optimize loop (inert) | 4070s + NAS | Phase 2 pilots verified on real devices (DR-0076) | executor; Darrell ratifies CRM model |
| **4** | **Arm the conductor** | Flip the orchestrator + auto-optimize from inert to armed, **on Darrell's explicit go**, behind the three brakes, one target at a time | 4070s + NAS | Phases 1–3 proven; Darrell arms per-target | **Darrell arms; never self-activates** |
| **5** | **GPU box → heavy/autonomy** | Buy the RTX PRO 6000 box(es); unlock 70B+ reasoning, heavy auto-optimize iteration, voice cloning, 24/7 autonomous local work | HOME 1× 96 GB; CHURCH 2× = 192 GB | workload data proves the VRAM gap binds (DR-0053) | **Darrell's purchase, by his hand only** |
| **6** | **GTM / scale** | Sell/serve on the proven base — per-industry sovereign teams, the workflow-module library, multi-tenant product | proven substrate | Phases 1–5 stable | Darrell governs; Foundation executes |

**Read the table top-to-bottom as a dependency chain, not a wish list.** Each phase **builds on the prior phase and on the current real state** — there is no step that starts from nothing. Phase 1 extends the live app and the merged off-Vercel work; Phase 2 pilots on the 4070s we already own using the seams Phase 1 hardened; Phase 3 hardens what Phase 2 proved; Phase 4 arms engines that already exist inert; Phase 5 buys hardware only once Phases 2–4 measured the need; Phase 6 sells the substrate Phases 1–5 proved. Phases 1–2 cost almost nothing and are reversible. The first real money (GPU box) and the first real autonomy (armed conductor) come *after* the cheap moves built on current assets have proven the ground is solid.

### Build-on vs Start-over verdict, per recommendation

Each major choice evaluated **both ways** and picked by best-forward-position toward the vision — citing our own track record *and* external proven precedent. Verdicts are made without sunk-cost fear (generative programming makes regeneration cheap).

| Recommendation | Build-on path | Start-over path | **Verdict + rationale (forward position)** | Precedent (ours / field) |
|---|---|---|---|---|
| **Off-Vercel hosting** | Stay on Vercel, work around the 100/day cap | Cut to Cloudflare Pages (built, #210); later NAS+Caddy | **START-OVER (host) — already chosen.** Vercel's cap structurally blocks conference-scale throughput; a clean host removes the ceiling and is the on-ramp to sovereign NAS hosting. Reversible (Vercel stays warm). | Ours: PWA already live on NAS via Caddy+Funnel. Field: Cloudflare Pages + Workers is a mature, mass-deployed static+function host — proven at far larger scale than ours. |
| **Modular seam** | Keep patching the monolith | `surfaces.js` registry; mount-as-data | **PARTIAL START-OVER — chosen (DR-0078).** Every recorded collision was mount-wiring; a registry seam ends the choke-point and unblocks parallel module teams. Surfaces themselves are *kept* (80% already modular) — only the mount layer restarts. | Ours: 69 components already isolated; boot-standalone by URL param works today. Field: micro-frontends / module-federation / plugin registries are an industry-standard proven pattern. |
| **Voice layer** | Keep browser Web Speech behind `tts.js` | Add Voicebox/Kokoro local engine behind the *same* seam | **BUILD-ON.** The `tts.js` seam already exists and ships; we extend it with a sovereign engine, keeping browser fallback. No rewrite — an upgrade provider behind a stable boundary. | Ours: `tts.js` read-aloud live. Field: ElevenLabs proves production voice cloning is attainable; Kokoro/Piper are proven offline TTS in wide use. |
| **Sovereign realtime** | Keep Supabase Realtime (cloud) for durable state | Self-host the realtime container; raw WS only for the firehose | **BUILD-ON (mostly).** Keep the proven cloud path for durable RLS-gated rows; *extend* to sovereign only where it serves badly (ephemeral firehose). Config-only move (point URL at NAS). Raw WS is a new node built *only* when a second is forced. | Ours: `table-sync.js` change-ping in production; self-host container already in repo. Field: Supabase is open-source and self-hostable by design; high-concurrency WS fanout is proven (Phoenix Channels / Erlang-class servers handle millions of sockets). |
| **Open-model layer** | — | Pick box-fit models; Model Lab head-to-head | **BUILD-ON the seam, evaluate the model.** No lock-in: the Model Lab swaps models behind the orchestrator seam; today's pick (Qwen3.6-27B / GLM-4.7-Flash) is provisional until real-task results decide. Flexibility is the design. | Ours: Ollama live on NAS with models pulled. Field: open-weight 27–30B coders running locally via Ollama/vLLM is a mass-proven practice (r/LocalLLaMA, the GLM/Qwen coding ecosystems). |
| **Auto-optimize loop** | — | Build the locked-scorer engine, ship inert | **NEW capability, built on proven pattern.** No existing thing to extend; built fresh — but on an externally-proven design, and shipped inert behind three brakes. | Ours: local Ollama + the three-brakes discipline already in force. Field: locked-evaluator optimization is field-proven — DeepMind's AlphaEvolve (evolutionary code search against a fixed scorer) and DSPy (programmatic prompt optimization against a metric) are shipped precedents for the exact pattern. |
| **Shared CRM backbone** | Per-module lead/contact handling (TLC pipeline live) | One generalized tenancy + capability + `shares` layer | **PARTIAL START-OVER — proposed (DR-0079).** Three needs (family consent, TLC LMS roles, multi-tenant product) are better served by *one* generalized primitive than three drifting silos; the forward position (the multi-tenant product) demands it. Existing `instances`/RLS is *kept and extended*, not discarded. | Ours: `instances` + `user_in_instance()` RLS already the outer wall; TLC lead pipeline shipped. Field: row-level multi-tenancy with capability/ACL layers is standard, proven SaaS architecture. |
| **GPU box** | Run on the 4070s + NAS CPU | Buy RTX PRO 6000 (HOME 96 GB / CHURCH 192 GB) | **BUILD-ON now, buy LATER on measured need (DR-0053).** Extend on owned hardware until workload data proves the VRAM gap binds; the purchase is deferred, not assumed. Best forward position = don't buy ahead of evidence. | Ours: mesh + Ollama healthy; CPU ceiling measured (~1–3 tok/s at 14B). Field: 70B-class local inference on RTX PRO 6000 / dual-3090 is demonstrated and documented — the capability is attainable, the question is only *when it's justified*. |

---

## OPPORTUNITIES

**1. The sovereign substrate — own the whole stack.** Local model weights are inert files with no telemetry (verified: Ollama/vLLM/llama.cpp emit nothing). Self-hosted Supabase Realtime already exists in the repo (`infra/supabase/docker-compose.yml:104-127`). The PWA already runs on the NAS via Caddy + Tailscale Funnel. The network mesh is proven healthy (4 peers live on the tailnet, probed 2026-06-10). **We are not starting from zero — we are connecting parts we already own into one substrate where no private datum ever leaves the family's hardware.** This is the structural difference from extractive mainstream tech, and per DATA-AS-EMPOWERMENT-NOT-EXTRACTION it *is* the competitive moat, not a feature of it.

**2. 24/7 local work at $0/token.** The auto-optimize loop (Karpathy locked-scorer pattern) and the tiered orchestrator both run on local Ollama. Once the GPU box is up, the system can iterate thousands of times overnight against deterministic scorers — app-perf tuning, prompt optimization against labeled sets — with zero per-token cost. Vendor cloud makes "thousands of cheap iterations" cost-prohibitive; local makes it free.

**3. Build-once reusable engines.** The pattern proven across every lane is *one stable seam, many surfaces behind it*: `tts.js` provider seam (any TTS engine), the realtime change-ping seam (`table-sync.js`), the `surfaces.js` registry (any module mounts as data, not code), the shared tenancy/capability layer (family + TLC LMS + multi-tenant product as **one** primitive, not three). Each engine is built once and inherited everywhere.

**4. Cost — roughly 99% under enterprise.** Software is MIT/Apache (Voicebox, Kokoro, Qwen, GLM, gpt-oss — all $0). Hosting moves off the Vercel cap to Cloudflare Pages (free at our volume) and ultimately to owned NAS hardware. The only real spend is electricity (~$25–50/mo under partial 24/7 duty) and the one-time GPU box. Against an enterprise SaaS stack (per-seat LLM, per-character TTS, per-message realtime, managed hosting), the recurring bill approaches zero.

**5. The cognitive-sovereignty moat.** This is the deepest opportunity and the hardest for a competitor to copy: a platform where the intelligence, the data, the voice, and the infrastructure all belong to the family and the community using it — verifiably, exportably, un-extractably. For the named first community (the Church of the Living God, per COMMUNITY-FIRST-MISSION), this is the foundation of a Black-Church economic powerhouse: technology that builds kings, not slaves; that serves the Father's Business rather than extracting from the Body.

---

## CONSTRAINTS (honest, real — not arbitrary)

**1. Hardware ceiling: 2× RTX 4070 (~24 GB combined) is a real, named limit.** It fits the box-fit coders well — Qwen3.6-27B (16–18 GB Q4) or GLM-4.7-Flash (30B/3.6B MoE, ~18 GB Q4), plus gpt-oss-20b (13–16 GB) as the always-warm router. But the 2×4070 tier has **no great heavy-reasoning option** — the best it holds is a 30B-class MoE. Flagships (GLM-5.2 at 744B, Qwen3-Coder-480B) are server-class and do not fit. Heavy reasoning either escalates to vendor (DR-0073) or waits for the GPU box. **And:** the church 4070s may not be free for LLM at all — they are earmarked for live-mix AI / transcription once Presenter retires ProPresenter. Confirm allocation before counting on them.

**2. Ops weight of self-hosting is real.** Every sovereign surface we stand up is a surface we operate. Self-hosted Supabase Realtime, a raw WS gateway, a headless TTS microservice, the orchestrator — each needs health checks, restart-on-boot, auth, monitoring (PERPETUAL-PIPELINE-HEALTH's thirteen rules). The cutover plan keeps Vercel warm as a parachute precisely because the sovereign path carries more ops surface. This is a cost paid in attention, and it is why we pilot before we rely.

**3. Tool maturity: pilot before you rely.** Voicebox is pre-1.0 (v0.5.0, 2026-04-25), 33.9k stars but "fast-moving, occasionally disruptive." The open models' headline benchmarks are **vendor-reported** (Qwen3.6-27B's SWE-bench 77.2; GLM-4.6's CC-Bench 48.6% vs Sonnet 4; LiveCodeBench 82.8%) — credible reputation in the open-weight community, but "beats GPT/Gemini" is unverified. **Model Lab (DR-0076) establishes ground truth on real PoeTech tasks before any model earns a production slot.** The seam stays; the tool behind it is an upgrade provider that must prove itself, never a single point of failure.

**4. Throughput throttles are live today.** The Vercel 100/day build cap is a current blocker (the off-Vercel cutover exists to kill it). The vendor LLM cap binds until the conductor is armed and a prepaid pool is set. CPU-only inference on the NAS tops out at ~1–3 tok/s for 14B and <1 tok/s for 30B+ — **not conversational; batch-only** until the GPU box lands. The gap is VRAM, not networking — the mesh and storage are already healthy.

---

## HOW — and how we *should* — make it happen

The sequencing table above is the HOW. Expanded, with the verified design decisions behind each phase:

**Phase 1 — Foundation (now; cheap, reversible).**
- *Off-Vercel:* The Cloudflare Pages path is built, tested, and merged (#210), gated off by `CF_PAGES_ENABLED`. The n8n same-origin proxy (`/n8n/healthz` → 200), base-path serving, cache headers, and SW are all verified live on `poetech-app.pages.dev`. **Only Darrell's DNS flip remains** — steps 1–5 are credential/verification actions that cannot break anything; step 6 (DNS) is the one irreversible step, gated on pre-DNS green, with Vercel warm as instant rollback.
- *Modular seam:* DR-0078 (ratified 2026-06-17) — introduce `surfaces.js` registry. The monolith is already ~80% modularized (69 components, 67 lib modules); every recorded collision was *mount-wiring*, not the surfaces themselves. One final ~½-day serialized edit freezes the import block + render switch forever; thereafter a new surface = one appended registry entry. **Post-conference** (conference surfaces are already isolated, unaffected).

**Phase 2 — Substrate on the 4070s (pilot on hardware we own).**
- *Voice:* Stand up Voicebox (or headless Kokoro/Piper) on a church 4070, HumeAI cloud engine **disabled**. Wire read-aloud behind the existing `tts.js` seam with a synthetic preset voice (Kokoro 82M / LuxTTS 100M fit a 12 GB 4070 comfortably). Evaluate dictation against browser Web Speech. Low-stakes, no consent surface needed (synthetic voice, user's own words).
- *Realtime:* Keep Supabase Realtime as default for durable RLS-gated low-frequency state. Pilot the sovereign path **only** where data is ephemeral + high-frequency + full-duplex (reactions firehose first). Move A is config-only — point `VITE_SUPABASE_URL` at the NAS container, no app code change. Raw WS gateway is built **only** when a second WS node is genuinely needed (the 1000-signup capacity goal forces it).
- *Model Lab:* Run the box-fit coders head-to-head — GLM-4.7-Flash vs qwen3:30b-a3b vs qwen2.5-coder on real fix-class + agentic tasks (DR-0063). Winner earns the code-driver slot. gpt-oss-20b as always-warm router.

**Phase 3 — Reusable engines (harden what proved out).**
- Productionize voice against a headless Kokoro/Piper TTS microservice on the NAS/GPU box behind the same `tts.js` seam.
- Ratify and build the shared CRM tenancy + capability layer (ROLES-MEMBERSHIP-MULTITENANCY-ADR, DR-0079-pending): instance-scoped, role-aware, owner/visibility columns + `shares` ACL + `member_has_capability()` — **one** generalized primitive serving family consent, TLC LMS roles, and the multi-tenant product. Phase 0 (a live no-leak probe with a second test account) needs no code and can start now.
- The auto-optimize engine ships **inert**: locked instruction (human writes) / mutable asset scratch-copy / hash-pinned locked scorer (optimizer runs, never edits). Eligible targets in order: app-perf (all three gates), prompt-vs-labeled-set, outreach-draft proxy. **Lessons are excluded** (slow loop, teaching-to-test Goodhart risk, doctrinal proximity).

**Phase 4 — Arm the conductor (Darrell's explicit go, behind brakes).**
Both the orchestrator and the auto-optimize loop carry the mandatory three brakes (per `feedback_autonomous_automation_three_brakes`, post-2026-06-06-runaway): **(1) budget** — iteration + wall-clock + $ ceiling, run self-terminates on hit; **(2) single-flight lock** — second fire skips, never stacks; **(3) kill-switch** — engaged by default, any guard trip pauses, never auto-continues. Hard sovereignty gate: PHI/TLC/family-private tasks are `local-only`, no escalation ever, egress-guard enforced. Staged v0 (advisory, no autonomous spend) → v0.5 (bounded, one task type, tiny budget) → v1 (Tier C, never self-activates unattended, off while Darrell travels). **Armed one target at a time, on Darrell's word.**

**Phase 5 — GPU box → heavy/autonomy (trigger on proven need).**
HOME: 1× RTX PRO 6000 Blackwell 96 GB (~$8.5–9.2K via authorized partner, ~$11.8K Newegg-direct — verify at checkout, prices move weekly; ~$12–14K prebuilt BIZON). Fits 70B-class Q4 + big context + a concurrent 14B coder. CHURCH: 2× = 192 GB (~$24–28K prebuilt) for concurrent detection + VLM + LLM + broadcast media. Per DR-0053, the purchase is **decoupled and deferred until workload data proves the VRAM gap binds** — the Cage stands up now on the owned 4070; the box is bought when latency demand is measured, not assumed. **Confirm before ordering:** church NAS (`tlcrackstation`) specs (firewalled, unconfirmed), the Funnel tag, and whether the creative 4070 box joins the mesh.

**Phase 6 — GTM / scale on the proven base.**
Per-industry sovereign teams own a module set end-to-end; the workflow-module library ships each as a registry entry with a `requires.tier` gate; multi-business CRM rides the instance-scoped tenancy boundary. None of this is built on speculation — it is built on a substrate that Phases 1–5 have already proven in the family's and the church's own hands.

---

## WHY this is the BEST path

**Because it is the only sequence that is sovereign AND cost-sustainable AND mission-aligned at the same time.** Each rejected alternative drops at least one of the three:

| Rejected path | What it costs us |
|---|---|
| **Cloud-SaaS everything** (per-seat LLM, ElevenLabs per-character TTS, managed realtime, Vercel-tier hosting) | **Fails sovereignty + cost + mission.** Private/clinical/family data leaves the box (DATA-AS-EMPOWERMENT violation); recurring per-unit bills scale against us; the extraction model is the exact thing the mission exists to refuse. ElevenLabs wins raw voice quality — stated honestly — but ships congregation voices off-box; we choose local *because of sovereignty*, not a parity claim. |
| **All-at-once** (build the whole stack in parallel, buy the GPU box up front, arm autonomy early) | **Fragile.** The 2026-06-17 collision pileup serialized three lanes; the 2026-06-06 runaway required a manual shutdown. Big-bang integration discovers contract mismatches late and expensively. Spending GPU money before workload data proves the VRAM gap binds (DR-0053) is buying ahead of evidence. The phased order *is* the de-risking. |
| **Vendor-only** (lean on Claude/Gemini for everything, skip local) | **Cap-bound + not sovereign.** The vendor cap throttles throughput; per-token cost kills the thousands-of-cheap-iterations engine; private work cannot legally/ethically transit a third party. Vendor stays in the stack as the *escalation tier* for heavy reasoning the 4070s can't hold (DR-0073) — a tool behind a sovereignty gate, never the foundation. |

**Why this is realistically attainable, not aspiration (forward expectations).** Every phase projects forward from proven ground, ours *and* the field's: we have already shipped a modular-ish app, a live realtime sync, a `tts.js` voice seam, a Scripture/lessons content engine, and a TLC lead pipeline (what we *have done*); we have the 4070s, the NAS, the mesh, and Ollama running now (what we *can do*); and every component has an external shipped precedent — Cloudflare Pages at scale, self-hostable Supabase, Phoenix/Erlang-class WebSocket fanout, local 27–30B coders via Ollama/vLLM, AlphaEvolve/DSPy locked-evaluator optimization, ElevenLabs-grade voice cloning, 70B local inference on RTX PRO 6000 (what *has been done* anywhere). None of this rests on an unproven leap; it is informed projection from full-vision + demonstrated capability + precedent.

**The tie to the enterprise-stack vision and the Black-Church economic powerhouse:** an enterprise assembles exactly this stack — identity/tenancy, a model layer, a voice layer, a realtime layer, an optimization loop, an orchestrator — and pays millions for it, with its data held by vendors. We assemble the same capability on owned hardware with open weights, and the data stays home. That inversion is the whole thesis: the same enterprise-grade substrate, but **owned by the community it serves**, turning a 44,000-sqft church and a family of businesses into infrastructure that builds wealth where mainstream tech has only extracted it. This is the Father's Business expressed in architecture (Phil 2:4; Luke 2:49) — systems that make the person more able to follow The Way, not more able to be mined.

---

## Standard Screens

**Sovereign-mesh tier.** PASS. Every production-bound component runs on owned hardware (NAS, 4070s, planned GPU box) reachable over the Tailscale/LAN mesh. Cloud (Cloudflare Pages, vendor LLM) is the reversible MVP-pragmatic on-ramp and the gated escalation tier — never the home of private data. Sovereignty of *location* does not bound blast radius; the governance layer (brakes, egress gate, locked scorer) does.

**Cost-efficiency.** PASS. ~99% under an equivalent enterprise SaaS stack: MIT/Apache software ($0), free-tier hosting, ~$25–50/mo electricity, one-time GPU capex deferred until evidence justifies it. The expensive moves come last and only on proven need.

**Father's Business.** PASS. The whole direction serves the Body and the family rather than extracting from them (DATA-AS-EMPOWERMENT, COMMUNITY-FIRST, NO-ADVERTISING). Voice cloning, autonomy, and any real-person representation are consent-gated and labeled; lessons/doctrinal material are excluded from the optimization loop. Builds kings, not slaves.

**MVP-pragmatism.** PASS. Phase 1 ships the cheap reversible wins this week (off-Vercel DNS flip; registry seam post-conference). Pilots run on hardware already owned. Nothing irreversible or expensive happens before the reversible cheap thing has proven the ground. Vercel stays warm; the `tts.js`/realtime seams keep browser fallbacks; the GPU box waits for workload data.

---

## What Darrell decides vs what executes

| Darrell decides (governs) | Executes (Foundation/runner) |
|---|---|
| The DNS flip (the one irreversible off-Vercel step) | Cloudflare Pages deploy pipeline, n8n proxy, verification |
| Ratify the shared-CRM model + default posture (private vs shared-by-default) + minor-data shape | Tenancy/capability layer, `shares` ACL, RLS policies, no-leak probe |
| Whether/when the church 4070s are free for LLM vs reserved for live-mix | Voice + realtime + Model Lab pilots on whatever hardware is allocated |
| **Arming** each autonomous target (orchestrator, auto-optimize) — one at a time, explicit go | The inert engines, brakes, scorer hash-pinning, reel logging, Governor-tab display |
| The GPU box purchase(s) — by his hand only — and the greenlight trigger | BOM verification, mesh/spec confirmation, build/prebuilt config |
| Per-target budgets; final approval of any winner before merge/promotion/send | Local Ollama iteration, constraint evaluation, evidence emission |

---

## Dependencies (what blocks what)

- **Phase 2 voice + realtime pilots** depend on **church 4070 allocation** being confirmed (vs ProPresenter-retirement live-mix reservation).
- **Phase 3 CRM engine** depends on **Darrell ratifying the tenancy model** (DR-0079-pending) — Phase 0 no-leak probe can start now without it.
- **Phase 4 armed conductor** depends on **Phases 1–3 proven** + **Darrell's per-target arm** + the three brakes verified inert-first.
- **Phase 5 GPU box** depends on **workload data proving the VRAM gap binds** (DR-0053) + **church NAS/Funnel/mesh confirmation** + **Darrell's purchase**.
- **Phase 6 GTM** depends on **Phases 1–5 stable** on the family's and church's own usage.
- Cross-cutting: **off-Vercel cutover (Phase 1)** unblocks conference-scale throughput; the **modular seam (Phase 1)** unblocks parallel module teams (Phase 6) without collisions.

---

## Architecture Reference — The Four-Layer Sovereign LLM System

Per Darrell's direction, the sovereign-LLM architecture is framed against the standard four-layer LLM-system model (the lens "LLMs: The Essential Guide," Level Up Coding, describes — model serving / data + retrieval / orchestration + guardrails / observability + deployment). This is the reference skeleton every phase above hangs on; mapping our real components to it shows what exists vs what's a gap:

| Layer | What the framework calls for | Our component (build-on) | Status today |
|---|---|---|---|
| **1. Model serving** | A served model behind an API — local or vendor | Ollama on the NAS (`qwen2.5`, live in `class-tutor.js`); future GPU endpoint for 27–30B coders + voice | **CPU-served LIVE; GPU endpoint = the unlock** |
| **2. Data + retrieval (RAG)** | Embeddings, vector store, retrieval over your own corpus | `nomic-embed-text` pulled on NAS; pgvector in self-host Supabase; Scripture/lessons/study corpus already structured | **Embeddings present; retrieval pipeline = partial/gap** |
| **3. Orchestration + guardrails** | Routing, tiering, prompt assembly, safety gates, the three brakes | Tiered orchestrator spec (DR-0073), `brakes.sh` (LIVE), egress/sovereignty gate, locked-scorer (spec), `tts.js`/realtime/`surfaces.js` seams | **Brakes LIVE; router/loop INERT-or-spec** |
| **4. Observability + deployment** | Health, metrics, eval, reproducible deploy, fallback | `LlmHealth.jsx` (Ollama `/api/ps` readout), Model Lab eval (spec), Cloudflare/NAS deploy path, browser/cloud fallbacks at every seam | **Health surface + deploy path present; eval harness = spec** |

The framework's value here is diagnostic: it confirms the **model-serving layer (1)** is the load-bearing gap, that **guardrails (3)** are our strongest-built layer (the brakes are real and engaged), and that **retrieval (2)** and **eval/observability (4)** are the next two layers to harden after the GPU endpoint lands. RAG, retrieval, guardrails, and observability are not bolt-ons — they are the layers that make a served model into a *trustworthy* system (DR-0076), and the brief's Phase 3 ("reusable engines") is where layers 2 and 4 get built out behind the same seams.

## Tooling Evaluation — Adopt / Eval / Skip (open-source items surfaced 2026-06-24/25)

Each screened for sovereignty (runs on owned hardware, no data egress) + cost ($0 software on hardware we have) + maturity (pilot-before-rely) + fit to a real PoeTech use. Confidence noted where a tool's exact license/maturity is from general knowledge, not verified this session.

| Tool | PoeTech use | Verdict | Sovereignty / cost / why |
|---|---|---|---|
| **Aider + Ollama + qwen2.5-coder:14b** | Sovereign local coding/automation agent on the 4070 | **ADOPT (pilot)** | Sovereign (local weights, no egress), $0, mature CLI. Builds on already-proven Ollama. **Wants the GPU (4070), not the CPU NAS.** Second candidate alongside already-evaluated OpenClaw. |
| **Voicebox** | Sovereign voice/read-aloud (Phase 2) | **EVAL** (already in plan) | MIT, local, CUDA. Pre-1.0 — pilot on low-stakes behind `tts.js`. |
| **FluidVoice** | Local dictation → input lane for Ari / Study / notes | **EVAL** | Local push-to-talk dictation; ties the voice-input half. *Confidence: medium — confirm license + Windows support before relying.* |
| **codebase-memory-mcp** | Agent persistent memory of the codebase → dev productivity | **EVAL (dev-side)** | If it stores locally, sovereign + low-risk; helps the local coding agent. Dev tooling, not user-facing. |
| **TimesFM** (Google) | Time-series forecasting → the financial-engineering Forecast projections | **EVAL** | Apache-2.0 open weights, runs local. Real fit for `financial-engineering.js`. Constraint: foundation forecaster wants sufficient history; our finance data is partly seed → eval against real rows before trusting (DR-0076). |
| **OpenCut** | Open video editing infra → the books→movies / media pipeline | **EVAL (later)** | Sovereign, ties AI-MEDIA-PRODUCTION vision. Early maturity; not on the critical path — parks behind the substrate. |
| **Penpot** | Design-to-code / design system | **EVAL (low-pri)** | AGPL, self-hostable Figma alternative, sovereign. Useful, not core to the AI stack. |
| **Agent-Reach / BrowserAct** | Agentic web actions | **SKIP / heavily-gate** | Real blast-radius risk; cuts against "browsers are for humans deciding, systems use API calls" (AI-FOUNDATION-INTERNAL-OPERATIONS). Only behind the three brakes + per-domain gate if ever. |
| **System-Prompts-Leaks** | Prompt-craft reference reading | **REFERENCE only** | Not a dependency; read for prompt-engineering ideas. No sovereignty concern (reading), no adoption. |

**Sovereign local coding agent — assessment.** Strongest item in the batch. It extends an already-proven deployment (Ollama serving `qwen2.5` is live in `class-tutor.js`) with a coder-tuned model on owned hardware, giving private, $0, offline code generation and automation. The pasted figures match known values (RTX 4070 ~12 GB; `qwen2.5-coder:14b` Q4 ~9 GB → fits with modest-context headroom; bigger context or 32B-class wants more VRAM). Honest constraints: 14B-coder is strong-but-not-frontier (good for fix-class/refactor/scaffold; escalate hard reasoning to vendor per DR-0073), and it wants the **GPU** to be fast — on the CPU-only NAS it would crawl (~1–3 tok/s at 14B). **Premise correction for the pasted infra question:** the model belongs on the 4070 GPU box, not the Synology NAS (which has no GPU); "route the Ollama API back to the laptop" should route *from the 4070 box*. Where Aider + the repo live is **Darrell's hand** — surfaced as options, not acted on.

## Source documents synthesized (all landed in-repo)

- Open models: `docs/99-session-notes/2026-06-24-research-review-open-model-landscape-sovereign-tiers-and-openrouter.md`
- GLM eval: `docs/99-session-notes/2026-06-24-research-review-glm-zhipu-sovereign-local-llm-candidate.md`
- Voice layer: `docs/99-session-notes/2026-06-24-voicebox-sovereign-voice-layer-research-review.md`
- WebSockets/Realtime: `docs/99-session-notes/2026-06-24-websockets-realtime-sovereign-path-research-review.md`
- Auto-optimize: `docs/99-session-notes/2026-06-24-auto-optimize-engine-spec-karpathy-auto-research-pattern.md`
- Shared CRM: `docs/00-foundations/ROLES-MEMBERSHIP-MULTITENANCY-ADR.md` (DR-0079-pending)
- Modular rebuild: `docs/00-foundations/MODULE-ARCHITECTURE-ADR.md` (DR-0078, ratified 2026-06-17)
- Off-Vercel: `docs/99-session-notes/2026-06-16-cutover-plan-vercel-to-cloudflare-pages.md` (#210, gated)
- Hardware: `docs/00-foundations/CUDA-BOX-PROCUREMENT-HOME-AND-CHURCH.md` + `docs/99-session-notes/2026-06-10-research-review-network-infra-for-local-llms.md` + `docs/99-session-notes/2026-06-13-tiered-llm-orchestrator-spec.md` + `2026-06-13-vendor-llm-routing-strategy.md` (DR-0012/0053/0073)

*Numbers labeled vendor-reported are vendor-reported. Model Lab (DR-0076) establishes ground truth on real PoeTech tasks before any model earns a production slot. No claim of done without evidence — this brief is a synthesis of landed research, not a report of shipped capability.*
