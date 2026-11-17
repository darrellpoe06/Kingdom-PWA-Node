// money-bills-accuracy.test.jsx — Phase 1.2, bills accuracy (Christina
// 2026-11-16, Task 3: "Do not automatically turn repeated purchases at Circle K,
// Walmart, or other merchants into future contractual bills"; "Do not assign
// all credit cards a December 1 due date unless that is their actual confirmed
// due date"; approved 2026-11-17: merchant purchases count against spending
// budgets, real subscriptions are still recognized and verified, debts with no
// confirmed due date sit under "Due date needed" with their known minimum in the
// plan and no fictional date).
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { buildSafeToSpend, extraDebtCapacity, BILL_CLASSES, isMerchantPurchase } from '../lib/safe-to-spend.js';
import { balanceCheckpointRow } from '../lib/financial-engineering.js';
import MoneyComingUp from '../components/money/MoneyComingUp.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const TODAY = new Date(2026, 10, 17, 12); // 2026-11-17
const show = (n) => `$${(Math.round((Number(n) || 0) * 100) / 100).toFixed(2)}`;
const sum = (xs) => Math.round(xs.reduce((a, x) => a + x, 0) * 100) / 100;
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysBefore = (n) => iso(new Date(2026, 10, 17 - n, 12));

function household({ householdFigure = null, visaDueDay = null, statuses = null } = {}) {
  const tx = [{ id: 'cp', ...balanceCheckpointRow('a-7206', 6000, '2026-11-17', { basis: 'available', source: 'screenshot chase7206.png' }) }];
  // Circle K every week for ten weeks, the same $45: the worst case for the old
  // detector (a steady rhythm at a steady amount).
  for (let i = 1; i <= 10; i++) tx.push({ id: `ck${i}`, date: daysBefore(i * 7 - 3), accountId: 'a-7206', amount: -45, description: `CIRCLE K ${1200 + i}` });
  // Walmart once a month, $120, three months.
  for (let i = 1; i <= 3; i++) tx.push({ id: `wm${i}`, date: daysBefore(i * 30 - 10), accountId: 'a-7206', amount: -120, description: 'WALMART SUPERCENTER' });
  // A real subscription and a real utility, monthly.
  for (let i = 1; i <= 3; i++) tx.push({ id: `nf${i}`, date: daysBefore(i * 30 - 12), accountId: 'a-7206', amount: -15.49, description: 'NETFLIX.COM' });
  for (let i = 1; i <= 3; i++) tx.push({ id: `am${i}`, date: daysBefore(i * 30 - 8), accountId: 'a-7206', amount: -140, description: 'AMEREN ILLINOIS' });
  const visa = { id: 'a-visa', name: 'Visa', type: 'credit', entityId: 'e-personal', balance: -1200, minPayment: 60, treatAsDebt: true };
  if (visaDueDay) visa.dueDay = visaDueDay;
  const settings = { minCushion: 500 };
  const moneyPlan = { settings };
  if (statuses) moneyPlan.billStatus = statuses;
  return {
    meta: {},
    entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }],
    accounts: [
      { id: 'a-7206', name: 'Chase 7206', type: 'checking', entityId: 'e-personal', balance: 0, isPrimary: true },
      visa,
      { id: 'a-disc', name: 'Discover', type: 'credit', entityId: 'e-personal', balance: -800, minPayment: 40, dueDay: 20, treatAsDebt: true },
    ],
    transactions: tx,
    outflows: householdFigure != null ? { household: householdFigure } : {},
    inflows: { salaries: [], rentals: [] },
    recurringObligations: [{ id: 'b-phone', name: 'Phone', amount: 120, frequency: 'monthly', nextDue: '2026-11-25', entityId: 'e-personal', accountId: 'a-7206', enabled: true }],
    moneyPlan,
  };
}
const run = (data, period = '30d', currentDate = TODAY) => buildSafeToSpend(data, { currentDate, period, scope: 'personal', settings: data.moneyPlan.settings });
const outs = (r) => r.items.filter((i) => i.amount < 0);

