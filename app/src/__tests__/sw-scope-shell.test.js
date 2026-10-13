// @vitest-environment node
// =============================================================================
// sw.js — every installable face falls back to ITS OWN shell, and a navigation
// can NEVER resolve to `undefined`
// =============================================================================
// DIAGNOSED IN PR #1405 (Darrell, 2026-08-30): the church app's own start_url
// `/lovecorner/app/?view=church&lovecorner=1` (DR-0258) died with ERR_FAILED on
// 4G, while site-health reported "UP. Fresh." across every dimension at the
// same moment. Both observations were true, which is the whole problem.
//
// main.jsx then registered `/sw.js` at the DEFAULT scope '/', so ONE worker
// controlled every face while its BASE names only '/poetech-app' (since
// 2026-09-23 the same file is registered per door, lib/sw-door-scope.js; the
// handlers are per-URL, so every case below holds unchanged). The navigation handler is
// network-first; on a transient failure it fell back to
// `caches.match('/poetech-app/index.html')` — the WRONG app's shell when cached,
// and `undefined` when not. respondWith(undefined) IS a network error, which
// Chrome renders as ERR_FAILED. A fresh browser never reproduces it (no worker
// installed), so only a worker-level test can hold this line.
//
// The fix is ported here onto current main rather than rebased from #1405's
// 17-day-old base, and it reads the SAME door list the notification routing
// uses (DOOR_PATHS, DR-0444) instead of a second copy — the unification those
// two changes owed each other.
//
// PROVEN-TO-CATCH: against the pre-fix worker the church case returns the
// PoeTech shell, and the empty-cache case resolves undefined.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SW_SRC = readFileSync(join(HERE, '..', '..', 'public', 'sw.js'), 'utf8');
const ORIGIN = 'https://poetech.us';

// Cache entries are tagged with the URL they were precached from, so a case can
// assert WHICH shell came back — the whole point of the church case.
function loadSw({ missing = [] } = {}) {
  const listeners = {};
  const store = new Map();
  const cachesApi = {
    open: async (name) => {
      if (!store.has(name)) store.set(name, new Map());
      const m = store.get(name);
      return {
        add: async (req) => {
          const url = typeof req === 'string' ? req : req.url;
          if (missing.includes(url)) throw new Error('404 ' + url);
          m.set(url, { ok: true, shell: url });
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
  const selfMock = {
    location: { origin: ORIGIN },
    addEventListener: (t, fn) => { listeners[t] = fn; },
    skipWaiting: () => {},
    clients: { claim: () => Promise.resolve(), matchAll: async () => [] },
    registration: { getNotifications: async () => [] },
    navigator: { setAppBadge: async () => {}, clearAppBadge: async () => {} },
  };
  function MockRequest(url) { this.url = typeof url === 'string' ? url : url.url; }
  // The network is down: this is the branch that produced ERR_FAILED.
  const fetchMock = () => Promise.reject(new Error('offline'));
  new Function('self', 'caches', 'fetch', 'Request', 'URL', 'Response', SW_SRC)(
    selfMock, cachesApi, fetchMock, MockRequest, URL, Response,
  );
  return { listeners };
}

async function install(sw) {
  let p;
  sw.listeners.install({ waitUntil: (x) => { p = x; } });
  await p;
}

async function navigate(sw, url) {
  let responded;
  sw.listeners.fetch({ request: { url, mode: 'navigate' }, respondWith: (x) => { responded = x; } });
  return responded;
}

describe('sw.js — per-face offline shells (the church-door ERR_FAILED)', () => {
  it("a CHURCH navigation offline falls back to the CHURCH shell, not PoeTech's", async () => {
    const sw = loadSw();
    await install(sw);
    const res = await navigate(sw, `${ORIGIN}/lovecorner/app/?view=church&lovecorner=1`);
    expect(res, 'a navigation must never resolve to undefined').toBeTruthy();
    expect(res.shell).toBe('/lovecorner/app/index.html');
  });

  it('a PoeTech navigation offline still falls back to the PoeTech shell', async () => {
    const sw = loadSw();
    await install(sw);
    const res = await navigate(sw, `${ORIGIN}/poetech-app/?view=admin`);
    expect(res).toBeTruthy();
    expect(res.shell).toBe('/poetech-app/index.html');
  });

  it('the other installable faces each get their own shell', async () => {
    const sw = loadSw();
    await install(sw);
    for (const face of ['/moore/app/', '/tlc/app/', '/properties/app/']) {
      const res = await navigate(sw, `${ORIGIN}${face}?x=1`);
      expect(res, `${face} must not resolve undefined`).toBeTruthy();
      expect(res.shell).toBe(face + 'index.html');
    }
  });

  // THE ERR_FAILED GUARD ITSELF. With nothing cached, the old code resolved
  // undefined -> respondWith(undefined) -> network error -> ERR_FAILED.
  it('with NO cached shell at all, a navigation still gets a real Response', async () => {
    const sw = loadSw();                 // never installed: the cache is empty
    const res = await navigate(sw, `${ORIGIN}/lovecorner/app/?view=church`);
    expect(res, 'must be a Response, never undefined').toBeTruthy();
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('offline');
  });

  it('a face with an undeployed shell degrades to the PoeTech shell, not undefined', async () => {
    const sw = loadSw({ missing: ['/lovecorner/app/index.html'] });
    await install(sw);                   // must NOT reject
    const res = await navigate(sw, `${ORIGIN}/lovecorner/app/?view=church`);
    expect(res).toBeTruthy();
    expect(res.shell).toBe('/poetech-app/index.html');
  });

  it('ONE door list serves both the offline shell and the notification routing', () => {
    // The unification: no second copy of the doors anywhere in the worker.
    expect((SW_SRC.match(/var DOOR_PATHS = /g) || []).length).toBe(1);
    expect(SW_SRC).not.toMatch(/SCOPE_SHELLS = \[/);
    expect(SW_SRC).toMatch(/FACE_SHELLS = DOOR_PATHS\.filter/);
  });

  it('the witness watches every face, not only PoeTech', () => {
    const wf = readFileSync(join(HERE, '..', '..', '..', '.github', 'workflows', 'site-health.yml'), 'utf8');
    for (const face of ['/lovecorner/app/', '/moore/app/', '/tlc/app/', '/properties/app/']) {
      expect(wf, `site-health must probe ${face}`).toContain(face);
    }
  });
});
