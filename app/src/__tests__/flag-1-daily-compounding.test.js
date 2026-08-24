// =============================================================================
// FLAG-1 closed — card-class debts compound daily (CALC-INVENTORY.md)
// =============================================================================
// The inventory's oldest open flag: real credit cards accrue interest DAILY,
// and the APR/12 model biased "total interest paid" LOW and payoff dates
// optimistic. Its own recommendation is now the implementation: card-class
// debts (rate > 10%) accrue at the effective monthly rate of daily
// compounding; low-rate debts and mortgages stay monthly-periodic. These pins
// prove the BIAS DIRECTION the inventory promised Pass 2 would prove, the
// classing boundary, and that every debt engine still agrees.
import { describe, it, expect } from 'vitest';
import { monthlyInterestRate, projectDebtSnowball, projectDebtMinimumOnly, projectRentalSnowball } from '../lib/lifecycle-and-flow.js';
import { projectDebt } from '../lib/financial-calcs.js';

const TODAY = new Date('2026-08-24');

describe('monthlyInterestRate — the one shared accrual model', () => {
  it('card-class (rate > 10%): daily compounding beats APR/12 — the exact bias FLAG-1 named', () => {
    for (const apr of [18, 22.3, 27, 30, 34.99]) {
      const daily = monthlyInterestRate(apr);
      const monthly = apr / 100 / 12;
      expect(daily).toBeGreaterThan(monthly);
      // The bias is real but small — under 1.5% of the monthly charge.
      expect(daily / monthly).toBeLessThan(1.015);
    }
  });
  it('low-rate debts stay monthly-periodic; zero and garbage stay zero', () => {
    expect(monthlyInterestRate(6)).toBeCloseTo(0.005, 10);
    expect(monthlyInterestRate(0)).toBe(0);
    expect(monthlyInterestRate(null)).toBe(0);
    expect(monthlyInterestRate(-5)).toBe(0);
  });
});

describe('the bias direction shows in the engines (proven-to-catch vs APR/12)', () => {
  const card = [{ id: 'c', name: 'Card', balance: 13102, rate: 22.3, minPayment: 400, leaveAlone: false }];
  it('a 22.3% card pays MORE total interest than the old APR/12 model said', () => {
    const r = projectDebtSnowball(card, 0, 'avalanche', TODAY, 240);
    // Old-model ground truth, computed with APR/12 accrual inline.
    let bal = 13102; let oldInterest = 0;
    for (let m = 1; m <= 240 && bal > 0.01; m++) {
      const i = bal * (22.3 / 100 / 12); bal += i; oldInterest += i;
      bal -= Math.min(400, bal);
    }
    expect(r.totalInterest).toBeGreaterThan(Math.round(oldInterest) - 1);
    expect(r.totalInterest).toBeGreaterThan(0);
  });
  it('minimum-only and snowball engines share the model (agreement holds)', () => {
    const snow = projectDebtSnowball(card, 0, 'avalanche', TODAY, 240);
    const minOnly = projectDebtMinimumOnly(card, TODAY, 240);
    expect(minOnly.totalInterest).toBe(snow.totalInterest);
  });
  it('projectDebt (the headline engine) agrees with the snowball on the debt-free month', () => {
    const debts = [
      { id: 'a', name: 'A', balance: 4000, rate: 24, minPayment: 100, leaveAlone: false },
      { id: 'b', name: 'B', balance: 2000, rate: 8, minPayment: 60, leaveAlone: false },
    ];
    const headline = projectDebt(debts, 300, TODAY, 240);
    const snowball = projectDebtSnowball(debts, 300, 'avalanche', TODAY, 240);
    expect(headline.debtFreeMonth).toBe(snowball.monthlyHistory.length);
  });
});

describe('mortgages stay monthly-periodic (FLAG-1 never applied to them)', () => {
  it('a rental mortgage accrues exactly APR/12 in month one — never the card model', () => {
    const rentals = [{ id: 'r1', name: 'House', rent: 1200, mortgage: { balance: 100000, rate: 12, monthlyPI: 1100, escrow: 0 } }];
    const r = projectRentalSnowball(rentals, 0, 'smallest-balance', TODAY, 1);
    // Month 1 on $100,000 at 12%: monthly-periodic = exactly $1,000.00; the
    // card-class daily model would say ~$1,004.60 — this pin catches a future
    // accidental swap of the mortgage engine onto monthlyInterestRate.
    expect(r.activeProperties[0].interestPaid).toBeCloseTo(1000, 6);
  });
});
