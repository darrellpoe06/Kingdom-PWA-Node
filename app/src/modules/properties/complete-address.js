// =============================================================================
// complete-address — every door's address held whole, from evidence (DR-1207)
// =============================================================================
// Darrell, 2026-10-22, with Poe Properties beside Real Estate: "The property
// addresses from the Properties tab are correct... the ones in the Real
// Estate are not complete... fix the addresses to reflect the correct
// addresses and not the abbreviated addresses... Each asset should work end
// to end."
//
// MEASURED FIRST (rentals-address-probe, run 39717503181, the live database):
// 13 rows, all in poe-properties, and the two tabs read the SAME rows. The
// five doors at 805 North Prospect Avenue are whole (house number, street,
// town, state, ZIP, unit). Eight are not, in the one record both tabs share:
// the two Koehn doors and 440 South Street have no ZIP; 1508 Holly Hill has no
// ZIP and no street type; 1508 Williamsburg and 709 Commercial name no town;
// 1513 Holly Hill's address field holds only a town (its street survives in
// its display name). So the gap is the RECORD, not a copy between tabs.
//
// THE RULE IS DR-0967's: cleaned, never fuzzy. Nothing here guesses that "Dr"
// is "Drive" on its own say-so. A part is completed only from a lookup that
// matched THIS house: the US Census Bureau geocoder (then OpenStreetMap), the
// same /geocode road the map already trusts, and only when what it matched
// carries the door's own house number, the door's own street (the same words,
// or the same words with the street type the record left off) and the door's
// own town. The street type is then written out in full from the USPS
// standard abbreviations (Publication 28): an official table, not a guess.
//
// A door that names no town is looked up in each town the family's own doors
// are in, and completed only when exactly ONE of them holds that house. Two
// matches is a door the family must name ("709 Commercial St" could be either
// town's Commercial Street); zero is a door the map cannot find. Both are
// left as they are, and say so.
//
// Pure: no React, no network. The lane (scripts/complete-addresses.mjs) and
// its tests share it, so what is written and what is pinned cannot drift.
// =============================================================================
import { splitUnit, addressNeeds } from './address.js';

// USPS Publication 28, Appendix C1 (street suffixes) and B (directionals), the
// common forms. A word not in the table is kept exactly as the record has it.
export const SUFFIXES = Object.freeze({
  aly: 'Alley', ave: 'Avenue', av: 'Avenue', blvd: 'Boulevard', cir: 'Circle', ct: 'Court', cv: 'Cove',
  cres: 'Crescent', dr: 'Drive', expy: 'Expressway', hwy: 'Highway', hl: 'Hill', holw: 'Hollow',
  hts: 'Heights', ln: 'Lane', lp: 'Loop', pkwy: 'Parkway', pl: 'Place', plz: 'Plaza', pt: 'Point',
  rd: 'Road', rdg: 'Ridge', sq: 'Square', st: 'Street', ter: 'Terrace', trl: 'Trail', xing: 'Crossing',
  way: 'Way', run: 'Run', loop: 'Loop', pass: 'Pass', walk: 'Walk', row: 'Row',
});
export const DIRECTIONS = Object.freeze({
  n: 'North', s: 'South', e: 'East', w: 'West', ne: 'Northeast', nw: 'Northwest', se: 'Southeast', sw: 'Southwest',
});
// The full words, so "Drive" and "Dr" compare as the same street type.
const FULL_SUFFIX = new Set(Object.values(SUFFIXES).map((s) => s.toLowerCase()));
const FULL_DIRECTION = new Set(Object.values(DIRECTIONS).map((s) => s.toLowerCase()));

