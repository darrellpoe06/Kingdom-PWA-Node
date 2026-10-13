// =============================================================================
// re-review-timeline — when each decision comes back, read from the ledger
// =============================================================================
// Darrell 2026-10-09: "Timelines based on the Way we work... DRs... etc...."
//
// The Way (DR-0075) does not promise delivery dates; it promises a RE-REVIEW
// date on every decision that parks anything, sized to the issue, and the
// standing rule that nothing parked is parked forever. So the platform's
// timeline IS the ledger's re-review dates: every record's latest
// `re-review: YYYY-MM-DD`, grouped by the week it falls in, with the ones
// already passed and not yet re-reviewed named first. The app ships the ledger
// at build time (__DR_LEDGER__, vite.config.js); each item's chain carries the
// date decision-chain.js read from the record's own text.
//
// Pure: the ledger items and today's date are inputs; nothing is fetched and
// nothing is painted. A record with no re-review date is simply not on the
// timeline, and the count says how many those are.
// =============================================================================

const DAY_MS = 24 * 60 * 60 * 1000;
const isoDay = (v) => { const s = String(v || ''); return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : ''; };
const dayMs = (iso) => Date.parse(`${iso}T00:00:00Z`);

/** The Monday that starts the week an ISO day falls in (UTC arithmetic, days only). */
export function weekStartOf(iso) {
  const d = isoDay(iso);
  if (!d) return '';
  const ms = dayMs(d);
  const dow = (new Date(ms).getUTCDay() + 6) % 7; // Monday = 0
  return new Date(ms - dow * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `fromIso` to `toIso` (negative when `toIso` is earlier). */
export function daysBetween(fromIso, toIso) {
  const a = isoDay(fromIso); const b = isoDay(toIso);
  if (!a || !b) return null;
  return Math.round((dayMs(b) - dayMs(a)) / DAY_MS);
}

/** '2026-10-13' -> '13 Oct'. */
export function shortDay(iso) {
  const d = isoDay(iso);
  if (!d) return '';
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(d.slice(8, 10))} ${M[Number(d.slice(5, 7)) - 1]}`;
}

/** One ledger item as a timeline row, or null when it carries no re-review date. */
export function rowOf(item, today) {
  if (!item) return null;
  const date = isoDay(item.chain && item.chain.reReview);
  if (!date) return null;
  const late = daysBetween(date, today);
  return {
    id: item.id || '',
    title: String(item.title || '').trim() || '(untitled record)',
    status: String(item.status || '').trim() || 'unknown',
    date,
    daysLate: late === null ? null : late,       // positive = passed by that many days
    passed: late !== null && late > 0,
  };
}

/**
 * The timeline.
 * @param {Array} items  the ledger's items (__DR_LEDGER__.items)
 * @param {string} today ISO day
 * @returns {{ rows, passed, today: Array, weeks: Array<{start, end, label, rows, isThisWeek}>,
 *             dated, undated, total, heaviest }}
 */
export function buildReReviewTimeline(items, today) {
  const list = Array.isArray(items) ? items : [];
  const t = isoDay(today);
  const rows = list.map((it) => rowOf(it, t)).filter(Boolean).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));
  const passed = rows.filter((r) => r.passed);
  const dueToday = rows.filter((r) => r.date === t);
  const ahead = rows.filter((r) => r.date > t);
  const thisWeek = weekStartOf(t);
  const byWeek = new Map();
  for (const r of ahead) {
    const ws = weekStartOf(r.date);
    if (!byWeek.has(ws)) byWeek.set(ws, []);
    byWeek.get(ws).push(r);
  }
  const weeks = Array.from(byWeek.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([start, wrows]) => {
    const end = new Date(dayMs(start) + 6 * DAY_MS).toISOString().slice(0, 10);
    return { start, end, label: `${shortDay(start)} to ${shortDay(end)}`, rows: wrows, isThisWeek: start === thisWeek };
  });
  const heaviest = weeks.reduce((h, w) => (w.rows.length > (h ? h.rows.length : 0) ? w : h), null);
  return {
    rows, passed, today: dueToday, weeks,
    dated: rows.length, undated: list.length - rows.length, total: list.length,
    heaviest: heaviest ? { start: heaviest.start, label: heaviest.label, count: heaviest.rows.length } : null,
  };
}

/** One honest sentence over the timeline. */
export function timelineSummary(tl) {
  if (!tl || tl.total === 0) return 'No records in this build.';
  const parts = [];
  parts.push(`${tl.dated} of ${tl.total} records carry a re-review date`);
  parts.push(tl.passed.length ? `${tl.passed.length} ${tl.passed.length === 1 ? 'has' : 'have'} passed and not been re-reviewed` : 'none has passed unreviewed');
  if (tl.today.length) parts.push(`${tl.today.length} ${tl.today.length === 1 ? 'is' : 'are'} due today`);
  const aheadCount = tl.weeks.reduce((n, w) => n + w.rows.length, 0);
  parts.push(aheadCount ? `${aheadCount} ahead across ${tl.weeks.length} ${tl.weeks.length === 1 ? 'week' : 'weeks'}` : 'none ahead');
  if (tl.heaviest) parts.push(`the heaviest week is ${tl.heaviest.label} with ${tl.heaviest.count}`);
  return `${parts.join(' · ')}.`;
}
