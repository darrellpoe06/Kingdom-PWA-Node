// Finance-math verification for the forward projection engine. Per the
// Verification Doctrine (DR-0076): every formula here is checked against a
// hand-computed expected value, including the senior requirement that the
// projection MOVES when the underlying real data changes.
import { describe, it, expect } from 'vitest';
import {
  freqToMonthly,
  freqToMonths,
  monthsBetween,
  monthLabelFrom,
  deriveAccountBalances,
  applyManualBalance,
  resolveAccountUpdates,
  deriveEntityRollups,
  liveCashOnHand,
  deriveMonthlyFlows,
  deriveEntityFlows,
  deriveLumpEvents,
  projectCashFlow,
  buildProjection,
  cashForScope,
  snapshotFromProjection,
  actualVsProjected,
} from '../lib/financial-engineering.js';

// Jan 31, 2026 — the "today" all derivations key off.
const CD = new Date(2026, 0, 31);

function fixture() {
  return {
    accounts: [
      { id: 'a1', entityId: 'e-personal', type: 'checking', balance: 5000, openingBalance: 1000 },
      { id: 'a2', entityId: 'e-poeprops', type: 'savings', balance: 2000, openingBalance: 2000 },
      { id: 'a3', entityId: 'e-personal', type: 'credit', balance: -3000, openingBalance: -3000 }, // not cash
      { id: 'a4', entityId: 'e-personal', type: 'checking', balance: 0, openingBalance: 0, inLegal: true }, // excluded
    ],
    transactions: [
      { id: 't1', date: '2026-01-10', accountId: 'a1', amount: 500 },   // cleared
      { id: 't2', date: '2026-01-20', accountId: 'a1', amount: -200 },  // cleared
      { id: 't3', date: '2026-12-01', accountId: 'a1', amount: 9999 },  // future — excluded at CD
    ],
    inflows: {
      salaries: [{ who: 'A', actual: 4000, entityId: 'e-personal' }],
      rentals: [
        { id: 'r1', entityId: 'e-poeprops', rent: 1400, actual: 1400, mortgage: { balance: 100000, rate: 6, monthlyPI: 700, escrow: 200 } },
        { id: 'r2', entityId: 'e-poeprops', rent: 0, actual: 0, mortgage: { balance: 0 } }, // not income-producing
      ],
    },
    outflows: { household: 2000, debtService: 500, rentalMortgages: 900 },
    recurringObligations: [
      { id: 'o1', name: 'Phone', amount: 65, frequency: 'monthly', enabled: true, entityId: 'e-personal' },
      { id: 'o2', name: 'Insurance', amount: 600, frequency: 'quarterly', nextDue: '2026-03-15', enabled: true, entityId: 'e-personal' },
      { id: 'o3', name: 'Disabled', amount: 100, frequency: 'annual', nextDue: '2026-05-01', enabled: false, entityId: 'e-personal' },
    ],
    debts: [
      { id: 'd1', name: 'Card', minPayment: 300, rate: 20, balance: 5000, entityId: 'e-personal' },
      { id: 'd2', name: 'Solar', minPayment: 100, rate: 2, balance: 10000, leaveAlone: true, entityId: 'e-personal' },
    ],
  };
}

describe('frequency helpers', () => {
  it('freqToMonthly normalizes each cadence', () => {
    expect(freqToMonthly(60, 'monthly')).toBe(60);
    expect(freqToMonthly(600, 'quarterly')).toBe(200);
    expect(freqToMonthly(600, 'semi-annual')).toBe(100);
    expect(freqToMonthly(1200, 'annual')).toBe(100);
    expect(freqToMonthly(2400, 'biennial')).toBe(100);
    expect(freqToMonthly(100, 'nonsense')).toBe(0);
  });
  it('freqToMonths returns the step in months', () => {
    expect(freqToMonths('quarterly')).toBe(3);
    expect(freqToMonths('annual')).toBe(12);
    expect(freqToMonths('weird')).toBe(0);
  });
  it('monthsBetween counts calendar-month buckets', () => {
    expect(monthsBetween(new Date(2026, 0, 31), new Date(2026, 2, 15))).toBe(2);
    expect(monthsBetween(new Date(2026, 0, 1), new Date(2027, 0, 1))).toBe(12);
  });
});

