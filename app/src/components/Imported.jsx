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
// =============================================================================

import React, { useMemo, useState } from 'react';

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
  const [filters, setFilters] = useState({ institution: '', since: '', search: '' });

  const view = useMemo(() => buildImportedView(data, filters, Date.now()), [data, filters]);

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
              type="date"
              value={filters.since}
              onChange={e => setFilters(f => ({ ...f, since: e.target.value }))}
              className="border border-[#1A1815] px-2 py-1 text-xs bg-white"
              aria-label="Show since date"
            />
            <input
              type="search"
              placeholder="Search payee / category…"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="border border-[#1A1815] px-2 py-1 text-xs bg-white flex-1 min-w-[11.25rem]"
              aria-label="Search transactions"
            />
          </div>

          <div className="text-[0.625rem] text-[#5A5751]">
            Showing {view.filtered.length.toLocaleString()} of {view.total.toLocaleString()} transactions
            {view.firstDate ? ` · ${formatDate(view.firstDate)} – ${formatDate(view.lastDate)}` : ''}
          </div>

          <div className="overflow-x-auto border border-[#E8E4DC] bg-white">
            <table className="w-full text-xs">
              <thead className="bg-[#FAF8F4] text-[#5A5751] uppercase tracking-wider text-[0.625rem]">
                <tr>
                  <th className="text-left px-2 py-2">Date</th>
                  <th className="text-left px-2 py-2">Account</th>
                  <th className="text-left px-2 py-2">Payee / Description</th>
                  <th className="text-left px-2 py-2">Category</th>
                  <th className="text-right px-2 py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {view.filtered.slice(0, 1000).map(t => (
                  <tr key={t.id} className="border-t border-[#E8E4DC] hover:bg-[#FAF8F4]">
                    <td className="px-2 py-1.5 whitespace-nowrap">{formatDate(t.posted)}</td>
                    <td className="px-2 py-1.5 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{t.institution}</td>
                    <td className="px-2 py-1.5 truncate max-w-[16.25rem]" title={t.name}>{t.name}</td>
                    <td className="px-2 py-1.5 text-[#5A5751] capitalize">{t.category || '—'}</td>
                    <td className="px-2 py-1.5 text-right font-mono" style={{ color: t.amount < 0 ? '#B85838' : '#16A34A' }}>{formatAmount(t.amount)}</td>
                  </tr>
                ))}
                {view.filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-2 py-6 text-center text-[#5A5751]">No transactions match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {view.filtered.length > 1000 && (
            <div className="text-[0.625rem] text-[#5A5751]">Showing first 1,000 rows — narrow with the filters above to see the rest.</div>
          )}
        </>
      )}
    </div>
  );
}
