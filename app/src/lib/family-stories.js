// =============================================================================
// family-stories — the family's years in pictures, read from the NAS library
// (DR-1153)
// =============================================================================
// Darrell, 2026-10-21, from the Life Hub: "Clicking Big Picture should show the
// family photos... over time or stories like Google stories of pictures of
// family times over the years... make sense?" And: "Right now it goes
// nowhere...." It did: the tile pointed at the `overview` view, and since the
// Hub became the home (DR-1046) `overview` IS the Hub.
//
// THE PICTURES ARE ALREADY OURS. The NAS photo server (photo_server.py) lists
// the family's library by month (`/library?month=`): the phones' backups under
// <device>/<year>/<month> and the dated roots, with the date read from the
// camera's own file name. This module turns those month pages into chapters
// (one per year) and stories (a run of frames with a date in words), and picks
// "this week across the years" the way a memories feed does. Pure: no fetch,
// no clock of its own; the component injects both.
// =============================================================================

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const parts = (date) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(date || ''));
  if (!m) return null;
  const y = Number(m[1]); const mo = Number(m[2]); const d = Number(m[3]);
  if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= 31)) return null;
  return { y, mo, d };
};

/** "January 23, 2024" from "2024-01-23"; '' for a date that is not one. */
export function dateInWords(date) {
  const p = parts(date);
  if (!p) return '';
  return `${MONTH_NAMES[p.mo - 1]} ${p.d}, ${p.y}`;
}

/** "this year" / "last year" / "N years ago", from the picture's year. */
export function yearsAgo(date, today = new Date()) {
  const p = parts(date);
  if (!p) return '';
  const n = today.getFullYear() - p.y;
  if (n <= 0) return 'this year';
  if (n === 1) return 'last year';
  return `${n} years ago`;
}

/** The YYYY-MM keys to ask the server for when it cannot list its years (an older server): the last `back` months, newest first. */
export function monthsToProbe(today = new Date(), back = 36) {
  const out = [];
  let y = today.getFullYear(); let m = today.getMonth() + 1;
  for (let i = 0; i < back; i += 1) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m -= 1; if (m === 0) { m = 12; y -= 1; }
  }
  return out;
}

/** The month keys a years listing names, newest first. */
export function monthsFromYears(years = []) {
  const keys = [];
  for (const yr of Array.isArray(years) ? years : []) {
    for (const mo of yr?.months || []) if (mo && mo.month) keys.push(mo.month);
  }
  return keys.sort().reverse();
}

const frameOf = (p, month) => ({
  id: String(p.id || p.name || ''),
  name: String(p.name || p.id || ''),
  date: String(p.date || `${month}-01`),
  text: String(p.text || ''),
  thumb: p.thumb || null,
});

/**
 * Chapters, one per year, from month pages: [{month, photos, total}].
 * Each chapter: {year, count (from the server's totals), loaded (frames held),
 * months, cover (the newest frame with a thumb), frames (oldest first)}.
 * Newest year first.
 */
export function chaptersFrom(pages = []) {
  const byYear = new Map();
  for (const pg of Array.isArray(pages) ? pages : []) {
    if (!pg || !/^\d{4}-\d{2}$/.test(String(pg.month))) continue;
    const y = String(pg.month).slice(0, 4);
    const ch = byYear.get(y) || { year: y, count: 0, loaded: 0, months: [], frames: [] };
    const frames = (Array.isArray(pg.photos) ? pg.photos : []).map((p) => frameOf(p, pg.month)).filter((f) => f.id);
    const total = typeof pg.total === 'number' ? pg.total : frames.length;
    ch.count += total;
    ch.loaded += frames.length;
    ch.months.push({ month: pg.month, count: total });
    ch.frames.push(...frames);
    byYear.set(y, ch);
  }
  const out = [...byYear.values()].filter((c) => c.count > 0);
  for (const c of out) {
    c.frames.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
    c.months.sort((a, b) => a.month.localeCompare(b.month));
    c.cover = [...c.frames].reverse().find((f) => f.thumb) || null;
  }
  return out.sort((a, b) => b.year.localeCompare(a.year));
}

/** True when a picture's month-day is within `window` days of today's, any year. */
export function nearToday(date, today = new Date(), window = 7) {
  const p = parts(date);
  if (!p) return false;
  const year = 2001; // a non-leap reference year, so Feb 29 folds onto Mar 1 on both sides
  const a = Date.UTC(year, p.mo - 1, p.d);
  const b = Date.UTC(year, today.getMonth(), today.getDate());
  const day = 86400000;
  const diff = Math.abs(a - b) / day;
  return Math.min(diff, 365 - diff) <= window;
}

/**
 * "This week across the years": the frames near today's date from every year,
 * oldest year first (so the story walks forward through time), capped per
 * year so one busy day does not crowd the rest out.
 */
export function thisWeekAcrossYears(chapters = [], today = new Date(), { window = 7, perYear = 6 } = {}) {
  const frames = [];
  for (const ch of [...(chapters || [])].sort((a, b) => a.year.localeCompare(b.year))) {
    const near = ch.frames.filter((f) => nearToday(f.date, today, window)).slice(0, perYear);
    frames.push(...near);
  }
  return frames;
}

/** "2024 · 143 pictures" / "2024 · 1 picture". */
export function chapterTitle(ch) {
  if (!ch) return '';
  return `${ch.year} · ${ch.count} ${ch.count === 1 ? 'picture' : 'pictures'}`;
}

/** The caption under a frame: "January 23, 2024 · 2 years ago" and the picture's own words when it has any. */
export function frameCaption(frame, today = new Date()) {
  if (!frame) return '';
  const when = dateInWords(frame.date);
  const ago = yearsAgo(frame.date, today);
  const head = [when, ago].filter(Boolean).join(' · ');
  return frame.text ? `${head} — ${frame.text}` : head;
}

/** How long a frame stays up before the story moves on, in ms. */
export const FRAME_MS = 5000;

/** The next frame index, wrapping to the end as "finished" (null). */
export function nextIndex(i, n) {
  if (!Number.isFinite(n) || n <= 0) return null;
  return i + 1 < n ? i + 1 : null;
}
