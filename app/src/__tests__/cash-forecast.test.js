// cash-forecast.test.js — the Transactions screen's 30 / 60 / 90-day forecast
// moves (Darrell 2026-11-11: "The Transactions screen currently shows
// identical amounts for Now, +30, +60, and +90 days"). It read only the
// account-named upcoming rows; now it is the Safe to Spend engine's own walk,
// placed on the account that pays or receives each item, confirmed and
// estimated apart.
import { describe, it, expect } from 'vitest';
import { cashForecast, scopeForEntityFilter } from '../lib/cash-forecast.js';
import { buildSafeToSpend } from '../lib/safe-to-spend.js';
import { balanceCheckpointRow } from '../lib/financial-engineering.js';

const at = (y, m, d) => new Date(y, m - 1, d, 12);
const NOV11 = at(2026, 11, 11);

function household() {
  return {
    entities: [
      { id: 'e-personal', name: 'Personal', type: 'personal' },
      { id: 'e-poeprops', name: 'Poe Properties LLC', type: 'business' },
    ],
    accounts: [
      { id: 'a-7206', name: 'Chase 7206', fragment: '7206', type: 'checking', entityId: 'e-personal', balance: 0, isPrimary: true },
      { id: 'a-3322', name: 'Chase 3322', fragment: '3322', type: 'checking', entityId: 'e-poeprops', balance: 0 },
      { id: 'a-cc', name: 'Visa', type: 'credit', entityId: 'e-personal', balance: -1200, minPayment: 60, dueDay: 20, treatAsDebt: true },
    ],
    transactions: [
      { id: 'cp1', ...balanceCheckpointRow('a-7206', 3183.1, '2026-11-11', { basis: 'available', source: 'screenshot 7206.jpg' }) },
      { id: 'cp2', ...balanceCheckpointRow('a-3322', 4479.53, '2026-11-10', { basis: 'available', source: 'screenshot 3322.jpg' }) },
      { id: 'sched', date: '2026-11-20', accountId: 'a-3322', amount: -300, description: 'City water (scheduled)', category: 'utilities' },
    ],
    // The bill below names NO paying account: the old forecast could not place it.
    recurringObligations: [
      {
        id: 'ob-bg',
        name: 'BG & Mom',
        group: 'family',
        type: 'regular',
        amount: 750,
        frequency: 'biweekly',
        nextDue: '2026-11-18',
        entityId: 'e-personal',
        enabled: true,
      },
      {
        id: 'ob-ins',
        name: 'Country Financial',
        group: 'rental',
        type: 'regular',
        amount: 210,
        frequency: 'monthly',
        nextDue: '2026-11-25',
        entityId: 'e-poeprops',
        accountId: 'a-3322',
        enabled: true,
      },
    ],
    inflows: { salaries: [], rentals: [{ id: 'r-805', name: '805 Main', rent: 700, actual: 700, status: 'paying', entityId: 'e-poeprops' }] },
    moneyPlan: { settings: { reserveByEntity: { personal: 10000 }, rentDueDay: 1, includeInferredBills: false } },
  };
}

