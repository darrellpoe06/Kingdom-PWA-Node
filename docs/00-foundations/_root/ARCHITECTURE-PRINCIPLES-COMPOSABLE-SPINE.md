# Architecture Principles — Composable Spine, Flexible Modules

**Layer 3 foundation. Added 2026-06-09, declared with Darrell.**
**Status:** Binding architectural standard. **Spec / record only — this document authorizes no code, no purchases, no money movement, and no autonomous execution.** Standing up anything named here is a separately governed decision.
**Decision records:** **DR-0045** (Universal Work Management — the first anchor, §0), **DR-0046** (Clarification Is the Default — the second anchor, §0), **DR-0039** (flexibility-from-discipline + the Composable Spine), **DR-0040** (the Situational Auto-Tagging Engine + the auto-tag-vs-auto-mutation governance line), **DR-0042** (event-driven by default, §6.4), **DR-0043** (event usage-ranking / analytics on the tag stream, §5d), and **DR-0044** (Interface-as-Collaborative-Partner, §7) — see `docs/decisions/INDEX.md`.

**Builds on (reference, do not rebuild):**
- `MODULAR-EXTENSIBILITY.md` — one module per file; three lines to add, three to remove; one codebase, many instances. This document is the *system-level* companion to that *codebase-level* rule.
- The **Cage** (`infra/ai-orchestrator/`) — allowlisted actions, append-only audit ledger, human-escalation. The governance organ every autonomous action passes through.
- **Events-as-data** (`EXECUTION-OUTCOME-OBSERVABILITY.md`, `INSTITUTIONAL-MEMORY-EVENTS.md`) — the signal substrate the spine and the tagging engine both read from.
- The **Industry / Role Module Template** (`2026-06-09-industry-role-module-template-spec.md`; DR-0030..DR-0032) — what plugs into the spine.
- The **Continuous-Improvement + Skill-Growth Flywheel** (DR-0034) and the **Self-Extending Layer** (DR-0037) — the loops the tagging engine feeds.
- `RELEASE-TIERS.md` + `feedback_autonomous_automation_three_brakes` (memory) — the gating model for any autonomous step.
- `LEGAL-PRIVACY-BOUNDARY.md`, the TLC ISO-1 / HIPAA wall — the isolation tiers this document elevates from constraint to enabler.

