// =============================================================================
// area.js — where a door is, without the street (DR-0935, migration 0270)
// =============================================================================
// Darrell, 2026-10-10: "Just show the location without the address... map
// view...", "How many miles away from the UIUC campus is the apartment...",
// "And highway is less than a quarter mile... etc...", "Shops... etc..."
//
// THE AREA. A door's point is snapped to a 0.005-degree grid ON THE DEVICE
// before it is saved, and again by the database (rentals_area_rounded), so the
// exact point never leaves the family's phone. The house is anywhere in its
// grid cell, at most about 350 m from the stored point; the listing draws a
// 600 m circle, so the house is always inside it and never pinpointed.
//
// NEARBY. Straight-line miles from the EXACT point (computed here, before the
// rounding) to a cited list of places. Coordinates and their sources are in
// docs/99-session-notes/2026-10-10-805-north-prospect-whats-nearby.md:
//   MTD = Champaign-Urbana MTD GTFS stops; OVT = Overture Maps 2026-09-23.1;
//   WP = Wikipedia; LL = latlong.net. Straight-line, never a driving claim.
// No place line names a street: a line like "Target on North Prospect" would
// hand a stranger the street of a door that fronts it.
//
// THE MAP IS ASKED FOR (DR-0977, 2026-10-12). Darrell: "Why would I ever need
// to add a Google maps link when you can do that as a standard for any address
// we add?!!!!!" and "I only want a map when I want it... don't want to spend
// time or data for the map if not required or requested". So the point comes
// from the ADDRESS (findPoint -> the same-origin /geocode route), and only when
// somebody taps for the map; nothing is looked up and no tile is fetched
// before that. mapsUrl hands the address to the phone's own maps app instead,
// which costs this app nothing at all.
// =============================================================================

export const GRID = 0.005;
export const CIRCLE_METERS = 600;
export const NEARBY_WITHIN_MILES = 15;
export const NEARBY_MAX = 12;

/** Snap one coordinate to the grid (the same rule the database applies). */
export function snap(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Number((Math.round(n / GRID) * GRID).toFixed(3));
}

/** The area a stranger may see for a point, or null when the point is not a point. */
export function roundArea(lat, lng) {
  const la = Number(lat); const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln) || Math.abs(la) > 85 || Math.abs(ln) > 180) return null;
  return { lat: snap(la), lng: snap(ln) };
}

/**
 * Read a point pasted from any map app: "40.123364, -88.25828",
 * "40.123364 -88.25828", or a Google Maps link carrying "@lat,lng" or
 * "q=lat,lng". Returns {lat, lng} or null. Kept for pinning a door by hand
 * when an address lookup misses it.
 */
