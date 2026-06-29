// =============================================================================
// games/scripture-link.js — resolve a game's Scripture REFERENCE to verbatim text
// =============================================================================
// CLAUDE.md / DR-0076 Verification Doctrine: Scripture is never typed from
// memory. The game content carries only a canonical REFERENCE string (e.g.
// 'Proverbs 3:5-6'); the actual verse text comes from lib/scripture-kjv.js,
// which was fetched verbatim from a public-domain KJV source. This helper is the
// one seam between the two, so a game module can name a verse without ever
// reproducing (and risking mistyping) its words.
//
// If a reference is not in the verified set, `text` is null and the UI shows the
// reference alone — an honest "look it up" rather than a fabricated quote.
import { KJV } from '../scripture-kjv.js';

// Normalize spacing/dashes so 'Proverbs 3:5-6' and 'Proverbs 3:5–6' both match.
function normRef(ref) {
  return String(ref || '').replace(/–|—/g, '-').replace(/\s+/g, ' ').trim();
}

// { ref } -> { ref, text|null, translation }. Accepts a bare string or a
// { ref } object so spaces/cards can carry `scripture: { ref: '...' }`.
export function resolveScripture(scripture) {
  if (!scripture) return null;
  const ref = normRef(typeof scripture === 'string' ? scripture : scripture.ref);
  if (!ref) return null;
  const text = KJV[ref] || null;
  return { ref, text, translation: 'KJV' };
}

// True only when the verified set actually contains the verse text — used by the
// test that guards every reference the game ships against the real KJV source.
export function hasVerse(ref) {
  return Boolean(KJV[normRef(ref)]);
}
