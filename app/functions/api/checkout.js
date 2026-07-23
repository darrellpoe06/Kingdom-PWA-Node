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

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

const asStr = (v) => (typeof v === 'string' ? v : '');

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
export function toStripeSessionParams(req, { catalog = {}, tierPrices = {}, origin = '', instanceId = '' } = {}) {
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
    return { params: p };
  }
  if (kind === 'subscription') {
    const tier = asStr(req?.tier);
    const priceId = asStr(tierPrices[tier]);
    if (!priceId) return { error: 'unknown-tier' };
    p.set('mode', 'subscription');
    p.set('line_items[0][quantity]', '1');
    p.set('line_items[0][price]', priceId);
    p.set('metadata[product]', tier);
    return { params: p };
  }
  return { error: 'unknown-kind' };
}

export async function onRequestPost(context) {
  const env = context.env || {};
  const secret = asStr(env.STRIPE_SECRET_KEY);
  if (!secret) return json({ error: 'processor-not-configured' }, 503);

  let body;
  try { body = await context.request.json(); } catch { return json({ error: 'bad-json' }, 400); }

  const origin = new URL(context.request.url).origin;
  const built = toStripeSessionParams(body, {
    catalog: parseJsonEnv(env.STRIPE_CATALOG),
    tierPrices: parseJsonEnv(env.STRIPE_TIER_PRICES),
    origin,
    instanceId: asStr(env.PAYMENTS_INSTANCE_ID),
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
