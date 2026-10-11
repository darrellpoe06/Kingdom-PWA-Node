# DR-0957 — A tenant waits for the landlord's yes, and the database is what makes them wait

**Date:** 2026-10-11 · **Status:** Accepted (database half; the app half is not built)
**Declared by:** Darrell
**Code:** `infra/supabase/migrations-auto/0275-a-tenant-waits-for-the-landlords-yes.sql`
**Gates:** `infra/supabase/tests/0275-portal-approval-smoke.sql`

## Context

Darrell, 2026-10-11, a fourteen-section directive opening with a claimed leak:

> "After a tenant registers, they should NOT automatically access the tenant
> dashboard or any property information. Instead, they should be redirected to
> a **Waiting for Landlord Approval** screen… These restrictions must be
> enforced through backend authorization and database security, not simply by
> hiding pages or buttons."

And, on the dropdown: *"IMPORTANT: Include occupied rental properties… Existing
tenants must be able to locate and select the property where they currently
live."*

## What was measured

**The claimed leak is not happening, and that mattered enough to check first.**
Executed on a real **PostgreSQL 16.15** with the live chain applied, as a
signed-in stranger holding no membership, no tenancy and no household row:

| table | rows the stranger reads |
|---|---|
| `rental_tenancies` | **0** |
| `rentals` | **0** |
| `property_photos` | **0** |
| `tenancy_notes` | **0** |

And the control in the same harness — Christina, the real tenant on that door —
reads her **1** tenancy. So the test is live and **RLS holds**: no lease, rent,
balance, phone or email is reaching a new registrant.

**What is real is the screen.** `PropertiesApp`'s role resolver ends
`return 'tenant'`, so a person the system knows nothing about is handed the
**tenant face** — a dashboard built for somebody else, empty because RLS
correctly withheld everything, with no explanation and no way forward. It is
the 2026-08-27 defect wearing the other shoe: then a landlord "met an empty
screen built for someone else"; now a stranger does.

An empty screen is not a leak. It is still wrong: it tells a person nothing
true about where they stand.

## Impact

Surfacing the correction rather than building on the stated premise is the
whole point of `feedback-surface-premise-conflicts`. Had I taken "they can see
information that should not be accessible" at face value, the work would have
been an emergency re-plumbing of RLS that already works — and the actual
defect, the screen, would have survived it.

## Decision

1. **Pending is a fact in the database**, not a hidden button.
   `tenant_portal_requests` holds the asking; `my_portal_status()` — parameter-
   less and `SECURITY DEFINER`, so it can only describe its caller — is the one
   answer the app gates on.
2. **The grant that opens a door is unchanged**: `rental_tenancies.tenant_user_id`.
   This migration adds the queue in front of it and `decide_portal_request()`
   as the only thing that writes it.
3. **Approval links, it does not create** — so no duplicate tenant records —
   and `revoke_portal_access()` clears that one column, leaving the lease, the
   rent, the payments and the whole chronology untouched.
4. **The dropdown includes occupied doors** (the people it exists for live in
   them) and returns four columns: id, label, unit, occupied. No tenant name,
   contact, balance or lease.
5. **A match is a hint for the landlord, never a grant** — and the registrant is
   never told whether they matched, because "we found your record" to whoever
   types an address is a way to probe who lives where.
6. **A property manager may review only if the landlord says so**, through
   0075's existing delegated-capability vocabulary (`tenant.approve`).

## Verification

Executed on real PostgreSQL 16.15, applied twice (idempotent). The smoke proves
eight behaviours and eleven walls; `PORTAL APPROVAL SMOKE: PASS`.

**Three defects were found by attacking my own code, not by it failing:**

1. **A NULL-role authorization hole — the serious one.**
   `user_role_in_instance()` returns **NULL** for a non-member, so
   `NOT (NULL IN ('owner','admin'))` is NULL, and **`IF NULL THEN RAISE` does
   not fire**. My permission guard waved a complete stranger straight through.
   What stopped her in the harness was a downstream "that seat is taken" check
   — luck, not a wall; on an empty tenancy seat she would have granted herself
   someone's door. Every plpgsql authorization test in the file is now
   `IF NOT coalesce(…, false)`. An RLS policy is safe from this because SQL
   treats a NULL `USING` clause as false; plpgsql does not.
2. **The match was dead.** `email_norm` and `phone_norm` are `GENERATED`
   columns, and Postgres computes those **after** `BEFORE` triggers run — so
   inside the matching trigger they were still NULL and every comparison was
   false. It found no match for a tenant whose email *and* phone were already
   on her tenancy, and would have shipped as "the landlord never sees a
   possible match", failing nowhere.
3. **The smoke proved nothing on its first run.** A `DO` block runs as the
   session role, and `postgres` **bypasses RLS** — so "a stranger" read 3
   tenancies. It now drops to `authenticated` after seeding.

**A claim in my own migration was false and is corrected in it:** the column
grants are *not* a wall here. `0024-restore-authenticated-grants` sets
`ALTER DEFAULT PRIVILEGES … GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO
authenticated`, so the table was born with table-wide DML before a single
`GRANT` in the file was read. The walls that hold are the RLS policies and the
trigger beneath them, and those were proven by trying to break them.

**Proven to catch**, three breaks:

| break | caught by |
|---|---|
| the NULL-role fallthrough restored | the stranger's approval call — and notably via the *trigger's* message, since the two walls are independent |
| the generated-column match bug restored | "the landlord was shown no possible match … so the hint is dead" |
| the dropdown drops occupied doors | "the dropdown offered 0 doors, expected the one occupied, listed door" |

## What is NOT built

**The app half.** The waiting screen, the role resolver's `pending` state, the
registration form and dropdown, the landlord's review queue, the invitation
surfaces (§7/§8, which should reuse `property_access_invites` from 0150 rather
than add a second mechanism) and the notifications (§10) are all unbuilt. This
record covers the database only, and the branch is not pushed.

**A tradeoff for the Governor, stated rather than decided.** §3 requires
occupied addresses in the dropdown so existing tenants can find their home.
That publishes the portfolio's street addresses and unit numbers to anyone who
can create an account — no people, but the addresses. The invitation path
(§7) is the tighter default and needs no such list. Built as asked; the call is
his. **re-review: 2026-10-18.**
