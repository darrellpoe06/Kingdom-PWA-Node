// =============================================================================
// number-trace.js — pure trace builders for the "traceable number" feature
// =============================================================================
// Darrell 2026-06-16: "click on the number in the budget and have it be a link
// to the sources so users like myself can see the underlying numbers and
// sources." Every displayed budget figure should be tappable and reveal:
//   (a) the input values that feed it,
//   (b) the math/derivation in plain terms (the formula),
//   (c) the source rows/records it traces to (real transactions/accounts).
//
// These builders are PURE functions of the same `data` / `totals` / `reserves`
// objects the MVP already computes, so the trace can never drift from the
// displayed figure (DR-0076: measure from the real artifact, don't re-derive).
// They return plain data; the <TraceableNumber> component formats + renders it.
// Kept React-free so they unit-test directly (per the financial-calcs pattern).
//
// Trace shape:
//   {
//     title:   string,                       // what the number is
//     formula: string,                       // plain-terms derivation
//     result:  { value, kind },              // the computed figure
//     inputs:  [{ label, value, kind, op }], // the values that feed it
//     sources: [{ label, value, kind, op, meta }], // the real records
//     note?:   string,                       // optional caveat
//   }
// `kind` ∈ 'money' | 'percent' | 'count' | 'years' | 'date' | 'text'
// `op`   ∈ '+' | '−' | '×' | '÷' | undefined  (how the row combines)
// =============================================================================

const CASH_TYPES = ['checking', 'savings', 'cash', 'investment'];

// Income-producing rentals only — matches the MVP `totals` filter exactly.
const incomeRentals = (data) =>
  (data.inflows?.rentals || []).filter((r) => (r.rent || 0) > 0);

// Human label for an outflow category key.
const OUTFLOW_LABELS = {
  rentalMortgages: 'Rental mortgages',
  propertyUtilities: 'Property utilities',
  household: 'Household / living',
  debtService: 'Debt service',
  charitableGiving: 'Charitable giving / tithe',
};
const outflowLabel = (key) =>
  OUTFLOW_LABELS[key] ||
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

// -----------------------------------------------------------------------------
// Total inflow — every paycheck + every rent payment actually received.
// -----------------------------------------------------------------------------
export function traceTotalInflow(data, totals) {
  const salarySources = (data.inflows?.salaries || []).map((s) => ({
    label: `${s.who ? s.who + ' — ' : ''}${s.source || 'Salary'}`,
    value: s.actual || 0,
    kind: 'money',
    op: '+',
    meta: 'Pay actually received',
  }));
  const rentalSources = incomeRentals(data).map((r) => ({
    label: r.name || r.address || 'Rental',
    value: r.actual || 0,
    kind: 'money',
    op: '+',
    meta: 'Rent actually received',
  }));
  return {
    title: 'Total inflow',
    formula: 'Every paycheck plus every rent payment actually received this month, added together.',
    result: { value: totals.totalInflow, kind: 'money' },
    inputs: [
      { label: 'Salaries received', value: totals.salaryActual, kind: 'money', op: '+' },
      { label: 'Rental income received', value: totals.rentalActual, kind: 'money', op: '+' },
    ],
    sources: [...salarySources, ...rentalSources],
  };
}

// -----------------------------------------------------------------------------
// Total outflow — all monthly spending categories.
// -----------------------------------------------------------------------------
export function traceTotalOutflow(data, totals) {
  const sources = Object.entries(data.outflows || {}).map(([key, value]) => ({
    label: outflowLabel(key),
    value: value || 0,
    kind: 'money',
    op: '+',
  }));
  return {
    title: 'Total outflow',
    formula: 'All of your monthly spending categories added together.',
    result: { value: totals.totalOutflow, kind: 'money' },
    inputs: sources.map((s) => ({ ...s })),
    sources,
  };
}

// -----------------------------------------------------------------------------
// Net cash flow — money in minus money out.
// -----------------------------------------------------------------------------
export function traceNetCashFlow(data, totals) {
  const outflowSources = Object.entries(data.outflows || {}).map(([key, value]) => ({
    label: outflowLabel(key),
    value: value || 0,
    kind: 'money',
    op: '−',
  }));
  return {
    title: 'Net cash flow',
    formula: 'Money in (total inflow) minus money out (total outflow), per month. Positive means you keep money each month; negative means you spend more than you bring in.',
    result: { value: totals.netCashFlow, kind: 'money' },
    inputs: [
      { label: 'Total inflow', value: totals.totalInflow, kind: 'money', op: '+' },
      { label: 'Total outflow', value: totals.totalOutflow, kind: 'money', op: '−' },
    ],
    sources: [
      { label: 'Salaries received', value: totals.salaryActual, kind: 'money', op: '+' },
      { label: 'Rental income received', value: totals.rentalActual, kind: 'money', op: '+' },
      ...outflowSources,
    ],
  };
}

