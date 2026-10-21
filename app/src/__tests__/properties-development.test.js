// =============================================================================
// Building from the ground up: the budget, the phases and their checks, the
// contingency and its change orders, and what the building is worth (DR-1166).
// The Richmond build Daniil Kleyman walked through is the fixture: its own
// numbers, from the transcript in docs/99-session-notes/sources/
// clayman-40-unit-mixed-use-richmond-development/.
//
// PROVEN-TO-CATCH (DR-0076 §3): a blank is never zero; a mixed-use budget with
// no TI line is underfunded; only approved change orders drawn on the
// contingency spend it; a phase is complete only when every required check has
// passed; retail at 6% on Kleyman's numbers is $2,628,000; and cost per unit
// counts the retail as the apartments it is worth.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  LINE_KIND_KEYS, DEV_PHASES, budgetSummary, tiCheck, phaseProgress,
  capValue, noiFromGross, valuation, monthsBetween,
  PROJECT_KIND_KEYS, phasesFor, buildToRent, compareBuildToRent, dealReturns,
} from '../modules/properties/development.js';

const M = (dollars) => Math.round(dollars * 100); // dollars to cents

describe('the budget', () => {
  // Richmond: land $1.27M, soft ~$2.0M, hard ~$8.0M (TI $520K inside the
  // owner-carried items, carried here as its own line), cost of money $725K,
  // contingency $500K, change orders $340K drawn on it.
  const lines = [
    { kind: 'land', label: 'Land', budgetCents: M(1270000) },
    { kind: 'soft', label: 'Owner-carried soft costs', budgetCents: M(1200000) },
    { kind: 'soft', label: 'General conditions', budgetCents: M(535000) },
    { kind: 'hard', label: 'Trades', budgetCents: M(7480000) },
    { kind: 'ti', label: 'Tenant improvement allowance', budgetCents: M(520000) },
    { kind: 'financing', label: 'Cost of money', budgetCents: M(725000) },
    { kind: 'contingency', label: 'Owner contingency', budgetCents: M(500000) },
  ];
  const changeOrders = [
    { label: 'Performance bond', amountCents: M(100000), source: 'contingency', status: 'approved' },
    { label: 'Drawing revisions', amountCents: M(60000), source: 'contingency', status: 'approved' },
    { label: 'Site work', amountCents: M(66000), source: 'contingency', status: 'approved' },
    { label: 'Appliance and finish upgrades', amountCents: M(114000), source: 'contingency', status: 'approved' },
    { label: 'Proposed extra', amountCents: M(25000), source: 'contingency', status: 'proposed' },
    { label: 'Rejected', amountCents: M(90000), source: 'contingency', status: 'rejected' },
  ];

  it('carries every category the Richmond budget carried', () => {
    expect(LINE_KIND_KEYS).toEqual(['land', 'soft', 'hard', 'ti', 'financing', 'contingency']);
  });

  it('only approved orders drawn on the contingency spend it, and a proposed one is counted apart', () => {
    const b = budgetSummary({ lines, changeOrders });
    expect(b.contingencyCents).toBe(M(500000));
    expect(b.contingencyUsedCents).toBe(M(340000));
    expect(b.contingencyLeftCents).toBe(M(160000));
    expect(b.contingencyUsedPct).toBe(68);
    expect(b.pendingChangeCents).toBe(M(25000));
    expect(b.contingencyOverdrawn).toBe(false);
    // The changes were inside the budget, so the projection is the budget.
    expect(b.projectedCents).toBe(b.budgetCents);
  });

  it('an owner-funded change sits outside the budget and raises the projection', () => {
    const b = budgetSummary({ lines, changeOrders: [{ amountCents: M(10000), source: 'owner', status: 'approved' }] });
    expect(b.projectedCents).toBe(b.budgetCents + M(10000));
    expect(b.contingencyUsedCents).toBe(0);
  });

  it('a line with no amount is unpriced, never zero', () => {
    const b = budgetSummary({ lines: [{ kind: 'hard', label: 'Masonry', budgetCents: '' }, { kind: 'hard', label: 'Steel', budgetCents: M(1000) }] });
    expect(b.unpricedLines).toBe(1);
    expect(b.hardCents).toBe(M(1000));
  });

  it('overdrawing the contingency is named', () => {
    const b = budgetSummary({ lines, changeOrders: [{ amountCents: M(600000), source: 'contingency', status: 'approved' }] });
    expect(b.contingencyOverdrawn).toBe(true);
    expect(b.contingencyLeftCents).toBe(-M(100000));
  });
});