const tidy = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
const low = (v) => tidy(v).toLowerCase();
const titleWord = (w) => (/^\d/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

/** The house number at the front of a street, or ''. */
export function houseNumber(street) {
  return (tidy(street).match(/^(\d+[A-Za-z]?)\b/) || [])[1] || '';
}

/**
 * A street's words, normalised for COMPARING: directionals and the street
 * type written out, lower case, no punctuation. "N Prospect Ave" and
 * "North Prospect Avenue" give the same words.
 */
export function streetWords(street) {
  const words = low(street).replace(/[.,#]/g, ' ').split(/\s+/).filter(Boolean);
  return words.map((w, i) => {
    if (i === 0 && DIRECTIONS[w]) return DIRECTIONS[w].toLowerCase();
    if (i === words.length - 1 && SUFFIXES[w]) return SUFFIXES[w].toLowerCase();
    return w;
  });
}

/** The street written in full, in title case: "KOEHN DR" -> "Koehn Drive". */
export function fullStreet(street) {
  const words = tidy(street).replace(/[.,]/g, ' ').split(/\s+/).filter(Boolean);
  return words.map((w, i) => {
    const k = w.toLowerCase();
    if (i === 0 && words.length > 1 && DIRECTIONS[k]) return DIRECTIONS[k];
    if (i === words.length - 1 && words.length > 1 && SUFFIXES[k]) return SUFFIXES[k];
    return titleWord(w);
  }).join(' ');
}

/**
 * Is the matched street the record's street? The same words, or the record's
 * words with the street type the record left off ("Holly Hill" against
 * "Holly Hill Dr"). Never a different street, never a different direction.
 */
export function sameStreet(stored, matched) {
  const a = streetWords(stored);
  const b = streetWords(matched);
  if (!a.length || !b.length) return false;
  if (a.join(' ') === b.join(' ')) return true;
  const last = b[b.length - 1];
  return b.length === a.length + 1 && FULL_SUFFIX.has(last) && b.slice(0, -1).join(' ') === a.join(' ');
}

/**
 * The parts of what a lookup matched. The Census line is
 * "1003 KOEHN DR, DANVILLE, IL, 61832"; OpenStreetMap's details arrive as
 * {house_number, road, city|town|village, state, postcode}. Returns
 * {number, street, city, state, zip} or null.
 */
export function matchedParts(hit) {
  if (!hit || typeof hit !== 'object') return null;
  if (hit.parts && typeof hit.parts === 'object') {
    const p = hit.parts;
    const out = { number: tidy(p.number), street: tidy(p.street), city: tidy(p.city), state: tidy(p.state), zip: (tidy(p.zip).match(/^\d{5}/) || [''])[0] };
    return out.number && out.street ? out : null;
  }
  const line = tidy(hit.matched);
  const parts = line.split(',').map(tidy).filter(Boolean);
  if (parts.length < 3) return null;
  const head = parts[0].match(/^(\d+[A-Za-z]?)\s+(.+)$/);
  if (!head) return null;
  const zip = /^\d{5}(?:-\d{4})?$/.test(parts[parts.length - 1]) ? parts.pop().slice(0, 5) : '';
  const state = parts.length >= 3 ? parts.pop() : '';
  return { number: head[1], street: head[2], city: parts[1] || '', state, zip };
}

const isAbbreviated = (street) => {
  const words = low(street).replace(/[.,]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;
  const last = words[words.length - 1];
  const first = words[1] && DIRECTIONS[words[1]] ? words[1] : '';
  return Boolean(SUFFIXES[last] && !FULL_SUFFIX.has(last)) || Boolean(first && !FULL_DIRECTION.has(first));
};

/**
 * The street a door is really at, from its own record: its address field, or,
 * when that field has lost its house number and the door's own name still
 * holds a street with one (1513 Holly Hill: address "Champaign", display name
 * "1513 Holly Hill"), the name. {street, unit, from: 'address'|'name'} or null.
 */
export function recordedStreet(row = {}) {
  const a = splitUnit(row.address);
  if (houseNumber(a.street)) return { street: a.street, unit: tidy(row.unit) || a.unit, from: 'address' };
  const n = splitUnit(row.display_name);
  if (houseNumber(n.street)) return { street: n.street, unit: tidy(row.unit) || n.unit, from: 'name' };
  return null;
}

/** Does this door's address still want completing? */
export function wantsCompleting(row = {}) {
  const rec = recordedStreet(row);
  if (!rec) return false; // nothing to look up: the family must type the street
  if (rec.from === 'name') return true;
  if (!/^\d{5}/.test(tidy(row.zip))) return true;
  if (addressNeeds({ address: rec.street, city: row.city, state: row.state }).length) return true;
  return isAbbreviated(rec.street);
}

/** The towns the family's own doors are in, as candidates for a door that names none. */
export function familyTowns(rows = []) {
  const seen = new Map();
  for (const r of rows) {
    if (!r || !recordedStreet(r) || recordedStreet(r).from !== 'address') continue;
    const city = tidy(r.city);
    if (!city) continue;
    const key = `${low(city)}|${low(r.state)}`;
    if (!seen.has(key)) seen.set(key, { city, state: tidy(r.state) });
  }
  return [...seen.values()];
}

/**
 * The questions to ask for one door: one line when it names its town, one per
 * family town when it does not (or when its own record contradicts itself).
 */
export function questionsFor(row = {}, towns = []) {
  const rec = recordedStreet(row);
  if (!rec) return [];
  const own = rec.from === 'address' ? tidy(row.city) : '';
  if (own) return [{ q: [rec.street, own, tidy(row.state)].filter(Boolean).join(', '), town: own, state: tidy(row.state) }];
  return towns.map((t) => ({ q: [rec.street, t.city, t.state].filter(Boolean).join(', '), town: t.city, state: t.state }));
}

/** Does this match belong to this door, in this town? */
export function matchIsThisHouse(parts, rec, town) {
  if (!parts || !rec) return false;
  if (low(parts.number) !== low(houseNumber(rec.street))) return false;
  const stored = tidy(rec.street).replace(/^\d+[A-Za-z]?\s+/, '');
  if (!sameStreet(stored, parts.street)) return false;
  return !town || low(parts.city) === low(town);
}

/**
 * The completion for one door from its answers: [{town, state, hit}] where hit
 * is the geocoder's answer for that town's question. Returns
 *   {ok: true,  patch, summary}            the parts to write, and the trace
 *   {ok: false, why}                       left as it is, and why
 * The patch only ever fills an empty part, writes the street out in full, or
 * mends a record whose address lost its house number from that record's own
 * name. A unit is never touched.
 */
export function completion(row = {}, answers = []) {
  const rec = recordedStreet(row);
  if (!rec) return { ok: false, why: 'no street with a house number on the record' };
  const found = [];
  for (const a of answers || []) {
    const parts = a && a.hit && a.hit.ok ? matchedParts(a.hit) : null;
    if (matchIsThisHouse(parts, rec, a.town)) found.push({ ...a, parts });
  }
  if (!found.length) return { ok: false, why: 'the map could not find this house' };
  const towns = new Set(found.map((f) => low(f.parts.city)));
  if (towns.size > 1) return { ok: false, why: `this street and number exist in ${towns.size} of the family's towns; the town must be named` };
  const f = found[0];
  const p = f.parts;
  const street = `${houseNumber(rec.street)} ${fullStreet(p.street)}`;
  const patch = {};
  const was = {};
  const oldAddress = tidy(row.address);
  if (street !== splitUnit(oldAddress).street || rec.from === 'name') {
    const keepUnitInStreet = splitUnit(oldAddress).unit && !tidy(row.unit);
    patch.address = keepUnitInStreet ? `${street} ${splitUnit(oldAddress).unit}` : street;
    was.address = oldAddress;
  }
  const city = tidy(row.city);
  const townFix = rec.from === 'name' || !city;
  if (townFix && p.city && low(p.city) !== low(city)) { patch.city = titleWord(p.city).replace(/\b\w/g, (c) => c.toUpperCase()); was.city = city; }
  if (!tidy(row.state) && p.state) { patch.state = p.state; was.state = ''; }
  if (!/^\d{5}/.test(tidy(row.zip)) && p.zip) { patch.zip = p.zip; was.zip = tidy(row.zip); }
  // The door's NAME was its old street (Poe Properties titles a door by it):
  // it follows the street, or Properties keeps printing the short form.
  const name = tidy(row.display_name);
  const nameStreet = splitUnit(name).street;
  if (patch.address && name && (low(nameStreet) === low(splitUnit(oldAddress).street) || rec.from === 'name')) {
    const nameUnit = splitUnit(name).unit;
    patch.display_name = nameUnit ? `${street} ${nameUnit}` : street;
    was.display_name = name;
  }
  if (!Object.keys(patch).length) return { ok: false, why: 'already whole' };
  const said = Object.keys(patch).map((k) => `${k} "${patch[k]}"${was[k] ? ` (was "${was[k]}")` : ''}`).join(', ');
  const source = f.hit.source === 'openstreetmap' ? 'OpenStreetMap' : 'the US Census Bureau geocoder';
  return { ok: true, patch, summary: `Address completed from ${source}, which matched this house: ${said}` };
}
