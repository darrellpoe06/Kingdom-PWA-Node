// =============================================================================
// sw.js asset-cache strategy — the fix for "the app won't update / let me keep
// using the old version" (2026-07-06). Loads the REAL app/public/sw.js into a
// mocked ServiceWorker global and exercises its fetch handler. Proven-to-catch:
// a hashed build asset must be served cache-first AND populated into the cache
// on a miss, so a RUNNING build keeps its chunks after a deploy swaps the CDN
// (no mid-session 404 → no hard "Reload" wall). The app shell stays network-
// first no-store (privacy fixes still reach the device next navigation).
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function readSw() {
  for (const p of ['public/sw.js', 'app/public/sw.js']) {
    try { return readFileSync(join(process.cwd(), p), 'utf8'); } catch (_) { /* try next */ }
  }
  throw new Error('sw.js not found from ' + process.cwd());
}
const SW_SRC = readSw();
const ORIGIN = 'https://poetech.us';
const BASE = '/poetech-app';

// A tiny mock Response with the fields sw.js reads (ok, type, clone).
function mockResponse({ ok = true, type = 'basic', tag = 'net' } = {}) {
  return { ok, type, tag, clone() { return { ok, type, tag: tag + ':clone' }; } };
}

// Load sw.js into a fresh mocked SW global; return the captured handlers + spies.
// Pass fetchImpl to script what the network returns (e.g. a redirected response).
function loadSw(fetchImpl) {
  const listeners = {};
  const store = new Map(); // cacheName -> Map(url -> response)
  const fetchCalls = [];

  const cachesApi = {
    open: async (name) => {
      if (!store.has(name)) store.set(name, new Map());
      const m = store.get(name);
      return {
        add: async (req) => { m.set(typeof req === 'string' ? req : req.url, mockResponse({ tag: 'precache' })); },
        put: async (req, res) => { m.set(typeof req === 'string' ? req : req.url, res); },
        match: async (req) => m.get(typeof req === 'string' ? req : req.url) || undefined,
      };
    },
    match: async (req) => {
      const key = typeof req === 'string' ? req : req.url;
      for (const m of store.values()) if (m.has(key)) return m.get(key);
      return undefined;
    },
    keys: async () => [...store.keys()],
    delete: async (k) => store.delete(k),
  };

  const fetchMock = async (input, opts) => {
    const url = typeof input === 'string' ? input : input.url;
    fetchCalls.push({ url, opts });
    return fetchImpl ? fetchImpl(url, opts) : mockResponse({ tag: 'net' });
  };

  const selfMock = {
    location: { origin: ORIGIN },
    addEventListener: (type, fn) => { listeners[type] = fn; },
    skipWaiting: () => {},
    clients: { claim: () => Promise.resolve() },
  };

  // Mock Request just needs to carry a url (install uses new Request(url,{...})).
  function MockRequest(url) { this.url = typeof url === 'string' ? url : url.url; }

  const run = new Function('self', 'caches', 'fetch', 'Request', 'URL', SW_SRC);
  run(selfMock, cachesApi, fetchMock, MockRequest, URL);

  return { listeners, store, fetchCalls, cachesApi };
}

// Drive the fetch handler for one request; return what respondWith resolved to,
// after flushing the best-effort cache.put microtasks.
async function handleFetch(sw, request) {
  let responded;
  const event = { request, respondWith: (p) => { responded = p; } };
  sw.listeners.fetch(event);
  const res = await responded;
  await new Promise((r) => setTimeout(r, 0)); // let the async cache.put settle
  await new Promise((r) => setTimeout(r, 0));
  return res;
}

const assetReq = (name) => ({ url: `${ORIGIN}${BASE}/assets/${name}`, mode: 'cors' });