// -----------------------------------------------------------------------------
// Cash on hand — spendable balances, excluding legal-hold accounts.
// -----------------------------------------------------------------------------
export function traceCashOnHand(data, totals) {
  const sources = (data.accounts || [])
    .filter((a) => CASH_TYPES.includes(a.type) && !a.inLegal)
    .map((a) => ({
      label: a.name || a.type,
      value: a.balance || 0,
      kind: 'money',
      op: '+',
      meta: a.type,
    }));
  return {
    title: 'Cash on hand',
    formula: 'Your spendable balances — checking, savings, cash, and investment accounts — added together. Credit cards and loans are debts, not cash, so they are left out. Accounts under a legal hold are excluded too (they show in the Legal tab).',
    result: { value: totals.allAccountsCash, kind: 'money' },
    inputs: [{ label: `${sources.length} spendable account${sources.length === 1 ? '' : 's'}`, value: sources.length, kind: 'count' }],
    sources,
  };
}

// -----------------------------------------------------------------------------
// Total consumer debt — balances on every debt not marked "leave alone."
// -----------------------------------------------------------------------------
export function traceConsumerDebt(data, totals) {
  const sources = (data.debts || [])
    .filter((d) => !d.leaveAlone)
    .map((d) => ({
      label: d.name || 'Debt',
      value: d.balance || 0,
      kind: 'money',
      op: '+',
      meta: d.rate != null ? `${d.rate}% APR` : undefined,
    }));
  return {
    title: 'Total consumer debt',
    formula: 'The current balance on every consumer debt added together. Debts you have marked "leave alone" are not counted.',
    result: { value: totals.totalConsumerDebt, kind: 'money' },
    inputs: [{ label: `${sources.length} debt${sources.length === 1 ? '' : 's'} in the attack plan`, value: sources.length, kind: 'count' }],
    sources,
  };
}

// -----------------------------------------------------------------------------
// Rent collection rate — rent received / rent expected.
// -----------------------------------------------------------------------------
export function traceCollectionRate(data, totals) {
  const sources = incomeRentals(data).map((r) => ({
    label: r.name || r.address || 'Rental',
    value: r.actual || 0,
    kind: 'money',
    meta: `${r.actual || 0} of ${r.rent || 0} expected`,
  }));
  return {
    title: 'Rent collection rate',
    formula: 'Rent actually received divided by rent expected, across all income-producing rentals, shown as a percentage. 100% means every tenant paid in full.',
    result: { value: totals.collectionRate, kind: 'percent' },
    inputs: [
      { label: 'Rent received', value: totals.rentalActual, kind: 'money', op: '÷' },
      { label: 'Rent expected', value: totals.rentalExpected, kind: 'money', op: '×' },
    ],
    sources,
  };
}

// -----------------------------------------------------------------------------
// Reserves set-aside — monthly money parked for non-monthly + tax obligations.
// -----------------------------------------------------------------------------
export function traceReserves(data, reserves) {
  const recurringSources = (data.recurringObligations || [])
    .filter((r) => r.enabled && r.frequency !== 'monthly')
    .map((r) => ({
      label: r.name || 'Obligation',
      value: r.amount || 0,
      kind: 'money',
      op: '+',
      meta: r.frequency,
    }));
  const taxSources = (data.taxCalendar || [])
    .filter((t) => t.applies && t.amount)
    .map((t) => ({
      label: t.name || 'Tax item',
      value: t.amount || 0,
      kind: 'money',
      op: '+',
      meta: 'annual',
    }));
  return {
    title: 'Reserves set-aside',
    formula: 'Money set aside each month for bills that are not monthly: non-monthly recurring obligations spread across the year, plus annual taxes divided by 12. Incidents are recorded but are not a perpetual monthly drain.',
    result: { value: reserves.totalMonthly, kind: 'money' },
    inputs: [
      { label: 'Recurring (non-monthly), per month', value: reserves.recurringMonthly, kind: 'money', op: '+' },
      { label: 'Annual taxes ÷ 12', value: reserves.taxMonthly, kind: 'money', op: '+' },
    ],
    sources: [...recurringSources, ...taxSources],
    note: 'Source rows show the full (non-monthly) amount; the inputs above show them normalized to a monthly set-aside.',
  };
}

