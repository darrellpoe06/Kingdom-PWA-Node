# Family Sharing & Permissions — Grounded Status

**Date:** 2026-06-23
**Type:** READ-ONLY verification (no code changed). Layer 4 working artifact.
**Cloud project probed live:** `mjjlevhdufpaplypnqrv` (PoeTech-Family-OS).
**Question:** Does the app support the family multi-user model — together + separate, consent-based bidirectional sharing, family visibility control, project-progress visibility — and is it FAIL-SAFE?

> Every finding below is marked **CONFIRMED / PARTIAL / MISSING** with file:symbol, migration, or live-probe evidence. Where a claim could not be verified this session, it is flagged as such (Verification Doctrine, DR-0076). Nothing here is asserted from assumption.

---

## Verdict in one paragraph

The app has a **real, working single-shared-space family model** and a **proven outer security wall**, but it does **not** yet have the granular, consent-based, bidirectional sharing Darrell described. Today the family is **one shared instance**: all three adult accounts (Darrell, Christina ×2 emails) are full members of the `poe-family` instance and every one of them sees **all** family data — accounts, debts, transactions, projects, the family snapshot. There is **no per-item / per-surface grant** ("Christina lets Darrell see X but not Y"); the only per-member privacy that exists in the cloud is the `discussions.visibility = 'private'` flag (app-level, binary). The **two minors (Christian & Christyn, age 10) have no accounts and no safe path to one** — and if they self-signed-up today they would land in their *own isolated instance*, not the family, with zero guardian controls. **Fail-safe is strong on the dimensions that exist** (anon wall live-verified, per-section + app-wide error boundaries, no-lockout auth, graceful sync degradation) and **untested on the dimensions that don't** (there is no cross-family-member leak risk to test because there is no per-member partition yet).

---

## Architecture grounding (what the model actually is)

**Tenancy = "instance," not "household + members with personal scopes."**

- The boundary object is an **instance** (`instances` table), and membership is `instance_members (instance_id, user_id, role, display_name)`. ([schema-v2.1-infra.sql](../../infra/supabase/schema-v2.1-infra.sql))
- Every data table's RLS gate is the single predicate `user_in_instance(instance_id)`:
  ```sql
  CREATE OR REPLACE FUNCTION public.user_in_instance(tenant_uuid uuid) ...
    SELECT EXISTS (SELECT 1 FROM instance_members
                   WHERE instance_id = tenant_uuid AND user_id = auth.uid())
  ```
  ([schema-v2.1-infra.sql:124](../../infra/supabase/schema-v2.1-infra.sql)) — **binary membership**: you are in the instance (see everything) or out (see nothing). There is no per-row owner gate on the family data tables.
- Roles exist in the vocabulary — `role IN ('owner','admin','member','viewer','specialist')` ([schema-v2.1-infra.sql:225](../../infra/supabase/schema-v2.1-infra.sql)) and `user_role_in_instance()` gates a few admin tables — **but the family does not use differentiated roles**: `join_default_instance()` inserts every family member as `'member'`. The "servant-king tiers" are a *governance doctrine* (GOVERNANCE-EXECUTION-ADVISORY: Darrell governs / Foundation executes / Claude advises), **not** an enforced per-member RBAC inside the family space.
- The family allowlist is hard-coded in the join RPC: `darrellpoe06@gmail.com`, `mrspoe06@gmail.com`, `christina@tlctherapysolutions.com`. Anyone else → **their own isolated instance** `u-<uid>`. ([migrations-auto/0002-join-default-instance-self-serve.sql:75-102](../../infra/supabase/migrations-auto/0002-join-default-instance-self-serve.sql))

**Profiles ("personas") are a display/PIN overlay, not a data scope.** `PROFILES = [darrell, christina, family]` ([poe-financial-mvp-v28.jsx:2001](../../app/src/poe-financial-mvp-v28.jsx)) drives which *name* shows and which persona-PIN is required on a shared device — it does **not** filter which rows load. Confirmed by `isFamilyEmail` gating names only (`'Darrell'` vs sanitized `'Adam'`), and by there being no profile-keyed `WHERE` in the sync layer.

