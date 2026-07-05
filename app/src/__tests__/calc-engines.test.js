// Calc-engine coverage — closes P3 from the 2026-06-11 test-coverage audit
// (projectDebtSnowball / projectDebtMinimumOnly / projectRentalSnowball /
// findExtraForTarget were exported but untested). These are the engines the
// family's real money decisions ride on. Expectations are independently
// reasoned: 0%-interest cases give exact payoff timing; ordering is asserted
// structurally (which debt/property clears first under each sort).
//
// Generated as the first real orchestrator task (DR-0056): the "specifiable +
// machine-verifiable" work the perpetual-fix engine is built to carry. CI is
// the outcome-judge.
import { describe, it, expect } from 'vitest';
import {
  projectDebtSnowball,
  projectDebtMinimumOnly,
  projectRentalSnowball,
  findExtraForTarget,
} from '../lib/financial-calcs.js';

const TODAY = new Date('2026-06-13');

describe('projectDebtSnowball', () => {
  it('a single 0% debt with a $100 min pays off in exactly 10 months, $0 interest', () => {
    const r = projectDebtSnowball(
      [{ id: 'd1', name: 'Card', balance: 1000, rate: 0, minPayment: 100 }],
      0, 'snowball', TODAY,
    );
    expect(r.allClearedMonth).toBe(10);
    expect(r.totalInterest).toBe(0);
  });

  it('leaveAlone debts are excluded from the projection', () => {
    const r = projectDebtSnowball(
      [
        { id: 'd1', name: 'Keep', balance: 5000, rate: 12, minPayment: 50, leaveAlone: true },
        { id: 'd2', name: 'Pay', balance: 1000, rate: 0, minPayment: 100 },
      ],
      0, 'snowball', TODAY,
    );
    expect(r.activeDebts.map(d => d.id)).toEqual(['d2']);
    expect(r.allClearedMonth).toBe(10);
  });

  it('snowball targets the smallest balance first; avalanche the highest rate', () => {
    const debts = [
      { id: 'small', name: 'Small/LowRate', balance: 1000, rate: 5, minPayment: 50 },
      { id: 'big', name: 'Big/HighRate', balance: 2000, rate: 20, minPayment: 50 },
    ];
    const snow = projectDebtSnowball(debts, 200, 'snowball', TODAY);
    const aval = projectDebtSnowball(debts, 200, 'avalanche', TODAY);
    const clearedFirst = (res) => [...res.activeDebts].sort((a, b) => a.clearedAtMonth - b.clearedAtMonth)[0].id;
    expect(clearedFirst(snow)).toBe('small');   // smallest balance
    expect(clearedFirst(aval)).toBe('big');     // highest rate
  });

  it('a cleared debt frees its minimum into the snowball (finalFreedCashFlow > 0)', () => {
    const r = projectDebtSnowball(
      [{ id: 'd1', name: 'Card', balance: 1000, rate: 0, minPayment: 100 }],
      0, 'snowball', TODAY,
    );
    expect(r.finalFreedCashFlow).toBe(100);
  });

  it('more extra never pays off slower', () => {
    const debts = [{ id: 'd1', name: 'Card', balance: 5000, rate: 18, minPayment: 100 }];
    const slow = projectDebtSnowball(debts, 0, 'snowball', TODAY);
    const fast = projectDebtSnowball(debts, 300, 'snowball', TODAY);
    expect(fast.allClearedMonth).toBeLessThanOrEqual(slow.allClearedMonth);
  });
});

describe('projectDebtMinimumOnly', () => {
  it('a 0% debt clears at its minimum with no interest and no stuck flag', () => {
    const r = projectDebtMinimumOnly(
      [{ id: 'd1', balance: 1000, rate: 0, minPayment: 100 }], TODAY,
    );
    expect(r.longestPayoff).toBe(10);
    expect(r.totalInterest).toBe(0);
    expect(r.stuckDebts).toHaveLength(0);
    expect(r.allCleared).toBe(true);
  });

  it('flags a debt whose minimum cannot cover the monthly interest as stuck', () => {
    // $10k at 24% APR => $200/mo interest; a $50 min never touches principal.
    const r = projectDebtMinimumOnly(
      [{ id: 'd1', balance: 10000, rate: 24, minPayment: 50 }], TODAY,
    );
    expect(r.stuckDebts.map(d => d.id)).toEqual(['d1']);
    expect(r.allCleared).toBe(false);
  });
});

