// =============================================================================
// Cloudflare Pages Function — /api/checkout (DR-0230: live payments, brick two)
// =============================================================================
// The server half of the existing checkout seam (app/src/lib/checkout-seam.js):
// the client POSTs WHAT to buy + WHERE to return; THIS function holds the only
// hand that talks to Stripe. The secret key lives in the Pages env (Darrell's
// custody, set in the Cloudflare dashboard — never this repo, never the
// client). Unconfigured => an honest 503 and the client keeps its preview-only
// posture; not a cent can move until the Governor sets the keys.
//
// PRICE TRUTH IS SERVER-SIDE (the one non-negotiable): the client's amount is
// display copy, never the charge. One-off products charge the amount in the
// STRIPE_CATALOG env JSON ({"productId": cents}); subscriptions charge the
// Stripe Price in STRIPE_TIER_PRICES ({"tier": "price_..."}). An id missing
// from the owner's catalog is REJECTED — never charged at a client-said price.
//
// Env (all Darrell's custody): STRIPE_SECRET_KEY, STRIPE_CATALOG,
// STRIPE_TIER_PRICES, PAYMENTS_INSTANCE_ID (optional — stamps rows to the
// family instance for steward-scoped reads).
//
// A SUBSCRIPTION IS A PERSON'S (DR-1432, the PoeTech+ checkout). The buyer is
// the signed-in caller, proven by the sovereign auth road (SUPABASE_URL +
// SUPABASE_ANON_KEY, already installed by push-sender-credentials.yml), never
// a client-said key. Their user id rides the session (client_reference_id and
// metadata) and the subscription itself, so the webhook writes the tier onto
// THAT person's member_subscriptions row (migration 0321), and every later
// renewal or cancellation finds them again. GET answers which tiers are open
// for sale, so the app shows a buy button only when one can really work.

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

const asStr = (v) => (typeof v === 'string' ? v : '');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Only same-site return targets: Stripe redirects the buyer here after paying,
// and an attacker-supplied absolute URL would bounce them (and their session
// state) off-site. Relative paths only.
export function safeReturnPath(url, fallback) {
  const s = asStr(url).trim();
  return s.startsWith('/') && !s.startsWith('//') ? s : fallback;
}

