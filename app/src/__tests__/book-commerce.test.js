// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  formatPrice, processorFee, normalizeProduct, publishableProduct,
  unitEconomics, trialEconomics,
} from '../lib/commerce.js';
import {
  normalizeSubscriber, trialState, effectiveTier, appAccess, entitledToBook,
  startTrial, grantBookEntitlement, activatePaid, ensureSubscriber,
  loadSubscriber, FREE_TIER, TRIAL_DAYS,
} from '../lib/entitlements.js';
import {
  conversationGate, addMessageGated, visibleMessages, messageCounts, normalizeMessage,
} from '../lib/book-conversation.js';
import {
  PROCESSOR_NOTE, processorConfigured, buildBookCheckoutRequest,
  buildSubscriptionCheckoutRequest, executeCheckout, entitlementFromWebhook, checkoutEndpoint,
} from '../lib/checkout-seam.js';
import {
  seedCatalog, publishedProducts, productById, mergeCatalog, upsertOverride, SEED_PRODUCTS,
} from '../lib/book-catalog.js';

function fakeStore() {
  const m = {};
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } };
}
const NOW = '2026-06-25T00:00:00Z';
const plus = (days) => new Date(Date.parse(NOW) + days * 86400000).toISOString();
const PRODUCT = normalizeProduct({ id: 'p1', recipeId: 'r1', title: 'A Book', priceCents: 999, conversationEnabled: true, status: 'published' });

