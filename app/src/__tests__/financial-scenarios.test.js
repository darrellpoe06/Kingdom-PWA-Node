// Finance-math verification for what-if scenario modeling. Every expected value
// is hand-computed against the same fixture used by the engine tests, so the
// "financial engineering" math is pinned, not asserted on faith.
import { describe, it, expect } from 'vitest';
import {
  SCENARIO_PRESETS,
  emptyScenario,
  scenarioLumpEvents,
  runScenario,
  compareScenarios,
  scenarioAddProperty,
  scenarioAddSubscriptionTier,
  scenarioCapitalPurchase,
} from '../lib/financial-scenarios.js';

const CD = new Date(2026, 0, 31);

function fixture() {
  return {
    accounts: [
      { id: 'a1', entityId: 'e-personal', type: 'checking', balance: 5000, openingBalance: 1000 },
      { id: 'a2', entityId: 'e-poeprops', type: 'savings', balance: 2000, openingBalance: 2000 },
    ],
    transactions: [
      { id: 't1', date: '2026-01-10', accountId: 'a1', amount: 500 },
      { id: 't2', date: '2026-01-20', accountId: 'a1', amount: -200 },
    ],
    inflows: {
      salaries: [{ who: 'A', actual: 4000, entityId: 'e-personal' }],
      rentals: [{ id: 'r1', entityId: 'e-poeprops', rent: 1400, actual: 1400, mortgage: { monthlyPI: 700, escrow: 200 } }],
    },
    outflows: { household: 2000, debtService: 500, rentalMortgages: 900 },
    recurringObligations: [
      { id: 'o2', name: 'Insurance', amount: 600, frequency: 'quarterly', nextDue: '2026-03-15', enabled: true, entityId: 'e-personal' },
    ],
    debts: [{ id: 'd1', name: 'Card', minPayment: 300, rate: 20, balance: 5000, entityId: 'e-personal' }],
  };
}
// Base consolidated: starting 3300, net 2000/mo, lumps -600 at months 2/5/8/11.
// Base 12-month ending cash = 3300 + 12*2000 - 4*600 = 24900.

describe('SCENARIO_PRESETS', () => {
  it('ships base/best/worst with explicit, editable multipliers', () => {
    expect(SCENARIO_PRESETS.map((s) => s.id)).toEqual(['base', 'best', 'worst']);
    const base = SCENARIO_PRESETS.find((s) => s.id === 'base');
    expect(base.incomeMultiplier).toBe(1);
    expect(base.expenseMultiplier).toBe(1);
  });
});

describe('scenarioLumpEvents', () => {
  it('turns a capital purchase into a negative one-time lump', () => {
    const evts = scenarioLumpEvents(emptyScenario({ capitalPurchases: [{ label: 'LED wall', amount: 12000, monthOffset: 3 }] }), 12);
    expect(evts).toEqual([{ monthOffset: 3, amount: -12000, label: 'LED wall', kind: 'capital' }]);
  });
  it('repeats a monthly recurring income add across the horizon', () => {
    const evts = scenarioLumpEvents(emptyScenario({ recurringAdds: [{ label: 'Tier', amount: 1000, monthOffset: 1, frequency: 'monthly', kind: 'income' }] }), 12);
    expect(evts).toHaveLength(12);
    expect(evts.every((e) => e.amount === 1000)).toBe(true);
  });
  it('drops a one-time expense add (no frequency) on its single month', () => {
    const evts = scenarioLumpEvents(emptyScenario({ recurringAdds: [{ label: 'Repair', amount: 500, monthOffset: 2, kind: 'expense' }] }), 12);
    expect(evts).toEqual([{ monthOffset: 2, amount: -500, label: 'Repair', kind: 'expense' }]);
  });
});

describe('runScenario', () => {
  it('base scenario equals the unscaled projection', () => {
    const r = runScenario(fixture(), SCENARIO_PRESETS[0], { currentDate: CD, months: 12 });
    expect(r.endingCash).toBe(24900);
  });
  it('best case lifts ending cash by 12x the monthly improvement', () => {
    const r = runScenario(fixture(), SCENARIO_PRESETS[1], { currentDate: CD, months: 12 });
    // +15% on 5400 income = +810/mo; -5% on 3400 expense = +170/mo; 12*980 = 11760
    expect(r.endingCash).toBe(36660);
  });
  it('worst case lowers ending cash symmetrically', () => {
    const r = runScenario(fixture(), SCENARIO_PRESETS[2], { currentDate: CD, months: 12 });
    expect(r.endingCash).toBe(11100); // 3300 + 12*850 - 2400
  });
});

describe('compareScenarios', () => {
  it('returns one row per scenario plus the best/worst spread', () => {
    const cmp = compareScenarios(fixture(), SCENARIO_PRESETS, { currentDate: CD, months: 12 });
    expect(cmp.results).toHaveLength(3);
    expect(cmp.best.id).toBe('best');
    expect(cmp.worst.id).toBe('worst');
    expect(cmp.spread).toBe(25560); // 36660 - 11100
  });
});

describe('scenario builders (the named engineering moves)', () => {
  it('add a capital purchase drops ending cash by the purchase amount', () => {
    const r = runScenario(fixture(), scenarioCapitalPurchase({ label: 'LED wall', amount: 12000, monthOffset: 3 }), { currentDate: CD, months: 12 });
    expect(r.endingCash).toBe(12900); // 24900 - 12000
  });
  it('add a subscription tier lifts ending cash by the recurring revenue', () => {
    const r = runScenario(fixture(), scenarioAddSubscriptionTier({ subscribers: 50, pricePerMonth: 29, startMonth: 1 }), { currentDate: CD, months: 12 });
    expect(r.endingCash).toBe(42300); // 24900 + 12*1450
  });
  it('add a property nets monthly rent against its down payment', () => {
    const r = runScenario(fixture(), scenarioAddProperty({ rent: 1400, mortgagePI: 700, escrow: 220, downPayment: 5000, startMonth: 1 }), { currentDate: CD, months: 12 });
    // +480/mo net rent over 12 = +5760, minus 5000 down = +760 over base
    expect(r.endingCash).toBe(25660);
  });
});
