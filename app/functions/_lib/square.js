// =============================================================================
// square.js — the second processor on the same seam (DR-1451; planned in
// DR-1438, DR-1436)
// =============================================================================
// Darrell 2026-11-12: Christina has Square and Stripe accounts; both options.
// Then: "what about the square account both work?" This is the Square half,
// built so both run on ONE seam: the client POSTs the same request to
// /api/checkout with `processor: 'square'`; this module turns it into a
// Square PAYMENT LINK whose ORDER carries the same metadata the Stripe
// session carries (kind, product, grants, userId, eventId, instanceId, and
// `house: 'poetech'`); Square's webhook is verified here and the paid order
// writes the same rows the Stripe webhook writes (payments, book
// entitlements, workshop seats); and /api/deliver reads the order on return.
//
// READ FROM SQUARE'S OWN REFERENCE, 2026-11-12 (DR-0076):
//   POST /v2/online-checkout/payment-links  (idempotency_key, order,
//        checkout_options.redirect_url, pre_populated_data.buyer_email,
//        payment_note; Square-Version header) -> payment_link { id, version,
//        order_id, url }
//   PUT  /v2/online-checkout/payment-links/{id}  (payment_link { version,
//        checkout_options }) — the redirect is set AFTER creation so it can
//        carry the order id Square minted.
//   GET  /v2/orders/{order_id}  (order.reference_id max 40, order.metadata:
//        10 keys of [a-zA-Z0-9_-] up to 60 chars, values up to 255;
//        net_amount_due_money, total_money, tenders, state)
//   Webhook: header x-square-hmacsha256-signature, HMAC-SHA-256 with the
//        subscription's signature key over the notification URL + raw body,
//        base64; compared constant-time. payment.updated carries
//        data.object.payment { id, status (COMPLETED), order_id, amount_money,
//        buyer_email_address, processing_fee[], receipt_url }.
//
// PRICE TRUTH IS SERVER-SIDE, as on Stripe: the order's line item carries the
// catalog's cents (or the event row's), never the client's figure. Square's
// payment link has no pay-what-you-want, so a pwyw entry charges its PRESET
// here; Stripe keeps the name-your-price page. Coupons are Square's own
// (enable_coupon) unless SQUARE_COUPONS=off.
//
// THE FIREWALL (DR-1438) holds on Square too: an order is ours only when its
// metadata says `house: poetech` and a kind this seam makes; a shared
// account's other payments are acknowledged and NOTHING is written.
//
// Env (Darrell's or Christina's custody): SQUARE_ACCESS_TOKEN,
// SQUARE_LOCATION_ID, SQUARE_WEBHOOK_SIGNATURE_KEY, SQUARE_WEBHOOK_URL (the
// subscription's notification URL, exactly), SQUARE_ENV ('sandbox' for the
// sandbox host), SQUARE_COUPONS ('off' hides the coupon box).
// =============================================================================
export const SQUARE_VERSION = '2026-09-16';
export const HOUSE = 'poetech';
export const OUR_KINDS = Object.freeze(['book', 'workshop']);

const asStr = (v) => (typeof v === 'string' ? v : '');
const cents = (v) => (Number.isFinite(v) ? Math.round(v) : 0);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const ORDER_ID = /^[A-Za-z0-9_-]{8,64}$/;

export function squareBase(env = {}) {
  return asStr(env.SQUARE_ENV).toLowerCase() === 'sandbox' ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com';
}

/** Square can take money when a token and a location are both set. Pure. */
export function squareConfigured(env = {}) {
  return !!(asStr(env.SQUARE_ACCESS_TOKEN) && asStr(env.SQUARE_LOCATION_ID));
}

export function squareHeaders(env = {}) {
  return {
    Authorization: `Bearer ${asStr(env.SQUARE_ACCESS_TOKEN)}`,
    'Square-Version': SQUARE_VERSION,
    'content-type': 'application/json',
  };
}

