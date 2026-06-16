// =============================================================================
// Cloudflare Pages Function — same-origin reverse proxy for /n8n/*
// =============================================================================
// This REPLACES the Vercel rewrite that lives in app/vercel.json:
//     { "source": "/n8n/:path*", "destination": "https://poetech.tail5a2f35.ts.net/:path*" }
//
// Why a Function (not a _redirects rule): Cloudflare Pages `_redirects` 200
// proxying is restricted to relative, same-site URLs and CANNOT proxy an
// external domain. The Tailscale Funnel is an external origin, so the proxy
// must be a Function that fetch()es the Funnel and streams the response back.
//
// Why the proxy exists at all: the Funnel throttles cross-origin browser
// fetches from poetech.us with HTTP 503 *before* they reach n8n. Routing every
// webhook call through this same-origin proxy makes the Funnel see ONE trusted
// client (Cloudflare egress) instead of every family browser, eliminating the
// throttle. Full rationale: app/src/lib/n8n-base.js and
// docs/99-session-notes/2026-06-01-research-review-wf18-unreachable.md.
//
// Path mapping: a request to /n8n/webhook/foo?x=1 proxies to
//     https://poetech.tail5a2f35.ts.net/webhook/foo?x=1
// preserving method, headers (incl. the wf18 Authorization bearer) and body.
// =============================================================================

const FUNNEL_ORIGIN = 'https://poetech.tail5a2f35.ts.net';

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);

  // [[path]] catch-all → array of path segments after /n8n/ (may be empty).
  const segments = Array.isArray(params.path) ? params.path : (params.path ? [params.path] : []);
  const path = segments.join('/');
  const target = FUNNEL_ORIGIN + '/' + path + url.search;

  // Copy request headers but drop Host so fetch sets the correct Funnel host.
  const headers = new Headers(request.headers);
  headers.delete('host');

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  let upstream;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      // Buffer the body (family webhook payloads are small) so we never depend
      // on streaming-body `duplex` support across runtime versions.
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: 'manual',
    });
  } catch (err) {
    // Funnel unreachable (NAS down / Tailscale blip). Fail with a clear 502 so
    // the client surfaces a real error instead of a confusing CORS/opaque fail.
    return new Response(
      JSON.stringify({ error: 'n8n proxy upstream unreachable', detail: String(err && err.message || err) }),
      { status: 502, headers: { 'content-type': 'application/json' } }
    );
  }

  // Stream the upstream response back unchanged (status + headers + body).
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}
