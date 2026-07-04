// usage-events — the PURE shaping of the governor's aggregate flow (Darrell
// 2026-07-04: "most used tab etc"). The I/O (record/fetch) is fail-soft and
// governor-gated in the RPC; here the pure ranking/share the surface renders is
// pinned. No network. (jsdom default env — the module imports the supabase
// client, which touches window at load, same as the other *-sync tests.)
import { describe, it, expect } from 'vitest';
import { topViews, viewShare } from '../lib/usage-events.js';

const FLOW = {
  generated_at: '2026-07-04T18:00:00Z',
  window_days: 30,
  total_views: 100,
  active_users: 4,
  views: [
    { name: 'tvtime', count: 50, users: 3 },
    { name: 'overview', count: 30, users: 4 },
    { name: 'church', count: 20, users: 2 },
    { name: 'bogus', count: 'x' }, // malformed count → coerced to 0
  ],
};

describe('topViews — most-used tabs, biggest first', () => {
  it('ranks by count desc, coerces bad counts, caps the list', () => {
    const rows = topViews(FLOW, 15);
    expect(rows.map((r) => r.name)).toEqual(['tvtime', 'overview', 'church', 'bogus']);
    expect(rows[0]).toEqual({ name: 'tvtime', count: 50, users: 3 });
    expect(rows[3].count).toBe(0);                 // 'x' → 0
    expect(topViews(FLOW, 2).map((r) => r.name)).toEqual(['tvtime', 'overview']);
  });
  it('is total over a missing / empty flow (never throws)', () => {
    expect(topViews(null)).toEqual([]);
    expect(topViews({})).toEqual([]);
    expect(topViews({ views: 'nope' })).toEqual([]);
  });
});

describe('viewShare — bar width as share of total', () => {
  it('is the row count over total views, clamped 0..1', () => {
    expect(viewShare({ count: 50 }, FLOW)).toBeCloseTo(0.5);
    expect(viewShare({ count: 30 }, FLOW)).toBeCloseTo(0.3);
    expect(viewShare({ count: 5 }, { total_views: 0 })).toBe(0); // no divide-by-zero
    expect(viewShare(null, FLOW)).toBe(0);
  });
});
