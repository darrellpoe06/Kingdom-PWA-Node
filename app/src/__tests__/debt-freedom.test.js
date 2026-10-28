// debt-freedom.test.js — independently verified cases for the corrected engine.
// Every expectation below was fixed BEFORE the engine ran it, from closed-form
// amortization, a published mortgage figure, or hand arithmetic on small debts.
// None was adjusted to match the engine (Christina 2026-10-28).
import { describe, it, expect } from 'vitest';
import { planDebtFreedom, compareStrategies, amortizedPayment, interestFor, normalizeDebt, thisMonthPayments } from '../lib/debt-freedom.js';

const START = new Date(2026, 10, 1); // Nov 2026
const run = (debts, opts = {}) => planDebtFreedom(debts, { startDate: START, ...opts });

describe('zero-interest debt', () => {
  it('$1,200 at 0% with a $100 minimum clears in 12 months with no interest', () => {
    const p = run([{ id: 'z', name: 'Zero', balance: 1200, rate: 0, rateKnown: true, minPayment: 100 }]);
    expect(p.cleared).toBe(true);
    expect(p.debtFreeMonth).toBe(12);
    expect(p.totalInterest).toBe(0);
    expect(p.totalPaid).toBe(1200);
    expect(p.debts[0].payoffKey).toBe('2027-10');
  });
});

describe('high-interest credit card (daily compounding)', () => {
  it('a $5,000 card at 18% paying $150 clears in the month the closed-form count predicts, and daily costs more than monthly', () => {
    // Closed form (monthly compounding): n = -ln(1 - rB/P) / ln(1+r), r = 0.015 → 46.56 → 47 payments.
    const monthly = run([{ id: 'c', name: 'Card', balance: 5000, rate: 18, minPayment: 150, interestMethod: 'monthly' }]);
    expect(monthly.debtFreeMonth).toBe(47);
    // Interest = total paid − principal; 46 full payments + a partial final one ≈ $1,984 (± the final rounding).
    expect(monthly.totalInterest).toBeGreaterThan(1970);
    expect(monthly.totalInterest).toBeLessThan(1995);
    const daily = run([{ id: 'c', name: 'Card', balance: 5000, rate: 18, minPayment: 150, interestMethod: 'daily' }]);
    expect(daily.totalInterest).toBeGreaterThan(monthly.totalInterest);
    expect(daily.debtFreeMonth).toBeGreaterThanOrEqual(monthly.debtFreeMonth);
  });
  it('the daily method compounds over the real days of the month', () => {
    const d = { method: 'daily' };
    const feb = interestFor(d, 1000, new Date(2027, 1, 1), 18); // 28 days
    const mar = interestFor(d, 1000, new Date(2027, 2, 1), 18); // 31 days
    expect(mar).toBeGreaterThan(feb);
    expect(feb).toBeCloseTo(1000 * (Math.pow(1 + 0.18 / 365, 28) - 1), 2);
  });
});

describe('mortgage (monthly, the loan\'s own terms)', () => {
  it('$200,000 at 6% for 30 years: payment $1,199.10 and about $231,676 of interest (published figure)', () => {
    const pay = amortizedPayment(200000, 6, 360);
    expect(pay).toBe(1199.10);
    const p = run([{ id: 'm', name: 'Home', balance: 200000, rate: 6, minPayment: pay, debtType: 'mortgage' }]);
    expect(p.debts[0].method).toBe('monthly');
    expect(p.debtFreeMonth).toBe(360); // the $1.04 the cent-rounded payment leaves is settled with the 360th payment
    expect(Math.abs(p.totalInterest - 231676.38)).toBeLessThan(25);
  });
  it('the method follows the loan type, never the size of the rate (a 12% personal loan is monthly; a 9.99% card is daily)', () => {
    expect(normalizeDebt({ id: 'l', balance: 1, rate: 12, minPayment: 1, debtType: 'loan' }).debt.method).toBe('monthly');
    expect(normalizeDebt({ id: 'k', balance: 1, rate: 9.99, minPayment: 1, debtType: 'credit' }).debt.method).toBe('daily');
  });
});