describe('liveCashOnHand', () => {
  it('derives each cash account from opening + cleared transactions', () => {
    const { total, byAccount } = liveCashOnHand(fixture(), CD);
    const a1 = byAccount.find((a) => a.id === 'a1');
    expect(a1.balance).toBe(1300);          // 1000 + 500 - 200 (t3 future excluded)
    expect(byAccount.find((a) => a.id === 'a2').balance).toBe(2000);
    expect(total).toBe(3300);               // a1 + a2 only
  });
  it('excludes credit, loan, and inLegal accounts from cash', () => {
    const { byAccount } = liveCashOnHand(fixture(), CD);
    expect(byAccount.find((a) => a.id === 'a3')).toBeUndefined(); // credit
    expect(byAccount.find((a) => a.id === 'a4')).toBeUndefined(); // inLegal
  });
  it('clears future transactions once the as-of date reaches them', () => {
    const { byAccount } = liveCashOnHand(fixture(), new Date(2027, 0, 31));
    expect(byAccount.find((a) => a.id === 'a1').balance).toBe(11299); // +9999 now cleared
  });
});

describe('deriveAccountBalances — the single source of truth for displayed balances', () => {
  it('derives every account (all types) from opening + cleared transactions', () => {
    const b = deriveAccountBalances(fixture(), CD);
    expect(b.a1).toBe(1300);   // 1000 + 500 - 200 (future t3 excluded)
    expect(b.a2).toBe(2000);   // no tx
    expect(b.a3).toBe(-3000);  // credit included in the map (callers filter by type)
    expect(b.a4).toBe(0);
  });
  it('falls back to the stored balance when openingBalance is absent', () => {
    const data = { accounts: [{ id: 'x', type: 'checking', balance: 750 }], transactions: [] };
    expect(deriveAccountBalances(data).x).toBe(750);
  });
  it('THE LOOP: a newly added transaction moves the derived balance (no static seed)', () => {
    const data = fixture();
    const before = deriveAccountBalances(data, CD).a1;
    data.transactions.push({ id: 't-new', date: '2026-01-15', accountId: 'a1', amount: -125.50 });
    const after = deriveAccountBalances(data, CD).a1;
    expect(after).toBe(before - 125.50); // 1300 -> 1174.50
  });
});

