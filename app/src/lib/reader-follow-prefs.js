// =============================================================================
// How the reader follows the voice — the listener's own choices (DR-0659)
// =============================================================================
// Darrell 2026-09-24: "Still need the reader to keep up with the sentence when
// users want to... do we have all options?" Three choices, remembered on this
// device (a phone and a Fire TV are read differently):
//
//   follow     true  — the lit sentence is scrolled into view as the voice
//                      reaches it (until the listener scrolls on their own;
//                      then "Back to the voice" brings it back).
//              false — the page never moves; the sentence is still lit.
//   highlight  'sentence' | 'off'
//   place      'top' (the default: just under whatever is pinned at the
//              top, one line of context above; Darrell 2026-09-25: "keep the
//              reading at the top of the page as much as possible") | 'centre'
//
// Storage can be missing or throw (private window, cleared data, a TV
// browser); every read falls back to the defaults and every write is
// best-effort, so a reading never breaks over a preference.
export const FOLLOW_PREFS_KEY = 'poe-reader-follow';
export const FOLLOW_DEFAULTS = Object.freeze({ follow: true, highlight: 'sentence', place: 'top' });
const HIGHLIGHTS = ['sentence', 'off'];
const PLACES = ['top', 'centre'];

function store(s) {
  if (s) return s;
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
}

/** Keeps only known values; anything else is the default. */
export function normalizeFollowPrefs(p) {
  const x = p && typeof p === 'object' ? p : {};
  return {
    follow: typeof x.follow === 'boolean' ? x.follow : FOLLOW_DEFAULTS.follow,
    highlight: HIGHLIGHTS.includes(x.highlight) ? x.highlight : FOLLOW_DEFAULTS.highlight,
    place: PLACES.includes(x.place) ? x.place : FOLLOW_DEFAULTS.place,
  };
}

export function loadFollowPrefs(storage) {
  try {
    const s = store(storage);
    const raw = s ? s.getItem(FOLLOW_PREFS_KEY) : null;
    return normalizeFollowPrefs(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...FOLLOW_DEFAULTS };
  }
}

export function saveFollowPrefs(prefs, storage) {
  const p = normalizeFollowPrefs(prefs);
  try { const s = store(storage); if (s) s.setItem(FOLLOW_PREFS_KEY, JSON.stringify(p)); } catch { /* best-effort */ }
  return p;
}
