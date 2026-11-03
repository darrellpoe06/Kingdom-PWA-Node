// money-real-records.test.js — Safe to Spend reads the family's REAL records,
// never the shipped sample household's (Christina, 2026-11-03: "Correct the
// application logic so it uses verified financial information rather than
// sample data", and "Make sure all actual bills, debts, payment arrangements,
// and my personal mortgage are included in the appropriate calculations").
//
// Shapes measured on her own ledger: payroll from UNIVERSITY OF IL / State of
// Ill every two weeks; a WF mortgage autopay, collection arrangements paid by
// bill-pay, BG paid by Zelle; transfers to Poe Properties and TLC.
import { describe, it, expect } from 'vitest';
import { buildSafeToSpend, measuredEverydaySpending, resolveScope } from '../lib/safe-to-spend.js';
import { balanceCheckpointRow } from '../lib/financial-engineering.js';
import { isSampleSalary, isSampleOutflows, isSampleHousehold } from '../lib/sample-markers.js';

const TODAY = new Date(2026, 10, 3, 12); // 2026-11-03
const opts = (period = '30d', scope = 'personal') => ({ currentDate: TODAY, period, scope });
const SAMPLE_SALARIES = [
  { id: 'd-uiuc', who: 'Adam', source: 'Regional University salary', expected: 4200, actual: 4200, entityId: 'e-personal' },
  { id: 'c-state', who: 'Naomi', source: 'State (Guardianship)', expected: 5731, actual: 5731, entityId: 'e-personal' },
];
const SAMPLE_OUTFLOWS = { rentalMortgages: 7595, propertyUtilities: 2638, household: 2176, debtService: 8155, charitableGiving: 2700 };

function household() {
  const tx = []; let n = 0;
  const add = (date, amount, description, category = 'other') => tx.push({ id: `t${n++}`, date, accountId: 'chk', amount, description, category });
  for (const m of ['08', '09', '10']) {
    add(`2026-${m}-07`, 2099.93, 'UNIVERSITY OF IL PAYROLL PPD ID: 1234', 'salary');
    add(`2026-${m}-21`, 2099.93, 'UNIVERSITY OF IL PAYROLL PPD ID: 1234', 'salary');
    add(`2026-${m}-15`, -2622.83, 'WF HOME MTG AUTO PAY');
    add(`2026-${m}-07`, -300, `Online Payment 3${m}07 To Britt and Gaines ${m}/07`);
    add(`2026-${m}-07`, -750, 'Zelle payment to BG & Mom JPM99abc', 'transfer');
    add(`2026-${m}-20`, -500, 'Online Transfer to Poe Properties transaction#: 1');
    add(`2026-${m}-10`, -150, 'COUNTY MARKET CHAMPAIGN IL', 'groceries');
    add(`2026-${m}-24`, -150, 'COUNTY MARKET CHAMPAIGN IL', 'groceries');
  }
  add('2026-09-30', -2349.02, 'CAT CHAMPAIGN COUNTY, IL'); // a one-time county bill
  return {
    meta: { releaseLabel: 'MVP v1.5', bufferTarget: 1000 },
    entities: [{ id: 'e-personal', name: 'Personal', type: 'personal' }, { id: 'e-poeprops', name: 'Poe Properties', type: 'business' }],
    accounts: [{ id: 'chk', name: 'Chase 7206', type: 'checking', entityId: 'e-personal', balance: 0 }],
    transactions: [...tx, { id: 'cp', ...balanceCheckpointRow('chk', 6236.18, '2026-11-03', { basis: 'available' }) }],
    inflows: { salaries: SAMPLE_SALARIES.map((s) => ({ ...s })), rentals: [] },
    outflows: { ...SAMPLE_OUTFLOWS },
    recurringObligations: [],
    moneyPlan: { settings: { minCushion: 1000 } },
  };
}
const incomeOf = (r) => r.items.filter((i) => i.kind === 'income');
const billNamed = (r, re) => r.items.filter((i) => i.amount < 0 && re.test(i.label));

describe('the sample household is recognised exactly', () => {
  it('by its own ids, names and figures only; an edited entry is the family’s', () => {
    expect(isSampleSalary(SAMPLE_SALARIES[0])).toBe(true);
    expect(isSampleSalary({ ...SAMPLE_SALARIES[0], actual: 4300 })).toBe(true); // amount is not the signature; id + names are
    expect(isSampleSalary({ ...SAMPLE_SALARIES[0], who: 'Darrell' })).toBe(false);
    expect(isSampleOutflows(SAMPLE_OUTFLOWS)).toBe(true);
    expect(isSampleOutflows({ ...SAMPLE_OUTFLOWS, household: 3100 })).toBe(false);
    expect(isSampleHousehold({ meta: { releaseLabel: 'Sample · Family of 4' } })).toBe(true);
    expect(isSampleHousehold({ meta: { releaseLabel: 'MVP v1.5' } })).toBe(false);
  });
});

