// @vitest-environment node
// =============================================================================
// the-sovereign-storefront — a Payhip-class store on our own door (DR-1449):
// pricing shapes the server and the store read alike, bundles that hand over
// every book, coupons on Stripe's page, the server's open list, and the book
// delivered on return from Stripe
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { parseCatalogEntry, grantsFor, productPricing, priceLabel, SEED_BUNDLES, bundlePublishable, bundleSaving } from '../lib/store-pricing.js';
import { storefrontItems, storefrontCounts, bundleProducts, readOpen } from '../lib/store-catalog.js';
import { sessionIdFromSearch, deliveryReturnPaths, readDelivery, applyDelivery, sayDeliveryError } from '../lib/instant-delivery.js';
import { entitledToBook, normalizeSubscriber } from '../lib/entitlements.js';
import { seedCatalog } from '../lib/book-catalog.js';
import { catalogEntry, openBooks, toStripeSessionParams, onRequestGet } from '../../functions/api/checkout.js';
import { deliveryFromSession, onRequestGet as deliverGet } from '../../functions/api/deliver.js';
import { bookEntitlementGrants, onRequestPost as webhookPost } from '../../functions/api/stripe-webhook.js';
import { executeCheckout } from '../lib/checkout-seam.js';

afterEach(() => vi.unstubAllGlobals());

const BUYER = '11111111-2222-4333-8444-555555555555';
const CATALOG = {
  'prod-living-lessons': 999,
  'prod-eternal-algorithms': { cents: 1499 },
  'prod-world-issues': { pwyw: { min: 500, preset: 1499 } },
  'bundle-darrells-books': { cents: 1999, grants: ['prod-living-lessons', 'prod-eternal-algorithms'] },
  'prod-bad': { cents: 0 },
  'prod-worse': { pwyw: { min: 0 } },
  'prod-list': [999],
};

describe('one catalog entry shape, read alike by the store and the server', () => {
  it('parses fixed (short and long), pay what you want, bundles; refuses what cannot be charged', () => {
    expect(parseCatalogEntry(999)).toEqual({ kind: 'fixed', cents: 999, minCents: 999, presetCents: 999, grants: [] });
    expect(parseCatalogEntry({ cents: 1499 }).cents).toBe(1499);
    expect(parseCatalogEntry({ pwyw: { min: 500, preset: 1499 } })).toEqual({ kind: 'pwyw', cents: 1499, minCents: 500, presetCents: 1499, grants: [] });
    expect(parseCatalogEntry({ pwyw: { min: 500, preset: 100 } }).presetCents).toBe(500);
    expect(parseCatalogEntry(CATALOG['bundle-darrells-books']).grants).toEqual(['prod-living-lessons', 'prod-eternal-algorithms']);
    for (const bad of [0, -5, null, 'x', [999], { cents: 0 }, { pwyw: { min: 0 } }, { pwyw: {} }]) expect(parseCatalogEntry(bad), JSON.stringify(bad)).toBeNull();
  });
  it('CONFORMANCE: functions/api/checkout.js catalogEntry answers exactly as the store does, on every shape', () => {
    for (const [id, raw] of Object.entries(CATALOG)) expect(catalogEntry(raw), id).toEqual(parseCatalogEntry(raw));
    for (const bad of [0, null, 'x', [999], { cents: 0 }, { pwyw: { min: 0 } }]) expect(catalogEntry(bad)).toEqual(parseCatalogEntry(bad));
  });
  it('grantsFor: a book hands over itself, a bundle every book it names', () => {
    expect(grantsFor('prod-a', parseCatalogEntry(999))).toEqual(['prod-a']);
    expect(grantsFor('bundle-x', parseCatalogEntry(CATALOG['bundle-darrells-books']))).toEqual(['prod-living-lessons', 'prod-eternal-algorithms']);
    expect(grantsFor('', null)).toEqual([]);
  });
  it('the shelf says the price the way the shape means it', () => {
    expect(priceLabel(productPricing({ priceCents: 999 }))).toBe('$9.99');
    expect(priceLabel(productPricing({ priceCents: 1499, pricing: 'pwyw', minCents: 500 }))).toBe('Pay what you want, from $5.00');
    expect(priceLabel(productPricing({ priceCents: 0 }))).toBe('An offering (free)');
  });
});

