# DR-1413: Our own mortgage calculator, filled from our own records

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** A (additive, read-only; no schema, no record written, no money moved)
**Type:** feature
**Area:** `app/src/lib/mortgage-calc.js`, `app/src/lib/mortgage-sources.js`, `app/src/components/MortgageCalculator.jsx`, `app/src/components/money/MoneyLoanCalculator.jsx`; mounts in `MoneySections.jsx` (Debt Freedom) and `RealEstateDoor.jsx` (Real Estate)
**Sent in by:** Darrell, 2026-11-10, eleven screens of the phone calculator he uses beside the app: "We need our own mortgage calculator inside our PoeTech App where it makes sense..." then: "easy population of our actual numbers... based on a drop down for each asset... and debt to get rid of it... easy to see... not disturbing what we need already"
**Pairs with:** DR-0065 (build it in the app), DR-0061 (real data), DR-0076 (measure), DR-0099 (red), DR-1412 (text-sized grids), DR-1339 (file ceilings)

## Context

The app already projects the home mortgage (`lib/mortgage-payoff.js`) and the whole debt plan (Debt Freedom). It had no way to take ONE loan, a rental's mortgage, a card, or a house being weighed, and see its schedule and what extra principal does. Darrell was doing that in an advert-carrying phone app, retyping figures the app already holds.

## Reality trace

- **Real data:** `data.inflows.rentals[].mortgage` (balance, rate, P&I, escrow) with the value on file, and `deriveDebts()` for every other debt. The drop-down is those records, grouped by `entityId`, scoped to the entities the person may see.
- **Surfaces a person uses:** Money → Debt Freedom, under the home mortgage card; Real Estate → Properties, under the portfolio band.
- **Premise:** the property record keeps a payment and no term, so a loan on file is described by its payment; a new loan by its term.

## Decision

- **One pure engine.** Payment, month-by-month schedule, yearly roll-up, and monthly / twice-yearly / yearly / one-time extra principal, each from a chosen payment number. A payment that cannot cover the interest is refused in words.
- **One drop-down of real records.** Choosing a loan copies its figures in; a figure not on file is named as missing, never guessed. A new loan (price, down payment, rate, years) is the first choice.
- **Read-only.** Nothing is written to a property, a debt or the debt plan, and the card says so.
- **Mounted closed** in both places, so nothing already on those screens moves. `Rentals.jsx` is at its ceiling (3,220), so the Real Estate mount is one prop on an existing line and lives in `RealEstateDoor.jsx`.
- **No red on any figure;** theme classes only; grids sized by their text.

## What was measured

- **The arithmetic, against the reference calculator** ($80,000, 6.5%, 20 years from May 2023, $600 a month extra). Three rounding conventions were tried; only full precision with rounding on display matches every figure to the cent: payment $596.46; 2023 balances May to December; the 2025 months; all eight year rows; paid off April 2030 (84 payments, 13 years sooner); interest $19,601.02; interest saved $43,549.02; total with costs $779.79.
- **A real Chromium at 360px and 768px,** cream and midnight, all three views: no sideways scroll, 0 elements spilling. First render found the extra-principal bar segment dark-on-dark in midnight; fixed (the bar now takes the themed text color) and re-measured.
- **Big Print 44 at 360px:** no sideways scroll; the two native pickers clip their own text ("1402 Map…"), and the line beneath restates the choice in full.

## Verification

- `mortgage-calc.test.js`, 12 cases (the reference figures; the refusals; each extra-payment kind in its months).
- `mortgage-calculator-render.test.jsx`, 11 cases: the drop-down by entity; an entity the person may not see is absent; closed until opened; a chosen property fills in; the reference result on screen; a missing figure is named and nothing is drawn; **the records are byte-identical after use and no writer was called**; both mounts.

## Not done, and why

- **Rate changes over time (an adjustable rate) and saving a scenario into the debt plan.** The first is a second engine path; the second writes to the plan, which "not disturbing what we need already" rules out until Darrell asks for it. `re-review: 2026-11-24`.
- **The standalone Poe Properties door** does not mount it yet; that door's owner view is a separate surface. `re-review: 2026-11-24`.
- **A lender that rounds interest monthly** can differ by cents; said on the card.
