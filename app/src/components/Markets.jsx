// Markets · Watchlist — extracted from monolith (r33) per MODULAR-EXTENSIBILITY.md.
// Stooq + corsproxy fetch unchanged. Per EDITABLE-EVERYWHERE.md: tickers are
// identifiers, not editable values; user adds/removes via the standard flow.
import React, { useState, useEffect } from 'react';

const fmtPct = (n) => n == null ? '—' : `${n.toFixed(1)}%`;

// Stooq quick-add suggestions — moved here from poe-financial-mvp-v28.jsx (r40);
// only consumer is this component. Stooq symbol format: 'aapl.us', 'btcusd', '^spx'.
const SUGGESTED_TICKERS = [
  { sym: 'spy.us',  label: 'S&P 500 ETF' },
  { sym: 'qqq.us',  label: 'Nasdaq 100 ETF' },
  { sym: 'dia.us',  label: 'Dow Jones ETF' },
  { sym: 'iwm.us',  label: 'Russell 2000 ETF' },
  { sym: 'vti.us',  label: 'Total US Market' },
  { sym: 'aapl.us', label: 'Apple' },
  { sym: 'msft.us', label: 'Microsoft' },
  { sym: 'nvda.us', label: 'Nvidia' },
  { sym: 'btcusd',  label: 'Bitcoin / USD' },
  { sym: 'ethusd',  label: 'Ethereum / USD' },
  { sym: 'eurusd',  label: 'EUR / USD' },
  { sym: '^spx',    label: 'S&P 500 Index' },
];