describe('bundles', () => {
  const books = seedCatalog();
  it('a bundle is publishable only when every book it grants is published, and says its saving', () => {
    const b = SEED_BUNDLES[0];
    expect(bundlePublishable(b, books.filter((x) => x.status === 'published').map((x) => x.id)).ok).toBe(true);
    expect(bundlePublishable(b, ['prod-living-lessons']).reasons[0]).toMatch(/prod-eternal-algorithms/);
    expect(bundlePublishable({ grants: [] }, []).ok).toBe(false);
    expect(bundleSaving(b, books)).toEqual({ aloneCents: 2498, savedCents: 499, pct: 20 });
    const [bp] = bundleProducts(books);
    expect(bp).toMatchObject({ id: 'bundle-darrells-books', kind: 'bundle', status: 'draft' });
  });
});

describe('the storefront list', () => {
  const books = seedCatalog();
  it('gathers books, published bundles, every course, open workshops and the membership, and reads buyable from the server\'s answer', () => {
    const events = [{ id: 'e1', title: 'Banking: a day', location: 'Champaign, IL', priceCents: 20000, status: 'open', seatsLeft: 3, goingRateNote: '' }];
    const items = storefrontItems({ books, overrides: [{ id: 'bundle-darrells-books', status: 'published' }], events, open: { books: ['prod-living-lessons', 'bundle-darrells-books'], subscriptions: ['poetech-plus'] } });
    const c = storefrontCounts(items);
    expect(c.book).toBe(2);
    expect(c.bundle).toBe(1);
    expect(c.course).toBeGreaterThan(40);
    expect(c.workshop).toBe(1);
    expect(c.membership).toBe(1);
    expect(c.total).toBe(c.book + c.bundle + c.course + c.workshop + c.membership);
    const by = Object.fromEntries(items.map((i) => [i.id, i]));
    expect(by['prod-living-lessons'].buyable).toBe(true);
    expect(by['prod-eternal-algorithms'].buyable).toBe(false);
    expect(by['bundle-darrells-books'].blurb).toMatch(/Save 20%/);
    expect(by['poetech-plus'].buyable).toBe(true);
    expect(by.e1.priceLabel).toBe('$200.00 a seat');
  });
  it('a draft bundle, and a bundle with an unpublished book, never reach the shelf', () => {
    const none = storefrontItems({ books, overrides: [], events: [], open: { books: [], subscriptions: [] } });
    expect(none.some((i) => i.kind === 'bundle')).toBe(false);
    const halfDraft = books.map((b) => (b.id === 'prod-eternal-algorithms' ? { ...b, status: 'draft' } : b));
    const items = storefrontItems({ books: halfDraft, overrides: [{ id: 'bundle-darrells-books', status: 'published' }], events: [], open: { books: [], subscriptions: [] } });
    expect(items.some((i) => i.kind === 'bundle')).toBe(false);
    expect(items.find((i) => i.id === 'poetech-plus').buyable).toBe(false);
  });
  it('readOpen: anything but the server\'s own JSON reads as nothing open', async () => {
    expect(await readOpen({ fetchImpl: async () => ({ ok: true, json: async () => ({ books: ['a'], subscriptions: ['poetech-plus'] }) }) })).toEqual({ books: ['a'], subscriptions: ['poetech-plus'] });
    expect(await readOpen({ fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({}) }) })).toEqual({ books: [], subscriptions: [] });
    expect(await readOpen({ fetchImpl: async () => { throw new Error('x'); } })).toEqual({ books: [], subscriptions: [] });
  });
});

