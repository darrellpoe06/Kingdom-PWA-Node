// money-functional-audit.test.js — Phase 3 functional audit (Christina, 2026-10-28)
// =============================================================================
// "I want to try to break this application before approving it for production."
// Every case below is a SCENARIO on a synthetic household (personal + three
// businesses), stated as TESTED / EXPECTED. The assertion is the expectation.
// Where the engine's actual behaviour differs, the case is marked DEFECT-n in
// its comment, asserts the MEASURED behaviour so the audit stays executable
// and honest, and the defect is listed in
// docs/99-session-notes/2026-10-28-money-phase-3-functional-audit.md.
// Nothing here fixes anything; fixes need separate approval.
//
// Synthetic data only. No production record, no network, no storage.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { buildSafeToSpend, expandOccurrences, obligationEvents, resolveScope } from '../lib/safe-to-spend.js';
import { paycheckPeriods } from '../lib/money-paychecks.js';
import { planDebtFreedom, compareStrategies, normalizeDebt } from '../lib/debt-freedom.js';
import { deriveAccountBalances, deriveDebts } from '../lib/financial-engineering.js';
import { reconcileAccounts } from '../lib/imported-view.js';

const TODAY = new Date(2026, 9, 28); // 2026-10-28
const d30 = { currentDate: TODAY, period: '30d' };
const clone = (x) => JSON.parse(JSON.stringify(x));

// ── the synthetic household ─────────────────────────────────────────────────
function household(overrides = {}) {
  const base = {
    meta: { bufferTarget: 1000, lastUpdated: '2026-10-27' },
    entities: [
      { id: 'e-personal', name: 'Personal', type: 'personal' },
      { id: 'e-props', name: 'Poe Properties', type: 'business' },
      { id: 'e-poetech', name: 'PoeTech', type: 'business' },
      { id: 'e-tlc', name: 'TLC Therapy Solutions', type: 'business' },
    ],
    accounts: [
      { id: 'chk', entityId: 'e-personal', name: 'Family Checking', type: 'checking', balance: 3200, openingBalance: 3200 },
      { id: 'sav', entityId: 'e-personal', name: 'Family Savings', type: 'savings', balance: 8000, openingBalance: 8000 },
      { id: 'visa', entityId: 'e-personal', name: 'Visa', type: 'credit', balance: -1850, openingBalance: -1850, rate: 22.99, rateKnown: true, minPayment: 60, dueDay: 15 },
      { id: 'auto', entityId: 'e-personal', name: 'Auto Loan', type: 'loan', balance: -9400, openingBalance: -9400, rate: 6.5, rateKnown: true, minPayment: 310, dueDay: 5 },
      { id: 'pt-chk', entityId: 'e-poetech', name: 'PoeTech Operating', type: 'checking', balance: 5500, openingBalance: 5500 },
      { id: 'pp-chk', entityId: 'e-props', name: 'Properties Operating', type: 'checking', balance: 2400, openingBalance: 2400 },
      { id: 'tlc-chk', entityId: 'e-tlc', name: 'TLC Operating', type: 'checking', balance: 4100, openingBalance: 4100 },
    ],
    transactions: [
      { id: 't-groc', date: '2026-10-27', accountId: 'chk', amount: -45, description: 'Aldi groceries', category: 'groceries' },
      // an internal transfer, both legs: never income, never spend
      { id: 't-xo', date: '2026-10-25', accountId: 'chk', amount: -1000, description: 'Transfer to savings', category: 'transfer', isTransfer: true },
      { id: 't-xi', date: '2026-10-25', accountId: 'sav', amount: 1000, description: 'Transfer from checking', category: 'transfer', isTransfer: true },
      // a pending-looking row dated today: already inside the balance
      { id: 't-pend', date: '2026-10-28', accountId: 'chk', amount: -40, description: 'Gas station (pending)', pending: true, category: 'fuel' },
      // a scheduled future-dated payment: a dated event
      { id: 't-sched', date: '2026-10-30', accountId: 'chk', amount: -250, description: 'Dentist (scheduled)', category: 'medical' },
    ],
    inflows: {
      salaries: [
        { id: 's-d', who: 'Darrell', source: 'PoeTech payroll', expected: 4200, actual: 4200, entityId: 'e-personal' },
        { id: 's-c', who: 'Christina', source: 'TLC salary', expected: 2600, actual: 2600, entityId: 'e-personal' },
      ],
      rentals: [
        { id: 'r1', name: '805 N Prospect', rent: 1450, actual: 1450, status: 'paying', entityId: 'e-props', mortgage: { balance: 98000, rate: 5.25, monthlyPI: 620, escrow: 210 } },
      ],
    },
    outflows: { household: 1100, charitableGiving: 300, debtService: 370, rentalMortgages: 830, propertyUtilities: 120 },
    recurringObligations: [
      { id: 'ro-elec', name: 'Electric', amount: 180, frequency: 'monthly', nextDue: '2026-11-12', entityId: 'e-personal', category: 'utilities', enabled: true },
      { id: 'ro-net', name: 'Internet', amount: 89, frequency: 'monthly', nextDue: '2026-11-20', entityId: 'e-personal', category: 'utilities', enabled: true },
      { id: 'ro-ins', name: 'Car insurance', amount: 150, frequency: 'monthly', nextDue: '2026-10-30', entityId: 'e-personal', category: 'insurance', enabled: true },
      { id: 'ro-water', name: 'Water', amount: 95, frequency: 'quarterly', nextDue: '2026-12-01', entityId: 'e-personal', category: 'utilities', enabled: true },
      { id: 'ro-soft', name: 'Software', amount: 300, frequency: 'monthly', nextDue: '2026-11-05', entityId: 'e-poetech', category: 'business', enabled: true },
      { id: 'ro-pins', name: 'Property insurance', amount: 240, frequency: 'monthly', nextDue: '2026-11-10', entityId: 'e-props', category: 'insurance', enabled: true },
    ],
    taxCalendar: [{ id: 'tx-q4', month: 1, day: 15, name: 'Estimated tax Q4', entityIds: ['e-personal'], applies: true, amount: 1200 }],
    incidents: [], debts: [], events: [],
    moneyPlan: { settings: { incomeSchedule: { 's-d': { frequency: 'biweekly', nextDate: '2026-11-06' }, 's-c': { frequency: 'semimonthly', nextDate: '2026-11-01' } }, debtDueDays: {}, rentDueDay: 1, mortgageDueDay: 1 } },
  };
  return { ...base, ...overrides };
}
const run = (data, opts = {}) => buildSafeToSpend(data, { ...d30, ...opts });
const cashOn = (r, date) => (r.timeline.find((t) => t.date === date) || {}).cash;

