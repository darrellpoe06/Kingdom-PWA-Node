// Build board chronological ordering (Darrell, 2026-06-13): each stage must read
// as a timeline, not array order. These lock the real-date sort: upcoming work
// nearest-first, shipped most-recent-first, and prose-target items (no date)
// always at the bottom in their listed order.
import { describe, it, expect } from 'vitest';
import { whenSortKey, sortByWhen, recentlyShipped } from '../components/BuildBoard.jsx';

const when = (s) => ({ when: s });

describe('whenSortKey', () => {
  it('parses YYYY-MM-DD and YYYY-MM dates to comparable numbers', () => {
    expect(whenSortKey(when('2026-06-17'))).toBeLessThan(whenSortKey(when('2026-07-01')));
    expect(whenSortKey(when('2026-07'))).toBeGreaterThan(whenSortKey(when('2026-06-30')));
  });
  it('treats a prose target (non-date) as Infinity so it sinks to the bottom', () => {
    expect(whenSortKey(when('after the privacy review'))).toBe(Infinity);
    expect(whenSortKey({})).toBe(Infinity);
  });
});

describe('sortByWhen', () => {
  it('ascending: nearest target first (the Next-tab fix)', () => {
    const out = sortByWhen([when('2026-07-15'), when('2026-06-17'), when('2026-06-24')], 'asc');
    expect(out.map(r => r.when)).toEqual(['2026-06-17', '2026-06-24', '2026-07-15']);
  });
  it('descending: most-recent first (the Shipped tab)', () => {
    const out = sortByWhen([when('2026-06-10'), when('2026-06-11'), when('2026-06-09')], 'desc');
    expect(out.map(r => r.when)).toEqual(['2026-06-11', '2026-06-10', '2026-06-09']);
  });
  it('prose-target items sink to the bottom in BOTH directions, in listed order', () => {
    const list = [when('Gmail reconnect first'), when('2026-07-01'), when('after the review'), when('2026-06-20')];
    expect(sortByWhen(list, 'asc').map(r => r.when))
      .toEqual(['2026-06-20', '2026-07-01', 'Gmail reconnect first', 'after the review']);
    expect(sortByWhen(list, 'desc').map(r => r.when))
      .toEqual(['2026-07-01', '2026-06-20', 'Gmail reconnect first', 'after the review']);
  });
  it('is a stable sort for equal dates (keeps listed order)', () => {
    const a = { id: 'a', when: '2026-06-24' };
    const b = { id: 'b', when: '2026-06-24' };
    expect(sortByWhen([a, b], 'asc').map(r => r.id)).toEqual(['a', 'b']);
  });
});

// recently-shipped continuity strip (build backlog #5) — real, dated ships only,
// newest-first, build-stamped at the call site.
describe('recentlyShipped', () => {
  it('returns at most n items, all shipped', () => {
    const r = recentlyShipped(4);
    expect(r.length).toBeLessThanOrEqual(4);
    expect(r.every(x => x.status === 'shipped')).toBe(true);
  });
  it('is ordered newest-date-first', () => {
    const r = recentlyShipped(10);
    for (let i = 1; i < r.length; i++) {
      expect(Date.parse(r[i - 1].when)).toBeGreaterThanOrEqual(Date.parse(r[i].when));
    }
  });
  it('only includes dated ships (excludes prose-condition "when")', () => {
    expect(recentlyShipped(50).every(x => /^\d{4}-\d{2}(-\d{2})?$/.test(x.when))).toBe(true);
  });
  it('respects the count limit', () => {
    expect(recentlyShipped(2).length).toBeLessThanOrEqual(2);
  });
});
