// =============================================================================
// Imported — Books → Imported subview
// =============================================================================
// DETERMINISTIC, no n8n. Reads the app's already-synced verified ledger
// (data.transactions + data.accounts) straight from the DB — the same source
// Books → Tx and the derived balances use. Repointed 2026-07-01: the verified
// bank ledger became the source of truth (the Option-A load), so this surface
// no longer calls n8n workflow 18 / the Tailscale Funnel. It cannot throw
// "could not reach workflow 18" because it makes no network call at all — if the
// ledger has not synced yet it simply shows an honest empty state.
//
// The recurring refresh of the underlying ledger is a plain Python job on the
// NAS (infra/nas-finance-ingest/) that writes to the DB — no n8n, no login.
//
// 2026-07-01 (view controls): at 1,161+ rows the flat, oldest-first, 1,000-row
// slice buried the newest 2026 transactions and offered no way to see a single
// week or month. buildImportedView still shapes the ledger + the honest 30-day
// summary (unchanged, pinned by imported-client-filters.test.js); the display
// now runs those rows through lib/imported-view.js — newest-first by default
// (toggle to oldest), bounded to a chosen window (This week / This month /
// Last 30 / Last 90 / All / custom range), and grouped into collapsible months
// that carry their own in/out/net totals. Only open months render rows, so the
// DOM stays light without truncating the feed. Pinned by imported-view.test.js.
// =============================================================================

import React, { useMemo, useState } from 'react';
import { sortByDate, effectiveRange, filterByRange, groupByMonth, totals } from '../lib/imported-view.js';

