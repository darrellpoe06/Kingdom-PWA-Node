# DR-0952 — A shared home says so on the shelf, and the separated listings share their pictures

**Date:** 2026-10-11 · **Status:** Accepted · **Declared by:** Darrell
**Code:** `infra/supabase/migrations-auto/0273-a-shared-home-says-so-on-the-shelf.sql`, `app/src/components/PropertiesDoor.jsx`, `app/src/modules/properties/Storefront.jsx`
**Gates:** `infra/supabase/tests/0273-shared-home-smoke.sql`, `app/src/__tests__/a-shared-home-says-so.test.jsx`

## Context

Darrell, 2026-10-11, across several messages:

> "It should be noted this is a co-living situation!!!!!"
> "All utilities paid..."
> "Make sure that these photos in apartment 4 goes to both locations for apt 4
> A and B... so we can advertise without having to re-upload again"
> "Separated listing however it is the same apartment"
> "Eventually we will have all co-living... I believe... Just want to be ready."

That last line is why this is foundational rather than a patch: co-living is
the destination, not an exception.

## What was measured

**The public card was stating something untrue.** His own listing read
**"1-bed multi-family in Champaign, Illinois"** for a door named *805 North
Prospect Avenue Room 1 - Bed A*. `public_vacancies()` composes that label from
`<bedrooms>-bed <property_type> in <city>` (0270) and never reads
`rentable_level`, which **0160 added for exactly this** and which says `'bed'`.
A bedroom count describes the *place*; it does not describe the *offer*.

**Utilities had no column**, so the listing could not state them at all.

**Bed A carries 39 photographs; Bed B carries none** and shows NO PHOTO on the
board. They are two listings of one apartment — the kitchen, the bath and the
room are the same physical places.

## Impact

A stranger reads "1-bed apartment" and books expecting their own place; what
they rented is a bed in an apartment with housemates. **The cost is not a lost
click — it is somebody arriving at a door with their things in a car**, and a
refund and a review. A surface stating a claim the database contradicts is the
same defect as the gallery announcing a door was empty when the read had merely
failed (DR-0946): an invented fact on the one surface where being trusted is
the product.

Photographing the same wall twice, on a Funnel road that has already cost him
two evenings, is the other half.

## Decision

1. **The label says what is being rented.** `'bed'` → "Bed in a shared …";
   `'room'` → "Private room in a shared …"; a whole unit is **unchanged**.
2. **`shared_home` and `rentable_level` are published**, and the card states
   plainly that there are housemates and that kitchen and bath are shared —
   above the price, not buried under it.
3. **`rentals.utilities_included` is nullable with no default.** Three states,
   not two: included, not included, and *not yet said*. A default would make
   every unasked door claim an answer, which is how a listing lies by omission.
4. **A door with no listing pictures borrows from a listing it shares a room
   with** — own first, sibling only as a fallback, same instance, same
   `room_label`, and never for a whole unit. Borrowed rows are flagged
   `from_sibling`. Every wall of 0161 still applies to the borrowed row.
5. **Nothing new about people is exposed.** No street (DR-0935 unchanged), no
   tenant, no housemate's name. These are facts about the offer.

## Verification

Executed on a real PostgreSQL 16, applied twice, with his own Apt 4 shape:
label becomes "Bed in a shared multi-family in Champaign, Illinois";
`shared_home` true; Bed A shows only its own listing shot and **not** its
move-out record; Bed B borrows "the kitchen" flagged `from_sibling`.

The smoke proves seven walls, each a distinct way this could leak: a curated
door never borrows, a record never reaches a stranger (own or borrowed), a
whole unit never borrows, never across instances, never from an **occupied**
sibling, never from an **unlisted** one, and the street is still not published.

Proven to catch: dropping the own-first rule → "Bed A should show its ONE
listing picture, got 3". Restoring the bedroom-count label → "a bed in a
shared home does not say shared". Six card cases green, including that an
unsaid `utilities_included` says **nothing** rather than guessing.

**Not proven from this sandbox:** the live card on his phone after deploy.
**re-review: 2026-10-18.**