// ---------------------------------------------------------------------------
describe('commerce — pricing + unit economics (sustainable growth)', () => {
  it('formatPrice + processor fee', () => {
    expect(formatPrice(0)).toBe('Free');
    expect(formatPrice(999)).toBe('$9.99');
    expect(processorFee(999)).toBe(Math.round(999 * 0.029) + 30); // 2.9% + $0.30
  });
  it('unitEconomics shows a profitable-per-sale digital book', () => {
    const e = unitEconomics(PRODUCT);
    expect(e.processorFeeCents).toBeGreaterThan(0);
    expect(e.netCents).toBe(999 - e.processorFeeCents);
    expect(e.isProfitable).toBe(true);
    expect(e.marginPct).toBeGreaterThan(80);
  });
  it('breakEvenUnits divides an allocated fixed cost by the per-sale net', () => {
    const e = unitEconomics(PRODUCT, { fixedMonthlyCents: 5000 });
    expect(e.breakEvenUnits).toBe(Math.ceil(5000 / e.netCents));
  });
  it('trialEconomics justifies the 90-free when LTV beats trial cost', () => {
    const t = trialEconomics({ monthlyCents: 3900, convertPct: 50, trialInfraCentsPerMonth: 0 });
    expect(t.trialDays).toBe(90);
    expect(t.justified).toBe(true);                 // near-zero trial cost on sovereign infra
  });
  it('publishableProduct gates on completeness', () => {
    expect(publishableProduct(PRODUCT).ok).toBe(true);
    expect(publishableProduct(normalizeProduct({ title: '' })).ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe('entitlements — unified subscriber + 90-day free', () => {
  it('one subscriber record carries tier + purchases (not siloed)', () => {
    const s = normalizeSubscriber({ userKey: 'u', tier: 'family', purchasedBookIds: ['p1', 'p1'] });
    expect(s.purchasedBookIds).toEqual(['p1']);     // deduped, single identity
  });
  it('a fresh subscriber starts a 90-day trial at the entry tier', () => {
    const store = fakeStore();
    const s = ensureSubscriber('u@x', NOW, { store });
    expect(s.status).toBe('trial');
    expect(s.trialDays).toBe(TRIAL_DAYS);
    expect(loadSubscriber('u@x', store).status).toBe('trial');
  });
  it('honest countdown: X days left, then graceful expiry (no lockout)', () => {
    const s = startTrial(normalizeSubscriber({ userKey: 'u' }), NOW);
    expect(trialState(s, plus(0)).daysLeft).toBe(90);
    expect(trialState(s, plus(60)).daysLeft).toBe(30);
    const ended = trialState(s, plus(91));
    expect(ended.phase).toBe('expired');
    expect(ended.message).toMatch(/Foundation|free/i);   // falls back, not locked out
  });
  it('effective tier = chosen tier during trial, free tier after (graceful)', () => {
    const s = startTrial(normalizeSubscriber({ userKey: 'u', tier: 'poetech-plus' }), NOW);
    expect(effectiveTier(s, plus(10))).toBe('poetech-plus');
    expect(effectiveTier(s, plus(120))).toBe(FREE_TIER);
    expect(appAccess(s, plus(120)).fullApp).toBe(false); // still has free access
  });
  it('book entitlement: free, purchased, or included in the effective tier', () => {
    const free = normalizeProduct({ id: 'f', recipeId: 'r', priceCents: 0 });
    expect(entitledToBook(normalizeSubscriber({}), free, NOW)).toBe(true);
    let s = startTrial(normalizeSubscriber({ userKey: 'u', tier: 'premium' }), NOW);
    const inc = normalizeProduct({ id: 'i', recipeId: 'r', priceCents: 999, tierIncluded: ['premium'] });
    expect(entitledToBook(s, inc, plus(5))).toBe(true);          // tier includes it
    expect(entitledToBook(s, PRODUCT, plus(5))).toBe(false);     // not purchased, not included
    s = grantBookEntitlement(s, 'p1');
    expect(entitledToBook(s, PRODUCT, plus(5))).toBe(true);      // now purchased
  });
  it('activatePaid converts the trial to a paid subscription', () => {
    const s = activatePaid(startTrial(normalizeSubscriber({ userKey: 'u' }), NOW), { tier: 'family', periodEndIso: plus(30) });
    expect(s.status).toBe('active');
    expect(trialState(s, plus(200)).phase).toBe('paid');
  });
});

// ---------------------------------------------------------------------------
describe('book-conversation — purchaser-gated', () => {
  const buyer = grantBookEntitlement(normalizeSubscriber({ userKey: 'b' }), 'p1');
  const stranger = normalizeSubscriber({ userKey: 's' });
  it('gate: buyers in, non-buyers out (with a reason)', () => {
    expect(conversationGate(buyer, PRODUCT, NOW).allowed).toBe(true);
    const blocked = conversationGate(stranger, PRODUCT, NOW);
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toMatch(/purchase/i);
  });
  it('addMessageGated enforces the gate in the data path', () => {
    const draft = { userKey: 'b', authorName: 'B', kind: 'question', body: 'Why teleios?', at: 1 };
    const ok = addMessageGated([], draft, { sub: buyer, product: PRODUCT, nowIso: NOW });
    expect(ok.ok).toBe(true);
    expect(visibleMessages(ok.messages, 'p1')).toHaveLength(1);
    const no = addMessageGated([], draft, { sub: stranger, product: PRODUCT, nowIso: NOW });
    expect(no.ok).toBe(false);
    expect(no.messages).toHaveLength(0);
  });
  it('counts questions + author posts', () => {
    const msgs = [
      normalizeMessage({ bookProductId: 'p1', kind: 'question', body: 'q', at: 1 }),
      normalizeMessage({ bookProductId: 'p1', role: 'author', kind: 'answer', body: 'a', at: 2 }),
    ];
    const c = messageCounts(msgs, 'p1');
    expect(c.total).toBe(2); expect(c.questions).toBe(1); expect(c.fromAuthor).toBe(1);
  });
});

// ---------------------------------------------------------------------------
describe('checkout-seam — no secrets, money is the owner\'s hand', () => {
  it('previews (never charges) when no processor is configured', async () => {
    const req = buildBookCheckoutRequest(PRODUCT, { userKey: 'u' }, { successUrl: '/ok', cancelUrl: '/no' });
    expect(req.amountCents).toBe(999);
    expect(req.metadata.userKey).toBe('u');
    const res = await executeCheckout(req, { config: { enabled: false } });
    expect(res.configured).toBe(false);
    expect(res.ok).toBe(false);
    expect(res.note).toBe(PROCESSOR_NOTE);
  });
  it('posts to the configured endpoint and returns the checkout URL', async () => {
    const req = buildSubscriptionCheckoutRequest('family', { userKey: 'u' }, {});
    const fetchImpl = async () => ({ ok: true, json: async () => ({ url: 'https://checkout.stripe/x' }) });
    const res = await executeCheckout(req, { config: { enabled: true, endpoint: checkoutEndpoint() }, fetchImpl });
    expect(res.ok).toBe(true);
    expect(res.url).toContain('stripe');
  });
  it('maps a verified webhook outcome to the entitlement to grant', () => {
    const book = entitlementFromWebhook({ type: 'book.purchased', metadata: { userKey: 'u', productId: 'p1', kind: 'book' } });
    expect(book).toEqual({ kind: 'book', userKey: 'u', productId: 'p1' });
    const sub = entitlementFromWebhook({ type: 'subscription.active', metadata: { userKey: 'u', tier: 'family', kind: 'subscription' } });
    expect(sub.kind).toBe('subscription');
    expect(sub.tier).toBe('family');
    expect(entitlementFromWebhook({ type: 'nonsense' })).toBeNull();
  });
  it('processorConfigured requires enabled + endpoint', () => {
    expect(processorConfigured({ enabled: true, endpoint: '/api/checkout' })).toBe(true);
    expect(processorConfigured({ enabled: true, endpoint: '' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe('book-catalog — Darrell\'s books, real recipes, honest drafts', () => {
  it('seeds his authored books from real buildable recipes', () => {
    const cat = seedCatalog();
    expect(cat.length).toBe(SEED_PRODUCTS.length);
    const ll = productById(cat, 'prod-living-lessons');
    expect(ll.recipeId).toBe('course-living-lessons');   // real recipe
    expect(ll.author).toBe('Darrell Poe');
  });
  it('the worldview book is DRAFT until its content pipeline lands (no painted product)', () => {
    const pub = publishedProducts(seedCatalog()).map((p) => p.id);
    expect(pub).toContain('prod-living-lessons');
    expect(pub).toContain('prod-eternal-algorithms');
    expect(pub).not.toContain('prod-spirit-integration');
  });
  it('Governor overrides change price / publish state by id', () => {
    const overrides = upsertOverride([], { id: 'prod-eternal-algorithms', priceCents: 1299 });
    const cat = mergeCatalog(seedCatalog(), overrides);
    expect(productById(cat, 'prod-eternal-algorithms').priceCents).toBe(1299);
  });
});
