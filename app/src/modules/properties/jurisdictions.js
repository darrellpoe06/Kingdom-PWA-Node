// =============================================================================
// properties/jurisdictions — the legal values a document needs, per place
// =============================================================================
// Darrell, 2026-08-27: "derived from state requirements etc.... current code
// based on the information available ... eventually for every state based on
// their codes ... we want all options to be able to use this one App."
//
// MEASURED FIRST (DR-0061): every Poe Properties door is in ILLINOIS — Champaign
// (5), Danville (1), and 6 with no city recorded (live query, 2026-08-27). So
// Illinois is where the registry starts, with the structure built to take every
// other state as this app reaches other landlords.
//
// ── THE ONE RULE THAT MAKES THIS SAFE ───────────────────────────────────────
// I DO NOT WRITE STATUTORY NUMBERS FROM MEMORY. A deposit-return deadline or a
// notice period recalled wrong does not read as wrong — it reads as a finished
// document, and it is a statutory violation the day it is handed to someone.
// So every requirement here ships with:
//   · the CITATION to check (chapter and act, so a person knows where to look),
//   · `status: 'unverified'` until a named human confirms it, with the date,
//   · and NO value at all until then.
// A document asks this registry for a value; an unverified requirement returns a
// NAMED BLANK carrying its citation, so the draft says "check 765 ILCS 710"
// rather than printing a number nobody stands behind. `verify()` is how a value
// enters — who confirmed it and when — the same shape as the co-living
// clearances (DR-029) and for the same reason.
//
// ── CITY SITS ON TOP OF STATE ───────────────────────────────────────────────
// Champaign and Danville can carry municipal landlord-tenant ordinances that
// override or add to state law. `requirementsFor()` layers city over state and
// says which level answered, so a Champaign door is never quietly given the
// bare state answer.
//
// PURE: no I/O, no React. Not legal advice.
// =============================================================================

/** "Illinois" and "IL" are the same place. The live data holds both. */
export function normalizeState(raw = '') {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (s.length === 2) return s.toUpperCase();
  const byName = { illinois: 'IL', iowa: 'IA', indiana: 'IN', missouri: 'MO', wisconsin: 'WI' };
  return byName[s.toLowerCase()] || s.toUpperCase().slice(0, 2);
}

export function normalizeCity(raw = '') {
  return String(raw || '').trim().toLowerCase();
}

/**
 * The requirement TYPES the documents ask for. Naming them is the durable part;
 * the values are per-jurisdiction and per-verification.
 */
export const REQUIREMENT_TYPES = Object.freeze([
  Object.freeze({ id: 'deposit-return-days', label: 'Days to return a security deposit', usedBy: ['move-out-deposit'] }),
  Object.freeze({ id: 'deposit-itemization-days', label: 'Days to give an itemized statement of deductions', usedBy: ['move-out-deposit'] }),
  Object.freeze({ id: 'deposit-interest', label: 'Whether deposit interest is owed, and at what rate', usedBy: ['lease-whole-unit', 'lease-by-room', 'move-out-deposit'] }),
  Object.freeze({ id: 'entry-notice-hours', label: 'Advance notice before entering', usedBy: ['notice-entry'] }),
  Object.freeze({ id: 'late-rent-cure-days', label: 'Notice/cure period before further steps on unpaid rent', usedBy: ['notice-late-rent'] }),
  Object.freeze({ id: 'lease-disclosures', label: 'Disclosures the lease must carry', usedBy: ['lease-whole-unit', 'lease-by-room'] }),
  Object.freeze({ id: 'per-room-regime', label: 'Whether renting rooms separately is permitted, and under what license', usedBy: ['lease-by-room'] }),
]);

export const REQUIREMENT_IDS = Object.freeze(REQUIREMENT_TYPES.map((r) => r.id));

/**
 * A requirement entry. `value` is null until a human verifies it — that is the
 * whole point. `citation` is where to look; `note` is why it matters.
 */
const REQ = (citation, note, extra = {}) => Object.freeze({
  citation, note, value: null, status: 'unverified',
  verifiedBy: null, verifiedAt: null, ...extra,
});

/**
 * The registry. Illinois first because that is where every door is. A state
 * added later is a new key — the documents need no change.
 */
