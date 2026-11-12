// @vitest-environment node
// =============================================================================
// the-learning-products-checkout — a book is handed to its buyer, a workshop
// seat is a person's at the event row's price, and the firewall admits both
// (DR-1448)
// =============================================================================
// Measured before this shipped: the ledger counted every book sale and
// grant_book_entitlement was called nowhere (nobody was ever handed the
// book); the seam read metadata.productId while the server wrote
// metadata.product; and no seat could be sold at all. Each case here pins the
// closed shape with the break it catches.
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { toStripeSessionParams, workshopEvent, onRequestPost as checkoutPost } from '../../functions/api/checkout.js';
import { isOurs, bookEntitlementGrant, workshopRegistrationChange, PRODUCT_ENTITY, onRequestPost as webhookPost } from '../../functions/api/stripe-webhook.js';
import { buildWorkshopCheckoutRequest, entitlementFromWebhook } from '../lib/checkout-seam.js';
import { PRODUCT_ENTITY as LEDGER_ENTITY } from '../lib/payments-ledger.js';

afterEach(() => vi.unstubAllGlobals());

const BUYER = '11111111-2222-4333-8444-555555555555';
const EV = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const ENV = {
  STRIPE_SECRET_KEY: 'sk_test_1',
  STRIPE_CATALOG: '{"prod-course-banking":799}',
  SUPABASE_URL: 'https://nas.example/sb',
  SUPABASE_ANON_KEY: 'anon_1',
  STRIPE_WEBHOOK_SECRET: 'whsec_1',
  SUPABASE_SERVICE_KEY: 'srv_1',
};
const buyer = { userId: BUYER, email: 'b@example.com' };
const event = (over = {}) => ({ id: EV, title: 'Banking: a day', status: 'open', priceCents: 20000, currency: 'usd', seatsLeft: 5, ...over });
const req = (body, token) =>
  new Request('https://poetech.us/api/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
  });
const sign = (payload, secret, t) => `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')}`;
const hook = (evt) => {
  const payload = JSON.stringify(evt);
  return webhookPost({
    env: ENV,
    request: new Request('https://poetech.us/api/stripe-webhook', {
      method: 'POST',
      body: payload,
      headers: { 'stripe-signature': sign(payload, 'whsec_1', Math.floor(Date.now() / 1000)) },
    }),
  });
};
const paidSession = (metadata, over = {}) => ({
  id: 'evt_1',
  type: 'checkout.session.completed',
  created: 1760000000,
  data: {
    object: {
      id: 'cs_1',
      payment_intent: 'pi_1',
      payment_status: 'paid',
      amount_total: 20000,
      currency: 'usd',
      client_reference_id: metadata.userId || null,
      metadata,
      customer_details: { email: 'b@example.com' },
      ...over,
    },
  },
});

