#!/usr/bin/env node
// =============================================================================
// poetech-plus-keys — from ONE value Darrell holds to a working checkout (DR-1432)
// =============================================================================
// DR-0263 listed the go-live as the Governor's ~30 minutes: create a Product and
// Price in Stripe, copy a Price id, create a webhook, copy its signing secret,
// paste four values into Cloudflare. DR-0108 says a stated "must be by hand"
// is a premise to challenge, and only one of those values is truly his: the
// Stripe SECRET KEY (his account, his name). Everything else the key itself
// can make. This script, run by poetech-plus-keys.yml with that one secret:
//
//   1. finds or makes the PoeTech+ Price ($39.00 / month, lookup key
//      poetech-plus-monthly) and REFUSES an existing one at any other amount,
//      because whatever Price exists is what people are charged;
//   2. finds or makes the webhook to https://poetech.us/api/stripe-webhook
//      with exactly the events the webhook acts on (its signing secret is only
//      ever shown at creation, so an existing endpoint is kept when the Pages
//      project already holds a secret, and replaced when it does not);
//   3. finds or makes a customer-portal configuration that lets a member
//      update the card, see invoices and cancel;
//   4. writes the Pages secrets as one JSON file (0600) for wrangler, never
//      printing a value.
//
// Every call has a timeout; any failure stops before anything is written.
// =============================================================================
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const PRICE_LOOKUP_KEY = 'poetech-plus-monthly';
export const PRICE_CENTS = 3900;
export const WEBHOOK_URL = 'https://poetech.us/api/stripe-webhook';
export const WEBHOOK_API_VERSION = '2024-06-20';
export const WEBHOOK_EVENTS = Object.freeze(['checkout.session.completed', 'invoice.paid', 'customer.subscription.updated', 'customer.subscription.deleted']);
const TIMEOUT_MS = 20000;

/** 'test' | 'live' | null from the key's own prefix. Pure. */
export function keyMode(key) {
  const k = String(key || '');
  if (/^(sk|rk)_test_[A-Za-z0-9]+$/.test(k)) return 'test';
  if (/^(sk|rk)_live_[A-Za-z0-9]+$/.test(k)) return 'live';
  return null;
}

/** Is this Stripe Price exactly PoeTech+ ($39.00 USD every month)? Pure. */
export function priceIsRight(p) {
  return !!(
    p &&
    p.active !== false &&
    p.unit_amount === PRICE_CENTS &&
    String(p.currency).toLowerCase() === 'usd' &&
    p.recurring &&
    p.recurring.interval === 'month' &&
    (p.recurring.interval_count || 1) === 1
  );
}

/** Does this endpoint send exactly what the webhook needs (and to us)? Pure. */
export function endpointIsRight(e) {
  if (!e || e.url !== WEBHOOK_URL || e.status === 'disabled') return false;
  const ev = new Set(e.enabled_events || []);
  return WEBHOOK_EVENTS.every((x) => ev.has(x) || ev.has('*'));
}

function form(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x, i) => out.append(`${key}[${i}]`, String(x)));
    else if (v && typeof v === 'object') form(v, key, out);
    else if (v !== undefined && v !== null) out.append(key, String(v));
  }
  return out;
}

function stripe(key) {
  return async (method, path, body) => {
    const res = await fetch(`https://api.stripe.com/v1/${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: body ? form(body).toString() : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Stripe ${method} ${path.split('?')[0]} answered ${res.status}: ${data?.error?.message || 'no message'}`);
    return data;
  };
}