describe('applyManualBalance — a hand-entered balance IS the displayed balance (Christina 2026-07-31)', () => {
  it('THE BUG IT CLOSES: writing the manual entry into `balance` re-added the whole history on top', () => {
    // A synced account (no openingBalance — the sync round-trip strips it) with
    // imported history. The user sees 16,953 and types their real 4,350.42.
    const data = {
      accounts: [{ id: 'chk', type: 'checking', balance: 4350.42 }],
      transactions: [
        { id: 'i1', date: '2026-01-05', accountId: 'chk', amount: 15000 },
        { id: 'i2', date: '2026-01-12', accountId: 'chk', amount: -2397.42 },
      ],
    };
    // The old path (balance as anchor) displays entered + history — the defect:
    expect(deriveAccountBalances(data, CD).chk).toBe(16953);
    // The fix: the edit becomes an adjustment row and the display lands exactly
    // on the entered number.
    const res = applyManualBalance(data, 'chk', 4350.42, CD);
    expect(res.mode).toBe('adjustment');
    expect(res.adjustment.amount).toBe(-12602.58); // 4350.42 − 16953
    expect(res.adjustment.category).toBe('balance-adjustment');
    data.transactions.push(res.adjustment);
    expect(deriveAccountBalances(data, CD).chk).toBe(4350.42);
  });
  it('an account with no cleared rows keeps the direct anchor write (fresh accounts, manual debts)', () => {
    const data = { accounts: [{ id: 'sav', type: 'savings', balance: 100 }], transactions: [] };
    expect(applyManualBalance(data, 'sav', 900, CD)).toEqual({ mode: 'anchor', balance: 900 });
  });
  it('future-dated rows alone do not force the adjustment path', () => {
    const data = {
      accounts: [{ id: 'chk', type: 'checking', balance: 100 }],
      transactions: [{ id: 'f1', date: '2026-12-01', accountId: 'chk', amount: -50 }],
    };
    expect(applyManualBalance(data, 'chk', 250, CD).mode).toBe('anchor');
  });
  it('re-entering the number already displayed records nothing (noop)', () => {
    const data = fixture();
    // a1 displays 1300 at CD (1000 opening + 500 − 200).
    expect(applyManualBalance(data, 'a1', 1300, CD).mode).toBe('noop');
  });
  it('honors the entry even when openingBalance is present (seed accounts)', () => {
    const data = fixture();
    const res = applyManualBalance(data, 'a1', 1000, CD);
    expect(res.mode).toBe('adjustment');
    data.transactions.push(res.adjustment);
    expect(deriveAccountBalances(data, CD).a1).toBe(1000);
  });
  it('resolveAccountUpdates blanks the anchor write and posts the row (the updateAccount front door)', () => {
    const data = fixture();
    const posted = [];
    const out = resolveAccountUpdates(data, 'a1', { name: 'Chk', balance: '4350.42' }, CD, (t) => posted.push(t));
    expect(out.balance).toBeUndefined();       // stored anchor never moves
    expect(out.name).toBe('Chk');              // other edits pass through
    expect(posted).toHaveLength(1);
    expect(posted[0].amount).toBe(round2Test(4350.42 - 1300));
    // No-ledger account: direct anchor write, no row posted.
    const posted2 = [];
    const out2 = resolveAccountUpdates(data, 'a2', { balance: '900' }, CD, (t) => posted2.push(t));
    expect(out2.balance).toBe('900');
    expect(posted2).toHaveLength(0);
  });
});
const round2Test = (x) => Math.round(x * 100) / 100;

describe('deriveEntityRollups — Accounts/Entities/Big Picture share one derived source', () => {
  const entities = [
    { id: 'e-poeprops', type: 'business' },
    { id: 'e-personal', type: 'personal' },
  ];
  it('sorts personal first, then business', () => {
    const rollups = deriveEntityRollups(fixture(), entities, CD);
    expect(rollups.map((r) => r.entity.id)).toEqual(['e-personal', 'e-poeprops']);
  });
  it('cash/credit/legacy totals are DERIVED (opening + cleared), not the static seed', () => {
    const rollups = deriveEntityRollups(fixture(), entities, CD);
    const personal = rollups.find((r) => r.entity.id === 'e-personal');
    expect(personal.cashBalance).toBe(1300);   // a1 only (a4 inLegal excluded), derived
    expect(personal.creditBalance).toBe(-3000); // a3
    expect(personal.balance).toBe(-1700);       // 1300 + (-3000), non-legal total
  });
  it('decorates each account with its derivedBalance for the display sites to read', () => {
    const rollups = deriveEntityRollups(fixture(), entities, CD);
    const personal = rollups.find((r) => r.entity.id === 'e-personal');
    expect(personal.accounts.find((a) => a.id === 'a1').derivedBalance).toBe(1300);
  });
  it('THE LOOP: adding a transaction moves the entity rollup, no manual balance edit', () => {
    const data = fixture();
    const before = deriveEntityRollups(data, entities, CD).find((r) => r.entity.id === 'e-personal').cashBalance;
    data.transactions.push({ id: 't-new', date: '2026-01-15', accountId: 'a1', amount: 1000 });
    const after = deriveEntityRollups(data, entities, CD).find((r) => r.entity.id === 'e-personal').cashBalance;
    expect(after).toBe(before + 1000);
  });
});

describe('deriveMonthlyFlows (consolidated)', () => {
  it('matches the Big Picture basis: actual income, aggregate outflow buckets', () => {
    const f = deriveMonthlyFlows(fixture());
    expect(f.monthlyInflow).toBe(5400);     // 4000 salary + 1400 rent (r2 excluded)
    expect(f.monthlyOutflow).toBe(3400);    // 2000 + 500 + 900
    expect(f.netMonthly).toBe(2000);
  });
});

