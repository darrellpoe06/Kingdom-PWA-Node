# POS Finance Through the PoeTech App — Opportunities and Constraints

**Date:** 2026-07-07
**Type:** Discovery / assessment (Layer 4 working artifact)
**Requested by:** Darrell — "I would love to add the POS side of processing finances through the PoeTech App. Opportunities and constraints."
**Status:** Assessment delivered; staged path recommended below. No code shipped in this note.

---

## 0. The premise, traced against what is already decided

"Processing finances" splits into two very different things, and the platform has already decided one of them:

- **Recording money** (what was sold, for how much, how it was collected, receipts, reconciliation) — the app already does this everywhere, and does it well.
- **Moving money** (the card tap, the charge, the settlement) — the platform has a standing, structurally-enforced rule that the app **never** does this. It is the checkout-seam / "money is the owner's hand" doctrine, stated in at least four binding places:
  - **DR-0019** (2026-06-09): *"Do NOT build a money rail. Integrate an established contractor-payments platform … as an accepted, swappable vendor dependency; LLMs orchestrate logic, platform owns compliance."*
  - **DR-0117** (2026-07-07): *"Payments are recorded, never processed — money moves by the owner's hand … no card/bank fields exist in the shape."*
  - `app/src/lib/checkout-seam.js:3-8`: the build does not process payments or hold card/bank details; a real processor (Stripe) handles money under Darrell's own account, secret keys server-side only.
  - `app/src/lib/moore-divahs.js:25-29` and `infra/supabase/migrations-auto/0083-moore-divahs-orders.sql`: *"NO PAYMENT DATA, EVER … No card/bank columns exist by design."*

So the honest framing is: **POS through the app is very achievable — and the right architecture is already designed.** The app becomes the point of sale's *brain* (catalog, totals, fees, records, receipts, ledger), while an established vendor rail (Stripe, or the merchant's own Square) remains the *hands* that touch the card. DR-0019 didn't forbid POS; it decided *how* POS gets built. Nothing below requires overturning a standing decision — only activating seams that were built for this.

---

## 1. What already exists (verified in the code)

| Capability | Where | State |
|---|---|---|
| Transactions ledger, categories, reconciliation attestation | `app/src/components/BooksTransactions.jsx`, `app/src/lib/transactions-sync.js` (Supabase `transactions`) | Live |
| Fee math / unit economics (2.9% + $0.30 processor model) | `app/src/lib/commerce.js:32-36` | Live |
| Order pipeline with recorded payments (`pay_method`: square/venmo/apple-pay/cash) | `app/src/lib/moore-divahs.js`, `custom_orders` table | Live (Moore Divahs) |
| Deposit-gated client billing ($500 recorded deposit unlocks build) | `app/src/lib/client-engagements.js:132-136` (DR-0117) | Live |
| Stripe checkout seam — previews only, never charges until configured | `app/src/lib/checkout-seam.js` → `/n8n/webhook/book-checkout`, `/n8n/webhook/subscribe` | Built, **wired off** (`Bookstore.jsx:40` `enabled: false`) |
| Server-verified webhook → entitlement grant mapping | `checkout-seam.js:96-114`, `0051-book-commerce.sql` | Built, awaiting a live processor |
| Tier ladder + trial + `activatePaid({tier, stripeCustomerId})` | `app/src/lib/entitlements.js:125-128` | Built, no billing fires yet |
| Church giving — link-out to the church's own secure page | `app/src/lib/giving.js:10-13` | Live (binding: stays external) |
| Receipts / ledger integrity / verified sync | `receipts.js`, `ledger-integrity.js`, DR-0090 | Live |

**Real money movement inside the app today: none.** Every money surface is record-keeping or a link-out. That is by design, and it means the POS *recording* layer is roughly 80% built already.

---

## 2. Opportunities

### 2.1 POS-as-recorder — the counter screen (nearest, cheapest, no rail needed)
A phone/tablet "counter mode" surface: pick items (catalog from `commerce.js` / `shop_inventory`), compute the total and change, take payment **by the owner's hand** (Square reader, Venmo, Apple Pay, cash — exactly the Moore §7 posture), record the sale with `pay_method`, issue a receipt, feed the verified ledger. This is a new *surface* over existing engines — no new money capability at all. It serves Shay's pop-ups and classes today, and any Business-tier client tomorrow. **Tier B** (new feature, visual change; no real money flow).

