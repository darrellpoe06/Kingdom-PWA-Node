// =============================================================================
// development — building a property from the ground up: the budget, the
// phases and their checks, the contingency and its change orders, and what the
// finished building is worth (DR-1158)
// =============================================================================
// Darrell, 2026-10-21, over Daniil Kleyman's walk-through of a 40-unit
// mixed-use build in Richmond, Virginia (40 apartments over 8,000 square feet
// of commercial space, a $10.15 million budget, 14 months, about $15 million
// as built): "Find and create processes for these types of real-estate
// solutions." Then the building's systems, phase by phase, and the commercial
// shell with its tenant improvement allowance.
//
// Four processes, one record:
// 1. THE BUDGET. Soft costs (permits, design, developer fee, financing) and
//    hard costs by trade, plus two lines a mixed-use budget must carry from the
//    start: the tenant improvement (TI) allowance for every commercial bay, and
//    the contingency. A building with commercial space and no TI money is
//    flagged underfunded: the shell is a gravel floor and four walls, and the
//    tenant's slab, framing, plumbing and HVAC are paid from that allowance at
//    lease-up, when the money is most likely to have run out.
// 2. THE PHASES. The order the building actually goes up, each phase with the
//    work it holds and the checks that prove it (a third-party concrete
//    strength test, a sign-off for every one of the seven trades in the MEP
//    rough-in, the elevator inspection). A check is passed, failed or not yet
//    done, with a date and who signed it; a phase is complete only when every
//    required check has passed.
// 3. THE CONTINGENCY. Every change order says where its money comes from. The
//    contingency left is the contingency less the approved orders drawn on it,
//    and the budget's variance counts every approved order once.
// 4. WHAT IT IS WORTH. Value is net operating income over a cap rate, the
//    apartments and the commercial space each at their own rate (retail
//    trades at a higher cap than apartments; Kleyman ran the apartments at
//    5 to 5.5 and the retail at 6). The as-built value less the total cost is
//    the equity the build created ($15M against $12.15M, about $3M). Cost per
//    unit is given plainly and Kleyman's way, with the retail counted as the
//    apartments it is worth.
//
// Integer cents throughout (door-economics' rule: never a float sum). NOTHING
// IS GUESSED (DR-0076): an amount nobody entered is missing, never zero, and a
// value is not given until its income and rate are both known.
// =============================================================================

// The cost categories as the Richmond budget carried them (Kleyman: land
// $1.27M, soft costs just over $2M, hard costs just over $8M, the cost of money
// $725K, a total of $12,148,000; the $520K TI allowance and the $500K
// contingency carried as their own lines). Within soft costs, `group` names
// owner-carried costs, the general contractor's general conditions, and other
// soft costs; demolition was carried as a soft cost.
export const LINE_KINDS = [
  { key: 'land', label: 'Land', plain: 'What the site cost' },
  { key: 'soft', label: 'Soft cost', plain: 'Everything before shovels hit the ground: permits, tap fees, design and engineering, legal and closing, the developer fee, insurance, and the general contractor\'s general conditions' },
  { key: 'hard', label: 'Hard cost', plain: 'The building itself: the builder\'s profit and overhead, then trade by trade' },
  { key: 'ti', label: 'Tenant improvement allowance', plain: 'What the developer gives each commercial tenant toward their buildout' },
  { key: 'financing', label: 'Cost of money', plain: 'Interest and fees on the construction loan while the building goes up' },
  { key: 'contingency', label: 'Contingency', plain: 'Money set aside above the contractor\'s own, drawn by change orders' },
];
export const LINE_KIND_KEYS = LINE_KINDS.map((k) => k.key);

// Where a change order's money comes from.
export const CHANGE_SOURCES = [
  { key: 'contingency', label: 'The contingency' },
  { key: 'ti', label: "A tenant's improvement allowance" },
  { key: 'line', label: 'Its own budget line' },
  { key: 'owner', label: 'Paid by the owner, outside the budget' },
];
export const CHANGE_SOURCE_KEYS = CHANGE_SOURCES.map((s) => s.key);