describe('deriveEntityFlows (itemized per entity)', () => {
  it('attributes income-producing rentals and their mortgage to the property entity', () => {
    const ef = deriveEntityFlows(fixture(), 'e-poeprops');
    expect(ef.inflow).toBe(1400);
    expect(ef.monthlyOutflow).toBe(900);    // r1 PI 700 + escrow 200; r2 contributes 0
    expect(ef.netMonthly).toBe(500);
  });
  it('attributes salary, active-debt minimums, and monthly obligations to the personal entity', () => {
    const ef = deriveEntityFlows(fixture(), 'e-personal');
    expect(ef.inflow).toBe(4000);
    expect(ef.parts.debtMin).toBe(300);     // d2 leaveAlone excluded
    expect(ef.parts.monthlyObligations).toBe(65);
    expect(ef.monthlyOutflow).toBe(365);
    expect(ef.netMonthly).toBe(3635);
  });
});

describe('deriveLumpEvents', () => {
  it('lands a quarterly obligation on each occurrence inside the horizon', () => {
    const events = deriveLumpEvents(fixture(), CD, 12);
    expect(events).toHaveLength(4);                     // Mar, Jun, Sep, Dec
    expect(events.map((e) => e.monthOffset)).toEqual([2, 5, 8, 11]);
    expect(events.every((e) => e.amount === -600)).toBe(true);
  });
  it('excludes disabled and monthly obligations', () => {
    const events = deriveLumpEvents(fixture(), CD, 12);
    expect(events.some((e) => e.label === 'Disabled')).toBe(false);
    expect(events.some((e) => e.label === 'Phone')).toBe(false);
  });
  it('filters to one entity when asked', () => {
    expect(deriveLumpEvents(fixture(), CD, 12, 'e-poeprops')).toHaveLength(0);
    expect(deriveLumpEvents(fixture(), CD, 12, 'e-personal')).toHaveLength(4);
  });
});

describe('projectCashFlow (core projector)', () => {
  it('walks the timeline month-by-month with steady net plus dated lumps', () => {
    const p = projectCashFlow({
      startingCash: 3300,
      monthlyInflow: 5400,
      monthlyOutflow: 3400,
      lumpEvents: [
        { monthOffset: 2, amount: -600 }, { monthOffset: 5, amount: -600 },
        { monthOffset: 8, amount: -600 }, { monthOffset: 11, amount: -600 },
      ],
      currentDate: CD,
      months: 12,
    });
    expect(p.timeline[0].endCash).toBe(5300);   // 3300 + 2000
    expect(p.timeline[1].endCash).toBe(6700);   // + 2000 - 600
    expect(p.endingCash).toBe(24900);           // 3300 + 12*2000 - 4*600
    expect(p.netMonthly).toBe(2000);
    expect(p.runwayMonths).toBeNull();          // never negative
  });
  it('reports a lump month split into inflow/outflow correctly', () => {
    const p = projectCashFlow({ startingCash: 0, monthlyInflow: 1000, monthlyOutflow: 0, lumpEvents: [{ monthOffset: 1, amount: -250, kind: 'obligation' }], currentDate: CD, months: 1 });
    expect(p.timeline[0].inflow).toBe(1000);
    expect(p.timeline[0].outflow).toBe(250);
    expect(p.timeline[0].net).toBe(750);
  });
  it('computes runway when cash goes negative', () => {
    const p = projectCashFlow({ startingCash: 1000, monthlyInflow: 1000, monthlyOutflow: 2000, currentDate: CD, months: 12 });
    expect(p.runwayMonths).toBe(1);             // m1 ends at 0, m2 goes negative
    expect(p.runwayDate).toBe(monthLabelFrom(CD, 1));
    expect(p.endingCash).toBe(-11000);
    expect(p.lowest.monthOffset).toBe(12);
  });
});

