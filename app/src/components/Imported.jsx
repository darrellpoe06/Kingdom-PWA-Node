// =============================================================================
// Imported — Books → Imported subview
// =============================================================================
// DETERMINISTIC, no n8n. Reads the app's already-synced verified ledger
// (data.transactions + data.accounts) straight from the DB — the same source
// Books → Tx and the derived balances use. Repointed 2026-07-01: the verified
// bank ledger became the source of truth (the Option-A load), so this surface
// no longer calls n8n workflow 18 / the Tailscale Funnel. It makes no network
// call at all — if the ledger has not synced yet it shows an honest empty state.
//
// The recurring refresh of the underlying ledger is a plain Python job on the
// NAS (infra/nas-finance-ingest/) that writes to the DB — no n8n, no login.
//
// 2026-07-01 (bank conventions): modeled on the patterns people already know
// from their bank app / Mint / YNAB / Chase, so a normal consumer instantly
// knows how to find last week or last month — no new pattern to learn:
//   · newest-first, grouped under STICKY month headers, each header showing that
//     month's in / out / net (a bank statement's section subtotals);
//   · a familiar segmented period control — This Month / Last Month / This Week /
//     30D / 90D / All / Custom — plus a ‹ month › quick-jump stepper;
//   · recognizable, tappable account + category filter chips and a search box;
//   · a running-balance column when a single account is in view (the statement
//     Balance column), anchored to that account's real opening balance;
//   · money-app color language: green in, red out.
// buildImportedView still shapes the ledger + the honest 30-day summary
// (pinned by imported-client-filters.test.js); the window / sort / grouping /
// running-balance math is the pure lib/imported-view.js (pinned by
// imported-view.test.js). A render smoke test (imported-render.test.jsx) mounts
// the real component and proves 2026 lands on top.
// =============================================================================

import React, { useMemo, useState } from 'react';
import {
  sortByDate, sortRows, effectiveRange, periodRange, filterByRange, groupByMonth, groupByField, totals,
  monthKeyOf, isMonthKey, monthRange, monthLabelOf, shiftMonthKey, runningBalances, periodLabel,
} from '../lib/imported-view.js';

// How the register is grouped: by month (the statement default) or rolled up by a
// field so repeated payees/categories/accounts show a combined subtotal.
const GROUP_MODES = [
  ['month', 'Month'],
  ['payee', 'Payee'],
  ['category', 'Category'],
  ['account', 'Account'],
];

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

// Familiar segmented period control (the standard set a budgeting app offers).
const PERIOD_SEGMENTS = [
  ['month', 'This Month'],
  ['lastMonth', 'Last Month'],
  ['week', 'This Week'],
  ['30d', '30D'],
  ['90d', '90D'],
  ['all', 'All'],
  ['custom', 'Custom'],
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
    accountId: t.accountId ?? null,
    institution: acctName(t.accountId),
    name: t.description || '—',
    category: t.category || null,
    amount: typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0,
    pending: t.pending === true || t.status === 'pending',
  }));

  const institutions = [...new Set(rows.map(r => r.institution).filter(Boolean))].sort();
  const categories = [...new Set(rows.map(r => r.category).filter(Boolean))].sort();

  const q = (filters.search || '').trim().toLowerCase();
  const filtered = rows.filter(r => {
    if (filters.institution && r.institution !== filters.institution) return false;
    if (filters.category && (r.category || '') !== filters.category) return false;
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
    rows, filtered, institutions, categories,
    total: rows.length,
    accountCount: institutions.length,
    recentIn, recentOut, recentCount,
    firstDate: dates[0] || null,
    lastDate: dates[dates.length - 1] || null,
  };
}

