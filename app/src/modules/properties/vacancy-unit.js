// =============================================================================
// vacancy-unit — ONE reading of a public_vacancies() row, for every door
// =============================================================================
// Darrell, 2026-10-27, signed out on poetech.us: "the images don't populate
// when we are advertising the apartment... it does when you go into the first
// tab however... if you don't have an account you should be able to just see
// the images".
//
// MEASURED (DR-1236, the anon probe, Chromium on poetech.us signed out):
// state=ok cards=2 pictures=0, and not one request to
// public_vacancy_photo_list. The front door handed VacancyCard the RAW RPC row
// (`unit={v}`), and the card asks for a unit's pictures by `unit.rentalId`
// (Storefront.jsx) — a field the row does not carry (its id is `id`). So the
// card never asked, and said "Photographs coming" over sixteen pictures the
// road was ready to serve. The first tab (PropertiesApp) and the branded door
// (PropertiesDoor) each carried their OWN copy of the row-to-card mapping and
// so each named rentalId; the front door was the third copy that did not
// exist. Three mappings of one row is how the third door drifted.
//
// This is the one mapping, read by all three. A field that is not on the row
// stays null — never 0, never an invented answer (three states, DR-0946).
// =============================================================================
import { areaOf } from './area.js';

const pos = (x) => { const n = Number(x); return Number.isFinite(n) && n > 0 ? n : null; };
const str = (x) => String(x ?? '').trim();

/**
 * The card's unit from a public_vacancies() row. `label` falls back through
 * the older column names the first tab accepted (address, property_label,
 * name) so a row from an older RPC still names its door.
 */
export function vacancyUnit(v) {
  if (!v || typeof v !== 'object') return null;
  const label = str(v.label) || str(v.address) || str(v.property_label) || str(v.name);
  const city = str(v.city); const state = str(v.state);
  return {
    id: String(v.id || v.rental_id || label),
    // THE KEY THE CARD ASKS FOR ITS PICTURES WITH. Null, never undefined, so
    // a caller can see at a glance that a row without an id has no pictures.
    rentalId: v.id || v.rental_id || null,
    label,
    where: [city, state].filter(Boolean).join(', '),
    unit: str(v.unit || v.unit_label),
    rent: pos(v.rent ?? v.monthly_rent ?? v.listed_rent),
    beds: pos(v.bedrooms),
    baths: pos(v.bathrooms),
    offering: str(v.offering) || 'long-term',
    nightly: pos(v.nightly_rate),
    // ANY CADENCE (DR-1003): NULL from the database is "not offered that
    // way", and stays null here, never 0.
    weekly: pos(v.weekly_rate),
    biweekly: pos(v.biweekly_rate),
    buildingNote: str(v.building_note) || null,
    note: str(v.note || v.listed_note || v.blurb),
    // Undefined (an older RPC) reads as SHOWN, because that is what the old
    // behaviour actually was — claiming a door is protected when the
    // database has not been migrated yet would be the same lie in reverse.
    addressShown: v.address_shown === undefined ? true : Boolean(v.address_shown),
    area: areaOf(v),
    street: str(v.street),
    city,
    state,
    nearby: Array.isArray(v.nearby) ? v.nearby : [],
    // WHAT IS ACTUALLY BEING RENTED (DR-0952). A bed or a room in a shared
    // home is not a one-bedroom apartment, and the card said it was.
    sharedHome: Boolean(v.shared_home),
    rentableLevel: str(v.rentable_level) || null,
    // Three states, not two: true, false, and NOT YET SAID.
    utilities: v.utilities_included === null || v.utilities_included === undefined
      ? null : Boolean(v.utilities_included),
  };
}

/** Every row that names a door, as the card reads it. */
export function vacancyUnits(rows) {
  return (Array.isArray(rows) ? rows : []).map(vacancyUnit).filter((u) => u && u.label);
}

/**
 * One plain line about a read that failed (DR-1236): which read, its reason,
 * and the code or first words of the error. Codes only — never a row, a
 * street or a key. Both doors say it the same way, under the visitor's words.
 */
export function readFailureLine(r) {
  const reason = String((r && r.reason) || 'read-failed');
  const err = String((r && r.error) || '').replace(/eyJ[\w-]{8,}\.[\w.-]+/g, '<jwt>').replace(/\s+/g, ' ').trim().slice(0, 120);
  return `Read failed: public_vacancies · ${reason}${err ? ` · ${err}` : ''}`;
}
