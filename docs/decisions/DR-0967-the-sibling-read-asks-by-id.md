---
id: DR-0967
title: The sibling read asks by the door's id, and the apartment NUMBER decides what is one apartment
date: 2026-10-11
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, REALITY-TRACE, GATE-THE-CLASS]
source: 2026-10-11 — Darrell, on Bed B still showing nothing after DR-0963 deployed
---

## Context

Darrell, 2026-10-11, after DR-0963 shipped and deployed:

> "Images for apartment 4... B?!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"

> "We need to be able to see the images in Apt 4... B... so we can
> advertise!!!!!!!!!!!"

His screen: **805 North Prospect Avenue half 0.5 of Room - Bed B**, `PICTURES
(0)`, and **no "Shared with this apartment" card at all.**

## What was measured

Deploy run 1619 on `0f6c7594` **succeeded** at 08:48, so the code was live. The
card renders only when `sharedPhotos.length > 0`, so the read was returning
nothing.

`loadSiblingPhotos` filtered `property_photos` with
`.in('rental_ref', refs)` where `refs` were **slugs**. The column holds the
rental's **UUID**. Two pieces of evidence in this repository, neither of them
inference:

- `.github/workflows/apt2-photos-probe.yml` joins `r.id = p.rental_ref`.
- `PropertiesApp.jsx:522` calls `loadDoorPhotos(rentalId)` — into a parameter
  merely *named* `rentalRef`.

So the filter matched **zero rows, every time, silently.**

**And the comment I shipped beside it asserted the opposite,** which is the
part worth recording:

> *"Keyed on `rental_ref` (the slug) ... Keying it on `rental_id` would have
> matched nothing and failed silently, which is the quietest kind of wrong."*

I read a parameter NAME, promoted it to a fact about a COLUMN, and then wrote
a confident sentence congratulating myself for avoiding the exact bug I was in
the act of writing. A reviewer reading that comment would have been reassured
by it. That is worse than no comment.

## Impact

The whole of DR-0963 was dead on arrival: the landlord still could not reach
the apartment's own photographs, which is the thing he had by then asked for
three times. The feature looked shipped, tested and deployed, and did nothing.

Reversible: one expression.

## Decision

1. **`refs` are door ids**, matching what `loadDoorPhotos` has always passed.
2. **The comment is rewritten to state the fact and to name the error**, rather
   than quietly becoming correct. A comment that was confidently wrong once has
   to say so, or the next reader trusts the next one just as much.
3. **The class gets a gate.** `the-sibling-read-asks-by-id.test.js` drives both
   reads against a stub client that RECORDS what the `rental_ref` filter was
   actually handed, and asserts the two reads agree. A name cannot satisfy it;
   only the value can.

## Verification

- `the-sibling-read-asks-by-id.test.js` — 6 tests. **Proven-to-catch:**
  reverting `r.id` to `r.slug` — the exact state on his phone — **fails 2 of
  6**, one of them asserting no slug reaches the filter at all. 15 green across
  this and `the-rest-of-the-apartment`.
- **Why the original 9 tests passed anyway, which is the real lesson:** they
  fed `sharedPhotos` into the component as a prop. They proved the *card*
  renders, and could not see that the *read* returns nothing — a rung-3 test
  with no rung-1 twin on the query itself (DR-0347). The new file is that twin.
## The second half, settled by Darrell mid-fix

While this was being written he named the rule himself:

> "If it has the same apt number its the same location... can we make sure
> this happens each time we co-live a place?!!!!!!!!"

That is a better rule than the one I had coded, and his own doors break mine:
Bed B carries `805 North Prospect Avenue Apt 4` / `Apt 4` while Apt 2 carries
`805 North Prospect Avenue` / `Apt 2`. **The unit got typed into the address on
one door and not another** — which is what anybody does entering a co-living
building by hand — and exact string equality then says two beds in one
apartment are two different buildings.

So `sameApartment(a, b)` compares the street with the unit **folded out of it**
and the unit by its **number**: `Apt 4`, `apt. 4`, `#4`, `Unit 4` and `4` are
one apartment, because to the person standing in it they are. "Each time we
co-live a place" is answered by this living in `cloud.js` as the one rule every
door uses, rather than in a per-door setting somebody has to remember.

**Deliberately NOT a fuzzy address match.** `805 N Prospect Ave` and `805 North
Prospect Avenue` still read as different streets, and there is a test asserting
that. Guessing two addresses are "probably" the same is how one family's
pictures end up advertising another family's door — the unit is normalised, the
street is only cleaned. `re-review: 2026-11-11` on whether street abbreviation
is worth handling.

- `sameApartment` — 7 further tests, including **his exact two rows**, every
  spelling of a unit, `3A` ≠ `3B`, a whole place with no unit matching nobody,
  and the dangerous direction: the same unit number at a *different* street
  must never match.
- **Not proven from this sandbox:** his live Bed B after this deploys.
  `re-review: 2026-10-12`.

## Links

[DR-0963] (the feature this makes actually work), [DR-0347] (the proof ladder:
rungs 1-3 green while the query was dead), `apt2-photos-probe.yml` (the join
that settled the column's meaning).
