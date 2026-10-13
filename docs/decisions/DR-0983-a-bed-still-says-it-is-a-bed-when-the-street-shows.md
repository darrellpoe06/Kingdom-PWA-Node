---
id: DR-0983
title: A bed still says it is a bed when the street shows — 0280 moved 0278's answer into a branch almost nothing takes
date: 2026-10-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0971, DR-0977]
tier: B
entities: [poe-properties]
grounds: [VERIFICATION-DOCTRINE, SURFACE-SAYS-TRUTH, HOLD-THE-HAND-OF-THE-PROCESS, EXCELLENCE-STANDARD]
source: 2026-10-13 — the third failure to surface as the poe-properties leg unmasked, after 0263 (DR-0976) and 0269 (DR-0982)
---

## Context

DR-0982 closed with a sentence that named this before it happened: *"Not
verified: whether any other smoke in that leg carries a stale expectation
behind this one. 0269 was simply the next to fail."* The leg ran past 0269 and
stopped at the next thing — and this time **the smoke was right and the product
was wrong.**

0278 exists because of one sentence Darrell typed on 2026-10-11, looking at his
own door on the public shelf:

> *"0.5 Bedroom or 1-Bedroom?!!!!!?????!!!!!"*

0278's own header measured what that card was reading from, character for
character: **"805 North Prospect Avenue half 0.5 of Room - Bed A · Apt 4"**. Its
answer, stated plainly in that file:

> *"What is being rented is a BED IN A SHARED ROOM, and that is what the card
> must say."*

So 0278 composed the label from the level — "Bed in a shared multi-family in
Champaign, Illinois" — and **inferred** the level when `rentable_level` was
NULL, which it was on every one of his doors.

**0280 then put that arm behind a branch almost nothing takes.** It added the
street to the same shelf, and with it this label:

```sql
CASE WHEN v.shown
     THEN coalesce(nullif(v.display_name, ''), nullif(v.city, ''), 'Available unit')
     ELSE <0278's level-composed descriptor>
END AS label
```

`v.shown` is `rental_address_is_public(address_visibility)`. 0280 set that
column's DEFAULT to `'public'` **and** one-time UPDATEd every existing row to
`'public'` — that is its whole point, "the address shows unless the family holds
it". So `shown` is true on effectively every live door, the `ELSE` arm is the
exception rather than the rule, and a bed's headline became whatever the
landlord typed as the door's name. On his door, that is the exact string 0278
was written to replace.

## What was measured

| | |
|---|---|
| the failure | `0273-shared-home-smoke.sql` — *"a bed in a shared home does not say shared: Room 1 - Bed A"* |
| where | the **live hosted database**, `rls-isolation` run 38329136075, leg `poe-properties`, 2026-10-13T00:52:28Z |
| the same run's other legs | **22 of 23 green** — this is the only one |
| 0269's smoke in the same run | `BOOKING CALENDAR SMOKE: PASS` (line 225) — DR-0982's fix proven on the live database |
| `address_visibility` default | `'public'`, and 0280 UPDATEd **every existing row** to `'public'` |
| the smoke's seed | sets `rentable_level 'bed'` and **no** `address_visibility` — i.e. seeded the way a real door now is |
| `shared_home` in the same row | still **true**. It is the LABEL, the one line a stranger reads, that stopped saying it |
| `ci.yml`'s `door-work` leg on the same commit | **GREEN**, because it runs 0273's smoke but never applied 0278/0280 |

**Nothing was watching, and two guards were pointed at it:**

- `migration-replay-order-guard` asks whether a replay **reverts** a newer file.
  0280 is newer than 0278, the files are in ascending order, the `RETURNS`
  shape is unchanged and it still calls `rentable_level_of`. Nothing to report.
  The revert lives in the **body's branching**, which no shape check sees.
- `ci.yml`'s door-work leg is the one built on a **fresh** database, and it
  stopped applying the chain at 0273 — three migrations behind production's
  `public_vacancies()`. It was asserting against a composition the live database
  left behind, and its green was the more misleading signal of the two.

