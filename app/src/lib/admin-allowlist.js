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
