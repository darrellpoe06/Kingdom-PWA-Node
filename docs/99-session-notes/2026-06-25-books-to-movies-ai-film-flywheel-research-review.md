# Research-Review + Roadmap — Books → Movies (the AI-Film Flywheel)

**Date:** 2026-06-25
**Type:** Research-review + roadmap/vision spec (Layer 4 working artifact)
**Question (Darrell):** Eventually, books become **MOVIES** — AI-produced and promoted **inside the PoeTech app exclusively** for subscribers. Realistic film grounded in *the information of Yahweh* (His truth / the Word) plus real human content feeds (Darrell's and the community's). What's the path — flywheel extension, the honest tech survey, the content grounding, the binding integrity guardrails, and a crawl→walk→run phasing — and what's doable NOW vs gated on hardware/model maturity?
**Posture:** research-first; roadmap not build (Darrell: *"eventually — this is roadmap/spec now, not a heavy build tonight"*); verification doctrine (DR-0076) — every external claim is cited with an as-of date, hardware items not read off the real units are marked **TO CONFIRM**.
**Senior foundation:** `docs/00-foundations/_root/AI-MEDIA-PRODUCTION-PLATFORM-VISION.md` (this is the long-arc media vision Darrell declared 2026-05-29; this doc is its first concrete book→film extension), read through `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`.

---

## 0. TL;DR — the call

**Yes — books → movies is the natural next medium on the same flywheel, and it should be built INCREMENTALLY behind the seams we already have, NOT as a big-bang "make a film" feature.** It is the same corpus (the Word + harvested service/teaching/study content + Darrell's and the community's real feeds), retold in a richer medium, released subscriber-exclusive in-app on the entitlement rails already shipped.

**The honest hardware truth up front:** photoreal, minutes-long, broadcast-grade AI *film* is **NOT** feasible on the church's 2× RTX 4070 (12GB) today — those models are 24GB-to-datacenter territory at full quality, and even quantized local video gen produces ~4-5 second clips, slowly. **So we crawl in a medium that IS sovereign-feasible now** — narrated, illustrated, motion-graphic "moving picture" content built from book/Scripture text + consented voices on current hardware — and **walk/run into true AI video as the planned bigger CUDA box (5090-class) lands and the open models mature.** The vision is real; the sequencing is honest about what silicon we have.

**X not Y because Z:** build the pipeline **sovereign-first behind seams** (the harvest corpus → the `tts.js` voice seam → an in-app exclusive player), **not** a vendor-API film studio, because the entire PoeTech thesis is sovereignty + no-extraction + mission-first (DATA-AS-EMPOWERMENT-NOT-EXTRACTION). Vendor video APIs (Veo / Sora / Kling) are kept as an *optional, gated burst lane* for non-sovereign-OK promo/marketing where the cost/quality math wins — never as the canonical generator of Word-grounded content.

**Five binding integrity guardrails (non-negotiable, §4):** (1) every AI-generated frame is **LABELED "AI-generated"**; (2) **likeness + voice consent required** — no realistic depiction of a real person's face or voice without explicit, written, scoped consent (extends the voice-consent rule to faces); Darrell's own = consented; (3) **no deceptive realism** — never depict a real person saying/doing what they didn't, never present generated footage as documentary fact; (4) **child-appropriate** by default; (5) **mission-aligned** — every film is screened by the theological review pipeline (souls + the Word, not spectacle).

**This doc ships:** the roadmap + a captured **vision/project card** (seed `infra/seed-data/2026-06-25-books-to-movies-vision-project.json`) so it lives in the Projects hub as the thing-to-build-toward. No film engine is built tonight.

---

## 1. The flywheel extension (grounded in what already exists)

PoeTech already runs a content flywheel. Books → movies does not invent a new one — it **adds a medium to the existing harvest loop** and re-uses the same corpus.

### 1.1 What the flywheel already is (read-only, grounded)

