// @vitest-environment node
// =============================================================================
// the-square-adapter — Square joins the seam as the second processor
// (DR-1451): the same request, the same server-side price, the same
// metadata on the order, the same firewall, the same rows; Stripe untouched.
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  toSquarePaymentLink,
  catalogEntryShape,
  squareRedirect,
  ourSquareOrder,
  orderPaid,
  normalizeSquarePayment,
  squareGrants,
  squareSeat,
  verifySquareSignature,
  createSquarePaymentLink,
  retrieveSquareOrder,
  squareConfigured,
  squareBase,
  HOUSE,
} from '../../functions/_lib/square.js';
import {
  catalogEntry,
  openBooks,
  openProcessors,
  chooseProcessor,
  onRequestGet as checkoutGet,
  onRequestPost as checkoutPost,
} from '../../functions/api/checkout.js';
import { onRequestPost as squareWebhook, completedPayment, PRODUCT_ENTITY as WEBHOOK_ENTITY } from '../../functions/api/square-webhook.js';
import { deliveryFromSquareOrder, onRequestGet as deliverGet } from '../../functions/api/deliver.js';
import { PRODUCT_ENTITY, normalizePayment } from '../lib/payments-ledger.js';
import { normalizeStripeEvent } from '../../functions/api/stripe-webhook.js';
import { squareOrderFromSearch, deliveryRefFromSearch, deliveryReturnPaths, readDelivery } from '../lib/instant-delivery.js';
import { startSeatCheckout } from '../lib/workshops.js';

afterEach(() => vi.unstubAllGlobals());

const U = '11111111-2222-4333-8444-555555555555';
const EV = '22222222-3333-4444-8555-666666666666';
const CATALOG = {
  'prod-living-lessons': 999,
  'bundle-x': { cents: 1999, grants: ['prod-living-lessons', 'prod-eternal-algorithms'] },
  'prod-pwyw': { pwyw: { min: 500, preset: 1200 } },
};
const SQ = {
  SQUARE_ACCESS_TOKEN: 'sq0atp-x',
  SQUARE_LOCATION_ID: 'L1',
  SQUARE_WEBHOOK_SIGNATURE_KEY: 'k',
  SUPABASE_URL: 'https://db.example',
  SUPABASE_SERVICE_KEY: 'svc',
  SUPABASE_ANON_KEY: 'anon',
};
const ENV = { ...SQ, STRIPE_CATALOG: JSON.stringify(CATALOG) };
const sign = (key, url, body) =>
  createHmac('sha256', key)
    .update(url + body)
    .digest('base64');
const ourOrder = (extra = {}) => ({
  id: 'ORD1XYZ12ABC',
  state: 'OPEN',
  total_money: { amount: 999, currency: 'USD' },
  net_amount_due_money: { amount: 0, currency: 'USD' },
  tenders: [{ id: 't1', payment_id: 'PAY1' }],
  metadata: { house: HOUSE, kind: 'book', product: 'prod-living-lessons', userId: U, userKey: 'b@example.com' },
  ...extra,
});
const paymentEvent = (over = {}) => ({
  merchant_id: 'M',
  type: 'payment.updated',
  event_id: 'E1',
  created_at: '2026-11-12T17:00:00Z',
  data: {
    type: 'payment',
    id: 'PAY1',
    object: {
      payment: {
        id: 'PAY1',
        status: 'COMPLETED',
        order_id: 'ORD1XYZ12ABC',
        amount_money: { amount: 999, currency: 'USD' },
        buyer_email_address: 'b@example.com',
        processing_fee: [{ amount_money: { amount: 59, currency: 'USD' }, type: 'INITIAL' }],
        updated_at: '2026-11-12T17:00:01Z',
        ...over,
      },
    },
  },
});

