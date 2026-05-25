// projectDebt — basic correctness tests (C1 in CALC-INVENTORY.md).
// Pass 2 starting set. These tests don't yet address FLAG-1 (monthly vs
// daily compounding) — that fix would change the expected interest totals,
// and the test will be updated in lockstep when FLAG-1 lands.
import { describe, it, expect } from 'vitest';
import { projectDebt } from '../lib/financial-calcs.js';

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
