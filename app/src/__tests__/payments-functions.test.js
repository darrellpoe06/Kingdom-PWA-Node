// =============================================================================
// payments-functions tests — the /api/checkout + /api/stripe-webhook functions
// proven against the REAL modules (DR-0230 brick two; DR-0076: test-mode
// proven in CI before any live key exists).
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  safeReturnPath, parseJsonEnv, toStripeSessionParams,
  onRequestPost as checkoutPost,
} from '../../functions/api/checkout.js';
import {
  PRODUCT_ENTITY as WEBHOOK_PRODUCT_ENTITY,
  parseSignatureHeader, verifyStripeSignature, normalizeStripeEvent, toTableRow,
  subscriptionActivation, ACTIVATABLE_TIERS,
  onRequestPost as webhookPost,
} from '../../functions/api/stripe-webhook.js';
import { PRODUCT_ENTITY, normalizePayment } from '../lib/payments-ledger.js';

afterEach(() => vi.unstubAllGlobals());

const CATALOG = { 'book-flocks': 1499 };
const TIERS = { family: 'price_fam_123' };

describe('checkout — price truth is server-side', () => {
  it('charges the CATALOG amount, never the client-said amount', () => {
    const { params } = toStripeSessionParams(
      { kind: 'book', productId: 'book-flocks', title: 'Know Thy Flocks', amountCents: 1, userKey: 'u1' },
      { catalog: CATALOG, origin: 'https://poetech.us' },
    );
    expect(params.get('line_items[0][price_data][unit_amount]')).toBe('1499');
    expect(params.get('mode')).toBe('payment');
    expect(params.get('metadata[product]')).toBe('book-flocks');
    expect(params.get('metadata[userKey]')).toBe('u1');
  });

  it('rejects a product the owner never priced — no catalog row, no charge', () => {
    expect(toStripeSessionParams({ kind: 'book', productId: 'not-in-catalog' }, { catalog: CATALOG }).error).toBe('unknown-product');
    expect(toStripeSessionParams({ kind: 'subscription', tier: 'mystery' }, { tierPrices: TIERS }).error).toBe('unknown-tier');
    expect(toStripeSessionParams({ kind: 'weird' }, {}).error).toBe('unknown-kind');
  });

  it('builds a subscription from the owner-configured Stripe Price id', () => {
    const { params } = toStripeSessionParams(
      { kind: 'subscription', tier: 'family', userKey: 'u1' },
      { tierPrices: TIERS, origin: 'https://poetech.us', instanceId: 'inst-1' },
    );
    expect(params.get('mode')).toBe('subscription');
    expect(params.get('line_items[0][price]')).toBe('price_fam_123');
    expect(params.get('metadata[instanceId]')).toBe('inst-1');
  });

  it('only same-site return paths ride the redirect (open-redirect guard)', () => {
    expect(safeReturnPath('/poetech-app/?tab=books', '/x')).toBe('/poetech-app/?tab=books');
    expect(safeReturnPath('https://evil.example/steal', '/x')).toBe('/x');
    expect(safeReturnPath('//evil.example', '/x')).toBe('/x');
  });

  it('parseJsonEnv never throws and only accepts an object', () => {
    expect(parseJsonEnv('{"a":1}')).toEqual({ a: 1 });
    expect(parseJsonEnv('not json')).toEqual({});
    expect(parseJsonEnv('[1,2]')).toEqual({});
    expect(parseJsonEnv(undefined)).toEqual({});
  });

  it('answers 503 processor-not-configured with no key — not a cent can move', async () => {
    const res = await checkoutPost({ env: {}, request: new Request('https://poetech.us/api/checkout', { method: 'POST', body: '{}' }) });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('processor-not-configured');
  });

  it('POSTs Stripe with the secret and returns only the redirect url', async () => {
    const calls = [];
    vi.stubGlobal('fetch', async (url, init) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ id: 'cs_1', url: 'https://checkout.stripe.com/c/1', secret_stuff: 'x' }), { status: 200 });
    });
    const res = await checkoutPost({
      env: { STRIPE_SECRET_KEY: 'sk_test_1', STRIPE_CATALOG: JSON.stringify(CATALOG) },
      request: new Request('https://poetech.us/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ kind: 'book', productId: 'book-flocks', successUrl: '/poetech-app/?paid=1' }),
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ url: 'https://checkout.stripe.com/c/1', id: 'cs_1' }); // no Stripe internals leak
    expect(calls[0].url).toBe('https://api.stripe.com/v1/checkout/sessions');
    expect(calls[0].init.headers.Authorization).toBe('Bearer sk_test_1');
    expect(calls[0].init.body).toContain('success_url=https%3A%2F%2Fpoetech.us%2Fpoetech-app%2F%3Fpaid%3D1');
  });
});

