// money-bills-due.test.jsx — Bills Due counts each obligation ONCE, and never
// a payment that already cleared (Christina, 2026-11-05: "BG & MOM appears
// twice: $750 on November 4 and $750 on November 5... Some bills listed have
// ALREADY been paid and cleared my bank account... Never subtract an
// already-cleared payment again").
//
// Her real BG & Mom history (Chase 7206): $750 by Zelle every two weeks —
// Sep 9, Sep 23, Oct 7, Oct 21 — and the Nov 4 payment that cleared.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { buildSafeToSpend, extraDebtCapacity, obligationEvents, resolveScope, historyOccurrences } from '../lib/safe-to-spend.js';
import { suggestBills } from '../lib/bill-review.js';
import { balanceCheckpointRow } from '../lib/financial-engineering.js';
import MoneyComingUp from '../components/money/MoneyComingUp.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const at = (y, m, d) => new Date(y, m - 1, d, 12);

function her({ checkpointDay = '2026-11-05', nov4Imported = false } = {}) {
  const tx = [
    { id: 'bg1', date: '2026-08-05', accountId: 'a-7206', amount: -100, description: 'Zelle payment to BG & Mom JPM99crvwla8', category: 'transfer' },
    { id: 'bg2', date: '2026-08-19', accountId: 'a-7206', amount: -50, description: 'Zelle payment to BG & Mom JPM99ctm6tyh', category: 'chase_to_partnerfi' },
    { id: 'bg3', date: '2026-09-09', accountId: 'a-7206', amount: -750, description: 'Zelle payment to BG & Mom JPM99cvxn6ge', category: 'transfer' },
    { id: 'bg4', date: '2026-09-23', accountId: 'a-7206', amount: -750, description: 'Zelle payment to BG & Mom JPM99cxfrvjg', category: 'transfer' },
    { id: 'bg5', date: '2026-10-07', accountId: 'a-7206', amount: -750, description: 'Zelle payment to BG & Mom JPM99cz1b9pv', category: 'other' },
    { id: 'bg6', date: '2026-10-21', accountId: 'a-7206', amount: -750, description: 'Zelle payment to BG & Mom JPM99d0j78te', category: 'other' },
  ];
  if (nov4Imported) tx.push({ id: 'bg7', date: '2026-11-04', accountId: 'a-7206', amount: -750, description: 'ZELLE PAYMENT TO BG & MOM JPM99D23RK9R', category: 'other' });
  tx.push({ id: 'cp', ...balanceCheckpointRow('a-7206', 5774, checkpointDay, { basis: 'available' }) });
  return {
    entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }],
    accounts: [{ id: 'a-7206', name: 'Chase 7206', type: 'checking', entityId: 'e-personal', balance: 0 }],
    transactions: tx,
    recurringObligations: [],
    inflows: { salaries: [], rentals: [] },
    moneyPlan: { settings: { reserveByEntity: { personal: 10000 } } },
  };
}
const bg = (items) => items.filter((i) => /BG & Mom/i.test(i.label));
const run = (d, today, period = '14d') => buildSafeToSpend(d, { currentDate: today, period, scope: 'personal' });

