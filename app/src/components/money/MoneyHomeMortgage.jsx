// =============================================================================
// MoneyHomeMortgage — Personal Mortgage Payoff, inside Debt Freedom (Christina,
// 2026-11-03). Reads the EXISTING primary-residence record and its confirmed
// bill (lib/mortgage-payoff.js); edits go back to that same record through the
// shell's updateRental (the synced balance / rate / P&I / escrow columns). No
// projection is drawn until balance, rate and P&I are all on file.
// =============================================================================
import React, { useMemo, useState } from 'react';
import { homeMortgage, payoffScenarios, extraForGoal, HOME_GOAL } from '../../lib/mortgage-payoff.js';
import { fmt } from '../../lib/format.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const INPUT = `w-full min-h-[36px] px-2.5 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815] text-[0.8125rem] ${FOCUS}`;
const BTN = `min-h-[36px] px-3 py-1.5 text-[0.75rem] font-semibold rounded-full border border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] ${FOCUS}`;
const LABEL = 'block text-[0.6875rem] uppercase tracking-wider text-[#5A5751] mb-1';
const monthName = (ym) => { if (!ym) return '—'; const [y, m] = ym.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }); };
const months = (n) => (n == null ? '—' : `${Math.floor(n / 12)} yr ${n % 12} mo`);

