// =============================================================================
// church-calendar-read — the office's picture read into dated events
// (DR-1644)
// =============================================================================
// Darrell 2026-11-24: "The events should show from the calendar for that
// specific day!!!!!!!! ... Automatic Calendar update where it has something on
// a specific day" and, over the Battle Cry Sunday flyer, "This should be
// showing on that day... perpetually".
//
// The church office publishes its month as ONE picture and its events as
// flyers (DR-1550). The daily reader (scripts/church-calendar-read.mjs) asks a
// vision model to list what each picture says, ONCE per picture (by its
// sha256), and this module is everything around that call that must not be
// left to the model: the request, the answer's shape, and the checks every
// event passes before it may be filed (DR-0076):
//   - a real day, inside the month the calendar is for (a flyer: within a
//     year either side of the month it was posted);
//   - a name, short enough to be a name;
//   - not a weekly service the church record already shows on that weekday;
//   - one per name per day.
// What fails is dropped and counted, never repaired by guessing.
//
// Pure: no clock, no network, no storage.
// =============================================================================
import { isDateKey, partsOf, dayOfWeek, DAY_NAMES, MONTH_NAMES } from './church-calendar.js';
import { parseServiceTime } from './church-live.js';

export const READ_MODEL = 'claude-opus-5-5';
export const READ_MAX_TOKENS = 16000;
export const READ_TIMEOUT_MS = 180000;
/** At most this many pictures are read in one run (the budget; each is read once, ever). */
export const READ_MAX_PER_RUN = 6;
export const MAX_EVENTS = 120;
const NAME_MAX = 200;
const asStr = (v) => (typeof v === 'string' ? v.trim() : '');

/** The JSON shape the model must answer in (structured output). */
export const READ_SCHEMA = Object.freeze({
  type: 'object',
  additionalProperties: false,
  required: ['events'],
  properties: {
    events: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['date', 'name', 'time', 'place', 'detail'],
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD' },
          name: { type: 'string' },
          time: { type: 'string', description: 'as printed, e.g. "9:00 AM" or "1:00 PM & 6:00 PM"; empty when none' },
          place: { type: 'string', description: 'as printed, e.g. "Café", "Sanctuary", "Zoom"; empty when none' },
          detail: { type: 'string', description: 'any other words printed with it; empty when none' },
        },
      },
    },
  },
});

/** The instruction for one picture. Words only; the picture goes with it. */
export function readPrompt({ kind, year, month, services = [] }) {
  const label = `${MONTH_NAMES[month - 1]} ${year}`;
  const standing = services
    .filter((s) => s && s.day && s.time && s.label)
    .map((s) => `${s.day} ${s.time} ${s.label}`)
    .join('; ');
  const common = [
    'Copy the words exactly as printed. Never invent an event, a day, a time or a place that is not printed.',
    'If a word cannot be read with confidence, leave that event out rather than guess.',
    standing
      ? `These weekly services are already shown every week and must be left out: ${standing}. Anything else printed on those days (a communion, an anniversary, a guest, a special service) is its own event.`
      : '',
    'Answer only with the JSON the schema asks for.',
  ].filter(Boolean);
  if (kind === 'calendar') {
    return [
      `This is the church office's printed calendar for ${label}.`,
      `List every event printed inside a numbered day square, one event per item, with that square's date in ${label} as YYYY-MM-DD.`,
      'A day square with several lines holds several events: list each one on its own (for example "1:00 PM & 6:00 PM Rap Bible Study" is ONE event with time "1:00 PM & 6:00 PM").',
      "Squares outside the month (blank or another month's numbers) hold nothing for this month. Leave out the office hours and the boxes below the grid.",
      ...common,
    ].join('\n');
  }
  return [
    `This is a flyer the church office posted around ${label}.`,
    'List the event or events it announces that have a printed date, with the date as YYYY-MM-DD (use the printed year; if no year is printed, the year nearest to the posting month).',
    'Put the event title in name, the printed time in time, the place in place, and who is speaking or featured (with their printed titles) in detail.',
    'A flyer with no printed date announces nothing for the calendar: answer with an empty list.',
    ...common,
  ].join('\n');
}

