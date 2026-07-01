# Configured Role Framework — 1099 workers, tiered conversations, learners, multi-tenant

**Date:** 2026-07-01
**Type:** DESIGN + MECHANISM (gated build). Layer 3 foundation.
**Status:** PROPOSED — mechanism built, **not applied**. Owner (Christina/Darrell) pulls the trigger.
**Grounds:** SOVEREIGN-IDENTITY, RESEARCH-FIRST, TIER-C, NO-DATA-SALE, COMMUNITY-FIRST, DECISION-RECORDS. Generalizes [PROPERTY-MANAGER-ROLE-ONBOARDING](PROPERTY-MANAGER-ROLE-ONBOARDING.md) and instantiates [ROLES-MEMBERSHIP-MULTITENANCY-ADR](ROLES-MEMBERSHIP-MULTITENANCY-ADR.md); pairs with DR-0060/0074/0076.
**Artifacts:** [`infra/supabase/proposed/role-framework-and-threads.sql`](../../infra/supabase/proposed/role-framework-and-threads.sql) (migration, gated, **supersedes** the property-manager file), [`infra/supabase/proposed/role-framework-leak-test.sql`](../../infra/supabase/proposed/role-framework-leak-test.sql) (proof, 6 tiers), [`app/src/lib/property-manager-access.js`](../../app/src/lib/property-manager-access.js) (preview + invitee welcome).

> **One framework, many roles.** Property Manager, Project Manager, contractor, volunteer, learner, and future roles are **configured rows**, not bespoke code. Each role = (a) a **scope** it's assigned to, (b) what it can **SEE** (least-privilege), (c) which **threads** it joins, (d) an **owner above** who sees all in-org. Subscribers configure their own roles inside their own isolated org. Adding a role is configuration; the isolation, tiered visibility, and qualitative pipe are identical across role types.

---

## 1. The primitive (generalizes `property_assignments`)

- **`role_definitions`** — the configurable catalog, **per instance** (so each subscriber org defines its own roles). Columns: `role_key`, `worker_class ('1099-contractor'|'staff'|'volunteer'|'learner')`, `scope_kinds[]`, `capabilities[]`, `read_only`. All the external workers are the **1099-contractor** class; they differ only by `scope_kinds` and which threads they join.
- **`role_assignments`** — subject → `(scope_kind, scope_ref)`. `scope_ref` is **text**, so one table covers a rental (uuid-as-text), a board (`board_slug`), a project, or any future entity. Subject is either an **external** user (1099 worker/customer) or a **member** auth user (a learner/minor). Owner/admin-only write; the subject reads their own; a guardian manages their learners'.
- **`subject_assigned_to(scope_kind, scope_ref)`** — the single predicate every scoped surface AND-checks. Returns false for a plain owner (they read via membership) so it never widens internal access. `pm_assigned_to_rental(rental_id)` is kept as a thin wrapper → the rentals-lane handoff is unbroken.

**Fail-closed, unchanged from the PM design:** a worker/learner passes `user_in_instance()` **nowhere** → default-deny → sees only what an un-revoked assignment or thread-participation opens. The owner's "see everything" is **bounded by their instance** — the tenant boundary *is* the no-leak wall.

---

## 2. Tiered-visibility conversations (`threads` / `thread_participants` / `thread_messages`)

Per-scope threads are real conversations, not just notes. **One function, `can_see_thread(thread_id)`, encodes the three tiers:**

| Tier | Who | Sees | Predicate branch |
|---|---|---|---|
| 1 | **Owner/admin** of the org | **every** thread in-org, and can jump into either side | `user_role_in_instance(...) IN ('owner','admin')` |
| 2 | **Worker** (PM, PjM, ...) | threads for the scopes **assigned to them** | `subject_assigned_to(scope_kind, scope_ref)` |
| 3 | **Tenant / customer** | only threads they **participate in** | `thread_participants` match on their identity |

`threads`, `thread_participants`, and `thread_messages` all gate SELECT on `can_see_thread`. Enforced at the **data layer** (RLS), not UI. Owner sees all + can address either the worker or the tenant directly (Tier 1 covers every thread). A tenant never sees another tenant's thread; a PM never sees a project thread (proven in §5).

**Outbound guardrail (data-layer enforced):** an in-app message between registered users inserts as `delivery_status='sent'` (direct). A message on an **`sms`/`email`** channel may **only** insert as `pending-approval` — the `WITH CHECK` rejects an auto-`sent` outbound. Moving it to `approved`/`declined` is an `UPDATE` allowed only to the owner/admin **or** the assigned worker on that scope. **Non-users are never auto-messaged.**

---

## 3. Learner / next-gen steward (guardian-curated, minor-safe)

A learner is the same framework: `worker_class='learner'`, `read_only=true`, subject = the child's **member** account (**not** a full instance member — fail-closed), `guardian_user_id` set.