| Stage | Where it lives | What it does |
|---|---|---|
| **Capture** | `infra/nas-sme-pipeline/` (faster-whisper INT8), n8n `wf37` | Every service / teaching / study session becomes a transcript — the raw source material. |
| **Harvest** | `app/src/lib/video-harvest.js` + `harvest-ledger.js`, Church › 🌾 Harvest | "No-video-lost": ONE transcript fans out into sermon / songs / lessons / scripture / discernment / testimony / trivia / events. `video_harvests` ledger (migration 0050) flags orphans; everything is **derived, not painted**. (See `[[project_video_harvest_coverage_ledger]]`.) |
| **Books** | Darrell's books / Study corpus + the Word (PoeTech Study Edition, `[[project_poetech_study_edition]]`) | The long-form written artifacts — the *next* thing to retell in a new medium. (Lane **`local_7bcac1a3`** in Darrell's instance.) |
| **Voice** | `app/src/lib/voice-registry.js`, `voice-sync.js`, `VoiceStudio.jsx` | Consented sovereign voices (Darrell/Christina/BG), entitlement-gated, behind the `tts.js` seam. (Lane **`local_da7f0d36`**; see §2.3 + `[[project_tts_read_aloud]]`.) |
| **Distribute** | entitlement gate (`voice-registry.js` `ENTITLEMENT` model), subscriber surfaces | Subscriber-exclusive content already has rails — the same rails carry films. |

### 1.2 The extension — same corpus, new medium

```
  Word + harvest corpus + Darrell's/community's feeds        (SAME source — §3)
        │
        ▼
  BOOK / teaching / study artifact  (lane local_7bcac1a3)
        │   ── screenplay / scene-treatment pass (LLM, sovereign Ollama; §3.3)
        ▼
  SCENE TREATMENT  (storyboard + narration script + shot list)
        │   ── narration in consented voices (tts.js seam; voice lane local_da7f0d36)
        │   ── visuals: illustrated/motion NOW → AI video as compute matures (§2)
        ▼
  AI-GENERATED "MOVING PICTURE"  (labeled AI; theological review pipeline; §4)
        │
        ▼
  IN-APP EXCLUSIVE RELEASE  (subscriber entitlement; 90-day-free on-ramp; §1.3)
        │   ── feedback / loves / watch-data flow back  →  refines the next retelling
        └────────────────────────────────────────────────────────────┘  (flywheel closes)
```

**The key insight:** the film is not a *new* asset class to source from scratch — it is the **harvest corpus rendered in motion**. A sermon already fans out into a lesson and a Scripture set; book→film simply adds "and a short narrated film" as another fan-out target of the same transcript/book. That re-uses the no-video-lost ledger discipline: a film is another derived artifact with provenance back to its source row, never a painted thing.

### 1.3 Subscriber-exclusive distribution (the rails already exist)

The "promoted within the app EXCLUSIVELY for subscribers" requirement maps cleanly onto the entitlement model already shipped in `voice-registry.js`:

```js
ENTITLEMENT = { FREE: 'free', SUBSCRIBER: 'subscriber' };
isVoiceEntitled(voice, { subscribed, isOwner }) { ... }   // FREE always; else subscribed||owner
```

