// =============================================================================
// MoneyArrangements — every confirmed creditor arrangement, settlement and
// past-due balance as its OWN record in Debt Freedom (Christina, 2026-11-03:
// two Britt & Gaines accounts must stay two). One row per saved bill; nothing
// is merged by agency name, and payments are matched only by the exact payee
// spelling saved on the bill. A payment that cannot be matched is listed for
// review, never assigned by guess.
// =============================================================================
import React, { useMemo } from 'react';
import { arrangementPayoff, cleanName } from '../../lib/bill-review.js';
import { OBLIGATION_TYPE_LABEL } from '../../lib/safe-to-spend.js';
import { fmt } from '../../lib/format.js';

export function arrangementPayments(data, o, since) {
  const keys = new Set([o.paidAs || o.name, ...(o.alsoPaidAs || [])].filter(Boolean).map((n) => cleanName(n).toLowerCase()));
  return (data.transactions || []).filter((t) => t && Number(t.amount) < 0 && String(t.date) >= since && keys.has(cleanName(t.description || '').toLowerCase()));
}

export default function MoneyArrangements({ money }) {
  const { data = {}, currentDate } = money || {};
  const cd = useMemo(() => (currentDate instanceof Date ? currentDate : new Date()), [currentDate]);
  const since = useMemo(() => { const d = new Date(cd); d.setDate(d.getDate() - 120); return d.toISOString().slice(0, 10); }, [cd]);
  const list = (data.recurringObligations || []).filter((o) => o && o.enabled !== false && ['arrangement', 'settlement', 'past-due'].includes(o.type));
  if (!list.length) return null;
  return (
    <section data-testid="money-arrangements" className="bg-white border border-[#E8E4DC] rounded-2xl p-4 space-y-2">
      <h3 className="text-[0.875rem] font-semibold text-[#1A1815]">Creditor arrangements and past-due balances</h3>
      <p className="text-[0.75rem] text-[#5A5751]">Each account is its own record, even when one agency collects more than one.</p>
      <ul className="divide-y divide-[#F0ECE4]">
        {list.map((o) => {
          const p = arrangementPayoff(o, cd);
          const paid = arrangementPayments(data, o, since);
          return (
            <li key={o.id} className="py-2 text-[0.8125rem]" data-testid={`arrangement-${o.id}`}>
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-semibold text-[#1A1815]">{o.name}{o.accountLast4 ? ` · ••${o.accountLast4}` : ''}</span>
                <span>{fmt(o.amount)} · {OBLIGATION_TYPE_LABEL[o.type] || o.type}</span>
              </div>
              <div className="text-[0.75rem] text-[#5A5751]">
                Original creditor: {o.originalCreditor || 'not entered'} · Balance: {o.balance != null ? fmt(o.balance) : 'not entered'} · Past due: {o.pastDue ? fmt(o.pastDue) : 'none entered'} · Next due: {o.nextDue || '—'}
                {p ? ` · paid off around ${p.payoffMonth}` : ''}
              </div>
              <div className="text-[0.75rem] text-[#5A5751]">{paid.length} payment{paid.length === 1 ? '' : 's'} in the last 120 days paid to exactly “{[o.paidAs || o.name, ...(o.alsoPaidAs || [])].join('” or “')}”, {fmt(paid.reduce((s, t) => s - Number(t.amount), 0))} in all.</div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
