// =============================================================================
// Cloudflare Pages Function — /api/market-quote (Stooq relay for the watchlist)
// =============================================================================
// PORT OF app/api/market-quote.js (the Vercel function). The 2026-07-05
// Cloudflare cutover moved production off Vercel, and Vercel functions do not
// deploy to Pages — without this port every ticker on the Markets watchlist
// quoted as dashes again (the exact failure the relay was built to fix that
// same morning). The contract is identical: GET /api/market-quote?s=SYMBOL
// returns the raw Stooq CSV same-origin, no third-party CORS proxy in the path.
//
// COST/RATE DISCIPLINE, CF EDITION: Vercel honored s-maxage at its edge
// automatically; Pages Functions do not, so this uses the Cache API explicitly.
// Each symbol is held ~55s — aligned with the tab's 60s refresh — so the whole
// family still generates at most ~1 Stooq hit per symbol per minute.

const json = (obj, status) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const sym = String(url.searchParams.get('s') || '').trim().toLowerCase();
  // Same symbol grammar the Markets add-form enforces; hard length cap.
  if (!sym || sym.length > 20 || !/^[a-z0-9.\-^]+$/.test(sym)) {
    return json({ error: 'bad-symbol' }, 400);
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const stooqUrl = `https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcv&h&e=csv`;
  let upstream;
  try {
    upstream = await fetch(stooqUrl, {
      headers: { 'User-Agent': 'PoeTech-FamilyOS/1.0 (+https://poetech.us)' },
    });
  } catch {
    return json({ error: 'stooq-unreachable' }, 502);
  }
  if (!upstream.ok) return json({ error: `stooq-${upstream.status}` }, 502);

  const csv = await upstream.text();
  const resp = new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'public, s-maxage=55, stale-while-revalidate=120',
    },
  });
  context.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}