// -----------------------------------------------------------------------------
// Money toward debt — the discretionary dollars the pressure lever frees up.
// -----------------------------------------------------------------------------
export function traceToDebt(data, totals, pressureCalc) {
  return {
    title: 'Money toward debt, per month',
    formula: 'At the current pressure setting, the extra money directed at debt each month: net cash flow, plus the share of late rent you expect to recover, plus the share of flexible (household) spending you redirect, minus the reserves you set aside. The result is never below zero, and the tithe is never cut.',
    result: { value: pressureCalc.extraAvailable, kind: 'money' },
    inputs: [
      { label: 'Net cash flow', value: pressureCalc.netCashFlow != null ? pressureCalc.netCashFlow : totals.netCashFlow, kind: 'money', op: '+' },
      { label: `Late rent recovered (${pressureCalc.rentGapClosure || 0}% of the gap)`, value: pressureCalc.rentCapture, kind: 'money', op: '+' },
      { label: `Flexible spend redirected (${pressureCalc.discretionaryCut || 0}% of household)`, value: pressureCalc.discretionaryGain, kind: 'money', op: '+' },
      { label: 'Reserves set aside', value: pressureCalc.reservesDeducted, kind: 'money', op: '−' },
    ].filter((i) => i.value != null),
    sources: [
      { label: 'Household / flexible spend (base for the cut)', value: pressureCalc.discretionaryBase != null ? pressureCalc.discretionaryBase : (data.outflows?.household || 0), kind: 'money' },
      { label: 'Pressure setting', value: pressureCalc.stress || '', kind: 'text' },
    ],
    note: 'Higher pressure redirects more late rent and flexible spend toward debt, paying it off faster.',
  };
}

// -----------------------------------------------------------------------------
// Consumer-debt-free projection — the payoff date / years / interest.
// Derivation is an amortization simulation, so the trace explains the drivers
// and lists the debt rows being paid down rather than re-running the loop.
// -----------------------------------------------------------------------------
export function traceDebtFree(data, totals, projection, pressureCalc, kind = 'date') {
  const sources = (data.debts || [])
    .filter((d) => !d.leaveAlone)
    .map((d) => ({
      label: d.name || 'Debt',
      value: d.balance || 0,
      kind: 'money',
      meta: d.rate != null ? `${d.rate}% APR · min ${d.minPayment || 0}/mo` : undefined,
    }));
  const result =
    kind === 'years'
      ? { value: projection.debtFreeYears, kind: 'years' }
      : kind === 'interest'
        ? { value: projection.totalInterestPaid, kind: 'money' }
        : { value: projection.debtFreeDate, kind: 'date' };
  return {
    title:
      kind === 'years' ? 'Years to debt-free'
        : kind === 'interest' ? 'Total interest paid'
          : 'Consumer-debt-free date',
    formula: 'A month-by-month simulation: each month, every debt is charged interest at its rate, minimum payments are made, and all the extra money toward debt is thrown at the highest-priority balance until everything is paid off. The date is when the last consumer debt hits zero.',
    result,
    inputs: [
      { label: 'Total consumer debt', value: totals.totalConsumerDebt, kind: 'money' },
      { label: 'Extra toward debt, per month', value: pressureCalc.extraAvailable, kind: 'money' },
      { label: 'Debts in the plan', value: sources.length, kind: 'count' },
    ],
    sources,
    note: 'Move the Pressure slider to send more toward debt and pull this date in.',
  };
}

// -----------------------------------------------------------------------------
// Rentals-owned-free projection — snowball payoff of rental mortgages.
// -----------------------------------------------------------------------------
export function traceRentalsFree(data, rentalSnowball, snowballExtra, kind = 'date') {
  const sources = incomeRentals(data)
    .filter((r) => r.mortgage && (r.mortgage.balance || 0) > 0)
    .map((r) => ({
      label: r.name || r.address || 'Rental',
      value: r.mortgage.balance || 0,
      kind: 'money',
      meta: `${r.mortgage.rate || 0}% · P&I ${r.mortgage.monthlyPI || 0}/mo`,
    }));
  const result =
    kind === 'years'
      ? { value: rentalSnowball.allClearedYears, kind: 'years' }
      : { value: rentalSnowball.allClearedDate, kind: 'date' };
  return {
    title: kind === 'years' ? 'Years to own rentals free' : 'Rentals-owned-free date',
    formula: 'A snowball simulation across the rental mortgages: each property keeps paying its normal mortgage, and the extra you commit is stacked onto one mortgage at a time until it is paid off — then that freed-up payment rolls onto the next. The date is when the last rental mortgage hits zero.',
    result,
    inputs: [
      { label: 'Rental mortgages in the snowball', value: sources.length, kind: 'count' },
      { label: 'Extra toward mortgages, per month', value: snowballExtra || 0, kind: 'money' },
      { label: 'Total rental mortgage debt', value: sources.reduce((s, r) => s + r.value, 0), kind: 'money' },
    ],
    sources,
  };
}
