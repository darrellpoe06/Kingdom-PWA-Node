// =============================================================================
// Cloudflare Pages Function — /api/billing-portal (DR-1432: PoeTech+ checkout)
// =============================================================================
// A subscription a person cannot cancel by themselves is not one we sell. This
// opens Stripe's own customer portal (update the card, see receipts, cancel)
// for the person signed in, and only for them.
//
// IDENTITY IS THE DATABASE'S, NOT RE-IMPLEMENTED HERE (the /api/push-send
// model): the caller's own session reads member_subscriptions, whose RLS
// (migration 0321) returns only that person's row. No service key is used, so
// this road cannot open anybody else's billing even if it had a bug.
//
// Env: STRIPE_SECRET_KEY, STRIPE_PORTAL_CONFIG, SUPABASE_URL, SUPABASE_ANON_KEY
// (all on the Pages project once poetech-plus-keys.yml has run). Unconfigured
// -> 503.
// =============================================================================

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const asStr = (v) => (typeof v === 'string' ? v : '');

/** Only a same-site path may be the return target (no open redirect). Pure. */
export function portalReturnPath(v, fallback = '/poetech-app/') {
  const s = asStr(v).trim();
  return s.startsWith('/') && !s.startsWith('//') ? s : fallback;
}

export async function onRequestPost(context) {
  const env = context.env || {};
  const secret = asStr(env.STRIPE_SECRET_KEY);
  const url = asStr(env.SUPABASE_URL).replace(/\/$/, '');
  const anon = asStr(env.SUPABASE_ANON_KEY) || asStr(env.VITE_SUPABASE_ANON_KEY);
  if (!secret || !url || !anon) return json({ error: 'processor-not-configured' }, 503);

  const jwt = /^Bearer\s+(.+)$/i.exec(asStr(context.request.headers.get('authorization')))?.[1] || '';
  if (!jwt) return json({ error: 'sign-in-required' }, 401);

  let body = {};
  try { body = await context.request.json(); } catch { body = {}; }

  let read;
  try {
    read = await fetch(`${url}/rest/v1/member_subscriptions?select=stripe_customer_id&limit=1`, {
      headers: { apikey: anon, Authorization: `Bearer ${jwt}` },
    });
  } catch { return json({ error: 'member-unreachable' }, 502); }
  if (read.status === 401 || read.status === 403) return json({ error: 'sign-in-required' }, 401);
  if (!read.ok) return json({ error: `member-${read.status}` }, 502);
  const rows = await read.json().catch(() => []);
  const customer = asStr(Array.isArray(rows) && rows[0] ? rows[0].stripe_customer_id : '');
  if (!customer) return json({ error: 'no-subscription' }, 404);

  const origin = new URL(context.request.url).origin;
  const p = new URLSearchParams();
  p.set('customer', customer);
  p.set('return_url', origin + portalReturnPath(body?.returnPath));
  // The portal made for PoeTech+ by poetech-plus-keys.yml (card, invoices, cancel).
  if (/^bpc_[A-Za-z0-9]+$/.test(asStr(env.STRIPE_PORTAL_CONFIG))) p.set('configuration', env.STRIPE_PORTAL_CONFIG);
  let upstream;
  try {
    upstream = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: p.toString(),
    });
  } catch { return json({ error: 'stripe-unreachable' }, 502); }
  if (!upstream.ok) return json({ error: `stripe-${upstream.status}` }, 502);
  const session = await upstream.json().catch(() => null);
  return json({ url: asStr(session?.url) });
}
