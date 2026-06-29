# Roles, Membership & Multi-Tenancy — Architecture Decision Record

**Date:** 2026-06-23
**Type:** DESIGN / research-first ADR. **No code, no migration in this document.** Layer 3 foundation (architecture).
**Status:** PROPOSED — awaiting Darrell's go before any build (each phase gates on its own isolation tests; see §9).
**Ledger:** to be ratified as **DR-0079** (provisional; re-check `Next ID` against live `origin/main` before merge, per [DR-0052]).
**Author:** Claude Code (research + design pass).
**Grounds (cite-by-ID, PRINCIPLES.md):** SOVEREIGN-IDENTITY, RESEARCH-FIRST, SURFACE-PREMISE, TLC-FIREWALL, COMMUNITY-FIRST, NO-DATA-SALE, DECISION-RECORDS. Pairs with **DR-0060** (tenancy guard), **DR-0059** (self-serve provisioning), **DR-0074** (identity = tenancy boundary), **DR-0076** (verification doctrine / proven-to-catch), **DR-0078** (hybrid-modular shell; role-gating is core/shell item #3), and the Verification Doctrine.

> **The one hard requirement this whole document serves:** **no cross-tenant / cross-family leak.** One therapy office, or one family, can *never* read another's data. Everything below is judged against that bar. This is HIPAA-adjacent clinical data; the model is fail-closed or it does not ship.

---

## 0. TL;DR (the model in one screen)

1. **The tenant already exists and already generalizes.** The boundary object is `instances` (an org/tenant), and `instances.instance_type` already includes `family | church | therapy-practice | business | landlord | trust | …`. Multi-tenant isolation between *organizations* (two therapy offices, a family vs a practice) is **already enforced today** by the single RLS predicate `user_in_instance(instance_id)`. We are **not** inventing multi-tenancy — we are (a) *verifying* it holds under adversarial probe, and (b) adding the *intra-tenant* granularity that does not exist yet.
2. **Three gaps, one shared layer.** Family granular consent, the TLC practice-LMS manager role, and the multi-tenant therapist-LMS product are the **same** missing capability viewed three ways: *intra-tenant, role- and owner-aware visibility on top of binary instance membership.* Build it once.
3. **Two new primitives** carry all three: (a) a **capability layer** on top of roles (`manager` can read members' progress; a `member`/`minor` cannot read peers), and (b) a **per-row owner + visibility + a `shares` ACL table** for granular bidirectional consent.
4. **Minors get a real model** — guardian-provisioned, a `minor` role, an age-appropriate surface allowlist, role-gated denial of financial/PII surfaces, and a COPPA consent record. They never land in an isolated `u-<uid>` instance (today's silent failure).
5. **Nothing ships on the agent's word.** Every phase is gated on **proven-to-catch** isolation tests (DR-0076): a test that *fails* against the un-fixed schema and *passes* only after the fix, plus a live two-identity no-leak probe.

---

## 1. Context — what is actually true today (verified, not assumed)

Grounded in `docs/00-foundations/FAMILY-SHARING-PERMISSIONS-STATUS.md`, `infra/supabase/schema-v2.1-infra.sql`, and the migrations. File:line evidence inline.

### 1.1 The tenancy primitive (already multi-tenant at the org grain)

- **Tenant = instance.** `instances (id, slug, display_name, instance_type, settings, parent_instance_id, legal_structure_notes, …)`. The `instance_type` CHECK already admits the orgs this ADR cares about:
  ```sql
  instance_type IN ('family','church','therapy-practice','contractor','nonprofit',
    'business','landlord','law-practice','mentor','trades','media-org',
    'trust','holding-company')   -- schema-v2.1-infra.sql:204-208
  ```
- **Membership = `instance_members (instance_id, user_id, role, display_name, title, joined_at)`.** No separate `user_instances` join table; this *is* the join. A user can belong to N instances (family + church today; family + practice tomorrow).
- **The universal gate is one predicate:**
  ```sql
  CREATE FUNCTION public.user_in_instance(tenant_uuid uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
    SELECT EXISTS (SELECT 1 FROM instance_members
                   WHERE instance_id = tenant_uuid AND user_id = auth.uid())
  $$;   -- schema-v2.1-infra.sql:124-133
  ```
  Every data table's SELECT policy is `USING (user_in_instance(instance_id))`. **This is the cross-tenant wall, and it is already correct at the org grain:** user A, a member of instance X only, cannot satisfy the predicate for instance Y, so RLS returns zero rows from Y. Two therapy offices = two instances = structurally isolated by exactly this predicate.

### 1.2 Roles exist in vocabulary; they are barely used

- `instance_members.role` CHECK is `('owner','admin','member','viewer','specialist')` (schema-v2.1-infra.sql:224-226).
- `user_role_in_instance(instance)` returns the caller's role; a few admin tables gate writes on `IN ('owner','admin')` (e.g. `instance_subscriptions`, schema-v2.1-infra.sql:331-335).
- `role_scopes (instance_member_id, scope_kind, scope_value, expires_at)` exists for *fine-grained scope modifiers* (`entity|property|module|read-only-flag|time-bounded`) with helper `user_role_in_scope(...)` (schema-v2.1-infra.sql:432-479). **It is built but largely unused by the family.**
- **The family uses none of this differentiation.** `join_default_instance()` inserts every family member as plain `'member'` (schema-v2.1-infra.sql:175-176). All three adult accounts see everything.

### 1.3 What is genuinely MISSING (the work)

| Missing capability | Evidence |
|---|---|
| **Per-row ownership / visibility** on core data (accounts, transactions, debts, projects). | No `owner_user_id` / `visibility` column on those tables; only `discussions.visibility` (binary) exists. |
| **A `shares` / ACL table** for granular, bidirectional, per-item consent. | `grep` of all migrations: no `shares` / `grant_access` / `acl` / `shared_with` table or RPC anywhere. |
| **A capability layer** so a `manager` can read members' progress *without peers seeing each other.* | Roles gate writes in a couple of places; there is no read-other-members capability anywhere. |
| **A minor / guardian model.** | No `guardian_user_id`, no `birthdate`/`age_band`, no `minor` role, no COPPA consent path. A self-signed-up minor lands in an **isolated** `u-<uid>` instance (0002-join-default-instance-self-serve.sql:90), invisible to parents. |
| **A live cross-*authenticated*-identity no-leak probe.** | The anon→family wall is live-verified; the authed A↛B isolation is **code-verified only** (FAMILY-SHARING-PERMISSIONS-STATUS.md, GAP D). |

### 1.4 The guardrails already in place (build on these, don't reinvent)

- **DR-0060 tenancy guard** (`scripts/tenancy-guard.mjs`, runs in the required `app — lint + vitest` check): (A) every table declaring `instance_id` must have RLS enabled; (B) the family allowlist + poe-family grant stay behind the gate. **A new table without RLS fails the build.**
- **Grant-guard** (`scripts/grant-guard.mjs` + `migrations-auto/0024-restore-authenticated-grants.sql`): `ALTER DEFAULT PRIVILEGES … GRANT … TO authenticated` makes future tables inherit DML grants; the guard fails CI if an `instance_id` table ships ungranted. **New tables inherit this — do not hand-grant.**
- **DR-0074:** identity personalization (real names) gates on *verified* `isFamilyEmail`, never on session presence; a signed-in non-family user gets `currentProfile='self'`, never the family picker.

---

## 2. Decision — the membership & roles model (generalized)

### 2.1 Keep the instance as the tenant; widen `instance_type`

No new tenant primitive. An **org/tenant is an `instance`**; a **family**, a **TLC practice**, and **each external therapy office** are each their own instance. The product sells one row in `instances` per office.

- `instance_type` already covers it; **add `'therapy-office'`** (or reuse `'therapy-practice'`) as the canonical type for the multi-tenant LMS product, and a nullable `brand` / `settings.brand` so the TLC Therapy Solutions white-label can theme per office without code.
- `parent_instance_id` already exists — TLC Therapy Solutions (the brand) can be the parent of office instances for *billing/reporting roll-up*, but **roll-up never implies data visibility** (see §5.3: parent membership does NOT grant child-row reads).

### 2.2 Generalize the role ladder (the servant-king ontology, mapped to CRUD)

The theological ontology — **King → Family → Servant-king (Governor / staff) → sheep (member)** (DR-0078 core/shell item #3) — maps to a per-instance role with an explicit **capability set**, not free-form. The King (Yahweh / the owner-principal) sits above the system; inside an instance the ladder is:

| Role | Servant-king mapping | Read own | Read peers' shared | Read **all** members' progress/data | Admin (roles, invites) | Notes |
|---|---|:--:|:--:|:--:|:--:|---|
| `owner` | King's steward over this house | ✅ | ✅ | ✅ | ✅ | One per instance by default (the principal). |
| `admin` | Governor | ✅ | ✅ | ✅ | ✅ | Co-runs the instance. |
| `manager` *(NEW)* | Servant-king over a cohort | ✅ | ✅ | ✅ *(scoped to a capability, see §4)* | ⬚ | **The LMS role** — sees members' *progress*, not their private personal data. |
| `member` | sheep | ✅ | ✅ *(only what's shared to them)* | ⬚ | ⬚ | The default. A therapist; a family adult. |
| `minor` *(NEW)* | sheep under guardianship | ✅ *(age-appropriate subset)* | ⬚ | ⬚ | ⬚ | Guardian-provisioned; financial/PII surfaces denied by role. |
| `viewer` | observer | ✅ *(read-only)* | ⬚ | ⬚ | ⬚ | Existing role; read-only. |
| `specialist` | scoped expert | per `role_scopes` | per `role_scopes` | ⬚ | ⬚ | Existing; entity/property/module-scoped. |

**Binding rule (carried from schema-v2.1 comment):** *titles describe the person; roles describe the database CRUD permission.* `instance_members.title` stays free-text and decorative; **all enforcement rides `role` + capabilities + `role_scopes`,** never `title`.

### 2.3 Capabilities, not role-name string checks scattered across policies

Today policies inline `user_role_in_instance(instance_id) IN ('owner','admin')`. As roles multiply (manager, minor) that pattern rots — every new role means editing every policy. **Decision: introduce a single capability function** so a policy expresses *intent* once:

```sql
-- DESIGN SKETCH (not a migration). Capability = a named permission a role carries.
-- One STABLE SECURITY DEFINER function the whole schema calls; roles->capabilities
-- live in one table so adding a role never re-touches every policy.
CREATE FUNCTION public.member_has_capability(p_instance uuid, p_capability text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1
    FROM instance_members im
    JOIN role_capabilities rc ON rc.role = im.role
    WHERE im.instance_id = p_instance
      AND im.user_id     = auth.uid()
      AND rc.capability  = p_capability
  )
$$;
```

`role_capabilities (role, capability)` is a small seeded lookup (e.g. `('manager','read_member_progress')`, `('owner','manage_roles')`, `('owner','read_member_progress')`). Adding the `manager` role = inserting its capability rows, **not** rewriting policies. This is the generalization that lets one layer serve family + LMS + product.

---

## 3. Granular, bidirectional, consent-based sharing (GAP A design)

This is the family requirement: *"Christina lets Darrell see X but not Y,"* in either direction, per item.

### 3.1 Two columns + one table

**(a) Per-row owner + visibility** on the core data tables (`accounts`, `transactions`, `debts`, `projects`, and any future personal-scoped table). Backfill `owner_user_id` to the instance owner so today's "everyone sees everything" is preserved on day one (no behavior change until a user *chooses* private):

```sql
-- DESIGN SKETCH
ALTER TABLE <core_table>
  ADD COLUMN owner_user_id uuid REFERENCES auth.users(id),   -- who it belongs to
  ADD COLUMN visibility text NOT NULL DEFAULT 'instance'      -- 'instance' | 'private' | 'shared'
    CHECK (visibility IN ('instance','private','shared'));
```

- `instance` = the current behavior: visible to every member (household-shared items).
- `private` = visible only to `owner_user_id`.
- `shared` = visible to the owner **plus** whoever an active `shares` row names.

**(b) The `shares` ACL table** — bidirectional by construction (any member can be `grantor` or `grantee`):

```sql
-- DESIGN SKETCH
CREATE TABLE shares (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  resource_kind text NOT NULL,        -- 'account' | 'project' | 'transaction' | 'lms_progress' | ...
  resource_id   uuid NOT NULL,        -- the specific row being shared
  grantor_user_id uuid NOT NULL REFERENCES auth.users(id),
  grantee_user_id uuid NOT NULL REFERENCES auth.users(id),
  scope         text NOT NULL DEFAULT 'read' CHECK (scope IN ('read','read-write')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  revoked_at    timestamptz,          -- soft revoke; an active share is revoked_at IS NULL
  UNIQUE (instance_id, resource_kind, resource_id, grantee_user_id)
);
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;  -- required (DR-0060 guard); inherits authenticated grant (0024)
```

### 3.2 The rewritten SELECT policy (the exact predicate)

A row on a sharable table is readable iff the caller is in the instance **and** one of: it's an instance-wide item, they own it, or an active share names them.

```sql
-- DESIGN SKETCH — replaces the bare `USING (user_in_instance(instance_id))` on sharable tables
CREATE POLICY <table>_read ON <core_table> FOR SELECT USING (
  user_in_instance(instance_id) AND (
       visibility = 'instance'
    OR owner_user_id = auth.uid()
    OR (visibility = 'shared' AND EXISTS (
          SELECT 1 FROM shares s
          WHERE s.instance_id   = <core_table>.instance_id
            AND s.resource_kind  = '<kind>'
            AND s.resource_id    = <core_table>.id
            AND s.grantee_user_id = auth.uid()
            AND s.revoked_at IS NULL))
  )
);
```

`shares` own policy: a member reads share rows where they are grantor or grantee; a member may INSERT a share only `WITH CHECK (grantor_user_id = auth.uid() AND owner of the resource)`; revoke = UPDATE `revoked_at` by the grantor. **`user_in_instance` stays the outer wall on every branch** — a share can never reach across instances because both the resource and the share carry the same `instance_id` and the predicate still requires membership.

### 3.3 Default posture (needs Darrell's governance call — flagged)

Per FAMILY-SHARING GAP C: recommend **household items shared-by-default (`visibility='instance'`), personal items private-by-default.** Which tables are "personal" (e.g. a personal account vs a household account) is a **Darrell decision** — it is a governance choice, not a technical one. **This ADR does not pick it; it provides the mechanism for either.** (SURFACE-PREMISE: stop and offer, don't assume.)

### 3.4 Proven-to-catch tests for GAP A (write these *first*, watch them fail)

1. **Private-row isolation:** member B inserts a `visibility='private'` account; member A (same instance, role `member`) reads the table → A gets **zero** of B's private rows; B gets their own. *Must fail against the pre-migration schema (today A sees it), pass after.*
2. **Share grants exactly one grantee:** B shares one project with A; C (third member) still cannot read it. Revoke → A can no longer read it.
3. **Cross-instance share is impossible:** craft a `shares` row pointing at instance X's resource with a grantee who is only a member of instance Y → grantee reads **zero** (the `instance_id` + `user_in_instance` branch rejects it). *Adversarial.*
4. **Bidirectional:** the same mechanism works grantor→grantee and grantee-as-grantor; no direction-specific bug.

---

## 4. Manager-sees-members'-progress (the LMS capability) — without peer exposure

This is the TLC practice-LMS Phase 2 requirement and the multi-tenant product's core feature. It is a **capability**, not a share.

### 4.1 Progress rows carry an owner; the capability reads across owners

LMS progress lives in (proposed) `lms_progress (id, instance_id, owner_user_id, course_key, module_key, status, score, completed_at, …)`. Its SELECT policy:

```sql
-- DESIGN SKETCH
CREATE POLICY lms_progress_read ON lms_progress FOR SELECT USING (
  user_in_instance(instance_id) AND (
       owner_user_id = auth.uid()                                   -- a therapist reads their own
    OR member_has_capability(instance_id, 'read_member_progress')   -- a manager/owner reads all
  )
);
```

- A **therapist** (`member`) has only the `owner_user_id = auth.uid()` branch → sees **only their own** progress. **Peers are invisible to each other** — there is no branch that lets one member read another member's progress.
- A **manager** (or `owner`) carries `read_member_progress` → sees **every** member's progress *in that instance only*.
- **Christina-the-manager** is a `manager`/`owner` of the **TLC practice instance**; her therapists are `member`s of that same instance. She sees their training completion; they see only their own and never each other's. Exactly the requirement.

### 4.2 Why this also is the multi-tenant product

For an external office, "manager sees therapists" is the identical policy in *that office's* instance. Office A's manager has the capability **only** for office A (`member_has_capability(p_instance, …)` is evaluated against the membership row in *that* instance). The cross-tenant wall (`user_in_instance`) means office A's manager satisfies the predicate **only** for office A's `instance_id`. **One office can never see another's progress — same predicate, no special case.**

### 4.3 Proven-to-catch tests for §4

1. **Peer-blind:** therapist T1 and T2 in practice P; T1 reads `lms_progress` → sees only T1's rows, **zero** of T2's.
2. **Manager-sees-all-in-tenant:** manager M in P reads → sees T1 + T2; **zero** rows from a *different* practice P2.
3. **Capability is tenant-scoped:** M is `manager` in P but a plain `member` in P2 → M reading P2's progress sees only M's own. *Adversarial — proves the capability doesn't leak across the user's other memberships.*
4. **Role downgrade revokes instantly:** flip M from `manager` to `member` → M now sees only own. (Capability is a live join, not a cached grant.)

---

## 5. Multi-tenant isolation — the zero-cross-tenant-leak guarantee

### 5.1 The guarantee, stated precisely

For any two instances X ≠ Y and any authenticated user U:
> If U ∉ `instance_members(Y)`, then **every** RLS-gated SELECT against a Y-scoped table returns **zero rows** for U, regardless of U's roles, capabilities, or shares elsewhere.

This holds because **every** policy branch in this design is `user_in_instance(instance_id) AND (…)` — the AND is non-negotiable and `user_in_instance` is false for U on Y. There is no branch that omits it. **This is the invariant the gate (DR-0060) and the tests enforce.**

### 5.2 Defense in depth (the layers, outermost first)

1. **Grant layer (pre-RLS):** `anon` has no table grant → unauthenticated callers get `42501` before RLS runs (live-verified today). `authenticated` has DML grant via default privileges (0024) — but RLS still gates rows.
2. **RLS membership wall:** `user_in_instance` — the org boundary.
3. **Intra-tenant visibility:** owner/visibility/shares (§3) and capabilities (§4) — *only ever narrow* what a member sees within their instance; they can never widen across instances.
4. **Build-failing static gate:** `tenancy-guard.mjs` — any `instance_id` table without RLS fails CI (DR-0060). **Extend it** (see §7) to also assert: no sharable table's SELECT policy is missing the `user_in_instance` conjunct.

### 5.3 Parent/child roll-up never implies visibility

`parent_instance_id` (TLC brand → office) is for **billing/reporting metadata only.** There is **no** policy branch that grants a parent member reads of child rows. Cross-office reporting, if ever built, is an **explicit aggregate** computed server-side with no row-level passthrough, opt-in per office, and never PHI (NO-DATA-SALE, DATA-AS-EMPOWERMENT). Flag: any future roll-up feature is its own Tier-C DR.

### 5.4 The live no-leak probe (the test that must pass before the product ships)

Closes FAMILY-SHARING GAP D and is the standing multi-tenant acceptance gate (DR-0076 independent verification — a live test, not a code read):

```
# Two real authenticated identities, two instances. Run against the live cloud.
# A ∈ instance X only.  B ∈ instance Y only.
GET /rest/v1/<table>  as A  → returns ONLY X rows, ZERO Y rows   (repeat per sharable table)
GET /rest/v1/<table>  as B  → returns ONLY Y rows, ZERO X rows
GET /rest/v1/lms_progress as A(manager of X) → ONLY X progress, ZERO Y
POST a forged `shares` row (A grants self a Y resource) → A still reads ZERO Y rows
GET /rest/v1/<table>  as anon → 42501 across all tables (the existing outer wall)
```
**Acceptance = every line passes with real tokens.** This is run once per phase that touches isolation, and wired as a periodic check for the product.

---

## 6. Minor accounts, guardian boundaries & COPPA (GAP B)

The twins (Christian & Christyn, age 10) are the highest-risk gap today: no safe path, and a naive allowlist add makes a 10-year-old a full member who sees all family financials and PII (FAMILY-SHARING §Child-safety).

### 6.1 The model

- **Guardian-provisioned only.** A minor account is **created by a family `owner`/`admin`** via an RPC — never self-serve. This structurally prevents the "isolated `u-<uid>` instance" failure: the minor is inserted directly into the family instance with `role='minor'`.
- **New columns on `instance_members`:** `guardian_user_id uuid REFERENCES auth.users(id)`, `birthdate date` (or `age_band text CHECK (age_band IN ('under-13','13-17','adult'))` to avoid storing an exact DOB — COPPA data-minimization).
- **`role='minor'`** carries an **age-appropriate surface allowlist** and is **denied financial/PII surfaces by role**, not merely by email. The existing wf18 Imported PII gate (`isImportedAllowed`) already blocks on family-email; **add a role check** so a minor family member is *also* denied even though they're on a family email.
- **COPPA consent record:** reuse the `disclaimers_acknowledgments` pattern (schema-v2.1-infra.sql:256) — a `parental-consent-coppa` disclaimer kind, acknowledged by the guardian, logged with hash + timestamp. Consent is auditable and revocable.

### 6.2 Surface gating (role-driven, app + RLS)

- App: the surface registry (DR-0078 core/shell item #1) reads the member's role; `minor` mounts only allowlisted surfaces (Learn, age-appropriate Spiritual content, chores/allowance if built) and **never** Books/Imported/PII/Governor.
- RLS: sensitive tables add `… AND NOT member_is_minor(instance_id)` (a small helper) on the read policy as defense in depth, so even a mis-mounted surface returns zero rows for a minor.

### 6.3 Proven-to-catch tests for §6

1. **Minor cannot read financials:** minor M in the family instance reads `accounts`/`transactions`/`imported` → **zero** rows (role-denied), while an adult member reads them. *Fails today (binary membership would expose all), passes after.*
2. **Guardian boundary:** M's `guardian_user_id` = Darrell; the provisioning RPC refuses to create a `minor` unless caller is `owner`/`admin`. A `member` calling it → denied.
3. **No isolated-instance regression:** a minor's email run through `join_default_instance()` never silently creates a `u-<uid>` (the guardian RPC is the only minor path; self-serve for a known-minor email is refused).
4. **COPPA consent required:** minor surfaces refuse to mount until a `parental-consent-coppa` ack exists for that minor.

---

## 7. The build-failing gates this design adds (DR-0076 — proven-to-catch, not claimed)

New deterministic checks in the required `app — lint + vitest` lane (extend `tenancy-guard.mjs`):

- **G1 — every sharable/scoped table's SELECT policy contains the `user_in_instance(instance_id)` conjunct.** A policy that drops the wall fails the build. *(This is the machine check for the §5.1 invariant.)*
- **G2 — every new `instance_id` table has RLS enabled** (existing DR-0060 check; covers `shares`, `lms_progress`, `role_capabilities` is a lookup — exempt but must have a read-only policy).
- **G3 — capability lookup integrity:** a test asserts `role_capabilities` never grants `read_member_progress` (or any cross-member capability) to `member`/`minor`/`viewer`. A seed mistake fails CI.
- **G4 — the live two-identity no-leak probe (§5.4)** as a scripted acceptance gate per isolation-touching phase.
- **Anti-theater (DR-0076 rule 3):** each gate ships only after it is shown to **catch** the break — commit the failing run first, then the fix.

---

## 8. Mapping back to the three asks (build-once proof)

| The ask | Served by | Tenancy | The new piece it needs |
|---|---|---|---|
| **1. Family granular consent** (GAP A) + **minors** (GAP B) | §3 owner/visibility/`shares` + §6 minor/guardian | the existing `poe-family` instance | owner/visibility cols, `shares`, minor role + COPPA |
| **2. TLC practice LMS manager role** | §4 `manager` + `read_member_progress` capability | a **new** `therapy-practice` instance (Christina owner, therapists members) | the capability layer §2.3 + `lms_progress` |
| **3. Multi-tenant therapist-LMS product** | §4 + §5 — *identical* policies, one instance per office | **one `instance` per office** (already isolated by `user_in_instance`) | office-onboarding RPC + per-tenant no-leak probe |

All three ride the **same two primitives** (capability layer + owner/visibility/shares) on the **same** tenancy wall. That is the "build once, well."

---

## 9. Phased, risk-tiered build plan (each phase gated on its isolation tests)

> **All phases are Tier C** (they change or extend the data-isolation model — TIER-C, RELEASE-TIERS.md): soak + family review + Quality Gatekeeper. **No phase merges until its proven-to-catch tests are green AND the live probe passes.** Each phase = its own branch/worktree (SESSION-ISOLATION) and its own DR.

- **Phase 0 — Verify the wall we already have (Tier A, verification only, NO code).**
  Stand up a second throwaway authenticated account in a `u-<uid>` instance; run the §5.4 live probe; confirm zero `poe-family` rows. Closes GAP D. **This is the only phase that can start without further go** (it changes nothing). Output: a checked-in probe script + evidence.

- **Phase 1 — Family granular consent + minors (the family need first).**
  owner/visibility columns (default `'instance'` = no behavior change) + `shares` + rewritten SELECT policies (§3); minor/guardian + COPPA (§6). Gates: §3.4 + §6.3 tests proven-to-catch; live probe. **Needs Darrell's default-posture call (§3.3) before coding.**

- **Phase 2 — Practice LMS roles (unblocks TLC LMS Phase 2).**
  Capability layer (`role_capabilities`, `member_has_capability`, `manager` role) + `lms_progress` (§2.3, §4). Stand up the TLC `therapy-practice` instance; Christina = owner/manager, therapists = members. Gates: §4.3 tests; live probe shows therapist peer-blindness + manager-sees-all-in-tenant-only. **This is the exact dependency THERAPY-TRAINING-CURRICULUM-PLAN Phase 2 names.**

- **Phase 3 — Multi-tenant product (any therapy office).**
  Office-onboarding RPC (creates an `instance`, seeds the owner, themes via `settings.brand`); per-tenant no-leak probe as a standing acceptance + periodic check; G1–G4 gates enforced. **Highest bar:** carries other practices' HIPAA-adjacent data; no office ships live until the two-tenant probe passes for that pair. COST-DISCIPLINE + COMMUNITY-FIRST apply to pricing.

**Sequencing rationale:** family need is real and present (Phase 1); the LMS capability (Phase 2) is the bridge primitive; the product (Phase 3) is Phase 2 generalized — so the riskiest, widest-blast-radius work lands last, on top of twice-proven isolation.

---

## 10. What needs Darrell's GO before any build (flagged honestly)

1. **GO on the model itself** (this ADR) — ratify as DR-0079.
2. **The default-posture decision (§3.3):** which data is "personal, private-by-default" vs "household, shared-by-default"? *Governance call, not technical.*
3. **Minor data-minimization choice (§6.1):** store `age_band` (recommended, COPPA-minimal) vs `birthdate`.
4. **Role naming:** confirm `manager` + `minor` as the two new role names (vs reusing `viewer` for minors). Recommend distinct `minor` (denial-by-role needs to be unambiguous).
5. **Phase 3 scope/pricing** for the external product — separate Tier-C decision (COST-DISCIPLINE, COMMUNITY-FIRST); out of scope for this ADR beyond the isolation guarantee.

**Nothing in this document is a migration or code.** It is the model + the isolation approach + the tests that will prove no-leak. The first executable step is **Phase 0 (verification only)**; every build phase waits on the go above.

---

## 11. Verification ledger for this ADR (DR-0076 honesty)

- **Code-verified (read this session):** the `user_in_instance` / `user_role_in_instance` / `join_default_instance` definitions (schema-v2.1-infra.sql:124-179); the role CHECK + `role_scopes` + `user_role_in_scope` (schema-v2.1-infra.sql:222-479); the `instance_type` CHECK (schema-v2.1-infra.sql:204-208); the grant pattern (0024); the family allowlist + self-serve isolation (0002).
- **Cited from prior verified artifact:** the live anon→family wall + GAP A–D analysis (FAMILY-SHARING-PERMISSIONS-STATUS.md, 2026-06-23, live-probed); the core/shell role-gating placement (DR-0078 / MODULE-ARCHITECTURE-ADR §4.1); the LMS Phase-2 dependency (THERAPY-TRAINING-CURRICULUM-PLAN.md).
- **NOT verified (by design — it's the work):** the live cross-*authenticated*-identity no-leak probe (Phase 0); every proposed policy/SQL here is a **design sketch**, not run against a database. No claim that any of §2–§7 SQL compiles or is applied — it is intentionally un-built pending Darrell's go.
