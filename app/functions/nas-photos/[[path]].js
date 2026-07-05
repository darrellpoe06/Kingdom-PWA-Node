// =============================================================================
// Cloudflare Pages Function — same-origin reverse proxy for /nas-photos/*
// =============================================================================
// This REPLACES the Vercel rewrite in app/vercel.json:
//     { "source": "/nas-photos/:path*", "destination": "https://poetech.tail5a2f35.ts.net/nas-photos/:path*" }
//
// Found by the 2026-07-05 comprehensive standards audit, the night of the
// Cloudflare cutover: app/functions/ carried only the /n8n proxy, so on the
// Cloudflare host /nas-photos/* fell through to the SPA rewrite and returned
// index.html instead of images — property photos (Big Picture / Rentals) broke
// the moment poetech.us moved off Vercel. Same Function pattern as
// n8n/[[path]].js (an external origin cannot be proxied by _redirects), with
// ONE mapping difference: this path KEEPS its /nas-photos prefix upstream —
//     /nas-photos/property-photos?channel=x  →  FUNNEL/nas-photos/property-photos?channel=x
// =============================================================================

const FUNNEL_ORIGIN = 'https://poetech.tail5a2f35.ts.net';

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);

  // [[path]] catch-all → segments after /nas-photos/ (may be empty). The
  // upstream path keeps the /nas-photos prefix (unlike the /n8n proxy).
  const segments = Array.isArray(params.path) ? params.path : (params.path ? [params.path] : []);
  const path = segments.join('/');
  const target = FUNNEL_ORIGIN + '/nas-photos/' + path + url.search;

  const headers = new Headers(request.headers);
  headers.delete('host');

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  let upstream;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: 'manual',
    });
  } catch (err) {
    // NAS down / Tailscale blip → a clear 502 the photo surfaces can show
    // honestly, instead of an opaque broken-image fail.
    return new Response(
      JSON.stringify({ error: 'nas-photos proxy upstream unreachable', detail: String(err && err.message || err) }),
      { status: 502, headers: { 'content-type': 'application/json' } }
    );
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}
