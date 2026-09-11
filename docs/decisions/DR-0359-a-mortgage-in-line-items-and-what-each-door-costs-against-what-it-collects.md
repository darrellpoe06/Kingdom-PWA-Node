# DR-0359 — A mortgage in line items, and what each door costs against what it collects

**Date:** 2026-09-11 · **Status:** accepted · **Tier:** B · **Area:** money · **Principles:** VERIFICATION-DOCTRINE, APP-IS-PRIMARY, DATA-AS-EMPOWERMENT, DETERMINISTIC-FIRST, DECISION-RECORDS

## Directive, in Darrell's words (2026-09-11)

Answering the open question DR-0358 left ("fold `rent_payments` into obligations, or read both?"):

> *"Yes. Mortgage payments for should be line items calculated to the total... taxes... insurance... etc... then the tenants payments each month need to show the difference in the two for gap/profit analytics etc..."*

And, on the child sorting the post:

> *"Yes. We want our children to learn the process and a system helps them to learn how we work."*

## What is true (SHOULD / ARE / GAPS)

**SHOULD:** a house payment shows its parts and the parts add up to it; each door shows what it cost and what the tenant actually paid, and the difference.

**ARE — traced against the LIVE database, not the schema files (DR-0061):**

| Claim | Reality |
|---|---|
| A door's mortgage has a breakdown | `rentals.mortgage_payment` and `rentals.mortgage_escrow` are **two unrelated scalars**. No principal and interest, no taxes, no insurance, no HOA, no PMI, and nothing saying the parts sum to the payment. |
| A door's cost can be asked about by month | `rentals.mortgage_payment` is a **current number, not a series**. "What did this door cost in July" has no answer. |
| Rent expected vs received is tracked | `rent_payments` has exactly the right shape and **0 rows**; it keys off `lease_id`, and `leases` has **0 rows**. |
| Something computes a gap | **Nothing does, anywhere.** |
| The doors carry their numbers | Of the **12 doors**: **1** has a rent figure, **1** has a mortgage payment, **0** have escrow. |
| The Plan tab's "$11,700/month gross scheduled rental income" comes from the doors | **No.** It comes from Christina's workbook JSON in `family_plans`. |

**GAPS:** the shape for the question did not exist, and the numbers to answer it are mostly not entered.

## Decisions

1. **The parts add up to the total, and the database refuses otherwise.** `obligation_lines` carries the components a real mortgage statement names — principal and interest, taxes, insurance, HOA, PMI, escrow, other. A **deferred constraint trigger** checks that when lines exist they sum **exactly** to the obligation's amount, in integer cents. Deferred so a four-line set writes as one fact rather than failing on the first row. This is Darrell's "line items calculated to the total" made impossible to violate — the same discipline DR-0358 used for derived status, applied to arithmetic.
2. **The door is linked by identity, not by spelling.** `obligations.rental_id` references `rentals(id)`. `place` stays as the household's own words; a report keyed on free text is a report one typo breaks. A door belonging to another household is refused outright — the DR-0060 tenancy rule.
3. **A period is a month.** `obligations.period_month` is constrained to the first of its month, so one July is one July however it was typed, and a recurring charge is one row per month. A unique index refuses a second identical open charge on the same door and month — the double-count this ledger exists to prevent.
4. **The gap is measured against money that ARRIVED.** `door_month` returns cost, billed, collected, `gapCents` (collected − cost) and `shortfallCents` (billed − collected). Billed-minus-cost is the plan; collected-minus-cost is whether the month actually funded itself. Both are reported, neither is hidden behind the other.
5. **NOT ENTERED IS NOT ZERO.** A door nobody has filled in returns `entered: false` and nulls — never `$0`, never a 0% margin. "It costs nothing" and "we have not written it down" are different facts, and today only the second one is true for 11 of the 12 doors. A portfolio total states how many doors it actually covers (`complete`, `basis`), because a total over 1 of 12 that does not say so is a lie by omission. This is DR-0076's under-claiming half.
6. **A line may be negative; a line may not be nothing.** An escrow refund reduces the payment, so negatives are allowed and must still make the total work. A zero line is refused, and an `other` line must say what it is.
7. **The role wall is DR-0358's, unchanged.** Child and assistant never read the lines and cannot call `door_month`. A child learning the process (see below) learns it by sorting the post, not by reading the books — DR-0094 keeps that the guardian's call.
8. **The set is replaced, never half-edited.** `obligation_set_lines` deletes and rewrites the whole breakdown, because the parts of one payment are one fact and half-replacing them is exactly how a total stops matching its parts.

## Proof — measured, not asserted

- **`obligations.test.js`-style unit proof:** `door-economics.test.js` (26) — ten dimes are exactly one dollar; a short breakdown is refused and names the missing $50.00; an overshoot names the extra $25.00; an escrow credit of −$40.00 that balances is accepted; an untouched door renders `—` and never `$0`; a portfolio over 1 of 3 doors says "1 of 3".
- **Run against the LIVE schema in a rolled-back transaction before pushing** (DR-0076 §7, independent verification rather than a reading of the code):
  - a breakdown summing exactly to $1,355.12 was accepted;
  - adding a $50 HOA line to it was **refused** by the deferred trigger;
  - `door_month` returned cost 135512, billed 160000, collected 120000, gap −15512, shortfall 40000, and the breakdown `{principal-interest: 94212, taxes: 31500, insurance: 9800}` — every number from real rows;
  - an untouched month returned `entered: false`;
  - a **child was refused** `door_month`;
  - and the rollback was verified: `obligation_lines`, `obligations.rental_id` and the fixture were all confirmed absent from production afterward.
- `0203-door-economics-smoke.sql` on the `product-forms` isolation leg carries the full matrix (member refused, another household refused, a direct insert bypassing the function refused, the double-count refused, a mid-month period refused).
- The **`migration-replay-order` guard caught a real defect** while this was being written: 0203 redefines `obligation_record`, and the isolation leg replaying 0202 would have silently reverted it. The guard failed the build and named the fix. That is a gate earning its keep, not decoration.

## What this deliberately did NOT do

- **No surface yet.** The model, the walls, the arithmetic and the seam are in; the per-door view showing cost, collected and gap is the next commit. *re-review: 2026-09-15.*
- **The numbers are still not entered.** This builds the shape and refuses to invent the content. Entering the 12 doors' real figures is Darrell's and Christina's, and the surface must make it easy rather than guessing on their behalf.
- **`rent_payments` is not migrated.** New rent is recorded as a receivable obligation against the door; the existing table and DR-0313's posting trigger are untouched. Folding the old rows in is its own change, once there are any.
- **`debts` still has no due date** — the DR-0358 gap, still open, now with an obvious destination.