describe("a workshop seat: the event row's price, a verified person", () => {
  it("charges the ROW's price, never the client's, and stamps the person and the event on the session", () => {
    const { params } = toStripeSessionParams({ kind: 'workshop', eventId: EV, amountCents: 1 }, { origin: 'https://poetech.us', buyer, event: event() });
    expect(params.get('mode')).toBe('payment');
    expect(params.get('line_items[0][price_data][unit_amount]')).toBe('20000');
    expect(params.get('line_items[0][price_data][product_data][name]')).toBe('Banking: a day');
    expect(params.get('metadata[kind]')).toBe('workshop');
    expect(params.get('metadata[product]')).toBe('workshop');
    expect(params.get('metadata[eventId]')).toBe(EV);
    expect(params.get('metadata[userId]')).toBe(BUYER);
    expect(params.get('client_reference_id')).toBe(BUYER);
  });
  it('refuses a closed event, a sold-out one, a free one, a missing row, and a guest', () => {
    expect(toStripeSessionParams({ kind: 'workshop' }, { buyer, event: event({ status: 'draft' }) }).error).toBe('unknown-event');
    expect(toStripeSessionParams({ kind: 'workshop' }, { buyer, event: event({ seatsLeft: 0 }) }).error).toBe('sold-out');
    expect(toStripeSessionParams({ kind: 'workshop' }, { buyer, event: event({ priceCents: 0 }) }).error).toBe('unknown-event');
    expect(toStripeSessionParams({ kind: 'workshop' }, { buyer, event: null }).error).toBe('unknown-event');
    expect(toStripeSessionParams({ kind: 'workshop' }, { buyer: null, event: event() }).error).toBe('sign-in-required');
  });
  it('workshopEvent reads the row and the seat count over the anon road; a missing row is unknown', async () => {
    const seen = [];
    const f = async (u, i) => {
      seen.push({ u: String(u), i });
      if (String(u).includes('/rpc/workshop_seats_left')) return new Response('3', { status: 200 });
      return new Response(JSON.stringify([{ id: EV, title: 'T', status: 'open', price_cents: 20000, currency: 'usd', capacity: 20 }]), { status: 200 });
    };
    const r = await workshopEvent(EV, ENV, f);
    expect(r.event).toEqual({ id: EV, title: 'T', status: 'open', priceCents: 20000, currency: 'usd', seatsLeft: 3 });
    expect(seen[0].u).toContain(`/rest/v1/workshop_events?id=eq.${EV}`);
    expect(seen[0].i.headers.apikey).toBe('anon_1');
    expect((await workshopEvent('nope', ENV, f)).error).toBe('unknown-event');
    expect((await workshopEvent(EV, ENV, async () => new Response('[]', { status: 200 }))).error).toBe('unknown-event');
    expect(
      (
        await workshopEvent(EV, ENV, async () => {
          throw new Error('x');
        })
      ).error
    ).toBe('event-unreachable');
    expect((await workshopEvent(EV, { SUPABASE_URL: 'x' }, f)).error).toBe('identity-not-configured');
  });
  it("end to end: a signed-in POST creates the Stripe session for THAT seat at the row's price; signed out never reaches Stripe", async () => {
    const calls = [];
    vi.stubGlobal('fetch', async (u, i) => {
      calls.push({ u: String(u), i });
      if (String(u).includes('/auth/v1/user')) return new Response(JSON.stringify({ id: BUYER, email: 'b@example.com' }), { status: 200 });
      if (String(u).includes('/rpc/workshop_seats_left')) return new Response('4', { status: 200 });
      if (String(u).includes('/rest/v1/workshop_events'))
        return new Response(JSON.stringify([{ id: EV, title: 'Banking: a day', status: 'open', price_cents: 20000, currency: 'usd', capacity: 20 }]), {
          status: 200,
        });
      return new Response(JSON.stringify({ id: 'cs_9', url: 'https://checkout.stripe.com/c/cs_9' }), { status: 200 });
    });
    const res = await checkoutPost({ env: ENV, request: req({ kind: 'workshop', eventId: EV, amountCents: 1 }, 'tok') });
    expect(await res.json()).toEqual({ url: 'https://checkout.stripe.com/c/cs_9', id: 'cs_9' });
    const sent = new URLSearchParams(calls.find((c) => c.u.includes('api.stripe.com')).i.body);
    expect(sent.get('line_items[0][price_data][unit_amount]')).toBe('20000');
    expect(sent.get('metadata[eventId]')).toBe(EV);
    calls.length = 0;
    const out = await checkoutPost({ env: ENV, request: req({ kind: 'workshop', eventId: EV }) });
    expect(out.status).toBe(401);
    expect(calls.some((c) => c.u.includes('stripe.com'))).toBe(false);
  });
  it('the seam builds the request without a price of its own', () => {
    const r = buildWorkshopCheckoutRequest({ id: EV, title: 'T', priceCents: 20000 }, { successUrl: '/x', cancelUrl: '/y' });
    expect(r).toMatchObject({ kind: 'workshop', mode: 'payment', eventId: EV, metadata: { eventId: EV, kind: 'workshop' } });
  });
});

