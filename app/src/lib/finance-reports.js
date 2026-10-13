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

// All income on ONE report — every external credit for this window, grouped by
// source/category, biggest group first, with the grand total in. Internal
// transfers excluded (a transfer credit is not income — same fix as
// incomeVsExpenseModel). Darrell 2026-07-21: "The KPI's should have all income
// on one report and all outputs etc... standard reports."
export function allIncomeModel(rows, meta) {
  const movements = rows.filter((r) => !isTransferTxn(r));
  const transferCount = rows.length - movements.length;
  const income = movements.filter((r) => (Number(r.amount) || 0) > 0);
  // groupByField already sorts groups biggest-first by |net|.
  const groups = groupByField(income, (r) => r.category, { labelFn: (k) => (k === '—' ? 'Uncategorized' : k) });
  return modelFromGroups('All income', meta, groups,
    `All money IN for this window, grouped by source/category.${transferCount ? ` ${transferCount} internal transfer${transferCount === 1 ? '' : 's'} excluded — money moved between your own accounts is not income.` : ''}`);
}

// All outputs on ONE report — every external debit for this window, grouped by
// category, biggest group first, with the grand total out (the expense side of
// the standard income/outputs pair). Internal transfers excluded.
export function allOutputsModel(rows, meta) {
  const movements = rows.filter((r) => !isTransferTxn(r));
  const transferCount = rows.length - movements.length;
  const expense = movements.filter((r) => (Number(r.amount) || 0) < 0);
  const groups = groupByField(expense, (r) => r.category, { labelFn: (k) => (k === '—' ? 'Uncategorized' : k) });
  return modelFromGroups('All outputs (expenses)', meta, groups,
    `All money OUT for this window, grouped by category.${transferCount ? ` ${transferCount} internal transfer${transferCount === 1 ? '' : 's'} excluded — money moved between your own accounts is not an expense.` : ''}`);
}

export function tax1099Model(rows, meta) {
  return modelFromGroups('1099 summary — totals by payee', meta,
    groupByField(rows, (r) => r.name),
    'Summary aid, not a filed 1099. Confirm 1099 eligibility, thresholds, and the correct form with your accountant.');
}

// ---- KPI reports — the money-flow signals every user should be able to pull ---
// Darrell 2026-07-20: "I want those top reports to be in the reports section as
// options so we always have the options every user will or should want to know…
// KPIs… training each user on how to see the money flow algorithms of their lives
// … seeing the unseen realm kind of." These three analyses already run on the
// Imported tab as panels; here they become first-class, exportable KPI reports so
// every user gets them — each carrying a plain-language teaching note (the note
// prints on the PDF; the dropdown shows the short `hint`). They take the
// ALREADY-COMPUTED analysis object the surface renders, so the report ties out to
// the screen exactly (DR-0076 — no re-derivation, no drift).

const wholeMoney = (n) => (n < 0 ? '−' : '+') + '$' + Math.abs(Math.round(Number(n) || 0)).toLocaleString('en-US');
const driverText = (drivers) => (drivers || []).map((d) => `${d.label} ${wholeMoney(d.amount)}`).join(', ');

// Material changes — every scope whose money moved ≥ the threshold, each already
// explained by its top payee drivers. `variance` is varianceReport(...) output.
export function materialChangesModel(variance, meta) {
  const v = variance || {};
  const rows = [];
  if (v.overall && v.overall.material) {
    rows.push({ scope: 'Overall (external)', net: v.overall.net, drivers: driverText(v.overall.drivers) });
  }
  for (const a of (v.accounts || []).filter((x) => x.material)) {
    rows.push({ scope: a.name || 'Account', net: a.net, drivers: driverText(a.drivers) });
  }
  return {
    title: 'KPI · Material changes (money movers)',
    meta,
    columns: [
      { key: 'scope', label: 'Account', type: 'text' },
      { key: 'net', label: 'Net move', type: 'money', align: 'right' },
      { key: 'drivers', label: 'What drove it', type: 'text' },
    ],
    groups: [{ label: `Movers ≥ $${Math.round(Number(v.threshold) || 500).toLocaleString('en-US')}`, rows }],
    note: 'KPI — Material changes. Every account whose money moved by the threshold or more in this window, each with the top payees that drove it. Read this one first: it turns a bare swing into "what changed, and why" — the few big movements that actually shaped the month, made visible.',
  };
}

