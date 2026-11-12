// =============================================================================
// home-week — what the Love Corner homepage leads with on each day of the week
// =============================================================================
// The redesign brief (2026-11-12, §9): Sunday leads with worship; Monday and
// Tuesday with the devotional and the week's challenge; Wednesday with Bible
// Study; Thursday to Saturday with ministries, learning and the coming Sunday.
// "Use actual church schedules and event data rather than invented events or
// hardcoded dates. If no current content is available, show an appropriate
// fallback."
//
// Pure and deterministic: `now` is passed in, the services are the church
// record's own (lib/default-church.js → resolveChurch), the weekday is read in
// the church's wall clock (lib/church-live.js CHURCH_TIME_ZONE), and a card
// only ever names a service that exists in that record. Announced events are
// filtered to the FUTURE; when none remain the card says so, it never paints
// one (DR-0076 §1, Reality-Trace P15).
import { CHURCH_TIME_ZONE, parseServiceTime } from './church-live.js';

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_INDEX = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

/** Weekday (0–6), hour and minute of `now` in the church's time zone. */
export function churchClock(now = new Date(), timeZone = CHURCH_TIME_ZONE) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(now);
    const got = {};
    for (const p of parts) got[p.type] = p.value;
    const day = DAY_INDEX[got.weekday];
    return { day: Number.isInteger(day) ? day : now.getDay(), hour: parseInt(got.hour, 10) % 24, minute: parseInt(got.minute, 10) || 0 };
  } catch {
    return { day: now.getDay(), hour: now.getHours(), minute: now.getMinutes() };
  }
}

/** Today's date as YYYY-MM-DD in the church's wall clock. */
export function churchDateKey(now = new Date(), timeZone = CHURCH_TIME_ZONE) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const got = {};
    for (const p of parts) got[p.type] = p.value;
    return `${got.year}-${got.month}-${got.day}`;
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

const dayOf = (svc) => DAY_INDEX[String(svc && svc.day)];

/** The services the record holds for one weekday, in time order. */
export function servicesOn(services, day) {
  return (services || []).filter((s) => dayOf(s) === day).sort((a, b) => (parseServiceTime(a.time) || 0) - (parseServiceTime(b.time) || 0));
}

/** The seven-day strip: which days carry a service, and which is today. */
export function weekStrip(services, now = new Date()) {
  const { day } = churchClock(now);
  return DAY_NAMES.map((name, i) => ({
    day: i,
    name,
    letter: name[0],
    today: i === day,
    services: servicesOn(services, i).map((s) => `${s.label} ${s.time}`),
  }));
}

/** The next service start after now, as { service, dayName }, or null. */
export function nextService(services, now = new Date()) {
  const { day, hour, minute } = churchClock(now);
  const nowMin = hour * 60 + minute;
  let best = null;
  for (const s of services || []) {
    const d = dayOf(s);
    const t = parseServiceTime(s.time);
    if (!Number.isInteger(d) || t == null) continue;
    let delta = ((d - day + 7) % 7) * 1440 + (t - nowMin);
    if (delta < 0) delta += 7 * 1440;
    if (!best || delta < best.delta) best = { delta, service: s, dayName: DAY_NAMES[d], today: d === day };
  }
  return best;
}

/** Announced events on or after today, soonest first; never the past. */
export function upcomingAnnounced(events, now = new Date()) {
  const today = churchDateKey(now);
  return (events || []).filter((e) => e && typeof e.date === 'string' && (e.endDate || e.date) >= today).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * The rotating feature cards for the top of the homepage. Order: the day's
 * lead, then the next announced event or the honest "none posted" card, then
 * the first-visit card. Every card carries the id of the surface it opens.
 */
export function featureCards({ services = [], announcedEvents = [], now = new Date() } = {}) {
  const { day } = churchClock(now);
  const today = servicesOn(services, day);
  const next = nextService(services, now);
  const times = (list) => list.map((s) => s.time).join(' and ');
  const cards = [];
  if (day === 0 && today.length) {
    cards.push({
      id: 'sunday',
      kicker: 'Sunday',
      title: 'Worship with us today',
      body: `${today[0].label} at ${today[0].time}. Watch live here, follow along in the Word, and catch the message after.`,
      open: { sub: 'home', section: 'worship' },
    });
  } else if (day === 3 && today.length) {
    cards.push({
      id: 'wednesday',
      kicker: 'Wednesday',
      title: `Bible Study at ${times(today)}`,
      body: 'Midweek in the Word with Bishop Gwin. Watch live or come in person.',
      open: { sub: 'home', section: 'worship' },
    });
  } else if (day === 1 || day === 2) {
    cards.push({
      id: 'start',
      kicker: 'Start the week',
      title: "Today's reading and this week's challenge",
      body: 'A short reading in the Word, a memory verse, and a lesson you can finish before Wednesday.',
      open: { sub: 'learn' },
    });
  } else {
    const ahead = next ? `${next.service.label}, ${next.today ? 'today' : next.dayName} ${next.service.time}` : 'the next service';
    cards.push({
      id: 'ahead',
      kicker: 'Getting ready',
      title: 'Ministries, learning, and Sunday ahead',
      body: `Serve this week, keep learning, and plan for ${ahead}.`,
      open: { sub: 'ministries' },
    });
  }
  const soon = upcomingAnnounced(announcedEvents, now);
  if (soon.length) {
    const e = soon[0];
    cards.push({
      id: `event-${e.id}`,
      kicker: 'Coming up',
      title: e.name,
      body: [e.date, e.detail].filter(Boolean).join(' · '),
      open: { sub: 'home', section: 'times' },
    });
  } else {
    cards.push({
      id: 'no-events',
      kicker: 'Announcements',
      title: 'No new announcements posted',
      body: 'When the office posts one, it appears here first. The weekly services are always below.',
      open: { sub: 'home', section: 'times' },
    });
  }
  cards.push({
    id: 'visit',
    kicker: 'New here?',
    title: 'Plan your first visit',
    body: 'Where we are, when we meet, and someone to greet you at the door.',
    open: { sub: 'home', section: 'about' },
  });
  return cards;
}

/** One line for "This week": today's services, or the next one and the open-all-week doors. */
export function todayLine(services, now = new Date()) {
  const { day } = churchClock(now);
  const today = servicesOn(services, day);
  if (today.length)
    return { heading: `Today: ${today.map((s) => `${s.label} ${s.time}`).join(' · ')}`, body: 'Live on the church channel and in the sanctuary.' };
  const next = nextService(services, now);
  const ahead = next ? `${next.service.label}, ${next.dayName} ${next.service.time}` : 'the next published service';
  return { heading: DAY_NAMES[day], body: `No service today. Next up: ${ahead}. The Word and the Youth Zone are open all week.` };
}
