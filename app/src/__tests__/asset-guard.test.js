// =============================================================================
// Asset guard — a missing chunk answers 404 no-store, never a cacheable lie
// =============================================================================
// Locks the serve-layer fix for incident #722 (DR-0153 §2, LESSONS P32): during
// a deploy-propagation window the domain answered a hashed chunk request with
// the SPA fallback page — `200 text/html` stamped `immutable` by request-path
// _headers — poisoning the browser HTTP cache, the edge, AND the service
// worker's asset cache for the life of the deploy. The guard function
// (app/functions/poetech-app/assets/[[path]].js) converts that lie into an
// honest 404 that nothing caches and the app's heal ladders recover from.
//
// PROVEN-TO-CATCH (DR-0076 §3): the "poisoned window" test below feeds the
// guard the EXACT measured incident shape (a .js asset path answered 200
// text/html) and requires the 404/no-store conversion — remove the guard's
// classify step and this suite goes red.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  BASE_PREFIX,
  classifyAssetAnswer,
  assetPassHeaders,
  missResponse,
  onRequest,
} from '../../functions/poetech-app/assets/[[path]].js';

// Brackets in the function's filename break the URL constructor — join by path.
const guardPath = join(dirname(fileURLToPath(import.meta.url)), '../../functions/poetech-app/assets/[[path]].js');

// Minimal env.ASSETS stub: records what the guard asked for, answers as told.
function fakeAssets(answer) {
  const calls = [];
  return {
    calls,
    fetch(req) {
      calls.push(req);
      if (answer instanceof Error) return Promise.reject(answer);
      return Promise.resolve(typeof answer === 'function' ? answer(req) : answer);
    },
  };
}

const jsResponse = () =>
  new Response('export default 1;', {
    status: 200,
    headers: { 'content-type': 'text/javascript; charset=utf-8' },
  });

// The measured incident shape: SPA fallback HTML answering for a chunk URL.
const fallbackHtml = () =>
  new Response('<!doctype html><html><body>PoeTech shell</body></html>', {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });

describe('the guard function exists on the route the incident hit', () => {
  it('functions/poetech-app/assets/[[path]].js is present (deleting it re-opens #722)', () => {
    expect(existsSync(guardPath)).toBe(true);
  });
});

describe('classifyAssetAnswer', () => {
  it('a real JS asset is an asset', () => {
    expect(classifyAssetAnswer(jsResponse())).toBe('asset');
  });
  it('a 304 revalidation (no content-type) is an asset — conditional loads must not 404', () => {
    expect(classifyAssetAnswer(new Response(null, { status: 304 }))).toBe('asset');
  });
  it('the SPA fallback page (200 text/html) is a MISS — the incident class', () => {
    expect(classifyAssetAnswer(fallbackHtml())).toBe('miss');
  });
  it('a store 404 is a miss', () => {
    expect(classifyAssetAnswer(new Response('nope', { status: 404 }))).toBe('miss');
  });
  it('no response at all is a miss', () => {
    expect(classifyAssetAnswer(null)).toBe('miss');
  });
});

describe('onRequest — the poisoned window converts to an honest 404 (proven-to-catch)', () => {
  it('a chunk answered as HTML leaves as 404 + no-store on every cache layer', async () => {
    const env = { ASSETS: fakeAssets(fallbackHtml()) };
    const request = new Request('https://poetech.us/poetech-app/assets/react-vendor-B6XcsSYh.js');
    const res = await onRequest({ request, env });
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toContain('no-store');
    expect(res.headers.get('cdn-cache-control')).toBe('no-store');
    // The poison vector: an immutable stamp on a non-asset. Must never happen.
    expect(res.headers.get('cache-control')).not.toContain('immutable');
    // The service worker only caches res.ok — 404 keeps it out of the SW too.
    expect(res.ok).toBe(false);
  });

  it('a store miss (404) also leaves as the honest 404', async () => {
    const env = { ASSETS: fakeAssets(new Response('nf', { status: 404 })) };
    const request = new Request('https://poetech.us/poetech-app/assets/index-mHk5DuHt.js');
    const res = await onRequest({ request, env });
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toContain('no-store');
  });
});

describe('onRequest — real assets pass through with the immutable stamp', () => {
  it('serves the asset body with immutable + nosniff (headers _headers cannot supply here)', async () => {
    const env = { ASSETS: fakeAssets(jsResponse()) };
    const request = new Request('https://poetech.us/poetech-app/assets/index-abc123.js');
    const res = await onRequest({ request, env });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('export default 1;');
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-type')).toContain('javascript');
  });

  it('strips the /poetech-app prefix and any query for the store lookup', async () => {
    const env = { ASSETS: fakeAssets(jsResponse()) };
    const request = new Request('https://poetech.us/poetech-app/assets/index-abc123.js?fresh=999');
    await onRequest({ request, env });
    expect(env.ASSETS.calls).toHaveLength(1);
    const asked = new URL(env.ASSETS.calls[0].url);
    expect(asked.pathname).toBe('/assets/index-abc123.js');
    expect(asked.pathname.startsWith(BASE_PREFIX)).toBe(false);
    expect(asked.search).toBe('');
  });

  it('forwards a portable Request (explicit method+headers, not whole-Request-as-init)', async () => {
    // Portability guard: the forwarded Request must be built from an explicit
    // init so undici/Node version differences can't throw and drop the call to
    // the 503 catch (the local-Windows "503≠404" a teammate hit). A GET store
    // request must reach ASSETS as a real, usable GET Request.
    const env = { ASSETS: fakeAssets(jsResponse()) };
    const request = new Request('https://poetech.us/poetech-app/assets/index-abc123.js');
    const res = await onRequest({ request, env });
    expect(res.status).toBe(200); // NOT 503 — the forward did not throw
    expect(env.ASSETS.calls[0].method).toBe('GET');
  });

  it('forwards conditional headers so 304 revalidation still works', async () => {
    const env = {
      ASSETS: fakeAssets((req) =>
        req.headers.get('if-none-match') === '"abc"'
          ? new Response(null, { status: 304 })
          : jsResponse()
      ),
    };
    const request = new Request('https://poetech.us/poetech-app/assets/index-abc123.js', {
      headers: { 'if-none-match': '"abc"' },
    });
    const res = await onRequest({ request, env });
    expect(res.status).toBe(304);
  });

  it('a HEAD request answers headers with no body', async () => {
    const env = { ASSETS: fakeAssets(jsResponse()) };
    const request = new Request('https://poetech.us/poetech-app/assets/index-abc123.js', { method: 'HEAD' });
    const res = await onRequest({ request, env });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('');
  });
});

describe('onRequest — fail-soft: the guard never breaks assets harder than the window it guards', () => {
  it('an ASSETS failure answers 503 + no-store (retryable, uncacheable), never a throw', async () => {
    const env = { ASSETS: fakeAssets(new Error('binding down')) };
    const request = new Request('https://poetech.us/poetech-app/assets/index-abc123.js');
    const res = await onRequest({ request, env });
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toContain('no-store');
  });
});

describe('the guard pieces stay honest in isolation', () => {
  it('missResponse never carries an immutable or cacheable stamp', () => {
    const res = missResponse();
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toContain('no-store');
    expect(res.headers.get('cache-control')).not.toContain('immutable');
  });
  it('assetPassHeaders preserves upstream content-type while stamping cache policy', () => {
    const h = assetPassHeaders(new Headers({ 'content-type': 'text/css' }));
    expect(h.get('content-type')).toBe('text/css');
    expect(h.get('cache-control')).toContain('immutable');
  });
});