describe('the catalog entry is one shape on every road', () => {
  it('catalogEntryShape MIRRORS catalogEntry (conformance; a drift fails here by name)', () => {
    for (const raw of [
      1499,
      0,
      -1,
      { cents: 500 },
      { cents: 0 },
      { pwyw: { min: 500, preset: 1200 } },
      { pwyw: { min: 500, preset: 100 } },
      { pwyw: { min: 0 } },
      { grants: ['a'], cents: 5 },
      null,
      'x',
      [1],
    ])
      expect(catalogEntryShape(raw)).toEqual(catalogEntry(raw));
  });
  it('the webhook mirrors PRODUCT_ENTITY', () => {
    expect(WEBHOOK_ENTITY).toEqual(PRODUCT_ENTITY);
  });
});

describe('the payment link: the server prices, the order carries the seam', () => {
  it('a book charges the CATALOG cents, never the client figure; the order metadata names the house, the kind, the product, the buyer', () => {
    const { body } = toSquarePaymentLink(
      { kind: 'book', productId: 'prod-living-lessons', title: 'Living Lessons', amountCents: 1, userKey: 'u' },
      { catalog: CATALOG, locationId: 'L1', instanceId: 'inst', buyer: { userId: U, email: 'b@example.com' }, idempotencyKey: 'idem-1' }
    );
    expect(body.order.line_items[0].base_price_money).toEqual({ amount: 999, currency: 'USD' });
    expect(body.order.line_items[0].quantity).toBe('1');
    expect(body.order.location_id).toBe('L1');
    expect(body.order.reference_id).toBe(U);
    expect(body.order.metadata).toEqual({
      house: 'poetech',
      kind: 'book',
      instanceId: 'inst',
      userId: U,
      userKey: 'b@example.com',
      product: 'prod-living-lessons',
    });
    expect(body.pre_populated_data).toEqual({ buyer_email: 'b@example.com' });
    expect(body.checkout_options).toEqual({ enable_coupon: true, ask_for_shipping_address: false, allow_tipping: false });
    expect(body.idempotency_key).toBe('idem-1');
    expect(JSON.stringify(body)).not.toContain('"amount":1,');
  });
  it('a guest book carries no buyer; a bundle stamps every grant; a pwyw entry charges its preset on Square (no name-your-price page here)', () => {
    const guest = toSquarePaymentLink({ kind: 'book', productId: 'prod-living-lessons', userKey: 'anon' }, { catalog: CATALOG, locationId: 'L1' }).body;
    expect(guest.order.reference_id).toBe('anon');
    expect(guest.order.metadata.userId).toBeUndefined();
    expect(guest.pre_populated_data).toBeUndefined();
    const bundle = toSquarePaymentLink({ kind: 'book', productId: 'bundle-x' }, { catalog: CATALOG, locationId: 'L1' }).body;
    expect(bundle.order.metadata.grants).toBe('prod-living-lessons,prod-eternal-algorithms');
    expect(bundle.order.line_items[0].base_price_money.amount).toBe(1999);
    const pwyw = toSquarePaymentLink({ kind: 'book', productId: 'prod-pwyw' }, { catalog: CATALOG, locationId: 'L1', couponsOn: false }).body;
    expect(pwyw.order.line_items[0].base_price_money.amount).toBe(1200);
    expect(pwyw.checkout_options.enable_coupon).toBe(false);
  });
  it('refuses what Stripe refuses: an unpriced product, a missing location, a seat without a buyer, a closed or sold-out event, a subscription (not built), an unknown kind', () => {
    expect(toSquarePaymentLink({ kind: 'book', productId: 'nope' }, { catalog: CATALOG, locationId: 'L1' }).error).toBe('unknown-product');
    expect(toSquarePaymentLink({ kind: 'book', productId: 'prod-living-lessons' }, { catalog: CATALOG }).error).toBe('processor-not-configured');
    const ev = { id: EV, title: 'Seat', status: 'open', priceCents: 4500, currency: 'usd', seatsLeft: 2 };
    expect(toSquarePaymentLink({ kind: 'workshop' }, { locationId: 'L1', event: ev }).error).toBe('sign-in-required');
    expect(toSquarePaymentLink({ kind: 'workshop' }, { locationId: 'L1', event: { ...ev, status: 'draft' }, buyer: { userId: U } }).error).toBe(
      'unknown-event'
    );
    expect(toSquarePaymentLink({ kind: 'workshop' }, { locationId: 'L1', event: { ...ev, seatsLeft: 0 }, buyer: { userId: U } }).error).toBe('sold-out');
    expect(toSquarePaymentLink({ kind: 'subscription', tier: 'poetech-plus' }, { locationId: 'L1', buyer: { userId: U } }).error).toBe(
      'square-subscription-not-built'
    );
    expect(toSquarePaymentLink({ kind: 'weird' }, { locationId: 'L1' }).error).toBe('unknown-kind');
    const seat = toSquarePaymentLink({ kind: 'workshop', eventId: EV }, { locationId: 'L1', event: ev, buyer: { userId: U, email: 'b@example.com' } }).body;
    expect(seat.order.line_items[0]).toEqual({ name: 'Seat', quantity: '1', base_price_money: { amount: 4500, currency: 'USD' } });
    expect(seat.order.metadata).toMatchObject({ house: 'poetech', kind: 'workshop', product: 'workshop', eventId: EV, userId: U });
  });
  it("squareRedirect puts the order id where Stripe's placeholder was", () => {
    expect(squareRedirect('https://poetech.us/poetech-app/?view=store&paid=1&session_id={CHECKOUT_SESSION_ID}', 'ORD1XYZ12ABC')).toBe(
      'https://poetech.us/poetech-app/?view=store&paid=1&square_order=ORD1XYZ12ABC'
    );
    expect(squareRedirect('https://poetech.us/poetech-app/', 'O/2')).toBe('https://poetech.us/poetech-app/?square_order=O%2F2');
  });
  it('createSquarePaymentLink: POSTs the body with the token and the version, then PUTs the redirect carrying the order id; a failed PUT still returns the link', async () => {
    const calls = [];
    const fetchImpl = vi.fn(async (url, init) => {
      calls.push({ url, method: init.method, headers: init.headers, body: JSON.parse(init.body) });
      if (init.method === 'POST')
        return {
          ok: true,
          status: 200,
          json: async () => ({ payment_link: { id: 'PL1', version: 1, order_id: 'ORD1XYZ12ABC', url: 'https://square.link/u/abc' } }),
        };
      return { ok: true, status: 200, json: async () => ({ payment_link: { id: 'PL1', version: 2 } }) };
    });
    const body = toSquarePaymentLink({ kind: 'book', productId: 'prod-living-lessons' }, { catalog: CATALOG, locationId: 'L1' }).body;
    const r = await createSquarePaymentLink(body, { env: SQ, successUrl: 'https://poetech.us/s?paid=1&session_id={CHECKOUT_SESSION_ID}', fetchImpl });
    expect(r).toEqual({ url: 'https://square.link/u/abc', orderId: 'ORD1XYZ12ABC', redirectSet: true });
    expect(calls[0].url).toBe('https://connect.squareup.com/v2/online-checkout/payment-links');
    expect(calls[0].headers.Authorization).toBe('Bearer sq0atp-x');
    expect(calls[0].headers['Square-Version']).toBe('2026-09-16');
    expect(calls[1]).toMatchObject({ url: 'https://connect.squareup.com/v2/online-checkout/payment-links/PL1', method: 'PUT' });
    expect(calls[1].body.payment_link.version).toBe(1);
    expect(calls[1].body.payment_link.checkout_options.redirect_url).toBe('https://poetech.us/s?paid=1&square_order=ORD1XYZ12ABC');
    const flaky = vi.fn(async (url, init) =>
      init.method === 'POST'
        ? { ok: true, status: 200, json: async () => ({ payment_link: { id: 'PL1', version: 1, order_id: 'ORD1XYZ12ABC', url: 'https://square.link/u/abc' } }) }
        : { ok: false, status: 500 }
    );
    expect((await createSquarePaymentLink(body, { env: SQ, successUrl: 'https://poetech.us/s', fetchImpl: flaky })).redirectSet).toBe(false);
    expect((await createSquarePaymentLink(body, { env: SQ, fetchImpl: async () => ({ ok: false, status: 401 }) })).error).toBe('square-401');
    expect(squareBase({ SQUARE_ENV: 'sandbox' })).toBe('https://connect.squareupsandbox.com');
  });
});

