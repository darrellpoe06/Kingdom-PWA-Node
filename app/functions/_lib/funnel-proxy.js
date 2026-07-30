// =============================================================================
// Shared Funnel reverse-proxy factory — ONE implementation for every
// same-origin route that fronts the NAS (2026-07-30 comprehensive review).
// =============================================================================
// Why a Function per route (not _redirects): Cloudflare Pages `_redirects`
// 200-proxying is restricted to same-site URLs and CANNOT proxy an external
// origin. The Tailscale Funnel is an external origin, so each NAS-backed path
// needs a Function that fetch()es the Funnel and streams the response back.
//
// Why the proxy exists at all: the Funnel throttles cross-origin browser
// fetches from poetech.us with HTTP 503 *before* they reach the NAS. Routing
// through a same-origin proxy makes the Funnel see ONE trusted client
// (Cloudflare egress) instead of every family browser, eliminating the
// throttle. Full rationale: app/src/lib/n8n-base.js and
// docs/99-session-notes/2026-06-01-research-review-wf18-unreachable.md.
//
// Before this factory existed, functions/n8n/[[path]].js and
// functions/nas-photos/[[path]].js were ~90% identical copies — and the NINE
// sovereign paths the app had already cut over to (/llm, /reviews, /taxes,
// /scribe, /ways, /property-history, /automation-status, /wake-orchestrator*)
// had NO transport at all on poetech.us: each silently fell through to the SPA
// and served its authored fallback (the 2026-07-30 review's headline finding,
// gated by client-path-parity.test.js). Now every route is a 3-line file over
// this one implementation.
//
// This directory is underscore-prefixed, so Pages does NOT route it.
// =============================================================================

const FUNNEL_ORIGIN = 'https://poetech.tail5a2f35.ts.net';

// upstreamPrefix: the path prefix ON THE FUNNEL that this route forwards to.
//   ''            -> strip the route's own prefix (the legacy /n8n behavior:
//                    /n8n/webhook/foo -> FUNNEL/webhook/foo)
//   '/nas-photos' -> preserve (/nas-photos/x -> FUNNEL/nas-photos/x), the
//                    shape every sovereign route uses (NAS Caddy routes by path)
// label: names the route in the 502 error body so a failure says which
//   feature's transport is down, not just "upstream unreachable".
export function makeFunnelProxy({ upstreamPrefix, label }) {
  return async function onRequest(context) {
    const { request, params } = context;
    const url = new URL(request.url);

    // [[path]] catch-all -> array of segments after the route prefix (absent
    // entirely for single-path routes like /property-history).
    const segments = Array.isArray(params?.path) ? params.path : (params?.path ? [params.path] : []);
    const path = segments.join('/');
    const target = FUNNEL_ORIGIN + upstreamPrefix + (path ? '/' + path : '') + url.search;

    // Copy request headers but drop Host so fetch sets the correct Funnel host.
    const headers = new Headers(request.headers);
    headers.delete('host');

    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

    let upstream;
    try {
      upstream = await fetch(target, {
        method: request.method,
        headers,
        // Buffer the body (family payloads are small) so we never depend on
        // streaming-body `duplex` support across runtime versions.
        body: hasBody ? await request.arrayBuffer() : undefined,
        redirect: 'manual',
      });
    } catch (err) {
      // Funnel unreachable (NAS down / Tailscale blip). Fail with a clear 502
      // so the client surfaces a real error instead of an opaque/CORS fail.
      return new Response(
        JSON.stringify({ error: `${label} proxy upstream unreachable`, detail: String((err && err.message) || err) }),
        { status: 502, headers: { 'content-type': 'application/json' } }
      );
    }

    // Stream the upstream response back unchanged (status + headers + body).
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: upstream.headers,
    });
  };
}
