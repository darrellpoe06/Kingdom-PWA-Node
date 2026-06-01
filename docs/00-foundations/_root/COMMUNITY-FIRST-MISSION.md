# Community-First Mission — Serving Communities Underserved by Mainstream Tech

**Declared by Darrell, 2026-05-29 from vacation:**

> "We want to use technology to support our businesses and The Church Of The Living God community and Ai LLMs as local support systems supported by the PoeTech app and use that as a module for other churches anywhere who need development and infrastructure support. We are in the largest African American community in the Champaign Urbana-Champaign area. Our church family pulled together to build a 44000 sqft church. We could not and still can't find technology support so we have to cultivate it internally however all the full time support staff for the church are elderly and technology is not their first love or choice. We want to build systems that can support these types of communities. African American churches seem to have difficulty getting support from the broader technology companies in their areas. PoeTech needs to be able to fill those gaps."

This is a mission-level foundation. Joins THE-WAY, MIND-OF-CHRIST, EXCELLENCE-STANDARD, ANXIETY-CLARITY-PRINCIPLE, AI-FOUNDATION-INTERNAL-OPERATIONS, GOVERNANCE-EXECUTION-ADVISORY, SEED-DATA-AS-ASPIRATION, BUSINESS-PROCESS-CONNECTIONS, PERPETUAL-PIPELINE-HEALTH, AI-MEDIA-PRODUCTION-PLATFORM-VISION, and VISION-FAIRNESS-STANDARD as senior foundation. It is also a binding constraint on how PoeTech goes to market and who PoeTech serves first.

## The mission

PoeTech exists to serve communities the mainstream tech industry has overlooked, underserved, or actively failed. The Church of the Living God — the Poe family's home church, pastored by **Bishop Gwin** (Darrell's father in love), one of the largest African American Non-Denominational churches in the Champaign-Urbana area, the church family that pulled together to build their own 44,000 square foot building — is the FIRST such community. The platform that works for them works for any church or community in their situation. The module they need becomes a SKOS module that ships nationally to other churches in similar circumstances.

This is not a charity model. This is not "build it for affluent customers and trickle it down." This is the historic biblical pattern reversed in modern technology: the King serves the marginalized first, and what serves the marginalized well serves everyone.

## The reality being named

### Underserved by mainstream tech

Mainstream technology companies prioritize markets they understand and customers they look like. African American communities — and many other historically marginalized communities — receive less sales attention, less product customization, less local support, and less consideration in product design from the major tech vendors. This is well-documented and unchanging.

The result: institutions in these communities have to cultivate their own technology capacity internally. The Church of the Living God is a concrete example — they built a 44,000 sqft physical structure because the community came together; they have to similarly build their own technology capacity because the tech industry didn't come together for them.

### Elderly staff, tech not their first love

The full-time church support staff are elderly. Technology is not their first love or choice. They were called to ministry, not to system administration. They want to serve the congregation; tech is a means, not an end. Many similarly-situated churches across the country share this exact reality.

The tech that serves them must be:

- **Simple by default.** Large fonts. High contrast. Big tap targets. No surprise modal states. Predictable behavior.
- **Voice-first where possible.** Speaking is easier than typing for elderly users + for anyone whose hands are busy with ministry work.
- **Forgiving.** Every action reversible. No "are you sure?" anxiety; the system holds the undo so the human doesn't have to.
- **Training included.** The PWA itself teaches the user how to use it, not "go read the manual." Onboarding is in-product, paced, optional to revisit.
- **Generation-aware.** What works for a 70-year-old deacon's smartphone use is different from what works for a 20-year-old's. The system meets each user where they are.

### Cultivating internally as the model

When external tech support is absent, communities cultivate internal tech capacity. Christian's apprenticeship (per `2026-05-29-christian-tech-apprenticeship.md`) is the family-scale instance of this pattern. The Church Module is the community-scale instance: train a few church members (often youth + young adults — they grew up digital) to operate the platform; PoeTech provides the AI-supported tooling that makes their internal capacity sufficient.

The result: COLG doesn't depend on a vendor that may or may not show up. They have the tools + the training + the AI support to do for themselves. PoeTech earns trust by being the partner who came when others didn't, and stays trusted by never extracting from them.

