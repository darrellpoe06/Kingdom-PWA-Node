// =============================================================================
// RentLedger — per-door paid-vs-due entry + history (rentals build step b UI)
// =============================================================================
// Darrell 2026-07-27: on each door (address), record "amount paid" vs the
// monthly rent DUE, month by month; partial payments accumulate; a 0→100%
// indicator derived from the real amounts. This is the SURFACE over the ledger
// core (lib/rent-payments.js) and the lease link (lib/lease-sync.js), which
// already shipped and are live in main.
//
// FLOW (integrated, one river): the door carries its remoteUuid (its cloud
// rentals row) → loadLeasesByRental maps that to the active lease + its
// monthly_rent (the DUE) → recordRentPayment accumulates the PAID into the
// single (lease, month) row with a receipt event → loadRentPayments reads the
// history both the owner and (step b3) the tenant will see. Money never moves
// here (DR-0094); this records. Every entry logs amount/method/where/who
// (DR-0090). Derived status + percent only, never painted (DR-0061).
//
// HONEST STATES (DR-0076): signed-out, no-cloud-lease-yet (the door's lease
// must sync first — save the Lease & Tenant panel while signed in), and load
// errors each say what is true rather than showing an empty or fake ledger.
// =============================================================================
import React, { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase.js';
import { getInstanceId } from '../lib/table-sync.js';
import { loadLeasesByRental } from '../lib/lease-sync.js';
import { recordRentPayment, loadRentPayments, paidPercent } from '../lib/rent-payments.js';
import { buildTenantStatement } from '../lib/rent-statement.js';

const METHODS = [['cash', 'Cash'], ['check', 'Check'], ['ach', 'ACH / bank'], ['zelle', 'Zelle'], ['venmo', 'Venmo'], ['cashapp', 'Cash App'], ['other', 'Other']];
const fmt = (n) => `$${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const thisMonth = () => {
  // No argless new Date() in some sandboxes; the browser has it. Guarded.
  try { return new Date().toISOString().slice(0, 7); } catch { return ''; }
};

// The 0→100% bar — derived, labelled, theme-safe. Exported for the door card.
export function PaidBar({ received, expected }) {
  const pct = paidPercent(received, expected);
  const tone = pct >= 100 ? '#5A6E3D' : pct > 0 ? '#B85838' : '#C9C2B6';
  return (
    <div className="flex items-center gap-2" title={`${fmt(received)} of ${fmt(expected)} — ${pct}% paid`}>
      <div className="flex-1 h-2 bg-[#E8E4DC] overflow-hidden" role="img" aria-label={`${pct}% of rent paid this month`}>
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: tone }} />
      </div>
      <span className="text-[0.625rem] tabular-nums text-[#1A1815] font-semibold w-9 text-right">{pct}%</span>
    </div>
  );
}

export default function RentLedger({ rental }) {
  const [state, setState] = useState({ phase: 'loading', lease: null, rows: [], error: '' });
  const [form, setForm] = useState({ month: thisMonth(), amount: '', method: 'zelle', location: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setState((s) => ({ ...s, phase: 'loading', error: '' }));
    try {
      const { data: sess } = await supabase.auth.getUser();
      if (!sess || !sess.user) { setState({ phase: 'signed-out', lease: null, rows: [], error: '' }); return; }
      if (!rental || !rental.remoteUuid) { setState({ phase: 'no-lease', lease: null, rows: [], error: '' }); return; }
      const tenantId = await getInstanceId();
      const map = await loadLeasesByRental(supabase, tenantId);
      const lease = map[rental.remoteUuid];
      if (!lease) { setState({ phase: 'no-lease', lease: null, rows: [], error: '' }); return; }
      const rows = await loadRentPayments(supabase, lease.leaseId);
      setState({ phase: 'ready', lease, rows, error: '' });
    } catch (e) {
      setState({ phase: 'error', lease: null, rows: [], error: (e && e.message) || 'load failed' });
    }
  }, [rental]);

  useEffect(() => { load(); }, [load]);

  const due = state.lease ? state.lease.monthlyRent : (rental.lease?.monthlyRent || rental.rent || 0);
  const monthRow = state.rows.find((r) => r.month === form.month);

  const submit = async () => {
    setMsg('');
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getUser();
      const tenantId = await getInstanceId();
      const res = await recordRentPayment(supabase, {
        tenantId, userId: sess?.user?.id, leaseId: state.lease.leaseId, month: form.month,
        expectedAmount: due, amount: form.amount, method: form.method, location: form.location,
      });
      if (!res.ok) { setMsg(`Couldn't record: ${res.reason.replace(/-/g, ' ')}.`); setBusy(false); return; }
      setForm((f) => ({ ...f, amount: '', location: '' }));
      setMsg(`Recorded — ${res.status} · ${res.percent}% paid for ${form.month}.`);
      await load();
    } catch (e) {
      setMsg(`Couldn't record: ${(e && e.message) || 'error'}.`);
    }
    setBusy(false);
  };

  // The tenant's keepable record (step b3a): the owner builds a plain statement
  // from the real rows and hands it over (share / copy). No money, no new access.
  const shareStatement = async () => {
    let asOf;
    try { asOf = new Date().toISOString().slice(0, 10); } catch { asOf = ''; }
    const text = buildTenantStatement({
      doorName: rental.name || '',
      tenantName: rental.tenantName || rental.tenant?.name || '',
      rows: state.rows, asOf,
    });
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch { /* fall through */ }
    try { await navigator.clipboard.writeText(text); setMsg('Statement copied — paste it to the tenant.'); } catch { setMsg('Statement ready (copy unavailable in this browser).'); }
  };

  return (
    <details className="bg-white border border-[#E8E4DC] p-3 mb-2">
      <summary className="cursor-pointer text-xs font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
        Rent — paid vs due
        {state.phase === 'ready' && monthRow && <span className="ml-2 text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>· {monthRow.percent}% this month</span>}
      </summary>

      {state.phase === 'loading' && <p className="mt-3 text-xs text-[#5A5751]" role="status">Loading the rent ledger…</p>}
      {state.phase === 'signed-out' && <p className="mt-3 text-xs text-[#5A5751]">Sign in to record and see rent payments.</p>}
      {state.phase === 'no-lease' && (
        <p className="mt-3 text-xs text-[#5A5751]">
          No cloud lease for this door yet. Save the <span className="font-semibold">Lease &amp; Tenant</span> panel above (with a start, end, monthly rent, and tenant name) while signed in — the lease syncs, then rent entry opens here.
        </p>
      )}
      {state.phase === 'error' && (
        <p className="mt-3 text-xs text-[#B85838]" role="alert">Couldn&rsquo;t load the ledger — a connection hiccup, not a sign-in problem. <button type="button" onClick={load} className="underline">Try again</button>.</p>
      )}

      {state.phase === 'ready' && (
        <div className="mt-3 space-y-3">
          {/* ENTRY — amount paid vs due */}
          <div className="bg-[#FAF8F4] border border-[#5A6E3D] p-3 space-y-2">
            <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold">Record a payment · {fmt(due)}/mo due</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div><label htmlFor={`rp-month-${rental.id}`} className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Month</label><input id={`rp-month-${rental.id}`} type="month" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></div>
              <div><label htmlFor={`rp-amt-${rental.id}`} className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Amount paid</label><input id={`rp-amt-${rental.id}`} type="number" step="0.01" min="0" placeholder="0.00" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div><label htmlFor={`rp-method-${rental.id}`} className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Method</label><select id={`rp-method-${rental.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>{METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              <div><label htmlFor={`rp-loc-${rental.id}`} className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Where paid</label><input id={`rp-loc-${rental.id}`} placeholder="office, portal…" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            </div>
            {monthRow && <div className="text-[0.625rem] text-[#5A5751]">So far for {form.month}: {fmt(monthRow.received)} of {fmt(monthRow.expected)} — a new entry adds on top (partials accumulate).</div>}
            <div className="flex items-center gap-2">
              <button type="button" disabled={busy || !(Number(form.amount) > 0)} onClick={submit} className="bg-[#1A1815] text-white py-2 px-4 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] disabled:opacity-50">{busy ? 'Recording…' : 'Record payment'}</button>
              {msg && <span className="text-[0.625rem] text-[#5A5751]" role="status">{msg}</span>}
            </div>
            <p className="text-[0.5625rem] text-[#5A5751] leading-snug">Recording only — no money moves in the app. Each entry is kept with its date, method, and where it was paid.</p>
          </div>

          {/* HISTORY — the keepable record. The owner can hand the tenant a
              statement of it now (b3a); a tenant self-service login is the
              Tier-C follow-on the portal RLS already supports (b3b). */}
          {state.rows.length > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Payment history</span>
              <button type="button" onClick={shareStatement} className="text-[0.625rem] uppercase tracking-wider border border-[#1A1815] text-[#1A1815] px-3 py-1.5 hover:bg-[#1A1815] hover:text-white">Share statement</button>
            </div>
          )}
          {state.rows.length === 0 ? (
            <p className="text-xs text-[#5A5751] italic">No payments recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {state.rows.map((r) => (
                <li key={r.id} className="border border-[#E8E4DC] p-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#1A1815]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.month}</span>
                    <span className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">{r.status}</span>
                  </div>
                  <PaidBar received={r.received} expected={r.expected} />
                  <div className="text-[0.625rem] text-[#5A5751] mt-1">{fmt(r.received)} of {fmt(r.expected)}</div>
                  {r.events.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {r.events.map((e, i) => (
                        <li key={i} className="text-[0.5625rem] text-[#5A5751]">
                          {fmt(e.amount)} · {e.method}{e.location ? ` · ${e.location}` : ''}{e.at ? ` · ${String(e.at).slice(0, 10)}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </details>
  );
}
