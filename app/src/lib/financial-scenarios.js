// =============================================================================
// financial-scenarios.js — "financial engineering": what-if scenario modeling
// =============================================================================
// Scenario modeling is the engineering half of the forecast: take the base
// projection (real data) and model a DIFFERENT future by stating explicit,
// editable assumptions — best/base/worst, add a rental door, add a subscription
// tier, make a capital purchase (the sanctuary LED wall), pay debt down faster —
// then compare the resulting futures side by side.
//
// BINDING (CLAUDE.md constraints): this is a MODELING tool on the owner's own
// data. Assumptions are explicit and editable; nothing here is investment advice
// and nothing moves money. A scenario is a set of deltas applied to the base
// inputs of buildProjection — never a hidden recalculation.
//
// Pure module (no React). Tested in financial-scenarios.test.js.
// =============================================================================

import { buildProjection, freqToMonths } from './financial-engineering.js';

// Base/best/worst presets express the macro assumption as income/expense
// multipliers applied to the steady monthly flows. Numbers are deliberately
// modest and STATED — the user sees and can edit them. They are not forecasts of
// the economy; they are stress bands the owner chooses to plan against.
export const SCENARIO_PRESETS = [
  {
    id: 'base',
    name: 'Base',
    summary: 'Today’s real numbers, carried forward unchanged.',
    incomeMultiplier: 1,
    expenseMultiplier: 1,
  },
  {
    id: 'best',
    name: 'Best case',
    summary: 'Income runs +15%, expenses run −5% (strong collections, lean spend).',
    incomeMultiplier: 1.15,
    expenseMultiplier: 0.95,
  },
  {
    id: 'worst',
    name: 'Worst case',
    summary: 'Income runs −15%, expenses run +10% (soft collections, cost creep).',
    incomeMultiplier: 0.85,
    expenseMultiplier: 1.10,
  },
];

// A scenario adjustment shape (all fields optional):
//   incomeMultiplier, expenseMultiplier  — scale the steady monthly flows
//   monthlyIncomeDelta, monthlyExpenseDelta — add/remove fixed monthly $ (a new
//                                             subscription tier, a new hire)
//   capitalPurchases: [{ label, amount, monthOffset }] — one-time outflow
//   recurringAdds: [{ label, amount, monthOffset, frequency?, kind }] — a dated
//                  income or expense lump (kind 'income' | 'expense'), optionally
//                  recurring across the horizon by `frequency`
export function emptyScenario(overrides = {}) {
  return {
    id: overrides.id || 'custom',
    name: overrides.name || 'Custom scenario',
    summary: overrides.summary || '',
    incomeMultiplier: overrides.incomeMultiplier ?? 1,
    expenseMultiplier: overrides.expenseMultiplier ?? 1,
    monthlyIncomeDelta: overrides.monthlyIncomeDelta ?? 0,
    monthlyExpenseDelta: overrides.monthlyExpenseDelta ?? 0,
    capitalPurchases: overrides.capitalPurchases || [],
    recurringAdds: overrides.recurringAdds || [],
  };
}

// Expand recurringAdds + capitalPurchases into the signed lump events the
// projector consumes. Income is positive, expense/capital is negative. A
// recurringAdd with a frequency repeats across the horizon on its cadence.
export function scenarioLumpEvents(scenario, months) {
  const events = [];
  for (const cap of scenario.capitalPurchases || []) {
    const m = Number(cap.monthOffset) || 1;
    if (m < 1 || m > months) continue;
    events.push({ monthOffset: m, amount: -Math.abs(Number(cap.amount) || 0), label: cap.label || 'Capital purchase', kind: 'capital' });
  }
  for (const add of scenario.recurringAdds || []) {
    const sign = add.kind === 'expense' ? -1 : 1;
    const amt = sign * Math.abs(Number(add.amount) || 0);
    const start = Number(add.monthOffset) || 1;
    const step = add.frequency ? freqToMonths(add.frequency) : 0;
    if (step > 0) {
      for (let m = start; m <= months; m += step) {
        if (m >= 1) events.push({ monthOffset: m, amount: amt, label: add.label || 'Recurring', kind: add.kind || 'income' });
      }
    } else if (start >= 1 && start <= months) {
      events.push({ monthOffset: start, amount: amt, label: add.label || 'One-time', kind: add.kind || 'income' });
    }
  }
  return events;
}