// Unusual months — each month's true external in/out vs the family's OWN usual,
// flagging the ones far off. `anomalies` is baselineAnomalies(...) output (sorted).
export function unusualMonthsModel(anomalies, meta) {
  const rows = (anomalies || []).map((f) => ({
    month: f.label,
    metric: f.metric === 'in' ? 'Received' : 'Spent',
    amount: f.value,
    usual: f.baseline,
    offby: `${f.kind === 'excess' ? 'above' : 'below'} by $${Math.abs(Math.round(f.deviation)).toLocaleString('en-US')}${f.deviationPct != null ? ` (${f.deviationPct > 0 ? '+' : ''}${f.deviationPct}%)` : ''}`,
  }));
  return {
    title: 'KPI · Unusual months (off your usual)',
    meta,
    columns: [
      { key: 'month', label: 'Month', type: 'text' },
      { key: 'metric', label: 'In / Out', type: 'text' },
      { key: 'amount', label: 'This month', type: 'money', align: 'right' },
      { key: 'usual', label: 'Your usual', type: 'money', align: 'right' },
      { key: 'offby', label: 'Off by', type: 'text' },
    ],
    groups: [{ label: 'Months off your baseline', rows }],
    note: 'KPI — Unusual months. Each month\'s true external in/out measured against YOUR OWN usual (the median of your other months), flagging any off by more than 40% and $2,000. This is how an off month is caught on sight — a data glitch, a missed import, or a genuinely unusual season — instead of found late.',
  };
}

// Recurring payments — the payments that repeat on a rhythm. `recurring` is
// detectRecurring(...) output (each { label, cadenceLabel, count, amount, overdue }).
export function recurringPatternsModel(recurring, meta) {
  const list = recurring || [];
  const rows = list.map((g) => ({
    payee: g.label,
    cadence: g.cadenceLabel + (g.overdue ? ' · due' : ''),
    times: `${g.count}×`,
    amount: g.amount,
  }));
  const perCycle = list.reduce((s, g) => s + (Number(g.amount) || 0), 0);
  return {
    title: 'KPI · Recurring payments (your rhythms)',
    meta,
    columns: [
      { key: 'payee', label: 'Payee', type: 'text' },
      { key: 'cadence', label: 'Cadence', type: 'text' },
      { key: 'times', label: 'Seen', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'money', align: 'right' },
    ],
    groups: [{ label: `Repeating payments · ${wholeMoney(perCycle).replace('+', '')}/cycle`, rows }],
    note: 'KPI — Recurring payments. The payments that repeat on a rhythm: card autopays, subscriptions, loan payments — with how often and how much. This is the money-flow "algorithm" of your fixed obligations: what leaves like clockwork, so nothing recurring is ever a surprise and every rhythm is a decision you can see.',
  };
}

// The preset list handed to <ReportActions>. Each buildModel closes over the
// current windowed rows + meta the surface supplies. `kpis` (optional) carries the
// already-computed money-flow analyses; when present, the KPI reports are
// PREPENDED so the signals every user should see sit at the top of the menu.
export function financePresets(rows, meta, kpis = {}) {
  const base = [
    { key: 'monthly', label: 'Monthly summary', filenameBase: 'monthly-summary', buildModel: () => monthlySummaryModel(rows, meta) },
    { key: 'category', label: 'By category', filenameBase: 'by-category', buildModel: () => byCategoryModel(rows, meta) },
    { key: 'account', label: 'By account', filenameBase: 'by-account', buildModel: () => byAccountModel(rows, meta) },
    { key: 'all-income', label: 'All income', filenameBase: 'all-income', buildModel: () => allIncomeModel(rows, meta) },
    { key: 'all-outputs', label: 'All outputs (expenses)', filenameBase: 'all-outputs', buildModel: () => allOutputsModel(rows, meta) },
    { key: 'inc-exp', label: 'Income vs expense', filenameBase: 'income-vs-expense', buildModel: () => incomeVsExpenseModel(rows, meta) },
    { key: '1099', label: '1099 summary (by payee)', filenameBase: '1099-summary', buildModel: () => tax1099Model(rows, meta) },
  ];
  const kpiPresets = [];
  if (kpis.variance && kpis.variance.materialCount > 0) {
    kpiPresets.push({ key: 'kpi-material', kpi: true, label: 'Material changes (money movers)', hint: 'What moved $500+ and the payees that drove it', filenameBase: 'kpi-material-changes', buildModel: () => materialChangesModel(kpis.variance, meta) });
  }
  if (kpis.anomalies && kpis.anomalies.length > 0) {
    kpiPresets.push({ key: 'kpi-unusual', kpi: true, label: 'Unusual months vs your usual', hint: 'Months off your own baseline by 40% and $2k', filenameBase: 'kpi-unusual-months', buildModel: () => unusualMonthsModel(kpis.anomalies, meta) });
  }
  if (kpis.recurring && kpis.recurring.length > 0) {
    kpiPresets.push({ key: 'kpi-recurring', kpi: true, label: 'Recurring payments (your rhythms)', hint: 'Card autopays, subscriptions, loans — cadence + amount', filenameBase: 'kpi-recurring-payments', buildModel: () => recurringPatternsModel(kpis.recurring, meta) });
  }
  return [...kpiPresets, ...base];
}
