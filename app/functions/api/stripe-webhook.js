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

export const HANDLED_EVENTS = ['checkout.session.completed', 'payment_intent.succeeded'];
export const SIGNATURE_TOLERANCE_SECONDS = 300;

// Mirror of PRODUCT_ENTITY in app/src/lib/payments-ledger.js (conformance-tested).
export const PRODUCT_ENTITY = Object.freeze({
  'poetech-plus': 'e-personal', 'family': 'e-personal', 'premium': 'e-personal', 'business': 'e-personal',
  'client-build': 'e-personal', 'client-support': 'e-personal',
  'moore-order': 'e-moore', 'moore-class': 'e-moore',
  'tlc-session': 'e-tlc',
  'book': 'e-personal',
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

  const row = normalizeStripeEvent(evt);
  if (!row.providerEventId) return json({ error: 'no-event-id' }, 400);

  const instanceId = asStr((evt.data?.object?.metadata || {}).instanceId) || asStr(env.PAYMENTS_INSTANCE_ID);
  let upstream;
  try {
    upstream = await fetch(`${supabaseUrl}/rest/v1/payments?on_conflict=provider,provider_event_id`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'content-type': 'application/json',
        // Retries INSERT the same provider_event_id; duplicates are ignored,
        // never doubled, never an error Stripe would re-retry forever on.
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify([toTableRow(row, { instanceId })]),
    });
  } catch { return json({ error: 'ledger-unreachable' }, 502); }
  if (!upstream.ok) return json({ error: `ledger-${upstream.status}` }, 502);
  return json({ received: true });
}
