// =============================================================================
// address.js — the whole address, held once, in parts, the same on both doors
// =============================================================================
// Darrell, 2026-10-13, with the Real Estate tab beside Poe Properties:
//   "why don't the addresses reflect each record... they all should be in
//    sync... correct? End to end processes!!!"
//   "Drop down with addresses... instead of letting someone else mistyped"
//   "Hold the whole address so everyone can see the correct pattern for each
//    property"
//
// MEASURED on his records (2026-10-13 screenshots; DR-0967:91-95): some hold
// the whole address in one field ("1508 Williamsburg, Champaign, IL, 61821"),
// one has no town at all ("709 Commercial St, IL"), and the unit rides in the
// street on one door and not another ("805 North Prospect Avenue Apt 4" /
// "Apt 4" beside "805 North Prospect Avenue" / "Apt 2"). Two surfaces then
// parse the same row two ways and nothing matches reliably.
//
// THE PATTERN. One record (the cloud rentals row) holds the address in PARTS:
//   address = house number + street ("805 North Prospect Avenue")
//   unit    = "Apt 2" (never inside the street)
//   city, state, zip
// and ONE formatter prints it, so every surface shows the same line:
//   "805 North Prospect Avenue, Apt 2, Champaign, Illinois 61820"
//
// Pure: no React, no network, no storage. Used by the Real Estate tab, the
// Poe Properties door, the sync mappers and the one-time repair (DR-0998).
// Cleaned, never fuzzy (DR-0967): nothing here guesses that "N" is "North".
// =============================================================================

const DESIGNATOR = '(?:apartment|apt|unit|suite|ste|room|rm|bed|no|number|#)';
const UNIT_TAIL = new RegExp(`[,\\s]+(${DESIGNATOR}\\.?\\s*[A-Za-z0-9-]+)\\s*$`, 'i');

const STATES = {
  al: 'Alabama', ak: 'Alaska', az: 'Arizona', ar: 'Arkansas', ca: 'California', co: 'Colorado', ct: 'Connecticut',
  de: 'Delaware', fl: 'Florida', ga: 'Georgia', hi: 'Hawaii', id: 'Idaho', il: 'Illinois', in: 'Indiana', ia: 'Iowa',
  ks: 'Kansas', ky: 'Kentucky', la: 'Louisiana', me: 'Maine', md: 'Maryland', ma: 'Massachusetts', mi: 'Michigan',
  mn: 'Minnesota', ms: 'Mississippi', mo: 'Missouri', mt: 'Montana', ne: 'Nebraska', nv: 'Nevada', nh: 'New Hampshire',
  nj: 'New Jersey', nm: 'New Mexico', ny: 'New York', nc: 'North Carolina', nd: 'North Dakota', oh: 'Ohio', ok: 'Oklahoma',
  or: 'Oregon', pa: 'Pennsylvania', ri: 'Rhode Island', sc: 'South Carolina', sd: 'South Dakota', tn: 'Tennessee', tx: 'Texas',
  ut: 'Utah', vt: 'Vermont', va: 'Virginia', wa: 'Washington', wv: 'West Virginia', wi: 'Wisconsin', wy: 'Wyoming', dc: 'District of Columbia',
};
const STATE_NAMES = new Set(Object.values(STATES).map((s) => s.toLowerCase()));
const tidy = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();

/** "IL" and "Illinois" are the same state; anything else is not a state. */
export function isState(s) {
  const t = tidy(s).toLowerCase().replace(/\.$/, '');
  return Boolean(STATES[t]) || STATE_NAMES.has(t);
}

/** A ZIP, with or without the +4, or ''. */
export function zipOf(s) {
  const m = tidy(s).match(/^(\d{5})(?:-\d{4})?$/);
  return m ? m[1] : '';
}

/**
 * The street with a trailing unit folded OUT of it: {street, unit}.
 *   "805 North Prospect Avenue Apt 4" -> {street: "805 North Prospect Avenue", unit: "Apt 4"}
 *   "805 North Prospect Avenue"       -> {street: ..., unit: ''}
 * Case is kept; only the split is made.
 */
