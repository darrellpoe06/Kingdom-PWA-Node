// =============================================================================
// RentPay — "I'm paying" for the tenant, "How tenants pay you" for the family
// (DR-0899, migration 0262)
// =============================================================================
// Darrell, 2026-10-10: "The tenants can say they paying right not take them to
// cashapp or zelle and other options... even cash... put it in Chase bank",
// "Full rent or percentage of rent... the notes for the following remaining
// amount and when it will be paid... keeping the historical events", and
// "Date and timestamps for everything possible... so we can recreate a
// situation".
//
// THE ORDER IS THE POINT: the record is written FIRST (amount, method, what was
// due, what remains, when the rest is promised, a note, this device's clock),
// THEN the tenant is handed to Cash App or Venmo with the amount filled in, or
// shown the landlord's own words for Zelle, cash, a bank deposit or a check.
// A tenant who never comes back from Cash App has still told us. No money
// moves here (DR-0094); the family confirms when it lands.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { boundedRead } from '../../lib/bounded-read.js';
import { loadPayeeForTenancy, loadRentPayee, saveRentPayee } from './cloud.js';
import {
  PAY_METHODS, methodsOffered, payLink, payInstruction, rentDue, buildRentReport, dollars,
} from './rent-pay.js';

const serif = { fontFamily: '"Fraunces", Georgia, serif' };
const READ_MS = 8000;
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

/** The tenant's "I'm paying". onReport(row) writes the record and resolves {ok}. */
export function PayRent({ tenancy, rent = [], onReport, openUrl = (u) => window.open(u, '_blank', 'noopener') }) {
  const [payee, setPayee] = useState(undefined);
  const [period, setPeriod] = useState(() => localDay().slice(0, 7));
  const due = useMemo(() => rentDue({ monthlyRent: tenancy?.monthly_rent, rent, period }), [tenancy, rent, period]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [promisedOn, setPromisedOn] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    boundedRead(loadPayeeForTenancy(tenancy?.id), READ_MS).then((r) => { if (live) setPayee(r.ok ? r.payee : null); });
    return () => { live = false; };
  }, [tenancy]);
  useEffect(() => { setAmount(due.remaining > 0 ? due.remaining.toFixed(2) : ''); }, [due.remaining]);

  const offered = methodsOffered(payee);
  const choices = offered.length ? offered : PAY_METHODS.filter((m) => ['cash', 'zelle', 'cashapp', 'deposit', 'check', 'venmo'].includes(m.id));
  const report = buildRentReport({
    amount, period, method, remainingBefore: due.remaining, promisedOn, note, today: localDay(),
  });
  const chosen = PAY_METHODS.find((m) => m.id === method);
  const link = method ? payLink(method, payee, amount, `Rent ${period}`) : null;

  const send = async () => {
    const built = buildRentReport({
      amount, period, method, remainingBefore: due.remaining, promisedOn, note, today: localDay(), deviceAt: new Date().toISOString(),
    });
    setErrors(built.errors);
    if (!built.ok) return;
    setBusy(true);
    const res = await onReport(built.row);
    setBusy(false);
    if (!res || !res.ok) { setErrors({ send: `Not recorded: ${(res && res.reason) || 'try again'}` }); return; }
    setDone({ ...built, link, instruction: payInstruction(method, payee), label: chosen?.label || method });
    if (link) openUrl(link);
  };

  if (done) {
    return (
      <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="pay-rent-done">
        <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50] mb-2">Recorded</h3>
        <p className="text-sm text-[#1A1815]" style={serif}>
          {dollars(done.row.amount)} for {done.row.for_period} by {done.label}, recorded {new Date().toLocaleString()}.
          {done.partial ? ` ${dollars(done.remainingAfter)} still owed, promised by ${done.row.rest_promised_on}.` : ''}
        </p>
        {done.link && (
          <p className="text-sm mt-2" style={serif}>
            <a href={done.link} target="_blank" rel="noopener noreferrer" className="underline text-[#2F5D50]">Open {done.label} again</a>
          </p>
        )}
        {done.instruction && <p className="text-sm text-[#1A1815] mt-2" style={serif}>{done.instruction}</p>}
        <p className="text-xs text-[#5A5751] mt-2" style={serif}>Your landlord confirms it when it lands. No money moves in this app.</p>
        <div className="mt-2"><Btn onClick={() => { setDone(null); setMethod(''); setNote(''); setPromisedOn(''); }}>Record another</Btn></div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="pay-rent">
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50] mb-2">I&apos;m paying rent</h3>
      <p className="text-sm text-[#1A1815] mb-2" style={serif} data-testid="rent-due">
        {due.due > 0
          ? (due.remaining > 0 ? `${period}: ${dollars(due.due)} due, ${dollars(due.paid)} recorded, ${dollars(due.remaining)} left.` : `${period}: paid in full (${dollars(due.paid)}).`)
          : `${period}: no monthly rent is on record for this door.`}
      </p>
      <div className="flex flex-wrap items-end gap-2 mb-2">
        <label className="text-xs text-[#5A5751]">Amount
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" aria-label="Amount" className={`${field} block w-28`} style={serif} />
        </label>
        <label className="text-xs text-[#5A5751]">For which month
          <input value={period} onChange={(e) => setPeriod(e.target.value)} type="month" aria-label="For which month" className={`${field} block`} style={serif} />
        </label>
      </div>
      {errors.amount && <p className="text-xs text-[#B85838]">{errors.amount}</p>}
      <p className="text-xs text-[#5A5751] mb-1">How are you paying?</p>
      <div className="flex flex-wrap gap-1 mb-2" role="group" aria-label="How are you paying">
        {choices.map((m) => (
          <Btn key={m.id} tone={method === m.id ? 'primary' : 'ghost'} aria-pressed={method === m.id} onClick={() => setMethod(m.id)}>{m.label}</Btn>
        ))}
      </div>
      {payee === null && <p className="text-xs text-[#5A5751] mb-2" style={serif}>Your landlord has not written how to pay in the app yet. You can still record how you paid.</p>}
      {method && !link && payInstruction(method, payee) && (
        <p className="text-sm text-[#1A1815] mb-2" style={serif} data-testid="pay-instruction">{payInstruction(method, payee)}</p>
      )}
      {errors.method && <p className="text-xs text-[#B85838]">{errors.method}</p>}
      {report.partial && (
        <div className="border-l-2 border-[#2F5D50] pl-3 my-2" data-testid="part-payment">
          <p className="text-sm text-[#1A1815]" style={serif}>
            This is part of the rent. {dollars(report.remainingAfter)} will still be owed for {period}.
          </p>
          <label className="block text-xs text-[#5A5751] mt-1">When will you pay the rest?
            <input type="date" value={promisedOn} onChange={(e) => setPromisedOn(e.target.value)} aria-label="When will you pay the rest" className={`${field} block`} min={localDay()} />
          </label>
          {errors.promisedOn && <p className="text-xs text-[#B85838]">{errors.promisedOn}</p>}
        </div>
      )}
      <label className="block text-xs text-[#5A5751] mt-1">A note (optional)
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} aria-label="A note" className={`${field} block w-full`} style={serif} />
      </label>
      <div className="mt-3">
        <Btn tone="primary" disabled={busy} onClick={send}>
          {link ? `Record it and open ${chosen.label}` : 'Record it'}
        </Btn>
      </div>
      {errors.send && <p className="text-xs text-[#B85838] mt-2" role="alert">{errors.send}</p>}
      <p className="text-xs text-[#5A5751] mt-2" style={serif}>
        This records the payment with the date and time, then hands you to the app you pay with. No money moves here; your landlord confirms it when it lands.
      </p>
    </section>
  );
}

