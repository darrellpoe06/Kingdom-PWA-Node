// safe-to-spend.test.js — the Safe-to-Spend engine, proven on a controlled ledger.
// Every case is a rule the engine's header states; each one was written to FAIL
// against a naive "income minus expenses" model before the engine existed.
import { describe, it, expect } from 'vitest';
import {
  buildSafeToSpend, expandOccurrences, resolveScope, incomeEvents, obligationEvents,
  monthlyAccruals, ledgerFreshness,
} from '../lib/safe-to-spend.js';

const TODAY = new Date(2026, 9, 28); // 2026-10-28 (local)

function fixture(overrides = {}) {
  return {
    meta: { bufferTarget: 500, lastUpdated: '2026-10-27' },
    entities: [
      { id: 'e-personal', name: 'Personal', type: 'personal' },
      { id: 'e-biz', name: 'Business LLC', type: 'business' },
    ],
    accounts: [
      { id: 'chk', entityId: 'e-personal', name: 'Checking', type: 'checking', balance: 3000, openingBalance: 3000 },
      { id: 'sav', entityId: 'e-personal', name: 'Savings', type: 'savings', balance: 1000, openingBalance: 1000 },
      { id: 'cc', entityId: 'e-personal', name: 'Visa', type: 'credit', balance: -2000, openingBalance: -2000, minPayment: 100, rate: 20, dueDay: 20 },
      { id: 'biz-chk', entityId: 'e-biz', name: 'Biz Operating', type: 'checking', balance: 8000, openingBalance: 8000 },
      { id: 'legal', entityId: 'e-personal', name: 'Frozen', type: 'checking', balance: 9999, openingBalance: 9999, inLegal: true },
    ],
    transactions: [
      // three biweekly payroll deposits → an inferable rhythm (last 2026-10-23 → next 2026-11-06)
      { id: 'p1', date: '2026-09-25', accountId: 'chk', amount: 1500, description: 'ACME PAYROLL', category: 'salary' },
      { id: 'p2', date: '2026-10-09', accountId: 'chk', amount: 1500, description: 'ACME PAYROLL', category: 'salary' },
      { id: 'p3', date: '2026-10-23', accountId: 'chk', amount: 1500, description: 'ACME PAYROLL', category: 'salary' },
      // a pending-looking row dated today: already in the balance, never counted twice
      { id: 'pend', date: '2026-10-28', accountId: 'chk', amount: -40, description: 'Coffee (pending)', pending: true, category: 'dining' },
      // a transfer between own accounts: never income
      { id: 'xfer', date: '2026-10-30', accountId: 'chk', amount: 500, description: 'Online transfer from savings', category: 'transfer', isTransfer: true },
      // a scheduled future-dated payment
      { id: 'sched', date: '2026-11-03', accountId: 'chk', amount: -200, description: 'Water bill (scheduled)', category: 'utilities' },
    ],
    inflows: { salaries: [{ id: 's1', who: 'Adam', source: 'ACME salary', expected: 3250, actual: 3250, entityId: 'e-personal' }], rentals: [] },
    outflows: { household: 1200, debtService: 400, rentalMortgages: 0, charitableGiving: 0 },
    recurringObligations: [
      // nextDue in the PAST: must roll forward to 2026-11-01 (the Tx-Upcoming defect)
      { id: 'ro-rent', name: 'Rent', amount: 1500, frequency: 'monthly', nextDue: '2026-10-01', entityId: 'e-personal', category: 'housing', enabled: true },
      { id: 'ro-biz', name: 'Software', amount: 300, frequency: 'monthly', nextDue: '2026-11-05', entityId: 'e-biz', category: 'business', enabled: true },
    ],
    taxCalendar: [{ id: 'tx-q4', month: 1, day: 15, name: 'Estimated tax Q4', entityIds: ['e-personal'], applies: true, amount: 1200 }],
    incidents: [],
    debts: [],
    events: [],
    ...overrides,
  };
}

