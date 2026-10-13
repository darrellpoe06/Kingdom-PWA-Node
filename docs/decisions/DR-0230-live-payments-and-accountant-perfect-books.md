---
id: DR-0230
title: Live payments (receive currencies) + accountant-perfect books — the money gate opens by design, taxes organized as we go
status: accepted
date: 2026-07-23
tier: C
declared_by: Darrell
supersedes: []
amends: [checkout-seam (owner's hand), DR-0117 (declared pricing), RELEASE-TIERS (real money = Tier C)]
principles: [TIER-C, VERIFICATION-DOCTRINE (DR-0076), DATA-AS-EMPOWERMENT, THREE-BRAKES-ARE-BUILD-REQUIREMENTS (DR-0225), TRANSPARENT-OPS (DR-0228)]
---

## The word (Darrell 2026-07-23)
"We are building the ability to receive currencies?" — "Live payments,
correct?" — "What about the end of year taxes that this will need to be
processed as well?" — "Our Accountant can review however we want it
organizationally perfect based on what is up to date etc."

## Decision — the directive, registered
1. **YES — live payments is now directed build work** (DR-0225 posture: build
   it with the safeguards designed in; the first live charge is the Governor's
   proof step). Today's true state: the RAILS exist (checkout intents, order
   inquiries, declared pricing DR-0117, processor-fee math in commerce.js,
   subscriber records with a stripeCustomerId seam) and the PROCESSOR is not
   wired — every purchase is an intent for the owner's hand.
2. **The build**: Stripe as processor (question-2/5 of DR-0226: joins the
   existing seam), server-side checkout via the same-origin function layer,
   webhook → a real PAYMENTS ledger table (append-only, instance-scoped, RLS),
   every payment flowing INTO Books as a transaction the moment it settles —
   one money truth, no side ledger.
3. **Accountant-perfect books, continuously — not an April scramble**: every
   received payment lands categorized (which business entity, which
   product/service, fee split out), feeding the EXISTING tax rails (Books →
   1099s tab, the All-income/All-outputs standard reports DR-0212,
   nas-tax-ingest). End-of-year = the accountant REVIEWS an always-current,
   organizationally perfect record — exportable, entity-separated,
   fee-reconciled. The system organizes; the accountant judges.
4. **Gates that hold**: keys are Darrell's custody (never in the repo);
   test-mode proven end-to-end in CI before any live key; the FIRST live
   charge is a watched Governor step (DR-0107 discipline applied to money);
   refunds/audit trail (CAGE) from day one.

`re-review: 2026-07-25` — the build starts as the next major increment.
