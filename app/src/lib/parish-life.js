// =============================================================================
// parish-life — what the Give & Serve tab's Parish Life list shows (DR-1595)
// =============================================================================
// Darrell, 2026-11-19, over a November screen still listing July's National
// Assembly and August's Gospel Fest: "Old events for Parish Life... Ari not
// noticing obvious reasons for updating texts?!!!!"
//
// The list used to read the church record's fixed `announcedEvents`, which
// have no end: once typed, an event stayed on the screen forever. It now reads
// the same merged calendar the office edits (the church record's events plus
// the rows the office added, lib/church-calendar.js) and keeps only what has
// not ended yet, in the church's own time zone. Past events are not lost: they
// stay in the calendar's months and past years (DR-1587).
import { isDateKey } from './church-calendar.js';

/** How many coming events Parish Life lists before pointing to the calendar. */
export const PARISH_LIFE_LIMIT = 6;

/**
 * The events still to come or under way on `todayKey` (a YYYY-MM-DD in the
 * church's zone), soonest first, at most `limit`. An event is kept through its
 * last day: a three-day assembly shows on its second day, not after its end.
 * An unreadable today shows nothing rather than everything.
 */
export function parishLifeEvents(events, todayKey, { limit = PARISH_LIFE_LIMIT } = {}) {
  if (!isDateKey(todayKey)) return [];
  return (Array.isArray(events) ? events : [])
    .filter((e) => e && isDateKey(e.date) && (e.endDate || e.date) >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date) || String(a.name).localeCompare(String(b.name)))
    .slice(0, Math.max(0, limit));
}

/**
 * The events that have ENDED before `todayKey`, newest first. Darrell, the
 * same day: "We like to keep historical events and activities etc..." The
 * coming list never deletes anything; what has passed is shown here, kept.
 */
export function parishLifePast(events, todayKey) {
  if (!isDateKey(todayKey)) return [];
  return (Array.isArray(events) ? events : [])
    .filter((e) => e && isDateKey(e.date) && (e.endDate || e.date) < todayKey)
    .sort((a, b) => b.date.localeCompare(a.date) || String(a.name).localeCompare(String(b.name)));
}
