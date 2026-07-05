// =============================================================================
// /api/market-quote — first-party Stooq quote relay for the Markets watchlist
// =============================================================================
// 2026-07-05 live-test finding (Darrell, phone + laptop): every ticker quoted
// as dashes on BOTH devices — the public CORS proxies (corsproxy.io →
// allorigins.win) the tab depended on were down/blocking, and Stooq itself
// sends no browser CORS headers. Two devices on two networks failing together
// is a dependency problem, not a device problem — so the dependency goes away:
// this same-origin function fetches the Stooq CSV server-side and hands it to
// the app from poetech.us itself. No third-party proxy in the path, no API
// key, no CORS. The client keeps the public proxies only as a fallback (and
// for local dev, where Vercel functions don't run).
//
// COST/RATE DISCIPLINE: the edge cache holds each symbol ~55s — aligned with
// the tab's 60s refresh — so the whole family generates at most ~1 Stooq hit
// per symbol per minute regardless of how many devices are watching.
export default async function handler(req, res) {
  const sym = String((req.query && req.query.s) || '').trim().toLowerCase();
  // Same symbol grammar the Markets add-form enforces; hard length cap.
  if (!sym || sym.length > 20 || !/^[a-z0-9.\-^]+$/.test(sym)) {
    return res.status(400).json({ error: 'bad-symbol' });
  }
  const stooqUrl = `https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcv&h&e=csv`;
  try {
    const upstream = await fetch(stooqUrl, {
      headers: { 'User-Agent': 'PoeTech-FamilyOS/1.0 (+https://poetech.us)' },
    });
    if (!upstream.ok) return res.status(502).json({ error: `stooq-${upstream.status}` });
    const csv = await upstream.text();
    res.setHeader('Cache-Control', 's-maxage=55, stale-while-revalidate=120');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    return res.status(200).send(csv);
  } catch {
    return res.status(502).json({ error: 'stooq-unreachable' });
  }
}
