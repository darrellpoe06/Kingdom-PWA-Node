// =============================================================================
// records-log — the generic core of the app-wide "filing office" list primitive
// =============================================================================
// Darrell 2026-07-01: "sort most data-driven spaces organized office-like so we
// can go directly to the date or time in question ... so they are not death
// scrolls." The transaction feed (Books → Imported) proved the pattern; this
// generalizes it so The Word, Choir, the Harvest ledger — every data-driven
// space — reuse ONE primitive instead of a bespoke list per tab.
//
// This module is the PURE, accessor-based core: give it records + a getDate
// accessor (and optionally a getAmount accessor) and it sorts newest-first,
// windows to a chosen period, and groups + indexes by month or day so a human
// lands on the exact date instantly. The date-math (period presets, month keys)
// is shared with the finance view via imported-view.js — one source, not two.
//
// Pure + deterministic (nowMs injected) so every surface's ordering, window, and
// grouping is pinned by records-log.test.js (DR-0076: measure, don't claim).
// =============================================================================

import {
  periodRange, effectiveRange, monthRange, monthKeyOf, isMonthKey, monthLabelOf, shiftMonthKey,
} from './imported-view.js';

// Re-export the item-agnostic date-math so a surface imports one module.
export {
  periodRange, effectiveRange, monthRange, monthKeyOf, isMonthKey, monthLabelOf, shiftMonthKey,
};

// Parse any date-ish value to epoch ms. Accepts 'YYYY-MM-DD' (local midnight),
// a full ISO string, or a number (already ms). null when unparseable so undated
// records are handled honestly rather than sorted as epoch 0.
export function toMsValue(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v);
  const ms = Date.parse(s.length === 10 ? s + 'T00:00:00' : s);
  return Number.isNaN(ms) ? null : ms;
}

// Resolve a record's date to ms via an accessor (function) or field name (string).
export function recordMs(item, getDate) {
  const v = typeof getDate === 'function' ? getDate(item) : (item ? item[getDate] : null);
  return toMsValue(v);
}

// Resolve a record's amount via accessor/field; NaN-safe, 0 when absent.
function recordAmount(item, getAmount) {
  if (!getAmount) return 0;
  const v = typeof getAmount === 'function' ? getAmount(item) : (item ? item[getAmount] : 0);
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

// In / out / net / count for a set of records (in/out only meaningful when a
// getAmount accessor is supplied; otherwise just count).
export function recordTotals(items, getAmount) {
  let inSum = 0, outSum = 0;
  if (getAmount) {
    for (const it of items) {
      const a = recordAmount(it, getAmount);
      if (a < 0) outSum += -a; else inSum += a;
    }
  }
  return { in: inSum, out: outSum, net: inSum - outSum, count: items.length, hasAmount: !!getAmount };
}

// Stable sort by date. 'desc' (newest first) default; 'asc' oldest-first toggle.
// Undated records sink to the end; ties preserve input order.
export function sortRecords(items, getDate, dir = 'desc') {
  const indexed = items.map((it, i) => [it, i]);
  indexed.sort((a, b) => {
    const ma = recordMs(a[0], getDate);
    const mb = recordMs(b[0], getDate);
    if (ma == null && mb == null) return a[1] - b[1];
    if (ma == null) return 1;
    if (mb == null) return -1;
    if (ma !== mb) return dir === 'asc' ? ma - mb : mb - ma;
    return a[1] - b[1];
  });
  return indexed.map((x) => x[0]);
}

// Keep records whose date falls inside [sinceMs, untilMs]. Null bound = open on
// that side. Both null = keep everything (including undated); once a bound is set
// undated records drop out (they can't be placed in a window).
export function filterRecordsByRange(items, getDate, sinceMs, untilMs) {
  if (sinceMs == null && untilMs == null) return items;
  return items.filter((it) => {
    const ms = recordMs(it, getDate);
    if (ms == null) return false;
    if (sinceMs != null && ms < sinceMs) return false;
    if (untilMs != null && ms > untilMs) return false;
    return true;
  });
}

// ---- Day grain (for surfaces indexed to the exact day) ----------------------

export function dayKeyOf(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function dayLabelOf(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
}

// Group records into 'month' (default) or 'day' buckets in first-appearance
// order (so desc-sorted input yields newest-bucket-first). Each group carries
// its date key, label, records, and totals. Undated records collect into a
// single trailing 'undated' bucket.
export function groupRecords(items, getDate, opts = {}) {
  const grain = opts.grain === 'day' ? 'day' : 'month';
  const getAmount = opts.getAmount || null;
  const map = new Map();
  for (const it of items) {
    const ms = recordMs(it, getDate);
    let key, label;
    if (ms == null) {
      key = 'undated';
      label = 'Undated';
    } else if (grain === 'day') {
      key = dayKeyOf(ms);
      label = dayLabelOf(key);
    } else {
      key = monthKeyOf(ms);
      label = monthLabelOf(key);
    }
    if (!map.has(key)) map.set(key, { key, label, records: [] });
    map.get(key).records.push(it);
  }
  const groups = [...map.values()];
  for (const g of groups) g.totals = recordTotals(g.records, getAmount);
  return groups;
}

// Resolve an active period value (a named preset, a 'YYYY-MM' month key, or
// 'custom' + a {from,to} range) into a concrete {sinceMs, untilMs} window.
export function resolvePeriod(period, range, nowMs) {
  if (isMonthKey(period)) return monthRange(period);
  if (period === 'custom') return effectiveRange('all', range && range.from, range && range.to, nowMs);
  return periodRange(period, nowMs);
}
