import { describe, it, expect } from 'vitest';
import {
  STRONGS_LICENSE, buildStrongsIndex, strongsForRef, strongsLexicon,
  versesForStrongs, strongsCoverage,
} from '../lib/scripture-strongs.js';

// A small synthetic clarifications map so the derived-index behavior is asserted
// independent of how many seed verses study-edition currently ships.
const FIXTURE = {
  'John 3:16': {
    wordStudy: [
      { word: 'loved', original: 'ἠγάπησεν', translit: 'ēgapēsen', strongs: 'G25', gloss: 'agapaō — self-giving love', note: 'acts and gives' },
      { word: 'world', original: 'κόσμον', translit: 'kosmon', strongs: 'G2889', gloss: 'kosmos — the ordered world' },
    ],
  },
  '1 John 4:19': {
    wordStudy: [
      { word: 'love', original: 'ἀγαπῶμεν', translit: 'agapōmen', strongs: 'G25', gloss: 'agapaō — to love' },
    ],
  },
  'Plain Only 1:1': { plain: 'no word study here' },
};

describe('scripture-strongs — derived public-domain concordance', () => {
  it('license is public domain (Strong\'s 1890)', () => {
    expect(STRONGS_LICENSE.license).toBe('Public Domain');
    expect(STRONGS_LICENSE.work).toContain('Strong');
  });

  it('builds a lexicon + reverse occurrence index from word-study data', () => {
    const { lexicon, occurrences, byRef } = buildStrongsIndex(FIXTURE);
    expect(lexicon.G25.translit).toBe('ēgapēsen');
    expect(byRef['John 3:16'].length).toBe(2);
    expect(occurrences.G25.map((o) => o.ref).sort()).toEqual(['1 John 4:19', 'John 3:16']);
  });

  it('versesForStrongs is the concordance link — a word shared across verses', () => {
    const verses = versesForStrongs('G25', FIXTURE).map((v) => v.ref);
    expect(verses).toContain('John 3:16');
    expect(verses).toContain('1 John 4:19');
  });

  it('strongsForRef returns the tagged words for a reference', () => {
    expect(strongsForRef('John 3:16', FIXTURE).map((w) => w.strongs)).toEqual(['G25', 'G2889']);
    expect(strongsForRef('Plain Only 1:1', FIXTURE)).toEqual([]);
  });

  it('strongsLexicon resolves a number to its gloss, null when untagged', () => {
    expect(strongsLexicon('G2889', FIXTURE).gloss).toContain('kosmos');
    expect(strongsLexicon('G9999', FIXTURE)).toBe(null);
  });

  it('coverage counts distinct numbers and multi-verse words', () => {
    const cov = strongsCoverage(FIXTURE);
    expect(cov.distinctStrongs).toBe(2);
    expect(cov.multiVerse).toBe(1); // G25 appears in two verses
  });

  it('derives from the LIVE study-edition data without throwing', () => {
    // The real CLARIFICATIONS seed must produce a usable index (John 3:16 G25 is shipped).
    expect(strongsForRef('John 3:16').some((w) => w.strongs === 'G25')).toBe(true);
  });
});