describe('a book is handed to its buyer', () => {
  it('a signed-in book buyer rides the session; a guest still pays, and nothing is stamped', () => {
    const { params } = toStripeSessionParams({ kind: 'book', productId: 'prod-course-banking' }, { catalog: { 'prod-course-banking': 799 }, buyer });
    expect(params.get('metadata[userId]')).toBe(BUYER);
    expect(params.get('client_reference_id')).toBe(BUYER);
    const guest = toStripeSessionParams({ kind: 'book', productId: 'prod-course-banking' }, { catalog: { 'prod-course-banking': 799 } }).params;
    expect(guest.get('metadata[userId]')).toBeNull();
  });
  it('a signed-in book POST verifies the buyer; a bad token is refused, not downgraded to a guest', async () => {
    const calls = [];
    vi.stubGlobal('fetch', async (u, i) => {
      calls.push({ u: String(u), i });
      if (String(u).includes('/auth/v1/user')) return new Response('{}', { status: 401 });
      return new Response(JSON.stringify({ id: 'cs_2', url: 'https://checkout.stripe.com/c/cs_2' }), { status: 200 });
    });
    const res = await checkoutPost({ env: ENV, request: req({ kind: 'book', productId: 'prod-course-banking' }, 'bad') });
    expect(res.status).toBe(401);
    expect(calls.some((c) => c.u.includes('stripe.com'))).toBe(false);
  });
  it('bookEntitlementGrant: a paid book with a person -> the grant call; a guest, an unpaid session, a seat -> nothing', () => {
    expect(bookEntitlementGrant(paidSession({ kind: 'book', product: 'prod-course-banking', userId: BUYER }))).toEqual({
      p_user: BUYER,
      p_product: 'prod-course-banking',
      p_source: 'purchase',
      p_stripe_ref: 'pi_1',
    });
    expect(bookEntitlementGrant(paidSession({ kind: 'book', product: 'prod-course-banking' }, { client_reference_id: null }))).toBeNull();
    expect(bookEntitlementGrant(paidSession({ kind: 'book', product: 'p', userId: BUYER }, { payment_status: 'unpaid', status: 'open' }))).toBeNull();
    expect(bookEntitlementGrant(paidSession({ kind: 'workshop', eventId: EV, userId: BUYER }))).toBeNull();
  });
  it('the seam reads the product the server really writes (metadata.product), and a seat too', () => {
    expect(entitlementFromWebhook({ type: 'checkout.session.completed', metadata: { kind: 'book', product: 'prod-course-banking', userKey: 'u' } })).toEqual({
      kind: 'book',
      userKey: 'u',
      productId: 'prod-course-banking',
    });
    expect(entitlementFromWebhook({ type: 'checkout.session.completed', metadata: { kind: 'workshop', eventId: EV, userKey: 'u' } })).toEqual({
      kind: 'workshop',
      userKey: 'u',
      eventId: EV,
    });
  });
  it('the webhook hands the book over through grant_book_entitlement with the service key (PROVEN: before, no such call existed)', async () => {
    const calls = [];
    vi.stubGlobal('fetch', async (u, i) => {
      calls.push({ u: String(u), i });
      return new Response('[]', { status: 201 });
    });
    const res = await hook(paidSession({ kind: 'book', product: 'prod-course-banking', userId: BUYER }));
    expect(await res.json()).toEqual({ received: true, counted: true, book: 'prod-course-banking' });
    const grant = calls.find((c) => c.u.endsWith('/rest/v1/rpc/grant_book_entitlement'));
    expect(grant).toBeTruthy();
    expect(grant.i.headers.Authorization).toBe('Bearer srv_1');
    expect(JSON.parse(grant.i.body)).toEqual({ p_user: BUYER, p_product: 'prod-course-banking', p_source: 'purchase', p_stripe_ref: 'pi_1' });
    expect(calls[0].u).toContain('/rest/v1/payments');
  });
});