const meta = (pairs) => {
  const out = {};
  for (const [k, v] of pairs) {
    const s = asStr(v);
    if (s) out[k] = s.slice(0, 255);
  }
  return out;
};

// The seam request -> the Square payment-link body, or { error }. MIRRORS
// toStripeSessionParams in functions/api/checkout.js, shape for shape: the
// same refusals, the same metadata keys, the same server-side price. Pure.
export function toSquarePaymentLink(
  req,
  { catalog = {}, instanceId = '', buyer = null, event = null, locationId = '', couponsOn = true, idempotencyKey = '', note = '' } = {}
) {
  const kind = asStr(req?.kind);
  if (!asStr(locationId)) return { error: 'processor-not-configured' };
  const userId = buyer && UUID.test(asStr(buyer.userId)) ? buyer.userId : '';
  const common = [
    ['house', HOUSE],
    ['kind', kind],
    ['instanceId', instanceId],
    ['userId', userId],
    ['userKey', userId ? asStr(buyer.email) || userId : asStr(req?.userKey)],
  ];
  let line;
  let metadata;
  if (kind === 'book') {
    const productId = asStr(req?.productId);
    const entry = catalogEntryShape(catalog[productId]);
    if (!entry) return { error: 'unknown-product' };
    line = { name: asStr(req?.title) || productId, amount: entry.presetCents };
    metadata = meta([...common, ['product', productId], ['grants', entry.grants.join(',')]]);
  } else if (kind === 'workshop') {
    const ev = event && typeof event === 'object' ? event : null;
    if (!ev || !UUID.test(asStr(ev.id))) return { error: 'unknown-event' };
    if (asStr(ev.status) !== 'open') return { error: 'unknown-event' };
    if (Number.isFinite(ev.seatsLeft) && ev.seatsLeft <= 0) return { error: 'sold-out' };
    if (!Number.isInteger(ev.priceCents) || ev.priceCents <= 0) return { error: 'unknown-event' };
    if (!userId) return { error: 'sign-in-required' };
    line = { name: asStr(ev.title) || 'Workshop seat', amount: ev.priceCents, currency: asStr(ev.currency) };
    metadata = meta([...common, ['product', 'workshop'], ['eventId', ev.id]]);
  } else if (kind === 'subscription') {
    // A Square subscription takes a plan VARIATION id and finds the buyer by
    // phone (DR-1438); a renewal's order carries none of our metadata. That
    // road is not built: PoeTech+ stays on Stripe until it is (DR-1451).
    return { error: 'square-subscription-not-built' };
  } else {
    return { error: 'unknown-kind' };
  }
  const body = {
    idempotency_key: asStr(idempotencyKey) || undefined,
    order: {
      location_id: locationId,
      reference_id: (userId || asStr(req?.userKey) || 'guest').slice(0, 40),
      line_items: [
        { name: line.name.slice(0, 512), quantity: '1', base_price_money: { amount: line.amount, currency: (line.currency || 'usd').toUpperCase() } },
      ],
      metadata,
    },
    checkout_options: { enable_coupon: !!couponsOn, ask_for_shipping_address: false, allow_tipping: false },
    ...(asStr(note) ? { payment_note: asStr(note).slice(0, 500) } : {}),
  };
  if (userId && asStr(buyer.email)) body.pre_populated_data = { buyer_email: asStr(buyer.email).slice(0, 256) };
  if (!body.idempotency_key) delete body.idempotency_key;
  return { body };
}

// The catalog entry shape the checkout function holds (catalogEntry there);
// repeated here so this module stays self-contained for the Pages bundler.
// Conformance-tested against catalogEntry in the-square-adapter test.
export function catalogEntryShape(raw) {
  const int = (v) => (Number.isInteger(v) && v >= 0 ? v : null);
  if (Number.isInteger(raw)) return raw > 0 ? { kind: 'fixed', cents: raw, minCents: raw, presetCents: raw, grants: [] } : null;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const grants = (Array.isArray(raw.grants) ? raw.grants : []).map(asStr).filter(Boolean);
  if (raw.pwyw && typeof raw.pwyw === 'object') {
    const min = int(raw.pwyw.min);
    const preset = int(raw.pwyw.preset);
    if (min === null || min <= 0) return null;
    const pre = preset !== null && preset >= min ? preset : min;
    return { kind: 'pwyw', cents: pre, minCents: min, presetCents: pre, grants };
  }
  const c = int(raw.cents);
  if (c === null || c <= 0) return null;
  return { kind: 'fixed', cents: c, minCents: c, presetCents: c, grants };
}

