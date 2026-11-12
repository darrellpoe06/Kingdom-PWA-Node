// =============================================================================
// Cloudflare Pages Function — /api/stripe-webhook (DR-0230: live payments)
// =============================================================================
// Stripe's only door into our books. Every delivery is SIGNATURE-VERIFIED
// (HMAC-SHA256 over `${t}.${payload}` with the webhook secret, constant-time
// compare, 5-minute tolerance) before a byte is trusted — an unsigned or
// stale POST writes nothing. Verified settle events become APPEND-ONLY rows
// in the payments table (migration 0116) via the Supabase service key;
// UNIQUE(provider, provider_event_id) + ignore-duplicates makes Stripe's
// at-least-once retries idempotent — a dollar is never counted twice.
//
// normalizeStripeEvent MIRRORS app/src/lib/payments-ledger.js normalizePayment
// (functions stay self-contained — the Pages bundler is not proven across the
// src boundary); the conformance test in payments-functions.test.js FAILS CI
// if the two ever drift (DR-0076 proven-to-catch).
//
// Env (Darrell's custody): STRIPE_WEBHOOK_SECRET, SUPABASE_URL,
// SUPABASE_SERVICE_KEY. Unconfigured => 503; Stripe keeps retrying until the
// Governor wires it — no silent drops.

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

const asStr = (v) => (typeof v === 'string' ? v : '');
const cents = (v) => (Number.isFinite(v) ? Math.round(v) : 0);

// DR-1432: the events this door acts on. MONEY is counted ONCE, where it is
// named: a checkout session (first payment, product in its metadata) and a
// subscription RENEWAL invoice. payment_intent.succeeded is acknowledged and
// not counted: every purchase here goes through Checkout, whose session
// already carries that money, and counting both put one sale in the year
// summary twice (a subscription's first payment as cs_... AND pi_..., the
// second one with no product). The two customer.subscription events carry a
// member's status after the purchase: renewed, past due, or cancelled.
export const HANDLED_EVENTS = [
  'checkout.session.completed', 'payment_intent.succeeded', 'invoice.paid',
  'customer.subscription.updated', 'customer.subscription.deleted',
];
export const MONEY_EVENTS = ['checkout.session.completed', 'invoice.paid'];
export const SIGNATURE_TOLERANCE_SECONDS = 300;

// Mirror of PRODUCT_ENTITY in app/src/lib/payments-ledger.js (conformance-tested).
export const PRODUCT_ENTITY = Object.freeze({
  'poetech-plus': 'e-personal', 'family': 'e-personal', 'premium': 'e-personal', 'business': 'e-personal',
  'client-build': 'e-personal', 'client-support': 'e-personal',
  'moore-order': 'e-moore', 'moore-class': 'e-moore',
  'tlc-session': 'e-tlc',
  'book': 'e-personal',
  'workshop': 'e-personal',
});

export function parseSignatureHeader(header) {
  const out = { t: null, v1: [] };
  for (const part of asStr(header).split(',')) {
    const [k, v] = part.split('=', 2).map((s) => (s || '').trim());
    if (k === 't' && /^\d+$/.test(v)) out.t = Number(v);
    if (k === 'v1' && /^[0-9a-f]{64}$/.test(v)) out.v1.push(v);
  }
  return out;
}

const enc = new TextEncoder();

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// True only for a well-formed, in-tolerance, correctly-signed payload.
export async function verifyStripeSignature(payload, header, secret, nowSeconds) {
  const { t, v1 } = parseSignatureHeader(header);
  if (!t || v1.length === 0 || !secret) return false;
  if (Math.abs(nowSeconds - t) > SIGNATURE_TOLERANCE_SECONDS) return false;
  const expected = await hmacHex(secret, `${t}.${payload}`);
  return v1.some((sig) => timingSafeEqualHex(sig, expected));
}

