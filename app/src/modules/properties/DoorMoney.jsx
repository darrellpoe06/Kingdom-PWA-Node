// =============================================================================
// DoorMoney — what this door has brought in, and the family's "Record a
// payment received" (DR-0903, migration 0265)
// =============================================================================
// Darrell, 2026-10-10, on the Rent tab: "How to add payments to the
// historical events?" — and then: "the historical money for each property...
// with or without the tenants information... so the door always pays... the
// most important thing is to see how much money is being accumulated by each
// asset".
//
// RecordPayment writes a CONFIRMED payment on the door — with its tenancy when
// there is one, on the door alone when there is not — on the day the money
// actually came, which may be long past. It lands in Payment history, in the
// door's History, on the clock (record_events), and in the totals below.
// No money moves here (DR-0094).
// =============================================================================
import React, { useState } from 'react';
import { RECEIVED_METHODS, buildReceivedPayment, dollarsLong } from './door-money.js';

const serif = { fontFamily: '"Fraunces", Georgia, serif' };
const field = 'text-sm border border-[#E8E4DC] px-2 py-2 bg-white text-[#1A1815]';

const Btn = ({ children, onClick, tone = 'ghost', disabled, ...rest }) => (
  <button
    type="button" onClick={onClick} disabled={disabled}
    className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40 ${
      tone === 'primary' ? 'bg-[#2F5D50] text-white border-[#2F5D50] hover:bg-[#1A1815] hover:border-[#1A1815]'
        : 'bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815]'}`}
    {...rest}
  >{children}</button>
);

const localDay = (d = new Date()) => {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

/** What this door has brought in: lifetime, by year, by month. */
export function DoorMoneyCard({ summary, doorLabel = 'this door' }) {
  const [all, setAll] = useState(false);
  if (!summary) return null;
  const shown = all ? summary.months : summary.months.slice(0, 12);
  const top = Math.max(1, ...summary.months.map((m) => m.received));
  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="door-money">
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50] mb-2">What {doorLabel} has brought in</h3>
      {!summary.known ? (
        <p className="text-sm text-[#1A1815]" style={serif} data-testid="door-money-none">
          No money has been recorded on this door yet. Record what it has brought in below, tenant or no tenant, as far back as you have it.
        </p>
      ) : (
        <>
          <p className="text-2xl text-[#1A1815]" style={serif} data-testid="door-money-total">{dollarsLong(summary.received)}</p>
          <p className="text-xs text-[#5A5751]" style={serif}>
            {summary.payments} confirmed payment{summary.payments === 1 ? '' : 's'} from {summary.firstMonth} to {summary.lastMonth}
            {summary.withoutTenant ? `, ${summary.withoutTenant} with no tenant on record` : ''}.
          </p>
          <div className="flex flex-wrap gap-3 mt-2" data-testid="door-money-years">
            {summary.years.map((y) => (
              <span key={y.year} className="text-sm text-[#1A1815]" style={serif}>
                <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] block">{y.year}</span>
                {dollarsLong(y.received)}
              </span>
            ))}
          </div>
        </>
      )}
      {summary.awaitingCount > 0 && (
        <p className="text-xs text-[#5A5751] mt-2" style={serif} data-testid="door-money-awaiting">
          {dollarsLong(summary.awaiting)} more is reported and waiting for you to confirm it. It is not counted above until you do.
        </p>
      )}
      {summary.months.length > 0 && (
        <ul className="mt-3 space-y-1" data-testid="door-money-months">
          {shown.map((m) => (
            <li key={m.month} className="text-xs text-[#1A1815] flex items-center gap-2">
              <span className="w-16 shrink-0 text-[#5A5751]">{m.month}</span>
              <span className="flex-1 h-2 bg-[#F0EDE6]" aria-hidden="true">
                <span className="block h-2 bg-[#2F5D50]" style={{ width: `${Math.round((m.received / top) * 100)}%` }} />
              </span>
              <span className="w-24 shrink-0 text-right" style={serif}>
                {m.payments ? dollarsLong(m.received) : '—'}{m.awaitingCount ? ' *' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      {summary.months.length > 12 && (
        <div className="mt-2"><Btn onClick={() => setAll((v) => !v)}>{all ? 'Show the last 12 months' : `Show all ${summary.months.length} months`}</Btn></div>
      )}
      {summary.months.some((m) => m.awaitingCount) && (
        <p className="text-[0.6875rem] text-[#5A5751] mt-1">* has a payment reported and not yet confirmed.</p>
      )}
    </section>
  );
}

/**
 * The family's "Record a payment received". onRecord(row) writes it and
 * resolves {ok, reason}. `tenantName` prefills who it came from.
 */
export function RecordPayment({ onRecord, tenantName = '', hasTenancy = false }) {
  const today = localDay();
  const [amount, setAmount] = useState('');
  const [paidOn, setPaidOn] = useState(today);
  const [period, setPeriod] = useState(today.slice(0, 7));
  const [periodTouched, setPeriodTouched] = useState(false);
  const [method, setMethod] = useState('');
  const [from, setFrom] = useState(tenantName || '');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState('');

  const pickDay = (v) => {
    setPaidOn(v);
    // The month follows the day until the family says otherwise.
    if (!periodTouched && /^\d{4}-\d{2}/.test(v)) setPeriod(v.slice(0, 7));
  };

  const save = async () => {
    const built = buildReceivedPayment({ amount, paidOn, period, method, from: hasTenancy ? '' : from, note, today });
    setErrors(built.errors);
    if (!built.ok) return;
    setBusy(true);
    const res = await onRecord(built.row);
    setBusy(false);
    if (!res || !res.ok) { setErrors({ send: `Not recorded: ${(res && res.reason) || 'try again'}` }); return; }
    setSaid(`Recorded ${dollarsLong(built.row.amount)} received ${built.row.paid_on} for ${built.row.for_period}, at ${new Date().toLocaleString()}. It is in Payment history, History, and the totals.`);
    setAmount(''); setNote('');
  };

  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="record-payment">
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50] mb-2">Record a payment received</h3>
      <p className="text-xs text-[#5A5751] mb-2" style={serif}>
        Money this door brought in{hasTenancy ? '' : ', with a tenant on record or not'}. Any day it came, as far back as you have it.
      </p>
      <div className="flex flex-wrap items-end gap-2 mb-2">
        <label className="text-xs text-[#5A5751]">Amount
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" aria-label="Amount received" className={`${field} block w-28`} style={serif} />
        </label>
        <label className="text-xs text-[#5A5751]">The day it came
          <input type="date" value={paidOn} max={today} onChange={(e) => pickDay(e.target.value)} aria-label="The day it came" className={`${field} block`} />
        </label>
        <label className="text-xs text-[#5A5751]">For which month
          <input type="month" value={period} onChange={(e) => { setPeriodTouched(true); setPeriod(e.target.value); }} aria-label="For which month" className={`${field} block`} />
        </label>
      </div>
      {errors.amount && <p className="text-xs text-[#B85838]">{errors.amount}</p>}
      {errors.paidOn && <p className="text-xs text-[#B85838]">{errors.paidOn}</p>}
      {errors.period && <p className="text-xs text-[#B85838]">{errors.period}</p>}
      <p className="text-xs text-[#5A5751] mb-1">How it came</p>
      <div className="flex flex-wrap gap-1 mb-2" role="group" aria-label="How it came">
        {RECEIVED_METHODS.map((m) => (
          <Btn key={m.id} tone={method === m.id ? 'primary' : 'ghost'} aria-pressed={method === m.id} onClick={() => setMethod(m.id)}>{m.label}</Btn>
        ))}
      </div>
      {errors.method && <p className="text-xs text-[#B85838]">{errors.method}</p>}
      {!hasTenancy && (
        <label className="block text-xs text-[#5A5751] mb-1">From whom (optional)
          <input value={from} onChange={(e) => setFrom(e.target.value)} maxLength={120} aria-label="From whom" className={`${field} block w-full`} style={serif} />
        </label>
      )}
      <label className="block text-xs text-[#5A5751]">A note (optional)
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={400} aria-label="A note about this payment" className={`${field} block w-full`} style={serif} />
      </label>
      <div className="mt-3"><Btn tone="primary" disabled={busy} onClick={save}>Record it</Btn></div>
      {errors.send && <p className="text-xs text-[#B85838] mt-2" role="alert">{errors.send}</p>}
      {said && <p className="text-xs text-[#2F5D50] mt-2" role="status" data-testid="record-payment-done">{said}</p>}
      <p className="text-xs text-[#5A5751] mt-2" style={serif}>This records money that already came. No money moves in this app.</p>
    </section>
  );
}
