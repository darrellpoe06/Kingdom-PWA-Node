// =============================================================================
// Cloudflare Pages Function — the asset guard: a missing chunk answers 404,
// never a cacheable lie
// =============================================================================
// WHY THIS EXISTS (incident #722, measured twice 2026-07-10; DR-0153 §2,
// LESSONS P32). For ~7–12 minutes after each deploy, poetech.us can serve the
// NEW app shell while the shell's own hashed chunks are not yet reachable at
// the domain layer. Without this guard a missing /poetech-app/assets/*.js
// falls through the SPA rewrite (_redirects) and answers `200 text/html` —
// the SPA fallback page — which is a LIE with three compounding harms:
//   1. The browser refuses HTML as a module → zero JS runs → blank page.
//   2. _headers stamps Cache-Control by REQUEST PATH, so the HTML-as-chunk is
//      cached `immutable, max-age=31536000` by the browser and the edge — the
//      poison outlives the propagation window for the life of the deploy.
//      That is why "one more tap" kept failing on a device that hit the
//      window: every retry re-read the poisoned cache.
//   3. The service worker caches any `res.ok` asset (sw.js) → a third copy.
//
// This function intercepts /poetech-app/assets/* BEFORE _redirects (Functions
// run first), asks the asset store for the real file, and answers with the
// truth:
//   - The real asset → passed through, stamped immutable (correct: the
//     filename is content-hashed) + nosniff. _headers does NOT apply to
//     Function responses, so the stamp must happen here.
//   - Anything else (HTML fallback, not-found) → `404` + `no-store`. Nothing
//     caches it, the module loader rejects with the truth, and the app's own
//     heal ladders (lib/chunk-reload-heal.js, lib/boot-fallback.js) take over
//     and converge the moment propagation completes.
//
// FAIL-SOFT: this sits on the critical path of every cold asset load, so an
// unexpected error inside the guard must never take the assets down harder
// than the condition it guards against — any throw answers `503 no-store`
// (honest, uncacheable, heal-able), never a crash page.
//
// Scale note: only cold loads reach this function (real assets leave with
// `immutable`, so repeat visits ride the browser/SW caches). Family + church
// traffic is far inside the Pages free-tier invocation budget.
// =============================================================================

// The build publishes dist at the site ROOT while the app requests assets
// under the /poetech-app/ base — the same prefix-strip _redirects does for
// static serving (see public/_redirects), replicated here because Functions
// run before those rules.
export const BASE_PREFIX = '/poetech-app';

/**
 * Judge the asset store's answer for an asset-path request. Pure.
 * 'asset' = a real file the browser may cache forever; 'miss' = the store
 * answered with the SPA fallback page or an error — the asset does not exist
 * at this layer right now.
 * @param {Response|null|undefined} res
 */
export function classifyAssetAnswer(res) {
  if (!res) return 'miss';
  // 304 (conditional revalidation) and other non-error, non-HTML answers pass:
  // a 304 carries no content-type, and no real file under /assets/ is HTML
  // (Vite emits js/css/fonts/images there), so text/html always means the
  // fallback page leaked in.
  if (res.status >= 400) return 'miss';
  const type = (res.headers && res.headers.get && res.headers.get('content-type')) || '';
  if (/text\/html/i.test(type)) return 'miss';
  return 'asset';
}

/** Headers for a real asset: cache forever (content-hashed name), never sniff. */
export function assetPassHeaders(upstreamHeaders) {
  const h = new Headers(upstreamHeaders || undefined);
  h.set('cache-control', 'public, max-age=31536000, immutable');
  h.set('x-content-type-options', 'nosniff');
  return h;
}

/** The honest miss: 404, and NOTHING may cache it — not browser, not edge, not SW. */
export function missResponse() {
  return new Response('missing asset — a deploy is propagating; the app retries automatically', {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store, must-revalidate',
      'cdn-cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    // Prefix-strip to the published root path, dropping any query (hashed
    // filenames never vary by query; a stray ?fresh= must not defeat lookup).
    const rootPath = url.pathname.startsWith(BASE_PREFIX)
      ? url.pathname.slice(BASE_PREFIX.length)
      : url.pathname;
    // Forward the original request (method + conditional headers like
    // if-none-match survive) at the rewritten URL so 304 revalidation works.
    const upstream = await env.ASSETS.fetch(new Request(url.origin + rootPath, request));

    if (classifyAssetAnswer(upstream) === 'miss') return missResponse();

    return new Response(request.method === 'HEAD' ? null : upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: assetPassHeaders(upstream.headers),
    });
  } catch (_) {
    // Guard broke, not the asset store: answer uncacheable + retryable.
    return new Response('asset guard error — retry shortly', {
      status: 503,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store, must-revalidate',
        'cdn-cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  }
}
