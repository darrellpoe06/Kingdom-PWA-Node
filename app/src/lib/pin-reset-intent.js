// =============================================================================
// pin-reset-intent — "Forgot your PIN?" actually leads somewhere
// =============================================================================
// The no-lockout rule (lib/multi-point-auth.js) says: a person who forgets
// their PIN re-proves identity (a fresh sign-in) and OVERWRITES it, because
// set_user_pin is always allowed for the authenticated user. The first half
// shipped in handleForgotPin (sign out). The second half never did: the next
// sign-in read has_user_pin() = true and opened "Welcome back" again. Measured
// 2026-09-07 17:00 CDT on Shay's phone — "Too many attempts. Please wait 134
// seconds", on a PIN she set 2026-06-17 and does not have, with the retry
// backoff doubling each time. "Forgot your PIN?" was a door painted on a wall.
//
// This is the second half. Tapping Forgot records an INTENT bound to the
// signed-in user id, then signs out. After the next sign-in — the identity
// proof — the bootstrap reads the intent and opens the SET-PIN gate instead
// of ENTER; set_user_pin replaces the hash and clears the backoff (0022), and
// the intent is consumed. It is bound to the uid so a different person
// signing in on the same device never inherits it, and it lives in
// localStorage (not session) because the sign-out that follows may reload.
//
// SECURITY, plainly: the intent grants nothing by itself. It only changes
// which gate a person meets AFTER they have proven identity with their
// password or phone sign-in — exactly the path the design already named.
// Every read/write is wrapped: storage can be absent or throw (private
// windows, cleared data), and the gate must render correctly with none.
const KEY = 'poetech:pin-reset-intent';

function store() {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}

/** Record that the signed-in user asked to replace a PIN they cannot enter. */
export function markPinResetIntent(uid) {
  const s = store(); if (!s || !uid) return false;
  try { s.setItem(KEY, String(uid)); return true; } catch { return false; }
}

/** Is there a pending intent for THIS user (and only this user)? */
export function hasPinResetIntent(uid) {
  const s = store(); if (!s || !uid) return false;
  try { return s.getItem(KEY) === String(uid); } catch { return false; }
}

/** Clear the intent once a new PIN is set (or on explicit cancel). */
export function clearPinResetIntent() {
  const s = store(); if (!s) return;
  try { s.removeItem(KEY); } catch { /* nothing to clear */ }
}
