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
// Default = OPEN (false): a first-time visitor sees the full, familiar header;
// only a user who chose to tuck it away gets the collapsed state on return.

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

// Read the saved preference. Only the exact string '1' means collapsed; anything
// else (absent, '0', garbage) means OPEN — the safe, familiar default.
export function readHeaderCollapsed(store) {
  const ls = safeStore(store);
  if (!ls) return false;
  try { return ls.getItem(HEADER_COLLAPSED_KEY) === '1'; }
  catch (e) { return false; }
}

// Persist the preference. Fails soft (returns false) when storage is unavailable
// so a blocked-storage device still toggles for the session, just without memory.
export function writeHeaderCollapsed(collapsed, store) {
  const ls = safeStore(store);
  if (!ls) return false;
  try { ls.setItem(HEADER_COLLAPSED_KEY, collapsed ? '1' : '0'); return true; }
  catch (e) { return false; }
}
