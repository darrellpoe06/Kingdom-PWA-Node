// =============================================================================
// lovecorner-palette — the Love Corner homepage's colors, MEASURED from the
// church's own emblem, never picked (DR-0076 §4; the DR-1060 method).
// =============================================================================
// Darrell, 2026-11-12, with the redesign mockup on screen: "make the colors
// red black white with a touch gold." The emblem (public/lovecorner-icon-512.png,
// and the Love Corner Experience seal he attached the same day) carries all
// four: a red heart, a black ring, a white field, a gold cross.
//
// Sampled this session from lovecorner-icon-512.png, unfiltered pixels bucketed:
//   gold   (207,166,60)  = #CFA63C   2,789 strongly-gold pixels, the cross
//   red    (228,60,40)   = #E43C28   the heart (DR-1060's sample; it cannot
//                                     carry text — 4.22:1 on white — so the
//                                     deeper sibling #C03222 carries words)
//   black  #1A1012       the ring (DR-1060's ink for this door)
//
// CONTRAST, measured with the WCAG formula before a class was written:
//   ink #1A1012 on gold #CFA63C ........ 8.14  (the gold button's label)
//   gold #CFA63C on black #1A1012 ...... 8.14  (the tagline on the black band)
//   white on red #C03222 ............... 5.64
//   white on black #1A1012 ............. 18.64
//   red #C03222 text on white .......... 5.64
//   muted #6B4440 on white ............. 8.31
//   deep red #8E2217 on tint #FFF0EE ... 7.92
//   gold #CFA63C on red #C03222 ........ 2.47  FAILS — gold never sits on red
//   deep gold #A8832A on white ......... 3.53  FAILS for body text — gold text
//                                        only on the black band; on white, gold
//                                        is a FILL (chips, bars) with ink on it
// Those two failing pairs are the rule, not a footnote: gold text lives on
// black only; on white and red, gold is a fill under ink.
export const LOVE_CORNER_PALETTE = Object.freeze({
  red: '#C03222', // the heart's own hue, deepened to carry words (DR-1060)
  heart: '#E43C28', // the emblem's red, a fill and a mark only
  black: '#1A1012', // the ring
  white: '#FFFFFF', // the field
  cream: '#FFF8F7', // the door's ground (theme-css lovecorner)
  gold: '#CFA63C', // the cross — the touch
  goldInk: '#7A5C14', // gold deep enough for small text on white (6.19)
  goldTint: '#FBF3DC',
  redTint: '#FFF0EE',
  redDeep: '#8E2217',
  muted: '#6B4440',
  line: '#F2D9D5',
});

/** Relative luminance per WCAG 2.x, for the test that pins the table above. */
export function relativeLuminance(hex) {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return 0;
  const ch = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** WCAG contrast ratio between two hex colors, rounded to two places. */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/**
 * The pairs the homepage actually draws text in, each required to clear AA
 * (4.5). A test runs this; a pair that fails here fails the build, so a tint
 * nudged "a little warmer" can never quietly drop a label below legibility.
 */
export const TEXT_PAIRS = Object.freeze([
  { name: 'ink on gold (button label)', fg: LOVE_CORNER_PALETTE.black, bg: LOVE_CORNER_PALETTE.gold },
  { name: 'gold on black (tagline)', fg: LOVE_CORNER_PALETTE.gold, bg: LOVE_CORNER_PALETTE.black },
  { name: 'white on red (band copy)', fg: LOVE_CORNER_PALETTE.white, bg: LOVE_CORNER_PALETTE.red },
  { name: 'white on black (band copy)', fg: LOVE_CORNER_PALETTE.white, bg: LOVE_CORNER_PALETTE.black },
  { name: 'red text on white', fg: LOVE_CORNER_PALETTE.red, bg: LOVE_CORNER_PALETTE.white },
  { name: 'muted on white', fg: LOVE_CORNER_PALETTE.muted, bg: LOVE_CORNER_PALETTE.white },
  { name: 'deep red on red tint', fg: LOVE_CORNER_PALETTE.redDeep, bg: LOVE_CORNER_PALETTE.redTint },
  { name: 'gold ink on white (eyebrow)', fg: LOVE_CORNER_PALETTE.goldInk, bg: LOVE_CORNER_PALETTE.white },
  { name: 'gold ink on gold tint (chip)', fg: LOVE_CORNER_PALETTE.goldInk, bg: LOVE_CORNER_PALETTE.goldTint },
]);