describe('personal loan', () => {
  it('$10,000 at 7.25% over 60 months: payment $199.19 and about $1,951 of interest', () => {
    const pay = amortizedPayment(10000, 7.25, 60);
    expect(pay).toBe(199.19);
    const p = run([{ id: 'p', name: 'Loan', balance: 10000, rate: 7.25, minPayment: pay, debtType: 'loan' }]);
    expect(p.debtFreeMonth).toBe(60);
    expect(Math.abs(p.totalInterest - 1951.4)).toBeLessThan(5);
  });
});

describe('minimums, extra, partial final payments and rollover (hand-worked)', () => {
  // A: $50 owed, min $100. B: $1,000 owed, min $50. All 0%. No extra.
  const AB = () => [
    { id: 'A', name: 'A', balance: 50, rate: 0, rateKnown: true, minPayment: 100 },
    { id: 'B', name: 'B', balance: 1000, rate: 0, rateKnown: true, minPayment: 50 },
  ];
  it('every active debt is paid its minimum before any extra is applied', () => {
    const p = run(AB(), { extraMonthly: 200 });
    const m1 = p.months[0].payments;
    expect(m1.find((r) => r.debtId === 'B').minimum).toBe(50);
    expect(m1.find((r) => r.debtId === 'A').minimum).toBe(50); // capped at what is owed
  });
  it('a partial final payment pays exactly what is owed; the UNUSED $50 of the minimum rolls once, this month (defect A)', () => {
    const p = run(AB());
    const m1 = p.months[0];
    const a = m1.payments.find((r) => r.debtId === 'A'); const b = m1.payments.find((r) => r.debtId === 'B');
    expect(a.minimum).toBe(50); expect(a.paidOff).toBe(true);
    expect(b.minimum).toBe(50); expect(b.extra).toBe(50);
    expect(m1.totalPaid).toBe(150); // never $200 from a $150 budget
    expect(m1.totalBalance).toBe(900);
    // From month 2 the whole $100 minimum rolls: B pays 150 a month → 900/150 = 6 more months → cleared in month 7.
    expect(p.months[1].payments.find((r) => r.debtId === 'B').extra).toBe(100);
    expect(p.debtFreeMonth).toBe(7);
    expect(p.totalPaid).toBe(1050);
  });
  it('a payment never exceeds what is owed, including interest and fees', () => {
    const p = run([{ id: 'f', name: 'Fee card', balance: 100, rate: 24, minPayment: 500, interestMethod: 'monthly', monthlyFee: 5 }], { extraMonthly: 1000 });
    const r = p.months[0].payments[0];
    expect(r.interest).toBe(2);
    expect(r.fees).toBe(5);
    expect(r.minimum).toBe(107);
    expect(r.extra).toBe(0);
    // The $393 of the $500 minimum that was not needed joins this month's pool
    // (the stated rollover rule); with no other debt the whole pool is unspent.
    expect(p.months[0].poolUnspent).toBe(1393);
    expect(p.totalPaid).toBe(107);
  });
  it('a debt rolls into the next only after it is actually at zero', () => {
    const p = run([
      { id: 'A', name: 'A', balance: 250, rate: 0, rateKnown: true, minPayment: 100 },
      { id: 'B', name: 'B', balance: 1000, rate: 0, rateKnown: true, minPayment: 50 },
    ]);
    // A: 250 → 150 → 50 → cleared in month 3 (paying 50, unused 50 rolls). B gets A's minimum only from month 4.
    expect(p.months[0].payments.find((r) => r.debtId === 'B').extra).toBe(0);
    expect(p.months[1].payments.find((r) => r.debtId === 'B').extra).toBe(0);
    expect(p.months[2].payments.find((r) => r.debtId === 'B').extra).toBe(50);
    expect(p.months[3].payments.find((r) => r.debtId === 'B').extra).toBe(100);
    expect(p.debts.find((d) => d.id === 'A').payoffMonth).toBe(3);
  });
  it('two debts cleared in the same month both roll next month, and only their unused parts this month', () => {
    const p = run([
      { id: 'E1', name: 'E1', balance: 40, rate: 0, rateKnown: true, minPayment: 100 },
      { id: 'E2', name: 'E2', balance: 60, rate: 0, rateKnown: true, minPayment: 100 },
      { id: 'E3', name: 'E3', balance: 1000, rate: 0, rateKnown: true, minPayment: 10 },
    ]);
    expect(p.months[0].totalPaid).toBe(210); // 40 + 60 + 10 + (60 + 40 unused)
    expect(p.months[0].totalBalance).toBe(890);
    expect(p.months[1].payments.find((r) => r.debtId === 'E3').extra).toBe(200);
  });
});

