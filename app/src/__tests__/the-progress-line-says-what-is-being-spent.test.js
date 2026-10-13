// =============================================================================
// The progress line says what is being SPENT, not what is being moved (DR-0969)
// =============================================================================
// Darrell, 2026-10-11, looking at "Saving for listening offline: 100 of 386
// pieces · 1.8 MB":
//
//   "Why is downloading lesson so long with only mb of data?!!!!!!!!!!"
//
// The question was invited by the line itself. A bare "1.8 MB" sitting beside
// a fourteen-minute wait reads as the size of a TRANSFER, and a transfer that
// small should finish instantly — so the number actively argues that something
// is broken. Nothing is broken: those bytes are how much speech the church
// computer has finished MAKING, one sentence at a time, two at a time.
//
// MEASURED, so these numbers are not invented:
//   * 19.7 characters a second on one stream (lesson-downloads.js:58-67, probe
//     run 36926132891, six pieces of 861 characters in 43.7 s, outside-in).
//   * two streams, because the NAS caps itself at two
//     (voice_lite_server.py:79 MAX_INFLIGHT = 2, 503 "busy" immediately past
//     it at line 402).
//   * 386 pieces x ~87 characters / (19.7 x 2) ~= 14 minutes, over which
//     1.8 MB is about 2 kB a second.
import { describe, it, expect } from 'vitest';
import { progressText } from '../components/LessonDownloads.jsx';
import { DOWNLOAD_STREAMS, SYNTH_CHARS_PER_SECOND, paceSeconds } from '../lib/lesson-downloads.js';

// His run, as the component receives it.
const his = (over = {}) => ({
  total: 1, saved: 0, skipped: 0, failed: [], voiceStopped: null, current: 'L191',
  pieces: { done: 100, total: 386, fetched: 100, held: 0 },
  bytes: 1.8 * 1024 * 1024,
  charsDone: 8740, charsPerSecond: 38.2,
  startedAt: 1_000_000, lastPieceAt: 1_200_000, lastError: null,
  ...over,
});

describe('the bytes say they were MADE', () => {
  it('PROVEN-TO-CATCH: the byte count is never a bare size beside the wait', () => {
    // The exact defect. "· 1.8 MB" is what prompted the question; "1.8 MB
    // made" is the same number saying what it is.
    const line = progressText(his(), { running: true, now: 1_500_000 });
    expect(line).toMatch(/1\.8 MB made/);
    expect(line, 'the byte count is still bare, so it still reads as a transfer size')
      .not.toMatch(/·\s*1\.8 MB(?!\s*made)/);
  });

  it('still counts the pieces, which is the number that reflects the work', () => {
    expect(progressText(his(), { running: true, now: 1_500_000 })).toMatch(/100 of 386 voice pieces/);
  });

  it('a run with no bytes yet says nothing about bytes rather than "0 B"', () => {
    const line = progressText(his({ bytes: 0, pieces: { done: 0, total: 386, fetched: 0, held: 0 } }), { running: true, now: 1_000_100 });
    expect(line).not.toMatch(/\bmade\b/);
    expect(line).not.toMatch(/0 B/);
  });

  it('a words-only run never mentions pieces or made bytes at all', () => {
    const line = progressText(
      { total: 4, saved: 2, skipped: 0, failed: [], pieces: { done: 0, total: 0 }, bytes: 0 },
      { running: true },
    );
    expect(line).toBe('2 of 4 lessons saved');
  });
});

describe('the pace the line quotes is the measured one', () => {
  it('two streams, because the NAS caps itself at two', () => {
    // If this ever rises without the NAS's MAX_INFLIGHT rising first, the
    // extra workers earn 503s and backoff — slower, not faster. The comment
    // on DOWNLOAD_STREAMS carries the measurement; this pins the number.
    expect(DOWNLOAD_STREAMS).toBe(2);
  });

  it('his 386 pieces really do come to about a quarter of an hour', () => {
    // ~87.4 characters a piece (lesson-downloads.js:52-53).
    const chars = 386 * 87.4;
    const seconds = paceSeconds(chars);
    expect(seconds).toBeGreaterThan(12 * 60);
    expect(seconds).toBeLessThan(18 * 60);
    // And the bytes over that span are a trickle, which is the whole illusion.
    const bytesPerSecond = (1.8 * 1024 * 1024) / seconds;
    expect(bytesPerSecond).toBeLessThan(4000);
  });

  it('the pace is per stream, so halving the streams doubles the wait', () => {
    expect(paceSeconds(1000, { streams: 1 })).toBeCloseTo(1000 / SYNTH_CHARS_PER_SECOND, 6);
    expect(paceSeconds(1000, { streams: 2 })).toBeCloseTo(1000 / (2 * SYNTH_CHARS_PER_SECOND), 6);
  });
});

describe('the time remaining is still said', () => {
  it('the line carries a pace estimate while pieces are landing', () => {
    // 100 pieces in 200 s of elapsed -> 286 left is ~572 s, "about 10 minutes".
    const line = progressText(his(), { running: true, now: 1_200_000 });
    expect(line).toMatch(/more at this pace/);
  });

  it('a paused run says paused and does not pretend to a pace', () => {
    const line = progressText(his(), { running: true, paused: true, now: 1_500_000 });
    expect(line).toMatch(/paused/);
    expect(line).not.toMatch(/more at this pace/);
  });
});
