// =============================================================================
// scripture-highlights — the in-app verse highlighter (Darrell 2026-07-04).
// =============================================================================
// "I like the Logos Bible because I can change the color of text to make it
// stand out for me — can we do something internal inside the PoeTech App?"
//
// Darrell's Logos screenshots (Luke 2 and Luke 4) show color used as a SEMANTIC
// system, not just a yellow marker: blue for the narrative, coral for the
// mission/promise, red for the hard truth, purple for the rejection/wrath, a
// boxed emphasis for the punchline. This module brings that inside PoeTech so a
// reader marks any verse and it STAYS marked — for them, on their device.
//
// SOVEREIGN + PRIVATE (DATA-AS-EMPOWERMENT-NOT-EXTRACTION): a person's markings
// are their own. They live DEVICE-LOCAL (localStorage), keyed to the signed-in
// identity so two profiles on one device never commingle, and are never sent
// anywhere. The same fail-soft posture as the personal Study (study-space.js):
// a throwing/absent localStorage (private-mode Safari, SSR, tests) degrades to
// an empty, in-memory state and never throws into the render tree.
//
// PURE + dependency-light: the store functions are node-testable; the palette is
// data the component renders. No verse text lives here (that is scripture-kjv /
// the verified fetch artifacts) — only which color a reference is marked with.
// =============================================================================

const STORE_VERSION = 1;
const KEY_PREFIX = 'poetech.highlights.v1';

// The palette. Each style is a full look (what it does to the verse) PLUS the
// meaning it tends to carry, so the picker can teach the system as it is used.
// Colors are chosen to read on the white verse card (near-black body text is
// #1A1815); every text color clears WCAG AA (>= 4.5:1) on white, and the
// background tints keep the dark body text well above AA. `swatch` is the chip
// shown in the picker; `css` is spread straight onto the verse's text element.
export const HIGHLIGHT_STYLES = [
  {
    key: 'sky', label: 'Word', meaning: 'the narrative — what is happening',
    swatch: '#1F5AA6',
    css: { color: '#1F5AA6', fontWeight: 600 },
  },
  {
    key: 'coral', label: 'Promise', meaning: 'the mission, the good news, the anointing',
    swatch: '#C2410C',
    css: { color: '#C2410C', fontWeight: 600 },
  },
  {
    key: 'crimson', label: 'Hard truth', meaning: 'the word that cuts before it heals',
    swatch: '#B01E1E',
    css: { color: '#B01E1E', fontWeight: 600 },
  },
  {
    key: 'royal', label: 'Warning', meaning: 'rejection, wrath, the road not to take',
    swatch: '#6D28A8',
    css: { color: '#6D28A8', fontWeight: 600 },
  },
  {
    key: 'emerald', label: 'Life', meaning: 'growth, favor, the way that leads Home',
    swatch: '#2F6B33',
    css: { color: '#2F6B33', fontWeight: 600 },
  },
  {
    key: 'gold', label: 'Treasure', meaning: 'a verse to keep — the yellow marker',
    swatch: '#E8B93A',
    css: { backgroundColor: '#FBEFC2', color: '#1A1815', borderRadius: '0.1875rem', padding: '0 0.125rem', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' },
  },
  {
    key: 'anchor', label: 'Anchor', meaning: 'the boxed punchline — make it stand out',
    swatch: '#1A1815',
    css: { color: '#1A1815', fontWeight: 700, border: '0.0625rem solid #C9BFA8', borderRadius: '0.1875rem', padding: '0 0.1875rem', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' },
  },
];

export const DEFAULT_STYLE_KEY = 'none';

// The 'none' sentinel is not in the palette (it is the absence of a mark); it
// resolves to an empty look so the verse renders in the surface's own style.
export function styleFor(key) {
  if (!key || key === 'none') return { key: 'none', label: 'Clear', meaning: 'no highlight', swatch: null, css: {} };
  return HIGHLIGHT_STYLES.find((s) => s.key === key) || { key: 'none', label: 'Clear', meaning: 'no highlight', swatch: null, css: {} };
}

// The React inline-style object for a mark — spread onto the verse text element.
// Always an object (never null), so the caller can spread unconditionally.
export function cssForHighlight(key) {
  return { ...styleFor(key).css };
}

// --- Per-identity device-local persistence (the only I/O; fails soft) --------

function safeStorage() {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) return null;
    return localStorage;
  } catch { return null; }
}

// Per-identity key: a reader's markings are tied to their identity, never
// commingled with another signed-in profile on the same device.
export function highlightsKey(email) {
  const id = String(email || 'anon').trim().toLowerCase();
  return `${KEY_PREFIX}:${id}`;
}

export function emptyHighlights() {
  return { version: STORE_VERSION, marks: {} };
}

// Normalize any parsed blob into a clean {version, marks} — marks is a plain
// map of ref -> known style key; unknown keys and non-string refs are dropped so
// a corrupt or hand-edited store can never inject a bogus mark into the render.
function normalize(parsed) {
  const known = new Set(HIGHLIGHT_STYLES.map((s) => s.key));
  const marks = {};
  const src = parsed && typeof parsed.marks === 'object' && parsed.marks ? parsed.marks : {};
  for (const [ref, key] of Object.entries(src)) {
    if (typeof ref === 'string' && ref.trim() && known.has(key)) marks[ref] = key;
  }
  return { version: STORE_VERSION, marks };
}

export function loadHighlights(email) {
  const ls = safeStorage();
  if (!ls) return emptyHighlights();
  try {
    const raw = ls.getItem(highlightsKey(email));
    if (!raw) return emptyHighlights();
    return normalize(JSON.parse(raw));
  } catch {
    return emptyHighlights();
  }
}

export function saveHighlights(email, state) {
  const ls = safeStorage();
  if (!ls) return { skipped: 'no-storage' };
  try {
    ls.setItem(highlightsKey(email), JSON.stringify(normalize(state)));
    return { saved: true };
  } catch (e) {
    return { skipped: 'write-error', error: e };
  }
}

// --- Pure state transforms (the store is immutable data) ---------------------

export function getMark(state, ref) {
  return (state && state.marks && state.marks[ref]) || 'none';
}

// Set (or with 'none'/unknown, clear) the mark for a reference. Returns a NEW
// state; never mutates the argument.
export function setMark(state, ref, key) {
  const base = normalize(state);
  if (!ref || typeof ref !== 'string' || !ref.trim()) return base;
  const known = new Set(HIGHLIGHT_STYLES.map((s) => s.key));
  const marks = { ...base.marks };
  if (!key || key === 'none' || !known.has(key)) delete marks[ref];
  else marks[ref] = key;
  return { version: STORE_VERSION, marks };
}

// Tap-to-cycle: none -> first style -> ... -> last style -> none. Lets a single
// repeated tap walk the whole palette without opening the picker.
export function cycleMark(state, ref) {
  const order = ['none', ...HIGHLIGHT_STYLES.map((s) => s.key)];
  const cur = getMark(state, ref);
  const next = order[(order.indexOf(cur) + 1) % order.length];
  return setMark(state, ref, next);
}

export function markCount(state) {
  return Object.keys(normalize(state).marks).length;
}

export function clearAllMarks(state) {
  return emptyHighlights();
}
