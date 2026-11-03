// =============================================================================
// MoneySetup — Money → Settings: the guided setup for what the books never held
// =============================================================================
// Christina, 2026-10-28: "Create a guided setup process for users to enter:
// paycheck dates and frequency, debt payment due dates, rental income due
// dates, recurring bill dates, tax obligations, savings contributions, minimum
// cash cushion. Do not silently invent missing values."
//
// Each step reads the REAL record it completes (a salary row, a derived debt, a
// door, a tax-calendar item) and writes only data.moneyPlan.settings through
// the shell's setData (lib/money-plan.js patchMoneyPlan stamps updatedAt).
// Recurring bill dates are the existing recurringObligations — the step lists
// them and adds one through the shell's own addRecurring, the same writer the
// Calendar uses, so there is ONE way to make an obligation.
//
// The sync line is honest (P15): "Saved on this device", "Pending
// synchronization" or "Synchronized", from lib/money-plan.js syncStatus over
// the shell's own snapshot marker. It never says synchronized for a change that
// only reached this device.
//
// COLORS ARE CLASSES with midnight twins (lib/theme-css.js). No inline colors.
// =============================================================================
import React, { useMemo, useState } from 'react';
import UiIcon from '../UiIcon.jsx';
import HelpButton from '../HelpButton.jsx';
import { moneySettings, patchMoneyPlan, setupSteps, syncStatus } from '../../lib/money-plan.js';
import { INCOME_FREQUENCIES, perPaycheck, taxAmount } from '../../lib/safe-to-spend.js';
import { fmt } from '../../lib/format.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const CARD = 'bg-white border border-[#E8E4DC] rounded-2xl p-4 sm:p-5';
const INPUT = 'min-h-[36px] px-2.5 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815] text-[0.8125rem]';
const BTN = `min-h-[36px] px-3 py-1.5 text-[0.75rem] font-semibold rounded-full border border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838] ${FOCUS}`;
const SERIF = { fontFamily: '"Fraunces", serif' };

function readMarker() { try { return localStorage.getItem('poe-snapshot-marker'); } catch (_) { return null; } }
const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

function SetupStep({ st, id, isOpen, toggle, children }) {
  return (
    <section data-testid={`setup-step-${id}`} data-done={st.done ? 'true' : 'false'} className={`${CARD} ${st.applies ? '' : 'opacity-70'}`}>
      <button type="button" onClick={toggle} aria-expanded={isOpen} className={`w-full min-h-[36px] flex items-center gap-3 text-left ${FOCUS}`}>
        <span aria-hidden="true" className={`w-7 h-7 rounded-full border-2 grid place-items-center text-[0.75rem] shrink-0 ${st.done ? 'bg-[#5A6E3D] border-[#5A6E3D] text-white' : 'border-[#B45309] text-[#B45309]'}`}><UiIcon name={st.done ? 'check' : 'pencil'} /></span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm text-[#1A1815] font-semibold" style={SERIF}>{st.label}</span>
          <span className="block text-[0.6875rem] text-[#5A5751]"><span className={`inline-block px-1.5 rounded border text-[0.5625rem] uppercase tracking-[0.12em] mr-1 ${st.required ? 'border-[#B85838] text-[#B85838]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{st.required ? 'Required' : 'Optional'}</span>{st.applies ? (st.done ? 'Entered' : `Missing: ${st.missing.join(', ')}`) : 'Does not apply to these books yet'} <span aria-hidden="true">·</span> {st.why}</span>
        </span>
        <span aria-hidden="true" className="text-[#5A5751]"><UiIcon name={isOpen ? 'chevronUp' : 'chevronDown'} /></span>
      </button>
      {isOpen && <div className="mt-4 space-y-3">{children}</div>}
    </section>
  );
}

export default function MoneySetup({ money }) {
  const { data = {}, setData, derivedDebts = [], cloud = false, addRecurring, setBooksView } = money || {};
  const settings = moneySettings(data);
  const setup = useMemo(() => setupSteps(data, { debts: derivedDebts }), [data, derivedDebts]);
  const sync = syncStatus({ cloud, marker: readMarker(), updatedAt: data.moneyPlan && data.moneyPlan.updatedAt });
  const save = (patch) => setData && setData((d) => ({ ...d, moneyPlan: patchMoneyPlan(d.moneyPlan, { settings: patch }) }));
  const saveNested = (key, id, value) => save({ [key]: { ...(settings[key] || {}), [id]: value } });
  const [open, setOpen] = useState(() => (setup.steps.find((s) => s.applies && !s.done) || setup.steps[0]).id);
  const by = Object.fromEntries(setup.steps.map((s) => [s.id, s]));

  const salaries = (data.inflows && data.inflows.salaries) || [];
  const rentals = ((data.inflows && data.inflows.rentals) || []).filter((r) => (Number(r.rent) || 0) > 0);
  const obligations = (data.recurringObligations || []).filter((o) => o && o.enabled !== false);
  const taxItems = (data.taxCalendar || []).filter((t) => t && t.applies);
  const accounts = data.accounts || [];
  const [newBill, setNewBill] = useState({ name: '', amount: '', frequency: 'monthly', nextDue: '', entityId: (data.entities && data.entities[0] && data.entities[0].id) || '' });
  const [billError, setBillError] = useState('');
  const addBill = () => {
    if (!newBill.name.trim()) { setBillError('Name the bill.'); return; }
    const amt = Number(newBill.amount);
    if (!isFinite(amt) || amt <= 0) { setBillError('Enter the amount (more than 0).'); return; }
    if (!newBill.nextDue) { setBillError('Enter the next due date — a bill with no date cannot be placed on the timeline.'); return; }
    setBillError('');
    if (addRecurring) addRecurring({ name: newBill.name.trim(), amount: amt, frequency: newBill.frequency, nextDue: newBill.nextDue, entityId: newBill.entityId || null, category: 'other' });
    setNewBill({ ...newBill, name: '', amount: '', nextDue: '' });
  };

  const Step = ({ id, children }) => <SetupStep st={by[id]} id={id} isOpen={open === id} toggle={() => setOpen(open === id ? null : id)}>{children}</SetupStep>;

  return (
    <div data-testid="money-setup" className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg text-[#1A1815] font-semibold flex items-center gap-2" style={SERIF}>Guided setup <HelpButton variant="inline" topic="books:settings" /></h2>
        <span className="text-[0.75rem] text-[#5A5751]"><strong className="text-[#1A1815]">{setup.done}</strong> of {setup.applicable} entered</span>
        <span className="flex-1" />
        <span data-testid="setup-sync-status" data-state={sync.state} className={`inline-flex items-center gap-1.5 text-[0.6875rem] px-2.5 py-1 rounded-full border ${sync.state === 'synced' ? 'border-[#5A6E3D] text-[#5A6E3D]' : sync.state === 'pending' ? 'border-[#B45309] text-[#B45309]' : 'border-[#5A5751] text-[#5A5751]'}`} title={sync.detail}>
          <span aria-hidden="true"><UiIcon name={sync.state === 'synced' ? 'check' : 'pin'} /></span>{sync.label}
        </span>
      </div>
      <div data-testid="setup-progress" className="space-y-1">
        <div className="h-2 rounded-full bg-[#E8E4DC] overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={setup.percent} aria-label="Guided setup progress">
          <div className="h-full bg-[#5A6E3D]" style={{ width: `${setup.percent}%` }} />
        </div>
        <div data-testid="setup-essentials" data-complete={setup.essentialsComplete ? 'true' : 'false'} className="text-[0.75rem] text-[#1A1815]">
          {setup.essentialsComplete
            ? <span><span aria-hidden="true" className="text-[#5A6E3D]"><UiIcon name="check" /></span> The essentials are complete ({setup.essentialsDone} of {setup.essentials}). Safe to Spend has its shape; the optional steps sharpen it whenever you have the figures.</span>
            : <span><strong>{setup.essentialsDone} of {setup.essentials}</strong> essential steps entered. The essentials are the paycheck schedule, your recurring bills and the cash cushion; everything else is optional.</span>}
        </div>
      </div>
      <p className="text-[0.8125rem] text-[#5A5751] leading-relaxed">Safe to Spend lays every bill, payment and paycheck on the calendar. These are the dates and figures the books never held. Nothing here is guessed: a step left empty stays visibly missing on the Overview.</p>
      <p className="text-[0.6875rem] text-[#5A5751]">{sync.detail}</p>

      <Step id="paychecks">
        {salaries.length === 0 && <p className="text-[0.8125rem] text-[#5A5751]">No salary rows in the books. Add income on Accounts → Entities, or on Big Picture.</p>}
        {salaries.map((s) => {
          const cur = settings.incomeSchedule[s.id] || {};
          const monthly = Number(s.actual != null ? s.actual : s.expected) || 0;
          return (
            <div key={s.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-end border-t border-[#E8E4DC] pt-3">
              <div className="text-[0.8125rem] text-[#1A1815]">{s.source || 'Salary'}{s.who ? ` (${s.who})` : ''}<span className="block text-[0.625rem] text-[#5A5751]">{fmt(monthly)} per month entered</span></div>
              <label className="text-[0.625rem] text-[#5A5751]">Frequency
                <select value={cur.frequency || ''} onChange={(e) => saveNested('incomeSchedule', s.id, { ...cur, frequency: e.target.value })} className={`${INPUT} block mt-0.5`} aria-label={`${s.source || 'Salary'} pay frequency`}>
                  <option value="">Choose</option>
                  {INCOME_FREQUENCIES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </label>
              <label className="text-[0.625rem] text-[#5A5751]">Next pay date
                <input type="date" value={cur.nextDate || ''} onChange={(e) => saveNested('incomeSchedule', s.id, { ...cur, nextDate: e.target.value })} className={`${INPUT} block mt-0.5`} aria-label={`${s.source || 'Salary'} next pay date`} />
              </label>
              <label className="text-[0.625rem] text-[#5A5751]">Per paycheck
                <input type="number" inputMode="decimal" value={cur.amount != null ? cur.amount : ''} placeholder={cur.frequency ? String(Math.round(perPaycheck(monthly, cur.frequency))) : ''} onChange={(e) => saveNested('incomeSchedule', s.id, { ...cur, amount: e.target.value === '' ? null : Number(e.target.value) })} className={`${INPUT} block mt-0.5 w-28`} aria-label={`${s.source || 'Salary'} amount per paycheck`} />
              </label>
            </div>
          );
        })}
      </Step>

      <Step id="debt-due">
        {derivedDebts.filter((d) => d.source !== 'rental').length === 0 && <p className="text-[0.8125rem] text-[#5A5751]">No debts with a minimum payment. Add one on Debt Freedom → Debts.</p>}
        {derivedDebts.filter((d) => d.source !== 'rental').map((d) => {
          const acct = accounts.find((a) => a.id === d.accountId) || {};
          const cur = settings.debtDueDays[d.id] || acct.dueDay || '';
          return (
            <div key={d.id} className="flex flex-wrap items-center gap-3 border-t border-[#E8E4DC] pt-3">
              <div className="flex-1 min-w-0 text-[0.8125rem] text-[#1A1815] truncate">{d.name}<span className="block text-[0.625rem] text-[#5A5751]">minimum {fmt(d.minPayment)} <span aria-hidden="true">·</span> owed {fmt(d.balance)}{!(d.minPayment > 0) ? ' · no minimum entered (set it on Debts)' : ''}</span></div>
              <label className="text-[0.625rem] text-[#5A5751]">Due day
                <select value={cur} onChange={(e) => saveNested('debtDueDays', d.id, Number(e.target.value) || null)} className={`${INPUT} block mt-0.5`} aria-label={`${d.name} due day of month`}>
                  <option value="">Not set</option>
                  {dayOptions.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
          );
        })}
      </Step>

      <Step id="rent-due">
        {rentals.length === 0 ? <p className="text-[0.8125rem] text-[#5A5751]">No income-producing doors in the books.</p> : (
          <label className="text-[0.625rem] text-[#5A5751]">Rent is due on day
            <select value={settings.rentDueDay || ''} onChange={(e) => save({ rentDueDay: Number(e.target.value) || null })} className={`${INPUT} block mt-0.5`} aria-label="Rent due day of month">
              <option value="">Not set</option>
              {dayOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="block mt-1 text-[0.6875rem]">{rentals.length} door{rentals.length === 1 ? '' : 's'} <span aria-hidden="true">·</span> rent counts on its day at the amount actually collected.</span>
          </label>
        )}
      </Step>

      <Step id="mortgage-due">
        {!derivedDebts.some((d) => d.source === 'rental') ? <p className="text-[0.8125rem] text-[#5A5751]">No mortgages on file.</p> : (
          <label className="text-[0.625rem] text-[#5A5751]">Mortgages are due on day
            <select value={settings.mortgageDueDay || ''} onChange={(e) => save({ mortgageDueDay: Number(e.target.value) || null })} className={`${INPUT} block mt-0.5`} aria-label="Mortgage due day of month">
              <option value="">Not set</option>
              {dayOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}
      </Step>

      <Step id="bills">
        <ul className="text-[0.8125rem] text-[#1A1815] divide-y divide-[#E8E4DC]">
          {obligations.map((o) => <li key={o.id} className="py-1.5 flex justify-between gap-2"><span className="min-w-0 truncate">{o.name} <span className="text-[#5A5751]">{o.frequency} <span aria-hidden="true">·</span> next {o.nextDue || 'no date'}</span></span><span style={SERIF}>{fmt(o.amount)}</span></li>)}
        </ul>
        {obligations.length === 0 && <p className="text-[0.8125rem] text-[#5A5751]">No recurring obligations yet. Add the first below, or on Bills → Calendar.</p>}
        <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-end border-t border-[#E8E4DC] pt-3">
          <label className="text-[0.625rem] text-[#5A5751] col-span-2 sm:col-span-1">Bill
            <input value={newBill.name} onChange={(e) => setNewBill({ ...newBill, name: e.target.value })} className={`${INPUT} block mt-0.5 w-full`} aria-label="New bill name" />
          </label>
          <label className="text-[0.625rem] text-[#5A5751]">Amount
            <input type="number" inputMode="decimal" value={newBill.amount} onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })} className={`${INPUT} block mt-0.5 w-24`} aria-label="New bill amount" />
          </label>
          <label className="text-[0.625rem] text-[#5A5751]">Every
            <select value={newBill.frequency} onChange={(e) => setNewBill({ ...newBill, frequency: e.target.value })} className={`${INPUT} block mt-0.5`} aria-label="New bill frequency">
              {['weekly', 'biweekly', 'monthly', 'quarterly', 'semi-annual', 'annual', 'biennial'].map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label className="text-[0.625rem] text-[#5A5751]">Next due
            <input type="date" value={newBill.nextDue} onChange={(e) => setNewBill({ ...newBill, nextDue: e.target.value })} className={`${INPUT} block mt-0.5`} aria-label="New bill next due date" />
          </label>
          <button type="button" onClick={addBill} className={BTN} disabled={!addRecurring} title={addRecurring ? 'Add this bill' : 'Adding is not available here'}>Add bill</button>
        </div>
        {billError && <p role="alert" className="text-[0.75rem] text-[#B85838]">{billError}</p>}
        {!addRecurring && <p className="text-[0.6875rem] text-[#5A5751]">Adding is not available in this view; use Bills → Calendar.</p>}
        <button type="button" onClick={() => setBooksView && setBooksView('calendar')} className={`min-h-[36px] text-[0.75rem] text-[#5A5751] hover:text-[#1A1815] ${FOCUS}`}>Edit bills on the Calendar</button>
      </Step>

      <Step id="taxes">
        {taxItems.length === 0 && <p className="text-[0.8125rem] text-[#5A5751]">No tax-calendar items apply.</p>}
        {taxItems.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center gap-3 border-t border-[#E8E4DC] pt-3">
            <div className="flex-1 min-w-0 text-[0.8125rem] text-[#1A1815] truncate">{t.name}<span className="block text-[0.625rem] text-[#5A5751]">{t.month}/{t.day} each year{taxAmount(t, settings) > 0 ? ` · ${fmt(taxAmount(t, settings))}` : ' · no amount entered'}</span></div>
            <label className="text-[0.625rem] text-[#5A5751]">Annual amount
              <input type="number" inputMode="decimal" value={settings.taxAmounts[t.id] != null ? settings.taxAmounts[t.id] : ''} placeholder={t.amount ? String(t.amount) : ''} onChange={(e) => saveNested('taxAmounts', t.id, e.target.value === '' ? null : Number(e.target.value))} className={`${INPUT} block mt-0.5 w-28`} aria-label={`${t.name} annual amount`} />
            </label>
          </div>
        ))}
      </Step>

      <Step id="savings">
        <label className="text-[0.625rem] text-[#5A5751]">Planned savings per month
          <input type="number" inputMode="decimal" value={settings.savingsMonthly != null ? settings.savingsMonthly : ''} onChange={(e) => save({ savingsMonthly: e.target.value === '' ? null : Number(e.target.value) })} className={`${INPUT} block mt-0.5 w-32`} aria-label="Planned savings per month" />
          <span className="block mt-1 text-[0.6875rem]">Reserved before anything is called spendable. Leave it empty and the Goals' required pace is used instead; a goal with no date reserves nothing.</span>
        </label>
      </Step>

      <Step id="cushion">
        <label className="text-[0.625rem] text-[#5A5751]">Minimum cash cushion
          <input type="number" inputMode="decimal" value={settings.minCushion != null ? settings.minCushion : ''} placeholder={data.meta && data.meta.bufferTarget ? String(data.meta.bufferTarget) : ''} onChange={(e) => save({ minCushion: e.target.value === '' ? null : Number(e.target.value) })} className={`${INPUT} block mt-0.5 w-32`} aria-label="Minimum cash cushion" />
          <span className="block mt-1 text-[0.6875rem]">Every projected day must stay above this. Empty means the Buffer Fund target on Accounts ({fmt(Number(data.meta && data.meta.bufferTarget) || 0)}).</span>
        </label>
        <label className="flex items-center gap-2 text-[0.8125rem] text-[#1A1815]">
          <input type="checkbox" checked={settings.includeInferredBills !== false} onChange={(e) => save({ includeInferredBills: e.target.checked })} className="w-4 h-4" />
          Count recurring payments inferred from the ledger (always labeled inferred)
        </label>
        <label className="text-[0.625rem] text-[#5A5751]">Treat the ledger as stale after
          <input type="number" inputMode="numeric" value={settings.staleDays || 14} onChange={(e) => save({ staleDays: Number(e.target.value) || 14 })} className={`${INPUT} block mt-0.5 w-20`} aria-label="Days before the ledger counts as stale" />
          <span className="block mt-1 text-[0.6875rem]">days without a new entry, after which Safe to Spend is labeled an estimate.</span>
        </label>
      </Step>
    </div>
  );
}
