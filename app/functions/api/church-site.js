// =============================================================================
// Cloudflare Pages Function — /api/church-site (the church's own website, read
// into the app; DR-1550)
// =============================================================================
// Darrell 2026-11-18: "The Love Corner App should be able to get the latest
// data from the website... announcements... upcoming events... Without needing
// to go to the site!!!! Pull in the new information for those using the app."
//
// The church office publishes on its Weebly site (read by church-site-probe.yml
// from a runner on 2026-11-18): the month's calendar as one picture on
// /calendar.html, the Letters from BG as a picture, the current events as
// flyers in a slideshow, the service times as text on the home page. No feed,
// no API. A browser cannot read the site cross-origin, so this same-origin
// relay does, the proven shape of /api/church-recent: fetch, trim, return.
//
//   ?page=calendar|current-events|previous-events|letters-from-bg|home
//       → JSON { page, url, fetchedAt, html, images }: the page's content
//         region (from the Weebly content div to its footer) and every
//         picture the page names under its own /uploads/, in the order found.
//         The CLIENT parses (lib/church-site.js); this stays string slicing.
//   ?asset=/uploads/6/0/6/7/6067835/<name>.jpg
//       → the picture itself, so the app only ever talks to poetech.us.
//
// SSRF guard: ONE fixed host; a page only from the list; an asset only under
// that site's /uploads/ path with a picture extension. Every upstream call is
// bounded by a timeout. The Cache API holds a page an hour and a picture a
// day (the office posts monthly; a congregation of readers makes at most one
// upstream hit per page per hour). Nothing is written anywhere.
// =============================================================================

export const SITE_HOST = 'www.thechurchofthelivinggod.com';
export const PAGES = Object.freeze({
  home: '/',
  calendar: '/calendar.html',
  'current-events': '/current-events.html',
  'previous-events': '/previous-events.html',
  'letters-from-bg': '/letters-from-bg.html',
});
export const PAGE_TTL_S = 3600;
export const ASSET_TTL_S = 86400;
export const TIMEOUT_MS = 8000;
export const MAX_ASSET_BYTES = 12 * 1024 * 1024;
const UA = 'PoeTech-LoveCorner/1.0 (+https://poetech.us)';
const UPLOADS_RE = /\/uploads\/[0-9]\/[0-9]\/[0-9]\/[0-9]\/[0-9]+\/[A-Za-z0-9._\-/]+\.(?:jpe?g|png|gif|webp)(?:\?[0-9]*)?/gi;

const err = (obj, status) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

/** The upstream URL for a listed page, or null for anything else. */
export function pageUrl(page) {
  const path = PAGES[String(page || '')];
  return path ? `https://${SITE_HOST}${path}` : null;
}

/** The upstream URL for a picture under the site's own uploads, or null. */
export function assetUrl(asset) {
  const s = String(asset || '');
  if (s.length > 300 || !/^\/uploads\/[0-9]\/[0-9]\/[0-9]\/[0-9]\/[0-9]+\/[A-Za-z0-9._\-/]+\.(?:jpe?g|png|gif|webp)$/i.test(s)) return null;
  if (s.includes('..') || s.includes('//')) return null;
  return `https://${SITE_HOST}${s}`;
}

/**
 * The content region of a Weebly page: from its content div to its footer,
 * scripts and styles dropped. A page without the div is returned whole (a
 * redesign still reaches the client, which then finds what it can).
 */
export function contentRegion(html) {
  const s = String(html || '');
  const start = s.search(/<div[^>]+id="wsite-content"/i);
  let region = start >= 0 ? s.slice(start) : s;
  const end = region.search(/<div[^>]+(id="footer"|class="[^"]*(wsite-footer|footer-wrap)[^"]*")/i);
  if (end > 0) region = region.slice(0, end);
  return region
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .slice(0, 200000);
}

/** Every picture a page names under the site's own uploads, unique, in order; icons and the editor's logo left out. */
export function uploadPictures(html) {
  const out = [];
  const seen = new Set();
  for (const m of String(html || '').matchAll(UPLOADS_RE)) {
    const path = m[0].replace(/\?.*$/, '');
    if (/\/published\/icons8|\/editor\/|\/background-images\/|na-logo/i.test(path) || seen.has(path)) continue;
    seen.add(path);
    out.push(path);
  }
  return out;
}

async function cached(context, key, make, ttl) {
  const cache = caches.default;
  const req = new Request(key, { method: 'GET' });
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await make();
  if (res.status === 200) {
    const copy = new Response(res.clone().body, res);
    copy.headers.set('Cache-Control', `public, s-maxage=${ttl}, stale-while-revalidate=${ttl}`);
    context.waitUntil(cache.put(req, copy.clone()));
    return copy;
  }
  return res;
}

async function upstream(url, accept) {
  return fetch(url, { headers: { 'User-Agent': UA, accept }, signal: AbortSignal.timeout(TIMEOUT_MS) });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const page = url.searchParams.get('page');
  const asset = url.searchParams.get('asset');
  if (asset != null) {
    const target = assetUrl(asset);
    if (!target) return err({ error: 'bad-asset' }, 400);
    return cached(
      context,
      `${url.origin}/api/church-site?asset=${encodeURIComponent(asset)}`,
      async () => {
        let up;
        try {
          up = await upstream(target, 'image/*');
        } catch {
          return err({ error: 'site-unreachable' }, 502);
        }
        if (!up.ok) return err({ error: `site-${up.status}` }, 502);
        const type = up.headers.get('content-type') || '';
        const len = Number(up.headers.get('content-length') || 0);
        if (!/^image\//i.test(type) || len > MAX_ASSET_BYTES) return err({ error: 'not-a-picture' }, 502);
        return new Response(up.body, { status: 200, headers: { 'Content-Type': type, 'Cache-Control': `public, max-age=${ASSET_TTL_S}` } });
      },
      ASSET_TTL_S
    );
  }
  const target = pageUrl(page);
  if (!target) return err({ error: 'bad-page' }, 400);
  return cached(
    context,
    `${url.origin}/api/church-site?page=${encodeURIComponent(page)}`,
    async () => {
      let up;
      try {
        up = await upstream(target, 'text/html');
      } catch {
        return err({ error: 'site-unreachable' }, 502);
      }
      if (!up.ok) return err({ error: `site-${up.status}` }, 502);
      const html = await up.text();
      const body = { page, url: target, fetchedAt: new Date().toISOString(), html: contentRegion(html), images: uploadPictures(html) };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${PAGE_TTL_S}` },
      });
    },
    PAGE_TTL_S
  );
}
