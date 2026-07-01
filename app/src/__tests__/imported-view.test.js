// @vitest-environment node
//
// imported-view — the Books -> Imported feed must present newest-first, be
// bounded to a chosen window, and group into months with honest per-month
// totals (Darrell 2026-07-01: "2026 items aren't showing as the latest ...
// endless scroll with no way to see a week or a month at a time"). These prove
// the fix on real wf18 row shapes: the sort actually reorders newest-on-top,
// the window actually excludes out-of-range rows, and the month totals actually
// sum the rows shown — no painted numbers (DR-0076).
import { describe, it, expect } from 'vitest';
import {
  postedMs, totals, sortByDate, periodRange, effectiveRange, filterByRange, groupByMonth,
} from '../lib/imported-view.js';

// A slice shaped like wf18's /imported-transactions rows.
const ROWS = [
  { id: 'a', posted: '2025-11-17', amount: -20, name: 'Old charge' },
  { id: 'b', posted: '2025-11-18', amount: 500, name: 'Old deposit' },
  { id: 'c', posted: '2026-06-01', amount: -15, name: 'June charge' },
  { id: 'd', posted: '2026-06-22', amount: 1200, name: 'June deposit' },
  { id: 'e', posted: '2026-06-30', amount: -80, name: 'June late charge' },
];
const NOW = Date.parse('2026-07-01T12:00:00'); // matches the live currentDate

describe('postedMs', () => {
  it('parses YYYY-MM-DD and full ISO, null for junk', () => {
    expect(postedMs({ posted: '2026-06-22' })).toBe(Date.parse('2026-06-22T00:00:00'));
    expect(postedMs({ posted: '2026-06-22T09:30:00Z' })).toBe(Date.parse('2026-06-22T09:30:00Z'));
    expect(postedMs({ posted: 'not-a-date' })).toBe(null);
    expect(postedMs({})).toBe(null);
  });
});

describe('sortByDate — the actual bug: 2026 must land on top', () => {
  it('desc (default) puts the newest transaction first', () => {
    const out = sortByDate(ROWS, 'desc');
    expect(out.map((t) => t.id)).toEqual(['e', 'd', 'c', 'b', 'a']);
    expect(out[0].posted).toBe('2026-06-30');
  });
  it('asc toggle restores oldest-first', () => {
    expect(sortByDate(ROWS, 'asc').map((t) => t.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
  it('is stable on ties and sinks undated rows', () => {
    const tie = [
      { id: 'x', posted: '2026-06-22' },
      { id: 'y', posted: '2026-06-22' },
      { id: 'z', posted: null },
    ];
    expect(sortByDate(tie, 'desc').map((t) => t.id)).toEqual(['x', 'y', 'z']);
  });
});

describe('periodRange / effectiveRange', () => {
  it('This month starts at the 1st of the current month', () => {
    const { sinceMs } = periodRange('month', NOW);
    expect(new Date(sinceMs).getDate()).toBe(1);
    expect(new Date(sinceMs).getMonth()).toBe(6); // July (0-indexed)
  });
  it('This week starts on the most recent Sunday', () => {
    const { sinceMs } = periodRange('week', NOW);
    expect(new Date(sinceMs).getDay()).toBe(0);
  });
  it('Last 30 is a rolling 30-day window anchored to start-of-today', () => {
    const { sinceMs } = periodRange('30d', NOW);
    const startToday = new Date(2026, 6, 1).getTime(); // 2026-07-01 local midnight
    expect(sinceMs).toBe(startToday - 30 * 86400000);
  });
  it('All is unbounded', () => {
    expect(periodRange('all', NOW)).toEqual({ sinceMs: null, untilMs: null });
  });
  it('a custom from/to date range overrides the preset, inclusive of the to-day', () => {
    const r = effectiveRange('all', '2026-06-01', '2026-06-22', NOW);
    expect(r.sinceMs).toBe(Date.parse('2026-06-01T00:00:00'));
    expect(r.untilMs).toBe(Date.parse('2026-06-22T23:59:59.999'));
  });
});

describe('filterByRange — the window actually excludes out-of-range rows', () => {
  it('Last 30 (from 2026-07-01) drops the 2025 rows, keeps June', () => {
    const { sinceMs, untilMs } = periodRange('30d', NOW);
    const kept = filterByRange(ROWS, sinceMs, untilMs).map((t) => t.id);
    expect(kept).toEqual(['c', 'd', 'e']);
  });
  it('This month (July, after the data ends) is honestly empty', () => {
    const { sinceMs, untilMs } = periodRange('month', NOW);
    expect(filterByRange(ROWS, sinceMs, untilMs)).toEqual([]);
  });
  it('All keeps every row', () => {
    expect(filterByRange(ROWS, null, null)).toHaveLength(5);
  });
  it('a custom range keeps only rows inside it', () => {
    const r = effectiveRange('all', '2025-11-01', '2025-11-30', NOW);
    expect(filterByRange(ROWS, r.sinceMs, r.untilMs).map((t) => t.id)).toEqual(['a', 'b']);
  });
});

describe('totals — per-window numbers are summed from the rows, never painted', () => {
  it('splits in / out / net correctly', () => {
    expect(totals(ROWS)).toEqual({ in: 1700, out: 115, net: 1585, count: 5 });
  });
  it('an empty set is an honest zero', () => {
    expect(totals([])).toEqual({ in: 0, out: 0, net: 0, count: 0 });
  });
});

describe('groupByMonth — collapsible months with real totals, newest first', () => {
  it('groups desc-sorted rows newest-month-first with summed totals', () => {
    const groups = groupByMonth(sortByDate(ROWS, 'desc'));
    expect(groups.map((g) => g.key)).toEqual(['2026-06', '2025-11']);
    expect(groups[0].label).toBe('June 2026');
    expect(groups[0].rows).toHaveLength(3);
    // June: +1200 in, 15 + 80 = 95 out
    expect(groups[0].totals).toEqual({ in: 1200, out: 95, net: 1105, count: 3 });
    // Nov 2025: +500 in, 20 out
    expect(groups[1].totals).toEqual({ in: 500, out: 20, net: 480, count: 2 });
  });
  it('undated rows collect into a trailing group', () => {
    const groups = groupByMonth([{ id: 'u', posted: null, amount: 5 }]);
    expect(groups[0].key).toBe('undated');
  });
});
