# PoeTech Market Strategy — The Workforce Layer + the Three-Ring Market

**Date:** 2026-06-09 (Tue)
**Author:** Claude (strategy doc on Darrell's commission — recording decisions already discussed and agreed in chat, not inventing them)
**Status:** PLAN / strategy doc. **No code, no purchases, no money movement, no autonomous execution.** Decision support + target market architecture only.
**Decision records:** DR-001 (workforce-layer 1099 model), DR-002 (three-ring market + funding model), DR-005 (employment-law scope split) — see `docs/decisions/INDEX.md`.
**Companion docs (this PR):** `2026-06-09-legal-module-spec.md` (the first concrete Ring-3 tenant), `2026-06-09-trevor-real-estate-lawyer-review-package.md` (the lawyer-facing review package).
**Reads through:** `docs/00-foundations/_root/BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md` (the economic-powerhouse mission), `COMMUNITY-FIRST-MISSION.md` (COLG-first), `MARKETPLACE-ARCHITECTURE.md` (sovereign sell/manage/grow), `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `ANXIETY-CLARITY-PRINCIPLE.md` (what/when/why/how), `QUALITY-GATEKEEPER.md` (the LLM gate), and `CLAUDE.md` Layer 0 — all under the worldview spine.
**Memory anchors:** `project_community_free_funded_by_aligned_brand_sponsorship`, `project_what_is_actually_free`, `feedback_autonomous_automation_three_brakes`.

---

## 0. The dual aim (the frame everything sits inside)

> **ESV — 3 John 1:2:** *"Beloved, I pray that all may go well with you and that you may be in good health, as it goes well with your soul."*

The order is fixed: **the soul prospers first; all else follows as the soul goes.** The mission is not "make money and feel good about it." It is: **give what makes the soul prosper — and prosper too, legitimately, because value is given rather than extracted.** PoeTech is allowed to prosper precisely *because* the prosperity is downstream of value delivered, never skimmed off people who are made poorer by the transaction. This is the same serve-not-extract spine declared in `BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md` and `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`.

This document records the market strategy for *how* PoeTech reaches people at scale to do that. It leads with the workforce layer, because that is the piece that makes the rest reachable by one founder.

---

## TL;DR (read this first)

1. **The bottleneck is Darrell.** Today, value routes through his hands and his expertise. There is only one Darrell. Every opportunity below is gated by his personal capacity until that changes. (§1)
2. **The fix is the Workforce Layer (§2) — the centerpiece.** The PoeTech App + the LLMs turn Darrell's expertise into instruction-rich, guided tasks (what / when / why / how — the anxiety-clarity DNA), so the **hiring bar becomes capacity, not credentials.** One expert + LLMs = a system that directs many hands at a consistent quality bar. It clones Darrell.
3. **The loop is concrete (§2.2):** sign up via the identity layer (verified by the 2+-source cross-reference) → app matches tasks by capacity / skill / location → worker executes and uploads proof (photos / text, the same flow as Poe Properties service requests) → the **LLM Quality Gatekeeper** checks the proof against the task's *explicit acceptance criteria* → **payout is gated on a QA pass** → paid as a **1099** contractor. Darrell governs; LLMs do the toil and the admin.
4. **Four real constraints, each with a handling and a forward plan (§3):** worker classification (1099 vs employee), payments/escrow (do **not** build a money rail), physical/trust risk (tier tasks by risk), and quality gating (load-bearing — no rubber-stamping).
5. **Start narrow (§4).** Pilot on the church build + Poe Properties tasks with known, trusted people → prove the loop → put a lawyer, insurance, and a payments rail in place → *then* widen.
6. **The Three-Ring Market (§5):** Ring 1 = the local church (COLG) — direct, hands-on, a gift, the reference build. Ring 2 = other churches — productize the COLG sovereign node as managed IT. Ring 3 = businesses — the widest market, where the paid tiers live.
7. **The funding model (§6):** the paid rings (businesses + churches that can pay) subsidize the **free mission tier** (community / Loved Ones), consistent with the aligned-brand-sponsorship + four-rails funding already in memory.
8. **The Workforce Layer is the delivery engine.** It is what makes the three-ring market reachable by one founder rather than a fantasy that requires a hundred Darrells.

---

## 1. The bottleneck: there is only one Darrell

Every ring of the market below — the church build, other churches, businesses — currently needs Darrell's hands, his judgment, and his accumulated ~25 years of operating expertise to deliver. That is the ceiling. A solo expert can sell a vision to many, but can only *deliver* to as many as personally fit through his own week.

The strategic move is not "hire a team and hope they're as good." It is to **encode the expertise into the system** so that the system — the PoeTech App plus the LLMs — carries the judgment, and the humans carry the hands. That is the Workforce Layer.

---

## 2. The Workforce Layer (the centerpiece)

### 2.1 What it is

The PoeTech App and the LLMs turn Darrell's expertise into **instruction-rich, guided tasks**. A task is not "go fix the thing." A task is the full anxiety-clarity package (`ANXIETY-CLARITY-PRINCIPLE.md`): **what** to do, **when** it's due, **why** it matters, and **how** to do it step by step — with explicit acceptance criteria attached. The guidance is the product of Darrell's expertise, captured once and reused on every task of that kind.

Because the *how* travels with the task, **the hiring bar shifts from credentials to capacity.** You no longer need a person who already knows how; you need a person who can follow the guided task and produce the proof. The expertise lives in the system; the worker supplies attention, hands, and reliability.

> This is the SKOS marketplace vision (`MARKETPLACE-ARCHITECTURE.md`) aimed squarely at the **execution layer** — sell / manage / grow extended to *deliver*.

### 2.2 The loop

```
[1] SIGN UP        worker joins via the identity layer
                   (verified by the 2+-source cross-reference: 2 corroborating
                    identity sources that agree = "known/verified" = frictionless tier)
        |
        v
[2] MATCH          the App matches tasks to the worker by capacity / skill / location
        |
        v
[3] EXECUTE        worker does the guided task and UPLOADS PROOF
        |          (photos / text — the SAME flow as Poe Properties service requests:
        |           maintenance_requests, submitted_via='renter-portal')
        v
[4] QA GATE        the LLM QUALITY GATEKEEPER checks the proof-of-work against the
        |          task's EXPLICIT acceptance criteria  ->  pass / rework / escalate
        v
[5] PAYOUT         payout is GATED on the QA pass; released via an established
        |          contractor-payments platform
        v
[6] PAID 1099      worker is paid as a 1099 contractor; reputation compounds
```

Darrell governs the system and sets the bar. The LLMs do the toil and the admin: writing/maintaining the guided tasks, matching, running the QA gate, generating the documentation trail, and triggering payout on a pass. The human gate is judgment, not toil.

### 2.3 Why this is the strategic centerpiece

- **It clones Darrell.** One expert + LLMs = a system directing many hands at a consistent quality bar. The expertise is no longer trapped in one person's week.
- **It makes the Black-Church economic powerhouse *literal*.** Per `BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md`, the mission is to teach and build an economic powerhouse in the Body. The Workforce Layer puts **real 1099 income into the hands of the community and the congregation** — not a metaphor, a paycheck. Soul-prosperity and material provision, in the right order (3 John 1:2).
- **It is the delivery engine for the three-ring market.** Without it, Rings 2 and 3 are unreachable solo. With it, Darrell sells and governs while a quality-gated workforce delivers.

### 2.4 What this is NOT

It is not a gig-economy extraction play. The guided-task model exists to *lift* the worker (give understanding and a path to income), not to squeeze the cheapest possible labor. The serve-not-extract test in `CLAUDE.md` and `GOVERNANCE-EXECUTION-ADVISORY.md` applies: *does this lift the family AND create rather than extract?* The Workforce Layer must pass that test on every task class.

---

## 3. Constraint-handling roadmap (risk → handling → forward plan)

These are the four real constraints. Each is recorded with how it is handled and the forward plan. **None of this is legal, tax, insurance, or financial advice** — each item names the professional who owns it.

### 3.1 Worker classification (1099 vs employee)

- **Risk:** misclassifying workers as 1099 contractors when the law would deem them employees carries back-tax, penalty, and liability exposure. Illinois has its own classification rules on top of federal.
- **Handling:** the task-marketplace structure — workers choose tasks, control their own schedule and means, are not economically captive to one assignment — fits the **1099 contractor** posture. The framework and the contractor agreement are set **once by a labor/employment attorney**; thereafter the **LLMs do the repeatable admin**: collecting W-9s, keeping per-task records, and maintaining the documentation trail that evidences contractor (not employee) status.
- **Forward plan:** start **clearly-1099** (low-ambiguity task classes only). Add a **W-2 / PEO tier later** if and when a class of work warrants employees. Confirm **Illinois-specific** rules with the attorney before scaling.
- **Owner:** a labor/employment attorney. **Explicit scope flag:** this is **employment-and-labor law**, NOT real-estate law — it does **not** route to Trevor (real-estate). See §3.5 and the Trevor review package. *(Not legal advice.)*

### 3.2 Payments / escrow

- **Risk:** building our own money-movement rail (holding worker funds, moving payouts) can trigger **money-transmitter** licensing obligations — a heavy, multi-state regulatory burden we must avoid.
- **Handling:** **do NOT build a money rail.** Integrate an **established contractor-payments platform** that already handles payouts, W-9 collection, **1099-NEC** filing, and milestone/escrow. The PoeTech LLMs orchestrate the *logic* (task → QA-pass → payout-trigger); the **platform moves the money and owns the compliance.**
- **Forward plan:** treat the payments platform as an **accepted vendor dependency** (consistent with the swappable-vendor posture in `MARKETPLACE-ARCHITECTURE.md` — own the spine, keep the vendor swappable, audit every swap). Evaluate candidate platforms during the pilot; do not commit a money rail to the codebase.
- **Owner:** the chosen payments platform (compliance) + Darrell (vendor selection). *(Not financial/regulatory advice.)*

### 3.3 Physical / trust risk

- **Risk:** physical-world tasks carry safety, liability, and trust exposure — especially anything entering churches or homes, anything regulated (electrical, work at height), and anything touching surveillance or access control.
- **Handling:** **tier tasks by risk.**
  - **Low-risk** (dev, content, remote, light tasks) → open to **verified capacity** (the identity-layer "known" tier).
  - **High-risk regulated** (electrical, work at height, etc.) → **licensed + insured trades only.**
  - **Anyone entering churches or homes, or touching surveillance / access** → **background check + explicit child-safety care** (this is COLG and family ground; the bar is high).
  - **PoeTech carries general liability + contractor insurance.**
  - **Trust = identity + reputation + QA**, compounding over completed work.
- **Forward plan:** define the risk tiers explicitly before any physical task ships to a non-known worker; stand up insurance before widening past the trusted pilot group.
- **Owner:** an insurance broker (coverage) + Darrell (tiering policy). *(Not insurance advice.)*

### 3.4 Quality gating (load-bearing)

- **Risk:** a workforce of capacity-not-credentials hires only works if quality is *guaranteed by the system*, not assumed. A weak gate destroys the whole model — and the mission's credibility.
- **Handling:** **explicit acceptance criteria per task**; the **LLM Quality Gatekeeper** (`QUALITY-GATEKEEPER.md`) checks the proof-of-work against those criteria; **payout is gated on a pass**; a **rework loop** returns failed work with specific guidance; **reputation compounds** for workers who pass cleanly; **high-stakes work escalates to human review behind the Cage** (`infra/ai-orchestrator/`). **No rubber-stamping** — the gate is real or it is nothing.
- **Forward plan:** the QA gate is built and tuned during the narrow pilot, where Darrell can spot-check the Gatekeeper's judgments against his own and calibrate before any scaling.
- **Owner:** Darrell governs the bar; the LLM Gatekeeper executes; the Cage enforces escalation. (Per `QUALITY-GATEKEEPER.md`: the mirror, never the gavel — the gate cites the matched criterion, never condemns the worker.)

### 3.5 Cross-cutting: the scope split on legal review

Two distinct bodies of law touch this strategy and they go to **two different lawyers**:

- **Real-estate / Poe Properties flows + the contractor-agreement *form*** → **Trevor** (Darrell's real-estate lawyer). See the Trevor review package.
- **Worker classification (1099 vs employee)** → an **employment-and-labor attorney** (possibly a referral *through* Trevor). **This question must NOT be routed to Trevor** — it is outside his practice area.

This split is recorded as **DR-005**.

---

## 4. Cross-cutting plan: start narrow, then widen

The sequencing is deliberate and non-negotiable:

1. **Pilot narrow** — run the loop on the **church build (COLG) + Poe Properties tasks** with **known, trusted people** only.
2. **Prove the loop** — confirm that guided tasks + the LLM QA gate produce reliable quality, and that the identity / proof / payout flow works end-to-end.
3. **Put the rails in place** — engage the labor/employment attorney (agreement + classification framework), stand up insurance (GL + contractor), and integrate the contractor-payments platform.
4. **Then widen** — open task classes to verified capacity beyond the trusted group, tier by risk.

Widening before the rails are in place is the failure mode. The narrow pilot is where the model is proven cheaply and the Gatekeeper is calibrated.

---

## 5. The Three-Ring Market

Three concentric rings, widening from the reference build outward. Each is recorded with its opportunities, constraints, and strategy.

### Ring 1 — The local church (COLG)

- **What it is:** The Church of the Living God — the Poe family's home church, the named **first community** (`COMMUNITY-FIRST-MISSION.md`). Direct, hands-on, the **proof-of-concept** and the **reference build** that everything else points to.
- **Opportunities:** a real, live deployment with real users; the credibility of a working sovereign node; the relationships that make Ring 2 reachable.
- **Constraints:** an elderly, tech-novice staff (accessibility-default applies); it is **largely a gift** — a *give-from-understanding*, not a revenue line.
- **Strategy:** build it excellently as the reference; let it generate the proof, the testimonials, and the productizable template. The gift to Ring 1 is what earns the right to sell Rings 2 and 3.

### Ring 2 — Other churches

- **What it is:** **productize the COLG "sovereign church node"** — NAS + LLM + surveillance + **IT-ops-as-a-service** — as a package that **replaces a church's network engineer / managed-IT spend.** PoeTech-managed over the Tailscale mesh.
- **Opportunities:** **every church currently paying for managed IT** is a candidate. The pitch funds itself: a church redirects the IT money it *already spends* into the PoeTech node, and the **freed budget flows to communities and missions** instead of to a managed-IT vendor.
- **Constraints:** **trust** (a church handing over its infrastructure), **capital** (upfront hardware), **tech-readiness** (varies widely by congregation).
- **Strategy:** **packaged tiers**; **lead-with-value** progressive disclosure (the Mars Hill pattern from the church directory); the **church directory as the on-ramp**. Sell the outcome (sovereign, managed, cheaper-over-time), not the stack.

### Ring 3 — Businesses

- **What it is:** the **widest market**, and **where the paid tiers live.** The pitch: **own your systems vs. bleed SaaS + IT spend** — an enterprise-grade stack at SMB cost.
- **Opportunities:** the largest addressable market; recurring revenue; the ring that **funds the free church/community tier.**
- **Constraints:** needs **per-vertical assessment** — each business vertical has its own opportunities, constraints, and competitive landscape, and must be sized before entry. (The Legal Module — `2026-06-09-legal-module-spec.md` — is the **first concrete Ring-3 vertical**.)
- **Strategy:** lead with the sovereignty + cost story; assess each vertical before committing; let the Workforce Layer deliver so one founder can serve many business tenants.

### Ring diagram

```
        Ring 3 — BUSINESSES (widest; paid tiers; funds the mission)
   +-------------------------------------------------------+
   |     Ring 2 — OTHER CHURCHES (productized sovereign     |
   |             node; managed IT; freed budget -> missions)|
   |   +-----------------------------------------------+    |
   |   |   Ring 1 — COLG (direct, gift, reference build)|    |
   |   +-----------------------------------------------+    |
   +-------------------------------------------------------+
        ^ delivered across all rings by the WORKFORCE LAYER (§2)
```

---

## 6. The funding model

The rings are not equals on revenue — by design:

- **Paid rings subsidize the free mission tier.** Businesses (Ring 3) and **churches that can pay** (Ring 2) generate the revenue that **subsidizes the free mission tier** — community and Loved Ones (Ring 1 and the broader Body).
- **Consistent with what's already in memory:** this is the same funding logic as `project_community_free_funded_by_aligned_brand_sponsorship` (Community-free funded by vetted aligned-brand partners, never by selling data or skimming subscribers) and the four-rails funding model. Per `project_what_is_actually_free`, only the **Financial System for Families** and the **Spiritual Module for the Body** are free; everything else is paid — and that paid revenue is what makes the free tier sustainable rather than charity that runs dry.
- **The serve-not-extract guarantee holds across the model:** the free tier is funded by **value freely exchanged in the paid rings + aligned sponsorship**, never by extracting from the people the mission exists to serve. That is what keeps the dual aim (§0) legitimate.

---

## 7. Decision record + rationale

Per `feedback-decisions-with-rationale`. Full DRs in `docs/decisions/INDEX.md`.

| # | Decision | Rationale |
|---|---|---|
| **DR-001** | Build the **Workforce Layer** (guided tasks + LLM QA gate + 1099 payouts) as the delivery engine and market centerpiece. | There is only one Darrell; encoding his expertise into instruction-rich tasks shifts the hiring bar from credentials to capacity and clones his delivery capability. Makes the economic-powerhouse mission literal (1099 income to the community). |
| **DR-002** | Pursue a **three-ring market** (COLG → other churches → businesses) with **paid rings subsidizing the free mission tier.** | Concentric expansion from a proven reference build; the widest ring (business) funds the mission, consistent with the aligned-brand + four-rails funding already in memory. |
| **DR-003** | **Do NOT build a money rail; integrate an established contractor-payments platform.** | Building money movement risks money-transmitter status; an established platform owns payouts, W-9s, 1099-NEC, and escrow compliance as an accepted, swappable vendor dependency. |
| **DR-004** | **Quality is gated by the LLM Quality Gatekeeper against explicit acceptance criteria; payout follows a QA pass; no rubber-stamping; high-stakes escalates behind the Cage.** | A capacity-not-credentials workforce only works if the system guarantees quality; the gate is the load-bearing element of the whole model. |
| **DR-005** | **Worker classification (1099 vs employee) routes to an employment/labor attorney, NOT to Trevor (real-estate).** Start clearly-1099. | Classification is employment-and-labor law and is outside Trevor's real-estate practice; misrouting it would produce unreliable guidance on a high-liability question. Illinois has its own rules. *(Not legal advice.)* |

---

## 8. Guardrails on this document

- **This is a PLAN.** No purchases, no money movement, no autonomous execution flow from it. Standing up the payments platform, hiring the attorneys, and buying insurance are **Darrell's governed decisions**, not actions taken from this doc.
- **Tier C discipline applies to the eventual build.** When the Workforce Layer ships any timer-driven or self-triggering automation (matching, QA, payout-trigger), it is **Tier C** and needs all **three brakes** — budget, concurrency lock, kill-switch — per `feedback_autonomous_automation_three_brakes` and `RELEASE-TIERS.md`. It ships **inactive → watched → never unattended.**
- **The Test (`MIND-OF-CHRIST.md`) was run against this output** before delivery: true (no fabrication — these are recorded agreed decisions), honorable, just, and aligned with the serve-not-extract mission.
