// @vitest-environment node
// =============================================================================
// A WORD TYPED TWICE — the defect no check in the house was watching for.
// =============================================================================
// Found 2026-09-18 while re-authoring ll97 for band differentiation: its teen
// band shipped "worth up to roughly roughly 1.69 million dollars, averaging
// about about 338,000 dollars a year against the previous figure of roughly
// roughly 127,000 dollars". Three doubled words in one sentence, in front of a
// reader, on a lesson about keeping a just weight for words.
//
// MEASURED at the moment of the find: exactly 3 hits across the whole corpus,
// all three in that one sentence. So the corpus was clean apart from a single
// editing slip — which is precisely the condition in which a gate is cheap to
// install and worth having, because the debt is zero and can be held there.
//
// This reads OUR PROSE ONLY. Quotations are stripped first, because the KJV
// legitimately repeats a word across a clause boundary ("Lord, Lord"; "Verily,
// verily") and a gate that flagged His words would be worse than no gate.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

/** Our authored prose: quotations replaced by a SENTINEL, not by a space.
 *
 *  Replacing a quotation with whitespace was the first attempt and it reported
 *  37 offenders across the corpus, every one of them a false positive of the
 *  same shape: `it pairs with "A" and "B" and its companion is ...` collapses
 *  to `... and   and its ...` once the titles are blanked, and the detector
 *  then reads two separate `and`s as one doubled word. The sentinel is not
 *  whitespace, so it breaks the adjacency the pattern requires and the words
 *  either side of a removed quotation can never pair. */
const ourProse = (s) => String(s || '').replace(/"[^"]*"/g, ' \u00b6 ');

/** A word repeated immediately, case-insensitively, across ordinary spacing. */
const DOUBLED = /\b([A-Za-z]{2,})\s+\1\b/gi;

/** Legitimate English doubles that are not slips. Kept short, each with a
 *  reason, because a list like this is how a gate quietly stops meaning
 *  anything. Every entry below was found in the corpus and READ before it was
 *  admitted — none is here to make a failure go away.
 *    had had / that that — ordinary English.
 *    good good           — "what makes the good good" is L174's own thesis,
 *                          a predicate adjective after a nominalised one.
 *    legal legal         — ll55's "You do not need to out-legal legal", where
 *                          the word boundary splits a deliberate compound. */
const ALLOWED = new Set(['had had', 'that that', 'good good', 'legal legal']);

const hits = (text) => {
  const out = [];
  const prose = ourProse(text);
  DOUBLED.lastIndex = 0;
  let m;
  while ((m = DOUBLED.exec(prose))) {
    if (ALLOWED.has(m[0].toLowerCase().replace(/\s+/g, ' '))) continue;
    out.push(m[0]);
  }
  return out;
};

const READER_FIELDS = (x) => [
  x.lesson, x.bigIdea, x.inApp, x.anchor?.theme,
  ...Object.values(x.levels || {}),
  ...(x.benefits || []),
  ...(x.quiz?.questions || []).flatMap((q) => [q.q, q.explain, ...(q.options || [])]),
  ...(x.facilitator?.talkingPoints || []),
];

describe('the detector sees a doubled word, and never sees the Word', () => {
  it('catches the exact shape ll97 shipped (proven-to-catch)', () => {
    expect(hits('worth up to roughly roughly 1.69 million dollars')).toEqual(['roughly roughly']);
    expect(hits('averaging about about 338,000 dollars a year')).toEqual(['about about']);
  });

  it('catches it across a line break or double space', () => {
    expect(hits('the the  thing')).toHaveLength(1);
    expect(hits('a sentence and\nand another')).toEqual(['and\nand']);
  });

  it('never flags a repetition INSIDE a quotation — the KJV repeats on purpose', () => {
    expect(hits('He asks "why call ye me, Lord, Lord, and do not the things which I say?" plainly')).toEqual([]);
    expect(hits('"Verily, verily, I say unto thee, Except a man be born again"')).toEqual([]);
  });

  it('never pairs the words either side of a removed quotation (proven-to-catch)', () => {
    // The exact shape that produced 37 false positives before the sentinel:
    // two real `and`s separated only by a quoted title.
    expect(hits('it pairs with the Living Lessons "One" and "Two" and its companion is the next one')).toEqual([]);
    expect(hits('do not ask "Is this convenient?" Ask "Is this right?"')).toEqual([]);
    // And the sentinel must not blind it to a genuine double beside a quote.
    expect(hits('He said "a just weight" and and then stopped')).toEqual(['and and']);
  });

  it('does not flag a word merely appearing twice in a sentence', () => {
    expect(hits('the weight of the matter')).toEqual([]);
  });

  it('does not flag the legitimate English doubles', () => {
    expect(hits('the report that that committee filed')).toEqual([]);
    expect(hits('he had had enough')).toEqual([]);
    expect(hits('your answer about what makes the good good, and it is not what people assume')).toEqual([]);
  });

  it('keeps its sensitivity after a hyphenated word, and names the one exception', () => {
    // A hyphen rule was tried first and dropped. "out-legal legal" (deliberate)
    // and "well-made made" (a slip) are structurally identical, so no rule can
    // separate them — skipping on the hyphen would have made the detector blind
    // to a whole class of real typos to spare one real phrase. The phrase is in
    // ALLOWED instead, where a reader can see it and argue with it.
    expect(hits('a well-made made thing')).toEqual(['made made']);
    expect(hits('He tried to out-argue argue with him')).toEqual(['argue argue']);
    expect(hits('You do not need to out-legal legal.')).toEqual([]);
  });
});

describe('the live corpus carries none, and may not start', () => {
  it('no reader-facing field in any lesson types a word twice', () => {
    const offenders = [];
    for (const x of LIVING_LESSONS_MODULES) {
      for (const field of READER_FIELDS(x)) {
        for (const h of hits(field)) offenders.push(`${x.id.slice(0, 34)}: "${h}"`);
      }
    }
    // Zero is the recorded state (measured 2026-09-18, after ll97's three were
    // repaired). There is deliberately NO allowance list: an allowance nobody
    // lowers becomes an exemption, and at zero there is nothing to allow.
    expect(offenders, offenders.slice(0, 12).join('\n')).toEqual([]);
  });
});
