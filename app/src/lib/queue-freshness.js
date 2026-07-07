// =============================================================================
// queue-freshness — staleness made LEGIBLE on every queue surface (DR-0120)
// =============================================================================
// Darrell 2026-07-07, on a promote queue holding month-old tester notes:
// "tester notes are stale... these tabs are all stale, why... all these tabs
// have been UIUX checked and checked for stale or static data how is this
// still possible?" The answer (LESSONS P30): the reviews verified the SURFACE
// renders live rows — they never verified the rows are being TENDED. A live
// view of an untended queue is still stale. This helper is the structural
// close: every queue can now say, in-surface, how long its items have waited,
// so an unworked queue is legible instead of silent.
//
// Pure (no React, no network) so the threshold behavior is unit-testable.
// =============================================================================

// Items are stale when they have waited longer than this. Two weeks: longer
// than any Tier-B soak, shorter than "we forgot this exists."
export const QUEUE_STALE_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

// staleQueueItems — the items older than `days`, judged by `dateOf` (defaults
// to .createdAt). Rows with no parseable date are treated as stale: an undated
// queue item cannot prove it is fresh (DR-0076 — unverified is not "fine").
export function staleQueueItems(items, { now = null, days = QUEUE_STALE_DAYS, dateOf = (x) => x && x.createdAt } = {}) {
  const base = now ? new Date(now).getTime() : Date.now();
  const cutoff = base - days * DAY_MS;
  return (Array.isArray(items) ? items : []).filter((it) => {
    const v = Date.parse(dateOf(it) || '');
    return Number.isNaN(v) || v < cutoff;
  });
}

// queueFreshness — the one-line summary a queue surface renders: how many
// waited past the threshold and how old the oldest is (in whole days).
export function queueFreshness(items, opts = {}) {
  const stale = staleQueueItems(items, opts);
  const base = opts.now ? new Date(opts.now).getTime() : Date.now();
  let oldestDays = null;
  for (const it of Array.isArray(items) ? items : []) {
    const v = Date.parse((opts.dateOf || ((x) => x && x.createdAt))(it) || '');
    if (Number.isNaN(v)) continue;
    const d = Math.floor((base - v) / DAY_MS);
    if (oldestDays == null || d > oldestDays) oldestDays = d;
  }
  return { total: (Array.isArray(items) ? items : []).length, stale: stale.length, oldestDays };
}
