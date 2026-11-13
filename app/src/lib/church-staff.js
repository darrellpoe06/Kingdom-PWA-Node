// =============================================================================
// church-staff — who counts as church STAFF (The Church of the Living God)
// =============================================================================
// Moved out of the shell 2026-11-12 (the Youth Zone's mount line is paid for by
// this extraction; the monolith budget only ever goes down, DR-0075). Behavior
// unchanged: DISTINCT from family/Governor — church staff get access to church
// STAFF-ONLY surfaces (e.g. the Observation board) and NOTHING else — no family
// data, no financials, no Governor powers, no real family names. Tenancy
// boundary stays intact (see DR-0074). Add staff emails here as they get
// accounts; an allowlist (not a domain match) keeps it auditable and avoids
// over-granting to anyone the church ever issues mail to.
export const CHURCH_STAFF_EMAILS = new Set([
  'bg@thechurchofthelivinggod.com', // Bishop Gwin
]);
export const isChurchStaffEmail = (email) => CHURCH_STAFF_EMAILS.has(String(email || '').toLowerCase());
