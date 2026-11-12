// money-balance-trace.test.js — WHY a bank-verified account reads what it reads,
// and a row dated tomorrow is not cleared tonight (Christina, 2026-11-11: the
// bank showed Poe Properties 3322 at $4,479.53 and TLC 8168 at $370.69 while
// the app showed about $2,540 and $38).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { balanceTrace, deriveAccountBalances, balanceCheckpointRow } from '../lib/financial-engineering.js';

// The family's clock: the day-boundary case below only bites west of UTC
// (`new Date('2026-11-12')` is UTC midnight = 6pm on the 11th in Kansas), so the
// file runs on Central time and puts the clock back afterwards.
const TZ_BEFORE = process.env.TZ;
beforeAll(() => {
  process.env.TZ = 'America/Chicago';
});
afterAll(() => {
  if (TZ_BEFORE === undefined) delete process.env.TZ;
  else process.env.TZ = TZ_BEFORE;
});

const NOV11 = new Date(2026, 10, 11, 12);

function books() {
  return {
    accounts: [
      { id: 'a-3322', name: 'Chase Poe Properties', fragment: '...3322', type: 'checking', entityId: 'e-props', balance: 0 },
      { id: 'a-8168', name: 'Chase TLC', fragment: '...8168', type: 'checking', entityId: 'e-tlc', balance: 38 },
    ],
    transactions: [
      { id: 'cp', ...balanceCheckpointRow('a-3322', 4479.53, '2026-11-09', { basis: 'available', source: 'screenshot chase3322.png' }) },
      { id: 'old', date: '2026-11-08', accountId: 'a-3322', amount: -500, description: 'before the check: inside the balance', category: 'other' },
      { id: 'r1', date: '2026-11-10', accountId: 'a-3322', amount: -1200, description: 'FIRST STATE BANK LOAN 5312', category: 'mortgage' },
      { id: 'r2', date: '2026-11-10', accountId: 'a-3322', amount: -739.53, description: 'EVERGY', category: 'utilities', source: 'screenshot' },
      // TLC: never checked against the bank → anchor + rows
      { id: 't1', date: '2026-11-01', accountId: 'a-8168', amount: 100, description: 'Zelle from client', category: 'income' },
      { id: 't2', date: '2026-11-03', accountId: 'a-8168', amount: -100, description: 'SimplePractice', category: 'software' },
    ],
  };
}

describe('balanceTrace explains the displayed balance to the cent', () => {
  it('Poe Properties 3322: the 11-09 check plus the two rows dated after it = $2,540.00, and names both rows', () => {
    const t = balanceTrace(books(), 'a-3322', NOV11);
    expect(t.checkpoint).toMatchObject({ day: '2026-11-09', balance: 4479.53, basis: 'available' });
    expect(t.rowsSince.map((r) => r.id)).toEqual(['r1', 'r2']); // never the row before the check
    expect(t.sumSince).toBe(-1939.53);
    expect(t.balance).toBe(2540);
    expect(t.balance).toBe(deriveAccountBalances(books(), NOV11)['a-3322']); // the same figure every screen shows
    expect(t.rowsSince[1].source).toBe('screenshot');
  });
  it('TLC 8168 with no bank check: the anchor and every cleared row', () => {
    const t = balanceTrace(books(), 'a-8168', NOV11);
    expect(t.checkpoint).toBeNull();
    expect(t.anchor).toBe(38);
    expect(t.rowsSince.length).toBe(2);
    expect(t.balance).toBe(38);
  });
  it('a newer bank check outranks the rows: today’s screenshot at $4,479.53 makes the balance $4,479.53 again', () => {
    const d = books();
    d.transactions.push({ id: 'cp2', ...balanceCheckpointRow('a-3322', 4479.53, '2026-11-11', { basis: 'available', source: 'screenshot today.png' }) });
    const t = balanceTrace(d, 'a-3322', NOV11);
    expect(t.checkpoint.day).toBe('2026-11-11');
    expect(t.rowsSince).toEqual([]);
    expect(t.balance).toBe(4479.53);
    expect(deriveAccountBalances(d, NOV11)['a-3322']).toBe(4479.53);
  });
});

describe('a row is cleared by its calendar day, not by UTC midnight (PROVEN TO CATCH)', () => {
  it('a bill-pay row dated tomorrow is not subtracted from the verified balance at 8pm tonight', () => {
    const d = books();
    d.transactions.push({ id: 'tmrw', date: '2026-11-12', accountId: 'a-3322', amount: -2000, description: 'scheduled for tomorrow', category: 'other' });
    const tonight = new Date(2026, 10, 11, 20, 0); // 8pm local on the 11th; UTC is already the 12th in Central time
    expect(deriveAccountBalances(d, tonight)['a-3322']).toBe(2540);
    expect(balanceTrace(d, 'a-3322', tonight).rowsSince.map((r) => r.id)).toEqual(['r1', 'r2']);
    // and it IS counted once the day arrives
    expect(deriveAccountBalances(d, new Date(2026, 10, 12, 8))['a-3322']).toBe(540);
  });
  it('an account with no checkpoint: the same rule for its anchor arithmetic', () => {
    const d = books();
    d.transactions.push({ id: 'tmrw2', date: '2026-11-12', accountId: 'a-8168', amount: -30, description: 'tomorrow', category: 'other' });
    expect(deriveAccountBalances(d, new Date(2026, 10, 11, 23, 30))['a-8168']).toBe(38);
    expect(deriveAccountBalances(d, new Date(2026, 10, 12, 0, 30))['a-8168']).toBe(8);
  });
});
