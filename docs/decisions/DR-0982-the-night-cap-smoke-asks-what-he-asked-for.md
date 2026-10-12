---
id: DR-0982
title: The night-cap smoke asks for what he asked for — a test kept demanding a rule Darrell had removed
date: 2026-10-12
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0269, DR-0959]
tier: B
entities: [poe-properties]
grounds: [VERIFICATION-DOCTRINE, SURFACE-SAYS-TRUTH, HOLD-THE-HAND-OF-THE-PROCESS]
source: 2026-10-12 — the first failure to surface once DR-0976 stopped 0263 from masking everything after it
---

## Context

DR-0976 said this would happen, in those words: *"the leg stops at the first
failing smoke and 0263's runs first, so the measured damage understates the
real damage."* It did. The moment document signing was repaired, the
poe-properties leg ran past 0263 and stopped at the next thing:

```
psql:infra/supabase/tests/0269-booking-calendar-smoke.sql:178: ERROR:
  BOOKING CALENDAR SMOKE FAIL: a guest asks for thirty nights on their own
  (expected succeeds=f, got t)
```

**The product is right and the test is wrong.** `0276-a-guest-may-stay-as-long-
as-they-like.sql` removed the 29-night cap at Darrell's explicit, twice-stated
word:

> *"we dont want people to do short term leases because of staying passed 29
> days!!!!!!! They can stay for a year with $150 a day if they want
> too!!!!!!!!!!!!!!!!!!"*

and then, on seeing the 29 lifted:

> *"All number of nights accepted!!!!!!!!"*

0276 dropped `door_stays_guest_asks_under_30_nights` **and**
`door_stays_at_most_a_year`. 0269's smoke went on asserting that a guest's
thirty-night ask must FAIL — a rule its owner had deleted.

## What was measured

| | |
|---|---|
| first red run | 2026-10-11T04:44:22Z, masked behind 0263 until 2026-10-12 |
| the failing case | `0269-booking-calendar-smoke.sql:107`, expected `succeeds=f`, got `t` |
| 0276 landed | 2026-10-11, dropping both constraints |
| 0276/0277 in the poe-properties replay leg | **absent** |

**The open question from DR-0976 is now closed.** That record said plainly:
*"Why the leg's database lacked the constraint I have not yet established"* and
refused to assert a theory. The answer is in the workflow itself —
`rls-isolation.yml` runs its legs against **`SUPABASE_DB_URL`, the real hosted
database**, not a fresh container:

```
SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
# This leg runs against SUPABASE_DB_URL, the same secret db-migrate uses
```

So db-migrate had already applied 0276 there and dropped the cap. The leg's
replay of 0269 uses `CREATE TABLE IF NOT EXISTS public.door_stays (… CONSTRAINT
door_stays_guest_asks_under_30_nights …)`, which is a **no-op on an existing
table** — the constraint is never re-created, and the smoke's expectation had
nothing left to be true.

**Also confirmed, and worth keeping:** DR-0979's change could not have caused
this. 0279 touches only `door_events`' subject allow-list and its read policy;
the night cap was a CHECK on `door_stays`.

## Impact

Unresolved, the tenancy and data-isolation matrix stays red, which is the exact
condition DR-0975 and DR-0976 are both about: a correct alarm that reaches no
one. Worse here than usual, because the matrix is now red for a reason that is
**not a defect at all** — the product does what its owner demanded. A red that
means nothing trains the team to ignore a red that means everything, and the
next real tenancy leak arrives into a list that was already red.

There is a second, quieter cost: the replay leg omits 0276 and 0277, so the
chain it applies ends in a state **production never has**. Against the live
database that omission is invisible (0276 is already applied); against any
fresh database it would re-create a cap the owner removed.

Reversible: one smoke file, two names in a replay list, one record. No schema
change, no product change, nothing on the merge path.

## Decision

1. **The smoke asserts the rule he asked for.** A guest's thirty-night ask now
   expects **success**, and a second case asserts a **three-hundred-night** ask
   succeeds — past the old one-year ceiling 0276 also dropped. The test now
   **proves the new rule** rather than merely stopping short of the old one; a
   case changed from `false` to `true` and left there would have proved nothing.
2. **His words go in the file.** The smoke carries both of his sentences and
   names 0276, so the next reader finds the owner's instruction beside the
   assertion instead of a bare expectation.
3. **0276 and 0277 join the poe-properties replay leg**, after 0275. A leg that
   replays 0269 but not the file that drops 0269's constraints ends somewhere
   production never is.
4. **DR-0976's open question is answered in this record, not left dangling:**
   the leg runs against the live hosted database. That is the whole explanation,
   and it is written down rather than inferred.
5. **NOT changed: the cap itself, the double-booking trigger, or any other wall
   of 0269.** 0276 was explicit that only the two length constraints go. This
   record touches a test and a replay list.
6. **NOT decided: whether a leg that runs against the LIVE database is the
   right design.** It means `CREATE TABLE IF NOT EXISTS` silently skips, so a
   smoke can only ever test the state production happens to be in — which is
   how a stale expectation survived unnoticed. That is a real question about
   the instrument and too big for this change. `re-review: 2026-10-26`.

## Verification

- **The cause is read from the workflow, not guessed:** `SUPABASE_DB_URL` in
  `rls-isolation.yml`, with the comment naming it as the same secret db-migrate
  uses. DR-0976 declined to assert a theory here; this closes it with the line.
- **0276 read in full** — both dropped constraints named verbatim, and Darrell's
  two sentences quoted from its own header.
- All replay guards green after the leg change: `rls-isolation-matrix-guard`,
  `migration-replay-order-guard` (*"no replay leg can revert a newer
  migration"*), `replay-completeness-guard`, `migration-return-type-guard`.
- `yaml.safe_load` parses; the leg's migrations remain in ascending order.
- **Not proven from this sandbox:** that the leg now goes green. The smoke runs
  against the hosted database over a secret this sandbox does not hold, so the
  proof is the next `rls-isolation` run after merge — the first green
  poe-properties leg since 2026-10-10T23:44:45Z. That run is the only thing that
  closes this. `re-review: 2026-10-13`.
- **Not verified:** whether any other smoke in that leg carries a stale
  expectation behind this one. 0269 was simply the next to fail; the leg still
  stops at the first failure, so the same masking applies to anything after it.
  Named rather than assumed clean.

## Links

[DR-0976] (an allow-list is added to, never rewritten — predicted this exact
unmasking and left the cause open; answered here), [DR-0959] / [DR-0269] (the
booking calendar and its original guest cap), [DR-0975] (a correct alarm that
reaches nobody — why a meaningless red is costly), [DR-0621] (hold the hand of
the process: a flag is where the work starts), `0276-a-guest-may-stay-as-long-
as-they-like.sql` (the migration that carried his word).
