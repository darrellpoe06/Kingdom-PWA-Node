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
      'Reading the Word for the Spirit.',
      'Doing the Word for competent conversations and learning skills.',
      'And never reading just to say I got you.',
    ]);
  });
  it('loses no word: joining the sentences gives back every word of the piece', () => {
    for (const p of [PIECE_1, PIECE_2]) {
      const strip = (t) => t.replace(/[.,;:!?"'’”()]/g, ' ').replace(/\s+/g, ' ').trim();
      expect(strip(forSynthesis(p)).toLowerCase()).toBe(strip(p).toLowerCase()); // every sentence now starts with a capital (DR-1131)
    }
  });
});

describe('what is NOT cut', () => {
  it('a short closed sentence is unchanged', () => {
    expect(forSynthesis('So then every one of us shall give account of himself to God.')).toBe('So then every one of us shall give account of himself to God.');
  });
  it('a piece that ends on a comma or nothing is closed with a stop', () => {
    expect(forSynthesis('but reading to become a better person')).toBe('But reading to become a better person.');
    expect(forSynthesis('and then doing His Way, not our ways,')).toBe('And then doing His Way, not our ways.');
    expect(forSynthesis('he said, "Where art thou?"')).toBe('He said, "Where art thou?"');
  });
  it('numbers keep their shape: a thousands comma, a clock colon, a spoken reference', () => {
    expect(forSynthesis('It cost $2,450 at 3:16 pm.')).toBe('It cost $2,450 at 3:16 pm.');
    expect(forSynthesis(toSpokenForm('"For God so loved the world" (John 3:16)'))).toBe('"For God so loved the world" (John chapter 3 verse 16).');
  });
  it('a long sentence with no safe cut is handed whole', () => {
    const run = Array.from({ length: 25 }, (_, i) => `w${i}`).join(' ');
    expect(forSynthesis(run)).toBe(`W${run.slice(1)}.`); // the first letter is a capital now (DR-1131)
  });
  it('a long sentence is cut at its last comma inside the window, never shorter than the minimum', () => {
    const s = 'One two three four five six seven eight nine ten eleven twelve, thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two.';
    expect(synthesisSentences(s)).toEqual([
      'One two three four five six seven eight nine ten eleven twelve.',
      'Thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two.',
    ]);
  });
});

// WHERE THERE WAS NO COMMA AND NO JOINER (DR-1131). Darrell 2026-10-20, a
// Living Lessons week on the phone: "still mumbling in sections". The lit piece
// in his screenshot opened on a quotation mark and a citation and ran 23 words
// to the voice; the catalog's longest pieces were quotations with a citation in
// the middle, 30 to 37 words with no stop. An aside in parentheses is now its
// own sentence, a spaced hyphen is a breath, and a subordinator is the last cut.
describe('an aside in parentheses, a spaced hyphen, and a subordinator (DR-1131)', () => {
  const LIT = '" (Leviticus 19:34) This week teaches what an education IS before it argues about how long one should be - and names plainly that we read a digest, not one full article.';
  it('the lit piece from the 2026-10-20 screenshot: the citation is its own sentence, the lone quotation mark is not spoken, the hyphen is a breath', () => {
    expect(synthesisSentences(toSpokenForm(LIT))).toEqual([
      'Leviticus chapter 19 verse 34.',
      'This week teaches what an education is before it argues about how long one should be.',
      'And names plainly that we read a digest, not one full article.',
    ]);
  });
  it('a citation in the middle of a quotation that runs on is spoken between two stops, and the tail is cut on its own', () => {
    const run = 'and see that the LORD is good" (Psalm 34:8) together with a readiness always "to give an answer to every man that asketh you a reason of the hope that is in you with meekness.';
    expect(synthesisSentences(toSpokenForm(run))).toEqual([
      'And see that the LORD is good".',
      'Psalm 34 verse 8.',
      'Together with a readiness always "to give an answer to every man.',
      'That asketh you a reason of the hope that is in you with meekness.',
    ]);
  });
  it('the aside itself is cut when it is long, and a clause mark that joined it to its neighbour is not spoken as a dangling comma', () => {
    const s = 'who already holds the morning ("he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him", Hebrews 11:6).';
    const out = synthesisSentences(toSpokenForm(s));
    expect(out[0]).toBe('Who already holds the morning.');
    expect(out.every((x) => x.split(' ').length <= MAX_SENTENCE_WORDS), out.join(' | ')).toBe(true);
    expect(synthesisSentences(toSpokenForm('" (Matthew 3:17) - and the very next line is "Then was Jesus led up of the Spirit into the wilderness to be tempted of the devil.')))
      .toEqual(['Matthew chapter 3 verse 17.', 'And the very next line is "Then was Jesus led up of the Spirit into the wilderness to be tempted of the devil.']);
  });
  it('a short sentence with an aside is left exactly as it was (the cut is for long sentences only)', () => {
    expect(forSynthesis(toSpokenForm('"For God so loved the world" (John 3:16)'))).toBe('"For God so loved the world" (John chapter 3 verse 16).');
  });
  it('a subordinator is the cut of last resort, after a comma and a joiner, inside the window first', () => {
    const s = 'Anyone teaching this material who turns a depression into a demon to be shouted at has departed from how He handled the most successful prophet in the book.';
    expect(synthesisSentences(s)[0]).toBe('Anyone teaching this material.');
    const comma = 'Anyone teaching this material, who turns a depression into a demon to be shouted at has departed from how He handled the most successful prophet in the book.';
    expect(synthesisSentences(comma)[0]).toBe('Anyone teaching this material.');
    expect(synthesisSentences(comma)[1]).toMatch(/^Who turns/);
  });
  it('PROVEN TO CATCH: without the aside and subordinator cuts the lit piece reached the voice as one 23-word sentence', () => {
    const before = toSpokenForm(LIT).replace(/\s*\([^)]*\)\s*/, ' ');
    expect(before.split(' ').length).toBeGreaterThan(MAX_SENTENCE_WORDS);
    expect(synthesisSentences(toSpokenForm(LIT)).every((x) => x.split(' ').length <= MAX_SENTENCE_WORDS)).toBe(true);
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
