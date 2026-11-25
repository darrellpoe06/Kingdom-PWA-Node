// @vitest-environment jsdom
// =============================================================================
// DR-1652 — a lesson download is PoeTech+ or the one-time Download Pass.
// Darrell 2026-11-24: "Don't allow any lesson to be downloaded... we will now
// be charging a fee or if they have a subscription they can."
// Proven-to-catch: each rule below is pinned so removing the gate reds a test.
// =============================================================================
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import {
  ACCESS,
  DOWNLOAD_PASS_ID,
  downloadAccess,
  tierAllowsDownloads,
  readDownloadOffers,
  startDownloadPassCheckout,
  passReturnPaths,
  sayPassError,
} from '../lib/lesson-download-access.js';
import { DownloadAccessProvider, DownloadGate, DOWNLOAD_IS_PAID, DOWNLOAD_CHECK_FAILED } from '../components/DownloadAccess.jsx';

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

const clientWith = (answer) => {
  const calls = [];
  return {
    calls,
    auth: { getSession: async () => ({ data: { session: { access_token: 'tok' } } }) },
    from(table) {
      calls.push(table);
      return { select: () => Promise.resolve(typeof answer === 'function' ? answer() : answer) };
    },
  };
};

const jsonRes = (obj, ok = true, status = 200) => ({ ok, status, json: async () => obj });

describe('the access rule (pure)', () => {
  it('signed out is the account prompt, whatever the tier', () => {
    expect(downloadAccess({ open: true, signedIn: false, userTier: 'business' })).toBe(ACCESS.SIGN_IN);
  });
  it('PoeTech+ and every higher tier carry downloads; the free tier does not', () => {
    for (const t of ['poetech-plus', 'family', 'premium', 'business']) expect(tierAllowsDownloads(t)).toBe(true);
    expect(tierAllowsDownloads('foundation')).toBe(false);
    expect(tierAllowsDownloads(undefined)).toBe(false);
    expect(downloadAccess({ open: true, signedIn: true, userTier: 'poetech-plus' })).toBe(ACCESS.ALLOWED);
  });
  it('the free tier: checking while the read is out, then pass = allowed, no pass = purchase, no answer = unknown', () => {
    expect(downloadAccess({ open: true, signedIn: true, userTier: 'foundation', read: null })).toBe(ACCESS.CHECKING);
    expect(downloadAccess({ open: true, signedIn: true, read: { ok: true, productIds: [DOWNLOAD_PASS_ID] } })).toBe(ACCESS.ALLOWED);
    expect(downloadAccess({ open: true, signedIn: true, read: { ok: true, productIds: ['some-book'] } })).toBe(ACCESS.NEEDS_PURCHASE);
    expect(downloadAccess({ open: true, signedIn: true, read: { ok: false, productIds: [] } })).toBe(ACCESS.UNKNOWN);
  });
});

describe('what is for sale comes from the server, never assumed', () => {
  it('reads PoeTech+ and the pass from GET /api/checkout', async () => {
    const f = vi.fn(async () => jsonRes({ subscriptions: ['poetech-plus'], books: [DOWNLOAD_PASS_ID] }));
    expect(await readDownloadOffers({ fetchImpl: f })).toEqual({ plus: true, pass: true });
    expect(f.mock.calls[0][0]).toBe('/api/checkout');
  });
  it('a pass missing from the catalog is not for sale', async () => {
    const f = async () => jsonRes({ subscriptions: [], books: ['other-book'] });
    expect(await readDownloadOffers({ fetchImpl: f })).toEqual({ plus: false, pass: false });
  });
  it('the SPA shell, an error or a throw all read as nothing for sale', async () => {
    expect(
      await readDownloadOffers({
        fetchImpl: async () => ({
          ok: true,
          json: async () => {
            throw new Error('html');
          },
        }),
      })
    ).toEqual({ plus: false, pass: false });
    expect(await readDownloadOffers({ fetchImpl: async () => jsonRes({}, false, 503) })).toEqual({ plus: false, pass: false });
    expect(
      await readDownloadOffers({
        fetchImpl: async () => {
          throw new Error('down');
        },
      })
    ).toEqual({ plus: false, pass: false });
  });
});

