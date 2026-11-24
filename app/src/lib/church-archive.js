// =============================================================================
// church-archive — what the church office posted, kept by month (DR-1596)
// =============================================================================
// Darrell 2026-11-19: "Why does the office only have today forward... because
// they don't want to need to archive it... we can inside the Love Corner App
// because it's automated!?!!!!!!!"
//
// The church website (DR-1550) shows one month's calendar picture, the latest
// Letter from BG and the current flyers, and replaces each when the next goes
// up. The daily reader (.github/workflows/church-site-archive.yml) keeps every
// one it sees in church_site_archive (migration 0342): one row per CONTENT
// (sha256), with the month it was for and the day it was first seen. This is
// the pure logic both sides share: which pictures on which page are what
// (the reader), one copy per content (the reader, mirroring the table's
// unique key), the month view (the app), and what the office's "Remove" does
// to an event (the app's words, mirroring church_calendar_remove()).
//
// Pure and deterministic: no clock, no network, no storage. A picture whose
// month cannot be read from its page or file name is filed under the month it
// was first seen, and the row says so (month_from = 'first-seen'); nothing is
// guessed past that (DR-0076).
// =============================================================================
import { monthFrom, flyerName } from './church-site.js';
import { CHURCH_TIME_ZONE } from './church-live.js';
import { MONTH_NAMES, isDateKey } from './church-calendar.js';

export const ARCHIVE_BUCKET = 'church-archive';
export const ARCHIVE_PAGES = Object.freeze(['calendar', 'letters-from-bg', 'current-events', 'previous-events']);
export const KINDS = Object.freeze(['calendar', 'letter', 'flyer']);
const TYPES = { jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };

/** The picture type from the bytes themselves (never the server's word), or '' when the bytes are not a picture. */
export function sniffType(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return TYPES.jpeg;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return TYPES.png;
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return TYPES.gif;
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') return TYPES.webp;
  return '';
}

/** Where the bytes live in the bucket: <instance_id>/<sha256>.<ext> (the table's path check says the same). */
export function storagePath(instanceId, sha256, contentType) {
  return `${instanceId}/${String(sha256).toLowerCase()}.${String(contentType).split('/')[1]}`;
}

/** The church's own year and month on the day an ISO time falls. */
export function churchMonthOf(iso, timeZone = CHURCH_TIME_ZONE) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit' }).formatToParts(d);
    const got = {};
    for (const p of parts) got[p.type] = p.value;
    return { year: Number(got.year), month: Number(got.month) };
  } catch {
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  }
}

const baseName = (path) =>
  String(path || '')
    .split('/')
    .pop()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/_orig$/i, '');

function when(stated, seenAt) {
  if (stated && stated.from) return stated;
  const m = churchMonthOf(seenAt);
  return m ? { ...m, from: 'first-seen' } : null;
}

/**
 * The pictures a reading of the site holds, each named for the archive:
 * { kind, sourcePath, sourcePage, title, forYear, forMonth, monthFrom }.
 * `pages` are parseChurchPage() results keyed by ARCHIVE_PAGES name (any may
 * be null: a page that did not read gives nothing). The calendar's month is
 * the page heading's ("november 2026") or else the file name's; a letter's is
 * its file name's ("october-2026-letter"); a flyer's is its file name's when
 * it names one, else the month it was first seen.
 */
