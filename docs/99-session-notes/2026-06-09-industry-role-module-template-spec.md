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
4. **The senior success metric is the Want-To-Use Bar (§3):** PoeTech must be so good the role-holder **voluntarily reaches for it** in any role — **pull, not push.** A module is judged by whether the role-holder **PREFERS** it, not whether it is feature-complete. Five binding properties: makes-you-better / does-the-toil / near-zero-friction / meets-you-where-you-are / earns-trust.
5. **The Continuous-Improvement + Skill-Growth Flywheel (§4):** every module inherits three nested feedback loops — module self-improvement, skills-match learning, and a people-growth / upskilling layer — so modules and matches get better over time and people grow their skills and their 1099 earning capacity. Wellbeing-guarded: motivation from real progression, never dark patterns.
6. **It is the convergence** of per-industry sovereign-LLM-teams + the SKOS marketplace (experience over credentials; prebuilt role modules). (§5)
7. **Instances** (§6): #1 **PMO**, #2 **Legal**, plus a **prioritized candidate list** (IT/network ops, accounting, HR, marketing, real-estate, church ops, counseling — ISO-1 walled).
8. **Prioritization lens** (§7): rank candidate industries by **pipeline value**, tied to the three-ring market and the Workforce Layer.
9. **This is a PLAN.** No code, no purchases. (§8)

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

## 3. Success Metric — The Want-To-Use Bar (the senior acceptance test)

> Darrell, 2026-06-09: *"Whenever I do any role, I want to want to use PoeTech — that's how good I want this at supporting the user."*

**The bar:** PoeTech must be so good at supporting the user that they **voluntarily reach for it in any role** — **pull, not push.** Adoption by preference, never by mandate or compliance. This is the `EXCELLENCE-STANDARD.md` and the anxiety-clarity DNA (`ANXIETY-CLARITY-PRINCIPLE.md`) turned into the **acceptance test for every role module.**

**It is the senior success metric.** A role module is judged by whether the role-holder **PREFERS** it — not by whether it is feature-complete. Feature-completeness with friction fails the bar; a smaller surface the user genuinely reaches for passes it. "Would the person doing this role choose this over their current way, *unprompted*?" is the question every module must answer **yes** to before it is considered good.

### The five binding design properties (every module must meet all five)

1. **Makes the user BETTER at the role** — not just tracks or records it. The module lifts the quality of the work itself (the GUIDE surface, §2 part 1), so using it makes the role-holder more capable, not merely more documented. A system that only records is a chore; a system that makes you better is one you reach for.
2. **Does the toil — removes overhead, never adds it.** The module absorbs the procedural work (status sync, paperwork, routing, report assembly). Net overhead on the user must go **down**, not up. Any module that adds steps to the user's day has failed property 2 regardless of its feature list.
3. **Near-zero friction to start AND to use.** Friction — **auth walls, setup pain, context-switching** — is the **PRIMARY anti-pattern that kills voluntary use.** Setup / access UX is **part of the bar, not separate from it:** a brilliant module behind a login wall the user avoids is a module that fails. *(Cautionary example: the n8n login-wall friction — a surface gated behind an interactive login the user must stop and clear is exactly the friction that turns pull into avoidance. The same-origin `/n8n` rewrite exists partly to keep that seam frictionless; see `project_n8n_same_origin_rewrite`.)* Every module is evaluated on **time-to-first-value** and **clicks-to-act**, not capability alone.
4. **Meets the user where they are** — anxiety-clarity (`ANXIETY-CLARITY-PRINCIPLE.md`): **what / when / why / how**, with **no methodology required in the user's head.** The user does not have to already know the discipline (PM, legal, accounting) to operate well — the module carries the method so the user doesn't have to. (Template part 1, §2, expressed as a UX commitment.)
5. **Earns trust** — QA + governance (the Quality Gatekeeper, wf36; the Cage append-only ledger, `infra/ai-orchestrator/`) so the output is **reliable enough to depend on.** Voluntary use requires the user trust the result without re-checking everything; an untrustworthy assistant gets abandoned no matter how convenient. Trust compounds — and so does its absence.

