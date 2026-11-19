// =============================================================================
// church-calendar — the church calendar as EVENT RECORDS, not one picture
// (DR-1585)
// =============================================================================
// Darrell 2026-11-18/19, on the Times tab: "Larger text doesn't enlarge the
// fonts on the images.... or documents" and "Calendar connects the week days
// when clicked shows that day this week or a button to see the month year".
// The month's calendar was one picture from the church website (DR-1550). A
// picture cannot grow with the reader's text size, be tapped by day, or be
// added to. This is the pure model the calendar surface reads instead: dated
// records with a name, a time and a place.
//
// WHERE A RECORD COMES FROM (each record names its source; nothing is painted):
//   'announced'  the church record's own announcedEvents (lib/default-church.js)
//   'office'     a row the church office added: ministry_ops, ministry =
//                'calendar' (migration 0099; owner/admin write, members read)
//   'service'    a weekly service in the church record, placed on its weekday
//
// Pure and deterministic: dates are YYYY-MM-DD keys handled in UTC arithmetic,
// "today" is passed in (lib/home-week.js churchDateKey), nothing here reads a
// clock, storage or the network. A row that cannot be dated is dropped and
// counted, never guessed (DR-0076).
// =============================================================================
import { parseServiceTime } from './church-live.js';

export const CALENDAR_MINISTRY = 'calendar';
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const asStr = (v) => (typeof v === 'string' ? v.trim() : '');