describe('one-time lump sums', () => {
  const debts = () => [
    { id: 'A', name: 'A', balance: 500, rate: 0, rateKnown: true, minPayment: 50 },
    { id: 'B', name: 'B', balance: 2000, rate: 0, rateKnown: true, minPayment: 50 },
  ];
  it('a targeted lump sum goes to its debt, capped at what is owed, and the overflow joins the pool', () => {
    const p = run(debts(), { oneTime: [{ month: '2026-12', amount: 600, debtId: 'A' }] });
    const m2 = p.months[1];
    expect(m2.payments.find((r) => r.debtId === 'A').lump).toBe(400); // 500 − 50 (Nov) − 50 (Dec min) = 400 owed
    expect(m2.payments.find((r) => r.debtId === 'B').extra).toBe(200); // the overflow
    expect(p.debts.find((d) => d.id === 'A').payoffKey).toBe('2026-12');
  });
  it('an untargeted lump sum follows the strategy order', () => {
    const p = run(debts(), { oneTime: [{ month: '2026-11', amount: 100 }], strategy: 'avalanche' });
    // Equal rates → smaller balance first (tie-break): A gets it.
    expect(p.months[0].payments.find((r) => r.debtId === 'A').extra).toBe(100);
  });
});

describe('strategy order', () => {
  const debts = () => [
    { id: 'small-low', name: 'Small, 5%', balance: 1000, rate: 5, minPayment: 50, interestMethod: 'monthly' },
    { id: 'big-high', name: 'Big, 24%', balance: 4000, rate: 24, minPayment: 100, interestMethod: 'monthly' },
  ];
  it('snowball attacks the smallest balance, avalanche the highest rate, custom what the family chose', () => {
    expect(run(debts(), { strategy: 'snowball', extraMonthly: 100 }).months[0].payments.find((r) => r.extra > 0).debtId).toBe('small-low');
    expect(run(debts(), { strategy: 'avalanche', extraMonthly: 100 }).months[0].payments.find((r) => r.extra > 0).debtId).toBe('big-high');
    expect(run(debts(), { strategy: 'custom', customOrder: ['big-high'], extraMonthly: 100 }).months[0].payments.find((r) => r.extra > 0).debtId).toBe('big-high');
    expect(run(debts(), { strategy: 'custom', customOrder: ['small-low'], extraMonthly: 100 }).months[0].payments.find((r) => r.extra > 0).debtId).toBe('small-low');
  });
  it('avalanche costs less interest than snowball on these debts, and the comparison names every strategy', () => {
    const c = compareStrategies(debts(), { startDate: START, extraMonthly: 100 });
    expect(c.avalanche.totalInterest).toBeLessThan(c.snowball.totalInterest);
    expect(Object.keys(c)).toEqual(['snowball', 'avalanche', 'custom', 'minimums-only']);
    expect(c['minimums-only'].totalInterest).toBeGreaterThan(c.avalanche.totalInterest);
  });
});

