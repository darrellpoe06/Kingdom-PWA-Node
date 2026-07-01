# Adopter Onboarding & Provisioning System — the offering + the operational runbook

**Date:** 2026-06-29
**Type:** Layer 4 working artifact — system design + operational runbook, with the in-app pieces that landed this session.
**Author:** Claude Code (research-first pass, grounded in the live tree).
**Status:** Modules + adopter-facing surface SHIPPED (this PR). The isolation-model *extensions* (granular consent, minor accounts, multi-tenant office product) remain Tier-C, awaiting Darrell's go (see §8).
**Grounds:** QUALITY-OF-LIFE-AS-NORTH-STAR, COMMUNITY-FIRST-MISSION, DATA-AS-EMPOWERMENT-NOT-EXTRACTION, SEED-DATA-AS-ASPIRATION, ANXIETY-CLARITY-PRINCIPLE, GOVERNANCE-EXECUTION-ADVISORY, the Verification Doctrine (DR-0076), the Cage (DR-0010), RELEASE-TIERS. Builds directly on `ROLES-MEMBERSHIP-MULTITENANCY-ADR.md` (the architecture this productizes).

> **The ask.** Darrell's friends want to adopt PoeTech for their own family, church, or business. This is the Quality Care Health Plan applied to *onboarding new tenants*: give each adopter their own sovereign, isolated, verified instance — served, not surveilled — and get them productive in hours, not weeks. This document is both halves: **the offering** (what they receive) and **the operational provisioning/onboarding runbook** (how an instance is spun up, verified, and handed off, repeatably).

---

## 0. TL;DR

