# PoeTech OS — PMO / Project-Portfolio Module Spec (Instance #1 of the Role-Module Pattern)

**Date:** 2026-06-09 (Tue)
**Author:** Claude (module spec on Darrell's commission — recording architecture already discussed and agreed in chat, not inventing it)
**Status:** PLAN / spec doc. **No code, no purchases, no money movement, no autonomous execution.** Target module architecture only.
**Decision records:** DR-011 (PMO module = instance #1 of the role-module pattern; living portfolio overview is its canonical output), DR-012 (only net-new component = the thin LLM synthesis/orchestration layer; everything else federates), DR-013 (PM-as-automation: GUIDE + ENFORCE + ESCALATE; Cage governs autonomous re-sequencing) — see `docs/decisions/INDEX.md`.
**Pattern parent (this PR):** `2026-06-09-industry-role-module-template-spec.md` — this PMO module is the **first concrete instance** of the reusable Industry/Role Module pattern abstracted there. (Instance #2 = the Legal Module.)
**Sibling instance:** `2026-06-09-legal-module-spec.md` (the law-firm tenant; DR-006..DR-009).
**Parent strategy:** `2026-06-09-poetech-market-strategy-workforce-three-ring.md` (the Workforce Layer is this module's action-execution engine; the three rings are its cross-entity portfolio).
**Builds on (reference, do not rebuild):** the Decision-Record ledger (`docs/decisions/INDEX.md`), the Cage (`infra/ai-orchestrator/`), `EXECUTION-OUTCOME-OBSERVABILITY.md` + `INSTITUTIONAL-MEMORY-EVENTS.md` (events-as-data), `MODULAR-EXTENSIBILITY.md` (one codebase, many instances), `MARKETPLACE-ARCHITECTURE.md` (own the spine, swap the vendor), `IDENTITY-ROLES-AUDIT.md` (roles/ownership), `WORKFLOW-MODULE-LIBRARY.md` + wf36 (the Quality Gatekeeper hook), and `ANXIETY-CLARITY-PRINCIPLE.md` (what/when/why/how). The "build on what exists" thesis is the conference-module thesis applied to PM.
**Reads through:** `CLAUDE.md` Layer 0, `GOVERNANCE-EXECUTION-ADVISORY.md`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `RELEASE-TIERS.md` + `feedback_autonomous_automation_three_brakes`, all under the worldview spine.

---

## TL;DR (read this first)

1. **A sovereign, LLM-native project-portfolio (PMO) module** — instance #1 of the reusable Industry/Role Module pattern (the pattern itself is specified in the companion doc). (§1)
2. **Its canonical output is a living portfolio overview** — the comprehensive post-meeting format already in use, but *living*, not a static Monday write-up. (§2 = the output template.)
3. **Ten capabilities** make it exceed any static report: living/auto-updating, signal-generated, closed-loop, capacity/dependency-aware, audience-adaptive, predictive, governance-native, cross-entity, self-documenting, and mission-lensed. (§3)
4. **It builds almost nothing net-new.** Boards, issues, automation, scheduling, decisions, risks, action execution, QA, roles, audit, and roll-up all **federate existing systems.** **The only net-new component is the thin LLM synthesis/orchestration layer** on top. (§4)
5. **PM-as-automation is a first-class design goal:** a **non-PM manages at PM quality** via **GUIDE + ENFORCE + ESCALATE.** A church or SMB runs enterprise-grade PM **without hiring a PM** — the same "replaces the network engineer" economics as Ring 2. It's a prebuilt SKOS "Project Manager" role module. (§5)
6. **This is a PLAN.** No code, no purchases. The eventual build's autonomous pieces are Tier C and need all three brakes. (§7)

---

## 1. What this is

A **sovereign, LLM-native project-portfolio management module** for PoeTech OS. It is **instance #1 of the reusable Industry/Role Module pattern** (`2026-06-09-industry-role-module-template-spec.md`) — the PMO ("project manager") role, encoded once and instantiated per entity.

It is *sovereign* (runs on the PoeTech node, data never leaves the owner's control — the same `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md` spine as every module) and *LLM-native* (the synthesis is the LLM's core job, not a bolt-on). Its purpose: take the scattered signals a project already emits — board state, repo activity, executions, meeting notes — and continuously synthesize the **decision-ready portfolio overview** a great PM would produce after every touchpoint, **for every audience, on demand.**

Recorded as **DR-011**.

---

## 2. Output template — the canonical living portfolio overview

This is the module's canonical output. It mirrors the **post-meeting portfolio overview** format already in use, and it deliberately mirrors the **Decision-Record framework** (`docs/decisions/INDEX.md`) and the project-review format the repo already runs. The same dataset renders this whole document — and any audience-specific subset of it (§3.5) — on demand.

The sections, in order:

1. **Selected Approach & Rationale** — the chosen path and *why it won* over the alternatives considered.
2. **Three-Layer Summary** — **Current** (where things stand) / **Progress** (what moved) / **Forward** (what's next). The fast read.
3. **Current vs Target State table** — a two-column table: where each workstream *is* vs. where it's *going*, with the gap explicit.
4. **Domain Impacts (per role)** — what changed, rendered for each role's concerns:
   - **Admin** — config, access, governance, cost.
   - **Practitioner (PMs + Devs)** — assignments, dependencies, what to do next.
   - **Insights / Reporting** — metrics, throughput, what the numbers say.
   - **Intake / Allocation** — incoming demand, capacity, where new work lands.
5. **Decisions with Lineage** — every decision as **context → decision → impact.** This *is* a DR ledger view, scoped to the project; it links to the canonical `docs/decisions/INDEX.md` rows.
6. **What Changed Since Last Touchpoint** — the **delta.** Not the whole state — only what moved since the reader last looked.
7. **Action Items** — both **explicit** (stated in the meeting / issue) and **implicit** (the ones a good PM infers from the state — "no owner on the critical path" is an action item even if no one said it).
8. **Risk Aging & Escalation** — the risk register with **age** on each item; risks that sit too long **escalate** automatically.
9. **Derived Clarifying Questions (non-blocking)** — the questions a PM would ask to de-risk, surfaced but **not gating** — the work proceeds while they're answered.
10. **Executive Briefing** — the **decision-ready** one-screen version for the governor.
11. **Bottom Line** — the single-sentence "so what."

> **Note:** sections 5 (Decisions with Lineage) and 8 (Risk Aging) are not free-text prose — they are **views over structured records** (the DR ledger and the risk register), which is what makes §3's living/predictive/governance capabilities possible.

---

## 3. The ten capabilities (what makes it exceed a static Monday write-up)

A static board export is a snapshot a human assembles and that goes stale the moment it's saved. These ten capabilities are what make this a *living* instrument instead.

1. **Living, not a snapshot.** It **auto-updates from board / repo / execution data** (events-as-data, per `EXECUTION-OUTCOME-OBSERVABILITY.md` + `INSTITUTIONAL-MEMORY-EVENTS.md`). The overview is a *current view*, regenerated from source, never a hand-assembled artifact that rots.
2. **Auto-generated from signals.** It **ingests** the project's real signals — **meeting notes + live board state + commits + workflow executions** — and synthesizes the overview from them. No one types the report.
3. **Closed-loop.** Outputs become tracked inputs: **action items → tracked tasks routed to the 1099 Workforce Layer, QA-gated** (`2026-06-09-poetech-market-strategy-workforce-three-ring.md` §2); **decisions → the DR ledger**; **risks → a self-aging risk register.** Nothing falls on the floor.
4. **Capacity / dependency engine.** It computes structural truths the board implies but doesn't state — **"same dev on two critical tasks = a dependency,"** **real-time conflict flags**, and **simulated re-plans** ("if we move X, what slips?"). The dependency math is done for you.
5. **Audience-adaptive rendering, on demand.** From **one dataset** it renders the **exec one-pager**, the **practitioner view**, the **leadership view**, or the **"what to watch" view** — without re-collecting anything. The audience picks the lens; the data is shared.
6. **Predictive.** **Risk aging** and **ripple forecasting** are computed from **real historical throughput** (the events-as-data history), not guesses — "at this team's actual velocity, this slip ripples to these three items."
7. **Governance / audit native.** Decision lineage is **immutable**, written to the **Cage's append-only ledger** (`infra/ai-orchestrator/`). **Replanning is a logged, first-class operation** — every re-sequence is an auditable event, not an invisible edit.
8. **Cross-entity portfolio.** It rolls up **Church / TLC / PoeTech / Poe Properties** at their respective **isolation tiers** — with **TLC PHI walled** (ISO-1, the same firewall the Legal Module uses for privilege). One portfolio view, hard data boundaries.
9. **Self-documenting institutional memory + cross-meeting pattern detection.** It is its own record (`INSTITUTIONAL-MEMORY-EVENTS.md`) and detects patterns *across* touchpoints — "this risk has been deferred three meetings running," "this decision keeps getting re-litigated."
10. **Mission lens.** For community work, it carries a **Father's-Business / soul-prosperity test** (3 John 1:2; `BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md`, `QUALITY-OF-LIFE-AS-NORTH-STAR.md`) as a **domain-impact dimension** — alongside cost and schedule, "does this serve the soul-prosperity of the people it touches" is a first-class column for mission projects.

---

## 4. Federation-and-reuse map (build almost nothing net-new)

The strategic point: **almost every capability above already exists in the PoeTech spine or in a swappable vendor.** The module *federates* them. Per `MARKETPLACE-ARCHITECTURE.md` — own the spine, keep the vendor swappable, audit every swap.

| Capability | Federates / reuses |
|---|---|
| Boards / intake / timelines / assignments | **Monday** or **GitHub Projects** (swappable vendor) |
| Issues / tasks / dependencies / PRs | **GitHub** |
| Automation / triggers / sync | **n8n** (the existing workflow engine; same-origin `/n8n` rewrite per `project_n8n_same_origin_rewrite`) |
| Scheduling | the **calendar module** (the `events` table — `event_date`, `recurrence_rule`, `lifecycle`) |
| Decisions-with-lineage | the **DR ledger** (`docs/decisions/INDEX.md`) |
| Risk register + aging | **events-as-data** + observability (`EXECUTION-OUTCOME-OBSERVABILITY.md`, `INSTITUTIONAL-MEMORY-EVENTS.md`) |
| Action execution | the **1099 Workforce Layer** + the guided-task system (`2026-06-09-poetech-market-strategy-workforce-three-ring.md`) |
| Definition-of-Done / QA gating | the **Quality Gatekeeper** (wf36, `WORKFLOW-MODULE-LIBRARY.md`) |
| Roles / ownership | the **identity layer** (`IDENTITY-ROLES-AUDIT.md`) |
| Audit / governance | the **Cage** append-only ledger (`infra/ai-orchestrator/`) |
| Cross-entity roll-up | the **four-entity model** + isolation tiers (Church / TLC / PoeTech / Poe Properties) |

> **THE ONLY NET-NEW COMPONENT = the thin LLM synthesis / orchestration layer on top.**
> Its three jobs: **ingest** (pull the signals from the federated systems) → **synthesize** (produce the living overview of §2/§3 from one dataset) → **route** (push action items into the Workforce Layer, decisions into the DR ledger, risks into the aging register). Everything else is wiring to systems that already exist.

This is recorded as **DR-012.** It is also the conference-module "build on what exists" thesis applied to PM: the value is the synthesis layer and the federation wiring, not a re-implementation of boards, issues, or scheduling.

---

## 5. PM-as-automation (first-class design goal)

**The goal: enable a NON-PM to manage at PM quality.** The expertise of project management is encoded into the module — the same move the Workforce Layer makes with Darrell's operating expertise (`...workforce-three-ring.md` §2). The model is **GUIDE + ENFORCE + ESCALATE.**

### 5.1 GUIDE — surface the decisions a PM would catch
Anxiety-clarity prompts (`ANXIETY-CLARITY-PRINCIPLE.md` — what / when / why / how) surface, **in plain language**, the decisions a seasoned PM would catch and a novice would miss: "two tasks on the critical path share one owner — pick one to reassign," "this milestone has no Definition-of-Done — define it before work starts," "this risk is 12 days old with no mitigation." The module asks the right question at the right moment, so the operator doesn't need to already know to ask it.

### 5.2 ENFORCE — discipline that can't be skipped
The module makes PM discipline structural, not optional:
- **Intake gate:** **no owner / timeline / effort / dependency = it is not real work.** Work that can't pass the gate doesn't enter the board as committed work.
- **Definition-of-Done:** every task carries explicit acceptance criteria (the same DoD the Quality Gatekeeper checks against, wf36).
- **Decision ledger:** decisions are recorded with lineage — they can't be made and forgotten.

The novice operator *cannot* skip the discipline, because the system won't let undisciplined work through the gate.

### 5.3 ESCALATE — only judgment goes to the human
- **Procedural work is automated** (status sync, report generation, dependency math, routing).
- **Only genuine judgment calls go to the human** (governor) — the strategic, relational, and tradeoff decisions.
- The **Cage governs autonomous re-sequencing:** **safe re-plans are flagged and run autonomously; risky changes are human-gated.** Re-sequencing the order of two independent low-risk tasks is autonomous; moving a milestone that ripples to a COLG-facing date is human-gated. (Per `GOVERNANCE-EXECUTION-ADVISORY.md` — Darrell governs, the Foundation executes, Claude advises — and `feedback_autonomous_automation_three_brakes`.)

### 5.4 Economic value
A **church or SMB runs enterprise-grade PM without hiring a PM** — the identical economic move as Ring 2's "replaces the church's network engineer" (`...workforce-three-ring.md` §5, Ring 2). The PM expertise is in the system; the operator supplies attention and decisions. It ships as a **prebuilt SKOS "Project Manager" role module** — the same one-codebase-many-instances shape as the Legal Module's "law firm" template (`MODULAR-EXTENSIBILITY.md`).

This is recorded as **DR-013.**

---

## 6. Where this sits in the pattern

This PMO module is **instance #1** of the Industry/Role Module pattern abstracted in the companion doc (`2026-06-09-industry-role-module-template-spec.md`). Reading the pattern's five-part template against this module:

1. **Encode the discipline** → PM expertise → a non-PM operates at PM quality (§5: GUIDE / ENFORCE / ESCALATE).
2. **Federate existing systems** → Monday / GitHub / n8n / calendar (§4).
3. **Plug into the shared OS spine** → identity, Cage, events-as-data, DR ledger, QA Gatekeeper, Workforce Layer, anxiety-clarity (§4 + §5).
4. **Feed the pipeline** → the PMO module is itself a **tenant** (every entity that runs projects), a **market segment** (churches + SMBs that can't afford a PM), a **workforce category** (project-coordination tasks routed to the 1099 layer), and a **data source** (the events-as-data throughput history).
5. **Onboard by configuration** → a new entity's portfolio stands up by config (entities, isolation tiers, board connections), not custom build.

---

## 7. Guardrails on this document

- **This is a PLAN / spec.** No code, no purchases, no money movement, no autonomous execution flow from it.
- **Federation, not reinvention, is a hard requirement.** No net-new board / issue / scheduling / payments system gets built — the module wires to the existing systems and adds only the LLM synthesis layer. Building a parallel board engine would violate `MODULAR-EXTENSIBILITY.md` and the "build on what exists" thesis.
- **The autonomous pieces are Tier C.** Any timer-driven or self-triggering automation (auto-regenerate, auto-route action items, autonomous re-sequencing) ships **inactive → watched → never unattended**, with all **three brakes** — budget, concurrency lock, kill-switch — per `feedback_autonomous_automation_three_brakes` and `RELEASE-TIERS.md`. The Cage's human-gate on risky re-sequences (§5.3) is part of this.
- **TLC PHI stays walled.** The cross-entity roll-up (§3.8) never crosses the ISO-1 firewall; TLC clinical data is aggregated only as walled, tier-respecting summaries.
- **The Test (`MIND-OF-CHRIST.md`) was run against this output** before delivery: true (no fabrication — these are recorded agreed decisions), honorable, just, and aligned with the serve-not-extract mission.
