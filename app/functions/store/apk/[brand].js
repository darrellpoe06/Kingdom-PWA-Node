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
// SSRF guard: only the fixed brand names are ever fetched — the upstream URL is
// built from an allowlist, never from user input. (DR-0313 added `properties`.)

const BRANDS = Object.freeze(['poetech', 'lovecorner', 'tlc', 'moore', 'properties']);
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

  // AN EMPTY SHELF IS NOT AN OUTAGE. Measured 2026-08-28: Poe Properties was
  // added to BRANDS and to the store, but the android-latest release still held
  // only the four APKs built on 2026-07-24 — the lane had not been dispatched
  // since. GitHub answered 404 for properties.apk, this door turned that into a
  // 502, and Cloudflare rendered "Bad gateway · poetech.us · Host Error" on
  // Darrell's phone. He read it, correctly, as the site being down. It was not:
  // one shelf was empty. A missing package now says so in its own words, with
  // the status that means it, so the next person diagnoses it in one look.
  if (upstream.status === 404) {
    return new Response(
      `No Android package has been published for "${brand}" yet. The site is fine — this shelf is empty. `
      + 'Open the app on the web in the meantime; the package appears here as soon as the build lane publishes it.',
      { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } },
    );
  }
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
