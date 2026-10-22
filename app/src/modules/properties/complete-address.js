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
 * The town a door's own record vouches for, or ''. A door whose address field
 * lost its street does not vouch for its town either: the same edit that put
 * the town into the street wrote that town (1513 Holly Hill: address and city
 * both "Champaign", while its own edit trail reads "City: (blank) -> Danville").
 */
export function ownTown(row = {}) {
  const rec = recordedStreet(row);
  if (!rec) return '';
  if (rec.from === 'address' && tidy(row.city)) return tidy(row.city);
  return trailTown(row.notes);
}

/**
 * The town the family's own edit trail last set, or ''. Every door edit
 * appends "[date] Edited — City: (blank) → Danville" or "Address: 1513 Holly
 * Hill, Danville, Illinois → ..." to the door's notes (the app's edit path and
 * this lane write the same trace). The LAST town named on the left or right of
 * such an edit is the town the family itself typed; it is a record, not a
 * guess. A trail that names no town gives ''.
 */
export function trailTown(notes) {
  const text = String(notes || '');
  let town = '';
  const re = /(City|Address):\s*([^;\n]*?)\s*(?:→|->)\s*([^;\n]*)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const [, field, before, after] = m;
    const clean = (v) => tidy(v).replace(/[.,;]+$/, '');
    if (field === 'City') {
      const t = clean(after);
      if (t && !/^\(blank\)$/i.test(t)) town = t;
      continue;
    }
    // An Address edit whose either side carries "street, town, state": the town is the part after the street.
    for (const side of [before, after]) {
      const parts = String(side || '').split(',').map(tidy).filter(Boolean);
      if (parts.length >= 2 && houseNumber(parts[0]) && !/^\d/.test(parts[1]) && parts[1].length > 1 && !/^(il|illinois)$/i.test(parts[1])) town = parts[1];
    }
  }
  return town;
}

/**
 * The question to ask for one door: its street in the town its own record
 * vouches for. A door with no such town gets NO question.
 *
 * MEASURED, and why: the first dry run (run 39718050197) let a door with no
 * town be asked in each family town and completed when exactly one answered.
 * It answered for 1513 Holly Hill in Champaign, where that door's own trail
 * says Danville, and the geocoder could not find 1508 Holly Hill in Danville
 * at all. "The only town that answered" is not "the door's town" when the
 * geocoder is missing the real street. So the town must come from the family,
 * never from which town happened to answer.
 */
export function questionsFor(row = {}) {
  const rec = recordedStreet(row);
  const own = ownTown(row);
  if (!rec || !own) return [];
  return [{ q: [rec.street, own, tidy(row.state)].filter(Boolean).join(', '), town: own, state: tidy(row.state) }];
}