describe('expandOccurrences — rolls a due date forward instead of dropping it', () => {
  it('a monthly due date in the past lands on its next occurrence inside the window', () => {
    const occ = expandOccurrences('2026-10-01', 'monthly', new Date(2026, 9, 28), new Date(2026, 10, 30)).map((d) => d.toISOString().slice(0, 10));
    expect(occ).toEqual(['2026-11-01']);
  });
  it('clamps the 31st to a shorter month', () => {
    const occ = expandOccurrences('2026-01-31', 'monthly', new Date(2026, 1, 1), new Date(2026, 3, 30)).map((d) => `${d.getMonth() + 1}/${d.getDate()}`);
    expect(occ).toEqual(['2/28', '3/31', '4/30']);
  });
  it('biweekly steps by 14 days', () => {
    const occ = expandOccurrences('2026-11-06', 'biweekly', new Date(2026, 9, 28), new Date(2026, 11, 10)).map((d) => d.getDate());
    expect(occ).toEqual([6, 20, 4]);
  });
});

describe('scope — business money is never personal spending money', () => {
  it('personal scope excludes the business account, the legal hold and the credit card', () => {
    const r = buildSafeToSpend(fixture(), { currentDate: TODAY, period: '14d', scope: 'personal' });
    // checking: opening 3000 + three 1500 deposits - 40 pending = 7460; savings 1000. Derived, not typed (DR-0076).
    expect(r.lines.availableCash).toBe(8460);
  });
  it('a business entity scope sees only its own cash and its own obligations', () => {
    const r = buildSafeToSpend(fixture(), { currentDate: TODAY, period: '14d', scope: 'e-biz' });
    expect(r.lines.availableCash).toBe(8000);
    expect(r.items.map((i) => i.label)).toContain('Software');
    expect(r.items.map((i) => i.label)).not.toContain('Rent');
  });
  it('consolidated sums per-entity results, each floored at zero (no cross-subsidy)', () => {
    const data = fixture();
    data.accounts[0].openingBalance = -4400; // derived checking = 60: personal nearly empty
    const r = buildSafeToSpend(data, { currentDate: TODAY, period: '14d', scope: 'consolidated' });
    const personal = r.byEntity.find((e) => e.scope.id === 'e-personal');
    const biz = r.byEntity.find((e) => e.scope.id === 'e-biz');
    expect(personal.safeToSpendNow).toBe(0);
    expect(personal.shortfall).toBeGreaterThan(0);
    expect(r.safeToSpendNow).toBe(biz.safeToSpendNow);
  });
});

