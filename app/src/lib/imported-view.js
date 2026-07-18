// =============================================================================
// imported-view — pure view helpers for Books -> Imported (the 1,000+ row feed)
// =============================================================================
// Darrell 2026-07-01: the imported list was rendering in raw API order
// (oldest-first), so the newest 2026 transactions were buried at the bottom of
// an endless scroll with no way to see a single week or month. These helpers
// turn the flat bank feed into a digestible view: newest-first by default (with
// an oldest-first toggle), bounded to a chosen time window (This week / This
// month / Last 30 / Last 90 / All / custom range), and grouped into collapsible
// months that carry their own in/out/net totals.
//
// Pure + deterministic (nowMs is injected, never Date.now() inside) so the sort,
// window, and grouping are pinned by tests against real row shapes — the ledger
// backbone is untouched; this only re-presents what wf18 already served.
// Grounds: DR-0076 (measure the real artifact, don't claim), DR-0061 (a surface
// is a live view of real flow).
// =============================================================================

const DAY_MS = 86400000;

// Round to cents. Displayed rollups are money; float drift (0.1 + 0.2) must
// never leak into an In/Out/Net tile or report total (DR-0076: measure the real
// artifact — a total that prints 0.30000000000000004 is not the real number).
const round2 = (n) => Math.round(n * 100) / 100;

// True when a transaction/row is an INTERNAL TRANSFER — money moving between
// the family's own accounts, not money entering or leaving. Rows mark this two
// real ways, and both must be honored:
//   · category === 'transfer' — seed rows, BooksTransactions' transfer pairs,
//     and lib/categorize.js all use the 'transfer' category;
//   · isTransfer === true — the synced verified ledger (transactions-sync.js
//     maps the DB's is_transfer to isTransfer).
// Shared by totals() here, buildImportedView's 30-day summary (Imported.jsx),
// and incomeVsExpenseModel (finance-reports.js) so all three exclude the same
// rows the same way.
export function isTransferTxn(t) {
  if (!t) return false;
  if (t.isTransfer === true) return true;
  return String(t.category || '').toLowerCase() === 'transfer';
}

// Parse a transaction's posted date to epoch ms. Accepts 'YYYY-MM-DD' (treated
// as local midnight, matching the component's formatDate) or a full ISO string.
// Returns null when unparseable so undated rows are handled honestly, never
// silently sorted as epoch 0.
export function postedMs(t) {
  const s = t && (t.posted ?? t.date);
  if (!s) return null;
  const str = String(s);
  const ms = Date.parse(str.length === 10 ? str + 'T00:00:00' : str);
  return Number.isNaN(ms) ? null : ms;
}

// In / Out / Net / count for a set of rows. Out is the magnitude of money
// leaving (negative amounts); In is money arriving (positive). Net = In - Out.
//
// Internal transfers (isTransferTxn) are excluded from In, Out, AND Net: a
// transfer is the family's own money changing accounts, not income or spend,
// and summing its legs inflated gross In/Out (the 2026-07-05 audit defect).
// Excluding transfers from Net too keeps all three internally consistent
// (In - Out === Net always); wherever both legs of a balanced pair are in view
// they cancel, so Net is unchanged there. count still counts every row in the
// set — transfers are real rows the register shows.
export function totals(txns) {
  let inSum = 0, outSum = 0;
  for (const t of txns) {
    if (isTransferTxn(t)) continue;
    const a = typeof t.amount === 'number' ? t.amount : Number(t.amount);
    if (!Number.isFinite(a)) continue;
    if (a < 0) outSum += -a; else inSum += a;
  }
  return { in: round2(inSum), out: round2(outSum), net: round2(inSum - outSum), count: txns.length };
}

// Stable sort by posted date. 'desc' (newest first) is the default; 'asc' is the
// oldest-first toggle. Undated rows sink to the end in either direction, and
// ties preserve the server's original order.
export function sortByDate(txns, dir = 'desc') {
  const indexed = txns.map((t, i) => [t, i]);
  indexed.sort((a, b) => {
    const ma = postedMs(a[0]);
    const mb = postedMs(b[0]);
    if (ma == null && mb == null) return a[1] - b[1];
    if (ma == null) return 1;
    if (mb == null) return -1;
    if (ma !== mb) return dir === 'asc' ? ma - mb : mb - ma;
    return a[1] - b[1];
  });
  return indexed.map((x) => x[0]);
}