describe('buying the pass', () => {
  it('posts the one-off product with the buyer token; the client sends no price', async () => {
    const f = vi.fn(async () => jsonRes({ url: 'https://checkout.stripe.com/c/x' }));
    const r = await startDownloadPassCheckout({ token: 'tok', pathname: '/poetech-app/', search: '', fetchImpl: f });
    expect(r).toEqual({ url: 'https://checkout.stripe.com/c/x' });
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('/api/checkout');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer tok');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ kind: 'book', productId: DOWNLOAD_PASS_ID });
    expect(body.amountCents).toBeUndefined();
    expect(body.successUrl).toBe('/poetech-app/?download_pass=welcome');
  });
  it('no sign-in, no checkout; a server refusal is said plainly, nothing charged', async () => {
    expect(await startDownloadPassCheckout({ token: '' })).toEqual({ error: 'sign-in-required' });
    const r = await startDownloadPassCheckout({ token: 't', fetchImpl: async () => jsonRes({ error: 'unknown-product' }, false, 400) });
    expect(r).toEqual({ error: 'unknown-product' });
    expect(sayPassError('unknown-product')).toMatch(/not for sale yet\. Nothing was charged/);
    expect(sayPassError('weird')).toMatch(/Nothing was charged/);
  });
  it('return paths stay on this site and drop a stale marker', () => {
    expect(passReturnPaths('//evil.com', '')).toEqual({ successUrl: '/poetech-app/?download_pass=welcome', cancelUrl: '/poetech-app/' });
    expect(passReturnPaths('/x/', '?a=1&download_pass=welcome').cancelUrl).toBe('/x/?a=1');
  });
});

