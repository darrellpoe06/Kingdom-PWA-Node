// =============================================================================
// THE READER DOES NOT STALL ON A TELEVISION
// =============================================================================
// Darrell, 2026-10-10, on the Firestick:
//
//   "Firestick reader is slow... timing seems an issue... takes long pauses
//    in-between sentences.... and can't full say the sentences without slowing
//    and pauses unnecessarily... fix it... too..."
//
// SAME CAUSE AS THE 2026-10-07 MUMBLE, DIFFERENT TRIGGER. Every clause is its
// own utterance (so a speed change can restart just the current one), and
// every utterance costs the engine an ONSET — the queue gap before it speaks.
// On a phone at 1x that gap reads as a breath between sentences. A Fire TV is
// a low-power stick running Amazon's engine, where the same gap is long
// enough to be a stall, and it falls between every CLAUSE rather than every
// sentence — so the reading limps at the one pace most people use, and the
// pauses land where nobody would breathe.
//
// The machinery to fix it already existed and was keyed to the wrong thing:
// utteranceSpan joined consecutive segments into one utterance only when the
// RATE was high. But on a television the cuts are too close together at any
// rate, because what is slow is the DEVICE, not the speech.
//
// WHAT THIS PINS:
//   * a TV spans at 1x, where it used to speak one clause at a time;
//   * a phone at 1x is UNCHANGED — one clause per utterance, so the rate
//     restart behaviour everything else depends on is untouched;
//   * the span stays clear of Chrome's long-utterance cutoff;
//   * the segments themselves never change, which is what the follow-along
//     highlight and the paragraph steps are built on;
//   * the engine reads the TV answer from the same <html data-device="tv">
//     mark that the CSS and the remote's navigation read (DR-0657).
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  utteranceSpan, segmentText, createBrowserTTS,
  RATE_SPAN_FROM, MAX_SPAN_CHARS, MAX_SPAN_SEGMENTS, TV_SPAN_CHARS,
} from '../lib/tts.js';

// Six clauses of ~70 characters — the shape a real lesson paragraph takes
// after clauseSegments has cut it where a person breathes.
const CLAUSES = [
  'And he brought him forth abroad, and said, Look now toward heaven',
  'and tell the stars, if thou be able to number them, which nobody can',
  'and he said unto him, So shall thy seed be, which is the whole promise',
  'And he believed in the LORD, which is the sentence everything leans on',
  'and he counted it to him for righteousness, before any law existed',
  'so the believing came first, and the credit followed it, in that order',
];

describe('a television pays the onset at every pace', () => {
  it('PROVEN-TO-CATCH: at 1x a TV joins clauses, where a phone speaks one', () => {
    const phone = utteranceSpan(CLAUSES, 0, 1.0, {});
    const tv = utteranceSpan(CLAUSES, 0, 1.0, { tv: true });
    expect(phone, 'a phone at 1x must keep one clause per utterance').toBe(1);
    expect(tv, 'a TV at 1x was speaking one clause at a time — that is the stall').toBeGreaterThan(1);
  });

  it('the TV span is several clauses, not two', () => {
    // Two would still leave an onset every other clause, which is still a
    // limp. The budget holds roughly three of these.
    expect(utteranceSpan(CLAUSES, 0, 1.0, { tv: true })).toBeGreaterThanOrEqual(3);
  });

  it('a phone is untouched at every rate below the fast threshold', () => {
    for (const r of [0.5, 0.75, 1.0, 1.25, 1.4]) {
      expect(utteranceSpan(CLAUSES, 0, r, {})).toBe(1);
    }
  });

  it('a phone still spans at speed, exactly as before', () => {
    expect(utteranceSpan(CLAUSES, 0, RATE_SPAN_FROM, {})).toBeGreaterThan(1);
  });

  it('never exceeds the long-utterance cutoff or the segment ceiling', () => {
    // Chrome silently truncates a long utterance; crossing MAX_SPAN_CHARS
    // would trade a stall for a sentence that never gets said.
    const long = Array.from({ length: 40 }, (_, i) => `clause number ${i} of this rather long paragraph`);
    for (const r of [1.0, 1.5, 2.0, 3.0]) {
      for (const tv of [false, true]) {
        const n = utteranceSpan(long, 0, r, { tv });
        expect(n).toBeLessThanOrEqual(MAX_SPAN_SEGMENTS);
        const chars = long.slice(0, n).join(' ').length;
        expect(chars).toBeLessThanOrEqual(MAX_SPAN_CHARS);
      }
    }
    expect(TV_SPAN_CHARS).toBeLessThan(MAX_SPAN_CHARS);
  });

  it('a single clause longer than the budget is still spoken, not dropped', () => {
    const huge = ['x'.repeat(900), 'and then a short one'];
    expect(utteranceSpan(huge, 0, 1.0, { tv: true })).toBe(1);
  });

  it('answers 0 past the end and never goes negative', () => {
    expect(utteranceSpan(CLAUSES, CLAUSES.length, 1.0, { tv: true })).toBe(0);
    expect(utteranceSpan(CLAUSES, -1, 1.0, { tv: true })).toBe(0);
    expect(utteranceSpan(null, 0, 1.0, { tv: true })).toBe(0);
  });
});

describe('the segments themselves do not change on a television', () => {
  it('the follow map sees the same sentences either way', () => {
    // read-follow.js locates each segment in the text with indexOf. If a TV
    // produced different segments the highlight would stop following, and the
    // paragraph steps would land somewhere else.
    const text = CLAUSES.join('. ');
    expect(segmentText(text)).toEqual(segmentText(text));
    for (const seg of segmentText(text)) {
      expect(text.replace(/\s+/g, ' ')).toContain(seg);
    }
  });
});

describe('the engine asks the one place that knows', () => {
  const docWith = (attr) => ({ documentElement: { getAttribute: () => attr } });

  it('reads <html data-device="tv">, the same mark the CSS and the remote read', () => {
    expect(createBrowserTTS({ doc: docWith('tv') }).tv).toBe(true);
    expect(createBrowserTTS({ doc: docWith(null) }).tv).toBe(false);
  });

  it('an explicit tv flag wins, so the behaviour is testable without a Fire TV', () => {
    expect(createBrowserTTS({ doc: docWith(null), tv: true }).tv).toBe(true);
    expect(createBrowserTTS({ doc: docWith('tv'), tv: false }).tv).toBe(false);
  });

  it('no document at all is not a television, and does not throw', () => {
    expect(createBrowserTTS({ doc: null }).tv).toBe(false);
  });
});
