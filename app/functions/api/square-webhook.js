// =============================================================================
// Cloudflare Pages Function — /api/square-webhook (DR-1451: Square on the seam)
// =============================================================================
// Square's only door into our books, the twin of /api/stripe-webhook. Every
// delivery is SIGNATURE-VERIFIED (HMAC-SHA-256, base64, over the subscription's
// notification URL + the raw body with its signature key; constant-time
// compare) before a byte is trusted. A payment.updated / payment.created with
// status COMPLETED is looked up by its ORDER (GET /v2/orders/{id}); only an
// order our checkout made (metadata house=poetech + a kind this seam makes,
// the DR-1438 firewall) writes anything: one APPEND-ONLY payments row keyed
// by the PAYMENT id (created and updated events name the same money, so it
// is counted once), the book handed to its signed-in buyer, or the seat held
// in their name. Anything else is acknowledged and nothing is written.
//
// Env (the account owner's custody): SQUARE_ACCESS_TOKEN,
// SQUARE_WEBHOOK_SIGNATURE_KEY, SQUARE_WEBHOOK_URL (the notification URL
// exactly as the subscription holds it; defaults to this request's URL),
// SUPABASE_URL, SUPABASE_SERVICE_KEY, PAYMENTS_INSTANCE_ID (optional).
// Unconfigured => 503; Square keeps retrying until the owner wires it.
// =============================================================================
import { verifySquareSignature, retrieveSquareOrder, ourSquareOrder, normalizeSquarePayment, squareGrants, squareSeat } from '../_lib/square.js';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
const asStr = (v) => (typeof v === 'string' ? v : '');

export const HANDLED_EVENTS = ['payment.updated', 'payment.created'];

// Mirror of PRODUCT_ENTITY in app/src/lib/payments-ledger.js (conformance-tested).
export const PRODUCT_ENTITY = Object.freeze({
  'poetech-plus': 'e-personal', 'family': 'e-personal', 'premium': 'e-personal', 'business': 'e-personal',
  'client-build': 'e-personal', 'client-support': 'e-personal',
  'moore-order': 'e-moore', 'moore-class': 'e-moore',
  'tlc-session': 'e-tlc',
  'book': 'e-personal',
  'workshop': 'e-personal',
});

/** The payment a Square event carries, when it is one this door acts on and it is COMPLETED. Pure. */
export function completedPayment(evt = {}) {
  if (!HANDLED_EVENTS.includes(asStr(evt.type))) return null;
  const p = evt.data && evt.data.object && evt.data.object.payment;
  if (!p || typeof p !== 'object') return null;
  if (asStr(p.status) !== 'COMPLETED') return null;
  if (!asStr(p.id) || !asStr(p.order_id)) return null;
  return p;
}

// Ledger row (engine shape) -> the payments table row. Same columns the
// Stripe door writes (migration 0116).
export function toTableRow(row, { instanceId = '' } = {}) {
  return {
    instance_id: instanceId || null,
    provider: row.provider,
    provider_event_id: row.providerEventId,
    provider_payment_id: row.providerPaymentId,
    status: row.status,
    amount_cents: row.amountCents,
    fee_cents: row.feeCents,
    net_cents: row.netCents,
    currency: row.currency,
    product_key: row.productKey,
    entity_id: row.entityId,
    payer_email: row.payerEmail,
    occurred_at: row.occurredAtIso,
  };
}

export async function onRequestPost(context) {
  const env = context.env || {};
  const key = asStr(env.SQUARE_WEBHOOK_SIGNATURE_KEY);
  const supabaseUrl = asStr(env.SUPABASE_URL).replace(/\/$/, '');
  const serviceKey = asStr(env.SUPABASE_SERVICE_KEY);
  if (!key || !asStr(env.SQUARE_ACCESS_TOKEN) || !supabaseUrl || !serviceKey) return json({ error: 'processor-not-configured' }, 503);

  const payload = await context.request.text();
  const notificationUrl = asStr(env.SQUARE_WEBHOOK_URL) || context.request.url;
  const ok = await verifySquareSignature(payload, context.request.headers.get('x-square-hmacsha256-signature'), key, notificationUrl);
  if (!ok) return json({ error: 'bad-signature' }, 400);

  let evt;
  try { evt = JSON.parse(payload); } catch { return json({ error: 'bad-json' }, 400); }
  const payment = completedPayment(evt);
  if (!payment) return json({ received: true, ignored: true });

  // THE FIREWALL: the order says whose this is. Not ours => nothing written.
  const found = await retrieveSquareOrder(payment.order_id, { env });
  if (found.error) return json({ error: found.error }, found.status === 404 ? 200 : found.status);
  const ours = ourSquareOrder(found.order);
  if (!ours) return json({ received: true, ours: false });

  const instanceId = ours.instanceId || asStr(env.PAYMENTS_INSTANCE_ID);
  const svc = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json' };

  // ── 1. THE BOOKS: money is written once, keyed by the payment ────────────
  const row = normalizeSquarePayment(payment, ours, { product: PRODUCT_ENTITY });
  let upstream;
  try {
    upstream = await fetch(`${supabaseUrl}/rest/v1/payments?on_conflict=provider,provider_event_id`, {
      method: 'POST',
      headers: { ...svc, Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify([toTableRow(row, { instanceId })]),
    });
  } catch { return json({ error: 'ledger-unreachable' }, 502); }
  if (!upstream.ok) return json({ error: `ledger-${upstream.status}` }, 502);

  // ── 2. THE BOOK, THE SEAT: handed to the person who bought it ────────────
  const grants = squareGrants(payment, ours);
  for (const grant of grants) {
    let g;
    try {
      g = await fetch(`${supabaseUrl}/rest/v1/rpc/grant_book_entitlement`, { method: 'POST', headers: svc, body: JSON.stringify(grant) });
    } catch { return json({ error: 'entitlement-unreachable' }, 502); }
    if (!g.ok) return json({ error: `entitlement-${g.status}` }, 500);
  }
  if (grants.length) return json({ received: true, counted: true, book: ours.product, granted: grants.map((g) => g.p_product) });
  const seat = squareSeat(payment, ours);
  if (seat) {
    let s;
    try {
      s = await fetch(`${supabaseUrl}/rest/v1/workshop_registrations?on_conflict=event_id,user_id`, {
        method: 'POST',
        headers: { ...svc, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify([seat]),
      });
    } catch { return json({ error: 'seat-unreachable' }, 502); }
    if (!s.ok) return json({ error: `seat-${s.status}` }, 500);
    return json({ received: true, counted: true, seat: seat.event_id });
  }
  // A guest's book: counted, delivered to the device on return (/api/deliver).
  return json({ received: true, counted: true, guest: true });
}