describe('/api/checkout with two processors', () => {
  it("GET names the open processors, the owner's first; books open on Square alone; a request chooses only an open processor", async () => {
    expect(openProcessors({})).toEqual([]);
    expect(openProcessors({ STRIPE_SECRET_KEY: 'sk' })).toEqual(['stripe']);
    expect(openProcessors(SQ)).toEqual(['square']);
    expect(openProcessors({ ...SQ, STRIPE_SECRET_KEY: 'sk' })).toEqual(['stripe', 'square']);
    expect(openProcessors({ ...SQ, STRIPE_SECRET_KEY: 'sk', PAYMENTS_PROCESSOR: 'square' })).toEqual(['square', 'stripe']);
    expect(openBooks(ENV)).toEqual(['bundle-x', 'prod-living-lessons', 'prod-pwyw']);
    expect(openBooks({ STRIPE_CATALOG: ENV.STRIPE_CATALOG })).toEqual([]);
    expect(chooseProcessor({ processor: 'square' }, { STRIPE_SECRET_KEY: 'sk' })).toBe('');
    expect(chooseProcessor({}, { ...SQ, STRIPE_SECRET_KEY: 'sk' })).toBe('stripe');
    expect(chooseProcessor({ processor: 'SQUARE' }, SQ)).toBe('square');
    const res = await checkoutGet({ env: ENV });
    expect(await res.json()).toEqual({ subscriptions: [], books: ['bundle-x', 'prod-living-lessons', 'prod-pwyw'], processors: ['square'] });
  });
  it('POST processor square: a guest book becomes a payment link and the app gets only the URL, the order id and how delivery comes; Stripe is never called', async () => {
    const urls = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        urls.push(String(url));
        if (init && init.method === 'POST')
          return {
            ok: true,
            status: 200,
            json: async () => ({ payment_link: { id: 'PL1', version: 1, order_id: 'ORD1XYZ12ABC', url: 'https://square.link/u/abc' } }),
          };
        return { ok: true, status: 200, json: async () => ({ payment_link: { id: 'PL1', version: 2 } }) };
      })
    );
    const res = await checkoutPost({
      env: ENV,
      request: new Request('https://poetech.us/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          kind: 'book',
          productId: 'prod-living-lessons',
          processor: 'square',
          successUrl: '/poetech-app/?view=store&paid=1&session_id={CHECKOUT_SESSION_ID}',
          cancelUrl: '/poetech-app/',
        }),
      }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://square.link/u/abc', id: 'ORD1XYZ12ABC', processor: 'square', delivery: 'on-return' });
    expect(urls.some((u) => u.includes('stripe.com'))).toBe(false);
    expect(urls[0]).toBe('https://connect.squareup.com/v2/online-checkout/payment-links');
  });
  it('POST naming a processor that is not open is refused by name; naming none with nothing open says not configured', async () => {
    const r1 = await checkoutPost({
      env: { STRIPE_SECRET_KEY: 'sk', STRIPE_CATALOG: ENV.STRIPE_CATALOG },
      request: new Request('https://poetech.us/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ kind: 'book', productId: 'prod-living-lessons', processor: 'square' }),
      }),
    });
    expect(r1.status).toBe(503);
    expect((await r1.json()).error).toBe('processor-not-open');
    const r2 = await checkoutPost({
      env: {},
      request: new Request('https://poetech.us/api/checkout', { method: 'POST', body: JSON.stringify({ kind: 'book', productId: 'x' }) }),
    });
    expect((await r2.json()).error).toBe('processor-not-configured');
  });
});

