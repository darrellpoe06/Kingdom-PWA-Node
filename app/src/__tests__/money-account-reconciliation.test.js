// Reconciling Chase 7206 against the bank, read only (Christina 2026-11-18:
// "reconciling my actual Chase balance, transactions, and unpaid bills so
// Safe-to-Spend becomes reliable").
import { describe, it, expect } from 'vitest';
import { reconcileAccount } from '../lib/account-reconciliation.js';
import { balanceCheckpointRow } from '../lib/financial-engineering.js';

const asOf = new Date(2026, 10, 18, 12);
const ACCT = { id: 'a-7206', name: 'Chase 7206', type: 'checking', entityId: 'e-personal', balance: 0 };
// A complete Chase run, oldest first, each row carrying the bank's balance after it.
const CHAIN = [
  { id: 'r1', date: '2026-11-14', description: 'PAYROLL', amount: 1500, balance: 3000 },
  { id: 'r2', date: '2026-11-15', description: 'Zelle payment to TLC', amount: -837, balance: 2163 },
  { id: 'r3', date: '2026-11-15', description: 'Transfer from GMR ...3800', amount: 55, balance: 2218 },
  { id: 'r4', date: '2026-11-16', description: 'CIRCLE K', amount: -40, balance: 2178 },
  { id: 'r5', date: '2026-11-17', description: 'Grocery', amount: -118.22, balance: 2059.78 },
].map((r) => ({ ...r, accountId: 'a-7206' }));
const book = ({ rows = CHAIN, cp = { balance: 2059.78, day: '2026-11-17' }, bills = [] } = {}) => ({
  entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }],
  accounts: [ACCT],
  transactions: [...(cp ? [{ id: 'cp', ...balanceCheckpointRow('a-7206', cp.balance, cp.day, { basis: 'available' }) }] : []), ...rows],
  recurringObligations: bills,
  inflows: { salaries: [], rentals: [] },
  moneyPlan: { settings: {} },
});

describe('the books against the bank', () => {
  it('an unbroken chain ending on the bank balance, with no bills, is reconciled', () => {
    const r = reconcileAccount(book(), 'a-7206', { asOf });
    expect(r.status).toBe('reconciled');
    expect(r.bank).toEqual({ balance: 2059.78, day: '2026-11-17', basis: 'available' });
    expect(r.chain).toMatchObject({ ok: true, checked: 5, opening: 1500, closing: 2059.78 });
    expect(r.chainVsBank).toMatchObject({ lastRunning: 2059.78, diff: 0 });
    expect(r.findings).toEqual([]);
  });

  it('a missing row breaks the chain and the finding brackets where to look', () => {
    const r = reconcileAccount(book({ rows: CHAIN.filter((t) => t.id !== 'r3') }), 'a-7206', { asOf });
    expect(r.status).toBe('needs-attention');
    expect(r.chain.ok).toBe(false);
    expect(r.findings[0]).toMatch(/missing or doubled/);
    expect(r.findings[0]).toContain('$2,163.00');
    expect(r.findings[0]).toContain('$2,218.00');
  });

  it('a gap equal to the pending charges is explained, not a finding', () => {
    const rows = [...CHAIN, { id: 'p1', accountId: 'a-7206', date: '2026-11-17', description: 'PENDING SHELL', amount: -25, pending: true }];
    const r = reconcileAccount(book({ rows, cp: { balance: 2034.78, day: '2026-11-17' } }), 'a-7206', { asOf });
    expect(r.chainVsBank).toMatchObject({ diff: -25, pending: -25, explainedByPending: true });
    expect(r.findings).toEqual([]);
  });

  it('any other difference from the bank is a finding, with the amount', () => {
    const r = reconcileAccount(book({ cp: { balance: 2000, day: '2026-11-17' } }), 'a-7206', { asOf });
    expect(r.chainVsBank.diff).toBe(-59.78);
    expect(r.findings.join(' ')).toMatch(/differs from the bank.*−\$59\.78/);
  });

  it('rows after the bank’s day are not yet confirmed', () => {
    const r = reconcileAccount(book({ cp: { balance: 2178, day: '2026-11-16' } }), 'a-7206', { asOf });
    expect(r.sinceVerified).toEqual({ count: 1, net: -118.22 });
    expect(r.findings.join(' ')).toMatch(/1 row \(−\$118\.22\) dated after 2026-11-16 is not yet confirmed/);
  });
});

describe('the bills Safe-to-Spend reserves', () => {
  it('lists a dated bill with its date and amount', () => {
    const bills = [
      { id: 'b1', name: 'Electric', enabled: true, amount: 140, frequency: 'monthly', nextDue: '2026-11-25', entityId: 'e-personal', accountId: 'a-7206' },
    ];
    const r = reconcileAccount(book({ bills }), 'a-7206', { asOf });
    expect(r.bills.items).toContainEqual(expect.objectContaining({ date: '2026-11-25', label: 'Electric', amount: 140 }));
    expect(r.bills.dateNeeded).toEqual([]);
  });
  it('flags a card minimum with no due day on file, reserved from today', () => {
    const data = book();
    data.accounts = [...data.accounts, { id: 'a-visa', name: 'Visa', type: 'credit', entityId: 'e-personal', balance: -900, minPayment: 35, rate: 22 }];
    const r = reconcileAccount(data, 'a-7206', { asOf });
    expect(r.bills.dateNeeded.map((b) => b.amount)).toContain(35);
    expect(r.findings.join(' ')).toMatch(/no due date on file .* reserved from today: add the real due date/);
    expect(r.status).toBe('needs-attention');
  });
});

describe('honest when there is not enough', () => {
  it('no bank balance and no running balances: not enough data, and says what to upload', () => {
    const r = reconcileAccount(book({ rows: CHAIN.map(({ balance, ...t }) => t), cp: null }), 'a-7206', { asOf });
    expect(r.status).toBe('not-enough-data');
    expect(r.findings[0]).toMatch(/upload the account-details screenshot/);
  });
  it('changes nothing in the books', () => {
    const data = book();
    const frozen = JSON.stringify(data);
    reconcileAccount(data, 'a-7206', { asOf });
    expect(JSON.stringify(data)).toBe(frozen);
  });
});
