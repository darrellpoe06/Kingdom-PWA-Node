---
id: DR-0968
title: A co-living door says so — derived from what it already is, never ticked
date: 2026-10-11
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [poetech, poe-properties]
grounds: [REALITY-TRACE, VERIFICATION-DOCTRINE, SURFACE-SAYS-TRUTH, WANT-TO-USE-BAR]
source: 2026-10-11 — Darrell, immediately after DR-0967 settled what counts as one apartment
---

## Context

Darrell, 2026-10-11, one message after settling that the apartment NUMBER
decides what is one apartment (DR-0967):

> "Good... a tag for co-living?!!!"

And one message before that, in the same breath:

> "If it has the same apt number its the same location... **can we make sure
> this happens each time we co-live a place?!!!!!!!!**"

Those two sentences together are the whole decision. He did not ask for a
checkbox. He asked for something that **happens each time** — and a tag that
appears only when somebody remembers to tick it is a worse answer than no tag,
because its silence then reads as "this is not co-living" when it only means
nobody ticked it.

DR-0952 had already put the saying-so on the **public** shelf (the stranger
booking a bed needs to know before they arrive with their things in a car).
This is the **landlord's** side of the same truth: his own door header for Bed
B said `1 bed · multi-family · $500/mo` and never once said the word.

## What was measured

`PropertiesApp.jsx` builds the door header's `facts` array from
`rental.property_type`, the tenancy status, the rent and the money line. There
was no co-living term in it at all.

Both signals needed are facts the database **already holds**, so nothing new is
asked of anybody:

| Signal | Where it lives | State before |
|---|---|---|
| `rentable_level` (`'bed'` / `'room'` / `'unit'`) | added by migration 0160 | **the client never read it** — which is why no screen could say a door is a bed |
| a sibling at the same apartment number | `data.sharedDoors`, already loaded by DR-0963 | present, unused for this |

`rentable_level` being added and never read is the finding under the finding:
0160 recorded the distinction and every surface then went on counting bedrooms.

## Impact

A door header that never says "co-living" is a landlord looking at Bed B and
seeing `1 bed · multi-family · $500/mo` — the same words a whole one-bedroom
apartment would show. The cost is not cosmetic. It is the landlord mis-reading
his own inventory while deciding what to advertise, what to charge, and who to
put where; and it is the same omission DR-0952 found on the public side, where
it reaches a stranger instead of the owner.

The narrower risk this decision removes is the **absent tag that lies**. If the
tag were a checkbox, a blank would mean "nobody ticked it" while reading as
"not a shared home" — so the feature would be most wrong exactly where it was
most needed, on the doors somebody forgot to mark. Deriving it means a blank
tag is a real claim.

Reversible and cheap: one pure function, one entry in an existing `facts`
array, no new column, no new read, no migration. Removing it removes a line of
text. `rentable_level` was already there — unread since 0160 — so nothing is
asked of anybody that the database does not already hold.

## Decision

1. **`coLivingTag(rental, siblings)`** in `model.js` — pure, no React, no I/O.
   Returns one of three strings or `null`.
2. **`rentable_level` is believed first.** `'bed'` → *"Co-living — a bed"*;
   `'room'` → *"Co-living — a private room"*. A bed and a private room are not
   the same offer and the tag must not blur them.
3. **A measured sibling is the fallback.** No level recorded, but the door is
   demonstrably not alone at its apartment number → *"Co-living — shares this
   apartment"*. This is the clause that satisfies "make sure this happens each
   time": a whole unit that later gets split starts saying so the moment its
   second door exists, **with nobody editing anything**.
4. **A whole unit on its own is NOT co-living** and gets no tag. An absent tag
   must keep meaning "not shared", which is only true if the tag is derived.
5. **No checkbox, no new column, no new read.** `data.sharedDoors` is already
   in hand from DR-0963, so this costs one pure call.
6. **It leads the facts line**, before the property type and the rent, for the
   same reason DR-0952 put it above the price: a fact that changes what the
   thing IS belongs before the fact of what it costs.
7. **NOT decided:** a tag on the tenant-facing door view. The public shelf
   already says it (DR-0952) and the tenant in the bed knows. `re-review:
   2026-11-11`.

## Verification

- `a-co-living-door-says-so.test.js` — **11 tests**, across two rungs of the
  DR-0347 ladder rather than one:
  - **Rung 1, the pure model (9):** the bed, the private room, the derived
    sibling case, a whole unit getting nothing, the level winning over the
    count, stored casing (`'BED'`, `'Room'`), no rental at all, and a nonsense
    sibling count.
  - **Rung 2, a source pin (2):** that the door-list read actually *selects*
    `rentable_level`. This is the rung DR-0967 was missing and paid for — a tag
    derived from a column nobody asks the database for is a tag that never
    shows, and no amount of pure testing can see it.
- **Proven-to-catch, measured:** deleting `, rentable_level` from the door-list
  select → **1 failed | 10 passed**. Restored → **11 passed**.
- **THE PIN HAD TO BE FIXED BEFORE IT COULD BE TRUSTED, and that is the finding
  worth keeping.** It originally located the query as
  `src.indexOf("from('rentals')")` and read the next 600 characters. That
  passed when written — and then DR-0967's sibling read added two
  `from('rentals')` calls **above** it in the same file, so on merge the pin
  silently began inspecting a different query and went red while the column it
  guards was untouched. It failed in the safe direction this time; the same
  drift in the other direction is a pin that passes while pointing at the
  wrong query, which is DR-0076 §3 theater with a green tick on it. The pin
  now finds its query by a column only that query selects (`showcase_order`),
  and a second case asserts the locator still resolves to exactly one query —
  so inserting another rentals read can never move it again.
- **Not proven:** the sibling fallback's mutation was not run as a separate
  measurement; only the column deletion above was. Its case reads
  `coLivingTag({ rentable_level: null }, 1)` and asserts `/shares this
  apartment/`, which cannot pass without the fallback, but that is reasoning,
  not a measurement, and is recorded as such.
- **Not proven from this sandbox:** the tag under his thumb on the live door
  header. It ships with the deploy and is checked on the live build per
  DR-0104. `re-review: 2026-10-13`.

## Links

[DR-0967] (what counts as one apartment, and the `sharedDoors` read this tag
reuses), [DR-0963] (`data.sharedDoors`), [DR-0952] (the same truth on the
public shelf, for the stranger rather than the landlord), 0160
(`rentable_level`, recorded and never read until now).