describe('the gate on screen', () => {
  const render = (props, child = createElement('button', { 'data-testid': 'the-download' }, 'Download')) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(createElement(DownloadAccessProvider, { open: true, ...props }, createElement(DownloadGate, { label: 'Download' }, child))));
    return { container, root };
  };

  it('no provider: the door stays shut and says why (fail closed)', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => root.render(createElement(DownloadGate, { label: 'Download' }, createElement('button', { 'data-testid': 'the-download' }))));
    expect(container.querySelector('[data-testid="the-download"]')).toBeNull();
    expect(container.textContent).toContain(DOWNLOAD_CHECK_FAILED);
    act(() => root.unmount());
  });

  it('signed out: the account prompt', () => {
    const { container, root } = render({ signedIn: false });
    expect(container.querySelector('[data-testid="download-needs-account"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="the-download"]')).toBeNull();
    act(() => root.unmount());
  });

  it('PoeTech+ opens the door with no database read at all', () => {
    const client = clientWith({ data: [], error: null });
    const { container, root } = render({ signedIn: true, userTier: 'poetech-plus', client });
    expect(container.querySelector('[data-testid="the-download"]')).toBeTruthy();
    expect(client.calls).toEqual([]);
    act(() => root.unmount());
  });

  it('a free account that owns the pass: the door opens after the read', async () => {
    const client = clientWith({ data: [{ product_id: DOWNLOAD_PASS_ID }], error: null });
    const { container, root } = render({ signedIn: true, userTier: 'foundation', client, fetchImpl: async () => jsonRes({}) });
    expect(container.querySelector('[data-testid="download-access-checking"]')).toBeTruthy();
    await flush();
    expect(client.calls).toEqual(['book_entitlements']);
    expect(container.querySelector('[data-testid="the-download"]')).toBeTruthy();
    act(() => root.unmount());
  });

  it('a free account without it: the paid line, and with checkout closed, no buy button and the honest note', async () => {
    const client = clientWith({ data: [], error: null });
    const { container, root } = render({ signedIn: true, client, fetchImpl: async () => jsonRes({ subscriptions: [], books: [] }) });
    await flush();
    await flush();
    expect(container.querySelector('[data-testid="the-download"]')).toBeNull();
    expect(container.textContent).toContain(DOWNLOAD_IS_PAID);
    expect(container.querySelector('[data-testid="download-buy-pass"]')).toBeNull();
    expect(container.querySelector('[data-testid="download-get-plus"]')).toBeNull();
    expect(container.querySelector('[data-testid="download-checkout-not-open"]').textContent).toMatch(/Nothing is charged/);
    act(() => root.unmount());
  });

  it('with both for sale, the two ways through are offered; "Buy the Download Pass" really starts that checkout', async () => {
    const client = clientWith({ data: [], error: null });
    const assign = vi.fn();
    const orig = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { pathname: '/poetech-app/', search: '', assign } });
    const posts = [];
    const fetchImpl = async (url, init = {}) => {
      if (init.method === 'POST') {
        posts.push(JSON.parse(init.body));
        return jsonRes({ url: 'https://checkout.stripe.com/c/pass' });
      }
      return jsonRes({ subscriptions: ['poetech-plus'], books: [DOWNLOAD_PASS_ID] });
    };
    const { container, root } = render({ signedIn: true, client, fetchImpl });
    await flush();
    await flush();
    expect(container.querySelector('[data-testid="download-get-plus"]')).toBeTruthy();
    const buy = container.querySelector('[data-testid="download-buy-pass"]');
    expect(buy).toBeTruthy();
    await act(async () => {
      buy.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush();
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ kind: 'book', productId: DOWNLOAD_PASS_ID });
    expect(assign).toHaveBeenCalledWith('https://checkout.stripe.com/c/pass');
    Object.defineProperty(window, 'location', { configurable: true, value: orig });
    act(() => root.unmount());
  });

  it('"I already paid: check again" really re-reads, and the door opens once the pass is there', async () => {
    let owned = [];
    const client = clientWith(() => ({ data: owned.map((p) => ({ product_id: p })), error: null }));
    const { container, root } = render({ signedIn: true, client, fetchImpl: async () => jsonRes({}) });
    await flush();
    await flush();
    expect(container.querySelector('[data-testid="the-download"]')).toBeNull();
    owned = [DOWNLOAD_PASS_ID];
    await act(async () => {
      container.querySelector('[data-testid="download-recheck"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush();
    expect(client.calls).toEqual(['book_entitlements', 'book_entitlements']);
    expect(container.querySelector('[data-testid="the-download"]')).toBeTruthy();
    act(() => root.unmount());
  });

  it('a read that did not answer keeps the door shut and says the check failed, never "unpaid"', async () => {
    const client = clientWith({ data: null, error: { message: 'down' } });
    const { container, root } = render({ signedIn: true, client, fetchImpl: async () => jsonRes({}) });
    await flush();
    await flush();
    expect(container.querySelector('[data-testid="the-download"]')).toBeNull();
    expect(container.textContent).toContain(DOWNLOAD_CHECK_FAILED);
    expect(container.textContent).not.toContain(DOWNLOAD_IS_PAID);
    act(() => root.unmount());
  });
});

// DR-1655: the switch is OFF by default. No one takes a lesson away, at any
// tier, with or without the pass; the door offers a copy request instead.
import { DOWNLOADS_OPEN, requestLessonCopy } from '../lib/lesson-download-access.js';
describe('downloads are switched off by default (DR-1655)', () => {
  it('the switch ships off, and off means closed for every tier and the pass', () => {
    expect(DOWNLOADS_OPEN).toBe(false);
    expect(downloadAccess({ signedIn: true, userTier: 'business' })).toBe(ACCESS.CLOSED);
    expect(downloadAccess({ signedIn: true, read: { ok: true, productIds: [DOWNLOAD_PASS_ID] } })).toBe(ACCESS.CLOSED);
    expect(downloadAccess({ signedIn: false })).toBe(ACCESS.CLOSED);
    expect(downloadAccess({ open: 'yes', signedIn: true, userTier: 'business' })).toBe(ACCESS.CLOSED);
  });
  it('the door is closed for PoeTech+ and offers to ask the administration for a copy', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        createElement(
          DownloadAccessProvider,
          { signedIn: true, userTier: 'business' },
          createElement(DownloadGate, { label: 'Download' }, createElement('button', { 'data-testid': 'the-download' }, 'Download'))
        )
      )
    );
    expect(container.querySelector('[data-testid="the-download"]')).toBeNull();
    expect(container.querySelector('[data-testid="downloads-closed-panel"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="request-copy"]').textContent).toBe('Ask the administration for a copy');
    act(() => root.unmount());
    container.remove();
  });
  it('a copy request rides the feedback pipe and reports what really happened', async () => {
    const sent = [];
    const ok = await requestLessonCopy({ what: 'this lesson', where: 'x', upload: async (item) => (sent.push(item), { uploaded: true }) });
    expect(ok).toEqual({ ok: true });
    expect(sent[0].text).toContain('Copy request');
    expect(await requestLessonCopy({ upload: async () => ({ skipped: 'signed-out' }) })).toEqual({ ok: false, why: 'sign-in' });
    expect(await requestLessonCopy({ upload: async () => ({ skipped: 'insert-error' }) })).toEqual({ ok: false, why: 'failed' });
  });
});