export default function Imported({ data = {} }) {
  const [filters, setFilters] = useState({ institution: '', category: '', search: '' });
  // View controls. period === null means "auto" (open on the newest month that
  // has data — the Mint pattern of landing on the latest activity). Any explicit
  // pick (segment or month-jump) sticks. sortDir defaults newest-first.
  const [period, setPeriod] = useState(null);
  const [range, setRange] = useState({ from: '', to: '' }); // custom range picker
  const [sortDir, setSortDir] = useState('desc');
  // Which column the table sorts by (date / account / payee / category / amount).
  // Clicking a column header sets it; clicking the active column flips direction.
  const [sortKey, setSortKey] = useState('date');
  const toggleSort = (key) => {
    if (key === sortKey) { setSortDir((d) => (d === 'desc' ? 'asc' : 'desc')); }
    else { setSortKey(key); setSortDir(key === 'date' || key === 'amount' ? 'desc' : 'asc'); }
  };
  const sortArrow = (key) => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '');
  // Which row is expanded to its detail drawer (receipt + full metadata).
  const [expandedId, setExpandedId] = useState(null);
  // How the register is grouped, and which group headers are collapsed.
  const [groupMode, setGroupMode] = useState('month');
  const [collapsed, setCollapsed] = useState(() => new Set());
  const toggleGroup = (key) => setCollapsed((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const accounts = Array.isArray(data?.accounts) ? data.accounts : [];
  const view = useMemo(() => buildImportedView(data, filters, Date.now()), [data, filters]);

  // Auto default: the month of the newest transaction (or All if none). Keeps the
  // surface opening on real, newest data instead of an empty current month.
  const autoPeriod = view.lastDate ? monthKeyOf(Date.parse(view.lastDate + 'T00:00:00')) : 'all';
  const activePeriod = period ?? autoPeriod;
  // Month shown by the ‹ month › stepper: the active month, else a sensible base.
  const stepperMonth = isMonthKey(activePeriod)
    ? activePeriod
    : (isMonthKey(autoPeriod) ? autoPeriod : monthKeyOf(Date.now()));

  // Resolve the active period to a concrete window.
  const { sinceMs, untilMs } = useMemo(() => {
    if (isMonthKey(activePeriod)) return monthRange(activePeriod);
    if (activePeriod === 'custom') return effectiveRange('all', range.from, range.to, Date.now());
    return periodRange(activePeriod, Date.now());
  }, [activePeriod, range.from, range.to]);

  // Window -> group -> sort. Every number here is summed from the rows it groups,
  // so each group's subtotal (in/out/net) always ties out to the overall period
  // total shown up top. By Month: newest-first statement sections. By a field
  // (Payee/Category/Account): repeated payees roll up into ONE group with a
  // combined subtotal, biggest-first, itemized rows still under each.
  const grouped = useMemo(() => {
    const windowed = filterByRange(view.filtered, sinceMs, untilMs);
    let groups;
    if (groupMode === 'month') {
      groups = groupByMonth(sortByDate(windowed, 'desc'));
    } else {
      const getKey = groupMode === 'payee' ? (r) => r.name
        : groupMode === 'account' ? (r) => r.institution
          : (r) => r.category;
      groups = groupByField(windowed, getKey, { labelFn: (k) => k || '—' });
    }
    // Rows within each group sort by the active column (date/account/payee/…).
    groups = groups.map((g) => ({ ...g, rows: sortRows(g.rows, sortKey, sortDir) }));
    return { groups, windowTotals: totals(windowed), matched: windowed.length };
  }, [view.filtered, sinceMs, untilMs, sortKey, sortDir, groupMode]);

  // Running-balance column — only when a single account is in view AND it carries
  // a real opening balance to anchor to (truthful-or-absent). Computed over the
  // account's FULL ledger so balances stay correct inside any narrowed window.
  const singleAcct = filters.institution ? accounts.find(a => a.name === filters.institution) : null;
  const balByRow = useMemo(() => {
    if (!singleAcct) return null;
    const opening = singleAcct.openingBalance ?? singleAcct.balance;
    if (opening == null || Number.isNaN(Number(opening))) return null;
    const acctRows = view.rows.filter(r => r.accountId === singleAcct.id);
    return runningBalances(acctRows, Number(opening));
  }, [singleAcct, view.rows]);
  const showBalance = !!balByRow;

  const chipCls = (active) => `px-2.5 py-1 text-[0.6875rem] rounded-full border whitespace-nowrap ${active ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`;

  if (!isImportedViewAuthorized()) {
    return (
      <div className="text-[0.75rem] text-[#5A5751] p-4">
        Imported transactions are private to each family and shown only when you are signed in with your own data loaded.
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
          {/* Account overview (unchanged): totals + honest rolling-30-day in/out. */}
          {/* Tiles reflect the SELECTED WINDOW (grouped.windowTotals), not a fixed
              30-day snapshot — so In/Out/Net move as you change month/period. The
              old fixed "· 30d" tiles read the same static number on every month. */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Transactions</div>
              <div className="text-lg font-medium">{grouped.matched.toLocaleString()}</div>
              <div className="text-[0.5625rem] text-[#5A5751]">of {view.total.toLocaleString()} total</div>
            </div>
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D]">In · {periodLabel(activePeriod)}</div>
              <div className="text-lg font-medium" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmtMoney(grouped.windowTotals.in)}</div>
            </div>
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#B85838]">Out · {periodLabel(activePeriod)}</div>
              <div className="text-lg font-medium" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmtMoney(grouped.windowTotals.out)}</div>
            </div>
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Net · {periodLabel(activePeriod)}</div>
              <div className="text-lg font-medium" style={{ fontFamily: '"JetBrains Mono", monospace', color: grouped.windowTotals.net < 0 ? '#B85838' : '#166534' }}>{fmtMoney(grouped.windowTotals.net)}</div>
            </div>
          </div>

          {/* Segmented period control + ‹ month › quick-jump — the standard bank /
              budgeting-app time picker. */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap rounded-md border border-[#E8E4DC] overflow-hidden" role="group" aria-label="Time period">
              {PERIOD_SEGMENTS.map(([key, label], i) => {
                const active = activePeriod === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setPeriod(key); }}
                    aria-pressed={active}
                    className={`px-3 py-1 text-[0.6875rem] uppercase tracking-wider ${i > 0 ? 'border-l border-[#E8E4DC]' : ''} ${active ? 'bg-[#1A1815] text-white' : 'bg-white text-[#5A5751] hover:bg-[#FAF8F4]'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="inline-flex items-center rounded-md border border-[#E8E4DC] bg-white">
              <button type="button" aria-label="Previous month" onClick={() => setPeriod(shiftMonthKey(stepperMonth, -1))} className="px-2 py-1 text-[#5A5751] hover:bg-[#FAF8F4]">‹</button>
              <button type="button" onClick={() => setPeriod(stepperMonth)} aria-pressed={isMonthKey(activePeriod)} className={`px-2 py-1 text-[0.6875rem] min-w-[6.5rem] text-center ${isMonthKey(activePeriod) ? 'text-[#1A1815] font-medium' : 'text-[#5A5751]'}`} style={{ fontFamily: '"Fraunces", serif' }}>{monthLabelOf(stepperMonth)}</button>
              <button type="button" aria-label="Next month" onClick={() => setPeriod(shiftMonthKey(stepperMonth, 1))} className="px-2 py-1 text-[#5A5751] hover:bg-[#FAF8F4]">›</button>
            </div>
            <button
              type="button"
              onClick={() => setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))}
              className="px-2.5 py-1 text-[0.6875rem] uppercase tracking-wider border border-[#E8E4DC] bg-white text-[#1A1815] hover:bg-[#FAF8F4] rounded-md"
              aria-label="Toggle date sort order"
              title={sortDir === 'desc' ? 'Newest first (tap for oldest first)' : 'Oldest first (tap for newest first)'}
            >
              {sortDir === 'desc' ? '↓ Newest' : '↑ Oldest'}
            </button>
          </div>

          {/* Custom range — revealed only when the Custom segment is chosen. */}
          {activePeriod === 'custom' && (
            <div className="flex flex-wrap items-center gap-1 text-[0.625rem] text-[#5A5751]">
              <label className="uppercase tracking-wider">From</label>
              <input type="date" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} className="border border-[#1A1815] px-2 py-1 text-xs bg-white" aria-label="Custom range from" />
              <label className="uppercase tracking-wider">To</label>
              <input type="date" value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} className="border border-[#1A1815] px-2 py-1 text-xs bg-white" aria-label="Custom range to" />
              {(range.from || range.to) && (
                <button type="button" onClick={() => setRange({ from: '', to: '' })} className="px-2 py-1 uppercase tracking-wider border border-[#E8E4DC] hover:border-[#1A1815]">Clear</button>
              )}
            </div>
          )}

          {/* Account filter chips (tappable). */}
          {view.institutions.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter by account">
              <button type="button" onClick={() => setFilters(f => ({ ...f, institution: '' }))} className={chipCls(!filters.institution)}>All accounts</button>
              {view.institutions.map(inst => (
                <button key={inst} type="button" onClick={() => setFilters(f => ({ ...f, institution: inst }))} className={chipCls(filters.institution === inst)}>{inst}</button>
              ))}
            </div>
          )}

          {/* Category filter chips (tappable, horizontally scrollable). */}
          {view.categories.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter by category">
              <button type="button" onClick={() => setFilters(f => ({ ...f, category: '' }))} className={chipCls(!filters.category)}>All categories</button>
              {view.categories.map(cat => (
                <button key={cat} type="button" onClick={() => setFilters(f => ({ ...f, category: cat }))} className={`${chipCls(filters.category === cat)} capitalize`}>{cat}</button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="search"
              placeholder="Search payee / category…"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="border border-[#1A1815] px-2 py-1 text-xs bg-white flex-1 min-w-[11.25rem]"
              aria-label="Search transactions"
            />
          </div>

          {/* Group by — Month (statement sections) or roll up repeated
              payees/categories/accounts into ONE subtotaled group. */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Group by</span>
            <div className="inline-flex rounded-md border border-[#E8E4DC] overflow-hidden" role="group" aria-label="Group transactions by">
              {GROUP_MODES.map(([key, label], i) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setGroupMode(key); setCollapsed(new Set()); }}
                  aria-pressed={groupMode === key}
                  className={`px-3 py-1 text-[0.6875rem] uppercase tracking-wider ${i > 0 ? 'border-l border-[#E8E4DC]' : ''} ${groupMode === key ? 'bg-[#1A1815] text-white' : 'bg-white text-[#5A5751] hover:bg-[#FAF8F4]'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[0.625rem] text-[#5A5751]">
            Showing {grouped.matched.toLocaleString()} of {view.total.toLocaleString()} transactions
            {' · '}<span style={{ color: '#166534' }}>in {fmtMoney(grouped.windowTotals.in)}</span>
            {' · '}<span style={{ color: '#B85838' }}>out {fmtMoney(grouped.windowTotals.out)}</span>
            {' · '}<span style={{ color: grouped.windowTotals.net < 0 ? '#B85838' : '#166534' }}>net {fmtMoney(grouped.windowTotals.net)}</span>
            {view.firstDate ? ` · ledger spans ${formatDate(view.firstDate)} – ${formatDate(view.lastDate)}` : ''}
          </div>

          {/* Continuous, newest-first register with STICKY month headers — the
              bank-statement pattern. Each header carries its month's in/out/net. */}
          {grouped.matched === 0 ? (
            <div className="border border-[#E8E4DC] bg-white px-2 py-6 text-center text-[0.75rem] text-[#5A5751]">
              No transactions in this period. Try “All”, step to another month, or clear the filters.
            </div>
          ) : (
            <div className="border border-[#E8E4DC] bg-white">
              {grouped.groups.map(g => {
                const isCollapsed = collapsed.has(g.key);
                return (
                <div key={g.key}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(g.key)}
                    aria-expanded={!isCollapsed}
                    className="sticky top-0 z-10 w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#FAF8F4] border-y border-[#E8E4DC] text-left hover:bg-white"
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="text-[#5A5751] text-xs" aria-hidden="true">{isCollapsed ? '▸' : '▾'}</span>
                      <span className={`text-[#1A1815] ${groupMode === 'category' ? 'capitalize' : ''}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{g.label}</span>
                      <span className="text-[0.625rem] text-[#5A5751]">{g.totals.count.toLocaleString()} tx</span>
                    </span>
                    <span className="flex items-center gap-2 text-[0.6875rem]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      <span style={{ color: '#166534' }}>in {fmtMoney(g.totals.in)}</span>
                      <span style={{ color: '#B85838' }}>out {fmtMoney(g.totals.out)}</span>
                      <span style={{ color: g.totals.net < 0 ? '#B85838' : '#166534' }}>net {fmtMoney(g.totals.net)}</span>
                    </span>
                  </button>
                  {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-white text-[#5A5751] uppercase tracking-wider text-[0.625rem]">
                        <tr>
                          <th className="text-left px-2 py-1.5"><button type="button" onClick={() => toggleSort('date')} className="uppercase tracking-wider hover:text-[#1A1815]">Date{sortArrow('date')}</button></th>
                          <th className="text-left px-2 py-1.5"><button type="button" onClick={() => toggleSort('account')} className="uppercase tracking-wider hover:text-[#1A1815]">Account{sortArrow('account')}</button></th>
                          <th className="text-left px-2 py-1.5"><button type="button" onClick={() => toggleSort('payee')} className="uppercase tracking-wider hover:text-[#1A1815]">Payee / Description{sortArrow('payee')}</button></th>
                          <th className="text-left px-2 py-1.5"><button type="button" onClick={() => toggleSort('category')} className="uppercase tracking-wider hover:text-[#1A1815]">Category{sortArrow('category')}</button></th>
                          <th className="text-right px-2 py-1.5"><button type="button" onClick={() => toggleSort('amount')} className="uppercase tracking-wider hover:text-[#1A1815]">Amount{sortArrow('amount')}</button></th>
                          {showBalance && <th className="text-right px-2 py-1.5">Balance</th>}
                          <th className="w-6 px-1 py-1.5" aria-label="Details" />
                        </tr>
                      </thead>
                      <tbody>
                        {g.rows.map(t => {
                          const open = expandedId === t.id;
                          const cols = showBalance ? 7 : 6;
                          return (
                          <React.Fragment key={t.id}>
                          <tr className="border-t border-[#E8E4DC] hover:bg-[#FAF8F4] cursor-pointer" onClick={() => setExpandedId(open ? null : t.id)} aria-expanded={open}>
                            <td className="px-2 py-1.5 whitespace-nowrap">{formatDate(t.posted)}</td>
                            <td className="px-2 py-1.5 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{t.institution}</td>
                            <td className="px-2 py-1.5 truncate max-w-[16.25rem]" title={t.name}>
                              {t.name}
                              {t.pending && <span className="ml-1.5 text-[0.5625rem] uppercase tracking-wider text-[#5A5751] border border-[#E8E4DC] rounded-full px-1.5 py-0.5">pending</span>}
                            </td>
                            <td className="px-2 py-1.5 text-[#5A5751] capitalize">{t.category || '—'}</td>
                            <td className="px-2 py-1.5 text-right font-mono" style={{ color: t.amount < 0 ? '#B85838' : '#16A34A' }}>{formatAmount(t.amount)}</td>
                            {showBalance && (
                              <td className="px-2 py-1.5 text-right font-mono text-[#5A5751]">
                                {balByRow.has(t.id) ? formatAmount(balByRow.get(t.id)) : '—'}
                              </td>
                            )}
                            <td className="px-1 py-1.5 text-center text-[#5A5751]" aria-hidden="true">{open ? '▾' : '▸'}</td>
                          </tr>
                          {open && (
                            <tr className="bg-[#FAF8F4]">
                              <td colSpan={cols} className="px-3 py-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[0.6875rem]">
                                  <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Date</div><div className="text-[#1A1815]">{formatDate(t.posted)}</div></div>
                                  <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Account</div><div className="text-[#1A1815]">{t.institution}</div></div>
                                  <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Category</div><div className="text-[#1A1815] capitalize">{t.category || '—'}</div></div>
                                  <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Amount</div><div className="font-mono" style={{ color: t.amount < 0 ? '#B85838' : '#166534' }}>{formatAmount(t.amount)}</div></div>
                                  <div className="col-span-2 sm:col-span-3"><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Full description</div><div className="text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{t.name}</div></div>
                                  <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Status</div><div className="text-[#1A1815]">{t.pending ? 'Pending' : 'Cleared'}</div></div>
                                  <div className="col-span-2 sm:col-span-4 border-t border-[#E8E4DC] pt-2"><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Receipt</div><div className="text-[#5A5751] italic">No receipt on file — bank-imported rows carry no receipt image. Attach one from the Tx tab when receipt capture lands.</div></div>
                                </div>
                              </td>
                            </tr>
                          )}
                          </React.Fragment>
                          );
                        })}
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
