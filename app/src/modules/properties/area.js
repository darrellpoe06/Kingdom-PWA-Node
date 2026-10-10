// =============================================================================
// area.js — where a door is, without the street (DR-0912, migration 0270)
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
 * "q=lat,lng". Returns {lat, lng} or null. Nothing is looked up anywhere: the
 * street is never sent to a search service.
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
  return Math.max(0.1, Math.round(m * 10) / 10);
}

/** "about 1.9 mi" — what a line says on the shelf. */
export function milesText(m) {
  const n = Number(m);
  if (!Number.isFinite(n)) return '';
  return `about ${n.toFixed(1)} mi`;
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
export function namesStreet(label, address) {
  const st = streetName(address);
  return Boolean(st) && String(label || '').toLowerCase().includes(st.toLowerCase());
}
