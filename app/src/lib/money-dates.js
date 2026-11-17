// =============================================================================
// money-dates — money arithmetic and local-day date math for the Money engine.
// Split out of safe-to-spend.js on 2026-11-17 (file budget); safe-to-spend.js
// re-exports every name, so callers are unchanged. Pure: no I/O, no state.
// =============================================================================
import { freqToMonths } from './financial-engineering.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export function round2(x) { return Math.round((Number(x) || 0) * 100) / 100; }

// ── dates (local-day arithmetic; 'YYYY-MM-DD' in, 'YYYY-MM-DD' out) ─────────
export function isoDay(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return null;
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function parseDay(iso) {
  if (!iso) return null;
  const s = String(iso);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) { const d = new Date(s); return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
export function addDays(date, n) { const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); d.setDate(d.getDate() + n); return d; }
export function addMonthsClamped(date, n, dayOfMonth) {
  const y = date.getFullYear(); const m = date.getMonth() + n;
  const last = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(dayOfMonth || date.getDate(), last));
}
export function daysBetween(a, b) { return Math.round((b.getTime() - a.getTime()) / DAY_MS); }

// ── twice a month: two FIXED days of the month (DEFECT-2, 2026-10-29) ─────────
// "Twice a month (1st & 15th)" used to step the anchor + 15, so pay on the 1st
// landed its second payday on the 16th. A semimonthly schedule is two days of
// the month, not a fifteen-day stride: anchored on the 1st or the 15th it is the
// 1st & 15th; on the 28th or later it is the 15th & the last day; any other day
// d is d & d+14 (or d-14 & d past the 14th). Clamped to the month's last day.
export function semimonthlyDays(anchorDay) {
  const d = Number(anchorDay) || 1;
  if (d === 1 || d === 15) return [1, 15];
  if (d >= 28) return [15, 31];
  return d <= 14 ? [d, d + 14] : [d - 14, d];
}
function semimonthlyAt(first, i) {
  const [a, b] = semimonthlyDays(first.getDate());
  // the i-th payday at or after `first`, walking month by month through the two days
  const out = [];
  let y = first.getFullYear(); let m = first.getMonth();
  while (out.length <= i) {
    const last = new Date(y, m + 1, 0).getDate();
    for (const day of [a, b]) {
      const at = new Date(y, m, Math.min(day, last));
      if (at >= first && !out.some((x) => x.getTime() === at.getTime())) out.push(at);
    }
    m += 1; if (m > 11) { m = 0; y += 1; }
  }
  return out[i];
}

// ── occurrences of a cadence inside [start, end], rolling forward from `first`
// (this is the roll-forward the Tx Upcoming view never had: a next-due date in
// the past advances to its next occurrence instead of dropping out) ──────────
export function expandOccurrences(first, frequency, start, end, maxGuard = 400) {
  const out = [];
  let due = first instanceof Date ? first : parseDay(first);
  if (!due || isNaN(due.getTime())) return out;
  const anchorDay = due.getDate();
  const step = (d, i) => {
    switch (frequency) {
      case 'weekly': return addDays(due, 7 * i);
      case 'biweekly': return addDays(due, 14 * i);
      case 'semimonthly': return semimonthlyAt(due, i);
      default: {
        const months = freqToMonths(frequency) || (frequency === 'monthly' ? 1 : 0);
        if (!months) return null;
        return addMonthsClamped(d, months * i, anchorDay);
      }
    }
  };
  for (let i = 0; i < maxGuard; i++) {
    const at = step(due, i);
    if (!at) break;
    if (at > end) break;
    if (at >= start) out.push(at);
  }
  return out;
}