describe('income: the paychecks the family actually receives, never the sample’s', () => {
  it('ignores "Regional University salary (Adam)" and counts the real payroll under its real name (PROVEN TO CATCH)', () => {
    const r = buildSafeToSpend(household(), opts());
    const pay = incomeOf(r);
    expect(pay.length).toBeGreaterThan(0);
    expect(pay.every((p) => /^Paycheck · UNIVERSITY OF IL PAYROLL/.test(p.label))).toBe(true);
    expect(pay.every((p) => p.inferred && p.amount === 2099.93)).toBe(true);
    expect(r.assumptions.join(' ')).toMatch(/Regional University salary \(Adam\)" is the app's sample income, not yours/);
  });
  it('a salary with an entered pay schedule claims its deposits, so the paycheck is counted once', () => {
    const w = household();
    w.inflows.salaries = [{ id: 's-dp', who: 'Darrell', source: 'University of Illinois', actual: 4199.86, entityId: 'e-personal' }];
    w.moneyPlan.settings.incomeSchedule = { 's-dp': { frequency: 'biweekly', nextDate: '2026-11-04', amount: 2099.93 } };
    const pay = incomeOf(buildSafeToSpend(w, opts('14d')));
    expect(pay.map((p) => p.date)).toEqual(['2026-11-04']);
    expect(pay[0].inferred).toBe(false);
  });
  it('the sample households themselves keep their sample income', () => {
    const w = household(); w.meta.releaseLabel = 'Sample · Family of 4';
    expect(incomeOf(buildSafeToSpend(w, opts())).some((p) => /Regional University salary/.test(p.label))).toBe(true);
  });
});

describe('bills: the mortgage, arrangements and family obligations are counted', () => {
  it('a mortgage autopay, a collection arrangement and BG by Zelle are counted; a transfer to Poe Properties is not (PROVEN TO CATCH)', () => {
    const r = buildSafeToSpend(household(), opts());
    expect(billNamed(r, /WF HOME MTG/)).toHaveLength(1);
    expect(billNamed(r, /WF HOME MTG/)[0]).toMatchObject({ date: '2026-11-15', amount: -2622.83 });
    expect(billNamed(r, /Britt and Gaines/).length).toBeGreaterThan(0);
    expect(billNamed(r, /BG & Mom/).length).toBeGreaterThan(0);
    expect(billNamed(r, /Poe Properties/)).toHaveLength(0);
    expect(r.items.filter((i) => i.amount < 0).every((i) => i.assumed)).toBe(true); // flagged as not confirmed
  });
  it('a debt account whose minimum matches the autopay keeps it to ONE payment', () => {
    const w = household();
    w.accounts.push({ id: 'mtg', name: 'Wells Fargo Home', type: 'loan', entityId: 'e-personal', balance: 300000, minPayment: 2622.83, dueDay: 15, treatAsDebt: true });
    const r = buildSafeToSpend(w, opts());
    const nov15 = r.items.filter((i) => i.amount < 0 && i.date === '2026-11-15' && Math.abs(i.amount) === 2622.83);
    expect(nov15).toHaveLength(1);
  });
  it('a confirmed bill replaces its guess, and the guess is not counted again', () => {
    const w = household();
    w.recurringObligations.push({ id: 'b1', enabled: true, name: 'Britt and Gaines', paidAs: 'Britt and Gaines', amount: 300, frequency: 'monthly', nextDue: '2026-11-07', accountId: 'chk', entityId: 'e-personal', type: 'arrangement', verified: true });
    const r = buildSafeToSpend(w, opts());
    expect(billNamed(r, /Britt and Gaines/).map((i) => i.kind)).toEqual(['bill']);
  });
});

describe('everyday spending: measured from the family’s own payments, never the sample’s $2,176', () => {
  it('leaves out bills, transfers to their own accounts and one-time payments of $500 or more (PROVEN TO CATCH)', () => {
    const w = household();
    const sc = resolveScope(w, 'personal');
    const counted = new Set(['wf home mtg auto pay', 'britt and gaines', 'zelle to bg & mom']);
    const m = measuredEverydaySpending(w, sc, TODAY, counted);
    // Only the groceries: $300 a month over the window to the newest row.
    expect(m.oneOffs.map((o) => o.amount)).toEqual([2349.02]);
    expect(m.monthly).toBeGreaterThan(250);
    expect(m.monthly).toBeLessThan(400);
    const r = buildSafeToSpend(w, opts());
    expect(r.assumptions.join(' ')).toMatch(/household figures on file are the app/); // groceries on a steady rhythm are counted as a bill, so they leave the measured figure: once, never twice
    expect(r.monthly.livingParts.household || 0).not.toBe(2176);
  });
  it('a family that entered its own household figure keeps it', () => {
    const w = household(); w.outflows = { household: 3100 };
    expect(buildSafeToSpend(w, opts()).monthly.livingParts.household).toBeLessThanOrEqual(3100);
    expect(buildSafeToSpend(w, opts()).assumptions.join(' ')).not.toMatch(/household figures on file are the app/);
  });
});