**Reads through:** `CLAUDE.md` Layer 0, `GOVERNANCE-EXECUTION-ADVISORY.md` (Darrell governs, the Foundation executes, Claude advises), `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `COMMUNITY-FIRST-MISSION.md`, all under the worldview spine.

---

## 0. The Two Anchor Principles — what the whole system reports up to

Before the Composable Spine, before the modules, before any capability named below, there are **two anchor principles.** They are the most senior statements in this document: everything else here — the spine, the module rules, the tagging engine, the dashboard, the competence ladder, the data-farmed timelines — is *in service of* these two. When a design question reaches past the spine, it reports up to these. They are the architecture's *why*; the rest is the architecture's *how*.

### 0.1 Anchor I — Universal Work Management

> **One system manages and organizes ALL types of work, across EVERY industry — not a tool per domain.**

The platform is **not** a church tool, *and* a rentals tool, *and* a counseling tool, *and* a build tool that happen to share a login. It is **one work-management engine** whose method is **industry-agnostic by design** — the *same* engine runs church operations, a property portfolio, a multi-party vendor transition, a counseling practice, and a construction build. The domain changes; the engine does not.

**This is grounded, not asserted.** It is the encoding of Darrell's **20+ years across multiple industries actually maintaining real businesses** — the cross-industry operating method, learned by running the work, is the system's edge. That is the **experience-over-credentials / SKOS** thesis at the architectural altitude: the system's differentiator is not a feature set, it is an *encoded method* that has already worked across domains, made reusable. The hiring bar becomes capacity, not credentials, *because* the method is in the system (the Workforce Layer, DR-0017; PM-as-automation, DR-0029, are this anchor applied).

**Everything else rolls up to this.** The Industry / Role Module Template (DR-0030), every role module (PMO, Legal, and the candidate list, DR-0032), and the enterprise-stack vision are all **instantiations of this one engine on a new domain** — never separate products. A proposal that would build a *domain-specific tool* instead of *configuring the universal engine for that domain* fails this anchor. Recorded as **DR-0045.**

### 0.2 Anchor II — Clarification Is the Default

> **Anxiety-clarity is not a feature. It is the RESTING STATE of the entire system.**

Every module, every surface, every situation answers **what · when · why · how BY DEFAULT** (`ANXIETY-CLARITY-PRINCIPLE.md`). The right questions are **asked early, by default.** **Nothing proceeds half-understood.** This is the *floor* the whole platform stands on — not a capability one module turns on, but the baseline behavior every part inherits unless something actively removes it (and removing it is the violation).

**Why clarification-as-default is load-bearing — three reasons, all binding:**

1. **It lets a non-expert do expert work.** The clarifying questions an expert would know to ask are **asked *for* the user** — so the novice operates at expert quality without first having to become the expert (the same move as PM-as-automation, DR-0029, and the Workforce Layer's capacity-over-credentials, DR-0017). The questions carry the expertise.
2. **It makes an expert trust the system.** An expert will not hand work to a system that lets ambiguity ride — *no ambiguity rides.* The system surfaces the gap the expert would have caught, so the expert can rely on it instead of re-checking it. Clarity-by-default is what earns the expert's trust (and the Want-To-Use Bar, DR-0033, with it).
3. **It is the teaching / competence engine.** Repeated clarification *grows competence* — every time the system asks the right question at the right moment, the operator learns to ask it too. Clarification is not just risk-reduction; it is the mechanism by which the competence ladder (the Flywheel's people-growth loop, DR-0034 / DR-0035) actually climbs.

**Everything serves this through-line.** The PMO method engine (§ in the PMO spec; DR-0047) front-loads the right questions per phase and per party. The auto-tagging engine (§5) classifies so the human is never left to triage half-understood work. The dashboard (R12) answers *what is happening* without the human having to ask. The competence ladder (DR-0034/35) and the data-farmed timelines (DR-0004, living estimates) all exist so the system can answer **what / when / why / how** before the human has to wonder. Recorded as **DR-0046.**

### 0.3 How the two anchors and the Composable Spine relate

The two anchors are the **mission of the architecture**; the Composable Spine (below) is the **engineering that makes the mission survivable at scale.** *Universal Work Management* is only achievable because the spine's disciplined contracts let one engine serve every domain without forking (§1–§3). *Clarification Is the Default* is only affordable because the tagging engine, the federated signals, and the conversational interface (§5, §7) do the asking *for* the human at near-zero marginal cost. The anchors say *what the system is for*; the rest of this document says *how it holds up while delivering it.*

---

## The core principle (state it first — it is counterintuitive)

> **Flexibility comes FROM discipline, not from the absence of it.**

The instinct, when you want a system to bend to every future scenario, is to keep it loose — leave the data model open, let modules reach into each other, defer the contracts until you "see what's needed." That instinct is wrong, and it produces the *opposite* of flexibility.

Looseness *without* contracts creates **hidden dependencies.** When nothing is pinned down, every module quietly assumes the shape of every other module. Then a change anywhere breaks something somewhere unpredictable, change-requests pile up faster than they can be cleared, and the system calcifies into the thing no one dares touch. That is not flexibility — it is fragility wearing flexibility's clothes.

Real flexibility is engineered. It comes from:

- **Strong, stable contracts** — the seams between parts are explicit, versioned, and honored.
- **A clean, shared data model** — everyone speaks the same canonical language, so parts compose without translation glue.
- **Single-responsibility modules** — each part owns one slice and knows nothing of its neighbors' internals.

Discipline at the seams is *exactly* what lets the parts move independently. A module can change everything behind a stable contract and break no one. A new scenario can plug in because the plug already has a defined shape. **This is the foundation that makes "build all options" hold up:** the system scales to *all* scenarios with easy, non-breaking updates precisely because it refused to be loose where it counts.

The rest of this document is the discipline, named.

---

## 1. The Composable Spine

The **spine** is the small set of shared, stable things every module plugs into. It is built once, correctly, and then reused for free by every module and scenario that follows. The spine has four parts:

1. **A shared canonical DATA MODEL.** One set of entity shapes the whole system speaks — the universal `lifecycle` / `links` shape from `MODULAR-EXTENSIBILITY.md` (Rule 3), extended with whatever canonical entities the platform agrees on. A module that invents its own shapes for the same concepts fractures the spine; a module that adopts the canonical shapes composes for free.
2. **EVENT / API CONTRACTS.** The explicit, versioned interfaces between modules and services — the events a module emits, the events it consumes, the service calls it makes. Contracts are the *seams*; §3 governs how they change.
3. **DATA SERVICES.** The shared services no module re-implements: identity (`IDENTITY-ROLES-AUDIT.md`), the events-as-data substrate (`EXECUTION-OUTCOME-OBSERVABILITY.md`, `INSTITUTIONAL-MEMORY-EVENTS.md`), the DR ledger, the Quality Gatekeeper (wf36), persistence. A module *draws on* these; it does not *carry its own copy.*
4. **The Cage** (`infra/ai-orchestrator/`). The governance organ: allowlisted actions, the append-only audit ledger, human-escalation. Every autonomous action — by any module — passes through it. The Cage is part of the spine because governance is not a per-module afterthought; it is shared infrastructure.

### Build the spine and the FIRST module together

The spine is **not** built speculatively in isolation and then admired. **Build the spine and the first real module at the same time** — the first module *proves and hardens* the spine by being a real, demanding consumer of it. (Instance #1 is the PMO / Project-Portfolio module; DR-0027.) Abstractions invented without a consumer are guesses; abstractions extracted from a working first case are load-bearing.

Once the spine is proven by the first module, **every later module and scenario plugs in cheaply and composably** — that is the entire economic payoff. The expensive work (getting the data model and contracts right) is done once; each subsequent module pays only for its own industry-specific slice (the Industry / Role Module Template, DR-0030).

---

## 2. Module Rules

Every module built on the spine obeys these rules. They are how the spine's promise is kept module-side.

### 2.1 Single responsibility
A module owns **one slice** — one industry, one role, one capability. A module that owns two things is two modules that haven't been separated yet. (Codebase expression: one module per file, `MODULAR-EXTENSIBILITY.md` Rule 1.)

### 2.2 Loosely coupled yet composable — "dependent and independent by design"
This is the pair that makes the whole thing work, and it sounds like a contradiction until you see the seam:

- **Loosely coupled (independent):** one module **cannot break another.** Modules do not reach into each other's internals, do not share mutable state, do not import each other's guts. Disable a module and the system keeps running without it.
- **Composable (work together):** modules **cooperate through the contracts** (§1.2) — the canonical data model and the event/API interfaces. They are wired by *data shape*, not by *import chain* (`MODULAR-EXTENSIBILITY.md` Rule 3).

The resolution of the apparent paradox: modules are **independent in their implementation** and **dependent only on the stable contract between them.** They depend on the *seam*, never on each other's *insides*. That is what "dependent and independent by design" means — and it is only achievable *because* the contracts are disciplined (the core principle, applied).

### 2.3 Configuration over hardcoding
A new module's industry-specific behavior is **configuration + a small set of written-once extensions**, not a new application and not a forked build (`MODULAR-EXTENSIBILITY.md` anti-pattern: "a configure-once setup that requires editing the source code"). Discipline rules, system mappings, role taxonomy, isolation tier — these are *config the spine reads*, not *code a developer copies*. This is what makes "new industry in days" (DR-0030) true rather than aspirational.

### 2.4 Generality in the primitives, specificity instantiated on real demand
Put the generality in the **spine's primitives** (the data model, the contracts, the services) — get *those* right and reusable. Do **not** speculatively pre-build specific modules for scenarios no one is asking for yet. **Specific modules are instantiated on real demand** — a real tenant, a real ring, a recurring need the events-as-data has actually surfaced (the needs-driven-prebuild principle the Self-Extending Layer operationalizes, DR-0037).

The discipline cuts both ways: be *generous* with generality in the primitives (so anything can plug in) and *frugal* with specificity in the modules (so you don't boil the ocean building features for hypothetical users). Build the general plug; build the specific module when the demand is real.

---

## 3. Stable Contracts + Versioning

Stable contracts are what make updates **easy and safe** instead of risky. The rule:

- **Interfaces are versioned.** A contract (an event shape, an API, a data-service call) carries a version. Consumers declare which version they speak.
- **Backward compatibility is preserved across a change.** When a module or a data service changes, it does **not** break its consumers. New fields ship optional; old shapes keep rendering; migrations are lazy and idempotent (`MODULAR-EXTENSIBILITY.md` Rule 5 — "data shape changes are migrations, not surprises"). A breaking change is introduced as a *new version alongside the old*, with consumers migrated deliberately — never a silent rewrite that detonates downstream.

This is the mechanism behind the core principle: **updating one module or one data service never breaks its consumers, because the contract between them held.** Without versioned, backward-compatible contracts, every update is a gamble and the system trends toward "don't touch it." With them, the system stays *editable forever* — which is the actual definition of flexibility.

---

## 4. Isolation Tiers as ENABLER (not rigidity)

Isolation tiers — per-entity and per-sensitivity segregation, with the **TLC ISO-1 / HIPAA wall** as the strictest named example (`LEGAL-PRIVACY-BOUNDARY.md`; legal privilege at the same altitude, DR-0023) — are usually read as a *constraint*. Reframe them: **isolation is what ENABLES one flexible platform to safely serve everyone.**

Because PHI routes behind the ISO-1 wall and never commingles, and because legal privilege is segregated per-client/per-matter, **one platform can host church + clinical + business + housing + government tenants without cross-contamination.** Strip the isolation tiers out and you do *not* get a more flexible platform — you get one that can only safely serve a single low-sensitivity domain, because mixing a clinical tenant with a business tenant on an un-tiered platform is a leak waiting to happen.

So the discipline of isolation is, again, the *source* of reach: **isolation enables safe scale.** The tiers are non-negotiable per instance (the Industry / Role Module Template guardrail, and the counseling module ships ISO-1 / sovereign-only by construction). Cross-entity roll-up — even the four-entity portfolio view — never crosses an isolation firewall.

---

## 5. The Situational Auto-Tagging Engine

The spine carries raw events. The **Situational Auto-Tagging Engine** is the **semantic layer on top of the events stream**: as each situation arrives (a request, a task, an inbound message, a workflow outcome), the LLM **auto-tags** it — `type`, `urgency`, `sensitivity / isolation-tier`, `target module`, and whatever else the classification needs.

Those tags do **three distinct jobs:**

### (a) ROUTE the work — and auto-enforce isolation
The tags carry the situation to the **right module**, and — critically — they **auto-enforce the isolation tiers of §4.** A situation tagged PHI routes *automatically* behind the ISO-1 wall; a situation tagged privileged routes into the segregated legal tier. Routing and isolation are the *same* act: classifying correctly *is* enforcing the boundary. (This is why mis-tagging is a leak risk, and why §6 gates sensitive tags hard.)

### (b) SEED ANTICIPATION
Tags **accumulate.** Across many situations, patterns surface in the events-as-data: recurring bookkeeping requests with no home, repeated gaps where users reach past the edge of what exists. The accumulated tags let the system **formulate the next capability coming due** — feeding the Self-Extending Layer's anticipation function (DR-0037): "the demand is already asking for an Accounting module." **Preparing for what could be is forward momentum** — so anticipation runs *continuously* (it is advisory and cheap; §6 holds the line on what it may *do*).

### (c) FEED the feedback / Flywheel
Tagged situations are structured signal for the **Continuous-Improvement + Skill-Growth Flywheel** (DR-0034): Loop 1 (module self-improvement — where users got stuck, by type), Loop 2 (skills-match learning — what kind of work this was), Loop 3 (people-growth signals). The tags turn an undifferentiated event stream into the labeled feedback the loops learn from.

### Why this delivers "fewer change requests"
A system that **classifies, routes, and proposes itself** removes the human triage step that change-requests otherwise pile up behind. The work sorts itself to the right module; the isolation enforces itself; the next-capability proposal writes itself. The human is freed to *decide*, not to *route*. That is the core principle paying off at the operational layer: discipline in the tagging contract buys flexibility in throughput.

### (d) RANK usage — analytics that drive reduce / increase decisions

The three jobs above read each tag as it arrives. The tag stream is **also a usage signal in aggregate.** Roll up the tagged events and **rank them most-used → least-used** — counts and trend, broken out by **type, tag, and tier** — and surface that ranking on the **self-serve status dashboard** (R12; `EXECUTION-OUTCOME-OBSERVABILITY.md`). The ranking is what makes **reduce / increase** decisions data-driven instead of guessed:

- **Hot paths (most-used):** either **optimize** them — they have earned the investment — or **root-cause-reduce** them. A path fired constantly because something upstream keeps failing is a *problem to fix*, not a feature to scale; the ranking distinguishes the two.
- **Cold paths (least-used):** either **prune** them (dead weight the spine carries for no one) or **promote** them (valuable but undiscovered — a discoverability fix, not a deletion).
- **Frequent-but-untagged** situations are an **anticipation signal** — real demand reaching past the edge of what the tags know how to classify. This feeds §5(b) / the Self-Extending Layer (DR-0037): the gap *is* the next capability formulating itself.

**Guardrails (binding):**
- **AGGREGATE only.** This is roll-up statistics, never individual surveillance (`DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`). No per-person usage profile is built, stored, or surfaced.
- **TLC / PHI walled out of analytics.** The ISO-1 / clinical tier and legal privilege never enter the analytics roll-up (§4 — cross-entity roll-up never crosses an isolation firewall).
- **BOUNDED.** The analytics **roll up and then prune the raw events on a retention window** — the aggregate persists, the raw tail does not grow forever (no tail-eating; the same bounded-self-pruning discipline the Build Roadmap holds).
- **Reduce / increase are PROPOSALS, not actions.** A ranking that says "reduce this path" routes through **propose → govern → build** (§6.2). The analytics surface *what to change*; they never change it autonomously.

---

## 6. Governance Lines (binding)

Power and governance scale together. The more flexible and capable the platform, the more the Cage, the brakes, and the audit trail matter — not less. These lines are binding.

### 6.1 Auto-tagging governance — confidence-gated, sensitivity-aware
- **Low-risk tags:** the engine MAY **enrich and route autonomously.** Classifying a routine business task to the right module and tagging its urgency is the engine doing its job; it flows.
- **UNCERTAIN or SENSITIVE tags:** **confidence-gated + human-checked + audited via the Cage.** A low-confidence classification, or any tag touching a protected tier (PHI, privilege, minor data, money), does **not** silently take effect. It is held, surfaced for human confirmation, and logged in the Cage's append-only ledger (`infra/ai-orchestrator/`). **Mis-tagging protected data is a leak risk** — tagging is the isolation-enforcement act (§5a), so a wrong sensitive tag is a wrong wall. The safe-side default on any sensitive uncertainty is the *stricter* tier, never the looser one (consistent with `VISION-FAIRNESS-STANDARD.md`'s safe-side error posture).

### 6.2 The bright line: auto-TAGGING is NOT auto-MUTATION
This is the central governance distinction of this document, and it must not blur:

- **Auto-TAGGING (classify / enrich / route)** is the engine of §5. It reads a situation and *labels* it. It changes no system, builds nothing, spends nothing, mutates no user data. Within §6.1's gates, it may run autonomously.
- **Auto-MUTATION (the system rewriting itself / acting on the world)** is a different and far more dangerous thing — the **quarantined wf06 "situational analysis + auto-mutation" runaway pattern** (`SITUATIONAL-ANALYSIS-DESIGN.md`; the 2026-06-06 runaway → manual shutdown). Auto-mutation is **NOT permitted without the Cage + the three brakes** (budget, concurrency lock, kill-switch; `feedback_autonomous_automation_three_brakes`), and never above Tier A — autonomous *build / mutation* steps are **Tier C, inactive → watched → never unattended** (`RELEASE-TIERS.md`).

The operating rule that keeps the line crisp:

> **Tags PROPOSE the next systems. BUILDING waits for Darrell's greenlight.**
> **Propose → govern → build.**

The system may classify the world and propose what comes next *all day long* (advisory, read-only, cheap). It may **not** build, buy, mutate, or act on that proposal until the governor greenlights it, behind the Cage, with collaborator QA. **The system PROPOSES, the human GOVERNS, collaborators BUILD** (DR-0037, restated as a hard architectural line).

### 6.3 Governance scales with power
The flexibility this whole document buys is also *reach* — and reach is exactly what makes a mistake costly. So the binding posture: **as the platform's capability grows, the Cage + brakes + audit grow with it.** A more capable platform earns *more* governance, not a pass on it. This is not friction added for its own sake (`RELEASE-TIERS.md` warns against unearned gates); it is the governance *matched to* the blast radius the capability creates.

### 6.4 Event-driven by default — the runaway shape, removed at the trigger

A workflow's trigger fires **only when a real event lands.** The clock is a legitimate trigger **only when the clock genuinely IS the event** — a single-fire scheduled task (a dated reminder, a daily digest, a nightly backup), and then only behind the Cage. What is **never** permitted is **high-frequency polling or a self-re-queuing loop** — a workflow that wakes on a timer to *check whether* there is work, or that re-schedules itself to run again.

**Rationale — three payoffs at once:**
- **It removes the runaway shape.** There is no loop to spin. The 2026-06-06 runaway (`feedback_autonomous_automation_three_brakes`; `LESSONS-LEARNED.md`) was a timer-driven, self-re-queuing fleet; an event-driven trigger has nothing to run away *into* — it sits idle until a real event arrives.
- **It kills idle consumption.** A polling loop burns compute every interval whether or not there is work; an event-driven trigger consumes nothing until there is something to do.
- **It is real-time / faster than polling.** The work starts the instant the event lands, not on the next poll tick — lower latency *and* lower cost, the rare case where the safer design is also the faster one.

This pairs with the three brakes (§6.3 / `feedback_autonomous_automation_three_brakes`): the brakes *bound* a timer that must exist (a genuine single-fire schedule); event-driven-by-default *removes* the timers that should never have existed in the first place. Converting the existing timer workflows to event-driven triggers is tracked on the Build Roadmap (`BUILD-ROADMAP.md`).

---

## 7. Interface as Collaborative Partner

The PoeTech App interface is modeled on **how Darrell and Claude actually work together** — a **collaborative partner you converse with**, not a forms-and-dashboards app you operate. This is an architecture principle, not a UI-polish note: it sets *what the front door is.*

**The paradigm shift.** The mainstream app makes the human the operator — the human navigates menus, fills forms, reads dashboards, and assembles the answer themselves. The PoeTech interface inverts that: the human **converses**; the system does the operating. You **discuss → decide → it executes.** Forms and dashboards remain a **fallback mode** — there for when direct manipulation is genuinely faster — but **conversation is the front door**, not a chatbot bolted onto a control panel.

**The binding qualities of the partner:**

- **Conversational, not navigational.** You talk to it; you do not hunt through a navigation tree for the screen that holds the thing you need.
- **Discuss → decide → it executes.** Agreement turns into action without the human hand-assembling the steps. (The Want-To-Use Bar's "does-the-toil" property, DR-0033, realized at the interface.)
- **It BRINGS you the substance.** It reviews, summarizes, and reads back — the user **never has to go dig.** The system surfaces what matters; the human does not mine for it.
- **Anticipates and proposes; the human governs.** It sees what is coming and offers it (the auto-tagging anticipation, §5b) — and then waits. **Propose → govern → build** (§6.2) is the *interaction* contract, not only the *build* contract.
- **Holds the line honestly.** It flags risk, tells the truth, and **refuses the unsafe thing even when asked.** The guardrails — the Cage, the isolation tiers, the brakes — are **part of the design, not friction bolted on.** A partner that will not help you hurt yourself is a *better* partner, not a more annoying one.
- **Transparent and bounded.** It shows what it is doing; the user is **never "at its mercy" for status.** (The self-serve status dashboard, R12, is this quality made concrete — owned observability so the human is never blind to what the system is up to.)
- **Anxiety-clarity, always.** Every surface answers **what / when / why / how** (`ANXIETY-CLARITY-PRINCIPLE.md`) — the partner meets the scared, time-pressed human where they are.
- **The Want-To-Use bar.** The test is DR-0033's: the human reaches for it **because it is this good a partner** — pull, not push.

**Why this belongs in the architecture doc and not a design sketch.** A conversational front door only holds up if the spine underneath it is disciplined. The partner can "just do it" *because* the modules are single-responsibility and composable (§2), the versioned contracts let it route without breaking anything (§3), the isolation tiers let it act on sensitive data safely (§4), the tagging engine lets it classify-and-route what you said (§5), and the Cage lets it act autonomously *within bounds* (§6). The collaborative interface is the **payoff** of the Composable Spine, surfaced to the human as a partner instead of a control panel. It is the same relationship this document was authored in.

**Ties to:** the **Want-To-Use Bar** (DR-0033, the senior success metric); **PM-as-automation** (DR-0029 — guide / enforce / escalate, the same "manage at quality without being the expert" economics applied to the interface); and the **Conversational Space Architecture** (`CONVERSATIONAL-SPACE-ARCHITECTURE.md`). That document governs the *public many-to-many* room; this section governs the *private 1:1 app interface* — the Council Chamber's `INTAKE-AND-FIT` / `MODE-ROUTING` posture (the system deduces the needed process from what you say) applied to the whole app.

---

## 8. Don't-Miss Checklist

The short list of what this document forbids you to skip. Run it before standing up the spine, any data service, or any module.

1. **Shared data model + contracts — get them right ONCE.** The canonical entity shapes and the versioned event/API interfaces are the expensive, load-bearing work. Build them with the first module so they're proven, not guessed (§1).
2. **Versioning + backward-compat on every contract.** No update to a module or data service may break its consumers. New fields optional, migrations lazy and idempotent, breaking changes as new versions alongside old (§3).
3. **Isolation tiers preserved — always.** PHI behind ISO-1, privilege segregated, every sensitive tier honored per instance; cross-entity roll-up never crosses a firewall (§4). Isolation is the enabler, not the obstacle.
4. **Governance scales with reach.** The more capable the platform, the more the Cage + three brakes + audit apply. Sensitive/uncertain tags are confidence-gated + human-checked; auto-mutation is Cage + brakes + Tier C; building waits for greenlight (§6).
5. **General primitives + modules-on-pull.** Generality in the spine's primitives; specific modules instantiated only on real demand. No speculative over-build (§2.4).
6. **Ops + compliance load grows with reach — and is carried.** Every new tier, tenant, and isolation wall adds operational and compliance load. That load is *real* and must be *carried*, not wished away — by LLM-ops (the autonomous-but-Caged operations layer) and by the workforce (`...workforce-three-ring.md`). A platform that scales its reach without scaling who carries its ops is the unhonored-cost anti-pattern (the same honesty the Cohort Layer's funding guardrail demands, DR-0038).

---

## Cross-references

- `MODULAR-EXTENSIBILITY.md` — the codebase-level expression of every rule here (one module per file; three lines to add/remove; wire by data shape; migrations not surprises). This document is its system-level companion.
- `infra/ai-orchestrator/` (the **Cage**) — the governance organ in §1.4 and §6.
- `EXECUTION-OUTCOME-OBSERVABILITY.md`, `INSTITUTIONAL-MEMORY-EVENTS.md` — events-as-data, the substrate under §1.3 and §5.
- `SITUATIONAL-ANALYSIS-DESIGN.md` — the wf06 auto-mutation pattern §6.2 quarantines; read it to see exactly what auto-mutation is and why it is gated.
- `2026-06-09-industry-role-module-template-spec.md` (DR-0030..DR-0038) — the modules that plug into this spine; the Flywheel (DR-0034) and Self-Extending Layer (DR-0037) the tagging engine feeds.
- `RELEASE-TIERS.md` + `feedback_autonomous_automation_three_brakes` — the tiering + three brakes that gate any autonomous action (§6).
- `LEGAL-PRIVACY-BOUNDARY.md` — the strictest isolation tier, the template for §4.
- `GOVERNANCE-EXECUTION-ADVISORY.md` — Darrell governs, the Foundation executes, Claude advises; the spine of §6's "propose → govern → build."

---

## Guardrails on this document

- **This is a PLAN / standard.** No code, no purchases, no money movement, no autonomous execution flows from it. Building the spine, any data service, or any module is a separately governed decision.
- **The core principle is the test:** if a proposed "flexibility" is achieved by *removing* a contract, a tier, or a single-responsibility boundary rather than by *strengthening the seam*, it is fragility, not flexibility — and it fails this standard.
- **The Test (`MIND-OF-CHRIST.md`) was run against this output** before delivery: true (these are recorded, agreed principles — no fabrication), honorable, just, and aligned with the serve-not-extract mission and `GOVERNANCE-EXECUTION-ADVISORY.md`.

---

**End of document.** Binding from 2026-06-09 onward. Pairs with `MODULAR-EXTENSIBILITY.md` (codebase level) and the Industry / Role Module Template (DR-0030). DR-0039 and DR-0040 record the two decisions.