describe('the 30 / 60 / 90-day cash forecast (PROVEN TO CATCH)', () => {
  it('Now, +30, +60 and +90 are four different figures once bills, debt minimums and rent are on the walk', () => {
    const f = cashForecast(household(), { currentDate: NOV11, scope: 'consolidated' });
    const p = f.rows.find((r) => r.id === 'a-7206');
    expect(p.balance).toBe(3183.1);
    expect(p.verifiedOn).toBe('2026-11-11');
    // BG & Mom every two weeks (Nov 18, Dec 2, Dec 16, Dec 30, Jan 13, Jan 27; Feb 10 is past +90) + the Visa minimum on the 20th.
    expect(p.w30).toBeCloseTo(3183.1 - 750 - 750 - 60, 2);
    expect(p.w60).toBeCloseTo(3183.1 - 750 * 4 - 60 * 2, 2);
    expect(p.w90).toBeCloseTo(3183.1 - 750 * 6 - 60 * 3, 2);
    expect(new Set([p.balance, p.w30, p.w60, p.w90]).size).toBe(4);
    const b = f.rows.find((r) => r.id === 'a-3322');
    // Nov 20 scheduled, Nov 25 insurance, Dec 1 rent, Dec 25 insurance, Jan 1 rent, Jan 25, Feb 1
    expect(b.w30).toBeCloseTo(4479.53 - 300 - 210 + 700, 2);
    expect(b.w60).toBeCloseTo(4479.53 - 300 - 210 * 2 + 700 * 2, 2);
    expect(b.w90).toBeCloseTo(4479.53 - 300 - 210 * 3 + 700 * 3, 2);
  });
  it("the rows add up to the engine's own timeline at every horizon, to the cent", () => {
    const d = household();
    const f = cashForecast(d, { currentDate: NOV11, scope: 'consolidated' });
    for (const h of [30, 60, 90]) expect(f.totals[`w${h}`]).toBe(f.engineAt[h]);
    const personal = cashForecast(d, { currentDate: NOV11, scope: 'personal' });
    const r = buildSafeToSpend(d, { currentDate: NOV11, period: 'custom', customEnd: '2027-02-09', scope: 'personal' });
    expect(personal.totals.w30).toBe(r.timeline[30].cash);
    expect(personal.totals.w90).toBe(r.timeline[90].cash);
  });
  it('confirmed and estimated are carried apart: an entered bill is confirmed, an assumed due day and accrued reserves are estimates', () => {
    const d = household();
    let f = cashForecast(d, { currentDate: NOV11, scope: 'consolidated' });
    let p = f.rows.find((r) => r.id === 'a-7206');
    expect(p.confirmed30).toBe(-750 - 750 - 60); // the Visa minimum has its due day on file
    expect(p.estimated30).toBe(0);
    delete d.accounts.find((a) => a.id === 'a-cc').dueDay; // no due day: the 1st is assumed
    f = cashForecast(d, { currentDate: NOV11, scope: 'consolidated' });
    p = f.rows.find((r) => r.id === 'a-7206');
    expect(p.confirmed30).toBe(-750 - 750);
    expect(p.estimated30).toBe(-60);
    const b = f.rows.find((r) => r.id === 'a-3322');
    expect(b.confirmed30).toBe(-300 - 210 + 700);
    expect(b.estimated30).toBe(0);
    // With a planned-savings figure entered, its daily accrual is an estimate on the pocket's primary account.
    d.moneyPlan.settings.savingsMonthly = 300;
    const g = cashForecast(d, { currentDate: NOV11, scope: 'personal' });
    const q = g.rows.find((r) => r.id === 'a-7206');
    expect(q.estimated30).toBeLessThan(p.estimated30);
    expect(g.totals.w30).toBe(g.engineAt[30]);
  });
  it('a pocket with several accounts and no primary gets its own "not yet on an account" row instead of a guess', () => {
    const d = household();
    d.accounts.push({ id: 'a-3399', name: 'Chase 3399', type: 'savings', entityId: 'e-poeprops', balance: 100 });
    const f = cashForecast(d, { currentDate: NOV11, scope: 'e-poeprops' });
    const un = f.rows.find((r) => r.unattributed);
    expect(un).toBeTruthy();
    expect(un.name).toMatch(/Poe Properties LLC: items not yet on an account/);
    expect(un.w30).toBe(700); // the rent, which names no account
    expect(f.rows.find((r) => r.id === 'a-3322').w30).toBeCloseTo(4479.53 - 300 - 210, 2); // only what names it
    expect(f.totals.w30).toBe(f.engineAt[30]);
  });
  it('the Transactions entity filter maps to the engine scope: all → consolidated, a personal entity → personal, a business → itself', () => {
    const d = household();
    expect(scopeForEntityFilter(d, 'all')).toBe('consolidated');
    expect(scopeForEntityFilter(d, 'e-personal')).toBe('personal');
    expect(scopeForEntityFilter(d, 'e-poeprops')).toBe('e-poeprops');
  });
  it('nothing is invented: with no bills, income or reserves on file, every horizon equals Now', () => {
    const d = household();
    d.recurringObligations = [];
    d.inflows.rentals = [];
    d.transactions = d.transactions.filter((t) => t.id !== 'sched');
    d.accounts = d.accounts.filter((a) => a.id !== 'a-cc');
    const f = cashForecast(d, { currentDate: NOV11, scope: 'consolidated' });
    for (const r of f.rows) expect([r.w30, r.w60, r.w90]).toEqual([r.balance, r.balance, r.balance]);
  });
});
