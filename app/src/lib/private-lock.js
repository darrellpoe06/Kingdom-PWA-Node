// =============================================================================
// private-lock — session unlock state for PIN-gated private areas (Phase A)
// =============================================================================
// Spec: docs/99-session-notes/2026-06-14-private-areas-pin-and-biometric-spec.md
// One in-memory unlock flag for the whole session: the user enters their app PIN
// once to open a private area (Financial / Legal / Sermons) and it stays unlocked
// until reload / sign-out (it guards the entrance, it does not nag). NOTHING is
// persisted — a fresh load re-locks, which is the point (someone who picks up the
// phone after it was closed must re-enter the PIN).
//
// NO-LOCKOUT (hard guardrail from the auth migration): the PIN gate is a LOCAL
// privacy convenience, never the security boundary (RLS already protects the data
// server-side for the authenticated user). So if we CAN'T check the PIN (backend
// unavailable) or the user has NO PIN set, the gate stays OPEN — it must never
// block an authenticated owner from their own data. A forgotten PIN is always
// recoverable by re-signing-in (which resets it).
// =============================================================================

let unlocked = false;
const listeners = new Set();

export function isPrivateUnlocked() { return unlocked; }

export function unlockPrivate() {
  if (!unlocked) { unlocked = true; listeners.forEach((l) => { try { l(); } catch (_) { /* noop */ } }); }
}

export function lockPrivate() {
  if (unlocked) { unlocked = false; listeners.forEach((l) => { try { l(); } catch (_) { /* noop */ } }); }
}

export function subscribePrivateLock(cb) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

// Pure decision for the gate. Returns 'open' | 'loading' | 'locked'.
// Open (no-lockout) when: already unlocked, the PIN backend is unavailable, or
// the user has no PIN. Locked ONLY when a PIN exists and the session isn't
// unlocked yet. Exported for tests.
export function privateGateState({ pinStatusLoaded, hasPin, backendAvailable, unlocked: u }) {
  if (u) return 'open';
  if (!pinStatusLoaded) return 'loading';
  if (backendAvailable === false) return 'open'; // can't verify -> never block the owner
  if (!hasPin) return 'open';                    // no PIN set -> not gated
  return 'locked';
}
