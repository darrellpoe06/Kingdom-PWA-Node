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
import { brrrr, trackBudget, BRRRR_RULES, leverage, lotSplit, maxLandPrice, arvFromComps } from '../modules/properties/development.js';

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

describe('the land, the bank and the cash (Kleyman\'s duplex videos, HCa1XR4ev5M and 9zjeGb74TmU)', () => {
  it('the build-to-rent duplex: debt coverage is the limit — "$3,800 ... minus $1,140 ... 2660 ... cannot be more than $2,128 ... 275 grand"', () => {
    const l = leverage({ asBuiltCents: 55000000, totalCostCents: 38800000, noiMonthlyCents: 266000, ratePct: 7, amortYears: 20, maxLtvPct: 80, maxLtcPct: 85, minDcr: 1.25 });
    expect(l.byValueCents).toBe(44000000);            // "80% of future value ... $440,000"
    expect(l.maxPaymentCents).toBe(212800);
    expect(Math.round(l.byCoverageCents / 100000)).toBe(274);
    expect(l.binding).toBe('coverage');
    expect(Math.round(l.cashFlowMonthlyCents / 100)).toBe(532);   // "cash flow $532 a month"
    expect(Math.round(l.cashOnCashPct * 10) / 10).toBe(5.6);       // "5.6% a year cash on cash"
  });
  it('zero cash with the land as equity: 20 years does not carry $325,000, 25 years does', () => {
    const at = (amortYears) => leverage({ asBuiltCents: 55000000, totalCostCents: 42500000, noiMonthlyCents: 280000, ratePct: 6.5, amortYears, maxLtvPct: 70, maxLtcPct: 80, minDcr: 1.25, landEquityCents: 10000000, requestedLoanCents: 32500000 });
    const twenty = at(20);
    expect(twenty.requested).toMatchObject({ ltvPct: 59.09, ltcPct: 76.47, dcr: 1.16, fits: false }); // "59% LTV ... 76.5% of cost ... 1.16"
    expect(twenty.cashNeededCents).toBeGreaterThan(0);
    const twentyFive = at(25);
    expect(twentyFive.requested).toMatchObject({ dcr: 1.28, fits: true });                             // "bumps us up to a 1.28"
    expect(twentyFive.cashNeededCents).toBe(0);                                                         // "fund 100% of your construction budget"
  });
  it('PROVEN TO CATCH: the land counts at what it is worth, not at what was paid', () => {
    const base = { asBuiltCents: 55000000, totalCostCents: 42500000, noiMonthlyCents: 280000, ratePct: 6.5, amortYears: 25, maxLtvPct: 70, maxLtcPct: 80, minDcr: 1.25 };
    expect(leverage({ ...base, landEquityCents: 10000000 }).cashNeededCents).toBe(0);
    expect(leverage({ ...base, landEquityCents: 0 }).cashNeededCents).toBeGreaterThan(9000000);
  });
  it('the lot split: "I own this $115,000 piece of land for only 5K"', () => {
    const s = lotSplit({ purchaseCents: 22000000, closingCents: 300000, softCostsCents: 1200000, lotValueCents: 11500000, lotsSold: 2, lotsKept: 1 });
    expect(s).toMatchObject({ putInCents: 23500000, soldCents: 23000000, outOfPocketCents: 500000, keptValueCents: 11500000, keptBasisCents: 500000 });
    // The back-of-the-napkin case: $80,000, two lots worth $80,000 each, sell one.
    expect(lotSplit({ purchaseCents: 8000000, lotValueCents: 8000000, lotsSold: 1 })).toMatchObject({ outOfPocketCents: 0, keptBasisCents: 0, keptValueCents: 8000000 });
  });
  it('the most to pay for land is the finished value less the equity you mean to create, the build and the soft costs', () => {
    expect(maxLandPrice({ asBuiltCents: 55000000, sweatEquityPct: 20, buildCents: 30000000, softCents: 2000000 }))
      .toMatchObject({ sweatEquityCents: 11000000, maxLandCents: 12000000 });
  });
  it('nothing is computed without its inputs', () => {
    expect(leverage({}).complete).toBe(false);
    expect(lotSplit({}).missing).toEqual(['purchaseCents', 'lotValueCents', 'lotsSold']);
  });
});

describe('what it will be worth, from comparable sales (Kleyman, 9zjeGb74TmU)', () => {
  // Constructed comps averaging $231 a foot after the $100-a-foot outlier is
  // struck, as on his screen; the subject is his 2,400 sq ft duplex.
  const COMPS = [
    { label: 'Renovated duplex A', priceCents: 50820000, sqFt: 2200 },   // $231
    { label: 'Renovated duplex B', priceCents: 57750000, sqFt: 2500 },   // $231
    { label: 'Renovated triplex', priceCents: 60060000, sqFt: 2600 },    // $231
    { label: 'Unrenovated duplex', priceCents: 24000000, sqFt: 2400 },   // $100, the outlier
  ];
  it('"average comp is $231 a foot, which puts my duplex at 553" once the $100-a-foot outlier is out', () => {
    const a = arvFromComps({ comps: COMPS, subjectSqFt: 2400, floorPerSqFtCents: 15000 });
    expect(a.usedCount).toBe(3);
    expect(a.averagePerSqFtCents).toBe(23100);
    expect(a.arvCents).toBe(55440000);
    expect(a.rows[3]).toMatchObject({ used: false, why: 'under the floor a foot', perSqFtCents: 10000 });
  });
  it('PROVEN TO CATCH: leaving the outlier in drags the value down', () => {
    expect(arvFromComps({ comps: COMPS, subjectSqFt: 2400 }).arvCents).toBeLessThan(50000000);
    const struck = arvFromComps({ comps: COMPS.map((c, i) => (i === 3 ? { ...c, excluded: true } : c)), subjectSqFt: 2400 });
    expect(struck.arvCents).toBe(55440000);
    expect(struck.rows[3].why).toBe('struck as an outlier');
  });
  it('no comps, or no subject size, gives no number', () => {
    expect(arvFromComps({ comps: [], subjectSqFt: 2400 })).toMatchObject({ complete: false, missing: ['at least one comparable sale'] });
    expect(arvFromComps({ comps: COMPS }).missing).toEqual(['the square feet of the subject']);
  });
});
