// =============================================================================
// Imported — Books → Imported subview
// =============================================================================
// Reads from n8n's /webhook/imported-transactions endpoint (workflow 18) and
// surfaces all ingested bank + Gmail data with cross-verify status badges.
//
// Sovereign loop: the source of truth is JSON files in
// /volume1/PoeTech/finance-events/ on the NAS. n8n exposes them to this
// component via a single read-only HTTP endpoint. No Supabase involvement —
// the PWA reads sovereign data directly from the family's own infrastructure.
//
// The n8n base URL is resolved by lib/n8n-base.js. By default it is the
// same-origin "/n8n" path, which the Vercel rewrite (app/vercel.json) proxies
// to the Tailscale Funnel. Routing same-origin avoids the Funnel relay's
// cross-origin throttling — see
// docs/99-session-notes/2026-06-01-research-review-wf18-unreachable.md.
// =============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { N8N_BASE, n8nAuthHeaders } from '../lib/n8n-base.js';

// Security self-guard: this view surfaces real bank + Gmail PII from n8n
// workflow 18. Mirrors importedAllowed in poe-financial-mvp-v28.jsx so the
// fetch can never fire from any unauthorized context regardless of how the
// component gets mounted.
//
// 2026-06-03 hardening: localStorage alone is defeatable on the owner's own
// device. Public domains (poetech.us, *.vercel.app, any non-local host) now
// NEVER pass this gate regardless of localStorage state. Family accesses real
// data via the Tailscale-internal URL only.
function isPublicHostBrowser() {
  try {
    if (typeof window === 'undefined') return true;
    const host = window.location.hostname || '';
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return false;
    if (host.startsWith('100.')) return false; // Tailscale CGNAT
    if (host.endsWith('.ts.net')) return false; // Tailscale magic DNS
    if (host.endsWith('.local')) return false; // mDNS LAN
    if (/^192\.168\./.test(host)) return false; // RFC1918 LAN
    if (/^10\./.test(host)) return false; // RFC1918 LAN
    return true; // PUBLIC
  } catch {
    return true; // Fail closed.
  }
}

function isImportedViewAuthorized() {
  try {
    if (typeof window === 'undefined') return false;
    if (isPublicHostBrowser()) return false; // Public domain = NEVER show real PII.
    if (new URLSearchParams(window.location.search).has('demo')) return false;
    return !!localStorage.getItem('poe-current-profile');
  } catch {
    return false;
  }
}

const STATUS_BADGE = {
  verified:    { color: '#16A34A', label: '✓ Verified',     hint: 'Matched a Gmail-claimed event within tolerance' },
  unconfirmed: { color: '#D97706', label: '⚠ Unconfirmed', hint: 'Gmail mentioned it but no bank match yet'        },
  unexplained: { color: '#DC2626', label: '? Unexplained',  hint: 'Bank shows it but no Gmail claim — review'        },
  unknown:     { color: '#6B7280', label: '— Pending',      hint: 'Not yet evaluated by the reconcile engine'        },
  'no-amount': { color: '#6B7280', label: '— No amount',    hint: 'Gmail event had no extractable amount'             }
};

function formatAmount(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sign = n < 0 ? '-' : '';
  return `${sign}$${abs}`;
}