## Impact

A stranger reading the open shelf could not tell that a bed in a shared room is
what is for rent. That is the 2026-06-13 class of failure (P15) at its most
expensive: the surface said something untrue about real state, and the person
harmed is the one who *"goes to Apt 4 with a car full of belongings expecting
their own place"* — 0278's own words for the outcome it existed to prevent.

The quieter cost is the one DR-0975 is about: a green check that means nothing.
For four days the fresh-container leg reported that the shelf was fine while the
live database would have failed the same assertion on the same commit. A pass
that cannot fail trains the team to believe the next one.

Reversible: one `CREATE OR REPLACE`, three chain lists, one guard, one record.
No schema change, no row written, nothing on the merge path.

## Decision

1. **A room or a bed says what it is FIRST, before the street question is
   asked.** 0281 reorders the label: `WHEN v.level IN ('room','bed')` composes
   the descriptor, street shown or held. 0278's rule is restored as a rule
   rather than a default-dependent branch.
2. **A WHOLE UNIT is untouched.** Its own name when the street shows, the
   bedroom count when the family holds it — exactly as 0280 decided. Nothing
   about the street, the unit, the area, the photo walls or `shared_home`
   changes, and no row is written. 0281 was built by transforming 0280's own
   function text and diffing it: **all 27 changed lines are inside the label
   expression.**
3. **This is an ORDERING, not new copy.** I am not inventing a card headline at
   1am on a stranger-facing surface. Both strings already shipped; the only
   question was which branch reaches them, and 0278 already answered it.
4. **The smoke is NOT touched.** It caught a real regression and its assertion
   was correct. Changing a test that is right is how a regression becomes a
   feature — the opposite of DR-0982, where the test was the stale thing. The
   distinction is the whole discipline: ask which one is wrong, every time.
5. **0281 joins every chain that carries 0280** — the `poe-properties` leg and
   `scripts/e2e/build-door-db.sh` — **and ci.yml's `door-work` leg gains 0278,
   0280 and 0281** before its second 0273 smoke. That leg already ran 0273's
   smoke twice under a comment explaining that the second run exists to prove
   *"it ends where it is supposed to"*. It was converging on 0273 and calling
   that the end. Now it converges on production.
6. **The class is gated** — `scripts/newest-definition-replay-guard.mjs`, in
   `verify:gates`. The rule: *if a chain applies migration M and runs M's smoke,
   then for every function M defines, the chain must also apply the newest
   migration that defines that function.* It is the complement of
   `migration-replay-order-guard`, not a duplicate: that one says **do not go
   backwards**, this one says **arrive**.
7. **`migration-return-type-guard` is widened to see a plain `CREATE FUNCTION`,
   because it was blind to its own subject.** Its reader matched only `CREATE OR
   REPLACE FUNCTION` — and a return-type change **cannot** use `OR REPLACE`,
   since Postgres refuses it, so it must be written `DROP FUNCTION …; CREATE
   FUNCTION …`. The guard could not see the only syntax the thing it exists to
   catch can be written in. It surfaced while shipping 0281: the guard reported
   `public_vacancies` changing shape *"from 0270"* — three migrations stale —
   because 0273's, 0278's and 0280's definitions were all invisible to it, and
   it demanded a `DROP` that 0281 provably does not need. **Both failure modes at
   once:** blind to real changes (DR-0076 §3) and crying wolf on a safe one
   (P46). This is the identical lesson `migration-replay-order-guard`'s own
   header records from 2026-09-12 — *"The one case where a replacement is FORCED
   to look different was the one case the pattern missed"* — widened there and
   never here.
8. **NOT decided: whether `display_name` is the right label for a unit whose
   street is shown.** 0280 chose it and nothing contradicts that; a landlord-typed
   name is not guaranteed to be clearer than "2-bed multi-family in Champaign",
   and his own door proves such names can be bad. Out of scope here, and a copy
   question that is his, not mine. `re-review: 2026-10-27`.

## Verification

