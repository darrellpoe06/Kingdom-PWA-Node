# DR-0399 — Moore Divahs' door data moves to its own instance (the cf re-point)

- **Date:** 2026-09-14
- **Status:** accepted
- **Tier:** B (a bounded, self-asserting data migration on business-door tables + a registry flip; no schema change, no money, no customer-facing surface removed)
- **Type:** business
- **Closes:** MooreDivahs open item #2 (the data re-point `business-registry.js` flagged as "rides a later data increment")
- **Scope:** `infra/supabase/migrations-auto/0219-…sql`, `app/src/lib/business-registry.js`, `app/src/__tests__/moore-repoint.test.js`, `app/src/__tests__/business-registry.test.js`
- **Principles:** REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076), one-business-one-instance (DR-0365), MEASURE-DON'T-ASSUME (DR-0317), PERPETUAL-IMPROVEMENT (DR-0075), DECISION-RECORDS

## Directive

Darrell, 2026-09-14: *"MooreDivahs App get done… 2."* → *"2. Sure."* The re-point the registry itself had flagged as pending.

## The reality traced (DR-0061), on the backend the app actually reads

The Moore door READ its classes and CAPTURED its orders under the **family** instance (`poe-family`) while the business identity is `moore-divahs`. Exactly two consumers, both on the customer door (`MooreDoor.jsx`):
- **class reads** — `publicRpc('moore_public_classes', { p_instance_slug: BIZ.doorDataInstanceSlug })` (`:133`).
- **order capture** — the order form is handed `instanceSlug={BIZ.captureInstanceSlug}` (`:393`) → `captureLead(pipeline, instanceSlug, …)` (`:65`).

Showcase, messages, and the role check already use `instanceSlug` (moore-divahs) — so those were never mis-homed. Only classes and order-capture pointed at the family.

**Measured first (DR-0317), sovereign-read run 34871114927:** `custom_orders` 0, `business_messages` 0, `class_sessions` 1, `class_signups` 6, `showcase_pieces` 12 (already on moore-divahs). The existing class rows carry a null/seed instance (`moore-classes-sync.js` writes `instance_id: tenantId ?? null`), so they are invisible to the customer door both before (reads poe-family) and after (reads moore-divahs) — no regression either way.

## Decision

1. **Migration 0219 re-parents any stranded door-data** — `custom_orders`, `class_sessions`, `class_signups`, `business_messages` — from `poe-family` to `moore-divahs`, and **self-asserts EXHAUSTION** (zero rows may remain under poe-family, or it RAISES and the whole migration rolls back — the DR-0311 floor+exhaustion discipline). It **moves, never deletes** — nothing is lost. These four are business-door tables and Moore is the only registry door (TLC/Poe Properties have their own instances, DR-0351/0365), so every poe-family row in them is Moore's. Idempotent.
2. **The registry names her own instance** — `doorDataInstanceSlug` and `captureInstanceSlug` → `moore-divahs`. New orders now land in her instance; the customer class-read now matches where the steward writes.
3. **Nothing else moves.** The only two consumers are the two seams above; showcase/messages/role were already on moore-divahs.

## Verification (DR-0076)

- **Migration logic proven on the hosted DB (2026-09-14)** in a rolled-back transaction: it resolves both instances (poe-family `bd975d65`, moore-divahs `fbeb6cc1`), runs the four moves + the exhaustion assertion with **no error** (0 rows to move there), then rolled back — nothing persisted.
- **Source-gate** `moore-repoint.test.js` (4): the migration moves all four tables poe-family→moore-divahs, carries **no `DELETE`**, self-asserts exhaustion, and refuses a missing target; the registry reads and captures under moore-divahs, never poe-family. `business-registry.test.js` re-pinned to the new values.
- The real move (if any) lands on the **sovereign** DB via `db-migrate` + the sovereign replay; the assertion makes an incomplete move impossible (it aborts).

## Honest limit (DR-0100 / DR-0104)

- The 7 existing class rows sit on a null/seed instance, so they are unaffected and remain as invisible to the customer door as they are today. If any turn out to be a real published class Shay wants shown, that is a small data-cleanup (re-parent those specific rows to moore-divahs), not a regression from this change. **re-review: 2026-09-28** — confirm on the live steward board that a class Shay publishes now appears on the customer door (the read and the write are finally the same instance).
- Not exercised live from the sandbox; the migration is self-asserting, so a bad move cannot silently land.
