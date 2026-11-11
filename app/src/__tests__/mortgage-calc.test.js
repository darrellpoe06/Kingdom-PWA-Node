// mortgage-calc — pinned to the cent against the reference calculator Darrell
// sent on 2026-11-10 ($80,000 at 6.5% over 20 years from May 2023, with $600 a
// month extra from the first payment). DR-1413.
import { describe, it, expect } from 'vitest';
import { standardPayment, buildSchedule, annualRows, calculate, extraInMonth, addMonths, assetView } from '../lib/mortgage-calc.js';

const LOAN = { principal: 80000, ratePct: 6.5, years: 20, startYm: '2023-05', propertyValue: 80000 };
const EXTRA = { ...LOAN, prepay: { monthly: { amount: 600, startMonth: 1 } } };

describe('mortgage-calc: the reference figures', () => {
  it('works out the payment', () => {
    expect(standardPayment(80000, 6.5, 20)).toBe(596.46);
  });
  it('matches the first eight payments of 2023 to the cent', () => {
    const { rows } = buildSchedule(EXTRA);
    expect(rows.slice(0, 8).map((r) => r.balance)).toEqual([79236.87, 78469.62, 77698.2, 76922.61, 76142.81, 75358.8, 74570.53, 73778.0]);
    expect(rows[0]).toMatchObject({ ym: '2023-05', payment: 596.46, extra: 600, total: 1196.46 });
  });
  it('matches the 2025 months (interest, principal with extra, loan-to-value, balance)', () => {
    const { rows } = buildSchedule(EXTRA);
    const jan = rows.find((r) => r.ym === '2025-01');
    const dec = rows.find((r) => r.ym === '2025-12');
    expect([jan.interest, Math.round((jan.principal + jan.extra) * 100) / 100, jan.ltv, jan.balance]).toEqual([346.27, 850.19, 78.8, 63075.8]);
    expect([dec.interest, Math.round((dec.principal + dec.extra) * 100) / 100, dec.ltv, dec.balance]).toEqual([294.21, 902.24, 66.8, 53414.18]);
  });
  it('matches the year table', () => {
    const years = annualRows(buildSchedule(EXTRA).rows);
    expect(years.map((y) => [y.year, y.interest, y.principal, y.ltv, y.balance])).toEqual([
      ['2023', 3349.66, 6222.0, 92.2, 73778.0],
      ['2024', 4505.5, 9852.0, 79.9, 63925.99],
      ['2025', 3845.69, 10511.81, 66.8, 53414.18],
      ['2026', 3141.69, 11215.81, 52.7, 42198.37],
      ['2027', 2390.55, 11966.95, 37.8, 30231.42],
      ['2028', 1589.1, 12768.4, 21.8, 17463.02],
      ['2029', 733.98, 13623.52, 4.8, 3839.5],
      ['2030', 44.84, 3839.5, 0, 0],
    ]);
  });
  it('matches the summary: paid off April 2030, 13 years sooner, interest and savings', () => {
    const c = calculate(EXTRA, { annualInsurance: 1000, annualTax: 1200 });
    expect(c.plan.endYm).toBe('2030-04');
    expect(c.plan.months).toBe(84);
    expect(c.monthsSaved).toBe(156);
    expect(c.plan.totalInterest).toBe(19601.02);
    expect(c.plan.totalPaid).toBe(99601.02);
    expect(c.plan.totalExtra).toBe(49800);
    expect(c.interestSaved).toBe(43549.02);
    expect(c.monthlyExpenses).toBe(183.33);
    expect(c.totalMonthly).toBe(779.79);
    expect(c.split.interest + c.split.principal + c.split.extra).toBeCloseTo(c.plan.totalPaid, 2);
  });
});