export default function MoneyHomeMortgage({ money }) {
  const { data = {}, currentDate, updateRental } = money || {};
  const cd = useMemo(() => (currentDate instanceof Date ? currentDate : new Date()), [currentDate]);
  const rec = useMemo(() => homeMortgage(data), [data]);
  const scen = useMemo(() => payoffScenarios(rec, cd), [rec, cd]);
  const goal = useMemo(() => extraForGoal(rec, cd), [rec, cd]);
  const [edit, setEdit] = useState(null);
  if (!rec.found) {
    return (
      <section data-testid="home-mortgage" className="bg-white border border-[#E8E4DC] rounded-2xl p-4">
        <h3 className="text-[0.875rem] font-semibold text-[#1A1815]">Personal mortgage payoff</h3>
        <p className="text-[0.8125rem] text-[#5A5751] mt-1">No property is marked as your primary residence yet, so there is nothing to project. Mark your home as owner-occupied in Real Estate.</p>
      </section>
    );
  }
  const start = () => setEdit({ balance: rec.balance || '', rate: rec.rate || '', monthlyPI: rec.monthlyPI || '', escrow: rec.escrow || '' });
  const save = () => {
    const home = (data.inflows.rentals || []).find((r) => r.id === rec.rentalId) || {};
    const n = (x) => (x === '' || !Number.isFinite(Number(x)) ? 0 : Number(x));
    if (updateRental) updateRental(rec.rentalId, { mortgage: { ...(home.mortgage || {}), balance: n(edit.balance), rate: n(edit.rate), monthlyPI: n(edit.monthlyPI), escrow: n(edit.escrow), estimated: false } });
    setEdit(null);
  };
  const facts = [
    ['Mortgage lender', rec.lender || 'not confirmed yet'],
    ['Current balance', rec.balance > 0 ? fmt(rec.balance) : 'missing'],
    ['Required monthly payment', rec.requiredPayment > 0 ? fmt(rec.requiredPayment) : 'missing'],
    ['Principal and interest', rec.monthlyPI > 0 ? fmt(rec.monthlyPI) : 'missing'],
    ['Escrow (taxes and insurance)', rec.escrow > 0 ? fmt(rec.escrow) : 'not on file'],
    ['Interest rate', rec.rate > 0 ? `${rec.rate}%${rec.estimated ? ' (estimated — confirm)' : ''}` : 'missing'],
    ['Remaining term (calculated)', scen && scen.base ? months(scen.base.months) : 'needs balance, rate and P&I'],
    ['Next payment due', rec.nextDue || 'not confirmed yet'],
    ['Overdue', rec.pastDue > 0 ? fmt(rec.pastDue) : (rec.lender ? 'none recorded' : 'not confirmed yet')],
  ];
  return (
    <section data-testid="home-mortgage" className="bg-white border border-[#E8E4DC] rounded-2xl p-4 space-y-3">
      <div>
        <h3 className="text-[0.875rem] font-semibold text-[#1A1815]">Personal mortgage payoff · {rec.property}</h3>
        <p className="text-[0.75rem] text-[#5A5751]">Your primary residence, kept apart from the rental mortgages, business expenses and creditor arrangements.</p>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[0.8125rem]" data-testid="home-mortgage-facts">
        {facts.map(([k, v]) => (<div key={k} className="flex justify-between gap-2 border-b border-[#F0ECE4] py-1"><dt className="text-[#5A5751]">{k}</dt><dd className="text-[#1A1815] text-right">{v}</dd></div>))}
      </dl>
      {rec.missing.length > 0 && <p className="text-[0.75rem] text-[#B45309]" data-testid="home-mortgage-missing">Still needed: {rec.missing.join('; ')}.</p>}
      {!edit && updateRental && <button type="button" className={BTN} onClick={start} data-testid="home-mortgage-edit">Enter or correct the mortgage figures</button>}
      {edit && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-testid="home-mortgage-form">
          {[['balance', 'Current balance'], ['rate', 'Interest rate (%)'], ['monthlyPI', 'Principal and interest per month'], ['escrow', 'Escrow per month']].map(([k, label]) => (
            <label key={k}><span className={LABEL}>{label}</span><input className={INPUT} inputMode="decimal" value={edit[k]} onChange={(e) => setEdit((x) => ({ ...x, [k]: e.target.value }))} data-testid={`home-mortgage-${k}`} /></label>
          ))}
          <div className="sm:col-span-2 flex gap-2"><button type="button" className={BTN} onClick={save} data-testid="home-mortgage-save">Save to the home record</button><button type="button" className="min-h-[36px] px-3 text-[0.75rem] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]" onClick={() => setEdit(null)}>Cancel</button></div>
        </div>
      )}
      {scen && scen.base && (
        <div data-testid="home-mortgage-scenarios">
          <p className="text-[0.8125rem] text-[#1A1815]">At the required payment it is paid off in <strong>{monthName(scen.base.payoffDate)}</strong>, with {fmt(scen.base.totalInterest)} of interest still to pay.</p>
          {goal && (
            <p className="text-[0.8125rem] text-[#1A1815] mt-1" data-testid="home-mortgage-goal">
              {goal.alreadyOnTrack ? `Already on track to be paid off by ${monthName(HOME_GOAL.slice(0, 7))}.` : <>To be paid off by <strong>December 2030</strong>: add <strong>{fmt(goal.extra)}</strong> a month to principal (paid off {monthName(goal.payoffDate)}, saving {fmt(goal.interestSaved)} in interest).</>}
            </p>
          )}
          <table className="w-full text-[0.75rem] mt-2"><caption className="sr-only">Extra principal each month: payoff month, months sooner and interest saved</caption>
            <thead><tr className="text-left text-[#5A5751]"><th scope="col" className="py-1">Extra each month</th><th scope="col">Paid off</th><th scope="col">Sooner by</th><th scope="col" className="text-right">Interest saved</th></tr></thead>
            <tbody>{scen.rows.map((r) => (<tr key={r.extra} className="border-t border-[#F0ECE4]"><td className="py-1">{fmt(r.extra)}</td><td>{monthName(r.payoffDate)}</td><td>{months(r.monthsSaved)}</td><td className="text-right">{fmt(r.interestSaved)}</td></tr>))}</tbody>
          </table>
          <p className="text-[0.6875rem] text-[#5A5751] mt-1">Projections assume the rate stays the same and the extra goes straight to principal. Only pay extra from what Safe to Spend shows as available for extra debt payments.</p>
        </div>
      )}
    </section>
  );
}