describe('buildProjection (scope wiring over real data)', () => {
  it('consolidated projection equals hand-computed end cash', () => {
    const p = buildProjection(fixture(), { currentDate: CD, months: 12, scope: 'consolidated' });
    expect(p.startingCash).toBe(3300);
    expect(p.inputs.baseMonthlyInflow).toBe(5400);
    expect(p.inputs.baseMonthlyOutflow).toBe(3400);
    expect(p.endingCash).toBe(24900);
  });
  it('entity projection uses only that entity\'s cash, flows, and lumps', () => {
    const p = buildProjection(fixture(), { currentDate: CD, months: 12, scope: 'e-poeprops' });
    expect(p.startingCash).toBe(2000);          // a2 only
    expect(p.inputs.baseMonthlyInflow).toBe(1400);
    expect(p.inputs.baseMonthlyOutflow).toBe(900);
    expect(p.endingCash).toBe(8000);            // 2000 + 12*500, no lumps
  });
});

// THE senior verification (DR-0076 #5/#6): the forecast is only trustworthy if
// it MOVES with the real data. Change one salary and the 12-month ending cash
// must shift by exactly 12x the monthly delta — nothing painted, nothing stale.
describe('projection is dynamic — it updates when underlying data changes', () => {
  it('a +$1000/mo raise lifts 12-month ending cash by exactly $12,000', () => {
    const before = buildProjection(fixture(), { currentDate: CD, months: 12 }).endingCash;
    const raised = fixture();
    raised.inflows.salaries[0].actual += 1000;
    const after = buildProjection(raised, { currentDate: CD, months: 12 }).endingCash;
    expect(after - before).toBe(12000);
  });
  it('a new cleared transaction raises starting cash and ending cash equally', () => {
    const before = buildProjection(fixture(), { currentDate: CD, months: 12 });
    const withTx = fixture();
    withTx.transactions.push({ id: 't4', date: '2026-01-15', accountId: 'a1', amount: 2500 });
    const after = buildProjection(withTx, { currentDate: CD, months: 12 });
    expect(after.startingCash - before.startingCash).toBe(2500);
    expect(after.endingCash - before.endingCash).toBe(2500);
  });
});

describe('cashForScope', () => {
  it('returns consolidated or entity cash at a date', () => {
    expect(cashForScope(fixture(), CD, 'consolidated')).toBe(3300);
    expect(cashForScope(fixture(), CD, 'e-poeprops')).toBe(2000);
  });
});

describe('projected-vs-actual tracking', () => {
  it('snapshotFromProjection freezes the prediction with its horizon and assumptions', () => {
    const p = buildProjection(fixture(), { currentDate: CD, months: 12, scope: 'consolidated' });
    const snap = snapshotFromProjection(p, { scope: 'consolidated', assumptions: { scenarioId: 'base' }, currentDate: CD });
    expect(snap.baseDate).toBe('2026-01-31');
    expect(snap.horizonDate).toBe('2027-01-31');
    expect(snap.projectedEndCash).toBe(24900);
    expect(snap.assumptions.scenarioId).toBe('base');
  });
  it('returns pending before the horizon is reached (no fake actual)', () => {
    const p = buildProjection(fixture(), { currentDate: CD, months: 12 });
    const snap = snapshotFromProjection(p, { currentDate: CD });
    const v = actualVsProjected(snap, fixture(), new Date(2026, 5, 1));
    expect(v.reached).toBe(false);
  });
  it('scores projected vs actual once the horizon passes', () => {
    const p = buildProjection(fixture(), { currentDate: CD, months: 12 });
    const snap = snapshotFromProjection(p, { currentDate: CD });
    const v = actualVsProjected(snap, fixture(), new Date(2027, 1, 1));
    expect(v.reached).toBe(true);
    expect(v.actualEndCash).toBe(13299);        // real cash at 2027-01-31 (t3 cleared)
    expect(v.projectedEndCash).toBe(24900);
    expect(v.variance).toBe(-11601);
    expect(v.direction).toBe('behind');
    expect(v.accuracyLabel).toBe('way-off');
  });
});
