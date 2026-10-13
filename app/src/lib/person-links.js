// =============================================================================
// person-links — one person, two doors (DR-0311)
// =============================================================================
// The database holds the authoritative link (person_links, migration 0141):
// Darrell's gmail identity and his phone+PIN door are ONE person, and RLS
// (same_person) already serves one library to both. This module is the
// client-side mirror of that fact for SURFACE decisions only — e.g. the
// AuthBanner must not offer "Add email" to a door that is already linked
// (adding the gmail address would fail "already registered", measured
// 2026-08-20, because the account it "conflicts" with is his own).
//
// Keyed by the door's synthetic email — the one stable, non-PII-beyond-what-
// the-session-already-shows value the client holds. Never used for data
// access decisions; RLS remains the only data gate (DR-0060).

export const LINKED_DOORS = {
  // door email                      -> the primary identity it belongs to
  '15636502416@phone.poetech.us': 'darrellpoe06@gmail.com',
};

// Is this signed-in email a door already linked to a primary identity?
export function isLinkedDoor(email) {
  return Object.prototype.hasOwnProperty.call(LINKED_DOORS, String(email || '').toLowerCase());
}

// The primary identity a door belongs to, or null.
export function linkedPrimary(email) {
  return LINKED_DOORS[String(email || '').toLowerCase()] || null;
}
