# Architecture Principles — Composable Spine, Flexible Modules

**Layer 3 foundation. Added 2026-06-09, declared with Darrell.**
**Status:** Binding architectural standard. **Spec / record only — this document authorizes no code, no purchases, no money movement, and no autonomous execution.** Standing up anything named here is a separately governed decision.
**Decision records:** **DR-0039** (flexibility-from-discipline + the Composable Spine) and **DR-0040** (the Situational Auto-Tagging Engine + the auto-tag-vs-auto-mutation governance line) — see `docs/decisions/INDEX.md`.

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

---

## 7. Don't-Miss Checklist

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
