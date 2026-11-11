# DR-1416: Every property is in the list, the asset is the answer, and it is one row of sub-tabs

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** B (a named button writes three mortgage fields to a property record; no schema)
**Type:** bug fix + feature
**Area:** `app/src/lib/mortgage-sources.js`, `app/src/lib/mortgage-calc.js` (`assetView`), `app/src/components/MortgageCalculator.jsx`, `app/src/components/MortgageCalculatorViews.jsx`
**Sent in by:** Darrell, 2026-11-10, a screenshot of the live drop-down showing only cards under Personal: "I don't see any mortgage in the list... fix it... it should be all debt... however we really want to know how assets are paid down and the benefits of that... also keep using our subtab procedures so scrolling is minimal"
**Pairs with:** DR-1413, DR-1415, DR-0381 (not hollow), DR-0076, the SectionTabs Way (2026-07-04, 2026-07-05)

## The defect: what DR-1413 got wrong

- **A property with no mortgage balance on file was left out of the list.** `loanGroups` skipped it and only counted it. `MONEY_HANDOFF.md` already recorded that the six First State Bank loans are not entered, so on the real household that rule removed the very mortgages the calculator was built for. I shipped it without reading that against the rule.
- **Mortgages were sorted under their entity,** so any that were listed sat below a long run of cards.
- **Everything was one long panel:** measured 2,000px tall at 360px with a loan chosen.
- **DR-1413 was filed Tier A;** a new product feature is Tier B (RELEASE-TIERS). This record and DR-1415 carry B.
- **Not seen:** Darrell's live records. The cause above is read from the code and the handoff, not from the NAS.

## Decision

- **Every property is listed, first.** Groups are by kind, then entity: properties being weighed, then "Properties and their mortgages" for each entity, then "Other debt". A property with no balance says "no mortgage on file" in the list and in words when chosen.
- **The figures can be entered once, here.** For a property, a Save tab shows the balance, rate and payment entered beside what the record holds, and one button writes those three fields to the property record through the shell's `updateRental`, the same fields the home-mortgage card edits. Nothing is written by looking.
- **The asset is the answer.** A chosen property opens on the Asset tab: value on file, owed, owned today and its share, owned after twelve more payments, the month it is owned outright, the payment freed after that, and with extra principal the months sooner, the payments never made and the interest never paid; with a rent on file, the rent kept once it is paid off. Equity is at the value on file, held still, and is not shown when no value is on file.
- **One row of sub-tabs,** the app's own `SectionTabs`: Loan, Costs, Extra, Asset, Summary, Schedule, Chart, then Keep or Save. The answer sits under the drop-down; one panel shows at a time.

## What was measured

Chromium at 360px with a household of 3 properties and 24 cards: the property groups precede all 24 cards; height with a loan chosen is 1,086px on the Asset tab with extra principal and 814px on Loan, against 2,000px before; no sideways scroll in cream or midnight, or at Big Print 44.

## Verification

- `mortgage-calculator-render.test.jsx`, 16 cases, among them **proven to catch**: a property with no mortgage is in the list and says so; twenty-four cards never precede a property; one tabpanel at a time; looking through every tab calls no writer; the Save button refuses until the figures are whole, then writes exactly `{balance, rate, monthlyPI}` once, and offers nothing when they already match.
- `mortgage-calc.test.js`, 4 new cases for `assetView` (no value on file gives no equity figure).

## Not done, and why

- **Lender, loan number, due day and grace period** still live on the confirmed bill (Bills → Review), not here. `re-review: 2026-11-24`.
- **A changing property value** (appreciation) is not projected; equity is at today's figure and says so. `re-review: 2026-12-08`.