describe('the Square webhook: signed, ours, counted once, handed over', () => {
  const URL_ = 'https://poetech.us/api/square-webhook';
  const post = (body, { key = 'k', url = URL_, env = {} } = {}) =>
    squareWebhook({
      env: { ...SQ, SQUARE_WEBHOOK_URL: URL_, ...env },
      request: new Request(URL_, { method: 'POST', body, headers: { 'x-square-hmacsha256-signature': sign(key, url, body) } }),
    });
  it('verifySquareSignature: base64 HMAC-SHA-256 of the notification URL + body; the wrong key, URL or body fails (proven to catch)', async () => {
    const body = '{"a":1}';
    const sig = sign('k', URL_, body);
    expect(await verifySquareSignature(body, sig, 'k', URL_)).toBe(true);
    expect(await verifySquareSignature(body, sig, 'wrong', URL_)).toBe(false);
    expect(await verifySquareSignature(body, sig, 'k', 'https://other.example/hook')).toBe(false);
    expect(await verifySquareSignature('{"a":2}', sig, 'k', URL_)).toBe(false);
    expect(await verifySquareSignature(body, '', 'k', URL_)).toBe(false);
    expect(await verifySquareSignature(body, sig, '', URL_)).toBe(false);
  });
  it('an unsigned or wrongly signed delivery writes nothing (400); unconfigured answers 503', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const body = JSON.stringify(paymentEvent());
    expect((await post(body, { key: 'wrong' })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    expect((await squareWebhook({ env: {}, request: new Request(URL_, { method: 'POST', body }) })).status).toBe(503);
  });
  it('THE FIREWALL: a completed payment whose order is not ours (a shared account) is acknowledged and NOTHING is written', async () => {
    const calls = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        calls.push({ url: String(url), method: (init && init.method) || 'GET' });
        if (String(url).includes('/v2/orders/'))
          return { ok: true, status: 200, json: async () => ({ order: ourOrder({ metadata: { kind: 'book', product: 'x', note: 'a client' } }) }) };
        return { ok: true, status: 201, json: async () => [] };
      })
    );
    const res = await post(JSON.stringify(paymentEvent()));
    expect(await res.json()).toEqual({ received: true, ours: false });
    expect(calls.filter((c) => c.url.includes('db.example')).length).toBe(0);
  });
  it('our paid book: ONE ledger row keyed by the payment (fee from processing_fee, entity from the kind), one grant per book of the bundle, by URL', async () => {
    const calls = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        calls.push({
          url: String(url),
          method: (init && init.method) || 'GET',
          body: init && init.body ? JSON.parse(init.body) : null,
          headers: (init && init.headers) || {},
        });
        if (String(url).includes('/v2/orders/'))
          return {
            ok: true,
            status: 200,
            json: async () => ({
              order: ourOrder({ metadata: { ...ourOrder().metadata, product: 'bundle-x', grants: 'prod-living-lessons,prod-eternal-algorithms' } }),
            }),
          };
        return { ok: true, status: 201, json: async () => [] };
      })
    );
    const res = await post(JSON.stringify(paymentEvent()));
    expect(await res.json()).toEqual({
      received: true,
      counted: true,
      book: 'bundle-x',
      granted: ['bundle-x', 'prod-living-lessons', 'prod-eternal-algorithms'],
    });
    const ledger = calls.find((c) => c.url.includes('/rest/v1/payments'));
    expect(ledger.url).toContain('on_conflict=provider,provider_event_id');
    expect(ledger.headers.Prefer).toContain('ignore-duplicates');
    expect(ledger.body[0]).toMatchObject({
      provider: 'square',
      provider_event_id: 'PAY1',
      provider_payment_id: 'PAY1',
      status: 'settled',
      amount_cents: 999,
      fee_cents: 59,
      net_cents: 940,
      currency: 'usd',
      product_key: 'bundle-x',
      entity_id: 'e-personal',
      payer_email: 'b@example.com',
    });
    const grants = calls.filter((c) => c.url.endsWith('/rpc/grant_book_entitlement'));
    expect(grants.map((g) => g.body.p_product)).toEqual(['bundle-x', 'prod-living-lessons', 'prod-eternal-algorithms']);
    expect(grants[0].body).toMatchObject({ p_user: U, p_source: 'purchase', p_stripe_ref: 'square:PAY1' });
    expect(grants[0].headers.Authorization).toBe('Bearer svc');
  });
  it("a paid seat is held in the buyer's name; a guest book is counted and left to the return; an unfinished payment is ignored before any read", async () => {
    const calls = [];
    const fetchMock = vi.fn(async (url, init) => {
      calls.push({ url: String(url), body: init && init.body ? JSON.parse(init.body) : null });
      if (String(url).includes('/v2/orders/'))
        return {
          ok: true,
          status: 200,
          json: async () => ({ order: ourOrder({ metadata: { house: HOUSE, kind: 'workshop', product: 'workshop', eventId: EV, userId: U } }) }),
        };
      return { ok: true, status: 201, json: async () => [] };
    });
    vi.stubGlobal('fetch', fetchMock);
    expect(await (await post(JSON.stringify(paymentEvent()))).json()).toEqual({ received: true, counted: true, seat: EV });
    const seat = calls.find((c) => c.url.includes('workshop_registrations'));
    expect(seat.url).toContain('on_conflict=event_id,user_id');
    expect(seat.body[0]).toMatchObject({
      event_id: EV,
      user_id: U,
      status: 'paid',
      paid_cents: 999,
      stripe_payment_id: 'square:PAY1',
      stripe_session_id: 'square:ORD1XYZ12ABC',
    });
    calls.length = 0;
    fetchMock.mockImplementation(async (url, init) => {
      calls.push({ url: String(url) });
      if (String(url).includes('/v2/orders/'))
        return { ok: true, status: 200, json: async () => ({ order: ourOrder({ metadata: { house: HOUSE, kind: 'book', product: 'prod-living-lessons' } }) }) };
      return { ok: true, status: 201, json: async () => [] };
    });
    expect(await (await post(JSON.stringify(paymentEvent()))).json()).toEqual({ received: true, counted: true, guest: true });
    expect(calls.some((c) => c.url.includes('grant_book_entitlement'))).toBe(false);
    calls.length = 0;
    expect(await (await post(JSON.stringify(paymentEvent({ status: 'PENDING' })))).json()).toEqual({ received: true, ignored: true });
    expect(await (await post(JSON.stringify({ type: 'refund.created', data: { object: {} } }))).json()).toEqual({ received: true, ignored: true });
    expect(calls.length).toBe(0);
    expect(completedPayment(paymentEvent({ order_id: '' }))).toBeNull();
  });
  it('a failed ledger write answers 502 so Square retries; a failed grant 500; the ledger row is idempotent so the retry counts once', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) =>
        String(url).includes('/v2/orders/')
          ? { ok: true, status: 200, json: async () => ({ order: ourOrder() }) }
          : { ok: false, status: 503, json: async () => ({}) }
      )
    );
    expect((await post(JSON.stringify(paymentEvent()))).status).toBe(502);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (String(url).includes('/v2/orders/')) return { ok: true, status: 200, json: async () => ({ order: ourOrder() }) };
        if (String(url).includes('/rest/v1/payments')) return { ok: true, status: 201, json: async () => [] };
        return { ok: false, status: 500, json: async () => ({}) };
      })
    );
    expect((await post(JSON.stringify(paymentEvent()))).status).toBe(500);
  });
});