// The return the client asked for carries Stripe's placeholder; Square has
// none, so the order id Square minted takes its place. Pure.
export function squareRedirect(successUrl, orderId) {
  const u = asStr(successUrl);
  const id = asStr(orderId);
  if (u.includes('session_id={CHECKOUT_SESSION_ID}')) return u.replace('session_id={CHECKOUT_SESSION_ID}', `square_order=${encodeURIComponent(id)}`);
  return `${u}${u.includes('?') ? '&' : '?'}square_order=${encodeURIComponent(id)}`;
}

/** The order is ours (the firewall): house + a kind this seam makes. -> what it bought | null. Pure. */
export function ourSquareOrder(order) {
  const o = order && typeof order === 'object' ? order : {};
  const md = o.metadata && typeof o.metadata === 'object' ? o.metadata : {};
  if (asStr(md.house) !== HOUSE) return null;
  const kind = asStr(md.kind);
  if (!OUR_KINDS.includes(kind)) return null;
  const product = asStr(md.product);
  if (!product) return null;
  const grants = asStr(md.grants)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    kind,
    product,
    grants: kind === 'book' ? [...new Set([product, ...grants])] : [],
    userId: UUID.test(asStr(md.userId)) ? md.userId : null,
    userKey: asStr(md.userKey) || null,
    eventId: UUID.test(asStr(md.eventId)) ? md.eventId : null,
    instanceId: asStr(md.instanceId) || null,
    orderId: asStr(o.id) || null,
  };
}

/** Paid, by the order's own figures: nothing due and something tendered, or Square says COMPLETED. Pure. */
export function orderPaid(order) {
  const o = order && typeof order === 'object' ? order : {};
  const due = o.net_amount_due_money && Number.isFinite(o.net_amount_due_money.amount) ? o.net_amount_due_money.amount : null;
  const total = o.total_money && Number.isFinite(o.total_money.amount) ? o.total_money.amount : 0;
  const tendered = Array.isArray(o.tenders) && o.tenders.length > 0;
  if (asStr(o.state) === 'COMPLETED') return true;
  return tendered && due === 0 && total > 0;
}

/** A Square payment (webhook or retrieved) -> the ledger row the house keeps. Pure. */
export function normalizeSquarePayment(payment, ours, { product = {} } = {}) {
  const p = payment && typeof payment === 'object' ? payment : {};
  const amountCents = cents(p.amount_money && p.amount_money.amount);
  const feeCents = (Array.isArray(p.processing_fee) ? p.processing_fee : []).reduce((n, f) => n + cents(f && f.amount_money && f.amount_money.amount), 0);
  const productKey = asStr(ours && ours.product) || null;
  const kind = asStr(ours && ours.kind);
  return {
    provider: 'square',
    providerEventId: asStr(p.id) || null, // one row per PAYMENT: created and updated events name the same money
    providerPaymentId: asStr(p.id) || null,
    status: asStr(p.status) === 'COMPLETED' ? 'settled' : 'pending',
    amountCents,
    feeCents,
    netCents: amountCents - feeCents,
    currency: asStr(p.amount_money && p.amount_money.currency).toLowerCase() || 'usd',
    productKey,
    entityId: (productKey && product[productKey]) || (kind && product[kind]) || 'unassigned',
    payerEmail: asStr(p.buyer_email_address) || null,
    occurredAtIso: asStr(p.updated_at) || asStr(p.created_at) || null,
  };
}