describe('the chronological walk', () => {
  it('a row dated today is already in the balance and is not subtracted again', () => {
    const r = buildSafeToSpend(fixture(), { currentDate: TODAY, period: '7d', scope: 'personal' });
    expect(r.items.find((i) => i.refId === 'pend')).toBeUndefined();
    expect(r.explanation[0]).toMatch(/pending rows are not subtracted again/);
  });
  it('a transfer between own accounts is never income', () => {
    const r = buildSafeToSpend(fixture(), { currentDate: TODAY, period: '7d', scope: 'personal' });
    expect(r.items.find((i) => i.refId === 'xfer')).toBeUndefined();
    expect(r.lines.expectedIncome).toBe(0); // the next inferred paycheck is 11-06, outside 7 days
  });
  it('a future-dated ledger row is a dated event on its day', () => {
    const r = buildSafeToSpend(fixture(), { currentDate: TODAY, period: '14d', scope: 'personal' });
    const sched = r.items.find((i) => i.refId === 'sched');
    expect(sched).toMatchObject({ date: '2026-11-03', amount: -200, kind: 'scheduled' });
  });
  it('expected income counts on its day, never before — so the lowest point comes BEFORE payday', () => {
    const r = buildSafeToSpend(fixture(), { currentDate: TODAY, period: '14d', scope: 'personal' });
    const pay = r.items.filter((i) => i.kind === 'income');
    expect(pay.length).toBe(1);
    expect(pay[0]).toMatchObject({ date: '2026-11-06', amount: 1500, inferred: true });
    expect(r.lines.projectedLowest.date < '2026-11-06').toBe(true);
    expect(r.lines.nextIncome).toMatchObject({ date: '2026-11-06', inferred: true });
    expect(r.status).toBe('estimate'); // inferred timing is labeled, never passed off as verified
  });
  it('a positive period-end balance does not make money spendable today', () => {
    // Rent 1500 on 11-01 + water 200 on 11-03 drain the balance before the 11-06 paycheck lifts it.
    const r = buildSafeToSpend(fixture(), { currentDate: TODAY, period: '14d', scope: 'personal' });
    const end = r.timeline[r.timeline.length - 1].cash;
    expect(end).toBeGreaterThan(r.lines.projectedLowest.amount);
    expect(r.safeToSpendNow).toBeLessThan(end - r.lines.minCushion);
    expect(r.safeToSpendNow).toBe(Math.max(0, Math.round((r.lines.projectedLowest.amount - 500) * 100) / 100));
  });
  it('never shows a negative spendable amount; the shortfall is reported separately', () => {
    const data = fixture();
    data.accounts[0].openingBalance = -3560; data.accounts[1].openingBalance = 0; // derived checking = 900, savings = 0
    const r = buildSafeToSpend(data, { currentDate: TODAY, period: '14d', scope: 'personal' });
    expect(r.safeToSpendNow).toBe(0);
    expect(r.shortfall).toBeGreaterThan(0);
    expect(r.overdraftDate).toBe('2026-11-01');
  });
});

describe('never counted twice', () => {
  it('debtService and rentalMortgages buckets are not accrued as living expenses (dated items carry them)', () => {
    const acc = monthlyAccruals(fixture(), resolveScope(fixture(), 'personal'), TODAY, new Date(2026, 10, 11));
    expect(acc.livingParts.debtService).toBeUndefined();
    expect(acc.living).toBe(1200);
  });
  it('a debt whose payment is already a hand-entered obligation counts once', () => {
    const data = fixture({ recurringObligations: [{ id: 'ro-visa', name: 'Visa', amount: 150, frequency: 'monthly', nextDue: '2026-11-20', entityId: 'e-personal', category: 'debt', enabled: true }] });
    const ev = obligationEvents(data, resolveScope(data, 'personal'), TODAY, new Date(2026, 10, 30), {}, { asOf: TODAY });
    const visa = ev.events.filter((e) => /visa/i.test(e.label));
    expect(visa).toHaveLength(1);
    expect(visa[0].source).toBe('obligation');
  });
  it('the card minimum lands on its due day once when no obligation carries it', () => {
    const data = fixture();
    const ev = obligationEvents(data, resolveScope(data, 'personal'), TODAY, new Date(2026, 10, 30), {}, { asOf: TODAY });
    const visa = ev.events.filter((e) => e.kind === 'debt-min');
    expect(visa).toHaveLength(1);
    expect(visa[0]).toMatchObject({ date: '2026-11-20', amount: -100, assumed: false });
  });
  it('an inferred recurring payment is carved out of the household figure', () => {
    const data = fixture();
    for (let i = 0; i < 4; i++) data.transactions.push({ id: `nf${i}`, date: `2026-${String(7 + i).padStart(2, '0')}-15`, accountId: 'chk', amount: -15.99, description: 'NETFLIX.COM', category: 'subscriptions' });
    const sc = resolveScope(data, 'personal');
    const ev = obligationEvents(data, sc, TODAY, new Date(2026, 11, 15), {}, { asOf: TODAY });
    expect(ev.inferredMonthly.items.map((i) => i.label)).toContain('NETFLIX.COM');
    const acc = monthlyAccruals(data, sc, TODAY, new Date(2026, 11, 15), {}, { inferredMonthlyTotal: ev.inferredMonthly.total });
    expect(acc.livingParts.household).toBeLessThan(1200);
    expect(acc.notes[0]).toMatch(/counted once/);
  });
  it('a tax item dated inside the window is an event; one outside accrues instead', () => {
    const sc = resolveScope(fixture(), 'personal');
    const inside = obligationEvents(fixture(), sc, new Date(2027, 0, 10), new Date(2027, 0, 20), {}, { asOf: new Date(2027, 0, 10) });
    expect(inside.events.some((e) => e.kind === 'tax' && e.amount === -1200)).toBe(true);
    const accIn = monthlyAccruals(fixture(), sc, new Date(2027, 0, 10), new Date(2027, 0, 20));
    expect(accIn.tax).toBe(0);
    const accOut = monthlyAccruals(fixture(), sc, TODAY, new Date(2026, 10, 11));
    expect(accOut.tax).toBe(100);
  });
});

