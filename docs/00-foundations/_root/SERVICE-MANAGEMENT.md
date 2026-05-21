# Service Management — How PoeTech delivers in Dev/Ops mode (ITIL + PMP, operator-side)

> Founder framing (2026-05-21):
> *"Church and Technology with ITIL and PMP to integrate quality of life and lowering stress of the users by whatever seems necessary based on their input."*

**ESV — 1 Corinthians 14:40:** *"But all things should be done decently and in order."*

**ESV — Proverbs 24:6:** *"For by wise guidance you can wage your war, and in abundance of counselors there is victory."*

## What This Document Is

This document binds the **operator-side discipline** that governs how SKOS / PoeTech delivers. It names ITIL 4 (the IT Infrastructure Library, service management standard) and PMBOK / PMP (Project Management Institute body of knowledge) as the explicit frameworks behind what is already shipping. The user never sees ITIL or PMP. The operator runs by them.

Two distinctions matter:

- **`COUNCIL-CHAMBER.md`** governs the *user-side experience* in listening mode.
- **`INTAKE-AND-FIT.md`** governs the *intake and screen* for Dev/Ops work.
- **This document** governs how that work gets *delivered* once accepted: ticket flow, project flow, change control, service-level expectations, knowledge capture, risk management.

The animating purpose is named in the founder framing: *"integrate quality of life and lower stress of the users by whatever seems necessary."* Service management exists to make the operator a quieter, faster, more dependable presence in the user's life. Done right, the user notices the absence of friction more than the presence of process.

Operator background informs the binding: Darrell holds ITIL and PMP literacy from ~15 years at UIUC across multiple enterprise roles, current Tech Director at The Church of the Living God, and 25+ years of operating experience across retail, moving/storage, higher ed, and small business. The frameworks below are not aspirational — they are the discipline already running, made visible.

---

## Service vs. Dev/Ops — The Hierarchy

> Founder framing (2026-05-21):
> *"Service is a lower level than Dev/Ops. It's service with preloaded solutions that humans do the least amount of work for the most optimal outcomes — because they are designed and developed to operate based on specifications given before issues, and iterate until perfectly supporting operations."*

**ESV — Philippians 1:6:** *"And I am sure of this, that he who began a good work in you will bring it to completion at the day of Jesus Christ."*

**ESV — Isaiah 28:10:** *"...precept upon precept, line upon line, here a little, there a little."*

The two layers are distinct and the order matters.

| Layer | What it is | Human effort | Iteration | Example |
|---|---|---|---|---|
| **Service** (lower / autonomous) | Preloaded solutions that run on specifications without operator intervention. Self-tuning over time. | Minimum — by design. Humans intervene only on signal. | Continuous — every closed item refines the spec for next time. | The Action Queue auto-surfaces a late tenant; the default urgency button presets the right resolution window; the system handles the next 80% of similar cases without re-decision. |
| **Dev/Ops** (higher / engineering) | The layer that authors, refines, and ships specifications *into* Service. | Higher — but bounded. Operator engineering time. | Each Dev/Ops cycle produces a new precept; precept upon precept, Service gets quieter. | Operator notices three late-tenant cases handled clumsily; opens a Dev/Ops session to refine the spec; ships the refinement; Service handles the next case better. |

This is the **Siemens building automation metaphor from the master charter, applied to human flourishing**: sensors → controllers → control loops → actuators → continuous tuning. Service IS the control loop, running autonomously on the operator's specifications. Dev/Ops IS the continuous tuning, the engineer adjusting the loop until it perfectly supports the controlled process.

The user-facing tab is *Dev/Ops* by name. What they actually receive most of the time is Service — preconfigured, low-touch, working. Dev/Ops is the door they walk through when Service has a gap; the operator's iteration closes the gap; Service grows quieter.

### What "perfectly supporting operations" means in practice

