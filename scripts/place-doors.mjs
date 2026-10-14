#!/usr/bin/env node
// =============================================================================
// place-doors — the LANE places the family's doors on the map (DR-1015)
// =============================================================================
// Darrell, 2026-10-14, on the shelf: "What's nearby should be on all of
// them!!! Why not!!? Just not the address!!!" and "We want potential clients
// to know its in this area... and these are the Amenities... So potential
// clients know what to expect!!!"
//
// MEASURED: the Apt 4 bed, street held, drew the town and no "What's nearby".
// A held door's card may only show what the shelf hands it: its area and its
// nearby lines, worked out ONCE from the exact point and saved (0270, 0283).
// DR-0998 works them out in the family's own app, in the background, when an
// owner opens it -- and that path is silent when it fails (the Pages
// Functions have been dark since 2026-10-09, #2057, so /geocode answers the
// SPA shell), so no door at 805 was ever placed and the bed had nothing to
// borrow. The stranger saw a town and a price.
//
// So the lane does the placing too, from a runner, the same way the app does
// (the SAME placeDoorsOnTheMap, the SAME address check, the SAME rounding and
// nearby rules) and writes through SQL the database's own trigger still
// rounds and validates (rentals_area_rounded: a line naming the street is
// refused). The exact point is used for the distances and never written.
// A door with an area is never touched: the family's own placement wins.
//
// Pure where it can be: doorsFromJson / updatesSql take and give strings, so
// a test pins the SQL byte for byte. The live lookups live only in main().
//
// Usage: node scripts/place-doors.mjs doors.json > updates.sql
//   doors.json: [{id, instance_id, address, unit, city, state}, ...]
// =============================================================================
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { geocode } from '../app/functions/geocode.js';
import { nearbyAround } from '../app/src/modules/properties/area.js';
import { placeDoorsOnTheMap, matchesAddress } from '../app/src/modules/properties/place-on-map.js';

export const UA = 'PoeTech door placer/1 (+https://poetech.us)';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The doors the database handed over, kept only when they are doors. */
export function doorsFromJson(text) {
  let v;
  try { v = JSON.parse(String(text || '[]')); } catch { return []; }
  if (!Array.isArray(v)) return [];
  return v
    .filter((d) => d && UUID.test(String(d.id || '')) && String(d.address || '').trim())
    .map((d) => ({
      id: String(d.id), instance_id: d.instance_id ? String(d.instance_id) : '',
      address: String(d.address).trim(), unit: String(d.unit || '').trim(),
      city: String(d.city || '').trim(), state: String(d.state || '').trim(),
      // A door that HAS an area but was never asked what is nearby (nearby
      // NULL; DR-1018): the lane fills the list and leaves the area alone.
      had_area: d.had_area === true || d.had_area === 't' || d.had_area === 'true',
    }));
}

/** The app's own placement, with the lane's lookups; collects what it would save. */
export async function placeDoors(doors, { find, around, wait } = {}) {
  const placements = [];
  const byId = new Map((doors || []).map((d) => [d.id, d]));
  const save = async (id, patch, summary) => { placements.push({ id, ...patch, summary, had_area: Boolean(byId.get(id)?.had_area) }); return { ok: true }; };
  const r = await placeDoorsOnTheMap({ rentals: doors, placed: new Set(), find, around, save, ...(wait ? { wait } : {}) });
  return { placements, placed: r.placed, missed: r.missed, looked: r.looked };
}

/**
 * One UPDATE per placed door, in the shape the app's edit path writes: the
 * rounded area, the lines, and the same "[date] Edited — ..." note. Guarded
 * so nothing but a uuid, two finite numbers and the database's own line shape
 * can reach SQL; the trigger rounds and validates again on the server.
 */
