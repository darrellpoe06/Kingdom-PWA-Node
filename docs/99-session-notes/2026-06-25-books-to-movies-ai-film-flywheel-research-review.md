# Research-Review + Roadmap — Books → Movies (the AI-Film Flywheel)

**Date:** 2026-06-25
**Type:** Research-review + roadmap/vision spec (Layer 4 working artifact)
**Question (Darrell):** Eventually, books become **MOVIES** — AI-produced and promoted **inside the PoeTech app exclusively** for subscribers. Realistic film grounded in *the information of Yahweh* (His truth / the Word) plus real human content feeds (Darrell's and the community's). What's the path — flywheel extension, the honest tech survey, the content grounding, the binding integrity guardrails, and a crawl→walk→run phasing — built as a proper **MODULE** so it **SCALES** without a rewrite, and what's doable NOW vs gated on hardware/model maturity?
**Posture:** research-first; roadmap not build (Darrell: *"eventually — this is roadmap/spec now, not a heavy build tonight"*); **scalability is the design constraint** (Darrell: *"modules exist so scalability is built into the PoeTech app"*); verification doctrine (DR-0076) — every external claim cited with an as-of date, hardware not read off the real units marked **TO CONFIRM**.
**Deliverable shape (Darrell's standard):** **Opportunities & Constraints → How → Why-best** (§1), each ending with a recommendation; modular + scalable design baked into §3.
**Senior foundation:** `docs/00-foundations/_root/AI-MEDIA-PRODUCTION-PLATFORM-VISION.md` (the long-arc media vision; this is its first concrete book→film extension), read through `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`. **Architecture:** `docs/00-foundations/MODULE-ARCHITECTURE-ADR.md` + `DR-0078` (hybrid-modular shell + feature modules).

---

## 0. TL;DR — the call

**Yes — books → movies is the natural next medium on the same flywheel, and it should be built as a proper FEATURE MODULE on the shared core/shell primitives (DR-0078), INCREMENTALLY behind seams, NOT as a big-bang "make a film" feature.** Same corpus (the Word + harvested service/teaching/study content + Darrell's and the community's real feeds), retold in a richer medium, released subscriber-exclusive in-app on the entitlement rails already shipped.

**Scalability is the whole design point.** The media-production pipeline, the in-app exclusive distribution, the entitlement/subscription gating, and the voice/likeness-consent layer are each **modular, reusable seams** — so the *same module* grows from narrated/illustrated content now to full AI video later by **swapping a richer generation adapter behind the seam, WITHOUT a rewrite** (§3). This mirrors the proven `tts.js` provider-seam pattern: feature code never changes; the engine behind it does.

**The honest hardware truth up front:** photoreal, minutes-long, broadcast-grade AI *film* is **NOT** feasible on the church's 2× RTX 4070 (12GB) today — full-quality open video models are 24GB-to-datacenter, and even quantized local gen produces ~4–5 second clips, slowly. **So we crawl in a medium that IS sovereign-feasible now** (narrated, illustrated, motion-graphic content from book/Scripture text + consented voices on current hardware) and **walk/run into true AI video as the planned bigger CUDA box (5090-class) lands and the open models mature.** The vision is real; the sequencing is honest about silicon — and because it's modular, the maturity step is an adapter swap, not a re-architecture.

**X not Y because Z:** build the pipeline **sovereign-first, modular, behind seams** — **not** a vendor-API film studio and **not** a bolted-on monolith feature — because the PoeTech thesis is sovereignty + no-extraction + scale-by-modules (DATA-AS-EMPOWERMENT-NOT-EXTRACTION; DR-0078). Vendor video APIs (Veo / Sora / Kling) are a gated, opt-in *burst lane* for non-sovereign-OK promo only — never the canonical generator of Word-grounded content.

**Five binding integrity guardrails (non-negotiable, §6):** (1) every AI-generated frame **LABELED "AI-generated"**; (2) **likeness + voice consent required** (extends voice-consent to faces; Darrell's own = consented); (3) **no deceptive realism**; (4) **child-appropriate** by default; (5) **mission-aligned** — every film screened by the theological review pipeline (souls + the Word, not spectacle).

**This doc ships:** the roadmap + a captured **vision/project card** (seed `infra/seed-data/2026-06-25-books-to-movies-vision-project.json`). No film engine is built tonight.

---

## 1. Opportunities & Constraints → How → Why-best (the decision frame)

This is the decision shape: lay out what there is to gain, what stands in the way, the phased path *through* the constraints, and why this path beats the alternatives — each ending in a recommendation.

### 1.1 OPPORTUNITIES

| # | Opportunity | Why it matters |
|---|---|---|
| O1 | **Exclusive in-app subscriber content** | Retention + revenue. A film a member can only watch *here* is a reason to subscribe and stay — the strongest non-extractive retention lever we have (content worth paying for, not dark patterns). Rides the entitlement rails already built. |
| O2 | **The Word in the most engaging medium** | **Father's Business reach.** Moving pictures reach people text and audio don't — children, the distracted, the unchurched. The most senior purpose (AI-MEDIA #6): the King is lifted up where attention actually is. |
| O3 | **The flywheel compounds** | book → movie → more engagement → more feedback → more/better content → more films. Each medium feeds the next; the corpus we already harvest becomes the fuel (§2). Compounding, not linear. |
| O4 | **Differentiation** | No mainstream faith app produces sovereign, owned, Word-grounded AI film for its members. This is a category of one — a moat made of *what we make*, not just how we price it. |
| O5 | **Sovereign / owned-IP** | Every film is the family's + church's IP, on owned infrastructure, re-mirrorable forever (Distribution Pillar 4). No platform can de-list it, demonetize it, or train on it. The asset accrues to us. |
| O6 | **Authentic source — Darrell's + the community's own content** | The films are grounded in *real* teaching, *real* testimony, *real* study (§5), not generic AI invention. Authenticity is the product; the source feeds are consented and ours. |

**Recommendation (opportunities):** the upside is real and compounding, and it lands squarely on the senior mission (souls + the Word) and the sovereign moat. **Pursue it** — deliberately, sovereign-first, as a scalable module, not a one-off.

### 1.2 CONSTRAINTS

| # | Constraint | The honest limit |
|---|---|---|
| C1 | **AI-video maturity** | Coherent, multi-minute, photoreal generated video is **not** a solved 2026 capability at our scale; open models yield short clips with quality/coherence limits (§4.1). |
| C2 | **GPU / compute cost** | Heavy. The church 2× RTX 4070 (12GB) runs short experiments only; real video-gen wants the planned bigger CUDA box (5090-class, 32GB) (§4.3). |
| C3 | **Model licensing / sovereignty** | Must stay on Apache-2.0/MIT open weights to keep canonical content sovereign; vendor APIs ship content off-box (a mission conflict) (§4.1). |
| C4 | **Production time** | Even illustrated/narrated shorts take real authoring + review time; AI generation is iterative (many discarded takes). Not free, not instant. |
| C5 | **Likeness / voice consent + AI-labeling** | Depicting a real face/voice is an impersonation surface. Consent + persistent AI-labeling are non-negotiable (§6) and add process. |
| C6 | **Content-truth fidelity** | "Based on the information of Yahweh" demands **accuracy** — no improvised theology, no fabricated-as-fact. The grounding gate is binding (§5). |
| C7 | **Cost-efficiency / unit economics** | Each film must earn its compute + time against subscriber value. Vendor per-second costs and GPU-hours have to pencil out (§4.3). |
| C8 | **Child-appropriateness** | A church serving elders and minors: safe-by-default content, no frightening photoreal depiction (§6 guardrail 4). |

**Recommendation (constraints):** none of these is a stop — each is a **phase boundary or a brake.** Sequence the build so today's work lives *inside* today's limits (C1/C2), and make the integrity limits (C5/C6/C8) structural gates, not honor-system. **Phase + brakes, don't force.**

### 1.3 HOW — the phased path *through* the constraints

The constraints map 1:1 onto the phasing (§7) and the modular seams (§3):

- **C1 (video maturity) + C2 (compute) → crawl in a feasible medium NOW, walk/run later.** Phase 1 is narrated illustrated/motion + consented voices on the 4070 (no photoreal-video dependency). Phase 2/3 add AI video *as an adapter swap behind the generation seam* when the bigger box + mature models arrive — **no rewrite** (§3.2). The module's capability scales with the silicon.
- **C3 (licensing) + C7 (economics) → sovereign-first, vendor-gated.** Apache-2.0/MIT engines on owned hardware for canonical content ($0 software, amortized capex); vendor APIs quarantined to a gated promo burst lane where the per-clip math wins and sovereignty isn't required.
- **C5 + C6 + C8 (integrity) → structural gates.** Consent is a checked registry state (no consent → no render), the AI-label is a player property (not a toggle), the theological screen is a pipeline stage with Governor sign-off. Process is enforced by the architecture, not remembered.
- **C4 (production time) → workflow, not click-labor.** Generation is an n8n pipeline over the harvest corpus (AI-FOUNDATION-INTERNAL-OPERATIONS); when batched/triggered it ships with the three brakes (budget + concurrency-lock + kill-switch), INERT until armed.

**Recommendation (how):** **adopt the crawl→walk→run phasing on the modular seams.** Each constraint is honored by *where* it sits in the path, and the modular boundaries are what make the path a smooth ramp instead of three separate builds.

### 1.4 WHY THIS IS THE BEST path (vs the alternatives)

| Alternative | Why it loses |
|---|---|
| **Vendor-API film studio (big-bang)** | Fast to a flashy demo, but ships Word-grounded content off-box (violates C3 + the mission), bills per-second perpetually (C7), and gives us no owned pipeline or IP moat (defeats O5). A rented capability, not an asset. |
| **Wait for models to mature, build nothing now** | Forfeits O1–O3 indefinitely and builds zero institutional capability. When the models *do* mature, we'd be starting cold. The crawl phase builds the pipeline, the corpus discipline, and the review muscle *now*, on hardware we have. |
| **Outsource to a faith-media SaaS** | Maximal extraction, zero sovereignty, no owned IP, content shaped by someone else's incentives. The opposite of the moat (DATA-AS-EMPOWERMENT-NOT-EXTRACTION). |
| **Build it monolithic / bolted-on** | The measured collision engine (MODULE-ARCHITECTURE-ADR): a non-modular media feature couples to everything, can't scale its capability without a rewrite, and re-implements auth/entitlement/consent N times. Fails Darrell's scalability mandate. |
| **✅ Sovereign-first, modular, phased (this path)** | Honors every constraint by sequencing + structure; captures every opportunity; scales narrated→full-film by adapter swap, not rewrite; keeps the IP + the souls-first mission. Lowest risk *because* it rides primitives the repo already has. |

**Recommendation (why-best):** **this path is the best because it is the only one that captures the upside AND respects every constraint AND scales without a rewrite.** It is sovereign, modular, phased, and mission-first — the same shape that has worked for every other PoeTech capability.

---

## 2. The flywheel extension (grounded in what already exists)

PoeTech already runs a content flywheel. Books → movies does not invent a new one — it **adds a medium to the existing harvest loop** and re-uses the same corpus.

### 2.1 What the flywheel already is (read-only, grounded)

| Stage | Where it lives | What it does |
|---|---|---|
| **Capture** | `infra/nas-sme-pipeline/` (faster-whisper INT8), n8n `wf37` | Every service / teaching / study session becomes a transcript — the raw source material. |
| **Harvest** | `app/src/lib/video-harvest.js` + `harvest-ledger.js`, Church › 🌾 Harvest | "No-video-lost": ONE transcript fans out into sermon / songs / lessons / scripture / discernment / testimony / trivia / events. `video_harvests` ledger (migration 0050) flags orphans; everything **derived, not painted**. (`[[project_video_harvest_coverage_ledger]]`.) |
| **Books** | Darrell's books / Study corpus + the Word (`[[project_poetech_study_edition]]`) | The long-form written artifacts — the *next* thing to retell in a new medium. (Lane **`local_7bcac1a3`** in Darrell's instance.) |
| **Voice** | `app/src/lib/voice-registry.js`, `voice-sync.js`, `VoiceStudio.jsx` | Consented sovereign voices (Darrell/Christina/BG), entitlement-gated, behind the `tts.js` seam. (Lane **`local_da7f0d36`**; `[[project_tts_read_aloud]]`.) |
| **Distribute** | entitlement gate (`voice-registry.js` `ENTITLEMENT`), subscriber surfaces | Subscriber-exclusive content already has rails — the same rails carry films. |

### 2.2 The extension — same corpus, new medium

```
  Word + harvest corpus + Darrell's/community's feeds        (SAME source — §5)
        │
        ▼
  BOOK / teaching / study artifact  (lane local_7bcac1a3)
        │   ── screenplay / scene-treatment pass (sovereign Ollama; §5.3)
        ▼
  SCENE TREATMENT  (storyboard + narration script + shot list)
        │   ── narration in consented voices (tts.js seam; voice lane local_da7f0d36)
        │   ── visuals: illustrated/motion NOW → AI video as compute matures (§4)
        ▼
  AI-GENERATED "MOVING PICTURE"  (labeled AI; theological review; §6)
        │
        ▼
  IN-APP EXCLUSIVE RELEASE  (subscriber entitlement; 90-day-free on-ramp; §2.3)
        │   ── feedback / loves / watch-data flow back  →  refines the next retelling
        └────────────────────────────────────────────────────────────┘  (flywheel closes)
```

**The key insight:** the film is not a *new* asset class sourced from scratch — it is the **harvest corpus rendered in motion.** A sermon already fans out into a lesson and a Scripture set; book→film simply adds "and a short narrated film" as another fan-out target of the same transcript/book. That re-uses the no-video-lost ledger discipline: a film is another derived artifact with provenance back to its source row, never painted.

### 2.3 Subscriber-exclusive distribution (the rails already exist)

The "promoted within the app EXCLUSIVELY for subscribers" requirement maps onto the entitlement model already shipped in `voice-registry.js`:

```js
ENTITLEMENT = { FREE: 'free', SUBSCRIBER: 'subscriber' };
isVoiceEntitled(voice, { subscribed, isOwner }) { ... }   // FREE always; else subscribed||owner
```

- **Films are `ENTITLEMENT.SUBSCRIBER`** by default — the same gate that protects cloned voices protects exclusive films. The owner/building-circle is always entitled (build+test); everyone else subscribes.
- **90-day-free on-ramp** — surfaced today in `About.jsx` as the trial concept; **NOTE (verify-don't-claim, DR-0076):** there is **no implemented billing/trial engine yet**. The 90-day-free + tiered-subscription rails are a dependency this roadmap rides (§8).
- **Distribution sovereignty holds (Pillar 4):** canonical home is in-app / NAS-served; YouTube/Vimeo are *mirrors for promo only*. Exclusive = genuinely in-app behind the entitlement gate.

**What this is NOT:** not a public film-release platform, not ad-supported, not engagement-optimized. Subscriber-exclusive, mission-first content on sovereign rails — the structural difference *is* the moat.

---

## 3. Module architecture & the scale path (Darrell's mandate: modules exist so scalability is built in)

Books → movies is built as a **feature module on the hybrid-modular shell** (DR-0078 / `MODULE-ARCHITECTURE-ADR.md`): a small stable core/shell (auth, role-gating, the Events spine, the design system + shared primitives, the instance-scoped sync substrate) with the media capability as an **independent module** that plugs in via the **surface-mount registry** and talks to other modules **only through core sync + typed events — never by importing their internals.** This is the named, enforced pattern; the media module conforms to it from day one.

### 3.1 The modular boundaries (four reusable seams, not one bolted-on feature)

The pipeline decomposes into four seams, each independently shippable, testable, and **reusable beyond film**:

| Seam | What it is | Reusable by | Scale behavior |
|---|---|---|---|
| **A · Media-production pipeline** | The generator, **behind a provider seam** (mirrors `tts.js`). A `mediaEngine` contract with swappable **adapters**: `NarrationStills` (P1) → `TalkingHead` (P1/2) → `VideoGen` (P2/3) → `VendorBurst` (gated). Feature code calls the contract; the adapter behind it changes. | Any future generated-media surface (explainers, marketing, lessons-as-film) | **This is the no-rewrite seam.** Richer capability = a new adapter + a flag, not new feature code (§3.2). |
| **B · In-app exclusive distribution** | The player surface — reuses the **Presenter / Lightbox shared primitives** (`[[project_universal_presenter]]`, `[[project_photo_lightbox_and_source_health]]`) wrapped in a `SectionBoundary`. A registry entry, lazy-loaded as its own chunk. | Any subscriber-exclusive media, not film-only | New media types mount via the registry; the player is generic over "a media asset + its entitlement." |
| **C · Entitlement / subscription gating** | Rides **core role-gating** + the `voice-registry.js` `ENTITLEMENT` model. Expressed as a declarative `requires: { tier, entitlement, flag }` field on the registry entry — the shell enforces it; the module never re-implements the check. | Every paid/tiered surface (the whole workflow-module-library tier system) | Tiers/trials become registry data; adding a tier = a field, not a code path. |
| **D · Voice / likeness-consent layer** | Extends `voice-registry.js` with a **likeness (face) consent kind**, same `CONSENT.{NONE..GRANTED..REVOKED}` states, scoped + revocable. A **shared consent primitive** any module checks at generation time. | Any surface depicting a real person (voice today, faces next, future avatars) | One consent registry, many consumers; "no consent → no render" is a core gate. |

**The module contract (DR-0078 §4.3):** the media surface registers as **data** —
```js
// app/src/surfaces.js
{ id: 'film-theater', label: 'Theater', nav: 'top-level',
  requires: { entitlement: 'subscriber', flag: 'film-theater' },
  boundary: true, load: () => import('./components/FilmTheater.jsx') }
```
— and reaches the harvest corpus + voice/consent registries **via core sync + typed events**, never by importing `video-harvest.js` or `voice-registry.js` internals. That boundary is the machine-checked rule (core imports no feature; features don't import each other) that keeps the module independently shippable and the lanes non-colliding.

### 3.2 The scale path — narrated → full AI video WITHOUT a rewrite

The single most important design property, per Darrell: **the same module grows; it is not rebuilt.**

```
  mediaEngine contract  (stable — feature code calls only this)
        │
        ├─ Phase 1  NarrationStills adapter   (Kokoro/Piper + FLUX/SD stills + ffmpeg motion)   ← runs on 2× RTX 4070 NOW
        ├─ Phase 1/2 TalkingHead adapter       (SadTalker/LivePortrait → MuseTalk at quality)    ← consented likeness
        ├─ Phase 2  VideoGen adapter           (Wan 2.2 / HunyuanVideo, FP8)                      ← gated on 5090-class box
        ├─ Phase 3  VideoGen adapter (4K)      (LTX-2 native 4K + audio, as it matures)           ← gated on compute + maturity
        └─ (gated)  VendorBurst adapter        (Veo/Sora/Kling — promo only, off-canonical)       ← non-sovereign, labeled
```

- **Capability maturity is an adapter swap + a feature flag**, selected by available hardware — exactly the proven `tts.js` pattern (browser TTS → sovereign Kokoro behind the same seam, no feature change). The player (B), the entitlement gate (C), and the consent layer (D) **do not change** as the generator (A) gets richer.
- **No rewrite at any phase boundary.** Moving from illustrated shorts to AI video is registering a new adapter and flipping a flag — the surface, the distribution, the gating, the consent checks, and the corpus wiring all stay put.
- **Per-module lazy chunks** (`load: () => import(...)`) mean a sovereign-mesh node or a lighter instance can ship the media module — or not — without affecting the rest (MODULE-ARCHITECTURE §6). Scale *out* (more instances/nodes) and scale *up* (richer adapters) are both built in.

**Recommendation (architecture):** **build books→movies as this four-seam feature module on the registry + Events spine from the first commit.** It costs no more than building it well once, and it is the only shape that satisfies the scalability mandate — grow the capability by swapping adapters behind stable seams, never by rewriting the feature.

---

## 4. Tech survey (cited, as-of June 2026)

The honest question: **"what can we generate, at what quality, on what hardware, under what license, how sovereign?"** Three layers — video, voice/audio, compute — each a candidate adapter behind seam A.

### 4.1 Video generation — open/self-hostable vs vendor API

#### Open-weight, self-hostable models (the sovereign lane)

| Model | License | What it is | As-of |
|---|---|---|---|
| **Wan 2.2 / 2.7** (Alibaba) | **Apache 2.0** | T2V + I2V; causal 3D VAE; **cleanest sovereign story** — multi-task, lowest VRAM, runs quantized on consumer cards. Latest self-deployable weights as of Mar 2026. | Mar 2026 |
| **HunyuanVideo 1.5** (Tencent) | Apache 2.0 (community) | Current **quality benchmark** for open video; full-attention transformer (Sora-class arch); T2V + I2V to 1080p. | 2026 |
| **LTX-2 / LTX-2.3** (Lightricks) | **Apache 2.0** (free under $10M ARR) | First open model with native **4K + synced audio** + truly open weights (training code + inference); built for fine-tuning on proprietary IP + on-prem. | LTX-2.3 released 2026-03-05 |

**The catch (VRAM honesty — the whole feasibility story):**
- **Full quality is 24GB→datacenter.** Wan 2.2 14B at FP16 with the text encoder on GPU needs **~54–65GB VRAM**. At FP8 + T5-CPU-offload it's **~14–16GB at 720p** — best consumer quality, needs a 16GB+ card.
- **On a 12GB RTX 4070** (church cards): only via **GGUF Q4_K_M + T5-on-CPU**, ~6–8GB GPU — the 14B degraded or the small 1.3B/5B variants, **~4–5s clips**, slowly (a 24GB 4090 takes 60–120s per 4-second 720p clip at 50 steps; a quantized 12GB card slower still).
- **Translation:** the 2× RTX 4070 runs *short, low-res, experimental* clips today — enough to **prototype the VideoGen adapter and learn the pipeline**, **not** to produce a polished film. That is the crawl/walk line.

#### Vendor video APIs (the optional non-sovereign burst lane — VendorBurst adapter)

Per-second / per-clip, as of April 2026 (`buildmvpfast.com/api-costs/ai-video`, `evolink.ai`):

| Model | Price | Notes |
|---|---|---|
| **Wan 2.6 (hosted)** | **$0.05/sec** | Budget king; native 1080p. |
| **Kling 3.0** | $0.10/sec | |
| **Sora 2 base / Pro** | $0.10/sec; Pro $0.30–0.50/sec ($1–5/clip) | |
| **Veo 3.1 Standard / Fast** | $0.75/sec (native 4K, best lip-sync, audio incl.); Fast $0.15/sec | Quality ceiling. |
| **Runway Gen-4.5** | ~$1.50/clip | Unlimited plan $76/mo for volume. |

A 10-second clip runs **$0.50 (Wan 2.6) → $7.50 (Veo 3.1 Standard)**. For minutes of finished film that's tens of seconds of *kept* footage after many discards — cost adds up, and **the footage leaves our network.** Verdict: **sovereign-first for canonical content; vendor APIs a gated promo burst lane only.**

#### Talking-head / portrait-animation (TalkingHead adapter — the real-people-speaking layer)

Open-source image+audio → a person speaking, 2026 (`pixazo.ai`, `lipsync.com`, `github.com/jixiaozhong/Sonic`): **SadTalker** (single photo + audio, light), **LivePortrait** (emotion-aware), **MuseTalk** (near-photoreal, top open quality 2026), **Sonic** (CVPR 2025, ComfyUI), **Wav2Lip** (baseline). Lighter than full video-gen (run on the 4070) — the bridge between illustrated narration and a consented person on screen. **Exactly where the likeness-consent guardrail (§6.2) binds hardest;** Darrell's own consented likeness is the safe first subject.

### 4.2 Audio / voice — the Voicebox lane (`local_da7f0d36`)

Evaluated in depth: `docs/99-session-notes/2026-06-24-voicebox-sovereign-voice-layer-research-review.md` (`[[project_tts_read_aloud]]`). For film: **narration rides the `tts.js` provider seam** — sovereign Kokoro/Piper (synthetic, no consent) for general narration; **consented cloned voices** (Darrell/Christina/BG, building-circle consent recorded 2026-06-24) for in-voice narration, **always labeled "AI-generated voice."** The voice consent model (`voice-registry.js`: `KIND.PERSONAL`, `CONSENT` states, scoped + revocable) is seam D, extended verbatim. Music/score: open music-gen on the GPU box, deferred to walk/run.

### 4.3 Compute reality (the gating constraint — honest)

| Hardware | Status | What it can do for film |
|---|---|---|
| **Church 2× RTX 4070 (~12GB, TO CONFIRM)** | Available now; one freed by retiring ProPresenter (`[[project_presenter_replaces_propresenter]]`) | **NOW:** narration (Kokoro/Piper), talking-head (SadTalker/LivePortrait), short quantized video-gen *experiments* (~4–5s). **NOT:** multi-minute photoreal film. |
| **Planned bigger CUDA box (5090-class, 32GB; `LOCAL-LLM-HARDWARE-RECOMMENDATION.md`)** | Planned, **TO CONFIRM** spec/timeline | Walk/run: FP8 14B at 720p, longer clips, MuseTalk at quality, local music-gen. The ceiling-remover. |
| **Vendor APIs** | Available, gated | Burst lane for non-sovereign promo only. |

**Cost-efficiency screen (standing format):** software is **$0** (Apache-2.0 / MIT) on hardware we own or plan; recurring cost is **power + the GPU-box capex** ($3–5K one-time per the AI-MEDIA vision, amortized over 12–24 months) — vs a vendor stack billing per-second **perpetually** *and* shipping Word-grounded content off-box. Sovereign-local wins on cost *and* principle for canonical content; vendor wins only on a per-clip promo where speed/quality justifies the spend and sovereignty isn't required. **Unit-economics rule (C7):** a film's compute+time must earn its subscriber value; the crawl phase keeps unit cost near-zero (existing hardware) while the audience and the value are proven.

**Sovereign-mesh-compatibility screen (standing format):** open models are CUDA-native and run on existing LAN/Tailscale boxes with **no public surface** — same posture as the NAS sovereign surfaces. Generation is **workflow, not click-labor** (AI-FOUNDATION-INTERNAL-OPERATIONS): an n8n pipeline takes book/transcript → treatment → narration → frames → assembled film → review queue. Air-gappable end-to-end. The per-module lazy chunk (§3.2) lets a mesh node ship the media module selectively. Vendor APIs are the *only* part that breaks the mesh — exactly why they're quarantined to the gated promo lane.

---

## 5. Content grounding — "based on the information of Yahweh"

The films are grounded in **the Word + real human truth feeds** — that grounding is the product, enforced structurally.

### 5.1 The Word as primary source

The canonical text base is the **PoeTech Study Edition** (`[[project_poetech_study_edition]]`) — public-domain WEB+KJV verbatim, with the ownable clarification layer kept *structurally separated and machine-checked.* A film grounded in a passage cites it; Scripture shown follows `SCRIPTURE-REFERENCE-STANDARD.md` (ESV primary, fetched-not-from-memory). **No improvised theology** (CLAUDE.md "Source of Answers" + theological-review Pillar 3): every frame is screened against THE-WAY / MIND-OF-CHRIST / the Worldview; typographic theology binds all generated text + on-screen titles.

### 5.2 Real human content feeds

- **Darrell's feeds** — his books, Study/Yahweh discussions (`[[project_darrells_study_yahweh_source]]` — "His opinion IS wealth"), his teaching. *Consented by definition* (his own); the richest, most-grounded source.
- **The community's feeds** — BG's messages, choir, testimony, the harvest corpus — **consent-gated** (a testimony becomes film only with the speaker's consent; §6.2).
- **The harvest corpus** (`video-harvest.js`) is the connective tissue: a film draws from real rows with provenance, never a hallucinated source — **reality-trace discipline (P15)** applied to film: name the real source row before a frame generates.

### 5.3 How the corpus drives *realistic, truthful* content

1. **Sovereign LLM (Ollama) does the screenplay/treatment pass** over the real source, constrained to it — it *adapts*, does not invent doctrine (same posture as `[[project_sme_video_to_spec_pipeline]]`).
2. **Truthfulness is a gate, not a vibe:** the theological-review pipeline + Religion-AND-Relationship test + the Test (Phil 4:8) screen every treatment *before* a frame is generated — cheaper to catch drift in a script than in rendered footage.
3. **"Realistic" means truthful-and-excellent, not photoreal-at-any-cost.** Early films are realistic in *grounding* (true to the Word + the real human source) even when the *medium* is illustrated/motion. Photorealism is phase-3; truthfulness is phase-1.

---

## 6. Integrity guardrails (BINDING — bright lines, not polish)

These extend the voice-consent guardrails (Voicebox §6) from voices to **faces, likeness, and full films.** Senior to convenience and to model capability.

1. **AI-generated film is ALWAYS LABELED "AI-generated."** Visible, persistent label on any generated film and its in-app surface. No exceptions for "it's obviously stylized." (Extends Voicebox guardrail 2; enforced as a player property of seam B.)
2. **LIKENESS + VOICE consent is REQUIRED.** No realistic depiction of a *real person's* face or voice — animated, cloned, rendered — without **explicit, written, scoped, revocable consent** (extends voice-consent to faces; QUALITY-OF-LIFE; COMMUNITY-FIRST-MISSION; VISION-FAIRNESS posture). **Darrell's own likeness + voice = consented.** The building circle's *voices* are consented for build+test (2026-06-24); **likeness consent is a separate, additional grant**, not assumed from voice consent. Any congregant/minor/non-circle person: default **don't**; a minor's likeness needs guardian consent + child-safety care. (Enforced as seam-D registry state: `CONSENT != GRANTED` → cannot render.)
3. **NO deceptive realism.** Never depict a real person saying/doing what they didn't; never present generated footage as documentary/historical *fact*; no fabricated "BG said…". Dramatized/illustrated *Scripture* and *intended* teaching is fine **when labeled**; impersonation and fabricated-as-real is the absolute line (Exodus 20:16). (Extends Voicebox guardrail 3.)
4. **CHILD-APPROPRIATE by default.** Safe-by-default for a church with elders and minors; no violence/horror realism, no frightening photoreal depiction, age-appropriate framing of hard biblical content.
5. **MISSION-ALIGNED — souls and the Word, not spectacle.** Every film passes the senior Kingdom question (AI-MEDIA #6) + the theological-review pipeline (Pillar 3) + the Test (Phil 4:8) before publish. Spectacle, vanity, engagement-bait fails the gate.

**Enforcement (DR-0076):** not honor-system. The label is a structural property of the player (seam B); consent is a registry state checked at generation time (seam D — `CONSENT != GRANTED` cannot be rendered); the theological screen is a pipeline stage with Governor / Quality-Gatekeeper sign-off. Every "a-human-would-have-known" failure becomes a machine check.

---

## 7. Phasing — crawl → walk → run (honest about hardware/model gating)

The vision is real; the sequencing respects the silicon. **Doable NOW** vs **gated** is explicit. Each phase is an **adapter behind the stable seams** (§3.2), not a separate build.

### Phase 0 — Foundation (NOW; no new film engine)
This doc + the vision/project card (seed `2026-06-25-books-to-movies-vision-project.json`) — the thing-to-build-toward is captured in the Projects hub. **No build effort sunk** beyond the seams already shipped. Decision captured: sovereign-first, modular, vendor-gated, five guardrails binding.

### Phase 1 — CRAWL: narrated illustrated/motion content (NOW, on 2× RTX 4070)
**Doable now. NarrationStills (+ optional TalkingHead) adapter; no photoreal video; no new hardware.** A book passage / Scripture / teaching → sovereign-Ollama treatment → **narration in a consented voice** (`tts.js` seam) → **illustrated stills + motion graphics + animated text** (FLUX/SD + ffmpeg) → assembled short (3–5 min) → **labeled, theological-screened, subscriber-exclusive in-app player.** Optional: **talking-head narration of Darrell's own consented likeness** (SadTalker/LivePortrait) as the safest first "real person on screen." **Gate:** the in-app exclusive player (seam B) + the subscription/90-day-free entitlement engine (§8).

### Phase 2 — WALK: short AI video clips woven in (GATED on the 5090-class box)
**VideoGen adapter swapped in** when the bigger CUDA box (32GB) lands: FP8 Wan 2.2 14B / HunyuanVideo at 720p for **short generated shots (4–10s)** woven into the illustrated base — establishing shots, b-roll, dramatized fragments. **MuseTalk-quality** talking-head; local music-gen for score; ComfyUI assembly. No surface/distribution/gating/consent rewrite — the seams hold.

### Phase 3 — RUN: richer AI film (GATED on model maturity + compute)
Longer, coherent generated sequences; higher resolution (LTX-2 4K + native audio as it matures on owned hardware); a real film, sovereignly produced. Vendor-API burst only where a specific *promo* clip's cost/quality/speed wins and sovereignty isn't required (gated, labeled, never canonical).

**Standing re-review (DR-0075):** Phase 2/3 carry a re-review trigger = **"when the bigger CUDA box stands up AND a sovereign video-gen clip clears a real quality bar on a real device"** (verify-don't-claim). Until then Phase 1 is the live lane; the rest is roadmap.

---

## 8. Dependencies (what this rides on — honest)

| Dependency | State | Seam | Gates phase |
|---|---|---|---|
| **In-app exclusive media player** | **Not built** — new surface (reuse Presenter/Lightbox + entitlement gate) | B | 1 |
| **90-day-free + tiered subscription / billing engine** | **Not implemented** (concept in `About.jsx`; entitlement *model* exists, no billing) | C | 1 |
| **Likeness-consent registry** (faces, mirroring voice registry) | **Not built** — required before any real face renders | D | 1 (talking-head) / 2 |
| **Surface-mount registry (`surfaces.js`)** | Decided (DR-0078), **post-conference** infra step | core | 1 (mount path) |
| **Bigger CUDA box (5090-class, 32GB)** | **Planned, TO CONFIRM** | A | 2/3 |
| **Theological-review pipeline as a gated stage** | Partially conceptual (Pillar 3) | — | 1 publish gate |
| **Harvest corpus film-fanout target** | Harvest exists; "short film" as a fan-out target is new | A | 1 |
| Sovereign voice layer (Kokoro/Piper behind `tts.js`) | Evaluated, pilot-ready (`[[project_tts_read_aloud]]`) | A | 1 |

**None built tonight.** This roadmap names them so Phase 1, when greenlit, starts from a true map.

---

## 9. Standard screens

- **Religion check (backbone):** films lift up the King and carry the Word (AI-MEDIA #6); Scripture-grounded, no improvised theology, typographic theology binding; truthful representation — no false witness via fabricated face/voice (Exodus 20:16).
- **Relationship check (warmth):** a child or elder *seeing and hearing* a biblical truth come alive in a warm, consented, family voice — accessibility + discipleship made vivid, meeting people where they are.
- **The Test (Phil 4:8):** TRUE (claims cited, hardware limits stated honestly, no feasibility over-claim), HONORABLE (consent + labeling protect dignity), JUST (no extraction, no deception, sovereign), PURE (child-appropriate, no spectacle-lust), LOVELY/COMMENDABLE (the Word made vivid), EXCELLENT (sovereign + modular + free where it counts), PRAISEWORTHY (lifts family AND community, creates rather than extracts).
- **Perpetual improvement (DR-0075):** Phase 1 is the live lane; Phase 2/3 carry the explicit re-review trigger (bigger box + a verified quality bar) — nothing parked silently.
- **Three-brakes (autonomous automation):** when the generation pipeline becomes a triggered workflow (overnight batch render), it ships with budget + concurrency-lock + kill-switch (`[[feedback_autonomous_automation_three_brakes]]`), INERT until armed with someone watching — render farms are exactly the runaway-compute class the 2026-06-06 incident warned about.
- **Reality-trace (P15):** every film names its real source row (a real passage / sermon / testimony) before a frame generates; a film with no traceable source does not ship.
- **Module-boundary (DR-0078 / DR-0076):** the media module imports no other module's internals (talks via core sync + events); the import-direction boundary is the machine-checked gate that keeps it independently shippable and the lanes non-colliding.

---

## 10. Recommendation (decision)

**Adopt books → movies as the named next medium on the existing flywheel — built as a scalable feature module, sovereign-first, phased — and build NOTHING tonight beyond capturing the vision.**

- **Vision ratified** as the concrete book→film extension of `AI-MEDIA-PRODUCTION-PLATFORM-VISION.md`.
- **Modular by mandate (§3):** four reusable seams (media-production pipeline / exclusive distribution / entitlement gating / voice-likeness consent) on the hybrid-modular shell (DR-0078). The same module scales narrated → full AI video by **adapter swap behind stable seams — no rewrite.**
- **Sequencing honest (§7):** Phase 1 (narrated illustrated/motion + consented voices) is doable NOW on the 2× RTX 4070; true AI *video* is gated on the bigger CUDA box + open-model maturity. No over-promise of photoreal film on 12GB cards.
- **Five guardrails binding (§6)** from the first frame, enforced structurally.
- **Vendor APIs** a gated, opt-in promo burst lane only; canonical Word-grounded content generated sovereignly.

**Build-it-in-the-app default (Layer 0):** when Phase 1 is greenlit, the surface is an **in-app subscriber-exclusive film player** (Presenter/Lightbox primitives + entitlement gate, registered in `surfaces.js`), and generation is an **n8n workflow** over the harvest corpus — where the user lives, on sovereign rails.

**Next concrete step (for the orchestrator to schedule, NOT blocking, NOT tonight):** a Phase-1 spike — one real book/Scripture passage → sovereign Ollama treatment → Kokoro narration → FLUX stills + ffmpeg motion → a single 3–5 min labeled short, behind a feature-flagged in-app player (the `NarrationStills` adapter behind seam A), reviewed by the theological screen — to verify the pipeline end-to-end on a real device (DR-0076) before any subscriber-facing release.

---

## 11. Sources (verified June 2026)

**Tech survey (external, cited with as-of dates):**
- Open video models / licensing — `pixazo.ai/blog/best-open-source-ai-video-generation-models`, `hyperstack.cloud/blog/case-study/best-open-source-video-generation-models`, `ltx.io/model/open-source` (LTX-2.3 Apache-2.0, 2026-03-05, 4K+audio open weights), Wan 2.2/2.7 + HunyuanVideo 1.5 Apache-2.0 (Mar 2026).
- VRAM / consumer feasibility — `willitrunai.com/blog/wan-2-2-vram-requirements`, `runaihome.com/blog/wan-video-local-ai-gpu-guide-2026`, `wan27.org/blog/wan-2-2-requirements-guide`, `medium.com/@ttio2tech_28094` (HunyuanVideo on 10–12GB): 14B FP16 ~54–65GB; FP8+T5-offload ~14–16GB@720p; GGUF Q4 ~6–8GB on 12GB; 4090 24GB ~60–120s/4s-clip@720p.
- Vendor API pricing (Apr 2026) — `buildmvpfast.com/api-costs/ai-video`, `evolink.ai/blog/best-ai-video-generation-models-2026-pricing-guide`, `veo3ai.io/blog/veo-3-pricing-2026`: Wan 2.6 $0.05/s, Kling 3.0 $0.10/s, Sora 2 $0.10/s (Pro $0.30–0.50/s), Veo 3.1 Standard $0.75/s.
- Talking-head / lip-sync (open, 2026) — `pixazo.ai/blog/best-open-source-lip-sync-models`, `lipsync.com/blog/open-source-lip-sync`, `github.com/jixiaozhong/Sonic` (CVPR 2025): SadTalker, LivePortrait, MuseTalk, Sonic, Wav2Lip.

**Repo grounding (internal, file-cited):**
- `docs/00-foundations/_root/AI-MEDIA-PRODUCTION-PLATFORM-VISION.md` (the senior media vision).
- `docs/00-foundations/MODULE-ARCHITECTURE-ADR.md` + `docs/decisions/DR-0078-hybrid-modular-shell-plus-feature-modules.md` (the hybrid-modular shell + feature-module contract + surface registry + Events spine + scale-to-wider-system).
- `app/src/lib/video-harvest.js` + `harvest-ledger.js` (the no-video-lost flywheel; `[[project_video_harvest_coverage_ledger]]`).
- `app/src/lib/voice-registry.js` (`ENTITLEMENT`, `CONSENT`, `KIND` — seams C + D), `voice-sync.js`, `VoiceStudio.jsx`, `infra/nas-sme-pipeline/intake-voice-clone-CONSENT.md` (building-circle voice consent, 2026-06-24).
- `app/src/lib/tts.js` (the provider-seam pattern seam A mirrors), `docs/99-session-notes/2026-06-24-voicebox-sovereign-voice-layer-research-review.md`.
- `app/src/components/Presenter.jsx` + `lib/presentable.js` (`[[project_universal_presenter]]`), the shared Lightbox (`[[project_photo_lightbox_and_source_health]]`) — seam B primitives.
- `infra/seed-data/2026-05-25-projects.json` (the project-card seed shape this vision card mirrors), `app/src/lib/project-management.js` (eternal-stage lens).
- `app/src/components/About.jsx` (90-day-free / subscriber concept — NOT an implemented billing engine; §8 dependency).
- `docs/00-foundations/LOCAL-LLM-HARDWARE-RECOMMENDATION.md` (the planned 5090-class box; spec/timeline TO CONFIRM).

---

*Layer 4 working artifact. No film engine built; this is the eval + roadmap that names the path, the modular boundaries, and the scale-without-rewrite design, and captures the vision/project card. Phase 1 (narrated illustrated/motion + consented voices) is doable now on the 2× RTX 4070; true AI video is gated on the bigger CUDA box + open-model maturity — and because the pipeline is modular, that step is an adapter swap behind stable seams, not a rebuild. The five integrity guardrails — label, likeness+voice consent, no deception, child-appropriate, mission-aligned — are binding from the first frame.*