describe('changes in rates and balances; missed payments', () => {
  it('a promotional 0% until a date, then the real rate', () => {
    const p = run([{ id: 'pr', name: 'Promo', balance: 1200, rate: 24, minPayment: 100, interestMethod: 'monthly', promo: { apr: 0, until: '2027-01-31' } }]);
    expect(p.months[0].payments[0].interest).toBe(0); // Nov
    expect(p.months[2].payments[0].interest).toBe(0); // Jan
    expect(p.months[3].payments[0].interest).toBeGreaterThan(0); // Feb: 24% applies
    expect(p.months[3].payments[0].apr).toBe(24);
  });
  it('a rate change applies from its month', () => {
    const p = run([{ id: 'v', name: 'Variable', balance: 1000, rate: 10, minPayment: 50, interestMethod: 'monthly' }], { rateChanges: [{ debtId: 'v', from: '2027-01', apr: 20 }] });
    expect(p.months[0].payments[0].interest).toBeCloseTo(1000 * 0.10 / 12, 2);
    expect(p.months[2].payments[0].apr).toBe(20);
  });
  it('a balance change changes the schedule (pure recalculation, nothing cached)', () => {
    const a = run([{ id: 'b', name: 'B', balance: 1000, rate: 0, rateKnown: true, minPayment: 100 }]);
    const b = run([{ id: 'b', name: 'B', balance: 1500, rate: 0, rateKnown: true, minPayment: 100 }]);
    expect(a.debtFreeMonth).toBe(10);
    expect(b.debtFreeMonth).toBe(15);
  });
  it('a missed payment pays nothing that month, interest still accrues, and the payoff slips', () => {
    const base = run([{ id: 'm', name: 'M', balance: 1000, rate: 12, minPayment: 100, interestMethod: 'monthly' }]);
    const missed = run([{ id: 'm', name: 'M', balance: 1000, rate: 12, minPayment: 100, interestMethod: 'monthly' }], { missed: [{ debtId: 'm', month: '2026-12' }] });
    expect(missed.months[1].payments[0].missed).toBe(true);
    expect(missed.months[1].payments[0].minimum).toBe(0);
    expect(missed.months[1].payments[0].interest).toBeGreaterThan(0);
    expect(missed.debtFreeMonth).toBeGreaterThan(base.debtFreeMonth);
    expect(missed.totalInterest).toBeGreaterThan(base.totalInterest);
  });
});

describe('honesty: unknown terms, the horizon, paid-off flags, actual vs projected', () => {
  it('a debt with no known rate or no minimum is excluded with its reason, never projected at 0% / $0', () => {
    const p = run([
      { id: 'ok', name: 'OK', balance: 100, rate: 10, minPayment: 50 },
      { id: 'norate', name: 'No rate', balance: 500, rate: 0, rateKnown: false, minPayment: 50 },
      { id: 'nomin', name: 'No minimum', balance: 500, rate: 10, minPayment: 0 },
    ]);
    expect(p.debts.map((d) => d.id)).toEqual(['ok']);
    expect(p.excluded.map((d) => [d.id, d.reason])).toEqual([['norate', 'interest rate not known'], ['nomin', 'no minimum payment entered']]);
  });
  it('a minimum that cannot cover interest never reads as cleared; the horizon ends with no debt-free date', () => {
    const p = run([{ id: 'stuck', name: 'Stuck', balance: 100000, rate: 24, minPayment: 100, interestMethod: 'monthly' }], { maxMonths: 120 });
    expect(p.cleared).toBe(false);
    expect(p.debtFreeMonth).toBeNull();
    expect(p.horizonExhausted).toBe(true);
    expect(p.debts[0].cleared).toBe(false);
  });
  it('marking a debt paid off removes it from the plan without touching its record', () => {
    const raw = [{ id: 'd', name: 'Done', balance: 300, rate: 10, minPayment: 50 }];
    const p = run(raw, { overrides: { d: { paidOff: true } } });
    expect(p.excluded[0].reason).toBe('marked paid off');
    expect(raw[0].balance).toBe(300); // the input is never mutated
  });
  it('the schedule is projected: the input balances are never changed, and this month\'s payments are named per debt', () => {
    const raw = [{ id: 'a', name: 'A', balance: 400, rate: 0, rateKnown: true, minPayment: 100 }, { id: 'b', name: 'B', balance: 900, rate: 0, rateKnown: true, minPayment: 100 }];
    const p = run(raw, { extraMonthly: 50 });
    expect(raw.map((d) => d.balance)).toEqual([400, 900]);
    expect(thisMonthPayments(p)).toEqual([
      { debtId: 'a', name: 'A', minimum: 100, extra: 50, lump: 0, total: 150, paidOff: false },
      { debtId: 'b', name: 'B', minimum: 100, extra: 0, lump: 0, total: 100, paidOff: false },
    ]);
    expect(p.months.every((m) => m.payments.every((r) => r.endBalance >= 0))).toBe(true);
  });
});

