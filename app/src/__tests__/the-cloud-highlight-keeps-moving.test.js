// @vitest-environment node
// =============================================================================
// A STREAMED CLIP MUST NOT FREEZE THE HIGHLIGHT ON SENTENCE ONE
// =============================================================================
// Darrell 2026-09-18, from the church door: "it keeps reading and stops
// highlighting the whole lesson... it starts with the highlighting though."
//
// In the sovereign/cloned voice the whole lesson is ONE clip and the highlight
// is driven entirely by that clip's playback FRACTION. The two playback sites
// in use-read-aloud.js computed it as `currentTime / duration` guarded by
// `Number.isFinite(duration) && duration > 0`. A synthesis endpoint that
// streams the audio as it makes it leaves `duration` at Infinity for the whole
// of playback, so that guard was false on EVERY tick: cloudProgress never left
// its initial 0, and the sentence highlight painted segment zero once and
// never moved while the lesson read to the end.
//
// PROVEN-TO-CATCH: the first test is the defect reproduced against the OLD
// arithmetic, so this file fails if anyone puts it back.
import { describe, it, expect } from 'vitest';
import { clipFraction, estimateClipSeconds, seekableEndOf, ESTIMATED_CHARS_PER_SECOND } from '../lib/clip-progress.js';
import { segmentIndexAtFraction } from '../lib/read-follow.js';

// A lesson-sized clip: thirty sentences, each with its own character length.
const LENS = Array.from({ length: 30 }, (_, i) => 80 + (i % 7) * 20);
const TOTAL_CHARS = LENS.reduce((a, b) => a + b, 0);

describe('the defect, reproduced', () => {
  it('the OLD arithmetic yields nothing at all on a clip whose duration never resolves', () => {
    const old = (currentTime, duration) => (Number.isFinite(duration) && duration > 0
      ? Math.min(1, currentTime / duration) : null);
    // Every tick of a whole lesson, and not one of them produces a fraction.
    const ticks = Array.from({ length: 200 }, (_, i) => old(i * 1.5, Infinity));
    expect(ticks.every((x) => x === null)).toBe(true);
  });

  it('and a frozen fraction holds the highlight on the FIRST sentence for the whole read', () => {
    // What the reader sees when cloudProgress never leaves 0: one sentence lit
    // at the start, nothing afterwards, the audio unaffected.
    const stuck = Array.from({ length: 200 }, () => segmentIndexAtFraction(LENS, 0));
    expect(new Set(stuck).size, 'the highlight moved, so this is not the reported defect').toBe(1);
    expect(stuck[0]).toBe(0);
  });
});

describe('the fix: the fraction keeps moving whatever the browser reports', () => {
  it('uses the real duration when there is one', () => {
    expect(clipFraction({ currentTime: 30, duration: 60 })).toBe(0.5);
  });

  it('prefers a real duration over the estimate', () => {
    expect(clipFraction({ currentTime: 30, duration: 60, estimatedSeconds: 600 })).toBe(0.5);
  });

  it('falls back to the seekable end when the duration never resolves', () => {
    expect(clipFraction({ currentTime: 30, duration: Infinity, seekableEnd: 120 })).toBe(0.25);
  });

  it('falls back to the named estimate when nothing else is known', () => {
    const est = estimateClipSeconds('x'.repeat(TOTAL_CHARS));
    expect(est).toBeCloseTo(TOTAL_CHARS / ESTIMATED_CHARS_PER_SECOND, 6);
    expect(clipFraction({ currentTime: est / 2, duration: Infinity, estimatedSeconds: est })).toBeCloseTo(0.5, 6);
  });

  it('never exceeds one, so a clip that runs past its estimate stays on the last sentence', () => {
    expect(clipFraction({ currentTime: 9999, duration: Infinity, estimatedSeconds: 10 })).toBe(1);
  });

  it('returns null rather than jumping the highlight to the top when even the time is unusable', () => {
    expect(clipFraction({ currentTime: NaN, duration: 60 })).toBe(null);
    expect(clipFraction({ currentTime: 10, duration: Infinity })).toBe(null);
  });

  it('walks the WHOLE lesson: a streamed clip now advances through every sentence', () => {
    // The end-to-end claim, measured rather than asserted: play a clip whose
    // duration is Infinity from end to end and count the sentences the
    // highlight visits.
    const est = estimateClipSeconds('x'.repeat(TOTAL_CHARS));
    const visited = new Set();
    for (let t = 0; t <= est; t += est / 400) {
      const f = clipFraction({ currentTime: t, duration: Infinity, estimatedSeconds: est });
      visited.add(segmentIndexAtFraction(LENS, f));
    }
    expect(visited.size, 'the highlight still does not reach every sentence').toBe(LENS.length);
    expect(Math.max(...visited)).toBe(LENS.length - 1);
  });
});

describe('the seekable read never throws into playback', () => {
  it('survives an element with no seekable ranges, or one that throws', () => {
    expect(seekableEndOf(null)).toBe(null);
    expect(seekableEndOf({ seekable: { length: 0 } })).toBe(null);
    expect(seekableEndOf({ get seekable() { throw new Error('no'); } })).toBe(null);
    expect(seekableEndOf({ seekable: { length: 1, end: () => Infinity } })).toBe(null);
    expect(seekableEndOf({ seekable: { length: 1, end: () => 42 } })).toBe(42);
  });
});