/** The grants a paid book order hands its signed-in buyer (one per book of a bundle). Pure. */
export function squareGrants(payment, ours) {
  if (!ours || ours.kind !== 'book' || !ours.userId) return [];
  return ours.grants.map((id) => ({ p_user: ours.userId, p_product: id, p_source: 'purchase', p_stripe_ref: `square:${asStr(payment && payment.id)}` }));
}

/** The seat a paid workshop order holds for its buyer. Pure. */
export function squareSeat(payment, ours, nowIso = new Date().toISOString()) {
  if (!ours || ours.kind !== 'workshop' || !ours.userId || !ours.eventId) return null;
  const p = payment && typeof payment === 'object' ? payment : {};
  return {
    event_id: ours.eventId,
    user_id: ours.userId,
    status: 'paid',
    stripe_session_id: ours.orderId ? `square:${ours.orderId}` : null,
    stripe_payment_id: asStr(p.id) ? `square:${p.id}` : null,
    paid_cents: cents(p.amount_money && p.amount_money.amount),
    paid_at: asStr(p.updated_at) || asStr(p.created_at) || nowIso,
    updated_at: nowIso,
  };
}

const enc = new TextEncoder();
async function hmacBase64(key, message) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(message));
  let bin = '';
  for (const b of new Uint8Array(sig)) bin += String.fromCharCode(b);
  return btoa(bin);
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** True only for a body Square signed for THIS notification URL with THIS key. */
export async function verifySquareSignature(body, header, key, notificationUrl) {
  const sig = asStr(header).trim();
  if (!sig || !asStr(key) || !asStr(notificationUrl)) return false;
  const expected = await hmacBase64(key, notificationUrl + asStr(body));
  return timingSafeEqual(sig, expected);
}

/** Create the link, then set its redirect to carry the order id. -> { url, orderId, redirectSet } | { error, status } */
export async function createSquarePaymentLink(body, { env = {}, successUrl = '', fetchImpl = fetch } = {}) {
  const base = squareBase(env);
  const headers = squareHeaders(env);
  let created;
  try {
    created = await fetchImpl(`${base}/v2/online-checkout/payment-links`, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch {
    return { error: 'square-unreachable', status: 502 };
  }
  if (!created || !created.ok) return { error: `square-${created ? created.status : 'no-response'}`, status: 502 };
  const made = await created.json().catch(() => null);
  const link = made && made.payment_link ? made.payment_link : {};
  const url = asStr(link.url);
  const orderId = asStr(link.order_id);
  if (!url || !asStr(link.id)) return { error: 'square-no-link', status: 502 };
  let redirectSet = false;
  if (orderId && asStr(successUrl)) {
    try {
      const upd = await fetchImpl(`${base}/v2/online-checkout/payment-links/${encodeURIComponent(link.id)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          payment_link: { version: link.version, checkout_options: { ...(body.checkout_options || {}), redirect_url: squareRedirect(successUrl, orderId) } },
        }),
      });
      redirectSet = !!(upd && upd.ok);
    } catch {
      redirectSet = false; // the buyer still pays; a signed-in buyer's rows come from the webhook
    }
  }
  return { url, orderId, redirectSet };
}

/** Read one order from Square. -> { order } | { error, status } */
export async function retrieveSquareOrder(orderId, { env = {}, fetchImpl = fetch } = {}) {
  const id = asStr(orderId);
  if (!ORDER_ID.test(id)) return { error: 'bad-order', status: 400 };
  let res;
  try {
    res = await fetchImpl(`${squareBase(env)}/v2/orders/${encodeURIComponent(id)}`, { headers: squareHeaders(env) });
  } catch {
    return { error: 'square-unreachable', status: 502 };
  }
  if (!res || !res.ok)
    return { error: res && res.status === 404 ? 'unknown-order' : `square-${res ? res.status : 'no-response'}`, status: res && res.status === 404 ? 404 : 502 };
  const data = await res.json().catch(() => null);
  const order = data && data.order && typeof data.order === 'object' ? data.order : null;
  if (!order) return { error: 'unknown-order', status: 404 };
  return { order };
}
