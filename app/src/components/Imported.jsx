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
import { summarizeFinancialActivity } from '../lib/finance-activity.js';

const fmtMoney = (n) => '$' + Math.round(n || 0).toLocaleString();
const agoWords = (days) => days == null ? '' : days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;

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

// 2026-06-11 (P14 pattern): a signed-in OWNER on a public host may see their
// own imported data. Evidence of the session = the Supabase auth token this
// device holds after Royalty-Link sign-in. Anonymous public visitors still
// never pass (no token), demo never passes, and a profile is still required.
function hasOwnerSession() {
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!key) return false;
    const tok = JSON.parse(localStorage.getItem(key));
    const session = (tok && tok.currentSession) || tok;
    if (!session || !session.access_token) return false;
    // 2026-06-12 fix: presence is not validity. A leftover token on a shared
    // computer (signed in once, never signed out, session long expired) used
    // to pass this gate and render real bank rows. Require an unexpired
    // session; expires_at is epoch seconds.
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
    // Public domain: only a signed-in owner's own device passes. Private
    // hosts (Tailscale / LAN / localhost) behave as before.
    if (isPublicHostBrowser() && !hasOwnerSession()) return false;
    return true;
  } catch {
    return false;
  }
}

// Client-side equivalent of wf18's server-side institution/status/since filter.
// The deterministic Python snapshot (/finance/imported.json) is the FULL set, so
// this reproduces the same filter UX regardless of source. Counts stay the full
// totals (the cards show totals); only the table narrows — matching prior UX.
export function applyClientFilters(json, filters) {
  if (!json || !Array.isArray(json.transactions)) return json;
  let txns = json.transactions;
  if (filters.institution) txns = txns.filter(t => t.institution === filters.institution);
  if (filters.status && filters.status !== 'all') txns = txns.filter(t => (t.status || 'unknown') === filters.status);
  if (filters.since) txns = txns.filter(t => String(t.posted || '') >= filters.since);
  return { ...json, transactions: txns };
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
    const params = new URLSearchParams();
    if (filters.institution) params.set('institution', filters.institution);
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.since) params.set('since', filters.since);
    params.set('limit', '1000');
    const qs = params.toString();

    // Resilient cascade, most-reliable first. First source that returns valid
    // JSON wins — so "sometimes good, others not" (a single cross-origin hop)
    // becomes "tries the sovereign local path, then the network."
    //   1. Deterministic Python snapshot, SAME-ORIGIN static file (no n8n at
    //      all). Written by infra/nas-finance-ingest/imported_snapshot.py. The
    //      full set, so filter client-side.
    //   2. n8n via the SAME-ORIGIN Caddy /n8n proxy (handle_path /n8n/* ->
    //      reverse_proxy n8n). No cross-origin hop = no Funnel throttle/"Failed
    //      to fetch" when the app is served from the NAS.
    //   3. n8n via the absolute Tailscale Funnel (works when served off-NAS,
    //      e.g. Vercel, where the same-origin /n8n route does not exist).
    const snapshotUrl = `${import.meta.env.BASE_URL}finance/imported.json`;
    const sources = [
      { url: snapshotUrl, mode: 'same-origin', auth: false, clientFilter: true },
      { url: `/n8n/webhook/imported-transactions?${qs}`, mode: 'same-origin', auth: true, clientFilter: false },
      { url: `${N8N_BASE.replace(/\/+$/, '')}/webhook/imported-transactions?${qs}`, mode: 'cors', auth: true, clientFilter: false },
    ];

    let lastErr = null;
    for (const src of sources) {
      try {
        // L16 bearer only on the n8n sources, and only past the auth gate above.
        const headers = { Accept: 'application/json', ...(src.auth ? n8nAuthHeaders(true) : {}) };
        const r = await fetch(src.url, { headers, mode: src.mode });
        if (!r.ok) { lastErr = new Error(`${src.url} -> ${r.status}`); continue; }
        // A same-origin miss (static file not deployed, or /n8n route absent)
        // returns the SPA index.html with a 200 — skip anything that isn't JSON
        // so we fall through cleanly instead of throwing on HTML.
        if (!(r.headers.get('content-type') || '').includes('json')) { lastErr = new Error(`${src.url} -> non-JSON`); continue; }
        const json = await r.json();
        if (!json || !Array.isArray(json.transactions)) { lastErr = new Error(`${src.url} -> unexpected shape`); continue; }
        setData(src.clientFilter ? applyClientFilters(json, filters) : json);
        setLoading(false);
        return;
      } catch (e) {
        lastErr = e;
      }
    }
    setError(
      `Could not load imported transactions. Tried the local snapshot and n8n workflow 18. ` +
      `If off-LAN, turn Tailscale on; otherwise the snapshot refreshes on the NAS. Details: ${lastErr ? lastErr.message : 'unknown'}`
    );
    setLoading(false);
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

  // The budget picture, driven by WHEN financial documents arrive from the sourced
  // email/bank stream (Darrell 2026-06-16). Hook runs before the guard's early
  // return so hook order stays stable. Real or honestly empty — never painted.
  const activity = useMemo(() => data ? summarizeFinancialActivity(data, Date.now()) : null, [data]);

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

  // Unauthorized guard: render a notice, never the real transaction stream.
  // (Below the hooks — hooks must run unconditionally; the fetch paths above
  // carry their own isImportedViewAuthorized() stops.)
  if (!isImportedViewAuthorized()) {
    return (
      <div className="text-[12px] text-[#5A5751] p-4">
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
        <p className="text-[12px] text-[#5A5751] mt-1">
          Read-only view of bank + Gmail data ingested from your accounts. Source: <code className="text-[10px]">/volume1/PoeTech/finance-events/</code> — a deterministic Python snapshot on the NAS (served same-origin), with n8n workflow 18 as fallback.
        </p>
      </div>

      {/* Budget picture — painted by what has actually ARRIVED, not a manual stamp.
          This is the "based on when a financial document comes in" surface. */}
      {activity && (
        <div className="border-2 border-[#1A1815] bg-[#FAF8F4] p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Your budget picture · from what’s arriving</div>
          {activity.lastDocAt ? (
            <>
              <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                Last financial document <strong>{agoWords(activity.lastDocAgoDays)}</strong>
                {activity.lastSource ? <> — from <strong>{activity.lastSource}</strong></> : null}.
              </p>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="border border-[#E8E4DC] bg-white p-2">
                  <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">In · {activity.windowDays}d</div>
                  <div className="text-base font-medium" style={{ color: '#166534', fontFamily: '"JetBrains Mono", monospace' }}>{fmtMoney(activity.recentIn)}</div>
                </div>
                <div className="border border-[#E8E4DC] bg-white p-2">
                  <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Out · {activity.windowDays}d</div>
                  <div className="text-base font-medium" style={{ color: '#B85838', fontFamily: '"JetBrains Mono", monospace' }}>{fmtMoney(activity.recentOut)}</div>
                </div>
                <div className="border border-[#E8E4DC] bg-white p-2">
                  <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Documents</div>
                  <div className="text-base font-medium" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{activity.count.toLocaleString()}</div>
                </div>
              </div>
              <p className="text-[11px] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                Painted from financial emails + bank events as they arrive — before you download a statement.
              </p>
            </>
          ) : (
            <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              No financial documents have arrived yet. As bank/billing emails (Chase, etc.) land in the connected inbox, the picture fills in here automatically.
            </p>
          )}
        </div>
      )}

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
