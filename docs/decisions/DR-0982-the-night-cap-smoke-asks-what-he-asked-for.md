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
| chains that replay 0269 | **three**: rls-isolation `poe-properties`, ci.yml `door-work`, `scripts/e2e/build-door-db.sh` |
| of those three, chains that applied 0276 | **none** |
| the first fix's CI run | `app — door work orders (PostgreSQL)` RED, taking the required check with it |

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

1. **The smoke asserts the rule he asked for — of the catalog, in place, and of
   the behaviour, at the end.** Where the cap case used to sit, the smoke now
   reads `pg_constraint` and refuses to pass if either dropped name is back,
   scoped to `door_stays` and naming the likely cause in the message ("a leg
   that replays 0269 without 0276 re-creates it"). Then, as the file's **last**
   step, one real ask for **four hundred nights** — past the 29 the guest cap
   refused *and* past the 365 the year ceiling refused — from a guest with no
   account, and it succeeds. The new rule is proved both ways; a case flipped
   from `false` to `true` and left there would have proved nothing.

   **This is the second version of decision 1, and the first one broke the
   smoke.** It booked thirty and three hundred nights *in the middle of the
   file*, which broke this smoke's own arithmetic three ways at once: the new
   row landed on `d0 + 5`, so the `SELECT … INTO ask` below it picked that row
   instead of the ask it means (a plain `SELECT INTO` takes an arbitrary row
   and does not complain); it spent one of Ana's three open asks, so *"a fourth
   open ask from the same contact"* stopped being the fourth; and it pushed
   doorA's row count past the `6` section 3 asserts. All three are ordering
   mistakes — a row added too early — which is why the fix is placement, not
   cleverness, and why each is now pinned by position in a test.
2. **His words go in the file.** The smoke carries both of his sentences and
   names 0276, so the next reader finds the owner's instruction beside the
   assertion instead of a bare expectation.
3. **0276 joins ALL THREE chains that replay 0269**, not one: the
   rls-isolation `poe-properties` leg (after 0275), ci.yml's `door-work` leg
   (after 0270, before the smokes) and `scripts/e2e/build-door-db.sh` (after
   0273). 0277 joins the poe-properties leg only, where its smoke runs; the
   other two chains run no smoke that calls `public_stay_payment`, so adding it
   there would be a file applied for no reason.

   **The first fix went only where I was looking** — the rls-isolation leg,
   because that is where the failure was reported. That leg runs against the
   LIVE database, where `CREATE TABLE IF NOT EXISTS` is a no-op, so the
   omission there changed nothing and the two chains where it *does* change
   something stayed broken. The required check went red on the next push, on
   ci.yml's fresh container, for exactly that reason. This is P49 again: the
   workaround reaching another surface IS the finding.
4. **The class is gated, not the instance** —
   `scripts/inline-constraint-replay-guard.mjs`, in `verify:gates`. The rule:
   if a chain applies migration M, which declares constraint `c` inline on
   table T, and a later migration N drops `c` from T, then that chain must also
   apply N. It reads all three chain shapes (the rls-isolation matrix, ci.yml's
   shell leg, the e2e builder) and walks each in its real order.
   `migration-replay-order-guard` could not see this and says so in its own
   header — *"A table (CREATE TABLE IF NOT EXISTS) is not in this class; a
   function or a policy is."* That is true of the **table** and false of its
   **inline constraints**: a function's re-definition overwrites, a table's
   re-creation is skipped, but a constraint declared inside that `CREATE` comes
   back on any database that did not already have the table.
5. **DR-0976's open question is answered in this record, not left dangling:**
   the leg runs against the live hosted database. That is the whole explanation,
   and it is written down rather than inferred.
6. **NOT changed: the cap itself, the double-booking trigger, or any other wall
   of 0269.** 0276 was explicit that only the two length constraints go. This
   record touches a test, three replay lists and one new guard.
7. **NOT decided: whether a leg that runs against the LIVE database is the
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
- **The first fix was MEASURED WRONG, by CI, before it merged.** `app — door
  work orders (PostgreSQL)` went red on head `837a7bf3` and took the required
  check `app — lint + vitest` with it; the lane held the PR out, which is the
  brake working (DR-0103). The log named the leg and reading the smoke named
  the three arithmetic breaks. Nothing here was inferred from a guess — the
  red run is the evidence, and it is the reason decision 1 has a second
  version.
- **The new guard is PROVEN TO CATCH (DR-0076 §3), on all three chains.** With
  0276 taken back out of each chain in turn, `checkChain` reports exactly 2
  problems per chain (one per dropped constraint), each naming the constraint,
  the file that re-creates it and the file to add. Six catches, three chains.
  With 0276 in place: `inline-constraint-replay-guard: OK`.
- **The guard's own first version was weaker than its green suggested, and my
  own test caught it.** It read ADD CONSTRAINT with a single lazy regex, which
  matched from a `DROP CONSTRAINT …;` statement straight into the `ADD` that
  followed, then discarded the match for containing a `;` — throwing away the
  ADD it had already consumed, with `lastIndex` moved past it. Measured: 0269
  and 0279 both reported **zero** added constraints while both plainly add one,
  which made `door_events_subject_check` read as permanently dropped and
  inflated the "gone" set from the true **5** to a false **14**. Fixed by
  splitting statements before matching; six tests pin the shape that defeated
  it. A guard that is green for the wrong reason is the thing DR-0076 §3 is
  about, and it nearly shipped inside the record that cites DR-0076 §3.
- **The e2e builder's comment was nearly a silent breakage.** The migration
  list is backslash-continued words; a `#` comment placed between two entries
  is not a comment on one line but a comment on the remainder of the **logical
  line**, which would have dropped 0276, 0278, 0280 and the `; do` with them.
  Caught before committing, by expanding the loop: `bash -n` passes, and the
  loop still prints all **15** files with 0276 in order. The warning is now in
  the file, above the loop, and a test asserts all three trailing files survive.
- **21 vitest tests** in `a-replay-must-not-re-create-a-dropped-constraint.test.js`:
  the two caps read from 0269/0276 rather than from memory; the ADD-after-DROP
  shape; all three chains carrying 0276 in the right order; the proven-to-catch
  case; and the smoke's three arithmetic invariants pinned **by position**,
  since every one of the three breaks was a row added too early.
- All replay guards green after the leg change: `rls-isolation-matrix-guard`,
  `migration-replay-order-guard` (*"no replay leg can revert a newer
  migration"*), `replay-completeness-guard`, `migration-return-type-guard`.
- `yaml.safe_load` parses; the leg's migrations remain in ascending order.
- **Not proven from this sandbox:** that either leg now goes green. There is no
  PostgreSQL **server** here — only the `psql` client — so neither the fresh
  container nor the hosted database can be reached, and every claim above about
  SQL behaviour is read from the files and the real CI log, never executed. The
  proof is the next pair of runs after merge: a green `app — door work orders
  (PostgreSQL)` (the fresh-container half, which is what went red) and a green
  poe-properties leg in `rls-isolation` (the live-database half, the first since
  2026-10-10T23:44:45Z). Both, not either. ~~`re-review: 2026-10-13`.~~
  **CLOSED 2026-10-13 — both halves, as this record required.** The
  fresh-container half: `app — door work orders (PostgreSQL)` green on
  `50e69577` (PR #2134, merged as `fe22fd3e`). The live-database half:
  `0269-booking-calendar-smoke.sql:225: BOOKING CALENDAR SMOKE: PASS` in
  `rls-isolation` run 38329136075, and the leg then ran past it to the next
  failure — which was 0273, the stale-expectation successor this record named as
  unverified (now DR-0983). By `rls-isolation` run 38334645684 (job 115091894643), head `7feb2da1`, 2026-10-13T02:00Z the whole leg
  passes and all 23 legs are green. Deploy proven on the exact merge SHA:
  `head_sha` = main tip = merge commit `fe22fd3e`.
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