const PAYEE_FIELDS = [
  ['cashtag', 'Cash App $cashtag', '$PoeProperties'],
  ['zelle_to', 'Zelle phone or email', '(555) 555-5555'],
  ['venmo', 'Venmo username', '@poe-properties'],
  ['deposit_note', 'Bank deposit (your words, never an account number)', 'Deposit at any Chase branch to Poe Properties LLC'],
  ['cash_note', 'Cash (how it is handed over)', 'Hand it to Darrell and get a receipt'],
  ['check_payable_to', 'Checks payable to', 'Poe Properties LLC'],
];

/** The family's "How tenants pay you". Blank means that way is not offered. */
export function PayeeCard({ instanceId }) {
  const [form, setForm] = useState(null);
  const [said, setSaid] = useState('');
  useEffect(() => {
    let live = true;
    boundedRead(loadRentPayee(instanceId), READ_MS).then((r) => {
      if (!live) return;
      const p = (r.ok && r.payee) || {};
      setForm(Object.fromEntries(PAYEE_FIELDS.map(([k]) => [k, p[k] || ''])));
    });
    return () => { live = false; };
  }, [instanceId]);
  if (!instanceId || !form) return null;
  const save = async () => {
    const r = await saveRentPayee(instanceId, form);
    setSaid(r.ok ? `Saved ${new Date().toLocaleString()}. Tenants see these choices on their Rent tab.` : `Not saved: ${r.reason}`);
  };
  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="payee-card">
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50] mb-2">How tenants pay you</h3>
      <div className="grid sm:grid-cols-2 gap-2">
        {PAYEE_FIELDS.map(([k, label, ph]) => (
          <label key={k} className="text-xs text-[#5A5751]">{label}
            <input value={form[k]} placeholder={ph} aria-label={label} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
              className={`${field} block w-full`} style={serif} />
          </label>
        ))}
      </div>
      <div className="mt-2"><Btn tone="primary" onClick={save}>Save</Btn></div>
      {said && <p className="text-xs text-[#5A5751] mt-2" role="status">{said}</p>}
    </section>
  );
}