export function splitUnit(street) {
  const s = tidy(street);
  const m = s.match(UNIT_TAIL);
  if (!m) return { street: s, unit: '' };
  return { street: tidy(s.slice(0, m.index)), unit: tidy(m[1]).replace(/^#\s*/, '#') };
}

/**
 * One line, read into parts. The line is "street[, unit], city, state[ zip]"
 * in any of the shapes his records hold. Never guesses a town: a line with
 * no town leaves city ''. Returns {address, unit, city, state, zip, number}.
 */
export function parseAddress(line) {
  const parts = tidy(line).split(',').map(tidy).filter(Boolean);
  const out = { address: '', unit: '', city: '', state: '', zip: '', number: '' };
  if (!parts.length) return out;
  // The street is the first part; a unit may trail it or sit in its own part.
  const head = splitUnit(parts.shift());
  out.address = head.street;
  out.unit = head.unit;
  if (parts.length && new RegExp(`^${DESIGNATOR}\\.?\\s*[A-Za-z0-9-]+$`, 'i').test(parts[0]) && !out.unit) {
    out.unit = parts.shift();
  }
  // From the end: a zip, then a state (possibly "IL 61821" in one part), then the town.
  const rest = [];
  for (const p of parts) {
    const sz = p.match(/^(.+?)\s+(\d{5}(?:-\d{4})?)$/);
    if (sz && isState(sz[1])) { rest.push(sz[1], sz[2]); continue; }
    rest.push(p);
  }
  if (rest.length && zipOf(rest[rest.length - 1])) out.zip = zipOf(rest.pop());
  if (rest.length && isState(rest[rest.length - 1])) out.state = rest.pop();
  if (rest.length) out.city = rest.shift();
  out.number = (out.address.match(/^(\d+[A-Za-z]?)\b/) || [])[1] || '';
  return out;
}

/** The one line every surface prints: "street, unit, city, state zip". */
export function formatAddress(parts = {}) {
  const street = tidy(parts.address);
  const unit = tidy(parts.unit);
  const city = tidy(parts.city);
  const stateZip = [tidy(parts.state), tidy(parts.zip)].filter(Boolean).join(' ');
  return [street, unit, city, stateZip].filter(Boolean).join(', ');
}

/** The building line, without the unit: what the dropdown offers. */
export function formatBuilding(parts = {}) {
  return formatAddress({ ...parts, unit: '' });
}

/**
 * What an address is missing, in words a card can print. [] when whole.
 * A card says this plainly rather than looking finished (the hollow-surface
 * rule): "709 Commercial St, IL" with no town is a record nobody can place.
 */
export function addressNeeds(parts = {}) {
  const needs = [];
  const street = tidy(parts.address);
  if (!street) needs.push('the street');
  else if (!/^\d+[A-Za-z]?\b/.test(street)) needs.push('the house number');
  if (!tidy(parts.city)) needs.push('the town');
  if (!tidy(parts.state)) needs.push('the state');
  return needs;
}

/**
 * The repair for a record whose address field carries the whole line (the
 * Real Estate shape). Fills ONLY blank parts, never overwrites one that is
 * set, and only when the split is unambiguous: the street keeps its house
 * number and the line yielded a town. Returns {patch, summary} or null.
 */
export function repairAddress(rental = {}) {
  const address = tidy(rental.address);
  if (!address.includes(',') && !UNIT_TAIL.test(address)) return null;
  const p = parseAddress(address);
  if (!p.number) return null;
  // A unit folded out of the street must land in the unit field. When that
  // field already holds a DIFFERENT unit (Bed B inside Apt 4), moving "Apt 4"
  // out would lose which apartment the bed is in: left alone, by design.
  const have = tidy(rental.unit);
  if (p.unit && have && have.toLowerCase() !== p.unit.toLowerCase()) return null;
  const patch = {};
  if (p.address !== address) patch.address = p.address;
  if (p.unit && !tidy(rental.unit)) patch.unit = p.unit;
  if (p.city && !tidy(rental.city)) patch.city = p.city;
  if (p.state && !tidy(rental.state)) patch.state = p.state;
  if (p.zip && !tidy(rental.zip)) patch.zip = p.zip;
  if (!Object.keys(patch).length) return null;
  // Never a half-repair: moving the town out of the street while the record
  // ends up with no town anywhere would lose it.
  if (patch.address !== undefined && !p.city && !tidy(rental.city)) return null;
  const summary = `Address held in its parts: ${Object.entries(patch).map(([k, v]) => `${k} "${v}"`).join(', ')} (was "${address}")`;
  return { patch, summary };
}

/**
 * The distinct buildings among the family's doors, for the dropdown: one entry
 * per street + town, with the parts to fill in on pick. Sorted by the line.
 */
export function buildingOptions(rentals = []) {
  const seen = new Map();
  for (const r of rentals) {
    if (!r) continue;
    const { street } = splitUnit(r.address);
    const parts = { address: street, city: tidy(r.city), state: tidy(r.state), zip: tidy(r.zip) };
    if (!parts.address) continue;
    const key = `${parts.address}|${parts.city}|${parts.state}`.toLowerCase();
    if (!seen.has(key)) seen.set(key, { label: formatBuilding(parts), ...parts });
  }
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/** The option whose line was picked (exactly), or null when the text is new. */
export function pickedBuilding(text, options = []) {
  const t = tidy(text).toLowerCase();
  return options.find((o) => o.label.toLowerCase() === t) || null;
}
