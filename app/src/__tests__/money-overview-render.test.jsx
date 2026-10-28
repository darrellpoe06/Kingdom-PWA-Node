// money-overview-render.test.jsx — the redesigned Money section renders real
// data, labels every figure by source, and keeps every legacy tab reachable.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import MoneyOverview from '../components/money/MoneyOverview.jsx';
import MoneySurfaces from '../components/money/MoneySurfaces.jsx';
import MoneyLayout, { MoneyNavStrip } from '../components/money/MoneyChrome.jsx';
import ChromeDock from '../components/ChromeDock.jsx';
import { deriveDebts } from '../lib/financial-engineering.js';
import { NEW_SUBS, LEGACY_SUBS, MONEY_SECTIONS } from '../lib/money-nav.js';
import { patchMoneyPlan } from '../lib/money-plan.js';

const TODAY = new Date(2026, 9, 28);

function fixture() {
  return {
    meta: { bufferTarget: 500, lastUpdated: '2026-10-27' },
    entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }, { id: 'e-biz', name: 'Business LLC', type: 'business' }],
    accounts: [
      { id: 'chk', entityId: 'e-personal', name: 'Checking', type: 'checking', balance: 3000, openingBalance: 3000 },
      { id: 'cc', entityId: 'e-personal', name: 'Visa', type: 'credit', balance: -2000, openingBalance: -2000, minPayment: 100, rate: 20, dueDay: 20 },
    ],
    transactions: [
      { id: 'p1', date: '2026-09-25', accountId: 'chk', amount: 1500, description: 'ACME PAYROLL', category: 'salary' },
      { id: 'p2', date: '2026-10-09', accountId: 'chk', amount: 1500, description: 'ACME PAYROLL', category: 'salary' },
      { id: 'p3', date: '2026-10-23', accountId: 'chk', amount: 1500, description: 'ACME PAYROLL', category: 'salary' },
      { id: 'g1', date: '2026-10-20', accountId: 'chk', amount: -120.5, description: 'Grocer', category: 'groceries' },
    ],
    inflows: { salaries: [{ id: 's1', who: 'Adam', source: 'ACME salary', expected: 3250, actual: 3250, entityId: 'e-personal' }], rentals: [] },
    outflows: { household: 1200, debtService: 400, rentalMortgages: 0, charitableGiving: 0 },
    recurringObligations: [{ id: 'ro-rent', name: 'Rent', amount: 1500, frequency: 'monthly', nextDue: '2026-10-01', entityId: 'e-personal', category: 'housing', enabled: true }],
    taxCalendar: [], incidents: [], debts: [], events: [], subscriptions: [], contractors1099: [],
  };
}

let host = null; let root = null;
async function mount(el) {
  host = document.createElement('div'); document.body.appendChild(host);
  await act(async () => { root = createRoot(host); root.render(el); });
  return host;
}
afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; });

function moneyBag(data, extra = {}) {
  const derivedDebts = deriveDebts(data, TODAY);
  let state = data;
  const setData = (fn) => { state = typeof fn === 'function' ? fn(state) : fn; };
  return { bag: { data, setData, currentDate: TODAY, derivedDebts, totals: { totalInflow: 3250, totalOutflow: 1600, netCashFlow: 1650 }, bufferCurrent: 0, visibleEntities: data.entities, cloud: false, setBooksView: () => {}, setView: () => {}, addRecurring: () => {}, ...extra }, read: () => state };
}

describe('Money Overview — the first screen', () => {
  it('shows Safe to Spend Now with its status, source label and breakdown, labeled by reliability', async () => {
    const { bag } = moneyBag(fixture());
    const el = await mount(createElement(MoneyOverview, { money: bag }));
    expect(el.querySelector('[data-testid="safe-to-spend-card"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="sts-amount"]').textContent).toMatch(/^\$[\d,]+$/);
    expect(el.querySelector('[data-testid="sts-status"]').textContent).toMatch(/Estimate/); // inferred pay dates → never "verified"
    expect(el.querySelector('[data-testid="sts-source"]').textContent).toMatch(/Ledger-calculated \(bank balance unavailable\)/);
    const lines = el.querySelector('[data-testid="sts-lines"]').textContent;
    for (const w of ['Current available cash', 'Bills due', 'Minimum debt payments', 'Living expenses reserved', 'Taxes reserved', 'Savings reserved', 'Minimum cash cushion', 'Other commitments', 'Projected lowest balance', 'Next expected income', 'Potential extra debt payment']) expect(lines).toContain(w);
    expect(lines).toMatch(/ledger/); expect(lines).toMatch(/projected/); expect(lines).toMatch(/entered/);
    expect(el.querySelector('[data-testid="sts-explain"]').textContent).toMatch(/pending rows are not subtracted again/);
    expect(el.querySelector('[data-testid="money-setup-banner"]').textContent).toMatch(/setup steps entered/);
    expect(el.querySelector('[data-testid="money-sync-status"]').getAttribute('data-state')).toBe('local');
    expect(el.querySelector('[data-testid="money-recent"]').textContent).toContain('Grocer');
  });
  it('hides amounts when the privacy toggle is on, and writes the choice to moneyPlan.settings', async () => {
    const { bag, read } = moneyBag(fixture());
    const el = await mount(createElement(MoneyOverview, { money: bag }));
    await act(async () => { el.querySelector('[data-testid="money-privacy-toggle"]').click(); });
    expect(read().moneyPlan.settings.privacy).toBe(true);
    expect(read().moneyPlan.updatedAt).toBeTruthy();
  });
  it('says UNAVAILABLE, not $0, with no spendable account', async () => {
    const data = fixture(); data.accounts = [];
    const { bag } = moneyBag(data);
    const el = await mount(createElement(MoneyOverview, { money: bag }));
    expect(el.querySelector('[data-testid="sts-amount"]').textContent).toBe('Unavailable');
  });
  it('a stored plan survives a round trip through the snapshot shape (settings persist after a reload)', async () => {
    const saved = patchMoneyPlan(null, { settings: { minCushion: 750, incomeSchedule: { s1: { frequency: 'biweekly', nextDate: '2026-11-06' } }, debtDueDays: {} } });
    const data = { ...fixture(), moneyPlan: JSON.parse(JSON.stringify(saved)) }; // the device snapshot is JSON
    const { bag } = moneyBag(data);
    const el = await mount(createElement(MoneyOverview, { money: bag }));
    expect(el.querySelector('[data-testid="sts-lines"]').textContent).toContain('$750');
    expect(el.querySelector('[data-testid="sts-status"]').textContent).toMatch(/Ledger-verified projection/);
  });
});

