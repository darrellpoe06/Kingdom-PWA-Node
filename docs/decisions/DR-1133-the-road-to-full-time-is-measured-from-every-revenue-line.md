# DR-1133: The road to full time is measured from every revenue line — the family is paid first, and the next hire comes when the work needs it and the money pays for it

**Date:** 2026-10-20
**Status:** accepted
**Tier:** A (an internal Dev/Ops calculator; no price, gate or public copy changes)
**Type:** decision
**Area:**
- `app/src/lib/full-time-path.js`, `app/src/components/FullTimePath.jsx` (new), shown in `app/src/components/DevOps.jsx` under the church cost to serve (DR-1128); test `app/src/__tests__/full-time-path.test.jsx`; `app/src/lib/legibility-health.json` regenerated for the new page

**Grounds:** Darrell, 2026-10-20: **"The goal would be to have we able to work full-time inside PoeTech.... based on workloads and revenue... and to be able to keep hiring to support this industry... in our businesses and children... make sense?"** Then: **"Not church only.... the PoeTech App allowed me to build the other apps... so making apps for businesses and churches etc..."** Then: **"Review the DRs.... and Way and documentation.... says similar things..."** Then: **"Growing to understand what is and isn't possible based on impact and outcomes... inputs and outputs... producing outcomes... make sense?"**
**Principles:** DR-1128 (the cost to serve is priced in before the offer; no dead processes for lack of funds); DR-0018 (paid rings carry the free mission tier); DR-0017 / DR-0021 (the Workforce Layer: hire on capacity, start clearly 1099, W-2 only when a class of work warrants it, classification to the employment attorney); DR-0010 / DR-0011 (agents carry the toil, people the judgment); DR-0114 / DR-0117 (the client-business factory and its build terms); DR-0842 / DR-0359 / DR-0360 (the children learn the businesses by running them); DR-0076 (nothing guessed: a blank is not zero); DR-0100 (state the arithmetic plainly, including what is not possible); the capacity guard's 80% line in `lib/opportunity-capacity.js`

## Context

DR-1128 set what one church pays and checked it against what one church costs. It did not answer the question behind it: when does what PoeTech earns let the family do this work full time, and when can it pay the next person? Darrell named the goal and then widened it at once. PoeTech is not only a church product. The PoeTech App is what built the other apps (Poe Properties among them), so building apps for businesses and churches is revenue too, and it is also work.

## What the records already say

Darrell asked for the ledger and the Ways to be read first, because they say similar things. They do, and this record builds on them rather than restating them:

- **Building apps for others is already the factory.** DR-0114 and `CLIENT-BUSINESS-FACTORY.md` made the Moore Divahs build *"the PROTOTYPE... the FACTORY"*. DR-0117 set the terms: a $2,000 minimum per build, then $150 a month support, which replaces the $249 Business tier for build clients. DR-0227 names the apps PoeTech has built (PoeTech, Love Corner, TLC Therapy Solutions, Moore Divahs), and DR-0313 makes Poe Properties a second door on one library.
- **Hiring is already decided as capacity, not credentials.** DR-0017's Workforce Layer means guided tasks with an LLM check, paid through an outside platform (DR-0019: no money rail of our own). DR-0021 says to start clearly 1099 and add W-2 only when a class of work warrants it, with the classification routed to an employment attorney.
- **Agents carry the toil.** DR-0010 / DR-0011 and `INFRASTRUCTURE-PIPELINE.md` give people the judgment and agents the repeatable work. So the hours that decide a hire are the hours a person still spends.
- **The paid rings carry the mission.** DR-0018 says the paid tiers subsidize the free mission tier. DR-1128 §3 adds that free to a church never means unpaid work: a sponsor pays for the time.
- **The children learn by running it.** DR-0842: *"I want my kids to see how to manage these systems from all positions so they can learn how to navigate life and experience running our businesses."* DR-0359 / DR-0360 say the same of learning the process through the system.
- DR-0017, DR-0018, DR-0019 and DR-0021 are rows in `INDEX.md` (lines 41-45) without files of their own; their reasoning is in `docs/99-session-notes/2026-06-09-poetech-market-strategy-workforce-three-ring.md`. The code therefore cites this record, which quotes them, rather than numbers that lead nowhere.
- **What no record said yet:** that the family works full time inside PoeTech, in what order, and the rule for when the next person is hired. The session notes give only today's state (Darrell's UIUC day job, 2026-06-01). That gap is this record.
- The `THE-WAY*` and `HOLD-THE-HAND-OF-THE-PROCESS.md` foundations were read and do not speak to pay or hiring. They govern how the work is done, and this card is held to that standard: a flag is where the work starts.

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
   - build clients on support, at $150 a month (DR-0117);
   - apps built this month, at the $2,000 minimum (DR-0117).

   Every line has the same four entries, each per month: how many, the price of each, what each costs to run, and the hours each takes. The hours are person-hours: what a person still spends after the agents carry their share (DR-0011).
