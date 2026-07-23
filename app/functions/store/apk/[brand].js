// =============================================================================
// Cloudflare Pages Function — /store/apk/<brand>.apk (the App Store's own door)
// =============================================================================
// Measured on Darrell's Samsung 2026-07-23 (two brands, identical failure):
// downloading straight from the GitHub release rides a two-hop redirect
// (github.com -> presigned objects.githubusercontent.com) inside an in-app
// custom tab, and Chrome stalled at 100% ("Downloading…" forever) — every
// byte delivered, never finalized, installer never fired, file left invisible
// in MediaStore's pending state. This door removes every variable: ONE
// same-origin response, fully buffered so Content-Length is EXACT (the thing
// whose mismatch strands Chrome at 100%), explicit APK content type and
// attachment disposition. Our store, our shelf, our origin (DR-0227/0229).
//
// SSRF guard: only the four fixed brand names are ever fetched — the upstream
// URL is built from an allowlist, never from user input.

const BRANDS = Object.freeze(['poetech', 'lovecorner', 'tlc', 'moore']);
const RELEASE_BASE = 'https://github.com/darrellpoe06/Kingdom-PWA-Node/releases/download/android-latest';

export function brandFromParam(p) {
  const name = String(p || '').replace(/\.apk$/i, '');
  return BRANDS.includes(name) ? name : null;
}

export async function onRequestGet(context) {
  const brand = brandFromParam(context.params && context.params.brand);
  if (!brand) return new Response('not found', { status: 404 });

  const cache = caches.default;
  const cacheKey = new Request(new URL(context.request.url).toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let upstream;
  try {
    upstream = await fetch(`${RELEASE_BASE}/${brand}.apk`, { redirect: 'follow' });
  } catch { return new Response('release unreachable', { status: 502 }); }
  if (!upstream.ok) return new Response(`release-${upstream.status}`, { status: 502 });

  // Buffer fully (the packages are ~1-2 MB): the response carries the exact
  // byte count, so the phone's downloader can always finalize.
  const buf = await upstream.arrayBuffer();
  const resp = new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': `attachment; filename="${brand}.apk"`,
      'Content-Length': String(buf.byteLength),
      'Cache-Control': 'public, s-maxage=600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
  context.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}
