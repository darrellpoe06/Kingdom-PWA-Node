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
export function totals(txns) {
  let inSum = 0, outSum = 0;
  for (const t of txns) {
    const a = typeof t.amount === 'number' ? t.amount : Number(t.amount);
    if (!Number.isFinite(a)) continue;
    if (a < 0) outSum += -a; else inSum += a;
  }
  return { in: inSum, out: outSum, net: inSum - outSum, count: txns.length };
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
