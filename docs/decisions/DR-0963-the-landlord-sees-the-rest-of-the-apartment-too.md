---
id: DR-0963
title: The landlord sees the rest of the apartment too — the borrowing I built worked for everyone except the man who owns the photographs
date: 2026-10-11
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [poetech]
grounds: [REALITY-TRACE, VERIFICATION-DOCTRINE, SPEC-CONFORMANCE-REVIEW, HOLD-THE-HAND]
source: 2026-10-11 — Darrell, two messages with a screenshot of Bed B's Pictures tab
---

## Context

Darrell, 2026-10-11, standing on **805 North Prospect Avenue Room 1 - Bed B**
(address *805 North Prospect Avenue Apt 4, Apt 4, Champaign, Illinois*),
photographing a Pictures tab that read **"no pictures"** and
**"PICTURES (0) — No pictures on this property yet."**

> "Same options as the other co-living tenant... pictures are already
> available for this place apartment 4... remember?"

> "Where are the images... they should be able to be used here too!!!!!!!"

He is right, and the "remember?" is earned: I had built this *that same day*
and shipped only half of it.

## What was measured

| Road | Reader | Borrows a sibling's pictures? |
|---|---|---|
| `public_vacancy_photos(uuid)` — 0273, DR-0952 | a stranger, no account | **Yes** |
| `loadDoorPhotos(rentalId)` — `cloud.js:613` | the landlord, signed in | **No** |

Confirmed by listing every function 0273 defines: `public_vacancies()` and
`public_vacancy_photos(uuid)`. **Both are the stranger's road.** DR-0952's own
decision 4 says *"a door with no listing pictures borrows from a listing it
shares a room with"* — and it is true only of the public card.

`PropertiesApp.jsx:522` loads the gallery with `loadDoorPhotos(rentalId)`: one
door, Bed B, zero rows. So the public could see Apartment 4's kitchen and the
man who photographed it could not.

Two further facts that shaped the fix:

- **No migration is needed.** Two doors are the same apartment when they share
  `instance_id` + `address` + `unit`; both Bed A and Bed B are `805 North
  Prospect Avenue` / `Apt 4`, and the rentals read at `cloud.js:661` already
  selects `address, unit`.
- **`property_photos` is keyed on `rental_ref` (the slug), not `rental_id`** —
  `loadDoorPhotos` proves it. Keying the sibling read on `rental_id` would have
  matched nothing and failed silently.

## Impact

The person doing the work could not reach the work. Every shared room —
kitchen, bath, hall — had to be photographed once per bed, on a Funnel road
that has already cost him two evenings, to populate listings the public side
was *already* filling in for free. The two halves of one feature disagreed
about whether the apartment existed.

Reversible: one new read and one new card. No migration, no policy change, no
row moved.

## Decision

1. **`loadSiblingPhotos(rentalId)`** — same instance, same address, same unit,
   excluding this door; photos read by the siblings' `rental_ref`.
   **Nothing new is published:** every row returns through the reader's own RLS
   on `property_photos`, so a person who may not see the sibling door gets `[]`
   from the database, not from a decision in a JavaScript file. 0273 needed
   SECURITY DEFINER because *its* reader is a stranger with no account; this
   reader is the landlord, who already holds the rows.
2. **A separate "Shared with this apartment" card**, never folded into the
   door's own gallery. Whose these are is a fact the screen keeps saying — Bed
   B's own count stays honestly `(0)`. Folding them in would tell a door it
   owns pictures it does not: DR-0946's invented fact pointing the other way.
3. **The same options, which is what he asked for.** The shared pictures carry
   the same checkmarks and the same `Move to listing` button (DR-0961). The
   move patches the **real row where it lives** — nothing is copied (0154
   freezes `storage_path`, so a copy *is* a re-upload, the waste he has now
   refused twice) and nothing is re-filed onto this door, which would take the
   kitchen away from Bed A. One row serving both doors is the point of a shared
   home, not a limitation of it.
4. **A whole unit never borrows.** No `unit` means this is the place, not a
   door inside it — the same line 0273 draws on the public side, on purpose.
5. **A failed read joins `unreadable`** and says so, rather than collapsing to
   "no shared pictures" (DR-0946).

## Verification

- `app/src/__tests__/the-rest-of-the-apartment.test.jsx` — 9 tests, mounted and
  clicked, built on **his exact Bed B shape**: zero own pictures, three on Bed A.
- **Proven-to-catch, five mutations run against the real component**, each
  reverting one decision, each caught:

  | Mutation | Result |
  |---|---|
  | The shared card never renders (**the state he photographed**) | **6 of 9 fail** |
  | Controls gate on the door's OWN count only (the half-feature: a card with no button able to act on it) | **2 fail** |
  | The move ignores the shared card | **2 fail** |
  | Shared rows folded into the door's own gallery | **5 fail** |
  | The move acts on every photo, hidden kind tabs included | **1 fail** |

  Restored: 9 pass.
- **Not proven from this sandbox:** his live Bed B after deploy, and whether
  Bed A and Bed B actually carry identical `address`/`unit` strings in the live
  rows — if either was typed differently they will not match, and the card will
  be absent rather than wrong. `re-review: 2026-10-13`, to be checked against
  the real rows.

## What the full suite caught that the targeted tests could not

Three failures on the first `ship`, 9 tests across 3 files, every one mine.

**1. An architectural rule I broke, and it is a good rule.**
`properties-door.test.js` fails the build on any `.eq('instance_id', ...)` in
`cloud.js`: this module is mounted by BOTH the PoeTech app and the standalone
Poe Properties door, and a client-side tenancy filter is exactly what would
stop a non-member using the second. My sibling query had one.

The fix is not a weaker rule — the filter was **redundant as a wall** (RLS
already confines the reader) and only ever mattered as a *correctness*
refinement: a person who belongs to two instances that each hold a
"805 North Prospect Avenue / Apt 4" must not have one borrow from the other.
So the query is unscoped and the same-instance test is applied to rows already
returned. The wall is RLS; the filter is arithmetic.

**2. The guard reads comments.** Its own note calls the import check "the
honest, comment-proof form", but the second assertion is a plain source scan,
so my *comment explaining why I must not write that call* tripped it. Reworded
to describe the forbidden call in words. Left as-is rather than tightened:
making a source scan comment-aware is a change to a guard that currently works,
for a false positive that costs one reading. `re-review: 2026-11-11`.

**3. Eight suites mock `cloud.js` and knew nothing of the new export.**
`Promise.all` called `undefined(...)`, the whole door load threw, and the
symptom was six journey tests losing their *room counts* — a failure whose face
looks nothing like its cause. Each mock now stubs `loadSiblingPhotos` empty,
which is the ordinary case those suites are about. 69 green across the eight.

This is the proof ladder doing its job (DR-0347): rungs 1-3 on the new
behaviour were all green while a rung-3 regression sat in eight neighbouring
suites. Targeted tests prove the thing built; only the full suite proves the
thing not broken.

## Links

[DR-0952] (a shared home says so on the shelf — the public half, whose landlord
half this is), [DR-0961] (the Move to listing control these pictures reuse),
[DR-0946] (a read that failed is not a door that is empty), [DR-0955] (a list
of pictures carries no pictures — why this read is metadata only), 0154 (the
trigger that freezes `storage_path`, which is why a copy is a re-upload).