describe('repeating store purchases are spending, not bills', () => {
  it('Circle K and Walmart are never projected as future bills (PROVEN TO CATCH)', () => {
    const r = run(household());
    expect(outs(r).some((i) => /CIRCLE K|WALMART/i.test(i.label))).toBe(false);
    expect(r.windows.next30.items.some((i) => /CIRCLE K|WALMART/i.test(i.label))).toBe(false);
  });
  it('they are listed apart as repeating purchases, with their category and monthly amount', () => {
    const nb = run(household()).windows.notBills;
    const ck = nb.items.find((n) => /CIRCLE K/i.test(n.label));
    const wm = nb.items.find((n) => /WALMART/i.test(n.label));
    expect(ck).toMatchObject({ category: 'fuel' });
    expect(wm).toMatchObject({ category: 'groceries' });
    expect(ck.monthly).toBeGreaterThan(150); // about $45 a week
    expect(wm.monthly).toBeGreaterThan(100);
    expect(nb.monthly).toBe(sum(nb.items.map((n) => n.monthly)));
  });
  it('their money stays in the plan once, as everyday spending accrued day by day', () => {
    const r = run(household());
    expect(r.monthly.livingParts.repeatingPurchases).toBe(r.windows.notBills.monthly);
    expect(r.assumptions.join(' ')).toMatch(/repeating purchases \(fuel, groceries, dining, household\) reserved as everyday spending, not as bills/);
  });
  it('with the family’s own household figure, that figure carries them: no second reserve, and none carved out of it', () => {
    const r = run(household({ householdFigure: 2000 }));
    expect(r.monthly.livingParts.repeatingPurchases).toBeUndefined();
    // Only the itemized bills (Netflix, Ameren) are carved out of the figure; no store purchase is.
    expect(r.monthly.inferredBills.items.some((i) => /CIRCLE K|WALMART/i.test(i.label))).toBe(false);
    expect(r.monthly.livingParts.household).toBe(Math.round((2000 - r.monthly.inferredBills.total) * 100) / 100);
  });
  it('a real subscription and a utility are still projected, labeled for review', () => {
    const items = run(household()).windows.next30.items;
    const nf = items.find((i) => /NETFLIX/i.test(i.label));
    const am = items.find((i) => /AMEREN/i.test(i.label));
    expect(nf).toMatchObject({ kind: 'inferred-bill', subscription: true, billClass: 'inferred-review' });
    expect(am).toMatchObject({ kind: 'inferred-bill', subscription: false, billClass: 'inferred-review' });
  });
  it('the merchant test reads the payee: fuel and groceries are purchases; a utility and a subscription are not', () => {
    expect(isMerchantPurchase('CIRCLE K 1234')).toBe(true);
    expect(isMerchantPurchase('WALMART SUPERCENTER')).toBe(true);
    expect(isMerchantPurchase('NETFLIX.COM')).toBe(false);
    expect(isMerchantPurchase('AMEREN ILLINOIS')).toBe(false);
    // the family's own category on the rows wins over the name
    expect(isMerchantPurchase('CORNER STORE', [{ category: 'groceries' }, { category: 'groceries' }])).toBe(true);
  });
});