function formatDate(s) {
  if (!s) return '—';
  // Accept YYYY-MM-DD or ISO. Display as compact.
  const d = new Date(s.length === 10 ? s + 'T00:00:00' : s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export default function Imported() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ institution: '', status: 'all', since: '', search: '' });

  const fetchData = async () => {
    // Hard stop: never reach the PII webhook from an unauthorized (public /
    // demo / profileless) load.
    if (!isImportedViewAuthorized()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.institution) params.set('institution', filters.institution);
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.since) params.set('since', filters.since);
      params.set('limit', '1000');
      const url = `${N8N_BASE.replace(/\/+$/, '')}/webhook/imported-transactions?${params.toString()}`;
      // L16: this fetch is reached only past isImportedViewAuthorized(), so the
      // bearer is attached here and never on a demo / profileless load.
      const r = await fetch(url, { headers: { Accept: 'application/json', ...n8nAuthHeaders(true) }, mode: 'cors' });
      if (!r.ok) throw new Error(`Workflow 18 returned ${r.status}`);
      const json = await r.json();
      setData(json);
    } catch (e) {
      setError(
        `Could not reach workflow 18 at ${N8N_BASE}. ` +
        `Make sure workflow 18 is imported + published in n8n, and that this device can reach the NAS ` +
        `(Tailscale on if off-LAN). Details: ${e.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isImportedViewAuthorized()) { setLoading(false); return; }
    fetchData();
    // Refresh every 5 min while this view is open.
    const id = setInterval(fetchData, 300_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.institution, filters.status, filters.since]);

  // Hooks must run unconditionally (before the guard's early return), or
  // React's hook order corrupts the moment authorization flips mid-session.
  const filtered = useMemo(() => {
    if (!data || !data.transactions) return [];
    const q = filters.search.trim().toLowerCase();
    if (!q) return data.transactions;
    return data.transactions.filter(t => {
      const hay = [t.name, t.memo, t.institution, t.fitid, t.posted].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [data, filters.search]);

  // Unauthorized guard: render a notice, never the real transaction stream.
  if (!isImportedViewAuthorized()) {
    return (
      <div className="text-[12px] text-[#5A5751] p-4">
        Imported transactions are private to each family and shown only when you are signed in with your own data loaded.
      </div>
    );
  }

  const counts = data?.counts || { total_bank: 0, total_gmail: 0, status_counts: {}, institutions: [] };
  const statusCounts = counts.status_counts || {};

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontSize: '1.5rem', fontWeight: 600 }}>
          Imported transactions
        </h2>
        <p className="text-[12px] text-[#5A5751] mt-1">
          Read-only view of bank + Gmail data ingested from your accounts. Source: <code className="text-[10px]">/volume1/PoeTech/finance-events/</code> via n8n workflow 18.
        </p>
      </div>

      {error && (
        <div className="border border-[#DC2626] bg-[#FEE2E2] text-[#7F1D1D] p-3 text-xs">
          {error}
        </div>
      )}

      {loading && !error && (
        <div className="text-[12px] text-[#5A5751]">Loading…</div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">Bank tx</div>
              <div className="text-lg font-medium">{counts.total_bank.toLocaleString()}</div>
            </div>
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">Gmail events</div>
              <div className="text-lg font-medium">{counts.total_gmail.toLocaleString()}</div>
            </div>
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[10px] uppercase tracking-wider" style={{ color: STATUS_BADGE.verified.color }}>Verified</div>
              <div className="text-lg font-medium">{(statusCounts.verified || 0).toLocaleString()}</div>
            </div>
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[10px] uppercase tracking-wider" style={{ color: STATUS_BADGE.unconfirmed.color }}>Unconfirmed</div>
              <div className="text-lg font-medium">{(statusCounts.unconfirmed || 0).toLocaleString()}</div>
            </div>
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[10px] uppercase tracking-wider" style={{ color: STATUS_BADGE.unexplained.color }}>Unexplained</div>
              <div className="text-lg font-medium">{(statusCounts.unexplained || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filters.institution}
              onChange={e => setFilters(f => ({ ...f, institution: e.target.value }))}
              className="border border-[#1A1815] px-2 py-1 text-xs bg-white"
              aria-label="Filter by institution"
            >
              <option value="">All institutions</option>
              {(counts.institutions || []).map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="border border-[#1A1815] px-2 py-1 text-xs bg-white"
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="verified">Verified only</option>
              <option value="unconfirmed">Unconfirmed only</option>
              <option value="unexplained">Unexplained only</option>
              <option value="unknown">Pending only</option>
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
              placeholder="Search payee / memo / FITID…"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="border border-[#1A1815] px-2 py-1 text-xs bg-white flex-1 min-w-[180px]"
              aria-label="Search transactions"
            />
            <button
              type="button"
              onClick={fetchData}
              className="px-3 py-1 text-[10px] uppercase tracking-wider bg-[#1A1815] text-white hover:bg-[#B85838]"
            >
              Refresh
            </button>
          </div>

          <div className="text-[10px] text-[#5A5751]">
            Showing {filtered.length.toLocaleString()} of {counts.total_bank.toLocaleString()} bank transactions
            {data.served_at ? ` · refreshed ${new Date(data.served_at).toLocaleTimeString()}` : ''}
          </div>

          <div className="overflow-x-auto border border-[#E8E4DC] bg-white">
            <table className="w-full text-xs">
              <thead className="bg-[#FAF8F4] text-[#5A5751] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="text-left px-2 py-2">Date</th>
                  <th className="text-left px-2 py-2">Institution</th>
                  <th className="text-left px-2 py-2">Payee / Description</th>
                  <th className="text-right px-2 py-2">Amount</th>
                  <th className="text-left px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const badge = STATUS_BADGE[t.status] || STATUS_BADGE.unknown;
                  const amountColor = t.amount != null && t.amount < 0 ? '#B85838' : '#16A34A';
                  return (
                    <tr key={t.id} className="border-t border-[#E8E4DC] hover:bg-[#FAF8F4]">
                      <td className="px-2 py-1.5 whitespace-nowrap">{formatDate(t.posted)}</td>
                      <td className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-[#5A5751]">{t.institution || '—'}</td>
                      <td className="px-2 py-1.5 truncate max-w-[260px]" title={t.name || t.memo || ''}>{t.name || t.memo || '—'}</td>
                      <td className="px-2 py-1.5 text-right font-mono" style={{ color: amountColor }}>{formatAmount(t.amount)}</td>
                      <td className="px-2 py-1.5">
                        <span
                          className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider"
                          style={{ backgroundColor: badge.color + '22', color: badge.color, border: `1px solid ${badge.color}` }}
                          title={badge.hint}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-2 py-6 text-center text-[#5A5751]">
                      No transactions match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data.gmail_events && data.gmail_events.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-[#5A5751] uppercase tracking-wider text-[10px]">
                Recent Gmail finance events ({data.gmail_events.length})
              </summary>
              <div className="mt-2 space-y-1 border-l-2 border-[#E8E4DC] pl-3">
                {data.gmail_events.slice(0, 50).map(e => {
                  const badge = STATUS_BADGE[e.status] || STATUS_BADGE.unknown;
                  return (
                    <div key={e.id} className="py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#5A5751]">{formatDate(e.internal_date)}</span>
                        <span
                          className="inline-block px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                          style={{ backgroundColor: badge.color + '22', color: badge.color, border: `1px solid ${badge.color}` }}
                          title={badge.hint}
                        >
                          {badge.label}
                        </span>
                        <span className="font-mono text-[11px]" style={{ color: e.direction === 'out' ? '#B85838' : '#16A34A' }}>
                          {formatAmount(e.amount)}
                        </span>
                      </div>
                      <div className="text-[11px] truncate" title={e.subject}>{e.subject}</div>
                      <div className="text-[10px] text-[#5A5751] truncate" title={e.from}>{e.from}</div>
                    </div>
                  );
                })}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
