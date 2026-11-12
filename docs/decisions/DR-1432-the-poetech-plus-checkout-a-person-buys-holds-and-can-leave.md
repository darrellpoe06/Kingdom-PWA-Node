# DR-1432: The PoeTech+ checkout: a person buys it, holds it, and can leave

**Date:** 2026-11-12
**Status:** Accepted (built and proven in CI; nothing is charged until the Stripe key is installed, and nothing is locked)
**Tier:** C (real money). Built with its brakes; it goes live only after a proven test-mode purchase.
**Type:** decision
**Area:** `functions/api/checkout.js`, `stripe-webhook.js`, `billing-portal.js` (new), migration 0321, `lib/poetech-plus.js`, `PoeTechPlusButton.jsx`, `PoeTechShowcase.jsx`, the shell's tier sync, `poetech-plus-keys.yml` and `scripts/poetech-plus-keys.mjs`
**Sent in by:** Darrell, 2026-11-12: "build the PoeTech+ checkout"
**Pairs with:** DR-1428, DR-1430 (PoeTech+ at $39, access not the app), DR-0230 and DR-0263 (the money lane), DR-0108 (challenge "must be by hand")

## Context
DR-1428 priced the deeper levels of the PoeTech subjects at PoeTech+ ($39 a month) for one person, in either app. The money lane from DR-0230 and DR-0263 already had a checkout endpoint and a signed webhook. Going live was left as about 30 minutes of the Governor's hand: four values pasted into Cloudflare.

## What was measured
- **The buyer was whatever the client said.** `userKey` came from the request body, and nothing on the server checked who was buying.
- **The tier landed on the household.** The webhook PATCHed `instance_subscriptions` for the session's instance, falling back to `PAYMENTS_INSTANCE_ID`, the family's. One stranger's purchase would have raised the Poe household's tier and left the buyer on Foundation.
- **Nothing ended a membership.** No event handled cancellation or a failed card, so a cancelled member would have kept the tier forever.
- **A first payment was counted twice.** For one sale, the books received both `checkout.session.completed` and `payment_intent.succeeded`, under different event ids. The second row had no product.
- **There was no way to buy.** The app's tier is device data (`data.userTier`), and no screen offered PoeTech+.

## Impact
A person can buy PoeTech+ from the Love Corner or PoeTech, see that it is theirs on every device, and manage or cancel it themselves. The books count each dollar once. The go-live shrinks from four pasted values to one secret.

## Decision
- **The buyer is proven.** A subscription checkout requires the caller's session, which the sovereign auth server checks (`/auth/v1/user`). The verified user id goes on the session (`client_reference_id` and metadata) and on the subscription itself.
- **One row per person.** Migration 0321 adds `member_subscriptions`, keyed by user. It is written only by the webhook with the service key, and each person can read only their own row through RLS. Nobody signed in can insert or change a row, so nobody can grant themselves a tier.
- **The webhook follows the person.**
  - A paid checkout creates or updates the buyer's row.
  - `customer.subscription.updated` and `customer.subscription.deleted` change only that person's row, for that subscription. This covers renewals, failed cards (past due) and cancellations.
  - The household PATCH is retired.
  - A failed write answers 500, so Stripe retries; the books write is idempotent.
- **Money is counted once.** Only the checkout session and renewal invoices (`subscription_cycle`) reach the books. `payment_intent.succeeded` is acknowledged and not counted.
- **The app follows the row.**
  - Family members keep their grant. Everyone else holds what their own row says, or Foundation, so a cancellation takes effect too.
  - A read that does not answer changes nothing.
  - A failed card keeps the tier for 14 days past the paid period.
- **The button tells the truth.** `PoeTechPlusButton` appears on the PoeTech-subject course card in both apps and on the upgrade prompt where a view unlocks at PoeTech+.
  - **Get PoeTech+** shows only when `GET /api/checkout` says the tier is open; any other answer (including the site shell) reads as closed.
  - Once it's yours, the button becomes **Manage or cancel** (Stripe's portal, reached through `/api/billing-portal` with the person's own session).
- **One value of his.** `poetech-plus-keys.yml` takes `STRIPE_SECRET_KEY` and does the rest:
  - creates the $39.00/month Price, refusing any other amount;
  - creates the webhook and its signing secret, and the cancel portal;
  - installs the Pages secrets, redeploys, and proves the live site offers PoeTech+.
  - A live key is refused unless the run is dispatched with CHARGE-REAL-MONEY.
- **Still nothing is locked.** `ACCESS_ENFORCEMENT` stays false until a test purchase is proven end to end.

## Verification
- **`the-poetech-plus-checkout.test.js`, 21 cases.** Proven to catch:
  - a signed-out POST reaching Stripe;
  - the site shell's HTML read as "open";
  - a cancellation that never lands;
  - the double count (made to fail by adding `payment_intent.succeeded` back);
  - a failed read lowering a tier (made to fail by dropping the `ok` check).
- **`payments-functions.test.js`, 20 cases.** It now pins the buyer's row and proves `instance_subscriptions` is never written.
- **`a-lesson-link-opens-in-its-own-app.test.js`, 20 cases.** The card renders in PoeTech without its self-link.
- **0321 smoke, on a real PostgreSQL 16, applied twice.** A member reads only their own row, cannot insert, update or delete, anon reads nothing, and Foundation is never stored as a purchase. It caught a planted read-all policy and a planted self-update, each by name.
- **Gates.** Interconnect, RLS-matrix, replay, endpoint and workflow registers are all green. The shell stays at 5,185 lines. The workflow ceiling is raised by hand to the measured 22,942 lines, with the reason.

**Waiting on Darrell (DR-0089: a value only he holds):** his Stripe secret key, test mode first. Then: one test purchase, the row read back, and a cancel. `re-review: 2026-11-25`.
