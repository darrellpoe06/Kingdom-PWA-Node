---
id: DR-0313
title: The Poe Properties App is a second DOOR on one library — and the invite→claim seam is what finally gives it users
status: accepted
date: 2026-08-26
tier: C
declared_by: Darrell (2026-08-26, across one working session)
builds_on: [DR-0101 (delegated property management), DR-0055/0062/0075 (the tenant + delegation spine), DR-0133 (the church's own door), DR-0258/DR-0261 (disjoint install scopes), DR-0311 (one person, two doors, one library), DR-0094 (money never moves in-app), DR-0060 (isolation is a gate), DR-0076 (verification doctrine), DR-0124 (property records read chronological)]
principles: [APP-IS-PRIMARY, VERIFICATION-DOCTRINE, REALITY-TRACE, SECURITY-IS-PRIORITY, DATA-AS-EMPOWERMENT, MACHINERY-OVER-MEMORY, PERPETUAL-IMPROVEMENT]
---

## Directive

Darrell, 2026-08-26, in sequence:

> "We need a separate Poe Properties App... take the workflows from PoeTech that makes sense... so our tenants and 1099 workers can use the Poe Properties App for historical events and work orders and texting management... timeline until I'm using and sending to the users?"

> "we should have at least 90% of these workflows already built into the PoeTech App.... keep that as another Module/s so we can use the PoeTech App or the Poe Properties App for management... either way for my family however... management will need the Poe Properties App..."

> "1099 workers and tenants and their families will use the Poe Properties App..."

> "All of the money aspects of the Poe Properties App will work like PoeTech App however the money will populate the PoeTech App books because it's money from our tenants... they should be able to see their payment history and their notes if they create one... management should be able to see all notes included in the view for historical understanding of the relationship between Poe Properties and the tenants and also 1099 workers who support..."

> "Poe Properties App will be the App for tenants and landlords etc... landlords that want businesses systems will need PoeTech maybe maybe not... opportunities and constraints..."

> "Both Apps should be able to work together or separate... keeping both with latest Synced data..."

## The SHOULD / ARE (DR-0219), measured

**SHOULD:** a tenant, their family, and a 1099 worker open an app with the Poe Properties name on it, report and follow work, read the whole history, and talk to management on one timestamped record — while the family runs the same workflows from PoeTech, and rent lands in the family's books.

**ARE (measured 2026-08-26 against the live database and the repo):** the workflows were ~90% built, exactly as Darrell said. The landlord side runs (`Rentals.jsx`, `UnitManagement.jsx`, `tenant-portal.js`, `dispatch.js`); the tenant tables, the scoped-delegation grid, the handyman channel, the frictionless documentation table and the balance audit are all LIVE (0055 / 0062 / 0075 — all four 0075 tables confirmed present in production). And **every one of them is empty**, because of one missing seam: `user_is_tenant()` keys on `rental_tenancies.tenant_user_id = auth.uid()`, `user_delegated_can()` on `delegated_capabilities.grantee_user_id = auth.uid()`, and `grantee_user_id` is NOT NULL — so a landlord who knows a person's *email* could not grant them anything, and nothing in the app ever created a tenancy row. The keystone gap DR-0101 named in July was still open, which is why the operator system has never had a single user.

**GAP → CLOSE:** build the seam, mount one module in two doors, and gate all of it.

## Decision

1. **One module, two doors — never a fork.** `app/src/modules/properties/` is the whole property-management engine (model · config · RLS-scoped I/O · UI). The PoeTech shell mounts it at `?view=properties`; the Poe Properties App mounts it at `/properties/app/`. Same rows, same RLS, no second store — so "both apps with the latest synced data" is *structural*, not a sync job that can fall behind. A gate fails the build if either face stops mounting the same module.

2. **The Poe Properties App is its own installable face** — `id`/`scope` `/properties/`, its own manifest, its own icon, its own served page whose static markup links that manifest, and a **lean boot that never imports the monolith**: a tenant downloads a property-management app, not the family platform. The all-faces disjoint-scope gate is now DERIVED from `public/` instead of a hand-kept list of four, so face #6 is covered the moment its manifest exists (DR-0250).

3. **The invite → claim seam is the keystone** (migration 0150). A landlord writes an invitation *by email*; it holds no access. The invited person is recognized only when they sign in to that same verified address, and `claim_property_access()` — never the invite row — writes the grant. **The role ceiling lives in the function**, so a tampered invite widens nothing; the proof is a field-worker invite that asks for `rent.adjust` and comes back without it.

4. **The tenant's family gets their own login on the same door.** `tenancy_household` + `user_is_tenancy_household()` add ONE additive arm to the work-order, thread, notice, documentation, and rent-**read** policies. Rent **writes** stay with the lease signer and the landlord. No existing policy arm was loosened; each was re-created from its live definition with one arm appended.

5. **The relationship record is shared and append-only.** `tenancy_notes` carries a note from anyone on the door — tenant, family member, 1099 worker, manager, landlord — and the module merges work orders, messages, notes, job documentation, payments, and notices into ONE chronological history. Real timestamps only: an undated row reads *undated* and sorts last, never given an invented date (DR-0076/DR-0124).

6. **Money records, it never moves — and it lands in the books.** `money_moved_in_app` stays false (DR-0094). A **confirmed** rent record posts **once** into the PoeTech books as rental income, keyed by `rent_records.posted_tx_id` so a double tap cannot double-count. Posting is instance-side only, enforced by a **trigger** rather than a comment: a delegated manager may correct a balance and can never touch the posting columns.

7. **Texting is the phone's own messaging app.** Dispatch and tenant contact ride `sms:` / `tel:` links with the job prefilled; the durable record is the in-app append-only thread. This ships today with no vendor, no spend, and no A2P 10DLC registration — and the app never sends anything on its own: a human presses send.

8. **Nothing turns on until isolation is proven.** `infra/supabase/tests/0150-poe-properties-isolation-smoke.sql` runs as the `poe-properties` leg of the `rls-isolation` matrix against the real database and asserts, among others: an invite grants nothing before it is claimed; a stranger's claim grants nothing; a tenant sees one door; the family shares that door but is refused the rent write; the field-worker ceiling drops the extra capability; a manager is refused the books; an invite is single-use; and nothing crosses to another landlord.

9. **Landlords beyond Poe Properties are Tier C.** The engine is landlord-agnostic (a second landlord is a config object plus their own instance), and property management sells on its own with PoeTech as the upgrade for books, taxes, entities and forecasting. A new external-facing product face is the Governor's gate, not the agent's — phase P7, `re-review: 2026-10-21`.

## Opportunities and constraints

Recorded in `modules/properties/config.js` so they render in-app and carry dates the watcher can sweep: five opportunities (no-vendor texting; the self-building relationship record; rent into the books; the app for other landlords; one record for work and the 1099) and six constraints (no tenancies yet; access needs a verified email on both sides; money never moves; screening is legally regulated — DR-0101 §7's fair-housing/FCRA guardrail holds; two installed apps need disjoint scopes; the older lease-spine rent portal still needs a dashboard auth hook only Darrell can flip).

## The honest remaining gap

`rental_tenancies` is empty. Every door in the app is real; not one has a tenant record. The agent cannot invent tenant names, emails, or lease terms (DR-0076) — so the first step that is not the agent's is the landlord entering the real tenancies, from the Doors tab, once. Everything downstream of that is built, gated, and waiting.
