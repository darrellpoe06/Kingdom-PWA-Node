// =============================================================================
// MoneySections — the first tab of Budget, Bills, Goals, Debt Freedom, Reports
// =============================================================================
// Christina, 2026-10-28 (Phase 2). Each section's own first tab is a real-data
// view assembled from engines the app already trusts; the legacy sub-tabs the
// section groups (Calendar, Subscriptions, Owed, Debts, Taxes, 1099s, Plan) are
// one tap away on the section's tab row (lib/money-nav.js) and mount exactly as
// before. Nothing here is painted (P15): every number traces to a record, and
// an empty state says what is missing and where to fill it.
//
//   · Budget      — category plan vs month-to-date spend (lib/budget-engine.js),
//                   with transfers, debt payments and balance adjustments kept
//                   OUT of "spent" (the inventory's defect 1), and the Safe-to-
//                   Spend reserves beside it so money is not reserved twice.
//   · Bills       — every dated obligation the engine lays on the timeline for
//                   the next 60 days, confirmed and inferred told apart, grouped
//                   by kind (essential · debt · subscription · business ·
//                   property), with a month view and a list view.
//   · Goals       — the existing BudgetPlanner (goals + guidance), reused whole.
//   · Debt Freedom — snowball vs avalanche vs custom vs minimums-only, from the
//                   CORRECTED engine (lib/debt-freedom.js, DR-1270), never the
//                   legacy projectors the Debts tab still reads.
//   · Reports     — the finance report library (lib/finance-reports.js) over the
//                   ledger, CSV / print through the existing ReportActions.
//
// Writes: Bills' "mark paid / scheduled / needs review" is a note in
// data.moneyPlan.billStatus (the family's own word on an occurrence); it never
// edits a transaction. COLORS ARE CLASSES with midnight twins (theme-css.js).
// =============================================================================
import React, { useMemo, useState } from 'react';
import UiIcon from '../UiIcon.jsx';
import HelpButton from '../HelpButton.jsx';
import ReportActions from '../ReportActions.jsx';
import BudgetPlanner from '../BudgetPlanner.jsx';
import { buildSafeToSpend } from '../../lib/safe-to-spend.js';
import { moneySettings, patchMoneyPlan } from '../../lib/money-plan.js';
import { deriveCategoryPlans, categoryStatus, dataConfidence } from '../../lib/budget-engine.js';
import { compareStrategies, thisMonthPayments, STRATEGIES, INTEREST_METHODS } from '../../lib/debt-freedom.js';
import { financePresets } from '../../lib/finance-reports.js';
import { isTransferTxn, isBalanceAdjustment } from '../../lib/imported-view.js';
import { fmt } from '../../lib/format.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const CARD = 'bg-white border border-[#E8E4DC] rounded-2xl p-4 sm:p-5';
const EYEBROW = 'text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold';
const SERIF = { fontFamily: '"Fraunces", serif' };
const CHIP = `min-h-[36px] px-3 py-1.5 text-[0.75rem] rounded-full border transition-colors ${FOCUS}`;
const CHIP_ON = 'poe-selected bg-[#1A1815] text-white border-[#1A1815]';
const CHIP_OFF = 'bg-white text-[#5A5751] border-[#E8E4DC] hover:bg-[#FAF8F4] hover:text-[#1A1815]';

function Title({ children, topic }) {
  return <h2 className="text-lg text-[#1A1815] font-semibold flex items-center gap-2" style={SERIF}>{children}{topic && <HelpButton variant="inline" topic={topic} />}</h2>;
}

// ── Budget ───────────────────────────────────────────────────────────────────
const NOT_SPEND = new Set(['transfer', 'debt-payment', 'balance-adjustment', 'salary', 'rental-income']);
function spendRows(txns) {
  return (txns || []).filter((t) => t && !isTransferTxn(t) && !isBalanceAdjustment(t) && !NOT_SPEND.has(String(t.category || '').toLowerCase()));
}
function monthKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }

export function MoneyBudget({ money }) {
  const { data = {}, setData, currentDate, derivedDebts = [], visibleEntities = null } = money || {};
  const cd = useMemo(() => (currentDate instanceof Date ? currentDate : new Date()), [currentDate]);
  const settings = moneySettings(data);
  const [month, setMonth] = useState(monthKey(cd));
  const [threshold, setThreshold] = useState(0.15);
  const asOf = useMemo(() => { const [y, m] = month.split('-').map(Number); const now = monthKey(cd) === month ? cd : new Date(y, m, 0); return now; }, [month, cd]);
  const plans = useMemo(() => (data.moneyPlan && data.moneyPlan.budgets && data.moneyPlan.budgets[month] ? data.moneyPlan.budgets[month].categories || {} : {}), [data.moneyPlan, month]);
  const rows = useMemo(() => {
    const txns = spendRows(data.transactions);
    const planMap = deriveCategoryPlans(txns, { currentDate: asOf, overrides: plans });
    const spent = {};
    for (const t of txns) { if (String(t.date).slice(0, 7) !== month) continue; const a = Number(t.amount) || 0; if (a >= 0) continue; const c = t.category || 'other'; spent[c] = Math.round(((spent[c] || 0) + Math.abs(a)) * 100) / 100; }
    return categoryStatus(planMap, spent, { currentDate: asOf, threshold });
  }, [data.transactions, asOf, month, plans, threshold]);
  const confidence = useMemo(() => dataConfidence(data), [data]);
  const sts = useMemo(() => buildSafeToSpend(data, { currentDate: cd, period: '30d', scope: settings.scope || 'personal', settings, visibleEntities }), [data, cd, settings, visibleEntities]);
  const setPlan = (cat, value) => setData && setData((d) => {
    const prev = (d.moneyPlan && d.moneyPlan.budgets) || {};
    const cur = prev[month] || { categories: {} };
    const categories = { ...(cur.categories || {}) };
    if (value === '' || value == null) delete categories[cat]; else categories[cat] = Number(value);
    return { ...d, moneyPlan: patchMoneyPlan(d.moneyPlan, { budgets: { [month]: { ...cur, categories } } }) };
  });
  const months = useMemo(() => { const out = []; for (let i = 0; i < 6; i++) { const d = new Date(cd.getFullYear(), cd.getMonth() - i, 1); out.push(monthKey(d)); } return out; }, [cd]);
  const totals = rows.reduce((s, r) => ({ plan: s.plan + r.plan, spent: s.spent + r.spent, remaining: s.remaining + r.remaining }), { plan: 0, spent: 0, remaining: 0 });
  const STATUS = { over: ['Over plan', 'text-[#B85838]'], hot: ['Running hot', 'text-[#B45309]'], ok: ['On plan', 'text-[#5A6E3D]'], under: ['Under plan', 'text-[#5A5751]'] };
  return (
    <div data-testid="money-budget" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Title topic="books:budget">Budget</Title>
        <span className="flex-1" />
        <label className="text-[0.625rem] text-[#5A5751]">Month
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="block mt-0.5 min-h-[36px] px-2 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815] text-[0.8125rem]" aria-label="Budget month">
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="text-[0.625rem] text-[#5A5751]">Warn at
          <select value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="block mt-0.5 min-h-[36px] px-2 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815] text-[0.8125rem]" aria-label="Over-plan warning threshold">
            {[0.05, 0.1, 0.15, 0.25].map((t) => <option key={t} value={t}>{Math.round(t * 100)}% over</option>)}
          </select>
        </label>
      </div>
      <p className="text-[0.8125rem] text-[#5A5751] leading-relaxed">Planned is your own number for the month; a blank plan falls back to the three-month average of real spending in that category. Actual is this month's ledger spending, with transfers, debt payments and balance adjustments left out so nothing is counted twice. {confidence.level !== 'high' ? `Ledger confidence is ${confidence.level}: ${confidence.message}` : 'The ledger looks complete and categorized.'}</p>
      <div className="grid grid-cols-3 gap-3">
        {[['Planned', totals.plan], ['Actual', totals.spent], ['Remaining', totals.remaining]].map(([l, v]) => (
          <div key={l} className={CARD}><div className={EYEBROW}>{l}</div><div className="mt-1 text-xl text-[#1A1815]" style={SERIF}>{fmt(v)}</div></div>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className={`${CARD} text-[0.8125rem] text-[#5A5751]`}>No categorized spending for {month} yet. Categorize rows on Transactions, or set a plan below to start the month on purpose.</p>
      ) : (
        <div className={`${CARD} overflow-x-auto`}>
          <table className="w-full text-[0.8125rem]">
            <caption className="sr-only">Category plan versus actual for {month}</caption>
            <thead><tr className="text-left text-[0.5625rem] uppercase tracking-[0.18em] text-[#5A5751]"><th scope="col" className="py-1 pr-2">Category</th><th scope="col" className="py-1 pr-2">Planned</th><th scope="col" className="py-1 pr-2">Actual</th><th scope="col" className="py-1 pr-2">Remaining</th><th scope="col" className="py-1">Status</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.category} className="border-t border-[#E8E4DC]">
                  <th scope="row" className="py-2 pr-2 font-normal text-[#1A1815]">{r.category}<span className="block text-[0.625rem] text-[#5A5751]">{r.source === 'user' ? 'your plan' : 'three-month average'}</span></th>
                  <td className="py-2 pr-2"><input type="number" inputMode="decimal" value={plans[r.category] != null ? plans[r.category] : ''} placeholder={String(Math.round(r.plan))} onChange={(e) => setPlan(r.category, e.target.value)} aria-label={`Planned amount for ${r.category}`} className="min-h-[36px] w-24 px-2 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815]" /></td>
                  <td className="py-2 pr-2 text-[#1A1815]" style={SERIF}>{fmt(r.spent)}</td>
                  <td className="py-2 pr-2 text-[#1A1815]" style={SERIF}>{fmt(r.remaining)}<div className="mt-1 h-1.5 w-24 rounded-full bg-[#E8E4DC] overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, r.pctOfPlan || 0)} aria-label={`${r.category} progress`}><div className={`h-full ${r.status === 'over' ? 'bg-[#B85838]' : 'bg-[#5A6E3D]'}`} style={{ width: `${Math.min(100, r.pctOfPlan || 0)}%` }} /></div></td>
                  <td className={`py-2 ${STATUS[r.status][1]}`}>{STATUS[r.status][0]}<span className="block text-[0.625rem] text-[#5A5751]">run-rate {fmt(r.projected)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className={CARD}>
        <div className={EYEBROW}>Reserved before spending (next 30 days, Safe to Spend)</div>
        <dl className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[0.75rem]">
          {[['Bills and debt payments', sts.lines.billsDue + sts.lines.debtMinimums], ['Savings', sts.lines.savingsReserved], ['Taxes', sts.lines.taxesReserved], ['Cash cushion', sts.lines.minCushion]].map(([l, v]) => (
            <div key={l}><dt className="text-[#5A5751]">{l}</dt><dd className="text-[#1A1815]" style={SERIF}>{fmt(v)}</dd></div>
          ))}
        </dl>
        <p className="mt-2 text-[0.6875rem] text-[#5A5751]">These are held by the engine, not by a category — a bill that is also a category plan is counted once, as the dated bill. {derivedDebts.length} debt{derivedDebts.length === 1 ? '' : 's'} carry minimums.</p>
      </div>
    </div>
  );
}

// ── Bills ────────────────────────────────────────────────────────────────────
const BILL_GROUPS = [
  ['essential', 'Essential bills'], ['debt', 'Debt payments'], ['subscription', 'Subscriptions'], ['business', 'Business expenses'], ['property', 'Property expenses'], ['transfer', 'Transfers'], ['other', 'Other'],
];
const STATUSES = ['scheduled', 'paid', 'overdue', 'canceled', 'needs-review'];
function groupOf(it, data) {
  if (it.kind === 'debt-min') return 'debt';
  if (it.kind === 'mortgage') return 'property';
  if (it.kind === 'tax') return 'essential';
  const cat = String(it.category || '').toLowerCase();
  if (/subscr|stream|software|membership/.test(cat) || it.kind === 'inferred-bill' && /netflix|spotify|hulu|prime|subscription/i.test(it.label)) return 'subscription';
  if (/housing|utilit|insurance|phone|grocer|medical|vehicle|compliance|tax/.test(cat)) return 'essential';
  const ent = (data.entities || []).find((e) => e.id === it.entityId);
  if (ent && ent.type === 'business') return (data.inflows && data.inflows.rentals || []).some((r) => r.entityId === ent.id) ? 'property' : 'business';
  return it.kind === 'bill' || it.kind === 'inferred-bill' ? 'essential' : 'other';
}

export function MoneyBills({ money }) {
  const { data = {}, setData, currentDate, visibleEntities = null } = money || {};
  const cd = useMemo(() => (currentDate instanceof Date ? currentDate : new Date()), [currentDate]);
  const settings = moneySettings(data);
  const [view, setView] = useState('list');
  const end = useMemo(() => { const d = new Date(cd); d.setDate(d.getDate() + 60); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }, [cd]);
  const result = useMemo(() => buildSafeToSpend(data, { currentDate: cd, period: 'custom', customEnd: end, scope: 'consolidated', settings, visibleEntities }), [data, cd, end, settings, visibleEntities]);
  const statuses = useMemo(() => (data.moneyPlan && data.moneyPlan.billStatus) || {}, [data.moneyPlan]);
  const today = `${cd.getFullYear()}-${String(cd.getMonth() + 1).padStart(2, '0')}-${String(cd.getDate()).padStart(2, '0')}`;
  const items = useMemo(() => result.items.filter((it) => it.kind !== 'income').map((it) => {
    const key = `${it.refId || it.label}:${it.date}`;
    const note = statuses[key];
    const status = note ? note.status : (it.date < today ? 'overdue' : 'scheduled');
    return { ...it, key, status, group: groupOf(it, data), confirmed: it.source !== 'inferred' };
  }), [result.items, statuses, today, data]);
  const setStatus = (key, status) => setData && setData((d) => ({ ...d, moneyPlan: patchMoneyPlan(d.moneyPlan, { billStatus: { [key]: { status, at: new Date().toISOString() } } }) }));
  const accountName = (id) => ((data.accounts || []).find((a) => a.id === id) || {}).name || '';
  const entityName = (id) => ((data.entities || []).find((e) => e.id === id) || {}).name || '—';
  const byGroup = BILL_GROUPS.map(([id, label]) => [id, label, items.filter((it) => it.group === id)]).filter(([, , list]) => list.length);
  const byDay = useMemo(() => { const m = new Map(); for (const it of items) { if (!m.has(it.date)) m.set(it.date, []); m.get(it.date).push(it); } return m; }, [items]);
  const inferredCount = items.filter((it) => !it.confirmed).length;
  return (
    <div data-testid="money-bills" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Title topic="books:bills">Bills and recurring payments</Title>
        <span className="flex-1" />
        <div role="group" aria-label="Bills view" className="flex gap-1.5">
          <button type="button" onClick={() => setView('list')} aria-pressed={view === 'list'} className={`${CHIP} ${view === 'list' ? CHIP_ON : CHIP_OFF}`}>List</button>
          <button type="button" onClick={() => setView('calendar')} aria-pressed={view === 'calendar'} className={`${CHIP} ${view === 'calendar' ? CHIP_ON : CHIP_OFF}`}>Calendar</button>
        </div>
      </div>
      <p className="text-[0.8125rem] text-[#5A5751] leading-relaxed">The next 60 days, every entity. <strong className="text-[#1A1815]">Confirmed</strong> items come from your recurring obligations, debt minimums, mortgages and the tax calendar; <strong className="text-[#1A1815]">inferred</strong> items are rhythms detected in the ledger and stay labeled until you confirm them on the Calendar. A mortgage or utility is never filed as a subscription. {inferredCount ? `${inferredCount} inferred.` : ''}</p>
      {items.length === 0 && <p className={`${CARD} text-[0.8125rem] text-[#5A5751]`}>Nothing is due in the next 60 days from what the books hold. Add recurring obligations on the Calendar tab, or set due days in Settings so debt minimums land on their day.</p>}
      {view === 'list' ? byGroup.map(([id, label, list]) => (
        <section key={id} aria-labelledby={`bills-${id}`} className={CARD}>
          <h3 id={`bills-${id}`} className={EYEBROW}>{label} <span aria-hidden="true">·</span> {fmt(list.reduce((s, it) => s + Math.abs(it.amount), 0))}</h3>
          <ul className="mt-2 divide-y divide-[#E8E4DC]">
            {list.map((it) => (
              <li key={it.key} className="py-2 flex flex-wrap items-center gap-2 text-[0.8125rem]">
                <span className="w-[5.5rem] shrink-0 text-[#5A5751]">{it.date}</span>
                <span className="min-w-0 flex-1 truncate text-[#1A1815]">{it.label}<span className="block text-[0.625rem] text-[#5A5751]">{it.confirmed ? 'confirmed' : 'inferred'}{it.cadence ? ` · ${it.cadence}` : ''} <span aria-hidden="true">·</span> {entityName(it.entityId)}{it.accountId ? ` · ${accountName(it.accountId)}` : ''}</span></span>
                <span className="shrink-0 text-[#1A1815]" style={SERIF}>{fmt(Math.abs(it.amount))}</span>
                <select value={it.status} onChange={(e) => setStatus(it.key, e.target.value)} aria-label={`Status of ${it.label} on ${it.date}`} className={`min-h-[36px] px-2 rounded-lg border text-[0.75rem] bg-white ${it.status === 'overdue' ? 'border-[#B85838] text-[#B85838]' : it.status === 'paid' ? 'border-[#5A6E3D] text-[#5A6E3D]' : 'border-[#E8E4DC] text-[#1A1815]'}`}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
                </select>
              </li>
            ))}
          </ul>
        </section>
      )) : (
        <div className={CARD}>
          <ol className="grid grid-cols-7 gap-1 text-[0.6875rem]">
            {Array.from({ length: 61 }, (_, i) => { const d = new Date(cd); d.setDate(d.getDate() + i); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; const list = byDay.get(key) || []; return (
              <li key={key} className={`min-h-[3.5rem] rounded-lg border p-1 ${list.length ? 'border-[#1A1815] bg-[#FAF8F4]' : 'border-[#E8E4DC]'}`}>
                <div className="text-[#5A5751]">{d.getDate() === 1 || i === 0 ? key.slice(5) : d.getDate()}</div>
                {list.map((it) => <div key={it.key} className="truncate text-[#1A1815]" title={`${it.label} ${fmt(Math.abs(it.amount))}`}>{fmt(Math.abs(it.amount))}{it.confirmed ? '' : ' ?'}</div>)}
              </li>
            ); })}
          </ol>
          <p className="mt-2 text-[0.625rem] text-[#5A5751]">A question mark marks an inferred rhythm.</p>
        </div>
      )}
    </div>
  );
}

// ── Goals ────────────────────────────────────────────────────────────────────
export function MoneyGoals({ money }) {
  const { data = {}, currentDate } = money || {};
  const scope = moneySettings(data).scope || 'consolidated';
  return (
    <div data-testid="money-goals" className="space-y-4">
      <Title topic="books:goals">Goals</Title>
      <p className="text-[0.8125rem] text-[#5A5751] leading-relaxed">Save toward a target or pay off a linked debt. Actual balances come from the ledger; a planned contribution is a plan, never money already set aside. Planned savings here are the pace Safe to Spend reserves when no monthly figure is entered in Settings.</p>
      <BudgetPlanner data={data} currentDate={currentDate} scope={scope === 'personal' ? 'consolidated' : scope} months={12} />
    </div>
  );
}

// ── Debt Freedom ─────────────────────────────────────────────────────────────
// The corrected engine (lib/debt-freedom.js). The plan's own settings — the
// strategy, a custom order, the recurring extra, one-time payments, per-debt
// interest method / promo / fee, and "paid off" marks — live in
// data.moneyPlan.debtPlan and never touch an account or a transaction. Every
// payment the table shows is PROJECTED; the actual pace beside it is what the
// ledger has seen (deriveDebts payPace). Safe to Spend's figure is offered as a
// what-if lump sum, applied to the projection only.
const METHOD_WORDS = { daily: 'daily', monthly: 'monthly', none: '0%' };
export function MoneyDebtFreedom({ money }) {
  const { data = {}, setData, derivedDebts = [], currentDate, debtSnowballExtra = 0, setBooksView, visibleEntities = null } = money || {};
  const cd = useMemo(() => (currentDate instanceof Date ? currentDate : new Date()), [currentDate]);
  const settings = moneySettings(data);
  const plan = useMemo(() => ({ strategy: 'snowball', customOrder: [], extraMonthly: Number(debtSnowballExtra) || 0, oneTime: [], overrides: {}, ...((data.moneyPlan && data.moneyPlan.debtPlan) || {}) }), [data.moneyPlan, debtSnowballExtra]);
  const savePlan = (patch) => setData && setData((d) => ({ ...d, moneyPlan: patchMoneyPlan(d.moneyPlan, { debtPlan: { ...((d.moneyPlan && d.moneyPlan.debtPlan) || {}), ...patch } }) }));
  const saveOverride = (id, patch) => savePlan({ overrides: { ...(plan.overrides || {}), [id]: { ...((plan.overrides || {})[id] || {}), ...patch } } });
  const [whatIfLump, setWhatIfLump] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [newLump, setNewLump] = useState({ month: monthKey(new Date(cd.getFullYear(), cd.getMonth() + 1, 1)), amount: '', debtId: '' });
  const startDate = useMemo(() => new Date(cd.getFullYear(), cd.getMonth() + 1, 1), [cd]);
  const oneTime = useMemo(() => [...(plan.oneTime || []), ...(whatIfLump ? [whatIfLump] : [])], [plan.oneTime, whatIfLump]);
  const opts = useMemo(() => ({ startDate, strategy: plan.strategy, customOrder: plan.customOrder || [], extraMonthly: Number(plan.extraMonthly) || 0, oneTime, overrides: plan.overrides || {} }), [startDate, plan, oneTime]);
  const comparison = useMemo(() => compareStrategies(derivedDebts, opts), [derivedDebts, opts]);
  const result = comparison[plan.strategy] || comparison.snowball;
  const sts = useMemo(() => buildSafeToSpend(data, { currentDate: cd, period: settings.defaultPeriod || 'next-paycheck', scope: settings.scope || 'personal', settings, visibleEntities }), [data, cd, settings, visibleEntities]);
  const thisMonth = thisMonthPayments(result);
  const paceOf = (id) => { const d = derivedDebts.find((x) => x.id === id); return d && d.hasPayments ? d.payPace : null; };
  const orderIds = useMemo(() => { const ids = (plan.customOrder || []).filter((id) => result.debts.some((d) => d.id === id)); for (const d of result.debts) if (!ids.includes(d.id)) ids.push(d.id); return ids; }, [plan.customOrder, result.debts]);
  const move = (id, dir) => { const ids = [...orderIds]; const i = ids.indexOf(id); const j = i + dir; if (i < 0 || j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; savePlan({ customOrder: ids, strategy: 'custom' }); };
  const addLump = () => { const amt = Number(newLump.amount); if (!newLump.month || !(amt > 0)) return; savePlan({ oneTime: [...(plan.oneTime || []), { month: newLump.month, amount: amt, debtId: newLump.debtId || null, id: `lump-${Date.now()}` }] }); setNewLump({ ...newLump, amount: '' }); };
  const removeLump = (id) => savePlan({ oneTime: (plan.oneTime || []).filter((l) => l.id !== id) });
  const totalBalance = derivedDebts.reduce((s, d) => s + (Number(d.balance) || 0), 0);
  const label = (r) => (r.cleared ? `${r.debtFreeLabel} (${r.debtFreeMonth} mo)` : r.horizonExhausted ? 'not within 50 years' : '—');
  const months = showAll ? result.months : result.months.slice(0, 24);
  return (
    <div data-testid="money-debt-freedom" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Title topic="books:debt-freedom">Debt Freedom</Title>
        <span className="flex-1" />
        <label className="text-[0.625rem] text-[#5A5751]">Extra per month
          <input type="number" inputMode="decimal" value={plan.extraMonthly} onChange={(e) => savePlan({ extraMonthly: Math.max(0, Number(e.target.value) || 0) })} className="block mt-0.5 min-h-[36px] w-28 px-2 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815]" aria-label="Recurring extra payment per month" />
        </label>
      </div>
      <p className="text-[0.8125rem] text-[#5A5751] leading-relaxed">{derivedDebts.length} debt{derivedDebts.length === 1 ? '' : 's'}, {fmt(totalBalance)} owed. Every figure below is a <strong className="text-[#1A1815]">projection</strong> from the plan's own terms: interest by each debt's method, every minimum paid first and capped at what is owed, the extra and every freed minimum rolling to the next debt only once a debt is actually at zero. No balance is changed by this plan.</p>

      {/* Safe to Spend integration */}
      <div data-testid="debt-sts" className="bg-[#FBF7EC] border border-[#C9A227] rounded-2xl p-4 flex flex-wrap items-center gap-3 text-[0.8125rem] text-[#1A1815]">
        <span className="flex-1 min-w-0">Safe to Spend says <strong>{sts.status === 'unavailable' ? 'unavailable' : fmt(sts.safeToSpendNow)}</strong> could go to debt {sts.period.label.toLowerCase()} without touching upcoming obligations or reserves{sts.status === 'estimate' ? ' (an estimate — see the Overview)' : ''}.</span>
        {sts.status !== 'unavailable' && sts.safeToSpendNow > 0 && (
          whatIfLump ? <button type="button" onClick={() => setWhatIfLump(null)} className={`${CHIP} ${CHIP_ON}`}>Remove the what-if payment</button>
            : <button type="button" data-testid="debt-sts-try" onClick={() => setWhatIfLump({ month: monthKey(startDate), amount: sts.safeToSpendNow, id: 'what-if' })} className={`${CHIP} ${CHIP_OFF}`}>Try it as a one-time payment next month</button>
        )}
      </div>

      <div role="group" aria-label="Repayment strategy" className="flex flex-wrap gap-1.5">
        {STRATEGIES.map((st) => <button key={st.id} type="button" data-testid={`strategy-${st.id}`} onClick={() => savePlan({ strategy: st.id })} aria-pressed={plan.strategy === st.id} className={`${CHIP} ${plan.strategy === st.id ? CHIP_ON : CHIP_OFF}`}>{st.label}</button>)}
      </div>

      {/* Comparison */}
      <div className={`${CARD} overflow-x-auto`}>
        <table className="w-full text-[0.8125rem]">
          <caption className="sr-only">Repayment strategies compared</caption>
          <thead><tr className="text-left text-[0.5625rem] uppercase tracking-[0.18em] text-[#5A5751]"><th scope="col" className="py-1 pr-2">Strategy</th><th scope="col" className="py-1 pr-2">Debt-free (projected)</th><th scope="col" className="py-1 pr-2">Projected interest</th><th scope="col" className="py-1 pr-2">Total paid</th><th scope="col" className="py-1">Order</th></tr></thead>
          <tbody>
            {[...STRATEGIES.map((st) => [st.id, st.label, st.note]), ['minimums-only', 'Minimums only', 'No extra, nothing rolled.']].map(([id, lbl, note]) => { const r = comparison[id]; return (
              <tr key={id} className={`border-t border-[#E8E4DC] ${plan.strategy === id ? 'bg-[#FAF8F4]' : ''}`}>
                <th scope="row" className="py-2 pr-2 font-normal text-[#1A1815]">{lbl}</th>
                <td className="py-2 pr-2 text-[#1A1815]" style={SERIF}>{result.debts.length ? label(r) : '—'}</td>
                <td className="py-2 pr-2 text-[#1A1815]" style={SERIF}>{result.debts.length ? fmt(r.totalInterest) : '—'}</td>
                <td className="py-2 pr-2 text-[#1A1815]" style={SERIF}>{result.debts.length ? fmt(r.totalPaid) : '—'}</td>
                <td className="py-2 text-[#5A5751]">{note}</td>
              </tr>
            ); })}
          </tbody>
        </table>
        {comparison.avalanche.cleared && comparison.snowball.cleared && (
          <p className="mt-2 text-[0.6875rem] text-[#5A5751]">Avalanche saves {fmt(Math.max(0, comparison.snowball.totalInterest - comparison.avalanche.totalInterest))} of interest over snowball on these debts; snowball clears its first debt sooner.</p>
        )}
      </div>

      {/* Custom order */}
      {plan.strategy === 'custom' && result.debts.length > 0 && (
        <div className={CARD} data-testid="debt-custom-order">
          <div className={EYEBROW}>Your order (first is attacked first)</div>
          <ol className="mt-2 divide-y divide-[#E8E4DC]">
            {orderIds.map((id, i) => { const d = result.debts.find((x) => x.id === id); return (
              <li key={id} className="py-1.5 flex items-center gap-2 text-[0.8125rem] text-[#1A1815]">
                <span className="w-6 text-[#5A5751]">{i + 1}.</span>
                <span className="flex-1 min-w-0 truncate">{d.name}<span className="text-[#5A5751]"> · {fmt(d.startBalance)} at {d.apr}%</span></span>
                <button type="button" onClick={() => move(id, -1)} disabled={i === 0} aria-label={`Move ${d.name} up`} className={`min-h-[36px] min-w-[36px] rounded-lg border border-[#E8E4DC] text-[#1A1815] hover:bg-[#FAF8F4] disabled:opacity-40 ${FOCUS}`}><UiIcon name="chevronUp" /></button>
                <button type="button" onClick={() => move(id, 1)} disabled={i === orderIds.length - 1} aria-label={`Move ${d.name} down`} className={`min-h-[36px] min-w-[36px] rounded-lg border border-[#E8E4DC] text-[#1A1815] hover:bg-[#FAF8F4] disabled:opacity-40 ${FOCUS}`}><UiIcon name="chevronDown" /></button>
              </li>
            ); })}
          </ol>
        </div>
      )}

      {/* This month: what to pay toward each debt */}
      {thisMonth.length > 0 && (
        <div className={`${CARD} overflow-x-auto`} data-testid="debt-this-month">
          <div className={EYEBROW}>{result.months[0].label} <span aria-hidden="true">·</span> what to pay toward each debt (projected)</div>
          <table className="w-full text-[0.8125rem] mt-2">
            <caption className="sr-only">This month's projected payment per debt beside the actual pace seen in the ledger</caption>
            <thead><tr className="text-left text-[0.5625rem] uppercase tracking-[0.18em] text-[#5A5751]"><th scope="col" className="py-1 pr-2">Debt</th><th scope="col" className="py-1 pr-2">Minimum</th><th scope="col" className="py-1 pr-2">Extra</th><th scope="col" className="py-1 pr-2">One-time</th><th scope="col" className="py-1 pr-2">Pay this month</th><th scope="col" className="py-1">Actual pace seen</th></tr></thead>
            <tbody>
              {thisMonth.map((r) => (
                <tr key={r.debtId} className="border-t border-[#E8E4DC]">
                  <th scope="row" className="py-2 pr-2 font-normal text-[#1A1815]">{r.name}{r.paidOff ? <span className="text-[#5A6E3D]"> · clears this month</span> : null}</th>
                  <td className="py-2 pr-2 text-[#1A1815]" style={SERIF}>{fmt(r.minimum)}</td>
                  <td className="py-2 pr-2 text-[#1A1815]" style={SERIF}>{fmt(r.extra)}</td>
                  <td className="py-2 pr-2 text-[#1A1815]" style={SERIF}>{fmt(r.lump)}</td>
                  <td className="py-2 pr-2 text-[#1A1815] font-semibold" style={SERIF}>{fmt(r.total)}</td>
                  <td className="py-2 text-[#5A5751]">{paceOf(r.debtId) != null ? `${fmt(paceOf(r.debtId))}/mo (ledger)` : 'no payments seen'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Each debt */}
      <div className={`${CARD} overflow-x-auto`}>
        <div className={EYEBROW}>Each debt under {STRATEGIES.find((st) => st.id === plan.strategy).label.toLowerCase()}</div>
        {result.debts.length === 0 && result.excluded.length === 0 && <p className="mt-2 text-[0.8125rem] text-[#5A5751]">No debts in the books. Add one on the Debts tab.</p>}
        {result.debts.length > 0 && (
          <table className="w-full text-[0.8125rem] mt-2">
            <caption className="sr-only">Each debt's terms and projected payoff</caption>
            <thead><tr className="text-left text-[0.5625rem] uppercase tracking-[0.18em] text-[#5A5751]"><th scope="col" className="py-1 pr-2">Creditor</th><th scope="col" className="py-1 pr-2">Balance</th><th scope="col" className="py-1 pr-2">Rate · method</th><th scope="col" className="py-1 pr-2">Minimum</th><th scope="col" className="py-1 pr-2">Due</th><th scope="col" className="py-1 pr-2">Projected payoff</th><th scope="col" className="py-1 pr-2">Projected interest</th><th scope="col" className="py-1">Terms</th></tr></thead>
            <tbody>
              {result.debts.map((d) => { const o = (plan.overrides || {})[d.id] || {}; return (
                <tr key={d.id} className="border-t border-[#E8E4DC] align-top">
                  <th scope="row" className="py-2 pr-2 font-normal text-[#1A1815]">{d.name}<span className="block text-[0.625rem] text-[#5A5751]">{d.type}{d.variable ? ' · variable rate' : ''}{d.promo ? ` · promo ${d.promo.apr}% until ${d.promo.until}` : ''}</span></th>
                  <td className="py-2 pr-2 text-[#1A1815]" style={SERIF}>{fmt(d.startBalance)}</td>
                  <td className="py-2 pr-2 text-[#1A1815]">{d.apr}% <span className="text-[#5A5751]">· {METHOD_WORDS[d.method] || d.method}</span></td>
                  <td className="py-2 pr-2 text-[#1A1815]" style={SERIF}>{fmt(d.minPayment)}</td>
                  <td className="py-2 pr-2 text-[#1A1815]">{d.dueDay ? `day ${d.dueDay}` : <button type="button" onClick={() => setBooksView && setBooksView('settings')} className={`text-[0.75rem] text-[#B85838] underline min-h-[36px] ${FOCUS}`}>set</button>}</td>
                  <td className="py-2 pr-2 text-[#1A1815]">{d.cleared ? `${d.payoffLabel} (month ${d.payoffMonth})` : 'beyond horizon'}</td>
                  <td className="py-2 pr-2 text-[#1A1815]" style={SERIF}>{fmt(d.interestPaid)}{d.feesPaid > 0 ? ` + ${fmt(d.feesPaid)} fees` : ''}</td>
                  <td className="py-2">
                    <details>
                      <summary className={`cursor-pointer text-[0.75rem] text-[#5A5751] min-h-[36px] inline-flex items-center ${FOCUS}`}>Edit</summary>
                      <div className="mt-1 grid gap-1.5 text-[0.625rem] text-[#5A5751] min-w-[12rem]">
                        <label>Interest method<select value={o.method || d.method} onChange={(e) => saveOverride(d.id, { method: e.target.value })} aria-label={`${d.name} interest method`} className="block mt-0.5 min-h-[36px] px-2 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815]">{INTEREST_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
                        <label>Promo APR<input type="number" inputMode="decimal" value={o.promo && o.promo.apr != null ? o.promo.apr : ''} onChange={(e) => saveOverride(d.id, { promo: { ...(o.promo || {}), apr: e.target.value === '' ? null : Number(e.target.value) } })} aria-label={`${d.name} promotional APR`} className="block mt-0.5 min-h-[36px] w-24 px-2 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815]" /></label>
                        <label>Promo until<input type="date" value={(o.promo && o.promo.until) || ''} onChange={(e) => saveOverride(d.id, { promo: { ...(o.promo || {}), until: e.target.value } })} aria-label={`${d.name} promotional rate end date`} className="block mt-0.5 min-h-[36px] px-2 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815]" /></label>
                        <label>Monthly fee<input type="number" inputMode="decimal" value={o.monthlyFee != null ? o.monthlyFee : ''} onChange={(e) => saveOverride(d.id, { monthlyFee: e.target.value === '' ? null : Number(e.target.value) })} aria-label={`${d.name} monthly fee`} className="block mt-0.5 min-h-[36px] w-24 px-2 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815]" /></label>
                        <label className="flex items-center gap-2 text-[0.75rem] text-[#1A1815]"><input type="checkbox" checked={!!o.variable} onChange={(e) => saveOverride(d.id, { variable: e.target.checked })} className="w-4 h-4" />Variable rate (dates are approximate)</label>
                        <button type="button" onClick={() => saveOverride(d.id, { paidOff: true })} className={`${CHIP} ${CHIP_OFF} justify-self-start`}>Mark paid off (history kept)</button>
                      </div>
                    </details>
                  </td>
                </tr>
              ); })}
            </tbody>
          </table>
        )}
        {result.excluded.length > 0 && (
          <div className="mt-3 text-[0.75rem] text-[#5A5751]">
            <div className={EYEBROW}>Not in this plan</div>
            <ul className="mt-1 space-y-0.5">
              {result.excluded.map((d) => <li key={d.id} className="flex flex-wrap items-center gap-2"><span className="text-[#1A1815]">{d.name}</span> <span aria-hidden="true">·</span> {d.reason}{d.reason === 'marked paid off' ? <button type="button" onClick={() => saveOverride(d.id, { paidOff: false })} className={`${CHIP} ${CHIP_OFF}`}>Put back</button> : d.reason === 'interest rate not known' || d.reason === 'no minimum payment entered' ? <button type="button" onClick={() => setBooksView && setBooksView('debts')} className={`${CHIP} ${CHIP_OFF}`}>Add terms on Debts</button> : null}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* One-time payments */}
      <div className={CARD} data-testid="debt-one-time">
        <div className={EYEBROW}>One-time additional payments</div>
        {(plan.oneTime || []).length > 0 && (
          <ul className="mt-2 divide-y divide-[#E8E4DC] text-[0.8125rem]">
            {(plan.oneTime || []).map((l) => <li key={l.id} className="py-1.5 flex items-center gap-2"><span className="flex-1 text-[#1A1815]">{l.month} <span aria-hidden="true">·</span> {fmt(l.amount)} <span className="text-[#5A5751]">to {l.debtId ? ((result.debts.find((d) => d.id === l.debtId) || result.excluded.find((d) => d.id === l.debtId) || {}).name || l.debtId) : 'the strategy order'}</span></span><button type="button" onClick={() => removeLump(l.id)} aria-label={`Remove the ${fmt(l.amount)} payment in ${l.month}`} className={`${CHIP} ${CHIP_OFF}`}>Remove</button></li>)}
          </ul>
        )}
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-[auto_auto_1fr_auto] gap-2 items-end">
          <label className="text-[0.625rem] text-[#5A5751]">Month<input type="month" value={newLump.month} onChange={(e) => setNewLump({ ...newLump, month: e.target.value })} aria-label="One-time payment month" className="block mt-0.5 min-h-[36px] px-2 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815]" /></label>
          <label className="text-[0.625rem] text-[#5A5751]">Amount<input type="number" inputMode="decimal" value={newLump.amount} onChange={(e) => setNewLump({ ...newLump, amount: e.target.value })} aria-label="One-time payment amount" className="block mt-0.5 min-h-[36px] w-28 px-2 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815]" /></label>
          <label className="text-[0.625rem] text-[#5A5751]">Toward<select value={newLump.debtId} onChange={(e) => setNewLump({ ...newLump, debtId: e.target.value })} aria-label="One-time payment target debt" className="block mt-0.5 min-h-[36px] px-2 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815]"><option value="">The strategy's next debt</option>{result.debts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
          <button type="button" onClick={addLump} className={`min-h-[36px] px-3 py-1.5 text-[0.75rem] font-semibold rounded-full bg-[#1A1815] text-white hover:bg-[#B85838] ${FOCUS}`}>Add payment</button>
        </div>
      </div>

      {/* Schedule */}
      {result.months.length > 0 && (
        <div className={`${CARD} overflow-x-auto`} data-testid="debt-schedule">
          <div className="flex items-center justify-between gap-2"><div className={EYEBROW}>Month-by-month schedule (projected)</div>{result.months.length > 24 && <button type="button" onClick={() => setShowAll(!showAll)} className={`${CHIP} ${CHIP_OFF}`}>{showAll ? 'Show the first 24 months' : `Show all ${result.months.length} months`}</button>}</div>
          <table className="w-full text-[0.75rem] mt-2">
            <caption className="sr-only">Projected payments per month</caption>
            <thead><tr className="text-left text-[0.5625rem] uppercase tracking-[0.18em] text-[#5A5751]"><th scope="col" className="py-1 pr-2">Month</th><th scope="col" className="py-1 pr-2">Paid</th><th scope="col" className="py-1 pr-2">Interest</th><th scope="col" className="py-1 pr-2">Balance after</th><th scope="col" className="py-1">Per debt</th></tr></thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.month} className="border-t border-[#E8E4DC] align-top">
                  <th scope="row" className="py-1.5 pr-2 font-normal text-[#1A1815]">{m.label}</th>
                  <td className="py-1.5 pr-2 text-[#1A1815]" style={SERIF}>{fmt(m.totalPaid)}</td>
                  <td className="py-1.5 pr-2 text-[#1A1815]" style={SERIF}>{fmt(m.totalInterest)}</td>
                  <td className="py-1.5 pr-2 text-[#1A1815]" style={SERIF}>{fmt(m.totalBalance)}</td>
                  <td className="py-1.5 text-[#5A5751]">{m.payments.map((r) => `${r.name} ${fmt(r.minimum + r.extra + r.lump)}${r.paidOff ? ' (paid off)' : ''}${r.missed ? ' (missed)' : ''}`).join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button type="button" onClick={() => setBooksView && setBooksView('debts')} className={`min-h-[36px] px-3 py-1.5 text-[0.75rem] font-semibold rounded-full bg-[#1A1815] text-white hover:bg-[#B85838] ${FOCUS}`}>Edit debts, rates and minimums</button>
    </div>
  );
}

// ── Reports ──────────────────────────────────────────────────────────────────
export function MoneyReports({ money }) {
  const { data = {}, setView, setBooksView } = money || {};
  const rows = useMemo(() => {
    const accounts = new Map((data.accounts || []).map((a) => [a.id, a]));
    return (data.transactions || []).filter((t) => t && t.date).map((t) => ({ id: t.id, posted: t.date, institution: (accounts.get(t.accountId) || {}).name || '', name: t.description || '', category: t.category || '', amount: Number(t.amount) || 0, isTransfer: !!t.isTransfer }));
  }, [data.transactions, data.accounts]);
  const meta = { generatedAt: new Date().toISOString().slice(0, 10), rowCount: rows.length };
  const presets = useMemo(() => financePresets(rows, meta, {}), [rows, meta.rowCount]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div data-testid="money-reports" className="space-y-4">
      <Title topic="books:reports">Reports</Title>
      <p className="text-[0.8125rem] text-[#5A5751] leading-relaxed">Every report reads the ledger as it stands ({rows.length} rows). Download CSV or print any of them; the Imported tab carries the same library with its own filters, and Forecast carries the forward projection.</p>
      <div className={CARD}>
        <ul className="divide-y divide-[#E8E4DC]">
          {presets.map((p) => (
            <li key={p.key} className="py-2 flex flex-wrap items-center gap-2 text-[0.8125rem]">
              <span className="min-w-0 flex-1 text-[#1A1815]">{p.label}{p.hint ? <span className="block text-[0.625rem] text-[#5A5751]">{p.hint}</span> : null}</span>
              <ReportActions buildModel={p.buildModel} filenameBase={p.filenameBase} label="" />
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setBooksView && setBooksView('imported')} className={`${CHIP} ${CHIP_OFF}`}>Filtered reports (Imported)</button>
        <button type="button" onClick={() => setBooksView && setBooksView('taxes')} className={`${CHIP} ${CHIP_OFF}`}>Tax years</button>
        <button type="button" onClick={() => setBooksView && setBooksView('k1099')} className={`${CHIP} ${CHIP_OFF}`}>1099 contractors</button>
        {setView && <button type="button" onClick={() => setView('forecast')} className={`${CHIP} ${CHIP_OFF}`}>Forecast and scenarios</button>}
      </div>
      <span className="sr-only"><UiIcon name="folder" /></span>
    </div>
  );
}