describe('the schedule, the payoff dates and the rollover agree with each other (one engine, one truth)', () => {
  const debts = () => [
    { id: 'A', name: 'A', balance: 300, rate: 0, rateKnown: true, minPayment: 100 },
    { id: 'B', name: 'B', balance: 2500, rate: 12, minPayment: 75, interestMethod: 'monthly' },
    { id: 'C', name: 'C', balance: 900, rate: 20, minPayment: 40, interestMethod: 'daily' },
  ];
  it('each debt\'s payoff month is the first schedule month where its balance reaches zero', () => {
    const p = run(debts(), { extraMonthly: 60, strategy: 'avalanche' });
    for (const d of p.debts) {
      const first = p.months.find((m) => m.payments.some((r) => r.debtId === d.id && r.paidOff));
      expect(first, d.id).toBeTruthy();
      expect(first.offset).toBe(d.payoffMonth);
      expect(first.month).toBe(d.payoffKey);
      expect(first.payments.find((r) => r.debtId === d.id).endBalance).toBe(0);
      // and it never appears with a balance afterwards
      expect(p.months.slice(first.offset).every((m) => !m.payments.some((r) => r.debtId === d.id && r.endBalance > 0))).toBe(true);
    }
  });
  it('the per-debt totals equal the schedule\'s sums, and every month\'s rows balance to the cent', () => {
    const p = run(debts(), { extraMonthly: 60 });
    for (const d of p.debts) {
      const rows = p.months.flatMap((m) => m.payments.filter((r) => r.debtId === d.id));
      const paid = rows.reduce((s, r) => s + r.minimum + r.extra + r.lump, 0);
      const interest = rows.reduce((s, r) => s + r.interest, 0);
      expect(Math.abs(paid - d.totalPaid)).toBeLessThan(0.01);
      expect(Math.abs(interest - d.interestPaid)).toBeLessThan(0.01);
      expect(Math.abs(d.startBalance + interest + d.feesPaid - paid - d.endBalance)).toBeLessThan(0.02);
      for (const r of rows) expect(Math.abs(r.startBalance + r.interest + r.fees - r.minimum - r.extra - r.lump - r.endBalance)).toBeLessThan(0.02);
    }
    expect(Math.abs(p.months.reduce((s, m) => s + m.totalPaid, 0) - p.totalPaid)).toBeLessThan(0.01);
  });
  it('the month after a debt clears, its full minimum shows up as extra on the next debt in order', () => {
    const p = run(debts(), { extraMonthly: 60, strategy: 'snowball' });
    const a = p.debts.find((d) => d.id === 'A');
    const next = p.months[a.payoffMonth]; // the month AFTER A clears (offset is 1-based)
    const rowsNext = next.payments.filter((r) => r.extra > 0);
    expect(rowsNext.length).toBeGreaterThan(0);
    // snowball: C (900) is next; it receives the recurring 60 + A's rolled 100
    expect(rowsNext[0].debtId).toBe('C');
    expect(rowsNext[0].extra).toBe(160);
  });
  it('the Debt Freedom screen\'s comparison is the same function the plan uses (compareStrategies ⊃ planDebtFreedom)', () => {
    const opts = { startDate: START, extraMonthly: 60 };
    const c = compareStrategies(debts(), opts);
    for (const s of ['snowball', 'avalanche', 'custom']) {
      const direct = planDebtFreedom(debts(), { ...opts, strategy: s });
      expect(c[s].debtFreeKey).toBe(direct.debtFreeKey);
      expect(c[s].totalInterest).toBe(direct.totalInterest);
      expect(c[s].months.length).toBe(direct.months.length);
    }
  });
});
