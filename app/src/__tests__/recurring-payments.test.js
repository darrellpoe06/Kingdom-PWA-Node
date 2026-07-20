// @vitest-environment node
//
// recurring-payments — the repeating patterns in the imported ledger (Darrell
// 2026-07-20: "repetitive patterns of payments should also be highlighted").
// Pins: a monthly same-payee same-amount stream is detected; varying amounts and
// irregular timing are NOT painted as recurring; the payee key normalizes the bank
// noise; and recurringTxIds badges the right rows.
import { describe, it, expect } from 'vitest';
import { detectRecurring, recurringTxIds, payeeKey } from '../lib/recurring-payments.js';

const nowMs = Date.parse('2026-07-20T00:00:00');

describe('payeeKey', () => {
  it('strips dates / store numbers / punctuation to a stable key', () => {
    expect(payeeKey('CASH APP*DARRELL POE*C OAKLAND CA 121492 07/13')).toBe('CASH APP DARRELL');
    expect(payeeKey('NETFLIX.COM 866-579-7172')).toBe('NETFLIX COM');
  });
});

describe('detectRecurring', () => {
  const monthly = [
    { id: 'n1', date: '2026-03-05', amount: -15.49, description: 'NETFLIX.COM' },
    { id: 'n2', date: '2026-04-05', amount: -15.49, description: 'NETFLIX.COM' },
    { id: 'n3', date: '2026-05-05', amount: -15.49, description: 'NETFLIX.COM' },
    { id: 'n4', date: '2026-06-05', amount: -15.49, description: 'NETFLIX.COM' },
    // groceries — same payee-ish but wildly varying amounts + irregular timing
    { id: 'g1', date: '2026-05-02', amount: -212.55, description: 'KROGER 4521' },
    { id: 'g2', date: '2026-05-09', amount: -47.10, description: 'KROGER 4521' },
    { id: 'g3', date: '2026-06-19', amount: -180.00, description: 'KROGER 4521' },
  ];

  it('detects a monthly fixed subscription', () => {
    const out = detectRecurring(monthly, { nowMs });
    const netflix = out.find((g) => g.key.includes('NETFLIX'));
    expect(netflix).toBeTruthy();
    expect(netflix.cadence).toBe('monthly');
    expect(netflix.count).toBe(4);
    expect(netflix.amount).toBeCloseTo(15.49, 2);
    expect(netflix.nextExpected).toBeInstanceOf(Date);
  });

  it('does NOT report the varying-amount, irregular grocery spend as recurring', () => {
    const out = detectRecurring(monthly, { nowMs });
    expect(out.find((g) => g.key.includes('KROGER'))).toBeUndefined();
  });

  it('needs at least 3 hits', () => {
    const two = monthly.filter((t) => ['n1', 'n2'].includes(t.id));
    expect(detectRecurring(two, { nowMs })).toHaveLength(0);
  });

  it('recurringTxIds badges every row in a detected group', () => {
    const ids = recurringTxIds(monthly, { nowMs });
    expect(ids.has('n1')).toBe(true);
    expect(ids.has('n4')).toBe(true);
    expect(ids.has('g1')).toBe(false);
  });

  it('can detect recurring INCOME (direction:in) — e.g. payroll', () => {
    const payroll = [
      { id: 's1', date: '2026-05-01', amount: 2099.93, description: 'UNIV OF IL PAYROLL' },
      { id: 's2', date: '2026-06-01', amount: 2099.93, description: 'UNIV OF IL PAYROLL' },
      { id: 's3', date: '2026-07-01', amount: 2099.93, description: 'UNIV OF IL PAYROLL' },
    ];
    const out = detectRecurring(payroll, { direction: 'in', nowMs });
    expect(out).toHaveLength(1);
    expect(out[0].direction).toBe('in');
    expect(out[0].cadence).toBe('monthly');
  });
});
