// Locks the in-app Conflict-Evaluation Loop shapers (2026-06-17). These turn the
// baked __CONFLICT_LOOP__ manifest into render-ready status for ConflictLoop.jsx.
// If the trend verdict, hot-file status, or normalization regress, the surface
// would mislead about whether conflicts are actually trending down — so they're
// gated here, including the honest-degradation (empty/absent manifest) path.
import { describe, it, expect } from 'vitest';
import {
  normalizeConflictManifest,
  trendVerdict,
  hotFileStatus,
  rateBars,
} from '../lib/conflict-loop.js';

describe('normalizeConflictManifest — null-safe, never paints', () => {
  it('an absent manifest yields an honest empty shape', () => {
    const m = normalizeConflictManifest(null);
    expect(m.ok).toBe(false);
    expect(m.eventCount).toBe(0);
    expect(m.hotFiles).toEqual([]);
    expect(m.decomposition).toEqual([]);
  });
  it('preserves a real manifest shape', () => {
    const m = normalizeConflictManifest({
      ok: true,
      eventCount: 8,
      hotFiles: [{ file: 'app/src/poe-financial-mvp-v28.jsx', incidents: 3, contendingBranches: 3, branches: ['a', 'b', 'c'], isMonolith: true }],
      rate: { buckets: [{ bucket: '2026-06-17', count: 6 }], trend: 'up', latest: 6 },
      decomposition: [{ target: 'app/src/poe-financial-mvp-v28.jsx', collisions: 3, priority: 1, recommendation: 'registry', rankedExtractions: ['x'] }],
    });
    expect(m.ok).toBe(true);
    expect(m.hotFiles[0].isMonolith).toBe(true);
    expect(m.decomposition[0].priority).toBe(1);
  });
});

describe('trendVerdict — DOWN is the only win, target always shown', () => {
  it('down => good', () => {
    const v = trendVerdict({ trend: 'down' });
    expect(v.status).toBe('good');
    expect(v.target).toBe('down');
  });
  it('up => attention (not painted green)', () => {
    expect(trendVerdict({ trend: 'up' }).status).toBe('attention');
  });
  it('baseline => idle, honest "recording"', () => {
    const v = trendVerdict({ trend: 'baseline' });
    expect(v.status).toBe('idle');
    expect(v.label).toMatch(/baseline/i);
  });
});

describe('hotFileStatus — the monolith reads as a problem', () => {
  it('3+ collisions => problem', () => {
    expect(hotFileStatus({ incidents: 3 }).status).toBe('problem');
  });
  it('a monolith with even one touch => problem', () => {
    expect(hotFileStatus({ incidents: 1, isMonolith: true }).status).toBe('problem');
  });
  it('2 collisions => attention; 1 => idle', () => {
    expect(hotFileStatus({ incidents: 2 }).status).toBe('attention');
    expect(hotFileStatus({ incidents: 1 }).status).toBe('idle');
  });
});

describe('rateBars — scaled bars for the inline trend chart', () => {
  it('scales each bucket against the max', () => {
    const bars = rateBars({ buckets: [{ bucket: '2026-06-15', count: 2 }, { bucket: '2026-06-17', count: 6 }] });
    expect(bars.length).toBe(2);
    expect(bars[1].pct).toBe(100);
    expect(bars[0].pct).toBe(33);
  });
  it('empty buckets => empty bars (no divide-by-zero)', () => {
    expect(rateBars({ buckets: [] })).toEqual([]);
  });
});
