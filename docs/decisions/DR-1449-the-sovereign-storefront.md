# DR-1449: The sovereign storefront: a Payhip-class store on our own door, our own seam

**Date:** 2026-11-12
**Status:** Accepted (built and proven; the first live sale is the watched step)
**Tier:** C (real money: two new pricing shapes and a public door)
**Type:** decision
**Area:** `lib/store-catalog.js`, `lib/store-pricing.js`, `lib/store-profile.js`, `lib/instant-delivery.js`, `functions/api/deliver.js` (new); `functions/api/checkout.js` (`catalogEntry`, `openBooks`, pay what you want, promotion codes, bundle grants); `functions/api/stripe-webhook.js` (`bookEntitlementGrants`); `components/Storefront.jsx` (new, surface `store`); `Bookstore.jsx`, `Library.jsx`; `nav-items.jsx`, `nav-history.js`, the shell (+1 render line)
**Sent in by:** Darrell, 2026-11-12, with a Payhip storefront link, in substance: make our store have this capability; then, do we need that, or can we do it sovereign? Opportunities and constraints.
**Pairs with:** DR-1448 (the product line), DR-1432 (the checkout), DR-1438 (the firewall; its named next build, the store on the server's answer, closes here), DR-0536 (never the Word), DR-0076

## Context
The store sold three typed books behind a sign-in, armed by a build flag; a Payhip-class store is a public page with instant downloads, pay what you want, coupons and bundles, on a platform that keeps the buyer list and a cut.

## What was measured
- **payhip.com and acrobat.adobe.com are outside the sandbox allowlist**; both allow requests were declined. Payhip's capability set is stated from training knowledge and is unverified here; the live page is filed as research item `7b4128a5` for the NAS lane to read, with the Acrobat course as `e8294305`.
- **Sovereign vs Payhip.** Payhip's price is a per-sale cut plus the buyer list and the storefront living on its domain. Everything it does that this house wants rides what the house already owns: Stripe through our own Functions, our own door, our own corpus; the one thing it does that we do not is send the delivery email, and Stripe's receipt covers that.
- **The Bookstore read a build flag, not the server** (DR-1438's finding, still open).

## Impact
A visitor browses the whole store without an account; a book bought as a guest is in hand the moment Stripe sends them back; the owner prices a book fixed, pay what you want, or as a bundle, from one catalog entry the server and the store read alike; coupons are Stripe's own.

## Decision
- **One public surface, `store`** (`Storefront.jsx`): the seller's face first, then books, bundles, courses, open workshops and the membership, from the sources the house keeps (`store-catalog.js`); a share link for the store and each product.
- **The server's answer is what is for sale.** `GET /api/checkout` now carries `books` (priced entries with a key); the Bookstore and the storefront read it, never a build flag.
- **One catalog entry shape, mirrored and conformance-tested:** an integer or `{ cents }` is fixed; `{ pwyw: { min, preset } }` lets the buyer name the price on Stripe's page from a minimum the server holds; `grants` makes a bundle. Promotion codes are allowed unless `STRIPE_PROMOTION_CODES=off`.
- **Instant delivery:** `/api/deliver` asks Stripe what a paid session of ours bought and answers only the product ids and the receipt email; the app grants the device entitlement and builds the EPUB, HTML and Markdown itself. A signed-in buyer's rows are written by the webhook too, one grant per book of a bundle.
- **Reviews:** a holder of the book leaves one rating (1 to 5) and a line in its gated conversation (migration 0323, kind `review`); the shelf shows the count and average to anyone through `book_review_summary()`, numbers only.
- **Carve-outs, named:** a delivery email of our own needs a sender key only Darrell holds (Stripe's receipt carries the line meanwhile); affiliates move money to third parties, a new bright line not yet decided. `re-review: 2026-11-26` with DR-1448's.

## Verification
- **`the-sovereign-storefront.test.js`, 17 green; `storefront.test.jsx`, 6 green.** Proven to catch: a pwyw entry below its minimum is refused; a client amount never reaches Stripe; a bundle stamps and grants every book, three grant calls asserted by URL; a session that is not paid, not a book, or not ours delivers nothing; the delivery answer carries no Stripe amount; a closed book never posts; a draft bundle never reaches the shelf.
- Lint clean; the flow graph placed the three new nodes; the endpoint register regenerated with the new function; the monolith grew by the one render line, recorded.
