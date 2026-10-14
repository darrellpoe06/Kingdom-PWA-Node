#!/usr/bin/env node
// =============================================================================
// bus-witness — the city bus at a real address, from the agency's own feed (DR-1019)
// =============================================================================
// Darrell, 2026-10-14: "I'm sure there is a bus stop closer than a mile away...
// I believe out front... or really close... find out so we can tell our
// potential clients."
//
// "What's nearby" reads the city bus from OpenStreetMap (DR-1014): the two
// nearest stops, with whatever route numbers the map carries. The map is a
// volunteer's copy; the schedule is the agency's. This reads the agency's own
// GTFS feed (the file every transit app is built from) on a runner, because
// the cloud sandbox has no route to mtd.org, and says, for every stop within a
// short walk of THIS house: how far in feet, which routes stop there, which
// days they run, and how many buses a day — with the feed's own date window,
// so a stale feed says so instead of reading as today.
//
// Read-only. Never prints the exact point. Exit 0 only when the address was
// looked up, the feed was read, and at least one stop was found within the
// walk; 1 otherwise.
//
// Usage: node scripts/bus-witness.mjs <gtfs-dir> "805 North Prospect Avenue" Champaign Illinois
// =============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { haversineMiles, feetText, milesText } from '../app/src/modules/properties/area.js';

export const WALK_MILES = 0.5;
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_SHORT = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

/** A small RFC-4180 reader: quoted fields, doubled quotes, CRLF; rows as objects by header. */
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  const s = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i += 1; } else q = false; } else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i += 1;
      row.push(field); field = ''; rows.push(row); row = [];
    } else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = (rows.shift() || []).map((h) => h.trim());
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== '')).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

/** Read the GTFS files the witness needs from a directory; optional files read as []. */
export function readGtfs(dir) {
  const read = (name, required) => {
    const p = join(dir, name);
    if (!existsSync(p)) { if (required) throw new Error(`GTFS is missing ${name}`); return []; }
    return parseCsv(readFileSync(p, 'utf8'));
  };
  return {
    stops: read('stops.txt', true), routes: read('routes.txt', true), trips: read('trips.txt', true),
    stop_times: read('stop_times.txt', true), calendar: read('calendar.txt', false),
    calendar_dates: read('calendar_dates.txt', false), feed_info: read('feed_info.txt', false),
  };
}

/** Days a calendar row runs, in order Mon..Sun. */
export function serviceDays(cal) {
  return DAYS.filter((d) => String(cal?.[d] || '') === '1');
}

/** YYYYMMDD -> Mon..Sun name (UTC; a date, not an instant). */
export function weekdayOf(yyyymmdd) {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(String(yyyymmdd || ''));
  if (!m) return '';
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return DAYS[(d.getUTCDay() + 6) % 7];
}

function addDays(yyyymmdd, n) {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(yyyymmdd);
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + n));
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Every date each service runs: calendar.txt's weekly pattern across its
 * range, plus calendar_dates.txt's additions (exception_type 1), minus its
 * removals (2). MTD's feed (read 2026-10-14) keeps every calendar.txt row at
 * all zeros and defines the whole service in 12,395 calendar_dates rows, so
 * a reader of the weekly pattern alone says "no days" for every route.
 * Ranges are capped at 400 days so a malformed feed cannot run away.
 */
export function serviceDates(gtfs) {
  const dates = new Map();
  const add = (sid, d) => { if (!dates.has(sid)) dates.set(sid, new Set()); dates.get(sid).add(d); };
  for (const c of gtfs.calendar || []) {
    const days = new Set(serviceDays(c));
    if (!days.size || !/^\d{8}$/.test(c.start_date || '') || !/^\d{8}$/.test(c.end_date || '')) continue;
    for (let d = c.start_date, i = 0; d <= c.end_date && i < 400; d = addDays(d, 1), i += 1) {
      if (days.has(weekdayOf(d))) add(c.service_id, d);
    }
  }
  for (const e of gtfs.calendar_dates || []) {
    if (String(e.exception_type) === '1') add(e.service_id, e.date);
    else if (String(e.exception_type) === '2') dates.get(e.service_id)?.delete(e.date);
  }
  return dates;
}

/** "Mon–Fri", "Sat, Sun", "every day", or "" for none. */
export function daysText(days) {
  const set = DAYS.filter((d) => days.includes(d));
  if (set.length === 7) return 'every day';
  if (!set.length) return '';
  const idx = set.map((d) => DAYS.indexOf(d));
  const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  if (contiguous && set.length >= 3) return `${DAY_SHORT[set[0]]}–${DAY_SHORT[set[set.length - 1]]}`;
  return set.map((d) => DAY_SHORT[d]).join(', ');
}

/** The feed's own window: feed_info first, else the calendar's span. YYYYMMDD strings. */
export function feedWindow(gtfs) {
  const fi = gtfs.feed_info?.[0];
  if (fi?.feed_start_date && fi?.feed_end_date) return { start: fi.feed_start_date, end: fi.feed_end_date };
  const starts = gtfs.calendar.map((c) => c.start_date).filter(Boolean).sort();
  const ends = gtfs.calendar.map((c) => c.end_date).filter(Boolean).sort();
  return starts.length ? { start: starts[0], end: ends[ends.length - 1] } : null;
}