describe('the server: pay what you want, coupons, the open list, the bundle stamp', () => {
  it('a pwyw entry asks Stripe for a custom amount from the catalog minimum; a fixed one a unit amount; the client amount is never read', () => {
    const { params: p } = toStripeSessionParams({ kind: 'book', productId: 'prod-world-issues', amountCents: 1 }, { catalog: CATALOG });
    expect(p.get('line_items[0][price_data][custom_unit_amount][enabled]')).toBe('true');
    expect(p.get('line_items[0][price_data][custom_unit_amount][minimum]')).toBe('500');
    expect(p.get('line_items[0][price_data][custom_unit_amount][preset]')).toBe('1499');
    expect(p.get('line_items[0][price_data][unit_amount]')).toBeNull();
    const { params: f } = toStripeSessionParams({ kind: 'book', productId: 'prod-eternal-algorithms' }, { catalog: CATALOG });
    expect(f.get('line_items[0][price_data][unit_amount]')).toBe('1499');
    expect(f.get('allow_promotion_codes')).toBe('true');
    const { params: off } = toStripeSessionParams({ kind: 'book', productId: 'prod-eternal-algorithms' }, { catalog: CATALOG, promotionCodesOn: false });
    expect(off.get('allow_promotion_codes')).toBeNull();
    expect(toStripeSessionParams({ kind: 'book', productId: 'prod-bad' }, { catalog: CATALOG }).error).toBe('unknown-product');
  });
  it('a bundle stamps its grants on the session so the webhook and the delivery hand over every book', () => {
    const { params } = toStripeSessionParams({ kind: 'book', productId: 'bundle-darrells-books' }, { catalog: CATALOG });
    expect(params.get('metadata[grants]')).toBe('prod-living-lessons,prod-eternal-algorithms');
    expect(params.get('line_items[0][price_data][unit_amount]')).toBe('1999');
  });
  it('openBooks lists only priced entries, and only with a key; GET /api/checkout carries it', async () => {
    const env = { STRIPE_SECRET_KEY: 'sk_test_1', STRIPE_CATALOG: JSON.stringify(CATALOG) };
    expect(openBooks(env)).toEqual(['bundle-darrells-books', 'prod-eternal-algorithms', 'prod-living-lessons', 'prod-world-issues']);
    expect(openBooks({ STRIPE_CATALOG: JSON.stringify(CATALOG) })).toEqual([]);
    const res = await onRequestGet({ env });
    expect((await res.json()).books).toContain('prod-living-lessons');
  });
  it('the seam sends a signed-in buyer\'s token so the person is stamped', async () => {
    const calls = [];
    await executeCheckout({ kind: 'book' }, { config: { enabled: true, endpoint: '/api/checkout' }, token: 'tok', fetchImpl: async (u, i) => { calls.push(i); return { ok: true, json: async () => ({ url: 'https://x' }) }; } });
    expect(calls[0].headers.Authorization).toBe('Bearer tok');
    await executeCheckout({ kind: 'book' }, { config: { enabled: true, endpoint: '/api/checkout' }, fetchImpl: async (u, i) => { calls.push(i); return { ok: true, json: async () => ({ url: 'https://x' }) }; } });
    expect(calls[1].headers.Authorization).toBeUndefined();
  });
});