// The phases a ground-up mixed-use building goes through, in order, with the
// work each holds and the checks that prove it. Drawn from the Richmond build
// and Darrell's notes on its systems; a project adds its own checks beside these.
export const DEV_PHASES = [
  {
    key: 'site',
    label: 'Demolition and site preparation',
    work: ['Demolish what stands on the site', 'Scrape the topsoil', 'Import stone and compact the building pad'],
    checks: [{ key: 'pad-ready', label: 'Building pad compacted and ready for footers', required: true }],
  },
  {
    key: 'foundation',
    label: 'Foundation',
    work: ['Footers and rebar, heaviest at the stairwells and the elevator shaft', 'Pour the footers and the slab'],
    checks: [
      { key: 'footer-inspection', label: 'Footer inspection before the pour', required: true },
      { key: 'concrete-strength', label: 'Third-party concrete strength test', required: true },
    ],
  },
  {
    key: 'underground',
    label: 'Underground',
    work: [
      'Water and sewer laterals to the street',
      'Conduit through the slab for every commercial bay, so nothing is retrofitted later',
      'The underground stormwater system (BMP) beneath the parking',
    ],
    checks: [
      { key: 'utilities-inspection', label: 'Underground utilities inspected before backfill', required: true },
      { key: 'bmp-installed', label: 'Stormwater system installed as designed', required: true },
    ],
  },
  {
    key: 'structure',
    label: 'Structure',
    work: ['Structural steel for the cantilevered parking and the storefront glass', 'Wood framing and trusses'],
    checks: [{ key: 'framing-inspection', label: 'Framing inspection', required: true }],
  },
  {
    key: 'envelope',
    label: 'Envelope',
    work: ['Brick veneer', 'Composite decking on the balconies, for low upkeep', 'A 60 mil TPO roof'],
    checks: [{ key: 'roof-watertight', label: 'Roof watertight', required: true }],
  },
  {
    key: 'mep',
    label: 'Mechanical, electrical and plumbing rough-in',
    work: ['Seven trades at once: HVAC, electrical, plumbing, sprinklers, fire alarm, low-voltage security, internet cabling'],
    checks: [
      { key: 'hvac', label: 'HVAC rough-in signed off', required: true },
      { key: 'electrical', label: 'Electrical rough-in signed off', required: true },
      { key: 'plumbing', label: 'Plumbing rough-in signed off', required: true },
      { key: 'sprinkler', label: 'Sprinklers signed off', required: true },
      { key: 'fire-alarm', label: 'Fire alarm signed off', required: true },
      { key: 'low-voltage', label: 'Low-voltage security signed off', required: true },
      { key: 'data', label: 'Internet cabling signed off', required: true },
      { key: 'rough-in-inspection', label: 'Rough-in inspection before drywall', required: true },
    ],
  },
  {
    key: 'interior',
    label: 'Interior',
    work: ['Gypcrete over the subfloor for sound', 'Drywall', 'Finishes', 'The elevator'],
    checks: [
      { key: 'elevator-inspection', label: 'Elevator inspection', required: true },
      { key: 'certificate-of-occupancy', label: 'Certificate of occupancy', required: true },
    ],
  },
  {
    key: 'commercial-shell',
    label: 'Commercial shell',
    work: ['Each bay delivered as a gravel floor and four walls', 'Water, sewer, gas and electric brought to each bay'],
    checks: [{ key: 'shell-delivered', label: 'Every bay delivered with its utilities', required: true }],
  },
];
export const PHASE_KEYS = DEV_PHASES.map((p) => p.key);

// What is being built. Darrell: "Poe Properties can build from scratch like we
// did our home", and apartment deals with investors. Each kind carries the
// phases that apply to it: a home and a duplex have no commercial shell, and
// the elevator inspection is required only where there is an elevator.
export const PROJECT_KINDS = [
  { key: 'home', label: 'A home', plain: 'One house on one lot, to live in or to rent' },
  { key: 'duplex', label: 'A duplex', plain: 'Two units on one lot, side by side, front and back, or up and down' },
  { key: 'multifamily', label: 'Apartments', plain: 'Three or more apartments in one building' },
  { key: 'mixed-use', label: 'Mixed use', plain: 'Apartments over commercial space' },
  { key: 'commercial', label: 'Commercial', plain: 'Commercial space only' },
];
export const PROJECT_KIND_KEYS = PROJECT_KINDS.map((k) => k.key);
const HAS_COMMERCIAL = new Set(['mixed-use', 'commercial']);

/** The phases a project of this kind goes through, with its own checks applied. */
export function phasesFor({ kind = 'mixed-use', hasElevator = false } = {}) {
  return DEV_PHASES
    .filter((p) => p.key !== 'commercial-shell' || HAS_COMMERCIAL.has(kind))
    .map((p) => ({
      ...p,
      work: p.work.filter((w) => hasElevator || !/elevator/i.test(w)),
      checks: p.checks
        .filter((c) => hasElevator || c.key !== 'elevator-inspection')
        // A small building's rough-in still has every trade it has; low-voltage
        // security and data are not required of a home.
        .map((c) => (['home', 'duplex'].includes(kind) && ['low-voltage', 'data', 'sprinkler'].includes(c.key) ? { ...c, required: false } : c)),
    }));
}
export const CHECK_STATES = ['pending', 'passed', 'failed'];

const isCents = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
const cents = (v) => Math.round(Number(v));
const sum = (xs) => xs.reduce((s, x) => s + x, 0);

/**
 * The budget: what each kind of line comes to, what was spent, and the
 * contingency after the change orders drawn on it.
 * lines: [{ kind, label, budgetCents, actualCents }]
 * changeOrders: [{ amountCents, source, status: 'proposed'|'approved'|'rejected' }]
 */