// sortRows — stable sort of imported rows by ANY column (the metadata sort the
// user asked for: date / account / payee / category / amount), asc or desc.
// Rows already carry the resolved account name (institution), payee (name),
// category, and amount, so this is a pure field compare. Ties preserve original
// order. 'date' delegates to the posted-ms comparator (undated rows sink).
const ROW_CMP = {
  date: (r) => postedMs(r),
  amount: (r) => (typeof r.amount === 'number' ? r.amount : Number(r.amount) || 0),
  account: (r) => String(r.institution || '').toLowerCase(),
  payee: (r) => String(r.name || '').toLowerCase(),
  category: (r) => String(r.category || '').toLowerCase(),
};
export function sortRows(rows, key = 'date', dir = 'desc') {
  const get = ROW_CMP[key] || ROW_CMP.date;
  const sign = dir === 'asc' ? 1 : -1;
  return (rows || []).map((r, i) => [r, i]).sort((a, b) => {
    const va = get(a[0]);
    const vb = get(b[0]);
    const an = va == null, bn = vb == null;
    if (an && bn) return a[1] - b[1];
    if (an) return 1;   // nulls sink regardless of direction
    if (bn) return -1;
    if (va < vb) return -1 * sign;
    if (va > vb) return 1 * sign;
    return a[1] - b[1];
  }).map((x) => x[0]);
}

// Resolve a named preset to a {sinceMs, untilMs} window relative to nowMs.
// A null bound means "unbounded on that side". 'week' and 'month' are calendar
// based (start of the current week / month, local time); '30d' / '90d' are
// rolling windows; 'all' is unbounded.
export function periodRange(preset, nowMs) {
  const now = new Date(nowMs);
  // Anchor rolling windows to local start-of-today so "Last 30" means the last
  // 30 full calendar days (inclusive of the boundary day) regardless of the
  // time of day the view is opened.
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  switch (preset) {
    case 'week': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      return { sinceMs: start.getTime(), untilMs: null };
    }
    case 'month':
      return { sinceMs: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), untilMs: null };
    case 'lastMonth': {
      // The whole previous calendar month — the standard "Last Month" segment.
      const startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      const endLast = new Date(now.getFullYear(), now.getMonth(), 1).getTime() - 1;
      return { sinceMs: startLast, untilMs: endLast };
    }
    case '30d':
      return { sinceMs: startToday - 30 * DAY_MS, untilMs: null };
    case '90d':
      return { sinceMs: startToday - 90 * DAY_MS, untilMs: null };
    case 'all':
    default:
      return { sinceMs: null, untilMs: null };
  }
}

// Effective window: a custom from/to date pair (YYYY-MM-DD strings) overrides
// the preset when either is set. 'to' is inclusive through the end of that day.
export function effectiveRange(preset, fromStr, toStr, nowMs) {
  const hasCustom = (fromStr && fromStr.length === 10) || (toStr && toStr.length === 10);
  if (!hasCustom) return periodRange(preset, nowMs);
  const sinceMs = fromStr && fromStr.length === 10 ? Date.parse(fromStr + 'T00:00:00') : null;
  const untilMs = toStr && toStr.length === 10 ? Date.parse(toStr + 'T23:59:59.999') : null;
  return {
    sinceMs: Number.isNaN(sinceMs) ? null : sinceMs,
    untilMs: Number.isNaN(untilMs) ? null : untilMs,
  };
}

// Keep rows whose posted date falls inside [sinceMs, untilMs]. A null bound is
// open on that side. When BOTH bounds are null, every row passes (including
// undated rows); once a bound is set, undated rows are excluded because they
// can't be placed in a window.
export function filterByRange(txns, sinceMs, untilMs) {
  if (sinceMs == null && untilMs == null) return txns;
  return txns.filter((t) => {
    const ms = postedMs(t);
    if (ms == null) return false;
    if (sinceMs != null && ms < sinceMs) return false;
    if (untilMs != null && ms > untilMs) return false;
    return true;
  });
}

