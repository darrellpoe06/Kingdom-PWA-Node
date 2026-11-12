# DR-1437: PoeTech+ is bought from the pricing page's own Checkout window

**Date:** 2026-11-12
**Status:** Accepted
**Tier:** B (a new place a person meets the real checkout; nothing charged until the key is set, DR-1436)
**Type:** decision
**Area:** `app/src/components/About.jsx` (the Checkout window), `the-poetech-plus-checkout.test.js`
**Sent in by:** Darrell, 2026-11-12, in substance: where does checkout live? Inside which app, both, all, or a tab to check out?
**Pairs with:** DR-1432 (the checkout), DR-1436 (the keys heal themselves), DR-0065 (the app is where it lives)

## Context
DR-1432 put the buy button where a person meets PoeTech+ in a lesson:
- the PoeTech-subject course card, in both apps;
- the upgrade prompt on a view that unlocks at PoeTech+.

Neither is a place someone goes on purpose to buy.

## What was measured
- **About already has the place.** The PoeTech pricing ladder has a "🛒 Checkout" window for every tier (`openCart`).
- **That window took no payment.** It mailed a subscription request (`Subscribe: PoeTech+ (monthly)`). So the screen titled Checkout could not check out.

## Impact
There is now one place to go on purpose to buy PoeTech+: About, then pricing, then PoeTech+, then Checkout. That place really pays. The two places a reader meets PoeTech+ inside a lesson keep their button too.

## Decision
- **For the PoeTech+ tier, the Checkout window opens with the real checkout** at the top, under "Pay for PoeTech+ now" (`PoeTechPlusButton`). That is the same button, the same truthful states and the same Stripe page as DR-1432.
- **The email request stays below it** for every tier, and for PoeTech+ while checkout is not yet open.
- **The button appears in three places, all reading the one server answer:**
  - the pricing Checkout window;
  - the PoeTech-subject course card, in both apps;
  - the upgrade prompt.

## Verification
- `the-poetech-plus-checkout.test.js` (21 green): it pins the PoeTech+ branch of the Checkout window and the button inside it.
- `about-sections-render.test.jsx` 5 green; lint is clean.