export function budgetSummary({ lines = [], changeOrders = [] } = {}) {
  const byKind = Object.fromEntries(LINE_KIND_KEYS.map((k) => [k, { budgetCents: 0, actualCents: 0, lines: 0, unpriced: 0 }]));
  for (const l of lines) {
    const k = byKind[l.kind];
    if (!k) continue;
    k.lines += 1;
    if (isCents(l.budgetCents)) k.budgetCents += cents(l.budgetCents); else k.unpriced += 1;
    if (isCents(l.actualCents)) k.actualCents += cents(l.actualCents);
  }
  const approved = changeOrders.filter((c) => c.status === 'approved' && isCents(c.amountCents));
  const fromContingency = sum(approved.filter((c) => c.source === 'contingency').map((c) => cents(c.amountCents)));
  const fromOwner = sum(approved.filter((c) => c.source === 'owner').map((c) => cents(c.amountCents)));
  const pending = changeOrders.filter((c) => c.status === 'proposed' && isCents(c.amountCents));

  const budgetCents = sum(LINE_KIND_KEYS.map((k) => byKind[k].budgetCents));
  // What the building costs to finish: the budget, plus owner-funded changes
  // that sit outside it. Changes drawn on the contingency, a TI allowance or a
  // line's own budget are already inside it.
  const projectedCents = budgetCents + fromOwner;
  const contingencyCents = byKind.contingency.budgetCents;
  const contingencyLeftCents = contingencyCents - fromContingency;
  const unpriced = sum(LINE_KIND_KEYS.map((k) => byKind[k].unpriced));

  return {
    byKind,
    budgetCents,
    landCents: byKind.land.budgetCents,
    hardCents: byKind.hard.budgetCents,
    softCents: byKind.soft.budgetCents,
    financingCents: byKind.financing.budgetCents,
    tiCents: byKind.ti.budgetCents,
    contingencyCents,
    contingencyUsedCents: fromContingency,
    contingencyLeftCents,
    contingencyUsedPct: contingencyCents > 0 ? Math.round((fromContingency / contingencyCents) * 100) : null,
    contingencyOverdrawn: contingencyLeftCents < 0,
    ownerFundedCents: fromOwner,
    projectedCents,
    pendingChangeCents: sum(pending.map((c) => cents(c.amountCents))),
    pendingCount: pending.length,
    spentCents: sum(LINE_KIND_KEYS.map((k) => byKind[k].actualCents)),
    unpricedLines: unpriced,
  };
}

/**
 * The tenant improvement allowance, bay by bay. A building with commercial
 * space must carry it in the budget from the start.
 * bays: [{ name, sqFt, tiCents, tiDrawnCents }]
 */
export function tiCheck({ bays = [], lines = [] } = {}) {
  const tiBudgetCents = sum(lines.filter((l) => l.kind === 'ti' && isCents(l.budgetCents)).map((l) => cents(l.budgetCents)));
  const promisedCents = sum(bays.filter((b) => isCents(b.tiCents)).map((b) => cents(b.tiCents)));
  const drawnCents = sum(bays.filter((b) => isCents(b.tiDrawnCents)).map((b) => cents(b.tiDrawnCents)));
  const commercialSqFt = sum(bays.map((b) => Math.max(0, Number(b.sqFt) || 0)));
  const hasCommercial = bays.length > 0;
  const perBay = bays.map((b) => {
    const promised = isCents(b.tiCents) ? cents(b.tiCents) : null;
    const drawn = isCents(b.tiDrawnCents) ? cents(b.tiDrawnCents) : 0;
    return {
      name: b.name,
      sqFt: Number(b.sqFt) || 0,
      promisedCents: promised,
      perSqFtCents: promised !== null && Number(b.sqFt) > 0 ? Math.round(promised / Number(b.sqFt)) : null,
      drawnCents: drawn,
      leftCents: promised === null ? null : promised - drawn,
      overdrawn: promised !== null && drawn > promised,
    };
  });
  let status = 'not-needed';
  if (hasCommercial) {
    if (tiBudgetCents <= 0) status = 'missing';
    else if (promisedCents > tiBudgetCents) status = 'short';
    else status = 'funded';
  }
  return {
    status,
    hasCommercial,
    commercialSqFt,
    tiBudgetCents,
    promisedCents,
    drawnCents,
    shortCents: status === 'short' ? promisedCents - tiBudgetCents : 0,
    perBay,
    unpromisedBays: bays.filter((b) => !isCents(b.tiCents)).length,
  };
}

/**
 * The phases, with their checks as recorded.
 * results: { [phaseKey]: { [checkKey]: { state, date, by, note } } }
 * extraChecks: { [phaseKey]: [{ key, label, required }] } for a project's own.
 */
export function phaseProgress({ results = {}, extraChecks = {}, kind, hasElevator } = {}) {
  const template = kind ? phasesFor({ kind, hasElevator }) : DEV_PHASES;
  const phases = template.map((p) => {
    const checks = [...p.checks, ...(extraChecks[p.key] || [])].map((c) => {
      const r = (results[p.key] || {})[c.key] || {};
      const state = CHECK_STATES.includes(r.state) ? r.state : 'pending';
      return { ...c, state, date: r.date || null, by: r.by || null, note: r.note || null };
    });
    const required = checks.filter((c) => c.required);
    const passed = required.filter((c) => c.state === 'passed').length;
    const failed = checks.filter((c) => c.state === 'failed');
    const started = checks.some((c) => c.state !== 'pending');
    return {
      key: p.key,
      label: p.label,
      work: p.work,
      checks,
      requiredCount: required.length,
      passedCount: passed,
      failed,
      complete: required.length > 0 && passed === required.length,
      status: failed.length ? 'held' : (required.length && passed === required.length ? 'complete' : (started ? 'under-way' : 'not-started')),
    };
  });
  const current = phases.find((p) => !p.complete) || null;
  return {
    phases,
    completeCount: phases.filter((p) => p.complete).length,
    total: phases.length,
    current: current ? current.key : null,
    held: phases.filter((p) => p.status === 'held').map((p) => p.key),
  };
}