describe('mortgage-calc: the rules', () => {
  it('a loan on the books is described by its payment, with no term', () => {
    const s = buildSchedule({ principal: 88000, ratePct: 6.5, payment: 556, startYm: '2026-12' });
    expect(s.ok).toBe(true);
    expect(s.payment).toBe(556);
    expect(s.rows[s.rows.length - 1].balance).toBe(0);
  });
  it('refuses a payment that cannot cover the interest, in words', () => {
    const s = buildSchedule({ principal: 100000, ratePct: 12, payment: 900, startYm: '2026-12' });
    expect(s.ok).toBe(false);
    expect(s.reason).toMatch(/never be paid off/);
    expect(calculate({ principal: 100000, ratePct: 12, payment: 900 }).ok).toBe(false);
  });
  it('refuses a loan with nothing owed or no payment', () => {
    expect(buildSchedule({ principal: 0, ratePct: 5, years: 10 }).ok).toBe(false);
    expect(buildSchedule({ principal: 1000, ratePct: 5 }).ok).toBe(false);
  });
  it('a 0% loan divides evenly and ends at zero', () => {
    const s = buildSchedule({ principal: 1200, ratePct: 0, years: 1, startYm: '2026-01' });
    expect([s.months, s.totalInterest, s.endYm]).toEqual([12, 0, '2026-12']);
  });
  it('places each kind of extra payment in its own months', () => {
    const p = {
      monthly: { amount: 10, startMonth: 3 },
      semiAnnual: { amount: 100, startMonth: 2 },
      annual: { amount: 1000, startMonth: 5 },
      oneTime: { amount: 5000, month: 7 },
    };
    expect([1, 2, 3, 5, 7, 8, 14, 17].map((n) => extraInMonth(p, n))).toEqual([0, 100, 10, 1010, 5010, 110, 110, 1010]);
  });
  it('never pays more extra than is owed, and the last payment is trimmed', () => {
    const s = buildSchedule({ principal: 1000, ratePct: 6, payment: 300, startYm: '2026-01', prepay: { oneTime: { amount: 50000, month: 2 } } });
    expect(s.months).toBe(2);
    expect(s.totalExtra + s.rows.reduce((t, r) => t + r.principal, 0)).toBeCloseTo(1000, 1);
  });
  it('rolls the calendar across a year end', () => {
    expect(addMonths('2025-11', 3)).toBe('2026-02');
  });
});

describe('mortgage-calc: what paying it down does for the asset (DR-1415)', () => {
  const loan = { principal: 80000, ratePct: 6.5, years: 20, startYm: '2023-05' };
  it('what is owned now, after a year, and what is freed when it is paid off', () => {
    const a = assetView(calculate(loan, { annualTax: 1200 }), { propertyValue: 120000, rent: 1100 });
    expect(a).toMatchObject({
      value: 120000,
      owedNow: 80000,
      equityNow: 40000,
      ownedPctNow: 33.3,
      monthsCounted: 12,
      paidOffYm: '2043-04',
      freedPerMonth: 596.46,
      monthsSaved: 0,
      keptBySooner: 0,
      rentAfterPayoff: 1000,
    });
    expect(a.equityIn12).toBeCloseTo(120000 - (80000 - a.paidDownIn12), 2);
    expect(a.paidDownIn12).toBeGreaterThan(2000);
  });
  it('extra principal: the months no payment is owed, and what those payments come to', () => {
    const a = assetView(calculate({ ...loan, prepay: { monthly: { amount: 600, startMonth: 1 } } }), { propertyValue: 120000 });
    expect([a.paidOffYm, a.monthsSaved, a.keptBySooner, a.interestSaved]).toEqual(['2030-04', 156, 93047.76, 43549.02]);
  });
  it('with no value on file it gives no equity figure, never a guess', () => {
    const a = assetView(calculate(loan), {});
    expect([a.value, a.equityNow, a.ownedPctNow, a.equityIn12, a.rentAfterPayoff]).toEqual([null, null, null, null, null]);
    expect(a.owedNow).toBe(80000);
  });
  it('gives nothing for a loan that has no answer', () => {
    expect(assetView(calculate({ principal: 100000, ratePct: 12, payment: 900 }), { propertyValue: 1 })).toBeNull();
  });
});