describe('the tenant improvement allowance', () => {
  const bays = [
    { name: 'Bay A', sqFt: 3000, tiCents: M(195000), tiDrawnCents: M(50000) },
    { name: 'Bay B', sqFt: 3000, tiCents: M(195000) },
    { name: 'Bay C', sqFt: 2000, tiCents: M(130000) },
  ];

  it('a building with commercial space and no TI line is underfunded', () => {
    expect(tiCheck({ bays, lines: [{ kind: 'hard', budgetCents: M(1) }] }).status).toBe('missing');
  });

  it("Richmond's $520,000 for 8,000 square feet is funded, $65 a square foot", () => {
    const t = tiCheck({ bays, lines: [{ kind: 'ti', budgetCents: M(520000) }] });
    expect(t.status).toBe('funded');
    expect(t.commercialSqFt).toBe(8000);
    expect(t.perBay[0].perSqFtCents).toBe(M(65));
    expect(t.perBay[0].leftCents).toBe(M(145000));
  });

  it('promising more than the line holds is short, by how much', () => {
    const t = tiCheck({ bays, lines: [{ kind: 'ti', budgetCents: M(400000) }] });
    expect(t.status).toBe('short');
    expect(t.shortCents).toBe(M(120000));
  });

  it('an all-apartment building needs none', () => {
    expect(tiCheck({ bays: [], lines: [] }).status).toBe('not-needed');
  });
});

describe('the phases and their checks', () => {
  it('runs in the order the building went up, with the proofs named', () => {
    expect(DEV_PHASES.map((p) => p.key)).toEqual(['site', 'foundation', 'underground', 'structure', 'envelope', 'mep', 'interior', 'commercial-shell']);
    const foundation = DEV_PHASES.find((p) => p.key === 'foundation');
    expect(foundation.checks.map((c) => c.key)).toContain('concrete-strength');
    // The seven trades of the rough-in each sign off.
    expect(DEV_PHASES.find((p) => p.key === 'mep').checks.length).toBe(8);
  });

  it('a phase is complete only when every required check has passed, and a failure holds it', () => {
    const results = { site: { 'pad-ready': { state: 'passed', date: '2025-01-10', by: 'Inspector' } } };
    let p = phaseProgress({ results });
    expect(p.phases[0].complete).toBe(true);
    expect(p.current).toBe('foundation');
    results.foundation = { 'footer-inspection': { state: 'passed' }, 'concrete-strength': { state: 'failed', note: 'Low break' } };
    p = phaseProgress({ results });
    expect(p.phases[1].status).toBe('held');
    expect(p.held).toEqual(['foundation']);
    expect(p.phases[1].complete).toBe(false);
  });

  it("a project's own check joins the phase and is required if it says so", () => {
    const p = phaseProgress({
      results: { site: { 'pad-ready': { state: 'passed' } } },
      extraChecks: { site: [{ key: 'erosion', label: 'Erosion control in place', required: true }] },
    });
    expect(p.phases[0].complete).toBe(false);
  });
});

describe('what it is worth', () => {
  it("retail at a 6 cap on Kleyman's numbers is $2,628,000", () => {
    // 8,000 sq ft at $27 = $216,000 gross; 27% off = $157,680 NOI; / 6%.
    const noi = noiFromGross(M(216000), 27);
    expect(noi).toBe(M(157680));
    expect(capValue(noi, 6)).toBe(M(2628000));
  });

  it("cost per unit counts the retail as the apartments it is worth", () => {
    // Richmond: about $15M as built, $12,148,000 all in, 45,000 sq ft, 40 apartments.
    // Apartments' NOI chosen so their value is $12,320,000 at a 5.5 cap.
    const v = valuation({
      units: 40,
      grossSqFt: 45000,
      totalCostCents: M(12148000),
      residentialNoiCents: M(677600),
      residentialCapRatePct: 5.5,
      commercialNoiCents: M(157680),
      commercialCapRatePct: 6,
    });
    expect(v.complete).toBe(true);
    expect(v.residentialValueCents).toBe(M(12320000));
    expect(v.asBuiltCents).toBe(M(14948000));
    expect(v.equityCreatedCents).toBe(M(2800000));
    expect(v.costPerSqFtCents).toBe(M(269.96));
    expect(v.costPerUnitCents).toBe(M(303700));
    // $2.628M of retail over $308,000 an apartment is about 8.5 apartments.
    expect(v.equivalentUnits).toBe(8.5);
    expect(v.costPerEquivalentUnitCents).toBeLessThan(M(255000));
    expect(v.costPerEquivalentUnitCents).toBeGreaterThan(M(245000));
  });

  it('nothing is valued until the income and the rate are known', () => {
    const v = valuation({ units: 40, totalCostCents: M(1), residentialNoiCents: '', residentialCapRatePct: 5.5 });
    expect(v.complete).toBe(false);
    expect(v.missing).toEqual(["the apartments' net operating income"]);
    expect(v.asBuiltCents).toBeNull();
    expect(capValue(M(1000), 0)).toBeNull();
    expect(noiFromGross(M(1000), 100)).toBeNull();
  });

  it('a building with no commercial space has no equivalent units', () => {
    const v = valuation({ units: 10, totalCostCents: M(2000000), residentialNoiCents: M(110000), residentialCapRatePct: 5.5 });
    expect(v.equivalentUnits).toBe(0);
    expect(v.costPerEquivalentUnitCents).toBe(v.costPerUnitCents);
  });

  it('counts the months of the schedule', () => {
    expect(monthsBetween('2024-01-15', '2025-03-01')).toBe(14);
  });
});

