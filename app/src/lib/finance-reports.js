// =============================================================================
// finance-reports — report models for the financial surfaces (deterministic)
// =============================================================================
// Turns the scoped, filtered rows the user can see (buildImportedView output)
// into report models for the shared report-export primitive: the CURRENT view
// exactly as displayed, plus the one-click preset reports (monthly summary,
// by-category, by-account, income vs expense, 1099 summary by payee).
//
// Pure + deterministic (the caller passes `meta`, incl. the generated timestamp,
// so builders are testable). DISPLAY/EXPORT only. RLS/no-leak: every builder is
// fed ONLY the rows the surface already resolved for this user — no query here.
// All subtotals/totals come from the same totals()/groupBy* used on screen, so a
// report's numbers always tie out to the view.
// =============================================================================

import { groupByMonth, groupByField, sortByDate, totals, isTransferTxn } from './imported-view.js';

export const REPORT_COLUMNS = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'account', label: 'Account', type: 'text' },
  { key: 'payee', label: 'Payee / Description', type: 'text' },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'amount', label: 'Amount', type: 'money', align: 'right' },
];

function fmtDate(s) {
  if (!s) return '';
  const d = new Date(String(s).length === 10 ? s + 'T00:00:00' : s);
  if (Number.isNaN(d.getTime())) return String(s);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

// One view row (posted/institution/name/category/amount) -> one report row.
function toReportRow(r) {
  return {
    date: fmtDate(r.posted),
    account: r.institution || '',
    payee: r.name || '',
    category: r.category || '',
    amount: typeof r.amount === 'number' ? r.amount : Number(r.amount) || 0,
  };
}

// Assemble a model from already-built {label, rows(viewRows), totals} groups.
function modelFromGroups(title, meta, groups, note) {
  const all = groups.flatMap((g) => g.rows);
  return {
    title,
    meta,
    columns: REPORT_COLUMNS,
    groups: groups.map((g) => ({ label: g.label, rows: g.rows.map(toReportRow), subtotal: g.totals || totals(g.rows) })),
    total: totals(all),
    note,
  };
}

// The CURRENT view, exactly as displayed — the caller passes the SAME grouped.groups
// it renders (month or payee/category/account rollups, with subtotals) so the
// export mirrors the screen 1:1.
export function currentViewModel(groups, meta, title = 'Imported transactions') {
  return modelFromGroups(title, meta, groups);
}

// ---- Preset reports (each over the current filtered/period rows) -------------

export function monthlySummaryModel(rows, meta) {
  return modelFromGroups('Monthly summary', meta, groupByMonth(sortByDate(rows, 'desc')));
}

export function byCategoryModel(rows, meta) {
  return modelFromGroups('By category', meta,
    groupByField(rows, (r) => r.category, { labelFn: (k) => (k === '—' ? 'Uncategorized' : k) }));
}

export function byAccountModel(rows, meta) {
  return modelFromGroups('By account', meta,
    groupByField(rows, (r) => r.institution, { labelFn: (k) => (k === '—' ? 'Unlinked' : k) }));
}

export function incomeVsExpenseModel(rows, meta) {
  // Internal transfers are neither income nor expense — a pure sign split
  // reported a transfer credit as Income and its debit as Expense, inflating
  // both sides (2026-07-05 audit defect). Exclude them here (they still appear
  // in the register and the monthly/category views) and say so in the note.
  const movements = rows.filter((r) => !isTransferTxn(r));
  const transferCount = rows.length - movements.length;
  const income = movements.filter((r) => (Number(r.amount) || 0) > 0);
  const expense = movements.filter((r) => (Number(r.amount) || 0) < 0);
  const groups = [
    { label: 'Income', rows: sortByDate(income, 'desc'), totals: totals(income) },
    { label: 'Expenses', rows: sortByDate(expense, 'desc'), totals: totals(expense) },
  ].filter((g) => g.rows.length);
  return modelFromGroups('Income vs expense', meta, groups,
    transferCount
      ? `${transferCount} internal transfer${transferCount === 1 ? '' : 's'} excluded — money moved between your own accounts is neither income nor expense.`
      : undefined);
}

export function tax1099Model(rows, meta) {
  return modelFromGroups('1099 summary — totals by payee', meta,
    groupByField(rows, (r) => r.name),
    'Summary aid, not a filed 1099. Confirm 1099 eligibility, thresholds, and the correct form with your accountant.');
}

// The preset list handed to <ReportActions>. Each buildModel closes over the
// current windowed rows + meta the surface supplies.
export function financePresets(rows, meta) {
  return [
    { key: 'monthly', label: 'Monthly summary', filenameBase: 'monthly-summary', buildModel: () => monthlySummaryModel(rows, meta) },
    { key: 'category', label: 'By category', filenameBase: 'by-category', buildModel: () => byCategoryModel(rows, meta) },
    { key: 'account', label: 'By account', filenameBase: 'by-account', buildModel: () => byAccountModel(rows, meta) },
    { key: 'inc-exp', label: 'Income vs expense', filenameBase: 'income-vs-expense', buildModel: () => incomeVsExpenseModel(rows, meta) },
    { key: '1099', label: '1099 summary (by payee)', filenameBase: '1099-summary', buildModel: () => tax1099Model(rows, meta) },
  ];
}
