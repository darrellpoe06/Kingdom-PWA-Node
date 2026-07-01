// Verification for the goal-driven budget engine. Per the Verification Doctrine
// (DR-0076) every formula is checked against a hand-computed expected value, and
// the senior requirement holds: the plan MOVES when the real data moves.
import { describe, it, expect } from 'vitest';
import {
  addMonths, daysInMonth, fractionOfMonthElapsed,
  freeMonthlyForScope, remainingForGoal, planGoal, allocateGoals,
  deriveCategoryPlans, categorySpendMTD, categoryStatus,
  upcomingObligations, dataConfidence, buildGuidance,
} from '../lib/budget-engine.js';

// A fixed "today" so every month-math result is deterministic.
const CD = new Date(2026, 6, 15); // Jul 15, 2026 (month index 6)

function fixture() {
  return {
    accounts: [
      { id: 'chk', entityId: 'e-fam', type: 'checking', balance: 8000, openingBalance: 8000 },
      { id: 'sav', entityId: 'e-fam', type: 'savings', balance: 4000, openingBalance: 4000 },
      { id: 'card', entityId: 'e-fam', type: 'credit', balance: -2000, openingBalance: -2000, rate: 0.2, minPayment: 100 },
    ],
    transactions: [
      // Three complete trailing months of groceries (Apr/May/Jun) → plan basis.
      { id: 'g1', date: '2026-04-05', accountId: 'chk', amount: -300, category: 'groceries' },
      { id: 'g2', date: '2026-05-05', accountId: 'chk', amount: -300, category: 'groceries' },
      { id: 'g3', date: '2026-06-05', accountId: 'chk', amount: -300, category: 'groceries' },
      // Month-to-date July groceries already at 350 (over the ~300 plan, mid-month).
      { id: 'g4', date: '2026-07-03', accountId: 'chk', amount: -200, category: 'groceries' },
      { id: 'g5', date: '2026-07-10', accountId: 'chk', amount: -150, category: 'groceries' },
      // Dining: modest history, light this month (headroom).
      { id: 'd1', date: '2026-04-08', accountId: 'chk', amount: -120, category: 'dining' },
      { id: 'd2', date: '2026-05-08', accountId: 'chk', amount: -120, category: 'dining' },
      { id: 'd3', date: '2026-06-08', accountId: 'chk', amount: -120, category: 'dining' },
      { id: 'd4', date: '2026-07-02', accountId: 'chk', amount: -10, category: 'dining' },
    ],
    inflows: {
      salaries: [{ id: 's1', entityId: 'e-fam', actual: 6000 }],
      rentals: [],
    },
    outflows: { housing: 2000, utilities: 500, food: 1000 }, // steady monthly = 3500
    recurringObligations: [
      // A $1,200 annual insurance bill due Sep 2026 → a lump ~2 months out.
      { id: 'ins', name: 'Auto insurance', enabled: true, frequency: 'annual', amount: 1200, nextDue: '2026-09-15', entityId: 'e-fam' },
    ],
    debts: [],
    entities: [{ id: 'e-fam', name: 'Family', type: 'personal' }],
  };
}

describe('date helpers', () => {
  it('addMonths crosses year boundaries', () => {
    expect(addMonths(new Date(2026, 11, 15), 1).getMonth()).toBe(0);
    expect(addMonths(new Date(2026, 11, 15), 1).getFullYear()).toBe(2027);
  });
  it('daysInMonth and fraction elapsed', () => {
    expect(daysInMonth(new Date(2026, 1, 1))).toBe(28); // Feb 2026
    expect(fractionOfMonthElapsed(new Date(2026, 6, 15))).toBeCloseTo(15 / 31, 5);
  });
});

describe('freeMonthlyForScope', () => {
  it('is income minus steady outflow (6000 - 3500)', () => {
    expect(freeMonthlyForScope(fixture(), 'consolidated')).toBe(2500);
  });
});

describe('planGoal (save)', () => {
  const goal = { id: 'g', name: 'Buffer', goalType: 'save', targetAmount: 6000, currentAmount: 1200, targetDate: '2026-10-15' };
  it('required monthly = remaining / months to date', () => {
    // remaining 4800 over Jul->Oct = 3 months → 1600/mo.
    const p = planGoal(goal, { currentDate: CD, available: 2000 });
    expect(p.remaining).toBe(4800);
    expect(p.monthsRemaining).toBe(3);
    expect(p.requiredMonthly).toBe(1600);
    expect(p.onTrack).toBe(true);
    expect(p.status).toBe('on-track');
    expect(p.pctFunded).toBe(20);
  });
  it('behind when available < required', () => {
    const p = planGoal(goal, { currentDate: CD, available: 1000 });
    expect(p.status).toBe('behind');
    expect(p.shortfallMonthly).toBe(600);
    expect(p.projectedMonths).toBe(5); // ceil(4800/1000)
  });
  it('at-risk when nothing is available', () => {
    const p = planGoal(goal, { currentDate: CD, available: 0 });
    expect(p.status).toBe('at-risk');
    expect(p.projectedDate).toBeNull();
  });
  it('achieved when remaining is zero', () => {
    const p = planGoal({ ...goal, currentAmount: 6000 }, { currentDate: CD, available: 0 });
    expect(p.status).toBe('achieved');
    expect(p.pctFunded).toBe(100);
  });
});