describe("the seat lands on the person's own row", () => {
  it('workshopRegistrationChange: paid seat -> one row keyed by event and person; anything else -> nothing', () => {
    const row = workshopRegistrationChange(paidSession({ kind: 'workshop', eventId: EV, userId: BUYER }), '2026-11-12T00:00:00Z');
    expect(row).toEqual({
      event_id: EV,
      user_id: BUYER,
      status: 'paid',
      stripe_session_id: 'cs_1',
      stripe_payment_id: 'pi_1',
      paid_cents: 20000,
      paid_at: '2025-10-09T08:53:20.000Z',
      updated_at: '2026-11-12T00:00:00Z',
    });
    expect(workshopRegistrationChange(paidSession({ kind: 'workshop', eventId: 'nope', userId: BUYER }))).toBeNull();
    expect(workshopRegistrationChange(paidSession({ kind: 'book', product: 'p', userId: BUYER }))).toBeNull();
  });
  it('the webhook upserts the registration (a retry re-seats, never double-seats) and a failed write asks Stripe to retry', async () => {
    const calls = [];
    vi.stubGlobal('fetch', async (u, i) => {
      calls.push({ u: String(u), i });
      return new Response('', { status: 201 });
    });
    const res = await hook(paidSession({ kind: 'workshop', eventId: EV, userId: BUYER }));
    expect(await res.json()).toEqual({ received: true, counted: true, seat: EV });
    const seat = calls.find((c) => c.u.includes('/rest/v1/workshop_registrations'));
    expect(seat.u).toContain('on_conflict=event_id,user_id');
    expect(seat.i.headers.Prefer).toContain('merge-duplicates');
    expect(JSON.parse(seat.i.body)[0]).toMatchObject({ event_id: EV, user_id: BUYER, status: 'paid' });
    vi.stubGlobal('fetch', async (u) => new Response('', { status: String(u).includes('workshop_registrations') ? 500 : 201 }));
    expect((await hook(paidSession({ kind: 'workshop', eventId: EV, userId: BUYER }))).status).toBe(500);
  });
});

describe('the firewall (DR-1438) admits a seat our seam made and nothing else new', () => {
  it("isOurs: a workshop session is ours; a stranger's checkout is not; the entity map carries workshop on both sides", () => {
    expect(isOurs(paidSession({ kind: 'workshop', eventId: EV, userId: BUYER }))).toBe(true);
    expect(isOurs(paidSession({ kind: 'therapy-session' }))).toBe(false);
    expect(PRODUCT_ENTITY.workshop).toBe('e-personal');
    expect(LEDGER_ENTITY).toEqual(PRODUCT_ENTITY);
  });
});

describe('a bought book is owned on every device', () => {
  it("readMyBookEntitlements reads the person's own rows; a client that cannot answer is unknown, not unowned; ownsBook merges both", async () => {
    const { readMyBookEntitlements, ownsBook } = await import('../lib/book-entitlements-cloud.js');
    const client = (data, error = null) => ({ from: () => ({ select: () => Promise.resolve({ data, error }) }) });
    expect(await readMyBookEntitlements(client([{ product_id: 'prod-a' }, { product_id: 'prod-a' }, { product_id: 'prod-b' }]))).toEqual({
      ok: true,
      productIds: ['prod-a', 'prod-b'],
    });
    expect(await readMyBookEntitlements(client(null, 'boom'))).toEqual({ ok: false, productIds: [] });
    expect(await readMyBookEntitlements(null)).toEqual({ ok: false, productIds: [] });
    expect(ownsBook(false, ['prod-a'], 'prod-a')).toBe(true);
    expect(ownsBook(true, [], 'prod-z')).toBe(true);
    expect(ownsBook(false, ['prod-a'], 'prod-b')).toBe(false);
  });
  it('the store reads the cloud rows into its Owned check (source pin)', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../components/Bookstore.jsx', import.meta.url), 'utf8');
    expect(src).toContain('readMyBookEntitlements(supabase)');
    expect(src).toContain('ownsBook(entitledToBook(sub, product, nowIso()), cloudOwned, product.id)');
  });
});