describe('what is being built', () => {
  it('a home, a duplex, apartments, mixed use or commercial', () => {
    expect(PROJECT_KIND_KEYS).toEqual(['home', 'duplex', 'multifamily', 'mixed-use', 'commercial']);
  });

  it('a home has no commercial shell, and no elevator check unless it has one', () => {
    const home = phasesFor({ kind: 'home' });
    expect(home.map((p) => p.key)).not.toContain('commercial-shell');
    expect(home.find((p) => p.key === 'interior').checks.map((c) => c.key)).not.toContain('elevator-inspection');
    expect(home.find((p) => p.key === 'mep').checks.find((c) => c.key === 'data').required).toBe(false);
    const mixed = phasesFor({ kind: 'mixed-use', hasElevator: true });
    expect(mixed.map((p) => p.key)).toContain('commercial-shell');
    expect(mixed.find((p) => p.key === 'interior').checks.map((c) => c.key)).toContain('elevator-inspection');
  });

  it("a home's progress is measured against a home's phases", () => {
    const p = phaseProgress({ kind: 'home', results: {} });
    expect(p.total).toBe(7);
  });
});

describe('build to rent, single-family or duplex (Kleyman)', () => {
  // Infill lot $60,000. One 2,400 ft house at $145 a foot renting $2,700;
  // two 1,200 ft units at $160 renting $2,000 each; a 1,600 ft house at $145, $2,500.
  const house = { name: 'Four-bed house', lotCostCents: M(60000), units: 1, sqFtPerUnit: 2400, buildCostPerSqFtCents: M(145), rentPerUnitCents: M(2700) };
  const duplex = { name: 'Duplex', lotCostCents: M(60000), units: 2, sqFtPerUnit: 1200, buildCostPerSqFtCents: M(160), rentPerUnitCents: M(2000) };
  const small = { name: 'Efficient four-bed', lotCostCents: M(60000), units: 1, sqFtPerUnit: 1600, buildCostPerSqFtCents: M(145), rentPerUnitCents: M(2500) };

  it('the house: $348,000 to build, just under 8%', () => {
    const r = buildToRent(house);
    expect(r.buildPerUnitCents).toBe(M(348000));
    expect(r.landPerUnitCents).toBe(M(60000));
    expect(r.grossYieldPct).toBe(7.94);
  });

  it('the duplex: land halves, $192,000 a unit, almost 11%', () => {
    const r = buildToRent(duplex);
    expect(r.landPerUnitCents).toBe(M(30000));
    expect(r.buildPerUnitCents).toBe(M(192000));
    expect(r.rentPerSqFtCents).toBe(M(1.67));
    expect(r.grossYieldPct).toBe(10.81);
  });

  it('the efficient house beats the big one, and the duplex beats both', () => {
    const ranked = compareBuildToRent([house, small, duplex]);
    expect(ranked.map((o) => o.name)).toEqual(['Duplex', 'Efficient four-bed', 'Four-bed house']);
    expect(ranked[1].grossYieldPct).toBe(10.27);
  });

  it('a missing figure is named, not guessed', () => {
    expect(buildToRent({ ...duplex, rentPerUnitCents: '' }).missing).toEqual(['rent per unit']);
  });
});

describe('the deal for investors', () => {
  const capital = [
    { kind: 'loan', name: 'Construction loan', amountCents: M(9000000), rateBp: 700 },
    { kind: 'investor', name: 'Investor A', amountCents: M(2000000), rateBp: 800, shareBp: 5000 },
    { kind: 'sponsor', name: 'Poe Properties', amountCents: M(1148000) },
  ];

  it('the loan is paid first, then the preferred return, then the shares', () => {
    const d = dealReturns({ capital, noiCents: M(835280), asBuiltCents: M(14948000) });
    expect(d.debtServiceCents).toBe(M(630000));
    expect(d.cashFlowCents).toBe(M(205280));
    expect(d.prefOwedCents).toBe(M(160000));
    expect(d.prefCovered).toBe(true);
    expect(d.perInvestor[0].prefPaidCents).toBe(M(160000));
    expect(d.perInvestor[0].shareCents).toBe(M(22640));
    expect(d.dscr).toBe(1.33);
    expect(d.loanToValuePct).toBe(60.2);
    expect(d.cashOnCashPct).toBe(6.5); // $205,280 over $3,148,000 of equity
    expect(d.equityMultiple).toBe(1.89);
  });

  it('a short year says how far short the preferred return fell', () => {
    const d = dealReturns({ capital, noiCents: M(700000) });
    expect(d.prefCovered).toBe(false);
    expect(d.prefShortCents).toBe(M(90000));
    expect(d.perInvestor[0].prefPaidCents).toBe(M(70000));
  });

  it('nothing is claimed without the income or an amount', () => {
    expect(dealReturns({ capital: [{ kind: 'loan', name: 'Bank', amountCents: '' }] }).missing)
      .toEqual(['the net operating income once leased', 'the amount for Bank']);
  });
});
