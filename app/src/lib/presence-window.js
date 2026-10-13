// =============================================================================
// presence-window — a PIN proved on this device stays proved for a bounded
// window, instead of being re-demanded in every new tab
// =============================================================================
// Darrell, twice: "keeps signing me in on every tab!!!!!!!!!!" (2026-09-07, his
// tablet) and "She should never be logged [out] or not able to get in!!!!!
// Device info other data.... her husband is trying to act as a user... me too"
// (2026-09-16, while several people tested the Moore Divahs door at once).
//
// MEASURED CAUSE, not a guess. The shell recorded "this human proved presence"
// in **sessionStorage** (`poe-pin-ok:<uid>`), and sessionStorage is scoped to a
// single TAB. A second tab — a link opened from a text, a fresh tab typed by
// hand, a PWA reopened — starts with an empty store, finds no marker, and the
// gate demands the PIN again. The access rule in lib/multi-point-auth.js says
// the knowledge point is "verified this SESSION"; per-tab is stricter than what
// that documents, and the friction it created is what made a working door feel
// broken to the people using it (DR-0219: what it SHOULD do vs what it DID).
//
// WHAT THIS CHANGES, and what it deliberately does NOT. The presence proof is
// now also written to localStorage with the time it was given, and a new tab
// adopts it only while it is still INSIDE the window. Nothing else moves:
//
//   * The 2-of-3 matrix is untouched. A PIN is still required, still the
//     mandatory human-presence point, still the only thing that opens the gate.
//   * The window is DEFAULT_IDLE_MS — the same five minutes the idle lock
//     already uses — so this can never outlive, or quietly widen, that lock.
//     A tab opened an hour later still asks. That is correct and stays.
//   * It is strictly stricter than what the app already permits: an unlocked
//     tab may sit open indefinitely for a user no idle lock applies to. A
//     bounded five-minute adoption cannot expose more than that tab already
//     does, and it expires on its own where an open tab does not.
//   * The pick-up-the-phone threat the matrix was locked against is unchanged:
//     a stranger with the device still faces the PIN once the window lapses,
//     and a forgotten-PIN sign-out clears the marker outright.
//
// EVERY ACCESSOR IS GUARDED. Private windows, cleared site data and blocked
// storage all throw or return null; a presence proof that cannot be read is
// simply absent, which fails CLOSED to asking for the PIN — never open.
//
// The comparison itself is pure and exported so the boundary is pinned by
// tests rather than trusted: a marker exactly at the edge, past it, from the
// future (a clock that moved), or malformed must never read as present.
// =============================================================================
import { DEFAULT_IDLE_MS } from './idle-lock.js';

/** The bounded life of a presence proof. Tied to the idle lock on purpose. */
export const PRESENCE_WINDOW_MS = DEFAULT_IDLE_MS;

export const presenceKey = (uid) => 'poe-pin-ok:' + String(uid || 'anon');

const store = (which) => {
  try {
    if (typeof window === 'undefined') return null;
    return which === 'local' ? window.localStorage : window.sessionStorage;
  } catch (_) {
    return null; // blocked or unavailable — treated as "no proof"
  }
};

/**
 * Is a recorded proof still inside the window?
 * Pure, so the edges are tested rather than assumed.
 * A future-dated marker (the device clock moved, or a hand-edited value) is
 * REFUSED rather than trusted: it would otherwise grant an unbounded window.
 */
export function withinWindow(iso, now = Date.now(), windowMs = PRESENCE_WINDOW_MS) {
  if (!iso) return false;
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return false;
  const age = now - t;
  if (age < 0) return false;
  return age < windowMs;
}

/**
 * Record that a human proved presence on this device, now.
 * Written to BOTH stores: sessionStorage keeps the existing same-tab fast path
 * exactly as it was, localStorage is what a sibling tab can see.
 */
export function markPresence(uid, nowIso = new Date().toISOString()) {
  const key = presenceKey(uid);
  for (const which of ['session', 'local']) {
    const s = store(which);
    if (!s) continue;
    try { s.setItem(key, String(nowIso)); } catch (_) { /* full or blocked */ }
  }
  return nowIso;
}

/**
 * Has presence been proved on this device recently enough to carry into this
 * tab? The same tab's own marker wins immediately; otherwise a sibling tab's
 * marker counts only while it is inside the window.
 */
export function presenceStillValid(uid, now = Date.now(), windowMs = PRESENCE_WINDOW_MS) {
  const key = presenceKey(uid);
  const ses = store('session');
  if (ses) {
    try {
      // The tab that did the verifying keeps its existing behaviour: present
      // for as long as the tab lives, exactly as before this module existed.
      if (ses.getItem(key)) return true;
    } catch (_) { /* fall through to the shared marker */ }
  }
  const loc = store('local');
  if (!loc) return false;
  try {
    return withinWindow(loc.getItem(key), now, windowMs);
  } catch (_) {
    return false;
  }
}

/** Drop the proof everywhere. Used by sign-out and by "Forgot your PIN?". */
export function clearPresence(uid) {
  const key = presenceKey(uid);
  for (const which of ['session', 'local']) {
    const s = store(which);
    if (!s) continue;
    try { s.removeItem(key); } catch (_) { /* ignore */ }
  }
}