export function archiveCandidates(pages = {}, { seenAt } = {}) {
  const out = [];
  const seen = new Set();
  const add = (kind, path, page, title, stated) => {
    const p = String(path || '').replace(/\?.*$/, '');
    if (!/^\/uploads\//.test(p) || seen.has(p)) return;
    const w = when(stated, seenAt);
    if (!w) return;
    seen.add(p);
    out.push({ kind, sourcePath: p, sourcePage: page, title: String(title || '').slice(0, 200), forYear: w.year, forMonth: w.month, monthFrom: w.from });
  };
  const named = (path) => {
    const m = monthFrom(baseName(path).replace(/^\d{1,2}-/, ''));
    return m ? { year: m.year, month: m.month, from: 'file' } : null;
  };
  const pathsOf = (pg) => (pg ? [...pg.pictures.map((x) => x.path), ...pg.images] : []);

  const cal = pages.calendar;
  if (cal) {
    const heading = monthFrom(cal.headings.find((h) => monthFrom(h)) || '');
    const pics = pathsOf(cal).filter((p) => /calendar/i.test(p));
    for (const p of pics.length ? pics : pathsOf(cal).slice(0, 1)) {
      const stated = named(p) || (heading ? { year: heading.year, month: heading.month, from: 'page' } : null);
      const label = stated ? `${MONTH_NAMES[stated.month - 1]} ${stated.year} calendar` : 'Church calendar';
      add('calendar', p, 'calendar', label, stated);
    }
  }
  const letters = pages['letters-from-bg'];
  if (letters) {
    const pics = pathsOf(letters).filter((p) => /letter/i.test(p));
    for (const p of pics.length ? pics : pathsOf(letters).slice(0, 1)) {
      const stated = named(p);
      add('letter', p, 'letters-from-bg', stated ? `${MONTH_NAMES[stated.month - 1]} ${stated.year} Letter from BG` : 'Letter from BG', stated);
    }
  }
  for (const page of ['current-events', 'previous-events']) {
    for (const p of pathsOf(pages[page])) add('flyer', p, page, flyerName(p) || 'Flyer', named(p));
  }
  return out;
}

/**
 * One item per content, the way the table keeps it: the first sighting wins,
 * the earliest seenAt is kept, and a month the page or file states replaces
 * one inferred from the day seen. Items without a sha256 are dropped.
 */
export function dedupeByContent(items) {
  const by = new Map();
  for (const it of Array.isArray(items) ? items : []) {
    const key = it && typeof it.sha256 === 'string' ? it.sha256.toLowerCase() : '';
    if (!/^[0-9a-f]{64}$/.test(key)) continue;
    const had = by.get(key);
    if (!had) {
      by.set(key, { ...it, sha256: key, seenCount: 1 });
      continue;
    }
    const earlier = String(it.seenAt || '') < String(had.seenAt || '') ? it.seenAt : had.seenAt;
    const better = had.monthFrom === 'first-seen' && it.monthFrom && it.monthFrom !== 'first-seen';
    by.set(key, {
      ...had,
      seenAt: earlier,
      seenCount: had.seenCount + 1,
      ...(better ? { forYear: it.forYear, forMonth: it.forMonth, monthFrom: it.monthFrom } : {}),
    });
  }
  return [...by.values()];
}

// ── the app's month view ─────────────────────────────────────────────────────
const plural = (n, one, many) => (n === 1 ? one : `${n} ${many}`);

/**
 * Archive rows (snake or camel) and archived calendar events grouped by the
 * month they were for, newest month first:
 * [{ year, month, key, label, calendar: [], letter: [], flyers: [], events: [] }].
 */
export function archiveMonths(rows = [], archivedEvents = []) {
  const by = new Map();
  const slot = (year, month) => {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (!by.has(key)) by.set(key, { year, month, key, label: `${MONTH_NAMES[month - 1]} ${year}`, calendar: [], letter: [], flyers: [], events: [] });
    return by.get(key);
  };
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r) continue;
    const year = Number(r.for_year ?? r.forYear);
    const month = Number(r.for_month ?? r.forMonth);
    const kind = r.kind;
    if (!KINDS.includes(kind) || !(month >= 1 && month <= 12) || !(year >= 2000)) continue;
    const item = {
      id: r.id || r.sha256,
      kind,
      title: r.title || '',
      path: r.storage_path ?? r.storagePath ?? '',
      firstSeenAt: r.first_seen_at ?? r.firstSeenAt ?? '',
      monthFrom: r.month_from ?? r.monthFrom ?? 'first-seen',
      foundVia: r.found_via ?? r.foundVia ?? 'site',
    };
    const s = slot(year, month);
    (kind === 'flyer' ? s.flyers : s[kind]).push(item);
  }
  for (const e of Array.isArray(archivedEvents) ? archivedEvents : []) {
    if (!e || !isDateKey(e.date)) continue;
    slot(Number(e.date.slice(0, 4)), Number(e.date.slice(5, 7))).events.push(e);
  }
  const byFirst = (a, b) => String(a.firstSeenAt).localeCompare(String(b.firstSeenAt)) || String(a.title).localeCompare(String(b.title));
  return [...by.values()]
    .map((m) => ({
      ...m,
      calendar: m.calendar.sort(byFirst),
      letter: m.letter.sort(byFirst),
      flyers: m.flyers.sort(byFirst),
      events: m.events.sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

/** "November 2026: the calendar, the letter, 3 flyers" — what one month holds, in words. */
export function monthSummary(m) {
  if (!m) return '';
  const parts = [];
  if (m.calendar.length) parts.push(m.calendar.length === 1 ? 'the calendar' : `the calendar (${m.calendar.length} versions)`);
  if (m.letter.length) parts.push(m.letter.length === 1 ? 'the letter' : `${m.letter.length} letters`);
  if (m.flyers.length) parts.push(plural(m.flyers.length, '1 flyer', 'flyers'));
  if (m.events.length) parts.push(plural(m.events.length, '1 archived event', 'archived events'));
  return `${m.label}: ${parts.join(', ') || 'nothing kept'}`;
}

/** The archive's months grouped by year, newest first: [{ year, months }]. */
export function archiveYears(months) {
  const by = new Map();
  for (const m of Array.isArray(months) ? months : []) {
    if (!by.has(m.year)) by.set(m.year, []);
    by.get(m.year).push(m);
  }
  return [...by.entries()].map(([year, ms]) => ({ year, months: ms })).sort((a, b) => b.year - a.year);
}

/**
 * What the office's Remove does to an event, the same rule
 * church_calendar_remove() applies in the database: an event that began
 * before today is ARCHIVED (kept in history, with who and when); one from
 * today on is deleted. Unknown today archives, never deletes.
 */
export function removalOutcome(ev, todayKey) {
  if (!ev || !isDateKey(ev.date) || !isDateKey(todayKey)) return 'archive';
  return ev.date < todayKey ? 'archive' : 'delete';
}
