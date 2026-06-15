// =============================================================================
// Auth session guard — don't hard-logout on a TRANSIENT refresh failure
// =============================================================================
// The "logged out after a while" symptom (project_auth_identity_tenancy_boundary)
// is the one auth bug that was never provably closed. The likely CODE-side cause
// is a transient `null` / `SIGNED_OUT` event that is NOT a real sign-out:
//
//   - PWA resume: the phone backgrounds the tab, the service worker pauses the
//     auto-refresh timer, and on wake the in-memory access token is expired.
//   - Tab / service-worker race: refresh tokens ROTATE. One tab (or the SW)
//     spends the rotating refresh token first; this client's in-memory copy is
//     now stale even though localStorage holds the newer, valid token.
//
// In both cases supabase-js can emit SIGNED_OUT with a null session — and the
// naive handler clears the local session, dumping the user to the sign-in
// screen even though a valid session is one refresh away.
//
// The guard: on a null / SIGNED_OUT event that we did NOT initiate, attempt
// `auth.refreshSession()` FIRST. refreshSession re-reads the refresh token from
// storage, so it recovers the stale-in-memory / rotated-token cases. Only if the
// refresh GENUINELY fails (invalid/expired refresh token = a real sign-out) do
// we clear the local session.
//
// This module is intentionally pure + dependency-injected (the `auth` object is
// passed in) so the recovery decision is unit-testable without a live client.
// =============================================================================

/**
 * Decide which session to surface for an auth event that would otherwise log
 * the user out.
 *
 * Rules, in order:
 *   1. A present session is always honored (no change).
 *   2. A DELIBERATE sign-out (the user pressed sign-out) clears immediately —
 *      no recovery attempt, no flicker.
 *   3. Any other null / SIGNED_OUT is treated as POSSIBLY transient: attempt
 *      auth.refreshSession() and, if it returns a session, recover it.
 *   4. If the refresh errors or returns no session, it's a real sign-out → null.
 *
 * @param {string} event        the supabase auth event (e.g. 'SIGNED_OUT')
 * @param {object|null} session the session from the event (null on sign-out)
 * @param {{ refreshSession: function }} auth  supabase.auth (or a stub in tests)
 * @param {{ deliberate?: boolean }} [opts]    deliberate=true skips recovery
 * @returns {Promise<{ session: object|null, recovered: boolean }>}
 */
export async function resolveAuthSession(event, session, auth, opts = {}) {
  // 1. A live session is always honored.
  if (session) return { session, recovered: false };

  // 2. The user asked to sign out — clear immediately, don't fight it.
  if (opts.deliberate) return { session: null, recovered: false };

  // 3. Transient-or-real: try to refresh BEFORE clearing.
  try {
    const { data, error } = await auth.refreshSession();
    if (!error && data && data.session) {
      // Recovered — the refresh token in storage was still valid. The "logout"
      // was just a stale in-memory token (PWA resume / rotated-token race).
      return { session: data.session, recovered: true };
    }
  } catch (_) {
    // refreshSession threw (offline, network) — fall through to clear.
  }

  // 4. Refresh genuinely failed → this is a real sign-out.
  return { session: null, recovered: false };
}

/**
 * True when an auth event is one that, with a null session, should trigger the
 * recovery path. Today that's only SIGNED_OUT; kept as a helper so the set of
 * "looks like a logout" events lives in one place.
 *
 * @param {string} event
 * @param {object|null} session
 */
export function isPossibleLogout(event, session) {
  return !session && event === 'SIGNED_OUT';
}