### How the bar is applied
- **It is a merge gate for a role module.** Alongside the isolation-tier requirement (§8 guardrails), the Want-To-Use Bar is the senior gate: a module that is feature-complete but fails the bar does **not** ship as "done."
- **It is measured by pull, not push** — voluntary, repeat, unprompted use by the role-holder. Same north-star posture as `QUALITY-OF-LIFE-AS-NORTH-STAR.md` (would the family/community reach for this), applied to the operator of a role.
- **A module that LEARNS gets more preferred over time.** The Continuous-Improvement Flywheel (§4) is part of clearing this bar: a module that improves from feedback steadily climbs from "tolerated" to "preferred." Standing still is losing ground against the bar.

Recorded as **DR-017.**

---

## 4. Continuous-Improvement + Skill-Growth Flywheel

> Darrell, 2026-06-09: *"Feedback from users makes the module get better over time, along with the skills match. Motivate productivity in families and individuals who want to invest in their skills being upgraded — intuitively and iteratively."*

Every module inherits **three nested feedback loops.** They are not optional add-ons; they are part of the shared spine each module plugs into (§2 part 3), and together they compound.

### Loop 1 — Module self-improvement
**User feedback** (ratings, corrections, where they got stuck, what they had to redo) flows back through **events-as-data** (`EXECUTION-OUTCOME-OBSERVABILITY.md`, `INSTITUTIONAL-MEMORY-EVENTS.md`) and **refines the module's own guidance, templates, and prompts.** This is the continuous-feedback-reel pattern (`project_continuous_feedback_reel`) aimed **at the module itself** — the guided tasks and GUIDE prompts get sharper because real users showed where they were unclear. The module that confused ten people stops confusing the eleventh.

### Loop 2 — Skills-match learning
Every **completed task + QA outcome + feedback** updates the **person ↔ task matching model** (the SKOS marketplace; `MARKETPLACE-ARCHITECTURE.md` — experience over credentials). Matches get better over time: **demonstrated capacity and reputation compound,** so the system routes the right work to the right person with steadily less guesswork. The marketplace gets smarter with every closed loop — the same events-as-data history that powers prediction in the PMO module (`...pmo-portfolio-module-spec.md` §3) powers matching here.

### Loop 3 — People-growth / motivational layer
For **families and individuals who WANT to invest in upskilling**, the platform offers **iterative, intuitive skill paths:** next-step tasks pitched **just above the person's current level**, carried by anxiety-clarity guidance (what / when / why / how), with **visible progression.** Growth is real and it pays: **clearing a skill tier unlocks more task tiers and more 1099 earning capacity** (`...workforce-three-ring.md` §2). The path is opt-in — it serves the person who wants to grow, and it never nags the person who doesn't.

### The flywheel (stated explicitly)

```
feedback  ->  better modules  ->  users supported better  ->  they do more + grow
   ^                                                                   |
   |                                                                   v
more feedback  <-  more capacity + pipeline value  <-  skills-match sharpens
```

Each turn feeds the next: **feedback → better modules → users are supported better → they do more and grow → the skills-match sharpens → more capacity and more pipeline value → more feedback.** It **compounds** — every module gets better, every match gets sharper, and every willing person grows, on the same loop.

### Wellbeing guardrail (binding)

Motivation comes from **real progression, mastery, and opportunity** — **NOT** from manipulative streaks, guilt, loss-aversion nags, or any engagement dark pattern. This is binding and consistent with the platform's no-extraction / community-first / opt-in values (`DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md` — no engagement optimization; `COMMUNITY-FIRST-MISSION.md`; `QUALITY-OF-LIFE-AS-NORTH-STAR.md`). **People's actual growth is the goal — not their engagement.** A metric that rises because someone is anxious, guilted, or hooked is a failure of the bar, not a success.