## The seven commitments

Every product decision touching the Church Module — and by extension any future module serving underserved communities — passes these seven binding commitments.

### Commitment 1 — Serve COLG first, generalize from there

The Church Module ships to The Church of the Living God FIRST. Their staff. Their needs. Their constraints. Their feedback drives the v1 design. Only after the module serves them well does it generalize to other churches.

This is the inverse of the "build for a wide market and customize for niches" pattern. We build for a specific community and let the specifics teach us what generalizes.

### Commitment 2 — Accessibility for elderly + non-technical users is default, not optional

WCAG AA minimum on every surface. Large-text mode standard, not behind a settings dive. Voice input for every text field. Reading-out option for every visible text. Color combinations passing high-contrast standards. No animations that confuse or distract. No required password-typing — magic-link or biometric or device-trust where possible.

This is non-negotiable. If a feature can't be made accessible, it doesn't ship for the Church Module; it ships only for the technical-user surfaces.

### Commitment 3 — VISION-FAIRNESS-STANDARD applies to every vision feature in the Church Module

Pulpit cameras for sermon recording, security cameras around the building, photo-organization tools for the church's media archive — every vision feature evaluates accuracy across skin tones per the standard. A church that's predominantly Black in membership being served by computer vision that doesn't recognize Black faces is exactly the failure pattern PoeTech is built to NOT repeat.

### Commitment 4 — Sovereign infrastructure where possible

The Church Module runs on the church's own infrastructure where feasible (a Synology NAS in the church office, an UCG-Max for the church network, sovereign AI on the church's hardware). Cloud dependencies only where genuinely required and only with explicit governance.

This matters because: (a) ongoing SaaS costs are the silent tax that grinds down community institutions, and (b) data sovereignty over church records (membership, giving, pastoral care notes, etc.) is a stewardship requirement.

### Commitment 5 — Pricing that serves rather than extracts

Three-tier pricing model:

- **Self-host tier — free + open source.** Any church can self-host the module. PoeTech provides the code, the documentation, the training, the AI workflows. The community installs and runs it themselves (with optional paid support if they want it).
- **Supported tier — flat per-month at a fair amount.** PoeTech hosts a managed instance for the church; the church pays a monthly fee that covers infrastructure + reasonable margin. No per-seat scaling; if the church has 200 members or 2,000, the price is the same.
- **Partnership tier — for communities that have built capacity and want to extend it.** Larger churches that have technology resources can become PoeTech partners — they pilot new features, contribute fixes, mentor smaller churches into the platform. Their fee is rebated against the value of their contribution.

No per-seat trap. No data lock-in. No "you can't export your data unless you pay more." Any church can leave with their data, anytime, no friction.

### Commitment 6 — Train the community to operate, don't make them dependent on us

Every feature ships with self-guided training (in-product walkthroughs + recorded videos via the AI Media Production Platform). Every Church Module client gets quarterly virtual office hours with the PoeTech team during their first year. Every Church Module client is connected to the Church Module user community (Synology Chat channel or similar) where they can ask each other questions.

The goal is operational independence + community mutual-support. PoeTech is the catalyst, not the bottleneck.

### Commitment 7 — Family + community voices on the design

Christina + Darrell have direct lived experience of COLG's needs. Their voices on the Church Module have weighted authority. As other churches join, their leaders' voices get the same weight. The platform isn't designed for the imagined elderly Black deacon; it's designed WITH actual elderly Black deacons + with their pastors + with their youth ministry leaders.

The Family-Voice extension of BUSINESS-PROCESS-CONNECTIONS extends to a Church-Voice extension here: every church running the module has a feedback channel back into the platform.

## Initial feature set the Church of the Living God needs (suggested v1 scope)

### Tier 1 — Operational basics

- **Membership directory** with privacy controls (who in the church can see what; deacons see contact info, others see name + photo only).
- **Giving + tithing tracker** with end-of-year tax receipts auto-generated. Connects to church's existing financial workflows.
- **Calendar + event coordination** — service times, weddings, funerals, youth group, choir rehearsals, board meetings. Family-style usability not corporate-style.
- **Communication broadcast** — pastor or ministry leader sends a message to a group; goes via the channel each member prefers (SMS, email, app notification).
- **Prayer request capture** — anonymous-optional, surfaces to intercessor team, archived with sensitivity.