describe('projectRentalSnowball', () => {
  const rental = (over) => ({ id: 'r1', name: 'House', rent: 0, mortgage: { balance: 1000, rate: 0, monthlyPI: 100, escrow: 0 }, ...over });

  it('a single 0% mortgage with a $100 P&I clears in exactly 10 months', () => {
    const r = projectRentalSnowball([rental()], 0, 'smallest-balance', TODAY);
    expect(r.allClearedMonth).toBe(10);
    expect(r.totalInterest).toBe(0);
  });

  it('best-cashflow targets the higher-cashflow property first (equal balances)', () => {
    const rentals = [
      { id: 'hi', name: 'HiCash', rent: 1500, mortgage: { balance: 2000, rate: 0, monthlyPI: 500, escrow: 0 } },
      { id: 'lo', name: 'LoCash', rent: 700,  mortgage: { balance: 2000, rate: 0, monthlyPI: 500, escrow: 0 } },
    ];
    const r = projectRentalSnowball(rentals, 500, 'best-cashflow', TODAY);
    const first = [...r.activeProperties].sort((a, b) => a.clearedAtMonth - b.clearedAtMonth)[0];
    expect(first.id).toBe('hi'); // rent - P&I - escrow is larger
  });

  it('extra payment never clears slower', () => {
    const big = [{ id: 'r1', name: 'House', rent: 0, mortgage: { balance: 200000, rate: 5, monthlyPI: 1000, escrow: 0 } }];
    const slow = projectRentalSnowball(big, 0, 'smallest-balance', TODAY);
    const fast = projectRentalSnowball(big, 2000, 'smallest-balance', TODAY);
    expect(fast.allClearedMonth).toBeLessThanOrEqual(slow.allClearedMonth);
  });
});

describe('findExtraForTarget', () => {
  const easy = [{ id: 'r1', name: 'House', rent: 0, mortgage: { balance: 1200, rate: 0, monthlyPI: 100, escrow: 0 } }];

  it('returns 0-or-near-0 extra when the property already clears within the target', () => {
    const result = findExtraForTarget(easy, 5, TODAY); // clears in 1yr unaided
    expect(result.achievable).toBe(true);
    expect(result.extra).toBeGreaterThanOrEqual(0);
    expect(result.extra).toBeLessThan(200);
  });

  it('a tighter target never needs less extra than a looser one', () => {
    const big = [{ id: 'r1', name: 'House', rent: 0, mortgage: { balance: 120000, rate: 5, monthlyPI: 600, escrow: 0 } }];
    const tight = findExtraForTarget(big, 3, TODAY);
    const loose = findExtraForTarget(big, 10, TODAY);
    expect(tight.achievable).toBe(true);
    expect(loose.achievable).toBe(true);
    expect(tight.extra).toBeGreaterThanOrEqual(loose.extra);
  });

  // 2026-07-05 financial-math audit: an unreachable target used to return the
  // $50k search ceiling AS IF it were an answer. Now it says so plainly.
  // Proven-to-catch: under the old behavior this returned 50000, not a flag.
  it('an impossible target returns achievable:false, never the search cap as an answer', () => {
    // $80M at 12% needs ~$800k/mo interest coverage — no $50k/mo extra clears
    // it in 3 years.
    const impossible = [{ id: 'r1', name: 'Tower', rent: 0, mortgage: { balance: 80000000, rate: 12, monthlyPI: 10000, escrow: 0 } }];
    const result = findExtraForTarget(impossible, 3, TODAY);
    expect(result.achievable).toBe(false);
    expect(result.extra).toBeNull();
    expect(result.cap).toBe(50000);
  });
});
