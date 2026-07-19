// =============================================================================
// monthly-baseline — watch each month's totals against the usual, so an off month
// is caught (Darrell 2026-07-18)
// =============================================================================
// Darrell, after the inflated-income bug: "If [we] look at the amounts each month
// to monitor changes in the totals month to month for excess or lack based on
// their usual amounts each month, this would be caught." Exactly — a month that
// reads $69k received when the usual is ~$30k is an ANOMALY a baseline check flags
// on sight. This is the durable guard (VERIFICATION-DOCTRINE: build the check that
// catches the class), and it keeps catching future off months — a data glitch, a
// missed import, or a genuinely unusual month worth a second look.
//
// The baseline for a given month is the LEAVE-ONE-OUT MEDIAN of the other months'
// value for that metric — median so one wild month can't drag the "usual," and
// leave-one-out so the month being judged never inflates its own baseline. A month
// is flagged only when it deviates beyond BOTH a percentage tolerance AND a dollar
// floor (so a small, low-dollar month doesn't cry wolf). Totals are the TRUE
// external flow (internal transfers excluded, matching the tiles) — the monitor
// watches real income/spend, not internal circulation. Pure + deterministic.
// =============================================================================

import { internalTransferIds, externalTotals } from './internal-transfers.js';

function round2(n) { return Math.round(n * 100) / 100; }

function monthKeyOf(date) {
  const s = String(date || '');
  return /^\d{4}-\d{2}/.test(s) ? s.slice(0, 7) : null;
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  if (!s.length) return 0;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Friendly label for a 'YYYY-MM' key, e.g. '2026-06' -> 'June 2026'.
export function baselineMonthLabel(key) {
  if (!/^\d{4}-\d{2}$/.test(key)) return String(key || '');
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// monthlyExternalTotals(transactions, accounts) -> [{ month, in, out, net, count,
// internalIn, internalOut, internalCount }] oldest-first — each month's TRUE
// external flow (internal transfers excluded once over the full ledger). Pure.
export function monthlyExternalTotals(transactions, accounts = []) {
  const internal = internalTransferIds(transactions, accounts, {});
  const byMonth = new Map();
  for (const t of transactions || []) {
    const mk = monthKeyOf(t && t.date);
    if (!mk) continue;
    const row = { id: t.id, amount: Number(t.amount) || 0, category: t.category, isTransfer: t.isTransfer };
    const list = byMonth.get(mk);
    if (list) list.push(row); else byMonth.set(mk, [row]);
  }
  return [...byMonth.entries()]
    .map(([month, rows]) => ({ month, ...externalTotals(rows, internal) }))
    .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
}

// baselineAnomalies(months, opts) -> [{ month, label, metric, value, baseline,
// deviation, deviationPct, kind: 'excess'|'shortfall' }] for months that deviate
// from the usual beyond BOTH opts.tolerancePct (default 0.4 = 40%) AND opts.floor
// (default $2,000). opts.metric is 'in' (default) | 'out' | 'net'. Needs
// opts.minMonths (default 3) of history to have a meaningful baseline. Pure.
export function baselineAnomalies(months, opts = {}) {
  const metric = opts.metric || 'in';
  const tol = opts.tolerancePct ?? 0.4;
  const floor = opts.floor ?? 2000;
  const minMonths = opts.minMonths ?? 3;
  if (!Array.isArray(months)) return [];
  // Baseline over ACTIVE months only. A ledger that started mid-history has many
  // EMPTY early months (no statements imported yet — an ABSENCE of data, not a real
  // $0 month); including them collapses the median "usual" to near-zero, so every
  // real month reads as a false +thousands% anomaly (Darrell 2026-07-19: "usual
  // $1,026" while every active month is $30-44k). Judge only months that have real
  // activity, against the median of the OTHER active months — "usual" = a typical
  // ACTIVE month, so the monitor flags a genuine outlier, not the start of history.
  const active = months
    .map((m) => ({ month: m.month, value: Number(m[metric]) || 0 }))
    .filter((x) => x.value !== 0);
  if (active.length < minMonths) return [];
  const out = [];
  active.forEach((cur, i) => {
    const others = active.filter((_, j) => j !== i).map((x) => x.value);
    const base = median(others);
    const value = cur.value;
    const dev = value - base;
    const pct = base !== 0 ? dev / base : (value !== 0 ? Infinity : 0);
    if (Math.abs(dev) >= floor && Math.abs(pct) >= tol) {
      out.push({
        month: cur.month,
        label: baselineMonthLabel(cur.month),
        metric,
        value: round2(value),
        baseline: round2(base),
        deviation: round2(dev),
        deviationPct: Number.isFinite(pct) ? Math.round(pct * 100) : null,
        kind: dev > 0 ? 'excess' : 'shortfall',
      });
    }
  });
  // Biggest absolute deviation first — the most unusual months at the top.
  return out.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
}