- **The cause is read, not guessed.** 0280's label `CASE` read from the file;
  `ALTER COLUMN address_visibility SET DEFAULT 'public'` and the one-time
  `UPDATE ... SET address_visibility = 'public'` read from the same file;
  `rental_address_is_public` read verbatim. A test asserts the premise *against
  0280 itself* — that `WHEN v.shown` precedes `'Bed in a shared'` there — so if
  I have misread 0280, that test fails rather than this record standing.
- **0281 is a transformation of 0280's own text, diff-verified.** The label block
  was matched verbatim and replaced; the diff is 27 lines, every one inside the
  label expression, plus `CREATE FUNCTION` → `CREATE OR REPLACE FUNCTION`.
  Nothing else could have drifted.
- **The new guard is PROVEN TO CATCH (DR-0076 §3) on the two real pre-fix
  states** — not on a contrived input. ci.yml's leg as it actually stood:
  **3 problems**. The live leg with only 0281 removed: **4 problems**. Seven
  catches; green with the fixes in.
- **The guard found a SECOND divergence on its own**, which I had not noticed
  and was not looking for: ci.yml's leg asserted `public_vacancy_photos()` as
  0273 defines it while never applying 0278, which also redefines it (the
  sibling-borrow condition). That is the evidence it generalizes past the
  instance it was built for, and it is pinned in a test.
- **The return-type guard's blind spot was MEASURED, not assumed**, and so was
  the fix's safety: with the reader widened, 0273/0278/0280 become visible, and
  0280's and 0281's `RETURNS` shapes are **byte-identical — 385 characters
  each**. So `CREATE OR REPLACE` is correct and the `DROP` the guard demanded
  was unnecessary. Widening it surfaced **zero** other violations across 280
  migrations, so no cleanup was hiding behind the blind spot, and the guard's
  own 13 existing tests still pass. Proven-to-catch both ways: the narrow
  pattern does not match `DROP FUNCTION …; CREATE FUNCTION …` and the widened
  one does, asserted against that exact string.
- **21 vitest tests** in `a-bed-still-says-it-is-a-bed.test.js`, reading the
  shipped SQL rather than a copy of it: the arm order, the descriptor's content,
  that the descriptor never reads `display_name`, that the unit arms are
  unchanged, that the street/area/`shared_home` outputs are untouched, that no
  row is written, all three chains, both proven-to-catch states, the widened
  return-type reader, and that the 0273 smoke is byte-for-byte the assertion
  that caught this.
- `bash -n` on the e2e builder, `yaml.safe_load` on both workflows, and the
  builder's loop expanded to confirm every file survives (a `#` between
  backslash-continued words would silently drop the rest of the logical line —
  the trap recorded in DR-0982).
- **Not proven from this sandbox:** that the label is now correct *in the
  database*. There is no PostgreSQL **server** here, only the `psql` client, so
  no SQL in this record was executed. The proof is the next `rls-isolation`
  run — a green `poe-properties` leg, the first since 2026-10-10T23:44:45Z — and
  a green `app — door work orders (PostgreSQL)` now that its chain reaches
  0281. `re-review: 2026-10-13`.
- **Not verified:** whether a FOURTH stale or broken assertion waits behind
  0273. The leg still stops at its first failure, so the masking DR-0976
  described applies to everything after it. Named rather than assumed clean —
  this is the third in a row (0263 → 0269 → 0273) and the pattern is the
  finding, not the exception.

## Links

[DR-0982] (the night-cap smoke — predicted this unmasking, and the case where
the TEST was the stale one), [DR-0976] (an allow-list is added to, never
rewritten — where the cascade started), [DR-0971] / 0278 (a bed is not a
bedroom — the rule this restores, and Darrell's sentence behind it), [DR-0977] /
0280 (the address shows unless the family holds it — the change that moved it),
[DR-0952] / 0273 (a shared home says so on the shelf — whose smoke caught it),
[DR-0975] (a correct alarm that reaches nobody), [DR-0621] (hold the hand of the
process: a flag is where the work starts), [DR-0061] (P15 — a surface is a live
view of real state).