describe('remainingForGoal (payoff reads live debt)', () => {
  it('uses the live linked debt balance, not a stored number', () => {
    const data = fixture();
    const goal = { id: 'p', goalType: 'payoff', targetAmount: 2000, linkedDebtId: 'debt-acct-card' };
    const r = remainingForGoal(goal, data, CD);
    expect(r.basis).toBe('live-debt');
    expect(r.remaining).toBe(2000);
    // Post a $500 payment to the card → remaining moves without re-entering it.
    data.transactions.push({ id: 'pay', date: '2026-07-01', accountId: 'card', amount: 500 });
    expect(remainingForGoal(goal, data, CD).remaining).toBe(1500);
  });
});

describe('allocateGoals (competition for the same free cash)', () => {
  it('funds nearest-deadline first and marks the rest short', () => {
    const data = fixture(); // free monthly = 2500
    const goals = [
      { id: 'a', name: 'Near', goalType: 'save', targetAmount: 3000, currentAmount: 0, targetDate: '2026-09-15', scope: 'consolidated' }, // 2 mo → 1500/mo
      { id: 'b', name: 'Far', goalType: 'save', targetAmount: 6000, currentAmount: 0, targetDate: '2026-12-15', scope: 'consolidated' }, // 5 mo → 1200/mo
    ];
    const out = allocateGoals(goals, data, { currentDate: CD, scope: 'consolidated' });
    expect(out.freeMonthly).toBe(2500);
    expect(out.totalRequired).toBe(2700); // 1500 + 1200
    expect(out.fullyFunded).toBe(false);
    const near = out.plans.find((p) => p.goal.id === 'a');
    const far = out.plans.find((p) => p.goal.id === 'b');
    expect(near.allocated).toBe(1500); // near funded first
    expect(near.status).toBe('on-track');
    expect(far.allocated).toBe(1000); // only 1000 left of the 2500 pool
    expect(far.status).toBe('behind');
  });
});

describe('deriveCategoryPlans + categoryStatus', () => {
  it('derives a ~300 groceries plan from 3 trailing months', () => {
    const plans = deriveCategoryPlans(fixture().transactions, { currentDate: CD, lookbackMonths: 3 });
    expect(plans.groceries.plan).toBe(300); // (300*3)/3
    expect(plans.groceries.source).toBe('derived');
  });
  it('honors a user override over the derived value', () => {
    const plans = deriveCategoryPlans(fixture().transactions, { currentDate: CD, overrides: { groceries: 500 } });
    expect(plans.groceries.plan).toBe(500);
    expect(plans.groceries.source).toBe('user');
  });
  it('flags groceries as over/hot and dining as under', () => {
    const txns = fixture().transactions;
    const plans = deriveCategoryPlans(txns, { currentDate: CD });
    const spent = categorySpendMTD(txns, CD);
    expect(spent.groceries).toBe(350);
    const rows = categoryStatus(plans, spent, { currentDate: CD, threshold: 0.15 });
    const groc = rows.find((r) => r.category === 'groceries');
    // 350 spent of a 300 plan → already over the whole-month plan.
    expect(groc.status).toBe('over');
    const din = rows.find((r) => r.category === 'dining');
    expect(din.status).toBe('under');
    // worst-first ordering: groceries (over) precedes dining (under).
    expect(rows[0].category).toBe('groceries');
  });
});

describe('upcomingObligations (pipeline)', () => {
  it('lands the annual insurance ~2 months out with cash-after', () => {
    const data = fixture();
    const pipe = upcomingObligations(data, { currentDate: CD, months: 12, scope: 'consolidated' });
    expect(pipe.length).toBe(1);
    expect(pipe[0].label).toBe('Auto insurance');
    expect(pipe[0].amount).toBe(1200);
    expect(pipe[0].monthOffset).toBe(2); // Jul -> Sep
    expect(pipe[0].coveredBySavings).toBe(true); // 12000 cash covers it
  });
});

describe('dataConfidence', () => {
  it('is high on a fully-categorized ledger', () => {
    expect(dataConfidence(fixture()).level).toBe('high');
  });
  it('drops to low when most rows are uncategorized', () => {
    const data = fixture();
    data.transactions = data.transactions.map((t) => ({ ...t, category: 'other' }));
    expect(dataConfidence(data).level).toBe('low');
  });
  it('reports none on an empty ledger', () => {
    expect(dataConfidence({ transactions: [] }).level).toBe('none');
  });
});

describe('buildGuidance (end-to-end signals with reasons)', () => {
  it('produces goal, category, and pipeline signals from real data', () => {
    const data = fixture();
    const goals = [
      { id: 'buf', name: 'Buffer', goalType: 'save', targetAmount: 6000, currentAmount: 1200, targetDate: '2026-10-15', scope: 'consolidated' },
    ];
    const g = buildGuidance(data, goals, { currentDate: CD, scope: 'consolidated' });
    // A goal signal exists and carries a non-empty reason string.
    const goalSig = g.signals.find((s) => s.kind === 'goal');
    expect(goalSig).toBeTruthy();
    expect(typeof goalSig.reason).toBe('string');
    expect(goalSig.reason.length).toBeGreaterThan(10);
    // The grocery overspend surfaces as an alert-severity category signal.
    const catSig = g.signals.find((s) => s.kind === 'category' && s.category === 'groceries');
    expect(catSig).toBeTruthy();
    expect(catSig.severity).toBe('alert');
    // Alerts sort before info.
    expect(g.signals[0].severity).toBe('alert');
    // Confidence is surfaced.
    expect(g.confidence.level).toBe('high');
  });
});
