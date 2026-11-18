// money-income-truth.test.jsx — Phase 1.1, income accuracy (Christina
// 2026-11-16: "The 30-day income forecast must show exactly which deposits make
// up the total"; "Distinguish total income expected during the next 30 days
// from income expected before specific bills become due"; "Unconfirmed income
// must be shown separately and must not be treated as guaranteed cash in
// Safe-to-Spend").
//
// Before this change, Coming Up printed "income expected before these are due:
// $X" under each bills line, and X was the SUM of every expected deposit through
// the window's last day — total window income, not income that arrives before
// any bill. Inferred paychecks were walked as cash. These tests pin the new
// contract on a household with every kind of income at once.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { buildSafeToSpend, extraDebtCapacity } from '../lib/safe-to-spend.js';
import { balanceCheckpointRow } from '../lib/financial-engineering.js';
import { cashForecast } from '../lib/cash-forecast.js';
import { paycheckPeriods } from '../lib/money-paychecks.js';
import MoneyComingUp, { incomeNote } from '../components/money/MoneyComingUp.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const TODAY = new Date(2026, 10, 17, 12); // 2026-11-17
const show = (n) => `$${(Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const sum = (xs) => Math.round(xs.reduce((a, x) => a + x, 0) * 100) / 100;

// One household: a confirmed pay schedule (Darrell), a paycheck only the ledger
// shows (inferred, matched to an income source), a deposit typed into the
// register ahead of time, a rental under Poe Properties with no rent day set,
// and three bills on different days.
function household({ confirmInferred = false, withInferredDeposits = true } = {}) {
  const settings = { incomeSchedule: { 's-darrell': { frequency: 'biweekly', nextDate: '2026-11-21', amount: 2099.93 } }, minCushion: 500 };
  if (confirmInferred) settings.incomeSchedule['s-tlc'] = { frequency: 'biweekly', nextDate: '2026-11-19', amount: 1250 };
  const payroll = withInferredDeposits
    ? [
        { id: 'p1', date: '2026-10-08', accountId: 'a-7206', amount: 1250, description: 'TLC THERAPY PAYROLL', category: 'salary' },
        { id: 'p2', date: '2026-10-22', accountId: 'a-7206', amount: 1250, description: 'TLC THERAPY PAYROLL', category: 'salary' },
        { id: 'p3', date: '2026-11-05', accountId: 'a-7206', amount: 1250, description: 'TLC THERAPY PAYROLL', category: 'salary' },
      ]
    : [];
  return {
    meta: {},
    entities: [
      { id: 'e-personal', name: 'Personal', type: 'personal' },
      { id: 'e-props', name: 'Poe Properties', type: 'business' },
    ],
    accounts: [
      { id: 'a-7206', name: 'Chase 7206', fragment: '...7206', type: 'checking', entityId: 'e-personal', balance: 0, isPrimary: true },
      { id: 'a-3322', name: 'Chase 3322', fragment: '...3322', type: 'checking', entityId: 'e-props', balance: 0, isPrimary: true },
    ],
    transactions: [
      { id: 'cp1', ...balanceCheckpointRow('a-7206', 3183.1, '2026-11-17', { basis: 'available', source: 'screenshot chase7206.png' }) },
      { id: 'cp2', ...balanceCheckpointRow('a-3322', 4479.53, '2026-11-17', { basis: 'available', source: 'screenshot chase3322.png' }) },
      ...payroll,
      // typed into the register ahead of time: a confirmed one-time deposit
      { id: 'dep1', date: '2026-11-25', accountId: 'a-7206', amount: 400, description: 'CHURCH STIPEND', category: 'other' },
      // a transfer between own accounts is never income
      {
        id: 'x1',
        date: '2026-11-26',
        accountId: 'a-7206',
        amount: 2201,
        description: 'TRANSFER FROM POE PROPERTIES 3322',
        category: 'transfer',
        isTransfer: true,
      },
    ],
    inflows: {
      salaries: [
        { id: 's-darrell', who: 'Darrell', source: 'University of Illinois', expected: 4199.86, actual: 4199.86, entityId: 'e-personal' },
        { id: 's-tlc', who: 'Christina', source: 'TLC Therapy payroll', expected: 2500, actual: 2500, entityId: 'e-personal' },
      ],
      rentals: [{ id: 'r1', name: '1003 Koehn', rent: 950, actual: 950, status: 'paying', entityId: 'e-props', accountId: 'a-3322' }],
    },
    recurringObligations: [
      { id: 'b-early', name: 'Phone', amount: 120, frequency: 'monthly', nextDue: '2026-11-18', entityId: 'e-personal', accountId: 'a-7206', enabled: true },
      { id: 'b-mid', name: 'BG & Mom', amount: 750, frequency: 'monthly', nextDue: '2026-11-22', entityId: 'e-personal', accountId: 'a-7206', enabled: true },
      {
        id: 'b-late',
        name: 'Car insurance',
        amount: 180,
        frequency: 'monthly',
        nextDue: '2026-12-05',
        entityId: 'e-personal',
        accountId: 'a-7206',
        enabled: true,
      },
    ],
    moneyPlan: { settings },
  };
}
const run = (data, scope = 'personal', period = '30d') => buildSafeToSpend(data, { currentDate: TODAY, period, scope, settings: data.moneyPlan.settings });

describe('every projected deposit is named, with its source, date, entity, account, frequency and status', () => {
  it('the 30-day income list is the total, and the total splits into confirmed + not confirmed to the cent', () => {
    const w = run(household()).windows.income30;
    expect(w.items.length).toBeGreaterThan(0);
    expect(w.total).toBe(sum(w.items.map((i) => i.amount)));
    expect(w.confirmed).toBe(sum(w.items.filter((i) => i.confirmed).map((i) => i.amount)));
    expect(w.unconfirmed).toBe(sum(w.items.filter((i) => !i.confirmed).map((i) => i.amount)));
    expect(sum([w.confirmed, w.unconfirmed])).toBe(w.total);
    expect(w.through).toBe('2026-12-17');
    for (const it of w.items) {
      expect(it.date > '2026-11-17').toBe(true); // from tomorrow
      expect(it.date <= '2026-12-17').toBe(true);
      expect(typeof it.label).toBe('string');
      expect(['confirmed', 'inferred', 'date-assumed']).toContain(it.status);
      expect(it.frequency).toBeTruthy();
    }
  });
  it('a confirmed pay schedule, an inferred paycheck and a typed deposit each carry their own status', () => {
    const items = run(household()).windows.income30.items;
    const darrell = items.filter((i) => /University of Illinois/.test(i.label));
    expect(darrell.map((i) => i.date)).toEqual(['2026-11-21', '2026-12-05']);
    expect(darrell.every((i) => i.status === 'confirmed' && i.frequency === 'biweekly' && i.entityId === 'e-personal')).toBe(true);
    const tlc = items.filter((i) => /TLC Therapy payroll/.test(i.label));
    expect(tlc.map((i) => i.date)).toEqual(['2026-11-19', '2026-12-03', '2026-12-17']);
    expect(tlc.every((i) => i.status === 'inferred' && !i.confirmed && i.accountId === 'a-7206' && i.accountName === 'Chase 7206')).toBe(true);
    expect(tlc[0].statusNote).toMatch(/inferred from 3 deposits/);
    const typed = items.find((i) => i.label === 'CHURCH STIPEND');
    expect(typed).toMatchObject({ date: '2026-11-25', amount: 400, status: 'confirmed', frequency: 'once', accountName: 'Chase 7206' });
  });
  it('a transfer between own accounts is never in the income list (PROVEN TO CATCH: the $2,201 transfer)', () => {
    const items = run(household()).windows.income90.items;
    expect(items.some((i) => /TRANSFER/.test(i.label))).toBe(false);
    expect(items.some((i) => i.amount === 2201)).toBe(false);
  });
  it('7, 14, 30, 60 and 90 days are one schedule: each window holds the earlier ones exactly', () => {
    const W = run(household()).windows;
    const keys = (w) => w.items.map((i) => `${i.date}|${i.label}|${i.amount}`);
    const order = [W.income7, W.income14, W.income30, W.income60, W.income90];
    for (let i = 1; i < order.length; i++) {
      expect(keys(order[i]).slice(0, order[i - 1].items.length)).toEqual(keys(order[i - 1]));
      expect(order[i].total).toBeGreaterThanOrEqual(order[i - 1].total);
    }
  });
  it('rent with no rent day is shown as amount-on-file, day assumed — in Poe Properties, never in Personal', () => {
    const personal = run(household()).windows.income30.items;
    expect(personal.some((i) => /Rent/.test(i.label))).toBe(false);
    const props = run(household(), 'e-props').windows.income30.items.filter((i) => /Rent/.test(i.label));
    expect(props.length).toBe(1);
    expect(props[0]).toMatchObject({
      date: '2026-12-01',
      amount: 950,
      status: 'date-assumed',
      confirmed: false,
      entityId: 'e-props',
      accountName: 'Chase 3322',
    });
  });
});

describe('income before each bill is its own calculation, not the window total', () => {
  it('for each bill: the bills due by its date and the income that arrives from tomorrow through that date', () => {
    const r = run(household());
    const before = r.windows.billsBefore30.items;
    const income = r.windows.income30.items;
    expect(before.map((b) => b.label)).toEqual(['Phone', 'BG & Mom', 'Car insurance']);
    for (const b of before) {
      const arrived = income.filter((i) => i.date <= b.date);
      expect(b.confirmedIncomeBy).toBe(sum(arrived.filter((i) => i.confirmed).map((i) => i.amount)));
      expect(b.unconfirmedIncomeBy).toBe(sum(arrived.filter((i) => !i.confirmed).map((i) => i.amount)));
    }
    // Phone is due tomorrow: nothing has arrived yet.
    expect(before[0]).toMatchObject({ date: '2026-11-18', billsThrough: 120, confirmedIncomeBy: 0, unconfirmedIncomeBy: 0 });
    // BG & Mom on the 22nd: Darrell's 11-21 pay has arrived (confirmed); the inferred 11-19 TLC pay is apart.
    expect(before[1]).toMatchObject({ date: '2026-11-22', billsThrough: 870, confirmedIncomeBy: 2099.93, unconfirmedIncomeBy: 1250 });
    // The window total is NOT any bill's "before" figure (PROVEN TO CATCH: the old label).
    expect(before.every((b) => b.confirmedIncomeBy + b.unconfirmedIncomeBy < r.windows.income30.total)).toBe(true);
  });
  it('the bills line says what the figure is: income in the window, split confirmed / not confirmed — never "before these are due"', () => {
    const W = run(household()).windows;
    const note = incomeNote(W.income30, show, 30);
    expect(note).not.toMatch(/before these are due/);
    expect(note).toBe(
      `income expected in the next 30 days: ${show(W.income30.total)} (${show(W.income30.confirmed)} confirmed, ${show(W.income30.unconfirmed)} not confirmed)`
    );
  });
});

describe('unconfirmed income is never counted as cash in Safe to Spend', () => {
  it('Safe to Spend is identical whether or not the inferred paycheck exists (PROVEN TO CATCH)', () => {
    const withIt = run(household());
    const without = run(household({ withInferredDeposits: false }));
    expect(withIt.lines.unconfirmedIncome).toBeGreaterThan(0);
    expect(withIt.safeToSpendNow).toBe(without.safeToSpendNow);
    expect(withIt.lines.projectedLowest).toEqual(without.lines.projectedLowest);
    expect(withIt.timeline.map((t) => t.cash)).toEqual(without.timeline.map((t) => t.cash));
    expect(withIt.items.some((i) => i.kind === 'income' && i.inferred)).toBe(false);
  });
  it('confirmed income counts on its day; unconfirmed is shown beside it with what Safe to Spend would read if it arrives', () => {
    const r = run(household());
    expect(r.lines.expectedIncome).toBe(sum(r.items.filter((i) => i.kind === 'income').map((i) => i.amount)));
    expect(r.lines.unconfirmedIncome).toBe(sum(r.unconfirmedIncomeItems.map((i) => i.amount)));
    const what = r.lines.ifUnconfirmedArrives;
    expect(what.income).toBe(r.lines.unconfirmedIncome);
    expect(what.lowest.amount).toBeGreaterThanOrEqual(r.lines.projectedLowest.amount);
    expect(what.safeToSpend).toBeGreaterThanOrEqual(r.safeToSpendNow);
    expect(r.confidence.reasons.join(' ')).toMatch(/of expected income is not confirmed, so it is left out of Safe to Spend/);
  });
  it('extra-toward-debt capacity is built on confirmed income only', () => {
    const a = extraDebtCapacity(household(), { currentDate: TODAY, period: '14d', scope: 'personal' });
    const b = extraDebtCapacity(household({ withInferredDeposits: false }), { currentDate: TODAY, period: '14d', scope: 'personal' });
    expect(a.amount).toBe(b.amount);
  });
  it('confirming the inferred pay schedule makes it confirmed income, counted once', () => {
    const before = run(household());
    const tlc = before.windows.income30.items.find((i) => /TLC Therapy payroll/.test(i.label));
    expect(tlc.confirm).toEqual({ salaryId: 's-tlc', frequency: 'biweekly', nextDate: '2026-11-19', amount: 1250 });
    const after = run(household({ confirmInferred: true }));
    const counted = after.items.filter((i) => i.kind === 'income' && /TLC Therapy payroll/.test(i.label));
    expect(counted.map((i) => i.date)).toEqual(['2026-11-19', '2026-12-03', '2026-12-17']);
    expect(after.unconfirmedIncomeItems.some((i) => /TLC/.test(i.label))).toBe(false);
    expect(after.lines.unconfirmedIncome).toBe(0);
    expect(after.lines.expectedIncome).toBe(sum([before.lines.expectedIncome, 1250 * 3]));
  });
  it('the paycheck budget still cuts its periods at an unconfirmed payday, labeled inferred', () => {
    const p = paycheckPeriods(household(), { currentDate: TODAY, scope: 'personal', horizonDays: 30 });
    expect(p.paydays).toContain('2026-11-19');
    expect(p.periods.find((x) => x.start === '2026-11-19').inferredIncome).toBe(true);
  });
  it('the 30/60/90 cash forecast leaves unconfirmed income out of its balances and totals it apart', () => {
    const fc = cashForecast(household(), { currentDate: TODAY, scope: 'personal' });
    expect(fc.unconfirmedIncome[30]).toBe(3750);
    expect(fc.totals.w30).toBe(fc.engineAt[30]);
    const without = cashForecast(household({ withInferredDeposits: false }), { currentDate: TODAY, scope: 'personal' });
    expect(fc.totals.w90).toBe(without.totals.w90);
  });
});

describe('Coming Up on a phone', () => {
  let root;
  let host;
  afterEach(() => {
    if (root) act(() => root.unmount());
    if (host) host.remove();
    root = null;
    host = null;
  });
  async function render(data, handlers = {}) {
    const result = buildSafeToSpend(data, { currentDate: TODAY, period: '14d', scope: 'personal', settings: data.moneyPlan.settings });
    const extra = extraDebtCapacity(data, { currentDate: TODAY, period: '14d', scope: 'personal' });
    host = document.createElement('div');
    host.style.width = '360px';
    document.body.appendChild(host);
    await act(async () => {
      root = createRoot(host);
      root.render(
        createElement(MoneyComingUp, { result, extra, show, entities: data.entities, settings: data.moneyPlan.settings, data, asOf: TODAY, ...handlers })
      );
    });
    return { host, result };
  }
  it('lists every deposit for the chosen window and never says "before these are due"', async () => {
    const { host: h, result } = await render(household());
    expect(h.textContent).not.toMatch(/before these are due/);
    expect(h.querySelector('[data-testid="coming-up-income"] summary').textContent).toMatch(/Expected income \(next 30 days\)/);
    expect(h.querySelectorAll('[data-testid="income-item"]').length).toBe(result.windows.income30.items.length);
    expect(h.querySelector('[data-testid="income-total"]').textContent).toBe(show(result.windows.income30.total));
    expect(h.querySelector('[data-testid="income-confirmed"]').textContent).toBe(show(result.windows.income30.confirmed));
    expect(h.querySelector('[data-testid="income-unconfirmed"]').textContent).toBe(show(result.windows.income30.unconfirmed));
    await act(async () => {
      h.querySelector('[data-testid="income-horizon-90"]').click();
    });
    expect(h.querySelectorAll('[data-testid="income-item"]').length).toBe(result.windows.income90.items.length);
    expect(h.querySelector('[data-testid="income-total"]').textContent).toBe(show(result.windows.income90.total));
  });
  it('shows income arriving before each bill, and Confirm saves the pay schedule the deposits show', async () => {
    const saved = [];
    const { host: h } = await render(household(), { onConfirmIncome: (c) => saved.push(c) });
    expect(h.querySelectorAll('[data-testid="bills-before-item"]').length).toBe(3);
    expect(h.querySelector('[data-testid="bills-before-list"]').textContent).toMatch(
      /confirmed income arriving by then: \$2,099\.93 \(\+\$1,250\.00 not confirmed\)/
    );
    const btns = h.querySelectorAll('[data-testid="income-confirm-s-tlc"]');
    expect(btns.length).toBeGreaterThan(0);
    await act(async () => {
      btns[0].click();
    });
    expect(saved).toEqual([{ salaryId: 's-tlc', frequency: 'biweekly', nextDate: '2026-11-19', amount: 1250 }]);
  });
  it('the Safe to Spend line says it counts confirmed income only and what it would read if the rest arrives', async () => {
    const { host: h, result } = await render(household());
    const note = h.querySelector('[data-testid="coming-up-safe"] summary').textContent;
    expect(note).toMatch(/confirmed income only/);
    expect(note).toContain(show(result.lines.ifUnconfirmedArrives.safeToSpend));
  });
});

// Christina 2026-11-17: the browser showed "$3,200 of unconfirmed income" on
// Safe to Spend beside "$0 not confirmed" in the 30-day list. Both were right:
// Safe to Spend's window ran to the next payday, one day past the list. Every
// unconfirmed dollar is now traceable to its deposit, date, account, status and
// the window it falls in, and the two figures reconcile to the cent.
describe('the Safe to Spend unconfirmed figure reconciles with the income lists', () => {
  it('a window longer than 30 days: unconfirmed = the 30-day list + the deposits after it, each one named', () => {
    const data = household();
    const r = buildSafeToSpend(data, { currentDate: TODAY, period: 'custom', customEnd: '2026-12-31', scope: 'personal', settings: data.moneyPlan.settings });
    const what = r.lines.ifUnconfirmedArrives;
    const w30 = r.windows.income30;
    expect(what.through).toBe('2026-12-31');
    expect(what.income).toBe(r.lines.unconfirmedIncome);
    expect(what.income).toBe(sum(what.items.map((i) => i.amount)));
    const after = what.items.filter((i) => i.date > w30.through);
    expect(after.length).toBeGreaterThan(0);
    expect(what.income).toBe(sum([w30.unconfirmed, ...after.map((i) => i.amount)]));
    for (const it of what.items) {
      expect(it.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(it.accountName).toBe('Chase 7206');
      expect(it.status).toBe('inferred');
      expect(it.frequency).toBe('biweekly');
      expect(it.statusNote).toMatch(/inferred from 3 deposits/);
    }
  });
});