/** Value of a stream of net operating income at a cap rate, in cents. */
export function capValue(noiCents, capRatePct) {
  if (!isCents(noiCents) || !Number.isFinite(Number(capRatePct)) || Number(capRatePct) <= 0) return null;
  return Math.round(cents(noiCents) / (Number(capRatePct) / 100));
}

/** Net operating income from gross rent and an expense ratio (Kleyman took 27% off retail). */
export function noiFromGross(grossCents, expenseRatioPct) {
  if (!isCents(grossCents) || !Number.isFinite(Number(expenseRatioPct))) return null;
  const r = Number(expenseRatioPct);
  if (r < 0 || r >= 100) return null;
  return Math.round(cents(grossCents) * (1 - r / 100));
}

/**
 * What the finished building is worth, and what that says about the cost.
 * NOI is annual; each part at its own cap rate.
 *
 * Cost per unit, Kleyman's way: a mixed-use building's cost over its
 * apartments alone reads too high, because the retail is "much more than a
 * 40-unit building". So the retail's value is turned into the number of
 * apartments it is worth (its value over one apartment's value), and the cost
 * is spread over the apartments plus those equivalent units. For Richmond:
 * $2.628M of retail is about eight apartments, 48 instead of 40, about $253,000
 * a unit all in instead of over $300,000.
 */
export function valuation({
  units,
  grossSqFt,
  totalCostCents,
  residentialNoiCents,
  residentialCapRatePct,
  commercialNoiCents,
  commercialCapRatePct,
} = {}) {
  const missing = [];
  if (!(Number(units) > 0)) missing.push('the number of apartments');
  if (!isCents(totalCostCents)) missing.push('the total cost');
  if (!isCents(residentialNoiCents)) missing.push("the apartments' net operating income");
  if (!(Number(residentialCapRatePct) > 0)) missing.push("the apartments' cap rate");
  const hasCommercial = isCents(commercialNoiCents) || Number(commercialCapRatePct) > 0;
  if (hasCommercial) {
    if (!isCents(commercialNoiCents)) missing.push("the commercial space's net operating income");
    if (!(Number(commercialCapRatePct) > 0)) missing.push("the commercial space's cap rate");
  }
  const n = Number(units) > 0 ? Math.floor(Number(units)) : null;
  const cost = isCents(totalCostCents) ? cents(totalCostCents) : null;
  const sqft = Number(grossSqFt) > 0 ? Number(grossSqFt) : null;
  const residentialValueCents = capValue(residentialNoiCents, residentialCapRatePct);
  const commercialValueCents = hasCommercial ? capValue(commercialNoiCents, commercialCapRatePct) : 0;
  const complete = missing.length === 0;

  const asBuiltCents = complete ? residentialValueCents + commercialValueCents : null;
  const valuePerUnitCents = complete && n ? Math.round(residentialValueCents / n) : null;
  // How many apartments the commercial space is worth.
  const equivalentUnits = complete && valuePerUnitCents > 0 && commercialValueCents > 0
    ? commercialValueCents / valuePerUnitCents : 0;
  const allUnits = n ? n + equivalentUnits : null;
  return {
    complete,
    missing,
    residentialValueCents,
    commercialValueCents: hasCommercial ? commercialValueCents : 0,
    asBuiltCents,
    equityCreatedCents: complete ? asBuiltCents - cost : null,
    marginPct: complete && cost > 0 ? Math.round(((asBuiltCents - cost) / cost) * 1000) / 10 : null,
    costPerSqFtCents: sqft && cost !== null ? Math.round(cost / sqft) : null,
    costPerUnitCents: n && cost !== null ? Math.round(cost / n) : null,
    valuePerUnitCents,
    equivalentUnits: complete ? Math.round(equivalentUnits * 10) / 10 : null,
    costPerEquivalentUnitCents: complete && cost !== null ? Math.round(cost / allUnits) : null,
  };
}

/**
 * Build to rent, Kleyman's way: land and build cost per unit, rent per square
 * foot, and gross yield (a year's rent over land plus build). "People lie,
 * numbers don't": on an infill lot, two 1,200-foot units at $160 a foot and
 * $2,000 each yield almost 11%; one 2,400-foot house at $145 and $2,700 yields
 * just under 8%. Financing and holding costs are left out, as he says.
 */