describe('the pure halves', () => {
  it("ourSquareOrder and orderPaid read only the order's own words", () => {
    expect(ourSquareOrder(ourOrder())).toEqual({
      kind: 'book',
      product: 'prod-living-lessons',
      grants: ['prod-living-lessons'],
      userId: U,
      userKey: 'b@example.com',
      eventId: null,
      instanceId: null,
      orderId: 'ORD1XYZ12ABC',
    });
    expect(ourSquareOrder(ourOrder({ metadata: { house: 'someone-else', kind: 'book', product: 'x' } }))).toBeNull();
    expect(ourSquareOrder(ourOrder({ metadata: { house: HOUSE, kind: 'subscription', product: 'poetech-plus' } }))).toBeNull();
    expect(ourSquareOrder(null)).toBeNull();
    expect(orderPaid(ourOrder())).toBe(true);
    expect(orderPaid(ourOrder({ tenders: [] }))).toBe(false);
    expect(orderPaid(ourOrder({ net_amount_due_money: { amount: 999 } }))).toBe(false);
    expect(orderPaid(ourOrder({ tenders: [], state: 'COMPLETED' }))).toBe(true);
  });
  it("normalizeSquarePayment: settled only when COMPLETED; the engine and the Stripe mirror land a book under its kind's entity now too", () => {
    const p = paymentEvent().data.object.payment;
    const ours = ourSquareOrder(ourOrder());
    expect(normalizeSquarePayment(p, ours, { product: PRODUCT_ENTITY })).toMatchObject({
      provider: 'square',
      status: 'settled',
      amountCents: 999,
      feeCents: 59,
      netCents: 940,
      entityId: 'e-personal',
      occurredAtIso: '2026-11-12T17:00:01Z',
    });
    expect(normalizeSquarePayment({ ...p, status: 'PENDING', processing_fee: undefined }, ours, { product: PRODUCT_ENTITY })).toMatchObject({
      status: 'pending',
      feeCents: 0,
    });
    expect(normalizeSquarePayment(p, { ...ours, product: 'mystery', kind: 'other' }, { product: PRODUCT_ENTITY }).entityId).toBe('unassigned');
    const evt = {
      id: 'evt_1',
      type: 'checkout.session.completed',
      created: 1700000000,
      data: { object: { id: 'cs_1', payment_status: 'paid', amount_total: 999, currency: 'usd', metadata: { kind: 'book', product: 'prod-living-lessons' } } },
    };
    expect(normalizePayment(evt).entityId).toBe('e-personal');
    expect(normalizeStripeEvent(evt)).toEqual(normalizePayment(evt));
    expect(normalizePayment({ ...evt, data: { object: { ...evt.data.object, metadata: { product: 'mystery' } } } }).entityId).toBe('unassigned');
    expect(squareGrants(p, { ...ours, userId: null })).toEqual([]);
    expect(squareSeat(p, ours)).toBeNull();
  });
  it('squareConfigured needs both the token and the location', () => {
    expect(squareConfigured({ SQUARE_ACCESS_TOKEN: 't' })).toBe(false);
    expect(squareConfigured({ SQUARE_LOCATION_ID: 'L' })).toBe(false);
    expect(squareConfigured(SQ)).toBe(true);
  });
});

