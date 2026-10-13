// =============================================================================
// admin-allowlist — the canonical steward/admin email allowlist (pure, no I/O)
// =============================================================================
// ONE source of truth for "who administers", shared by interest-sync (the RLS
// mirror on the interest/invite list) and admin-console (the in-app Admin roster).
// Mirrors migration 0023's RLS allow-list and tenancy-guard's family allowlist —
// the database is the real gate; this drives honest UI gating.
//
// Deliberately dependency-free (no supabase, no window) so it imports cleanly in a
// node test environment and the pure admin-console backbone stays testable.
// =============================================================================

// Darrell + Christina — the only eyes on the admin surfaces ("all of this before
// me and my wife Christina"). The phone-pin synthetic address IS Darrell — the
// same person through the phone door (DR-0172; measured 2026-08-20, nas-health
// run 32388793736, when the phone sign-in carried no admin). Mirrors 0140's
// RLS policies; the database remains the real gate.
export const ADMIN_EMAILS = ['darrellpoe06@gmail.com', 'mrspoe06@gmail.com', '15636502416@phone.poetech.us'];

export function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(String(email).toLowerCase().trim());
}

// =============================================================================
// WHICH SIGN-IN DOORS BELONG TO THE SAME PERSON
// =============================================================================
// Darrell 2026-09-11: "try to get email and cellphone together if they have
// them... however just not allowing it to be a constraint."
//
// The friction, measured on the live roster the same day: in poe-family and in
// tlc-therapy-solutions the Governor appears TWICE — once as darrellpoe06
// (gmail, no phone) and once as "Darrell" (the phone door, a phone, no email).
// They are two auth accounts and they are one man.
//
// This map is the DECLARED pairing — not a guess, not a name match. It mirrors
// FAMILY_EMAIL_PROFILES in the shell (the personas the profile-mapping effect
// already reads), and a test pins the two together so they cannot drift apart.
//
// IT PAIRS FOR DISPLAY ONLY. Nothing merges two accounts: a merge is
// irreversible and is the Governor's word to give, not a heuristic's. The
// roster shows one person with two doors, and both rows stay exactly as they
// are in the database.
export const DECLARED_SAME_PERSON = Object.freeze({
  'darrellpoe06@gmail.com': 'darrell',
  '15636502416@phone.poetech.us': 'darrell',
  'mrspoe06@gmail.com': 'christina',
  'christina@tlctherapysolutions.com': 'christina',
  'darrellpoejr@gmail.com': 'family',
});

/** The declared person behind a sign-in address, or '' when nobody declared one. */
export function declaredPersonOf(email) {
  return DECLARED_SAME_PERSON[String(email || '').toLowerCase().trim()] || '';
}
