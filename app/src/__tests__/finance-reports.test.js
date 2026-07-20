// @vitest-environment node
//
// finance-reports — the preset report builders + the current-view model. Proves
// each report's subtotals reconcile to its grand total, and (the load-bearing
// claim) that a report's CSV Amount column sums to the SAME net the view shows —
// so a downloaded/printed report is never a different number than the screen.
import { describe, it, expect } from 'vitest';
import {
  currentViewModel, monthlySummaryModel, byCategoryModel, byAccountModel,
  incomeVsExpenseModel, tax1099Model, financePresets,
} from '../lib/finance-reports.js';
import { csvNetTotal } from '../lib/report-export.js';
import { totals, groupByField } from '../lib/imported-view.js';

const META = [{ label: 'Period', value: 'June 2026' }];
// View-shaped rows (buildImportedView output): posted/institution/name/category/amount.
const ROWS = [
  { id: 'u1', posted: '2026-06-15', institution: 'Chase 7206', name: 'University of IL Payroll', category: 'salary', amount: 2099.93 },
  { id: 'u2', posted: '2026-06-30', institution: 'Chase 7206', name: 'University of IL Payroll', category: 'salary', amount: 2099.93 },
  { id: 't1', posted: '2026-06-28', institution: 'Chase 7206', name: 'TLC Therapy', category: 'salary', amount: 1500 },
  { id: 'g1', posted: '2026-06-05', institution: 'Chase 3322', name: 'County Market', category: 'groceries', amount: -140.25 },
  { id: 'r1', posted: '2026-05-01', institution: 'Chase 3322', name: 'Rent', category: 'housing', amount: -1200 },
];
const NET = totals(ROWS).net; // 2099.93 + 2099.93 + 1500 - 140.25 - 1200 = 4359.61

const tieOut = (model) => {
  it('subtotals reconcile to the grand total, and CSV sums to the same net', () => {
    const summed = model.groups.reduce((s, g) => s + g.subtotal.net, 0);
    expect(Math.round(summed * 100) / 100).toBe(model.total.net);
    expect(csvNetTotal(model)).toBe(model.total.net);
  });
};

describe('monthlySummaryModel', () => {
  const m = monthlySummaryModel(ROWS, META);
  it('groups by month, newest first', () => {
    expect(m.groups.map((g) => g.label)).toEqual(['June 2026', 'May 2026']);
  });
  tieOut(m);
});

describe('byCategoryModel', () => {
  const m = byCategoryModel(ROWS, META);
  it('rolls up each category with its subtotal', () => {
    const salary = m.groups.find((g) => g.label === 'salary');
    expect(salary.subtotal.count).toBe(3);
    expect(salary.subtotal.net).toBeCloseTo(5699.86, 2);
  });
  tieOut(m);
});

describe('byAccountModel', () => {
  tieOut(byAccountModel(ROWS, META));
});

describe('incomeVsExpenseModel', () => {
  const m = incomeVsExpenseModel(ROWS, META);
  it('splits into Income and Expenses groups', () => {
    expect(m.groups.map((g) => g.label)).toEqual(['Income', 'Expenses']);
    expect(m.groups[0].subtotal.in).toBeCloseTo(5699.86, 2);   // all positive
    expect(m.groups[1].subtotal.out).toBeCloseTo(1340.25, 2);  // 140.25 + 1200
  });
  tieOut(m);
});

describe('incomeVsExpenseModel — internal transfers are NOT income or expense', () => {
  // The confirmed defect: a pure sign split reported a transfer credit as Income
  // and its debit as Expense. Both real markers are covered (category 'transfer'
  // from seed/BooksTransactions/categorize, isTransfer from the synced ledger).
  const XFER = [
    { id: 'x1', posted: '2026-06-12', institution: 'Chase 7206', name: 'Online Transfer to Savings', category: 'transfer', amount: -500 },
    { id: 'x2', posted: '2026-06-12', institution: 'Chase 3322', name: 'Online Transfer from Checking', isTransfer: true, amount: 500 },
  ];
  const m = incomeVsExpenseModel([...ROWS, ...XFER], META);
  it('excludes the transfer credit from Income and the transfer debit from Expenses', () => {
    const income = m.groups.find((g) => g.label === 'Income');
    const expenses = m.groups.find((g) => g.label === 'Expenses');
    expect(income.rows.some((r) => r.payee === 'Online Transfer from Checking')).toBe(false);
    expect(expenses.rows.some((r) => r.payee === 'Online Transfer to Savings')).toBe(false);
    expect(income.subtotal.in).toBeCloseTo(5699.86, 2);    // NOT 6199.86
    expect(expenses.subtotal.out).toBeCloseTo(1340.25, 2); // NOT 1840.25
  });
  it('names the exclusion honestly in the report note', () => {
    expect(m.note).toMatch(/transfer/i);
  });
  tieOut(m);
});

describe('tax1099Model — totals by payee, with an honest disclaimer', () => {
  const m = tax1099Model(ROWS, META);
  it('rolls repeated payees into one line and carries a not-a-filed-1099 note', () => {
    const uofi = m.groups.find((g) => g.label === 'University of IL Payroll');
    expect(uofi.subtotal.count).toBe(2);
    expect(m.note).toMatch(/not a filed 1099/i);
  });
  tieOut(m);
});

