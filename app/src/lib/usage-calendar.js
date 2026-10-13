// =============================================================================
// usage-calendar — when, and by whom, the apps are used (DR-0843)
// =============================================================================
// Darrell, 2026-10-09: "How many times have users used the apps?... my son has
// done 90% of the work of evaluation... How many times a day and days
// specifically... on a calendar for most used days Saturday or Mondays etc...
// metrics for enhancement purposes."
//
// Pure over the rows of usage_calendar_metrics (0259): { user_id, day, kind,
// n }. Opens are tab views; uses are functions exercised (DR-0819), the
// measure of evaluating. Everything below is counted from the rows; a share
// is a share of the rows' total, never of a guess.
const WEEKDAYS = Object.freeze(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
export const WEEKDAY_SHORT = Object.freeze(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

const isoDay = (v) => { const s = String(v || ''); return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : ''; };
const weekdayOf = (iso) => new Date(`${iso}T00:00:00Z`).getUTCDay();

/** The rows, cleaned: one per (user, day, kind) with a count. */
export function cleanRows(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .map((r) => ({ userId: String((r && r.user_id) || ''), day: isoDay(r && r.day), kind: String((r && r.kind) || 'view'), n: Number((r && r.n) || 0) }))
    .filter((r) => r.userId && r.day && r.n > 0);
}

/**
 * Per person: opens, uses, total, active days, by weekday, the day map, first
 * and last day. Keyed by user id.
 */
export function perPerson(rows = []) {
  const out = new Map();
  for (const r of cleanRows(rows)) {
    const p = out.get(r.userId) || { userId: r.userId, opens: 0, uses: 0, total: 0, days: new Map(), byWeekday: [0, 0, 0, 0, 0, 0, 0], firstDay: null, lastDay: null };
    if (r.kind === 'use') p.uses += r.n; else p.opens += r.n;
    p.total += r.n;
    p.days.set(r.day, (p.days.get(r.day) || 0) + r.n);
    p.byWeekday[weekdayOf(r.day)] += r.n;
    if (!p.firstDay || r.day < p.firstDay) p.firstDay = r.day;
    if (!p.lastDay || r.day > p.lastDay) p.lastDay = r.day;
    out.set(r.userId, p);
  }
  for (const p of out.values()) p.activeDays = p.days.size;
  return out;
}

/** Who has done the evaluating: by uses first (functions exercised), then opens; each with a share of the total. */
export function leaderboard(rows = [], nameOf = () => null) {
  const people = Array.from(perPerson(rows).values());
  const totalUses = people.reduce((n, p) => n + p.uses, 0);
  const totalOpens = people.reduce((n, p) => n + p.opens, 0);
  const total = totalUses + totalOpens;
  return people
    .map((p) => ({
      userId: p.userId,
      name: nameOf(p.userId) || null,
      opens: p.opens, uses: p.uses, total: p.total, activeDays: p.activeDays, lastDay: p.lastDay,
      shareUses: totalUses ? p.uses / totalUses : 0,
      shareAll: total ? p.total / total : 0,
    }))
    .sort((a, b) => b.uses - a.uses || b.opens - a.opens || (a.name || '').localeCompare(b.name || ''));
}

/** Everyone together, by weekday: [{ weekday, label, short, n, share }] Sunday first; and the busiest. */
export function weekdayTotals(rows = []) {
  const n = [0, 0, 0, 0, 0, 0, 0];
  for (const r of cleanRows(rows)) n[weekdayOf(r.day)] += r.n;
  const total = n.reduce((a, b) => a + b, 0);
  const list = n.map((v, i) => ({ weekday: i, label: WEEKDAYS[i], short: WEEKDAY_SHORT[i], n: v, share: total ? v / total : 0 }));
  const busiest = list.reduce((b, d) => (d.n > (b ? b.n : 0) ? d : b), null);
  return { days: list, total, busiest: busiest && busiest.n > 0 ? busiest : null };
}

/** The last `weeks` weeks as a grid of days (Sunday to Saturday), each with the count for one person or everyone. */
export function calendarGrid(rows = [], { weeks = 12, today = new Date().toISOString().slice(0, 10), userId = null } = {}) {
  const byDay = new Map();
  for (const r of cleanRows(rows)) {
    if (userId && r.userId !== userId) continue;
    byDay.set(r.day, (byDay.get(r.day) || 0) + r.n);
  }
  const t = isoDay(today);
  const end = new Date(`${t}T00:00:00Z`);
  const endSat = new Date(end.getTime() + (6 - end.getUTCDay()) * 86400000);
  const start = new Date(endSat.getTime() - (weeks * 7 - 1) * 86400000);
  const grid = [];
  for (let w = 0; w < weeks; w += 1) {
    const row = [];
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(start.getTime() + (w * 7 + d) * 86400000).toISOString().slice(0, 10);
      row.push({ day: date, n: byDay.get(date) || 0, future: date > t });
    }
    grid.push(row);
  }
  const max = Math.max(0, ...Array.from(byDay.values()));
  return { weeks: grid, max, start: grid[0][0].day, end: grid[weeks - 1][6].day };
}

/** One honest line over the whole window. */
export function calendarLine(rows = [], { windowDays = 90 } = {}) {
  const people = perPerson(rows);
  if (people.size === 0) return `Nothing opened or used in the last ${windowDays} days.`;
  let opens = 0; let uses = 0; const days = new Set();
  for (const p of people.values()) { opens += p.opens; uses += p.uses; for (const d of p.days.keys()) days.add(d); }
  const w = weekdayTotals(rows);
  return `${opens} tab opens and ${uses} functions used by ${people.size} ${people.size === 1 ? 'person' : 'people'} on ${days.size} of the last ${windowDays} days${w.busiest ? ` · busiest weekday ${w.busiest.label} (${w.busiest.n})` : ''}.`;
}
