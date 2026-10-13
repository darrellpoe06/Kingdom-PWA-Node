// A LESSON REOPENS AT THE SENTENCE, NOT AT THE TOP OF THE PARAGRAPH.
// =============================================================================
// Darrell 2026-09-14: "Also need the lessons to begin exactly where they left
// off at least the sentence...."
//
// The place record went as fine as `step` — one PARAGRAPH. So reopening a lesson
// restarted the paragraph you were in the middle of, and on a long teaching
// paragraph read aloud that is most of a minute of hearing what you already
// heard. "At least the sentence" is the floor he set.
//
// WHY A BARE INDEX WOULD HAVE BEEN THE WRONG FIX, and why this file spends most
// of its length on that: lessons RE-PACE. The same lesson renders differently by
// age band and by time-fit (reflowArcMinutes), so sentence 14 of one rendering
// is a different sentence in another. Storing 14 alone would resume in the wrong
// place SILENTLY — and a reader cannot tell a wrong resume from a right one,
// which makes it the worst available failure for a place-keeper. So a short
// non-reversible fingerprint rides with the index, and the fingerprint wins.
import { describe, it, expect } from 'vitest';
import { sentenceKeyOf, findSentence, recordPlace, getPlace } from '../lib/learn-resume.js';

const mem = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
};

const PARA = [
  'The tongue is a little member and boasteth great things.',
  'Behold, how great a matter a little fire kindleth.',
  'Therewith bless we God, even the Father.',
];

describe('sentenceKeyOf — a stable, non-reversible fingerprint', () => {
  it('is stable across calls', () => {
    expect(sentenceKeyOf(PARA[0])).toBe(sentenceKeyOf(PARA[0]));
  });

  it('ignores whitespace and curly-quote rendering differences', () => {
    // The SAME sentence can arrive with a curly apostrophe on one surface and a
    // straight one on another; that must not lose the reader's place.
    expect(sentenceKeyOf("it is the reader’s place")).toBe(sentenceKeyOf("it is the reader's place"));
    expect(sentenceKeyOf('  a   b  ')).toBe(sentenceKeyOf('a b'));
  });

  it('separates different sentences', () => {
    expect(sentenceKeyOf(PARA[0])).not.toBe(sentenceKeyOf(PARA[1]));
  });

  it('stores no words — the key cannot contain the sentence', () => {
    // The privacy bright line in learn-resume.js: indexes and opaque keys only.
    const k = sentenceKeyOf(PARA[0]);
    expect(k).toMatch(/^[0-9a-z]+$/);
    expect(k.length).toBeLessThan(10);
    expect(k).not.toContain('tongue');
  });

  it('is total on junk', () => {
    for (const bad of [null, undefined, '', '   ', 42, {}]) {
      expect(typeof sentenceKeyOf(bad)).toBe('string');
    }
  });
});

describe('findSentence — exact, then follow the sentence, then admit it is gone', () => {
  it('returns the index when it still holds the same sentence', () => {
    const r = findSentence(PARA, { sentence: 1, sentenceKey: sentenceKeyOf(PARA[1]) });
    expect(r).toEqual({ index: 1, how: 'exact' });
  });

  it('FOLLOWS THE SENTENCE when the lesson re-paced and it moved', () => {
    // This is the case a bare index gets wrong. The reader stopped at
    // "Behold, how great a matter..."; the lesson re-rendered with two
    // sentences inserted ahead of it. The number is stale; the sentence is not.
    const repaced = ['A new opening line.', 'Another new line.', ...PARA];
    const r = findSentence(repaced, { sentence: 1, sentenceKey: sentenceKeyOf(PARA[1]) });
    expect(r.how).toBe('moved');
    expect(repaced[r.index]).toBe(PARA[1]);
  });

  it('ADMITS IT when the sentence is no longer in the lesson', () => {
    // An edited lesson. Guessing here would resume somewhere plausible and
    // wrong, so it reports -1 and the caller falls back to the step.
    const r = findSentence(PARA, { sentence: 1, sentenceKey: sentenceKeyOf('a sentence that was cut') });
    expect(r).toEqual({ index: -1, how: 'gone' });
  });

  it('trusts a bare in-range index only when no fingerprint was stored', () => {
    // A place written before this shipped. Honoured, but labelled.
    expect(findSentence(PARA, { sentence: 2 })).toEqual({ index: 2, how: 'index-only' });
  });

  it('never extrapolates an out-of-range index', () => {
    expect(findSentence(PARA, { sentence: 99 }).index).toBe(-1);
  });

  it('is total on degenerate input', () => {
    expect(findSentence([], { sentence: 0 }).index).toBe(-1);
    expect(findSentence(null, null).index).toBe(-1);
    expect(findSentence(PARA, null).index).toBe(-1);
  });
});

