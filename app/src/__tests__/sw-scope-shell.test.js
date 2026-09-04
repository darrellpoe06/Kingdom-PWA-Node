// =============================================================================
// sw.js — every installable face falls back to ITS OWN shell, and a navigation
// can NEVER resolve to `undefined`
// =============================================================================
// ROOT CAUSE (2026-08-30, Darrell's screenshot): the church app's own start_url
// `/lovecorner/app/?view=church&lovecorner=1` (DR-0258) died with ERR_FAILED on
// 4G. main.jsx registers `/sw.js` with the DEFAULT scope '/', so ONE worker
// controls every face while its BASE names only '/poetech-app'. The navigation
// handler is network-first; on a transient failure it fell back to
// `caches.match('/poetech-app/index.html')` — the WRONG app's shell when cached,
// and `undefined` when not. respondWith(undefined) IS a network error, which
// Chrome renders as ERR_FAILED.
//
// A fresh browser never reproduces this (no worker installed) — the live-link
// probe passed all 3 cases against /lovecorner/app/ at the same moment the
// installed app was dark. So only a worker-level test can hold this line.
//
// PROVEN-TO-CATCH: against the pre-fix sw.js, the church case returns the
// PoeTech shell (or undefined) and the no-cache case throws on a missing
// Response — both assertions below fail.
// =============================================================================
import { describe, it, expect } from 'vitest';
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

// Cache entries are tagged by the URL they were precached from, so a test can
// assert WHICH shell came back — the whole point of the church case.
function loadSw(fetchImpl) {
  const listeners = {};
  const store = new Map();
  const cachesApi = {
    open: async (name) => {
      if (!store.has(name)) store.set(name, new Map());
      const m = store.get(name);
      return {
        add: async (req) => {
          const url = typeof req === 'string' ? req : req.url;
          if (fetchImpl && fetchImpl.missing && fetchImpl.missing.includes(url)) {
            throw new Error('404 ' + url); // a face whose shell is not deployed
          }
          m.set(url, { ok: true, type: 'basic', shell: url });
        },
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
    if (fetchImpl && typeof fetchImpl.fetch === 'function') return fetchImpl.fetch(url, opts);
    return { ok: true, type: 'basic', shell: 'network' };
  };
  const selfMock = {
    location: { origin: ORIGIN },
    addEventListener: (t, fn) => { listeners[t] = fn; },
    skipWaiting: () => {},
    clients: { claim: () => Promise.resolve() },
  };
  function MockRequest(url) { this.url = typeof url === 'string' ? url : url.url; }
  const run = new Function('self', 'caches', 'fetch', 'Request', 'URL', 'Response', SW_SRC);
  run(selfMock, cachesApi, fetchMock, MockRequest, URL, Response);
  return { listeners, cachesApi };
}

async function install(sw) {
  let p;
  sw.listeners.install({ waitUntil: (x) => { p = x; } });
  await p;
}

async function navigate(sw, url) {
  let responded;
  sw.listeners.fetch({ request: { url, mode: 'navigate' }, respondWith: (p) => { responded = p; } });
  return responded;
}

// The network is down — this is the branch that produced ERR_FAILED.
const OFFLINE = { fetch: () => Promise.reject(new Error('offline')) };

describe('sw.js — per-face offline shells (the church-door ERR_FAILED)', () => {
  it('a CHURCH navigation offline falls back to the CHURCH shell, not PoeTech\'s', async () => {
    const sw = loadSw(OFFLINE);
    await install(sw);
    const res = await navigate(sw, `${ORIGIN}/lovecorner/app/?view=church&lovecorner=1`);
    expect(res, 'a navigation must never resolve to undefined').toBeTruthy();
    expect(res.shell).toBe('/lovecorner/app/index.html');
  });

  it('a PoeTech navigation offline still falls back to the PoeTech shell', async () => {
    const sw = loadSw(OFFLINE);
    await install(sw);
    const res = await navigate(sw, `${ORIGIN}/poetech-app/?view=admin`);
    expect(res).toBeTruthy();
    expect(res.shell).toBe('/poetech-app/index.html');
  });

  it('the other installable faces each get their own shell', async () => {
    const sw = loadSw(OFFLINE);
    await install(sw);
    for (const face of ['/moore/app/', '/tlc/app/', '/properties/app/']) {
      const res = await navigate(sw, `${ORIGIN}${face}?x=1`);
      expect(res, `${face} must not resolve undefined`).toBeTruthy();
      expect(res.shell).toBe(face + 'index.html');
    }
  });

  // THE ERR_FAILED GUARD. With nothing cached at all, the old code resolved
  // undefined -> respondWith(undefined) -> network error -> ERR_FAILED.
  it('with NO cached shell at all, a navigation still gets a real Response', async () => {
    const sw = loadSw(OFFLINE);           // never installed: the cache is empty
    const res = await navigate(sw, `${ORIGIN}/lovecorner/app/?view=church`);
    expect(res, 'must be a Response, never undefined').toBeTruthy();
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('offline');
  });

  // A face whose shell is not deployed must not break install NOR the fallback.
  it('a face with an undeployed shell degrades to the PoeTech shell, not undefined', async () => {
    const sw = loadSw({ ...OFFLINE, missing: ['/lovecorner/app/index.html'] });
    await install(sw);                    // must NOT reject
    const res = await navigate(sw, `${ORIGIN}/lovecorner/app/?view=church`);
    expect(res).toBeTruthy();
    expect(res.shell).toBe('/poetech-app/index.html');
  });
});