- **Films are `ENTITLEMENT.SUBSCRIBER`** content by default — the same gate that protects cloned voices protects exclusive films. The owner/building-circle is always entitled (build+test); everyone else subscribes.
- **90-day-free on-ramp** — surfaced today in `About.jsx` as the trial concept; **NOTE (verify-don't-claim, DR-0076):** there is **no implemented billing/trial engine yet** (no Stripe, no grace-period gate). The 90-day-free + tiered-subscription rails are themselves a dependency this roadmap rides, not something to assume exists. Captured as a dependency in §6.
- **Distribution sovereignty holds (Pillar 4 of the media vision):** the canonical home is in-app / NAS-served; YouTube/Vimeo are *mirrors for promo only*, never the exclusive canonical. Exclusive = genuinely in-app behind the entitlement gate.

**What this is NOT:** it is not a public film-release platform, not ad-supported, not engagement-optimized. It is subscriber-exclusive, mission-first content on sovereign rails — the moat *is* the structural difference (DATA-AS-EMPOWERMENT-NOT-EXTRACTION).

---

## 2. Tech survey (cited, as-of June 2026)

The honest question is **"what can we generate, at what quality, on what hardware, under what license, and how sovereign?"** Three layers: **video**, **voice/audio**, **compute**.

### 2.1 Video generation — open/self-hostable vs vendor API

#### Open-weight, self-hostable models (the sovereign lane)

| Model | License | What it is | As-of |
|---|---|---|---|
| **Wan 2.2 / 2.7** (Alibaba) | **Apache 2.0** | T2V + I2V; causal 3D VAE; **the cleanest sovereign story** — multi-task, lowest VRAM of the three, runs quantized on consumer cards. Latest self-deployable weights as of Mar 2026. | Mar 2026 |
| **HunyuanVideo 1.5** (Tencent) | Apache 2.0 (community) | Current **quality benchmark** for open video; full-attention transformer (Sora-class architecture); T2V + I2V up to 1080p. | 2026 |
| **LTX-2 / LTX-2.3** (Lightricks) | **Apache 2.0** (free under $10M ARR; licensed training data) | First open model with native **4K + synced audio** + truly open weights (training code + inference); built for fine-tuning on proprietary IP and on-prem deploy. | LTX-2.3 released 2026-03-05 |

**The catch (VRAM honesty — this is the whole feasibility story):**
- **Full quality is 24GB→datacenter.** Wan 2.2 14B at FP16 with the text encoder on GPU needs **~54–65GB VRAM** (datacenter). At FP8 + T5-CPU-offload it's **~14–16GB at 720p** — the best consumer quality, but needs a 16GB+ card.
- **On a 12GB RTX 4070** (the church's cards): only via **GGUF quantization (Q4_K_M) + T5 offloaded to CPU**, dropping to ~6–8GB GPU — and even then you get the **14B model degraded** or the small 1.3B/5B variants, producing **~4–5 second clips**, slowly (a 24GB 4090 takes 60–120s per 4-second 720p clip at 50 steps; a quantized 12GB card is slower still).
- **Translation:** the 2× RTX 4070 can run *short, low-res, experimental* video-gen clips today — enough to **prototype and learn the pipeline**, **not** to produce a polished multi-minute film. That is the honest line between crawl and walk.

#### Vendor video APIs (the optional non-sovereign burst lane)

Per-second / per-clip pricing, as of April 2026 (`buildmvpfast.com/api-costs/ai-video`, `evolink.ai`):

| Model | Price | Notes |
|---|---|---|
| **Wan 2.6 (hosted)** | **$0.05/sec** | Budget king; native 1080p; lowest cost/sec. |
| **Kling 3.0** | $0.10/sec | |
| **Sora 2 base / Pro** | $0.10/sec; Pro $0.30–0.50/sec ($1–5/clip) | |
| **Veo 3.1 Standard / Fast** | $0.75/sec (native 4K, best lip-sync, audio incl.); Fast $0.15/sec | Most expensive; best quality ceiling. |
| **Runway Gen-4.5** | ~$1.50/clip | Unlimited plan $76/mo for volume. |

A 10-second clip runs **$0.50 (Wan 2.6) → $7.50 (Veo 3.1 Standard)**. For a few minutes of finished film that's tens of seconds of *kept* footage after many discarded generations — vendor cost adds up fast, and **the footage leaves our network** (sovereignty + the Word-grounded content the mission forbids shipping to a third party).

**Verdict (build-on vs vendor):** **sovereign-first for canonical Word-grounded content; vendor APIs are a gated, opt-in burst lane** for (a) non-sovereign-OK *promo/marketing* clips where cost/quality wins, and (b) reference/learning. Never the canonical generator. Same posture as the open-model landscape brief (`[[project off-vercel/openrouter burst]]` analog).

#### Talking-head / portrait-animation (the realistic-people-speaking layer)

Open-source, image+audio → a person speaking, as of 2026 (`pixazo.ai`, `lipsync.com`, `github.com/jixiaozhong/Sonic`):

- **SadTalker** — single photo + audio → talking head with natural head motion. Lightweight.
- **LivePortrait** — high-fidelity, emotion-aware portrait animation.
- **MuseTalk** — among the highest-quality open lip-sync in 2026, near-photoreal.
- **Sonic** (CVPR 2025) — global-audio-perception portrait animation; ComfyUI workflow available.
- **Wav2Lip** — the classic baseline.

**Why this matters for us:** these are the bridge between "narrated illustrated content" (crawl) and "a consented person on screen telling the story." They are **lighter than full video-gen** (run on the 4070), and they are **exactly where the likeness-consent guardrail (§4.2) binds hardest** — animating a face is depicting a real person. Darrell's own consented likeness is the safe first subject.

### 2.2 Audio / voice — tie to the Voicebox lane (`local_da7f0d36`)

Already evaluated in depth — `docs/99-session-notes/2026-06-24-voicebox-sovereign-voice-layer-research-review.md` (`[[project_tts_read_aloud]]`). For film:

- **Narration** rides the **`tts.js` provider seam** — sovereign Kokoro/Piper (synthetic, no consent needed) for general narration; **consented cloned voices** (Darrell/Christina/BG, building-circle consent recorded 2026-06-24) for in-voice narration, **always labeled "AI-generated voice."**
- **Voice consent model** (`voice-registry.js`): `KIND.PERSONAL`, `CONSENT.{NONE..GRANTED..REVOKED}`, scoped + revocable. Films extend this verbatim — a film's narration voice is a registry voice with the same consent state.
- **Music/score:** open-source music-gen (the AI-MEDIA vision names suno-like local options as they mature) on the GPU box; deferred to walk/run.

### 2.3 Compute reality (the gating constraint — honest)

| Hardware | Status | What it can do for film |
|---|---|---|
| **Church 2× RTX 4070 (~12GB, TO CONFIRM exact VRAM)** | Available now; one freed by retiring ProPresenter (`[[project_presenter_replaces_propresenter]]`) | **NOW:** narration (Kokoro/Piper), talking-head (SadTalker/LivePortrait), short quantized video-gen *experiments* (~4–5s clips). **NOT:** multi-minute photoreal film. |
| **Planned bigger CUDA box (5090-class, 32GB; per `LOCAL-LLM-HARDWARE-RECOMMENDATION.md`)** | Planned, **TO CONFIRM** spec/timeline | Walk/run: FP8 14B video-gen at 720p, longer clips, MuseTalk at quality, local music-gen. The ceiling-remover. |
| **Vendor APIs** | Available, gated | Burst lane for non-sovereign promo only (§2.1). |

**Cost-efficiency screen (standing format):** software is **$0** (Apache-2.0 / MIT open models) on hardware we already own or plan; the recurring cost is **power + the GPU-box capex** ($3–5K one-time per the AI-MEDIA vision, amortized over 12–24 months), vs a vendor stack that bills per-second **perpetually** *and* ships Word-grounded content off-box. Sovereign-local wins on cost *and* principle for canonical content; vendor wins only on a per-clip promo where speed/quality is worth the spend and sovereignty isn't required.

**Sovereign-mesh-compatibility screen (standing format):** the open models are CUDA-native and run on the existing LAN/Tailscale-reachable boxes with **no public surface** — same access posture as the NAS sovereign surfaces. Generation is **workflow, not click-labor** (AI-FOUNDATION-INTERNAL-OPERATIONS): an n8n pipeline takes a book/transcript → treatment → narration → frames → assembled film → review queue. Air-gappable end-to-end. Vendor APIs are the *only* part that breaks the mesh, which is exactly why they're quarantined to the gated promo lane.

---

## 3. Content grounding — "based on the information of Yahweh"

The films are not generic AI slop. They are **grounded in the Word + real human truth feeds** — that grounding is the product, and it's enforced structurally.

### 3.1 The Word as primary source

- The canonical text base is the **PoeTech Study Edition** (`[[project_poetech_study_edition]]`) — public-domain WEB+KJV verbatim, with the ownable clarification layer kept *structurally separated and machine-checked*. A film grounded in a passage cites the passage; Scripture shown follows `SCRIPTURE-REFERENCE-STANDARD.md` (ESV primary, fetched-not-from-memory).
- **No improvised theology.** Per CLAUDE.md "Source of Answers" + the AI-MEDIA theological-review pipeline (Pillar 3): every theological frame is screened against THE-WAY / MIND-OF-CHRIST / the Worldview; typographic theology binds all generated text and on-screen titles (Yahweh / Jesus / Holy Spirit capitalized; the adversary never).

### 3.2 Real human content feeds

- **Darrell's feeds** — his books, his Study/Yahweh discussions (`docs/00-foundations/darrells-study/yahweh-discussions.md`, `[[project_darrells_study_yahweh_source]]` — "His opinion IS wealth"), his teaching. These are *consented by definition* (his own) and are the richest, most-grounded source.
- **The community's feeds** — BG's messages, choir, testimony, the harvest corpus — **consent-gated** (a testimony becomes film only with the speaker's consent; §4.2).
- **The harvest corpus** (`video-harvest.js`) is the connective tissue: a film draws from real rows (a real sermon, a real lesson, a real testimony) with provenance, never from a hallucinated source. This is the **reality-trace discipline (P15)** applied to film: name the real source row before a frame is generated.

### 3.3 How the corpus drives *realistic, truthful* content

1. **Sovereign LLM (Ollama) does the screenplay/treatment pass** over the real source (book passage + transcript), constrained to the source — it *adapts*, it does not invent doctrine. Same local-LLM posture as the auto-optimize/SME-spec pipelines (`[[project_sme_video_to_spec_pipeline]]`).
2. **Truthfulness is a gate, not a vibe:** the theological-review pipeline (Pillar 3) + the Religion-AND-Relationship test + the Test (Phil 4:8) screen every treatment *before* a frame is generated — cheaper to catch a doctrinal drift in a script than in rendered footage.
3. **"Realistic" means truthful-and-excellent, not photoreal-at-any-cost.** Early films are realistic in *grounding* (true to the Word + the real human source) even when the *medium* is illustrated/motion rather than photoreal video. Photorealism is a phase-3 capability; truthfulness is a phase-1 requirement.

---

## 4. Integrity guardrails (BINDING — bright lines, not polish)

These extend the voice-consent guardrails (Voicebox §6) from voices to **faces, likeness, and full films.** They are senior to convenience and to model capability.

1. **AI-generated film is ALWAYS LABELED "AI-generated."** A visible, persistent label on any generated film and on its in-app surface. No exceptions for "it's obviously stylized." (Extends Voicebox guardrail 2.)
2. **LIKENESS + VOICE consent is REQUIRED.** No realistic depiction of a *real person's* face or voice — animated, cloned, or rendered — without **explicit, written, scoped, revocable consent** (extends the voice-consent rule to faces; QUALITY-OF-LIFE; COMMUNITY-FIRST-MISSION; VISION-FAIRNESS posture). **Darrell's own likeness + voice = consented** (his own feeds). The building circle's *voices* are consented for build+test (2026-06-24); **likeness consent is a separate, additional grant** and is **not** assumed from voice consent. Any congregant, minor, or non-circle person: default is **don't**; a minor's likeness is not used without guardian consent and child-safety care.
3. **NO deceptive realism.** Never depict a real person saying or doing what they did not; never present generated footage as documentary/historical *fact*; no fabricated "BG said…" or a rendered event that didn't happen presented as real. Dramatized/illustrated *Scripture* and *intended* teaching content is fine **when labeled**; impersonation and fabricated-as-real is the absolute line (Exodus 20:16 — no false witness). (Extends Voicebox guardrail 3.)
4. **CHILD-APPROPRIATE by default.** Content serving a church with elders and minors is safe-by-default; anything else is gated and reviewed. No violence/horror realism, no frightening photoreal depiction, age-appropriate framing of hard biblical content.
5. **MISSION-ALIGNED — souls and the Word, not spectacle.** Every film passes the senior Kingdom question (AI-MEDIA purpose 6): does this lift up the King? It runs the theological-review pipeline (Pillar 3) and the Test (Phil 4:8) before publish. Spectacle-for-its-own-sake, vanity, or engagement-bait fails the gate.

**Enforcement (verification doctrine, DR-0076):** these are not honor-system. The label is a structural property of the player (not a toggle); consent is a registry state checked at generation time (a face/voice with `CONSENT != GRANTED` cannot be rendered); the theological screen is a pipeline stage with a Governor/Quality-Gatekeeper sign-off before publish. Every "a-human-would-have-known" failure becomes a machine check. Likeness consent gets its **own registry kind** (mirroring `voice-registry.js`), so "no consent → no render" is a gate, not a guideline.

---

## 5. Phasing — crawl → walk → run (honest about hardware/model gating)

The vision is real; the sequencing respects the silicon. **Doable NOW** vs **gated** is called out explicitly.

### Phase 0 — Foundation (NOW; no new film engine)
- **This doc + the vision/project card** (seed `2026-06-25-books-to-movies-vision-project.json`) — the thing-to-build-toward is captured in the Projects hub.
- **No build effort sunk** beyond the seams already shipped (harvest corpus, `tts.js`, entitlement, voice registry).
- **Decision captured:** sovereign-first, vendor-gated, five guardrails binding.

### Phase 1 — CRAWL: narrated illustrated/motion content (NOW, on 2× RTX 4070)
**Doable now.** No photoreal video; no new hardware.
- A book passage / Scripture / teaching → LLM treatment (sovereign Ollama) → **narration in a consented voice** (`tts.js` seam) → **illustrated stills + motion graphics + Ken-Burns/animated text** (open image-gen FLUX/SD + ffmpeg/motion, already named in the AI-MEDIA stack) → assembled short (3–5 min) → **labeled, theological-review-screened, subscriber-exclusive in-app player.**
- Optional: **talking-head narration of Darrell's own consented likeness** (SadTalker/LivePortrait on the 4070) as a single-subject pilot — the safest first "real person on screen."
- **Gate:** the in-app exclusive player + the 90-day-free/subscription entitlement engine (§6 dependency).

### Phase 2 — WALK: short AI video clips woven in (GATED on the 5090-class box)
**Gated on the bigger CUDA box.** When the planned 5090-class box (32GB) lands:
- FP8 Wan 2.2 14B / HunyuanVideo at 720p for **short generated video shots** (4–10s) woven into the illustrated base — establishing shots, b-roll, dramatized scene fragments — not yet a fully-generated film.
- **MuseTalk-quality** talking-head for consented subjects; local music-gen for score.
- Richer assembly via ComfyUI workflow on the box.

### Phase 3 — RUN: richer AI film (GATED on model maturity + compute)
**Gated on both bigger compute and open-model maturity** (multi-minute coherent photoreal video at consumer/prosumer scale is not 2026-feasible sovereignly).
- Longer, more coherent generated sequences; higher resolution (LTX-2 4K + native audio as it matures on owned hardware); a real film, sovereignly produced.
- Vendor-API burst only where a specific *promo* clip's cost/quality/speed wins and sovereignty isn't required (gated, labeled, never canonical Word content).

**Standing re-review (DR-0075):** Phase 2/3 carry a re-review trigger = **"when the bigger CUDA box stands up AND a sovereign video-gen clip clears a real quality bar on a real device"** (verify-don't-claim). Until then Phase 1 is the live lane and the rest is roadmap.

---

## 6. Dependencies (what this rides on — honest)

| Dependency | State | Gates which phase |
|---|---|---|
| **In-app exclusive media player** (subscriber-gated film surface) | **Not built** — new surface needed (reuse Presenter/Lightbox primitives + entitlement gate) | Phase 1 |
| **90-day-free + tiered subscription / billing engine** | **Not implemented** (concept in `About.jsx`; no Stripe/trial gate) — `voice-registry.js` has the entitlement *model* but no billing | Phase 1 (distribution) |
| **Likeness-consent registry** (faces, mirroring voice registry) | **Not built** — new; required before any real face is rendered | Phase 1 (talking-head) / Phase 2 |
| **Bigger CUDA box (5090-class, 32GB)** | **Planned, TO CONFIRM** spec/timeline | Phase 2/3 |
| **Theological-review pipeline as a gated pipeline stage** | Partially conceptual (Pillar 3); needs a real review-queue stage | Phase 1 publish gate |
| **Harvest corpus film-fanout target** | Harvest exists (`video-harvest.js`); "short film" as a fan-out target is new | Phase 1 |
| Sovereign voice layer (Kokoro/Piper behind `tts.js`) | Evaluated, pilot-ready (`[[project_tts_read_aloud]]`) | Phase 1 |

**None of these are built tonight.** This roadmap names them so Phase 1, when greenlit, starts from a true map.

---

## 7. Standard screens

- **Religion check (backbone):** the films exist to lift up the King and carry the Word (AI-MEDIA purpose 6); content is Scripture-grounded, no improvised theology, typographic theology binding; truthful representation — no false witness via fabricated face/voice (Exodus 20:16). Backbone present.
- **Relationship check (warmth):** the heart is a child or an elder who *sees and hears* a biblical truth come alive in a warm, consented, family voice — accessibility and discipleship made vivid, meeting people where they are. Warmth present.
- **The Test (Phil 4:8):** TRUE (claims cited, hardware limits stated honestly, no over-claim of feasibility), HONORABLE (consent + labeling protect dignity), JUST (no extraction, no deception, sovereign), PURE (child-appropriate, no spectacle-lust), LOVELY/COMMENDABLE (the Word made vivid), EXCELLENT (sovereign + free where it counts, honest about phasing), PRAISEWORTHY (lifts the family AND the community, creates rather than extracts).
- **Perpetual improvement (DR-0075):** Phase 1 is the live improvement lane; Phase 2/3 carry the explicit re-review trigger (bigger box + a verified quality bar) — nothing parked silently.
- **Three-brakes (autonomous automation):** when the generation pipeline becomes a workflow that spawns compute on a trigger (overnight batch render), it ships with budget + concurrency-lock + kill-switch (`[[feedback_autonomous_automation_three_brakes]]`), INERT until armed with someone watching. Render farms are exactly the runaway-compute class the 2026-06-06 incident warned about.
- **Reality-trace (P15):** every film names its real source row (a real passage / sermon / testimony) before a frame is generated; a film with no traceable source does not ship. (DR-0076 verification: label is structural, consent is a checked gate, theology is a review stage.)

---

## 8. Recommendation (decision)

**Adopt books → movies as the named next medium on the existing flywheel, sovereign-first, phased — and build NOTHING tonight beyond capturing the vision.**

- **The vision is ratified** as the concrete book→film extension of `AI-MEDIA-PRODUCTION-PLATFORM-VISION.md`.
- **Sequencing is honest:** Phase 1 (narrated illustrated/motion + consented voices) is doable NOW on the 2× RTX 4070; true AI *video* is GATED on the bigger CUDA box and open-model maturity. We do not over-promise photoreal film on 12GB cards.
- **The five integrity guardrails are binding** from the first frame — label, likeness+voice consent, no deception, child-appropriate, mission-aligned — enforced structurally, not on the honor system.
- **Vendor APIs are a gated, opt-in burst lane** for non-sovereign promo only; canonical Word-grounded content is generated sovereignly.

**Build-it-in-the-app default (Layer 0):** when Phase 1 is greenlit, the surface is an **in-app subscriber-exclusive film player** (reusing the Presenter/Lightbox primitives + the entitlement gate), and the generation is an **n8n workflow** over the harvest corpus — where the user lives, on sovereign rails.

**Next concrete step (for the orchestrator to schedule, NOT blocking, NOT tonight):** a Phase-1 spike — one real book/Scripture passage → sovereign Ollama treatment → Kokoro narration → FLUX stills + ffmpeg motion → a single 3–5 min labeled short, behind a feature-flagged in-app player, reviewed by the theological screen — to verify the pipeline end-to-end on a real device (DR-0076) before any subscriber-facing release.

---

## 9. Sources (verified June 2026)

**Tech survey (external, cited with as-of dates):**
- Open video models / licensing — `pixazo.ai/blog/best-open-source-ai-video-generation-models`, `hyperstack.cloud/blog/case-study/best-open-source-video-generation-models`, `ltx.io/model/open-source` (LTX-2.3 Apache-2.0, released 2026-03-05, 4K+audio open weights), Wan 2.2/2.7 + HunyuanVideo 1.5 Apache-2.0 (Mar 2026).
- VRAM / consumer-hardware feasibility — `willitrunai.com/blog/wan-2-2-vram-requirements`, `runaihome.com/blog/wan-video-local-ai-gpu-guide-2026`, `wan27.org/blog/wan-2-2-requirements-guide`, `medium.com/@ttio2tech_28094` (HunyuanVideo on 10–12GB): 14B FP16 ~54–65GB; FP8+T5-offload ~14–16GB@720p; GGUF Q4 ~6–8GB on 12GB cards; 4090 24GB ~60–120s/4s-clip@720p.
- Vendor API pricing (as of Apr 2026) — `buildmvpfast.com/api-costs/ai-video`, `evolink.ai/blog/best-ai-video-generation-models-2026-pricing-guide`, `veo3ai.io/blog/veo-3-pricing-2026`: Wan 2.6 $0.05/s, Kling 3.0 $0.10/s, Sora 2 $0.10/s (Pro $0.30–0.50/s), Veo 3.1 Standard $0.75/s.
- Talking-head / lip-sync (open, 2026) — `pixazo.ai/blog/best-open-source-lip-sync-models`, `lipsync.com/blog/open-source-lip-sync`, `github.com/jixiaozhong/Sonic` (CVPR 2025): SadTalker, LivePortrait, MuseTalk, Sonic, Wav2Lip.

**Repo grounding (internal, file-cited):**
- `docs/00-foundations/_root/AI-MEDIA-PRODUCTION-PLATFORM-VISION.md` (the senior media vision; six purposes, six pillars, suggested stack, sequencing).
- `app/src/lib/video-harvest.js` + `harvest-ledger.js` (the no-video-lost harvest flywheel; `[[project_video_harvest_coverage_ledger]]`).
- `app/src/lib/voice-registry.js` (`ENTITLEMENT`, `CONSENT`, `KIND` — the consent + entitlement model films extend), `voice-sync.js`, `VoiceStudio.jsx`, `infra/nas-sme-pipeline/intake-voice-clone-CONSENT.md` (building-circle voice consent, 2026-06-24).
- `app/src/lib/tts.js` (the provider seam narration rides), `docs/99-session-notes/2026-06-24-voicebox-sovereign-voice-layer-research-review.md`.
- `infra/seed-data/2026-05-25-projects.json` (the project-card seed shape this vision card mirrors), `app/src/lib/project-management.js` (eternal-stage lens).
- `app/src/components/About.jsx` (90-day-free / subscriber concept — NOT yet an implemented billing engine; flagged as a §6 dependency).
- `docs/00-foundations/LOCAL-LLM-HARDWARE-RECOMMENDATION.md` (the planned 5090-class box; spec/timeline TO CONFIRM).

---

*Layer 4 working artifact. No film engine built; this is the eval + roadmap that names the path and captures the vision/project card. Phase 1 (narrated illustrated/motion + consented voices) is doable now on the 2× RTX 4070; true AI video is gated on the bigger CUDA box + open-model maturity. The five integrity guardrails — label, likeness+voice consent, no deception, child-appropriate, mission-aligned — are binding from the first frame.*
