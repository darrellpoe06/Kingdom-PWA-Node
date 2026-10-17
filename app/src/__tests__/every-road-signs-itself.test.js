// =============================================================================
// Every answer from a Pages road signs itself, so "did a Function run" is READ
// and never inferred from a content type (DR-1090; #2057).
// =============================================================================
// THE FAILURE THIS PINS. From 2026-10-09 to 2026-10-17 #2057 carried 38
// comments, a zone Worker written to route around the fault (DR-1068) and an
// unlock that put the absolute Funnel origin back into the client bundle — all
// on one sentence: "NO PAGES FUNCTION IS RUNNING ... EVERY NAS-backed road is
// dark at once". It was false for all eight days.
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

  it('site-health no longer calls a text/html answer a dead Function', () => {
    // The exact false headline, retired. If it comes back, so does the
    // eight-day incident it caused.
    expect(read('.github/workflows/site-health.yml')).not.toContain('NO PAGES FUNCTION IS RUNNING — GET poetech.us/automation-status answered with');
  });
});
