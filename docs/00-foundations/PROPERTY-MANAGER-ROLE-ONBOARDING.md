# Property Manager (external 1099) — Scoped Role, Onboarding & Proof

**Date:** 2026-07-01
**Type:** DESIGN + MECHANISM (gated build). Layer 3 foundation.
**Status:** PROPOSED — mechanism built, **not applied**. Owner (Christina/Darrell) pulls the trigger (§6 guardrail).
**Grounds:** SOVEREIGN-IDENTITY, RESEARCH-FIRST, TIER-C, NO-DATA-SALE, DECISION-RECORDS. Instance of [ROLES-MEMBERSHIP-MULTITENANCY-ADR](ROLES-MEMBERSHIP-MULTITENANCY-ADR.md) (the general roles/membership layer); pairs with DR-0060 (tenancy guard), DR-0074 (identity=tenancy boundary), DR-0076 (proven-to-catch).
**Artifacts:** [`infra/supabase/proposed/property-manager-scoped-role.sql`](../../infra/supabase/proposed/property-manager-scoped-role.sql) (migration, gated), [`infra/supabase/proposed/property-manager-leak-test.sql`](../../infra/supabase/proposed/property-manager-leak-test.sql) (proof), [`app/src/lib/property-manager-access.js`](../../app/src/lib/property-manager-access.js) (preview module).

> **Concrete need:** onboard Christina's 1099 contract Property Manager ("helps when asked") as a real user who sees **only the units she's assigned to** and **only the management surfaces** — never family finances/Books, other businesses, personal/non-rental properties, or another owner's data. Hard RLS, proven not asserted.

---

## 1. The role model — external, least-privilege, fail-closed

**The Property Manager is an EXTERNAL USER, not an instance member.** This is the load-bearing decision.

- An **instance member** passes the universal RLS predicate `user_in_instance(instance_id)` on **every** table — so a member-role PM would see accounts, transactions, debts, and all properties *unless every sensitive table explicitly blocklists her role.* That is **fail-open**: one table that forgets the blocklist leaks. Rejected.
- An **external user** (the live `external_users` / magic-link pattern already used by renters and 1099 contractors — `schema-v2.9-portal-rls.sql`) is a member of **no** instance. She passes `user_in_instance` **nowhere** → she is **default-DENY on everything**, and sees a row **only** when an explicit, un-revoked assignment opens it. That is **fail-closed by construction** — the safe default is zero, and access is additive.

| | External-user PM (chosen) | Member/`specialist` PM (rejected) |
|---|---|---|
| Default access | **Zero** (not in any instance) | **Everything in the instance** |
| Finances/Books exposure | Impossible (no policy grants it) | Exposed unless every table denies her |
| New sensitive table added later | Safe by default | Leaks until someone remembers to deny |
| Failure mode | Fail-closed | Fail-open |

She authenticates by magic link (`external_invite_tokens`, already built); her session carries the JWT claim `external_user_id`, read by the existing `current_external_user_id()`.

---

## 2. The scoping control — `property_assignments` (Christina operates it)

One table is the entire control surface: **`property_assignments (instance_id, external_user_id, rental_id, scope, assigned_by, revoked_at)`.** One row = "this PM may manage this property." Un-assign = set `revoked_at` (soft, auditable). Christina picks which properties; that is the whole scope.

- **Only an owner/admin of the owning instance may write it** (RLS `WITH CHECK user_role_in_instance(...) IN ('owner','admin')`). The PM can **read her own** active rows (so her app lists her units) and **cannot write** them → self-assignment / privilege escalation is structurally impossible.
- Today `rental_id` = a property (the schema has no `units` table yet; the rentals-mgmt lane is building one). When units land, add an optional `unit_id` and AND it into the one predicate — no policy rewrites.

**The one predicate every management surface AND-checks:** `pm_assigned_to_rental(rental_id)` — true only if an active assignment names the caller's `external_user_id`. Returns **false** when there is no external claim (internal users), so it never widens an internal member's access.

---

## 3. What she sees / what she must not — enforced, not documented