// Mirror of payments-ledger normalizePayment (see header note).
export function normalizeStripeEvent(evt = {}, meta = {}) {
  const obj = (evt.data && evt.data.object) || {};
  const amountCents = cents(obj.amount_total ?? obj.amount ?? obj.amount_received);
  const feeCents = cents(meta.feeCents);
  const productKey = String((obj.metadata && obj.metadata.product) || meta.product || '').trim() || null;
  return {
    provider: 'stripe',
    providerEventId: String(evt.id || '') || null,
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

// The tiers a paid Stripe subscription may activate (schema-v2.1 CHECK list,
// minus 'foundation' — the free tier is never a purchase).
export const ACTIVATABLE_TIERS = Object.freeze([
  'poetech-plus', 'family', 'premium', 'business', 'landlord', 'enterprise',
]);

// subscriptionActivation — does this verified event SETTLE a monthly
// subscription, and to what tier? (DR-0263: the found gap — the webhook wrote
// the payments LEDGER but never flipped instance_subscriptions, so a paid
// member would have stayed on Foundation until a hand fixed the row. This
// pure half decides; onRequestPost applies it as a PATCH of the instance's
// existing subscription row — never a blind INSERT, which the table's
// created_by NOT NULL REFERENCES auth.users would reject for our email-keyed
// checkout metadata.) Returns null for one-off purchases, unknown tiers, and
// unsettled events — proven-to-catch in payments-functions.test.js.
export function subscriptionActivation(evt = {}) {
  if (asStr(evt.type) !== 'checkout.session.completed') return null;
  const obj = (evt.data && evt.data.object) || {};
  const md = obj.metadata || {};
  if (asStr(md.kind) !== 'subscription') return null;
  if (!(obj.payment_status === 'paid' || obj.status === 'complete')) return null;
  const tier = asStr(md.tier);
  if (!ACTIVATABLE_TIERS.includes(tier)) return null;
  const userId = asStr(md.userId) || asStr(obj.client_reference_id);
  return {
    tier,
    userId: UUID.test(userId) ? userId : null,
    stripeCustomerId: asStr(obj.customer) || null,
    stripeSubscriptionId: asStr(obj.subscription) || null,
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Stripe's subscription status -> ours. 'incomplete' (first payment still in
// flight) changes nothing; the checkout event is what starts a membership.
const STATUS_FROM_STRIPE = Object.freeze({
  active: 'active', trialing: 'active',
  past_due: 'past-due', unpaid: 'past-due',
  canceled: 'cancelled', incomplete_expired: 'cancelled',
});

const isoFromSeconds = (n) => (Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString() : null);

// bookEntitlementGrant — a PAID book session with a verified buyer hands THAT
// person the book (grant_book_entitlement, migration 0051, service role only).
// DR-1448 closed the gap: the ledger counted every book sale and nobody was
// ever handed the book. A guest purchase (no userId) grants nothing here —
// there is no person to hand it to. Pure.
export function bookEntitlementGrant(evt = {}) {
  if (asStr(evt.type) !== 'checkout.session.completed') return null;
  const obj = (evt.data && evt.data.object) || {};
  const md = obj.metadata || {};
  if (asStr(md.kind) !== 'book') return null;
  if (!(obj.payment_status === 'paid' || obj.status === 'complete')) return null;
  const userId = asStr(md.userId) || asStr(obj.client_reference_id);
  const productId = asStr(md.product) || asStr(md.productId);
  if (!UUID.test(userId) || !productId) return null;
  return { p_user: userId, p_product: productId, p_source: 'purchase', p_stripe_ref: asStr(obj.payment_intent) || asStr(obj.id) || null };
}

// workshopRegistrationChange — a PAID seat session seats THAT person at THAT
// event (workshop_registrations, migration 0322; one row per person per
// event, so a retry re-seats, never double-seats). Pure.
export function workshopRegistrationChange(evt = {}, nowIso = new Date().toISOString()) {
  if (asStr(evt.type) !== 'checkout.session.completed') return null;
  const obj = (evt.data && evt.data.object) || {};
  const md = obj.metadata || {};
  if (asStr(md.kind) !== 'workshop') return null;
  if (!(obj.payment_status === 'paid' || obj.status === 'complete')) return null;
  const userId = asStr(md.userId) || asStr(obj.client_reference_id);
  const eventId = asStr(md.eventId);
  if (!UUID.test(userId) || !UUID.test(eventId)) return null;
  return {
    event_id: eventId,
    user_id: userId,
    status: 'paid',
    stripe_session_id: asStr(obj.id) || null,
    stripe_payment_id: asStr(obj.payment_intent) || null,
    paid_cents: cents(obj.amount_total),
    paid_at: isoFromSeconds(evt.created) || nowIso,
    updated_at: nowIso,
  };
}

// memberSubscriptionChange — what this verified event does to ONE PERSON's
// member_subscriptions row (DR-1432, migration 0321), or null. Pure.
//   checkout.session.completed (a paid subscription with a verified buyer)
//     -> upsert the person's row: tier, active, Stripe ids
//   customer.subscription.updated / .deleted
//     -> patch the same person's row FOR THAT SUBSCRIPTION ONLY (an old,
//        cancelled subscription can never overwrite a newer one)
export function memberSubscriptionChange(evt = {}, nowIso = new Date().toISOString()) {
  const type = asStr(evt.type);
  if (type === 'checkout.session.completed') {
    const a = subscriptionActivation(evt);
    if (!a || !a.userId) return null;
    return {
      op: 'upsert',
      userId: a.userId,
      row: {
        user_id: a.userId,
        tier: a.tier,
        status: 'active',
        stripe_customer_id: a.stripeCustomerId,
        stripe_subscription_id: a.stripeSubscriptionId,
        updated_at: nowIso,
      },
    };
  }
  if (type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') {
    const obj = (evt.data && evt.data.object) || {};
    const md = obj.metadata || {};
    const userId = asStr(md.userId);
    const subscriptionId = asStr(obj.id);
    if (!UUID.test(userId) || !subscriptionId) return null;
    const status = type === 'customer.subscription.deleted' ? 'cancelled' : STATUS_FROM_STRIPE[asStr(obj.status)];
    if (!status) return null;
    const periodEnd = obj.current_period_end ?? obj.items?.data?.[0]?.current_period_end;
    const row = { status, current_period_end: isoFromSeconds(periodEnd), updated_at: nowIso };
    if (ACTIVATABLE_TIERS.includes(asStr(md.tier))) row.tier = asStr(md.tier);
    return { op: 'patch', userId, subscriptionId, row };
  }
  return null;
}

// A subscription RENEWAL invoice, re-shaped as the settle event the ledger
// mirror already reads, so normalizeStripeEvent stays identical to the engine
// (conformance-tested). Only billing_reason 'subscription_cycle': the first
// invoice's money is the checkout session's and is counted there. Pure.
export function renewalAsSettleEvent(evt = {}) {
  if (asStr(evt.type) !== 'invoice.paid') return null;
  const inv = (evt.data && evt.data.object) || {};
  if (asStr(inv.billing_reason) !== 'subscription_cycle') return null;
  const smd = inv.parent?.subscription_details?.metadata || inv.subscription_details?.metadata || {};
  const tier = asStr(smd.tier);
  return {
    id: evt.id,
    type: 'invoice.paid',
    created: evt.created,
    data: {
      object: {
        id: asStr(inv.id),
        payment_intent: asStr(inv.payment_intent) || asStr(inv.id),
        payment_status: inv.status === 'paid' ? 'paid' : 'unpaid',
        amount_total: inv.amount_paid,
        currency: inv.currency,
        metadata: { product: ACTIVATABLE_TIERS.includes(tier) ? tier : '' },
        customer_details: { email: asStr(inv.customer_email) },
      },
    },
  };
}

// THE FIREWALL (DR-1438). A Stripe account can be shared with another business
// (TLC is a therapy practice; Moore Divahs sells too). A webhook endpoint hears
// EVERY event on the account, so only an event our own checkout made may touch
// the books or a person's row: a checkout session our seam created carries
// metadata.kind ('book' | 'subscription') or a product the house tagged for its
// books (PRODUCT_ENTITY), and a renewal carries the
// subscription metadata (tier + userId) our checkout set. Anything else is
// acknowledged and NOTHING is written -- never a stranger's payment, never a
// client's email. Pure.
export function isOurs(evt = {}) {
  const type = asStr(evt.type);
  const obj = (evt.data && evt.data.object) || {};
  if (type === 'checkout.session.completed') {
    const md = obj.metadata || {};
    // Our seam's own sessions, or a product the house tagged for its books (PRODUCT_ENTITY).
    return ['book', 'subscription', 'workshop'].includes(asStr(md.kind)) || Object.prototype.hasOwnProperty.call(PRODUCT_ENTITY, asStr(md.product));
  }
  if (type === 'invoice.paid') {
    const smd = obj.parent?.subscription_details?.metadata || obj.subscription_details?.metadata || {};
    return ACTIVATABLE_TIERS.includes(asStr(smd.tier)) && UUID.test(asStr(smd.userId));
  }
  if (type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') {
    const md = obj.metadata || {};
    return ACTIVATABLE_TIERS.includes(asStr(md.tier)) && UUID.test(asStr(md.userId));
  }
  return false;
}

// Ledger row (camelCase engine shape) -> the payments table row (snake_case).
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
  const secret = asStr(env.STRIPE_WEBHOOK_SECRET);
  const supabaseUrl = asStr(env.SUPABASE_URL).replace(/\/$/, '');
  const serviceKey = asStr(env.SUPABASE_SERVICE_KEY);
  if (!secret || !supabaseUrl || !serviceKey) return json({ error: 'processor-not-configured' }, 503);

  const payload = await context.request.text();
  const header = context.request.headers.get('stripe-signature');
  const ok = await verifyStripeSignature(payload, header, secret, Math.floor(Date.now() / 1000));
  if (!ok) return json({ error: 'bad-signature' }, 400);

  let evt;
  try { evt = JSON.parse(payload); } catch { return json({ error: 'bad-json' }, 400); }
  if (!HANDLED_EVENTS.includes(asStr(evt?.type))) return json({ received: true, ignored: true });

  const type = asStr(evt?.type);
  if (!isOurs(evt)) return json({ received: true, ours: false });
  const instanceId = asStr((evt.data?.object?.metadata || {}).instanceId) || asStr(env.PAYMENTS_INSTANCE_ID);
  const svc = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json' };

  // ── 1. THE BOOKS: money is written once, where it is named ───────────────
  const moneyEvt = type === 'invoice.paid' ? renewalAsSettleEvent(evt) : MONEY_EVENTS.includes(type) ? evt : null;
  if (moneyEvt) {
    const row = normalizeStripeEvent(moneyEvt);
    if (!row.providerEventId) return json({ error: 'no-event-id' }, 400);
    let upstream;
    try {
      upstream = await fetch(`${supabaseUrl}/rest/v1/payments?on_conflict=provider,provider_event_id`, {
        method: 'POST',
        // Retries INSERT the same provider_event_id; duplicates are ignored,
        // never doubled, never an error Stripe would re-retry forever on.
        headers: { ...svc, Prefer: 'resolution=ignore-duplicates,return=minimal' },
        body: JSON.stringify([toTableRow(row, { instanceId })]),
      });
    } catch { return json({ error: 'ledger-unreachable' }, 502); }
    if (!upstream.ok) return json({ error: `ledger-${upstream.status}` }, 502);
  }

  // ── 1b. THE BOOK, THE SEAT: a paid one-off is handed to its buyer ────────
  // (DR-1448.) A failed write answers 500 so Stripe retries; the ledger insert
  // above is idempotent and both writes below are keyed per person, so a
  // retry hands the same book or seat once.
  const grant = bookEntitlementGrant(evt);
  if (grant) {
    let g;
    try {
      g = await fetch(`${supabaseUrl}/rest/v1/rpc/grant_book_entitlement`, { method: 'POST', headers: svc, body: JSON.stringify(grant) });
    } catch { return json({ error: 'entitlement-unreachable' }, 502); }
    if (!g.ok) return json({ error: `entitlement-${g.status}` }, 500);
    return json({ received: true, counted: !!moneyEvt, book: grant.p_product });
  }
  const seat = workshopRegistrationChange(evt);
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
    return json({ received: true, counted: !!moneyEvt, seat: seat.event_id });
  }

  // ── 2. THE PERSON: a membership lands on the buyer's own row ─────────────
  // (DR-1432; DR-0263's PATCH of the HOUSEHOLD row is retired: it fell back to
  // the family instance, so a stranger's purchase would have raised the Poe
  // household's tier and left the buyer on Foundation.) A failed write answers
  // 500 so Stripe retries it; the ledger insert above is idempotent, so a
  // retry never counts the money twice.
  const change = memberSubscriptionChange(evt);
  if (!change) return json({ received: true, counted: !!moneyEvt });
  const target =
    change.op === 'upsert'
      ? `${supabaseUrl}/rest/v1/member_subscriptions?on_conflict=user_id`
      : `${supabaseUrl}/rest/v1/member_subscriptions?user_id=eq.${encodeURIComponent(change.userId)}&stripe_subscription_id=eq.${encodeURIComponent(change.subscriptionId)}`;
  let wrote;
  try {
    wrote = await fetch(target, {
      method: change.op === 'upsert' ? 'POST' : 'PATCH',
      headers: { ...svc, Prefer: change.op === 'upsert' ? 'resolution=merge-duplicates,return=representation' : 'return=representation' },
      body: JSON.stringify(change.op === 'upsert' ? [change.row] : change.row),
    });
  } catch { return json({ error: 'member-unreachable' }, 502); }
  if (!wrote.ok) return json({ error: `member-${wrote.status}` }, 500);
  const rows = await wrote.json().catch(() => []);
  const n = Array.isArray(rows) ? rows.length : 0;
  return json({ received: true, counted: !!moneyEvt, member: n > 0 ? change.row.status : 'no-matching-subscription' });
}