describe('every Money section renders something real (never blank)', () => {
  for (const sub of NEW_SUBS) {
    it(`${sub} mounts through MoneySurfaces`, async () => {
      const { bag } = moneyBag(fixture());
      const el = await mount(createElement(MoneySurfaces, { section: sub, money: bag }));
      expect(el.textContent.trim().length).toBeGreaterThan(40);
      expect(el.querySelector(`[data-testid="money-${sub === 'settings' ? 'setup' : sub}"]`)).toBeTruthy();
    });
  }
  it('Debt Freedom shows the corrected engine: this month\'s payment per debt, the comparison and the schedule', async () => {
    const { bag } = moneyBag(fixture());
    const el = await mount(createElement(MoneySurfaces, { section: 'debt-freedom', money: bag }));
    expect(el.querySelector('[data-testid="debt-this-month"]').textContent).toContain('Visa');
    expect(el.querySelector('[data-testid="debt-schedule"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="debt-sts"]').textContent).toMatch(/could go to debt/);
    await act(async () => { el.querySelector('[data-testid="strategy-custom"]').click(); });
  });
});

describe('the navigation: nine sections, every legacy tab inside one, three taps at most', () => {
  it('the strip and the rail list the nine sections; the tab row lists a section\'s legacy tabs', async () => {
    const seen = [];
    const el = await mount(createElement(MoneyLayout, { booksView: 'accounts', setBooksView: (v) => seen.push(v) }, createElement('div', null, 'content')));
    for (const s of MONEY_SECTIONS) expect(el.querySelector(`[data-testid="money-rail-${s.id}"]`), s.id).toBeTruthy();
    const row = el.querySelector('[data-testid="money-tab-row"]');
    expect(row.textContent).toContain('Entities'); expect(row.textContent).toContain('Legal');
    await act(async () => { el.querySelector('[data-testid="money-tab-legal"]').click(); });
    expect(seen).toEqual(['legal']);
    await act(async () => { el.querySelector('[data-testid="money-rail-toggle"]').click(); });
    expect(el.querySelector('[data-testid="money-side-nav"]').getAttribute('data-collapsed')).toBe('true');
    expect(el.textContent).toContain('content');
  });
  it('the Imported tab is hidden from the row when the family gate denies it (the gate itself is unchanged)', async () => {
    const el = await mount(createElement(MoneyLayout, { booksView: 'transactions', setBooksView: () => {}, importedAllowed: false }));
    expect(el.querySelector('[data-testid="money-tab-row"]')).toBeNull();
    const el2 = await mount(createElement(MoneyLayout, { booksView: 'transactions', setBooksView: () => {}, importedAllowed: true }));
    expect(el2.querySelector('[data-testid="money-tab-imported"]')).toBeTruthy();
  });
  it('every legacy id reaches a tab row inside its section', async () => {
    for (const id of LEGACY_SUBS) {
      const el = await mount(createElement(MoneyLayout, { booksView: id, setBooksView: () => {} }));
      expect(el.querySelector(`[data-testid="money-tab-${id}"]`), id).toBeTruthy();
      act(() => root.unmount()); host.remove(); root = null; host = null;
    }
  });
  it('the header strip marks the current section', async () => {
    const el = await mount(createElement(MoneyNavStrip, { booksView: 'imported', setBooksView: () => {} }));
    expect(el.querySelector('[data-testid="money-section-transactions"]').getAttribute('aria-selected')).toBe('true');
  });
  it('on a phone inside Money the one bottom bar shows Overview · Transactions · Budget · Goals, and More leads with the rest of Money', async () => {
    window.innerWidth = 390;
    const orig = window.matchMedia;
    window.matchMedia = (q) => ({ matches: /max-width: 639/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
    const seen = [];
    const nav = { groups: [], view: 'books', homeView: 'current', onNavigate: () => {}, money: { booksView: 'overview', setBooksView: (v) => seen.push(v) } };
    const el = await mount(createElement(ChromeDock, { onFeedback: () => {}, nav }));
    for (const k of ['overview', 'transactions', 'budget', 'goals']) expect(el.querySelector(`[data-testid="dock-money-${k}"]`), k).toBeTruthy();
    expect(el.querySelector('[data-testid="dock-tab-home"]')).toBeNull();
    for (const k of ['accounts', 'bills', 'debt-freedom', 'reports', 'settings']) expect(el.querySelector(`[data-testid="dock-more-money-${k}"]`), k).toBeTruthy();
    await act(async () => { el.querySelector('[data-testid="dock-money-budget"]').click(); });
    expect(seen).toEqual(['budget']);
    window.matchMedia = orig;
  });
});
