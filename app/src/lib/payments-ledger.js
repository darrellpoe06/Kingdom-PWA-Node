// =============================================================================
// payments-ledger — the money truth for live payments (DR-0230, build started)
// =============================================================================
// Darrell 2026-07-23: "Start the live payments build now." This is brick one:
// the PURE engine every later piece plugs into — the webhook normalizer, the
// fee split, the entity/product categorization, and the Books bridge — so the
// money math is proven in tests BEFORE any processor key exists (DR-0225:
// safeguards designed in; DR-0076: test-mode proven before live).
//
// Design (DR-0230): Stripe joins the existing checkout seam; a webhook writes
// every SETTLED payment as an append-only, instance-scoped ledger row; each
// row lands in Books categorized the moment it settles (entity, product, fee
// split) so the books are accountant-perfect continuously — never an April
// scramble. Keys are Darrell's custody; the first live charge is the watched
// Governor step.

const cents = (v) => (Number.isFinite(v) ? Math.round(v) : 0);

// Which family ENTITY a payment belongs to, from the product/brand it paid for.
// Mirrors the store + doors (app-store.js / business-registry): one source of
// entity truth for the accountant's books. Unknown products land honestly in
// 'unassigned' for steward review — never guessed (DR-0076).
export const PRODUCT_ENTITY = Object.freeze({
  'poetech-plus': 'e-personal', 'family': 'e-personal', 'premium': 'e-personal', 'business': 'e-personal',
  'client-build': 'e-personal', 'client-support': 'e-personal',
  'moore-order': 'e-moore', 'moore-class': 'e-moore',
  'tlc-session': 'e-tlc',
  'book': 'e-personal',
});

// normalizePayment — a Stripe-shaped event (checkout.session.completed /
// payment_intent.succeeded) → our ledger row. Pure; unknown fields never
// throw; amounts are integer cents; nothing is invented.
export function normalizePayment(evt = {}, meta = {}) {
  const obj = (evt.data && evt.data.object) || {};
  const amountCents = cents(obj.amount_total ?? obj.amount ?? obj.amount_received);
  const feeCents = cents(meta.feeCents); // from the balance transaction when expanded
  const productKey = String((obj.metadata && obj.metadata.product) || meta.product || '').trim() || null;
  return {
    provider: 'stripe',
    providerEventId: String(evt.id || '') || null,          // idempotency key
    providerPaymentId: String(obj.payment_intent || obj.id || '') || null,
    status: obj.payment_status === 'paid' || obj.status === 'succeeded' ? 'settled' : 'pending',
    amountCents,
    feeCents,
    netCents: amountCents - feeCents,
    currency: String(obj.currency || 'usd').toLowerCase(),
    productKey,
    entityId: (productKey && PRODUCT_ENTITY[productKey]) || 'unassigned',
    payerEmail: String((obj.customer_details && obj.customer_details.email) || obj.receipt_email || '') || null,
    occurredAtIso: Number.isFinite(evt.created) ? new Date(evt.created * 1000).toISOString() : null,
  };
}

// toBooksTransaction — the ledger row → a Books transaction the moment it
// settles: gross income to the entity, the processor fee as its own expense
// row (the accountant sees both sides, reconciled). Returns [] for anything
// unsettled — pending money never paints the books (DR-0061).
export function toBooksTransaction(row) {
  if (!row || row.status !== 'settled' || !(row.amountCents > 0)) return [];
  const date = (row.occurredAtIso || '').slice(0, 10) || null;
  const label = row.productKey || 'payment';
  const out = [{
    id: `pay-${row.providerPaymentId}`,
    accountId: null, // the steward maps the deposit account; the row is honest without it
    entityId: row.entityId,
    date,
    description: `Payment received · ${label}`,
    amount: row.amountCents / 100,
    category: 'income',
    source: 'payments-ledger',
  }];
  if (row.feeCents > 0) {
    out.push({
      id: `payfee-${row.providerPaymentId}`,
      accountId: null,
      entityId: row.entityId,
      date,
      description: `Processor fee · ${label}`,
      amount: -(row.feeCents / 100),
      category: 'fees',
      source: 'payments-ledger',
    });
  }
  return out;
}

// yearSummary — the accountant's year-at-a-glance from ledger rows: per entity,
// gross / fees / net in cents, settled rows only. Pure fold; the 1099s tab and
// the DR-0212 reports read the same truth.
export function yearSummary(rows = [], year) {
  const y = String(year);
  const out = {};
  for (const r of rows) {
    if (!r || r.status !== 'settled') continue;
    if (!(r.occurredAtIso || '').startsWith(y)) continue;
    const e = r.entityId || 'unassigned';
    if (!out[e]) out[e] = { grossCents: 0, feeCents: 0, netCents: 0, count: 0 };
    out[e].grossCents += cents(r.amountCents);
    out[e].feeCents += cents(r.feeCents);
    out[e].netCents += cents(r.netCents);
    out[e].count += 1;
  }
  return out;
}