export function buildToRent({ lotCostCents, units, sqFtPerUnit, buildCostPerSqFtCents, rentPerUnitCents } = {}) {
  const missing = [];
  if (!isCents(lotCostCents)) missing.push('what the lot cost');
  if (!(Number(units) >= 1)) missing.push('how many units on the lot');
  if (!(Number(sqFtPerUnit) > 0)) missing.push('square feet per unit');
  if (!isCents(buildCostPerSqFtCents)) missing.push('build cost per square foot');
  if (!isCents(rentPerUnitCents)) missing.push('rent per unit');
  if (missing.length) return { complete: false, missing };
  const n = Math.floor(Number(units));
  const sqft = Number(sqFtPerUnit);
  const landPerUnitCents = Math.round(cents(lotCostCents) / n);
  const buildPerUnitCents = Math.round(sqft * cents(buildCostPerSqFtCents));
  const basisPerUnitCents = landPerUnitCents + buildPerUnitCents;
  const rent = cents(rentPerUnitCents);
  return {
    complete: true,
    missing,
    landPerUnitCents,
    buildPerUnitCents,
    basisPerUnitCents,
    totalBasisCents: basisPerUnitCents * n,
    rentPerSqFtCents: Math.round(rent / sqft),
    annualRentCents: rent * 12 * n,
    grossYieldPct: basisPerUnitCents > 0 ? Math.round(((rent * 12) / basisPerUnitCents) * 10000) / 100 : null,
  };
}

/** Several designs for one lot, best gross yield first. */
export function compareBuildToRent(options = []) {
  return options
    .map((o) => ({ name: o.name, ...buildToRent(o) }))
    .sort((a, b) => (b.grossYieldPct ?? -1) - (a.grossYieldPct ?? -1));
}

export const CAPITAL_KINDS = [
  { key: 'loan', label: 'Loan', plain: 'The construction or permanent loan; its rate is interest a year' },
  { key: 'investor', label: 'Investor', plain: 'An investor\'s equity; its rate is the preferred return a year, its share their part of what is left' },
  { key: 'sponsor', label: 'Sponsor', plain: 'Our own equity in the deal' },
];

/**
 * The deal as investors see it once the building is leased: who put in what,
 * what the net operating income leaves after the loan, cash-on-cash, the
 * investors' preferred return, and what each investor's share of the rest is.
 * Interest-only on the loan, stated, so the arithmetic can be checked by hand.
 * capital: [{ kind, name, amountCents, rateBp, shareBp }]
 */
export function dealReturns({ capital = [], noiCents, asBuiltCents } = {}) {
  const missing = [];
  if (!isCents(noiCents)) missing.push('the net operating income once leased');
  const bad = capital.filter((c) => !isCents(c.amountCents));
  if (bad.length) missing.push(`the amount for ${bad.map((c) => c.name || c.kind).join(', ')}`);
  if (!capital.length) missing.push('who is funding the deal');
  if (missing.length) return { complete: false, missing };

  const amt = (c) => cents(c.amountCents);
  const loans = capital.filter((c) => c.kind === 'loan');
  const investors = capital.filter((c) => c.kind === 'investor');
  const sponsors = capital.filter((c) => c.kind === 'sponsor');
  const loanCents = sum(loans.map(amt));
  const debtServiceCents = sum(loans.map((c) => Math.round(amt(c) * (Number(c.rateBp) || 0) / 10000)));
  const equityCents = sum([...investors, ...sponsors].map(amt));
  const cashFlowCents = cents(noiCents) - debtServiceCents;
  const prefOwedCents = sum(investors.map((c) => Math.round(amt(c) * (Number(c.rateBp) || 0) / 10000)));
  const afterPrefCents = Math.max(0, cashFlowCents - prefOwedCents);
  const prefPaidCents = Math.min(Math.max(0, cashFlowCents), prefOwedCents);
  return {
    complete: true,
    missing,
    totalCapitalCents: loanCents + equityCents,
    loanCents,
    equityCents,
    loanToValuePct: isCents(asBuiltCents) && cents(asBuiltCents) > 0 ? Math.round((loanCents / cents(asBuiltCents)) * 1000) / 10 : null,
    debtServiceCents,
    dscr: debtServiceCents > 0 ? Math.round((cents(noiCents) / debtServiceCents) * 100) / 100 : null,
    cashFlowCents,
    cashOnCashPct: equityCents > 0 ? Math.round((cashFlowCents / equityCents) * 1000) / 10 : null,
    prefOwedCents,
    prefCovered: cashFlowCents >= prefOwedCents,
    prefShortCents: Math.max(0, prefOwedCents - Math.max(0, cashFlowCents)),
    perInvestor: investors.map((c) => {
      const pref = Math.round(amt(c) * (Number(c.rateBp) || 0) / 10000);
      const paid = prefOwedCents > 0 ? Math.round(prefPaidCents * (pref / prefOwedCents)) : 0;
      const share = Math.round(afterPrefCents * (Number(c.shareBp) || 0) / 10000);
      return { name: c.name, amountCents: amt(c), prefCents: pref, prefPaidCents: paid, shareCents: share, totalCents: paid + share };
    }),
    // What the equity is worth at the as-built value, over what it put in.
    equityMultiple: isCents(asBuiltCents) && equityCents > 0 ? Math.round(((cents(asBuiltCents) - loanCents) / equityCents) * 100) / 100 : null,
  };
}

