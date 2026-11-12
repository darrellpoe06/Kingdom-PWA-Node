// @vitest-environment node
// =============================================================================
// the-poetech-plus-checkout — a person buys PoeTech+, holds it, and can leave (DR-1432)
// =============================================================================
// Darrell 2026-11-12: "build the PoeTech+ checkout". The money lane DR-0263
// built had three gaps for a person buying PoeTech+: the buyer was a
// client-said key, the paid tier landed on the HOUSEHOLD row (falling back to
// the family instance), and nothing ever ended a cancelled membership. A
// first subscription payment was also written to the books twice. These cases
// pin the closed shape, each with the break it catches.
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { toStripeSessionParams, verifiedBuyer, openTiers, onRequestGet, onRequestPost as checkoutPost } from '../../functions/api/checkout.js';
import { memberSubscriptionChange, renewalAsSettleEvent, onRequestPost as webhookPost } from '../../functions/api/stripe-webhook.js';
import { onRequestPost as portalPost, portalReturnPath } from '../../functions/api/billing-portal.js';
import {
  paidTierFrom,
  memberTierDecision,
  returnPaths,
  checkoutOpen,
  startPlusCheckout,
  sayCheckoutError,
  PLUS_TIER,
} from '../lib/poetech-plus.js';
import { ACCESS_ENFORCEMENT } from '../lib/learn-access-tiers.js';

afterEach(() => vi.unstubAllGlobals());

const BUYER = '11111111-2222-4333-8444-555555555555';
const OTHER = '99999999-8888-4777-8666-555555555555';
const ENV = {
  STRIPE_SECRET_KEY: 'sk_test_1',
  STRIPE_TIER_PRICES: '{"poetech-plus":"price_plus39"}',
  SUPABASE_URL: 'https://nas.example/sb',
  SUPABASE_ANON_KEY: 'anon_1',
  STRIPE_WEBHOOK_SECRET: 'whsec_1',
  SUPABASE_SERVICE_KEY: 'srv_1',
};
const authOk = (id = BUYER, email = 'b@example.com') => new Response(JSON.stringify({ id, email }), { status: 200 });
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