describe('sw.js — hashed assets are cached-first and populated on miss', () => {
  let sw;
  beforeEach(() => { sw = loadSw(); });

  it('registers a fetch handler', () => {
    expect(typeof sw.listeners.fetch).toBe('function');
  });

  it('a JS chunk on a MISS is fetched from network AND written into the cache', async () => {
    const req = assetReq('VoiceStudio-abc123.js');
    const res = await handleFetch(sw, req);
    expect(res.tag).toBe('net');                      // served the network response
    expect(sw.fetchCalls.some((c) => c.url === req.url)).toBe(true);
    // THE FIX: the chunk is now in a cache, so it survives the next CDN swap.
    const cached = await sw.cachesApi.match(req);
    expect(cached, 'chunk must be cached after first load').toBeTruthy();
  });

  it('a JS chunk on a HIT is served from cache with NO network fetch', async () => {
    const req = assetReq('VoiceStudio-abc123.js');
    await handleFetch(sw, req);                        // populate
    sw.fetchCalls.length = 0;                          // reset the spy
    const res = await handleFetch(sw, req);            // second load
    expect(res.tag).toBe('net:clone');                // the cached (cloned) copy
    expect(sw.fetchCalls.length, 'no network on a cache hit').toBe(0);
  });

  it('caches .css and font assets too (the other hard-fail sources)', async () => {
    for (const name of ['index-9f8.css', 'Fraunces-x1.woff2']) {
      const req = assetReq(name);
      await handleFetch(sw, req);
      expect(await sw.cachesApi.match(req), `${name} cached`).toBeTruthy();
    }
  });

  it('an in-app navigation serves the PRECACHED shell with NO network (stay on the previous build — 2026-07-10)', async () => {
    // Drive the install handler so the shell lands in the per-build cache,
    // exactly as a real install does.
    await new Promise((resolve, reject) => {
      sw.listeners.install({ waitUntil: (p) => p.then(resolve, reject) });
    });
    const nav = { url: `${ORIGIN}${BASE}/?view=church`, mode: 'navigate' };
    const res = await handleFetch(sw, nav);
    expect(res.tag).toBe('precache');                        // the device's own complete build
    expect(sw.fetchCalls.length, 'no network for a cached shell').toBe(0);
  });

  it('an in-app navigation BEFORE any install falls back to network no-store (first visit)', async () => {
    const nav = { url: `${ORIGIN}${BASE}/`, mode: 'navigate' };
    await handleFetch(sw, nav);
    const call = sw.fetchCalls.find((c) => c.url === nav.url);
    expect(call, 'navigation went to network').toBeTruthy();
    expect(call.opts && call.opts.cache).toBe('no-store');
  });

  it('an OUT-of-scope navigation (/moore/) never gets the app shell from cache', async () => {
    await new Promise((resolve, reject) => {
      sw.listeners.install({ waitUntil: (p) => p.then(resolve, reject) });
    });
    const nav = { url: `${ORIGIN}/moore/`, mode: 'navigate' };
    const res = await handleFetch(sw, nav);
    expect(res.tag).toBe('net');                              // the real static page, not our shell
    expect(sw.fetchCalls.some((c) => c.url === nav.url)).toBe(true);
  });

  it('does NOT cache a non-asset (e.g. an API) response', async () => {
    const api = { url: `${ORIGIN}/api/whatever`, mode: 'cors' };
    await handleFetch(sw, api);
    expect(await sw.cachesApi.match(api)).toBeFalsy();
  });
});

// =============================================================================
// Navigation redirect guard — the 2026-07-07 /moore ERR_FAILED. The nav handler
// re-issues the request with a redirect-FOLLOWING fetch; a browser refuses a
// `redirected` response for a navigation, so every redirecting path (e.g.
// /moore -> /moore/) hard-failed on any device with the worker installed.
// Proven-to-catch: with the guard removed, the handler returns the redirected
// response itself and these expectations fail.
// =============================================================================
describe('sw.js — navigation redirect guard (the /moore ERR_FAILED fix)', () => {
  it('a redirected navigation becomes a real redirect the browser follows itself', async () => {
    const sw = loadSw(async () => ({ ...mockResponse({ tag: 'net' }), redirected: true, url: `${ORIGIN}/moore/` }));
    const res = await handleFetch(sw, { url: `${ORIGIN}/moore`, mode: 'navigate' });
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe(`${ORIGIN}/moore/`);
  });

  it('a direct (non-redirected) navigation response is served untouched', async () => {
    const sw = loadSw();
    const res = await handleFetch(sw, { url: `${ORIGIN}${BASE}/`, mode: 'navigate' });
    expect(res.tag).toBe('net');
    expect(res.status).toBeUndefined(); // the mock response passed straight through
  });
});
