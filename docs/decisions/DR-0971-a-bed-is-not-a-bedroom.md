---
id: DR-0971
title: A bed is not a bedroom — the shelf infers the level the way the app already does
date: 2026-10-11
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [poetech, poe-properties]
grounds: [REALITY-TRACE, VERIFICATION-DOCTRINE, SURFACE-SAYS-TRUTH, WANT-TO-USE-BAR]
source: 2026-10-11 — Darrell, holding his landlord board beside the public shelf
---

## Context

Darrell, 2026-10-11, with his door list on one screen and the public shelf on
the other:

> "0.5 Bedroom or 1-Bedroom?!!!!!?????!!!!!"

| screen | what it said |
|---|---|
| his board | `805 North Prospect Avenue half 0.5 of Room - Bed A · Apt 4` |
| the public card | **`1-bed multi-family in Champaign, Illinois`**, and no mention of housemates |

**Neither number is right, and that is the answer to his question.** "0.5
bedroom" is a fraction nobody searches for. "1-bed" reads as a one-bedroom
apartment — the misreading that sends somebody to Apt 4 with a car full of
belongings expecting their own place. What is let is a **bed in a shared
room**.

The same screenshot carries the second symptom: **no co-living line on any of
the three cards**, which DR-0952 shipped and this record explains.

## What was measured

0273 already composes the right label and already derives the flag:

```sql
CASE v.rentable_level
  WHEN 'bed'  THEN 'Bed in a shared'
  WHEN 'room' THEN 'Private room in a shared'
  ELSE CASE WHEN v.beds > 0 THEN v.beds || '-bed' END
END
...
(v.rentable_level IN ('room','bed')) AS shared_home
```

Both read `rentals.rentable_level` **raw**, and that column is **NULL on his
doors**. Nothing in the app ever writes it: `rentals-sync.js:114` carries it
through when an item already has one, `cloud.js:823` selects it, and **no
surface sets it**. So the label falls through to counting **bedrooms in the
apartment** (one) and prints `1-bed`, while `shared_home` comes back NULL and
the DR-0952 sentence never renders.

**ONE ROOT, BOTH SYMPTOMS** — including why *"None say co-living!!!"* was
still true after 0273 shipped, which had been reported as fixed. The code was
right; the data never reached it.

**The client solved this in August and the database never learned it.**
`app/src/lib/rentable-levels.js:71` `levelOf()` reads the stored level when
there is one and otherwise **infers from the labels a door already carries**.
Its own comment states the case: *"twelve doors exist today with no level on
them, and two of those are beds."* Inferring is not guessing — a door whose
label says "Bed" is a bed.

DR-0968 had even noted `rentable_level` was "added by 0160 and NEVER READ by
the client". That checked whether it was *read*. **Nobody asked whether it was
written.** It is not.

Third thing in the same screenshot: `1 bed · 1 bath` under the title, from
`Storefront.jsx:77-80`, counting the apartment's rooms. On a bed-level door
that claims a private bedroom and a private bathroom which are neither.

## Impact

This is the stranger-facing surface, so the cost lands on someone who has no
way to check. A card reading "1-bed multi-family" with no mention of
housemates is not vague — it is **affirmatively wrong about what is for
rent**, and the person who believes it finds out on move-in day. DR-0952 was
written to prevent exactly that and was silently inert for the doors that
needed it.

It also costs the landlord: Bed A and Bed B compete against real one-bedroom
apartments at $750, lose on comparison, and the listing underperforms for a
reason nothing on screen explains.

Reversible: one new SQL function, one `CREATE OR REPLACE` of an existing one
with the same return shape, and one line of JavaScript. No table, no column,
no client surface rewritten.

## Decision

1. **`public.rentable_level_of(stored, unit, display_name)`** — the SQL twin
   of `levelOf()`. Stored value wins; otherwise the label speaks; **never
   NULL** (a door with nothing to go on is a unit, the same default the client
   takes).
2. **`public_vacancies()` reads through it** for the label *and* for
   `shared_home`, so a door nobody ever set a level on still tells the truth.
   Same return shape, so this is a REPLACE and not a DROP.
3. **A bed or a room reports NO bedroom or bathroom count** (`NULL`). Those
   counts describe the whole apartment. The card already omits a null count,
   so no client change was needed.
4. **Deliberately conservative word boundaries.** `\mbed\M` does not match
   "bedroom" and `\mroom\M` does not match "Bedroom", mirroring JavaScript
   `\b`, so a genuine three-bedroom listing still counts its bedrooms.
5. **Both sides fold case on the stored value.** See Verification — the parity
   pin caught them disagreeing.
6. **NOT decided:** writing `rentable_level` from the landlord UI. Inference
   is correct and costs nobody any typing; a control to override it is a
   separate, larger question. `re-review: 2026-11-11`.
7. **NOT decided:** fuzzy street matching. Unchanged from DR-0967 and
   deliberately still strict.

## Verification

- **EXECUTED ON A REAL PostgreSQL 16.15**, not predicted — the function was
  created and queried:

  | input | → |
  |---|---|
  | `Apt 4` / `…half 0.5 of Room - Bed A` | **bed** |
  | `Apt 4` / `…half 0.5 of Room - Bed B` | **bed** |
  | `Apt 2` / `805 North Prospect Avenue` | **unit** |
  | `2 Bedroom apartment` | unit (the trap holds) |
  | `Spacious 3 Bedroom` | unit (the trap holds) |
  | stored `unit` + name `Room 1 - Bed A` | unit (stored wins) |
  | all NULL | unit (never NULL) |

- `a-bed-is-not-a-bedroom.test.js` — **18 tests**, every case carrying the
  answer the SQL **actually returned** and asserting `levelOf()` agrees. This
  is the anti-drift pin: two implementations of one rule is how a board and a
  shelf start disagreeing again.
- **THE PIN CAUGHT A REAL DIVERGENCE BEFORE IT SHIPPED.** `levelOf()` was
  case-sensitive on the stored value (`LEVELS.includes('BED')` is false), so a
  stored `'BED'` was not recognised and the door fell through to label
  inference; the SQL folded case. No test pinned the old behaviour and
  `rentals-sync.js` can only ever write the three lowercase values, so the
  divergence was unreachable from the UI and reachable from a hand-written row
  or an import. Both sides now fold case.
- 44 passing across this file and `rentable-levels.test.js`.
- **Not proven from this sandbox:** the live shelf after deploy. 0278 must be
  applied by `db-migrate` on the merge SHA before the card changes, and the
  live check is DR-0104's pass on the real build. `re-review: 2026-10-13`.

## Links

[DR-0952] (the co-living line that was correct and inert — this is why it
never rendered), [DR-0967] (`same_apartment`; the sibling rule that shares
this file), [DR-0968] (`coLivingTag`, which had the sibling fallback this SQL
was missing, and which noted the column was never read without asking whether
it was written), `app/src/lib/rentable-levels.js:71` (`levelOf()`, the August
inference the database now shares), 0160 (`rentable_level`, added and never
written).
