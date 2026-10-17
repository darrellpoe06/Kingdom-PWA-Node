// =============================================================================
// Every answer from a Pages road signs itself, so "did a Function run" is READ
// and never inferred from a content type (DR-1092; #2057).
// =============================================================================
// THE FAILURE THIS PINS. From 2026-10-09 to 2026-10-17 #2057 carried 38
// comments, a zone Worker written to route around the fault (DR-1068) and an
// unlock that put the absolute Funnel origin back into the client bundle — all
// on one sentence: "NO PAGES FUNCTION IS RUNNING ... EVERY NAS-backed road is
// dark at once". It is false, measured 2026-10-17 — and said precisely,
// because the difference matters: what is proven is that the headline is
// wrong today and that the probe which produced it CANNOT tell a working road
// from a dark one at all, so every reading it gave was uninformative. What is
// NOT proven is that the 2026-10-09 lockout never happened. Claiming the
// stronger thing here would be the over-claim DR-0076 forbids, in a gate whose
// whole subject is an unmeasured claim.
//
// It came from reading the CONTENT TYPE of /automation-status. text/html was
// taken to mean the SPA shell answered. But /automation-status is a PROXY and
// forwards the upstream's content type; it is not a Funnel mount, so it lands
// on the Funnel's root and returns the NAS's own HTML page. The Function ran
// and the probe called it dead. The run that finally proved it printed the
// disproving bytes on its own line, every run, for eight days: the body on
// /automation-status is `<!DOCTYPE html>`, tab-indented, carrying
// `X-UA-Compatible`, and app/dist/index.html is `<!doctype html>`,
// space-indented, with ZERO occurrences of X-UA-Compatible. Two different
// documents, side by side in the same log, never compared.
//
// So the question is answered structurally instead. Only code running at the
// edge can set a response header; a static SPA fallback is a file and can set
// nothing. These cases hold that signature on every path a road can take —
// including the one that fooled everybody, an upstream that answers HTML.
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeFunnelProxy, ROAD_HEADER, ROAD_VALUE } from '../../functions/_lib/funnel-proxy.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

/** Run a road against a stubbed upstream and hand back the Response. */
function callRoad(upstream, { url = 'https://poetech.us/automation-status', method = 'GET' } = {}) {
  globalThis.fetch = async () => upstream();
  const onRequest = makeFunnelProxy({ upstreamPrefix: '/automation-status', label: 'automation-status' });
  return onRequest({ request: new Request(url, { method }), params: {} });
}

describe('a Pages road signs every answer it gives', () => {
  it('signs a healthy JSON answer', async () => {
    const res = await callRoad(() => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }));
    expect(res.headers.get(ROAD_HEADER)).toBe(ROAD_VALUE);
  });

  // THE ONE THAT MATTERS. This is 2026-10-09 exactly: the upstream answers a
  // perfectly ordinary HTML page, the proxy returns it faithfully, and for
  // eight days that was read as "no Function ran". The signature is present,
  // so a probe reading it cannot make that mistake again.
  it('signs a proxied HTML page — the shape that was misread as a dead transport', async () => {
    const res = await callRoad(() => new Response('<!DOCTYPE html><html><head></head></html>', {
      status: 200, headers: { 'content-type': 'text/html; charset=utf-8' },
    }));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
    expect(res.headers.get(ROAD_HEADER)).toBe(ROAD_VALUE);
  });

  it('signs the 502 it returns when the Funnel cannot be reached', async () => {
    const res = await callRoad(() => { throw new Error('connect ECONNREFUSED'); });
    expect(res.status).toBe(502);
    expect(res.headers.get(ROAD_HEADER)).toBe(ROAD_VALUE);
    expect((await res.json()).error).toMatch(/upstream unreachable/);
  });

  it('signs the 502 it substitutes for an HTML 5xx from the edge', async () => {
    const res = await callRoad(() => new Response('<html><title>Origin DNS error | poetech.us</title></html>', {
      status: 530, headers: { 'content-type': 'text/html' },
    }));
    expect(res.status).toBe(502);
    expect(res.headers.get(ROAD_HEADER)).toBe(ROAD_VALUE);
    expect((await res.json()).code).toBe('upstream-unreachable');
  });

  it('keeps the upstream\'s own headers — the signature is additive, never a replacement', async () => {
    const res = await callRoad(() => new Response('{}', {
      status: 200, headers: { 'content-type': 'application/json', 'x-kong-upstream-latency': '7' },
    }));
    expect(res.headers.get('x-kong-upstream-latency')).toBe('7');
    expect(res.headers.get(ROAD_HEADER)).toBe(ROAD_VALUE);
  });
});