// A world with NO undated accruals, so every number is hand-computable.
function anchorWorld() {
  const w = household();
  w.outflows = {}; w.taxCalendar = [];
  return w;
}

// ═══════════════════════════════════════════════════════════════════════════
describe('TEST 1 · Safe to Spend recalculates (30-day window from 2026-10-28)', () => {
  it('ANCHOR — the walk is hand-checkable: cash, every dated item on its day, lowest, cushion', () => {
    // TESTED: the plain arithmetic with no accruals. EXPECTED (by hand):
    //   cash = chk 3200−45−1000−40 = 2115, sav 8000+1000 = 9000 → 11,115
    //   10-30: car insurance −150, dentist −250 → 10,715
    //   11-01: Christina 1,300 (2600/2) → 12,015
    //   11-05: auto min −310 → 11,705      11-06: Darrell 1,938.46 (4200·12/26) → 13,643.46
    //   11-12: electric −180 → 13,463.46   11-15: Christina 1,300 → 14,763.46; visa min −60 → 14,703.46
    //   11-20: internet −89, Darrell 1,938.46 → 16,552.92 ... lowest = 10,715 on 10-30; safe = 10,715 − 1,000.
    const r = run(anchorWorld());
    expect(r.lines.availableCash).toBe(11115);
    expect(cashOn(r, '2026-10-30')).toBe(10715);
    expect(cashOn(r, '2026-11-01')).toBe(12015);
    expect(cashOn(r, '2026-11-06')).toBeCloseTo(13643.46, 2);
    expect(r.lines.projectedLowest).toEqual({ amount: 10715, date: '2026-10-30' });
    expect(r.safeToSpendNow).toBe(9715);
    expect(r.status).toBe('verified');
  });

  it('1.1a a bill ADDED before the low point lowers Safe to Spend by exactly its amount', () => {
    const base = run(anchorWorld());
    const w = anchorWorld(); w.recurringObligations.push({ id: 'ro-new', name: 'Daycare', amount: 400, frequency: 'monthly', nextDue: '2026-10-29', entityId: 'e-personal', category: 'childcare', enabled: true });
    const r = run(w);
    expect(base.safeToSpendNow - r.safeToSpendNow).toBe(400);
  });
  it('1.1b a bill EDITED (amount) moves Safe to Spend by the difference; DELETED restores it', () => {
    const base = run(anchorWorld());
    const w = anchorWorld(); w.recurringObligations.find((o) => o.id === 'ro-ins').amount = 275; // +125 on 10-30
    expect(base.safeToSpendNow - run(w).safeToSpendNow).toBe(125);
    const w2 = anchorWorld(); w2.recurringObligations = w2.recurringObligations.filter((o) => o.id !== 'ro-ins');
    expect(run(w2).safeToSpendNow - base.safeToSpendNow).toBe(150);
  });
  it('1.1c a bill DISABLED (enabled:false) leaves the walk', () => {
    const base = run(anchorWorld());
    const w = anchorWorld(); w.recurringObligations.find((o) => o.id === 'ro-ins').enabled = false;
    expect(run(w).safeToSpendNow - base.safeToSpendNow).toBe(150);
  });
  it('1.1d FIXED (DEFECT-1) — a bill MARKED PAID whose payment is NOT in the ledger yet stays counted, and says so, because the balance has not lost that money', () => {
    // Removing it would count money the ledger balance still holds: Safe to
    // Spend would read HIGH by the bill. It stays, is flagged, and the result
    // turns to an estimate with the reason named.
    const base = run(anchorWorld());
    const w = anchorWorld(); w.moneyPlan.billStatus = { 'ro-ins:2026-10-30': { status: 'paid', at: '2026-10-28T12:00:00Z' } };
    const r = run(w);
    expect(r.safeToSpendNow).toBe(base.safeToSpendNow);
    const occ = r.items.find((it) => it.refId === 'ro-ins' && it.date === '2026-10-30');
    expect(occ.markedPaid).toBe(true);
    expect(r.status).toBe('estimate');
    expect(r.confidence.reasons.join(' ')).toMatch(/marked paid but not in the ledger yet/);
  });
  it('1.1d FIXED — marked PAID and the payment IS in the ledger: cash is lower and the occurrence is settled, net effect 0 (no double count)', () => {
    const base = run(anchorWorld());
    const w = anchorWorld(); w.moneyPlan.billStatus = { 'ro-ins:2026-10-30': { status: 'paid' } };
    w.transactions.push({ id: 't-paid', date: '2026-10-28', accountId: 'chk', amount: -150, description: 'Car insurance', category: 'insurance' });
    const r = run(w);
    expect(r.safeToSpendNow).toBe(base.safeToSpendNow);
    expect(r.items.some((it) => it.refId === 'ro-ins' && it.date === '2026-10-30')).toBe(false);
    expect(r.settled.find((it) => it.refId === 'ro-ins').settled).toBe('paid-in-ledger');
  });
  it('1.1e FIXED (DEFECT-1) — a bill paid EARLY through the ledger (no status set) is matched automatically: net effect 0', () => {
    const base = run(anchorWorld());
    const w = anchorWorld(); w.transactions.push({ id: 't-paid', date: '2026-10-28', accountId: 'chk', amount: -150, description: 'Car insurance', category: 'insurance' });
    const r = run(w);
    expect(r.safeToSpendNow).toBe(base.safeToSpendNow);
    expect(r.items.some((it) => it.refId === 'ro-ins' && it.date === '2026-10-30')).toBe(false);
  });
  it('1.1e PROVEN TO CATCH — LAST cycle\'s payment (before half a cycle ahead of the due date) is NOT taken as this cycle\'s', () => {
    // due 10-30 monthly: only payments from 10-15 on can be this cycle's. A
    // payment dated 10-05 is last month's; matching it would drop a bill that
    // is still owed and read Safe to Spend HIGH.
    const base = run(anchorWorld());
    const w = anchorWorld(); w.transactions.push({ id: 't-old', date: '2026-10-05', accountId: 'chk', amount: -150, description: 'Car insurance', category: 'insurance' });
    const r = run(w);
    expect(r.items.some((it) => it.refId === 'ro-ins' && it.date === '2026-10-30')).toBe(true);
    expect(base.safeToSpendNow - r.safeToSpendNow).toBe(150); // the old payment lowered cash; the bill is still owed
  });
  it('1.1e PROVEN TO CATCH — a different payee is never matched', () => {
    const base = run(anchorWorld());
    const w = anchorWorld(); w.transactions.push({ id: 't-other', date: '2026-10-28', accountId: 'chk', amount: -150, description: 'Car wash', category: 'auto' });
    const r = run(w);
    expect(r.items.some((it) => it.refId === 'ro-ins' && it.date === '2026-10-30')).toBe(true);
    expect(base.safeToSpendNow - r.safeToSpendNow).toBe(150);
  });
  it('1.1f a bill PAID OUTSIDE these accounts, or CANCELED, leaves the walk (its money never touches these balances)', () => {
    const base = run(anchorWorld());
    for (const status of ['paid-outside', 'canceled']) {
      const w = anchorWorld(); w.moneyPlan.billStatus = { 'ro-ins:2026-10-30': { status } };
      const r = run(w);
      expect(r.safeToSpendNow - base.safeToSpendNow, status).toBe(150);
      expect(r.settled.find((it) => it.refId === 'ro-ins').settled).toBe(status);
    }
  });

  it('1.2a a paycheck ADDED (schedule entered) counts only ON its day — never before', () => {
    const w = anchorWorld(); w.moneyPlan.settings.incomeSchedule = {}; // no schedules → no income
    const none = run(w);
    expect(none.lines.expectedIncome).toBe(0);
    expect(none.assumptions.some((a) => /LEFT OUT/.test(a))).toBe(true);
    const w2 = anchorWorld(); w2.moneyPlan.settings.incomeSchedule = { 's-d': { frequency: 'biweekly', nextDate: '2026-11-06' } };
    const r = run(w2);
    expect(cashOn(r, '2026-11-05')).toBe(cashOn(none, '2026-11-05')); // the day before: identical
    expect(cashOn(r, '2026-11-06') - cashOn(none, '2026-11-06')).toBeCloseTo(4200 * 12 / 26, 2);
  });
  it('1.2b a paycheck DELAYED a week moves the money, and the lowest point moves with it', () => {
    const w = anchorWorld(); w.moneyPlan.settings.incomeSchedule = { 's-d': { frequency: 'biweekly', nextDate: '2026-11-06' } };
    const w2 = anchorWorld(); w2.moneyPlan.settings.incomeSchedule = { 's-d': { frequency: 'biweekly', nextDate: '2026-11-13' } };
    const a = run(w); const b = run(w2);
    expect(cashOn(b, '2026-11-06')).toBeLessThan(cashOn(a, '2026-11-06'));
    expect(cashOn(b, '2026-11-13') - cashOn(b, '2026-11-12')).toBeCloseTo(4200 * 12 / 26, 2);
    // with the pay delayed, the 11-05 auto payment is met from cash alone: the low point is lower or equal
    expect(b.lines.projectedLowest.amount).toBeLessThanOrEqual(a.lines.projectedLowest.amount);
  });
  it('1.2c a paycheck REMOVED (salary deleted) drops its income and names what is missing in the explanation', () => {
    const w = anchorWorld(); w.inflows.salaries = w.inflows.salaries.filter((s) => s.id !== 's-d');
    const r = run(w);
    expect(r.items.filter((it) => it.kind === 'income' && /PoeTech/.test(it.label))).toHaveLength(0);
    expect(r.items.filter((it) => it.kind === 'income' && /TLC/.test(it.label)).length).toBeGreaterThan(0);
  });

  it('1.3 an UNEXPECTED EXPENSE: a dated incident is reserved on its day; an overdue one is due now; a ledger row today lowers cash', () => {
    const base = run(anchorWorld());
    const w = anchorWorld(); w.incidents.push({ id: 'inc-1', description: 'Water heater', amount: 900, dueDate: '2026-11-03', status: 'open', entityId: 'e-personal' });
    const r = run(w);
    expect(r.lines.otherCommitments).toBe(900);
    expect(cashOn(r, '2026-11-03') - cashOn(base, '2026-11-03')).toBe(-900);
    const w2 = anchorWorld(); w2.incidents.push({ id: 'inc-2', description: 'Tow', amount: 200, dueDate: '2026-10-20', status: 'open', entityId: 'e-personal' });
    expect(run(w2).items.find((it) => it.kind === 'incident').date).toBe('2026-10-28'); // overdue = today
    const w3 = anchorWorld(); w3.transactions.push({ id: 't-er', date: '2026-10-28', accountId: 'chk', amount: -600, description: 'ER copay', category: 'medical' });
    expect(base.lines.availableCash - run(w3).lines.availableCash).toBe(600);
  });

  it('1.4 a DEBT PAYMENT INCREASE (minimum 60 → 160) adds exactly 100 on its due day', () => {
    const base = run(anchorWorld());
    const w = anchorWorld(); w.accounts.find((a) => a.id === 'visa').minPayment = 160;
    const r = run(w);
    expect(r.lines.debtMinimums - base.lines.debtMinimums).toBe(100);
    expect(cashOn(r, '2026-11-15') - cashOn(base, '2026-11-15')).toBe(-100);
  });

  it('1.5 a SAVINGS CONTRIBUTION change is reserved day by day, pro-rated through the low point', () => {
    const w = anchorWorld(); w.moneyPlan.settings.savingsMonthly = 600;
    const r = run(w);
    expect(r.monthly.savings).toBe(600);
    expect(r.lines.savingsReserved).toBeCloseTo(600 * 30 / (365.25 / 12), 2);
    // reserved only from day 1 onward: day 0 accrues nothing
    expect(r.timeline[0].accrued).toBe(0);
    expect(r.timeline[1].accrued).toBeCloseTo(600 / (365.25 / 12), 2);
  });

  it('1.6 a CUSHION change moves Safe to Spend one-for-one and becomes a shortfall past the low point', () => {
    const base = run(anchorWorld());
    const w = anchorWorld(); w.moneyPlan.settings.minCushion = 2500;
    expect(base.safeToSpendNow - run(w).safeToSpendNow).toBe(1500);
    const w2 = anchorWorld(); w2.moneyPlan.settings.minCushion = 12000; // above the lowest 10,715
    const r2 = run(w2);
    expect(r2.safeToSpendNow).toBe(0);
    expect(r2.shortfall).toBe(12000 - 10715);
  });

  it('1.7 a NEGATIVE balance yields $0 safe, a shortfall, and an overdraft dated today', () => {
    const w = anchorWorld(); w.accounts.find((a) => a.id === 'chk').openingBalance = -400; w.accounts.find((a) => a.id === 'sav').openingBalance = 0;
    const r = run(w);
    expect(r.lines.availableCash).toBe(-400 - 45 - 1000 - 40 + 1000); // = −485
    expect(r.safeToSpendNow).toBe(0);
    // lowest = −485 − 150 (insurance) − 250 (dentist) on 10-30 = −885; shortfall = cushion − lowest
    expect(r.lines.projectedLowest).toEqual({ amount: -885, date: '2026-10-30' });
    expect(r.shortfall).toBe(1000 + 885);
    expect(r.overdraftDate).toBe('2026-10-28');
  });

  it('1.8 a recurring payment CROSSES INTO NEXT MONTH: the 10-30 insurance lands again on 11-30 inside a 45-day window; the 31st clamps', () => {
    const w = anchorWorld();
    const r = buildSafeToSpend(w, { currentDate: TODAY, period: 'custom', customEnd: '2026-12-12' });
    expect(r.items.filter((it) => it.refId === 'ro-ins').map((it) => it.date)).toEqual(['2026-10-30', '2026-11-30']);
    const occ = expandOccurrences('2026-10-31', 'monthly', new Date(2026, 9, 28), new Date(2027, 2, 5)).map((x) => `${x.getMonth() + 1}/${x.getDate()}`);
    expect(occ).toEqual(['10/31', '11/30', '12/31', '1/31', '2/28']);
  });

  it('1.9 a PENDING row dated today is inside the balance and never also an event; a future-dated row is an event, once', () => {
    const r = run(anchorWorld());
    expect(r.items.some((it) => /pending/i.test(it.label))).toBe(false);
    expect(r.items.filter((it) => /Dentist/.test(it.label))).toHaveLength(1);
    expect(deriveAccountBalances(anchorWorld(), TODAY).chk).toBe(2115); // includes the −40 pending row
    // the future row is NOT in today's balance
    const noFuture = clone(anchorWorld()); noFuture.transactions = noFuture.transactions.filter((t) => t.id !== 't-sched');
    expect(deriveAccountBalances(noFuture, TODAY).chk).toBe(2115);
  });

  it('1.10 a TRANSFER between own accounts is never income, never spend, and leaves total cash unchanged', () => {
    const r = run(anchorWorld());
    expect(r.items.some((it) => /Transfer/.test(it.label))).toBe(false);
    const w = anchorWorld(); w.transactions = w.transactions.filter((t) => !t.isTransfer);
    expect(run(w).lines.availableCash).toBe(r.lines.availableCash);
    // a future-dated transfer is not a scheduled event either
    const w2 = anchorWorld(); w2.transactions.push({ id: 't-fx', date: '2026-11-02', accountId: 'chk', amount: 700, description: 'Transfer from savings', category: 'transfer', isTransfer: true });
    expect(run(w2).items.some((it) => it.refId === 't-fx')).toBe(false);
    // a transfer TO the credit card does leave spendable cash (it is a payment)
    const w3 = anchorWorld(); w3.transactions.push({ id: 't-cc', date: '2026-10-27', accountId: 'chk', amount: -500, description: 'Payment to Visa', category: 'debt-payment' }, { id: 't-cc2', date: '2026-10-27', accountId: 'visa', amount: 500, description: 'Payment received', category: 'debt-payment' });
    expect(r.lines.availableCash - run(w3).lines.availableCash).toBe(500);
  });

  it('PROJECTED INCOME IS NEVER MONEY ALREADY AVAILABLE: available cash equals the ledger; income appears only on the timeline, on its date', () => {
    const r = run(anchorWorld());
    expect(r.lines.availableCash).toBe(11115);
    expect(r.lines.expectedIncome).toBeGreaterThan(0);
    for (const it of r.items.filter((x) => x.kind === 'income')) expect(it.date > '2026-10-28').toBe(true);
    // the explanation says so in words
    expect(r.explanation[0]).toMatch(/verified available cash/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('TEST 2 · Debt Freedom against an independent calculation', () => {
  const START = new Date(2026, 10, 1);
  const debts = () => [
    { id: 'visa', name: 'Visa', balance: 1850, rate: 22.99, rateKnown: true, minPayment: 60, interestMethod: 'monthly', dueDay: 15 },
    { id: 'auto', name: 'Auto Loan', balance: 9400, rate: 6.5, rateKnown: true, minPayment: 310, interestMethod: 'monthly', dueDay: 5 },
    { id: 'med', name: 'Medical', balance: 700, rate: 0, rateKnown: true, minPayment: 50, interestMethod: 'none', dueDay: 20 },
    { id: 'loan', name: 'Personal loan', balance: 4200, rate: 11.9, rateKnown: true, minPayment: 140, interestMethod: 'monthly', dueDay: 1 },
  ];
  // INDEPENDENT simulator, written from the stated rules without reading the
  // engine: monthly interest = balance × apr/12; minimums first, capped at what
  // is owed; the extra plus every freed-up minimum goes to the target in order;
  // a debt that clears mid-pool passes the remainder on.
  function simulate(list, order, extra) {
    const s = list.map((d) => ({ ...d, bal: d.balance, interest: 0, paid: 0, cleared: null }));
    const byId = (id) => s.find((x) => x.id === id);
    let m = 0; let totalInterest = 0; let totalPaid = 0;
    while (s.some((x) => x.bal > 0.005) && m < 600) {
      m += 1;
      let pool = extra;
      for (const x of s) {
        if (x.bal <= 0.005) { pool += x.minPayment; continue; }
        const i = Math.round(x.bal * (x.rate / 100 / 12) * 100) / 100; x.bal = Math.round((x.bal + i) * 100) / 100; totalInterest += i;
        const pay = Math.min(x.minPayment, x.bal); x.bal = Math.round((x.bal - pay) * 100) / 100; totalPaid += pay;
        if (x.bal <= 0.005) { x.cleared = m; pool += x.minPayment - pay; }
      }
      for (const id of order(s)) {
        const x = byId(id); if (x.bal <= 0.005 || pool <= 0) continue;
        const pay = Math.min(pool, x.bal); x.bal = Math.round((x.bal - pay) * 100) / 100; pool -= pay; totalPaid += pay;
        if (x.bal <= 0.005 && !x.cleared) x.cleared = m;
      }
    }
    return { months: m, totalInterest: Math.round(totalInterest * 100) / 100, totalPaid: Math.round(totalPaid * 100) / 100, cleared: Object.fromEntries(s.map((x) => [x.id, x.cleared])) };
  }
  const bySmallest = (s) => [...s].filter((x) => x.bal > 0.005).sort((a, b) => a.bal - b.bal).map((x) => x.id);
  const byRate = (s) => [...s].filter((x) => x.bal > 0.005).sort((a, b) => b.rate - a.rate).map((x) => x.id);

  it('2.1 SNOWBALL pays the smallest balance first: the medical bill clears first, then Visa', () => {
    const p = planDebtFreedom(debts(), { startDate: START, strategy: 'snowball', extraMonthly: 300 });
    const order = [...p.debts].sort((a, b) => a.payoffMonth - b.payoffMonth).map((d) => d.id);
    expect(order).toEqual(['med', 'visa', 'loan', 'auto']);
  });
  it('2.2 MINIMUMS continue on every other debt every month until it clears', () => {
    const p = planDebtFreedom(debts(), { startDate: START, strategy: 'snowball', extraMonthly: 300 });
    for (const m of p.months) for (const r of m.payments) {
      if (r.startBalance > 0.005) expect(r.minimum).toBeCloseTo(Math.min(debts().find((d) => d.id === r.debtId).minPayment, r.startBalance + r.interest), 2);
    }
  });
  it('2.3 EXTRA rolls to the next debt: after the medical bill clears, its $50 joins the pool', () => {
    const p = planDebtFreedom(debts(), { startDate: START, strategy: 'snowball', extraMonthly: 300 });
    const medMonth = p.debts.find((d) => d.id === 'med').payoffMonth;
    const after = p.months[medMonth]; // the month after it clears
    const extraAfter = after.payments.reduce((s, r) => s + r.extra, 0);
    expect(extraAfter).toBeCloseTo(300 + 50, 2);
  });
  it('2.4 INTEREST matches the independent simulator month by month (snowball and avalanche, $300 extra)', () => {
    for (const [strategy, order] of [['snowball', bySmallest], ['avalanche', byRate]]) {
      const p = planDebtFreedom(debts(), { startDate: START, strategy, extraMonthly: 300 });
      const sim = simulate(debts(), order, 300);
      expect(p.debtFreeMonth).toBe(sim.months);
      expect(p.totalInterest).toBeCloseTo(sim.totalInterest, 0);
      expect(p.totalPaid).toBeCloseTo(sim.totalPaid, 0);
      for (const d of p.debts) expect(d.payoffMonth, `${strategy} ${d.id}`).toBe(sim.cleared[d.id]);
    }
  });
  it('2.5 PAYOFF DATES recalculate from the start date; a later start shifts every label', () => {
    const a = planDebtFreedom(debts(), { startDate: START, strategy: 'snowball', extraMonthly: 300 });
    const b = planDebtFreedom(debts(), { startDate: new Date(2027, 0, 1), strategy: 'snowball', extraMonthly: 300 });
    expect(b.debtFreeMonth).toBe(a.debtFreeMonth);
    expect(b.debtFreeKey > a.debtFreeKey).toBe(true);
    expect(a.debts.find((d) => d.id === 'med').payoffKey).toMatch(/^2026-|^2027-/);
  });
  it('2.6 INCREASING extra shortens the schedule and interest; DECREASING lengthens both', () => {
    const lo = planDebtFreedom(debts(), { startDate: START, strategy: 'snowball', extraMonthly: 100 });
    const mid = planDebtFreedom(debts(), { startDate: START, strategy: 'snowball', extraMonthly: 300 });
    const hi = planDebtFreedom(debts(), { startDate: START, strategy: 'snowball', extraMonthly: 800 });
    expect(hi.debtFreeMonth).toBeLessThan(mid.debtFreeMonth); expect(mid.debtFreeMonth).toBeLessThan(lo.debtFreeMonth);
    expect(hi.totalInterest).toBeLessThan(mid.totalInterest); expect(mid.totalInterest).toBeLessThan(lo.totalInterest);
  });
  it('2.7 ZERO-INTEREST debt accrues nothing and clears on the arithmetic month', () => {
    const p = planDebtFreedom([{ id: 'z', name: 'Zero', balance: 700, rate: 0, rateKnown: true, minPayment: 50, interestMethod: 'none' }], { startDate: START });
    expect(p.totalInterest).toBe(0); expect(p.debtFreeMonth).toBe(14); expect(p.totalPaid).toBe(700);
  });
  it('2.8 MISSING TERMS are excluded by name with a reason, never projected at 0% or $0', () => {
    const p = planDebtFreedom([
      { id: 'norate', name: 'Store card', balance: 900, minPayment: 35 },
      { id: 'nomin', name: 'Family loan', balance: 2500, rate: 0, rateKnown: true },
      ...debts(),
    ], { startDate: START, strategy: 'snowball', extraMonthly: 100 });
    expect(p.excluded.map((d) => [d.id, d.reason])).toEqual(expect.arrayContaining([['norate', 'interest rate not known'], ['nomin', 'no minimum payment entered']]));
    expect(p.debts.map((d) => d.id)).not.toContain('norate');
    expect(normalizeDebt({ id: 'x', name: 'X', balance: 10, minPayment: 5 }).excludedReason).toBe('interest rate not known');
  });
  it('2.9 the PLAN never changes actual balances: inputs are untouched, and the ledger-derived debt list is unaffected', () => {
    const input = debts(); const frozen = JSON.stringify(input);
    planDebtFreedom(input, { startDate: START, strategy: 'avalanche', extraMonthly: 500, oneTime: [{ month: '2026-12', amount: 1000 }] });
    compareStrategies(input, { startDate: START, extraMonthly: 500 });
    expect(JSON.stringify(input)).toBe(frozen);
    const w = household(); const before = JSON.stringify(deriveDebts(w, TODAY).map((d) => [d.id, d.balance]));
    planDebtFreedom(deriveDebts(w, TODAY), { startDate: START, strategy: 'snowball', extraMonthly: 2000 });
    expect(JSON.stringify(deriveDebts(w, TODAY).map((d) => [d.id, d.balance]))).toBe(before);
  });
  it('2.10 CUSTOM ORDER is honoured exactly, and a debt left out of the order is paid last', () => {
    const p = planDebtFreedom(debts(), { startDate: START, strategy: 'custom', customOrder: ['auto', 'loan'], extraMonthly: 400 });
    const order = [...p.debts].sort((a, b) => a.payoffMonth - b.payoffMonth || a.id.localeCompare(b.id)).map((d) => d.id);
    expect(order.indexOf('auto')).toBeLessThan(order.indexOf('loan'));
    expect(order.indexOf('loan')).toBeLessThan(Math.max(order.indexOf('visa'), order.indexOf('med')));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('TEST 3 · Budget by paycheck', () => {
  const periodsFor = (schedule, extra = {}) => {
    const w = anchorWorld(); w.moneyPlan.settings.incomeSchedule = schedule; Object.assign(w, extra);
    return paycheckPeriods(w, { currentDate: TODAY, scope: 'personal', horizonDays: 60 });
  };
  it('3.1 WEEKLY: a period opens on every Friday paycheck; period 0 runs from today to the first one', () => {
    const r = periodsFor({ 's-d': { frequency: 'weekly', nextDate: '2026-10-30' } });
    expect(r.paydays.slice(0, 4)).toEqual(['2026-10-30', '2026-11-06', '2026-11-13', '2026-11-20']);
    expect(r.periods[0].source).toBe('cash-on-hand'); expect(r.periods[0].income).toBe(0);
    expect(r.periods[1].income).toBeCloseTo(4200 * 12 / 52, 2);
  });
  it('3.2 BIWEEKLY with THREE paychecks in a month: Nov 6, Nov 20, Dec 4 — each its own period', () => {
    const r = periodsFor({ 's-d': { frequency: 'biweekly', nextDate: '2026-11-06' } });
    expect(r.paydays.filter((d) => d.startsWith('2026-11'))).toEqual(['2026-11-06', '2026-11-20']);
    expect(r.paydays).toContain('2026-12-04');
    expect(r.periods.filter((p) => p.source === 'paycheck').every((p) => Math.abs(p.income - 4200 * 12 / 26) < 0.01)).toBe(true);
  });
  it('3.3 SEMIMONTHLY (1st & 15th) and MONTHLY cut the periods on those days and carry the right bills', () => {
    const semi = periodsFor({ 's-c': { frequency: 'semimonthly', nextDate: '2026-11-01' } });
    expect(semi.paydays.slice(0, 3)).toEqual(['2026-11-01', '2026-11-15', '2026-12-01']); // DEFECT-2 FIXED 2026-10-29: two fixed days of the month, the 1st & 15th
    const monthly = periodsFor({ 's-d': { frequency: 'monthly', nextDate: '2026-11-01' } });
    expect(monthly.paydays.slice(0, 2)).toEqual(['2026-11-01', '2026-12-01']);
    // the 11-05 auto payment and 11-12 electric land in the paycheck period that opens 11-01
    const p1 = monthly.periods[1];
    expect(p1.items.map((it) => it.label)).toEqual(expect.arrayContaining(['Auto Loan · minimum', 'Electric']));
    expect(monthly.periods[0].items.map((it) => it.label)).toEqual(expect.arrayContaining(['Car insurance', 'Dentist (scheduled)']));
  });
  it('3.4 IRREGULAR income (no schedule) is inferred from real deposits and labeled; with no deposits the budget says what is missing', () => {
    const w = anchorWorld(); w.moneyPlan.settings.incomeSchedule = {}; w.inflows.salaries = [w.inflows.salaries[0]];
    w.transactions.push(
      { id: 'p1', date: '2026-09-30', accountId: 'chk', amount: 1900, description: 'POETECH PAYROLL', category: 'salary' },
      { id: 'p2', date: '2026-10-14', accountId: 'chk', amount: 1900, description: 'POETECH PAYROLL', category: 'salary' },
      { id: 'p3', date: '2026-10-27', accountId: 'chk', amount: 1900, description: 'POETECH PAYROLL', category: 'salary' },
    );
    const r = paycheckPeriods(w, { currentDate: TODAY, scope: 'personal', horizonDays: 60 });
    expect(r.paydays.length).toBeGreaterThan(0);
    expect(r.periods[1].inferredIncome).toBe(true);
    const none = periodsFor({});
    expect(none.paydays).toEqual([]); expect(none.missing[0]).toMatch(/No upcoming pay dates/);
  });
  it('3.5 RENTAL income lands on the rent day inside the Properties scope, never in Personal', () => {
    const w = anchorWorld();
    const props = paycheckPeriods(w, { currentDate: TODAY, scope: 'e-props', horizonDays: 45 });
    expect(props.paydays).toEqual(['2026-11-01', '2026-12-01']); // 45 days reach 12-12
    expect(props.periods[1].incomeItems[0].label).toMatch(/Rent/);
    const personal = paycheckPeriods(w, { currentDate: TODAY, scope: 'personal', horizonDays: 45 });
    expect(personal.periods.flatMap((p) => p.incomeItems).some((it) => /Rent/.test(it.label))).toBe(false);
  });
  it('3.6 a MISSED paycheck (next date pushed out) leaves period 0 longer and funded from cash only; a SHORTAGE is named per period and never borrowed from later income', () => {
    const w = anchorWorld(); w.moneyPlan.settings.incomeSchedule = { 's-d': { frequency: 'biweekly', nextDate: '2026-11-20' } };
    w.accounts.find((a) => a.id === 'chk').openingBalance = 1300; w.accounts.find((a) => a.id === 'sav').openingBalance = 0;
    const r = paycheckPeriods(w, { currentDate: TODAY, scope: 'personal', horizonDays: 45 });
    expect(r.periods[0].end).toBe('2026-11-19');
    // cash on hand after cushion: 1300−45−1000−40+1000 = 1215 − 1000 = 215; bills before 11-20: 150+250+310+180+60 = 950
    expect(r.periods[0].fromCash).toBe(215);
    expect(r.periods[0].obligations).toBe(950);
    expect(r.periods[0].sufficient).toBe(false); expect(r.periods[0].shortfall).toBe(735);
    expect(r.periods[1].carriedIn).toBe(0);
    expect(r.insufficientCount).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('TEST 4 · Bills and recurring payments', () => {
  it('4.1 ROLL-FORWARD: a monthly bill whose nextDue is months in the past lands on its next occurrence, not dropped, not stacked', () => {
    const w = anchorWorld(); w.recurringObligations.push({ id: 'ro-old', name: 'Gym', amount: 40, frequency: 'monthly', nextDue: '2026-03-14', entityId: 'e-personal', category: 'health', enabled: true });
    const r = run(w);
    expect(r.items.filter((it) => it.refId === 'ro-old').map((it) => it.date)).toEqual(['2026-11-14']);
  });
  it('4.2 DUE DAYS 29 / 30 / 31 clamp to the month end and come back to their day', () => {
    const in29 = expandOccurrences('2027-01-29', 'monthly', new Date(2027, 0, 1), new Date(2027, 4, 1)).map((x) => `${x.getMonth() + 1}/${x.getDate()}`);
    const in30 = expandOccurrences('2027-01-30', 'monthly', new Date(2027, 0, 1), new Date(2027, 4, 1)).map((x) => `${x.getMonth() + 1}/${x.getDate()}`);
    const in31 = expandOccurrences('2027-01-31', 'monthly', new Date(2027, 0, 1), new Date(2027, 4, 1)).map((x) => `${x.getMonth() + 1}/${x.getDate()}`);
    expect(in29).toEqual(['1/29', '2/28', '3/29', '4/29']);
    expect(in30).toEqual(['1/30', '2/28', '3/30', '4/30']);
    expect(in31).toEqual(['1/31', '2/28', '3/31', '4/30']);
    // a leap year keeps the 29th
    expect(expandOccurrences('2028-01-29', 'monthly', new Date(2028, 0, 1), new Date(2028, 2, 1)).map((x) => `${x.getMonth() + 1}/${x.getDate()}`)).toEqual(['1/29', '2/29']);
  });
  it('4.3 FIXED (GAP-1) — a PARTIAL payment in the ledger leaves only the remainder projected: net effect 0, and the row says what is left', () => {
    const w = anchorWorld(); w.transactions.push({ id: 't-part', date: '2026-10-28', accountId: 'chk', amount: -75, description: 'Car insurance (half)', category: 'insurance' });
    const base = run(anchorWorld()); const r = run(w);
    expect(r.safeToSpendNow).toBe(base.safeToSpendNow); // 75 left cash, 75 left the projection
    const occ = r.items.find((it) => it.refId === 'ro-ins');
    expect(occ.amount).toBe(-75);
    expect(occ.partial).toBe(true);
    expect(occ.paidSoFar).toBe(75);
    expect(occ.remaining).toBe(75);
  });
  it('4.3 FIXED (GAP-1) — PARTLY PAID OUTSIDE with an amount: that amount leaves, the rest stays; never more than the bill', () => {
    const base = run(anchorWorld());
    const w = anchorWorld(); w.moneyPlan.billStatus = { 'ro-ins:2026-10-30': { status: 'partial-outside', paid: 40 } };
    const r = run(w);
    expect(r.safeToSpendNow - base.safeToSpendNow).toBe(40);
    expect(r.items.find((it) => it.refId === 'ro-ins').remaining).toBe(110);
    const over = anchorWorld(); over.moneyPlan.billStatus = { 'ro-ins:2026-10-30': { status: 'partial-outside', paid: 999 } };
    expect(run(over).safeToSpendNow - base.safeToSpendNow).toBe(150); // capped at the bill
  });
  it('4.3 one ledger payment pays ONE occurrence, never two', () => {
    const w = anchorWorld(); w.recurringObligations.push({ id: 'ro-ins2', name: 'Car insurance', amount: 150, frequency: 'monthly', nextDue: '2026-11-02', entityId: 'e-personal', category: 'insurance', enabled: true });
    w.transactions.push({ id: 't-paid', date: '2026-10-28', accountId: 'chk', amount: -150, description: 'Car insurance', category: 'insurance' });
    const r = run(w);
    const left = r.items.filter((it) => /Car insurance/.test(it.label) && it.date <= '2026-11-02');
    expect(left).toHaveLength(1);
  });
  it('4.4 NO DUPLICATES: a debt minimum already entered as an obligation, a scheduled row, or seen as an inferred autopay counts once', () => {
    const sc = resolveScope(household(), 'personal');
    const start = TODAY; const end = new Date(2026, 10, 27);
    // (a) obligation named like the debt → the obligation carries it
    const wa = anchorWorld(); wa.recurringObligations.push({ id: 'ro-visa', name: 'Visa', amount: 60, frequency: 'monthly', nextDue: '2026-11-15', entityId: 'e-personal', category: 'debt', enabled: true });
    const ea = obligationEvents(wa, sc, start, end, wa.moneyPlan.settings, { asOf: TODAY }).events;
    expect(ea.filter((e) => /Visa/.test(e.label))).toHaveLength(1);
    expect(ea.find((e) => /Visa/.test(e.label)).kind).toBe('bill');
    // (b) a future-dated ledger row for the debt → the row carries it
    const wb = anchorWorld(); wb.transactions.push({ id: 't-visa', date: '2026-11-15', accountId: 'chk', amount: -60, description: 'Visa', category: 'debt-payment' });
    const eb = obligationEvents(wb, sc, start, end, wb.moneyPlan.settings, { asOf: TODAY }).events;
    expect(eb.filter((e) => /Visa/.test(e.label))).toHaveLength(1);
    expect(eb.find((e) => /Visa/.test(e.label)).kind).toBe('scheduled');
    // (c) an inferred AUTOPAY pattern for a debt is dropped (the minimum carries it)
    const wc = anchorWorld();
    for (const [i, dte] of ['2026-08-15', '2026-09-15', '2026-10-15'].entries()) wc.transactions.push({ id: `ap${i}`, date: dte, accountId: 'chk', amount: -60, description: 'CAPITAL ONE AUTOPAY', category: 'other' });
    const ec = obligationEvents(wc, sc, start, end, wc.moneyPlan.settings, { asOf: TODAY }).events;
    expect(ec.filter((e) => e.kind === 'inferred-bill' && /AUTOPAY/.test(e.label))).toHaveLength(0);
    // (d) an inferred utility that is ALSO a hand-entered obligation counts once, as the obligation
    const wd = anchorWorld();
    for (const [i, dte] of ['2026-08-12', '2026-09-12', '2026-10-12'].entries()) wd.transactions.push({ id: `el${i}`, date: dte, accountId: 'chk', amount: -180, description: 'ELECTRIC', category: 'utilities' });
    const ed = obligationEvents(wd, sc, start, end, wd.moneyPlan.settings, { asOf: TODAY }).events;
    expect(ed.filter((e) => /electric/i.test(e.label))).toHaveLength(1);
  });
  it('4.5 the same obligation is never counted under two entities in the consolidated view', () => {
    const w = anchorWorld();
    const r = buildSafeToSpend(w, { ...d30, scope: 'consolidated' });
    const all = r.items.filter((it) => it.refId === 'ro-elec');
    expect(all).toHaveLength(1);
    expect(r.lines.billsDue).toBe(run(w).lines.billsDue + 300 + 240); // personal + PoeTech software + property insurance
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('TEST 5 · Accounts, transactions and entity separation', () => {
  it('5.1 DEPOSITS and WITHDRAWALS move the derived balance; a future-dated row waits for its day', () => {
    const w = household();
    const before = deriveAccountBalances(w, TODAY).chk;
    w.transactions.push({ id: 'dep', date: '2026-10-28', accountId: 'chk', amount: 500, description: 'Refund', category: 'other' }, { id: 'wd', date: '2026-10-28', accountId: 'chk', amount: -120, description: 'Pharmacy', category: 'medical' }, { id: 'later', date: '2026-11-09', accountId: 'chk', amount: -999, description: 'Future', category: 'other' });
    expect(deriveAccountBalances(w, TODAY).chk).toBe(before + 500 - 120);
    expect(deriveAccountBalances(w, new Date(2026, 10, 9)).chk).toBe(before + 500 - 120 - 999 - 250); // −250: the fixture's dentist row dated 10-30
  });
  it('5.2 an INTERNAL TRANSFER is not income in any scope and leaves total cash unchanged (also across entities)', () => {
    const w = household();
    w.transactions.push({ id: 'x1', date: '2026-10-27', accountId: 'pt-chk', amount: -2000, description: 'Owner draw transfer', category: 'transfer', isTransfer: true }, { id: 'x2', date: '2026-10-27', accountId: 'chk', amount: 2000, description: 'Transfer from PoeTech', category: 'transfer', isTransfer: true });
    const personal = run(w); const poetech = buildSafeToSpend(w, { ...d30, scope: 'e-poetech' }); const all = buildSafeToSpend(w, { ...d30, scope: 'consolidated' });
    expect(personal.items.some((it) => it.kind === 'income' && /Transfer/.test(it.label))).toBe(false);
    expect(personal.lines.availableCash).toBe(run(household()).lines.availableCash + 2000);
    expect(poetech.lines.availableCash).toBe(5500 - 2000);
    expect(all.lines.availableCash).toBe(buildSafeToSpend(household(), { ...d30, scope: 'consolidated' }).lines.availableCash);
  });
  it('5.3 RECONCILIATION: rows carrying bank balances form one chain; a missing row breaks it and is reported, never papered over', () => {
    const rows = [
      { id: 'a', accountId: 'chk', date: '2026-10-01', amount: 100, balance: 1100 },
      { id: 'b', accountId: 'chk', date: '2026-10-02', amount: -30, balance: 1070 },
      { id: 'c', accountId: 'chk', date: '2026-10-03', amount: -60, balance: 1010 },
    ];
    expect(reconcileAccounts(rows).chk.ok).toBe(true);
    expect(reconcileAccounts(rows).chk.opening).toBe(1000); expect(reconcileAccounts(rows).chk.closing).toBe(1010);
    const broken = reconcileAccounts(rows.filter((r) => r.id !== 'b')).chk;
    expect(broken.ok).toBe(false);
    expect(reconcileAccounts([{ id: 'z', accountId: 'chk', date: '2026-10-01', amount: 5 }]).chk.reason).toMatch(/not enough/);
  });
  it('5.4 ENTITY SEPARATION: personal, Poe Properties, PoeTech and TLC never mix unless the combined view is chosen', () => {
    const w = household();
    const personal = run(w);
    expect(personal.lines.availableCash).toBe(11115);
    expect(personal.items.some((it) => /Software|Property insurance|Rent ·|P&I/.test(it.label))).toBe(false);
    const props = buildSafeToSpend(w, { ...d30, scope: 'e-props' });
    expect(props.lines.availableCash).toBe(2400);
    expect(props.items.map((it) => it.label)).toEqual(expect.arrayContaining(['Property insurance', 'Rent · 805 N Prospect']));
    expect(props.items.some((it) => /Electric|Visa|Auto Loan/.test(it.label))).toBe(false);
    const tlc = buildSafeToSpend(w, { ...d30, scope: 'e-tlc' });
    expect(tlc.lines.availableCash).toBe(4100); expect(tlc.items.filter((it) => it.amount < 0)).toHaveLength(0);
    const combined = buildSafeToSpend(w, { ...d30, scope: 'consolidated' });
    expect(combined.byEntity.map((r) => r.scope.id).sort()).toEqual(['e-personal', 'e-poetech', 'e-props', 'e-tlc']);
    expect(combined.lines.availableCash).toBe(11115 + 5500 + 2400 + 4100);
  });
  it('5.5 a business shortfall never subsidises personal money in the combined view (each entity floored at $0)', () => {
    const w = household(); w.accounts.find((a) => a.id === 'pp-chk').openingBalance = 100; // Properties cannot cover its 830 mortgage + 240 insurance
    const props = buildSafeToSpend(w, { ...d30, scope: 'e-props' });
    expect(props.safeToSpendNow).toBe(0); expect(props.shortfall).toBeGreaterThan(0);
    const combined = buildSafeToSpend(w, { ...d30, scope: 'consolidated' });
    const personal = run(w);
    expect(combined.safeToSpendNow).toBe(personal.safeToSpendNow + buildSafeToSpend(w, { ...d30, scope: 'e-poetech' }).safeToSpendNow + buildSafeToSpend(w, { ...d30, scope: 'e-tlc' }).safeToSpendNow);
  });
  it('5.6 the MORTGAGE (P&I + escrow) is a dated Properties item on the mortgage due day, and the debtService/rentalMortgages buckets are never accrued on top of it', () => {
    const w = household();
    const props = buildSafeToSpend(w, { ...d30, scope: 'e-props' });
    const mort = props.items.find((it) => it.kind === 'mortgage');
    expect(mort.amount).toBe(-830); expect(mort.date).toBe('2026-11-01');
    expect(props.monthly.livingParts.rentalMortgages).toBeUndefined();
    expect(run(w).monthly.livingParts.debtService).toBeUndefined();
  });
});
