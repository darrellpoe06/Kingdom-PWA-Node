# DR-1436: The PoeTech+ keys finish and heal themselves daily: one paste of the key is the only hand

**Date:** 2026-11-12
**Status:** Accepted
**Tier:** C (real money). A daily run never installs a live key.
**Type:** decision
**Area:** `.github/workflows/poetech-plus-keys.yml`
**Sent in by:** Darrell, 2026-11-12, in substance: is this something he will need to do now and later, or can it be done now and automated for consistency? He added that Christina has Square and Stripe accounts, to look into too.
**Pairs with:** DR-1432 (the checkout), DR-0089 (a value only he holds), DR-0108 (challenge "must be by hand")

## Context
DR-1432 left two hand steps after merge: setting `STRIPE_SECRET_KEY`, and then running the keys workflow. If the Pages environment ever lost its Stripe secrets, nothing would notice or put them back.

## What was measured
- **The secret key cannot come from the house.** It is issued inside the account owner's Stripe dashboard, behind their sign-in, and it decides whose account the money lands in.
- **Everything after the key is already deterministic** (DR-1432): the Price, the webhook, the portal, the install, the redeploy and the live-site proof.
- **The checkout speaks Stripe's API.** Christina's Stripe account works unchanged: its key goes in the same place. Square is a different API and would need its own adapter.

## Impact
One paste of one key is the whole hand step, now and later. The house finishes the setup on its own and puts it back if it is ever lost.

## Decision
- **`poetech-plus-keys.yml` also runs daily** (10:23 UTC). A gate step decides:
  - no key: nothing happens;
  - a live key: never installed on a schedule (it still needs a dispatch typing CHARGE-REAL-MONEY), with a warning;
  - the live site already offers PoeTech+: nothing happens;
  - otherwise: install, redeploy and prove. This covers both the first run after the key is set and a lost environment.
- **Every later step is gated on that decision.** The cleanup step always runs.
- **Brakes.** One run at a time, a 20-minute cap, idempotent. Deleting the secret stops it.
- **Whose account.** Darrell's or Christina's Stripe works as is. Square waits on their choice; if they choose it, it is built as a second adapter on the same seam.

## Verification
- `workflows-parse` passes on all 100 files. The flow graph has 0 findings.
- The workflow ceiling was raised by hand, with the reason, to the measured 23,061 lines.
- **First scheduled run:** with no key set, it must log "No STRIPE_SECRET_KEY yet" and exit green. `re-review: 2026-11-13`.
