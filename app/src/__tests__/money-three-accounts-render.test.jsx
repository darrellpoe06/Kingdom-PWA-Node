// money-three-accounts-render.test.jsx — what the Fold shows (412px wide):
// the Coming Up panel with the 30-day and past-due lines, the income before
// each window, the trail behind each account's figure; and the Transactions
// forecast table with Now, +30, +60 and +90 as different figures, the verified
// day under each account, and the "est" mark where estimates are inside.
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import MoneyComingUp from '../components/money/MoneyComingUp.jsx';
import BooksTransactions from '../components/BooksTransactions.jsx';
import { buildSafeToSpend, extraDebtCapacity } from '../lib/safe-to-spend.js';
import { balanceCheckpointRow } from '../lib/financial-engineering.js';
import { fmt } from '../lib/format.js';
import { cashForecast } from '../lib/cash-forecast.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const at = (y, m, d) => new Date(y, m - 1, d, 12);
const NOV11 = at(2026, 11, 11);
const noop = () => {};

function household() {
  return {
    entities: [
      { id: 'e-personal', name: 'Personal', type: 'personal' },
      { id: 'e-poeprops', name: 'Poe Properties LLC', type: 'business' },
      { id: 'e-tlc', name: 'TLC Therapy Solutions', type: 'business' },
    ],
    accounts: [
      { id: 'a-7206', name: 'Chase Personal Checking 7206', fragment: '...7206', type: 'checking', entityId: 'e-personal', balance: 0, isPrimary: true },
      { id: 'a-3322', name: 'Chase 3322', type: 'checking', entityId: 'e-poeprops', balance: 0 },
      { id: 'a-8168', name: 'TLC Therapy Solutions 8168', type: 'checking', entityId: 'e-tlc', balance: 0 },
    ],
    transactions: [
      { id: 'cp1', ...balanceCheckpointRow('a-7206', 3183.1, '2026-11-11', { basis: 'available', source: 'screenshot 7206.jpg' }) },
      { id: 'cp2old', ...balanceCheckpointRow('a-3322', 2539.53, '2026-11-04', { basis: 'available', source: 'entered by hand' }) },
      { id: 'cp2', ...balanceCheckpointRow('a-3322', 4479.53, '2026-11-10', { basis: 'available', source: 'screenshot 3322.jpg' }) },
      { id: 'cp3', ...balanceCheckpointRow('a-8168', 370.69, '2026-11-09', { basis: 'available', source: 'screenshot 8168.jpg' }) },
      { id: 'after', date: '2026-11-11', accountId: 'a-3322', amount: -200, description: 'LOWES', category: 'other' },
    ],
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
        accountId: 'a-7206',
        enabled: true,
      },
      {
        id: 'ob-fsb',
        name: 'First State Bank loan 5342',
        group: 'rental',
        type: 'regular',
        amount: 612,
        frequency: 'monthly',
        nextDue: '2026-11-01',
        entityId: 'e-poeprops',
        accountId: 'a-3322',
        enabled: true,
        graceDays: 15,
      },
      {
        id: 'ob-ins',
        name: 'Country Financial insurance',
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

let host = null;
let root = null;
beforeAll(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 412 });
});
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host) host.remove();
  root = null;
  host = null;
});
async function mount(el) {
  host = document.createElement('div');
  document.body.appendChild(host);
  await act(async () => {
    root = createRoot(host);
    root.render(el);
  });
  return host;
}
const q = (sel) => host.querySelector(sel);