const sign = (payload, secret, t) =>
  `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')}`;

describe('stripe-webhook — signature is the door', () => {
  const now = 1784592000;

  it('accepts a correctly signed payload and rejects tamper/stale/none', async () => {
    const payload = JSON.stringify({ id: 'evt_1' });
    expect(await verifyStripeSignature(payload, sign(payload, 'whsec_1', now), 'whsec_1', now)).toBe(true);
    expect(await verifyStripeSignature(payload + 'x', sign(payload, 'whsec_1', now), 'whsec_1', now)).toBe(false);
    expect(await verifyStripeSignature(payload, sign(payload, 'whsec_WRONG', now), 'whsec_1', now)).toBe(false);
    expect(await verifyStripeSignature(payload, sign(payload, 'whsec_1', now - 301), 'whsec_1', now)).toBe(false);
    expect(await verifyStripeSignature(payload, '', 'whsec_1', now)).toBe(false);
  });

  it('parses Stripe signature headers, ignoring malformed parts', () => {
    const p = parseSignatureHeader(`t=123,v1=${'a'.repeat(64)},v0=junk,v1=zz`);
    expect(p.t).toBe(123);
    expect(p.v1).toEqual(['a'.repeat(64)]);
  });
});

describe('stripe-webhook — the write path', () => {
  const evt = {
    id: 'evt_9', type: 'checkout.session.completed', created: 1784592000,
    data: { object: { id: 'cs_9', payment_intent: 'pi_9', payment_status: 'paid', amount_total: 4400, currency: 'usd', metadata: { product: 'moore-order', instanceId: 'inst-poe' }, customer_details: { email: 'p@example.com' } } },
  };
  const env = { STRIPE_WEBHOOK_SECRET: 'whsec_1', SUPABASE_URL: 'https://db.example.co/', SUPABASE_SERVICE_KEY: 'srv_1' };
  const post = (payload, header, e = env) =>
    webhookPost({ env: e, request: new Request('https://poetech.us/api/stripe-webhook', { method: 'POST', body: payload, headers: header ? { 'stripe-signature': header } : {} }) });

  it('answers 503 unconfigured — Stripe retries until the Governor wires it', async () => {
    expect((await post('{}', null, {})).status).toBe(503);
  });

  it('rejects an unsigned delivery without touching the ledger', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await post(JSON.stringify(evt), 't=1,v1=deadbeef');
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('writes a verified settle event as an idempotent append-only insert', async () => {
    const calls = [];
    vi.stubGlobal('fetch', async (url, init) => { calls.push({ url, init }); return new Response(null, { status: 201 }); });
    const payload = JSON.stringify(evt);
    const t = Math.floor(Date.now() / 1000);
    const res = await post(payload, sign(payload, 'whsec_1', t));
    expect(res.status).toBe(200);
    expect(calls[0].url).toBe('https://db.example.co/rest/v1/payments?on_conflict=provider,provider_event_id');
    expect(calls[0].init.headers.Prefer).toContain('ignore-duplicates');
    const [rowSent] = JSON.parse(calls[0].init.body);
    expect(rowSent.provider_event_id).toBe('evt_9');
    expect(rowSent.amount_cents).toBe(4400);
    expect(rowSent.entity_id).toBe('e-moore');
    expect(rowSent.instance_id).toBe('inst-poe'); // scoped from checkout metadata
    expect(rowSent.status).toBe('settled');
  });

  it('acknowledges-and-ignores event types outside the handled set', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const payload = JSON.stringify({ id: 'evt_x', type: 'customer.created' });
    const t = Math.floor(Date.now() / 1000);
    const res = await post(payload, sign(payload, 'whsec_1', t));
    expect(res.status).toBe(200);
    expect((await res.json()).ignored).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('stripe-webhook — a settled SUBSCRIPTION activates the tier (DR-0263: the ledger-only gap)', () => {
  const subEvt = (over = {}) => ({
    id: 'evt_s1', type: 'checkout.session.completed', created: 1784592000,
    data: { object: { id: 'cs_s1', payment_status: 'paid', amount_total: 900, currency: 'usd', customer: 'cus_1', subscription: 'sub_1', metadata: { kind: 'subscription', tier: 'poetech-plus', instanceId: 'inst-poe' }, ...over } },
  });
  const env = { STRIPE_WEBHOOK_SECRET: 'whsec_1', SUPABASE_URL: 'https://db.example.co', SUPABASE_SERVICE_KEY: 'srv_1' };
  const post = (payload, header) =>
    webhookPost({ env, request: new Request('https://poetech.us/api/stripe-webhook', { method: 'POST', body: payload, headers: { 'stripe-signature': header } }) });

  it('extracts the activation from a settled subscription checkout', () => {
    const a = subscriptionActivation(subEvt());
    expect(a).toEqual({ tier: 'poetech-plus', stripeCustomerId: 'cus_1', stripeSubscriptionId: 'sub_1' });
  });

  it('CATCHES the non-activating shapes — a book purchase, an unknown tier, an unpaid session never flip a tier', () => {
    expect(subscriptionActivation({ ...subEvt(), data: { object: { payment_status: 'paid', metadata: { kind: 'book', product: 'p1' } } } })).toBeNull();
    expect(subscriptionActivation(subEvt({ metadata: { kind: 'subscription', tier: 'not-a-tier', instanceId: 'inst-poe' } }))).toBeNull();
    expect(subscriptionActivation(subEvt({ payment_status: 'unpaid', status: 'open' }))).toBeNull();
    expect(ACTIVATABLE_TIERS).not.toContain('foundation'); // the free tier is never a purchase
  });

  it('PATCHes the instance subscription row to the paid tier after the ledger write', async () => {
    const calls = [];
    vi.stubGlobal('fetch', async (url, init) => {
      calls.push({ url, init });
      if (String(url).includes('/rest/v1/payments')) return new Response(null, { status: 201 });
      return new Response(JSON.stringify([{ id: 'row1' }]), { status: 200 });
    });
    const payload = JSON.stringify(subEvt());
    const t = Math.floor(Date.now() / 1000);
    const res = await post(payload, sign(payload, 'whsec_1', t));
    const body = await res.json();
    expect(body.activation).toBe('activated');
    expect(body.tier).toBe('poetech-plus');
    const patch = calls.find((c) => String(c.url).includes('instance_subscriptions'));
    expect(patch.url).toContain('instance_id=eq.inst-poe');
    expect(patch.init.method).toBe('PATCH');
    const sent = JSON.parse(patch.init.body);
    expect(sent.tier).toBe('poetech-plus');
    expect(sent.status).toBe('active');
    expect(sent.stripe_subscription_id).toBe('sub_1');
  });

  it('reports a MISSING subscription row honestly — the payment stays ledgered, the gap is named, Stripe still gets its 200', async () => {
    vi.stubGlobal('fetch', async (url) => {
      if (String(url).includes('/rest/v1/payments')) return new Response(null, { status: 201 });
      return new Response(JSON.stringify([]), { status: 200 });
    });
    const payload = JSON.stringify(subEvt());
    const t = Math.floor(Date.now() / 1000);
    const res = await post(payload, sign(payload, 'whsec_1', t));
    expect(res.status).toBe(200);
    expect((await res.json()).activation).toBe('no-subscription-row');
  });
});

describe('CONFORMANCE — the webhook mirror never drifts from the engine (DR-0076)', () => {
  it('PRODUCT_ENTITY maps are identical', () => {
    expect(WEBHOOK_PRODUCT_ENTITY).toEqual(PRODUCT_ENTITY);
  });

  it('normalizeStripeEvent === normalizePayment on shared fixtures', () => {
    const fixtures = [
      [{ id: 'evt_1', created: 1784592000, data: { object: { id: 'cs_1', payment_intent: 'pi_1', payment_status: 'paid', amount_total: 12500, currency: 'usd', metadata: { product: 'poetech-plus' }, customer_details: { email: 'a@b.c' } } } }, { feeCents: 393 }],
      [{ id: 'evt_2', created: 1784592000, data: { object: { id: 'pi_2', status: 'succeeded', amount: 5000, receipt_email: 'r@b.c' } } }, { product: 'tlc-session' }],
      [{}, {}],
      [{ id: 'evt_3', data: { object: { payment_status: 'unpaid', metadata: { product: 'mystery' } } } }, {}],
    ];
    for (const [e, m] of fixtures) {
      expect(normalizeStripeEvent(e, m)).toEqual(normalizePayment(e, m));
    }
  });

  it('toTableRow carries every engine field into the 0116 column shape', () => {
    const row = normalizePayment(
      { id: 'evt_1', created: 1784592000, data: { object: { id: 'cs_1', payment_intent: 'pi_1', payment_status: 'paid', amount_total: 100, currency: 'usd', metadata: { product: 'book' } } } },
      { feeCents: 10 },
    );
    expect(toTableRow(row, { instanceId: 'i1' })).toEqual({
      instance_id: 'i1', provider: 'stripe', provider_event_id: 'evt_1', provider_payment_id: 'pi_1',
      status: 'settled', amount_cents: 100, fee_cents: 10, net_cents: 90, currency: 'usd',
      product_key: 'book', entity_id: 'e-personal', payer_email: null, occurred_at: '2026-07-21T00:00:00.000Z',
    });
  });
});
