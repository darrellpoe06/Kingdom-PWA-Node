// debt-engine-audit.test.js — the measured defects of the EXISTING debt engine
// (lib/lifecycle-and-flow.js), recorded as executable findings (Christina
// 2026-10-28: "identify the specific problems in the current engine" before
// correcting them). Each case states the rule, what the old engine does, and
// what the corrected engine (lib/debt-freedom.js) does on the same debts. The
// old engine is NOT modified here: the legacy Debts tab and Big Picture still
// read it until the switch is approved.
import { describe, it, expect } from 'vitest';
import { projectDebtSnowball, projectDebt, monthlyInterestRate } from '../lib/lifecycle-and-flow.js';
import { planDebtFreedom } from '../lib/debt-freedom.js';

const d = new Date(2026, 9, 1);

describe('AUDIT of the existing snowball / avalanche engine', () => {
  it('A. a partial final payment is double-counted: the FULL minimum rolls in the month it was only partly used', () => {
    const debts = [{ id: 'A', name: 'A', balance: 50, rate: 0, minPayment: 100 }, { id: 'B', name: 'B', balance: 1000, rate: 0, minPayment: 50 }];
    const old = projectDebtSnowball(debts, 0, 'snowball', d, 60);
    // Budget this month: $100 + $50 = $150. B can end no lower than 1000 − 50 − 50 = 900.
    expect(old.monthlyHistory[0].totalBalance).toBe(850); // the defect: $200 paid from a $150 budget
    const fixed = planDebtFreedom(debts.map((x) => ({ ...x, rateKnown: true })), { startDate: d });
    expect(fixed.months[0].totalBalance).toBe(900);
    expect(fixed.months[0].totalPaid).toBe(150);
  });
  it('A (again). two debts cleared in one month roll both FULL minimums that same month', () => {
    const debts = [{ id: 'E1', balance: 40, rate: 0, minPayment: 100 }, { id: 'E2', balance: 60, rate: 0, minPayment: 100 }, { id: 'E3', balance: 1000, rate: 0, minPayment: 10 }];
    const old = projectDebtSnowball(debts, 0, 'snowball', d, 60);
    // Measured: E3 pays its own $10, then the old engine rolls E1's and E2's FULL
    // $100 minimums ($200) although only $100 of them was unused → $790. The rule
    // (1000 − 10 − 60 − 40 unused) allows no lower than $890.
    expect(old.monthlyHistory[0].totalBalance).toBe(790);
    const fixed = planDebtFreedom(debts.map((x) => ({ ...x, name: x.id, rateKnown: true })), { startDate: d });
    expect(fixed.months[0].totalBalance).toBe(890);
  });
  it('B. the interest method is chosen by the SIZE of the rate, not the loan\'s terms', () => {
    // 12% (a personal loan) is compounded daily; 9.99% (a card) is charged monthly.
    expect(monthlyInterestRate(12)).toBeCloseTo(Math.pow(1 + 0.12 / 365, 365 / 12) - 1, 8);
    expect(monthlyInterestRate(9.99)).toBeCloseTo(0.0999 / 12, 8);
    const loan = planDebtFreedom([{ id: 'l', name: 'Loan', balance: 10000, rate: 12, minPayment: 500, debtType: 'loan' }], { startDate: d });
    expect(loan.debts[0].method).toBe('monthly');
    expect(loan.months[0].payments[0].interest).toBe(100); // 10000 × 12% / 12, the loan's own terms
  });
  it('C. exhausting the horizon reads as "cleared" with a dated debt-free month', () => {
    const debts = [{ id: 'C', name: 'C', balance: 100000, rate: 24, minPayment: 100 }];
    const old = projectDebtSnowball(debts, 0, 'snowball', d, 360);
    expect(old.allClearedMonth).toBe(360);
    expect(typeof old.allClearedDate).toBe('string');
    expect(old.monthlyHistory[old.monthlyHistory.length - 1].totalBalance).toBeGreaterThan(100000);
    const fixed = planDebtFreedom(debts.map((x) => ({ ...x, interestMethod: 'monthly' })), { startDate: d, maxMonths: 360 });
    expect(fixed.cleared).toBe(false);
    expect(fixed.debtFreeMonth).toBeNull();
  });
  it('D. unknown terms are projected as 0% and $0 in the headline projector', () => {
    const debts = [{ id: 'D', name: 'D', balance: 5000, rate: 0, minPayment: 0, needsTerms: true, rateKnown: false }];
    const old = projectDebt(debts, 100, d, 240);
    expect(old.debtFreeMonth).toBe(50);
    expect(old.totalInterestPaid).toBe(0);
    const fixed = planDebtFreedom(debts, { startDate: d, extraMonthly: 100 });
    expect(fixed.debts).toHaveLength(0);
    expect(fixed.excluded[0].reason).toBe('interest rate not known');
  });
});