export function parsePoint(text) {
  const s = String(text || '');
  const m = /@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/.exec(s)
    || /[?&](?:q|ll|query)=(-?\d{1,2}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i.exec(s)
    || /^\s*\(?\s*(-?\d{1,2}\.\d+)\s*[,\s]\s*(-?\d{1,3}\.\d+)\s*\)?\s*$/.exec(s);
  if (!m) return null;
  const lat = Number(m[1]); const lng = Number(m[2]);
  if (Math.abs(lat) > 85 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

const R_MILES = 3958.76;
const rad = (d) => (d * Math.PI) / 180;
/** Great-circle (straight-line) miles between two points. */
export function haversineMiles(a, b) {
  const dLat = rad(b.lat - a.lat); const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * The places a renter in Champaign-Urbana asks about, each with its source:
 * one line each for campus, the interstate, town, the train, shops, a grocery,
 * the hospitals and the airport. Twelve, so none is cut by the 12-line cap
 * (near-duplicates such as the Illini Union and the other big-box stores are
 * in the research note, not here).
 */
export const PLACES = Object.freeze([
  { label: 'University of Illinois Main Quad', lat: 40.10719, lng: -88.22643, src: 'OVT' },
  { label: 'UIUC engineering campus (ECE Building)', lat: 40.11504, lng: -88.22819, src: 'OVT' },
  { label: 'Parkland College', lat: 40.12761, lng: -88.28939, src: 'OVT' },
  { label: 'I-74 at Exit 181', lat: 40.13397, lng: -88.25808, src: 'OVT' },
  { label: 'Downtown Champaign', lat: 40.11757, lng: -88.24348, src: 'OVT' },
  { label: 'Illinois Terminal (Amtrak and intercity bus)', lat: 40.115698, lng: -88.241092, src: 'MTD' },
  { label: 'Target', lat: 40.14182, lng: -88.25498, src: 'OVT/MTD' },
  { label: 'Meijer', lat: 40.1449, lng: -88.26006, src: 'OVT' },
  { label: 'Schnucks grocery', lat: 40.11721, lng: -88.27874, src: 'OVT' },
  { label: 'Carle Foundation Hospital', lat: 40.1170944, lng: -88.2160509, src: 'LL/OVT' },
  { label: 'OSF Sacred Heart Medical Center', lat: 40.11792, lng: -88.22746, src: 'WP' },
  { label: 'Willard Airport (CMI)', lat: 40.0392, lng: -88.2781, src: 'WP' },
]);

/** One decimal, never "0.0": under a tenth of a mile reads as 0.1. */
export function roundMiles(m) {
  // Under a tenth of a mile the line is read in FEET (DR-1019: a bus stop
  // "out front" is not "about 0.1 miles"), so the hundredth is kept there.
  if (m < 0.1) return Math.max(0.01, Math.round(m * 100) / 100);
  return Math.round(m * 10) / 10;
}

/** "about 175 feet" for a short walk, else the miles line. 25-foot steps. */
export function feetText(m) {
  const n = Number(m);
  if (!Number.isFinite(n)) return '';
  if (n >= 0.1) return milesText(n);
  const ft = Math.max(25, Math.round((n * 5280) / 25) * 25);
  return `about ${ft} feet`;
}

/**
 * "about 1.9 miles" — what a line says on the shelf. The word in full
 * (DR-0998): the read-aloud speaks the page's own text, and "mi" is spoken as
 * "my" or spelled out; a person listening hears "miles". WCAG 2.2 AA (DR-0315).
 */
export function milesText(m) {
  const n = Number(m);
  if (!Number.isFinite(n)) return '';
  if (n < 0.1) return feetText(n);
  return `about ${n.toFixed(1)} ${n === 1 ? 'mile' : 'miles'}`;
}

/**
 * What is nearby the EXACT point, nearest first, within NEARBY_WITHIN_MILES,
 * at most NEARBY_MAX lines, in the shape the database accepts:
 * [{label, miles}]. A door far from every place gets an empty list (a Danville
 * door is not "33 miles from Target").
 */
export function nearbyFrom(point, places = PLACES) {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return [];
  return places
    .map((p) => ({ label: p.label, miles: roundMiles(haversineMiles(point, p)) }))
    .filter((l) => l.miles <= NEARBY_WITHIN_MILES)
    .sort((a, b) => a.miles - b.miles)
    .slice(0, NEARBY_MAX);
}

// --- What is nearby ANY property (DR-0998) -----------------------------------
// Darrell, 2026-10-13: "Make sure it's accurate for each property... Not just
// 805". PLACES above is the Champaign research; a door anywhere else is near
// none of it. So when a door is placed, the places around ITS OWN exact point
// are asked of OpenStreetMap's Overpass API (public, no key; one query per
// building, from the family's app, never from a visitor's phone), and the
// nearest of each kind is measured straight-line from that point.
export const OVERPASS = 'https://overpass-api.de/api/interpreter';
// A second public Overpass mirror, asked when the first answers 5xx or 429
// (nearby-witness run 38434844861, 2026-10-13: overpass-api.de reached its
// interpreter and answered 504 "runtime error: open64" -- its own fault at
// that moment). Same data, same query; the first that answers wins.
export const OVERPASS_MIRRORS = Object.freeze([OVERPASS, 'https://overpass.kumi.systems/api/interpreter']);
const MI = 1609.344;

/**
 * THE CITY BUS (DR-1014; Darrell, 2026-10-14: "Bus stop location is close...
 * add those too... People who need to ride the bus will want to know... city
 * buses"). The two nearest stops within a mile, each a plain "City bus stop"
 * with the route numbers the map carries (route_ref) -- NEVER the stop's own
 * name, which is a street corner ("Prospect & Harvard") and would hand a
 * stranger the street of a held door (0270 refuses such a line anyway).
 * Route numbers are what OpenStreetMap has mapped; the family can edit a
 * line, and the research note's own caution stands: verify at mtd.org.
 */
export function busStopLabel(tags = {}, i = 0) {
  const routes = String(tags.route_ref || '').split(/[;,\s]+/).map((r) => r.trim()).filter(Boolean).slice(0, 6);
  const head = i === 0 ? 'City bus stop' : 'Another city bus stop';
  return routes.length ? `${head} (route${routes.length === 1 ? '' : 's'} ${routes.join(', ')})` : head;
}

// [kind, Overpass selector, radius in miles, how many, how the line reads (name, tags, index)]
export const NEARBY_KINDS = Object.freeze([
  ['bus',        'node["highway"="bus_stop"]',                                 1,  2, (n, t, i) => busStopLabel(t, i)],
  ['grocery',    'nwr["shop"="supermarket"]["name"]',                          5,  2, (n) => `${n} (grocery)`],
  ['pharmacy',   'nwr["amenity"="pharmacy"]["name"]',                          5,  1, (n) => `${n} (pharmacy)`],
  ['hospital',   'nwr["amenity"="hospital"]["name"]',                          15, 1, (n) => n],
  ['college',    'nwr["amenity"~"^(university|college)$"]["name"]',            15, 2, (n) => n],
  ['school',     'nwr["amenity"="school"]["name"]',                            3,  1, (n) => `${n} (school)`],
  ['station',    'nwr["amenity"="bus_station"]["name"];nwr["railway"="station"]["name"]', 15, 1, (n) => n],
  ['highway',    'node["highway"="motorway_junction"]["ref"]',                 5,  1, (n, t) => `Highway exit ${t.ref}${t.name ? ` (${n})` : ''}`],
  ['park',       'nwr["leisure"="park"]["name"]',                              2,  1, (n) => n],
  ['airport',    'nwr["aeroway"="aerodrome"]["iata"]["name"]',                 15, 1, (n, t) => `${n} (${t.iata})`],
]);

/** The one Overpass query for a point: every kind, each in its own radius. */
export function overpassQuery(point, { serverTimeoutS = 25 } = {}) {
  const at = `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
  const parts = NEARBY_KINDS.flatMap(([, sel, miles]) =>
    sel.split(';').map((one) => `${one}(around:${Math.round(miles * MI)},${at});`));
  const t = Math.min(180, Math.max(5, Math.round(Number(serverTimeoutS) || 25)));
  return `[out:json][timeout:${t}];(${parts.join('')});out center tags;`;
}

/**
 * Overpass answers its OWN timeout with HTTP 200, no elements and a remark
 * ("runtime error: Query timed out in ... after 26 seconds."). Read as an
 * answer, that is "nothing near" saved on the door (DR-1019: 1213 Koehn Dr,
 * Danville, placed with 0 lines in a town with a hospital, a college and a
 * Walmart within fifteen miles; the witness's answer took 31 s, the 25 s
 * server limit plus transport). A remark that says the server gave up is a
 * failure, not an empty list.
 */
export function overpassGaveUp(body) {
  const remark = String(body?.remark || '');
  return /timed out|runtime error|out of memory|too busy|load too high/i.test(remark) ? remark.replace(/\s+/g, ' ').trim().slice(0, 140) : '';
}

/** The lines from an Overpass answer, measured from `point`: nearest of each kind. */
export function nearbyFromOverpass(point, body) {
  const els = Array.isArray(body?.elements) ? body.elements : [];
  const lines = [];
  const seen = new Set();
  for (const [, sel, miles, count, read] of NEARBY_KINDS) {
    const match = (t) => sel.split(';').some((one) => [...one.matchAll(/\["([^"]+)"(?:(=|~)"([^"]+)")?\]/g)]
      .every(([, k, op, v]) => (op === '=' ? t[k] === v : op === '~' ? new RegExp(v).test(t[k] || '') : t[k] != null)));
    const found = [];
    for (const e of els) {
      const t = e.tags || {};
      if (!match(t)) continue;
      const lat = Number(e.lat ?? e.center?.lat); const lng = Number(e.lon ?? e.center?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const m = roundMiles(haversineMiles(point, { lat, lng }));
      if (m > miles) continue;
      found.push({ t, miles: m });
    }
    // Nearest first, THEN read: a kind whose line says "another" (the bus
    // stops) names the nearest one plainly and the next one as the other.
    found.sort((a, b) => a.miles - b.miles);
    let kept = 0;
    for (const f of found) {
      if (kept >= count) break;
      const label = String(read(String(f.t.name || f.t.ref || '').trim(), f.t, kept)).replace(/\s+/g, ' ').trim().slice(0, 80);
      if (!label || seen.has(label.toLowerCase())) continue;
      seen.add(label.toLowerCase()); lines.push({ label, miles: f.miles }); kept += 1;
    }
  }
  return lines;
}

/**
 * What is nearby THIS point: the researched places within reach (PLACES, for
 * Champaign) and the nearest of each kind OpenStreetMap knows around it,
 * nearest first, at most NEARBY_MAX. {ok:true, lines} -- an empty list is a
 * real answer (nothing near) -- or {ok:false, reason} when Overpass could not
 * be asked, so the caller can try again rather than save nothing as truth.
 */
export async function nearbyAround(point, { fetchImpl = (typeof fetch === 'function' ? fetch : null), timeoutMs = 30000, places = PLACES, userAgent = '', serverTimeoutS = 25 } = {}) {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return { ok: false, reason: 'no point' };
  const researched = nearbyFrom(point, places);
  if (!fetchImpl) return { ok: false, reason: 'This device cannot look up what is nearby.' };
  let found;
  // No Accept header: the query's [out:json] decides the shape, and a
  // browser's default "*/*" is what the servers see from a phone. A browser
  // sends its own User-Agent and `userAgent` stays empty; a runner (the
  // nearby witness) names itself, as Overpass's usage policy asks -- from a
  // runner an unnamed or generic request is refused by Apache with 406 before
  // the interpreter runs (witness runs 38434388889 / 38434844861, 2026-10-13,
  // read from the server's own body). The servers' own words ride in the
  // reason, so the next witness run says why (DR-0076).
  const body = `data=${encodeURIComponent(overpassQuery(point, { serverTimeoutS }))}`;
  const headers = { 'content-type': 'application/x-www-form-urlencoded', ...(userAgent ? { 'user-agent': userAgent } : {}) };
  let last = { ok: false, reason: 'What is nearby could not be reached just now.' };
  for (const endpoint of OVERPASS_MIRRORS) {
    try {
      const res = await fetchImpl(endpoint, { method: 'POST', headers, body, signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) {
        const answer = await res.json();
        const gaveUp = overpassGaveUp(answer);
        // The server's own "I gave up" is its trouble, worth the next mirror.
        if (gaveUp) { last = { ok: false, reason: `What is nearby timed out on the server (${gaveUp}).` }; continue; }
        found = nearbyFromOverpass(point, answer); break;
      }
      let said = '';
      try { said = String(await res.text()).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160); } catch (_) { said = ''; }
      last = { ok: false, reason: `What is nearby could not be looked up (HTTP ${res.status}${said ? `: ${said}` : ''}).` };
      // A refusal of the request itself (4xx other than 429) is the same on
      // every mirror; a server's own trouble (5xx, 429) is worth the next one.
      if (res.status < 500 && res.status !== 429) break;
    } catch (e) {
      last = { ok: false, reason: e?.name === 'TimeoutError' ? 'What is nearby took too long to answer.' : 'What is nearby could not be reached just now.' };
    }
  }
  if (!found) return last;
  const have = new Set(researched.map((l) => l.label.toLowerCase()));
  const lines = [...researched, ...found.filter((l) => ![...have].some((h) => h.includes(l.label.toLowerCase().replace(/ \(.*\)$/, ''))))]
    .sort((a, b) => a.miles - b.miles)
    .slice(0, NEARBY_MAX);
  return { ok: true, lines };
}

/** The lines the shelf may print: the database's own shape, checked again. */
export function cleanNearby(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((l) => l && typeof l.label === 'string' && l.label.trim() && Number.isFinite(Number(l.miles)))
    .map((l) => ({ label: l.label.trim().slice(0, 80), miles: Number(l.miles) }))
    .filter((l) => l.miles >= 0 && l.miles <= 100)
    .slice(0, NEARBY_MAX);
}

/** The area of a row from public_vacancies (or rentals), or null. */
export function areaOf(row) {
  if (!row || row.area_lat == null || row.area_lng == null) return null;
  return roundArea(row.area_lat, row.area_lng);
}

// --- The map: OpenStreetMap tiles, a circle, no library ----------------------
export const TILE = 256;
export const ZOOM = 14;
export const TILE_URL = (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

/** World pixel of a point at a zoom (Web Mercator, the tiles' own projection). */
export function worldPixel(lat, lng, z = ZOOM) {
  const n = TILE * 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const s = Math.sin(rad(lat));
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
  return { x, y };
}

/** Meters one pixel covers at a latitude and zoom. */
export function metersPerPixel(lat, z = ZOOM) {
  return (156543.03392 * Math.cos(rad(lat))) / 2 ** z;
}

/**
 * The tiles around an area and where the area's center falls among them.
 * `cols` x `rows` tiles, centered on the tile that holds the area.
 */
export function tileLayout(area, { z = ZOOM, cols = 5, rows = 3 } = {}) {
  const p = worldPixel(area.lat, area.lng, z);
  const cx = Math.floor(p.x / TILE); const cy = Math.floor(p.y / TILE);
  const x0 = cx - Math.floor(cols / 2); const y0 = cy - Math.floor(rows / 2);
  const max = 2 ** z;
  const tiles = [];
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const x = x0 + i; const y = y0 + j;
      if (y < 0 || y >= max) continue;
      tiles.push({ key: `${x}/${y}`, src: TILE_URL(z, ((x % max) + max) % max, y), left: i * TILE, top: j * TILE });
    }
  }
  return {
    tiles,
    width: cols * TILE,
    height: rows * TILE,
    // Where the area's center sits inside the tile block.
    centerX: p.x - x0 * TILE,
    centerY: p.y - y0 * TILE,
    radiusPx: CIRCLE_METERS / metersPerPixel(area.lat, z),
  };
}

/**
 * The street NAME of an address (the number removed), the same rule the
 * database applies in rentals_area_rounded: a nearby line containing it is
 * refused, so the editor says so before the save is sent.
 */
export function streetName(address) {
  const s = String(address || '').trim().replace(/^\s*\d+[A-Za-z]?\s+/, '').trim();
  return s.length >= 4 ? s : '';
}
/** The street NAME out of an address LINE ("805 North Prospect Avenue, Champaign, Illinois" -> "North Prospect Avenue"). */
export function streetOfLine(line) {
  return streetName(String(line || '').split(',')[0]);
}
export function namesStreet(label, address) {
  const st = streetName(address);
  return Boolean(st) && String(label || '').toLowerCase().includes(st.toLowerCase());
}

// --- From the address, on request (DR-0977) ----------------------------------

/** The one line an address is looked up and opened by. */
export function addressLine(parts = {}) {
  return [parts.street ?? parts.address, parts.city, parts.state]
    .map((x) => String(x || '').trim()).filter(Boolean).join(', ');
}

/**
 * The phone's own maps app, for an address (or, with no address, a rounded
 * area). One link, no key: Google's documented Maps URL opens the Maps app on
 * Android and iOS and the website elsewhere.
 */
export function mapsUrl({ query = '', area = null } = {}) {
  const q = String(query || '').trim() || (area ? `${area.lat},${area.lng}` : '');
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : '';
}

/**
 * Street View, straight in, at a point (DR-0997). Google's documented Maps URL
 * (map_action=pano) opens the Maps app's Street View on Android and iOS and
 * the website elsewhere; no key. Only ever built for a door whose street the
 * family SHOWS: a held door has no point to stand at, only an area.
 */
export function streetViewUrl(point) {
  const lat = Number(point?.lat); const lng = Number(point?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/** The zoom a shown street's pin is drawn at: the block, not the town. */
export const PIN_ZOOM = 17;
/** The zoom a TOWN is drawn at when a held door has no area yet (DR-1013): the town, not a block. */
export const TOWN_ZOOM = 12;

export const NOMINATIM_DIRECT = 'https://nominatim.openstreetmap.org/search';

/**
 * Where an address is: {ok:true, point:{lat,lng}, matched, via} or {ok:false, reason}.
 * Asks this app's own /geocode route first (Census, then OpenStreetMap). When
 * that road gives no answer at all -- unreachable, or the Pages Functions are
 * down and it returns the app's own page (#2057, 2026-10-09 to at least
 * 10-12) -- it asks OpenStreetMap straight from the phone, which allows it.
 * A route that ANSWERS "not found" is believed: it already asked both.
 * Bounded by a timeout per road; never throws. The exact point stays in
 * memory: callers round it (roundArea) before it is drawn or saved.
 */
export async function findPoint(query, { fetchImpl = (typeof fetch === 'function' ? fetch : null), timeoutMs = 10000, base = '' } = {}) {
  const q = String(query || '').trim();
  if (q.length < 5) return { ok: false, reason: 'There is no address to look up.' };
  if (!fetchImpl) return { ok: false, reason: 'This device cannot look an address up.' };
  const timedOut = (e) => e?.name === 'TimeoutError';
  let lastError = null;
  try {
    const res = await fetchImpl(`${base}/geocode?q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(timeoutMs) });
    const body = await res.json().catch(() => null);
    if (body && typeof body.ok === 'boolean') {
      const lat = Number(body.lat); const lng = Number(body.lng);
      if (body.ok && Number.isFinite(lat) && Number.isFinite(lng)) return { ok: true, point: { lat, lng }, matched: String(body.matched || ''), via: 'route' };
      return { ok: false, reason: 'The map could not find this address.' };
    }
  } catch (e) { lastError = e; }
  try {
    const u = `${NOMINATIM_DIRECT}?${new URLSearchParams({ q, format: 'jsonv2', limit: '1', countrycodes: 'us' })}`;
    const res = await fetchImpl(u, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) });
    const body = await res.json().catch(() => null);
    const m = Array.isArray(body) ? body[0] : null;
    const lat = Number(m?.lat); const lng = Number(m?.lon);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 85 && Math.abs(lng) <= 180) {
      return { ok: true, point: { lat, lng }, matched: String(m.display_name || ''), via: 'openstreetmap' };
    }
    if (Array.isArray(body)) return { ok: false, reason: 'The map could not find this address.' };
  } catch (e) { lastError = e; }
  return { ok: false, reason: timedOut(lastError) ? 'The map took too long to answer. Try again.' : 'The map could not be reached just now.' };
}
