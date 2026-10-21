// =============================================================================
// The Rehab Valuator methods folded into development.js (DR-1158):
//   * Daniil Kleyman, "how to analyze your BRRRR deals" — his worked deal and
//     each of his variations, figure for figure;
//   * Brandon Lindsay (Rehab Valuator's Playbook), budget against actual — the
//     tracking sheet, the pre-sale forecast, and a finished line's real cost a
//     square foot carried into the next build.
// Transcripts: docs/99-session-notes/sources/rehab-valuator-brrrr-deal-analysis-uvh8xs5y-wc/
// and rehab-valuator-actual-vs-budget-zmkzjuzet6e/ (auto-captions, no timestamps:
// figures are attributed to the speaker, not to a minute mark).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { brrrr, trackBudget, BRRRR_RULES } from '../modules/properties/development.js';

// "$50,000 ... fifteen hundred bucks in closing costs ... 20 thousand dollars of
// renovations ... another thousand dollars worth of holding costs ... 8%
// interest for three months"; ARV $100,000; rent $1,000 at 8% vacancy;
// insurance $600 a year, taxes $1,200 a year, repairs $100 a month; refinanced
// at 80%, 5.5%, 20-year amortization, two points.
const DEAL = {
  purchaseCents: 5000000, closingCents: 150000, rehabCents: 2000000, holdingCents: 100000,
  shortRatePct: 8, shortMonths: 3, arvCents: 10000000, rentMonthlyCents: 100000, vacancyPct: 8,
  insuranceYearCents: 60000, taxesYearCents: 120000, repairsMonthlyCents: 10000,
  refiLtvPct: 80, refiRatePct: 5.5, amortYears: 20, refiCostPct: 2,
};

describe('BRRRR, from Kleyman\'s own worked deal', () => {
  it('the all-in cost is "just under seventy four thousand dollars"', () => {
    const d = brrrr(DEAL);
    expect(d.costBasisCents).toBe(7395000);
    expect(d.cashToCloseCents).toBe(0); // "we have to bring zero cash to the table"
  });
  it('NOI $670, payment $550, "pocket forty four hundred", cash flow $120', () => {
    const d = brrrr(DEAL);
    expect(d.noiMonthlyCents).toBe(67000);
    expect(Math.round(d.paymentCents / 100)).toBe(550);
    expect(d.loanCents).toBe(8000000);
    expect(d.cashOutCents).toBe(445000);
    expect(Math.round(d.cashFlowMonthlyCents / 100)).toBe(120);
    expect(d.equityCents).toBe(2000000);
  });
  it('an 8% management fee: "cash flow is only 46 dollars and our debt coverage ratio drops to 1.08"', () => {
    const d = brrrr({ ...DEAL, managementPct: 8 });
    expect(Math.round(d.cashFlowMonthlyCents / 100)).toBe(46);
    expect(d.dcr).toBe(1.08);
    expect(d.works).toBe(false);
    // The bank sizes the loan by coverage: about 67% of value at 1.3, which is
    // why "we can only lend you 65".
    expect(Math.round(d.loanAtDcrCents / d.loanCents * 80)).toBe(67);
  });
  it('rent of $1,200: "debt coverage ratio is now 1.39, our cash flow is over 200 bucks" — the deal works', () => {
    const d = brrrr({ ...DEAL, managementPct: 8, rentMonthlyCents: 120000 });
    expect(d.dcr).toBe(1.39);
    expect(d.cashFlowMonthlyCents).toBeGreaterThan(20000);
    expect(d.works).toBe(true);
  });
  it('a $5,000 rehab refinanced at 65%: "1.33 the DCR, one hundred and fifty bucks ... pocketed five grand"', () => {
    const d = brrrr({ ...DEAL, managementPct: 8, rehabCents: 500000, refiLtvPct: 65 });
    expect(d.dcr).toBe(1.33);
    expect(Math.round(d.cashFlowMonthlyCents / 100)).toBe(149);
    expect(d.cashOutCents).toBe(505000);
  });
  it('all cash, 65% out: $8,800 left in the deal earning about 43% cash on cash', () => {
    const d = brrrr({ ...DEAL, managementPct: 8, rentMonthlyCents: 120000, refiLtvPct: 65, shortFinancedPct: 0 });
    expect(d.costBasisCents).toBe(7250000);
    expect(d.leftInDealCents).toBe(880000);
    expect(Math.round(d.cashOnCashPct)).toBe(43);
    expect(d.checks.find((c) => c.key === 'left').ok).toBe(true);
  });
  it('PROVEN TO CATCH: each of his rules fails the deal on its own', () => {
    const fails = (over) => brrrr({ ...DEAL, managementPct: 8, rentMonthlyCents: 120000, ...over }).checks.filter((c) => !c.ok).map((c) => c.key);
    expect(fails({})).toEqual([]);
    expect(fails({ purchaseCents: 6000000 })).toContain('cost');
    expect(fails({ rentMonthlyCents: 100000 })).toEqual(expect.arrayContaining(['dcr', 'cashflow']));
    expect(fails({ rentMonthlyCents: 105000, insuranceYearCents: 0, taxesYearCents: 0, repairsMonthlyCents: 0, managementPct: 0 })).toContain('rent');
    expect(fails({ refiLtvPct: 10, shortFinancedPct: 0, repairsMonthlyCents: 30000 })).toContain('left');
    expect(BRRRR_RULES).toMatchObject({ maxCostPctOfArv: 80, minDcr: 1.3, minRentToCostPct: 1.5 });
  });
  it('the lender\'s stress test models management and vacancy even when you manage it yourself', () => {
    const d = brrrr({ ...DEAL, vacancyPct: 0 });
    expect(d.stressed.noiMonthlyCents).toBeLessThan(d.noiMonthlyCents);
    expect(d.stressed.dcr).toBe(1.08);
  });
  it('nothing is analyzed without the value, the rent and the loan terms', () => {
    expect(brrrr({ ...DEAL, arvCents: '' })).toEqual({ complete: false, missing: ['arvCents'] });
  });
});