describe('a debt with no due date on file gets no invented date', () => {
  it('the card is never put on December 1 (PROVEN TO CATCH)', () => {
    const r = run(household());
    expect(outs(r).some((i) => /Visa/.test(i.label) && i.date === '2026-12-01')).toBe(false);
  });
  it('its known minimum is in the plan once per month, from today, under "Due date needed", with no due date', () => {
    const r = run(household());
    const visa = r.windows.next30.items.filter((i) => /Visa/.test(i.label));
    expect(visa).toHaveLength(1);
    expect(visa[0]).toMatchObject({ amount: 60, dateUnknown: true, dueDate: null, billClass: 'due-date-needed', date: '2026-11-17' });
    expect(r.windows.dateNeeded.items.map((d) => d.label)).toEqual(['Visa · minimum']);
    const in60 = buildSafeToSpend(household(), { currentDate: TODAY, period: 'custom', customEnd: '2027-01-16', scope: 'personal' });
    const in90 = buildSafeToSpend(household(), { currentDate: TODAY, period: 'custom', customEnd: '2027-02-15', scope: 'personal' });
    expect(outs(in60).filter((i) => /Visa/.test(i.label))).toHaveLength(2);
    expect(outs(in90).filter((i) => /Visa/.test(i.label))).toHaveLength(3);
    expect(r.assumptions.join(' ')).toMatch(/no due date on file .*Visa · minimum.*never shown as due on a day/);
  });
  it('a card WITH its due day on file is a confirmed bill on that day', () => {
    const r = run(household());
    expect(r.windows.next30.items.find((i) => /Discover/.test(i.label))).toMatchObject({ date: '2026-11-20', dueDate: '2026-11-20', billClass: 'confirmed', dateUnknown: false });
    const withDay = run(household({ visaDueDay: 9 }));
    expect(withDay.windows.next30.items.find((i) => /Visa/.test(i.label))).toMatchObject({ date: '2026-12-09', billClass: 'confirmed' });
    expect(withDay.windows.dateNeeded.items).toEqual([]);
  });
  it('a "paid" mark on that month’s minimum holds all month, though the reserve day moves', () => {
    const marked = household({ statuses: { 'debt-acct-a-visa:date-needed:2026-11': { status: 'paid-outside' } } });
    for (const day of [17, 18, 25]) {
      const r = run(marked, '30d', new Date(2026, 10, day, 12));
      const visa = r.windows.next30.items.filter((i) => /Visa/.test(i.label));
      expect(visa.some((i) => i.date.startsWith('2026-11'))).toBe(false);
    }
  });
});

describe('the 30 days of bills in six groups', () => {
  it('every bill is in exactly one group, and the groups add up to the 30-day total to the cent', () => {
    const W = run(household()).windows;
    const counted = BILL_CLASSES.reduce((a, c) => a + W.groups30[c].items.length, 0);
    expect(counted).toBe(W.next30.items.length);
    expect(sum(BILL_CLASSES.map((c) => W.groups30[c].total))).toBe(W.next30.total);
    expect(W.groups30.confirmed.items.map((i) => i.label).sort()).toEqual(['Discover · minimum', 'Phone']);
    expect(W.groups30['due-date-needed'].items.map((i) => i.label)).toEqual(['Visa · minimum']);
    expect(W.groups30['inferred-review'].items.length).toBeGreaterThan(0);
  });
});

describe('Coming Up on a phone', () => {
  let root; let host;
  afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; });
  it('shows the 30-day bills by group, "date needed" for the card, and the repeating purchases apart', async () => {
    const data = household();
    const result = buildSafeToSpend(data, { currentDate: TODAY, period: '14d', scope: 'personal', settings: data.moneyPlan.settings });
    host = document.createElement('div'); host.style.width = '360px'; document.body.appendChild(host);
    await act(async () => { root = createRoot(host); root.render(createElement(MoneyComingUp, { result, extra: extraDebtCapacity(data, { currentDate: TODAY, period: '14d', scope: 'personal' }), show, entities: data.entities, settings: data.moneyPlan.settings, data, asOf: TODAY })); });
    const next30 = host.querySelector('[data-testid="coming-up-next30"]');
    expect(next30.querySelector('[data-testid="bill-group-confirmed"]').textContent).toMatch(/Confirmed recurring bills/);
    expect(next30.querySelector('[data-testid="bill-group-due-date-needed"]').textContent).toMatch(/date neededVisa · minimum · no due date on file; minimum reserved · Needs verification\$60\.00/);
    expect(next30.querySelector('[data-testid="bill-group-due-date-needed"]').textContent).not.toMatch(/Confirmed/); // never shown as verified (approved 2026-11-17)
    expect(next30.querySelector('[data-testid="bill-group-inferred-review"]').textContent).toMatch(/NETFLIX[^$]*subscription, verify it/i);
    expect(next30.textContent).not.toMatch(/CIRCLE K|WALMART/i);
    expect(next30.textContent).not.toMatch(/2026-12-01Visa/);
    const nb = host.querySelector('[data-testid="coming-up-not-bills"]');
    expect(nb.textContent).toMatch(/Repeating purchases \(not bills\)/);
    expect(nb.querySelectorAll('[data-testid="not-bills-item"]').length).toBe(2);
  });
});