// DR-1656: the switch lives in the database and the Governor flips it in the app.
import { readDownloadsOpen, setDownloadsOpen } from '../lib/lesson-download-access.js';
import { DownloadsSwitch } from '../components/DownloadAccess.jsx';
const rpcClient = (answers) => ({
  calls: [],
  rpc(name, args) {
    this.calls.push([name, args]);
    const a = answers[name];
    return Promise.resolve(typeof a === 'function' ? a(args) : a);
  },
});
describe('the stored downloads switch (DR-1656)', () => {
  it('reads only the database’s own true as open; an error or a missing client is closed', async () => {
    expect(await readDownloadsOpen(rpcClient({ downloads_open: { data: true, error: null } }))).toEqual({ ok: true, open: true });
    expect(await readDownloadsOpen(rpcClient({ downloads_open: { data: false, error: null } }))).toEqual({ ok: true, open: false });
    expect(await readDownloadsOpen(rpcClient({ downloads_open: { data: 'yes', error: null } }))).toEqual({ ok: true, open: false });
    expect(await readDownloadsOpen(rpcClient({ downloads_open: { data: null, error: { code: 'PGRST202' } } }))).toEqual({ ok: false, open: false });
    expect(await readDownloadsOpen(null)).toEqual({ ok: false, open: false });
    expect(await readDownloadsOpen({ rpc: () => new Promise(() => {}) }, 20)).toEqual({ ok: false, open: false });
  });
  it('a refusal from the database is reported as not the Governor, never as done', async () => {
    expect(await setDownloadsOpen(rpcClient({ set_downloads_open: { data: null, error: { code: '42501' } } }), true)).toEqual({
      ok: false,
      why: 'not-governor',
    });
    const c = rpcClient({ set_downloads_open: (a) => ({ data: a.on_in, error: null }) });
    expect(await setDownloadsOpen(c, true)).toEqual({ ok: true, open: true });
    expect(c.calls[0]).toEqual(['set_downloads_open', { on_in: true }]);
  });
  it('with the database saying open, PoeTech+ gets the door; saying closed, no one does', async () => {
    const mount = async (open) => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      const client = rpcClient({ downloads_open: { data: open, error: null } });
      await act(async () => {
        root.render(
          createElement(
            DownloadAccessProvider,
            { signedIn: true, userTier: 'business', client },
            createElement(DownloadGate, { label: 'Download' }, createElement('button', { 'data-testid': 'the-download' }, 'Download'))
          )
        );
      });
      const got = !!container.querySelector('[data-testid="the-download"]');
      act(() => root.unmount());
      container.remove();
      return got;
    };
    expect(await mount(true)).toBe(true);
    expect(await mount(false)).toBe(false);
  });
  it('the Governor’s switch shows where it stands and flips it, re-reading the database after', async () => {
    let stored = false;
    const client = rpcClient({
      downloads_open: () => ({ data: stored, error: null }),
      set_downloads_open: (a) => ((stored = a.on_in), { data: stored, error: null }),
    });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(DownloadAccessProvider, { signedIn: true, userTier: 'business', client }, createElement(DownloadsSwitch)));
    });
    expect(container.querySelector('[data-testid="downloads-switch-state"]').textContent).toBe('Closed');
    const flip = container.querySelector('[data-testid="downloads-switch-flip"]');
    expect(flip.textContent).toBe('Open downloads');
    await act(async () => {
      flip.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await act(async () => {});
    expect(stored).toBe(true);
    expect(container.querySelector('[data-testid="downloads-switch-state"]').textContent).toBe('Open');
    act(() => root.unmount());
    container.remove();
  });
});