async function main() {
  const args = process.argv.slice(2);
  const out = args[args.indexOf('--out') + 1];
  const haveSecret = args.includes('--pages-has-webhook-secret');
  const key = String(process.env.STRIPE_SECRET_KEY || '').trim();
  const mode = keyMode(key);
  if (!mode) throw new Error('STRIPE_SECRET_KEY is not a Stripe secret key (sk_test_... or sk_live_...). Nothing was changed.');
  if (!out || out.startsWith('--')) throw new Error('usage: --out <file>');
  const s = stripe(key);
  console.log(`Stripe key mode: ${mode}`);

  // 1. The Price.
  const found = await s('GET', `prices?lookup_keys[]=${PRICE_LOOKUP_KEY}&active=true&limit=1`);
  let price = found.data && found.data[0];
  if (price && !priceIsRight(price)) {
    throw new Error(
      `The Price under ${PRICE_LOOKUP_KEY} (${price.id}) is not $39.00/month. It is what people would be charged, so nothing was changed; archive it in Stripe or fix it, then re-run.`
    );
  }
  if (!price) {
    const product = await s('POST', 'products', {
      name: 'PoeTech+',
      description: 'The deeper levels of every PoeTech subject, in the Love Corner and PoeTech apps.',
    });
    price = await s('POST', 'prices', {
      product: product.id,
      unit_amount: PRICE_CENTS,
      currency: 'usd',
      recurring: { interval: 'month' },
      lookup_key: PRICE_LOOKUP_KEY,
    });
    console.log(`created the PoeTech+ Price ${price.id} ($39.00/month)`);
  } else {
    console.log(`found the PoeTech+ Price ${price.id} ($39.00/month)`);
  }

  // 2. The webhook.
  const eps = await s('GET', 'webhook_endpoints?limit=100');
  const ours = (eps.data || []).filter((e) => e.url === WEBHOOK_URL);
  const keep = haveSecret && ours.length === 1 && endpointIsRight(ours[0]);
  let webhookSecret = '';
  if (keep) {
    console.log(`kept webhook ${ours[0].id} (the Pages project already holds its signing secret)`);
  } else {
    for (const e of ours) {
      await s('DELETE', `webhook_endpoints/${e.id}`);
      console.log(`removed webhook ${e.id} (its signing secret cannot be read back)`);
    }
    const ep = await s('POST', 'webhook_endpoints', {
      url: WEBHOOK_URL,
      enabled_events: [...WEBHOOK_EVENTS],
      api_version: WEBHOOK_API_VERSION,
      description: 'PoeTech+ (DR-1432)',
    });
    webhookSecret = String(ep.secret || '');
    if (!/^whsec_/.test(webhookSecret)) throw new Error('Stripe made the webhook but returned no signing secret. Nothing was written.');
    console.log(`created webhook ${ep.id} for ${WEBHOOK_EVENTS.length} events`);
  }

  // 3. The customer portal (card, invoices, cancel).
  const cfgs = await s('GET', 'billing_portal/configurations?active=true&limit=100');
  let portal = (cfgs.data || []).find((c) => c.metadata && c.metadata.app === 'poetech-plus');
  if (!portal) {
    portal = await s('POST', 'billing_portal/configurations', {
      business_profile: { headline: 'PoeTech+: manage or cancel any time' },
      default_return_url: 'https://poetech.us/poetech-app/',
      features: {
        customer_update: { enabled: true, allowed_updates: ['email'] },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: true, mode: 'at_period_end' },
      },
      metadata: { app: 'poetech-plus' },
    });
    console.log(`created the customer portal ${portal.id}`);
  } else {
    console.log(`found the customer portal ${portal.id}`);
  }

  // 4. The Pages secrets, as one file for wrangler (values never printed).
  const secrets = {
    STRIPE_SECRET_KEY: key,
    STRIPE_TIER_PRICES: JSON.stringify({ 'poetech-plus': price.id }),
    STRIPE_PORTAL_CONFIG: portal.id,
  };
  if (webhookSecret) secrets.STRIPE_WEBHOOK_SECRET = webhookSecret;
  writeFileSync(out, JSON.stringify(secrets), { mode: 0o600 });
  console.log(`wrote ${Object.keys(secrets).sort().join(', ')} for the Pages project`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((e) => {
    console.error(`::error::${e.message}`);
    process.exit(1);
  });
}
