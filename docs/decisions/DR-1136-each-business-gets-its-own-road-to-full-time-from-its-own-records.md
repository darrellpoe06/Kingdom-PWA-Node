# DR-1136: Each business gets its own road to full time, read from its own records

**Date:** 2026-10-20
**Status:** accepted
**Tier:** A (a Books view for each business; no price, gate or public copy changes)
**Type:** decision
**Area:**
- `app/src/lib/business-road.js`, `app/src/components/BusinessRoad.jsx` (new), mounted beneath each business and nonprofit card in `app/src/components/BooksEntities.jsx` (Books → Entities); test `app/src/__tests__/business-road.test.jsx`; `app/src/lib/legibility-health.json` regenerated for the new page

**Grounds:** Darrell, 2026-10-20, after the PoeTech card (DR-1135) was explained as family-only: **"Road to full time for who? Is this a feature for everyone?"** Then: **"Their road to full-time?"**
**Principles:** DR-1135 (the road to full time, the hire rule and its 1099 start); DR-1128 (the reserve); DR-0076 (nothing guessed: a blank is not zero, a month with no records is absent data); DR-0061 (a surface is a live view of real records); the capacity guard's active statuses and 80% line in `lib/opportunity-capacity.js`

## Context

DR-1135 built the road to full time for PoeTech itself: Darrell and Christina's pay against PoeTech's revenue lines, on the family-only Opportunities tab. Darrell asked who it was for, heard the answer, and pointed it outward: every business here has the same question about its own owners. The Explore trace of the data model (2026-10-20) found what a business already records and what it does not.

## What was measured

| | |
|---|---|
| A business in the books | an `entities` row (type business, nonprofit, …); its money is its accounts' transactions plus any transaction with `entityOverride` set to it (`BooksTransactions.jsx:455-470`) |
| Money in and out | `transactions`, real and synced (`lib/transactions-sync.js`); income is a positive amount; transfers between the family's own accounts are found by `internalTransferIds` and excluded by `externalTotals` (`lib/internal-transfers.js:56,100`) |
| The work | `projects` with `entityId` and `hoursPerWeek` (`lib/projects-sync.js:28,35`); the active statuses are planning, active and ending-soon (`lib/opportunity-capacity.js:47`) |
| Owner pay or owner draw | **not recorded anywhere**: no category, no field (`lib/categorize.js`) |
| Owners' hours | **not recorded per business**: `skillProfiles` carry hours but no business |
| Where an owner sees the business's money | Books → Entities (`components/BooksEntities.jsx`), behind the Financial private gate, filtered by each entity's `visibleTo` |

## Decision

1. **Every business and nonprofit card in Books → Entities gets its own road to full time.** It sits in a fold beneath the card, so the card stays as it was until it is opened.
2. **It reads what the business records.**
   - **Money in and out:** each complete month's real flow from the business's own transactions, averaged over its last three months that carry records (within a year).
     - Transfers between the family's own accounts are left out.
     - The month in progress is not a month.
     - A month with no records is absent data, not a $0 month.
   - **The work:** the hours a week on the business's active projects, turned into hours a month.
3. **It asks only what the app does not record:**
   - each owner's full-time pay and hours, in order;
   - the employer costs;
   - the reserve (DR-1128's 20% to start);
   - the next hire (1099 to start, per DR-1135);
   - **how much of the recorded costs is already the owner's pay.** There is no owner-draw category, so without this the same pay would be counted twice.
4. **It answers in revenue a month, not in units.** A business's income is not a count of identical sales, so each milestone is the monthly revenue at which it comes true:
   - each owner full time;
   - the next hire needed, when the work passes 80% of the owners' hours;
   - the next hire paid for.

   When the work outruns the money, it says by how much revenue, and names the same answer as DR-1135: raise the prices, slow what you take on, or fund the hire first.
5. **Two assumptions are printed on the screen, not hidden:** the costs stay where they are as revenue grows, and the work grows in step with it. Without project hours, the hire's timing is said to be unknown rather than guessed.
6. **Nothing is guessed.** No complete month of records names what to do: link the accounts, or set the business on a transaction. Any blank entry is named, and no answer is given until it is filled.
7. **PoeTech's own card (DR-1135) stays as it is**, family-only on Opportunities, because PoeTech's revenue is planned in units it sells. The engine underneath is shared: the 80% line and the 1099/W-2 rule are the same.

## Impact

- Every business whose books are kept here (Poe Properties, TLC, PoeTech, Moore Divahs once its entity is in the books, and any Business-tier owner's entities) sees its own road on the screen where its money already lives. No new tab, no new gate: it inherits Books' Financial private gate and each entity's `visibleTo`.
- No schema change. Owner pay and hours are entered on the screen and not stored. Storing them, and a real owner-draw category so the costs separate on their own, is the next step this record leaves open.

## Verification

- `business-road.test.jsx` (12 tests) covers these properties:
  - only this business's transactions count, an override included and another business's excluded;
  - the last three complete months with records are averaged, with transfers left out and the month in progress and older months not counted;
  - no complete month is said;
  - the work is the active projects' hours a month;
  - nothing is claimed without records or entries;
  - owner pay already in the costs is not counted twice;
  - revenue a month is given for each owner in order;
  - the hire is needed on the work and paid for on the money, with W-2 costing more than 1099;
  - without project hours the hire timing is unknown;
  - the screen shows the months and the work, asks only the rest, and answers;
  - a business with no records is told how to fill it in;
  - Books → Entities carries it under a business and not under the household.
- Proven to catch:
  - counting transfers as income or cost fails 2 tests;
  - counting the month in progress fails 3;
  - counting owner pay twice fails 4;
  - ignoring a transaction set on the business fails 3.
- **re-review:** 2026-11-20, with DR-1128 and DR-1135, once one business has entered its owner pay. Record whether the months it read matched its statements, and whether an owner-draw category is needed.