/** Stops (grouped by parent station when the feed has one) within `miles` of the point, nearest first. */
export function stopsNear(gtfs, point, miles = WALK_MILES) {
  // A station's own row (the corner) names the group; its platforms carry
  // "(NE)" / "(SW)" suffixes a renter does not need.
  const stationName = new Map(gtfs.stops.filter((s) => String(s.location_type || '0') === '1').map((s) => [s.stop_id, s.stop_name]));
  const byKey = new Map();
  for (const s of gtfs.stops) {
    const lat = Number(s.stop_lat), lng = Number(s.stop_lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const m = haversineMiles(point, { lat, lng });
    if (m > miles) continue;
    const key = s.parent_station || s.stop_id;
    const cur = byKey.get(key);
    if (!cur || m < cur.miles) byKey.set(key, { key, name: stationName.get(key) || s.stop_name, miles: m, ids: cur ? cur.ids : [] });
    byKey.get(key).ids.push(s.stop_id);
  }
  return [...byKey.values()].sort((a, b) => a.miles - b.miles);
}

/**
 * Routes serving a set of stop ids: [{route, days, tripsPerDay}], most trips
 * first. Grouped by the route's NAME, not its id: MTD carries one name on
 * several route_ids (a weekday, a Saturday and a Sunday pattern, or a seasonal
 * variant), and read live 2026-10-14 (bus-witness 38597296070) the id-keyed
 * list printed "70 Grey — Sat · about 23 buses" and "70 Grey — Sat · about 9
 * buses" at one corner. Trips of every id with the same name are summed per
 * date, so the busiest day is the day's whole count.
 */
export function routesAtStop(gtfs, stopIds) {
  const ids = new Set(stopIds);
  const tripIds = new Set();
  for (const st of gtfs.stop_times) if (ids.has(st.stop_id)) tripIds.add(st.trip_id);
  const dates = gtfs._dates || (gtfs._dates = serviceDates(gtfs));
  const routes = new Map(gtfs.routes.map((r) => [r.route_id, r]));
  const acc = new Map();
  for (const t of gtfs.trips) {
    if (!tripIds.has(t.trip_id)) continue;
    const r = routes.get(t.route_id); if (!r) continue;
    const key = routeName(r);
    const a = acc.get(key) || { route: r, perDate: new Map() };
    for (const d of dates.get(t.service_id) || []) a.perDate.set(d, (a.perDate.get(d) || 0) + 1);
    acc.set(key, a);
  }
  return [...acc.values()].map((a) => {
    const seen = new Set([...a.perDate.keys()].map(weekdayOf));
    const days = DAYS.filter((d) => seen.has(d));
    const busiest = Math.max(0, ...a.perDate.values());
    return { route: a.route, days, tripsPerDay: busiest };
  }).sort((a, b) => b.tripsPerDay - a.tripsPerDay);
}

export function routeName(r) {
  const short = String(r.route_short_name || '').trim(), long = String(r.route_long_name || '').trim();
  return [short, long].filter(Boolean).join(' ') || r.route_id;
}

/** The lines the witness prints for a point. */
export function report(gtfs, point, { withinMiles = WALK_MILES } = {}) {
  const lines = [];
  const w = feedWindow(gtfs);
  lines.push(w ? `feed window: ${w.start} to ${w.end}` : 'feed window: not stated');
  if (gtfs.calendar_dates.length) lines.push(`calendar exceptions (applied: added days counted, removed days dropped): ${gtfs.calendar_dates.length}`);
  const near = stopsNear(gtfs, point, withinMiles);
  lines.push(`stops within ${milesText(withinMiles)}: ${near.length}`);
  for (const s of near) {
    lines.push(`  ${s.name} · ${feetText(s.miles)}`);
    const rs = routesAtStop(gtfs, s.ids);
    if (!rs.length) lines.push('    no route in the feed stops here');
    for (const r of rs) lines.push(`    ${routeName(r.route)} — ${daysText(r.days) || 'no days in the calendar'} · about ${r.tripsPerDay} ${r.tripsPerDay === 1 ? 'bus' : 'buses'} on its busiest day`);
  }
  return { lines, stops: near.length };
}

async function main() {
  const [dir, street, city = '', state = ''] = process.argv.slice(2);
  if (!dir || !street) { console.error('usage: bus-witness.mjs <gtfs-dir> "<street>" <city> <state>'); process.exit(2); }
  const { geocode } = await import('../app/functions/geocode.js');
  const { matchesAddress } = await import('../app/src/modules/properties/place-on-map.js');
  const query = [street, city, state].filter(Boolean).join(', ');
  const g = await geocode(query);
  if (!g.ok) { console.error(`LOOKUP FAILED for "${query}": ${g.reason}`); process.exit(1); }
  console.log(`matched (${g.source}): ${g.matched}`);
  if (!matchesAddress(g.matched, { address: street, city })) {
    console.error(`NOT THIS HOUSE: "${g.matched}" does not carry the house number and town of "${query}".`);
    process.exit(1);
  }
  let gtfs;
  try { gtfs = readGtfs(dir); } catch (e) { console.error(`FEED FAILED: ${e.message}`); process.exit(1); }
  console.log(`feed: ${gtfs.stops.length} stops, ${gtfs.routes.length} routes, ${gtfs.trips.length} trips, ${gtfs.stop_times.length} stop times`);
  const r = report(gtfs, { lat: g.lat, lng: g.lng });
  for (const l of r.lines) console.log(l);
  if (!r.stops) { console.error(`NO STOP within ${milesText(WALK_MILES)} of this house in the feed.`); process.exit(1); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(`bus-witness: ${e?.message || e}`); process.exit(1); });
}