describe('Coming Up on the Fold — the seven answers, with the 30-day window, past-due apart, and the trail', () => {
  it('Poe Properties: cash verified Nov 10 with its trail, past-due loan in grace, 30-day bills, income before them', async () => {
    const d = household();
    const opts = { currentDate: NOV11, period: '14d', scope: 'e-poeprops' };
    const result = buildSafeToSpend(d, opts);
    await mount(createElement(MoneyComingUp, { result, extra: extraDebtCapacity(d, opts), show: fmt, entities: d.entities }));
    const cash = q('[data-testid="coming-up-cash"]').textContent;
    expect(cash).toMatch(/Current verified cash/);
    expect(cash).toMatch(/\$4,280/); // 4,479.53 − 200 since the check
    const trail = q('[data-testid="cash-trail-a-3322"]').textContent;
    expect(trail).toMatch(/1 row since that check, net −\$200/);
    expect(trail).toMatch(/Earlier checks: \$2,540 on 2026-11-04/);
    expect(trail).toMatch(/Source: screenshot 3322\.jpg/);
    const past = q('[data-testid="coming-up-past-due"]').textContent;
    expect(past).toMatch(/Past-due obligations \(apart from regular bills\)/);
    expect(past).toMatch(/\$612/);
    expect(past).toMatch(/First State Bank loan 5342/);
    expect(past).toMatch(/Due, unpaid — within the grace period \(ends 2026-11-16\)/);
    expect(past).toMatch(/overdue \(due 2026-11-01\)/);
    expect(past).toMatch(/Regular bills in the next 30 days without these: \$822/); // 210 insurance + 612 Dec 1
    const next30 = q('[data-testid="coming-up-next30"]').textContent;
    expect(next30).toMatch(/Bills due in the next 30 days/);
    expect(next30).toMatch(/income expected before these are due: \$700/);
    expect(next30).toMatch(/Country Financial insurance/);
    const next7 = q('[data-testid="coming-up-next7"]').textContent;
    expect(next7).toMatch(/no income expected in this window/);
    expect(q('[data-testid="coming-up-reserve"]')).toBeTruthy();
    expect(q('[data-testid="coming-up-safe"]')).toBeTruthy();
    expect(q('[data-testid="coming-up-extra"]')).toBeTruthy();
  });
  it('All entities: each pocket on its own row; Personal headline keeps the $10,000 reserve; the TLC figure says screenshot-verified', async () => {
    const d = household();
    const opts = { currentDate: NOV11, period: '14d', scope: 'consolidated' };
    const result = buildSafeToSpend(d, opts);
    await mount(createElement(MoneyComingUp, { result, extra: extraDebtCapacity(d, opts), show: fmt, entities: d.entities }));
    const rows = q('[data-testid="coming-up-entities"]').textContent;
    expect(rows).toMatch(/PERSONAL\$3,183/);
    expect(rows).toMatch(/POE PROPERTIES\$4,280/);
    expect(rows).toMatch(/TLC THERAPY\$371/);
    expect(q('[data-testid="coming-up-reserve-value"]').textContent).toBe('$10,000');
    expect(q('[data-testid="coming-up-safe-value"]').textContent).toBe('$0');
    expect(q('[data-testid="coming-up-cash-value"]').textContent).toBe('$3,183');
  });
});

describe('Transactions → 30/60/90 forecast on the Fold', () => {
  it('Now, +30, +60 and +90 differ; the verified day sits under the account; the est mark names what is estimated', async () => {
    const d = household();
    await mount(
      createElement(BooksTransactions, {
        data: d,
        entityFilter: 'all',
        setEntityFilter: noop,
        currentDate: NOV11,
        addTransaction: noop,
        updateTransaction: noop,
        deleteTransaction: noop,
        ingestData: null,
        visibleEntities: d.entities,
        visibleEntityIds: null,
      })
    );
    const cell = (id, h) => q(`[data-testid="forecast-${id}-w${h}"]`).textContent;
    expect(q('[data-testid="forecast-source-a-7206"]').textContent).toBe('bank-verified 2026-11-11');
    expect(q('[data-testid="forecast-source-a-3322"]').textContent).toBe('bank-verified 2026-11-10');
    expect(cell('a-7206', 30)).toMatch(/^\$1,683/); // 3,183.10 − 750 − 750
    expect(cell('a-7206', 60)).toMatch(/^\$183/); // − 750 × 4
    expect(cell('a-7206', 90)).toMatch(/^-\$1,317/); // − 750 × 6
    expect(cell('a-3322', 30)).toMatch(/^\$3,546/); // 4,279.53 − 612 (in grace, owed now) − 210 + 700 − 612 (Dec 1)
    expect(cell('a-3322', 90)).toMatch(/^\$3,302/); // − 612 × 4 − 210 × 3 + 700 × 3
    // Every cell is the engine's own figure, and none repeats Now.
    const f = cashForecast(d, { currentDate: NOV11, scope: 'consolidated', visibleEntities: d.entities });
    for (const r of f.rows) {
      for (const h of [30, 60, 90]) expect(cell(r.id, h)).toMatch(new RegExp('^' + fmt(r[`w${h}`]).replace(/[$]/g, '\\$')));
      if (r.id !== 'a-8168') expect(new Set([r.balance, r.w30, r.w60, r.w90]).size).toBeGreaterThan(1); // TLC has nothing on file: nothing invented
    }
    expect(host.querySelector('sup')).toBeNull();
    expect(host.textContent).toMatch(/Confirmed/);
    expect(host.textContent).toMatch(/of confirmed items and \$0 of estimates/);
  });
});