export const JURISDICTIONS = Object.freeze({
  IL: Object.freeze({
    state: 'IL', name: 'Illinois',
    requirements: Object.freeze({
      'deposit-return-days': REQ('765 ILCS 710 (Security Deposit Return Act)', 'Applies by building size; the deadline and what triggers it are the numbers to confirm.'),
      'deposit-itemization-days': REQ('765 ILCS 710', 'The itemized statement and its deadline are statutory, not a courtesy.'),
      'deposit-interest': REQ('765 ILCS 715 (Security Deposit Interest Act)', 'Whether interest is owed turns on unit count; confirm for each building.'),
      'entry-notice-hours': REQ('Illinois has no single statewide entry-notice statute — the lease term and any municipal ordinance govern', 'Because there is no one state number, this MUST come from the lease and the city ordinance.'),
      'late-rent-cure-days': REQ('735 ILCS 5/9-209 (demand for rent)', 'The notice period and its required wording are statutory.'),
      'lease-disclosures': REQ('Federal lead-based paint disclosure 42 U.S.C. §4852d / 24 CFR Part 35 for pre-1978 housing; Illinois Radon Awareness Act 420 ILCS 46', 'Which apply depends on the building’s age and county — a fact about each door, not a state default.'),
      'per-room-regime': REQ('Municipal zoning and rooming-house licensing — city level, not state', 'This is the DR-029 checklist’s subject; it is cleared per parcel, never per state.'),
    }),
    cities: Object.freeze({
      champaign: Object.freeze({
        name: 'Champaign',
        note: 'Champaign has its own landlord-tenant provisions; the city layer can override or add to the state answer. Confirm at the city level for these doors.',
        requirements: Object.freeze({
          'entry-notice-hours': REQ('City of Champaign municipal code — landlord/tenant', 'A municipal entry-notice rule, if any, governs here over silence at the state level.'),
          'deposit-return-days': REQ('City of Champaign municipal code — landlord/tenant', 'Confirm whether the city sets a shorter deadline than the state act.'),
        }),
      }),
      danville: Object.freeze({
        name: 'Danville',
        note: 'Confirm whether Danville carries its own landlord-tenant or rental-licensing provisions for this door.',
        requirements: Object.freeze({}),
      }),
    }),
  }),
});

export const KNOWN_STATES = Object.freeze(Object.keys(JURISDICTIONS));

/**
 * The requirements for one door, city layered over state. Each answer says
 * which LEVEL answered it, so a city door never silently gets the bare state
 * answer — and an unknown state is said plainly rather than defaulted.
 */
export function requirementsFor({ state, city } = {}) {
  const st = normalizeState(state);
  const jur = JURISDICTIONS[st];
  if (!jur) {
    return {
      ok: false, state: st || null, reason: st ? 'state-not-in-registry' : 'no-state-recorded',
      message: st
        ? `${st} is not in the registry yet. Every requirement for a ${st} door has to be established before its documents can carry a legal value.`
        : 'This door has no state recorded, so no jurisdiction can be resolved for it.',
      requirements: {},
    };
  }
  const cityKey = normalizeCity(city);
  const cityEntry = jur.cities[cityKey] || null;
  const out = {};
  for (const id of REQUIREMENT_IDS) {
    const fromCity = cityEntry && cityEntry.requirements[id];
    const fromState = jur.requirements[id];
    const chosen = fromCity || fromState || null;
    if (chosen) out[id] = { ...chosen, level: fromCity ? 'city' : 'state', jurisdiction: fromCity ? cityEntry.name : jur.name };
  }
  return {
    ok: true, state: st, city: cityEntry ? cityEntry.name : (city || null),
    cityNote: cityEntry ? cityEntry.note : (cityKey ? null : 'No city recorded for this door — a municipal ordinance cannot be checked until there is one.'),
    requirements: out,
  };
}

/**
 * Ask for one legal value. Returns { value, blank, citation, level } — `blank`
 * is what a document prints when nothing is verified: the citation to check,
 * never a number.
 */
export function legalValue(id, place = {}) {
  const res = requirementsFor(place);
  const req = res.requirements[id];
  const type = REQUIREMENT_TYPES.find((t) => t.id === id);
  if (!req) {
    return { value: null, blank: `[${type ? type.label : id} — ${res.message || 'no jurisdiction'}]`, citation: null, level: null, verified: false };
  }
  if (req.status === 'verified' && req.value) {
    return { value: req.value, blank: null, citation: req.citation, level: req.level, verified: true, verifiedBy: req.verifiedBy, verifiedAt: req.verifiedAt };
  }
  return {
    value: null,
    blank: `[${type ? type.label : id} — confirm against ${req.citation}]`,
    citation: req.citation, level: req.level, verified: false,
  };
}

/**
 * How a value enters the registry: a named person, a date, and the value. Same
 * discipline as the co-living clearances — the module records THAT a human
 * established it, and never establishes it itself.
 */
export function verify({ state, city, id, value, verifiedBy, verifiedAt } = {}) {
  if (!REQUIREMENT_IDS.includes(id)) return { ok: false, reason: 'unknown-requirement' };
  if (value === undefined || value === null || String(value).trim() === '') return { ok: false, reason: 'no-value' };
  if (!String(verifiedBy || '').trim()) return { ok: false, reason: 'no-one-named' };
  if (!verifiedAt) return { ok: false, reason: 'no-date' };
  const st = normalizeState(state);
  if (!JURISDICTIONS[st]) return { ok: false, reason: 'state-not-in-registry' };
  return {
    ok: true,
    entry: {
      state: st, city: normalizeCity(city) || null, requirement_id: id,
      value: String(value), status: 'verified',
      verified_by: String(verifiedBy).trim(), verified_at: verifiedAt,
    },
  };
}

/** What still has to be established before this door's documents carry values. */
export function outstandingRequirements(place = {}) {
  const res = requirementsFor(place);
  if (!res.ok) return { ok: false, reason: res.reason, message: res.message, outstanding: REQUIREMENT_IDS };
  const outstanding = Object.entries(res.requirements)
    .filter(([, r]) => r.status !== 'verified' || !r.value)
    .map(([id]) => id);
  return { ok: true, outstanding, total: REQUIREMENT_IDS.length, cityNote: res.cityNote };
}
