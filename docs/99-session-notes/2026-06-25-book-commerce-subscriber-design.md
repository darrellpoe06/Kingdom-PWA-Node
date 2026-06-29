# Book commerce + unified subscriber + 90-day-free — design + first increment (2026-06-25)

Darrell: the book line is now a **monetized product**. Full books from his
Spiritual Module + his other writing (his voice/IP); **purchasers unlock an
in-app conversation** around each book; **one unified subscriber** spans the
tiers with **90 days free** app access. Money is the **owner's hand** — a
processor moves money, configured by Darrell; the build does storefront +
entitlement + access only.

---

## 1. Book product model

A **product** (`commerce.js` / `book-catalog.js`) references a real build
**recipe** (book-corpus), so the content is assembled from the existing corpus —
never fabricated. Seeded with Darrell's authored work:

| Product | Source recipe | Price | Status |
| --- | --- | --- | --- |
| Living Lessons from the Word | `course-living-lessons` (real) | $9.99 | published |
| Eternal Algorithms | `algorithms` (real) | $14.99 | published |
| The Holy Spirit Integration Worldview | `holy-spirit-integration` | $19.99 | **draft** — honest: its content pipeline (bring the worldview doc into the app as a recipe) is pending; not on sale until then |

`tier_included` lets a tier's subscribers get a book bundled (the unified-subscriber lever): Household+ get Living Lessons; Premium+ get Eternal Algorithms.

## 2. Unified subscriber + 90-day free (the two binding rules)

`entitlements.js` — **ONE subscriber record per person**, across every product +
business (PoeTech / Church / TLC / books). One login, one subscription;
entitlements resolve everywhere per the subscriber's **effective tier**.

- **90 days free** = full PoeTech **app** access at their tier. `trialState` gives
  an honest **"X days left"** countdown; at day 90 it converts gracefully — phase
  `expired`, access **falls back to the free Foundation tier**, *never a lockout*
  ("nothing was deleted; upgrade any time"). Anxiety-clarity by construction.
- `effectiveTier` = chosen tier during the 90 free days; free tier after (unless
  paid). `appAccess` always returns at least free — there is never a wall.
- Ties into the existing tier ladder (`foundation < poetech-plus < family <
  premium < business`) and the schema's `instance_subscriptions` (tier / status
  `trial` / period). The app mirrors device-local until cutover.

## 3. Purchaser-gated conversation

`book-conversation.js` — a per-book Q&A/community space, **gated on entitlement**
(`conversationGate`): own the book (purchase, grant, or tier-included) → you read
+ post; otherwise a clear "purchase to join" reason. The gate is enforced in the
data path (`addMessageGated`) **and** at the database (migration 0051 RLS:
`user_owns_book(product_id)` guards both SELECT and INSERT). Authors post with an
`author` role badge so readers see when Darrell replies.

## 4. Commerce / entitlement flow

```
browse store ─▶ Buy (preview → execute) ─▶ [processor: Stripe Checkout] ─▶ paid
                                                      │
                          verified webhook (server) ─▶ grant_book_entitlement()
                                                      │
                          entitlement row ─▶ unlocks Read + Conversation
```

- **Buy** builds a checkout **request** (`checkout-seam.js`) — *what* to buy,
  *where* to return, `metadata.userKey`. **No price-trust, no keys** on the
  client; the server attaches the price + secret key.
- **preview → execute**: `executeCheckout` POSTs to Darrell's endpoint; if the
  processor is **unconfigured it previews only and NEVER charges**.
- Pricing/publishing in the Governor panel are also **preview → execute**.

## 5. Sustainable-growth cost-efficiency screen

`unitEconomics` (shown to the Governor per product): price, processor fee
(2.9% + $0.30 default), **net per sale**, **margin %**, **per-sale profitable?**,
and **break-even units** against any allocated fixed cost. Digital books are
~95% margin — each sale stands on its own, never subsidized.

`trialEconomics` models the **90-free against break-even**: on sovereign infra
the free period's marginal cost is ~zero, so the trial is a **pure growth lever**
(LTV > trial cost = justified), not a loss leader. Default lean; spend justified
only when it drives sustainable growth that **feeds the mission** (app dev,
community skills, Father's Business reach) — never growth-at-all-costs.

## 6. Processor integration — **Darrell's-hand setup steps**

The build never holds a secret key or moves money. To turn checkout on, Darrell
(his hand) does this once:

1. **Create the Stripe account** at https://dashboard.stripe.com (his own
   business identity + bank for payouts). Money lands in his account, not ours.
2. **Create the products/prices** in Stripe (one Price per book; one recurring
   Price per subscription tier). Copy each **Price ID** (`price_…`).
3. **Get the keys** (Developers → API keys): the **Secret key** (`sk_live_…`) and
   the **Webhook signing secret** (`whsec_…`). These stay with HIM — never in the
   repo, never sent to me.
4. **Stand up the checkout endpoint** (an n8n webhook on the NAS, same-origin via
   `/n8n/webhook/book-checkout`, per the n8n same-origin rule). It receives the
   client's request, calls Stripe `checkout.sessions.create` with **his** secret
   key + the matching Price ID, and returns `{ url }`. He pastes the secret key
   into the n8n credential store (his hand) — it never touches the app.
5. **Stand up the webhook handler** (n8n at `/n8n/webhook/stripe`): verify the
   Stripe signature with `whsec_…`, and on a completed payment call the Supabase
   RPC `grant_book_entitlement(p_user, p_product, 'purchase', p_stripe_ref)` (or
   set `instance_subscriptions` active for a subscription) using the **service
   role** key (server-only).
6. **Flip the app on**: set `CHECKOUT_CONFIG = { enabled: true, endpoint:
   '/n8n/webhook/book-checkout' }` in `Bookstore.jsx`. Until then the store
   previews the request and charges nothing.
7. **Apply migration 0051** (`grant_book_entitlement` + the RLS that DB-enforces
   purchaser-gating) via Supabase Studio or db-migrate — his hand.

The only external piece is the processor. Catalog, entitlement, conversation,
trial, and tier logic are all sovereign.

## 7. What shipped (first increment) vs next

**Shipped** (`feat/book-commerce-subscriber`, real + 21 tests):
- Pure libs: `commerce.js`, `entitlements.js`, `book-conversation.js`,
  `checkout-seam.js`, `book-catalog.js`.
- Surface: **Library → Store** (`Bookstore.jsx`) — catalog with prices, Buy
  (preview→execute, never charges unconfigured), **My books** via the shelf,
  per-book **gated Conversation**, the **90-day-free membership banner** with
  countdown, and a **Governor cost-efficiency / publish-price** panel
  (preview→execute). Entitled books open in the in-app reader (resume + companion
  deep-links from the reading PR).
- Migration **0051** (book_products / book_entitlements / book_conversations +
  `grant_book_entitlement` + DB-enforced purchaser-gating) — Darrell's-hand apply.

**Next:**
1. Darrell configures the processor (steps above) + applies 0051; flip
   `CHECKOUT_CONFIG.enabled`.
2. Bring the worldview doc into the app as a recipe → publish the Spiritual
   Module book.
3. Point catalog/entitlement/conversation reads at the cloud tables (cross-device)
   once 0051 is live; mount the trial banner app-wide in the shell.
4. Wire the webhook → `grant_book_entitlement` + `instance_subscriptions` active.
5. Author-reply notifications + a "my conversations" digest.