describe('budget against actual (Brandon Lindsay, Rehab Valuator\'s Playbook)', () => {
  // A 2,000 sq ft house: his framing figures ($25 a foot material, $7 labor)
  // are the finished lines; the roof ran over; the kitchen is still open.
  const LINES = [
    { id: 1, label: 'Framing material', budgetCents: 4800000, actualCents: 5000000, done: true },
    { id: 2, label: 'Framing labor', budgetCents: 1500000, actualCents: 1400000, done: true },
    { id: 3, label: 'Kitchen', budgetCents: 3000000, actualCents: 1200000, done: false },
    { id: 4, label: 'Roof', budgetCents: 1500000, actualCents: 1800000, done: false },
    { id: 5, label: 'Landscaping', budgetCents: null, actualCents: null, done: false },
  ];
  it('each line says budget, budget a foot, actual and variance', () => {
    const t = trackBudget({ lines: LINES, grossSqFt: 2000 });
    const by = Object.fromEntries(t.rows.map((r) => [r.label, r]));
    expect(by['Framing material']).toMatchObject({ budgetPerSqFtCents: 2400, actualPerSqFtCents: 2500, varianceCents: -200000, status: 'over' });
    expect(by['Framing labor']).toMatchObject({ actualPerSqFtCents: 700, varianceCents: 100000, status: 'under' });
    expect(by.Kitchen).toMatchObject({ forecastCents: 3000000, status: 'open', actualPerSqFtCents: null });
    expect(by.Roof).toMatchObject({ forecastCents: 1800000, status: 'running-over' });
  });
  it('PROVEN TO CATCH: the pre-sale forecast never forecasts spent money back down, and names what it cannot count', () => {
    const t = trackBudget({ lines: LINES, grossSqFt: 2000 });
    expect(t.forecastCents).toBe(5000000 + 1400000 + 3000000 + 1800000);
    expect(t.forecastVarianceCents).toBe(10800000 - 11200000);
    expect(t.forecastComplete).toBe(false);
    expect(t.unknown).toEqual(['Landscaping']);
  });
  it('a finished line\'s real cost a foot is carried to the next build: "$25 per square foot ... $7 per square foot"', () => {
    const t = trackBudget({ lines: LINES, grossSqFt: 2000 });
    expect(t.unitCosts).toEqual([
      { label: 'Framing material', perSqFtCents: 2500 },
      { label: 'Framing labor', perSqFtCents: 700 },
    ]);
  });
});
