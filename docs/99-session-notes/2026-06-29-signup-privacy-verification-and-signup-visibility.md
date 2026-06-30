# Signup privacy verification + signup-visibility surface (2026-06-29)

**Trigger (Darrell):** real people are creating accounts on the live app
(poetech.us) — one showed him the app after signing up — and he has no
visibility into who/why, and needs assurance their signup does NOT expose the
family/business/church private data.

This note records the empirical verification (CONFIRMED / CORRECTED /
COULD-NOT-VERIFY, per the Verification Doctrine, DR-0076) and what shipped.

---

## PART 1 — Privacy verdict: **CONFIRMED ISOLATED**

A brand-new public signup on poetech.us lands in their **own** private instance
and **cannot** see any family / Poe Properties / PoeTech / TLC / COLG data. The
isolation is enforced at the database, not the UI. Evidence (file:line on
`origin/main`):

### Is account creation open to the public? — **CONFIRMED YES**
Email+password sign-up (`signUpWithPassword`,
[app/src/lib/supabase.js](app/src/lib/supabase.js):132), Google/Apple OAuth, and
email Royalty Link are all open. With Supabase "Confirm email" off, sign-up
returns a live session immediately. This is intended (self-serve onboarding).

### Where does a new signup land? — **CONFIRMED: their OWN instance, as owner**
`join_default_instance()` is the gate. Its LIVE definition is the last
redefinition by filename order —
[0012-church-instance-multi-membership.sql](infra/supabase/migrations-auto/0012-church-instance-multi-membership.sql):38
(0019 only re-homes rows; it does not redefine the function):
- **Family allowlist** (`darrellpoe06@`, `mrspoe06@`, `christina@tlctherapysolutions.com`)
  → shared `poe-family` instance, role `member`.
- **Everyone else** → a NEW instance `u-<uid>`, role `owner` (0012:89-96). Their
  data syncs there; they are a member of nothing else.

A stranger is therefore **never** a member of `poe-family`, `colg`, or any other
private instance.

### Do the RLS policies actually enforce it? — **CONFIRMED**
- Membership predicate `user_in_instance(instance_id)` =
  `EXISTS (SELECT 1 FROM instance_members WHERE instance_id = $1 AND user_id = auth.uid())`
  ([schema-v2.1-infra.sql](infra/supabase/schema-v2.1-infra.sql):124).
- Every domain table (entities, accounts, transactions, debts, projects, rentals,
  incidents, …) carries `instance_id` and its SELECT/UPDATE policy is
  `USING (user_in_instance(instance_id))`; INSERT also requires
  `created_by = auth.uid()`; DELETE requires owner
  ([schema-v1.sql](infra/supabase/schema-v1.sql):289-310, applied under the new
  names by v2.1). A fresh `u-*` account matches none of the family/church rows.

### Any real/private data exposed to a fresh account? — **CONFIRMED no leak of private data; one minor global-config gap CORRECTED**
- **Seed data** lives only in `poe-family` / `colg` → invisible to a stranger.
- **Public forms** (`app_interest`, `conference_public_registrations`,
  `venue_bookings`, `crm_capture_lead`) grant anon **INSERT only**; there is **no
  `GRANT SELECT … TO anon` anywhere** and reads are admin-gated. Write-only
  capture, no read-back. ✓
- **`theword_public_sermons()`** is the one deliberate public read — SECURITY
  DEFINER, returns only published COLG sermons, public-safe columns
  ([0029](infra/supabase/migrations-auto/0029-theword-access-scope.sql)). ✓
- **CORRECTED — `workflow_settings`** had `CREATE POLICY … USING (true)`
  ([schema-v2.10](infra/supabase/schema-v2.10-ai-workflow-state.sql):95): a
  global (non-instance-scoped) table any signed-in session — including a fresh
  stranger — could read (AI-workflow enabled flags, dry-run, budget caps, notes).
  **Not** family/business/church private data, and a grep shows **nothing** reads
  it from the browser/infra/scripts/backend (the orchestrator uses the service
  role, which bypasses RLS). Tightened anyway to the poe-family governor circle:
  [0055-harden-workflow-settings-read.sql](infra/supabase/migrations-auto/0055-harden-workflow-settings-read.sql).

**Bottom line for Darrell:** your private data is isolated. A stranger who signs
up gets an empty space of their own and can see none of your family, property,
business, therapy, or church data. The only thing tightened was a global
config table that held no private data and that nothing in the app reads.

