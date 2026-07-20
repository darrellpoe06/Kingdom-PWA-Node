// =============================================================================
// Imported — Books → Imported subview
// =============================================================================
// DETERMINISTIC, no n8n. Reads the app's already-synced verified ledger
// (data.transactions + data.accounts) straight from the DB — the same source
// Books → Tx and the derived balances use. Repointed 2026-07-01: the verified
// bank ledger became the source of truth (the Option-A load), so this surface
// no longer calls n8n workflow 18 / the Tailscale Funnel. It makes no network
// call at all — if the ledger has not synced yet it shows an honest empty state.
//
// The recurring refresh of the underlying ledger is a plain Python job on the
// NAS (infra/nas-finance-ingest/) that writes to the DB — no n8n, no login.
//
// 2026-07-01 (bank conventions): modeled on the patterns people already know
// from their bank app / Mint / YNAB / Chase, so a normal consumer instantly
// knows how to find last week or last month — no new pattern to learn:
//   · newest-first, grouped under STICKY month headers, each header showing that
//     month's in / out / net (a bank statement's section subtotals);
//   · a familiar segmented period control — This Month / Last Month / This Week /
//     30D / 90D / All / Custom — plus a ‹ month › quick-jump stepper;
//   · recognizable, tappable account + category filter chips and a search box;
//   · a running-balance column when a single account is in view (the statement
//     Balance column), anchored to that account's real opening balance;
//   · money-app color language: green in, red out.
// buildImportedView still shapes the ledger + the honest 30-day summary
// (pinned by imported-client-filters.test.js); the window / sort / grouping /
// running-balance math is the pure lib/imported-view.js (pinned by
// imported-view.test.js). A render smoke test (imported-render.test.jsx) mounts
// the real component and proves 2026 lands on top.
// =============================================================================

import React, { useMemo, useState } from 'react';
import {
  sortByDate, sortRows, effectiveRange, periodRange, filterByRange, groupByMonth, groupByField, totals,
  monthKeyOf, isMonthKey, monthRange, monthLabelOf, shiftMonthKey, runningBalances, periodLabel, isTransferTxn,
} from '../lib/imported-view.js';
import ReportActions from './ReportActions.jsx';
import { currentViewModel, financePresets } from '../lib/finance-reports.js';
import { loadReportUsage, bumpReportUsage, rankReports } from '../lib/report-usage.js';
import { varianceReport } from '../lib/balance-variance.js';
import { internalTransferIds, externalTotals } from '../lib/internal-transfers.js';
import { monthlyExternalTotals, baselineAnomalies } from '../lib/monthly-baseline.js';
import { findImportDuplicates } from '../lib/dedupe-imports.js';
import { loadLearnedDedupe, saveLearnedDedupe, learnFromCombine, suggestLearnedDuplicates } from '../lib/learned-dedupe.js';
import { detectRecurring } from '../lib/recurring-payments.js';
import { categoryLabel, TX_CATEGORIES, autoCategorizeSuggestions } from '../lib/categorize.js';

// How the register is grouped: by month (the statement default) or rolled up by a
// field so repeated payees/categories/accounts show a combined subtotal.
const GROUP_MODES = [
  ['month', 'Month'],
  ['payee', 'Payee'],
  ['category', 'Category'],
  ['account', 'Account'],
];