describe('the record carries the sentence, and drops it when the reader moves on', () => {
  it('round-trips the sentence and its key', () => {
    const storage = mem();
    recordPlace({ courseKey: 'c', lessonId: 'll150', step: 3, sentence: 2, sentenceKey: 'abc123' }, { storage });
    const p = getPlace({ storage });
    expect(p.sentence).toBe(2);
    expect(p.sentenceKey).toBe('abc123');
  });

  it('A STEP MOVE CLEARS THE SENTENCE — a stale fingerprint must not survive', () => {
    // The trap: the reader walks to the next paragraph. If the previous
    // paragraph's sentence key stayed, resume would jump BACK into it.
    const storage = mem();
    recordPlace({ courseKey: 'c', lessonId: 'll150', step: 3, sentence: 2, sentenceKey: 'abc123' }, { storage });
    recordPlace({ courseKey: 'c', lessonId: 'll150', step: 4 }, { storage });
    const p = getPlace({ storage });
    expect(p.step).toBe(4);
    expect(p.sentence).toBe(0);
    expect(p.sentenceKey).toBe('');
  });

  it('a DIFFERENT lesson resets the sentence too', () => {
    const storage = mem();
    recordPlace({ courseKey: 'c', lessonId: 'll150', step: 3, sentence: 2, sentenceKey: 'abc123' }, { storage });
    recordPlace({ courseKey: 'c', lessonId: 'll151' }, { storage });
    const p = getPlace({ storage });
    expect(p.lessonId).toBe('ll151');
    expect(p.sentence).toBe(0);
    expect(p.sentenceKey).toBe('');
  });

  it('keeps the sentence when only the sentence advances', () => {
    const storage = mem();
    recordPlace({ courseKey: 'c', lessonId: 'll150', step: 3, sentence: 2, sentenceKey: 'aaa' }, { storage });
    recordPlace({ courseKey: 'c', lessonId: 'll150', sentence: 5, sentenceKey: 'bbb' }, { storage });
    const p = getPlace({ storage });
    expect(p.step).toBe(3);
    expect(p.sentence).toBe(5);
    expect(p.sentenceKey).toBe('bbb');
  });

  it('an oversized key is truncated rather than trusted', () => {
    const storage = mem();
    recordPlace({ courseKey: 'c', lessonId: 'll150', sentenceKey: 'x'.repeat(500) }, { storage });
    expect(getPlace({ storage }).sentenceKey.length).toBeLessThanOrEqual(16);
  });
});

describe('the reader is actually wired to write and restore the sentence', () => {
  // Source-pinned, because the CORE above is pure and would pass happily while
  // nothing called it — which is exactly the inert-but-correct class that bit
  // this repo three times in one night (DR-0381, DR-0393, DR-0401). A render
  // test would need the whole TTS engine and a live DOM; what can regress here
  // is the wiring, so the wiring is what is pinned.
  const src = () => {
    const { readFileSync } = require('node:fs');
    const { join, dirname } = require('node:path');
    const { fileURLToPath } = require('node:url');
    return readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '..', 'components', 'TTSControl.jsx'),
      'utf8',
    );
  };

  it('writes the sentence as it reads, from the per-sentence effect', () => {
    expect(src()).toMatch(/rememberSentence\(st\.base \+ segmentIndex, seg\.text\)/);
  });

  it('stores an ABSOLUTE index, not one relative to where this run began', () => {
    // A run started mid-lesson has base > 0. Storing the relative index would
    // resume earlier and earlier each time the reader resumed.
    const s = src();
    expect(s).toMatch(/st\.base \+ segmentIndex/);
    expect(s).not.toMatch(/recordPlace\(\{ sentence: segmentIndex/);
  });

  it('begins a lesson read at the saved sentence', () => {
    const s = src();
    expect(s).toMatch(/savedStartIndex\(follow\.segments\)/);
    expect(s).toMatch(/read\(follow\.text\.slice\(follow\.segments\[at\]\.start\)\)/);
  });

  it('does NOT resume a piece the run advanced into on its own', () => {
    // `continuing` means the reader moved to the NEXT lesson by itself; that
    // lesson starts at its top, not at some place in a different lesson.
    expect(src()).toMatch(/continuing \? -1 : savedStartIndex/);
  });

  it('only writes when the reading being spoken IS the lesson the place names', () => {
    // Without this, reading a Bible chapter would stamp a sentence onto
    // whatever lesson was last opened.
    expect(src()).toMatch(/t\.owner !== place\.lessonId\) return/);
  });

  it('merges the sentence onto the stored lesson rather than re-declaring it', () => {
    // recordPlace resets stage/step when a patch names a DIFFERENT lesson, so
    // passing lessonId here would wipe the paragraph the learner had reached.
    const s = src();
    expect(s).toMatch(/recordPlace\(\{ sentence: absIndex, sentenceKey: sentenceKeyOf\(text\) \}\)/);
  });
});
