// =============================================================================
// scripture-strongs — a Strong's concordance INDEX, derived from the verified
// word-study data the Study Edition already carries. (Darrell 2026-06-25.)
// =============================================================================
// The other half of the Logos-style word study: original-language word links by
// Strong's number. Strong's Exhaustive Concordance (James Strong, 1890) is PUBLIC
// DOMAIN, so the numbering + glosses are free to ship.
//
// REUSE, DON'T FORK (DR-0076 + the shared-primitives standard): the per-verse
// word-study entries already live, verified, in study-edition.js CLARIFICATIONS
// (`wordStudy: [{ word, original, translit, strongs, gloss, note }]`). This module
// does NOT re-author that data — it builds a reverse index OVER it: number -> the
// lexicon entry, and number -> the verses where that word appears. So the
// concordance is DERIVED from real data (no fabrication), and it GROWS automatically
// every time a clarification adds a word study. Pure + testable.
//
// "Where else does agapaō appear?" is answered from the corpus we have actually
// tagged — honestly bounded (versesForStrongs is "in our tagged set", not "in all
// of Scripture"). The full tagged layer (STEPBible TAGNT/TAHOT, CC BY 4.0) drops in
// later behind this same interface.
// =============================================================================
import { CLARIFICATIONS } from './study-edition.js';
import { normalizeRef } from './scriptures.js';

export const STRONGS_LICENSE = Object.freeze({
  work: "Strong's Exhaustive Concordance of the Bible (James Strong, 1890)",
  license: 'Public Domain',
  note: 'Strong\'s numbering + base glosses are public domain. Per-verse tagging here '
    + 'is derived from the Study Edition word study; the full tagged layer (STEPBible '
    + 'TAGNT/TAHOT, CC BY 4.0) extends it behind the same interface.',
});

const arr = (v) => (Array.isArray(v) ? v : []);

// Build the index from a clarifications map (defaults to the live one). Pure: same
// input -> same output, no I/O. Returns:
//   { lexicon: { [strongs]: { strongs, word, original, translit, gloss } },
//     occurrences: { [strongs]: [{ ref, word, note }] },
//     byRef: { [normalizedRef]: [wordStudy entry...] } }
export function buildStrongsIndex(clarifications = CLARIFICATIONS) {
  const lexicon = {};
  const occurrences = {};
  const byRef = {};
  const src = clarifications && typeof clarifications === 'object' ? clarifications : {};
  for (const rawRef of Object.keys(src)) {
    const ref = normalizeRef(rawRef);
    const ws = arr(src[rawRef] && src[rawRef].wordStudy).filter((w) => w && w.strongs);
    if (ws.length) byRef[ref] = ws.slice();
    for (const w of ws) {
      const num = String(w.strongs).trim();
      if (!num) continue;
      if (!lexicon[num]) {
        lexicon[num] = {
          strongs: num,
          word: w.word || '',
          original: w.original || '',
          translit: w.translit || '',
          gloss: w.gloss || '',
        };
      }
      if (!occurrences[num]) occurrences[num] = [];
      // de-dupe (a number tagged twice in one verse counts once per verse)
      if (!occurrences[num].some((o) => o.ref === ref)) {
        occurrences[num].push({ ref, word: w.word || '', note: w.note || '' });
      }
    }
  }
  return { lexicon, occurrences, byRef };
}

// The word-study entries tagged for a reference ([] if none).
export function strongsForRef(ref, clarifications = CLARIFICATIONS) {
  const { byRef } = buildStrongsIndex(clarifications);
  return byRef[normalizeRef(ref)] || [];
}

// The lexicon entry for a Strong's number (null if not in our tagged set).
export function strongsLexicon(strongsNum, clarifications = CLARIFICATIONS) {
  const { lexicon } = buildStrongsIndex(clarifications);
  return lexicon[String(strongsNum || '').trim()] || null;
}

// The verses (in our tagged set) where a Strong's number appears — the concordance
// link. Honestly bounded to what we've tagged; never claims to be all of Scripture.
export function versesForStrongs(strongsNum, clarifications = CLARIFICATIONS) {
  const { occurrences } = buildStrongsIndex(clarifications);
  return occurrences[String(strongsNum || '').trim()] || [];
}

// A small honest readout of the tagged corpus.
export function strongsCoverage(clarifications = CLARIFICATIONS) {
  const { lexicon, occurrences, byRef } = buildStrongsIndex(clarifications);
  const numbers = Object.keys(lexicon);
  return {
    taggedRefs: Object.keys(byRef).length,
    distinctStrongs: numbers.length,
    multiVerse: numbers.filter((n) => (occurrences[n] || []).length > 1).length,
  };
}