describe('honesty — estimates, unavailable, and the pay schedule', () => {
  it('with no spendable account the status is unavailable, not $0', () => {
    const data = fixture({ accounts: [] });
    const r = buildSafeToSpend(data, { currentDate: TODAY, period: '14d', scope: 'personal' });
    expect(r.status).toBe('unavailable');
  });
  it('a stale ledger is labeled an estimate', () => {
    const data = fixture();
    data.transactions = data.transactions.map((t) => ({ ...t, date: t.date.replace('2026-', '2025-') }));
    const r = buildSafeToSpend(data, { currentDate: TODAY, period: '14d', scope: 'personal' });
    expect(r.status).toBe('estimate');
    expect(r.confidence.reasons.join(' ')).toMatch(/days old/);
  });
  it('an entered pay schedule beats inference and makes the result verified', () => {
    const data = fixture();
    data.accounts[2].dueDay = 20;
    const r = buildSafeToSpend(data, { currentDate: TODAY, period: '14d', scope: 'personal', settings: { incomeSchedule: { s1: { frequency: 'biweekly', nextDate: '2026-11-06' } }, minCushion: 500 } });
    const pay = r.items.filter((i) => i.kind === 'income');
    expect(pay[0]).toMatchObject({ date: '2026-11-06', inferred: false, amount: 1500 });
    expect(r.status).toBe('verified');
  });
  it('with no pay dates known, expected income is left out and the assumption says so', () => {
    const data = fixture({ transactions: [] });
    const r = buildSafeToSpend(data, { currentDate: TODAY, period: '14d', scope: 'personal' });
    expect(r.lines.expectedIncome).toBe(0);
    expect(r.assumptions.join(' ')).toMatch(/LEFT OUT/);
  });
  it('"until next paycheck" ends on the next pay date, or 14 days when none is known', () => {
    const withPay = buildSafeToSpend(fixture(), { currentDate: TODAY, period: 'next-paycheck', scope: 'personal' });
    expect(withPay.period.end).toBe('2026-11-06');
    const noPay = buildSafeToSpend(fixture({ transactions: [] }), { currentDate: TODAY, period: 'next-paycheck', scope: 'personal' });
    expect(noPay.period.days).toBe(14);
  });
  it('freshness reads the newest settled row on the spendable accounts', () => {
    const f = ledgerFreshness(fixture(), resolveScope(fixture(), 'personal'), TODAY);
    expect(f.ledgerAsOf).toBe('2026-10-28');
    expect(f.stale).toBe(false);
  });
  it('incomeEvents lays rent on the rent due day for paying doors only', () => {
    const data = fixture({ inflows: { salaries: [], rentals: [
      { id: 'r1', name: 'Door A', rent: 1000, actual: 1000, status: 'paying', entityId: 'e-biz' },
      { id: 'r2', name: 'Door B', rent: 900, actual: 0, status: 'vacant', entityId: 'e-biz' },
    ] } });
    const inc = incomeEvents(data, resolveScope(data, 'e-biz'), TODAY, new Date(2026, 10, 30), { rentDueDay: 5 }, TODAY);
    expect(inc.events).toHaveLength(1);
    expect(inc.events[0]).toMatchObject({ date: '2026-11-05', amount: 1000 });
  });
});
