# DR-1451: Square joins the seam: two processors, one checkout, one firewall

**Date:** 2026-11-12
**Status:** Accepted (built and proven; activation is one paste of the Square token and location)
**Tier:** C (real money; a second account's webhook hears a therapy practice's payments)
**Type:** decision
**Area:** `functions/_lib/square.js` (new), `functions/api/square-webhook.js` (new), `functions/api/checkout.js` (`openProcessors`, `chooseProcessor`, the Square branch), `functions/api/deliver.js` (`square_order`), `lib/store-catalog.js` (`processors`), `lib/instant-delivery.js`, `lib/workshops.js`, `components/Storefront.jsx`; `lib/payments-ledger.js` + the Stripe mirror (entity from the kind)
**Sent in by:** Darrell, 2026-11-12: "what about the square account both work?"
**Pairs with:** DR-1438 (Square planned on the same seam, waiting on whose account), DR-1436 (a second adapter), DR-1449 (the storefront), DR-1448, DR-0076, DR-0236 (buildable now is built now)

## Context
DR-1438 planned Square as the second processor and left it waiting on whose account takes the money. The account choice gates ACTIVATION, never building (DR-0225); the adapter is buildable from Square's own reference, so it is built.

## What was measured (Square's reference, read 2026-11-12)
- **Payment links:** `POST /v2/online-checkout/payment-links` takes an `order` (location, `reference_id` ≤ 40, `metadata` ≤ 10 keys of `[a-zA-Z0-9_-]`, values ≤ 255), `checkout_options`, `pre_populated_data.buyer_email`; `PUT .../{id}` updates `checkout_options`. The redirect is set AFTER creation so it carries the order id Square minted; no pay-what-you-want exists, so a pwyw entry charges its preset here.
- **Webhook:** `x-square-hmacsha256-signature` is base64 HMAC-SHA-256 over the notification URL + raw body with the subscription's key; `payment.updated` carries `status` (COMPLETED), `order_id`, `amount_money`, `buyer_email_address`, `processing_fee[]`.
- **Orders:** `GET /v2/orders/{id}` returns `metadata`, `state`, `tenders`, `net_amount_due_money`.
- **A subscription** takes a plan variation and finds the buyer by phone; a renewal's order carries none of our metadata.

## Decision
- **One seam.** The client POSTs the same request with `processor: 'square'`; `GET /api/checkout` names the open processors, the owner's `PAYMENTS_PROCESSOR` first; the store's Buy button is the first, the second is offered beside it. A processor that is not open is refused by name, never silently swapped.
- **The same truth on the order.** The line item is the catalog's cents or the event row's; the order metadata carries `house: poetech`, kind, product, grants, userId, userKey, eventId, instanceId, exactly what the Stripe session carries.
- **The same firewall.** `/api/square-webhook` verifies the signature, reads the ORDER, and writes only when the metadata says ours: one `payments` row keyed by the PAYMENT id (created and updated events name the same money, counted once), fee from `processing_fee`, the book granted per bundle entry, the seat held. Anything else is acknowledged and nothing is written.
- **Delivery on return** by `square_order`: the paid order's grants, no email (Square keeps the receipt).
- **Entity from the kind.** A book or seat sold under its own id lands in `e-personal` by its kind, no longer `unassigned`; engine and mirror together.
- **Not built, by name:** a Square SUBSCRIPTION. PoeTech+ stays on Stripe; `square-subscription-not-built` is the server's answer. `re-review: 2026-11-26`.
- **Whose account.** Still the recommendation of DR-1438: a PoeTech Square account or location, never TLC's practice account. One paste of `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_WEBHOOK_SIGNATURE_KEY` and `SQUARE_WEBHOOK_URL` on the Pages project opens it.

## Verification
- **`the-square-adapter.test.js`, 23 green.** Proven to catch: a client amount never reaches the order; a wrong key, URL or body fails the signature; a shared account's order writes nothing; the grant calls asserted by URL; `catalogEntryShape` and `PRODUCT_ENTITY` conformance to the checkout and the ledger.
- `storefront.test.jsx` 7, `the-sovereign-storefront` 17, `the-poetech-plus-checkout` + `payments-functions` 43, `payments-ledger` 14, `workshops` 8 green; lint clean.
- NOT YET PROVEN (P66): a live Square sandbox round trip; it needs the token only the account owner mints.
