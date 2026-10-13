// =============================================================================
// PaymentsLedgerPanel — the live payments ledger, where the accountant reads it
// =============================================================================
// DR-0230 brick three (APP-IS-PRIMARY): the payments truth the webhook writes
// (migration 0116) surfaced on Books → Taxes — per-entity year-at-a-glance
// (gross / fees / net, settled only) + the recent rows, read LIVE from the
// steward-scoped payments table. Reality-Trace: every number is a real row;
// the three honest states are named, never painted (DR-0076):
//   · table not applied yet  → says so (0116 is Darrell's hand)
//   · applied, no payments   → says the doors await the Governor's keys
//   · rows                   → the same yearSummary truth the 1099s reports read
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { fromTableRow, yearSummary } from '../lib/payments-ledger.js';

const centsMoney = (c) =>
  '$' + (Math.round(c) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function fetchPaymentRows() {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('provider,provider_event_id,provider_payment_id,status,amount_cents,fee_cents,net_cents,currency,product_key,entity_id,payer_email,occurred_at')
      .order('occurred_at', { ascending: false })
      .limit(50);
    if (error) return { state: 'unavailable', rows: [] };
    return { state: 'ok', rows: (data || []).map(fromTableRow) };
  } catch {
    return { state: 'unavailable', rows: [] };
  }
}

export default function PaymentsLedgerPanel({ entities = [], fetchRows = fetchPaymentRows, year = new Date().getFullYear() }) {
  const [result, setResult] = useState({ state: 'loading', rows: [] });
  useEffect(() => {
    let live = true;
    fetchRows().then((r) => { if (live) setResult(r); });
    return () => { live = false; };
  }, [fetchRows]);

  const entityName = (id) => entities.find((e) => e.id === id)?.name || id;
  const summary = yearSummary(result.rows, year);
  const summaryEntries = Object.entries(summary);

  return (
    <section className="border border-[#E8E4DC] p-3 mt-4">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Live payments ledger</div>
      <p className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
        Every settled payment, categorized to its entity the moment it clears — the books stay accountant-ready year-round, never an April scramble (DR-0230).
      </p>

      {result.state === 'loading' && (
        <p className="text-xs text-[#5A5751] mt-2">Reading the ledger…</p>
      )}

      {result.state === 'unavailable' && (
        <p className="text-xs text-[#1A1815] mt-2">
          The ledger table isn't reachable yet — migration 0116 + the processor keys are the Governor's hand. Until then, no payments are accepted and nothing here is invented.
        </p>
      )}

      {result.state === 'ok' && result.rows.length === 0 && (
        <p className="text-xs text-[#1A1815] mt-2">
          No payments recorded yet. The checkout and webhook doors are built and proven; the first live charge is a watched Governor step.
        </p>
      )}

      {result.state === 'ok' && result.rows.length > 0 && (
        <>
          <div className="mt-2 grid sm:grid-cols-2 gap-2">
            {summaryEntries.length === 0 && (
              <p className="text-xs text-[#5A5751]">No settled payments in {year} yet.</p>
            )}
            {summaryEntries.map(([eid, s]) => (
              <div key={eid} className="border border-[#E8E4DC] p-2">
                <div className="text-[0.6875rem] font-semibold text-[#1A1815]">{entityName(eid)} · {year}</div>
                <div className="text-[0.6875rem] text-[#1A1815]">
                  Gross {centsMoney(s.grossCents)} · Fees {centsMoney(s.feeCents)} · Net <span className="font-semibold">{centsMoney(s.netCents)}</span>
                  <span className="text-[#5A5751]"> · {s.count} payment{s.count === 1 ? '' : 's'}</span>
                </div>
              </div>
            ))}
          </div>
          <ul className="mt-2 space-y-1">
            {result.rows.slice(0, 10).map((r) => (
              <li key={r.providerEventId} className="text-[0.6875rem] text-[#1A1815] flex flex-wrap gap-x-2">
                <span className="text-[#5A5751]">{(r.occurredAtIso || '').slice(0, 10) || '—'}</span>
                <span>{r.productKey || 'payment'}</span>
                <span className="text-[#5A5751]">{entityName(r.entityId)}</span>
                <span className="font-semibold">{centsMoney(r.amountCents)}</span>
                {r.status !== 'settled' && <span className="text-[#5A5751] uppercase text-[0.5625rem] tracking-wider self-center">{r.status}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
