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
//
// AND IT IS QUIET WHERE ITS PARENT IS QUIET (2026-11-12). Found by taking the
// defect Darrell caught on the work-order board -- a surface reading his own
// rows under a banner promising a stranger's view -- and asking where else it
// was true. Here: BooksTaxes honours `demo` for its own archive read and
// renders a notice naming "tax returns and payments", while mounting this
// panel with no `demo` at all, so the panel read the real `payments` table
// underneath that notice. `demo` is true in sample mode, in the isolated
// preview, AND under either reviewer lens, and the Money tab is ungated in
// nav-items.jsx -- so this was reachable, with real money on it, in every one
// of those states. Nothing was EXPOSED (RLS scopes `payments` to the steward
// and under the lens he is still himself), but the surface was lying about
// what it was showing, which is the thing the lens exists to answer.
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { fromTableRow, yearSummary } from '../lib/payments-ledger.js';
import { isReviewerStranger, reviewerLensLine } from '../lib/reviewer-lens.js';

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

export default function PaymentsLedgerPanel({ entities = [], fetchRows = fetchPaymentRows, year = new Date().getFullYear(), demo = false, stranger = null }) {
  // The lens is read here, at this panel's own cloud boundary, the way every
  // other lens-honouring surface reads it -- not handed down a mount, because
  // a per-mount flag is exactly how the work-order board was missed.
  const lens = stranger == null ? isReviewerStranger() : !!stranger;
  const quiet = demo || lens;
  const [result, setResult] = useState({ state: 'loading', rows: [] });
  useEffect(() => {
    let live = true;
    // NOT EVEN ASKED when the surface is quiet: a read whose rows are then
    // hidden still pulled them, and a panel that fetches under a sample notice
    // is one refactor away from rendering them.
    if (quiet) return undefined;
    fetchRows().then((r) => { if (live) setResult(r); });
    return () => { live = false; };
  }, [quiet, fetchRows]);

  const entityName = (id) => entities.find((e) => e.id === id)?.name || id;
  const summary = yearSummary(result.rows, year);
  const summaryEntries = Object.entries(summary);

  return (
    <section className="border border-[#E8E4DC] p-3 mt-4">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Live payments ledger</div>
      <p className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
        Every settled payment, categorized to its entity the moment it clears — the books stay accountant-ready year-round, never an April scramble (DR-0230).
      </p>

      {/* It SAYS why it is quiet, in the words that are true of the state it is
          in -- never blank, and never the wrong reason (DR-0381). Under the
          stranger lens these are the steward's own rows being withheld from
          him on purpose, which is what reviewerLensLine says; it is NOT the
          database refusing them, and this panel does not claim that it is. */}
      {lens && (
        <p className="text-xs text-[#1A1815] mt-2" role="status" data-testid="payments-reviewer-lens">{reviewerLensLine('payments')}</p>
      )}

      {quiet && !lens && (
        <p className="text-xs text-[#1A1815] mt-2" data-testid="payments-ledger-sample">
          Sample mode: the live ledger is not read here, and no payment is invented to fill it.
        </p>
      )}

      {!quiet && result.state === 'loading' && (
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