### Tier 2 — Media + outreach

- **Sermon recording + archiving** — pulpit cameras, post-service auto-editing per the AI Media Production Platform vision, publishing to canonical home + mirrors. Closed captions for accessibility. Foreign-language subtitle support (especially Spanish given Christiana's capability + the local community).
- **Livestream support** — for members who can't attend in person.
- **Online presence** — the church's website, social media coordination, search visibility — all AI-assisted, with church staff approval per piece.

### Tier 3 — Community + ministry

- **Pastoral care workflows** — confidential pastor-to-member conversations (Council Chamber pattern from the existing COUNCIL-CHAMBER foundation doc applies here). Sensitive content stays sovereign per TLC firewall pattern extended.
- **Small group coordination** — find your group, attend, follow up.
- **Visitor follow-up** — first-time visitors get a respectful welcome sequence with their consent. Per BUSINESS-PROCESS-CONNECTIONS, the welcome is wired through to actual relationship building, not just automation.
- **Mutual aid coordination** — if a church family has a need (meal train after surgery, ride to a doctor's appointment, help moving), the system surfaces it appropriately to those who can help.

### Tier 4 — Generalization layer

- **Multi-church federation** — when N>1 churches run the module, they form a network. Best practices flow between them. Resource sharing where appropriate. Joint events possible.
- **Theological alignment options** — denominations or traditions have different practices; the module supports them as configuration, not as separate code forks.
- **Local language + cultural defaults** — the module ships with English + Spanish defaults (per Christiana's bilingual capability + the local Hispanic community); other languages added as churches join from other communities.

## Architectural shape

### Where the work happens

- **PoeTech NAS (DS1621xs)** — central development + the Poe family's church-operations data.
- **COLG's own NAS** (acquired post-vacation as part of Church Module pilot) — runs the module locally for COLG. Sovereign to the church.
- **Bridge workflows** — between PoeTech's platform development environment and COLG's production instance, with clear separation. COLG's data is COLG's data.

### New workflows (post-vacation, sequencing TBD)

**Workflow 51 — Church module operations.** The core dashboard for church staff. Members, events, giving, announcements.

**Workflow 52 — Sermon production pipeline.** Pulpit-cam ingest, auto-transcribe (Whisper), auto-caption, archive, optional public publish.

**Workflow 53 — Pastoral care intake (Council Chamber pattern).** Confidential, sovereign, never-clouds.

**Workflow 54 — Member directory + privacy controls.** Multi-role visibility (deacon / pastor / member / public / guest), per-member privacy settings.

**Workflow 55 — Giving + tithing tracker.** Connects to whatever payment processor the church uses (Tithe.ly, Pushpay, manual). Auto-generates year-end receipts.

**Workflow 56 — Communication broadcast.** Multi-channel (SMS via Twilio, email via Postmark / Resend, in-app notification, optional ntfy for those who use it).

**Workflow 57 — Cross-church federation layer** (Tier 4, later) — multi-tenant for churches; per-church RLS isolation; opt-in resource sharing.

### PWA surfaces

- **Church-Connected persona** (the seventh baseline mode mentioned in the personalized UI classifier from the data-dump spec) — when a family member identifies as part of a participating church, the system surfaces church-relevant features.
- **Church staff dashboard** — only visible to authenticated church staff (Phase 4 multi-tenant prerequisite). Highly accessibility-tuned per Commitment 2.
- **Public church surfaces** — visitor view, service times, contact, donation, prayer requests, sermon archive.

## Sequencing

This is a major workstream that competes with the data-dump release for post-vacation priority. Sequencing options:

**Option A — Data-dump release first, then Church Module.** The data-dump release is closer to ship; finish it (3-5 weeks), then begin Church Module (months of work). Risk: COLG doesn't see motion on their need for an extended period.

**Option B — Parallel paths.** Data-dump release gets primary code attention; Church Module gets infrastructure + foundation + design work + small early-wins (membership directory, communication broadcast) in parallel. Risk: divides focus.

**Option C — Church-first pivot.** Pause data-dump release work; focus on Church Module for 8-12 weeks. Ship COLG's first version. Then resume data-dump. Risk: data-dump becomes longer arc.

Recommendation: **Option B (parallel paths)** with a clear governance gate at the 4-week mark. The Church Module's foundation work + first small wins ship alongside data-dump release work. After 4 weeks, Governor reassesses: is the parallel pacing sustainable? Pivot if needed.

The Governor (Darrell, with Christina as co-Governor for any church-touching decisions) decides per Option A/B/C. This document doesn't make the call.

## Connection to other foundations

- **THE-WAY** — the platform serving the church family that IS the platform's home community is The Way embodied operationally. Serve where you are first.
- **EXCELLENCE-STANDARD** — religion AND relationship. The seven commitments are the religion (backbone); the actual deacon picking up the phone to use the system is the relationship (warmth + accessibility + dignity).
- **VISION-FAIRNESS-STANDARD** — non-negotiable for the Church Module given the community's demographics. Every vision feature evaluated for melanated parity before ship.
- **AI-MEDIA-PRODUCTION-PLATFORM-VISION** — sermon recording, archiving, captioning, language support all live here. The Church Module is the AI Media Platform's first major customer.
- **AI-FOUNDATION-INTERNAL-OPERATIONS** — the elderly church staff don't need to click through forty screens; the AI Foundation runs the operational layer behind the simple surfaces they see.
- **GOVERNANCE-EXECUTION-ADVISORY** — Darrell + Christina co-Govern church-touching decisions. COLG leadership becomes a co-Governor in their domain when the module ships.
- **BUSINESS-PROCESS-CONNECTIONS** — every visible feature in the Church Module passes the five-question test. Family-Voice extension applies: church voices route through workflow 30 family-feedback (extended with a `church-leadership` sender trust tier).
- **PERPETUAL-PIPELINE-HEALTH** — Church Module workflows follow the thirteen rules. A church can't have their platform go down on a Sunday morning.
- **SEED-DATA-AS-ASPIRATION** — the Church Module's seed data shows what a thriving church looks like running this system. Honest, achievable, not perfect, not corporate.
- **COUNCIL-CHAMBER + MODE-ROUTING + INTAKE-AND-FIT** — pastoral care surfaces inherit the existing universal-input-to-output architecture.
- **SKOS marketplace vision** — Church Module is the third concrete specialist category (after the matched-services + chef module). Validates the marketplace breadth.

## Risk + mitigation

**Risk: PoeTech tries to serve too many constituencies and serves none well.** Mitigation: COLG-first commitment is binding. Other churches wait until COLG is served well + the module is generalizable. Governor enforces.

**Risk: the Church Module gets built but COLG can't operate it.** Mitigation: Commitment 6 (train the community). PoeTech provides ongoing support during the first year, not just product. Christian + Christiana + other family youth become trained operators alongside church youth.

**Risk: the AI-augmented operations layer fails when the AI is unavailable.** Mitigation: PERPETUAL-PIPELINE-HEALTH applies. Local Ollama is sovereign + free + always available. Cloud LLM dependencies always have local fallbacks for church-critical surfaces.

**Risk: the church's data leaves the church's control.** Mitigation: Commitment 4 (sovereign infrastructure). COLG runs its own instance. Data exports always available. PoeTech doesn't aggregate church data for any commercial purpose.

**Risk: pricing creates barriers to the very communities the mission targets.** Mitigation: Commitment 5. Self-host tier is FREE + open source. Cost is never the barrier to a church accessing the module.

**Risk: cultural misalignment — building for an imagined community instead of the real one.** Mitigation: Commitment 7. Christina + Darrell as voices for COLG; church leadership as voices when module ships there; participating-church leaders as voices once the federation forms.

## Closing

The Church of the Living God built their own 44,000 sqft building because the community came together when no one else would. The Church Module is the technology version of that pattern: the platform serves them because no one else does, and what serves them well becomes what serves many similar communities well.

PoeTech earns trust by being the partner who came when others didn't. PoeTech keeps trust by never extracting from the trust given. The Kingdom of Yahweh shows up in the work when the work is done for the communities the Kingdom always centers — the overlooked, the underserved, the ones the mainstream tech industry forgot.

Serve where you are. Build what they need. Trust the community to teach you how. Generalize from the specific, never the other way around.

We all win. We create. Amen.
