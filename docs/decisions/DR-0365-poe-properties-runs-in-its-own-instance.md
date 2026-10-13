# DR-0365 — Poe Properties runs in its own instance

**Date:** 2026-09-11 · **Status:** accepted · **Tier:** B · **Area:** platform · **Principles:** VERIFICATION-DOCTRINE, REALITY-TRACE, DATA-AS-EMPOWERMENT, DETERMINISTIC-FIRST, DECISION-RECORDS

## Directive, in Darrell's words (2026-09-11)

> *"yes. Poe Properties gets it's own instance"*

## What was true before (measured live, not read off a schema file)

- All **12 doors** lived in `poe-family`. **No landlord instance existed.**
- Of the **19** property-scoped tables carrying `instance_id`, only two held rows: `rentals` (12) and `property_notes` (4). The other 17 were empty — the same favourable shape the TLC move had (DR-0351).
- 11 doors pointed at the entity `e-poeprops` (Poe Properties LLC); 1 pointed at `e-personal`.

## The three hazards the trace found

### (a) The tier cap is a live landmine

`rentals_tier_enforce` raises when an instance on the **`landlord` tier** holds more than **10 active doors** — and **11 of these are active**. The trigger returns early when `instance_active_tier()` is NULL, and a brand-new instance has no `instance_subscriptions` row, so **the move itself succeeds**. But the day this instance is given an active landlord subscription, *every* write to `rentals` begins failing with "maximum 10 active doors (currently 11)".

This is a pricing decision, not a schema one. 0207 therefore creates **no subscription row**, and the smoke **proves the cap is real** by giving a test instance a landlord subscription and watching the 11th door be refused. *re-review: 2026-10-11 — either the tier's door allowance changes or Poe Properties goes on a tier that fits 12.*

### (b) Cross-instance foreign keys

`rentals.entity_id` referenced `entities` rows belonging to `poe-family`. Moving the doors alone would have left a foreign key pointing **across a tenancy boundary** — exactly what DR-0060 exists to forbid. The landlord instance therefore gets **its own entity rows** (same slugs, its own ids), copied for every entity a door either *names* (`entity_slug`) or *points at* (`entity_id`) — those two sets differ on one row, and copying only one would strand the other. The family's entities are untouched, so the family books keep their rollups.

### (c) A pre-existing inconsistency — carried across, not silently "fixed"

One door carries `entity_slug = 'e-personal'` while its `entity_id` actually points at **Poe Properties LLC**. The slug and the id have disagreed for as long as the row has existed.

**The first draft of this migration would have silently moved that door from Poe Properties LLC to Personal** — a change of legal entity, with tax consequences, performed as a side effect of a tenancy change nobody asked to make it. It NULLed `entity_id` and let `rentals_resolve_entity` re-fill it from the slug, which is the *stated* intent rather than the *actual* attachment.

The shipped version maps each door to the new-instance entity carrying **the same slug as the entity it points at today**. Measured on the real rows: **0 doors changed attachment, 0 changed `entity_slug`**, and the mismatched door still reads `e-personal -> e-poeprops`. Correcting the disagreement is Darrell's call on his own books.

## Decisions

1. **One instance is the landlord.** `poe-properties`, type `landlord` (already allow-listed), idempotent by slug.
2. **Darrell owns it; Christina administers it.** Both of Darrell's sign-ins (0140: the same person) become owner; Christina's become admin, never downgraded from owner. Nobody else is seeded.
3. **The property rows move** — `rentals` plus the 18 other property-scoped tables, named explicitly rather than discovered by pattern, because *a migration that moves rows it was not written for is a migration nobody can review.*
4. **Attachment is preserved to the letter** (hazard (c)).
5. **The resolver answers only from a landlord membership.** `my_properties_instance_role()` mirrors `my_office_instance_role()` (DR-0351 §4). **The shell's `my_default_instance_role()` is untouched** — the family app keeps working for the same people.
6. **DR-0313's rent posting survives untouched**, because its guard keys on membership of the row's *own* instance, not on a hard-coded family id.

## Proof — measured against the live schema, rolled back

The complete migration was run end to end against the real rows inside a rolled-back transaction:

| Check | Result |
|---|---|
| Doors moved / left behind | **12 / 0** |
| `property_notes` moved | **4** |
| Doors whose entity **attachment** changed | **0** |
| Doors whose `entity_slug` changed | **0** |
| The mismatched door, after | `e-personal -> e-poeprops` — **unchanged** |
| Cross-instance entity references | **0** |
| Doors left with no entity | **0** |
| Members seeded | **2 owner, 1 admin** |
| Active tier on the new instance | **NULL** (so the cap does not fire) |
| Rollback verified | instance absent, 12 doors still in `poe-family` |

`0207-poe-properties-instance-smoke.sql` on the `poe-properties` isolation leg, all six assertions run green against the live schema before pushing: the landlord resolves to his instance, a family-only member gets **nothing**, the slug is kept verbatim, the attachment is preserved, there is no cross-instance reference, and **10 active doors are allowed while the 11th is refused**.

**Two defects in the smoke itself were caught before CI**, applying DR-0363's lesson: `instance_subscriptions.created_by` is NOT NULL with no default, and `entities.entity_type` has an allow-list that does not include `llc`.

## What this deliberately did NOT do

- **No app wiring yet.** `my_properties_instance_role()` exists and is proven; the hook and seams that read it (`usePropertiesInstanceRole`, `getPropertiesInstanceId`) are the next slice, mirroring how DR-0351 staged the TLC move. *re-review: 2026-09-18.*
- **No subscription row**, for the reason in (a).
- **No correction of the slug/id disagreement** on the one door — reported, not guessed.
