# DR-1129: The road to full time is measured from every revenue line — the family is paid first, and the next hire comes when the work needs it and the money pays for it

**Date:** 2026-10-20
**Status:** accepted
**Tier:** A (an internal Dev/Ops calculator; no price, gate or public copy changes)
**Type:** decision
**Area:**
- `app/src/lib/full-time-path.js`, `app/src/components/FullTimePath.jsx` (new), shown in `app/src/components/DevOps.jsx` under the church cost to serve (DR-1128); test `app/src/__tests__/full-time-path.test.jsx`; `app/src/lib/legibility-health.json` regenerated for the new page

**Grounds:** Darrell, 2026-10-20: **"The goal would be to have we able to work full-time inside PoeTech.... based on workloads and revenue... and to be able to keep hiring to support this industry... in our businesses and children... make sense?"** Then: **"Not church only.... the PoeTech App allowed me to build the other apps... so making apps for businesses and churches etc..."** Then: **"Review the DRs.... and Way and documentation.... says similar things..."** Then: **"Growing to understand what is and isn't possible based on impact and outcomes... inputs and outputs... producing outcomes... make sense?"**
**Principles:** DR-1128 (the cost to serve is priced in before the offer; no dead processes for lack of funds); DR-0076 (nothing guessed: a blank is not zero); DR-0100 (state the arithmetic plainly, including what is not possible); the capacity guard's 80% line in `lib/opportunity-capacity.js`

## Context

DR-1128 set what one church pays and checked it against what one church costs. It did not answer the question behind it: when does what PoeTech earns let the family do this work full time, and when can it pay the next person? Darrell named the goal and then widened it at once. PoeTech is not only a church product. The PoeTech App is what built the other apps (Poe Properties among them), so building apps for businesses and churches is revenue too, and it is also work.

## What was measured

| | |
|---|---|
| What PoeTech pays each month (2026-10-16 addendum, DR-1128) | **$308.11**, measured |
| Published prices the card starts from | **$200** a church (DR-1128); **$249** Business (landing price strip) |
| The capacity guard's healthy line | **80%** of available hours (`lib/opportunity-capacity.js:42`, `:110`) |
| Employer Social Security + Medicare | **7.65%** of pay, the floor of employer costs |
| Revenue or payroll records in the app today | **none**: no billing, revenue or payroll table in `infra/supabase/migrations-auto/` (the only "subscriptions" table, 0181, is push notifications) |

Because there are no revenue or payroll records yet, the card reads from entries, not from rows. When billing records exist, the counts and prices become reads instead of entries; that is the next step this record leaves open.

A worked example from the test, not the family's numbers: at $5,000 a month full-time pay each, no employer costs or reserve, and only churches at $200, the first person is full time at 27 churches and both at 52. At 2 support hours a church and 160 hours each, the next hire ($3,000) is needed at 128 churches and paid for at 67, so the money arrives first. At 6 hours a church the hire is needed at 43, and for 24 churches the work outruns the money.

## Decision

1. **Revenue is a set of lines, not one.** The Dev/Ops card starts with four lines and each can be renamed:
   - churches, at the $200 floor (DR-1128);
   - business plans, at the published $249;
   - family plans;
   - apps built for others.

   Every line has the same four entries, each per month: how many, the price of each, what each costs to run, and the hours each takes. An app built for someone is entered as its monthly price and the hours it takes each month, build and support together; DR-1128's workflow quote gives both.
2. **Inputs produce outcomes, and the card names both.** The entries go in: the lines, the platform's measured $308.11, the employer costs, the reserve, and each person's full-time pay and hours. The card then answers:
   - who can be paid full time today, and how far short the payroll is;
   - how many more of one chosen line before each person is full time, with every other line held where it is;
   - whether the hours the work takes fit the hours on the payroll;
   - when the next hire is needed and when it is paid for.
3. **The family is paid first, in the order listed.** It starts with Darrell, then Christina. Full-time pay is entered with its employer costs on top; Social Security and Medicare alone are 7.65%. The reserve and the running costs come out before anyone is paid.
4. **A hire comes when the work needs it AND the money pays for it.**
   - It is *needed* when the hours pass 80% of the hours on the payroll, the same line the capacity guard warns at.
   - It is *paid for* when the revenue covers everyone listed and that hire's pay too.
   - When the work arrives first, the card says for how many sales the work outruns the money, and names the answer DR-1128 already chose: raise the price, slow the onboarding, or fund the hire before the work arrives. It never says hire and hope.
5. **What is not possible is said plainly.** If the numbers entered can never cover the pay within 10,000 more of the line being grown, the card says it is not reachable at these numbers. A lower price or a higher cost must change before the goal can be met.
6. **Nothing is guessed.** The only figures filled in are the published prices and the measured platform cost. Every pay, hour, count and running cost is the family's to enter. A blank reads "not entered", and no answer is given until every entry is filled.

## Impact

- Dev/Ops → Projections now runs in three steps:
  - the tier mix;
  - one church's cost to serve (DR-1128);
  - every line against the family's full-time pay and the next hire (this record).
- No price, tier key, gate or public copy changes. The front-door price (#2295) is unaffected.

## Verification

- `full-time-path.test.jsx` (11 tests) covers these properties:
  - a blank is missing, never zero;
  - the churches needed for each person, paid in order;
  - every line counting toward the same payroll, including apps built for others;
  - employer costs, running costs and the reserve coming out before pay;
  - a hire needed on hours and paid for on revenue, with the gap named;
  - an unreachable goal said instead of looped;
  - the screen and its mount in Dev/Ops.
- Proven to catch: counting a blank as zero fails 2 tests, and counting only the church line fails 2.
- Lint, legibility (343/356 pages), interconnect and module-boundary pass.
- **re-review:** 2026-11-20, with DR-1128, once Darrell and Christina have entered their real pay and hours. Record what the card said and whether it matched the month.
