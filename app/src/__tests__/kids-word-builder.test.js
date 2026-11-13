// @vitest-environment node
// =============================================================================
// Word Builder — every word the child spells is one of the verse's own words,
// the week's seed replays the same shuffle, a scramble is never the answer,
// the hint blanks exactly one token, and a verse that did not load has no
// words (DR-0076: nothing typed in, nothing painted).
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  lettersOf,
  buildableWords,
  seededShuffle,
  scrambleLetters,
  hintTokens,
  placedSoFarIsRight,
  spelled,
  nextLetter,
  starsFor,
  phrasesOf,
  shufflePhrases,
  inOrder,
  longestWord,
} from '../lib/kids/word-builder.js';

const PSALM_23_1 = 'The LORD is my shepherd; I shall not want.';
const PHIL_4_13 = 'I can do all things through Christ which strengtheneth me.';

describe('the words come from the verse and nowhere else', () => {
  it('lists every word of four or more letters, once, in verse order, with its token index', () => {
    const words = buildableWords(PSALM_23_1);
    expect(words.map((w) => w.word)).toEqual(['lord', 'shepherd', 'shall', 'want']);
    expect(words.map((w) => w.index)).toEqual([1, 4, 6, 8]);
    expect(words[1].display).toBe('shepherd');
    for (const w of words) expect(PSALM_23_1.toLowerCase()).toContain(w.word);
  });
  it('a verse that did not load offers no words', () => {
    expect(buildableWords('')).toEqual([]);
    expect(buildableWords(null)).toEqual([]);
  });
  it('a repeated word is offered once', () => {
    expect(buildableWords('holy holy holy, Lord').map((w) => w.word)).toEqual(['holy', 'lord']);
  });
});

describe('the seed replays the same shuffle all week', () => {
  it('the same seed gives the same order; a different week gives a different one', () => {
    const a = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8], 202647);
    const b = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8], 202647);
    const c = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8], 202648);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(a.slice().sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
  it('a scramble holds exactly the word\'s letters and is never the word itself', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const tiles = scrambleLetters('shepherd', seed);
      expect(tiles.map((t) => t.letter).sort().join('')).toBe('deehhprs');
      expect(tiles.map((t) => t.letter).join('')).not.toBe('shepherd');
      expect(new Set(tiles.map((t) => t.id)).size).toBe(8);
    }
    // a word of one repeated letter cannot be scrambled away from itself, and says so by staying
    expect(scrambleLetters('aaa', 3).map((t) => t.letter).join('')).toBe('aaa');
    expect(scrambleLetters('', 3)).toEqual([]);
  });
});

describe('spelling a word', () => {
  it('the hint blanks exactly the word being spelled and keeps the rest of the verse whole', () => {
    const tokens = hintTokens(PSALM_23_1, 4);
    expect(tokens.filter((t) => t.blank).length).toBe(1);
    expect(tokens[4]).toEqual({ word: 'shepherd;', blank: true, answer: 'shepherd' });
    expect(tokens.map((t) => t.word).join(' ')).toBe(PSALM_23_1);
  });
  it('placed tiles are right while they are the word\'s start, and the word is spelled only when whole', () => {
    expect(placedSoFarIsRight('shepherd', [{ letter: 's' }, { letter: 'h' }])).toBe(true);
    expect(placedSoFarIsRight('shepherd', [{ letter: 's' }, { letter: 'x' }])).toBe(false);
    expect(spelled('shepherd', 'shepherd'.split(''))).toBe(true);
    expect(spelled('shepherd', 'shephe'.split(''))).toBe(false);
    expect(nextLetter('shepherd', ['s', 'h'])).toBe('e');
    expect(nextLetter('shepherd', 'shepherd'.split(''))).toBe('');
    expect(lettersOf('LORD;')).toBe('lord');
  });
  it('stars: four for no hints, one hint costs one, never below one', () => {
    expect(starsFor({ hints: 0 })).toBe(4);
    expect(starsFor({ hints: 2 })).toBe(2);
    expect(starsFor({ hints: 9 })).toBe(1);
  });
});

describe('the teens\' form: phrases in order', () => {
  it('cuts the verse at its own punctuation into phrases in order, and shuffles them out of order by the seed', () => {
    const phrases = phrasesOf(PSALM_23_1);
    expect(phrases.map((p) => p.phrase)).toEqual(['The LORD is my shepherd;', 'I shall not want.']);
    const shuffled = shufflePhrases(phrases, 7);
    expect(inOrder(shuffled)).toBe(false);
    expect(inOrder(shuffled.slice().sort((a, b) => a.order - b.order))).toBe(true);
    expect(shufflePhrases(phrases, 7)).toEqual(shufflePhrases(phrases, 7));
  });
  it('a verse with one phrase stays one phrase, and the longest word is the spelling round', () => {
    expect(phrasesOf(PHIL_4_13).length).toBe(1);
    expect(longestWord(PHIL_4_13).word).toBe('strengtheneth');
    expect(longestWord('')).toBeNull();
  });
});
