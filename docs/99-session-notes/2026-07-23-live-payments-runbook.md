# Live payments — the Governor's wiring runbook (DR-0230)

Dated: 2026-07-23. Everything the SYSTEM could build is built, tested, and
merged (bricks one-three: the engine, the `/api/checkout` + `/api/stripe-webhook`
doors, migration 0116, the Books → Taxes ledger panel). What remains is
exactly the part that is Darrell's custody by design — keys and the first
watched charge. Until every step below is done, not a cent can move and the
app says so honestly.

## What the system already does (no action needed)

- `/api/checkout` answers **503 processor-not-configured** until the keys exist;
  the client stays preview-only.
- `/api/stripe-webhook` rejects everything unsigned; a verified settle event
  becomes an append-only row in the `payments` table, idempotent on retries.
- Books → Taxes shows the per-entity year-at-a-glance (gross / fees / net) the
  moment rows exist — the same truth the 1099s reports read.
- Price truth is server-side: an id missing from YOUR catalog is rejected,
  never charged at a client-said price.

## Step 1 — Apply migration 0116 (Supabase)

Open Supabase Studio → SQL editor → paste and run the contents of
`infra/supabase/migrations-auto/0116-payments-ledger.sql` (idempotent; safe to
re-run). Confirm: `select count(*) from payments;` returns `0`.

## Step 2 — Stripe account values (your custody, never the repo)

From the Stripe dashboard (TEST MODE FIRST — DR-0076):

1. **Secret key** — Developers → API keys → `sk_test_...`
2. **Webhook** — Developers → Webhooks → Add endpoint:
   - URL: `https://poetech.us/api/stripe-webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`
   - Copy the signing secret `whsec_...`
3. **Subscription prices** (only if selling tiers now) — create the Products/
   Prices and note each `price_...` id.

## Step 3 — Cloudflare Pages environment (the only place keys live)

Cloudflare dashboard → Pages → the poetech.us project → Settings →
Environment variables → Production. Add:

| Name | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | `sk_test_...` (live key only after the watched test) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `STRIPE_CATALOG` | e.g. `{"book-flocks":1499}` — product id → price in CENTS |
| `STRIPE_TIER_PRICES` | e.g. `{"family":"price_..."}` |
| `SUPABASE_URL` | the project URL |
| `SUPABASE_SERVICE_KEY` | the service-role key (Settings → API) |
| `PAYMENTS_INSTANCE_ID` | the Poe instance uuid (so rows read steward-scoped) |

Then redeploy the Pages project so the functions pick up the env.

## Step 4 — The watched test charge (test mode)

1. In Stripe test mode, from any device: buy something through the app's
   checkout (test card `4242 4242 4242 4242`, any future date, any CVC).
2. Watch three things confirm, in order:
   - Stripe dashboard shows the test payment succeeded;
   - Supabase: `select provider_event_id, status, amount_cents, entity_id from payments order by recorded_at desc limit 3;` shows the row, `settled`, right entity;
   - The app, Books → Taxes → Live payments ledger, shows the same row and the
     year summary — as a user meets it (reviewer mode, DR-0104).
3. Retry safety: in Stripe → the webhook → resend the same event; the ledger
   count must NOT increase (idempotency proven live).

## Step 5 — Go live (the Governor step)

Swap `STRIPE_SECRET_KEY` + the webhook to LIVE-mode values, redeploy, and make
the first real charge yourself, watched end-to-end the same three-window way.
That first live charge is the DR-0230 gate — nothing before it is real money.

## The accountant's view after this

Every settled payment lands categorized (entity, product, fee split) the
moment it clears. The year summary on Books → Taxes and the 1099s/DR-0212
reports read the same rows — organizationally perfect, always current, ready
for review at any moment (Darrell 2026-07-23: "Our Accountant can review
however we want it — organizationally perfect based on what is up to date").
