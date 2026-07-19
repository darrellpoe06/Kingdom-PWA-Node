// =============================================================================
// Cloudflare Pages Function — /api/church-recent (channel RSS relay for Live Worship)
// =============================================================================
// The Church tab shows the last few livestreams DIRECTLY from the channel, so they
// are always current even when the curated sermon library hasn't imported them yet
// (Darrell 2026-07-19). The source is YouTube's NO-API-KEY public feed
// https://www.youtube.com/feeds/videos.xml?channel_id=UC… — but a browser cannot
// read it cross-site (no CORS), so this same-origin proxy fetches it server-side
// and returns the raw XML. The CLIENT parses it (lib/youtube-feed.js) — this stays a
// THIN proxy (fetch + return), the same proven shape as /api/market-quote, so it
// carries no parsing that could affect the Pages build.
//
// COST/RATE DISCIPLINE (CF edition, per market-quote): Pages Functions don't honor
// s-maxage automatically, so the Cache API holds each channel's feed ~10 minutes —
// livestream lists change at most a few times a week, so this is generous and the
// whole family generates at most ~1 YouTube feed hit per channel per 10 minutes.

const err = (obj, status) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

// Standard YouTube channel id: `UC` + 22 url-safe base64 chars. We ONLY proxy a
// well-formed channel id — never an arbitrary attacker-supplied URL (SSRF guard).
const CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const channel = String(url.searchParams.get('channel') || '').trim();
  if (!CHANNEL_ID_RE.test(channel)) return err({ error: 'bad-channel' }, 400);

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channel)}`;
  let upstream;
  try {
    upstream = await fetch(feedUrl, {
      headers: { 'User-Agent': 'PoeTech-FamilyOS/1.0 (+https://poetech.us)' },
    });
  } catch {
    return err({ error: 'youtube-unreachable' }, 502);
  }
  if (!upstream.ok) return err({ error: `youtube-${upstream.status}` }, 502);

  const xml = await upstream.text();
  const resp = new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
    },
  });
  context.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}
