// =============================================================================
// scripture-themes — the Inductive / Precept THEMATIC MARKERS (Darrell 2026-07-04,
// from his Logos "Inductive / Precept" marker screenshots). In inductive study a
// recurring theme is marked the same way every time it appears — a consistent
// color so the eye learns the pattern across the whole Bible. This is that legend,
// PoeTech-native and grounded in the biblical source (THE-HOLY-SPIRIT-INTEGRATION
// -WORLDVIEW): a set of major themes, each with a marker color drawn from the
// shared highlight palette and a short list of ANCHOR verses where the theme is
// unmistakable.
//
// REAL-DATA (DR-0061 / P15): the anchors are not decoration — each is a real
// reference that RESOLVES in the in-app KJV (bible-kjv). Tapping a theme's anchor
// opens that verse VERBATIM in the reader we host; no verse text is stored here
// (DR-0076 — text comes only from the verified fetch artifacts). A test walks
// every anchor against the shipped assets, so a mistyped or non-existent
// reference fails the build rather than shipping a dead study link.
//
// PURE + dependency-light: this is data plus small selectors. The marker color
// reuses a HIGHLIGHT_STYLES key so a theme highlight and a manual highlight share
// one palette — mark a verse "Covenant" and it wears the Covenant color.
// =============================================================================

import { HIGHLIGHT_STYLES } from './scripture-highlights.js';

// Each theme: a stable `key`, a display `label`, a 2-3 letter `abbr` marker chip,
// the `style` key it borrows from the highlight palette (its consistent color),
// a concise scripture-anchored `definition`, and `anchors` — references that
// resolve in the in-app KJV. Definitions state the theme plainly; they do not
// improvise doctrine, and every claim is anchored to the verses listed.
export const THEMES = [
  {
    key: 'covenant', label: 'Covenant', abbr: 'Cov', style: 'sky',
    definition: 'God’s binding promise — He commits Himself to a people and keeps His word.',
    anchors: ['Genesis 17:7', 'Jeremiah 31:33', 'Luke 22:20', 'Hebrews 8:6'],
  },
  {
    key: 'redemption', label: 'Redemption', abbr: 'Rdm', style: 'crimson',
    definition: 'Sin covered and the captive bought back by the blood of a substitute.',
    anchors: ['Leviticus 17:11', 'Isaiah 53:5', 'Romans 3:24', 'Ephesians 1:7'],
  },
  {
    key: 'grace', label: 'Grace', abbr: 'Grc', style: 'gold',
    definition: 'Unearned favor — what God freely gives that no one could earn.',
    anchors: ['Romans 5:20', 'Ephesians 2:8', 'Titus 2:11', '2 Corinthians 12:9'],
  },
  {
    key: 'faith', label: 'Faith', abbr: 'Fth', style: 'coral',
    definition: 'Trust in Yahweh that acts on His word — the just live by it.',
    anchors: ['Habakkuk 2:4', 'Romans 10:17', 'Hebrews 11:1', 'James 2:17'],
  },
  {
    key: 'kingdom', label: 'Kingdom', abbr: 'Kdm', style: 'royal',
    definition: 'The reign of God — His rule breaking in now and coming in full.',
    anchors: ['Daniel 2:44', 'Matthew 6:33', 'Mark 1:15', 'Revelation 11:15'],
  },
  {
    key: 'holiness', label: 'Holiness', abbr: 'Hol', style: 'lilac',
    definition: 'Set apart — God is other, and He calls His people to be set apart too.',
    anchors: ['Leviticus 19:2', 'Isaiah 6:3', 'Hebrews 12:14', '1 Peter 1:16'],
  },
  {
    key: 'love', label: 'Love', abbr: 'Lov', style: 'rose',
    definition: 'God’s self-giving love — the love that lays itself down.',
    anchors: ['Deuteronomy 6:5', 'John 3:16', 'Romans 5:8', '1 John 4:8'],
  },
  {
    key: 'spirit', label: 'Spirit', abbr: 'Spr', style: 'aqua',
    definition: 'The Holy Spirit — God present and at work, from creation to the church.',
    anchors: ['Genesis 1:2', 'Joel 2:28', 'John 14:26', 'Acts 2:4'],
  },
  {
    key: 'life', label: 'Life', abbr: 'Lif', style: 'emerald',
    definition: 'Resurrection and eternal life — death undone, the way that leads Home.',
    anchors: ['Job 19:25', 'John 11:25', '1 Corinthians 15:20', 'Revelation 21:4'],
  },
  {
    key: 'sin', label: 'Sin', abbr: 'Sin', style: 'strike',
    definition: 'Missing the mark — rebellion against God that earns death.',
    anchors: ['Genesis 3:6', 'Romans 3:23', 'Romans 6:23', '1 John 1:8'],
  },
  {
    key: 'judgment', label: 'Judgment', abbr: 'Jdg', style: 'anchor',
    definition: 'God’s righteous verdict — every work brought into account.',
    anchors: ['Ecclesiastes 12:14', 'Romans 2:6', 'Hebrews 9:27', 'Revelation 20:12'],
  },
  {
    key: 'salvation', label: 'Salvation', abbr: 'Slv', style: 'mint',
    definition: 'Rescue by Yahweh — the deliverance only He can give.',
    anchors: ['Exodus 14:13', 'Psalms 27:1', 'Acts 4:12', 'Romans 10:9'],
  },
];

const BY_KEY = Object.fromEntries(THEMES.map((t) => [t.key, t]));

export function getTheme(key) {
  return BY_KEY[key] || null;
}

// The highlight-palette style key a theme is marked with (its consistent color),
// or 'none' if the theme is unknown / its style is missing from the palette.
export function themeMarkerStyle(key) {
  const t = BY_KEY[key];
  if (!t) return 'none';
  const known = new Set(HIGHLIGHT_STYLES.map((s) => s.key));
  return known.has(t.style) ? t.style : 'none';
}

// Every anchor reference across all themes, de-duplicated in first-seen order —
// the full study index the reader can walk.
export function allThemeAnchors() {
  const seen = new Set();
  const out = [];
  for (const t of THEMES) {
    for (const ref of t.anchors) {
      if (!seen.has(ref)) { seen.add(ref); out.push(ref); }
    }
  }
  return out;
}

// Provenance for the surface — the legend is our own, grounded in the source text.
export const THEMES_SOURCE = {
  name: 'PoeTech thematic markers',
  basis: 'The Holy Spirit Integration Worldview (biblical source)',
  note: 'Inductive / Precept-style theme marking, anchored to verified KJV references.',
};