function formatAmount(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? '-' : ''}$${abs}`;
}

function formatDate(s) {
  if (!s) return '—';
  const d = new Date(s.length === 10 ? s + 'T00:00:00' : s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

const fmtMoney = (n) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n || 0)).toLocaleString();

// Time-window presets for the imported feed (Darrell 2026-07-01: "see a week or
// a month at a time" instead of one endless oldest-first scroll).
const PERIOD_PRESETS = [
  ['month', 'This month'],
  ['week', 'This week'],
  ['30d', 'Last 30'],
  ['90d', 'Last 90'],
  ['all', 'All'],
];

// PII gate — mirrors importedAllowed in poe-financial-mvp-v28.jsx. The rows here
// are the signed-in family's own RLS-scoped ledger, but we keep the conservative
// public-host guard so a shared/public browser never renders real bank rows.
function isPublicHostBrowser() {
  try {
    if (typeof window === 'undefined') return true;
    const host = window.location.hostname || '';
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return false;
    if (host.startsWith('100.')) return false;
    if (host.endsWith('.ts.net')) return false;
    if (host.endsWith('.local')) return false;
    if (/^192\.168\./.test(host)) return false;
    if (/^10\./.test(host)) return false;
    return true;
  } catch {
    return true;
  }
}

function hasOwnerSession() {
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!key) return false;
    const tok = JSON.parse(localStorage.getItem(key));
    const session = (tok && tok.currentSession) || tok;
    if (!session || !session.access_token) return false;
    if (typeof session.expires_at === 'number' && session.expires_at * 1000 <= Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

function isImportedViewAuthorized() {
  try {
    if (typeof window === 'undefined') return false;
    if (new URLSearchParams(window.location.search).has('demo')) return false;
    if (!localStorage.getItem('poe-current-profile')) return false;
    if (isPublicHostBrowser() && !hasOwnerSession()) return false;
    return true;
  } catch {
    return false;
  }
}

// Pure: shape the synced ledger into imported-view rows + a deterministic summary.
export function buildImportedView(data, filters, nowMs) {
  const accounts = Array.isArray(data?.accounts) ? data.accounts : [];
  const txns = Array.isArray(data?.transactions) ? data.transactions : [];
  const acctName = (id) => (accounts.find(a => a.id === id) || {}).name || id || '—';

  const rows = txns.map(t => ({
    id: t.id,
    posted: t.date,
    institution: acctName(t.accountId),
    name: t.description || '—',
    category: t.category || null,
    amount: typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0,
  }));

  const institutions = [...new Set(rows.map(r => r.institution).filter(Boolean))].sort();

  const q = (filters.search || '').trim().toLowerCase();
  const filtered = rows.filter(r => {
    if (filters.institution && r.institution !== filters.institution) return false;
    if (filters.since && String(r.posted || '') < filters.since) return false;
    if (q) {
      const hay = [r.name, r.category, r.institution].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Deterministic 30-day in/out over the ledger (honest, from posted rows).
  const cutoff = (nowMs || Date.now()) - 30 * 86400_000;
  let recentIn = 0, recentOut = 0, recentCount = 0;
  for (const r of rows) {
    const at = Date.parse(r.posted);
    if (Number.isNaN(at) || at < cutoff) continue;
    recentCount += 1;
    if (r.amount < 0) recentOut += Math.abs(r.amount); else recentIn += r.amount;
  }

  const dates = rows.map(r => r.posted).filter(Boolean).sort();
  return {
    rows, filtered, institutions,
    total: rows.length,
    accountCount: institutions.length,
    recentIn, recentOut, recentCount,
    firstDate: dates[0] || null,
    lastDate: dates[dates.length - 1] || null,
  };
}

export default function Imported({ data = {} }) {
  const [filters, setFilters] = useState({ institution: '', search: '' });
  // View controls (all client-side over the already-synced ledger). Default:
  // newest-first, all periods, so 2026 lands on top immediately.
  const [sortDir, setSortDir] = useState('desc');
  const [period, setPeriod] = useState('all');
  const [range, setRange] = useState({ from: '', to: '' }); // custom date-range picker
  const [expandedMonths, setExpandedMonths] = useState(null); // null = auto (newest month only)

  const view = useMemo(() => buildImportedView(data, filters, Date.now()), [data, filters]);

  // Window + sort + month grouping over the (institution/search) filtered rows.
  // Pinned by imported-view.test.js — every number here is summed from the rows
  // it groups, never painted (DR-0076).
  const grouped = useMemo(() => {
    const { sinceMs, untilMs } = effectiveRange(period, range.from, range.to, Date.now());
    const windowed = filterByRange(view.filtered, sinceMs, untilMs);
    const sorted = sortByDate(windowed, sortDir);
    return { groups: groupByMonth(sorted), windowTotals: totals(windowed), matched: windowed.length };
  }, [view.filtered, period, range.from, range.to, sortDir]);

  // Which months are open. Auto default = only the newest (first) group so the
  // DOM stays light at 1,161+ rows; explicit toggles override via the Set.
  const openMonths = useMemo(() => {
    if (expandedMonths) return expandedMonths;
    return new Set(grouped.groups.slice(0, 1).map(g => g.key));
  }, [expandedMonths, grouped.groups]);
  const toggleMonth = (key) => {
    setExpandedMonths(prev => {
      const base = prev || new Set(grouped.groups.slice(0, 1).map(g => g.key));
      const next = new Set(base);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };
  const allOpen = grouped.groups.length > 0 && grouped.groups.every(g => openMonths.has(g.key));
  const setAllMonths = (open) => setExpandedMonths(open ? new Set(grouped.groups.map(g => g.key)) : new Set());
  const periodLabel = (range.from || range.to)
    ? 'range'
    : (PERIOD_PRESETS.find(([k]) => k === period)?.[1] || 'All');

  if (!isImportedViewAuthorized()) {
    return (
      <div className="text-[0.75rem] text-[#5A5751] p-4">
        Imported transactions are private to each family and shown only when you are signed in with your own data loaded.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontSize: '1.5rem', fontWeight: 600 }}>
          Imported transactions
        </h2>
        <p className="text-[0.75rem] text-[#5A5751] mt-1">
          Read-only view of the bank data imported into your ledger. Source: your synced app database (the verified upload) — refreshed by a deterministic Python job on the NAS. No n8n.
        </p>
      </div>

      {view.total === 0 ? (
        <div className="border border-[#E8E4DC] bg-white p-6 text-center">
          <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            No imported transactions have synced to this device yet. Upload statements in the <strong>Tx</strong> tab, or wait for the ledger to sync — this view fills in automatically. It never depends on any workflow being reachable.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Transactions</div>
              <div className="text-lg font-medium">{view.total.toLocaleString()}</div>
            </div>
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Accounts</div>
              <div className="text-lg font-medium">{view.accountCount.toLocaleString()}</div>
            </div>
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D]">In · 30d</div>
              <div className="text-lg font-medium" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmtMoney(view.recentIn)}</div>
            </div>
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#B85838]">Out · 30d</div>
              <div className="text-lg font-medium" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmtMoney(view.recentOut)}</div>
            </div>
          </div>

          {/* Account + search filters (unchanged surface). */}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filters.institution}
              onChange={e => setFilters(f => ({ ...f, institution: e.target.value }))}
              className="border border-[#1A1815] px-2 py-1 text-xs bg-white"
              aria-label="Filter by account"
            >
              <option value="">All accounts</option>
              {view.institutions.map(inst => <option key={inst} value={inst}>{inst}</option>)}
            </select>
            <input
              type="search"
              placeholder="Search payee / category…"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="border border-[#1A1815] px-2 py-1 text-xs bg-white flex-1 min-w-[11.25rem]"
              aria-label="Search transactions"
            />
          </div>

          {/* Time window + sort — the fix for "2026 isn't showing as latest" and
              "no way to see a week or a month at a time". */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="inline-flex flex-wrap gap-1" role="group" aria-label="Time window">
              {PERIOD_PRESETS.map(([key, label]) => {
                const active = period === key && !range.from && !range.to;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setPeriod(key); setRange({ from: '', to: '' }); setExpandedMonths(null); }}
                    aria-pressed={active}
                    className={`px-2.5 py-1 text-[0.625rem] uppercase tracking-wider border ${active ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="inline-flex items-center gap-1 text-[0.625rem] text-[#5A5751]">
              <label className="uppercase tracking-wider">From</label>
              <input
                type="date"
                value={range.from}
                onChange={e => { setRange(r => ({ ...r, from: e.target.value })); setExpandedMonths(null); }}
                className="border border-[#1A1815] px-2 py-1 text-xs bg-white"
                aria-label="Custom range from"
              />
              <label className="uppercase tracking-wider">To</label>
              <input
                type="date"
                value={range.to}
                onChange={e => { setRange(r => ({ ...r, to: e.target.value })); setExpandedMonths(null); }}
                className="border border-[#1A1815] px-2 py-1 text-xs bg-white"
                aria-label="Custom range to"
              />
              {(range.from || range.to) && (
                <button
                  type="button"
                  onClick={() => setRange({ from: '', to: '' })}
                  className="px-2 py-1 text-[0.625rem] uppercase tracking-wider border border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]"
                >
                  Clear
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))}
              className="px-2.5 py-1 text-[0.625rem] uppercase tracking-wider border border-[#1A1815] bg-white text-[#1A1815] hover:bg-[#FAF8F4]"
              aria-label="Toggle date sort order"
              title={sortDir === 'desc' ? 'Newest first (tap for oldest first)' : 'Oldest first (tap for newest first)'}
            >
              {sortDir === 'desc' ? '↓ Newest first' : '↑ Oldest first'}
            </button>
          </div>

          {/* Selected-window totals — summed directly from the rows shown below,
              so the figure always ties to the list (never painted). */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">In · {periodLabel}</div>
              <div className="text-base font-medium" style={{ color: '#166534', fontFamily: '"JetBrains Mono", monospace' }}>{fmtMoney(grouped.windowTotals.in)}</div>
            </div>
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Out · {periodLabel}</div>
              <div className="text-base font-medium" style={{ color: '#B85838', fontFamily: '"JetBrains Mono", monospace' }}>{fmtMoney(grouped.windowTotals.out)}</div>
            </div>
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Net · {periodLabel}</div>
              <div className="text-base font-medium" style={{ color: grouped.windowTotals.net < 0 ? '#B85838' : '#166534', fontFamily: '"JetBrains Mono", monospace' }}>{fmtMoney(grouped.windowTotals.net)}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[0.625rem] text-[#5A5751]">
            <div>
              Showing {grouped.matched.toLocaleString()} of {view.total.toLocaleString()} transactions
              {view.firstDate ? ` · ledger spans ${formatDate(view.firstDate)} – ${formatDate(view.lastDate)}` : ''}
            </div>
            {grouped.groups.length > 1 && (
              <button
                type="button"
                onClick={() => setAllMonths(!allOpen)}
                className="px-2 py-1 uppercase tracking-wider border border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]"
              >
                {allOpen ? 'Collapse all months' : 'Expand all months'}
              </button>
            )}
          </div>

          {/* Month-grouped, collapsible list. Only open months render rows, so the
              DOM stays light at 1,161+ rows; each header carries the month's real
              in/out/net totals. */}
          {grouped.matched === 0 ? (
            <div className="border border-[#E8E4DC] bg-white px-2 py-6 text-center text-[0.75rem] text-[#5A5751]">
              No transactions in this window. Try a wider period (e.g. “All”) or clear the search.
            </div>
          ) : (
            <div className="space-y-2">
              {grouped.groups.map(g => {
                const open = openMonths.has(g.key);
                return (
                  <div key={g.key} className="border border-[#E8E4DC] bg-white">
                    <button
                      type="button"
                      onClick={() => toggleMonth(g.key)}
                      aria-expanded={open}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#FAF8F4] hover:bg-white text-left"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[#5A5751] text-xs">{open ? '▾' : '▸'}</span>
                        <span className="text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{g.label}</span>
                        <span className="text-[0.625rem] text-[#5A5751]">{g.totals.count.toLocaleString()} tx</span>
                      </span>
                      <span className="flex items-center gap-3 text-[0.6875rem]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        <span style={{ color: '#166534' }}>in {fmtMoney(g.totals.in)}</span>
                        <span style={{ color: '#B85838' }}>out {fmtMoney(g.totals.out)}</span>
                        <span style={{ color: g.totals.net < 0 ? '#B85838' : '#166534' }}>net {fmtMoney(g.totals.net)}</span>
                      </span>
                    </button>
                    {open && (
                      <div className="overflow-x-auto border-t border-[#E8E4DC]">
                        <table className="w-full text-xs">
                          <thead className="bg-white text-[#5A5751] uppercase tracking-wider text-[0.625rem]">
                            <tr>
                              <th className="text-left px-2 py-2">Date</th>
                              <th className="text-left px-2 py-2">Account</th>
                              <th className="text-left px-2 py-2">Payee / Description</th>
                              <th className="text-left px-2 py-2">Category</th>
                              <th className="text-right px-2 py-2">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.rows.map(t => (
                              <tr key={t.id} className="border-t border-[#E8E4DC] hover:bg-[#FAF8F4]">
                                <td className="px-2 py-1.5 whitespace-nowrap">{formatDate(t.posted)}</td>
                                <td className="px-2 py-1.5 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{t.institution}</td>
                                <td className="px-2 py-1.5 truncate max-w-[16.25rem]" title={t.name}>{t.name}</td>
                                <td className="px-2 py-1.5 text-[#5A5751] capitalize">{t.category || '—'}</td>
                                <td className="px-2 py-1.5 text-right font-mono" style={{ color: t.amount < 0 ? '#B85838' : '#16A34A' }}>{formatAmount(t.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