describe('BG & Mom, her November 4 example (PROVEN TO CATCH)', () => {
  it('is read as every two weeks from the day it was last paid, never as two "usual days" two days apart', () => {
    const s = suggestBills(her(), at(2026, 11, 5)).find((x) => /BG & Mom/i.test(x.name));
    expect(s.evidence.gapDays).toBe(14);
    const occ = historyOccurrences(s, at(2026, 11, 5), at(2026, 11, 30)).dates.map((x) => x.getDate());
    expect(occ).toEqual([18]); // Oct 21 + 14 = Nov 4 (already paid), then Nov 18
  });
  it('on Nov 5, with the bank balance checked Nov 5 ($5,774, which already includes the Nov 4 payment): $750 is never subtracted again, and Nov 18 is counted once', () => {
    const r = run(her(), at(2026, 11, 5));
    expect(bg(r.windows.next7.items)).toHaveLength(0);
    expect(bg(r.windows.next14.items)).toEqual([expect.objectContaining({ date: '2026-11-18', amount: 750, status: 'inferred' })]);
    expect(r.lines.availableCash).toBe(5774); // the verified balance is untouched
  });
  it('after the Nov 4 payment is imported, the same: nothing on Nov 4 or 5, Nov 18 once', () => {
    const r = run(her({ nov4Imported: true }), at(2026, 11, 5));
    expect(bg(r.windows.next14.items).map((i) => i.date)).toEqual(['2026-11-18']);
  });
  it('on Nov 4, with the balance last checked Nov 3 (before the payment): the Nov 4 payment is due ONCE, not on the 4th and the 5th', () => {
    const r = run(her({ checkpointDay: '2026-11-03' }), at(2026, 11, 4));
    expect(bg(r.windows.next7.items)).toEqual([expect.objectContaining({ date: '2026-11-04', amount: 750 })]);
  });
  it('a guessed payment dated on the day the bank balance was checked is inside that balance: listed as paid and cleared, not subtracted', () => {
    // Checked on Nov 4 (end of day) and viewed on Nov 4: the Nov 4 payment is in the $5,774.
    const r = run(her({ checkpointDay: '2026-11-04' }), at(2026, 11, 4));
    expect(bg(r.windows.next7.items)).toHaveLength(0);
    expect(bg(r.windows.cleared.items)).toEqual([expect.objectContaining({ date: '2026-11-04', amount: 750, how: 'in-bank-balance', bankCheckedOn: '2026-11-04' })]);
  });
  it('Safe to Spend and Available for Extra Debt Payments use only the outstanding $750 on Nov 18', () => {
    const d = her();
    d.moneyPlan.settings = { reserveByEntity: { personal: 1000 } }; // a reserve that leaves room, so the arithmetic shows
    const r = run(d, at(2026, 11, 5));
    expect(r.lines.billsDue).toBe(750);
    expect(r.safeToSpendNow).toBe(5774 - 750 - 1000 - r.lines.livingExpenses);
    expect(extraDebtCapacity(d, { currentDate: at(2026, 11, 5), period: '14d', scope: 'personal' }).amount).toBeLessThanOrEqual(r.safeToSpendNow);
  });
});

describe('possible duplicates are counted once and shown, never silently dropped', () => {
  const sc = (d) => resolveScope(d, 'personal');
  it('two confirmed records for one creditor, a regular bill and a payment arrangement 2 days apart, count once; the arrangement is kept', () => {
    const d = her();
    d.recurringObligations = [
      { id: 'ro-bill', name: 'Britt & Gaines', amount: 375, frequency: 'monthly', nextDue: '2026-11-07', accountId: 'a-7206', enabled: true, type: 'regular' },
      { id: 'ro-arr', name: 'Britt and Gaines', amount: 375, frequency: 'monthly', nextDue: '2026-11-09', accountId: 'a-7206', enabled: true, type: 'arrangement' },
    ];
    const ob = obligationEvents(d, sc(d), at(2026, 11, 5), at(2026, 11, 19), {}, { asOf: at(2026, 11, 5) });
    const bri = ob.events.filter((e) => /Britt/.test(e.label));
    expect(bri).toHaveLength(1);
    expect(bri[0].obligationType).toBe('arrangement');
    expect(ob.duplicates).toEqual([expect.objectContaining({ label: 'Britt & Gaines', amount: 375, duplicateOf: expect.objectContaining({ label: 'Britt and Gaines' }) })]);
  });
  it('two confirmed regular bills to one payee are both kept (legitimate obligations are never removed)', () => {
    const d = her();
    d.recurringObligations = [
      { id: 'a', name: 'Car insurance', amount: 150, frequency: 'monthly', nextDue: '2026-11-07', accountId: 'a-7206', enabled: true },
      { id: 'b', name: 'Car insurance', amount: 150, frequency: 'monthly', nextDue: '2026-11-08', accountId: 'a-7206', enabled: true },
    ];
    const ob = obligationEvents(d, sc(d), at(2026, 11, 5), at(2026, 11, 19), {}, { asOf: at(2026, 11, 5) });
    expect(ob.events.filter((e) => /Car insurance/.test(e.label))).toHaveLength(2);
  });
  it('different amounts to one payee are two obligations (her Britt & Gaines $375 and Britt and Gaines $300)', () => {
    const d = her();
    d.recurringObligations = [
      { id: 'a', name: 'Britt & Gaines', amount: 375, frequency: 'monthly', nextDue: '2026-11-07', accountId: 'a-7206', enabled: true },
      { id: 'b', name: 'Britt and Gaines', amount: 300, frequency: 'monthly', nextDue: '2026-11-07', accountId: 'a-7206', enabled: true, type: 'arrangement' },
    ];
    const ob = obligationEvents(d, sc(d), at(2026, 11, 5), at(2026, 11, 19), {}, { asOf: at(2026, 11, 5) });
    expect(ob.events.filter((e) => /Britt/.test(e.label)).map((e) => e.amount).sort((p, q) => p - q)).toEqual([-375, -300]);
  });
});