/** Months from one date to another, for the schedule. */
export function monthsBetween(start, end) {
  const a = new Date(`${String(start).slice(0, 10)}T00:00:00Z`);
  const b = new Date(`${String(end).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
}

// =============================================================================
// WHERE THE BUDGET STANDS (Rehab Valuator, Brandon Lindsay's walk-through).
// "Once you upload a transaction, it automatically links to a line item that
// you've already added to your budget", and the tracking sheet shows each
// line's budget, its budget a square foot, what was actually spent, and the
// variance. Two uses he names: pricing a pre-sale before the last dollar is
// spent (the forecast), and carrying a finished line's real cost a square
// foot into the next build ("framing material has cost me about $25 per
// square foot").
//
// A line marked done is final at what it cost. A line still open is forecast
// at its budget, or at what it has already cost if that is more: money spent
// is never forecast back down. An open line with no budget is unknown and
// named; the forecast says it is incomplete rather than counting it as zero.
// =============================================================================
const perFoot = (c, sqFt) => (Number(sqFt) > 0 ? Math.round(c / Number(sqFt)) : null);

export function trackBudget({ lines = [], grossSqFt = null } = {}) {
  const rows = lines.map((l) => {
    const budget = isCents(l.budgetCents) ? cents(l.budgetCents) : null;
    const actual = isCents(l.actualCents) ? cents(l.actualCents) : null;
    const done = Boolean(l.done);
    let forecast = null;
    if (done) forecast = actual ?? budget;
    else if (budget !== null) forecast = Math.max(budget, actual ?? 0);
    else if (actual !== null) forecast = actual;
    const variance = budget !== null && forecast !== null ? budget - forecast : null;
    return {
      id: l.id, label: l.label, kind: l.kind, group: l.group || null, done,
      budgetCents: budget, actualCents: actual, forecastCents: forecast,
      budgetPerSqFtCents: budget !== null ? perFoot(budget, grossSqFt) : null,
      actualPerSqFtCents: done && actual !== null ? perFoot(actual, grossSqFt) : null,
      varianceCents: variance,
      status: forecast === null ? 'unknown'
        : variance === null ? 'unbudgeted'
          : variance < 0 ? (done ? 'over' : 'running-over')
            : variance > 0 && done ? 'under'
              : done ? 'on' : 'open',
    };
  });
  const unknown = rows.filter((r) => r.status === 'unknown');
  const budgetCents = sum(rows.map((r) => r.budgetCents ?? 0));
  const forecastCents = sum(rows.map((r) => r.forecastCents ?? 0));
  return {
    rows,
    budgetCents,
    spentCents: sum(rows.map((r) => r.actualCents ?? 0)),
    forecastCents,
    forecastVarianceCents: budgetCents - forecastCents,
    forecastComplete: unknown.length === 0,
    unknown: unknown.map((r) => r.label),
    doneCount: rows.filter((r) => r.done).length,
    // The real cost a square foot of each finished line, for the next budget.
    unitCosts: rows.filter((r) => r.done && r.actualPerSqFtCents !== null)
      .map((r) => ({ label: r.label, perSqFtCents: r.actualPerSqFtCents })),
  };
}

// =============================================================================
// BUY, REHAB, RENT, REFINANCE, REPEAT (Daniil Kleyman, "how to analyze your
// BRRRR deals"). The short-term lender funds the purchase and the work; the
// tenant is in when the work ends; a local bank refinances on the NEW value;
// the refinance pays the short-term lender back, and the same money goes into
// the next deal. His worked deal is the test fixture: $50,000 purchase, $1,500
// closing, $20,000 rehab, $1,000 holding, 100% financed at 8% deferred for
// three months, a $100,000 appraisal, $1,000 rent at 8% vacancy, insurance
// $600 a year, taxes $1,200 a year, repairs $100 a month, refinanced at 80%,
// 5.5%, 20-year amortization and two points.
//
// His rules, each a named check:
//   * all-in cost below 80% of the after-repair value;
//   * debt coverage 1.3 or better ("local banks will look for at least 1.25
//     to 1.3");
//   * cash flow of at least $200 a month ("anywhere below $200 I wouldn't do
//     this deal");
//   * rent of at least 1.5% of the all-in cost a month ("rent to cost
//     multiples of one and a half times");
//   * money left in the deal earning at least 10% cash on cash.
// And the stress test he insists on: a lender models a management fee and
// vacancy even when you manage it yourself, so `stressed` re-runs the deal
// with 8% management (unless one was given) and at least 8% vacancy. The bank
// sizes the loan by coverage, not by appraisal alone: `loanAtDcrCents` is the
// largest loan this income carries at 1.3.
// =============================================================================
export const BRRRR_RULES = Object.freeze({ maxCostPctOfArv: 80, minDcr: 1.3, minCashFlowCents: 20000, minRentToCostPct: 1.5, minCashOnCashPct: 10 });

const payment = (loan, ratePct, years) => {
  const n = Math.round(Number(years) * 12);
  const r = Number(ratePct) / 100 / 12;
  if (!(loan > 0) || !(n > 0)) return 0;
  return r === 0 ? loan / n : (loan * r) / (1 - (1 + r) ** -n);
};
const loanFor = (pay, ratePct, years) => {
  const n = Math.round(Number(years) * 12);
  const r = Number(ratePct) / 100 / 12;
  if (!(pay > 0) || !(n > 0)) return 0;
  return r === 0 ? pay * n : (pay * (1 - (1 + r) ** -n)) / r;
};
const r2 = (x) => Math.round(x * 100) / 100;

export function brrrr(input = {}) {
  const need = ['purchaseCents', 'rehabCents', 'arvCents', 'rentMonthlyCents', 'refiLtvPct', 'refiRatePct', 'amortYears'];
  const missing = need.filter((k) => !isCents(input[k]));
  if (missing.length) return { complete: false, missing };
  const n = (k, d = 0) => (isCents(input[k]) ? Number(input[k]) : d);
  const run = (mgmtPct, vacancyPct) => {
    const base = n('purchaseCents') + n('closingCents') + n('rehabCents') + n('holdingCents');
    const financed = base * (n('shortFinancedPct', 100) / 100);
    const points = financed * (n('shortPointsPct') / 100);
    const interest = financed * (n('shortRatePct') / 100 / 12) * n('shortMonths');
    const costBasis = base + points + interest;
    const egi = n('rentMonthlyCents') * (1 - vacancyPct / 100);
    const expenses = egi * (mgmtPct / 100) + n('insuranceYearCents') / 12 + n('taxesYearCents') / 12
      + n('repairsMonthlyCents') + n('otherMonthlyCents');
    const noi = egi - expenses;
    const loan = n('arvCents') * (n('refiLtvPct') / 100);
    const pay = payment(loan, n('refiRatePct'), n('amortYears'));
    const proceeds = loan * (1 - n('refiCostPct') / 100);
    const cashOut = proceeds - costBasis;
    const left = Math.max(0, -cashOut);
    const cashFlow = noi - pay;
    return {
      costBasisCents: Math.round(costBasis),
      interestCents: Math.round(interest),
      cashToCloseCents: Math.round(base - financed + points),
      noiMonthlyCents: Math.round(noi),
      loanCents: Math.round(loan),
      paymentCents: Math.round(pay),
      proceedsCents: Math.round(proceeds),
      cashOutCents: Math.round(cashOut),
      leftInDealCents: Math.round(left),
      cashFlowMonthlyCents: Math.round(cashFlow),
      dcr: pay > 0 ? r2(noi / pay) : null,
      equityCents: Math.round(n('arvCents') - loan),
      costPctOfArv: r2((costBasis / n('arvCents')) * 100),
      capOnCostPct: r2(((noi * 12) / costBasis) * 100),
      capOnArvPct: r2(((noi * 12) / n('arvCents')) * 100),
      rentToCostPct: r2((n('rentMonthlyCents') / costBasis) * 100),
      cashOnCashPct: left > 0 ? r2(((cashFlow * 12) / left) * 100) : null,
      loanAtDcrCents: Math.round(loanFor(noi / BRRRR_RULES.minDcr, n('refiRatePct'), n('amortYears'))),
    };
  };
  const at = run(n('managementPct'), n('vacancyPct'));
  const R = BRRRR_RULES;
  const checks = [
    { key: 'cost', ok: at.costPctOfArv < R.maxCostPctOfArv, says: `All-in cost is ${at.costPctOfArv}% of the after-repair value (below ${R.maxCostPctOfArv}%).` },
    { key: 'dcr', ok: at.dcr !== null && at.dcr >= R.minDcr, says: `Debt coverage ${at.dcr} (the bank looks for ${R.minDcr}).` },
    { key: 'cashflow', ok: at.cashFlowMonthlyCents >= R.minCashFlowCents, says: `Cash flow ${at.cashFlowMonthlyCents / 100} a month (at least ${R.minCashFlowCents / 100}).` },
    { key: 'rent', ok: at.rentToCostPct >= R.minRentToCostPct, says: `Rent is ${at.rentToCostPct}% of the all-in cost a month (at least ${R.minRentToCostPct}%).` },
    { key: 'left', ok: at.leftInDealCents === 0 || (at.cashOnCashPct !== null && at.cashOnCashPct >= R.minCashOnCashPct), says: at.leftInDealCents === 0 ? 'Every dollar comes back out at the refinance.' : `Money left in the deal earns ${at.cashOnCashPct}% cash on cash (at least ${R.minCashOnCashPct}%).` },
  ];
  return {
    complete: true,
    ...at,
    checks,
    works: checks.every((c) => c.ok),
    stressed: run(n('managementPct') > 0 ? n('managementPct') : 8, Math.max(n('vacancyPct'), 8)),
  };
}

// =============================================================================
// THE LAND, THE BANK AND THE CASH (Kleyman: "build a duplex with zero cash
// tied up", video HCa1XR4ev5M, and the build-to-rent duplex, 9zjeGb74TmU).
//
// Three of his tools, each pure arithmetic:
//
// 1. SPLIT THE LOT, SELL ENOUGH TO GET YOUR MONEY BACK, KEEP THE REST FREE.
//    His case: $220,000 for land he upzoned into three lots, $3,000 to close,
//    about $12,000 of surveying, application, land-use attorney and
//    architect (the captions hear "$112,000"; the arithmetic he gives —
//    "recouping roughly 10,000 of that" and "only $5,000 out of pocket" —
//    is $12,000), two lots sold at $115,000: he owns the third for $5,000.
// 2. THE MOST THE BANK WILL LEND IS THE LOWEST OF THREE: a share of the
//    finished value, a share of the cost, and the loan the rent carries at
//    the bank's debt coverage. "When rates were low debt coverage was not the
//    limiting constraint ... watch what happens here." Land you own free
//    comes in at full market value as your equity: "it doesn't matter what
//    you pay for the land, what matters is what is the land worth."
// 3. THE MOST YOU CAN PAY FOR LAND is the finished value, less the equity you
//    mean to create, less the build and the soft costs.
// =============================================================================
export function lotSplit({ purchaseCents, closingCents = 0, softCostsCents = 0, lotValueCents, lotsSold, lotsKept = 1 } = {}) {
  const need = { purchaseCents, lotValueCents, lotsSold };
  const missing = Object.keys(need).filter((k) => !isCents(need[k]));
  if (missing.length) return { complete: false, missing };
  const inCents = cents(purchaseCents) + (isCents(closingCents) ? cents(closingCents) : 0) + (isCents(softCostsCents) ? cents(softCostsCents) : 0);
  const soldCents = cents(lotValueCents) * Number(lotsSold);
  const out = inCents - soldCents;
  return {
    complete: true,
    putInCents: inCents,
    soldCents,
    outOfPocketCents: Math.max(0, out),
    surplusCents: Math.max(0, -out),
    keptValueCents: cents(lotValueCents) * Number(lotsKept),
    // What the kept lots stand you in: what is still out of pocket.
    keptBasisCents: Math.max(0, out),
  };
}

export function leverage({
  asBuiltCents, totalCostCents, noiMonthlyCents, ratePct, amortYears,
  maxLtvPct = 80, maxLtcPct = 85, minDcr = 1.25, landEquityCents = 0, requestedLoanCents = null,
} = {}) {
  const need = { asBuiltCents, totalCostCents, noiMonthlyCents, ratePct, amortYears };
  const missing = Object.keys(need).filter((k) => !isCents(need[k]));
  if (missing.length) return { complete: false, missing };
  const byValue = Math.round(Number(asBuiltCents) * (Number(maxLtvPct) / 100));
  const byCost = Math.round(Number(totalCostCents) * (Number(maxLtcPct) / 100));
  const maxPayment = Number(noiMonthlyCents) / Number(minDcr);
  const byCoverage = Math.round(loanFor(maxPayment, ratePct, amortYears));
  const maxLoan = Math.min(byValue, byCost, byCoverage);
  const binding = maxLoan === byCoverage ? 'coverage' : maxLoan === byValue ? 'value' : 'cost';
  const equity = isCents(landEquityCents) ? cents(landEquityCents) : 0;
  const pay = payment(maxLoan, ratePct, amortYears);
  const cash = Math.max(0, cents(totalCostCents) - maxLoan - equity);
  const cashFlow = Number(noiMonthlyCents) - pay;
  const req = isCents(requestedLoanCents) ? cents(requestedLoanCents) : null;
  const reqPay = req !== null ? payment(req, ratePct, amortYears) : null;
  return {
    complete: true,
    byValueCents: byValue,
    byCostCents: byCost,
    byCoverageCents: byCoverage,
    maxPaymentCents: Math.round(maxPayment),
    maxLoanCents: maxLoan,
    binding,
    paymentCents: Math.round(pay),
    cashNeededCents: cash,
    cashFlowMonthlyCents: Math.round(cashFlow),
    cashOnCashPct: cash > 0 ? r2(((cashFlow * 12) / cash) * 100) : null,
    // The loan you asked for, measured the bank's three ways.
    requested: req === null ? null : {
      loanCents: req,
      ltvPct: r2((req / Number(asBuiltCents)) * 100),
      ltcPct: r2((req / Number(totalCostCents)) * 100),
      dcr: reqPay > 0 ? r2(Number(noiMonthlyCents) / reqPay) : null,
      fits: req <= maxLoan,
    },
  };
}

export function maxLandPrice({ asBuiltCents, sweatEquityPct, buildCents, softCents = 0 } = {}) {
  const need = { asBuiltCents, sweatEquityPct, buildCents };
  const missing = Object.keys(need).filter((k) => !isCents(need[k]));
  if (missing.length) return { complete: false, missing };
  const equity = Math.round(Number(asBuiltCents) * (Number(sweatEquityPct) / 100));
  return {
    complete: true,
    sweatEquityCents: equity,
    maxLandCents: cents(asBuiltCents) - equity - cents(buildCents) - (isCents(softCents) ? cents(softCents) : 0),
  };
}