describe('the buyer is the person signed in, proven by the auth server', () => {
  it('a subscription without a verified buyer is refused before Stripe is ever called', () => {
    expect(toStripeSessionParams({ kind: 'subscription', tier: PLUS_TIER }, { tierPrices: { [PLUS_TIER]: 'price_x' } }).error).toBe('sign-in-required');
  });

  it('the verified buyer rides the session AND the subscription; a body-claimed identity is ignored', () => {
    const { params } = toStripeSessionParams(
      { kind: 'subscription', tier: PLUS_TIER, userKey: 'mallory@example.com', userId: OTHER },
      { tierPrices: { [PLUS_TIER]: 'price_plus39' }, origin: 'https://poetech.us', buyer: { userId: BUYER, email: 'b@example.com' } }
    );
    expect(params.get('client_reference_id')).toBe(BUYER);
    expect(params.get('metadata[userId]')).toBe(BUYER);
    expect(params.get('metadata[userKey]')).toBe('b@example.com');
    expect(params.get('subscription_data[metadata][userId]')).toBe(BUYER);
    expect(params.get('subscription_data[metadata][tier]')).toBe(PLUS_TIER);
    expect(params.get('customer_email')).toBe('b@example.com');
    expect(params.toString()).not.toContain(OTHER);
  });

  it('verifiedBuyer: no token, no identity road, a refused token, and a good one', async () => {
    const r = (h) => new Request('https://poetech.us/api/checkout', { method: 'POST', headers: h });
    expect((await verifiedBuyer(r({}), ENV)).status).toBe(401);
    expect((await verifiedBuyer(r({ authorization: 'Bearer t' }), { SUPABASE_URL: 'x' })).status).toBe(503);
    expect((await verifiedBuyer(r({ authorization: 'Bearer t' }), ENV, async () => new Response('{}', { status: 401 }))).status).toBe(401);
    expect((await verifiedBuyer(r({ authorization: 'Bearer t' }), ENV, async () => authOk('not-a-uuid'))).status).toBe(401);
    const seen = [];
    const ok = await verifiedBuyer(r({ authorization: 'Bearer tok' }), ENV, async (u, i) => (seen.push({ u, i }), authOk()));
    expect(ok.buyer).toEqual({ userId: BUYER, email: 'b@example.com' });
    expect(seen[0].u).toBe('https://nas.example/sb/auth/v1/user');
    expect(seen[0].i.headers.Authorization).toBe('Bearer tok');
  });

  it('PROVEN TO CATCH: a signed-out POST never reaches Stripe', async () => {
    const calls = [];
    vi.stubGlobal('fetch', async (u) => (calls.push(String(u)), new Response('{}', { status: 200 })));
    const res = await checkoutPost({ env: ENV, request: req({ kind: 'subscription', tier: PLUS_TIER, userId: BUYER }) });
    expect(res.status).toBe(401);
    expect(calls.some((u) => u.includes('stripe.com'))).toBe(false);
  });

  it('a signed-in POST creates the Stripe session for that person', async () => {
    const calls = [];
    vi.stubGlobal('fetch', async (u, i) => {
      calls.push({ u: String(u), i });
      if (String(u).includes('/auth/v1/user')) return authOk();
      return new Response(JSON.stringify({ id: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1' }), { status: 200 });
    });
    const res = await checkoutPost({ env: ENV, request: req({ kind: 'subscription', tier: PLUS_TIER, successUrl: '/poetech-app/?poetech_plus=welcome' }, 'tok') });
    expect(await res.json()).toEqual({ url: 'https://checkout.stripe.com/c/cs_1', id: 'cs_1' });
    const stripe = calls.find((c) => c.u.includes('api.stripe.com/v1/checkout/sessions'));
    const sent = new URLSearchParams(stripe.i.body);
    expect(sent.get('line_items[0][price]')).toBe('price_plus39');
    expect(sent.get('client_reference_id')).toBe(BUYER);
    expect(sent.get('success_url')).toBe('https://poetech.us/poetech-app/?poetech_plus=welcome');
  });
});

describe('the app shows a buy button only when buying can really work', () => {
  it('openTiers: no key, no identity road, a malformed Price -> not open; all present -> open', () => {
    expect(openTiers({})).toEqual([]);
    expect(openTiers({ ...ENV, SUPABASE_ANON_KEY: '' })).toEqual([]);
    expect(openTiers({ ...ENV, STRIPE_TIER_PRICES: '{"poetech-plus":"oops"}' })).toEqual([]);
    expect(openTiers(ENV)).toEqual([PLUS_TIER]);
  });

  it('GET /api/checkout answers the open list and is never cached', async () => {
    const res = await onRequestGet({ env: ENV });
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({ subscriptions: [PLUS_TIER] });
  });

  it('PROVEN TO CATCH the #2057 class: the SPA shell answering 200 HTML reads as NOT open', async () => {
    const html = async () => new Response('<!doctype html><title>PoeTech</title>', { status: 200, headers: { 'content-type': 'text/html' } });
    expect(await checkoutOpen({ fetchImpl: html })).toBe(false);
    expect(await checkoutOpen({ fetchImpl: async () => new Response('{"subscriptions":[]}') })).toBe(false);
    expect(await checkoutOpen({ fetchImpl: async () => { throw new Error('down'); } })).toBe(false);
    expect(await checkoutOpen({ fetchImpl: async () => new Response('{"subscriptions":["poetech-plus"]}') })).toBe(true);
  });

  it('the client never starts a checkout signed out, and every refusal reads as plain words', async () => {
    expect(await startPlusCheckout({ token: '' })).toEqual({ error: 'sign-in-required' });
    expect(sayCheckoutError('processor-not-configured')).toMatch(/not open yet\. Nothing was charged/);
    expect(sayCheckoutError('stripe-500')).toMatch(/Nothing was charged/);
  });

  it('Stripe returns the buyer to the page they bought from, marked, and only same-site', () => {
    expect(returnPaths('/lovecorner/app/', '?view=church&sub=learn&course=x')).toEqual({
      successUrl: '/lovecorner/app/?view=church&sub=learn&course=x&poetech_plus=welcome',
      cancelUrl: '/lovecorner/app/?view=church&sub=learn&course=x',
    });
    expect(returnPaths('//evil.example', '').cancelUrl).toBe('/poetech-app/');
    expect(portalReturnPath('https://evil.example')).toBe('/poetech-app/');
  });
});

describe('the webhook keeps one person’s row true after the purchase', () => {
  const subEvt = (type, obj) => ({ id: `evt_${type}`, type, created: 1794500000, data: { object: obj } });

  it('a renewal, a failed card, and a cancellation each reach the same person, for that subscription only', () => {
    const upd = memberSubscriptionChange(
      subEvt('customer.subscription.updated', { id: 'sub_1', status: 'past_due', current_period_end: 1797100000, metadata: { userId: BUYER, tier: PLUS_TIER } }),
      '2026-11-12T00:00:00.000Z'
    );
    expect(upd).toMatchObject({ op: 'patch', userId: BUYER, subscriptionId: 'sub_1', row: { status: 'past-due', tier: PLUS_TIER } });
    expect(upd.row.current_period_end).toBe(new Date(1797100000 * 1000).toISOString());
    const del = memberSubscriptionChange(subEvt('customer.subscription.deleted', { id: 'sub_1', status: 'canceled', metadata: { userId: BUYER } }));
    expect(del.row.status).toBe('cancelled');
    // Newer Stripe API versions carry the period on the item, not the subscription.
    const item = memberSubscriptionChange(
      subEvt('customer.subscription.updated', { id: 'sub_1', status: 'active', items: { data: [{ current_period_end: 1797100000 }] }, metadata: { userId: BUYER } })
    );
    expect(item.row.current_period_end).toBe(new Date(1797100000 * 1000).toISOString());
    expect(memberSubscriptionChange(subEvt('customer.subscription.updated', { id: 'sub_1', status: 'incomplete', metadata: { userId: BUYER } }))).toBeNull();
    expect(memberSubscriptionChange(subEvt('customer.subscription.updated', { id: 'sub_1', status: 'active', metadata: {} }))).toBeNull();
  });

  it('PROVEN TO CATCH a cancellation that never lands: deleted PATCHes the person’s row by user AND subscription', async () => {
    const calls = [];
    vi.stubGlobal('fetch', async (u, i) => (calls.push({ u: String(u), i }), new Response(JSON.stringify([{ user_id: BUYER }]), { status: 200 })));
    const res = await hook(subEvt('customer.subscription.deleted', { id: 'sub_1', status: 'canceled', metadata: { userId: BUYER } }));
    expect(await res.json()).toMatchObject({ member: 'cancelled', counted: false });
    expect(calls).toHaveLength(1); // no money row for a status change
    expect(calls[0].u).toContain(`member_subscriptions?user_id=eq.${BUYER}&stripe_subscription_id=eq.sub_1`);
    expect(calls[0].i.method).toBe('PATCH');
  });

  it('PROVEN TO CATCH the double count: payment_intent.succeeded is acknowledged and never written to the books', async () => {
    const calls = [];
    vi.stubGlobal('fetch', async (u) => (calls.push(String(u)), new Response(null, { status: 201 })));
    const res = await hook(subEvt('payment_intent.succeeded', { id: 'pi_1', status: 'succeeded', amount: 3900, currency: 'usd' }));
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(0);
  });

  it('a renewal invoice is written to the books once, with the tier as its product; the first invoice is not (the checkout counted it)', async () => {
    const inv = (reason, nested) =>
      subEvt('invoice.paid', {
        id: 'in_2',
        status: 'paid',
        billing_reason: reason,
        amount_paid: 3900,
        currency: 'usd',
        payment_intent: 'pi_2',
        customer_email: 'b@example.com',
        ...(nested
          ? { parent: { subscription_details: { metadata: { tier: PLUS_TIER, userId: BUYER } } } }
          : { subscription_details: { metadata: { tier: PLUS_TIER, userId: BUYER } } }),
      });
    expect(renewalAsSettleEvent(inv('subscription_create'))).toBeNull();
    for (const nested of [false, true]) {
      const calls = [];
      vi.stubGlobal('fetch', async (u, i) => (calls.push({ u: String(u), i }), new Response(null, { status: 201 })));
      await hook(inv('subscription_cycle', nested));
      expect(calls).toHaveLength(1);
      const [row] = JSON.parse(calls[0].i.body);
      expect(row).toMatchObject({ amount_cents: 3900, product_key: PLUS_TIER, status: 'settled', provider_event_id: 'evt_invoice.paid', entity_id: 'e-personal' });
    }
  });

  it('a member write that fails answers 500 so Stripe retries (the books write is idempotent, never doubled)', async () => {
    vi.stubGlobal('fetch', async (u) => new Response(null, { status: String(u).includes('/payments') ? 201 : 503 }));
    const res = await hook(
      subEvt('checkout.session.completed', {
        id: 'cs_1',
        payment_status: 'paid',
        amount_total: 3900,
        subscription: 'sub_1',
        customer: 'cus_1',
        metadata: { kind: 'subscription', tier: PLUS_TIER, userId: BUYER },
      })
    );
    expect(res.status).toBe(500);
  });
});

describe('a member can manage or cancel by themselves (/api/billing-portal)', () => {
  const post = (token, env = ENV) =>
    portalPost({
      env,
      request: new Request('https://poetech.us/api/billing-portal', {
        method: 'POST',
        body: '{"returnPath":"/poetech-app/"}',
        headers: token ? { authorization: `Bearer ${token}` } : {},
      }),
    });

  it('unconfigured -> 503; signed out -> 401; no subscription -> 404', async () => {
    expect((await post('t', {})).status).toBe(503);
    expect((await post('')).status).toBe(401);
    vi.stubGlobal('fetch', async () => new Response('[]', { status: 200 }));
    expect((await post('t')).status).toBe(404);
  });

  it('reads the row with the PERSON’S OWN session (RLS), never the service key, then opens their portal', async () => {
    const calls = [];
    vi.stubGlobal('fetch', async (u, i) => {
      calls.push({ u: String(u), i });
      if (String(u).includes('member_subscriptions')) return new Response('[{"stripe_customer_id":"cus_1"}]', { status: 200 });
      return new Response('{"url":"https://billing.stripe.com/p/session_1"}', { status: 200 });
    });
    const res = await post('tok');
    expect(await res.json()).toEqual({ url: 'https://billing.stripe.com/p/session_1' });
    expect(calls[0].i.headers.Authorization).toBe('Bearer tok');
    expect(calls[0].i.headers.apikey).toBe('anon_1');
    expect(JSON.stringify(calls)).not.toContain('srv_1');
    expect(new URLSearchParams(calls[1].i.body).get('customer')).toBe('cus_1');
  });
});

describe('the app’s tier follows the person’s own paid row', () => {
  it('active holds the tier; a failed card holds it through the grace; cancelled or long past due does not', () => {
    const now = '2026-11-12T00:00:00.000Z';
    expect(paidTierFrom([{ tier: PLUS_TIER, status: 'active' }], now)).toBe(PLUS_TIER);
    expect(paidTierFrom([{ tier: PLUS_TIER, status: 'past-due', current_period_end: '2026-11-05T00:00:00Z' }], now)).toBe(PLUS_TIER);
    expect(paidTierFrom([{ tier: PLUS_TIER, status: 'past-due', current_period_end: '2026-10-01T00:00:00Z' }], now)).toBeNull();
    expect(paidTierFrom([{ tier: PLUS_TIER, status: 'cancelled' }], now)).toBeNull();
    expect(paidTierFrom([], now)).toBeNull();
  });

  it('PROVEN TO CATCH both ways: a read that failed changes nothing; an answer sets the paid tier, or Foundation', () => {
    expect(memberTierDecision(PLUS_TIER, { ok: false })).toBe(PLUS_TIER); // unknown is not unpaid
    expect(memberTierDecision('foundation', { ok: true, tier: PLUS_TIER })).toBe(PLUS_TIER);
    expect(memberTierDecision(PLUS_TIER, { ok: true, tier: null })).toBe('foundation'); // a cancellation lands
  });

  it('the shell syncs it for everyone but the family, offers the button where PoeTech+ unlocks a view, and the showcase carries it in both apps', () => {
    const shell = readFileSync(join(process.cwd(), 'src', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toMatch(/userTier: 'business' \}\)\);\n {4}\} else syncMemberTier\(supabase, setData\);/);
    expect(shell).toMatch(/\{requiredTier === 'poetech-plus' && <PoeTechPlusButton \/>\}/);
    const card = readFileSync(join(process.cwd(), 'src', 'components', 'PoeTechShowcase.jsx'), 'utf8');
    expect(card).toMatch(/<PoeTechPlusButton \/>/);
  });

  it('nothing is locked yet: enforcement stays off until a real purchase is proven end to end', () => {
    expect(ACCESS_ENFORCEMENT).toBe(false);
  });
});