describe('confirm, correct or dismiss a guessed bill without touching the bank transactions', () => {
  it('"Not a bill" in Bills Review takes BG & Mom out of Bills Due and Safe to Spend; every transaction is kept', () => {
    const d = her();
    const key = suggestBills(d, at(2026, 11, 5)).find((x) => /BG & Mom/i.test(x.name)).key;
    d.moneyPlan.billReview = { dismissed: { [key]: '2026-11-05T12:00:00Z' } };
    const before = d.transactions.length;
    const r = run(d, at(2026, 11, 5), '30d');
    expect(bg(r.items)).toHaveLength(0);
    expect(d.transactions).toHaveLength(before);
    expect(r.assumptions.some((a) => /Not a bill/.test(a))).toBe(true);
  });
  it('a confirmed bill replaces its guess, so the payee is never counted through both', () => {
    const d = her();
    d.recurringObligations = [{ id: 'ro-bg', name: 'BG & Mom', paidAs: 'Zelle to BG & Mom', amount: 750, frequency: 'biweekly', nextDue: '2026-11-18', accountId: 'a-7206', enabled: true }];
    const r = run(d, at(2026, 11, 5), '30d');
    expect(bg(r.items).map((i) => [i.date, i.kind])).toEqual([['2026-11-18', 'bill'], ['2026-12-02', 'bill']]);
    expect(bg(r.windows.next14.items)[0].status).toBe('confirmed');
  });
});

let host = null; let root = null;
afterEach(() => { if (root) act(() => root.unmount()); if (host) host.remove(); root = null; host = null; });

describe('the Overview panel shows each state', () => {
  it('BG & Mom once, the cleared Nov 4 payment in "Paid and cleared", labeled by state', async () => {
    const d = her({ checkpointDay: '2026-11-04' });
    const today = at(2026, 11, 4);
    const opts = { currentDate: today, period: '14d', scope: 'personal' };
    const result = buildSafeToSpend(d, opts);
    const show = (n) => `$${Number(n || 0).toFixed(2)}`;
    host = document.createElement('div'); document.body.appendChild(host);
    await act(async () => { root = createRoot(host); root.render(createElement(MoneyComingUp, { result, extra: extraDebtCapacity(d, opts), show, entities: d.entities })); });
    const next7 = host.querySelector('[data-testid="coming-up-next7"]').textContent;
    expect(next7).not.toMatch(/BG & Mom/);
    const cleared = host.querySelector('[data-testid="coming-up-cleared"]').textContent;
    expect(cleared).toMatch(/Zelle to BG & Mom · inside your bank balance checked 2026-11-04\$750\.00/);
    const next14 = host.querySelector('[data-testid="coming-up-next14"]').textContent;
    expect(next14.match(/BG & Mom/g)).toHaveLength(1);
    expect(next14).toMatch(/2026-11-18Zelle to BG & Mom · due day assumed · Inferred from history, not confirmed\$750\.00/);
    expect(host.querySelector('[data-testid="coming-up-duplicates"]')).toBeTruthy();
  });
});