// ── dates ────────────────────────────────────────────────────────────────────
/** True for a real calendar day written YYYY-MM-DD (2026-02-30 is not one). */
export function isDateKey(key) {
  const m = KEY_RE.exec(String(key || ''));
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}
const toDate = (key) => new Date(`${key}T00:00:00Z`);
const keyOf = (d) => d.toISOString().slice(0, 10);
export function addDays(key, n) {
  const d = toDate(key);
  d.setUTCDate(d.getUTCDate() + Number(n));
  return keyOf(d);
}
/** Weekday 0–6 (Sunday = 0) of a date key. */
export const dayOfWeek = (key) => toDate(key).getUTCDay();
/** The Sunday on or before a date key. */
export const weekStart = (key) => addDays(key, -dayOfWeek(key));
export const partsOf = (key) => ({ year: +key.slice(0, 4), month: +key.slice(5, 7), day: +key.slice(8, 10) });
const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;
/** "Sunday, November 15, 2026" — words, so a screen reader and a large font both read it. */
export function longDate(key) {
  if (!isDateKey(key)) return '';
  const { year, month, day } = partsOf(key);
  return `${DAY_NAMES[dayOfWeek(key)]}, ${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}
export const monthLabel = ({ year, month }) => `${MONTH_NAMES[month - 1]} ${year}`;

// ── the record ───────────────────────────────────────────────────────────────
/**
 * One calendar event, or null when it has no name or no real date. An endDate
 * before the start, or not a real day, is dropped (the event stays one day).
 */
export function makeEvent(partial = {}) {
  const p = partial || {};
  const name = asStr(p.name);
  const date = asStr(p.date);
  if (!name || !isDateKey(date)) return null;
  const end = asStr(p.endDate);
  return {
    id:
      asStr(p.id) ||
      `evt-${date}-${name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}`,
    name,
    date,
    endDate: isDateKey(end) && end > date ? end : null,
    time: asStr(p.time),
    place: asStr(p.place),
    detail: asStr(p.detail),
    source: asStr(p.source) || 'office',
  };
}

/** The church record's announced events as calendar records. */
export function fromAnnounced(announcedEvents) {
  return (Array.isArray(announcedEvents) ? announcedEvents : []).map((e) => makeEvent({ ...e, source: 'announced' })).filter(Boolean);
}

// An office row keeps its time, place and last day as plain labelled lines in
// `detail`, so the row still reads as words anywhere else it is shown.
const LINE = { time: 'Time', place: 'Place', endDate: 'Through' };
export function encodeDetail({ time = '', place = '', endDate = '', detail = '' } = {}) {
  const lines = [];
  if (asStr(time)) lines.push(`${LINE.time}: ${asStr(time)}`);
  if (asStr(place)) lines.push(`${LINE.place}: ${asStr(place)}`);
  if (isDateKey(asStr(endDate))) lines.push(`${LINE.endDate}: ${asStr(endDate)}`);
  if (asStr(detail)) lines.push(asStr(detail));
  return lines.join('\n');
}
export function decodeDetail(text) {
  const out = { time: '', place: '', endDate: '', detail: '' };
  const rest = [];
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    const m = /^(Time|Place|Through):\s*(.+)$/.exec(line);
    if (m && m[1] === LINE.time && !out.time) out.time = m[2];
    else if (m && m[1] === LINE.place && !out.place) out.place = m[2];
    else if (m && m[1] === LINE.endDate && !out.endDate && isDateKey(m[2])) out.endDate = m[2];
    else if (line) rest.push(line);
  }
  out.detail = rest.join(' ');
  return out;
}

/**
 * Office rows (ministry_ops shape, snake or camel) as calendar records. Only
 * rows filed under the calendar ministry count; an undated one is dropped.
 */
export function fromOfficeRows(rows) {
  const events = [];
  let dropped = 0;
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r || r.ministry !== CALENDAR_MINISTRY) continue;
    const ev = makeEvent({ id: r.id ? `office-${r.id}` : '', name: r.title, date: r.week_of ?? r.weekOf, ...decodeDetail(r.detail), source: 'office' });
    if (ev) events.push({ ...ev, rowId: r.id || null });
    else dropped += 1;
  }
  return { events, dropped };
}

/** One list, one record per id (an office row wins over a bundled one), in date then time order. */
export function mergeEvents(...lists) {
  const byId = new Map();
  for (const list of lists) for (const e of Array.isArray(list) ? list : []) if (e && e.id) byId.set(e.id, e);
  return [...byId.values()].sort(byWhen);
}
const minutes = (e) => {
  const t = parseServiceTime(e.time);
  return t === null ? -1 : t;
};
function byWhen(a, b) {
  return a.date.localeCompare(b.date) || minutes(a) - minutes(b) || a.name.localeCompare(b.name);
}

// ── reading the calendar ─────────────────────────────────────────────────────
const covers = (e, key) => e.date <= key && key <= (e.endDate || e.date);

/** The weekly services that fall on a date, as records for that day. */
export function servicesOnDate(services, key) {
  if (!isDateKey(key)) return [];
  const name = DAY_NAMES[dayOfWeek(key)];
  return (Array.isArray(services) ? services : [])
    .filter((s) => s && s.day === name && asStr(s.label))
    .map((s) => ({
      id: `svc-${s.id || s.label}-${key}`,
      name: s.label,
      date: key,
      endDate: null,
      time: s.endTime ? `${s.time} – ${s.endTime}` : asStr(s.time),
      place: '',
      detail: s.online ? 'In person and live online' : '',
      source: 'service',
    }))
    .sort(byWhen);
}

/** Everything on one day: the weekly services first by time, then the events that cover it. */
export function dayAgenda({ events = [], services = [] } = {}, key) {
  if (!isDateKey(key)) return [];
  return [...servicesOnDate(services, key), ...events.filter((e) => covers(e, key))].sort((a, b) => minutes(a) - minutes(b) || a.name.localeCompare(b.name));
}

/** The seven days (Sunday to Saturday) of the week holding `todayKey`, with how many items each carries. */
export function weekDays({ events = [], services = [] } = {}, todayKey) {
  if (!isDateKey(todayKey)) return [];
  const start = weekStart(todayKey);
  return DAY_NAMES.map((name, i) => {
    const key = addDays(start, i);
    return { key, name, short: name.slice(0, 3), dayOfMonth: partsOf(key).day, isToday: key === todayKey, count: dayAgenda({ events, services }, key).length };
  });
}

/** Move a {year, month} by whole months; a year is twelve. Never leaves 1–12. */
export function shiftMonth({ year, month }, by) {
  const n = year * 12 + (month - 1) + Number(by);
  return { year: Math.floor(n / 12), month: (((n % 12) + 12) % 12) + 1 };
}
export const shiftYear = (ym, by) => shiftMonth(ym, 12 * Number(by));

/** The month as rows of seven cells, Sunday first; a cell outside the month is null. */
export function monthGrid({ year, month }) {
  const first = dateKey(year, month, 1);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Array.from({ length: dayOfWeek(first) }, () => null);
  for (let d = 1; d <= days; d += 1) cells.push(dateKey(year, month, d));
  while (cells.length % 7) cells.push(null);
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

/** The dated events (not the weekly services) that touch a month, in order. */
export function eventsInMonth(events, { year, month }) {
  const first = dateKey(year, month, 1);
  const last = dateKey(year, month, new Date(Date.UTC(year, month, 0)).getUTCDate());
  return (Array.isArray(events) ? events : []).filter((e) => e.date <= last && (e.endDate || e.date) >= first).sort(byWhen);
}

/** "Jul 14 – 16" / "Aug 29" for a list line. */
export function whenLine(e) {
  const a = partsOf(e.date);
  const head = `${MONTH_NAMES[a.month - 1].slice(0, 3)} ${a.day}`;
  if (!e.endDate) return head;
  const b = partsOf(e.endDate);
  return a.month === b.month && a.year === b.year ? `${head} – ${b.day}` : `${head} – ${MONTH_NAMES[b.month - 1].slice(0, 3)} ${b.day}`;
}

// ── past years and planning (DR-1587) ────────────────────────────────────────
// Darrell 2026-11-18: "Make sure historical events are also populated so users
// and office staff can review and so can parishioners so they can expect what
// will potentially be this year and maybe suggest something before it's too
// late... feedback when it matters... so we can plan as a team."

/** The years that hold a dated event, newest first, with how many each holds. */
export function yearsOnRecord(events) {
  const by = new Map();
  for (const e of Array.isArray(events) ? events : []) by.set(partsOf(e.date).year, (by.get(partsOf(e.date).year) || 0) + 1);
  return [...by.entries()].map(([year, count]) => ({ year, count })).sort((a, b) => b.year - a.year);
}

// The same month and day in another year; February 29 lands on February 28 where that year has none.
function sameDayIn(year, key) {
  const { month, day } = partsOf(key);
  const k = dateKey(year, month, day);
  return isDateKey(k) ? k : dateKey(year, month, day - 1);
}

/**
 * What happened in PAST years at the time of year now coming up: every event
 * from a year before today's whose same month and day falls from today through
 * `days` days ahead (the window crosses a year end). Each is returned with the
 * date it would fall on this time round and how many years ago it was. This is
 * a look back at the record, not a schedule: nothing here says an event WILL
 * happen.
 */
export function comingUpFromPastYears(events, todayKey, { days = 60 } = {}) {
  if (!isDateKey(todayKey)) return [];
  const until = addDays(todayKey, days);
  const thisYear = partsOf(todayKey).year;
  const out = [];
  for (const e of Array.isArray(events) ? events : []) {
    const y = partsOf(e.date).year;
    if (y >= thisYear) continue;
    const around = [sameDayIn(thisYear, e.date), sameDayIn(thisYear + 1, e.date)].find((k) => k >= todayKey && k <= until);
    if (around) out.push({ event: e, around, yearsAgo: partsOf(around).year - y });
  }
  return out.sort((a, b) => a.around.localeCompare(b.around) || a.yearsAgo - b.yearsAgo || a.event.name.localeCompare(b.event.name));
}

/** Dated events from today through `days` days ahead. */
export function upcomingEvents(events, todayKey, { days = 90 } = {}) {
  if (!isDateKey(todayKey)) return [];
  const until = addDays(todayKey, days);
  return (Array.isArray(events) ? events : []).filter((e) => (e.endDate || e.date) >= todayKey && e.date <= until).sort(byWhen);
}

// A suggestion rides the app's existing feedback list (the Feedback button's
// own pipe, the way class interest does: lib/church-classes.js), marked by
// this tag so the office's view can pull it back out.
export const CALENDAR_SUGGESTION_TAG = '[Calendar suggestion]';
export const SUGGESTION_MAX = 600;

/** The feedback text for one suggestion, or '' when there are no words to send. */
export function suggestionText({ about = '', text = '', from = '' } = {}) {
  const words = asStr(text).slice(0, SUGGESTION_MAX);
  if (!words) return '';
  return `${CALENDAR_SUGGESTION_TAG} ${asStr(from) || 'A parishioner'} · About: ${asStr(about) || 'A new idea'} · ${words}`;
}

/** The calendar suggestions in a feedback list, newest first, each once. */
export function extractCalendarSuggestions(items) {
  const seen = new Set();
  const out = [];
  for (const f of Array.isArray(items) ? items : []) {
    if (!f || typeof f.text !== 'string' || !f.text.startsWith(CALENDAR_SUGGESTION_TAG)) continue;
    const at = f.createdAt || f.submittedAt || '';
    const key = f.id || `${f.text}|${at}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const [who = '', about = '', ...rest] = f.text.slice(CALENDAR_SUGGESTION_TAG.length).split(' · ');
    out.push({ id: key, who: who.trim() || 'A parishioner', about: about.replace(/^About:\s*/, '').trim(), text: rest.join(' · ').trim(), at });
  }
  return out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
