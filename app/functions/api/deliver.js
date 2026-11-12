// =============================================================================
// Cloudflare Pages Function — /api/deliver (DR-1449: instant delivery)
// =============================================================================
// A Payhip-class store hands the buyer their download the moment the card
// clears. Ours does the same on our own door: Stripe sends the buyer back
// with `session_id`, the app asks THIS function what that session bought,
// and this function asks Stripe itself (the secret key never leaves the
// Pages env). Only a PAID session that our own checkout made (metadata.kind
// 'book', the same firewall line as the webhook, DR-1438) is answered, and
// the answer is only what the app needs to deliver: the product ids granted
// and the buyer's email for the receipt line. No Stripe internals, no
// amounts, no card. A guest's book is delivered to the device that bought
// it; a signed-in buyer's is also written to their own rows by the webhook,
// so it is theirs on every device.
//
// The CONTENT is never served here: the app already holds the corpus and
// builds the EPUB, HTML and Markdown itself (book-formats.js). This function
// only says what was bought.
// =============================================================================
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const asStr = (v) => (typeof v === 'string' ? v : '');
const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;

// A Stripe Checkout Session (as Stripe returns it) -> what the app may
// deliver, or { error }. Pure. Only a paid book session our seam made.
export function deliveryFromSession(session) {
  const s = session && typeof session === 'object' ? session : {};
  const md = s.metadata || {};
  if (asStr(md.kind) !== 'book') return { error: 'not-a-book' };
  if (s.payment_status !== 'paid') return { error: 'not-paid' };
  const product = asStr(md.product) || asStr(md.productId);
  if (!product) return { error: 'no-product' };
  const grants = asStr(md.grants).split(',').map((x) => x.trim()).filter(Boolean);
  return {
    kind: 'book',
    product,
    grants: [...new Set([product, ...grants])],
    email: asStr(s.customer_details && s.customer_details.email) || asStr(s.customer_email) || null,
    userId: asStr(md.userId) || null,
  };
}

export async function onRequestGet(context) {
  const env = context.env || {};
  const secret = asStr(env.STRIPE_SECRET_KEY);
  if (!secret) return json({ error: 'processor-not-configured' }, 503);
  const id = asStr(new URL(context.request.url).searchParams.get('session_id'));
  if (!SESSION_ID.test(id)) return json({ error: 'bad-session' }, 400);
  let upstream;
  try {
    upstream = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${secret}` } });
  } catch { return json({ error: 'stripe-unreachable' }, 502); }
  if (!upstream.ok) return json({ error: upstream.status === 404 ? 'unknown-session' : `stripe-${upstream.status}` }, upstream.status === 404 ? 404 : 502);
  const session = await upstream.json().catch(() => null);
  const d = deliveryFromSession(session);
  if (d.error) return json({ error: d.error }, 400);
  return json({ ok: true, ...d });
}
