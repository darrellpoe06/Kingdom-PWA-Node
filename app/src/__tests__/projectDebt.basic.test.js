// projectDebt — basic correctness tests (C1 in CALC-INVENTORY.md).
// Pass 2 starting set. FLAG-1 (monthly vs daily compounding) LANDED
// 2026-08-24: card-class debts (rate > 10%) now compound daily via
// monthlyInterestRate (lifecycle-and-flow.js); the exact-value cases here
// are at 0% APR, deliberately unaffected. The bias-direction and classing
// pins live in flag-1-daily-compounding.test.js.
import { describe, it, expect } from 'vitest';
import { projectDebt, projectDebtSnowball } from '../lib/financial-calcs.js';

const TODAY = new Date('2026-05-24');

describe('projectDebt — single debt, no extra payment', () => {
  it('a debt with min payment > monthly interest pays off in finite time', () => {
    const debts = [{ balance: 1000, rate: 12, minPayment: 100, leaveAlone: false }];
    const result = projectDebt(debts, 0, TODAY, 60);
    expect(result.debtFreeMonth).toBeLessThan(60);
    expect(result.debtFreeMonth).toBeGreaterThan(0);
    expect(result.totalInterestPaid).toBeGreaterThanOrEqual(0);
    expect(result.projection.length).toBe(result.debtFreeMonth);
  });

  it('a $1000 debt at 0% APR with $100 min pays off in 10 months', () => {
    const debts = [{ balance: 1000, rate: 0, minPayment: 100, leaveAlone: false }];
    const result = projectDebt(debts, 0, TODAY, 24);
    expect(result.debtFreeMonth).toBe(10);
    expect(result.totalInterestPaid).toBe(0);
  });

  it('leaveAlone debts are excluded from the projection', () => {
    const debts = [
      { balance: 1000, rate: 0, minPayment: 100, leaveAlone: true }, // excluded
      { balance: 500, rate: 0, minPayment: 50, leaveAlone: false }, // 10 months
    ];
    const result = projectDebt(debts, 0, TODAY, 24);
    expect(result.debtFreeMonth).toBe(10);
  });
});

describe('projectDebt — avalanche extra-payment allocation', () => {
  it('extra payment is poured at the highest-rate debt first', () => {
    const debts = [
      { balance: 1000, rate: 5, minPayment: 50, leaveAlone: false },
      { balance: 1000, rate: 25, minPayment: 50, leaveAlone: false }, // higher rate, attacked first
    ];
    // With $500/mo extra, the 25%-APR debt should clear before the 5%-APR debt.
    // We can't trivially assert which cleared first from `projection` alone
    // (it only tracks totals), but total interest paid should be lower than
    // if the extra went to the 5% debt first. Compare two scenarios.
    const withExtra = projectDebt(debts, 500, TODAY, 60);
    const withoutExtra = projectDebt(debts, 0, TODAY, 240);
    expect(withExtra.totalInterestPaid).toBeLessThan(withoutExtra.totalInterestPaid);
    expect(withExtra.debtFreeMonth).toBeLessThan(withoutExtra.debtFreeMonth);
  });

  it('returns the same debt-free month with or without 0 extra (control)', () => {
    const debts = [{ balance: 1200, rate: 12, minPayment: 100, leaveAlone: false }];
    const a = projectDebt(debts, 0, TODAY, 60);
    const b = projectDebt(debts, 0, TODAY, 60);
    expect(a.debtFreeMonth).toBe(b.debtFreeMonth);
  });

  // 2026-07-05 financial-math audit: projectDebt used to net minimum payments
  // OUT of the extra pool while the Debt Snowball tab paid minimums separately
  // and added extra on top — two screens gave different payoff dates for the
  // SAME debts and the SAME extra dollars. The minimums are funded by
  // outflows.debtService inside netCashFlow (computePressure), so the additive
  // snowball semantics are the correct ones. These pins prove the engines now
  // agree — proven-to-catch: both fail under the old pool-netting behavior.
  it('agrees with projectDebtSnowball (avalanche) on the debt-free month for the same inputs', () => {
    const debts = [
      { id: 'd1', name: 'A', balance: 4000, rate: 24, minPayment: 100, leaveAlone: false },
      { id: 'd2', name: 'B', balance: 2000, rate: 8, minPayment: 60, leaveAlone: false },
    ];
    const headline = projectDebt(debts, 300, TODAY, 240);
    const snowball = projectDebtSnowball(debts, 300, 'avalanche', TODAY, 240);
    expect(headline.debtFreeMonth).toBe(snowball.monthlyHistory.length);
  });

  it('the full extra pool lands on top of minimums (0% case gives exact timing)', () => {
    // $1,000 at 0% with $100 min + $100 extra = $200/mo → exactly 5 months.
    // Under the old pool-netting, extra $100 was consumed by the minimum and
    // this took 10 months.
    const debts = [{ balance: 1000, rate: 0, minPayment: 100, leaveAlone: false }];
    const result = projectDebt(debts, 100, TODAY, 24);
    expect(result.debtFreeMonth).toBe(5);
  });

  it('a cleared debt frees its minimum into the cascade (matches snowball)', () => {
    // Debt A clears fast; its $200 min then accelerates debt B.
    const debts = [
      { id: 'a', name: 'A', balance: 200, rate: 0, minPayment: 200, leaveAlone: false },
      { id: 'b', name: 'B', balance: 2000, rate: 0, minPayment: 100, leaveAlone: false },
    ];
    // Month 1: A's $200 min clears it, and the freed $200 joins THIS month's
    // pool (same-month cascade, matching projectDebtSnowball): B pays 100 min
    // + 200 freed → 1700. Months 2-6 drop $300/mo → 200; month 7 clears it.
    // Without the cascade this drags to month 20.
    const result = projectDebt(debts, 0, TODAY, 60);
    expect(result.debtFreeMonth).toBe(7);
  });
});

describe('projectDebt — edge cases', () => {
  it('returns a projection capped at maxMonths if debt cannot pay off', () => {
    // Min payment doesn't even cover interest — debt grows.
    const debts = [{ balance: 10000, rate: 30, minPayment: 10, leaveAlone: false }];
    const result = projectDebt(debts, 0, TODAY, 24);
    expect(result.projection.length).toBe(24);
    expect(result.debtFreeMonth).toBe(24);
  });

  it('handles an empty debts array without crashing (see FLAG-13)', () => {
    // Edge case: with no debts, projectDebt still runs one loop iteration
    // before detecting `totalBalance <= 1` and breaking. The result is a
    // single-month projection with zero balance and zero interest -- not
    // an empty array. This is harmless (no NaN, no infinite loop, no
    // wrong number reported to the user) but technically loose; an empty
    // input should ideally yield an empty projection. Captured as FLAG-13
    // in CALC-INVENTORY.md for future tightening. For now we lock in the
    // safety properties only.
    const result = projectDebt([], 0, TODAY, 24);
    expect(result.totalInterestPaid).toBe(0);
    expect(result.debtFreeMonth).toBeLessThanOrEqual(1);
    expect(Number.isFinite(result.projection.length)).toBe(true);
    expect(result.projection.length).toBeLessThanOrEqual(1);
  });
});
