# DR-1177: Another tenant's hallway is not this tenant's door — the pre-ticked suggestion stops offering the whole building

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (what a landlord is offered by default on a privacy control; changes no permission and no schema)
**Type:** fix

**Area:** `app/src/modules/properties/door-cameras.js`, `app/src/__tests__/the-big-picture-can-be-the-porch.test.jsx`.

**Principles:** DR-0841 (a door shares its cameras with its household; the owner decides); DR-0778 (the NAS mints and enforces the grant); DR-0076 (measure, do not recall); DR-0621 (a flag is where the work starts — hold the hand of the process); `feedback_surface_premise_conflicts`.

## Context

**Darrell asked it straight, 2026-10-21, mid-build:**

> *"Tenants only get their door right?"*

The right answer was **yes by mechanism and no by default**, and only a measurement could tell the two apart.

**By mechanism, yes.** A grant names its cameras. The NAS returns only those cameras on `/list` and answers `403 not-your-camera` for any other `/ticket` — `cams_forwarder.py:4061`, proven in the service's own self-test at `:5255-5260` ("a one-camera grant lists only its camera", "...and never for another camera"). Nothing a tenant holds can reach past what they were given.

**By default, no.** `suggestDoorCameras` — the function that **pre-ticks** the landlord's share picker — matched on the door's house number and **never read `doorWords(door).unit`**. So at a multi-unit address every camera carrying the building's number arrived ticked, for every door at it.

## What was measured

Measured by running the real function in the real suite, before any change:

| door | what arrived **pre-ticked** |
|---|---|
| 805 Prospect Ave · **Apt 1** | porch floodlight, **apt 1 hallway**, **apt 2 hallway**, back door |
| 805 Prospect Ave · **Apt 2** | porch floodlight, **apt 1 hallway**, **apt 2 hallway**, back door |

`expect(apt1).toEqual(apt2)` ran **green**, and so did `expect(apt1).toContain('805_apt2_hallway')`. Identical sets, the neighbour's hallway in both.

A camera at another property was correctly excluded (`1313_porch` never appeared), so the address matching worked — the unit was simply never part of it.

**Nothing leaked by itself.** The NAS enforced exactly what each grant named, and the landlord's ticks were always the real gate. What could leak was **a landlord pressing Share without unticking** — and the whole point of pre-ticking is that it is usually right, so it is usually pressed.

## Decision

**A camera marked for a different unit is no longer pre-ticked.** `unitOf()` reads a unit only where it is **marked** — `apt 2`, `unit B`, `#3`, `suite 101` — so the house number in "805 porch floodlight" is never mistaken for a unit, and a common-area camera stays common. `doorUnit()` reads the door's own unit label the same way, falling back to its trailing token so a bare `B` still reads as unit `b`.

**Common cameras are untouched.** The porch, the back door, the lot — anything with no unit marked — are still suggested to every door at the address, because those are what a door's household is normally given, and the porch is the one Darrell has been asking for since 2026-10-09.

**A whole house narrows nothing.** A door with no unit label has no unit to be another unit's, and narrowing it would wrongly drop a camera that happens to carry a unit word.

**This changes what is OFFERED, never what is ALLOWED.** The landlord can still tick anything in the list by hand. The permission rule is the NAS's and is entirely unchanged, and the owner stays the one who decides (DR-0841). Pinned as its own case so a later reader does not mistake this for a permission boundary.

## Impact

**The default is now safe at a multi-unit property**, which is the only kind of property this was built for — 805 Prospect Ave, the address in Darrell's original ask, is apartments.

**The answer to his question is now the same both ways:** a tenant gets their own door, by mechanism *and* by default.

**What this does NOT reach.** The **ask menu** in `CameraAccessDesk` ("Cameras people can ask for at this door", DR-0938) is a separate list, seeded from what was saved rather than from any suggestion, so it is not narrowed by this change and an owner still sets it from the full list by hand. That is a second source of truth for "which cameras does this door involve", and it is named in tonight's process review rather than quietly left. **`re-review: 2026-10-28`** — decide whether the ask menu should seed from `suggestDoorCameras` too, or whether two independent lists are correct.

## Verification

**6 new cases** in `the-big-picture-can-be-the-porch.test.jsx`, and one is **proven to catch by breaking the fix**:

| what was broken | what went red |
| --- | --- |
| `notAnothersUnit(c)` removed from the filter — the old behaviour, exactly | **1** — the Apt 1 / Apt 2 hallway case |

Restored: **23 passed**, and the existing DR-0841 suite stayed green at **14 passed**, so the landlord's tab is unchanged.

The pre-fix measurement is recorded **in the suite as a comment** naming the two assertions that ran green before the change, so the gap is documented rather than asserted away.

`npm run lint` exit **0**, read without a pipe.