/** Why a door is left for the family to finish, in the words its card prints. */
export function needsFromFamily(row = {}) {
  const rec = recordedStreet(row);
  if (!rec) return 'the street and house number';
  if (rec.from === 'name') return 'the street (its address field holds a town) and the town';
  if (!ownTown(row)) return 'the town';
  return '';
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
  // Only an answer in the town this door's own record vouches for counts; an
  // answer from any other town is not about this house (dry run 39718050197).
  const own = ownTown(row);
  if (!own) return { ok: false, why: `the family must name ${needsFromFamily(row) || 'the town'}` };
  const found = [];
  for (const a of answers || []) {
    if (!a || low(a.town) !== low(own)) continue;
    const parts = a.hit && a.hit.ok ? matchedParts(a.hit) : null;
    if (matchIsThisHouse(parts, rec, own)) found.push({ ...a, parts });
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
  const townFix = rec.from === 'name' || !city || low(city) !== low(own);
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
  const source = f.hit.source === 'openstreetmap' ? 'OpenStreetMap' : f.hit.source === 'research' ? `a public page the research road found (${f.hit.host || 'its source'})` : 'the US Census Bureau geocoder';
  return { ok: true, patch, summary: `Address completed from ${source}, which matched this house: ${said}` };
}

// =============================================================================
// THE SECOND ROAD: the research road's sources (Darrell, 2026-10-22: "Why
// can't the research space do it?!"). When the map cannot find a house, the
// lane asks the research road where it is, then READS EACH SOURCE PAGE ITSELF
// and believes only what a page shows: this house's number, its street (the
// same words, with or without the street type) and its own town, followed by
// a state and a ZIP. The research road's answer is never the evidence -- the
// page is. Two pages that disagree on the ZIP are no answer at all.
// =============================================================================
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SUFFIX_ALTS = (() => {
  const byFull = new Map();
  for (const [abbr, full] of Object.entries(SUFFIXES)) {
    const k = full.toLowerCase();
    if (!byFull.has(k)) byFull.set(k, new Set([k]));
    byFull.get(k).add(abbr);
  }
  return byFull;
})();
const ALL_SUFFIX_WORDS = [...new Set([...Object.keys(SUFFIXES), ...Object.values(SUFFIXES).map((s) => s.toLowerCase())])];

/** Visible text of a page, lower case, one space between words. */
export function pageWords(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ').toLowerCase();
}

/**
 * This house, as a page writes it: {street, zip} when the page shows the
 * door's number + street + its own town + state + ZIP, else null.
 */
export function addressOnPage(text, rec, town) {
  if (!rec || !town) return null;
  const number = houseNumber(rec.street);
  const words = streetWords(tidy(rec.street).replace(/^\d+[A-Za-z]?\s+/, ''));
  if (!number || !words.length) return null;
  // Every stored word must appear, in order: a direction in either spelling,
  // the last word in either spelling when it is a street type ("Dr"/"Drive"),
  // and then at most ONE more street type the record left off ("Elm Hill" ->
  // "Elm Hill Dr": "Hill" is itself a USPS type, so it cannot be the last word
  // the page may write).
  const alt = (w, i) => {
    if (i === 0 && FULL_DIRECTION.has(w)) {
      const ab = Object.keys(DIRECTIONS).find((k) => DIRECTIONS[k].toLowerCase() === w);
      return `(?:${esc(w)}|${esc(ab)}\\.?)`;
    }
    if (i === words.length - 1 && SUFFIX_ALTS.has(w)) return `(?:${[...SUFFIX_ALTS.get(w)].map(esc).join('|')})\\.?`;
    return esc(w);
  };
  const streetRe = words.map(alt).join('\\s+');
  const extra = `(?:\\s+(${ALL_SUFFIX_WORDS.map(esc).join('|')})\\.?)?`;
  const re = new RegExp(`\\b${esc(number.toLowerCase())}\\s+${streetRe}${extra}[\\s,]+${esc(low(town))}[\\s,]+(?:il|illinois|[a-z]{2})\\.?[\\s,]+(\\d{5})(?:-\\d{4})?\\b`, 'g');
  const t = String(text || '');
  const zips = new Set();
  let type = '';
  let m;
  while ((m = re.exec(t)) !== null) {
    zips.add(m[2]);
    if (m[1]) type = m[1];
  }
  if (zips.size !== 1) return null;
  const named = words.map((w, i) => (i === words.length - 1 && SUFFIX_ALTS.has(w) ? (SUFFIXES[w] || titleWord(w)) : titleWord(w)));
  const added = type ? (SUFFIXES[type] || titleWord(type)) : '';
  const street = [...named, added].filter(Boolean).join(' ');
  return { street, zip: [...zips][0] };
}

/**
 * The completion from source pages: [{url, text}] -> the same completion()
 * the map's answer gets, as if the page were the geocoder, or {ok:false, why}.
 */
export function completionFromPages(row = {}, pages = []) {
  const rec = recordedStreet(row);
  const own = ownTown(row);
  if (!rec || !own) return { ok: false, why: `the family must name ${needsFromFamily(row) || 'the town'}` };
  const seen = [];
  for (const p of pages || []) {
    const hit = addressOnPage(pageWords(p && p.text), rec, own);
    if (hit) seen.push({ ...hit, url: String(p.url || '') });
  }
  if (!seen.length) return { ok: false, why: 'no source page shows this house with its town and ZIP' };
  if (new Set(seen.map((s) => s.zip)).size > 1) return { ok: false, why: 'the source pages disagree on the ZIP' };
  const best = seen.find((s) => streetWords(s.street).length > streetWords(rec.street.replace(/^\d+[A-Za-z]?\s+/, '')).length) || seen[0];
  let host;
  try { host = new URL(best.url).hostname; } catch { host = 'a public page'; }
  return completion(row, [{ town: own, hit: { ok: true, source: 'research', host, parts: { number: houseNumber(rec.street), street: best.street, city: own, state: tidy(row.state), zip: best.zip } } }]);
}
