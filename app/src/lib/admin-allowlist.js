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
// me and my wife Christina").
export const ADMIN_EMAILS = ['darrellpoe06@gmail.com', 'mrspoe06@gmail.com'];

export function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(String(email).toLowerCase().trim());
}