function Markets({ watchlist, addWatchlistSymbol, removeWatchlistSymbol, userTier, setView, maxWatchlist = Infinity }) {
  const atCap = watchlist.length >= maxWatchlist;
  const capLabel = isFinite(maxWatchlist) ? maxWatchlist : null;
  // No pre-population — show empty cells until the Stooq fetch resolves.
  const [quotes, setQuotes] = useState({}); // sym -> {date,time,open,high,low,close,volume,changePct,error}
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [globalError, setGlobalError] = useState('');

  // Round 13 fix — Stooq's CSV endpoint doesn't send CORS headers, so direct
  // browser fetches silently fail. Routes through corsproxy.io (free, no API
  // key, no signup, supports https). Falls back to a second public proxy if
  // the first one is down. If both fail, the user gets a clear error message.
  const fetchQuote = async (sym) => {
    const stooqUrl = `https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcv&h&e=csv`;
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(stooqUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(stooqUrl)}`,
    ];
    let lastErr = '';
    for (const url of proxies) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) { lastErr = `HTTP ${res.status}`; continue; }
        const text = await res.text();
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) { lastErr = 'empty response'; continue; }
        const cols = lines[1].split(',');
        // Stooq returns "N/D" for unknown symbols
        if (cols.includes('N/D') || cols[3] === 'N/D') return { error: 'symbol not found' };
        const [Symbol, Date_, Time_, Open, High, Low, Close, Volume] = cols;
        const open = parseFloat(Open), close = parseFloat(Close);
        if (!isFinite(open) || !isFinite(close)) { lastErr = 'unparseable response'; continue; }
        const changePct = open > 0 ? ((close - open) / open) * 100 : 0;
        return { sym: (Symbol || sym).toLowerCase(), date: Date_, time: Time_, open, high: parseFloat(High), low: parseFloat(Low), close, volume: parseFloat(Volume) || 0, changePct };
      } catch (e) {
        lastErr = e.message || 'network error';
      }
    }
    return { error: lastErr || 'network error' };
  };

  // Refresh all symbols in parallel.
  const refresh = async () => {
    if (!watchlist || watchlist.length === 0) { setQuotes({}); setLastUpdated(new Date()); return; }
    setLoading(true);
    setGlobalError('');
    const results = await Promise.all(watchlist.map(async s => [s, await fetchQuote(s)]));
    const next = {};
    let anySuccess = false;
    for (const [s, q] of results) { next[s] = q; if (!q.error) anySuccess = true; }
    setQuotes(next);
    setLastUpdated(new Date());
    setLoading(false);
    if (!anySuccess && watchlist.length > 0) {
      // Show the actual error from the first failed quote so user can diagnose.
      const firstError = results.find(([, q]) => q.error)?.[1]?.error || 'unknown';
      setGlobalError(`Couldn't reach the market data feed (${firstError}). The app routes Stooq quotes through a public CORS proxy (corsproxy.io → allorigins.win fallback). Common causes: (1) browser blocked by ad/script blocker, allow corsproxy.io; (2) the proxy is rate-limited — try Refresh in 30s; (3) offline. Watchlist still saves locally either way.`);
    }
  };

  // Initial fetch + auto-refresh every 60s. Re-runs when the watchlist changes.
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlist.join('|')]);

  const handleAdd = (e) => {
    e && e.preventDefault && e.preventDefault();
    const s = (input || '').trim().toLowerCase();
    if (!s) { setInputError('Enter a symbol — e.g., aapl.us, spy.us, btcusd.'); return; }
    if (!/^[a-z0-9.\-^]+$/.test(s)) { setInputError('Symbol can only contain letters, digits, dot, dash, or ^.'); return; }
    if (watchlist.includes(s)) { setInputError(`${s} is already on your watchlist.`); return; }
    if (atCap) { setInputError(`Foundation tier holds ${capLabel} tickers. Upgrade to PoeTech+ for unlimited.`); return; }
    setInputError('');
    addWatchlistSymbol(s);
    setInput('');
  };

  // Format helpers
  const fmtPrice = (v) => v == null || isNaN(v) ? '—' : v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  const fmtVol = (v) => !v ? '—' : v >= 1e9 ? `${(v/1e9).toFixed(2)}B` : v >= 1e6 ? `${(v/1e6).toFixed(2)}M` : v >= 1e3 ? `${(v/1e3).toFixed(1)}K` : `${v}`;
  const fmtPct = (p) => p == null || isNaN(p) ? '—' : `${p >= 0 ? '+' : ''}${p.toFixed(2)}%`;

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-medium">Markets · Watchlist</div>
        <h2 className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>One place for your financial data.</h2>
        <p className="text-sm leading-relaxed mt-2 text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          Add the tickers you actually watch — indices, ETFs, individual stocks, crypto, FX. Quotes refresh automatically every minute. Free data: <a href="https://stooq.com" target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">stooq.com</a> · routed through <a href="https://corsproxy.io" target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">corsproxy.io</a> (Stooq doesn't send browser CORS headers directly). No API key, no signup, no cost.
        </p>
      </section>

      {/* Add form */}
      <section aria-labelledby="add-ticker-h">
        <h3 id="add-ticker-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2 pb-2 border-b border-[#1A1815]">Add a ticker</h3>
        <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[160px]">
            <label htmlFor="ticker-input" className="text-[9px] uppercase tracking-wider text-[#5A5751]">Symbol (Stooq format)</label>
            <input
              id="ticker-input"
              list="ticker-suggestions"
              value={input}
              onChange={e => { setInput(e.target.value); setInputError(''); }}
              placeholder="e.g., aapl.us · btcusd · ^spx"
              className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
              aria-invalid={!!inputError}
              aria-describedby={inputError ? 'ticker-input-error' : undefined}
            />
            <datalist id="ticker-suggestions">
              {SUGGESTED_TICKERS.map(t => <option key={t.sym} value={t.sym}>{t.label}</option>)}
            </datalist>
          </div>
          <button type="submit" className="bg-[#1A1815] text-white py-2 px-4 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">+ Add</button>
        </form>
        {inputError && <p id="ticker-input-error" role="alert" className="text-xs text-[#B85838] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{inputError}</p>}
        <div className="mt-3">
          <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1">Quick add</div>
          <div className="flex flex-wrap gap-1">
            {SUGGESTED_TICKERS.filter(t => !watchlist.includes(t.sym)).map(t => (
              <button key={t.sym} type="button" onClick={() => addWatchlistSymbol(t.sym)} className="px-2 py-1 text-[10px] border border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
                <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{t.sym}</span> <span className="text-[#5A5751]">· {t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Watchlist */}
      <section aria-labelledby="watchlist-h">
        <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h3 id="watchlist-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Watchlist · {watchlist.length} {watchlist.length === 1 ? 'ticker' : 'tickers'}</h3>
          <div className="flex items-baseline gap-3 text-[10px] uppercase tracking-wider">
            {lastUpdated && <span className="text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }} aria-live="polite">updated {lastUpdated.toLocaleTimeString()}</span>}
            <button type="button" onClick={refresh} aria-busy={loading} className="text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" disabled={loading}>{loading ? 'Refreshing…' : '↻ Refresh'}</button>
          </div>
        </div>
        {globalError && (
          <div role="alert" className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 mb-2">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">⚠ Market data fetch failed</div>
            <p className="text-xs leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>{globalError}</p>
          </div>
        )}
        {watchlist.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No tickers on your watchlist yet. Use the Quick add buttons above to start.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#1A1815] overflow-x-auto" aria-live="polite">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[9px] uppercase tracking-wider text-[#5A5751] border-b border-[#1A1815] bg-[#FAF8F4]">
                  <th scope="col" className="p-3">Symbol</th>
                  <th scope="col" className="p-3 text-right">Last</th>
                  <th scope="col" className="p-3 text-right">Day change</th>
                  <th scope="col" className="p-3 text-right hidden sm:table-cell">Open</th>
                  <th scope="col" className="p-3 text-right hidden sm:table-cell">High</th>
                  <th scope="col" className="p-3 text-right hidden sm:table-cell">Low</th>
                  <th scope="col" className="p-3 text-right hidden md:table-cell">Volume</th>
                  <th scope="col" className="p-3 text-right hidden md:table-cell">As of</th>
                  <th scope="col" className="p-3 text-right"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((sym, i) => {
                  const q = quotes[sym] || {};
                  const isErr = !!q.error;
                  const hasData = !isErr && q.close !== undefined;
                  const up = hasData && q.changePct >= 0;
                  const directionText = hasData ? (q.changePct >= 0 ? 'up' : 'down') : '';
                  return (
                    <tr key={sym} className={`border-b border-[#E8E4DC] ${i % 2 === 1 ? 'bg-[#FAF8F4]' : ''}`} style={{ fontFamily: '"Fraunces", serif' }}>
                      <td className="p-3" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{sym.toUpperCase()}</td>
                      <td className="p-3 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{isErr ? '—' : fmtPrice(q.close)}</td>
                      <td className={`p-3 text-right ${isErr ? 'text-[#5A5751]' : up ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        {isErr ? (
                          <span title={q.error}>—</span>
                        ) : (
                          <>
                            <span aria-hidden="true">{up ? '▲ ' : '▼ '}</span>
                            <span className="sr-only">{directionText} </span>
                            {fmtPct(q.changePct)}
                          </>
                        )}
                      </td>
                      <td className="p-3 text-right hidden sm:table-cell" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{isErr ? '—' : fmtPrice(q.open)}</td>
                      <td className="p-3 text-right hidden sm:table-cell" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{isErr ? '—' : fmtPrice(q.high)}</td>
                      <td className="p-3 text-right hidden sm:table-cell" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{isErr ? '—' : fmtPrice(q.low)}</td>
                      <td className="p-3 text-right hidden md:table-cell text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{isErr ? '—' : fmtVol(q.volume)}</td>
                      <td className="p-3 text-right hidden md:table-cell text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{isErr ? <span title={q.error}>error</span> : `${q.date || ''} ${q.time || ''}`}</td>
                      <td className="p-3 text-right">
                        <button type="button" onClick={() => removeWatchlistSymbol(sym)} aria-label={`Remove ${sym.toUpperCase()} from watchlist`} className="text-base text-[#5A5751] hover:text-[#B85838] hover:bg-white border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Day change is computed from open vs. last (intraday). Quotes are delayed by the data source and meant for awareness — not for executing trades. The change column shows direction in text (up / down) and symbol (▲ / ▼) in addition to color, so the meaning carries through for screen readers and color-blind users (WCAG 2.1 AA).
        </p>
      </section>
    </div>
  );
}

export default Markets;
export { Markets };
