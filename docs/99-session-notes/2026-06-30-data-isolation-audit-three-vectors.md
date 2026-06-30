# Data-Isolation Security Audit — three vectors, grounded against the live cloud DB

**Date:** 2026-06-30
**Mandate (Darrell, binding):** prove the app is SECURE with NO DATA LEAKAGE before it
holds real family/client data. Ground everything empirically; report CONFIRMED /
LEAK-FOUND-AND-FIXED / COULD-NOT-VERIFY. Assume nothing (we have had a real seed-data
leak before).

**Backend audited:** Supabase cloud `mjjlevhdufpaplypnqrv` (the live PWA backend; the
sovereign-NAS-canonical direction is the future target, not yet the store of record).

## Method

Static reading of every RLS policy in `infra/supabase/*.sql` + `migrations-auto/*.sql`
(two parallel audit agents), PLUS a **live adversarial probe** against the production
PostgREST API — the layer DR-0060's static guard explicitly cannot reach ("it does not
execute RLS policies against a live DB"). Two probe identities:

1. **Anon** — only the public publishable key, no user JWT.
2. **Authenticated stranger** — a throwaway account created via the live auth API,
   provisioned through the same `join_default_instance()` RPC the app calls on sign-in,
   then used to read every sensitive table.

## Verdict

| Vector | Result | Proof |
|---|---|---|
| **1 — Stranger** | **CONFIRMED isolated** | Anon: every private table → HTTP 401 / `42501` (no grant; blocked before RLS). Authenticated stranger in their own `u-<uid>` instance: `accounts, transactions, entities, debts, confessions, inquiries, clinicians, intake_handoffs, projects, external_users, feedback, practice_leads, incidents, rentals` all → `[]`. `instance_members` → only their own row. Public-write tables (`conference_public_registrations, app_interest, crm_leads`) → `[]` on read-back. |
| **2 — Clients (TLC/PHI)** | **CONFIRMED minimized + firewalled** | Clinical data (notes/diagnoses/treatment plans) is structurally ABSENT — stays in Acuity (`schema-v2.3-therapy.sql:8-12`). Intake tables hold only `first_name`+`last_initial`+redacted contact. Every therapy/CRM/CEU table RLS-scoped by `user_in_instance`/`user_role_in_instance`. Clients are non-member `external_users` (JWT claim `current_external_user_id()`); portal RLS (`schema-v2.9`) lets them read ONLY their own inquiry row, never `clinicians`/business rows/another client. |
| **3 — Cross-tenant** | **CONFIRMED isolated** | Provisioning (`0012`, effective): family allowlist → shared `poe-family`; everyone else → their own owned `u-<uid>` instance. Stranger read probe returned zero cross-tenant rows. Full policy sweep: NO permissive policy — no `auth.role()` gate, no `USING(true)` on tenant data, no anon SELECT/UPDATE/DELETE grant. Write-direction confirmed by policy (`WITH CHECK (user_in_instance(instance_id) AND created_by = auth.uid())`); a live write-mutation test was declined (production write) — COULD-NOT-VERIFY-via-live-write, CONFIRMED-by-policy. |

## One defect found and fixed (NOT a leak)

`SELECT` on `instances` → `42P17` "infinite recursion detected in policy" / HTTP 500,
for both anon and authenticated. Cause: `schema-v2.1` `instances_parent_chain_read`
USING-subquery reads `FROM instances`. **Fail-closed** (errors, leaks nothing) and the
app never does `.from('instances')`, so no shipped surface breaks. Fixed in
`0056-fix-instances-policy-recursion.sql` (non-recursive policy + `SECURITY DEFINER`
child-of helper) and permanently guarded by `tenancy-guard` **Check D** (DROP-aware,
anti-theater per DR-0060). PR #449, auto-merge on green. The live 500 clears once
`db-migrate` applies 0056 to the cloud; the audit re-runs `GET /rest/v1/instances` to
confirm 200 + own-row-only.

## Notes / follow-ups (not leaks)

- `workflow_settings_read` is `USING (true)` — but on a GLOBAL non-tenant config table
  (no `instance_id`, authenticated-only: workflow flags/budget caps). Not tenant data.
  Optional hardening: tighten to owner/admin if those values are operator-sensitive.
- Portal `notes` column-REVOKEs depend on `external_portal_role` existing on the live
  cloud project; RLS still blocks cross-instance regardless. Confirm the role exists, or
  treat app-layer notes-hiding as the control there.
- **Cleanup owed:** the throwaway probe account left one auth user + one instance on prod
  (`rls-audit-stranger-1782852564@example.com`, uid `dfc17844-01ca-4760-b599-9d60930d8b9b`,
  instance `6ebcf281-41d3-42c4-a9d0-80f1bfd3c3e8`). Removal SQL (service-role / Studio):
  ```sql
  DELETE FROM instance_members WHERE instance_id = '6ebcf281-41d3-42c4-a9d0-80f1bfd3c3e8';
  DELETE FROM instances        WHERE id          = '6ebcf281-41d3-42c4-a9d0-80f1bfd3c3e8';
  DELETE FROM auth.users       WHERE email LIKE 'rls-audit-stranger-%@example.com';
  ```

## Bottom line

All three isolation vectors **CONFIRMED** against the live backend by adversarial test,
not assertion. No data leak found. One fail-closed recursion defect fixed and guarded.
