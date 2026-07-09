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
//
// `kind` groups the palette the way Logos does (Darrell 2026-07-04 screenshots:
// "this level is what we would like ... make it flow like the Logos app"):
//   - 'foreground' — COLORED TEXT (the semantic teaching set: the word stands
//      out by its ink color).
//   - 'highlighter' — a HIGHLIGHTER PEN (a soft background tint behind the text,
//      the classic marker).
//   - 'emphasis' — MARKUP (bold / underline / a box / a strike-through) with no
//      color change, for when the shape of the word is the point.
// The reader mixes them: a whole-verse pen underneath, a word's own ink on top.
export const HIGHLIGHT_STYLES = [
  // --- Colored text (foreground) — the semantic set ---
  {
    key: 'sky', label: 'Word', kind: 'foreground', meaning: 'the narrative — what is happening',
    swatch: '#1F5AA6',
    css: { color: '#1F5AA6', fontWeight: 600 },
  },
  {
    key: 'coral', label: 'Promise', kind: 'foreground', meaning: 'the mission, the good news, the anointing',
    swatch: '#C2410C',
    css: { color: '#C2410C', fontWeight: 600 },
  },
  {
    // RED IS RESERVED (Darrell 2026-07-04, binding): red is the Blood of Jesus —
    // the Godhead's own color. It never marks anything else in this palette.
    key: 'crimson', label: 'The Blood', kind: 'foreground', meaning: 'the Blood of Jesus — redemption; red belongs to the Godhead',
    swatch: '#B01E1E',
    css: { color: '#B01E1E', fontWeight: 600 },
  },
  {
    key: 'royal', label: 'Warning', kind: 'foreground', meaning: 'rejection, wrath, the road not to take',
    swatch: '#6D28A8',
    css: { color: '#6D28A8', fontWeight: 600 },
  },
  {
    key: 'emerald', label: 'Life', kind: 'foreground', meaning: 'growth, favor, the way that leads Home',
    swatch: '#2F6B33',
    css: { color: '#2F6B33', fontWeight: 600 },
  },
  {
    key: 'slate', label: 'Note', kind: 'foreground', meaning: 'a quiet aside — context, a name, a place',
    swatch: '#4A4640',
    css: { color: '#4A4640', fontWeight: 600 },
  },
  // --- Highlighter pens (background tint) ---
  {
    key: 'gold', label: 'Treasure', kind: 'highlighter', meaning: 'a verse to keep — the yellow marker',
    swatch: '#E8B93A',
    css: { backgroundColor: '#FBEFC2', color: '#1A1815', borderRadius: '0.1875rem', padding: '0 0.125rem', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' },
  },
  {
    key: 'rose', label: 'Mercy', kind: 'highlighter', meaning: 'love, mercy, tenderness — the softer word',
    swatch: '#D6467F',
    css: { backgroundColor: '#FBE0EA', color: '#1A1815', borderRadius: '0.1875rem', padding: '0 0.125rem', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' },
  },
  {
    key: 'mint', label: 'Growth', kind: 'highlighter', meaning: 'fruit, increase, the green pasture',
    swatch: '#2F9E54',
    css: { backgroundColor: '#DCF0E0', color: '#1A1815', borderRadius: '0.1875rem', padding: '0 0.125rem', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' },
  },
  {
    key: 'aqua', label: 'Living water', kind: 'highlighter', meaning: 'water, Spirit, cleansing, refreshing',
    swatch: '#2C7FB8',
    css: { backgroundColor: '#DAECF6', color: '#1A1815', borderRadius: '0.1875rem', padding: '0 0.125rem', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' },
  },
  {
    key: 'lilac', label: 'Worship', kind: 'highlighter', meaning: 'praise, worship, the royal color',
    swatch: '#7E5BC4',
    css: { backgroundColor: '#ECE3FA', color: '#1A1815', borderRadius: '0.1875rem', padding: '0 0.125rem', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' },
  },
  // --- Emphasis (markup: shape, not color) ---
  {
    key: 'anchor', label: 'Box', kind: 'emphasis', meaning: 'the boxed punchline — make it stand out',
    swatch: '#1A1815',
    css: { color: '#1A1815', fontWeight: 700, border: '0.0625rem solid #C9BFA8', borderRadius: '0.1875rem', padding: '0 0.1875rem', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' },
  },
  {
    key: 'underline', label: 'Underline', kind: 'emphasis', meaning: 'a line to remember — mark, not recolor',
    swatch: '#1A1815',
    css: { color: '#1A1815', textDecorationLine: 'underline', textDecorationColor: '#B85838', textDecorationThickness: '0.125rem', textUnderlineOffset: '0.15em' },
  },
  {
    key: 'bold', label: 'Bold', kind: 'emphasis', meaning: 'the strong word — weight, not color',
    swatch: '#1A1815',
    css: { color: '#1A1815', fontWeight: 800 },
  },
  {
    // Neutral struck line — red is reserved for the Blood, so the strike is drawn
    // in the muted body ink, never red.
    key: 'strike', label: 'Struck', kind: 'emphasis', meaning: 'what is cancelled, put away, made void',
    swatch: '#4A4640',
    css: { color: '#4A4640', textDecorationLine: 'line-through', textDecorationColor: '#4A4640', textDecorationThickness: '0.125rem' },
  },
];

// The palette grouped by kind for the pickers (Logos-style sections). Order is
// the display order; only kinds that have styles appear. Pure data derived from
// HIGHLIGHT_STYLES so the grouping can never drift from the palette.
export const HIGHLIGHT_KINDS = [
  { kind: 'foreground', label: 'Colored text', hint: 'the word stands out by its ink' },
  { kind: 'highlighter', label: 'Highlighter', hint: 'a soft marker behind the text' },
  { kind: 'emphasis', label: 'Emphasis', hint: 'bold, underline, a box — shape, not color' },
];

export const HIGHLIGHT_GROUPS = HIGHLIGHT_KINDS
  .map((g) => ({ ...g, styles: HIGHLIGHT_STYLES.filter((s) => s.kind === g.kind) }))
  .filter((g) => g.styles.length > 0);

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
  return { version: STORE_VERSION, marks: {}, spans: {} };
}

// Normalize any parsed blob into a clean {version, marks, spans}. `marks` is a
// map of ref -> known style key (whole-verse). `spans` is a map of ref -> array
// of { start, end, style } WORD/PHRASE highlights (Darrell 2026-07-04: "I can't
// highlight a word inside of a scripture only the whole verse"). Unknown styles,
// non-string refs, and malformed ranges are dropped so a corrupt or hand-edited
// store can never inject a bogus highlight into the render.
function normalize(parsed) {
  const known = new Set(HIGHLIGHT_STYLES.map((s) => s.key));
  const marks = {};
  const msrc = parsed && typeof parsed.marks === 'object' && parsed.marks ? parsed.marks : {};
  for (const [ref, key] of Object.entries(msrc)) {
    if (typeof ref === 'string' && ref.trim() && known.has(key)) marks[ref] = key;
  }
  const spans = {};
  const ssrc = parsed && typeof parsed.spans === 'object' && parsed.spans ? parsed.spans : {};
  for (const [ref, list] of Object.entries(ssrc)) {
    if (typeof ref !== 'string' || !ref.trim() || !Array.isArray(list)) continue;
    const clean = list
      .filter((s) => s && Number.isInteger(s.start) && Number.isInteger(s.end)
        && s.start >= 0 && s.end > s.start && known.has(s.style))
      .map((s) => ({ start: s.start, end: s.end, style: s.style }));
    if (clean.length) spans[ref] = clean;
  }
  return { version: STORE_VERSION, marks, spans };
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

// --- Word / phrase spans (highlight part of a verse) -------------------------

export function getSpans(state, ref) {
  const base = normalize(state);
  return base.spans[ref] ? base.spans[ref].slice() : [];
}

// Add a { start, end } highlight of `style` to a verse. Returns a NEW state.
// A 'none'/unknown style, or an inverted/empty range, is a no-op.
export function addSpan(state, ref, start, end, style) {
  const base = normalize(state);
  const known = new Set(HIGHLIGHT_STYLES.map((s) => s.key));
  const s = Math.min(start, end);
  const e = Math.max(start, end);
  if (!ref || typeof ref !== 'string' || !ref.trim()) return base;
  if (!known.has(style) || !Number.isInteger(s) || !Number.isInteger(e) || s < 0 || e <= s) return base;
  const spans = { ...base.spans };
  const list = (spans[ref] || []).filter((x) => !(x.start === s && x.end === e)); // replace exact dup
  spans[ref] = [...list, { start: s, end: e, style }].sort((a, b) => a.start - b.start);
  return { version: STORE_VERSION, marks: base.marks, spans };
}

// Remove every span overlapping [start,end) for a ref (an eraser gesture). With
// no range given, clears ALL spans for the ref. Returns a NEW state.
export function clearSpans(state, ref, start = null, end = null) {
  const base = normalize(state);
  if (!base.spans[ref]) return base;
  const spans = { ...base.spans };
  if (start == null || end == null) {
    delete spans[ref];
  } else {
    const kept = base.spans[ref].filter((x) => x.end <= start || x.start >= end);
    if (kept.length) spans[ref] = kept; else delete spans[ref];
  }
  return { version: STORE_VERSION, marks: base.marks, spans };
}

export function spanCount(state) {
  const base = normalize(state);
  return Object.values(base.spans).reduce((n, list) => n + list.length, 0);
}

// Break a verse's text into ordered, NON-overlapping segments for rendering:
// [{ text, style }] where style is 'none' for plain runs. Later spans win on
// overlap (last write on top), matching how a reader layers highlights. Pure —
// unit-tested independently of the DOM.
export function segmentsForVerse(text, spans) {
  const str = String(text == null ? '' : text);
  if (!str) return [];
  const list = (Array.isArray(spans) ? spans : [])
    .filter((s) => s && s.end > s.start && s.start < str.length)
    .map((s) => ({ start: Math.max(0, s.start), end: Math.min(str.length, s.end), style: s.style }));
  // Per-character winning style (later span overrides earlier on overlap).
  const styleAt = new Array(str.length).fill('none');
  for (const s of list) for (let i = s.start; i < s.end; i += 1) styleAt[i] = s.style;
  const out = [];
  let i = 0;
  while (i < str.length) {
    const cur = styleAt[i];
    let j = i + 1;
    while (j < str.length && styleAt[j] === cur) j += 1;
    out.push({ text: str.slice(i, j), style: cur });
    i = j;
  }
  return out;
}