- The user's recurring problem becomes a one-tap resolution, not a ticket
- The expected response time gets met automatically because the spec already anticipated this class of issue
- The same incident shape, third time around, has been preempted by the spec change after the second time
- The operator's hours per user trend down over time even as user count trends up

This is the test for whether Service is working: **operator hours per user decline while user satisfaction holds or rises.** That ratio is the steward's KPI for Service.

---

## ITIL 4 — Service Management Practices, Mapped to SKOS

ITIL 4 organizes service work into 34 *practices* across three categories: General Management, Service Management, and Technical Management. SKOS uses a focused subset. The rest are documented as "available when needed" but not load-bearing today.

### The seven practices binding SKOS Dev/Ops delivery

| ITIL Practice | What it governs | Where it already lives in SKOS |
|---|---|---|
| **Incident Management** | Restore normal service as quickly as possible after an unplanned interruption | `data.incidents[]` + the rust *"Tenant Not Paying"* / *"HVAC Down"* style cards; `lifecycle.phase` flow `new → triaging → in-progress → resolved` |
| **Problem Management** | Identify recurring incidents, find root cause, prevent recurrence | The Related History panel on every new incident (per `LIFECYCLE-AND-HANDOFF.md`); the Connected Context links surface patterns across instances of the same problem |
| **Change Management / Change Enablement** | Control changes to systems / processes to minimize disruption | Every `phase` write requires a `log` entry with note; the SOP in `MVP-1-TIMELINE.md` (propose → approve → execute → verify → commit → push) IS change management at code level |
| **Release Management** | Plan, schedule, deploy releases without breaking service | The `releaseLabel` + `releaseNote` fields on `meta`; the deployment runbook in the drive corpus; the data-migration discipline (v21 → v22 → v23 → v28) |
| **Service Level Management (SLM)** | Set, monitor, and meet response/quality targets per tier | The support response targets in the Strategic Brief: Foundation 48h email, paid tiers 24h email + in-app, Business 12h phone + Slack |
| **Knowledge Management** | Every ticket generates either a docs update, a product change, or a config tweak | The "every ticket should be the last ticket of its kind" discipline from the Strategic Brief — this is ITIL Knowledge Management named directly |
| **Continual Improvement** | The loop: observe → reflect → act → measure → repeat | The session SOP + `06-research-log/` capture + the per-quarter Realisation Tracking from `INTAKE-AND-FIT.md` Stage 5 |

### Two more practices held in reserve

| ITIL Practice | Status | Trigger to activate |
|---|---|---|
| **Service Request Management** | Latent | When external participants (per `ECOSYSTEM-PARTICIPANTS.md`) start submitting structured requests at volume — tenant maintenance requests, donor info changes, contractor invoice submissions |
| **Capacity & Performance Management** | Latent | When SKOS reaches the 500-family scale named in the Strategic Brief and the operator instance starts seeing real load patterns |

The rest of ITIL's 34 practices are documented as available but not adopted. Bias toward the seven; expand only when load demands.

### What ITIL is NOT for, in this context

- ITIL is not bureaucracy. The Strategic Brief is explicit: small-team sustainability requires *less* process, not more. ITIL practices are adopted to *reduce* operator stress, not to manufacture work.
- ITIL is not a religious framework. It is an engineering discipline. Its presence in SKOS is the same way the Siemens building-automation metaphor is present — borrowed for what it does well, named for clarity, never elevated.
- ITIL is not a sales surface. The user never sees these practices. The operator does.

---

## PMBOK / PMP — Project Knowledge Areas, Mapped to SKOS

PMBOK organizes project work into ten knowledge areas (PMBOK 6th edition framing — still the most widely taught; PMBOK 7th moved to performance domains, but the 10 areas remain the cleanest map for SKOS purposes).