// Run ONE scenario against the real data. Computes the multiplier-adjusted
// steady flows as explicit extra deltas on top of the base, plus the scenario's
// own lump events, then projects. Returns the projection annotated with the
// scenario so the UI can render comparisons.
export function runScenario(data, scenario, opts = {}) {
  const { currentDate = new Date(), months = 12, scope = 'consolidated' } = opts;
  // Derive the unscaled base inputs first so multipliers act on real flows.
  const base = buildProjection(data, { currentDate, months, scope });
  const baseIn = base.inputs.baseMonthlyInflow;
  const baseOut = base.inputs.baseMonthlyOutflow;

  const incomeMult = scenario.incomeMultiplier ?? 1;
  const expenseMult = scenario.expenseMultiplier ?? 1;
  const extraMonthlyIncome = (baseIn * (incomeMult - 1)) + (Number(scenario.monthlyIncomeDelta) || 0);
  const extraMonthlyExpense = (baseOut * (expenseMult - 1)) + (Number(scenario.monthlyExpenseDelta) || 0);

  const projection = buildProjection(data, {
    currentDate,
    months,
    scope,
    extraMonthlyIncome,
    extraMonthlyExpense,
    capitalEvents: scenarioLumpEvents(scenario, months),
  });

  return {
    scenario: {
      id: scenario.id,
      name: scenario.name,
      summary: scenario.summary || '',
      incomeMultiplier: incomeMult,
      expenseMultiplier: expenseMult,
      monthlyIncomeDelta: Number(scenario.monthlyIncomeDelta) || 0,
      monthlyExpenseDelta: Number(scenario.monthlyExpenseDelta) || 0,
      capitalPurchases: scenario.capitalPurchases || [],
      recurringAdds: scenario.recurringAdds || [],
    },
    projection,
    endingCash: projection.endingCash,
    runwayMonths: projection.runwayMonths,
    lowest: projection.lowest,
    netMonthly: projection.netMonthly,
  };
}

// Compare a set of scenarios at once. Always evaluates Base first so deltas read
// against it. Returns one row per scenario plus the spread (best vs worst ending
// cash) for the headline "the future ranges from X to Y" clarity line.
export function compareScenarios(data, scenarios, opts = {}) {
  const list = (scenarios && scenarios.length ? scenarios : SCENARIO_PRESETS);
  const results = list.map((s) => runScenario(data, s, opts));
  const endings = results.map((r) => r.endingCash);
  const high = results.length ? results.reduce((a, b) => (b.endingCash > a.endingCash ? b : a)) : null;
  const low = results.length ? results.reduce((a, b) => (b.endingCash < a.endingCash ? b : a)) : null;
  return {
    results,
    spread: endings.length ? Math.round((Math.max(...endings) - Math.min(...endings)) * 100) / 100 : 0,
    best: high ? { id: high.scenario.id, name: high.scenario.name, endingCash: high.endingCash } : null,
    worst: low ? { id: low.scenario.id, name: low.scenario.name, endingCash: low.endingCash } : null,
  };
}

// Convenience builders for the three named "engineering" moves the brief calls
// out, so the UI can offer them one-tap and the user then edits the assumptions.
export function scenarioAddProperty({ name = 'New rental door', rent = 1400, mortgagePI = 700, escrow = 220, downPayment = 0, startMonth = 1 } = {}) {
  const monthlyNet = (Number(rent) || 0) - (Number(mortgagePI) || 0) - (Number(escrow) || 0);
  return emptyScenario({
    id: 'add-property',
    name: `Add: ${name}`,
    summary: `+$${Math.round(monthlyNet)}/mo net rent${downPayment ? `, $${Math.round(downPayment)} down` : ''}.`,
    monthlyIncomeDelta: monthlyNet,
    capitalPurchases: downPayment ? [{ label: `${name} down payment`, amount: downPayment, monthOffset: startMonth }] : [],
  });
}

export function scenarioAddSubscriptionTier({ name = 'New subscription tier', subscribers = 50, pricePerMonth = 29, startMonth = 1 } = {}) {
  const monthly = (Number(subscribers) || 0) * (Number(pricePerMonth) || 0);
  return emptyScenario({
    id: 'add-subscription',
    name: `Add: ${name}`,
    summary: `${subscribers} × $${pricePerMonth}/mo = +$${Math.round(monthly)}/mo from month ${startMonth}.`,
    recurringAdds: [{ label: name, amount: monthly, monthOffset: startMonth, frequency: 'monthly', kind: 'income' }],
  });
}

export function scenarioCapitalPurchase({ label = 'Capital purchase', amount = 12000, monthOffset = 1 } = {}) {
  return emptyScenario({
    id: 'capital-purchase',
    name: `Buy: ${label}`,
    summary: `−$${Math.round(amount)} one-time in month ${monthOffset}.`,
    capitalPurchases: [{ label, amount, monthOffset }],
  });
}
