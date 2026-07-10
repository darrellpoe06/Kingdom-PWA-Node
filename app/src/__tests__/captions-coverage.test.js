// captions-coverage.test.js — the REAL captions metric, proven to catch (DR-0076).
// Pins: the denominator is the real corpus, only cue-bearing tracks count, gaps
// are honest, and the percentage is measured (never painted).
import { describe, it, expect } from 'vitest';
import {
  captionsCoverage, captionsCoverageLine, CAPTIONS_COVERAGE_CONCERN_PCT,
} from '../lib/captions-coverage.js';

describe('captionsCoverage', () => {
  it('counts only videos with a real timed track; the rest are honest gaps', () => {
    const cov = captionsCoverage(['a', 'b', 'c', 'd'], {
      a: { cueCount: 120, source: 'youtube-asr' },
      b: { cueCount: 300, source: 'whisper-nas' },
      c: { cueCount: 0, source: 'youtube-asr' }, // untimed -> NOT captioned
      // d absent entirely -> gap
    });
    expect(cov.total).toBe(4);
    expect(cov.captioned).toBe(2);
    expect(cov.gaps).toBe(2);
    expect(cov.pct).toBe(50);
    expect(cov.fullyCaptioned).toBe(false);
    expect(cov.bySource).toEqual({ 'youtube-asr': 1, 'whisper-nas': 1 });
    expect(cov.gapIds.sort()).toEqual(['c', 'd']);
  });

  it('accepts corpus rows as objects (videoId/video_id) and de-dups', () => {
    const cov = captionsCoverage(
      [{ videoId: 'a' }, { video_id: 'b' }, 'a'],
      { a: { cueCount: 5 }, b: { cueCount: 5 } },
    );
    expect(cov.total).toBe(2);
    expect(cov.captioned).toBe(2);
    expect(cov.fullyCaptioned).toBe(true);
    expect(cov.pct).toBe(100);
  });

  it('is safe on an empty corpus', () => {
    const cov = captionsCoverage([], {});
    expect(cov).toMatchObject({ total: 0, captioned: 0, gaps: 0, pct: 0, fullyCaptioned: false });
  });

  it('ignores falsy ids and a non-object captions map', () => {
    const cov = captionsCoverage(['a', null, undefined, ''], null);
    expect(cov.total).toBe(1);
    expect(cov.captioned).toBe(0);
  });
});

describe('captionsCoverageLine', () => {
  it('reads honestly for empty, partial, and full coverage', () => {
    expect(captionsCoverageLine(captionsCoverage([], {}))).toMatch(/No service videos/);
    expect(captionsCoverageLine(captionsCoverage(['a', 'b'], { a: { cueCount: 3 } }))).toMatch(/1\/2 .*50%.*1 still owe/);
    expect(captionsCoverageLine(captionsCoverage(['a'], { a: { cueCount: 3 } }))).toMatch(/All 1 service videos captioned/);
  });
});

describe('CAPTIONS_COVERAGE_CONCERN_PCT', () => {
  it('is a high accessibility bar, not aspirational', () => {
    expect(CAPTIONS_COVERAGE_CONCERN_PCT).toBeGreaterThanOrEqual(80);
  });
});
