// =============================================================================
// Cloudflare Pages Function — same-origin reverse proxy for /nas-photos/*
// =============================================================================
// Sibling of functions/n8n/[[path]].js (same rationale — CF `_redirects` cannot
// proxy an external origin). This REPLACES the Vercel rewrite in app/vercel.json:
//     { "source": "/nas-photos/:path*",
//       "destination": "https://poetech.tail5a2f35.ts.net/nas-photos/:path*" }
//
// Fronts the sovereign Python photo server (infra/nas-property-photos/
// photo_server.py) behind the Tailscale Funnel path handler /nas-photos.
// Carries BOTH lanes: the property-photo reads AND the phone media-backup
// writes (2026-07-05) — POST /media-upload chunks are ~6 MB raw bodies, well
// under the Pages Function request cap, buffered whole like the n8n sibling.
//
// Path mapping: /nas-photos/media-upload → FUNNEL/nas-photos/media-upload
// (the Funnel strips /nas-photos before the local server, matching prod).
// =============================================================================

const FUNNEL_ORIGIN = 'https://poetech.tail5a2f35.ts.net';

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);

  // [[path]] catch-all → array of path segments after /nas-photos/ (may be empty).
  const segments = Array.isArray(params.path) ? params.path : (params.path ? [params.path] : []);
  const path = segments.join('/');
  const target = FUNNEL_ORIGIN + '/nas-photos/' + path + url.search;

  // Copy request headers but drop Host so fetch sets the correct Funnel host.
  const headers = new Headers(request.headers);
  headers.delete('host');

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  let upstream;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      // Buffer the body (media-upload chunks are bounded ~6 MB) so we never
      // depend on streaming-body `duplex` support across runtime versions.
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
