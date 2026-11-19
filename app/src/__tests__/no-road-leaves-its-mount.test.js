// @vitest-environment node
// =============================================================================
// No road leaves its mount, and the /n8n road is closed (DR-1607).
// =============================================================================
// THE HOLE THIS PINS. Every NAS-backed road builds its upstream URL by joining
// path segments onto the Funnel origin. fetch()'s URL parser collapses dot
// segments, encoded ones included, so `/sb/%2e%2e/rest/owner/setup` was fetched
// as FUNNEL/rest/owner/setup -- the Funnel ROOT, which is the legacy n8n's
// editor, REST API and first-run owner setup. And /n8n/* forwarded ANY path to
// that root by design. Both are the leftover-installer class of Drupal's
// SA-CORE-2026-017 (core/install.php, 2026-11-18).
//
// Proven-to-catch (DR-0076 §3): the first case shows the URL parser really does
// collapse each spelling, so the guard cases below are not theater.
import { describe, it, expect, afterEach } from 'vitest';
import { makeFunnelProxy, escapesMount, ROAD_HEADER, ROAD_VALUE } from '../../functions/_lib/funnel-proxy.js';
import { onRequest as n8nRoad } from '../../functions/n8n/[[path]].js';

const FUNNEL = 'https://poetech.tail5a2f35.ts.net';
const ESCAPES = [
  ['..', 'rest', 'owner', 'setup'],
  ['%2e%2e', 'setup'],
  ['.%2E', 'signin'],
  ['%2E.', 'rest'],
  ['.', 'x'],
  ['a%2f..%2fb'],
  ['a%5c..'],
  ['%E0%A4%A'],
];

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function road(segments) {
  const seen = [];
  globalThis.fetch = async (url) => {
    seen.push(String(url));
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const onRequest = makeFunnelProxy({ upstreamPrefix: '/sb', label: 'sovereign-supabase' });
  const req = new Request('https://poetech.us/sb/' + segments.join('/'));
  return onRequest({ request: req, params: { path: segments } }).then((res) => ({ res, seen }));
}

describe('the URL parser really collapses each spelling (the hole is real)', () => {
  it('climbs out of /sb onto the Funnel root', () => {
    expect(new URL(FUNNEL + '/sb/../rest/owner/setup').pathname).toBe('/rest/owner/setup');
    expect(new URL(FUNNEL + '/sb/%2e%2e/setup').pathname).toBe('/setup');
    expect(new URL(FUNNEL + '/sb/.%2E/signin').pathname).toBe('/signin');
  });
});

describe('no road leaves its mount', () => {
  for (const segs of ESCAPES) {
    it(`refuses ${segs.join('/')} without fetching anything`, async () => {
      expect(escapesMount(segs)).toBe(true);
      const { res, seen } = await road(segs);
      expect(res.status).toBe(400);
      expect(res.headers.get(ROAD_HEADER)).toBe(ROAD_VALUE);
      expect(seen).toEqual([]);
    });
  }

  it('still forwards an ordinary path, inside its mount', async () => {
    const segs = ['rest', 'v1', 'family_members'];
    expect(escapesMount(segs)).toBe(false);
    const { res, seen } = await road(segs);
    expect(res.status).toBe(200);
    expect(seen).toEqual([FUNNEL + '/sb/rest/v1/family_members']);
    for (const u of seen) expect(new URL(u).pathname.startsWith('/sb/')).toBe(true);
  });

  it('allows dots inside a name (a file, a version)', () => {
    expect(escapesMount(['files', '2025', 'return.pdf'])).toBe(false);
    expect(escapesMount(['v1.2.3', '...x'])).toBe(false);
  });
});

describe('the /n8n road is closed', () => {
  for (const p of ['setup', 'signin', 'rest/owner/setup', 'form/abc', 'webhook/imported-transactions', '']) {
    it(`/n8n/${p} answers 410 and fetches nothing`, async () => {
      const seen = [];
      globalThis.fetch = async (u) => {
        seen.push(String(u));
        return new Response('x');
      };
      for (const method of ['GET', 'POST']) {
        const res = await n8nRoad({ request: new Request('https://poetech.us/n8n/' + p, { method }), params: { path: p ? p.split('/') : [] } });
        expect(res.status).toBe(410);
        expect(res.headers.get(ROAD_HEADER)).toBe(ROAD_VALUE);
      }
      expect(seen).toEqual([]);
    });
  }
});