2. **Inputs produce outcomes, and the card names both.** The entries go in: the lines, the platform's measured $308.11, the employer costs, the reserve, and each person's full-time pay and hours. The card then answers:
   - who can be paid full time today, and how far short the payroll is;
   - how many more of one chosen line before each person is full time, with every other line held where it is;
   - whether the hours the work takes fit the hours on the payroll;
   - when the next hire is needed and when it is paid for.
3. **The mission is carried first, then the family is paid, in the order listed.** The platform, each line's running costs, the reserve (DR-1128's 20%) and the mission work the paid lines carry (DR-0018) come out before anyone is paid. Mission work means free and sponsored work not covered by a sponsor, and gifted months (DR-1128 §6). Then pay goes to Darrell, then Christina. Employer costs are entered for the family's own pay as they apply; owners on a draw may enter 0. Social Security and Medicare alone are 7.65%.
4. **A hire comes when the work needs it AND the money pays for it.**
   - It is *needed* when the hours pass 80% of the hours on the payroll, the same line the capacity guard warns at.
   - It is *paid for* when the revenue covers everyone listed and that hire's pay too.
   - The next hire starts as a **1099 contractor** (DR-0021), which carries no employer costs. Choosing W-2 adds them, and that choice goes to the employment attorney first.
   - When the work arrives first, the card says for how many sales the work outruns the money, and names the answer DR-1128 already chose: raise the price, slow the onboarding, or fund the hire before the work arrives. It never says hire and hope.
5. **What is not possible is said plainly.** If the numbers entered can never cover the pay within 10,000 more of the line being grown, the card says it is not reachable at these numbers. A lower price or a higher cost must change before the goal can be met.
6. **Nothing is guessed.** The only figures filled in are the published prices and the measured platform cost. Every pay, hour, count and running cost is the family's to enter. A blank reads "not entered", and no answer is given until every entry is filled.

## Impact

- Dev/Ops → Projections now runs in three steps:
  - the tier mix;
  - one church's cost to serve (DR-1128);
  - every line against the family's full-time pay and the next hire (this record).
- No price, tier key, gate or public copy changes. The front-door price (#2295) is unaffected.
- The church card and this card are read side by side, never added together. The church card's "hiring" line prices a share of help into one church's price; this card is the whole business, and summing the two would count the hire twice.

## Verification

- `full-time-path.test.jsx` (13 tests) covers these properties:
  - a blank is missing, never zero;
  - the churches needed for each person, paid in order;
  - every line counting toward the same payroll, including apps built for others;
  - employer costs, running costs and the reserve coming out before pay;
  - the mission work coming out before pay (DR-0018);
  - a 1099 hire carrying no employer costs and a W-2 hire carrying them (DR-0021);
  - a hire needed on hours and paid for on revenue, with the gap named;
  - an unreachable goal said instead of looped;
  - the screen and its mount in Dev/Ops.
- Proven to catch:
  - counting a blank as zero fails 2 tests;
  - counting only the church line fails 2;
  - skipping the mission work fails 1;
  - charging a 1099 hire employer costs fails 1.
- Lint, legibility (343/356 pages), interconnect and module-boundary pass.
- **re-review:** 2026-11-20, with DR-1128, once Darrell and Christina have entered their real pay and hours. Record what the card said and whether it matched the month.