function formatAmount(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? '-' : ''}$${abs}`;
}

function formatDate(s) {
  if (!s) return '—';
  const d = new Date(s.length === 10 ? s + 'T00:00:00' : s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

const fmtMoney = (n) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n || 0)).toLocaleString();

// Familiar segmented period control (the standard set a budgeting app offers).
const PERIOD_SEGMENTS = [
  ['month', 'This Month'],
  ['lastMonth', 'Last Month'],
  ['week', 'This Week'],
  ['30d', '30D'],
  ['90d', '90D'],
  ['all', 'All'],
  ['custom', 'Custom'],
];

// PII gate — mirrors importedAllowed in poe-financial-mvp-v28.jsx. The rows here
// are the signed-in family's own RLS-scoped ledger, but we keep the conservative
// public-host guard so a shared/public browser never renders real bank rows.
function isPublicHostBrowser() {
  try {
    if (typeof window === 'undefined') return true;
    const host = window.location.hostname || '';
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return false;
    if (host.startsWith('100.')) return false;
    if (host.endsWith('.ts.net')) return false;
    if (host.endsWith('.local')) return false;
    if (/^192\.168\./.test(host)) return false;
    if (/^10\./.test(host)) return false;
    return true;
  } catch {
    return true;
  }
}

function hasOwnerSession() {
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!key) return false;
    const tok = JSON.parse(localStorage.getItem(key));
    const session = (tok && tok.currentSession) || tok;
    if (!session || !session.access_token) return false;
    if (typeof session.expires_at === 'number' && session.expires_at * 1000 <= Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

function isImportedViewAuthorized() {
  try {
    if (typeof window === 'undefined') return false;
    if (new URLSearchParams(window.location.search).has('demo')) return false;
    if (!localStorage.getItem('poe-current-profile')) return false;
    if (isPublicHostBrowser() && !hasOwnerSession()) return false;
    return true;
  } catch {
    return false;
  }
}

// Pure: shape the synced ledger into imported-view rows + a deterministic summary.
export function buildImportedView(data, filters, nowMs) {
  const accounts = Array.isArray(data?.accounts) ? data.accounts : [];
  const txns = Array.isArray(data?.transactions) ? data.transactions : [];
  const acctName = (id) => (accounts.find(a => a.id === id) || {}).name || id || '—';

  const rows = txns.map(t => ({
    id: t.id,
    posted: t.date,
    accountId: t.accountId ?? null,
    institution: acctName(t.accountId),
    name: t.description || '—',
    category: t.category || null,
    amount: typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0,
    pending: t.pending === true || t.status === 'pending',
    // Carry the synced ledger's transfer flag through so every downstream
    // consumer (totals, reports) can exclude internal transfers via
    // isTransferTxn — the category alone misses is_transfer-flagged rows.
    isTransfer: t.isTransfer === true,
  }));

  const institutions = [...new Set(rows.map(r => r.institution).filter(Boolean))].sort();
  const categories = [...new Set(rows.map(r => r.category).filter(Boolean))].sort();

  const q = (filters.search || '').trim().toLowerCase();
  const filtered = rows.filter(r => {
    if (filters.institution && r.institution !== filters.institution) return false;
    if (filters.category && (r.category || '') !== filters.category) return false;
    if (filters.since && String(r.posted || '') < filters.since) return false;
    if (q) {
      const hay = [r.name, r.category, r.institution].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Deterministic 30-day in/out over the ledger (honest, from posted rows).
  // Internal transfers still count as recent activity but are excluded from the
  // money sums — moving money between our own accounts is neither in nor out
  // (same exclusion as totals() in lib/imported-view.js).
  const cutoff = (nowMs || Date.now()) - 30 * 86400_000;
  let recentIn = 0, recentOut = 0, recentCount = 0;
  for (const r of rows) {
    const at = Date.parse(r.posted);
    if (Number.isNaN(at) || at < cutoff) continue;
    recentCount += 1;
    if (isTransferTxn(r)) continue;
    if (r.amount < 0) recentOut += Math.abs(r.amount); else recentIn += r.amount;
  }

  const dates = rows.map(r => r.posted).filter(Boolean).sort();
  return {
    rows, filtered, institutions, categories,
    total: rows.length,
    accountCount: institutions.length,
    recentIn, recentOut, recentCount,
    firstDate: dates[0] || null,
    lastDate: dates[dates.length - 1] || null,
  };
}

export default function Imported({ data = {}, deleteTransaction = null, recategorizePayee = null }) {
  const [filters, setFilters] = useState({ institution: '', category: '', search: '' });
  // View controls. period === null means "auto" (open on the newest month that
  // has data — the Mint pattern of landing on the latest activity). Any explicit
  // pick (segment or month-jump) sticks. sortDir defaults newest-first.
  const [period, setPeriod] = useState(null);
  const [range, setRange] = useState({ from: '', to: '' }); // custom range picker
  const [sortDir, setSortDir] = useState('desc');
  // Which column the table sorts by (date / account / payee / category / amount).
  // Clicking a column header sets it; clicking the active column flips direction.
  const [sortKey, setSortKey] = useState('date');
  const toggleSort = (key) => {
    if (key === sortKey) { setSortDir((d) => (d === 'desc' ? 'asc' : 'desc')); }
    else { setSortKey(key); setSortDir(key === 'date' || key === 'amount' ? 'desc' : 'asc'); }
  };
  const sortArrow = (key) => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '');
  // Which row is expanded to its detail drawer (receipt + full metadata).
  const [expandedId, setExpandedId] = useState(null);
  // How the register is grouped, and which group headers are collapsed.
  const [groupMode, setGroupMode] = useState('month');
  const [collapsed, setCollapsed] = useState(() => new Set());
  // The KPI money-insight panels (material changes / unusual months / recurring)
  // are grouped under one collapsible "KPIs · Standard reports" header so they
  // don't eat the top of the tab; collapsed by default, one shown at a time, and
  // ORDERED BY USAGE so the most-used surfaces first (Ari's recognition = the
  // frequency ranking; report-usage.js). `stdReportId` null = follow the ranking.
  const [stdReportsOpen, setStdReportsOpen] = useState(false);
  const [stdReportId, setStdReportId] = useState(null);
  const [reportUsage, setReportUsage] = useState(() => loadReportUsage());
  const pickStdReport = (id) => { setStdReportId(id); setReportUsage((u) => bumpReportUsage(id, undefined, u)); };
  const toggleGroup = (key) => setCollapsed((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const accounts = useMemo(() => (Array.isArray(data?.accounts) ? data.accounts : []), [data?.accounts]);
  const view = useMemo(() => buildImportedView(data, filters, Date.now()), [data, filters]);

  // Auto default: the month of the newest transaction (or All if none). Keeps the
  // surface opening on real, newest data instead of an empty current month.
  const autoPeriod = view.lastDate ? monthKeyOf(Date.parse(view.lastDate + 'T00:00:00')) : 'all';
  const activePeriod = period ?? autoPeriod;
  // Month shown by the ‹ month › stepper: the active month, else a sensible base.
  const stepperMonth = isMonthKey(activePeriod)
    ? activePeriod
    : (isMonthKey(autoPeriod) ? autoPeriod : monthKeyOf(Date.now()));

  // Resolve the active period to a concrete window.
  const { sinceMs, untilMs } = useMemo(() => {
    if (isMonthKey(activePeriod)) return monthRange(activePeriod);
    if (activePeriod === 'custom') return effectiveRange('all', range.from, range.to, Date.now());
    return periodRange(activePeriod, Date.now());
  }, [activePeriod, range.from, range.to]);

  // Window -> group -> sort. Every number here is summed from the rows it groups,
  // so each group's subtotal (in/out/net) always ties out to the overall period
  // total shown up top. By Month: newest-first statement sections. By a field
  // (Payee/Category/Account): repeated payees roll up into ONE group with a
  // combined subtotal, biggest-first, itemized rows still under each.
  const grouped = useMemo(() => {
    const windowed = filterByRange(view.filtered, sinceMs, untilMs);
    let groups;
    if (groupMode === 'month') {
      groups = groupByMonth(sortByDate(windowed, 'desc'));
    } else {
      const getKey = groupMode === 'payee' ? (r) => r.name
        : groupMode === 'account' ? (r) => r.institution
          : (r) => r.category;
      const labelFn = groupMode === 'category' ? (k) => (k ? categoryLabel(k) : '—') : (k) => k || '—';
      groups = groupByField(windowed, getKey, { labelFn });
    }
    // Rows within each group sort by the active column (date/account/payee/…).
    groups = groups.map((g) => ({ ...g, rows: sortRows(g.rows, sortKey, sortDir) }));
    return { groups, windowed, windowTotals: totals(windowed), matched: windowed.length };
  }, [view.filtered, sinceMs, untilMs, sortKey, sortDir, groupMode]);

  // Material-change watch (Darrell 2026-07-18: "always have a data-driven reason
  // for more or less than $500 in each account and overall, so we notice major
  // changes easily"). Over the SAME active window, decompose each account's net
  // move — and the overall external flow — into its biggest payee drivers, and
  // surface only the ones that cross the $500 materiality line, already explained.
  const variance = useMemo(
    () => varianceReport(data.transactions || [], accounts, { sinceMs, untilMs, threshold: 500, maxDrivers: 3 }),
    [data.transactions, accounts, sinceMs, untilMs]
  );

  // Internal circulation — money the family moves between its OWN accounts
  // (transfers, credit-card payments, LOC draws/paydowns) is not income or spend;
  // counting it across all accounts inflated gross in/out to ~$70-85k/mo (Darrell
  // 2026-07-18). Detect the matched pairs over the FULL ledger, then the tile
  // totals report TRUE external flow and name what was excluded (transparent, not
  // hidden). The register still lists every row.
  const internalIds = useMemo(
    () => internalTransferIds(data.transactions || [], accounts),
    [data.transactions, accounts]
  );
  const windowExternal = useMemo(
    () => externalTotals(grouped.windowed, internalIds),
    [grouped.windowed, internalIds]
  );

  // Month-over-month baseline watch (Darrell 2026-07-18: "monitor changes in the
  // totals month to month for excess or lack based on their usual amounts — this
  // would be caught"). Each month's TRUE external in/out vs the leave-one-out
  // median of the others; flag the months that deviate past 40% AND $2k so an off
  // month (a $69k-received glitch, a missed import) surfaces on sight.
  const anomalies = useMemo(() => {
    const months = monthlyExternalTotals(data.transactions || [], accounts);
    return [
      ...baselineAnomalies(months, { metric: 'in', tolerancePct: 0.4, floor: 2000 }),
      ...baselineAnomalies(months, { metric: 'out', tolerancePct: 0.4, floor: 2000 }),
    ].sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
  }, [data.transactions, accounts]);

  // Repetitive payment patterns (Darrell 2026-07-20: "repetitive patterns of
  // payments should also be highlighted"). Detect the family's recurring OUTGOING
  // payments — same payee, regular cadence, steady amount (a card autopay, a
  // subscription, a loan payment) — over the FULL ledger so a monthly rhythm is
  // seen even from a one-month window. The ids badge those rows in the register.
  const recurring = useMemo(() => detectRecurring(data.transactions || [], { direction: 'out', nowMs: Date.now() }), [data.transactions]);
  const recurringIds = useMemo(() => {
    const s = new Set();
    for (const g of recurring) for (const id of g.txIds) s.add(id);
    return s;
  }, [recurring]);

  // Category editing (Darrell 2026-07-20: "Users need to be able to update the
  // category and add more and the system should pull the ones it can determine
  // based on the data" — on the Imported tab, "where the sorting system is").
  // Editing reuses the SAME recategorizePayee the Tx tab uses, so one correction
  // learns the payee rule and back-applies to every matching row (+ syncs).
  const canEditCat = !!recategorizePayee;
  // The pick-list: the canonical set PLUS any category already in the ledger (a
  // raw import code or one the user CREATED earlier stays selectable).
  const categoryOptions = useMemo(() => {
    const seen = new Set(TX_CATEGORIES);
    for (const t of (data.transactions || [])) { const c = t && t.category; if (c) seen.add(String(c).toLowerCase()); }
    return [...seen];
  }, [data.transactions]);
  // What the deterministic categorizer can CONFIDENTLY determine for the rows still
  // sitting on 'other'/blank — the one-tap "pull them from the data" (learned rules win).
  const suggestions = useMemo(
    () => autoCategorizeSuggestions(data.transactions || [], data.categoryRules || null),
    [data.transactions, data.categoryRules]
  );
  const autoCatCount = suggestions.reduce((s, x) => s + x.count, 0);
  const runAutoCategorize = () => {
    if (!canEditCat || !suggestions.length) return;
    let n = 0;
    for (const s of suggestions) n += recategorizePayee(s.description, s.category) || 0;
    alert(`Auto-categorized ${n.toLocaleString()} transaction(s) the system could determine from the data. Every one is still editable if you want to change it.`);
  };
  // Set a row's category. '__new__' opens a prompt so the user can ADD a category;
  // a real category learns the payee rule and back-applies (recategorizePayee).
  const setRowCategory = (row, value) => {
    if (!canEditCat || !value) return;
    let category = value;
    if (value === '__new__') {
      const entered = (typeof prompt === 'function' ? prompt('New category name (letters, e.g. "tuition")') : '') || '';
      category = entered.trim().toLowerCase().replace(/[^a-z0-9- ]/g, '').replace(/\s+/g, '-');
      if (!category) return;
    }
    recategorizePayee(row.name, category);
  };

  // Combine duplicates the family SPOTS themselves — "without needing to update the
  // app" (Darrell 2026-07-20). The auto-remover only clears specific hardcoded
  // patterns (generic-type twins, balance-anchored copies); it is conservative by
  // design and leaves two real same-day/same-amount rows alone. This is the general,
  // runtime escape hatch: tick the rows that are the same charge, Combine keeps the
  // most complete one and removes the rest — no new detection rule (no app update)
  // is ever needed for a new duplicate shape.
  const canCombine = !!deleteTransaction;
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const toggleSelect = (id) => setSelectedIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const clearSelection = () => setSelectedIds(new Set());
  // The combine feature now LEARNS: a combine teaches which payees have duplicates,
  // so the SAME shape is suggested next time — no app update (Darrell 2026-07-20,
  // DR-0189). Device-local, fail-soft; the family still confirms every suggested
  // combine (learning only decides what to SUGGEST, never an auto-delete).
  const [learnedDedupe, setLearnedDedupe] = useState(() => loadLearnedDedupe());
  const teachDedupe = (rows) => {
    const next = learnFromCombine(learnedDedupe, rows);
    setLearnedDedupe(next);
    saveLearnedDedupe(next);
  };
  const combineSelected = () => {
    if (!canCombine || selectedIds.size < 2) return;
    const rows = view.rows.filter((r) => selectedIds.has(r.id));
    if (rows.length < 2) return;
    // Keep the most-informative row (longest description; tie → first), remove the rest.
    const keep = [...rows].sort((a, b) => (String(b.name || '').length - String(a.name || '').length))[0];
    const removeIds = rows.filter((r) => r.id !== keep.id).map((r) => r.id);
    const cents = (n) => Math.round((Number(n) || 0) * 100);
    const sameAmt = rows.every((r) => cents(r.amount) === cents(rows[0].amount));
    const msg = sameAmt
      ? `Combine these ${rows.length} rows into one? They are all ${formatAmount(rows[0].amount)} — this keeps “${keep.name}” and removes the ${removeIds.length} duplicate cop${removeIds.length === 1 ? 'y' : 'ies'}. Your totals drop by the removed copies. The system will remember this payee so it spots the same duplicate next time.`
      : `Heads up — the ${rows.length} selected rows are NOT all the same amount, so they may not be duplicates. Combining keeps “${keep.name}” and removes the other ${removeIds.length}. Continue anyway?`;
    if (typeof confirm === 'function' && !confirm(msg)) return;
    deleteTransaction(removeIds);
    if (sameAmt) teachDedupe(rows.map((r) => ({ ...r, description: r.name }))); // learn only from a confident (same-amount) combine
    clearSelection();
  };
  // What the learning now recognizes: other exact (payee+date+amount+account) repeats
  // from a payee the family already taught — a one-tap, still-confirmed combine.
  const learnedDupGroups = useMemo(
    () => suggestLearnedDuplicates((data.transactions || []).map((t) => ({ ...t })), learnedDedupe),
    [data.transactions, learnedDedupe]
  );
  const combineLearnedGroup = (g) => {
    if (!canCombine || !g.removeIds.length) return;
    if (typeof confirm === 'function' && !confirm(`Combine ${g.count} copies of “${g.label}” (${formatAmount(g.amount)}) into one? This keeps the fullest row and removes ${g.extra} duplicate cop${g.extra === 1 ? 'y' : 'ies'} — the system recognized these because you taught it this payee.`)) return;
    deleteTransaction(g.removeIds);
  };

  // One-tap duplicate cleanup (also on Books → Tx). Same detection everywhere: a
  // generic "DEBIT/CREDIT" twin of a real-payee row is removed, the real row kept
  // (Darrell 2026-07-19: "can't the system do this so we have no human errors?").
  const dupPreview = useMemo(() => findImportDuplicates(data.transactions || []), [data.transactions]);
  // Delete by re-deriving duplicates from the LIVE CLOUD rows and deleting their
  // CURRENT cloud ids (see BooksTransactions for the full rationale — stale local
  // cloud-ids after the churn made a local-id delete miss the cloud junk). AWAITS +
  // reports the ACTUAL deleted count (DR-0076).
  const removeDuplicateImports = async () => {
    if (!deleteTransaction || !dupPreview.count) return;
    if (!confirm(`Remove duplicate import(s)? These are generic "DEBIT/CREDIT" copies of transactions you already have with the real payee — the real rows are kept.`)) return;
    const { transactionsSync } = await import('../lib/transactions-sync.js'); // lazy: keep supabase out of pure-fn imports
    const cloud = await transactionsSync.fetchAll().catch(() => null);
    const plan = findImportDuplicates(cloud || data.transactions || []);
    if (!plan.count) { alert('No duplicates found in the cloud ledger — it is already clean. Refresh to see the current numbers.'); return; }
    const idSet = new Set(plan.removeIds);
    const uuids = (cloud || data.transactions || []).filter(t => idSet.has(t.id)).map(t => t.remoteUuid).filter(Boolean);
    const res = uuids.length ? await transactionsSync.deleteRows(uuids) : { deleted: 0 };
    deleteTransaction(plan.removeIds);
    alert(`Removed ${res.deleted || 0} of ${plan.count} duplicate(s) from the cloud ledger. Refresh — your totals should drop toward the true number and STAY there.`);
  };

  // Report meta (period + active filters + generated stamp) and the export models.
  // DISPLAY/EXPORT only; deterministic; built from the same rows on screen so a
  // downloaded/printed report ties out to the view (RLS-scoped — no leak).
  const reportMeta = () => ([
    { label: 'Period', value: periodLabel(activePeriod) },
    { label: 'Account', value: filters.institution || 'All accounts' },
    { label: 'Category', value: filters.category || 'All categories' },
    { label: 'Grouped by', value: GROUP_MODES.find(([k]) => k === groupMode)?.[1] || 'Month' },
    { label: 'Generated', value: new Date().toLocaleString('en-US') },
  ]);
  // The KPI reports (Material changes / Unusual months / Recurring payments) are
  // the SAME analyses shown as panels above — handed to the Reports menu so every
  // user can pull them as named reports (Darrell 2026-07-20: "those top reports…
  // as options… KPIs… training each user on how to see the money flow algorithms
  // of their lives"). Passing the already-computed objects ties the report to the
  // screen exactly (DR-0076).
  const presets = financePresets(grouped.windowed, reportMeta(), { variance, anomalies, recurring });

  // Running-balance column — only when a single account is in view AND it carries
  // a real opening balance to anchor to (truthful-or-absent). Computed over the
  // account's FULL ledger so balances stay correct inside any narrowed window.
  const singleAcct = filters.institution ? accounts.find(a => a.name === filters.institution) : null;
  const balByRow = useMemo(() => {
    if (!singleAcct) return null;
    const opening = singleAcct.openingBalance ?? singleAcct.balance;
    if (opening == null || Number.isNaN(Number(opening))) return null;
    const acctRows = view.rows.filter(r => r.accountId === singleAcct.id);
    return runningBalances(acctRows, Number(opening));
  }, [singleAcct, view.rows]);
  const showBalance = !!balByRow;

  const chipCls = (active) => `px-2.5 py-1 text-[0.6875rem] rounded-full border whitespace-nowrap ${active ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`;

  // Gate denied. This must render a CLEARLY VISIBLE, themed, self-explaining card
  // — never the old thin low-contrast strip, which on the OLED-black (Midnight)
  // theme was indistinguishable from a BROKEN blank tab (the 2026-07-19 report).
  // A denied state that looks blank is a verification failure in the UI itself:
  // it says WHY it is empty and WHAT to do. Pinned by imported-render.test.jsx.
  if (!isImportedViewAuthorized()) {
    return (
      <div className="space-y-3" data-surface="imported">
        <h2 className="text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontSize: '1.5rem', fontWeight: 600 }}>
          Imported transactions
        </h2>
        <div className="border border-[#E8E4DC] bg-white p-6 text-center space-y-2">
          <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            Imported transactions are private to each family and show only when you are signed in on this device with your own data loaded.
          </p>
          <p className="text-[0.75rem] text-[#5A5751]">
            Sign in with your family email on this device, then open <strong>Books → Imported</strong> again. Nothing here depends on any workflow being reachable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-surface="imported">
      <div>
        <h2 className="text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontSize: '1.5rem', fontWeight: 600 }}>
          Imported transactions
        </h2>
        <p className="text-[0.75rem] text-[#5A5751] mt-1">
          Read-only view of the bank data imported into your ledger. Source: your synced app database (the verified upload) — refreshed by a deterministic Python job on the NAS. No n8n.
        </p>
      </div>

      {view.total === 0 ? (
        <div className="border border-[#E8E4DC] bg-white p-6 text-center">
          <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            No imported transactions have synced to this device yet. Upload statements in the <strong>Tx</strong> tab, or wait for the ledger to sync — this view fills in automatically. It never depends on any workflow being reachable.
          </p>
        </div>
      ) : (
        <>
          {/* Account overview (unchanged): totals + honest rolling-30-day in/out. */}
          {/* Tiles reflect the SELECTED WINDOW (grouped.windowTotals), not a fixed
              30-day snapshot — so In/Out/Net move as you change month/period. The
              old fixed "· 30d" tiles read the same static number on every month. */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Transactions</div>
              <div className="text-lg font-medium">{grouped.matched.toLocaleString()}</div>
              <div className="text-[0.5625rem] text-[#5A5751]">of {view.total.toLocaleString()} total</div>
            </div>
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D]">In · {periodLabel(activePeriod)}</div>
              <div className="text-lg font-medium" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmtMoney(windowExternal.in)}</div>
              {windowExternal.internalIn > 0 && <div className="text-[0.5625rem] text-[#5A5751]">+ {fmtMoney(windowExternal.internalIn)} internal (excluded)</div>}
            </div>
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#B85838]">Out · {periodLabel(activePeriod)}</div>
              <div className="text-lg font-medium" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmtMoney(windowExternal.out)}</div>
              {windowExternal.internalOut > 0 && <div className="text-[0.5625rem] text-[#5A5751]">+ {fmtMoney(windowExternal.internalOut)} internal (excluded)</div>}
            </div>
            <div className="border border-[#E8E4DC] bg-white p-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Net · {periodLabel(activePeriod)}</div>
              <div className={`text-lg font-medium ${windowExternal.net < 0 ? 'text-[#B85838]' : 'text-[#166534]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmtMoney(windowExternal.net)}</div>
            </div>
          </div>

          {/* One-tap duplicate cleanup — the system removes the "DEBIT/CREDIT"
              twin copies itself, no account-by-account reset (2026-07-19). */}
          {deleteTransaction && dupPreview.count > 0 && (
            <div className="border border-[#B85838] bg-[#FAF8F4] p-3 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[0.75rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                Found <strong>{dupPreview.count.toLocaleString()}</strong> duplicate imported row{dupPreview.count === 1 ? '' : 's'} — generic “DEBIT/CREDIT” copies of transactions you already have with the real payee.
              </span>
              <button type="button" onClick={removeDuplicateImports} className="text-[0.6875rem] uppercase tracking-wider px-3 py-2 bg-[#5A6E3D] text-white font-semibold hover:bg-[#1A1815] focus:outline focus:outline-2 focus:outline-[#1A1815] whitespace-nowrap">
                ✓ Remove {dupPreview.count.toLocaleString()} duplicate{dupPreview.count === 1 ? '' : 's'}
              </button>
            </div>
          )}

          {/* Learned duplicates — the system recognized these because you COMBINED
              this payee before, so it now spots the same shape with no app update
              (Darrell 2026-07-20, DR-0189). Still one tap + confirm, never auto. */}
          {canCombine && learnedDupGroups.length > 0 && (
            <div className="border border-[#B85838] bg-[#FAF8F4] p-3 space-y-2">
              <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838]">Duplicates the system learned from you</div>
              {learnedDupGroups.slice(0, 6).map((g) => (
                <div key={g.signature} className="flex items-center justify-between gap-2 flex-wrap text-[0.75rem] text-[#1A1815]">
                  <span className="truncate"><span className="font-semibold">{g.label}</span> <span className="text-[#5A5751]">· {formatAmount(g.amount)} · {g.count} copies</span></span>
                  <button type="button" onClick={() => combineLearnedGroup(g)} className="text-[0.6875rem] uppercase tracking-wider px-3 py-1.5 bg-[#B85838] text-white font-semibold hover:bg-[#1A1815] focus:outline focus:outline-2 focus:outline-[#1A1815] whitespace-nowrap">Combine {g.count}</button>
                </div>
              ))}
              {learnedDupGroups.length > 6 && <div className="text-[0.5625rem] text-[#5A5751] italic">+ {learnedDupGroups.length - 6} more learned group{learnedDupGroups.length - 6 === 1 ? '' : 's'}</div>}
            </div>
          )}

          {/* Standard reports — the money-insight panels (material changes,
              unusual months, recurring payments) are grouped under ONE collapsible
              header and shown one at a time, so they stop eating the top of the tab
              (Darrell 2026-07-20). Collapsed by default; each panel is data-driven
              off the live ledger — no static data (DR-0061 / P15). */}
          {(() => {
            const stdReports = [];
            if (variance.materialCount > 0) stdReports.push({
              id: 'material', label: 'Material changes',
              node: (
                <div className="border border-[#B85838] bg-[#FAF8F4] p-3 space-y-2">
                  <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838]">
                    Material changes · {periodLabel(activePeriod)} · ≥ {fmtMoney(variance.threshold)}
                  </div>
                  {variance.overall.material && (
                    <div className="text-[0.75rem] text-[#1A1815]">
                      <span className="font-semibold">Overall (external): </span>
                      <span className={variance.overall.net < 0 ? 'text-[#B85838]' : 'text-[#166534]'} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{variance.overall.net < 0 ? '−' : '+'}{fmtMoney(Math.abs(variance.overall.net))}</span>
                      {variance.overall.drivers.length > 0 && (
                        <span className="text-[#5A5751]"> — driven by {variance.overall.drivers.map((d) => `${d.label} ${d.amount < 0 ? '−' : '+'}${fmtMoney(Math.abs(d.amount))}`).join(', ')}</span>
                      )}
                    </div>
                  )}
                  {variance.accounts.filter((a) => a.material).map((a) => (
                    <div key={a.accountId} className="text-[0.75rem] text-[#1A1815]">
                      <span className="font-semibold">{a.name}: </span>
                      <span className={a.net < 0 ? 'text-[#B85838]' : 'text-[#166534]'} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{a.net < 0 ? '−' : '+'}{fmtMoney(Math.abs(a.net))}</span>
                      {a.drivers.length > 0 && (
                        <span className="text-[#5A5751]"> — driven by {a.drivers.map((d) => `${d.label} ${d.amount < 0 ? '−' : '+'}${fmtMoney(Math.abs(d.amount))}`).join(', ')}</span>
                      )}
                    </div>
                  ))}
                </div>
              ),
            });
            if (anomalies.length > 0) stdReports.push({
              id: 'unusual', label: 'Unusual months',
              node: (
                <div className="border border-[#B85838] bg-[#FAF8F4] p-3 space-y-1">
                  <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838]">Unusual months vs the usual</div>
                  {/* Full list on its tab, grows to whatever the data becomes
                      (Darrell 2026-07-20; no cap on an opt-in report). */}
                  {anomalies.map((f) => (
                    <div key={`${f.month}-${f.metric}`} className="text-[0.75rem] text-[#1A1815]">
                      <span className="font-semibold">{f.label}</span> · {f.metric === 'in' ? 'received' : 'spent'}{' '}
                      <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmtMoney(f.value)}</span>{' '}
                      <span className="text-[#5A5751]">vs usual {fmtMoney(f.baseline)} — {f.kind === 'excess' ? 'above' : 'below'} by {fmtMoney(Math.abs(f.deviation))}{f.deviationPct != null ? ` (${f.deviationPct > 0 ? '+' : ''}${f.deviationPct}%)` : ''}</span>
                    </div>
                  ))}
                </div>
              ),
            });
            if (recurring.length > 0) stdReports.push({
              id: 'recurring', label: 'Recurring payments',
              node: (
                <div className="border border-[#5A6E3D] bg-[#FAF8F4] p-3 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D]">Recurring payments · repeating patterns</div>
                    <div className="text-[0.5625rem] text-[#5A5751]">{recurring.length} pattern{recurring.length === 1 ? '' : 's'} · {fmtMoney(recurring.reduce((s, g) => s + g.amount, 0))}/cycle</div>
                  </div>
                  {/* The FULL list on its tab — every recurring obligation the
                      frequency detector found, and it grows to whatever the data
                      becomes; no cap now that it's one opt-in report at a time
                      (Darrell 2026-07-20). */}
                  {recurring.map((g) => (
                    <div key={g.key} className="flex items-baseline justify-between gap-2 text-[0.75rem] text-[#1A1815]">
                      <span className="truncate"><span className="font-semibold">{g.label}</span> <span className="text-[#5A5751]">· {g.cadenceLabel} · {g.count}×{g.overdue ? ' · due' : ''}</span></span>
                      <span className="shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmtMoney(g.amount)}</span>
                    </div>
                  ))}
                </div>
              ),
            });
            if (stdReports.length === 0) return null;
            // Ordered by USAGE so the most-used KPI surfaces first (learning
            // method, Darrell 2026-07-20); registry order is only the tiebreak.
            const ranked = rankReports(stdReports, reportUsage);
            const active = ranked.find((r) => r.id === stdReportId) || ranked[0];
            const openReports = () => {
              setStdReportsOpen((o) => {
                // Opening counts as a "use" of the report shown (the most-used,
                // or the one the family last picked) — that keeps the ranking live.
                if (!o) setReportUsage((u) => bumpReportUsage(active.id, undefined, u));
                return !o;
              });
            };
            return (
              <div className="border border-[#E8E4DC] bg-[#FAF8F4]">
                <button
                  type="button"
                  onClick={openReports}
                  aria-expanded={stdReportsOpen}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#1A1815]"
                >
                  <span className="text-[0.6875rem] tracking-[0.12em] text-[#1A1815] font-semibold">KPI&rsquo;s &middot; Standard reports</span>
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[0.5625rem] text-[#5A5751] truncate hidden sm:inline">{ranked.map((r) => r.label).join(' · ')}</span>
                    <span className="text-[0.5625rem] text-[#5A5751] whitespace-nowrap">{ranked.length} report{ranked.length === 1 ? '' : 's'}</span>
                    <span className="text-[#5A5751] text-xs" aria-hidden="true">{stdReportsOpen ? '▾' : '▸'}</span>
                  </span>
                </button>
                {stdReportsOpen && (
                  <div className="px-3 pb-3 pt-1 space-y-2">
                    {/* Teach the CONCEPT for learners (Darrell 2026-07-20): explain
                        what a KPI is and what each report reveals — context, not a
                        narration of the obvious UI mechanics. */}
                    <p className="text-[0.6875rem] text-[#5A5751] leading-snug">
                      <span className="font-semibold text-[#1A1815]">KPI</span> means <span className="italic">key performance indicator</span> &mdash; the few numbers that tell you the most about your money at a glance. These read from your own ledger: <span className="font-semibold">Material changes</span> (the biggest moves and what drove them), <span className="font-semibold">Unusual months</span> (when a month ran far off your normal), and <span className="font-semibold">Recurring payments</span> (what repeats every cycle, so nothing hides).
                    </p>
                    {ranked.length > 1 && (
                      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="KPI&rsquo;s · Standard reports">
                        {ranked.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            role="tab"
                            aria-selected={active.id === r.id}
                            onClick={() => pickStdReport(r.id)}
                            className={`text-[0.625rem] uppercase tracking-wider px-2.5 py-1 border ${active.id === r.id ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751] hover:bg-white'}`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {active.node}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Auto-categorize — the system pulls every category it can determine from
              the data, in one tap (learned per-payee rules win). Only shows when
              there's uncategorized work it can confidently do (Darrell 2026-07-20). */}
          {canEditCat && autoCatCount > 0 && (
            <div className="border border-[#5A6E3D] bg-[#FAF8F4] p-3 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[0.75rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                The system can categorize <strong>{autoCatCount.toLocaleString()}</strong> uncategorized transaction{autoCatCount === 1 ? '' : 's'} from the data — across {suggestions.length} payee{suggestions.length === 1 ? '' : 's'}. Every one stays editable.
              </span>
              <button type="button" onClick={runAutoCategorize} className="text-[0.6875rem] uppercase tracking-wider px-3 py-2 bg-[#5A6E3D] text-white font-semibold hover:bg-[#1A1815] focus:outline focus:outline-2 focus:outline-[#1A1815] whitespace-nowrap">
                Auto-categorize {autoCatCount.toLocaleString()}
              </button>
            </div>
          )}

          {/* Combine duplicates the family selected — the runtime escape hatch for
              dupes the auto-remover conservatively leaves alone (Darrell 2026-07-20). */}
          {canCombine && selectedIds.size >= 2 && (
            <div className="border border-[#B85838] bg-[#FAF8F4] p-3 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[0.75rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                <strong>{selectedIds.size}</strong> rows selected — combine the duplicates you found into one (keeps the most complete row, removes the rest).
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={clearSelection} className="text-[0.6875rem] uppercase tracking-wider px-3 py-2 border border-[#5A5751] text-[#5A5751] hover:bg-white">Clear</button>
                <button type="button" onClick={combineSelected} className="text-[0.6875rem] uppercase tracking-wider px-3 py-2 bg-[#B85838] text-white font-semibold hover:bg-[#1A1815] focus:outline focus:outline-2 focus:outline-[#1A1815]">Combine {selectedIds.size}</button>
              </div>
            </div>
          )}

          {/* Segmented period control + ‹ month › quick-jump — the standard bank /
              budgeting-app time picker. */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap rounded-md border border-[#E8E4DC] overflow-hidden" role="group" aria-label="Time period">
              {PERIOD_SEGMENTS.map(([key, label], i) => {
                const active = activePeriod === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setPeriod(key); }}
                    aria-pressed={active}
                    className={`px-3 py-1 text-[0.6875rem] uppercase tracking-wider ${i > 0 ? 'border-l border-[#E8E4DC]' : ''} ${active ? 'bg-[#1A1815] text-white' : 'bg-white text-[#5A5751] hover:bg-[#FAF8F4]'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="inline-flex items-center rounded-md border border-[#E8E4DC] bg-white">
              <button type="button" aria-label="Previous month" onClick={() => setPeriod(shiftMonthKey(stepperMonth, -1))} className="px-2 py-1 text-[#5A5751] hover:bg-[#FAF8F4]">‹</button>
              <button type="button" onClick={() => setPeriod(stepperMonth)} aria-pressed={isMonthKey(activePeriod)} className={`px-2 py-1 text-[0.6875rem] min-w-[6.5rem] text-center ${isMonthKey(activePeriod) ? 'text-[#1A1815] font-medium' : 'text-[#5A5751]'}`} style={{ fontFamily: '"Fraunces", serif' }}>{monthLabelOf(stepperMonth)}</button>
              <button type="button" aria-label="Next month" onClick={() => setPeriod(shiftMonthKey(stepperMonth, 1))} className="px-2 py-1 text-[#5A5751] hover:bg-[#FAF8F4]">›</button>
            </div>
            <button
              type="button"
              onClick={() => setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))}
              className="px-2.5 py-1 text-[0.6875rem] uppercase tracking-wider border border-[#E8E4DC] bg-white text-[#1A1815] hover:bg-[#FAF8F4] rounded-md"
              aria-label="Toggle date sort order"
              title={sortDir === 'desc' ? 'Newest first (tap for oldest first)' : 'Oldest first (tap for newest first)'}
            >
              {sortDir === 'desc' ? '↓ Newest' : '↑ Oldest'}
            </button>
          </div>

          {/* Custom range — revealed only when the Custom segment is chosen. */}
          {activePeriod === 'custom' && (
            <div className="flex flex-wrap items-center gap-1 text-[0.625rem] text-[#5A5751]">
              <label className="uppercase tracking-wider">From</label>
              <input type="date" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} className="border border-[#1A1815] px-2 py-1 text-xs bg-white" aria-label="Custom range from" />
              <label className="uppercase tracking-wider">To</label>
              <input type="date" value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} className="border border-[#1A1815] px-2 py-1 text-xs bg-white" aria-label="Custom range to" />
              {(range.from || range.to) && (
                <button type="button" onClick={() => setRange({ from: '', to: '' })} className="px-2 py-1 uppercase tracking-wider border border-[#E8E4DC] hover:border-[#1A1815]">Clear</button>
              )}
            </div>
          )}

          {/* Account filter chips (tappable). */}
          {view.institutions.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter by account">
              <button type="button" onClick={() => setFilters(f => ({ ...f, institution: '' }))} className={chipCls(!filters.institution)}>All accounts</button>
              {view.institutions.map(inst => (
                <button key={inst} type="button" onClick={() => setFilters(f => ({ ...f, institution: inst }))} className={chipCls(filters.institution === inst)}>{inst}</button>
              ))}
            </div>
          )}

          {/* Category filter chips (tappable, horizontally scrollable). */}
          {view.categories.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter by category">
              <button type="button" onClick={() => setFilters(f => ({ ...f, category: '' }))} className={chipCls(!filters.category)}>All categories</button>
              {view.categories.map(cat => (
                <button key={cat} type="button" onClick={() => setFilters(f => ({ ...f, category: cat }))} className={chipCls(filters.category === cat)}>{categoryLabel(cat)}</button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="search"
              placeholder="Search payee / category…"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="border border-[#1A1815] px-2 py-1 text-xs bg-white flex-1 min-w-[11.25rem]"
              aria-label="Search transactions"
            />
          </div>

          {/* Group by — Month (statement sections) or roll up repeated
              payees/categories/accounts into ONE subtotaled group. */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Group by</span>
            <div className="inline-flex rounded-md border border-[#E8E4DC] overflow-hidden" role="group" aria-label="Group transactions by">
              {GROUP_MODES.map(([key, label], i) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setGroupMode(key); setCollapsed(new Set()); }}
                  aria-pressed={groupMode === key}
                  className={`px-3 py-1 text-[0.6875rem] uppercase tracking-wider ${i > 0 ? 'border-l border-[#E8E4DC]' : ''} ${groupMode === key ? 'bg-[#1A1815] text-white' : 'bg-white text-[#5A5751] hover:bg-[#FAF8F4]'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Download + Print — the current filtered/grouped view exports exactly
              as displayed (CSV = raw data, Print = PDF-ready), plus one-click
              preset reports. Deterministic; export-only; RLS-scoped. */}
          <ReportActions
            buildModel={() => currentViewModel(grouped.groups, reportMeta())}
            filenameBase="imported-transactions"
            presets={presets}
          />

          <div className="text-[0.625rem] text-[#5A5751]">
            Showing {grouped.matched.toLocaleString()} of {view.total.toLocaleString()} transactions
            {' · '}<span className="text-[#166534]">in {fmtMoney(windowExternal.in)}</span>
            {' · '}<span className="text-[#B85838]">out {fmtMoney(windowExternal.out)}</span>
            {' · '}<span className={windowExternal.net < 0 ? 'text-[#B85838]' : 'text-[#166534]'}>net {fmtMoney(windowExternal.net)}</span>
            {windowExternal.internalCount > 0 ? ` · excludes ${fmtMoney(windowExternal.internalIn)} internal transfers` : ''}
            {view.firstDate ? ` · ledger spans ${formatDate(view.firstDate)} – ${formatDate(view.lastDate)}` : ''}
          </div>

          {/* Continuous, newest-first register with STICKY month headers — the
              bank-statement pattern. Each header carries its month's in/out/net. */}
          {grouped.matched === 0 ? (
            <div className="border border-[#E8E4DC] bg-white px-2 py-6 text-center text-[0.75rem] text-[#5A5751]">
              No transactions in this period. Try “All”, step to another month, or clear the filters.
            </div>
          ) : (
            <div className="border border-[#E8E4DC] bg-white">
              {grouped.groups.map(g => {
                const isCollapsed = collapsed.has(g.key);
                return (
                <div key={g.key}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(g.key)}
                    aria-expanded={!isCollapsed}
                    className="sticky top-0 z-10 w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#FAF8F4] border-y border-[#E8E4DC] text-left hover:bg-white"
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="text-[#5A5751] text-xs" aria-hidden="true">{isCollapsed ? '▸' : '▾'}</span>
                      <span className="text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{g.label}</span>
                      <span className="text-[0.625rem] text-[#5A5751]">{g.totals.count.toLocaleString()} tx</span>
                    </span>
                    <span className="flex items-center gap-2 text-[0.6875rem]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      <span className="text-[#166534]">in {fmtMoney(g.totals.in)}</span>
                      <span className="text-[#B85838]">out {fmtMoney(g.totals.out)}</span>
                      <span className={g.totals.net < 0 ? 'text-[#B85838]' : 'text-[#166534]'}>net {fmtMoney(g.totals.net)}</span>
                    </span>
                  </button>
                  {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-white text-[#5A5751] uppercase tracking-wider text-[0.625rem]">
                        <tr>
                          <th className="text-left px-2 py-1.5"><button type="button" onClick={() => toggleSort('date')} className="uppercase tracking-wider hover:text-[#1A1815]">Date{sortArrow('date')}</button></th>
                          <th className="text-left px-2 py-1.5"><button type="button" onClick={() => toggleSort('account')} className="uppercase tracking-wider hover:text-[#1A1815]">Account{sortArrow('account')}</button></th>
                          <th className="text-left px-2 py-1.5"><button type="button" onClick={() => toggleSort('payee')} className="uppercase tracking-wider hover:text-[#1A1815]">Payee / Description{sortArrow('payee')}</button></th>
                          <th className="text-left px-2 py-1.5"><button type="button" onClick={() => toggleSort('category')} className="uppercase tracking-wider hover:text-[#1A1815]">Category{sortArrow('category')}</button></th>
                          <th className="text-right px-2 py-1.5"><button type="button" onClick={() => toggleSort('amount')} className="uppercase tracking-wider hover:text-[#1A1815]">Amount{sortArrow('amount')}</button></th>
                          {showBalance && <th className="text-right px-2 py-1.5">Balance</th>}
                          <th className="w-6 px-1 py-1.5" aria-label="Details" />
                        </tr>
                      </thead>
                      <tbody>
                        {g.rows.map(t => {
                          const open = expandedId === t.id;
                          const cols = showBalance ? 7 : 6;
                          return (
                          <React.Fragment key={t.id}>
                          <tr className="border-t border-[#E8E4DC] hover:bg-[#FAF8F4] cursor-pointer" onClick={() => setExpandedId(open ? null : t.id)} aria-expanded={open}>
                            <td className="px-2 py-1.5 whitespace-nowrap">
                              {canCombine && (
                                <input type="checkbox" checked={selectedIds.has(t.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleSelect(t.id)} className="mr-1.5 align-middle" aria-label={`Select ${t.name} to combine`} />
                              )}
                              {formatDate(t.posted)}
                            </td>
                            <td className="px-2 py-1.5 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{t.institution}</td>
                            <td className="px-2 py-1.5 truncate max-w-[16.25rem]" title={t.name}>
                              {t.name}
                              {recurringIds.has(t.id) && <span className="ml-1.5 text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] border border-[#5A6E3D] rounded-full px-1.5 py-0.5" title="Part of a repeating payment pattern">↻ recurring</span>}
                              {t.pending && <span className="ml-1.5 text-[0.5625rem] uppercase tracking-wider text-[#5A5751] border border-[#E8E4DC] rounded-full px-1.5 py-0.5">pending</span>}
                            </td>
                            <td className="px-2 py-1.5 text-[#5A5751]" onClick={(e) => { if (canEditCat) e.stopPropagation(); }}>
                              {canEditCat ? (
                                <select
                                  value={(t.category || 'other').toLowerCase()}
                                  onChange={(e) => setRowCategory(t, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="max-w-[8.5rem] text-[0.6875rem] bg-white border border-[#E8E4DC] px-1 py-0.5 focus:outline focus:outline-2 focus:outline-[#B85838]"
                                  aria-label={`Category for ${t.name}`}
                                >
                                  {categoryOptions.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                                  <option value="__new__">+ New category…</option>
                                </select>
                              ) : (t.category ? categoryLabel(t.category) : '—')}
                            </td>
                            <td className={`px-2 py-1.5 text-right font-mono ${t.amount < 0 ? 'text-[#B85838]' : 'text-[#16A34A]'}`}>{formatAmount(t.amount)}</td>
                            {showBalance && (
                              <td className="px-2 py-1.5 text-right font-mono text-[#5A5751]">
                                {balByRow.has(t.id) ? formatAmount(balByRow.get(t.id)) : '—'}
                              </td>
                            )}
                            <td className="px-1 py-1.5 text-center text-[#5A5751]" aria-hidden="true">{open ? '▾' : '▸'}</td>
                          </tr>
                          {open && (
                            <tr className="bg-[#FAF8F4]">
                              <td colSpan={cols} className="px-3 py-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[0.6875rem]">
                                  <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Date</div><div className="text-[#1A1815]">{formatDate(t.posted)}</div></div>
                                  <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Account</div><div className="text-[#1A1815]">{t.institution}</div></div>
                                  <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Category</div><div className="text-[#1A1815]">{t.category ? categoryLabel(t.category) : '—'}</div></div>
                                  <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Amount</div><div className={`font-mono ${t.amount < 0 ? 'text-[#B85838]' : 'text-[#166534]'}`}>{formatAmount(t.amount)}</div></div>
                                  <div className="col-span-2 sm:col-span-3"><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Full description</div><div className="text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{t.name}</div></div>
                                  <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Status</div><div className="text-[#1A1815]">{t.pending ? 'Pending' : 'Cleared'}</div></div>
                                  <div className="col-span-2 sm:col-span-4 border-t border-[#E8E4DC] pt-2"><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Receipt</div><div className="text-[#5A5751] italic">No receipt on file — bank-imported rows carry no receipt image. Attach one from the Tx tab when receipt capture lands.</div></div>
                                </div>
                              </td>
                            </tr>
                          )}
                          </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