describe('a 502 names its own cause, in the field names the witness greps for', () => {
  // At 00:11 UTC on 2026-10-17 /sb answered 502 and nobody could say why,
  // because every probe kept the status and threw the body away. The body
  // already distinguishes the two failures, and site-health now reads it — so
  // these pin the exact key names, because the witness matches them as text
  // and a rename here would silently blind it.
  it('fetch() throwing gives error + detail and NO code', async () => {
    const body = await (await callRoad(() => { throw new Error('connect ECONNREFUSED'); })).json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('detail');
    expect(body.code).toBeUndefined();
  });

  it('an HTML 5xx from the edge gives code + upstreamStatus as well', async () => {
    const body = await (await callRoad(() => new Response('<html><title>Origin DNS error</title></html>', {
      status: 530, headers: { 'content-type': 'text/html' },
    }))).json();
    expect(body.code).toBe('upstream-unreachable');
    expect(body.upstreamStatus).toBe(530);
    expect(body.detail).toBe('Origin DNS error');
  });

  it('site-health greps for those exact keys', () => {
    const yml = read('.github/workflows/site-health.yml');
    for (const key of ['"error":', '"code":', '"upstreamStatus":', '"detail":']) {
      expect(yml).toContain(key);
    }
  });
});

describe('the two doors sign themselves differently, so a probe can tell which answered', () => {
  it('the zone Worker says worker, the Pages road says pages-function', () => {
    expect(ROAD_VALUE).toBe('pages-function');
    expect(read('infra/cf-roads-worker/worker.js')).toContain("'x-poetech-road', 'worker'");
  });
});

describe('the witnesses actually READ the signature (it is not written into the void)', () => {
  // A signature nothing consumes is decoration. These are the two probes whose
  // verdicts drove #2057; both must now decide on the header. Without this the
  // factory and the instruments could drift back apart silently — which is the
  // DR-1072/1075 orphan lesson applied to a header instead of a library.
  it.each([
    ['.github/workflows/site-health.yml'],
    ['.github/workflows/cf-pages-diagnose.yml'],
  ])('%s reads x-poetech-road', (path) => {
    expect(read(path)).toContain(ROAD_HEADER);
  });

  // TWO KEYS, NOT ONE. A missing signature has two causes and only one is an
  // outage: the road is dark, OR the served build predates the signature. That
  // second case is guaranteed at least once, in the minutes between this change
  // merging and its deploy reaching the edge — and a probe that failed then
  // would raise the identical false alarm for a new reason. So a road is dark
  // only when it is unsigned AND the body is OUR shell, identified by
  // /poetech-app/assets/, which Vite writes into dist/index.html eight times
  // and no page on the NAS carries.
  it.each([
    ['.github/workflows/site-health.yml'],
    ['.github/workflows/cf-pages-diagnose.yml'],
  ])('%s also fingerprints our own shell before calling a road dark', (path) => {
    expect(read(path)).toContain('/poetech-app/assets/');
  });

  it('our built shell really does carry that fingerprint (the key is not imaginary)', () => {
    // Read the SOURCE index, which is in the tree whether or not dist exists;
    // the /poetech-app base is the Vite config's, so the built asset paths
    // inherit it. A fingerprint nothing carries would fail every road open.
    expect(read('app/vite.config.js')).toContain('/poetech-app/');
  });

  it('site-health no longer calls a text/html answer a dead Function', () => {
    // The exact false headline, retired. If it comes back, so does the
    // eight-day incident it caused.
    expect(read('.github/workflows/site-health.yml')).not.toContain('NO PAGES FUNCTION IS RUNNING — GET poetech.us/automation-status answered with');
  });
});