---

## Per-question status

| # | Darrell's question | Status | Evidence |
|---|---|---|---|
| 1 | Each member own account/identity **AND** a shared family space; is there a household grouping? | **PARTIAL** | Own identity: ✅ Supabase Auth per email (email-OTP / Google / Apple), `decideAccess` ([multi-point-auth.js:63](../../app/src/lib/multi-point-auth.js)). Shared space: ✅ the `poe-family` instance, all adults are members ([0002:75-88](../../infra/supabase/migrations-auto/0002-join-default-instance-self-serve.sql)). Grouping: ✅ `instances`/`instance_members`. **But** "separate" within the family does **not** exist — membership is all-or-nothing; and **minors have no accounts** (`// Add the twins' sign-in emails as they get accounts` [poe-financial-mvp-v28.jsx:961](../../app/src/poe-financial-mvp-v28.jsx)). |
| 2 | Consent-based sharing **both directions**, granular per-item/per-surface, bidirectional? | **MISSING** | No `shares` / `grant_access` / ACL / `shared_with` table or RPC exists anywhere in `infra/supabase` (grep of all migrations + schema). RLS is binary `user_in_instance`. The closest thing is **one** binary, one-directional app-level flag: `discussions.visibility` (`private` = author+owner only; else whole family) — `visibleDiscussions` ([discussions.js:77-91](../../app/src/lib/discussions.js)). There is **no** mechanism to grant another *specific* member visibility into a *specific* item, in either direction. |
| 3 | Decide what "the family" sees vs what stays private to one member? Map to the visibility model + role tiers. | **PARTIAL** | What exists: (a) `discussions.visibility='private'` — author + owner only ([discussions.js:77](../../app/src/lib/discussions.js)); (b) **Thinking Space notes are device-local, never synced** — "private to the person, not the instance" ([schema-v2.15-family-snapshot.sql:12-14](../../infra/supabase/schema-v2.15-family-snapshot.sql)); (c) the **wf18 Imported bank/Gmail PII gate** `isImportedAllowed()` requires a *verified family email* on a public host ([poe-financial-mvp-v28.jsx:1001](../../app/src/poe-financial-mvp-v28.jsx)); (d) **Study circle** gated to Darrell+Christina+BG by email predicate ([poe-financial-mvp-v28.jsx:989](../../app/src/poe-financial-mvp-v28.jsx)); (e) **persona PINs** on shared devices ([multi-point-auth.js:193](../../app/src/lib/multi-point-auth.js)). What's MISSING: a *general* "this row is private to me / shared with family" control on the core data (accounts, transactions, projects, debts). The "personal-local" tier today = "don't sync it" (notes), **not** an RLS-enforced private partition. |
| 4 | Can a family member see another's **project progress**? Where? | **CONFIRMED (but automatic, not consent-gated)** | Projects are instance-scoped; every family member sees every project. `projectsSync` writes `instance_id` + `created_by` and reads them all back ([projects-sync.js:23-71](../../app/src/lib/projects-sync.js)). There's an `assignee_personas` column (migration 0005) and `lifecycle`/`conversation_log`/`status` rich fields that surface in the **Projects hub / management cockpit** (see `project_projects_management_discussions`). So visibility is **total and automatic** — there is no way to keep a project private to one member, which is the flip side of the Q2/Q3 gap. |
| 5 | Are the multi-user paths **fail-safe** — no white-screen, RLS family-scoped, no cross-family leak, graceful denial, no dead-ends? | **CONFIRMED for the model that exists** | See the Fail-Safe section below. Outer no-leak wall **live-verified this session**; error boundaries, no-lockout auth, and graceful sync degradation all confirmed in code. The one honest caveat: cross-*instance* isolation between two *authenticated* users is verified by the RLS predicate (code) and a prior service-vs-anon test, **not** re-probed live this session (needs a second account's credentials). |

---

## Fail-safe verification (Question 5, detail)

**Live no-leak probe — run this session against `mjjlevhdufpaplypnqrv` with the public/anon key:**

```
GET /rest/v1/accounts          → 42501 permission denied for table accounts
GET /rest/v1/debts             → 42501 permission denied for table debts
GET /rest/v1/transactions      → 42501 permission denied for table transactions
GET /rest/v1/projects          → 42501 permission denied for table projects
GET /rest/v1/family_snapshots  → 42501 permission denied for table family_snapshots
GET /rest/v1/instance_members  → 42501 permission denied for table instance_members
POST /rest/v1/rpc/join_default_instance → P0001 "join_default_instance: not authenticated"
```

**Result: PASS.** An anonymous / unauthenticated caller gets **zero** family data — the `anon` role has no table grant at all (defense before RLS even runs), and the auto-join RPC refuses an unauthenticated caller. This is the outer wall and it holds in the live cloud right now.

| Fail-safe dimension | Status | Evidence |
|---|---|---|
| No white-screen (per-section) | **CONFIRMED** | `SectionBoundary` degrades one section to an inline "hit a snag / Try again / Reload" card, rest of page works ([SectionBoundary.jsx](../../app/src/components/SectionBoundary.jsx)). |
| No white-screen (app-wide) | **CONFIRMED** | App-wide `ErrorBoundary` in [main.jsx](../../app/src/main.jsx) (full-page recovery card) — defense in depth. Ties to the break-it ship gate (`project_break_it_ship_gate`). |
| Anon → family data leak | **CONFIRMED (live)** | Probe above: 42501 across 6 tables + RPC raise. |
| RLS family-scoped | **CONFIRMED (code)** | Every family table policy is `USING (user_in_instance(instance_id))` ([schema-v2.1-infra.sql:124](../../infra/supabase/schema-v2.1-infra.sql); contractors example [schema-v2.13:81-84](../../infra/supabase/schema-v2.13-family-data-sync.sql); snapshot [schema-v2.15:32-42](../../infra/supabase/schema-v2.15-family-snapshot.sql)). |
| Cross-*instance* isolation (authed user A ↛ instance B) | **PARTIAL — code-verified, not re-probed live** | The predicate makes it structurally impossible (A is not in B's `instance_members`), and a self-serve outsider only ever joins `u-<uid>` ([0002:90-102](../../infra/supabase/migrations-auto/0002-join-default-instance-self-serve.sql)). Prior service-vs-anon test on record (memory `project_auth_identity_tenancy_boundary`). **Not** re-run this session — needs a second authenticated account. |
| Graceful denial (no dead-end) | **CONFIRMED** | Non-family signed-in user gets a **working** isolated instance, never an exception/dead-end (the 0001→0002 fix for "I'm in but not really") ([0002 header](../../infra/supabase/migrations-auto/0002-join-default-instance-self-serve.sql)). Sync layer catches `no-tenant` and degrades to device-local. |
| No-lockout auth | **CONFIRMED** | `decideAccess` degrades to identity-only if the 2nd-factor backend is unreachable; forgotten PIN → re-prove identity ([multi-point-auth.js:91-99](../../app/src/lib/multi-point-auth.js)). Persona-PIN gate allows selection when no PIN set yet ([multi-point-auth.js:200-205](../../app/src/lib/multi-point-auth.js)). |
| Concurrency-safe provisioning | **CONFIRMED** | `pg_advisory_xact_lock` + deterministic slug + `ON CONFLICT` so parallel first-sign-in syncs converge on one instance ([0002:55-101](../../infra/supabase/migrations-auto/0002-join-default-instance-self-serve.sql)). |

---

## Child-safety note — Christian & Christyn (age 10)

**Status: MISSING — this is the highest-risk gap.** There is no minor/guardian model anywhere in auth or data. The only "child" code is age-adaptive *lesson* pacing (`age-adaptive.test.js`), unrelated to accounts.

Concrete risks today:
1. **No safe account path.** The twins' emails are not in the family allowlist. If either self-signed-up with their own email, `join_default_instance()` would put them in a **separate isolated instance** ([0002:90](../../infra/supabase/migrations-auto/0002-join-default-instance-self-serve.sql)) — *not* the family — with no parent visibility and no link back.
2. **All-or-nothing if added naively.** Simply adding their emails to the allowlist (the in-code TODO at [poe-financial-mvp-v28.jsx:961](../../app/src/poe-financial-mvp-v28.jsx)) would make each 10-year-old a **full member who sees all family financials and PII** — because membership is binary. That is the wrong default for a minor.
3. **No COPPA / parental-consent / age-gate** anywhere in the provisioning path.

A minor account must be **guardian-provisioned** (Darrell/Christina create it), land in the family instance with a **restricted role** (`'viewer'` already exists in the role vocab, or a new `'minor'` role), see an **age-appropriate subset**, and never reach the wf18 PII feed (already structurally blocked by `isImportedAllowed`'s family-email check, but should be re-gated on role too).

---

## Gap-closing plan (risk-tiered)

### GAP A — Granular, bidirectional, consent-based sharing (Q2/Q3) — **the big one. Tier C.**
The model needs to move from "binary instance membership" to "instance membership + per-item or per-surface grants."

- **Build:** a `shares` table — `(id, instance_id, resource_kind, resource_id|surface_key, grantor_user_id, grantee_user_id, scope, created_at, revoked_at)`. RLS: a row in a shared resource is visible if `user_in_instance(instance_id)` **AND** (`created_by = auth.uid()` **OR** `owner` **OR** an active `shares` row names the caller). Bidirectional falls out naturally (any member can be grantor or grantee).
- **Add a per-row `owner_user_id` + `visibility` to the core data tables** (accounts, transactions, debts, projects) so "private to me unless shared" is even expressible. Today only `discussions` has this.
- **Surfaces:** a "Sharing" control on each item (and a family-level "Shared with me" view); generalize the proven `discussions.visibility` UX.
- **Migrations:** new `shares` migration + per-table `owner_user_id`/`visibility` columns + rewritten SELECT policies; each must be **proven-to-catch** (DR-0076) — ship a test that a non-grantee genuinely cannot read a private row.
- **Why Tier C:** changes the core data-isolation model and the merge gate is QUALITY-OF-LIFE + no-leak; must soak + family review.

### GAP B — Minor accounts + guardian boundaries (child-safety) — **Tier C.**
- **Build:** guardian-provisioning RPC (a family owner creates a minor's membership with role `'minor'`/`'viewer'`); age field; an age-appropriate surface allowlist; explicit denial of financial/PII surfaces by role (not just by email).
- **Migration:** add `'minor'` to the role check (or reuse `'viewer'`), a `guardian_user_id` + `birthdate`/`age_band` on `instance_members`, and role-gated policies on sensitive tables.
- Pairs with VISION-FAIRNESS / COMMUNITY-FIRST accessibility defaults.

### GAP C — Separate-within-family personal space (Q1/Q3) — **Tier B→C.**
- Decide the default: is a member's own data private-by-default (then shared up via GAP A) or shared-by-default (then hidden via GAP A)? **Recommend private-by-default for personal items, shared-by-default for household items** — needs Darrell's call (governance decision + DR).

### GAP D — Re-probe cross-instance isolation live — **Tier A (verification only).**
- Stand up a second throwaway authenticated account in a `u-<uid>` instance and confirm it reads **zero** `poe-family` rows. Closes the one PARTIAL in the fail-safe table with live evidence. No code change.

---

## What was verified vs. not (honesty ledger, DR-0076)

- **Live-verified this session:** anon → family-data wall (6 tables + RPC), via direct PostgREST probe with the public key.
- **Code-verified (read, not run this session):** the `user_in_instance` RLS predicate, all family-table policies, the join/allowlist logic, error boundaries, no-lockout auth, the absence of any sharing/ACL table.
- **NOT verified this session:** cross-instance isolation between two authenticated users (needs a 2nd account — see GAP D); end-to-end behavior of the persona-PIN gate in the running app.
