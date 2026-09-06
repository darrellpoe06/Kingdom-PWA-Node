# CONTEXT.md — Layer 1: the router (ICM)

**What this is.** The top-level router the ICM layering declared and left "pending" until 2026-07-30: Layer 0 (`CLAUDE.md`, the binding rules — always loaded first) points HERE; this file points to the right Layer 3 reference and Layer 4 working material. It exists so Layer 0 stays lean (every byte of CLAUDE.md is paid by every session before any work) and the map lives one hop away, loaded only when routing is needed.

**Where things live.** Layer 3 reference: `docs/00-foundations/_root/` (authoritative foundations, annotated below). Layer 4 working: `docs/99-session-notes/` (dated artifacts, newest first). Decisions: `docs/decisions/` (`INDEX.md` = what is decided; `PRINCIPLES.md` = binding-principle IDs). Reviews: `docs/reviews/REVIEWS.md` (the watcher-swept ledger — every `re-review:` date in decisions, session-notes, foundations, and INDEX now reports to the daily review-watcher and its rolling `overdue` issue).

## The annotated foundation index (moved verbatim from CLAUDE.md Layer 0, 2026-07-30)

## SKOS Foundations (Added 2026-05-13)
The following foundation documents in `docs/00-foundations/_root/` are authoritative and govern all SKOS-generated content. Read them before generating substantive content for this project:
- `THE-WAY.md` — Meta-frame. SKOS IS The Way. Every module and foundation operates within this frame.
- `MIND-OF-CHRIST.md` — Mental stewardship foundation. NOTICE → TEST → CAPTURE → REDIRECT.
- `SCRIPTURE-REFERENCE-STANDARD.md` — Translation citation rubric (ESV primary, KJV secondary, NIV/AMP/Strong's for clarification).
- `EXCELLENCE-STANDARD.md` — Religion AND relationship balance. Representatives of the King.
- `ANXIETY-CLARITY-PRINCIPLE.md` — Anxiety is informational at root: people don't know what to do. Every surface answers what / when / why / how. Faith-expressed-in-works. Errs toward MORE guidance, optimizing for the scared parent. (Added 2026-05-28.)
- `AI-FOUNDATION-INTERNAL-OPERATIONS.md` — The AI Foundation on the NAS operates the system, including the system itself. Anything that is a click today should be an API call tomorrow, called from a workflow. Browsers are for humans deciding things, not for systems doing things. (Added 2026-05-28.)
- `GOVERNANCE-EXECUTION-ADVISORY.md` — Three-role distribution: Darrell governs, Foundation executes, Claude advises. Standing test for every action: does this lift the family AND create rather than extract. We all win. And we create. (Added 2026-05-28.)
- `SEED-DATA-AS-ASPIRATION.md` — The starter state is the first impression of what success looks like. No real Poe family info; shows a thriving stewardship picture (steady income, growing buffer fund, debt being chipped down, consistent tithe) that triggers desire to use the system to get there. (Added 2026-05-28.)
- `BUSINESS-PROCESS-CONNECTIONS.md` — Every visible surface is one end of a connection; the other end must be wired before the surface ships. Four-question test for any business-facing surface: what does it invite / what pipeline carries it / who governs incoming volume / what's the visible promise. Marketing surfaces follow pipeline readiness. Named skill F.7 in SYSTEM-SKILLS-INVENTORY; named Role 7 (Connection-Thinker) in AI-TEAM-DISTRIBUTION. (Added 2026-05-28.)
- `PERPETUAL-PIPELINE-HEALTH.md` — Resilience standard for every workflow. Thirteen rules: all persistence on bind mounts, try-catch every external I/O, idempotent design, health-check per workflow, standard error envelope, Funnel auto-restart on boot, bearer auth, rate limit, tests, lifecycle states, daily backups, monitoring, standard documentation. Quality Gatekeeper (Role 10) enforces. Recovery procedures named. "Unbreakable" is the standard. (Added 2026-05-29.)
- `VISION-FAIRNESS-STANDARD.md` — Every vision-LLM / facial-recognition model deployed on the platform must be evaluated for accuracy parity across skin tones. Eight rules including a 5-percentage-point parity bar, family-data-first calibration, per-task evaluation, six-month audit cadence, safe-side error defaults, and family-voice routing for any fairness failure. Non-negotiable for the visitor-recognition / auto-door surface and for Christyn's basketball coaching vision pipeline. (Added 2026-05-29.)
- `COMMUNITY-FIRST-MISSION.md` — Mission-level binding. PoeTech serves communities the mainstream tech industry has overlooked, underserved, or actively failed. The Church of the Living God (the Poe family's home church, 44,000 sqft, largest African American community in Champaign-Urbana, elderly tech-novice staff) is the named FIRST community. Seven commitments including COLG-first, accessibility default, VISION-FAIRNESS-STANDARD enforcement, sovereign infrastructure, serve-not-extract pricing, train-the-community, family-and-community voices on design. Church Module generalizes from COLG's needs to other churches anywhere in similar situations. (Added 2026-05-29.)
- `QUALITY-OF-LIFE-AS-NORTH-STAR.md` — The senior evaluation question for every product decision: does this measurably improve quality of life for the family or community using it? Seven rules including system-as-mirror-never-judge, family-defines-what-matters, opt-in per sector, family-configurations-vary-platform-honors-them, community-aggregation only via explicit per-study opt-in, faith-grounded measurement, QoL is the merge gate. Multi-sector framework (financial, physical, relational, spiritual, mental, community, education, vocational, environmental). (Added 2026-05-29.)
- `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md` — Structural commitment that data exists to serve the family + community, never to be extracted from them. Five architectural commitments (sovereign, open-source core, exportable, no advertising model, no engagement optimization), eight binding behaviors (family ownership, opt-in per stream, minor protections, no insurance/employer/advertiser access ever, aggregation requires explicit per-study opt-in, audit log on every access, deletion is immediate + verifiable, family voice governs all changes), five anti-patterns that never ship (dark UX, engagement maximization, surveillance disguised as service, data lock-in, consent fatigue). The structural difference from extractive mainstream tech IS the competitive moat. (Added 2026-05-29.)
- `AI-MEDIA-PRODUCTION-PLATFORM-VISION.md` — Long-arc vision: sovereign AI-driven media production built on same principles as PoeTech. Six purposes: marketing / development / business systems / media / theological foundation / supporting the Kingdom of Yahweh. Six pillars: sovereign generation / family-curated library / theological review pipeline / distribution sovereignty / audience consent / perpetual improvement. Built on existing infrastructure (Whisper, workflows 30/36/41-43, future GPU box). NOT a separate project; the natural extension. (Added 2026-05-29.)
- `UX-PATTERNS.md` — Cross-app UX patterns including the Scripture component, TTS spec, and the Test tool.
- `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` — The source-of-answers text declared above. Lives at `docs/00-foundations/_root/THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`. Already drafted: integration is the relationship, the first death is the doorway, asking-and-receiving is fruit not goal, the watching-recognizing-recording posture, the gap and the bridge, Job as the named exemplar, the reprogramming-by-story work. The agent reads this before generating any worldview-grounded content.
- `COUNCIL-CHAMBER.md` — The universal input-to-output surface. The system deduces the needed process based on input of the user by voice or text. Two modes — Council Chamber (listening / Scripture-mirrored) and Dev/Ops (problem-solving) — same PWA, same input pipeline, classifier auto-routes, visible mode badge, never-auto-switch. The four-section response posture (Hear → Mirror → Anchor → Invite) is binding for Council Chamber replies. Pastoral, not clinical (the TLC bright line is held).
- `MODE-ROUTING.md` — Classifier spec, single source of truth for routing UX shared by Counseling and Dev/Ops.
- `INTAKE-AND-FIT.md` — The Dev/Ops counterpart; the system deduces between the two modes by input analysis.
- `ACCESS-TO-THE-HUMAN-MIND.md` — Response-tuning source for what Scripture says about influence on the mind, divine and adversarial.
- `LESSONS-LEARNED.md` — Comprehensive historical record. Every incident, near-miss, surprise, and discovery — distilled to extracted principles + forward architectural fix. Layer 3 foundation per Darrell 2026-06-03 evening ("lessons learned area for comprehensive historical records"). Companion to EXECUTION-OUTCOME-OBSERVABILITY (catches failures) and INSTITUTIONAL-MEMORY-EVENTS (structures them as data). Read this BEFORE designing new surfaces so prior failures don't recur. First entry: 2026-06-03 localStorage hydration leak. (Added 2026-06-03.)
- `RELEASE-TIERS.md` — The three-tier release model. Tier A ships direct to main (< 5 min: security/privacy fixes, documented bug fixes, copy/typo corrections, memory + foundation-doc updates, NAS-only sovereign surfaces, anything passing the six low-risk tests). Tier B soaks 30-60 min on a feature branch's Vercel preview (new features, visual changes, workflow refactors, tier/pricing copy). Tier C runs a ~1 week soak + structured family review + Quality Gatekeeper sign-off (architectural changes, front-door/mission identity, sponsor curation, Family Voice Loop, COLG-facing surfaces, new family/community onboarding, real money flow). Default: Tier A unless a change explicitly meets Tier B/C criteria; do not add gates where they are not earned. Operational sibling to LESSONS-LEARNED.md (ties to P3/P4 production-outcome verification). Pairs with `feedback-risk-clarify-before-change` (six low-risk tests) + `project-continuous-feedback-reel`. wf36 holds the "Tier check (stub)" structural hook. (Added 2026-06-03.)
- **Dispatch Status live readout convention (NAS-hosted, sovereign)** — the always-on system-visibility surface (fallback for the Anthropic Claude mobile app Dispatch tab) is served FROM THE NAS, not Vercel/poetech.us, per the sovereignty principle: internal-only surfaces live on the NAS (see AI-FOUNDATION-INTERNAL-OPERATIONS). Two n8n workflows: `wf-dispatch-status-page` returns the entire self-contained HTML page at GET `/webhook/dispatch-status-page` (the URL the family opens — `http://192.168.1.26:5678/...` on LAN or `https://poetech.tail5a2f35.ts.net/...` via Funnel); `wf-dispatch-status` serves the JSON data at GET `/webhook/dispatch-status?section=reel|tasks`, which the page fetches same-origin. Data lives under the poetech-briefing bind mount: `/data/poetech-briefing/_reel.jsonl` (append-only JSONL event reel; one JSON object per line; last 50 served newest-first) and `/data/poetech-briefing/_dispatch_state.json` (the Code Task snapshot: `{ snapshot_at, tasks: [...] }`, where a null/stale `snapshot_at` means the orchestrator is offline). The orchestrator owns writing both data files. Access control = the NAS being Tailscale/LAN-only reachable (no public attack surface; no hostname gate needed). (Added 2026-06-03.)

## The other Layer 3 foundations in `_root/` (unannotated — read the header of the file itself)

- `docs/00-foundations/_root/ACCESS-AND-ONBOARDING-MODEL.md`
- `docs/00-foundations/_root/AI-TEAM-DISTRIBUTION.md`
- `docs/00-foundations/_root/ARCHITECTURE-PRINCIPLES-COMPOSABLE-SPINE.md`
- `docs/00-foundations/_root/ARI-PERSONA.md`
- `docs/00-foundations/_root/AUTONOMOUS-BUILDER-LIFECYCLE.md`
- `docs/00-foundations/_root/AUTONOMOUS-OPERATING-MODEL.md`
- `docs/00-foundations/_root/BEHAVIORAL-MIRROR.md`
- `docs/00-foundations/_root/BIBLICAL-ECONOMICS-TEACHING-PATTERNS.md`
- `docs/00-foundations/_root/BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md`
- `docs/00-foundations/_root/BUILD-ROADMAP.md`
- `docs/00-foundations/_root/CHURCH-TAB-DIRECTORY.md`
- `docs/00-foundations/_root/COLG-SERMON-INTAKE.md` — the Way a COLG sermon becomes a lesson: trigger on the SENDER (bg@), read the `.docx` ATTACHMENT (the body is empty), attribute from the subject (BG sends; McCray/Forman often preached), then a second pass when the sermon reaches YouTube. DR-0333.
- `docs/00-foundations/_root/CLAUDE-BATCH-API-PATTERN.md`
- `docs/00-foundations/_root/CLAUDE-PROMPT-CACHING-PATTERN.md`
- `docs/00-foundations/_root/CLAUDE-TOOL-ROUTING.md`
- `docs/00-foundations/_root/CLIENT-BUSINESS-FACTORY.md`
- `docs/00-foundations/_root/COMPLETION-ROADMAP.md`
- `docs/00-foundations/_root/COMPREHENSIVE-REVIEW-STANDARD.md`
- `docs/00-foundations/_root/CONNECTED-CONTEXT.md`
- `docs/00-foundations/_root/CONVERSATIONAL-SPACE-ARCHITECTURE.md`
- `docs/00-foundations/_root/COWORK-ACCOUNT-OPERATING-INSTRUCTIONS.md`
- `docs/00-foundations/_root/ECOSYSTEM-PARTICIPANTS.md`
- `docs/00-foundations/_root/EDITABLE-EVERYWHERE.md`
- `docs/00-foundations/_root/ENTRANCE-REVIEW.md`
- `docs/00-foundations/_root/EXECUTION-OUTCOME-OBSERVABILITY.md`
- `docs/00-foundations/_root/FAMILY-ACCESS-PROCESS.md`
- `docs/00-foundations/_root/FATHERS-PROVOKE-TO-GOOD-WORKS.md`
- `docs/00-foundations/_root/FOUNDERS-CONFESSION.md`
- `docs/00-foundations/_root/IDENTITY-ROLES-AUDIT.md`
- `docs/00-foundations/_root/IN-PLACE-FIRST.md`
- `docs/00-foundations/_root/INFRASTRUCTURE-PIPELINE.md`
- `docs/00-foundations/_root/INPUT-VISIBILITY-TO-CLAUDE.md`
- `docs/00-foundations/_root/INSTITUTIONAL-MEMORY-EVENTS.md`
- `docs/00-foundations/_root/KINGDOM-SYSTEMS-AND-THE-WAR-OF-THE-MIND.md`
- `docs/00-foundations/_root/LEGAL-PRIVACY-BOUNDARY.md`
- `docs/00-foundations/_root/LIFECYCLE-AND-HANDOFF.md`
- `docs/00-foundations/_root/MARKETPLACE-ARCHITECTURE.md`
- `docs/00-foundations/_root/MINISTRY-SUPPORT-PATTERN.md`
- `docs/00-foundations/_root/MODULAR-EXTENSIBILITY.md`
- `docs/00-foundations/_root/N8N-WEBHOOK-AUTH-PATTERN.md`
- `docs/00-foundations/_root/NARRATIVE-VISION.md`
- `docs/00-foundations/_root/NAS-LOOP-RUNNER-PATTERN.md`
- `docs/00-foundations/_root/ORCHESTRATION-AND-VERIFICATION-OPERATING-MODEL.md`
- `docs/00-foundations/_root/PARABLE-AND-TESTIMONY-METHOD.md`
- `docs/00-foundations/_root/PM-METHOD.md`
- `docs/00-foundations/_root/QUALITY-GATEKEEPER.md`
- `docs/00-foundations/_root/RELEASE-LANE.md`
- `docs/00-foundations/_root/SCRIPTURE-LIBRARY.md`
- `docs/00-foundations/_root/SERVICE-MANAGEMENT.md`
- `docs/00-foundations/_root/SITUATIONAL-PEACE.md`
- `docs/00-foundations/_root/SOVEREIGN-COMMS-AND-MEETINGS.md`
- `docs/00-foundations/_root/SYSTEM-SKILLS-INVENTORY.md`
- `docs/00-foundations/_root/THE-ROOT-OPEN-INVESTIGATIONS.md`
- `docs/00-foundations/_root/THE-ROOT-POSITIONS-AND-INQUIRY.md`
- `docs/00-foundations/_root/THE-ROOT.md`
- `docs/00-foundations/_root/USER-ACCOUNTS-AND-HISTORIES-STANDARD.md`
- `docs/00-foundations/_root/VISUAL-IDENTITY.md`
- `docs/00-foundations/_root/WORKFLOW-MODULE-LIBRARY.md`