describe('delivery on return from Square', () => {
  it('deliveryFromSquareOrder: only a PAID book order of ours; no email (Square keeps the receipt)', () => {
    expect(deliveryFromSquareOrder(ourOrder())).toEqual({
      kind: 'book',
      product: 'prod-living-lessons',
      grants: ['prod-living-lessons'],
      email: null,
      userId: U,
    });
    expect(deliveryFromSquareOrder(ourOrder({ tenders: [] })).error).toBe('not-paid');
    expect(deliveryFromSquareOrder(ourOrder({ metadata: { house: HOUSE, kind: 'workshop', product: 'workshop' } })).error).toBe('not-a-book');
    expect(deliveryFromSquareOrder(ourOrder({ metadata: {} })).error).toBe('not-a-book');
  });
  it('/api/deliver?square_order reads the order with the token and answers only the delivery; malformed, unknown and unconfigured say so', async () => {
    const seen = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        seen.push({ url: String(url), auth: init.headers.Authorization });
        return { ok: true, status: 200, json: async () => ({ order: ourOrder() }) };
      })
    );
    const res = await deliverGet({ env: SQ, request: new Request('https://poetech.us/api/deliver?square_order=ORD1XYZ12') });
    expect(await res.json()).toEqual({ ok: true, kind: 'book', product: 'prod-living-lessons', grants: ['prod-living-lessons'], email: null, userId: U });
    expect(seen[0]).toEqual({ url: 'https://connect.squareup.com/v2/orders/ORD1XYZ12', auth: 'Bearer sq0atp-x' });
    expect((await deliverGet({ env: SQ, request: new Request('https://poetech.us/api/deliver?square_order=../x') })).status).toBe(400);
    expect((await deliverGet({ env: {}, request: new Request('https://poetech.us/api/deliver?square_order=ORD1XYZ12') })).status).toBe(503);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) }))
    );
    const nf = await deliverGet({ env: SQ, request: new Request('https://poetech.us/api/deliver?square_order=ORD1XYZ12') });
    expect(nf.status).toBe(404);
    expect((await nf.json()).error).toBe('unknown-session');
    expect((await retrieveSquareOrder('bad id', { env: SQ })).error).toBe('bad-order');
  });
  it('the app side: reads square_order, keeps the return path clean of it, and asks /api/deliver by the right name', async () => {
    expect(squareOrderFromSearch('?paid=1&square_order=ORD1XYZ12')).toBe('ORD1XYZ12');
    expect(squareOrderFromSearch('?square_order=a b')).toBe('');
    expect(deliveryRefFromSearch('?session_id=cs_test_a')).toEqual({ sessionId: 'cs_test_a' });
    expect(deliveryRefFromSearch('?square_order=ORD1XYZ12')).toEqual({ squareOrder: 'ORD1XYZ12' });
    expect(deliveryRefFromSearch('?x=1')).toBeNull();
    expect(deliveryReturnPaths('/poetech-app/', '?view=store&paid=1&square_order=OLD12345').cancelUrl).toBe('/poetech-app/?view=store');
    const urls = [];
    const fetchImpl = vi.fn(async (url) => {
      urls.push(url);
      return { ok: true, json: async () => ({ ok: true, product: 'p', grants: ['p'] }) };
    });
    expect((await readDelivery({ squareOrder: 'ORD1XYZ12' }, { fetchImpl })).ok).toBe(true);
    expect(urls[0]).toBe('/api/deliver?square_order=ORD1XYZ12');
    expect((await readDelivery('cs_test_a', { fetchImpl })).ok).toBe(true);
    expect(urls[1]).toBe('/api/deliver?session_id=cs_test_a');
    expect((await readDelivery({}, { fetchImpl })).error).toBe('no-session');
  });
  it('a seat names its processor when the store has one', async () => {
    const bodies = [];
    const fetchImpl = vi.fn(async (url, init) => {
      bodies.push(JSON.parse(init.body));
      return { ok: true, status: 200, json: async () => ({ url: 'https://square.link/u/abc' }) };
    });
    expect(await startSeatCheckout({ token: 't', eventId: EV, pathname: '/poetech-app/', search: '', fetchImpl, processor: 'square' })).toEqual({
      url: 'https://square.link/u/abc',
    });
    expect(bodies[0]).toMatchObject({ kind: 'workshop', eventId: EV, processor: 'square' });
    await startSeatCheckout({ token: 't', eventId: EV, pathname: '/poetech-app/', search: '', fetchImpl });
    expect(bodies[1].processor).toBeUndefined();
  });
});