| Surface | Access | How it's enforced |
|---|---|---|
| Her assigned units (address, unit, type, status) | ✅ read | `pm_property_view` — **management columns only**, `WHERE pm_assigned_to_rental(id)` |
| Maintenance/service requests for those units | ✅ read + work | Pattern-D policy `USING (pm_assigned_to_rental(rental_id))` |
| Tenant contact for those units | ✅ read | `pm_renter_view` (name/phone/email + emergency; no notes, no financials) |
| PM↔tenant/owner message threads for those units | ✅ read + post | `interactions` policy scoped to `linked_entity_type='rental' AND pm_assigned_to_rental(...)` |
| Per-unit notes / new thread tables (lane-built) | ✅ (when built) | lane adds `pm_assigned_to_rental(rental_id)` — **handoff, §7** |
| **Owner financials** (purchase price, mortgage, market value, taxes) | ⛔ never | not in any PM view; base `rentals` returns 0 rows for her |
| **Rent amounts / rent_payments / leases** | ⛔ never | **no PM policy** → default-deny |
| **Family finances / Books / accounts / transactions / debts** | ⛔ never | **no PM policy** → default-deny (she's in no instance) |
| **Unassigned properties** (same owner) | ⛔ never | no assignment → predicate false |
| **Other owners' / other businesses' data** | ⛔ never | not her `external_user_id`; not her instance |

The deny column needs no per-table blocklist — it is the **default**. Only the allow column is written.

---

## 4. Proof — the 3-way leak test (proven-to-catch)

[`property-manager-leak-test.sql`](../../infra/supabase/proposed/property-manager-leak-test.sql) seeds two owner instances (A, B), three rentals (assigned `rA1`, unassigned `rA2`, other-owner `rB1`), an owner account balance, maintenance per unit, and a PM assigned to `rA1` only. It then **acts as the PM's real session** (`SET ROLE authenticated` + the `external_user_id` claim) and asserts 12 checks, plus an internal-owner sanity pass, then `ROLLBACK`s:

- **Cross-property:** sees `rA1`, **zero** `rA2` (checks 1–2, 5).
- **Cross-tenant:** sees **zero** of owner B's `rB1` / other-owner maintenance (checks 2, 5).
- **Finances:** **zero** accounts, rent_payments, leases, transactions — the core no-leak bar (checks 7–10); base `rentals` = 0 rows; the PM view carries no financial column (checks 3a/3b).
- **Privilege escalation:** PM self-assigning a unit is **denied**; PM logging maintenance on an unassigned unit is **denied** (checks 11–12).
- **No regression:** owner A still sees her 2 rentals and not owner B's; a non-PM sees 0 PM-view rows (sanity).

**Why it's proven-to-catch, not theater:** the file documents the exact mutations that make it **fail** — swap a PM policy back to `user_in_instance` → check 5 fails (under-grant caught); make the PM an instance member (the fail-open design) → checks 7–10 fail (the leak caught); leak a financial column into the view → check 3b fails.

**Honest status (Verification Doctrine — no fake green):** I did **not** run this against the served cloud this session. A served run requires (a) the migration applied to a DB and (b) a **human-created** magic-link PM session — both Tier-C/owner steps (§6). The test is the runnable proof; **running it is the owner's trigger.** The command is in the file header. I am not reporting this as verified-live; I am reporting the mechanism + the executable proof.

---

## 5. Onboarding workflow — turnkey, with a pre-grant preview

All primitives already exist (`external_users`, `external_invite_tokens`, `interactions`). The flow:

1. **Christina selects properties** to assign, in an owner-only control (Rentals surface).
2. **Preview (before anything is created):** [`property-manager-access.js`](../../app/src/lib/property-manager-access.js) `buildPmAccessPreview(selectedRentals)` returns the exact **WILL SEE** list (those units + the management surfaces) and the explicit **WILL NOT SEE** list (finances, Books, other/unassigned properties, personal data). She sees precisely the blast radius **before** granting.
3. **Grant (owner action):** the app calls `invite_property_manager(email, display_name, rental_ids[])` → creates the `external_users` row + the `property_assignments` + returns the id the app uses to mint the magic-link invite. The RPC **refuses any caller who is not an owner/admin** of the owning instance.
4. **She signs up** via the magic link → session carries `external_user_id` → auto-scoped: her app lists exactly her assigned units and her management queue. Nothing else is reachable.
5. **Change/revoke** anytime: add/remove `property_assignments` rows (soft-revoke). Access changes on the next query — no cached grant.

---

## 6. GUARDRAIL — Claude builds the mechanism; humans pull the trigger

Per `CLAUDE.md` and the explicit instruction: **Claude does not create accounts or grant permissions.** This is enforced, not just promised:

- `invite_property_manager(...)` and every `property_assignments` write **require an authenticated owner/admin session.** An agent has no such session → it **cannot** create the PM or grant a unit at the database tier. The trigger is Christina's/Darrell's by construction.
- The migration is in `infra/supabase/proposed/` (**not** the self-applying `migrations-auto/`), so it does not go live until a human promotes it (`proposed/README.md`).

---

## 7. Coordination — handoff to the two lanes

- **Rentals-mgmt lane (`local_9aedb5b8`, running):** owns the units / per-unit-notes / tenant-PM-thread / service-request tables being built now. **Every such table carrying a `rental_id` must add** `USING (pm_assigned_to_rental(rental_id))` (+ matching insert/update). The exact snippet is in the migration's handoff footer. Sent to that session.
- **Adopter-onboarding/provisioning lane (`local_7d0b6b36`):** the PM is one concrete instance of that general "invite an external participant into a scoped view" capability. `invite_property_manager` follows the same shape as the live `invite_to_church` — the generalized version belongs in that lane.

---

## 8. What needs the owner's GO (flagged)

1. **Promote + apply** `property-manager-scoped-role.sql` to staging; **run the leak test**; it must pass with its mutations failing. (Tier-C.)
2. **Confirm the surface scope:** is tenant *contact* (name/phone) appropriate for this PM, or notes-only? (Default: contact yes, financials never.) Governance call.
3. **Create the real PM account + assign her units** (owner action, §6) and re-run the leak test against prod with her real session before she relies on it.
4. **Lane handoff** applied: the mgmt-surface tables carry the PM predicate before they ship.

Nothing here is applied or granted. The role model, the scoping control, and the executable proof are built and gated.
