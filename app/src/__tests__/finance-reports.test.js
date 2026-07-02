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