export function parseJsonEnv(raw) {
  try {
    const v = JSON.parse(asStr(raw) || '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch { return {}; }
}

// The seam request -> the Stripe Checkout Session params, or { error } when the
// request fails the server's own truth (unknown product/tier, bad kind). Pure.
export function toStripeSessionParams(req, { catalog = {}, tierPrices = {}, origin = '', instanceId = '', buyer = null, event = null } = {}) {
  const kind = asStr(req?.kind);
  const userKey = asStr(req?.userKey);
  const success = origin + safeReturnPath(req?.successUrl, '/poetech-app/?paid=1');
  const cancel = origin + safeReturnPath(req?.cancelUrl, '/poetech-app/');
  const p = new URLSearchParams();
  p.set('success_url', success);
  p.set('cancel_url', cancel);
  p.set('metadata[userKey]', userKey);
  p.set('metadata[kind]', kind);
  if (instanceId) p.set('metadata[instanceId]', instanceId);
  if (kind === 'book') {
    const productId = asStr(req?.productId);
    const cents = catalog[productId];
    if (!Number.isInteger(cents) || cents <= 0) return { error: 'unknown-product' };
    p.set('mode', 'payment');
    p.set('line_items[0][quantity]', '1');
    p.set('line_items[0][price_data][currency]', 'usd');
    p.set('line_items[0][price_data][unit_amount]', String(cents));
    p.set('line_items[0][price_data][product_data][name]', asStr(req?.title) || productId);
    p.set('metadata[product]', productId);
    // A signed-in buyer rides the session so the webhook can grant THEIR
    // entitlement (book_entitlements, 0051); a guest still pays, but only a
    // person can be handed a book (DR-1447 closed the gap: nothing granted).
    if (buyer && UUID.test(asStr(buyer.userId))) {
      p.set('metadata[userId]', buyer.userId);
      p.set('client_reference_id', buyer.userId);
      if (asStr(buyer.email)) p.set('customer_email', buyer.email);
    }
    return { params: p };
  }
  if (kind === 'workshop') {
    // The seat's price is the EVENT ROW's (workshop_events, 0322), read by
    // this server; the client's figure never reaches Stripe (DR-1447).
    const ev = event && typeof event === 'object' ? event : null;
    if (!ev || !UUID.test(asStr(ev.id))) return { error: 'unknown-event' };
    if (asStr(ev.status) !== 'open') return { error: 'unknown-event' };
    if (Number.isFinite(ev.seatsLeft) && ev.seatsLeft <= 0) return { error: 'sold-out' };
    const cents = ev.priceCents;
    if (!Number.isInteger(cents) || cents <= 0) return { error: 'unknown-event' };
    if (!buyer || !UUID.test(asStr(buyer.userId))) return { error: 'sign-in-required' };
    p.set('mode', 'payment');
    p.set('line_items[0][quantity]', '1');
    p.set('line_items[0][price_data][currency]', asStr(ev.currency) || 'usd');
    p.set('line_items[0][price_data][unit_amount]', String(cents));
    p.set('line_items[0][price_data][product_data][name]', asStr(ev.title) || 'Workshop seat');
    p.set('metadata[product]', 'workshop');
    p.set('metadata[eventId]', ev.id);
    p.set('metadata[userId]', buyer.userId);
    p.set('metadata[userKey]', asStr(buyer.email) || buyer.userId);
    p.set('client_reference_id', buyer.userId);
    if (asStr(buyer.email)) p.set('customer_email', buyer.email);
    return { params: p };
  }
  if (kind === 'subscription') {
    const tier = asStr(req?.tier);
    const priceId = asStr(tierPrices[tier]);
    if (!priceId) return { error: 'unknown-tier' };
    if (!buyer || !UUID.test(asStr(buyer.userId))) return { error: 'sign-in-required' };
    p.set('mode', 'subscription');
    p.set('line_items[0][quantity]', '1');
    p.set('line_items[0][price]', priceId);
    p.set('metadata[product]', tier);
    p.set('metadata[tier]', tier);
    p.set('metadata[userId]', buyer.userId);
    p.set('metadata[userKey]', asStr(buyer.email) || buyer.userId);
    p.set('client_reference_id', buyer.userId);
    if (asStr(buyer.email)) p.set('customer_email', buyer.email);
    // The subscription carries the person too, so renewals and cancellations
    // (customer.subscription.*) reach the same row without a lookup table.
    p.set('subscription_data[metadata][userId]', buyer.userId);
    p.set('subscription_data[metadata][tier]', tier);
    return { params: p };
  }
  return { error: 'unknown-kind' };
}

// Who is buying: the caller's own session, checked by the auth server that
// issued it. Returns { buyer } or { error, status }; never trusts the body.
export async function verifiedBuyer(request, env = {}, fetchImpl = fetch) {
  const jwt = /^Bearer\s+(.+)$/i.exec(asStr(request.headers.get('authorization')))?.[1] || '';
  if (!jwt) return { error: 'sign-in-required', status: 401 };
  const url = asStr(env.SUPABASE_URL).replace(/\/$/, '');
  const anon = asStr(env.SUPABASE_ANON_KEY) || asStr(env.VITE_SUPABASE_ANON_KEY);
  if (!url || !anon) return { error: 'identity-not-configured', status: 503 };
  let res;
  try {
    res = await fetchImpl(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${jwt}` } });
  } catch { return { error: 'identity-unreachable', status: 502 }; }
  if (!res || !res.ok) return { error: 'sign-in-required', status: 401 };
  const user = await res.json().catch(() => null);
  const userId = asStr(user?.id);
  if (!UUID.test(userId)) return { error: 'sign-in-required', status: 401 };
  return { buyer: { userId, email: asStr(user?.email) } };
}

// The workshop event a seat is bought at, read from the house's own table over
// the anon road (RLS shows only open and sold-out rows) with its seats left.
// Returns { event } (status/price from the row, never the client) or { error }.
export async function workshopEvent(eventId, env = {}, fetchImpl = fetch) {
  const id = asStr(eventId);
  if (!UUID.test(id)) return { error: 'unknown-event', status: 400 };
  const url = asStr(env.SUPABASE_URL).replace(/\/$/, '');
  const anon = asStr(env.SUPABASE_ANON_KEY) || asStr(env.VITE_SUPABASE_ANON_KEY);
  if (!url || !anon) return { error: 'identity-not-configured', status: 503 };
  const headers = { apikey: anon, Authorization: `Bearer ${anon}`, 'content-type': 'application/json' };
  let rowRes;
  try {
    rowRes = await fetchImpl(`${url}/rest/v1/workshop_events?id=eq.${encodeURIComponent(id)}&select=id,title,status,price_cents,currency,capacity`, { headers });
  } catch { return { error: 'event-unreachable', status: 502 }; }
  if (!rowRes || !rowRes.ok) return { error: 'event-unreachable', status: 502 };
  const rows = await rowRes.json().catch(() => null);
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return { error: 'unknown-event', status: 400 };
  let seatsLeft = null;
  try {
    const r = await fetchImpl(`${url}/rest/v1/rpc/workshop_seats_left`, { method: 'POST', headers, body: JSON.stringify({ p_event: id }) });
    if (r && r.ok) { const n = await r.json().catch(() => null); if (Number.isFinite(n)) seatsLeft = n; }
  } catch { /* unknown stays null: the row's status still governs */ }
  return {
    event: {
      id: asStr(row.id), title: asStr(row.title), status: asStr(row.status),
      priceCents: Number.isFinite(row.price_cents) ? row.price_cents : NaN,
      currency: asStr(row.currency) || 'usd', seatsLeft,
    },
  };
}

// Which subscriptions can really be bought right now: a Stripe key, a Price
// for the tier, and the identity road a subscription needs. Pure.
export function openTiers(env = {}) {
  if (!asStr(env.STRIPE_SECRET_KEY)) return [];
  if (!asStr(env.SUPABASE_URL) || !(asStr(env.SUPABASE_ANON_KEY) || asStr(env.VITE_SUPABASE_ANON_KEY))) return [];
  const prices = parseJsonEnv(env.STRIPE_TIER_PRICES);
  return Object.keys(prices).filter((t) => /^price_[A-Za-z0-9]+$/.test(asStr(prices[t]))).sort();
}

export async function onRequestGet(context) {
  return new Response(JSON.stringify({ subscriptions: openTiers(context.env || {}) }), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export async function onRequestPost(context) {
  const env = context.env || {};
  const secret = asStr(env.STRIPE_SECRET_KEY);
  if (!secret) return json({ error: 'processor-not-configured' }, 503);

  let body;
  try { body = await context.request.json(); } catch { return json({ error: 'bad-json' }, 400); }

  let buyer = null;
  const kind = asStr(body?.kind);
  const hasToken = /^Bearer\s+\S+/i.test(asStr(context.request.headers.get('authorization')));
  // A subscription and a workshop seat are a PERSON's: the buyer must be
  // verified. A book may be bought as a guest, but a signed-in buyer is
  // verified too, so the webhook can hand them the book.
  if (kind === 'subscription' || kind === 'workshop' || (kind === 'book' && hasToken)) {
    const who = await verifiedBuyer(context.request, env);
    if (who.error) return json({ error: who.error }, who.status);
    buyer = who.buyer;
  }
  let event = null;
  if (kind === 'workshop') {
    const found = await workshopEvent(body?.eventId, env);
    if (found.error) return json({ error: found.error }, found.status);
    event = found.event;
  }

  const origin = new URL(context.request.url).origin;
  const built = toStripeSessionParams(body, {
    catalog: parseJsonEnv(env.STRIPE_CATALOG),
    tierPrices: parseJsonEnv(env.STRIPE_TIER_PRICES),
    origin,
    instanceId: asStr(env.PAYMENTS_INSTANCE_ID),
    buyer,
    event,
  });
  if (built.error) return json({ error: built.error }, 400);

  let upstream;
  try {
    upstream = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: built.params.toString(),
    });
  } catch { return json({ error: 'stripe-unreachable' }, 502); }
  if (!upstream.ok) return json({ error: `stripe-${upstream.status}` }, 502);
  const session = await upstream.json();
  // The client only ever needs the redirect target — no Stripe internals leak.
  return json({ url: asStr(session?.url), id: asStr(session?.id) });
}