describe('currentViewModel — exports EXACTLY the grouped view passed in', () => {
  it('mirrors the surface groups and ties out to their total', () => {
    // Simulate the surface's grouped.groups (grouped by payee, as displayed).
    const groups = groupByField(ROWS, (r) => r.name);
    const model = currentViewModel(groups, META);
    expect(model.groups.map((g) => g.label)).toEqual(groups.map((g) => g.label));
    expect(model.total.net).toBe(Math.round(NET * 100) / 100);
    expect(csvNetTotal(model)).toBe(model.total.net);
  });
});

describe('financePresets — the one-click report menu', () => {
  it('offers monthly / category / account / income-vs-expense / 1099, each buildable', () => {
    const presets = financePresets(ROWS, META);
    expect(presets.map((p) => p.key)).toEqual(['monthly', 'category', 'account', 'inc-exp', '1099']);
    for (const p of presets) {
      const model = p.buildModel();
      expect(csvNetTotal(model)).toBe(model.total.net); // every preset reconciles
    }
  });
});

// --- KPI reports (Darrell 2026-07-20): the money-flow signals surfaced as reports.
import {
  materialChangesModel, unusualMonthsModel, recurringPatternsModel,
} from '../lib/finance-reports.js';
import { reportToCSV, reportToPrintHTML } from '../lib/report-export.js';

describe('materialChangesModel — movers with their drivers', () => {
  const variance = {
    threshold: 500,
    materialCount: 2,
    overall: { material: true, net: -7801, drivers: [{ label: 'UNIVERSITY PAYROLL', amount: 6819 }, { label: 'WF HOME MTG', amount: -5246 }] },
    accounts: [
      { accountId: 'a1', name: 'Chase Personal Checking', material: true, net: -1391, drivers: [{ label: 'CASH APP', amount: 6707 }] },
      { accountId: 'a2', name: 'Savings', material: false, net: 20, drivers: [] },
    ],
  };
  const m = materialChangesModel(variance, META);
  it('lists the overall mover and each material account, not the immaterial one', () => {
    expect(m.groups[0].rows.map((r) => r.scope)).toEqual(['Overall (external)', 'Chase Personal Checking']);
  });
  it('names the drivers in the row text', () => {
    expect(m.groups[0].rows[0].drivers).toContain('UNIVERSITY PAYROLL +$6,819');
    expect(m.groups[0].rows[0].drivers).toContain('WF HOME MTG −$5,246');
  });
  it('carries a teaching note and exports as CSV + print HTML', () => {
    expect(m.note).toMatch(/Material changes/);
    expect(reportToCSV(m)).toContain('Chase Personal Checking');
    expect(reportToPrintHTML(m)).toContain('KPI');
  });
});

describe('unusualMonthsModel — months off the usual', () => {
  const anomalies = [
    { month: '2026-04', label: 'May 2026', metric: 'out', value: 41219, baseline: 25669, kind: 'excess', deviation: 15550, deviationPct: 61 },
  ];
  const m = unusualMonthsModel(anomalies, META);
  it('renders the month, metric, this-vs-usual, and the off-by text', () => {
    const r = m.groups[0].rows[0];
    expect(r.month).toBe('May 2026');
    expect(r.metric).toBe('Spent');
    expect(r.amount).toBe(41219);
    expect(r.usual).toBe(25669);
    expect(r.offby).toBe('above by $15,550 (+61%)');
  });
  it('has a teaching note', () => { expect(m.note).toMatch(/Unusual months/); });
});

describe('recurringPatternsModel — the repeating rhythms', () => {
  const recurring = [
    { key: 'k1', label: 'WF HOME MTG AUTO PAY', cadenceLabel: 'monthly', count: 13, amount: 2623, overdue: false },
    { key: 'k2', label: 'GOODLEAP', cadenceLabel: 'monthly', count: 11, amount: 484, overdue: true },
  ];
  const m = recurringPatternsModel(recurring, META);
  it('lists each payee with cadence, count, amount and flags overdue', () => {
    expect(m.groups[0].rows[0]).toMatchObject({ payee: 'WF HOME MTG AUTO PAY', cadence: 'monthly', times: '13×', amount: 2623 });
    expect(m.groups[0].rows[1].cadence).toBe('monthly · due');
  });
  it('labels the group with the per-cycle total', () => {
    expect(m.groups[0].label).toContain('$3,107/cycle');
  });
});

describe('financePresets — KPI reports prepend when analyses are supplied', () => {
  it('adds the three KPI presets (first) only when their analysis is non-empty', () => {
    const kpis = {
      variance: { threshold: 500, materialCount: 1, overall: { material: true, net: -100, drivers: [] }, accounts: [] },
      anomalies: [{ month: '2026-04', label: 'May 2026', metric: 'out', value: 41219, baseline: 25669, kind: 'excess', deviation: 15550, deviationPct: 61 }],
      recurring: [{ key: 'k1', label: 'X', cadenceLabel: 'monthly', count: 3, amount: 100, overdue: false }],
    };
    const presets = financePresets(ROWS, META, kpis);
    expect(presets.slice(0, 3).map((p) => p.key)).toEqual(['kpi-material', 'kpi-unusual', 'kpi-recurring']);
    expect(presets.slice(0, 3).every((p) => p.kpi && p.hint)).toBe(true);
    // the standard 5 still follow
    expect(presets.slice(3).map((p) => p.key)).toEqual(['monthly', 'category', 'account', 'inc-exp', '1099']);
  });
  it('omits a KPI whose analysis is empty', () => {
    const presets = financePresets(ROWS, META, { variance: { materialCount: 0 }, anomalies: [], recurring: [] });
    expect(presets.some((p) => p.kpi)).toBe(false);
  });
});
