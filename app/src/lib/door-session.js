// =============================================================================
// door-session — each door signs out on its own; neither depends on the other
// =============================================================================
// Darrell, 2026-08-28: "I want to be able to login to each separate and
// together etc... not dependent..." — said right after Poe Properties appeared
// signed out and he found PoeTech signed out too.
//
// WHAT IS ACTUALLY SHARED, AND WHY. Both doors are the same origin
// (poetech.us), so supabase-js keeps ONE session in one localStorage key. That
// is what makes "together" work with no effort: sign in once, both doors know
// you. It is also what made "separate" impossible — a sign-out in either door
// called supabase.auth.signOut(), which revokes the ONE session, so leaving one
// door threw you out of the other.
//
// THE CONSTRAINT THAT SHAPES THIS FILE (measured, not assumed). The obvious fix
// — give each door its own storage key and copy the session into it — is a trap.
// Supabase refresh tokens ROTATE: the first client to refresh invalidates the
// token every other copy holds. Two clients holding copies of the SAME account's
// token race on every refresh, and the loser is signed out at random. That is
// the exact symptom this is meant to cure, so copying tokens would make it
// worse and harder to see. (app/src/lib/auth-session-guard.js was written for
// the rotated-token race; its comment names it.)
//
// So the separation is at the DOOR, not at the token: one real session, and each
// door remembers whether YOU asked it to forget you. Leaving Poe Properties
// leaves Poe Properties. "Sign out everywhere" is still one tap away and is the
// only thing that touches the real session.
//
// Two accounts at once (his owner account in one door, a tenant account in the
// other, for testing) is NOT solved here and cannot be while both doors share an
// origin and an account. That needs its own decision; this file does not pretend
// to it.
//
// Pure + injectable so it is unit-testable without a browser.
// =============================================================================

const PREFIX = 'poe-door-signed-out:';

/** The doors that can be left independently. */
export const DOORS = Object.freeze({ properties: 'properties', poetech: 'poetech', moore: 'moore' });

const store = (s) => {
  if (s) return s;
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
};

/**
 * Has the person asked THIS door to forget them? Never throws — a private
 * window or blocked storage answers "no", which keeps them signed in rather
 * than locking them out of a door they never left.
 */
export function isDoorSignedOut(door, s) {
  const ls = store(s);
  if (!ls || !door) return false;
  try { return Boolean(ls.getItem(PREFIX + door)); } catch { return false; }
}

/**
 * Leave one door. Deliberately does NOT touch the Supabase session: the other
 * door keeps its sign-in, which is the whole point.
 */
export function leaveDoor(door, s) {
  const ls = store(s);
  if (!ls || !door) return false;
  try { ls.setItem(PREFIX + door, new Date().toISOString()); return true; } catch { return false; }
}

/** Come back to a door. Called whenever a sign-in succeeds at that door. */
export function enterDoor(door, s) {
  const ls = store(s);
  if (!ls || !door) return false;
  try { ls.removeItem(PREFIX + door); return true; } catch { return false; }
}

/**
 * Clear every door's flag. Called alongside a REAL sign-out, so that signing
 * out everywhere and back in does not leave a door still refusing to show you.
 */
export function enterAllDoors(s) {
  const ls = store(s);
  if (!ls) return false;
  try {
    const keys = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    for (const k of keys) ls.removeItem(k);
    return true;
  } catch { return false; }
}

/**
 * What a door should show: the session it may use, and why it is hidden when it
 * is. Returned as a shape rather than a boolean so the door can say "you left
 * this app — come back in" instead of pretending you have no account at all.
 * That distinction is the one the 2026-08-28 bug got wrong in the other
 * direction: an unknown was rendered as "who are you?".
 */
export function doorSession(door, session, s) {
  if (!session) return { session: null, left: false };
  if (isDoorSignedOut(door, s)) return { session: null, left: true };
  return { session, left: false };
}