1. **The tenant boundary already exists and is already enforced.** A tenant is an `instances` row; isolation is the single RLS predicate `user_in_instance(instance_id)` on every instance-scoped table; a new adopter is auto-provisioned into their OWN `u-<uid>` instance as its `owner` by `join_default_instance()`. Two CI gates (`tenancy-guard.mjs`, `grant-guard.mjs`) fail the build if that wall is ever dropped. **We are productizing a wall that is already standing — not inventing one.**
2. **The one gap this session fills safely:** a new adopter used to land in `EMPTY_WORLD` (blank). Now there are **aspirational starter templates** per adopter type (family / church / business) — a thriving stewardship picture they would *want*, **never the Poe family's real data**, enforced by a new proven-to-catch guard.
3. **Shipped this PR (pure modules + one live surface, zero monolith growth):** `lib/adopter-templates.js`, `lib/adopter-onboarding.js`, `lib/provisioning.js`, `scripts/adopter-template-guard.mjs`, 4 test files (34 tests), and an **Adopt PoeTech** offering section live inside About.
4. **Decision-pending (Darrell's calls, flagged honestly, not assumed):** the aligned-brand sponsor roster + ratio, final paid-tier pricing, and which Tier-C isolation phases get a go.

---

## 1. The offering — what an adopter receives

Surfaced live in the app (About → **Adopt PoeTech**), driven by `app/src/lib/adopter-onboarding.js` so the copy can never drift from what the code says.

### 1.1 Who it's for
- **A family** — households stewarding money, time, and faith together.
- **A church** — congregations who want to serve their people with tools they own.
- **A small business** — owner-operators keeping honest books and a clear pipeline.

### 1.2 What you get (traced to shipped modules)
- Your own **isolated instance** — your data firewalled from every other adopter (RLS no-leak).
- **Owner / admin / member** roles, plus the relationship model for **guardian→child, family, landlord↔tenant** (`lib/relationships.js`, `guardian-child.js`, `tenant-portal.js`, `components/Relationships.jsx`; migration `0055-relationship-permissions.sql`).
- A **thriving aspirational starter** you can keep, edit, or clear — never anyone else's real data.
- A self-paced **Data Systems & Infrastructure** course and a contextual **"?"** on every screen (`lib/help-content.js`, `components/HelpButton.jsx`, `HelpWalkthrough.jsx`).
- In-app feedback that becomes a tracked **Concern & Solution** (`lib/concerns.js`, `feedback-sync.js`, migration `0039-concerns-board.sql`) — the system keeps improving for you.

### 1.3 Governance & trust IS the offer (the structural moat)
From `THE_OFFERING.trustPromises`:
- **Sovereign / self-hostable** — runs on hardware you can own; internal surfaces live on your own network (AI-FOUNDATION-INTERNAL-OPERATIONS, the sovereign NAS deployment).
- **Served, not surveilled** — no advertising model, no engagement optimization, no behavioral targeting.
- **No data sale, ever** — your data serves your family/church; it is never extracted (DATA-AS-EMPOWERMENT-NOT-EXTRACTION).
- **Consent-gated** — aggregation/sharing only on explicit, per-purpose opt-in; deletion is immediate and verifiable.
- **Ari is bounded by the Cage** — every autonomous loop carries a **budget, a single-instance lock, and a kill-switch** (the three brakes; DR-0010, the "Autonomous Automation Requires Three Brakes" Layer-0 rule).

### 1.4 The way in — the funding model (access tier)
Per `project-community-free-funded-by-aligned-brand-sponsorship`:
- **Foundation — free forever** (the Financial System for Families + the whole Spiritual Module).
- **Loved Ones · Founding Family** — free PoeTech+ for life, invited by the Poe family.
- **Community · Families in need** — free through partner churches / 501(c)(3)s, **funded by aligned-brand partners, never your data**.
- **Mission-aligned 501(c)(3)** — a community-partner path for aligned nonprofits.

The free tiers are funded by vetted aligned-brand sponsorship (public-radio-underwriting style), **never by selling data and never by skimming a paying family.**

---

## 2. Tenant isolation & provisioning (the foundation, already live)

### 2.1 The model (verified, file:line)
| Piece | Where | What it guarantees |
|---|---|---|
| Tenant = `instances` row | `infra/supabase/schema-v2.1-infra.sql` | `instance_type IN (family, church, therapy-practice, business, landlord, …)` — one row per adopter org. |
| Membership = `instance_members(instance_id, user_id, role)` | same | roles `owner / admin / member / viewer / specialist`; UNIQUE(instance_id, user_id). |
| The wall = `user_in_instance(instance_id)` | same (SECURITY DEFINER) | every instance-scoped table's SELECT policy is `USING (user_in_instance(instance_id))` → a user not in instance Y reads **zero** Y rows. |
| Self-serve provisioning | `migrations-auto/0002-join-default-instance-self-serve.sql` | family allowlist → shared `poe-family`; **everyone else → their OWN `u-<uid>` instance, as `owner`.** Advisory-locked, idempotent, race-safe. |
| Church provisioning | `migrations-auto/0012-church-instance-multi-membership.sql` | `join_church_instance()` — leaders get assigned roles in `colg`; non-leaders get NULL (no exception, graceful). |

### 2.2 The repeatable provisioning runbook
Machine-readable as `lib/provisioning.js` `PROVISIONING_STEPS`; the operator walk:

1. **Create the isolated instance.** Adopter signs in → `join_default_instance()` mints `u-<uid>` and an `owner` membership. *Verify:* exactly one owner row; the `u-<uid>` instance exists.
2. **Confirm the cross-tenant wall.** Run the **two-identity live no-leak probe** (ADR §5.4): identity A reads only A's rows / zero of B's; B symmetric; anon → `42501`. *Verify:* every line passes with real tokens.
3. **Confirm table reachability.** `scripts/grant-guard.mjs` green (every `instance_id` table granted to `authenticated`; recurrence guard present — `0024`).
4. **Load the aspirational starter.** `templateFor(type)` (§3) — the thriving picture; **never Poe data.** *Verify:* `scripts/adopter-template-guard.mjs` green.
5. **Wire roles & relationships.** Owner adds people (admin/member/guardian→child/tenant). *Operator-judgment step — who-gets-what is the owner's call.*
6. **Run the quality gates.** Full required check (`app — lint + vitest`): tenancy-guard, grant-guard, consistency, legibility, monolith-budget, the no-leak guard. *Verify:* CI green **on the exact served SHA** (quality-proof is green only on the served build).
7. **Confirm the loops are live.** `lib/loop-health.js assessLoops()` — no dead `never`; each loop fresh or honestly `awaiting` a named upstream. Feedback→Concerns wired.
8. **Hand off.** `provisioningReadiness()` reports `ready:true` — every gate has passing evidence (§4).

### 2.3 What is NOT changed here (and why)
The isolation *model* is left exactly as-is. Extending it (per-row consent, minor accounts, a multi-tenant office product) is **Tier C** per `ROLES-MEMBERSHIP-MULTITENANCY-ADR.md` and `RELEASE-TIERS.md` — soak + family review + Quality Gatekeeper, each gated on its own proven-to-catch isolation tests. This session does not touch that model (it would not be safe to auto-merge), and the monolith is frozen at its budget ceiling (9572/9572), so all new work is separate modules. §8 lists the phases awaiting a go.

---

## 3. Aspirational seed per adopter (NEVER Poe data)

`lib/adopter-templates.js` provides one thriving starter per adopter type, each answering the four-point **SEED-DATA-AS-ASPIRATION** contract (privacy / aspiration / relatability / active-guidance):

- **Family** — a two-earner household (~$8.2K/mo), a buffer at ~72% of target and growing, two debts both descending, giving held steady, modest positive cash flow, and one gentle "groceries trending 8% over" nudge.
- **Church** — a small congregation (Cornerstone Fellowship) with ministries wired, a media feed live, staff already in the Data Systems course, and a service-prep nudge.
- **Business** — an owner-operated shop (Trailhead Goods LLC, ~$14.5K/mo) with positive cash flow, a tax set-aside that already covers the bill, and a live pipeline.

Names are deliberately fictional **and** distinct from both the Poe family and the existing demo personas, so nothing collides with seed-provenance / entity-pollution detection.

**The bright line, enforced:** `scripts/adopter-template-guard.mjs` scans the template source for any real Poe identifier (people, emails, brands, church, places) and **fails the build** on a hit. It is **proven-to-catch** — a companion test feeds it a poisoned template and asserts it flags the leak (anti-theater: a gate that always passes is itself a lie). *Wiring note:* swapping a new adopter's `EMPTY_WORLD` hydration for `templateFor(type)` is a one-line change at the monolith hydration site — deferred until the monolith extraction frees budget; the module + guard are ready now and the live About preview proves them real.

---

## 4. Quality gates pre-handoff (no fake green)

`provisioningReadiness(signals)` is the evidence-based handoff gate. Each gate maps to a **measured** signal:

| Gate | Evidence signal |
|---|---|
| Owner membership exists | `ownerMembershipPresent` |
| Two-identity no-leak probe passed | `noLeakProbePassed` |
| Grant guard green | `grantGuardGreen` |
| Aspirational starter loaded (no Poe data) | `starterChosenAndClean` |
| Required check green on served SHA | `ciGreenOnServedSha` |
| No dead loops (fresh or awaiting) | `noDeadLoops` |

**The doctrine in code (DR-0076):** a signal that is strictly `true` passes; `false` fails; **anything unmeasured is `unknown` and BLOCKS handoff exactly like a failure** — we never claim a gate we did not measure. `renewalStatus(history)` adds the QCHP "is this instance getting *better* each cycle" check: improving/held = renewing; a decline is allowed **only with a stated why** (DR-0075), else it is flagged as a stall.

---

## 5. Roles & relationships (so adopters add their own people safely)

Reuses the shipped relationship model (`project-relationship-permission-model`, migration `0055`):
- **guardian→child** — child-safety is structural: `maxGrant` ceilings, finance/security/purchase locked-deny; child can never self-approve.
- **family** — governor / member / child within a household.
- **landlord↔tenant** — tenant sees only their lease/rent/maintenance; **no money moves in app** (report→confirm ledger + DB CHECK).

The onboarding journey's **"Add your people"** step (§6) routes the adopter to `components/Relationships.jsx`; each added person resolves to exactly their role's capability matrix.

---

## 6. Guided onboarding — productive in hours

`lib/adopter-onboarding.js` `ONBOARDING_JOURNEY` — every step answers **what / when / why / how** (ANXIETY-CLARITY-PRINCIPLE), rendered live in the Adopt PoeTech surface:

1. **Create your profile** (no profile, no access — the security model).
2. **Choose your starter picture** (family / church / business — never blank, never someone else's data).
3. **Add your people** (Relationships — guardian→child / family / tenant).
4. **Learn the system at your pace** (Data Systems course in Church → Learn; the "?" on every screen; the first-run walkthrough).
5. **Enter your first real thing** (the example bows out the moment real data lands).
6. **Tell us what is rough** (in-app feedback → Concerns & Solutions board).

---

## 7. Support & continuity

- **In-app feedback → Concerns & Solutions board** (`lib/concerns.js`, `feedback-sync.js`): every piece of feedback becomes a tracked concern with a status and a target — worked, not lost. Untriaged feedback renders as an `open` concern automatically.
- **Institutional memory:** decisions and lessons live in `docs/decisions/` + `LESSONS-LEARNED.md`; this doc is the Layer-4 record for the onboarding system.
- **The always-on runner** (`project-nas-deterministic-loop-runner`, INERT, three brakes) keeps routine improvement moving even when the vendor AI is offline — perpetual improvement is the default (DR-0075).

---

## 8. What needs Darrell (SME / decision-pending — flagged, not assumed)

Surfaced in-app as "Still being decided" (`DECISIONS_PENDING`):
1. **Aligned-brand sponsor roster + sponsor-to-family ratio** — a business/financial decision; the model is set (aligned-brand, never data), the partners are not.
2. **Final paid-tier pricing confirmation.**
3. **Which Tier-C isolation phases get a go** (from the ADR): Phase 1 granular consent + minor accounts; Phase 2 practice-LMS manager role; Phase 3 the multi-tenant office product. Each is its own DR, gated on proven-to-catch isolation tests + the live no-leak probe; none auto-merges.
4. **Default-posture call** (ADR §3.3): which adopter data is private-by-default vs household-shared-by-default — governance, not technical.

---

## 9. Verification ledger (DR-0076 honesty)

- **Verified this session (ran green):** the full app test suite (3102 tests) after this change; the four new test files (34 tests) incl. the proven-to-catch no-leak guard (planted-leak caught); `monolith-budget-guard` (9572, unchanged — no monolith growth); `legibility-guard` (no new violations; health snapshot regenerated, 117 pages / 102 passing); `consistency-guard` (no new emoji/fixed-px); production build (About bundle includes the new surface); eslint clean on all new files; the AdoptPoeTech live-render test (mounts, switches starter on click).
- **Cited from prior verified artifacts:** the isolation model + `user_in_instance` + `join_default_instance` (ROLES-MEMBERSHIP-MULTITENANCY-ADR + the migrations); the relationship model (PR #398); the help/concerns/loop-health systems (their shipped modules).
- **NOT verified here (by design):** the live two-identity no-leak probe against a real second cloud identity (ADR Phase 0 — operator step in the runbook); the `EMPTY_WORLD → templateFor(type)` hydration wire (deferred to post-extraction; module + guard ready). No claim that any Tier-C phase is built — they are explicitly awaiting a go.