### 2.2 Hand-off POS — deep-link into the merchant's own processor
The app computes the sale, then hands the amount to the merchant's *own* payment app (Square Point of Sale supports app-switch deep links with a prefilled amount; the charge happens in Square's app under the merchant's account), and records the completed sale on return. Card data never approaches PoeTech; money moves entirely under the owner's account. This is the strongest "POS through the app" experience available *without* crossing the real-money line — the app is the register, the vendor is the drawer. *(The Square app-switch API capability is a training-data claim — verify against Square's current docs before building; DR-0076.)*

### 2.3 Activating the Stripe seam for PoeTech's own billing (already roadmapped)
The 2026-06-01 master plan's "Ship 5": Stripe Payment Links + customer portal + n8n webhook flipping `instance_subscriptions` / `activatePaid()`. Every paid-tier promise ($39–$249/mo ladder) is currently a `mailto:` handshake (`Cart.jsx:85-94`). This is the highest-leverage single money activation on the books — it is PoeTech's own POS, for subscriptions. **Tier C** (real money flow).

### 2.4 Card-present for merchants — the vendored rail, when a real merchant asks
Stripe Terminal or the merchant's Square hardware as the swappable vendor per DR-0019, driven from the app's counter surface. This is the full POS vision. It waits for a named merchant need (Shay is the natural first) and rides Tier C end to end.

### 2.5 The serve-not-extract moat, applied to sales
The church-giving pitch already written for GTM — *"keep 100% of the offering; pay a fair flat subscription"* — generalizes to merchant POS: **PoeTech never skims a transaction fee.** The merchant pays their processor's fee (which `commerce.js` already surfaces honestly on the cost-efficiency screen) and a flat PoeTech subscription. Square/Shopify/Clover monetize the skim; we structurally can't and won't (DATA-AS-EMPOWERMENT). That difference is the competitive story for the Business tier.

### 2.6 Church adjacencies (not giving)
Conference/event registration (`venue_bookings` variance tracking already exists), bookstore tables, meal-fundraiser sales — counter-mode recording with owner-hand collection serves COLG without touching the giving bright line.

---

## 3. Constraints (each one is already law here — cited)

1. **Never build a money rail** (DR-0019). Processing is always an established vendor, swappable, with the vendor owning PCI compliance.
2. **Card data never touches the app or the NAS** (checkout-seam doctrine; MARKETPLACE-ARCHITECTURE: hosted fields only). No card/bank columns exist in any table — keep it that way structurally, not by policy.
3. **Secret keys live server-side only** — in n8n behind the same-origin `/n8n` rewrite (`vercel.json` / `app/functions/n8n/[[path]].js`), never in the repo or the client (`checkout-seam.js:3-8`).
4. **Any real money flow is Tier C, always** (RELEASE-TIERS flowchart Q1): ~1 week soak, structured family review, Christina co-governs money flow, Quality Gatekeeper sign-off. "Additive" or "NAS-only" never downgrades it. Opportunities 2.1–2.2 stay short of the line; 2.3–2.4 cross it and take the full lane.
5. **The browser currently blocks payment APIs on purpose** — `Permissions-Policy: payment=()` in `vercel.json` headers. Loosening it is part of Tier C scope, not a casual header edit.
6. **A PWA cannot be the card reader.** Tap-to-Pay / card-present requires native SDKs or vendor hardware. The web app can present Payment Links, redirect to hosted checkout, and deep-link to vendor apps — the tap itself is always vendor-owned. This bounds the architecture, and it happens to bound it exactly where our doctrine already stands.
7. **Church giving stays on the church's own secure page** (2026-07-05 church-process-review; Bishop Gwin's decision; `giving.js` never invents a payment URL). POS never absorbs donations.
8. **`purchase.any` stays locked-deny for non-stewards** (DR-0094): seeing money is grantable; spending is not. POS is a steward/owner surface.
9. **Tenancy** (DR-0060): every POS record is `instance_id`-scoped under RLS like everything else; per-merchant money data isolation is gate-enforced, and the gate must be proven-to-catch for any new table.
10. **The BUSINESS-PROCESS-CONNECTIONS four-question test + timeline** applies to any buy-surface before it ships: what does it invite / what pipeline carries it (refunds! receipts! fulfillment!) / who governs volume / what's the visible promise. A "Buy" button without a wired refund policy and fulfillment pipeline does not ship.
11. **No transaction skim, no upsell of stewardship** (BIBLICAL-ECONOMICS-TEACHING-PATTERNS: the family financial system stays free; COMMUNITY-FIRST flat pricing). POS revenue is the flat Business-tier subscription, never a percentage.
12. **Webhook handlers are event-driven and fine; anything *scheduled* that touches money takes the three brakes** (budget, concurrency lock, kill-switch) and ships inactive.
13. **Verification doctrine end-to-end** (DR-0076/0104/0107): a live test charge in Stripe test mode before trust, the deploy proven to fire, and the family's reviewer-mode pass on the live build before "done."

---

## 4. Recommended staged path

| Stage | What | Tier | Why this order |
|---|---|---|---|
| 1 | **Counter-mode POS surface** (record + receipt + ledger, owner-hand collection) reusing `moore-divahs.js` / `commerce.js` / `client-engagements.js` shapes | B | 80% exists; serves Shay now; zero money-rail risk |
| 2 | **Deep-link hand-off** to the merchant's own Square/processor app with amount prefilled, record-on-return | B/C boundary | Full register feel, money still entirely the owner's hand; verify vendor API first |
| 3 | **Activate the Stripe seam for PoeTech billing** (Payment Links + n8n webhook → `activatePaid`) | C | Already designed (Ship 5); unblocks every paid-tier promise; smallest real-money surface |
| 4 | **Card-present vendor rail** (Stripe Terminal / Square hardware) for Business-tier merchants | C | Waits for a named merchant need; rides the pattern Stage 3 proves |

Stage 1 is buildable immediately on the existing lane. Stage 3's prerequisites are operational, not code: a live Stripe account with tax setup and a written refund policy (master plan, Ship 5 deps) — those are Darrell's-hand items before the seam flips on.

---

## 5. Sources

Decisions: DR-0019, DR-0090, DR-0094, DR-0117, DR-0060, DR-0081 · Foundations: RELEASE-TIERS, COMMUNITY-FIRST-MISSION, DATA-AS-EMPOWERMENT-NOT-EXTRACTION, BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP, BIBLICAL-ECONOMICS-TEACHING-PATTERNS, MARKETPLACE-ARCHITECTURE, BUSINESS-PROCESS-CONNECTIONS · Code: `checkout-seam.js`, `commerce.js`, `moore-divahs.js`, `client-engagements.js`, `entitlements.js`, `giving.js`, `Cart.jsx`, `Bookstore.jsx`, migrations 0051/0083/0086 · Notes: 2026-06-01 app-services master plan (Ship 5), 2026-06-24 GTM research, 2026-07-07 Moore Divahs discovery.