// Group rows into months in first-appearance order (so a desc-sorted input
// yields newest-month-first groups). Each group carries its own in/out/net
// totals. Undated rows collect into a single trailing 'undated' group.
export function groupByMonth(txns) {
  const map = new Map();
  for (const t of txns) {
    const ms = postedMs(t);
    let key, label;
    if (ms == null) {
      key = 'undated';
      label = 'Undated';
    } else {
      const d = new Date(ms);
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (!map.has(key)) map.set(key, { key, label, rows: [] });
    map.get(key).rows.push(t);
  }
  const groups = [...map.values()];
  for (const g of groups) g.totals = totals(g.rows);
  return groups;
}

// Group rows by an arbitrary field (payee / category / account / anything) with a
// deterministic per-group subtotal — the "roll up repeated payees" view
// (Darrell 2026-07-01). Same {key,label,rows,totals} shape as groupByMonth so the
// render is identical. Groups are ordered biggest-first by |net| (where the money
// is), then by count, then by key — a stable, consumer-obvious order. A null/blank
// key collects under '—'. `getKey` is a row accessor; `labelFn` maps a key to its
// display label (defaults to the key). Totals are summed the same way as the
// overall period total (totals()), so per-group subtotals always tie out to it.
export function groupByField(rows, getKey, opts = {}) {
  const labelFn = opts.labelFn || ((k) => k);
  const map = new Map();
  for (const t of (rows || [])) {
    const raw = typeof getKey === 'function' ? getKey(t) : (t ? t[getKey] : null);
    const key = raw == null || raw === '' ? '—' : String(raw);
    if (!map.has(key)) map.set(key, { key, label: labelFn(key), rows: [] });
    map.get(key).rows.push(t);
  }
  const groups = [...map.values()];
  for (const g of groups) g.totals = totals(g.rows);
  groups.sort((a, b) =>
    Math.abs(b.totals.net) - Math.abs(a.totals.net)
    || b.totals.count - a.totals.count
    || a.key.localeCompare(b.key));
  return groups;
}

// ---- Quick month jump ('YYYY-MM') — the Mint/YNAB month-stepper --------------

// The 'YYYY-MM' key for a timestamp (local month).
export function monthKeyOf(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// True if a period value is a specific-month key (vs a named preset).
export function isMonthKey(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}$/.test(v);
}

// The {sinceMs, untilMs} window for one calendar month key.
export function monthRange(key) {
  const [y, m] = key.split('-').map(Number);
  return {
    sinceMs: new Date(y, m - 1, 1).getTime(),
    untilMs: new Date(y, m, 1).getTime() - 1,
  };
}

// Human label for a month key, e.g. '2026-06' -> 'June 2026'.
export function monthLabelOf(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Short human label for the active period — used by the summary tiles so they
// name the window they sum (e.g. "In · April 2026" / "In · 30 days") instead of
// a fixed "· 30d" that never changed as the month picker moved.
export function periodLabel(period) {
  if (isMonthKey(period)) return monthLabelOf(period);
  switch (period) {
    case 'week': return 'this week';
    case 'month': return 'this month';
    case 'lastMonth': return 'last month';
    case '30d': return '30 days';
    case '90d': return '90 days';
    case 'custom': return 'range';
    case 'all':
    default: return 'all time';
  }
}

// Step a month key by delta months (‹ prev / next ›).
export function shiftMonthKey(key, delta) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Running balance after each row — the bank-statement Balance column. Walks the
// account's rows oldest-first from a known opening balance so the NEWEST row
// shows the account's current balance (opening + every posted amount) and each
// earlier row shows the balance as of that transaction. Returns a Map by row id.
// Pass the account's FULL row set (not just the visible window) so balances stay
// correct even when the view is narrowed to a period. Truthful-or-absent: the
// caller only renders the column when it has a real opening balance to anchor to.
export function runningBalances(rows, openingBalance = 0) {
  const asc = sortByDate(rows, 'asc');
  const map = new Map();
  let bal = openingBalance;
  for (const r of asc) {
    const a = typeof r.amount === 'number' ? r.amount : Number(r.amount);
    bal += Number.isFinite(a) ? a : 0;
    map.set(r.id, bal);
  }
  return map;
}

// auditBalanceContinuity — prove ONE account's ledger is complete and NOT
// double-counted, using ONLY the bank's own arithmetic (Christina's books,
// 2026-07-18; Darrell: "so no two transactions are the same... it should have
// metadata"). This is the quantitative integrity engine: data validates data,
// no human judgment that could be gamed or undermined.
//
// Every row that carries the bank's running `balance` implies two facts:
//   before = balance - amount   (the balance the instant BEFORE it posted)
//   after  = balance            (the balance the instant AFTER it posted)
// In a complete, un-duplicated statement the rows form ONE chain: each row's
// `after` is exactly the next row's `before`. So across the whole set, every
// `after` value is consumed as some other row's `before` value EXACTLY once —
// leaving exactly ONE unmatched `before` (the opening balance) and exactly ONE
// unmatched `after` (the closing balance). This is ORDER-INDEPENDENT (it never
// re-sorts, so same-day ordering can't create a false alarm) and it localizes a
// break: if a row was dropped or double-counted, the chain splits and MORE than
// one balance is left unmatched on each side — those unmatched values bracket the
// gap. Integer cents throughout so float drift (0.1+0.2) can never fake a break.
//
// Pass ONE account's full row set (like runningBalances). Rows without a numeric
// balance are ignored (honest: an export without a balance column can't be
// audited this way — ok:true with reason, never a fake pass). Truthful-or-absent.
export function auditBalanceContinuity(rows) {
  const cents = (v) => Math.round(Number(v) * 100);
  const withBal = (rows || []).filter((r) => r && r.balance != null && r.balance !== '' && Number.isFinite(Number(r.balance)));
  if (withBal.length < 2) {
    return { ok: true, checked: withBal.length, breaks: [], reason: 'not enough balance data to audit' };
  }
  const after = new Map();  // 'balance after' value (cents) -> count
  const before = new Map(); // 'balance before' value (cents) -> count
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  for (const r of withBal) {
    const bal = cents(r.balance);
    const amt = Number.isFinite(Number(r.amount)) ? cents(r.amount) : 0;
    bump(after, bal);
    bump(before, bal - amt);
  }
  const unmatchedBefore = []; // opening candidate(s)
  for (const [k, c] of before) { const d = c - (after.get(k) || 0); for (let j = 0; j < d; j++) unmatchedBefore.push(k / 100); }
  const unmatchedAfter = [];  // closing candidate(s)
  for (const [k, c] of after) { const d = c - (before.get(k) || 0); for (let j = 0; j < d; j++) unmatchedAfter.push(k / 100); }
  const ok = unmatchedBefore.length === 1 && unmatchedAfter.length === 1;
  return {
    ok,
    checked: withBal.length,
    opening: ok ? unmatchedBefore[0] : null,   // the account's starting balance
    closing: ok ? unmatchedAfter[0] : null,    // the account's current balance
    // On a break, these unmatched balances bracket the missing/duplicated row(s).
    breaks: ok ? [] : { unmatchedBefore, unmatchedAfter },
  };
}

// reconcileAccounts — run the balance-continuity audit PER account across a flat
// ledger. Returns { [accountId]: auditResult }. This is the "correct account of
// record" proof (Darrell 2026-07-18): each account's rows must form ONE self-
// consistent balance chain, so if a transaction were filed to the WRONG account,
// that account's chain would not reconcile. A per-account `ok:true` (with real
// checked>0) therefore means those rows genuinely belong to that account. Pure;
// accounts whose rows carry no bank balance return the honest "not enough" result.
export function reconcileAccounts(transactions) {
  const byAcct = new Map();
  for (const t of transactions || []) {
    if (!t || !t.accountId) continue;
    if (!byAcct.has(t.accountId)) byAcct.set(t.accountId, []);
    byAcct.get(t.accountId).push(t);
  }
  const out = {};
  for (const [accountId, rows] of byAcct) out[accountId] = auditBalanceContinuity(rows);
  return out;
}
