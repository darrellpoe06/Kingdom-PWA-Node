// =============================================================================
// homes — telling our own home apart from a door we rent out
// =============================================================================
// Darrell, 2026-08-28: "2111 Talans Dr. is not a rental location it is our own
// home only in books for our mortgage to be inside our books for showing
// payments etc... not in the Properties tab because it's not for renting...
// we still want to calculate the funds and other home ownership type things
// like keeping a mechanical history of the system's and issues like all our
// properties etc..." — and then: "Real Estate keeps it just as our home and
// asset."
//
// So there are two questions about the same row and they have opposite answers:
//   Real Estate  — is this ours?      YES. Keep it: the asset, the mortgage,
//                                      the payments, the fund maths.
//   Properties   — is this on offer?  NO. Never listed, never applied for,
//                                      never given a tenancy.
// Everything else the door has — its chronology, its rooms, its photographs,
// its papers and (new in 0156) its mechanical history — belongs to BOTH, which
// is the whole of "like all our properties".
//
// WHY THIS IS ITS OWN FILE. The same judgement already existed on the Real
// Estate side as isPersonalProp() (app/src/lib/rental-portfolio.js:17) and had
// been correct there for months. The Poe Properties board shipped without it and
// put QR TO APPLY next to the family's front door. One shared predicate, tested
// against its sibling, is the fix for a thing that must never be decided twice.
//
// SHAPES. rental-portfolio reads the app's camelCase rental object
// (propertyType, entityId); this module reads the Supabase row (property_type).
// Both are accepted here so a caller cannot pick the wrong one by accident.
// =============================================================================

/** Property types that mean "we live in it", not "we rent it out". */
export const OWN_HOME_TYPES = ['primary-home', 'secondary-home'];

/** The status a rentals row carries when nobody is paying rent because it is ours. */
export const OWN_HOME_STATUS = 'owner-occupied';

/**
 * Is this row our own home? Mirrors public.rental_is_own_home(status,
 * property_type) in migration 0156 — the database refuses to publish anything
 * this returns true for, so the two definitions have to stay the same sentence.
 *
 * Deliberately NOT keyed on rent: "rentals stay rentals before their rent
 * imports" (Darrell, 2026-06-13). Four of the twelve doors carry $0 right now
 * and not one of them is a home.
 */
export function isOwnHome(row) {
  if (!row || typeof row !== 'object') return false;
  const status = String(row.status ?? '').trim();
  const type = String(row.property_type ?? row.propertyType ?? '').trim();
  return status === OWN_HOME_STATUS || OWN_HOME_TYPES.includes(type);
}

/** The complement, said out loud so call sites read as intent, not negation. */
export const isRentalDoor = (row) => !isOwnHome(row);

/**
 * Split a rentals list the way the Properties tab needs it: the doors that are
 * offered, and the homes that are not. Nothing is dropped — a home that vanished
 * from the app entirely would take its mechanical history with it, which is the
 * opposite of what was asked for.
 */
export function splitDoors(rentals = []) {
  const list = Array.isArray(rentals) ? rentals : [];
  return {
    doors: list.filter(isRentalDoor),
    homes: list.filter(isOwnHome),
  };
}

/**
 * Why a leasing action is refused on this row, or null when it is allowed.
 * Returned as a SENTENCE rather than a boolean because every caller that blocks
 * an action owes the person an explanation on screen — and because a silent
 * disabled button is how the family home ended up looking available in the
 * first place.
 */
export function offerRefusal(row) {
  if (!isOwnHome(row)) return null;
  const where = String(row?.display_name || row?.address || 'This property').trim();
  return `${where} is our own home, not a rental door. It is never advertised, never applied for, and never given a tenancy. Its mortgage, payments and asset value stay in Real Estate; its records stay here.`;
}

/**
 * A guard for the write paths. The UI does not offer these actions on a home,
 * the database refuses to publish one, and this is the layer in between — so a
 * future caller that forgets the filter fails loudly instead of quietly listing
 * the address the family sleeps at.
 */
export function assertNotOwnHome(row, action = 'offer') {
  const refusal = offerRefusal(row);
  if (refusal) throw new Error(`Refused to ${action}: ${refusal}`);
  return true;
}