/** The Messages API body for one picture (base64 bytes, its media type). */
export function readRequest({ kind, year, month, services, base64, mediaType }) {
  return {
    model: READ_MODEL,
    max_tokens: READ_MAX_TOKENS,
    output_config: { effort: 'high', format: { type: 'json_schema', schema: READ_SCHEMA } },
    fallbacks: 'default',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: readPrompt({ kind, year, month, services }) },
        ],
      },
    ],
  };
}

/** The answer's text as JSON, or null (a refusal, a cut-off, or not JSON). */
export function answerJson(message) {
  if (!message || message.stop_reason === 'refusal' || message.stop_reason === 'max_tokens') return null;
  const text = (Array.isArray(message.content) ? message.content : [])
    .filter((b) => b && b.type === 'text')
    .map((b) => b.text)
    .join('');
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const norm = (s) =>
  asStr(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** True when an event is a weekly service the church record already shows on that weekday at that time. */
export function isStandingService(ev, services = []) {
  if (!isDateKey(ev.date)) return false;
  const day = DAY_NAMES[dayOfWeek(ev.date)];
  const name = norm(ev.name);
  const times = asStr(ev.time)
    .split(/&|,| and /i)
    .map((t) => parseServiceTime(t.trim()))
    .filter((t) => t !== null);
  return services.some((s) => {
    if (!s || s.day !== day) return false;
    const label = norm(s.label);
    // "Sunday Worship" is "Worship" on a Sunday: the weekday is not part of the name.
    const days = new Set(DAY_NAMES.map((d) => d.toLowerCase()));
    const words = label.split(' ').filter((w) => w.length > 3 && !days.has(w));
    const sameName = words.length > 0 && words.every((w) => name.includes(w));
    const at = parseServiceTime(s.time);
    const sameTime = times.length === 0 || (at !== null && times.includes(at));
    return sameName && sameTime;
  });
}

/** Does a date fall where this picture may speak? A calendar: its own month. A flyer: a year either side. */
export function dateAllowed(key, { kind, year, month }) {
  if (!isDateKey(key)) return false;
  const p = partsOf(key);
  if (kind === 'calendar') return p.year === year && p.month === month;
  const at = year * 12 + (month - 1);
  const it = p.year * 12 + (p.month - 1);
  return Math.abs(it - at) <= 12;
}

/**
 * The model's answer, checked: { events, dropped, reasons }. Each event is
 * { date, name, time, place, detail }. Never throws.
 */
export function checkRead(answer, { kind, year, month, services = [] } = {}) {
  const raw = answer && Array.isArray(answer.events) ? answer.events : [];
  const events = [];
  const reasons = {};
  const drop = (why) => {
    reasons[why] = (reasons[why] || 0) + 1;
  };
  const seen = new Set();
  for (const e of raw.slice(0, MAX_EVENTS)) {
    if (!e || typeof e !== 'object') {
      drop('not-an-event');
      continue;
    }
    const ev = { date: asStr(e.date), name: asStr(e.name).replace(/\s+/g, ' '), time: asStr(e.time), place: asStr(e.place), detail: asStr(e.detail) };
    if (!ev.name || ev.name.length > NAME_MAX) {
      drop('no-name');
      continue;
    }
    if (!dateAllowed(ev.date, { kind, year, month })) {
      drop('day-outside');
      continue;
    }
    if (isStandingService(ev, services)) {
      drop('weekly-service');
      continue;
    }
    const key = `${ev.date}|${norm(ev.name)}`;
    if (seen.has(key)) {
      drop('twice');
      continue;
    }
    seen.add(key);
    events.push({ ...ev, time: ev.time.slice(0, 60), place: ev.place.slice(0, 120), detail: ev.detail.slice(0, 600) });
  }
  if (raw.length > MAX_EVENTS) reasons['over-limit'] = raw.length - MAX_EVENTS;
  const dropped = Object.values(reasons).reduce((a, b) => a + b, 0);
  return { events: events.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name)), dropped, reasons };
}

/** Which archive items are read: calendars and flyers, newest month first, at most `max`. */
export function picturesToRead(items, { max = READ_MAX_PER_RUN, done = new Set() } = {}) {
  return (Array.isArray(items) ? items : [])
    .filter((it) => it && (it.kind === 'calendar' || it.kind === 'flyer') && !done.has(it.sha256))
    .sort((a, b) => b.for_year * 12 + b.for_month - (a.for_year * 12 + a.for_month) || (a.kind === 'calendar' ? -1 : 1))
    .slice(0, max);
}
