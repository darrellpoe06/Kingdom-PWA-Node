# Rentals per-door paid-vs-due — the build (step a shipped: lease sync)

**Date:** 2026-07-27 · **Directives (Darrell, verbatim):** "Go to the address on rental doors and builds separately for adding 0 and 100% paid based on the amount entered... vs monthly amount of rent due... locations for the amounts paid or particial payment etc..." → "Start the rentals per door build now" → "Start the lease sync build now" → "Get it all done end to end always a standard of PoeTech add to the Ways and documentation" → "Everything tying back into integrated flow of information so scaling is easy and obvious... perpetual sustainability."

## The two Ways this build records (standing, for every build)

1. **END-TO-END IS THE STANDARD.** A PoeTech build is done when the flow runs end to end — data layer to surface to receipts — never when a layer exists in isolation. A schema without its surface (rent_payments since v2.2) is an open item, not a shipped feature. Reviews call that state a GAP (DR-0219), and the build closes it or dates it.
2. **INTEGRATED FLOW OF INFORMATION.** Every new record ties into the one flow so scaling is easy and obvious: door → lease → rent month → payment → (transaction_id) → Books. No parallel stores, no orphan ledgers (the messaging anti-bloat law applied platform-wide). Scaling = adding rows to the same flow, never new plumbing — perpetual sustainability by construction.

## Reality-trace (receipts)

Cloud schema has carried the whole model since v2.2 (`schema-v2.2-rentals.sql`): `rentals` (doors, SYNCED since 2026-06-10), `renters`, `leases` (monthly_rent, NOT NULL start/end/renter), `rent_payments` (expected vs received per lease-MONTH, UNIQUE(lease_id, period_month), status incl. `partial`, method, late fee, `transaction_id` → Books, RLS complete). The app never uploaded a lease: the monolith's own comment — "the lease/tenant/market sub-objects stay device-local (leases + rent_payments sync is the follow-up)". This build IS that follow-up.

## Step (a) — SHIPPED this commit: lease sync

- `app/src/lib/lease-sync.js`: pure `leaseComplete` (only real leases travel — never a fabricated date to satisfy NOT NULL, DR-0076) + `toLeaseRow`; `ensureRenter` find-or-create (no duplicate tenants); `syncLeaseForRental` idempotent active-lease upsert (insert/update/skip with named reasons, never throws); `syncAllLeases` boot sweep; `loadLeasesByRental` — step (b)'s door→{leaseId, monthlyRent} lookup.
- `rentals-sync.js` decorated (upload + initialSync) so lease sync RIDES the door sync — zero lines added to the budget-frozen monolith; fire-and-forget so it can never break door sync.
- 9 proven-to-catch tests (insert / update-not-duplicate / every skip / sweep / lookup) with a scriptable fake client.
- HONEST LIMIT recorded in-code: mid-session lease edits reach the cloud on next boot; instant per-edit sync lands with step (b)'s entry UI (its natural save moment).

## Steps (b) and (c) — next in order (single-PR-sized each, measured pace)

- **(b) Payment entry per door-month:** on each door (address) in Rentals: month picker + "amount paid" entry vs the lease's monthly rent due; partial payments ACCUMULATE into the month's single row (UNIQUE enforces one honest total) with each event appended to the row's lifecycle log — amount, method (cash/check/ach/zelle/venmo/cashapp), WHERE paid, who entered (DR-0090 receipts). Money never moves in-app (DR-0094) — recording only. Delegated managers ride DR-0101 capabilities.
- **(b2) ADD TENANTS TO THE DOORS (Darrell 2026-07-27: "we also need to be able to add tenants to the apts"):** an Add-tenant action on each door/apartment — name + contact in one move → `renters` row (ensureRenter, no duplicates) + door's tenantName + lease linkage; edits update the same row (contact truth in-app, DR-0231 spirit); delegated managers can do it under DR-0101 capabilities.
- **(b3) TENANTS SEE THEIR OWN HISTORY (Darrell 2026-07-27: "allow the tenants to see their payment historical events so they will also have records"):** the renter side of the ledger — a tenant signed in (invited per DR-0101's tenant lanes) reads ONLY their own lease's rent_payments rows + lifecycle receipt log (amount, date, method, where paid) via an RLS policy keyed renter→auth user; their view is the SAME rows the owner sees (one flow, no copy), rendered as a clean statement they can keep — records for both sides of the covenant (Deuteronomy 25:15's honest weights posture). Requires a renters.user_id linkage column + invite lane; RLS design is the careful part (a tenant must never see another door).
- **(c) The 0→100% indicator:** per door per month, `received/expected` derived from real rows only (DR-0061 — never painted), rendered on the door card + a portfolio month strip; ties into Books through the existing `transaction_id` column — the integrated flow, end to end.