| PMBOK Knowledge Area | What it governs | Where it already lives in SKOS |
|---|---|---|
| **Integration Management** | Coordinate all the moving parts; project charter; change requests; lessons learned | `INTAKE-AND-FIT.md` is the integration document; every Business Case is effectively a one-page project charter |
| **Scope Management** | Define + control what's in / out of the project | `data.scopes[]` already shipping; contractor 1099 records link to scopes; scope changes go through `lifecycle.log` |
| **Schedule Management** | Define activities, estimate durations, build + control the schedule | `data.projects[]` with start/end/hpw + the 12-Month Workload Forecast already shipping; the Business Change Lifecycle phases (Alignment → Definition → Design → Implementation → Realisation) per `INTAKE-AND-FIT.md` |
| **Cost Management** | Estimate, budget, control costs | The dual-track pricing per v29 patch ($0–$249/mo Family-Small-Biz; $50K–$500K Enterprise); the per-Business-Case `costProspect` + `costPoetech` fields |
| **Quality Management** | Plan, manage, control quality of deliverables | `EXCELLENCE-STANDARD.md`; the religion-AND-relationship test before any deliverable ships; the Test (Phil 4:8) run on every substantive output per `CLAUDE.md` |
| **Resource Management** | People, equipment, materials | `IDENTITY-ROLES-AUDIT.md` for internal roles; `ECOSYSTEM-PARTICIPANTS.md` for external participants; the Tech Tools Priority List in the drive corpus for equipment |
| **Communications Management** | Right information to the right people at the right time | `MULTI-INSTANCE-STRATEGY.md`; the interactions log in `ECOSYSTEM-PARTICIPANTS.md`; the four-verdict email templates from `INTAKE-AND-FIT.md` Stage 4 |
| **Risk Management** | Identify, analyze, respond to risks | `INTAKE-AND-FIT.md` Dimension E (regulatory) + Dimension F (operational load) + Dimension G (time discernment); the hard-no list in Dimension A |
| **Procurement Management** | Acquire goods/services from outside the project | The Cart sub-tab (subscriptions audit) + the Tech Tools Priority List + the 1099 contractor flow + scope agreements |
| **Stakeholder Management** | Identify, engage, manage stakeholders | `ECOSYSTEM-PARTICIPANTS.md`; the interactions log; the per-tier permissions framework |

### The unified picture

ITIL governs the *steady state* (incidents, requests, changes flowing through). PMBOK governs the *project state* (work with a beginning and an end). The same SKOS data structures serve both. The `lifecycle.log` entry that closes an incident is the same shape as the `lifecycle.log` entry that closes a project milestone. One language, two cadences.

---

## The Stress-Lowering Principle

The founder framing names the test: does this *lower* user stress? Every service-management decision is held against that question.

Concretely:

- **Response times that are kept beat response times that are promised.** A 48-hour SLA met every time produces less stress than a 12-hour SLA missed regularly. The Strategic Brief's tiered targets are deliberately conservative for this reason.
- **Knowledge capture beats memory.** *"Every ticket generates a doc update"* means the next user with the same problem finds the answer without a ticket at all. Stress eliminated upstream.
- **Connected Context beats repeated explanation.** When a tenant emails about the same leak the prior property manager handled, the new manager opens the record and sees the full history. No re-explanation required of the tenant. Stress eliminated by data structure.
- **Mode detection beats menu-hunting.** A user who says *"I'm frustrated"* lands in the Council Chamber automatically. A user who says *"how do I fix this"* lands in Dev/Ops automatically. No mode-switch friction. Stress eliminated by listening.
- **Default-low pricing beats default-high pricing.** Foundation tier free forever means no one is priced out of the stewardship layer. Stress eliminated by accessibility.
- **Local-first beats cloud-default.** The user's data stays on their device by default. No surveillance posture. Stress eliminated by architecture.

The principle compounds: every layer of the system that reduces friction reduces stress, and the cumulative effect is what makes SKOS distinguishable from the typical SaaS posture. *"Lower stress by whatever seems necessary"* is the operator's standing instruction; this document names the means.

---

## How Service Management Shows Up in Church Context

Darrell is Tech Director at The Church of the Living God. Service management isn't only a PoeTech-customer-facing discipline — it's a church-tech discipline too. The same practices apply:

