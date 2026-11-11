# DR-1415: A property we are weighing is kept by name, in a list of its own

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** B (a new product feature; one new key in the household's own Money settings, no schema; self-verified by test and in Chromium)
**Type:** feature
**Area:** `app/src/lib/purchase-prospects.js`, `app/src/lib/use-prospects.js`, `app/src/lib/mortgage-sources.js`, `app/src/components/MortgageCalculator.jsx`; one prop on an existing line in `Rentals.jsx` and the shell
**Sent in by:** Darrell, 2026-11-10: "I also want to be able to use it for potential properties we are looking to potentially purchase and other users will also want that type of functionality"
**Pairs with:** DR-1413 (the calculator), DR-0060 (tenancy), DR-0061 (real data), DR-0076 (measure)

## Context

DR-1413's calculator could work out a new loan, and forgot it the moment the screen closed. A house being weighed is looked at many times, by more than one person, before it is bought or passed over.

## Reality trace

- **Searched first:** no record of a prospective purchase exists in the app. `modules/properties/development.js` holds ground-up builds, a different thing.
- **Where it is kept:** `data.moneyPlan.prospects`, written through the shell's `setData` and `patchMoneyPlan`. That key rides the household snapshot, one row per instance (`lib/money-plan.js`), so each household keeps its own list and no household reads another's. No sync code changed.
- **Premise:** a prospect is not a property on the books. It has no door, no tenant and no mortgage.

## Decision

- **Name it and keep it.** On a new loan, the Keep tab takes a name or address and, optionally, the entity that would hold it. It will not save without a name and a price or amount borrowed, and says which is missing.
- **It comes back whole.** The list opens with "Properties we are weighing"; choosing one restores every figure typed, the extra principal included. Saving again updates the same row; Remove deletes it. Capped at 50.
- **Expected rent.** With a rent entered, the answer shows what is left from the rent after the payment and costs, or how far short it falls, labelled "before repairs and vacancy".
- **It is counted nowhere.** Not in properties, debts, Safe to Spend or any total.
- **A seat that cannot write** sees the list and no Keep tab.

## Verification

`weigh-a-property.test.jsx`, 8 cases: only the known figures are stored; replace by id; the cap; a malformed stored row is ignored; an entity the person may not see hides its prospects; the full journey (enter, refused without a name, save, leave, return with every figure, change, remove) with the property and debt records unchanged throughout; the rent falling short; the read-only seat; the Real Estate mount writing the same list.

## Not done, and why

- **Not proven on the live database.** The sandbox has no route to the NAS. The key follows the same path as the rest of `moneyPlan`, which Darrell's device reported synchronized on 2026-11-05. `re-review: 2026-11-17`, on his first saved prospect.
- **Turning a prospect into a property** once it is bought is one tap that does not exist yet. `re-review: 2026-11-24`.
