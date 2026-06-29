// =============================================================================
// harvest-stall — proven-to-catch guard for the consistency half of Darrell's
// complaint ("stuck", "stalled partway"). DR-0076: a green check must MEAN
// something, so each test below fails on the failure it is meant to catch.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { harvestSnapshot, detectStall } from '../lib/harvest-stall.js';

const snap = (avgPct, { videos = 100, orphans = 0, transcribed = 0, fully = 0 } = {}) =>
  harvestSnapshot({ videos, avgPct, orphans, fullyHarvested: fully, byType: { transcript: { complete: transcribed } } }, avgPct);

describe('harvestSnapshot pulls the levers that matter', () => {
  it('captures avgPct, orphans, and how many transcripts are fetched', () => {
    const s = harvestSnapshot({ videos: 10, avgPct: 67, orphans: 1, byType: { transcript: { complete: 4 } } }, '2026-06-29');
    expect(s).toMatchObject({ videos: 10, avgPct: 67, orphans: 1, transcribed: 4, at: '2026-06-29' });
  });
});

describe('detectStall flags a harvest that stopped advancing', () => {
  it('CATCHES a flat sequence with transcripts still un-fetched', () => {
    const history = [snap(22, { transcribed: 0 }), snap(22, { transcribed: 0 }), snap(22, { transcribed: 0 })];
    const r = detectStall(history);
    expect(r.stalled).toBe(true);                       // <- the catch
    expect(r.reason).toMatch(/transcripts un-fetched/);
    expect(r.latestPct).toBe(22);
  });

  it('does NOT flag a sequence that is climbing', () => {
    const history = [snap(22, { transcribed: 0 }), snap(40, { transcribed: 30 }), snap(58, { transcribed: 60 })];
    expect(detectStall(history).stalled).toBe(false);
    expect(detectStall(history).reason).toBe('advancing');
  });

  it('does NOT flag a corpus that is already done (no orphans, above the floor)', () => {
    const history = [snap(67, { transcribed: 100 }), snap(67, { transcribed: 100 }), snap(67, { transcribed: 100 })];
    const r = detectStall(history);
    expect(r.stalled).toBe(false);
    expect(r.reason).toBe('done');
  });

  it('does NOT flag before there is enough history to judge (warming up)', () => {
    expect(detectStall([snap(22), snap(22)]).stalled).toBe(false);
    expect(detectStall([snap(22), snap(22)]).reason).toBe('warming-up');
  });

  it('handles an empty corpus without crashing', () => {
    expect(detectStall([]).stalled).toBe(false);
    expect(detectStall([snap(0, { videos: 0 })]).reason).toBe('no-corpus');
  });

  it('flat-but-below-floor with transcripts fetched still flags (loader/extractor issue)', () => {
    const history = [snap(30, { transcribed: 100 }), snap(30, { transcribed: 100 }), snap(30, { transcribed: 100 })];
    const r = detectStall(history);
    expect(r.stalled).toBe(true);
    expect(r.reason).toMatch(/coverage flat/);
  });
});