describe('instant delivery', () => {
  const paid = { payment_status: 'paid', metadata: { kind: 'book', product: 'bundle-darrells-books', grants: 'prod-living-lessons,prod-eternal-algorithms', userId: BUYER }, customer_details: { email: 'b@example.com' } };
  it('deliveryFromSession: only a PAID book session of ours; a bundle names every book; nothing of Stripe\'s leaks', () => {
    expect(deliveryFromSession(paid)).toEqual({ kind: 'book', product: 'bundle-darrells-books', grants: ['bundle-darrells-books', 'prod-living-lessons', 'prod-eternal-algorithms'], email: 'b@example.com', userId: BUYER });
    expect(deliveryFromSession({ ...paid, payment_status: 'unpaid' }).error).toBe('not-paid');
    expect(deliveryFromSession({ ...paid, metadata: { kind: 'subscription', tier: 'poetech-plus' } }).error).toBe('not-a-book');
    expect(deliveryFromSession({ ...paid, metadata: { kind: 'therapy-session' } }).error).toBe('not-a-book');
    expect(deliveryFromSession(null).error).toBe('not-a-book');
  });
  it('/api/deliver asks Stripe with the secret, refuses a malformed id, answers only the delivery', async () => {
    const seen = [];
    vi.stubGlobal('fetch', async (u, i) => { seen.push({ u: String(u), i }); return new Response(JSON.stringify({ id: 'cs_test_1', amount_total: 1999, ...paid }), { status: 200 }); });
    const res = await deliverGet({ env: { STRIPE_SECRET_KEY: 'sk_test_1' }, request: new Request('https://poetech.us/api/deliver?session_id=cs_test_abc123') });
    const body = await res.json();
    expect(body).toEqual({ ok: true, kind: 'book', product: 'bundle-darrells-books', grants: ['bundle-darrells-books', 'prod-living-lessons', 'prod-eternal-algorithms'], email: 'b@example.com', userId: BUYER });
    expect(seen[0].u).toBe('https://api.stripe.com/v1/checkout/sessions/cs_test_abc123');
    expect(seen[0].i.headers.Authorization).toBe('Bearer sk_test_1');
    expect(JSON.stringify(body)).not.toContain('amount_total');
    expect((await deliverGet({ env: { STRIPE_SECRET_KEY: 'sk' }, request: new Request('https://poetech.us/api/deliver?session_id=../x') })).status).toBe(400);
    expect((await deliverGet({ env: {}, request: new Request('https://poetech.us/api/deliver?session_id=cs_test_1') })).status).toBe(503);
    vi.stubGlobal('fetch', async () => new Response('{}', { status: 404 }));
    expect((await deliverGet({ env: { STRIPE_SECRET_KEY: 'sk' }, request: new Request('https://poetech.us/api/deliver?session_id=cs_test_1') })).status).toBe(404);
  });
  it('the app side: reads the session id, builds the return path Stripe fills in, grants every delivered book on the device', async () => {
    expect(sessionIdFromSearch('?paid=1&session_id=cs_test_abc')).toBe('cs_test_abc');
    expect(sessionIdFromSearch('?session_id=evil')).toBe('');
    const r = deliveryReturnPaths('/poetech-app/', '?view=store&paid=1&session_id=cs_test_old');
    expect(r.successUrl).toBe('/poetech-app/?view=store&paid=1&session_id={CHECKOUT_SESSION_ID}');
    expect(r.cancelUrl).toBe('/poetech-app/?view=store');
    expect(deliveryReturnPaths('//evil', '').successUrl.startsWith('/poetech-app/')).toBe(true);
    const d = await readDelivery('cs_test_abc', { fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ ok: true, product: 'p', grants: ['p', 'q'], email: 'b@example.com' }) }) });
    expect(d).toEqual({ ok: true, product: 'p', grants: ['p', 'q'], email: 'b@example.com' });
    expect((await readDelivery('cs_test_abc', { fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({ error: 'not-paid' }) }) })).error).toBe('not-paid');
    expect((await readDelivery('')).error).toBe('no-session');
    const sub = applyDelivery(normalizeSubscriber({ userKey: 'anon' }), d);
    expect(entitledToBook(sub, { id: 'p', tierIncluded: [] }, new Date().toISOString())).toBe(true);
    expect(entitledToBook(sub, { id: 'q', tierIncluded: [] }, new Date().toISOString())).toBe(true);
    expect(sayDeliveryError('not-paid')).toMatch(/not cleared yet/);
  });
});

describe('the webhook hands over every book of a bundle', () => {
  const ENV = { STRIPE_WEBHOOK_SECRET: 'whsec_1', SUPABASE_URL: 'https://nas.example/sb', SUPABASE_SERVICE_KEY: 'srv_1' };
  const sign = (payload, t) => `t=${t},v1=${createHmac('sha256', 'whsec_1').update(`${t}.${payload}`).digest('hex')}`;
  const evt = { id: 'evt_b', type: 'checkout.session.completed', created: 1760000000, data: { object: { id: 'cs_1', payment_intent: 'pi_1', payment_status: 'paid', amount_total: 1999, currency: 'usd', client_reference_id: BUYER, metadata: { kind: 'book', product: 'bundle-darrells-books', grants: 'prod-living-lessons,prod-eternal-algorithms', userId: BUYER }, customer_details: { email: 'b@example.com' } } } };
  it('bookEntitlementGrants: the bundle id and each book, once each; a guest gets nothing', () => {
    expect(bookEntitlementGrants(evt).map((g) => g.p_product)).toEqual(['bundle-darrells-books', 'prod-living-lessons', 'prod-eternal-algorithms']);
    expect(bookEntitlementGrants({ ...evt, data: { object: { ...evt.data.object, client_reference_id: null, metadata: { kind: 'book', product: 'x' } } } })).toEqual([]);
  });
  it('three grant calls, then a 200', async () => {
    const calls = [];
    vi.stubGlobal('fetch', async (u, i) => { calls.push({ u: String(u), i }); return new Response('[]', { status: 201 }); });
    const payload = JSON.stringify(evt);
    const res = await webhookPost({ env: ENV, request: new Request('https://poetech.us/api/stripe-webhook', { method: 'POST', body: payload, headers: { 'stripe-signature': sign(payload, Math.floor(Date.now() / 1000)) } }) });
    expect((await res.json()).granted).toEqual(['bundle-darrells-books', 'prod-living-lessons', 'prod-eternal-algorithms']);
    expect(calls.filter((c) => c.u.endsWith('/rpc/grant_book_entitlement')).length).toBe(3);
  });
});