export function updatesSql(placements, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const out = [];
  for (const p of placements || []) {
    if (!p || !UUID.test(String(p.id || ''))) continue;
    const lat = Number(p.area_lat); const lng = Number(p.area_lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 85 || Math.abs(lng) > 180) continue;
    const lines = (Array.isArray(p.nearby) ? p.nearby : [])
      .filter((l) => l && typeof l.label === 'string' && l.label.trim() && Number.isFinite(Number(l.miles)))
      .map((l) => ({ label: l.label.trim().slice(0, 80), miles: Number(l.miles) }))
      .filter((l) => l.miles >= 0 && l.miles <= 100)
      .slice(0, 12);
    const json = JSON.stringify(lines);
    if (p.had_area) {
      // The family's (or an earlier run's) area stands; only the list is
      // written, and only where none was ever written. Nothing found is
      // nothing to write: the door is asked again next run.
      if (!lines.length) continue;
      const note = `[${today}] Edited — What is nearby, read from its address (automatic, by the lane): ${lines.length} nearby line${lines.length === 1 ? '' : 's'}`;
      if (json.includes('$j$') || note.includes('$n$')) continue;
      out.push(
        `UPDATE public.rentals SET nearby = $j$${json}$j$::jsonb, `
        + `notes = btrim(concat_ws(E'\\n', nullif(btrim(coalesce(notes, '')), ''), $n$${note}$n$)) `
        + `WHERE id = '${p.id.toLowerCase()}' AND nearby IS NULL;`,
      );
      continue;
    }
    const note = `[${today}] Edited — ${String(p.summary || 'Placed on the map from its address (automatic, by the lane)').replace(/\s+/g, ' ').trim()}`;
    if (json.includes('$j$') || note.includes('$n$')) continue;
    // An honest empty answer is written as [] (an answer), so NULL keeps
    // meaning "never asked" and the lane asks such a door again (DR-1018).
    out.push(
      `UPDATE public.rentals SET area_lat = ${lat.toFixed(5)}, area_lng = ${lng.toFixed(5)}, `
      + `nearby = ${lines.length ? `$j$${json}$j$::jsonb` : `'[]'::jsonb`}, `
      + `notes = btrim(concat_ws(E'\\n', nullif(btrim(coalesce(notes, '')), ''), $n$${note}$n$)) `
      + `WHERE id = '${p.id.toLowerCase()}' AND area_lat IS NULL;`,
    );
  }
  return out.length ? `${out.join('\n')}\n` : '';
}

async function main() {
  const file = process.argv[2];
  if (!file) { process.stderr.write('usage: place-doors.mjs doors.json > updates.sql\n'); process.exit(2); }
  const doors = doorsFromJson(readFileSync(file, 'utf8'));
  // EVERY MISS SAYS WHY (DR-0076; the first live run, 38582219189, placed 6
  // of 12 and named the other six by id alone). Each building's lookup and
  // its nearby read are recorded as they happen and printed per building:
  // what was asked, what the geocoder matched, whether that is THIS house
  // (the number and the town), and whether the nearby read answered.
  const trace = [];
  const find = async (q) => {
    const g = await geocode(q);
    const out = g.ok ? { ok: true, point: { lat: g.lat, lng: g.lng }, matched: String(g.matched || '') } : { ok: false, reason: g.reason };
    const door = doors.find((d) => q.startsWith(d.address)) || null;
    trace.push({ q, ok: out.ok, matched: out.matched || '', reason: out.reason || '', thisHouse: out.ok && door ? matchesAddress(out.matched, door) : null, near: null });
    return out;
  };
  // The runner names itself (Overpass's usage policy) and can wait longer
  // than a phone (the nearby witness measured the servers' own 504s; on
  // 2026-10-14 witness 38585240741 timed out at 60 s while a bare GET of the
  // same query answered in about 30 s, so the wait is two minutes, DR-1018).
  const around = async (point) => {
    const n = await nearbyAround(point, { userAgent: UA, timeoutMs: 120000, serverTimeoutS: 90 });
    const last = trace[trace.length - 1];
    if (last) last.near = n.ok ? `${n.lines.length} line(s)` : `FAILED: ${n.reason}`;
    return n;
  };
  const r = await placeDoors(doors, { find, around });
  process.stderr.write(`place-doors: ${doors.length} door(s) without an area; ${r.looked} building(s) looked up; placed ${r.placed.length}; missed ${r.missed.length}\n`);
  for (const t of trace) {
    const verdict = !t.ok ? `no match: ${t.reason}` : t.thisHouse === false ? `NOT THIS HOUSE (matched "${t.matched}")` : t.near == null ? 'matched; nearby not asked' : `matched "${t.matched}"; nearby ${t.near}`;
    process.stderr.write(`  ${t.q} -> ${verdict}\n`);
  }
  for (const id of r.missed) {
    const d = doors.find((x) => x.id === id);
    process.stderr.write(`  missed ${id}: ${d ? `${d.address}${d.unit ? ` (${d.unit})` : ''}, ${d.city || 'NO CITY'}` : 'unknown door'}\n`);
  }
  process.stdout.write(updatesSql(r.placements));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { process.stderr.write(`place-doors: ${e?.message || e}\n`); process.exit(1); });
}
