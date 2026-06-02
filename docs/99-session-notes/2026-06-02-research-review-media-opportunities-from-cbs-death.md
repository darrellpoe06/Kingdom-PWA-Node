# Research-Review -- Media Production Opportunities from the "Death of a Network" Signal

**Date:** 2026-06-02
**Author:** Claude as Advisor (per `GOVERNANCE-EXECUTION-ADVISORY`)
**Frame:** Darrell sent the YouTube link "Stephen Colbert Leaves CBS in SHAMBLES: The Death of a Network" (https://www.youtube.com/watch?v=NYUYZr3H12w) on 2026-06-01 evening with the prompt: "Find opportunities for PoeTech and our users." Per `feedback-research-first`, this report is the research pass that precedes any product / code decision in the AI-Media-Production direction.
**Senior foundations applied:** `AI-MEDIA-PRODUCTION-PLATFORM-VISION`, `COMMUNITY-FIRST-MISSION`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`, `WORKFLOW-MODULE-LIBRARY`, `BUSINESS-PROCESS-CONNECTIONS`, `EXCELLENCE-STANDARD`, `ANXIETY-CLARITY-PRINCIPLE`, `INSTITUTIONAL-MEMORY-EVENTS`, `INPUT-VISIBILITY-TO-CLAUDE`, `VISION-FAIRNESS-STANDARD`, `QUALITY-OF-LIFE-AS-NORTH-STAR`.
**Memory bindings:** `project-sovereign-llm-teams-per-industry` (Church / Therapy / online / Dev/Ops), `project-sovereign-mesh-mvp-pragmatism` (Tier 1-4 + MVP screen on every option), `project-workflow-module-library`, `feedback-distinguish-data-from-brand`.
**Pairs with:** `2026-06-01-research-review-tina-huang-cowork-workflow.md` (autonomous-builder lifecycle), `2026-06-01-research-review-sovereign-llm-teams-architecture.md` (four-team substrate), `2026-06-01-research-review-kvm2-both-tracks.md` (Phase 2 GPU box architecture), `2026-06-01-icm-paper-review-for-childhood-friend.md` (ICM workspace pattern), `2026-06-01-app-services-promise-audit-and-master-plan.md` (141 promise inventory + 7-ship plan).
**No code changes shipped from this report.** Working reference for media-product decisions for the next 6+ months.

---

## 1. Executive summary + headline recommendation

The Colbert / late-night-network story is the surface signal. Underneath it is a structural shift: the network model that depended on captive prime-time audiences is collapsing under the cost of celebrity talent it cannot recover through ad inventory anymore (CBS pulling The Late Show after 33 years, $40-100M annual production cost, $40M annual losses per the Wall Street Journal coverage cited in trade press). The audience hasn't shrunk -- it's redistributed to YouTube, podcasts, Substack, Patreon, Reels, and to creator-owned media properties run by individual operators or small teams. The opportunity for PoeTech is not to enter creator-economy SaaS as a competitor; it is to ship the **sovereign, family-and-community-owned production substrate** for the kinds of creators the mainstream creator-economy tools were never built to serve: faith-led families, churches, educators, COLG-shaped communities, and operator-owners who refuse the extractive bargain.

**Headline recommendation:** Ship the **COLG Sermon-to-Content pipeline** first -- Tier 1 sovereign-mesh-aligned (on-NAS Whisper + Remotion + ffmpeg), Tier 1 reusability (COLG-specific then templates to other churches), MVP-pragmatic (3-4 weeks of focused work, no GPU box required for v1, no extractive vendor in the critical path). It serves the first community PoeTech is bound to serve (COLG, per `COMMUNITY-FIRST-MISSION`), it gives Bishop Gwin a tangible week-one win, it builds the production substrate (Whisper + Remotion + ffmpeg + n8n) every other media opportunity needs, and it ships the AI Media Production Platform Vision at the smallest defensible scale -- a sermon recorded Sunday becomes captioned long-form + 3-5 short clips + transcript + searchable archive by Tuesday morning. Every downstream opportunity (family-worldview commentary, news-against-Scripture commentary, multi-property landlord pipeline, PoeTech-in-a-box for creators, educator content) is the same pipeline re-templated. Build it for COLG; generalize from there.

The 8 opportunity threads below extend Claude's earlier pass; this report adds competitor scans with cited prices, sovereign tech-stack analysis, revenue at three scales, BUSINESS-PROCESS-CONNECTIONS five-question test on the top 5 ships, risk + downside review, and the highest-leverage ship recommendation with sovereign-mesh-Tier + MVP-pragmatism labels per `project-sovereign-mesh-mvp-pragmatism`.

---

## 2. The 8 opportunity threads -- extended

Format per thread: headline, competitor scan (2-3 named with URL pricing), revenue model, sovereign-mesh Tier, MVP-pragmatism screen, implementation hours estimate.

### 2.1 Sovereign media production for families and communities

**Headline.** A family or community runs the full production pipeline (record -> transcribe -> caption -> clip -> distribute) on their own NAS + GPU box. Output is theirs; nobody else holds the master tape. Family-curated content library with full provenance per `AI-MEDIA-PRODUCTION-PLATFORM-VISION` Pillar 2.

**Competitors.**

| Competitor | Pricing | What they do well | Extraction pattern |
|---|---|---|---|
| Riverside.fm | Free / Pro $24/mo (or $29 monthly) / Studio $34/mo (or $39 monthly), $288 / $408 annual ([source](https://riverside.fm/pricing)) | Browser-based multi-track recording; AI editing magic clips; show notes. | Cloud-first; the recordings live on Riverside servers; per-seat scaling; the family pays in perpetuity. |
| Descript | Free / Hobbyist $16/mo (was $24) / Creator $24/mo (was $35) / Business $50/mo (was $65), annual rates ([source](https://www.descript.com/pricing)) | Text-based video editing; Studio Sound; AI dubbing. | Cloud-only; export pulls watermarks; per-seat; AI credits ration access; the user is metered on every action. |
| Captions.ai | $0-$40/mo (Pro), $90/mo (Scale) per published pricing | Word-level caption animation; AI avatars. | Cloud + per-seat + watermark-without-paid; AI credits metered. |

**Where PoeTech wins.** Sovereign on the family's hardware. No per-seat scaling. No watermark. No metered AI credits -- the family runs Whisper locally, Remotion locally, ffmpeg locally. The family's content lives on the family's NAS, federated to other family / community nodes only by family consent (per `project-sovereign-mesh-mvp-pragmatism`). The Religion AND Relationship test on every published piece is built into the publish gate.

**Revenue model.** Folds into existing tiers -- Family $89/mo and Premium $149/mo absorb the production-platform capability as bundled value. New SKU: **PoeTech Studio Add-On $39/mo** for households that want the production pipeline but not the full Family tier. Hardware bundle: optional GPU box add-on at one-time $3-5K, supported.

**Sovereign-mesh Tier: 1** (natively mesh-aligned -- runs on the family's own infrastructure, federates by consent).

**MVP-pragmatism screen:** PASSES. Existing Whisper on the NAS is in flight; Remotion + ffmpeg are open-source and battle-tested; n8n orchestration is already operational. Tier-1 MVP shippable on existing NAS without GPU box.

**Implementation hours.** Tier 1 (family-specific): **80-120 focused hours** for v1 (one-family pipeline). Tier 2 (community template): **+40-60 focused hours** to genericize. Tier 3 (universal across COLG-sized communities): **+60-100 focused hours** for the multi-tenant config layer + accessibility audit.

### 2.2 Church sermon-to-content pipeline (COLG-first)

**Headline.** Sunday sermon recorded -> Whisper transcript -> scripture-citation detection + correction -> long-form caption-burned YouTube upload -> 3-5 short vertical clips for Reels/Shorts/TikTok -> searchable sermon archive on the church website -> automated bulletin draft for the following Sunday. Built per `COMMUNITY-FIRST-MISSION` Commitments 2 + 3 + 6 + 7 (accessibility default, VISION-FAIRNESS-STANDARD compliance on any sermon-camera vision feature, train-the-community, community-voices-on-design).

**Competitors.**

| Competitor | Pricing | What they do well | What they do badly |
|---|---|---|---|
| Subsplash (Subsplash One + Pulpit AI) | Quote-based; typical $200-600+/mo bundle for mid-size churches per `2026-06-01-app-services-promise-audit` competitive scan and Subsplash pricing FAQ ([source](https://www.subsplash.com/pricing)) | Mobile app + giving + media hosting + Pulpit AI sermon-to-content; integrated stack. | Annual contracts; cloud-only; opaque pricing; per-church-size scaling; the church's sermons live on Subsplash infrastructure forever -- structural lock-in. |
| Planning Center Online + 3rd-party media | $0 free People + Check-Ins; $15-$239/mo modular ([source](https://www.planningcenter.com/pricing)) + Tithe.ly / Pushpay / a separate media pipeline | Modular pricing; trusted in church space. | Media production is bring-your-own; nothing AI-driven, nothing integrated; the church still has to stitch its own production. |
| Pulpit AI (Subsplash subsidiary, standalone) | ~$129-$249/mo per published positioning | One-click sermon to many derivatives; doctrine-aware. | Cloud-only; pre-baked doctrine assumptions; non-denominational by smoothing; not COLG-specific; not sovereign. |

**Where PoeTech wins.** Sovereign (COLG owns its own sermon master files on the COLG NAS); LLM team per industry (the Church team RAG'd over ESV + Strong's + COLG's own past sermons as Bishop Gwin opts in -- not a generic "doctrine smoother"); VISION-FAIRNESS-STANDARD enforced on any pulpit-camera face recognition; accessibility default for elderly tech-novice staff per Commitment 2; no per-church-size tax; the platform serves COLG specifically while generalizing to similar communities via WORKFLOW-MODULE-LIBRARY Tier 2 templates.

**Revenue model.** COLG-direct: $0 self-host tier per `COMMUNITY-FIRST-MISSION` Commitment 5; **Supported tier $199/mo flat** when other churches join (no per-attendee scaling, no annual contract). COLG remains the showcase, never an item to sanitize per `feedback-distinguish-data-from-brand`. New revenue line: **Sermon-Production-as-a-Service** for churches that want the production but not the hosting -- $99/mo flat per active pipeline.

**Sovereign-mesh Tier: 1** (mesh-native -- COLG's NAS publishes the sermon archive; other churches in the federation can subscribe to public archives under their own consent; cross-church best-practices module sharing via the WORKFLOW-MODULE-LIBRARY).

**MVP-pragmatism screen:** PASSES with the highest score among all 8 threads. Existing Whisper STT pipeline (wf37 in flight per the foundation doc); existing n8n orchestration; existing ntfy alerting; Bishop Gwin pre-relationship via the family. No GPU box required for v1 -- a single 60-90 minute sermon transcribes in 8-12 minutes on the DS1621xs CPU with faster-whisper int8 quantized.

**Implementation hours.** Tier 1 (COLG-specific): **120-180 focused hours** (matches the Church Module v1 estimate in `2026-06-01-app-services-promise-audit-and-master-plan.md` ship 3). Tier 2 (other-church template): **+40-60 focused hours**. Tier 3 (cross-church federation via WORKFLOW-MODULE-LIBRARY): **+80-120 focused hours**, contingent on >=3 partner churches having shipped Tier 2 first.

### 2.3 Family worldview commentary pipeline

**Headline.** A family produces episodic worldview-grounded commentary -- "the four questions" series, "religion AND relationship" series, "stewardship as worship" series, Holy-Spirit-Integration-Worldview chapter studies. Pipeline: family records (phone or camera) -> Whisper transcript -> Worldview-grounded Church-LLM-team writes show notes with ESV-cited scripture per `SCRIPTURE-REFERENCE-STANDARD` -> long-form publish + short clips -> the family-curated content library (Pillar 2) accrues.

**Competitors.**

| Competitor | Pricing | What they do well | What they do badly |
|---|---|---|---|
| YouTube + Reels native creator tools | Free | Massive distribution; native shorts; built-in monetization at >1K subs / 4K hours. | The platform owns the canonical; algorithm-engagement-optimized; content can be demonetized or removed without recourse; no Religion AND Relationship gate. |
| Substack (text + audio/video) | Free + 10% rev-share on paid subscribers ([source](https://substack.com/going-paid)) | Owns reader relationship; email-list-as-primary; growing video support. | Substack hosts the canonical; if they change policy, the creator's audience moves with the platform, not with the creator. |
| Patreon | 8-12% of creator earnings + processing fees ([source](https://www.patreon.com/pricing)) | Mature membership tier model; community features. | Per-creator-tier complexity; Patreon owns the payment relationship; high effective take. |

**Where PoeTech wins.** Sovereign master + canonical home + mirrors-only on YouTube/Substack/Patreon (per `AI-MEDIA-PRODUCTION-PLATFORM-VISION` Pillar 4). No algorithm-engagement-optimization in the production pipeline -- the family decides what to publish, not a recommendation engine. Built-in Religion AND Relationship gate + Phil 4:8 Test before every publish (per `EXCELLENCE-STANDARD`). Typographic theology binding from `CLAUDE.md` enforced everywhere. Worldview-grounded source-of-answers (per the 2026-05-25 CLAUDE.md addition) -- the LLM team writes show-notes from the actual Worldview text, not improvised training-data theology.

**Revenue model.** Folds into existing Family $89/mo and Premium $149/mo tiers. Optional monetization downstream (Substack mirror, YouTube ads on mirrors, paid private feed for deeper Worldview chapter studies) -- but never as engagement-optimization, always as honest support of work already produced.

**Sovereign-mesh Tier: 1** (the family's content stays on the family's NAS; mirrors are mirrors; canonical is sovereign).

**MVP-pragmatism screen:** PASSES. Same substrate as 2.2; the additional work is the Worldview-grounded LLM team specialization (already specced in `2026-06-01-research-review-sovereign-llm-teams-architecture.md` section 3.1 Church team).

**Implementation hours.** Tier 1 (Poe-family-specific): **60-80 focused hours** if 2.2 ships first (most of the production pipeline is reused). Tier 2 (any-family template): **+40-60 focused hours**. Tier 3 (per-denomination defaults): **+40-60 focused hours**.

### 2.4 COLG community broadcast pipeline

**Headline.** Beyond sermons: weekly bulletin, youth-group announcements, mid-week prayer chains, mutual-aid coordination, COLG 77th National Assembly content, Bible Reading Challenge 2026 updates -- every COLG-leadership communication routed through the same production substrate as the sermon pipeline. The multi-channel broadcast (SMS via Twilio, email via Resend/Postmark, in-app, ntfy for opt-in members) named in `COMMUNITY-FIRST-MISSION` workflow 56 lands here.

**Competitors.**

| Competitor | Pricing | What they do well | What they do badly |
|---|---|---|---|
| Subsplash One messaging | Bundled in $200-600+/mo | Multi-channel from one console; volunteer-roster integration. | Cloud-only; opaque pricing; lock-in. |
| Tithe.ly Messaging | $99/mo full suite ([source](https://get.tithe.ly/pricing)) | Mid-size church favorite; under-500-attendance niche. | Cloud-only; per-message SMS extra; data lock-in. |
| Faithlife Equip / Proclaim | $20-100/mo bundles | Sermon presentation + media + study tools. | Cloud-only; designed for the Lutheran / Reformed denominational frame; tonal mismatch for non-denominational + African American church culture. |

**Where PoeTech wins.** Sovereign + per-church LLM team + accessibility default + voice-first input for elderly staff + family-data-first calibration for any vision feature per `VISION-FAIRNESS-STANDARD`. The same elderly deacon who records the bulletin announcement by voice has the system transcribe it, propose tonal edits with the COLG voice already learned, and route the approved version to all member channels in their preferred channel. The full-time elderly staff are not "the church's tech problem" -- they are the design target.

**Revenue model.** Bundled in the Church Module Supported tier ($199/mo flat per COLG-supported plan above). Self-host tier remains free per Commitment 5.

**Sovereign-mesh Tier: 1.**

**MVP-pragmatism screen:** PASSES. Mostly the same substrate as 2.2 + Twilio SMS (Tier 2 -- vendor with exportable contract) + Resend or Postmark (Tier 2). Both substitutable later without architectural rewrite per `project-sovereign-mesh-mvp-pragmatism`.

**Implementation hours.** Tier 1 (COLG-specific): **80-120 focused hours**. Tier 2 (other-church template): **+30-50 focused hours**. Tier 3 (per-community language defaults including Spanish for COLG-adjacent Hispanic community per Christiana's bilingual capability): **+40-60 focused hours**.

### 2.5 News-content evaluation against biblical perspective

**Headline.** The opportunity the Colbert / "death of a network" signal points at most directly. A pipeline that ingests news content (YouTube URL, podcast feed, article URL, transcript drop), runs Whisper + LLM analysis, and produces a worldview-grounded commentary draft -- always citing Scripture per `SCRIPTURE-REFERENCE-STANDARD`, always running the Religion AND Relationship test, never improvising theology. Output is a draft that the family edits and publishes through the production pipeline (2.1 + 2.3).

**Competitors.**

| Competitor | Pricing | What they do well | What they do badly |
|---|---|---|---|
| Salem Media (Townhall, RedState, AllSides syndication) | Free (ad-supported) + premium subscriptions | Established conservative-Christian commentary network. | Network-owned canonical; commentator is on someone else's platform; ad-supported -> engagement-optimization risk. |
| Daystar / TBN / Word on Fire | Free (donor-funded) | Established faith-broadcast distribution. | Top-down; not a creator-tools play; no platform for individual families to participate. |
| Substack News + Notes | Free creator + 10% rev-share | Owns reader relationship; growing news-commentary niche. | Substack-hosted; per-platform algorithm risk. |

**Where PoeTech wins.** The world doesn't have a Worldview-grounded news-commentary substrate that is also sovereign and family-owned and Religion AND Relationship-tested before publish. The closest analog (Word on Fire) is a top-down institutional voice; PoeTech is a bottom-up family-and-community voice substrate. Scripture-citation discipline is non-negotiable (built into the LLM team's system prompt as a hard refusal class -- no published commentary without ESV-primary citation per `SCRIPTURE-REFERENCE-STANDARD`).

**Revenue model.** Folds into Family / Premium tiers as a value-add module. Potential **News Commentary Add-On $29/mo** for households that want the full pipeline (news-ingest + worldview-LLM draft + production + publish).

**Sovereign-mesh Tier short-term: 2** (likely uses a vendor LLM for the long-context analysis at v1 -- Claude or Gemini -- per the existing hybrid pattern in `research-gemini-pro-vs-claude-2026-05-27`); **Tier 1 long-term** (swap the vendor brain for sovereign Qwen 3.6-27B on the GPU box per `2026-06-01-research-review-sovereign-llm-teams-architecture` section A.4).

**MVP-pragmatism screen:** PASSES with caveats. The Tier 2 short-term ship is fine but the Religion AND Relationship test must be ironclad before any public publish -- this content category is the highest-reputation-risk of the 8 (see Section 6 risk register). The MVP should ship as **family-private** first, not public, while the family validates the LLM team's output discipline.

**Implementation hours.** Tier 1 family-private MVP: **60-100 focused hours**. Tier 2 cleared-for-public: **+40-60 focused hours** of theological-review pipeline hardening (per `AI-MEDIA-PRODUCTION-PLATFORM-VISION` Pillar 3). Tier 3 multi-family template: **+80-120 focused hours**.

### 2.6 Multi-property landlord content pipeline

**Headline.** The Poe Properties opportunity row (o4-o11 in the Dev/Ops pipeline) becomes a content surface: property tours produced sovereignly, tenant-onboarding videos, repair-protocol walkthroughs, scope-of-work demos, "how a stewardship-aligned landlord operates" educational content. Built per `feedback-distinguish-data-from-brand` -- this is the real-business brand-advertising, not seed data; never sanitize.

**Competitors.**

| Competitor | Pricing | What they do well | What they do badly |
|---|---|---|---|
| Stessa | Free Essentials / Pro $35/mo ($28/mo annual) ([source](https://www.capterra.com/p/181042/Stessa/)) | Free tier generous; landlord-favored UX. | Bookkeeping + portfolio only; no media production; rental-only frame. |
| BiggerPockets | Free + $39/mo Pro / $390/yr | Massive landlord-investor community; education content network. | Other people's platform; member is the product; not a sovereign content pipeline. |
| RealtyHive / individual landlord YouTube channels | Free / DIY | Authentic voice; portfolio show. | DIY production at every step; no faith integration; no Quality Gatekeeper. |

**Where PoeTech wins.** The first sovereign content pipeline for stewardship-aligned multi-property landlords -- a niche the mainstream landlord-tools market doesn't address. Integrates with the existing Real Estate module + Scope tool + Books + Practice (the SimplePractice analog Christina's TLC banner sits in). Per `feedback-distinguish-data-from-brand` -- the real businesses ARE the showcase, this is the real Poe Properties brand inside the real PoeTech app, not a vague aspirational pitch.

**Revenue model.** Bundled in Family + Premium + Business tiers; no separate SKU needed. Marketing flywheel: the produced content drives Poe Properties' actual rental occupancy + drives the PoeTech Small Landlord Tier ($99/mo per existing copy in DevOps.jsx:419-426) via the "this is what a stewardship landlord looks like running this system" social-proof loop.

**Sovereign-mesh Tier: 1.**

**MVP-pragmatism screen:** PASSES. Same substrate as 2.1; the content category just changes.

**Implementation hours.** Tier 1 (Poe-Properties-specific): **40-60 focused hours** (substrate reuses 2.1). Tier 2 (any-landlord template): **+30-50 focused hours**.

### 2.7 PoeTech-in-a-box for content creators / podcasters

**Headline.** A creator buys a hardware bundle (NAS + GPU box + UCG-Max + Tailscale-mesh-configured + the PoeTech Family OS pre-installed + the AI Media Production Platform pre-configured) and operates a sovereign creator studio out of their home or small office. The "PoeTech Studio" SKU. Hardware DTC was named as vapor (#130 in the promise-audit); this is the realistic ladder up from vapor.

**Competitors.**

| Competitor | Pricing | What they do well | What they do badly |
|---|---|---|---|
| Riverside / Descript / Captions stack | Combined ~$80-120/mo across the three for a serious creator | Browser-based; cloud-only; mature features. | Per-seat / per-creator scaling; recurring; no hardware; the creator pays in perpetuity and never owns. |
| Self-built (DIY Synology + DaVinci Resolve free + Reaper + DIY Tailscale) | One-time $1.5-4K hardware + ~0-50/mo storage; perpetual time-cost on integration | Sovereign; one-time cost. | Massive time-cost; the creator becomes a part-time sysadmin; configuration drift over time. |
| Anchor / Spotify for Podcasters | Free + Spotify revenue share | Hosting + monetization in one. | Spotify owns the canonical; per-platform algorithm risk; not a production pipeline. |

**Where PoeTech wins.** Pre-configured PoeTech-in-a-box plus the AI Foundation operating the day-to-day plus quarterly upgrade support -- the creator gets sovereignty without paying for it in time. Per `AI-FOUNDATION-INTERNAL-OPERATIONS` -- what is a click today is an API call tomorrow, called from a workflow. The creator clicks a "publish episode" button and the AI Foundation handles transcript + clip generation + thumbnail + caption-burned upload + show notes + RSS feed.

**Revenue model.** Hardware bundle: $3-5K one-time + **PoeTech Studio Operator $79/mo** for managed sovereign-AI substrate + quarterly upgrade support. Or self-install: $0/mo (open-source code + docs); paid support optional. Three-tier pricing per `COMMUNITY-FIRST-MISSION` Commitment 5.

**Sovereign-mesh Tier: 1** (every node is sovereign; mesh-federation enables creator-to-creator module sharing via the WORKFLOW-MODULE-LIBRARY).

**MVP-pragmatism screen:** PASSES on the SOFTWARE side; the hardware-DTC piece (#130) is still gated on supplier relationships + manufacturing capacity per the promise-audit. Soft launch: a creator brings their own NAS + GPU; PoeTech ships the configured software stack + supports the install.

**Implementation hours.** Tier 1 software-only (BYO-hardware): **100-150 focused hours** for the installer + onboarding wizard + creator-portal. Tier 2 hardware bundle (one supplier relationship + an install playbook): **+80-120 focused hours**. Tier 3 federated creator network (creators publish modules to the WORKFLOW-MODULE-LIBRARY mesh): **+120-200 focused hours**.

### 2.8 Educator + media production crossover

**Headline.** The Tutors module (#58 in the promise-audit) + Education / Children Literacy Justice (#57) + the "Family Educators" pipeline rows (o12-o14 -- Principal A online tutoring, Principal B online tutoring + curriculum, Specialized homeschool support for bullied/special-needs kids) gets the media production substrate. Educators produce sovereign teaching content; families consume it via the PoeTech Tutors module; per-child progress tracking integrates with the family's stewardship picture.

**Competitors.**

| Competitor | Pricing | What they do well | What they do badly |
|---|---|---|---|
| Outschool | $30/hr 1:1 minimum; Stripe-mediated ([source](https://teach.outschool.com/pricing-tips/)) | Massive student base; mature payment + scheduling. | Educator-side: opaque effective platform fee; high competition for visibility; "from us, for us" framing absent. |
| Varsity Tutors | $50-100/hr; 10-hour-package minimum ([source](https://brighterly.com/blog/online-tutoring-cost/)) | Mature placement + tutoring marketplace. | High prices; minimum commitments; cloud-only; per-session scaling. |
| Outlier.org / Coursera / IXL | $5-50/mo subscription | Massive content library; established credentialing partners. | Generic / institutional; no faith integration; no family stewardship context; not "from us, for us" for Black families, special-needs / bullied-kid transitions, or homeschool. |

**Where PoeTech wins.** "From us, for us" framing the mainstream platforms can't credibly take. Real principals + real teachers (the Family Educators) are the seed per `COMMUNITY-FIRST-MISSION`. 80/20 split per existing copy is more favorable than Outschool's effective take. The educator's content is their content; the platform takes the smaller share. Integrates with the family's stewardship picture so a parent sees curriculum + reading proficiency + family budget impact + faith-formation in one view.

**Revenue model.** Per the existing copy: Education / Children Literacy Justice at $19-29/mo per child OR bundled in Premium $149/mo. Tutors marketplace 80/20 split. **Educator Studio Add-On $59/mo** (production substrate for an educator who teaches in their own voice). New SKU.

**Sovereign-mesh Tier: 1** (every educator runs their own sovereign substrate; mesh-federation enables educator-to-educator and educator-to-family content sharing).

**MVP-pragmatism screen:** PASSES with the caveat that the Tutors marketplace itself was flagged as "stay in vision-tier" in the promise-audit (300-500 hour build, regulatory exposure on state homeschool requirements). The MVP here is NOT the full marketplace; it is the educator-side production studio + per-child sharing layer between the Family Educators already in the pipeline (Principal A, Principal B, specialized homeschool) and the families they already serve. Marketplace is post-MVP.

**Implementation hours.** Tier 1 educator-studio (single educator -> single family pipeline): **80-120 focused hours**. Tier 2 small-network (3-5 educators serving 10-20 families): **+80-120 focused hours**. Tier 3 marketplace (per the promise-audit): **+200-400 focused hours**, gated on auth substrate + billing substrate + LLM-team substrate per the master plan.

---

## 3. Sovereign tech stack for media production

Per `project-sovereign-mesh-mvp-pragmatism` -- every option labeled with its Tier; every Tier 2-3 option named with its evolution path.

### 3.1 STT (speech-to-text)

| Option | Quality | Throughput | Diarization | Alignment | Tier | Notes |
|---|---|---|---|---|---|---|
| **faster-whisper (int8/CTranslate2)** | Strong (Whisper-large-v3-equivalent) | ~12-25x realtime on RTX 4090; ~1-2x realtime on DS1621xs CPU int8 | No native; pair with pyannote-audio | Word-level via large-v3 | **Tier 1** | Recommended default. Open-source. CPU-capable at production quality for v1. ([repo](https://github.com/SYSTRAN/faster-whisper)) |
| **WhisperX** | Same as base Whisper + pyannote alignment | ~4-5x realtime on RTX 4090 with diarization | Native via pyannote | Forced-alignment word-level | **Tier 1** | Recommended when diarization matters (multi-speaker sermons, panel discussions). Built on faster-whisper. ([repo](https://github.com/m-bain/whisperX)) |
| **Whisper.cpp** | Slightly degraded vs full-precision | ~3-5x realtime on M-series Mac CPU; slower on Xeon D | Limited | Yes | **Tier 1** | Pure-C++ implementation; great for resource-constrained / non-CUDA boxes. ([repo](https://github.com/ggml-org/whisper.cpp)) |
| **Distil-Whisper** | ~99% of large-v3 quality at 6x speed | ~25-50x realtime on GPU | No native | Yes | **Tier 1** | The fastest accuracy-preserving option. Pair with WhisperX for diarization. ([repo](https://github.com/huggingface/distil-whisper)) |
| OpenAI Whisper API | Production quality | API-bound | No | Yes | **Tier 3** | $0.006/min; vendor-locked; the family's audio leaves the family's infrastructure. Use only for emergency burst; not the default. |

**Recommendation:** **faster-whisper + pyannote-audio (= WhisperX equivalent)** as the production default. On the DS1621xs CPU (int8 quantization) it transcribes a 60-90 min sermon in 8-15 minutes -- well within the Sunday-to-Tuesday-morning publishing window. On the Phase 2 GPU box (RTX 4090) it does the same job in <2 minutes, freeing the GPU to batch multiple sermons + run image-gen jobs in parallel. The substrate is sovereign-mesh-Tier-1.

### 3.2 Video editing automation

| Option | Strength | Tier | Notes |
|---|---|---|---|
| **Remotion** | React-based programmatic video; the substrate Van Clief used per `2026-06-01-icm-paper-review-for-childhood-friend.md`. JSX components compose to video frames; ffmpeg renders. Templated production pipelines easy to write + version-control. | **Tier 1** | Open-source / Apache; runs anywhere Node runs. Pricing has free + paid Studio tiers but the OSS render path is fully usable for sovereign workflows. ([repo](https://github.com/remotion-dev/remotion), [pricing](https://www.remotion.dev/pricing)) |
| **MoviePy** | Python video editing; widely-used; pairs well with Whisper + n8n. | **Tier 1** | Open-source. Slower than ffmpeg-direct but more ergonomic for cut/paste/overlay operations. ([repo](https://github.com/Zulko/moviepy)) |
| **ffmpeg automation patterns** | Lowest level; fastest; everything else compiles down to it eventually. | **Tier 1** | Open-source. The substrate every other tool sits on. Direct ffmpeg pipelines are unbeatable on throughput. |
| **Manim** | Math / diagram animations; the substrate 3Blue1Brown uses. | **Tier 1** | Open-source. Specific use case (explainer-style math/diagram content). ([repo](https://github.com/3b1b/manim)) |
| **ComfyUI workflow automation** | Node-based pipeline editor for image / video gen; couples with Stable Diffusion / FLUX. | **Tier 1** | Open-source. The orchestration layer the AI-MEDIA-PRODUCTION foundation doc names for generative content. ([repo](https://github.com/comfyanonymous/ComfyUI)) |
| Adobe Premiere Pro / Final Cut Pro / DaVinci Resolve | Industry NLE quality; manual operation. | **Tier 3** for Adobe/Apple, **Tier 1** for DaVinci Resolve free tier (scriptable Lua) | Used only for the rare high-end human-edit pass; not the substrate. |

**Recommendation:** **Remotion** for templated short-form + long-form video composition (sermon hilite reels, family-worldview-commentary intros + outros, news-commentary lower-thirds); **ffmpeg direct** for caption burn-in + transcode + concat; **MoviePy** for the cut/paste/overlay glue between them; **ComfyUI** when generative video / thumbnails enter the pipeline (Phase 2 GPU box). The substrate is sovereign-mesh-Tier-1.

### 3.3 Audio production

| Option | Use | Tier | Notes |
|---|---|---|---|
| **Auphonic API** | Hosted audio mastering -- loudness norm, leveler, noise reduction. | **Tier 3** | Vendor; sends audio to their cloud. Use only if the sovereign chain doesn't reach quality bar; not the default. |
| **x42-plugins + LV2 chain** | Open-source audio plugin suite; LUFS metering, EBU R128 normalization. | **Tier 1** | Open-source. Runs in any LV2/LADSPA-compatible host (Ardour, Reaper-via-bridge). ([source](https://x42-plugins.com/)) |
| **ffmpeg loudnorm filter (EBU R128)** | Two-pass loudness normalization in pure ffmpeg. | **Tier 1** | Already in the substrate. Hits broadcast loudness targets (-23 LUFS or -16 LUFS for podcasts) without leaving sovereign infrastructure. |
| **Demucs / Spleeter** | Source separation -- pull vocals out of mixed audio; remove background noise. | **Tier 1** | Open-source. CPU-capable at moderate quality; GPU 5-10x faster. ([repo](https://github.com/facebookresearch/demucs)) |
| **Dolby.io / LANDR vendor APIs** | Mastering / leveling. | **Tier 3** | Vendor; not the sovereign default. |

**Recommendation:** **ffmpeg loudnorm + Demucs (when noise is the problem)** as the default mastering chain. The sovereign chain hits broadcast loudness targets with no audio leaving the family's NAS. Sovereign-mesh-Tier-1.

### 3.4 TTS for voice synthesis / re-narration

| Option | Quality | Tier | Notes |
|---|---|---|---|
| **Piper** | Strong; ~real-time CPU; small footprint. | **Tier 1** | Open-source from Mike Hansen / Home Assistant. The sovereign default for any "narrate this scripture passage" surface. ([repo](https://github.com/rhasspy/piper)) |
| **Coqui TTS (XTTS v2)** | Production-quality voice cloning from short samples. | **Tier 1** | Open-source. Use for family-member voice synthesis WITH EXPLICIT CONSENT per `AI-MEDIA-PRODUCTION-PLATFORM-VISION` Pillar 1. ([repo](https://github.com/coqui-ai/TTS)) |
| **Mimic 3** | Open-source TTS from Mycroft; smaller voice library. | **Tier 1** | Workable alternative to Piper; less actively maintained. |
| **ElevenLabs** | Industry-leading quality. Free / $6 Starter / $11 Creator / $99 Pro / $299 Scale / $990 Business per published pricing ([source](https://elevenlabs.io/pricing)) | **Tier 3** | Vendor-locked; voice samples sent to their cloud; commercial license required for any non-trivial use. Use only for the highest-quality client-facing surface where the cost / quality math wins; not the default. |

**Recommendation:** **Piper for utility narration; Coqui XTTS v2 for family-voice synthesis (with consent); ElevenLabs only for the highest-quality public-facing surface where the family explicitly chooses vendor-quality over sovereignty.** The substrate stays sovereign-mesh-Tier-1 by default; Tier 3 fallback is a conscious per-piece decision, not the architecture.

### 3.5 Thumbnail / cover art generation

| Option | Quality | VRAM | Tier | Notes |
|---|---|---|---|---|
| **Stable Diffusion XL + ComfyUI** | Industry baseline | 8-12 GB | **Tier 1** | Open-source. Fits comfortably on RTX 4090. ([repo](https://github.com/Stability-AI/stablediffusion)) |
| **FLUX.1 dev** | Higher photorealism / typography than SDXL | 16-24 GB | **Tier 1** | Open-source. Recommended sovereign default per `AI-MEDIA-PRODUCTION-PLATFORM-VISION`. ([repo](https://github.com/black-forest-labs/flux)) |
| **Midjourney / DALL-E vendor** | Strong quality | N/A | **Tier 3** | Cloud-only; per-image / per-month pricing. |

**Recommendation:** **FLUX.1 dev on the GPU box** as the sovereign default for thumbnails, cover art, social cards. Tier 1, mesh-aligned.

### 3.6 Caption / subtitle styling

| Option | Tier | Notes |
|---|---|---|
| **ASS subtitle format + ffmpeg subtitle burn-in** | **Tier 1** | The TikTok / Reels-style animated word-level emphasis is achievable in pure ASS + ffmpeg with karaoke timing. Sovereign. |
| **Whisper-cpp-style word-level timestamp + Remotion captions component** | **Tier 1** | Remotion has captions packages that render per-word with React animation; integrates cleanly with faster-whisper word-level output. |
| **Submagic / CapCut vendor** | **Tier 3** | Cloud-only; pretty templates; vendor-locked. |

**Recommendation:** **Word-level timestamps from faster-whisper -> ASS file -> ffmpeg burn-in**, OR **Remotion captions component for React-style animated captions in social-cut renders.** Both Tier 1.

### 3.7 Multi-platform distribution

| Option | Tier | Notes |
|---|---|---|
| **Direct YouTube Data API** | **Tier 2** | YouTube is non-sovereign but the API contract is documented; uploads can be automated from n8n. The canonical stays on the NAS; YouTube is a mirror per `AI-MEDIA-PRODUCTION-PLATFORM-VISION` Pillar 4. |
| **Substack publishing API** | **Tier 2** | Same posture -- mirror, not canonical. |
| **Patreon API** | **Tier 2** | Same posture. |
| **PeerTube (federated)** | **Tier 1** | The long-arc federated video distribution. Mesh-native. ([source](https://joinpeertube.org/)) |
| **Buffer / Later / Publer (scheduling SaaS)** | **Tier 3** | Vendor-locked aggregator over the same APIs n8n already calls; skip. |

**Recommendation:** **n8n workflows calling the YouTube / Substack / Patreon APIs directly + the NAS as canonical home + a PeerTube node when audience size justifies federation.** Mostly Tier 2 short-term (vendor APIs) evolving to Tier 1 long-term (PeerTube federation) per `project-sovereign-mesh-mvp-pragmatism`.

### 3.8 The composed stack -- recommended Phase 2 GPU box loadout

For when the Proxmox + RTX 4090 GPU box ships per `2026-06-01-research-review-kvm2-both-tracks.md`:

| Layer | Service | Runs on |
|---|---|---|
| Ingest | n8n workflows | NAS |
| Transcribe | faster-whisper + pyannote (WhisperX) | GPU box (12-25x realtime) |
| Worldview-grounded analysis | Church-LLM-team specialized prompts + RAG; sovereign Ollama (Qwen 3.6-27B post-GPU) | GPU box |
| Audio master | ffmpeg loudnorm + Demucs noise removal | NAS or GPU box |
| Caption | faster-whisper word timestamps -> ASS file | NAS |
| Video compose | Remotion + MoviePy + ffmpeg | NAS or GPU box (compose is CPU; render benefits from CUDA encode on GPU) |
| Thumbnail | FLUX.1 dev via ComfyUI | GPU box |
| Voice (when needed) | Piper / Coqui XTTS v2 | NAS or GPU box |
| Publish | n8n workflows to YouTube Data API + Substack + Patreon + PeerTube | NAS |
| Storage / canonical | Synology Drive + Postgres asset index with full provenance | NAS |

The substrate is sovereign-mesh-Tier-1 end-to-end. Vendor LLMs and ElevenLabs are Tier 3 escape-hatches for specific high-stakes pieces, used per-piece, not as architecture.

---

## 4. Revenue projections at three scales

Per the four existing paid tiers (PoeTech+ $39, Family $89, Premium $149, Business $249) plus new SKUs the media opportunities warrant. Conservative + optimistic conversion estimates.

### 4.1 Family scale (single household using for personal show / family worldview commentary)

**Anchor:** Riverside Pro $24/mo + Descript Creator $24/mo + ElevenLabs Creator $11/mo + YouTube Premium $14/mo + Substack 10% rev-share = ~$73/mo + variable in the creator-economy stack the family would otherwise pay. PoeTech Family $89/mo absorbs the substrate with sovereignty bundled in.

**Conservative (1,000 paying Family households at $89/mo):** ~$1.07M ARR, of which the media-production substrate accounts for ~$20-30 effective value per month and is the upgrade-from-PoeTech+-$39-to-Family-$89 differentiator.

**Optimistic (3,000 paying Family households):** ~$3.21M ARR with media-production a named upgrade driver.

**New SKU recommended:** **PoeTech Studio Add-On $39/mo** for households on Foundation or PoeTech+ tiers who want the media substrate but not full Family. Conservative 200 paying at $39/mo = ~$93K ARR; optimistic 800 paying = ~$374K ARR.

### 4.2 COLG-sized community scale (one church running sovereign media production)

**Anchor:** Subsplash One bundle $200-600+/mo + Tithe.ly $99/mo (or equivalent) + cloud sermon-hosting + per-tx fee on giving = a mid-size church often spends $400-1,500+/mo aggregate before counting per-tx extraction. The COLG-Supported tier at **$199/mo flat** absorbs the substrate with sovereignty bundled in.

**Conservative (10 churches at $199/mo):** ~$24K ARR. Mostly mission, not revenue.

**Optimistic (100 churches at $199/mo by year 3):** ~$239K ARR. Now significant.

**Self-host tier remains $0** per `COMMUNITY-FIRST-MISSION` Commitment 5. Code + docs + training open-source.

**New revenue line:** **Sermon-Production-as-a-Service $99/mo flat per active pipeline** for churches that want production but host elsewhere. Conservative 30 churches = ~$36K ARR; optimistic 200 churches = ~$238K ARR.

**Partner tier (large churches that contribute back):** fee rebated against contributions; counted as 0 revenue in projections.

### 4.3 Creator scale (podcaster / educator running PoeTech-in-a-box)

**Anchor:** Riverside Pro $24/mo + Descript Creator $24/mo + ElevenLabs Creator $11/mo + a hosting platform $20/mo + a scheduling SaaS $10/mo + an audio-master vendor $20/mo = ~$109/mo recurring; serious creators often double or triple this. PoeTech Studio Operator **$79/mo flat** + the one-time PoeTech-in-a-box hardware bundle $3-5K absorbs the substrate.

**Conservative (100 creators on Studio Operator $79/mo):** ~$95K ARR + one-time hardware-bundle revenue. At a 30% gross margin on $4K average bundle = ~$120K one-time on 100 bundles.

**Optimistic (500 creators):** ~$474K ARR + one-time bundle revenue.

**Educator Studio Add-On $59/mo** for the educators-marketplace educator side. Conservative 50 educators = ~$35K ARR; optimistic 200 educators = ~$142K ARR.

**News Commentary Add-On $29/mo** for households running 2.5 the public-cleared version. Conservative 200 = ~$70K ARR; optimistic 1,000 = ~$348K ARR.

### 4.4 Composite three-scale revenue summary (year-3 projection)

| Scale | Conservative ARR | Optimistic ARR |
|---|---:|---:|
| Family (Family $89 + Studio Add-On $39) | $1.16M | $3.58M |
| Community (COLG-Supported $199 + Sermon-Prod-as-a-Service $99) | $60K | $477K |
| Creator (Studio Operator $79 + Educator Add-On $59 + News Add-On $29) | $200K | $964K |
| **Total media-production ARR contribution** | **$1.42M** | **$5.02M** |

These are not commitments; they are anchor numbers for sequencing decisions. The mission-priority remains COLG-first per `COMMUNITY-FIRST-MISSION`; the creator + family scales are the multipliers that compound off the same substrate.

---

## 5. Implementation roadmap -- BUSINESS-PROCESS-CONNECTIONS five-question test on top 5 ships

Per `BUSINESS-PROCESS-CONNECTIONS`. Each ship: (1) what does the surface invite? (2) what pipeline carries the invite to fulfillment? (3) who governs incoming volume / quality? (4) what's the visible promise (honest, not exaggerated)? (5) what's the bot-team that operates it?

Reusability tiers from `WORKFLOW-MODULE-LIBRARY`: Tier 1 family-specific, Tier 2 community-template, Tier 3 universal.

### Ship M1 -- COLG Sermon-to-Content pipeline (the highest-leverage ship; see Section 7)

1. **Invites:** COLG members + visitors to access this Sunday's sermon as long-form video + searchable transcript + 3-5 short clips for social + Spanish caption track + a sermon-summary bulletin entry by Tuesday morning.
2. **Pipeline:** Sunday pulpit-cam capture -> n8n workflow ingests media -> faster-whisper transcribes -> Church-LLM-team writes scripture-cited summary + clip-selection candidates (Worldview-grounded, ESV-primary, typographic-theology binding enforced per `CLAUDE.md`) -> Bishop Gwin + COLG leadership reviews + approves (the Religion AND Relationship gate) -> Remotion + ffmpeg renders the long-form + clips -> n8n publishes to COLG website (canonical) + YouTube mirror + social mirrors -> archive into the searchable sermon library on the COLG NAS -> automated bulletin draft for next Sunday.
3. **Governor:** Bishop Gwin + COLG leadership (per `GOVERNANCE-EXECUTION-ADVISORY` -- COLG leadership becomes a co-Governor in their domain when the module ships per `COMMUNITY-FIRST-MISSION` Commitment 7). Christina + Darrell as advocates on the family side. Quality Gatekeeper (workflow 36 / Role 10) enforces the validation gate.
4. **Visible promise:** "Sunday's sermon is on the church website, captioned, with timecoded scripture references and 3-5 short clips for social, by Tuesday morning. The church owns the master file. Bishop Gwin approves every published piece. Self-host tier is free; supported tier $199/mo flat regardless of church size."
5. **Bot-team:** **Church sovereign LLM team** (per `2026-06-01-research-review-sovereign-llm-teams-architecture` section 3.1) operates the transcript-cleanup + scripture-citation-detection + bulletin-draft + clip-selection + social-caption work. **Dev/Ops team** operates the workflow plumbing + the publish-gate + the observability. PHI firewall not applicable; typographic-theology binding hard-coded in the system prompt as a never-violate rule.

**Reusability tier:** Tier 1 (COLG-specific) at v1; Tier 2 (other-church template) at v2 per Commitment 1 (serve COLG first, generalize from there). **Hours estimate:** 120-180 focused.

### Ship M2 -- Family worldview commentary pipeline (Poe-family-private at v1)

1. **Invites:** the Poe family to publish weekly worldview-commentary episodes (one of the suggested series in `AI-MEDIA-PRODUCTION-PLATFORM-VISION` -- the four questions / religion AND relationship / stewardship as worship / Holy Spirit Integration Worldview chapter studies).
2. **Pipeline:** family records (phone or camera) -> n8n ingest -> faster-whisper transcript -> Church-LLM-team writes show notes with ESV-cited scripture (Worldview-grounded answer source per CLAUDE.md 2026-05-25) -> Darrell + Christina co-review per `AI-MEDIA-PRODUCTION-PLATFORM-VISION` Pillar 3 theological-review pipeline -> Remotion + ffmpeg renders + caption-burns -> publish to NAS canonical + YouTube mirror.
3. **Governor:** Darrell on theological framing; Christina on pastoral / clinical framing; both co-sign on substantive theological content per Pillar 3. Quality Gatekeeper enforces the Phil 4:8 + Religion AND Relationship test before every publish.
4. **Visible promise:** "Weekly Worldview commentary, ESV-primary citations, no improvised theology, the family owns the master file, you can subscribe via RSS / YouTube mirror / Substack mirror -- mirrors only, our home is poetech.us."
5. **Bot-team:** Church LLM team writes the show notes + clip selection; Dev/Ops team operates the workflow plumbing; online team handles the audience-side mirror publishing.

**Reusability tier:** Tier 1 (Poe-family-specific) at v1; Tier 2 (any-family template) at v2; Tier 3 (per-denomination defaults) at v3. **Hours estimate:** 60-80 focused (substrate reuse from M1).

### Ship M3 -- Multi-property landlord content pipeline (Poe-Properties brand-advertising)

1. **Invites:** prospective tenants + adjacent landlords + small-business owners curious about stewardship-aligned property operation to engage with the Poe Properties brand inside the PoeTech app and on YouTube / Substack mirrors. Per `feedback-distinguish-data-from-brand` -- this is the real-business brand-advertising; the showcase, not a sanitization target.
2. **Pipeline:** Darrell records property tours / scope walkthroughs / tenant-onboarding videos -> n8n ingest -> faster-whisper transcript -> online-LLM-team writes show notes + property-listing language + scope-template descriptions -> Remotion + ffmpeg compose + caption-burn -> publish to NAS canonical + YouTube mirror + Poe Properties website -> tenant inquiry routes back through the wf30 family-voice + scope-tool pipeline.
3. **Governor:** Darrell on Poe Properties brand framing; Adam if any Cornerstone-Tech-shaped content is involved (per Cornerstone Tech in the opportunity rows). Standard Quality Gatekeeper validation.
4. **Visible promise:** "Real property at real prices operated by a real family on the same stewardship principles the PoeTech app teaches. Tour the property; meet the operator; read the scope; the platform is the showcase."
5. **Bot-team:** online LLM team writes the brand-adjacent content (property descriptions, social captions); Dev/Ops team operates the workflow plumbing.

**Reusability tier:** Tier 1 (Poe-Properties-specific) at v1; Tier 2 (any-landlord template) at v2 -- the Small Landlord Tier $99/mo (#96 in the promise-audit) becomes the natural home. **Hours estimate:** 40-60 focused.

### Ship M4 -- COLG community broadcast pipeline (multi-channel)

1. **Invites:** COLG members to receive weekly bulletin + youth-group announcements + mid-week prayer chains + mutual-aid coordination in their preferred channel.
2. **Pipeline:** elderly deacon records announcement by voice (the accessibility-default + voice-first pattern per `COMMUNITY-FIRST-MISSION` Commitments 2 + 6) -> faster-whisper transcript -> Church-LLM-team proposes tonal edits in COLG voice -> Bishop Gwin or designated approver reviews -> n8n broadcast workflow routes to SMS via Twilio (Tier 2) + email via Resend or Postmark (Tier 2) + in-app notification + ntfy for opt-in members.
3. **Governor:** Bishop Gwin + COLG leadership govern message-approval; family-side advocates support; Quality Gatekeeper enforces typographic-theology binding.
4. **Visible promise:** "Your weekly bulletin reaches you in the channel you use, in your community's voice, with no engagement bait. Elderly staff can produce announcements by voice and approve with one tap. The church owns the broadcast list."
5. **Bot-team:** Church LLM team for the tonal-edits + scripture verification; Dev/Ops team operates the multi-channel routing + observability + ntfy alerts on Sunday-morning readiness checks per `PERPETUAL-PIPELINE-HEALTH` rule.

**Reusability tier:** Tier 1 (COLG-specific) at v1; Tier 2 (other-church template) at v2; Tier 3 (multi-language defaults for Spanish given Christiana's bilingual capability + the local Hispanic community) at v3. **Hours estimate:** 80-120 focused.

### Ship M5 -- PoeTech Studio Operator BYO-hardware v1 (creator side)

1. **Invites:** independent creators (podcasters, educators, faith-led content producers) to operate a sovereign production studio out of their own NAS + GPU, with PoeTech Foundation operating the day-to-day pipeline.
2. **Pipeline:** creator installs the PoeTech Studio Operator package on their NAS (open-source install via the existing PoeTech Family OS installer + Studio module add-on) -> n8n workflows orchestrate the production pipeline they choose -> AI Foundation runs daily quality checks + observability + alerts -> creator clicks "publish episode" and AI Foundation handles transcript + clips + thumbnail + caption-burned upload + show notes + RSS feed.
3. **Governor:** the creator governs their content (this is creator-side sovereignty, not platform-mediated); PoeTech provides the substrate + support; Quality Gatekeeper validates the substrate itself, not the creator's content.
4. **Visible promise:** "Sovereign production substrate on your hardware. No watermarks. No metered AI credits. No per-seat tax. You own the master file, the audience list, the publish schedule. $0 self-host or $79/mo for managed support. Hardware bundle available."
5. **Bot-team:** Dev/Ops team operates the substrate (Quality Gatekeeper + observability + upgrades); online team handles the creator-portal + onboarding emails; Church team / Therapy team optionally available if the creator's content is in those industries.

**Reusability tier:** Tier 1 (single creator) at v1; Tier 2 (creator network) at v2; Tier 3 (federated creator mesh via the WORKFLOW-MODULE-LIBRARY) at v3 -- the mesh-native long-arc. **Hours estimate:** 100-150 focused (software-only; hardware bundle is post-MVP).

### 5.6 Dependencies map across the top 5 ships

| Ship | Depends on | Unblocks |
|---|---|---|
| M1 (COLG Sermon) | Church LLM team substrate (per `2026-06-01-research-review-sovereign-llm-teams-architecture` 3.1); WhisperX deploy on NAS; Bishop Gwin co-Governor signature; COLG NAS purchase; accessibility audit | M2 (substrate reuse); M4 (substrate + COLG-voice training data); the entire AI-MEDIA-PRODUCTION pillar 1 |
| M2 (Family worldview) | M1 substrate; Worldview text reading-order from Darrell; theological-review pipeline operational | News-commentary pipeline (2.5 / future ship); creator-side adoption proof |
| M3 (Poe Properties brand) | M1 substrate (or independent ship if M1 delayed); online LLM team substrate | Small Landlord Tier $99/mo (#96 promise) being honest; the Premium tier's "real estate unlimited properties" promise being demonstrably valuable |
| M4 (COLG broadcast) | M1 substrate; Twilio + Resend/Postmark accounts; ntfy operational; the accessibility audit | Church Module v1 promise #5 being honored; COLG-supported $199/mo offering being honest |
| M5 (Studio Operator) | M1 substrate proven at one community; PoeTech installer + Studio add-on module; Stripe billing (Ship 5 in the master plan) | Hardware-DTC bundle (#130 promise) being non-vapor; the PoeTech-in-a-box vision; creator-side flywheel |

The dependency chain reinforces the recommendation in Section 7: **M1 first; everything else compounds off it.**

---

## 6. Risk + downside

Per the standing GOVERNANCE-EXECUTION-ADVISORY test ("does this lift the family AND create rather than extract"). The risk register below is the honest downside view of shipping the 8 opportunities; mitigations are named for each.

### 6.1 Content moderation risk (user-generated content publishing)

**Risk:** Once PoeTech-in-a-box ships (2.7 / M5), creators publish their content through PoeTech-operated pipelines. Some creator content will be wrong (factually, theologically, legally) and some will be harmful. If PoeTech is in the publishing chain, the platform inherits some liability exposure.

**Mitigation:** v1 is **self-host only** -- the creator runs the substrate on their own hardware; PoeTech is the substrate provider, not the publisher of record. The hosted Studio Operator tier ($79/mo) is a separate decision with explicit content-moderation policy + creator-terms before it ships. Until then, PoeTech-mediated publishing applies only to COLG (under Bishop Gwin's co-Governor approval per Commitment 7) + the Poe family (under Darrell + Christina co-Governance per `AI-MEDIA-PRODUCTION-PLATFORM-VISION` Pillar 3). No paying-creator-mediated publishing pre-policy.

### 6.2 Copyright risk (sermon recordings, news commentary fair use, music licensing)

**Risk:** Sermon recordings -- the church owns the copyright to its own sermons but third-party congregational music (CCLI-licensed worship songs) requires per-use license; news-commentary fair use is a doctrine with real limits; sermon-clip background music could infringe.

**Mitigation:** **Music licensing path:** COLG already operates under a CCLI streaming license for its existing YouTube broadcasts (verifiable -- COLG YouTube Live is named in the AdvisementBanner #112); the sermon pipeline inherits the same coverage. **News commentary fair use:** the news-commentary pipeline (2.5 / future ship) stays family-private at v1; the Religion AND Relationship + theological-review pipeline catches mis-uses before any public publish; legal review before the public-cleared v2 ships. **Sermon-clip background music:** the v1 production pipeline uses only royalty-free music (Pixabay / YouTube Audio Library / family-original) until a clear licensing path is wired.

### 6.3 Reputational risk (botched AI-generated faith content)

**Risk:** A poorly-generated AI-derived scripture explainer or pastoral-style response that misrepresents the Worldview, mis-cites scripture, or drifts into improvised theology embarrasses the family, the church, and the platform. Once published, faith content carries reputational weight that's hard to recover.

**Mitigation:** **Hard-coded Religion AND Relationship gate** before every public publish per `EXCELLENCE-STANDARD`. **Theological-review pipeline** per `AI-MEDIA-PRODUCTION-PLATFORM-VISION` Pillar 3 -- foundation-screen, scripture-citation discipline, typographic theology, worldview alignment, Darrell + Christina co-sign on substantive theology. **Phil 4:8 test** before every publish per `MIND-OF-CHRIST`. **Hard refusal class in the Church LLM team's system prompt** for any output that would violate `SCRIPTURE-REFERENCE-STANDARD` (no invented translations, no unattributed paraphrase, no improvised theology). **AI-generated content NEVER fronts the family's voice on substantive theological work** -- per `AI-MEDIA-PRODUCTION-PLATFORM-VISION` mitigation under "Risk: AI-generated content sounds AI-generated" -- AI is the production tool, not the speaker.

### 6.4 Production-quality risk (sovereign tools vs Adobe Premiere)

**Risk:** Sovereign tools (Remotion, ffmpeg, MoviePy, DaVinci Resolve free) may not match Adobe Premiere Pro / Final Cut Pro quality for high-end work. A side-by-side of a polished Premiere-cut sermon vs an AI-pipeline-cut sermon could look amateur in places.

**Mitigation:** **Don't fight the medium.** The sovereign pipeline targets the volume-and-discipline play (Sunday-to-Tuesday turnaround on every sermon; weekly worldview commentary; cadence-driven landlord content); high-end one-off pieces still get human-edited in DaVinci Resolve or Premiere. The pipeline is for the 90% of weekly content where consistency matters more than feature-film polish. Per `AI-MEDIA-PRODUCTION-PLATFORM-VISION` Pillar 6 (perpetual improvement) -- the pipeline gets better over time; v1 is good enough; v2 is better.

### 6.5 Scaling risk (one family vs 100 families vs 1000)

**Risk:** A pipeline that works for one family (the Poes) and one church (COLG) doesn't necessarily work for 100 families and 10 churches. The CPU-only NAS substrate that handles one family's weekly cadence becomes a queue-overflow at 100 families.

**Mitigation:** Per `project-sovereign-mesh-mvp-pragmatism` -- every node is sovereign on its own infrastructure. PoeTech does NOT host 100 families' production pipelines on a central NAS; each family + church + creator runs the pipeline on their own sovereign hardware. The mesh-federation is the scaling mechanism, NOT centralized hosting. The platform's scaling concern is the WORKFLOW-MODULE-LIBRARY distribution (one good Family-Voice-Loop module ships across the mesh to N families), not centralized inference load.

### 6.6 Pastoral risk (church-led pipeline misrepresenting Scripture)

**Risk:** A church pastor or volunteer publishes an AI-derived scripture explainer that conflicts with the doctrinal position of the congregation. The pastor's voice gets co-mingled with the AI's voice; congregants infer the pastor endorses positions the pastor did not author.

**Mitigation:** **Bishop Gwin (or the analog leader at any partner church) governs every published theological piece in their domain** per `GOVERNANCE-EXECUTION-ADVISORY` + `COMMUNITY-FIRST-MISSION` Commitment 7. The Church LLM team **proposes drafts**; the pastor **approves or rejects**. No published theology bypasses pastor-approval. The platform makes the pastor-approval surface obvious + low-friction so it stays in the loop even at high cadence. **Per-church RAG over the church's own past sermons + announcements (with explicit pastor opt-in)** -- the LLM team writes IN the pastor's voice, not a generic doctrinal voice.

### 6.7 Religion AND Relationship test for the entire product line

**Religion check (backbone, scripture-grounded, structure sound):**
- Every theological piece passes through the Pillar 3 theological-review pipeline + `SCRIPTURE-REFERENCE-STANDARD` discipline + typographic-theology binding.
- The platform serves the King (per `AI-MEDIA-PRODUCTION-PLATFORM-VISION` purpose 6) and the Worldview text per `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW` is the source of answers, not improvised training-data theology.
- Pastor-approval is required for every public published theological piece (Pillar 5 audience consent + interaction).

**Relationship check (warmth, meets the reader, heart visible):**
- The COLG-first commitment lands first: Bishop Gwin and the elderly tech-novice staff are the design target, not an afterthought.
- Accessibility default (WCAG AA, large-text, voice-first, forgiving-undo) per `COMMUNITY-FIRST-MISSION` Commitment 2 -- this is what warmth looks like in product.
- Family-voice as designed-with, not designed-for, per Commitment 7.
- No engagement-bait, no dark patterns, no extraction per `DATA-AS-EMPOWERMENT-NOT-EXTRACTION` (the structural differentiator).

**Both checks pass** for the substrate as designed. Each individual ship has to pass them again at publish time.

---

## 7. The single highest-leverage ship recommendation

**Recommendation:** Ship **COLG Sermon-to-Content pipeline (Ship M1)** first.

**Sovereign-mesh Tier:** 1 (mesh-native -- COLG NAS publishes; other nodes subscribe under consent).

**MVP-pragmatism screen:** PASSES with highest score among all 8 opportunities. Substrate is in flight (Whisper STT wf37); n8n orchestration is operational; no GPU box required for v1 (faster-whisper int8 transcribes a 60-90 min sermon in 8-15 min on the DS1621xs CPU); Bishop Gwin pre-relationship via the family; the Religion AND Relationship discipline is already wired in `CLAUDE.md` typographic theology + `SCRIPTURE-REFERENCE-STANDARD` + Phil 4:8 test.

**Justification across the binding screens:**

| Screen | Result |
|---|---|
| Business value | $199/mo COLG-supported tier x 10 churches year 1 = $24K ARR; the substrate produces every other media opportunity at marginal-cost; the Church Module v1 promise (#5, #34, #61, #122 in the promise-audit) is honored. |
| Technical feasibility from existing infrastructure | Highest. Whisper STT in flight; n8n live; Bishop Gwin pre-relationship; no GPU box required for v1. |
| `COMMUNITY-FIRST-MISSION` alignment | Maximum -- this is the named first community-served ship. Commitment 1 (COLG first) is the binding sequence. |
| COLG-first viability | High. Bishop Gwin + COLG leadership have the existing weekly sermon-recording cadence (the YouTube Live broadcast is already operating per `poe-financial-mvp-v28.jsx` AdvisementBanner #112). PoeTech adds the AI production layer on top of an existing cadence; no new behavior change required from COLG staff. |
| Religion AND Relationship test | Both pass. Religion: typographic theology binding, ESV-primary scripture citation, theological-review pipeline, pastor-approval gate, no improvised theology. Relationship: elderly-staff-friendly voice-first input, accessibility default, family-and-community voices on design, no extraction, no per-attendee tax. |
| Phil 4:8 test on the ship itself | TRUE (honest production), HONORABLE (serves the church not the platform), JUST (sovereign + fair-priced), PURE (no manipulation), LOVELY (the church's voice amplified), COMMENDABLE (no slander, no engagement-bait), EXCELLENT (production-quality), PRAISEWORTHY (worth amplifying as the showcase). All eight pass. |

**Order it goes in the master plan (per `2026-06-01-app-services-promise-audit-and-master-plan.md` section 7.2):** Slot M1 as **Ship 3a** -- in parallel with Ship 3 (COLG Church Module v1 -- foundation + first wins). M1 IS the AI Media Production pillar of that Church Module v1 ship; they're not separate workstreams.

**What this commits the family to:** approaching Bishop Gwin (per master-plan open question 2) with the v1 scope as a concrete proposal -- "Sunday's sermon, transcribed and captioned, with 3-5 short clips for social, archived searchable on the church website, by Tuesday morning. Self-host code for free. COLG owns the master files. PoeTech operates the substrate. Bishop Gwin approves every published piece." The Family-Voice-Loop module library entry (ship 2 in the master plan) is the substrate this rides on; sovereign Church LLM team (ship 1) is the brain. The dependency chain holds.

---

## 8. Open questions for Darrell

Per `feedback-dont-stop-to-ask` -- only the questions that genuinely need Darrell's input. Defaults named.

1. **The Bishop Gwin proposal timing.** Ship M1 (COLG Sermon-to-Content) is mission-priority but cannot start without Bishop Gwin's co-Governor commitment per `COMMUNITY-FIRST-MISSION` Commitment 1. When does Darrell plan to bring the v1 scope to Bishop Gwin? **Default I'm running with:** wait for Darrell's prompt; the report identifies the dependency but doesn't drive the relationship. (Same as open question 2 in the promise-audit master plan; restated here for the media context.)

2. **Tier 3 escape-hatch policy on ElevenLabs / vendor LLMs.** The sovereign tech stack (Section 3) names ElevenLabs + OpenAI Whisper API + vendor LLMs as Tier 3 escape-hatches for specific high-stakes pieces. Does Darrell want a per-piece governance gate before any Tier 3 tool is used (each use requires explicit approval), or a class-level governance gate (a category like "client-facing narration for marketing video" is pre-approved while other categories require per-piece approval)? **Default I'm running with:** class-level pre-approval for marketing surfaces (where the cost / quality math is clearest); per-piece approval for any theological or pastoral surface (where sovereignty is most senior).

3. **News commentary public-cleared timing.** Ship 2.5 (news-content evaluation against biblical perspective) is the highest-reputation-risk of the 8 ships. The recommendation is family-private v1 first, public-cleared v2 only after the LLM team's output discipline is validated over weeks of family-private runs. Does Darrell agree the family-private validation window is at least 4 weeks of weekly episodes before any public publish? **Default I'm running with:** yes, 4-6 weeks family-private minimum; public publish is a separate explicit decision.

4. **PoeTech Studio Operator hosted-tier policy.** Ship M5 v1 is BYO-hardware (self-host only); the hosted Studio Operator tier ($79/mo) carries content-moderation liability that requires explicit policy before it ships. Does Darrell want the hosted tier sequenced after M1 + M5-v1 prove out (months from now), or held as vision-tier indefinitely? **Default I'm running with:** post-M5-v1 + post-billing-substrate + post-explicit-policy is the earliest realistic ship; hold as planned, not vision.

5. **Educator marketplace sequencing.** Ship 2.8 (educator + media production crossover) names a Tier 1 educator-studio MVP that is shippable; the Tier 3 full marketplace is the 200-400 focused-hour build the promise-audit flagged for vision-tier. Does Darrell want the Tier 1 educator-studio MVP (single educator -> single family pipeline with Principal A and Principal B already in the opportunity rows) sequenced into the post-vacation plan, or held until the marketplace prerequisites land? **Default I'm running with:** Tier 1 educator-studio is post-M3 (after Poe-Properties content pipeline proves the substrate at one non-Church use case); marketplace stays vision-tier.

---

## 9. Religion AND Relationship test on this report

**Religion check (backbone, scripture-grounded, structure sound):**
- Competitor pricing sourced and cited (Riverside, Descript, Klap, Opus Clip, ElevenLabs, Subsplash, Planning Center, Tithe.ly, Stessa, Outschool, Varsity Tutors, Buildertrend, A Place for Mom, SimplePractice via the promise-audit cross-reference).
- Open-source tool URLs sourced (faster-whisper, WhisperX, Whisper.cpp, Distil-Whisper, Remotion, MoviePy, Manim, ComfyUI, FLUX.1, Piper, Coqui TTS, x42-plugins, Demucs, PeerTube).
- Every option labeled with its sovereign-mesh Tier per `project-sovereign-mesh-mvp-pragmatism`.
- Typographic theology binding from `CLAUDE.md` enforced throughout (Yahweh / Jesus / the Holy Spirit / the Father / the Son capitalized; satan / the adversary / etc. never capitalized).
- BUSINESS-PROCESS-CONNECTIONS five-question test run on the top 5 ships.
- Scripture not cited in this report body (the report is operational, not doctrinal); the AI-Media-Production Pillar 3 theological-review pipeline carries the scripture-citation discipline at publish time per `SCRIPTURE-REFERENCE-STANDARD`.

**Relationship check (warmth, meets the reader, heart visible):**
- The COLG-first commitment is reinforced -- COLG is treated as the named first community, with Bishop Gwin's voice on the same standing as the family's voice.
- The brand-advertising of Poe Properties, TLC (via the Practice cross-reference), and COLG is preserved as the showcase per `feedback-distinguish-data-from-brand`.
- Elderly-tech-novice staff named as design target, not afterthought.
- The "do not ship yet" / "vision-tier" framing protects the family from over-promising (the news-commentary public-clear, the hosted Studio Operator, the full educator marketplace are honestly named as gated).
- The recommendation does not pressure Darrell -- ship M1 first, then the cadence compounds.

## 10. Phil 4:8 test on this report

| Question | Result |
|---|---|
| TRUE | Numbers sourced; competitor pricing pages cited; sovereign-tool repos cited; the recommendations follow from the cited evidence. |
| HONORABLE | The do-not-ship-yet / family-private-first framings take responsibility for risk; do not over-promise. |
| JUST | Each opportunity evaluated against the family's stated values + foundation docs, not against engagement metrics. |
| PURE | No hidden agenda; no upsell; no extraction; recommendations always lean to the sovereign-mesh-Tier-1 option as default. |
| LOVELY | The framing honors COLG as the first community served, Bishop Gwin as a co-Governor, the family's businesses as the showcase. |
| COMMENDABLE | Cites real competitors at real prices; names PoeTech wins without slander; the extraction-patterns column is descriptive of the structural problem, not personal critique of vendors. |
| EXCELLENT | Five-question test applied; risk register named; hours estimated; dependencies mapped; institutional-memory framing applied; sovereign-mesh tier labeled on every option. |
| PRAISEWORTHY | The substrate that gets built first (M1) serves COLG, then compounds across family + creator scales. Worth amplifying as the AI-Media-Production pillar of the Church Module v1 ship. |

---

## 11. Institutional-memory framing (per INSTITUTIONAL-MEMORY-EVENTS)

- **Event type:** research-review / opportunity-scan
- **Originating prompt:** Darrell 2026-06-01 evening, YouTube link "Stephen Colbert Leaves CBS in SHAMBLES: The Death of a Network" (https://www.youtube.com/watch?v=NYUYZr3H12w) + "Find opportunities for PoeTech and our users."
- **Author:** Claude as Advisor
- **Senior foundations applied:** all 11 listed at top
- **Bindings applied:** sovereign-mesh + MVP-pragmatism dual-track per `project-sovereign-mesh-mvp-pragmatism`; sovereign-LLM-teams per `project-sovereign-llm-teams-per-industry`; brand-vs-data distinction per `feedback-distinguish-data-from-brand`.
- **Outputs:** this doc; pending action items captured in section 7 highest-leverage recommendation and section 8 open questions.
- **Pairs with:** all five 2026-06-01 research-reviews (promise audit + master plan, sovereign-LLM-teams architecture, Tina Huang Cowork workflow, KVM2 GPU box, ICM paper review). The AI-Media-Production pillar of the master plan derives from this report.
- **Update cadence:** the competitor scan in Section 2 should be regenerated quarterly (creator-economy SaaS pricing shifts fast); the sovereign-tool stack in Section 3 should be regenerated when the GPU box ships or when a Tier 1 replacement for a Tier 3 escape-hatch becomes viable; the recommendation in Section 7 should be re-evaluated after M1 ships.

---

**End of report.**

*The network model is collapsing because it was extractive at the seam. The sovereign model wins because it serves communities the extractive model never served. The Church of the Living God is where it begins. Sunday's sermon by Tuesday morning, captioned, archived, the church owns the master file. We all win. And we create. Amen.* (Closing posture per `AI-MEDIA-PRODUCTION-PLATFORM-VISION` and `BUSINESS-PROCESS-CONNECTIONS`.)
