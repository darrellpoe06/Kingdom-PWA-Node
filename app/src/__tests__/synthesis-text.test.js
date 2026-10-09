// @vitest-environment node
//
// synthesis-text — the voice is handed short, closed sentences (DR-0851).
//
// Darrell 2026-10-09, two photographs of the NAS voice slurring the same
// pieces of L227 every time: "just slurred sounds.... not clear anymore...
// nothing is skipped". Both pieces are one clause run of about 30 words with
// no full stop inside, which Piper runs as ONE inference. These tests are
// proven-to-catch on those exact pieces: before shaping, 29 and 30 words in
// one sentence; after, no sentence over MAX_SENTENCE_WORDS and every one
// closed with a stop. Numbers, references and short pieces are untouched.
import { describe, it, expect } from 'vitest';
import { forSynthesis, synthesisSentences, longestSentenceWords, MAX_SENTENCE_WORDS, MIN_CUT_WORDS } from '../lib/synthesis-text.js';
import { toSpokenForm } from '../lib/speech-text.js';
import { chunkForClips } from '../lib/clip-queue.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const PIECE_1 = 'Rendered for meaning: reading the Word for the Spirit; doing the Word for competent conversations and learning skills; and never reading just to say I got you,';
const PIECE_2 = "(Matthew 7:21) A reading done to win produces a person who can quote and cannot follow, and that is not a small defect; by the Lord's words it can be the whole defect.";

const words = (s) => s.split(' ').length;

describe('the two photographed pieces', () => {
  it('reach the voice as one long sentence today (the defect, measured)', () => {
    expect(words(PIECE_1)).toBeGreaterThanOrEqual(25);
    expect(words(PIECE_2)).toBeGreaterThanOrEqual(25);
    expect(PIECE_1).not.toMatch(/[.!?]/);
    expect((PIECE_2.match(/[.!?]/g) || []).length).toBe(1);
  });
  it('are handed to the voice as short, closed sentences', () => {
    for (const p of [PIECE_1, PIECE_2]) {
      const s = synthesisSentences(toSpokenForm(p));
      expect(s.length).toBeGreaterThanOrEqual(3);
      for (const x of s) {
        expect(words(x), x).toBeLessThanOrEqual(MAX_SENTENCE_WORDS);
        expect(x, x).toMatch(/[.!?]["'’”)\]]*$/);
      }
    }
    expect(synthesisSentences(PIECE_1)).toEqual([
      'Rendered for meaning.',
      'reading the Word for the Spirit.',
      'doing the Word for competent conversations and learning skills.',
      'and never reading just to say I got you.',
    ]);
  });
  it('loses no word: joining the sentences gives back every word of the piece', () => {
    for (const p of [PIECE_1, PIECE_2]) {
      const strip = (t) => t.replace(/[.,;:!?"'’”()]/g, ' ').replace(/\s+/g, ' ').trim();
      expect(strip(forSynthesis(p))).toBe(strip(p));
    }
  });
});

describe('what is NOT cut', () => {
  it('a short closed sentence is unchanged', () => {
    expect(forSynthesis('So then every one of us shall give account of himself to God.')).toBe('So then every one of us shall give account of himself to God.');
  });
  it('a piece that ends on a comma or nothing is closed with a stop', () => {
    expect(forSynthesis('but reading to become a better person')).toBe('but reading to become a better person.');
    expect(forSynthesis('and then doing His Way, not our ways,')).toBe('and then doing His Way, not our ways.');
    expect(forSynthesis('he said, "Where art thou?"')).toBe('he said, "Where art thou?"');
  });
  it('numbers keep their shape: a thousands comma, a clock colon, a spoken reference', () => {
    expect(forSynthesis('It cost $2,450 at 3:16 pm.')).toBe('It cost $2,450 at 3:16 pm.');
    expect(forSynthesis(toSpokenForm('"For God so loved the world" (John 3:16)'))).toBe('"For God so loved the world" (John chapter 3 verse 16).');
  });
  it('a long sentence with no safe cut is handed whole', () => {
    const run = Array.from({ length: 25 }, (_, i) => `w${i}`).join(' ');
    expect(forSynthesis(run)).toBe(`${run}.`);
  });
  it('a long sentence is cut at its last comma inside the window, never shorter than the minimum', () => {
    const s = 'One two three four five six seven eight nine ten eleven twelve, thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two.';
    expect(synthesisSentences(s)).toEqual([
      'One two three four five six seven eight nine ten eleven twelve.',
      'thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two.',
    ]);
  });
});

describe('across the catalog the voice is never handed a long sentence where a cut was safe', () => {
  it('every piece of every Living Lesson, in spoken form, stays within the cap or has no safe cut', () => {
    let pieces = 0; let over = 0; const examples = [];
    for (const L of LIVING_LESSONS_MODULES) {
      for (const c of chunkForClips(L.lesson)) {
        pieces += 1;
        const n = longestSentenceWords(toSpokenForm(c.text));
        if (n > MAX_SENTENCE_WORDS) {
          // allowed only when the long sentence carries no comma or joiner to cut at
          // past the minimum head (a cut is never made shorter than MIN_CUT_WORDS)
          const long = synthesisSentences(toSpokenForm(c.text)).find((s) => s.split(' ').length > MAX_SENTENCE_WORDS);
          const w = long.split(' ');
          const cuttable = w.slice(MIN_CUT_WORDS - 1, -1).some((x) => /,["'’”)]*$/.test(x))
            || w.slice(MIN_CUT_WORDS, -1).some((x) => /^(and|but|so|because|which|while|then)$/i.test(x));
          if (cuttable) { over += 1; if (examples.length < 3) examples.push(`${L.id.slice(0, 6)}: ${long.slice(0, 90)}`); }
        }
      }
    }
    expect(pieces).toBeGreaterThan(5000);
    expect(over, examples.join('\n')).toBe(0);
  });
});