- **Incident management** — when the pfSense at Love Corner goes down, the response follows the same `lifecycle.phase` flow.
- **Knowledge management** — every fix is documented for the next volunteer or successor Tech Director.
- **Change management** — VLAN reconfigurations, AP decommissions, the WORK VLAN 10.10.70.0/24 isolation work — all follow the same propose-approve-execute-verify-commit pattern as the PWA.
- **Stakeholder management** — pastor, deacons, volunteers, families touched by tech (per `ECOSYSTEM-PARTICIPANTS.md` church template — donors, parishioners, volunteers).
- **Service-level management** — what's the expected response when the worship-service stream goes down vs. when a printer is out of ink? Tiered, named, met.

The church template in `MULTI-INSTANCE-STRATEGY.md` ships with this service-management posture pre-configured. A church adopting SKOS gets an ITIL-shaped service desk without having to learn ITIL. That is the framework adopted but not exposed.

---

## How Service Management Shows Up in Dev/Ops Mode

When a user lands in Dev/Ops mode (per `INTAKE-AND-FIT.md` and the mode detection in `COUNCIL-CHAMBER.md`), the system runs the request through the service-management discipline:

1. **Classify the work shape.**
   - *Request* (recurring, low-stakes, well-defined) → service request management
   - *Incident* (something is broken, restore service) → incident management
   - *Problem* (recurring incidents with a shared root) → problem management
   - *Change* (alter a configuration or system) → change management
   - *Project* (defined beginning + end + deliverable) → PMBOK lifecycle (Alignment → Realisation per `INTAKE-AND-FIT.md`)

2. **Apply the right cadence.**
   - Requests: same-day to 48h depending on tier
   - Incidents: tier-defined SLA
   - Problems: scheduled root-cause analysis, no SLA pressure
   - Changes: through the proposal-approval-execute-verify-commit loop
   - Projects: through the Business Change Lifecycle

3. **Record everything in the lifecycle log.** Bidirectional links per `CONNECTED-CONTEXT.md` so the work connects to the user, the originating Council Chamber conversation (if any), the affected modules, and the Realisation Tracking later.

4. **Capture knowledge as a byproduct.** Per the ITIL Knowledge Management discipline, every closed item generates either a docs update, a product change, or a config tweak. No exceptions.

5. **Measure realisation.** Per `INTAKE-AND-FIT.md` Stage 5, quarterly variance check projected vs. measured. Surfaces in the operator's quarterly review.

This is the operator's quiet loop. The user feels the absence of friction; the operator runs the loop.

---

## Counseling Backup — When Dev/Ops Detects Distress

Per `MODE-ROUTING.md`, the Dev/Ops surface keeps Counseling as a backup mode. The user enters Dev/Ops with a problem-shaped intent — *"how do I,"* *"can you help me set up,"* *"I need to fix"* — and the system delivers in solve mode by default. But every input continues to run through the classifier.

When distress signals layer over the problem-shape — emotional vocabulary, late-night session timing, an unusually long free-text field, repeated mentions of overwhelm — the system pauses before the next solve-step and offers:

> *"This sounds heavier than a project question. Want to step into the Council Chamber for a few minutes first, then come back to this when you're ready?"*

Never auto-switches. The user can decline and keep solving; the offer is logged but does not repeat in the same session. If the user accepts, the Dev/Ops state is preserved (no work lost) and the Council Chamber session opens with the originating context already linked per `CONNECTED-CONTEXT.md`. When the user returns to Dev/Ops, the problem is exactly where they left it.

This is the same gentleness in the reverse direction that `COUNCIL-CHAMBER.md` already binds for the Counseling-to-Dev/Ops shift. Both rooms keep the other as a backup; neither room shoves the user across the threshold.

---

## Implementation Phases

