---
id: DR-0263
title: Monthly subscriptions — the machinery is whole (activation write built); going live is the Governor's keys
status: accepted
date: 2026-08-03
tier: C
declared_by: Darrell ("Can they purchase a monthly subscription? Comprehensive review also research the opportunities and constraints")
supersedes: none
builds_on: [DR-0230 (live payments bricks), DR-0219 (SHOULD/ARE), DR-0076 (verification), DR-0111 (real money is a bright line held by the Governor)]
principles: [MONEY-IS-THE-OWNERS-HAND, VERIFICATION-DOCTRINE, DATA-AS-EMPOWERMENT]
---

## The question and the straight answer

**Can a user purchase a monthly subscription today? Not yet — by design.**
Every part of the lane is built and gated on values only Darrell holds; the
one code gap found in this review (the entitlement-activation write) is now
built. What remains is exactly the his-hand set: a Stripe account, its keys
in the Cloudflare Pages env, and tier Prices — the standing rule "money is
the owner's hand" made literal.

## The SHOULD/ARE trace (DR-0219)

**Built and verified (file-cited):**
- Client seam: `checkout-seam.js` builds one-off AND `mode: 'subscription'`
  checkout requests; unconfigured ⇒ preview-only, cannot charge.
- Server: `functions/api/checkout.js` (DR-0230) — the only hand that talks
  to Stripe; **price truth is server-side** (client amounts are display copy;
  subscriptions charge the Stripe Price in `STRIPE_TIER_PRICES`); missing
  env ⇒ honest 503.
- Webhook: `functions/api/stripe-webhook.js` — signature-verified
  (constant-time HMAC, 5-min tolerance), append-only `payments` ledger,
  idempotent under Stripe retries.
- Tiers priced in the schema: poetech-plus $9 / family $19 / premium $49 /
  business·landlord $99 / enterprise $299+ (schema-v2.1 CHECK list).
- Trial: 90 days anchored server-side; day 91 falls to free Foundation —
  never a lockout (trial-status.js / entitlements.js).

**The gap this review found and CLOSED (same session):** the webhook wrote
the ledger but never flipped `instance_subscriptions` — a paying member's
money would land while their tier stayed Foundation until a hand fixed the
row. Built: `subscriptionActivation` (pure decider — only a SETTLED
`checkout.session.completed` with `kind=subscription` and a schema-valid paid
tier activates; book purchases, unknown tiers, unpaid sessions return null)
plus a PATCH of the instance's existing subscription row (tier, status
'active', Stripe ids, period start). PATCH-only by design — the table's
`created_by uuid NOT NULL REFERENCES auth.users` cannot be satisfied from
email-keyed metadata, so a missing row is REPORTED (`no-subscription-row`)
never blind-inserted; the payment stays ledgered and the gap is visible where
the tier reads from the same table. Proven-to-catch both directions in
payments-functions.test.js (20 green).

## Go-live — the Governor's steps (all his custody, ~30 min)

0. **Confirm the price ladder FIRST (found 2026-08-03, REV-0223):** the repo
   carries TWO ladders — the stale schema comments ($9/$19/$49/$99/$299) and
   the OPERATIVE in-app ladder every surface and the moat math run on
   (**Foundation free · PoeTech+ $39 · Family/Household $89 · Premium $149 ·
   Business $249**, +$8/door landlord add-on), with a $39-vs-$39.99 drift on
   PoeTech+ (DR-0184 said $39.99; the shell label and tier math say $39).
   ACCESS-AND-ONBOARDING-MODEL.md already carries this as the "pricing
   reconciliation — pick one before either store submission" item. Whatever
   Prices are created in Stripe ARE the charge — the pick must precede the
   keys. Recommendation: **$39 / $89 / $149 / $249 flat** (the ladder in
   force everywhere; flat numbers, no .99 psychology, match the house's
   plain-dealing voice); on the Governor's word the schema comments and the
   .99 copy sweep to the one number and a price-consistency gate holds it.
1. Stripe account → create Products/Prices for the paid tiers (monthly).
2. Cloudflare Pages env: `STRIPE_SECRET_KEY`, `STRIPE_CATALOG`,
   `STRIPE_TIER_PRICES` ({"tier":"price_..."}), `STRIPE_WEBHOOK_SECRET`,
   `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, optional `PAYMENTS_INSTANCE_ID`.
3. Stripe webhook → `https://poetech.us/api/stripe-webhook`
   (checkout.session.completed, payment_intent.succeeded).
4. First live proof: a $0.50-class test purchase end-to-end — ledger row +
   tier flip + Bookstore unlock — before any member is pointed at it.

## Opportunities / constraints (researched, tiered per DR-0100)

- **Opportunity:** day-83 "ending soon" phase is machine-readable — an
  upgrade nudge email/push lane can key on it with zero recomputation.
- **Opportunity:** the Admin panel already reads the same subscription table
  — activations are visible with no new surface.
- **Constraint (fact):** Stripe subscription lifecycle beyond the first
  settle (renewal failures → past-due, cancellations → cancelled) is NOT yet
  handled — HANDLED_EVENTS covers settles only. The member would keep
  'active' until manually corrected. **re-review: 2026-08-17** (add
  customer.subscription.updated/deleted handling before real members
  subscribe, or accept manual for the family-scale start).
- **Constraint (fact):** in-app purchase rules apply only if distributed via
  Play Billing later; the current TWA/self-hosted lane charges via Stripe on
  the web — the DR-0152 store-signing decision governs that path.
- **Honest limit:** end-to-end cannot be proven from CI — the first live
  Stripe test purchase is the witness, and it needs the Governor's keys.