---

## ADJACENT CRITICAL FINDING — the migration lane is RED (needs your call)

While verifying, found the `db-migrate` lane is **failing** and has been since
PR #398 merged (22:47Z, 2026-06-29). Latest runs fail at:

```
psql:infra/supabase/migrations-auto/0055-relationship-permissions.sql:139:
ERROR: column "tenancy_id" does not exist
```

**Root cause:** PR #398's `0055-relationship-permissions.sql` defines a NEW
`maintenance_requests` table (columns `tenancy_id`, `created_by_role`, `title`,
`detail`, …) — but a **different** `maintenance_requests` already exists on cloud
from [schema-v2.2-rentals.sql](infra/supabase/schema-v2.2-rentals.sql) (columns
`rental_id`, `renter_id`, `category`, …). `CREATE TABLE IF NOT EXISTS` no-ops
against the pre-existing table, then the index on the non-existent `tenancy_id`
fails. The two tables are the same NAME but different features (tenant-portal vs.
landlord rich-maintenance).

**Impact:**
1. The lane halts on `ON_ERROR_STOP`, so **no migration after that file reaches
   cloud**, and the relationship/child-safety/tenant RLS from #398 is **only
   half-applied** (`rental_tenancies` + the `instance_members` role-check landed;
   the guardian-child + maintenance pieces after line 139 did **not**).
2. This is **additive** — new tables — so it **opens no existing data** and does
   **not** change the Part 1 verdict. But the relationship features won't work on
   cloud, and the lane is blocked for everyone.

**Recommended fix (your decision — not silently rewritten here, per
`feedback-surface-premise-conflicts`):** rename #398's tenant-portal table to
`tenant_maintenance_requests` (cleanest — avoids the name collision entirely),
updating `lib/tenant-portal.js` to match; then the lane goes green and #398's
model applies. Alternatively, reconcile the two tables deliberately. Either is a
rentals-model decision that belongs to you / #398's author.

**Why this didn't block today's work:** the two new migrations below are named to
sort **before** `0055-relationship-permissions.sql` (`admin` / `harden` <
`relationship`), so psql applies them ahead of the halt; they depend only on
`instances` / `instance_members` / `auth.users` (present since schema-v1).

---

## PART 2 — Signup-visibility surface (shipped)

So Darrell can SEE who signed up, across the whole app — answering his "who/why":

- **`admin_signup_metrics()` RPC**
  ([0055-admin-signup-metrics.sql](infra/supabase/migrations-auto/0055-admin-signup-metrics.sql))
  — SECURITY DEFINER, gated FIRST to the **poe-family governor circle**
  (membership in `poe-family`, any role — because the family allowlist joins as
  `member`, an `owner/admin`-only gate would wrongly lock Darrell out; and a
  stranger is structurally never in `poe-family`). Returns real counts +
  newest-500 accounts (email, display name, joined, last sign-in, category:
  self-serve / family / church / unprovisioned) from `auth.users` +
  `instance_members`. No content, no per-instance data.
- **`lib/signup-metrics.js`** — pure shaping (tiles, category labels, email mask,
  returned/active derivation) + an honest-degrade fetch wrapper. 15 unit tests
  ([signup-metrics.test.js](app/src/__tests__/signup-metrics.test.js)).
- **Surface** — a **"Platform signups"** section added to the existing
  **Access** tab ([AccessUsageMetrics.jsx](app/src/components/AccessUsageMetrics.jsx),
  the family/governor-gated surface from PR #393). That surface reads through RLS
  so it was structurally blind to the `u-*` strangers; this section is the
  governor's cross-instance window. **Zero monolith growth** — the monolith is at
  its frozen budget (9424), so the work lives entirely in the separate, already-
  mounted component + libs.

**Verification:** new tests 15/15; full vitest suite green; `npm run build`
green; lint clean; monolith budget guard OK (9424, unchanged). The RPC's real
output cannot be measured from here (no cloud DB credentials) — it is verified by
the post-merge `db-migrate` log showing `=== applying 0055-admin-signup-metrics.sql ===`
succeed, then by opening the Access tab signed in as Darrell on poetech.us.
COULD-NOT-VERIFY-from-here: the live row values (requires the applied function +
a signed-in governor session).
