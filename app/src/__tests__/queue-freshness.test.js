// queue-freshness — staleness made legible (DR-0120 / LESSONS P30, proven to
// catch). The 2026-07-07 finding: the Feedback promote queue held tester notes
// from mid-June and looked "fine" — the surface rendered live rows, but nothing
// said the rows were untended. Pinned: the threshold fires on old items, spares
// fresh ones, and treats an undated row as stale (it cannot prove freshness).
import { describe, it, expect } from 'vitest';
import { staleQueueItems, queueFreshness, QUEUE_STALE_DAYS } from '../lib/queue-freshness.js';

const NOW = '2026-07-07T12:00:00Z';
const daysAgo = (n) => new Date(Date.parse(NOW) - n * 24 * 60 * 60 * 1000).toISOString();

describe('staleQueueItems', () => {
  it('flags items older than the threshold and spares fresh ones', () => {
    const items = [
      { id: 'old', createdAt: daysAgo(20) },
      { id: 'fresh', createdAt: daysAgo(3) },
      { id: 'edge-fresh', createdAt: daysAgo(QUEUE_STALE_DAYS - 1) },
    ];
    expect(staleQueueItems(items, { now: NOW }).map((i) => i.id)).toEqual(['old']);
  });

  it('treats an undated or unparseable row as stale — it cannot prove freshness', () => {
    const items = [{ id: 'nodate' }, { id: 'junk', createdAt: 'not-a-date' }];
    expect(staleQueueItems(items, { now: NOW })).toHaveLength(2);
  });

  it('supports a custom date field and threshold', () => {
    const items = [{ id: 'a', at: daysAgo(5) }];
    expect(staleQueueItems(items, { now: NOW, days: 3, dateOf: (x) => x.at })).toHaveLength(1);
    expect(staleQueueItems(items, { now: NOW, days: 7, dateOf: (x) => x.at })).toHaveLength(0);
  });
});

describe('queueFreshness — the banner summary', () => {
  it('reports total, stale count, and the oldest age in whole days', () => {
    const f = queueFreshness([
      { createdAt: daysAgo(21) },
      { createdAt: daysAgo(2) },
    ], { now: NOW });
    expect(f.total).toBe(2);
    expect(f.stale).toBe(1);
    expect(f.oldestDays).toBe(21);
  });

  it('handles an empty queue without inventing numbers', () => {
    const f = queueFreshness([], { now: NOW });
    expect(f).toEqual({ total: 0, stale: 0, oldestDays: null });
  });
});
