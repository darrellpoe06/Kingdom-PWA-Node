// =============================================================================
// scripture-theme-scan — the ONE-CLICK "Highlighted Bible" engine (Darrell
// 2026-07-04). "one click and the whole chapter or verse or even Bible uses the
// highlighted Bible ... shows all the verses with highlighted words based on the
// key and color code for easy to see patterns from Yahweh."
//
// Given a verse's text, this returns the WORD SPANS to color — each recurring
// theme word wearing its theme's marker color (scripture-themes). It reuses the
// exact span shape the reader already renders (segmentsForVerse), so turning the
// pattern view on is just: scan every verse, hand the spans to the same renderer.
//
// DETERMINISTIC + PURE (DR-0076): no model, no guessing. A curated, WHOLE-WORD
// lexicon per theme (KJV word forms) — matched on word boundaries so "sin" never
// lights up inside "since" or "sing". The lexicon is data; the scan is a pure
// function; both are unit-tested against real KJV verses. This overlay never
// touches a reader's SAVED highlights — it is a view computed on the fly, so a
// student can flip it on to see the patterns and off to read plain.
// =============================================================================

import { THEMES, themeMarkerStyle } from './scripture-themes.js';

// The lexicon: theme key -> the KJV word forms that mark that theme. Kept
// CONSERVATIVE and whole-word; a word belongs to at most one theme so the color
// code stays legible. Chosen from how each theme actually reads in the KJV.
export const THEME_WORDS = {
  covenant: ['covenant', 'covenants', 'covenanted'],
  redemption: ['redeem', 'redeemed', 'redeemeth', 'redeemer', 'redemption', 'ransom', 'ransomed', 'purchased'],
  grace: ['grace', 'gracious', 'graciously'],
  faith: ['faith', 'faithful', 'faithfulness', 'believe', 'believed', 'believeth', 'believest', 'believing', 'belief', 'trust', 'trusted', 'trusteth'],
  kingdom: ['kingdom', 'kingdoms', 'reign', 'reigned', 'reigneth', 'throne'],
  holiness: ['holy', 'holiness', 'sanctify', 'sanctified', 'sanctifieth', 'hallowed', 'consecrate', 'consecrated'],
  love: ['love', 'loved', 'lovest', 'loveth', 'lovingkindness', 'beloved', 'charity', 'mercy', 'merciful', 'mercies', 'compassion'],
  spirit: ['spirit', 'spirits', 'ghost'],
  life: ['life', 'living', 'resurrection', 'immortality', 'immortal', 'everlasting', 'eternal'],
  sin: ['sin', 'sins', 'sinned', 'sinneth', 'sinner', 'sinners', 'sinful', 'iniquity', 'iniquities', 'transgression', 'transgressions', 'transgress', 'transgressed', 'trespass', 'trespasses', 'wicked', 'wickedness'],
  judgment: ['judge', 'judged', 'judgeth', 'judgment', 'judgments', 'judgement', 'condemn', 'condemned', 'condemnation', 'wrath', 'vengeance', 'recompense'],
  salvation: ['salvation', 'save', 'saved', 'saveth', 'saviour', 'deliver', 'delivered', 'delivereth', 'deliverance'],
};

// Reverse index word -> theme key, built once. If the same word were listed under
// two themes, the FIRST theme in THEMES order wins (stable, legible color code).
const WORD_TO_THEME = (() => {
  const map = {};
  const order = THEMES.map((t) => t.key);
  const keys = Object.keys(THEME_WORDS).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  for (const key of keys) {
    for (const w of THEME_WORDS[key]) {
      if (!(w in map)) map[w] = key;
    }
  }
  return map;
})();

// The word-only matcher. Apostrophes stay inside a token (KJV has none in these
// words, but this keeps "God's" from splitting oddly); everything else is a break.
const WORD_RE = /[A-Za-z']+/g;

// Scan a verse's text and return the theme spans to color: an array of
// { start, end, style, theme } — the SAME { start, end, style } shape the reader
// feeds to segmentsForVerse, plus the theme key for legend/testing. Pure.
export function scanThemeSpans(text) {
  const str = String(text == null ? '' : text);
  if (!str) return [];
  const spans = [];
  WORD_RE.lastIndex = 0;
  for (let m = WORD_RE.exec(str); m !== null; m = WORD_RE.exec(str)) {
    const theme = WORD_TO_THEME[m[0].toLowerCase()];
    if (theme) {
      const style = themeMarkerStyle(theme);
      if (style && style !== 'none') {
        spans.push({ start: m.index, end: m.index + m[0].length, style, theme });
      }
    }
  }
  return spans;
}

// Which distinct themes actually appear in a stretch of text (the live legend for
// what the reader is looking at). Returns theme keys in THEMES order.
export function themesPresent(text) {
  const hit = new Set(scanThemeSpans(text).map((s) => s.theme));
  return THEMES.map((t) => t.key).filter((k) => hit.has(k));
}