- **Guardian curates exactly what's visible** via `assign_learner_scope(child, scope_kind, scope_ref)` — owner/admin only. Default is **nothing**; the guardian opts each scope in.
- **Read through curated views** (`learner_property_view`, `learner_project_view`) that carry **no financial columns and no tenant PII** — "what we manage and plan," with the how-and-why. Teaching overlays are the two-tier self-explaining standard; the management how-to becomes a reusable **course** (Help→lessons→courses flywheel; disciple others, not just the Poe kids).
- **Minor-safety (hard gate):** the twins (age 10) are **guardian-created only — no self-signup, no phone, COPPA-grade.** Their emails are on no self-serve allowlist. A minor holds `role='minor'` for their own age-appropriate surfaces (ADR GAP B) **and** a curated `learner` scope here; neither exposes raw family finances. Christiana (adult) can hold a fuller learner/worker scope. Reuses the family guardian/minor separation.

---

## 4. 1099 profile — work + pay in one place

Every 1099 worker's `external_users` row links to their **`contractors_1099`** record (the link column already exists). `worker_profile_view` joins them so an owner sees, on **one** profile: the worker's active scopes/threads **and** their pay (`ytd_paid`) and year-end 1099 record — not two disconnected places. `invite_worker(...)` creates/links the contractor row on invite (coordinate with the Books/1099s surface + the money loop for the payment UI).

**Qualitative-insight pipe:** `org_qualitative_signal` aggregates thread activity **per org, owner-only** (message counts, service-request threads, last activity per scope) for the feedback→solutions / Quality-Care view — **privacy-safe and in-org**; it never crosses the instance boundary (coordinate with the feedback lane).

---

## 5. Proof — 6 tiers, one run (proven-to-catch)

[`role-framework-leak-test.sql`](../../infra/supabase/proposed/role-framework-leak-test.sql) seeds two orgs, a PM-property, a PM-project, a tenant, a learner child, threads on a property and a project, an owner account, and boards — then asserts (29 checks) as each identity, and `ROLLBACK`s:

- **Owner A:** sees both org-A threads + worker profiles + the qualitative signal; **zero** org-B.
- **PM-property:** her 1 unit + its thread only; **not** the project thread, **not** unassigned units, **zero** accounts/boards/base-rentals.
- **PM-project:** his 1 board + its thread only; **not** the property thread, **zero** property/accounts.
- **Tenant:** only their own thread; **not** the project thread; **zero** rentals/accounts.
- **Learner/minor:** curated unit only, **no financial column**, **zero** accounts, not the full PM view.
- **Outbound:** in-app sends; **sms auto-`sent` is rejected**; sms `pending-approval` allowed.
- **Cross-org:** Owner B sees **zero** org-A threads/assignments/rentals/workers.

Each check's documented mutation makes it fail (a tier bug, a membership leak, a curation leak, an outbound bypass, a cross-org leak).

**Honest status (no fake green):** I did **not** run this against served cloud — it needs the migration applied to a DB and real sessions (Tier-C/owner steps). The file is the runnable proof; running it is the owner's trigger. JS preview helpers are `node --check` clean; SQL is unrun-by-me.

---

## 6. The nephew — 1099 Project Manager onboarding (concrete)

1. **Owner preview + control (before granting):** `buildWorkerAccessPreview('project-manager', selectedBoards)` renders exactly what he'll see (assigned projects/boards + their threads) and the hard deny list (finances, other scope, other org). Default closed; widen/narrow/**revoke** anytime by editing `role_assignments`.
2. **Grant (owner action):** `invite_worker(email, name, 'project-manager', 'project', [board_slugs], link_1099=true)` — **owner/admin only**; creates his external user + assignments + links his 1099/payment record; returns the id for the magic-link invite. An agent cannot call it (no owner session).
3. **He creates his own account** via the magic link → **invitee welcome** (`buildInviteeWelcome`) plainly states, two-tier, what he can see + do (his assigned projects, their threads, updating his items) — a scoped workspace, not a blank app.
4. **After:** owner sees all his activity (Tier 1) and can address him or stakeholders directly; his profile links to his 1099s/pay.

**Leak test for his role variant is covered** by the PM-project tier in §5: sees only assigned projects, blocked from finances/personal/other-scope/other-org.

---

## 7. What needs the owner's GO / lane handoffs

**GO (nothing applied/granted):** promote + apply `role-framework-and-threads.sql` to **staging**; run the leak test (must pass, mutations must fail); create real accounts + grant scopes (owner action); re-run against prod with real sessions.

**Handoffs sent:** rentals-mgmt `local_9aedb5b8` (thread the tenant↔PM conversation via `threads`, scope_ref=rental_id::text); projects/boards `local_99389e0e` (Project-Manager scope = `scope_kind='project'`, scope_ref=`board_slug`); adopter-onboarding `local_7d0b6b36` (`invite_worker` is the general path; subscribers configure their own `role_definitions`); feedback `local_79771246` (read `org_qualitative_signal` — in-org, privacy-safe).
