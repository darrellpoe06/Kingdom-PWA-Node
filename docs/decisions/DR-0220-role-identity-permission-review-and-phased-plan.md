---
id: DR-0220
title: Comprehensive role / identity / permission review — the shipped model, the gaps, and a phased plan (choir self-claim ships now; the Dev/Ops Specialist capability-checkbox layer is designed + dated)
status: accepted
date: 2026-07-21
tier: B
declared_by: Darrell
supersedes: []
amends: []
principles: [ROLE-CAPABILITY-MODEL, SPEC-CONFORMANCE-REVIEW (DR-0219), REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076), SOVEREIGN-IDENTITY, DR-0187, DR-0060, PERPETUAL-IMPROVEMENT (DR-0075)]
---

## Context

Darrell, 2026-07-21: *"Comprehensive role review opportunities and constraints also review the Ways and documentation to implement the plan after researching best etc. I asked for this in another lane however you may have better experience and context."* And, mid-review, naming a concrete role: *"Dev/Ops specialists can add people to their account and troubleshoot for the Love Corner App when parishioners ask questions… however they also have a check box of what they have access to — isn't this in the Ways and documentation?"*

The full SHOULD-vs-ARE review (SPEC-CONFORMANCE-REVIEW, DR-0219) with `file:line` receipts lives in `docs/99-session-notes/2026-07-21-comprehensive-role-identity-permission-review.md`. This DR records the decisions and the phased plan.

## Decision

**1. The shipped model is two-layer; only RLS is authoritative.** The real gate is Supabase RLS keyed on `instance_members.role` via `user_in_instance` / `user_role_in_instance` (`schema-v2.1-infra.sql:124-143`); the app-shell email allowlists (`poe-financial-mvp-v28.jsx:601-637`) are advisory affordance-gating that can drift. The real role enum is `owner/admin/member/viewer/specialist/child/successor/assistant`. The older `Owner/Editor/Contributor/Viewer/Specialist` ladder (`IDENTITY-ROLES-AUDIT.md`) is **superseded** by the shipped enum for enforcement; it survives only as descriptive persona language.

**2. The DR-0187 claim/confirm handshake is the identity-binding pattern** (`0104`) and it is reused, not reinvented, for every "link a person to a record" need.

**3. Phase 1 — choir roster self-claim — ships now** (migration `0110`): `mint_choir_claim_code` (owner/admin issues a one-time, confusable-free, 30-day code for an unclaimed roster row) → `claim_choir_member` (the signed-in member redeems it, linking `choir_members.user_id`) → `my_choir_membership` (the caller reads their own row for the "you're linked as X" badge). Guards live inside the SECURITY-DEFINER functions; EXECUTE is `authenticated`-only; a live isolation smoke test (`tests/0110-choir-claim-smoke.sql`, CI `choir-claim-isolation.yml`) proves the guards catch (DR-0076). **Linking grants READ + own-absence only — it never touches `instance_members.role`, so claiming a `director` roster row does not confer owner/admin.**

**4. Phase 4 — doc reconciliation — ships now:** the two-ladder contradiction is resolved to the shipped enum; `choir_role` is documented as descriptive-by-design (it gates nothing); `role_scopes` + the capability layer are marked explicitly deferred, not dead-by-accident.

**5. The Dev/Ops Specialist IS in the Ways** (answering Darrell): it maps to the shipped `specialist` role ("an Editor with a tight scope… roles + scope + duration", `IDENTITY-ROLES-AUDIT.md:64`) plus the documented **capability-checkbox layer** `member_has_capability` + `role_capabilities` (`ROLES-MEMBERSHIP-MULTITENANCY-ADR.md:99-118`). The **role ships; the checkboxes do not yet** (GAP 7). The concrete capability map (`member.provision`, `member.claim.issue`, `support.review` on reviewer-mode rails, `content.help.edit`) is recorded in §2b of the review. It is **Phase 6**, dated — because "add parishioners" + "troubleshoot accounts" touch provisioning + parishioner PII (Tier C, must earn the live no-leak probe + Governor review); shipping the primitive unwired would be anti-theater (DR-0076).

**6. The remaining gaps are dated re-reviews (DR-0075), not this-session ships:** Phase 2 back-port data-driven leadership to the church path (remove the hardcoded leader email allowlist) — `re-review: 2026-08-11`; Phase 3 derive shell affordances from `user_role_in_instance` not email allowlists — `re-review: 2026-08-25`; Phase 5 a real church domain role model — `re-review: 2026-09-01`; Phase 6 the Dev/Ops Specialist capability layer — `re-review: 2026-09-15`; GAP 7 `role_scopes` — folded into Phase 6.

## Bright lines (ROLE-CAPABILITY-MODEL)

- **RLS is the real gate; the UI is advisory.** Any role/permission change is proven at the RLS/RPC layer with a live two-identity no-leak probe (DR-0076), never on the agent's word.
- **Linking identity ≠ granting authority.** Binding an account to a roster/record row sets identity only; elevation of `instance_members.role` is a separate, explicit act. Never `owner` by invite or claim.
- **Roles carry capability checkboxes, not bespoke code.** New access = a `role_capabilities` row (a checkbox), not a rewrite of every policy; scope + duration bound a specialist, per the Ways.
- **Identity/role changes are Tier C** — church-facing leadership, provisioning, and any capability touching another person's data soak with Governor review; "additive / sovereign does not downgrade it."

## Consequences

Phase 1 + Phase 4 land this session through the verified lane. The Dev/Ops Specialist is answered (documented + half-built) and designed for its Governor-reviewed build. The role model now has one written source of truth (this DR + the review note) reconciled to the shipped code.
