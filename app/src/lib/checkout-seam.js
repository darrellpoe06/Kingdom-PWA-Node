// checkout-seam.js — the PAYMENT PROCESSOR seam. NO SECRETS, NO MONEY MOVED HERE.
//
// BINDING (Darrell, standing rule): the build does NOT process payments, handle
// card/bank details, or move money. We build the storefront + entitlement +
// access. A real processor (Stripe) handles the money, configured by DARRELL
// with his own account + keys (his hand). The secret key + webhook-signature
// verification live SERVER-SIDE (an n8n webhook or a serverless function Darrell
// owns) — never in this repo, never in the client.
//
// This module: (1) builds the checkout REQUEST the client posts (what to buy +
// where to return), (2) executes it against Darrell's configured endpoint
// (preview -> execute; if unconfigured it PREVIEWS only and never charges),
// (3) maps a verified webhook outcome to the entitlement to grant.
//
// PURE except executeCheckout (one fetch, injectable for tests).

const asStr = (v) => (typeof v === 'string' ? v : '');
const asNum = (v, d = 0) => (Number.isFinite(v) ? v : d);

export const PROCESSOR_NOTE =
  'Money is the owner\'s hand. PoeTech builds the storefront, entitlement, and ' +
  'access; a payment processor (Stripe) moves the money, configured by Darrell ' +
  'with his own account and keys. No card details or secrets are handled in the ' +
  'app or this repo — the secret key and webhook verification live server-side.';

// The same-origin endpoints Darrell configures (per the n8n same-origin rule —
// never the absolute Funnel URL). The server behind these holds the secret key
// and creates the Stripe Checkout Session.
export function checkoutEndpoint(base = '/n8n') { return `${base}/webhook/book-checkout`; }
export function subscriptionEndpoint(base = '/n8n') { return `${base}/webhook/subscribe`; }

// Is a processor wired up? Until Darrell configures it, the store previews the
// request but cannot charge.
export function processorConfigured(config) {
  return !!(config && config.enabled && asStr(config.endpoint).trim());
}

// Build the request the client POSTs for a one-off BOOK purchase. No keys; just
// what to buy + where to return. The server attaches the price + secret key.
export function buildBookCheckoutRequest(product, sub, { successUrl, cancelUrl, nowIso } = {}) {
  return {
    kind: 'book',
    mode: 'payment',
    productId: asStr(product?.id),
    bookId: asStr(product?.bookId) || asStr(product?.recipeId),
    title: asStr(product?.title),
    amountCents: Math.max(0, asNum(product?.priceCents, 0)),
    currency: asStr(product?.currency) || 'usd',
    userKey: asStr(sub?.userKey),
    successUrl: asStr(successUrl),
    cancelUrl: asStr(cancelUrl),
    createdIso: asStr(nowIso),
    metadata: { productId: asStr(product?.id), userKey: asStr(sub?.userKey), kind: 'book' },
  };
}

// Build the request for a unified-subscriber SUBSCRIPTION (after the 90-day free
// period, or to upgrade). One subscriber, one subscription across the app.
export function buildSubscriptionCheckoutRequest(tier, sub, { successUrl, cancelUrl, nowIso } = {}) {
  return {
    kind: 'subscription',
    mode: 'subscription',
    tier: asStr(tier),
    userKey: asStr(sub?.userKey),
    successUrl: asStr(successUrl),
    cancelUrl: asStr(cancelUrl),
    createdIso: asStr(nowIso),
    metadata: { tier: asStr(tier), userKey: asStr(sub?.userKey), kind: 'subscription' },
  };
}

// preview -> execute. If no processor is configured, returns { configured:false }
// with the request for preview — it NEVER charges. When configured, POSTs and
// expects { url } (the Stripe Checkout URL) to send the buyer to.
export async function executeCheckout(request, { config, fetchImpl } = {}) {
  if (!processorConfigured(config)) {
    return { ok: false, configured: false, request, note: PROCESSOR_NOTE };
  }
  const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!doFetch) return { ok: false, configured: true, error: 'no-fetch', request };
  try {
    const res = await doFetch(config.endpoint, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request),
    });
    if (!res || !res.ok) return { ok: false, configured: true, error: `http-${res ? res.status : 'no-response'}`, request };
    const data = await res.json();
    return { ok: !!data?.url, configured: true, url: asStr(data?.url), request };
  } catch (e) {
    return { ok: false, configured: true, error: asStr(e?.message) || 'network', request };
  }
}

// Map a VERIFIED webhook outcome (the server already checked the Stripe
// signature + that the money cleared) to the entitlement to grant locally.
// Pure: returns null for anything it doesn't recognize.
export function entitlementFromWebhook(event) {
  const type = asStr(event?.type);
  const md = event?.metadata || event?.data?.metadata || {};
  const userKey = asStr(md.userKey || event?.userKey);
  if (!userKey) return null;
  if (type === 'book.purchased' || (md.kind === 'book' && type === 'checkout.session.completed')) {
    const productId = asStr(md.productId || event?.productId);
    return productId ? { kind: 'book', userKey, productId } : null;
  }
  if (type === 'subscription.active' || (md.kind === 'subscription' && type === 'checkout.session.completed')) {
    return {
      kind: 'subscription', userKey,
      tier: asStr(md.tier || event?.tier),
      periodEndIso: asStr(event?.currentPeriodEndIso || event?.data?.current_period_end_iso),
      stripeCustomerId: asStr(event?.stripeCustomerId || event?.data?.customer),
    };
  }
  return null;
}
