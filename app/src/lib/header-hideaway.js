// =============================================================================
// header-hideaway — the ONE-CLICK header collapse preference (pure + testable)
// =============================================================================
// Darrell 2026-06-29: "one click hides everything at the top EXCEPT the tabs —
// date/time, build line, account/subscribe row, voice picker, font controls,
// sample banner — so the screen shows all the dashboard details with max room.
// One click reopens it; it should stay however I leave it."
//
// The control itself is a chrome button pinned to the tab row (always visible,
// even when collapsed). This module is just the PREFERENCE: a per-device boolean,
// stored with the same fail-soft localStorage pattern as text-size.js and the
// profile switcher — so it survives reloads, applies before sign-in, and never
// throws if storage is blocked (private mode / quota). Pure functions are
// exported + unit-tested; the React component is thin glue (read on mount, write
// on toggle), exactly like the other accessibility/comfort primitives.
//
// Default = OPEN (false) until 2026-10-15. THE HERITAGE REDESIGN (DR-1046,
// approved by Darrell, relayed by Christina: "That's nowhere near what I want
// to see" of a phone whose first screen was the stack of controls) makes the
// first-run default TUCKED AWAY: a new device opens on the slim row — the way
// back in words, the brand, the text size — with the full header one tap
// away, exactly as Darrell left it when he chose to tuck it. "It should stay
// however I leave it" still holds: a saved '0' means OPEN and a saved '1'
// means collapsed; only the ABSENT value changed meaning.

export const HEADER_COLLAPSED_KEY = 'poe-header-collapsed';

// Resolve a usable Storage, or null (SSR / tests / blocked storage). Mirrors the
// safeStore pattern in reading-position.js so behavior is identical across the
// comfort primitives.
function safeStore(store) {
  try {
    if (store) return store;
    return (typeof localStorage !== 'undefined' && localStorage) ? localStorage : null;
  } catch (e) { return null; }
}

// Pure toggle — separated so the flip itself is trivially regression-guarded and
// the component never re-derives the boolean inline.
export function nextCollapsed(prev) { return !prev; }

// Read the saved preference. '1' means collapsed, '0' means OPEN; ABSENT
// means the first-run default, collapsed (DR-1046). Garbage reads as open,
// the safe side when the stored value cannot be trusted. No storage at all
// (SSR, blocked) reads as open too, so a device that cannot remember never
// hides controls it could not bring back by memory.
export const DEFAULT_HEADER_COLLAPSED = true;
export function readHeaderCollapsed(store) {
  const ls = safeStore(store);
  if (!ls) return false;
  try {
    const v = ls.getItem(HEADER_COLLAPSED_KEY);
    if (v === '1') return true;
    if (v === null || v === undefined) return DEFAULT_HEADER_COLLAPSED;
    return false;
  } catch (e) { return false; }
}

// Persist the preference. Fails soft (returns false) when storage is unavailable
// so a blocked-storage device still toggles for the session, just without memory.
export function writeHeaderCollapsed(collapsed, store) {
  const ls = safeStore(store);
  if (!ls) return false;
  try { ls.setItem(HEADER_COLLAPSED_KEY, collapsed ? '1' : '0'); return true; }
  catch (e) { return false; }
}
