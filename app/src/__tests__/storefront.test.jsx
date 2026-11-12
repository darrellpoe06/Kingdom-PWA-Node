// @vitest-environment jsdom
// =============================================================================
// Storefront — the public shelf says what it sees, buys only what the server
// opened, and hands the book over on return from Stripe (DR-1449)
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import Storefront, { DeliveredPanel } from '../components/Storefront.jsx';
import { SURFACES } from '../surfaces.js';
import { VALID_VIEWS } from '../lib/nav-history.js';
import { navItems, NAV_WORDS, NAV_ICONS } from '../lib/nav-items.jsx';
import { STORE_PROFILE } from '../lib/store-profile.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

function fakeClient({ rows = [], token = '' } = {}) {
  const chain = (data) => {
    const q = { data, error: null };
    for (const m of ['select', 'in', 'gte', 'order']) q[m] = () => q;
    q.then = (res) => res({ data, error: null });
    return q;
  };
  return {
    from: () => chain(rows),
    rpc: async () => ({ data: 5 }),
    auth: { getSession: async () => ({ data: { session: token ? { access_token: token } : null } }) },
  };
}
const serverSays = (open, extra = {}) =>
  vi.fn(async (url) => {
    if (String(url).startsWith('/api/checkout')) return { ok: true, status: 200, json: async () => open };
    if (String(url).startsWith('/api/deliver'))
      return extra.deliver ? extra.deliver() : { ok: false, status: 400, json: async () => ({ error: 'unknown-session' }) };
    return { ok: false, status: 404, json: async () => ({}) };
  });

let host = null;
let root = null;
async function draw(el) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root.render(el);
  });
  await flush();
  return host;
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host && host.parentNode) host.parentNode.removeChild(host);
  root = null;
  host = null;
  window.localStorage.clear();
});

describe('the store is a registered public surface', () => {
  it('is in the registry with no sign-in requirement, a routable view, a nav entry for a visitor, a label and an icon', () => {
    const s = SURFACES.find((x) => x.id === 'store');
    expect(s).toBeTruthy();
    expect(s.requires).toBe('anyone');
    expect(s.view).toBe('store');
    expect(VALID_VIEWS).toContain('store');
    const visitor = navItems({ authSession: null, isFamilyMember: false });
    expect(visitor.some(([id]) => id === 'store')).toBe(true);
    expect(NAV_WORDS.store).toBe('Store');
    expect(NAV_ICONS.store).toBeTruthy();
  });
});

describe('the shelf', () => {
  it('opens with the seller, the bio and a share; lists books, courses and the membership; a book the server opened is buyable and the rest say so', async () => {
    const h = await draw(
      createElement(Storefront, { client: fakeClient(), fetchImpl: serverSays({ books: ['prod-living-lessons'], subscriptions: [] }), search: '' })
    );
    expect(h.querySelector('[data-testid="store-profile"]').textContent).toContain(STORE_PROFILE.seller);
    expect(h.querySelector('[data-testid="store-profile"]').textContent).toContain(STORE_PROFILE.tagline);
    expect(h.querySelector('[data-testid="store-counts"]').textContent).toMatch(/2 books · 0 bundles · \d+ courses · 0 workshops open · 1 membership/);
    const items = [...h.querySelectorAll('[data-testid="store-item"]')];
    expect(items.length).toBe(Number(h.querySelector('[data-testid="storefront"]').getAttribute('data-total')));
    const ll = items.find((i) => i.getAttribute('data-id') === 'prod-living-lessons');
    expect(ll.getAttribute('data-buyable')).toBe('yes');
    expect(ll.querySelector('[data-testid="buy"]').textContent).toBe('Buy $9.99');
    const ea = items.find((i) => i.getAttribute('data-id') === 'prod-eternal-algorithms');
    expect(ea.getAttribute('data-buyable')).toBe('no');
    expect(ea.querySelector('[data-testid="not-open"]').textContent).toMatch(/opens soon/);
    expect(h.querySelector('[data-testid="store-course"]')).toBeTruthy();
    expect(h.querySelector('[data-testid="store-membership"] [data-testid="poetech-plus"]')).toBeTruthy();
    expect(h.textContent).toMatch(/Have a code\? Enter it on the checkout page/);
  });
  it('buying posts to /api/checkout with a return path that carries the session id placeholder; a closed book never posts', async () => {
    const calls = [];
    const fetchImpl = vi.fn(async (url, init) => {
      if (String(url).startsWith('/api/checkout') && (!init || init.method !== 'POST'))
        return { ok: true, status: 200, json: async () => ({ books: ['prod-living-lessons'], subscriptions: [] }) };
      if (String(url).startsWith('/api/checkout')) {
        calls.push(JSON.parse(init.body));
        return { ok: true, status: 200, json: async () => ({ url: '' }) };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
    const h = await draw(createElement(Storefront, { client: fakeClient(), fetchImpl, search: '?view=store' }));
    const ll = [...h.querySelectorAll('[data-testid="store-item"]')].find((i) => i.getAttribute('data-id') === 'prod-living-lessons');
    await act(async () => {
      ll.querySelector('[data-testid="buy"]').click();
    });
    await flush();
    expect(calls.length).toBe(1);
    expect(calls[0]).toMatchObject({ kind: 'book', productId: 'prod-living-lessons' });
    expect(calls[0].successUrl).toMatch(/paid=1&session_id=\{CHECKOUT_SESSION_ID\}$/);
    expect(h.querySelector('[data-testid="store-note"]').textContent).toMatch(/could not start/);
  });
  it('a return from Stripe delivers the book: the panel says so, the downloads are offered, and the book reads as owned on the shelf', async () => {
    const fetchImpl = serverSays(
      { books: [], subscriptions: [] },
      {
        deliver: () => ({
          ok: true,
          status: 200,
          json: async () => ({ ok: true, product: 'prod-living-lessons', grants: ['prod-living-lessons'], email: 'b@example.com' }),
        }),
      }
    );
    const dl = vi.fn();
    const h = await draw(
      createElement(Storefront, { client: fakeClient(), fetchImpl, search: '?view=store&paid=1&session_id=cs_test_abc', onDownloadProduct: dl })
    );
    expect(h.querySelector('[data-testid="delivered"]').textContent).toMatch(
      /Your book is in your library on this device, and the receipt went to b@example.com/
    );
    await act(async () => {
      h.querySelector('[data-testid="download-epub"]').click();
    });
    expect(dl).toHaveBeenCalledWith('prod-living-lessons', 'epub');
    const ll = [...h.querySelectorAll('[data-testid="store-item"]')].find((i) => i.getAttribute('data-id') === 'prod-living-lessons');
    expect(ll.querySelector('[data-testid="store-price"]').textContent).toBe('Yours');
  });
  it('a return the server will not confirm delivers nothing and says why', async () => {
    const h = await draw(
      createElement(Storefront, { client: fakeClient(), fetchImpl: serverSays({ books: [], subscriptions: [] }), search: '?paid=1&session_id=cs_test_nope' })
    );
    expect(h.querySelector('[data-testid="delivery-failed"]').textContent).toMatch(/could not be found/);
    expect(h.querySelector('[data-testid="delivered"]')).toBeNull();
  });
  it('DeliveredPanel renders nothing with no delivery', async () => {
    const h = await draw(createElement(DeliveredPanel, { delivery: null }));
    expect(h.textContent).toBe('');
  });
});