This ties directly to the mission: the **Black-church economic powerhouse** and **soul-prosperity** order (3 John 1:2; `BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md`). Families upgrading real skills and real earning capacity — soul prospering first, provision following — is the literal outcome this flywheel exists to produce. It lifts and creates; it does not extract or hook.

Recorded as **DR-018.**

---

## 5. The convergence this represents

This pattern is the convergence of two threads already in the foundations:

- **Per-industry sovereign LLM-teams** — each industry gets a sovereign, self-hosted LLM "team" that runs its discipline on the owner's own node (the sovereignty spine of `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`).
- **The SKOS marketplace** (`MARKETPLACE-ARCHITECTURE.md`) — **experience over credentials**, **prebuilt role modules.** The marketplace doesn't ask "are you certified?"; it asks "can the guided, gated system carry you to expert-quality output?" The role module is exactly that prebuilt carrier.

Where they meet: a **prebuilt, sovereign, per-industry role module** that a non-expert plugs into and immediately operates at expert quality. That is the product.

---

## 6. Instances

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

## 7. Prioritization lens

Candidate industries are ranked by **pipeline value**, tied to the three-ring market (`...workforce-three-ring.md` §5) and the Workforce Layer:

1. **Tie to a ring already being served.** Modules that productize work **already being delivered by hand** (IT/network ops = the live COLG build; real-estate = Poe Properties) rank first — the demand is proven and the reference build exists.
2. **Tie to a real tenant we can dogfood.** A module we run on ourselves first (Legal on PoeTech's own legal needs; real-estate on Poe Properties; PMO on our own portfolio) surfaces rough edges before a paying tenant sees them.
3. **Strength of the four-way payoff** (§2.4). Prefer modules that meaningfully widen *all four* — tenant + market segment + workforce category + data source — over those that only add one.
4. **Workforce-category depth.** Industries whose repeatable tasks route cleanly to guided, QA-gated 1099 work (accounting, marketing, IT) deepen the delivery engine that makes every other ring reachable solo.
5. **Mission weight.** For Ring-1/Ring-2 community work, the Father's-Business / soul-prosperity lens (`QUALITY-OF-LIFE-AS-NORTH-STAR.md`, `BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md`) is a ranking input, not an afterthought.
6. **Want-To-Use clearance + flywheel fit.** Prefer modules that can clearly **clear the Want-To-Use Bar (§3)** for their role-holder early, and whose work generates **rich feedback for the flywheel (§4)** — a module the operator voluntarily reaches for, and that learns from use, delivers compounding pipeline value faster than one that is merely feature-complete.

The lens is applied **per candidate before any build is committed** — sizing each vertical (the §Ring-3 "per-vertical assessment" discipline) is itself a prioritization step, not a formality.

---

## 8. Guardrails on this document

- **This is a PLAN / spec.** No code, no purchases, no money movement, no autonomous execution flow from it. Standing up any module is a separately governed decision.
- **Configuration-not-custom-build is a hard requirement.** A new module that requires a new application rather than config + written-once extensions has failed the pattern (`MODULAR-EXTENSIBILITY.md`).
- **Isolation tiers are non-negotiable per instance.** Counseling (ISO-1 / PHI) and Legal (privilege) ship only at their required tiers; cross-entity roll-up never crosses those firewalls.
- **The autonomous pieces of any instance are Tier C** — all three brakes (budget, concurrency lock, kill-switch), inactive → watched → never unattended (`feedback_autonomous_automation_three_brakes`, `RELEASE-TIERS.md`).
- **The Test (`MIND-OF-CHRIST.md`) was run against this output** before delivery: true (no fabrication — these are recorded agreed decisions), honorable, just, and aligned with the serve-not-extract mission and `GOVERNANCE-EXECUTION-ADVISORY.md` (Darrell governs, the Foundation executes, Claude advises).