| Phase | What ships | Cost |
|---|---|---|
| **Phase 0 (NOW)** | This document binding. ITIL + PMP framing named explicitly. No new code. | $0 |
| **Phase 1** | Dev/Ops queue view extends to expose work-shape classification (Request / Incident / Problem / Change / Project) on each item — most of the data is already there, this is a label + filter. | $0 |
| **Phase 2** | Tier-based SLA timer visible on each work item; operator sees green/amber/red against the response-time target. | $0 |
| **Phase 3** | Knowledge-capture prompt on every `phase = 'resolved'` transition — *"What was the doc update / product change / config tweak?"* — captured into the lifecycle log + (eventually) into the docs site. | $0 |
| **Phase 4** | Per-quarter operator review surface — work-shape distribution, SLA performance, knowledge-capture rate, realisation variance. | $0 |
| **Phase 5** | Church-template service desk view — applied to COLG operations; donor / parishioner / volunteer surfaces wired to the same engine. | $0 |

No new paid dependency. The sustainability rule holds.

---

## What This Document Does NOT Do

- It does not require certification. The operator does not need a PMP credential to run SKOS by PMBOK shape; the system encodes the discipline.
- It does not impose bureaucracy. Every practice adopted reduces friction or it is not adopted.
- It does not replace pastoral judgment. Service management is the *how*; the *whether* and *why* still belong to the operator under the Holy Spirit's leadership.
- It does not expose itself to the user. ITIL and PMP are invisible. The user sees a service that works.

---

## Religion AND Relationship in Service Management

**Religion-side:** Disciplined frameworks. ITIL practices named, PMBOK knowledge areas mapped, response targets defined, change discipline held. *Decently and in order* (1 Cor 14:40) is not a slogan; it is the operating posture.

**Relationship-side:** The point of the discipline is not the discipline. The point is the user — the family operator at the kitchen table, the contractor at the job site, the tenant at midnight, the donor at the Christmas Eve service, the parishioner in crisis. Every practice exists because somewhere, someone's stress is lower when it runs well. Proverbs 24:6 — *"by wise guidance you can wage your war"* — and the war we are waging is against unnecessary friction in the lives of the people SKOS serves.

Both. The structure is invisible; the relief is felt.

---

## Cross-references

- `INTAKE-AND-FIT.md` — the front door this document delivers behind.
- `COUNCIL-CHAMBER.md` — the listening counterpart; the system deduces between the two modes.
- `MODE-ROUTING.md` — the classifier, the visible mode indicator, the never-auto-switch rule, and the both-doors-visible nav pattern.
- `LIFECYCLE-AND-HANDOFF.md` — the lifecycle log is the canonical data structure both ITIL and PMBOK record into.
- `ECOSYSTEM-PARTICIPANTS.md` — stakeholder management's data layer.
- `IDENTITY-ROLES-AUDIT.md` — resource management's data layer (internal users).
- `CONNECTED-CONTEXT.md` — the link graph that makes problem management possible.
- `MULTI-INSTANCE-STRATEGY.md` — church / nonprofit / trades / property-management templates ship with service-management defaults pre-configured.
- `EXCELLENCE-STANDARD.md` — quality management's standard.
- `MIND-OF-CHRIST.md` — the Test (Phil 4:8) is the quality check before any deliverable ships.
- `01-grace-and-mercy-standard.md` — the user is never gatekept by process; service management serves the user, never the reverse.
- `KPIS.md` — service-level performance lives here as a measured KPI.
- `MVP-1-TIMELINE.md` SOP — the propose-approve-execute-verify-commit-push loop IS ITIL change management at the code layer.
- `POETECH STRATEGIC BRIEF · Operations & Maintenance · The Small Team Reality` (drive corpus) — the support-tier table, the "what NOT to build" list, the customer-support volume estimates.
- `CLAUDE.md` — typographic theology binds every artifact this discipline produces.

---

**End of document.** Binding. ITIL is the steady state, PMP is the project state, both are the operator's quiet loop, and the user feels the absence of friction. Decently and in order — for their sake, not ours.
