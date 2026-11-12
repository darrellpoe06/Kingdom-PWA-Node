# DR-1438: The payments firewall: only what the house made or tagged is recorded, and every checkout is mapped

**Date:** 2026-11-12
**Status:** Accepted (firewall built and proven; Square planned against verified docs, waiting on whose account)
**Tier:** C (real money, and a therapy practice's data line)
**Type:** decision
**Area:** `functions/api/stripe-webhook.js` (`isOurs`), `the-poetech-plus-checkout.test.js`
**Sent in by:** Darrell, 2026-11-12, in substance: Christina has Square and Stripe, so both options; and there is also a store and other checkouts, with their opportunities and constraints.
**Pairs with:** DR-1432, DR-1436, DR-1437, DR-0230, DR-0008 (TLC: zero PHI), DR-1064 (the covenant)

## Context
A webhook endpoint hears every event on the payment account it is attached to. Christina's accounts may serve TLC, a therapy practice. DR-0008 binds zero PHI (protected health information) in this house.

## What was measured
- **The webhook ledgered every `checkout.session.completed` on the account.** An untagged TLC session, with the client's email, would have landed in PoeTech's books.
- **Square, read from Square's own docs:**
  - A webhook signs HMAC-SHA-256 with the subscription's signature key, over the notification URL plus the raw body.
  - A subscription payment link takes a plan VARIATION id and cannot carry a customer id. Square finds the buyer by the phone number they enter, so linking a payment to a sign-in must go through the order.
- **Every checkout in the app:**
  - **PoeTech+.** Live once the key is set (DR-1432, DR-1437).
  - **Bookstore.** Built on the same seam, but armed only by a build flag (`VITE_CHECKOUT_ENABLED`), not by the server's own answer.
  - **Rent.** Hand-off only: Cash App, Venmo, Zelle, ACH, check or cash, with no processor, by design.
  - **Church giving.** The steward's own Cash App statement, read and never charged.
  - **Moore orders and TLC sessions.** Named in the books (`PRODUCT_ENTITY`), with no checkout of their own.

## Impact
A shared account can never put a stranger's payment, or a therapy client's details, into PoeTech's books or anyone's row. Every way the house takes money is now named, with what it does and what it waits on.

## Decision
- **The firewall (`isOurs`).** Only an event the house made or tagged reaches the books or a person's row:
  - our seam's sessions (`metadata.kind` is `book` or `subscription`);
  - a product the house tagged for its books (`PRODUCT_ENTITY`);
  - a renewal, update or cancellation carrying our subscription's tier and user.
  - Anything else is acknowledged, and nothing is written.
- **Square as the second processor.** It goes on the same seam: payment link, order `reference_id` to the user, and a webhook verified as above. It waits on one thing only: whose Square account takes PoeTech+ money. **Recommendation: a PoeTech account or location, never TLC's practice account.**
- **The store.** Bookstore checkout should read the server's open list as PoeTech+ does, not a build flag. This is the next build.
- **Rent and giving stay hand-off and read-only.** No processor fee on a family's rent or a gift.

## Verification
- **Proven to catch.** A shared-account session with a client email writes nothing; with the firewall removed, the test fails by name.
- **What still passes.** Our sessions, house-tagged products, and our subscription events.
- **Suites green.** `the-poetech-plus-checkout`, `payments-functions` and `payments-ledger`: 57.

`re-review: 2026-11-19` (Square account choice; Bookstore on the server's answer).
