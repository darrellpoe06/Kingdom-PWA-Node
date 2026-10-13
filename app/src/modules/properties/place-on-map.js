// =============================================================================
// place-on-map — every door with an address is on the map, by default (DR-0995)
// =============================================================================
// Darrell, 2026-10-13, looking at "What's nearby" under the map on Apt 2:
// "I love that it shows what's close!!! Shouldn't this be default?" And on
// 2026-10-12: "Why would I ever need to add a Google maps link when you can do
// that as a standard for any address we add?!!!!!"
//
// MEASURED: that list was not stored. Apt 2 had no area and no nearby lines;
// they were worked out on the visitor's phone from a lookup when the map was
// tapped, and vanished with it. No door at 805 had an area, so the held bed in
// Apt 4 had nothing to show at all.
//
// So the family's own app places its doors, once: for each BUILDING (same
// family, same street with the unit folded out -- buildingKey, the database's
// building_key) where some door has no area, the address is looked up ONE
// time and every door there that lacks one is saved with the rounded area and
// the nearby lines (nearbyAround: the Champaign research plus what OpenStreetMap
// knows around THIS building's own point), through the same door edit path (and the same trace in its
// notes) as "Find it from the address". The exact point is used once, for the
// distances, and never saved (0270 rounds it in the database anyway).
//
// Bounded, never a loop: at most PLACE_MAX_LOOKUPS lookups a session, one
// every PLACE_GAP_MS (OpenStreetMap's policy is one a second), and a door
// already on the map is never touched -- the family's own area always wins.
// A lookup that finds nothing leaves the door as it was. Never throws.
// =============================================================================
import { addressLine, findPoint, roundArea, nearbyAround, namesStreet } from './area.js';
import { buildingKey } from './apartment.js';

// ACCURATE FOR EACH PROPERTY (Darrell, 2026-10-13: "Make sure it's accurate
// for each property"). A lookup is trusted only when what it matched carries
// the door's own house number and town: a geocoder that falls back to the
// middle of the street, or to a same-named street in another town, would put
// the distances on the wrong place. No match, no save -- the door stays "Not
// on the map yet" for the family to pin by hand.
//
// A door that names no town is never placed: "709 Commercial St, IL" could be
// any of a dozen towns' Commercial Streets, and a guess would put the distances
// on the wrong one. The town is the door's city, or the part of its address
// after the street when the whole address was typed into one field ("1508
// Williamsburg, Champaign, IL, 61821" -- the Real Estate records).
const STATE_RE = /^(?:[a-z]{2}|alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)(?:\s+\d{5}(?:-\d{4})?)?$/;
export function townOf(rental) {
  const tidy = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const city = tidy(rental?.city);
  if (city) return city;
  const parts = String(rental?.address || '').split(',').map(tidy).filter(Boolean);
  const t = parts[1] || '';
  return t && !STATE_RE.test(t) && !/^\d+$/.test(t) ? t : '';
}

export function matchesAddress(matched, rental) {
  const m = ` ${String(matched || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `;
  const num = (String(rental?.address || '').trim().match(/^(\d+[a-z]?)\b/i) || [])[1];
  if (!num || !m.includes(` ${num.toLowerCase()} `)) return false;
  const town = townOf(rental);
  return Boolean(town) && m.includes(` ${town} `);
}

export const PLACE_GAP_MS = 1100;
export const PLACE_MAX_LOOKUPS = 8;

/** The buildings to look up: [{query, doors:[rental]}], only doors with no area. */
export function buildingsToPlace(rentals = [], placed = new Set()) {
  const groups = new Map();
  for (const r of rentals) {
    if (!r || !r.id || placed.has(r.id)) continue;
    const query = addressLine(r);
    if (!r.address || query.length < 5) continue;
    const b = buildingKey(r.address, r.unit);
    const key = b ? `${r.instance_id || ''}|${b}` : `door|${r.id}`;
    if (!groups.has(key)) groups.set(key, { query, doors: [] });
    groups.get(key).doors.push(r);
  }
  return [...groups.values()];
}

/**
 * Look each building up once and save its doors. `save(id, patch, summary)`
 * is the door edit path. Returns {placed, missed, looked}.
 */
export async function placeDoorsOnTheMap({
  rentals = [], placed = new Set(), find = findPoint, around = nearbyAround, save,
  wait = (ms) => new Promise((ok) => setTimeout(ok, ms)),
  max = PLACE_MAX_LOOKUPS, gapMs = PLACE_GAP_MS,
} = {}) {
  const out = { placed: [], missed: [], looked: 0 };
  if (typeof save !== 'function') return out;
  for (const g of buildingsToPlace(rentals, placed)) {
    if (out.looked >= max) break;
    if (out.looked > 0) await wait(gapMs);
    out.looked += 1;
    let r;
    try { r = await find(g.query); } catch { r = { ok: false }; }
    if (!r || !r.ok || !matchesAddress(r.matched, g.doors[0])) { out.missed.push(...g.doors.map((d) => d.id)); continue; }
    const area = roundArea(r.point?.lat, r.point?.lng);
    if (!area) { out.missed.push(...g.doors.map((d) => d.id)); continue; }
    // What is near THIS building, from its own exact point. If it cannot be
    // asked, nothing is saved: the door is tried again next time rather than
    // stored with an empty list that would read as "nothing near".
    let near;
    try { near = await around(r.point); } catch { near = { ok: false }; }
    if (!near || !near.ok) { out.missed.push(...g.doors.map((d) => d.id)); continue; }
    const all = near.lines;
    for (const d of g.doors) {
      // A nearby line never names the door's street (0270 refuses it).
      const lines = all.filter((l) => !namesStreet(l.label, d.address));
      const summary = `Placed on the map from its address (automatic): the area${lines.length ? ` and ${lines.length} nearby line${lines.length === 1 ? '' : 's'}` : ''}`;
      let res;
      try { res = await save(d.id, { area_lat: area.lat, area_lng: area.lng, nearby: lines.length ? lines : null }, summary); } catch { res = { ok: false }; }
      (res && res.ok ? out.placed : out.missed).push(d.id);
    }
  }
  return out;
}
