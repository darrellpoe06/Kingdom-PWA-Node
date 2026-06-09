# Industry / Role Module Template — The Reusable Pattern (PoeTech OS)

**Date:** 2026-06-09 (Tue)
**Author:** Claude (pattern spec on Darrell's commission — abstracting the blueprint already discussed and agreed in chat)
**Status:** PLAN / spec doc. **No code, no purchases, no money movement, no autonomous execution.** Reusable architecture pattern only.
**Decision records:** DR-014 (abstract a reusable Industry/Role Module Template — five-part blueprint; every value-adding industry plugs in by configuration, not custom build), DR-015 (each module = a tenant + a market segment + a workforce category + a data source; prioritize candidate industries by pipeline value tied to the three-ring market + workforce layer), DR-016 (instances: #1 PMO, #2 Legal; recorded candidate next modules) — see `docs/decisions/INDEX.md`.
**Concrete instances (this PR + sibling):** **#1 PMO** — `2026-06-09-poetech-pmo-portfolio-module-spec.md`; **#2 Legal** — `2026-06-09-legal-module-spec.md`.
**Parent strategy:** `2026-06-09-poetech-market-strategy-workforce-three-ring.md` (the three-ring market + the Workforce Layer this pattern feeds).
**Builds on (reference, do not rebuild):** `MODULAR-EXTENSIBILITY.md` (one codebase, many instances), `MARKETPLACE-ARCHITECTURE.md` (sovereign sell/manage/grow; experience over credentials), `IDENTITY-ROLES-AUDIT.md`, the Cage (`infra/ai-orchestrator/`), `EXECUTION-OUTCOME-OBSERVABILITY.md` + `INSTITUTIONAL-MEMORY-EVENTS.md` (events-as-data), the DR ledger (`docs/decisions/INDEX.md`), `WORKFLOW-MODULE-LIBRARY.md` + wf36 (QA Gatekeeper), and `ANXIETY-CLARITY-PRINCIPLE.md`.
**Reads through:** `CLAUDE.md` Layer 0, `GOVERNANCE-EXECUTION-ADVISORY.md`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `COMMUNITY-FIRST-MISSION.md`, all under the worldview spine.

---

## TL;DR (read this first)

1. **This abstracts the generalizable blueprint** from the PMO module (`...pmo-portfolio-module-spec.md`) so that **every industry that adds pipeline value plugs in by *configuration*, not custom build.** (§1)
2. Darrell's directive (verbatim intent): *"I would like this for every industry that could also add value to the pipeline of the PoeTech app."* (§1)
3. **The five-part template** (§2): (1) **encode the discipline** so a non-expert operates at expert quality; (2) **federate** the industry's existing systems; (3) **plug into the shared OS spine**; (4) **feed the pipeline** (each module = tenant + market segment + workforce category + data source); (5) **onboard by configuration** ("new industry in days").
4. **It is the convergence** of per-industry sovereign-LLM-teams + the SKOS marketplace (experience over credentials; prebuilt role modules). (§3)
5. **Instances** (§4): #1 **PMO**, #2 **Legal**, plus a **prioritized candidate list** (IT/network ops, accounting, HR, marketing, real-estate, church ops, counseling — ISO-1 walled).
6. **Prioritization lens** (§5): rank candidate industries by **pipeline value**, tied to the three-ring market and the Workforce Layer.
7. **This is a PLAN.** No code, no purchases. (§6)

---

## 1. What this is (and why)

The Legal Module and the PMO module are not two unrelated builds. They are **two instances of one pattern.** This document names that pattern so it never has to be re-derived: **every industry/role that can add value to the PoeTech pipeline becomes a module that plugs in by configuration, not a from-scratch custom build.**

> Darrell's directive: *"I would like this for every industry that could also add value to the pipeline of the PoeTech app."*

The pattern is the **multiplier.** One codebase + one spine + a per-industry config = a new sovereign, LLM-native role module — a "law firm," a "project manager," an "accountant," a "church IT department" — each encoding an industry's discipline so a non-expert can operate at expert quality, each a sovereign tenant, each a new segment of the market and the workforce.

Recorded as **DR-014.**

---

## 2. The five-part template

Every Industry/Role Module is built from these five parts. To stand up a new module, you fill in each part for that industry — you do **not** write a new application.

### (1) Encode the discipline → a non-expert operates at expert quality
Capture the industry's expert judgment into the system as **GUIDE + ENFORCE + ESCALATE** (the model proven in the PMO module, §5, and the Workforce Layer):
- **GUIDE** — anxiety-clarity prompts (what / when / why / how; `ANXIETY-CLARITY-PRINCIPLE.md`) surface the decisions the expert would catch, in plain language.
- **ENFORCE** — intake gates and Definition-of-Done make the discipline structural; undisciplined work can't pass.
- **ESCALATE** — procedural work is automated; only judgment calls reach the human; the Cage governs what may run autonomously vs. what is human-gated.

The result is the same economic move every time: **the expertise lives in the system; the operator supplies attention and decisions.** A non-lawyer's firm runs lawyer-grade intake; a non-PM runs PM-grade portfolios; a non-accountant keeps clean books.

### (2) Federate the industry's existing systems → reuse, don't rebuild
Map each of the industry's needs onto an **existing system** — a PoeTech-spine module or a **swappable vendor** (`MARKETPLACE-ARCHITECTURE.md` — own the spine, swap the vendor, audit every swap). The PMO module federates Monday / GitHub / n8n / calendar; the Legal Module federates the portal / calendar / request-lifecycle / payments patterns. **The module is config + a thin synthesis layer, not a re-implementation.** (The conference-module "build on what exists" thesis, generalized.)

### (3) Plug into the shared OS spine
Every module draws on the same shared services — it does not carry its own copy:
- **Identity** (`IDENTITY-ROLES-AUDIT.md`) — roles, ownership, the 2+-source verification.
- **The Cage** (`infra/ai-orchestrator/`) — allowlisted actions, the append-only audit ledger, human-escalation.
- **Events-as-data** (`EXECUTION-OUTCOME-OBSERVABILITY.md`, `INSTITUTIONAL-MEMORY-EVENTS.md`) — the signal substrate and history.
- **The DR ledger** (`docs/decisions/INDEX.md`) — decisions with lineage.
- **The QA Gatekeeper** (wf36; `WORKFLOW-MODULE-LIBRARY.md`) — Definition-of-Done enforcement.
- **The 1099 Workforce Layer** (`...workforce-three-ring.md` §2) — guided-task execution.
- **Anxiety-clarity guidance** (`ANXIETY-CLARITY-PRINCIPLE.md`) — the GUIDE surface.

### (4) Feed the pipeline → each module is four things at once
Every module simultaneously is:
- **A tenant** — a sovereign instance at its own isolation tier (the one-codebase-many-instances model).
- **A market segment** — the industry it serves is addressable demand (the firms, the SMBs, the churches in that vertical).
- **A workforce category** — the industry's repeatable tasks become a class of guided, QA-gated work routed to the 1099 Workforce Layer.
- **A data source** — the module's events-as-data enrich the shared throughput history, improving prediction and matching across the platform.

This four-way payoff is **why** adding a module adds pipeline value — it widens the market, the workforce, and the data simultaneously. Recorded as part of **DR-015.**

### (5) Onboard by configuration → "new industry in days"
A new module's industry-specific pieces (its discipline rules, its system mappings, its role taxonomy, its isolation tier) are **configuration + a small set of written-once extensions** — not a new application. The goal is **a new industry stood up in days,** the same goal the Legal Module states for the next law firm (`...legal-module-spec.md` §6; `MODULAR-EXTENSIBILITY.md`).

Recorded as **DR-014** (the template) and **DR-015** (the four-way pipeline framing + prioritization).

---

## 3. The convergence this represents

This pattern is the convergence of two threads already in the foundations:

- **Per-industry sovereign LLM-teams** — each industry gets a sovereign, self-hosted LLM "team" that runs its discipline on the owner's own node (the sovereignty spine of `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`).
- **The SKOS marketplace** (`MARKETPLACE-ARCHITECTURE.md`) — **experience over credentials**, **prebuilt role modules.** The marketplace doesn't ask "are you certified?"; it asks "can the guided, gated system carry you to expert-quality output?" The role module is exactly that prebuilt carrier.

Where they meet: a **prebuilt, sovereign, per-industry role module** that a non-expert plugs into and immediately operates at expert quality. That is the product.

---

## 4. Instances

### Built / specced this round
- **#1 — PMO / Project-Portfolio.** `2026-06-09-poetech-pmo-portfolio-module-spec.md`. The "Project Manager" role. Federates Monday / GitHub / n8n / calendar; net-new = the LLM synthesis layer.
- **#2 — Legal.** `2026-06-09-legal-module-spec.md`. The "law firm" / "lawyer" role; first concrete Ring-3 tenant; HIGHEST confidentiality tier (privilege ≈ TLC PHI); LLM behind heavy guardrails. (DR-006..DR-009.)

### Candidate next modules (value-to-pipeline, one line each)
| Module | One-line value to the pipeline |
|---|---|
| **IT / network ops** | Productizes the COLG **church build** itself — Ring 2's "replaces the church's network engineer"; large, near-term, already being delivered by hand. |
| **Accounting / bookkeeping** | A discipline every tenant (church + SMB) needs; high repeat demand → a steady workforce category and recurring revenue. |
| **HR / recruiting** | Powers the Workforce Layer's own onboarding/classification admin and sells to every Ring-3 business that hires. |
| **Marketing** | Turns the media-production platform into a sellable per-business service; broad SMB demand. |
| **Real-estate / property mgmt** | Direct fit for **Poe Properties** (dogfood, like Legal) and a known vertical; routes to Trevor for the real-estate flows (DR-010). |
| **Church operations** | Generalizes COLG's ops (membership, events, giving, comms) to every Ring-2 church — the productized node's software half. |
| **Counseling (TLC domain)** | **ISO-1 walled, sovereign-only** — the clinical tier; high trust, high differentiation, but gated behind the strictest isolation (PHI firewall) and never commingled. |

Recorded as **DR-016.**

---

## 5. Prioritization lens

Candidate industries are ranked by **pipeline value**, tied to the three-ring market (`...workforce-three-ring.md` §5) and the Workforce Layer:

1. **Tie to a ring already being served.** Modules that productize work **already being delivered by hand** (IT/network ops = the live COLG build; real-estate = Poe Properties) rank first — the demand is proven and the reference build exists.
2. **Tie to a real tenant we can dogfood.** A module we run on ourselves first (Legal on PoeTech's own legal needs; real-estate on Poe Properties; PMO on our own portfolio) surfaces rough edges before a paying tenant sees them.
3. **Strength of the four-way payoff** (§2.4). Prefer modules that meaningfully widen *all four* — tenant + market segment + workforce category + data source — over those that only add one.
4. **Workforce-category depth.** Industries whose repeatable tasks route cleanly to guided, QA-gated 1099 work (accounting, marketing, IT) deepen the delivery engine that makes every other ring reachable solo.
5. **Mission weight.** For Ring-1/Ring-2 community work, the Father's-Business / soul-prosperity lens (`QUALITY-OF-LIFE-AS-NORTH-STAR.md`, `BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md`) is a ranking input, not an afterthought.

The lens is applied **per candidate before any build is committed** — sizing each vertical (the §Ring-3 "per-vertical assessment" discipline) is itself a prioritization step, not a formality.

---

## 6. Guardrails on this document

- **This is a PLAN / spec.** No code, no purchases, no money movement, no autonomous execution flow from it. Standing up any module is a separately governed decision.
- **Configuration-not-custom-build is a hard requirement.** A new module that requires a new application rather than config + written-once extensions has failed the pattern (`MODULAR-EXTENSIBILITY.md`).
- **Isolation tiers are non-negotiable per instance.** Counseling (ISO-1 / PHI) and Legal (privilege) ship only at their required tiers; cross-entity roll-up never crosses those firewalls.
- **The autonomous pieces of any instance are Tier C** — all three brakes (budget, concurrency lock, kill-switch), inactive → watched → never unattended (`feedback_autonomous_automation_three_brakes`, `RELEASE-TIERS.md`).
- **The Test (`MIND-OF-CHRIST.md`) was run against this output** before delivery: true (no fabrication — these are recorded agreed decisions), honorable, just, and aligned with the serve-not-extract mission and `GOVERNANCE-EXECUTION-ADVISORY.md` (Darrell governs, the Foundation executes, Claude advises).
