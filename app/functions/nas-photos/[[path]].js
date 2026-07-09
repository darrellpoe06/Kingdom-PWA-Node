// =============================================================================
// Cloudflare Pages Function — same-origin reverse proxy for /nas-photos/*
// =============================================================================
// This REPLACES the Vercel rewrite that lives in app/vercel.json:
//   { "source": "/nas-photos/:path*", "destination": "https://poetech.tail5a2f35.ts.net/nas-photos/:path*" }
//
// Serves the sovereign property-photo image server (infra/nas-property-photos)
// to the Rentals tab, Big Picture, and the Life Gallery. Same reasons as the
// /n8n sibling (functions/n8n/[[path]].js): Pages `_redirects` cannot proxy an
// external origin, and routing through this same-origin proxy keeps the
// Tailscale Funnel seeing ONE trusted client (Cloudflare egress) instead of
// every family browser, so the cross-origin throttle never applies.
//
// Path mapping — NOTE the difference from the /n8n proxy: the Vercel rewrite
// PRESERVED the /nas-photos prefix (the Funnel's proxy-mount strips it NAS-side
// before the Python server, which expects /property-photos etc.), so this does
// too. A request to /nas-photos/property-photos?channel=x proxies to
//   https://poetech.tail5a2f35.ts.net/nas-photos/property-photos?channel=x
// preserving method, headers (incl. the bridge token) and body.
// =============================================================================

const FUNNEL_ORIGIN = 'https://poetech.tail5a2f35.ts.net';

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);

  // [[path]] catch-all → array of path segments after /nas-photos/ (may be empty).
  const segments = Array.isArray(params.path) ? params.path : (params.path ? [params.path] : []);
  const path = segments.join('/');
  const target = FUNNEL_ORIGIN + '/nas-photos' + (path ? '/' + path : '') + url.search;

  // Copy request headers but drop Host so fetch sets the correct Funnel host.
  const headers = new Headers(request.headers);
  headers.delete('host');

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  let upstream;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      // Buffer the body (photo-metadata payloads are small) so we never depend
      // on streaming-body `duplex` support across runtime versions.
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: 'manual',
    });
  } catch (err) {
    // Funnel unreachable (NAS down / Tailscale blip). Fail with a clear 502 so
    // the client surfaces a real error instead of a confusing CORS/opaque fail.
    return new Response(
      JSON.stringify({ error: 'nas-photos proxy upstream unreachable', detail: String(err && err.message || err) }),
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
