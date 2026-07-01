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
  monthKeyOf, isMonthKey, monthRange, monthLabelOf, shiftMonthKey, runningBalances,
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

describe('Last Month segment', () => {
  it('is the whole previous calendar month (bounded both ends)', () => {
    const r = periodRange('lastMonth', NOW); // NOW = 2026-07-01
    expect(new Date(r.sinceMs).getMonth()).toBe(5); // June
    expect(new Date(r.sinceMs).getDate()).toBe(1);
    // untilMs is the last instant of June -> filtering keeps June, drops July + May
    const rows = [
      { id: 'may', posted: '2026-05-31', amount: 1 },
      { id: 'jun1', posted: '2026-06-01', amount: 1 },
      { id: 'jun30', posted: '2026-06-30', amount: 1 },
      { id: 'jul', posted: '2026-07-01', amount: 1 },
    ];
    expect(filterByRange(rows, r.sinceMs, r.untilMs).map(t => t.id)).toEqual(['jun1', 'jun30']);
  });
});

describe('quick month jump (the Mint/YNAB month stepper)', () => {
  it('monthKeyOf / isMonthKey / monthLabelOf round-trip', () => {
    expect(monthKeyOf(Date.parse('2026-06-22T00:00:00'))).toBe('2026-06');
    expect(isMonthKey('2026-06')).toBe(true);
    expect(isMonthKey('all')).toBe(false);
    expect(monthLabelOf('2026-06')).toBe('June 2026');
  });
  it('shiftMonthKey steps across year boundaries', () => {
    expect(shiftMonthKey('2026-06', -1)).toBe('2026-05');
    expect(shiftMonthKey('2026-01', -1)).toBe('2025-12');
    expect(shiftMonthKey('2026-12', 1)).toBe('2027-01');
  });
  it('monthRange bounds a single calendar month', () => {
    const r = monthRange('2026-06');
    const rows = [
      { id: 'may', posted: '2026-05-31', amount: 1 },
      { id: 'jun', posted: '2026-06-15', amount: 1 },
      { id: 'jul', posted: '2026-07-01', amount: 1 },
    ];
    expect(filterByRange(rows, r.sinceMs, r.untilMs).map(t => t.id)).toEqual(['jun']);
  });
});

describe('runningBalances — the statement Balance column, truthful', () => {
  it('newest row shows opening + all posted amounts (= current balance); order-independent input', () => {
    const opening = 100;
    const rows = [
      { id: 'r3', posted: '2026-06-30', amount: -80 },
      { id: 'r1', posted: '2026-06-10', amount: 500 },   // deliberately out of order
      { id: 'r2', posted: '2026-06-20', amount: -50 },
    ];
    const bal = runningBalances(rows, opening);
    // walk oldest->newest: 100+500=600, 600-50=550, 550-80=470
    expect(bal.get('r1')).toBe(600);
    expect(bal.get('r2')).toBe(550);
    expect(bal.get('r3')).toBe(470); // newest = current balance
  });
  it('handles a non-numeric amount as zero (never NaN-poisons the running total)', () => {
    const bal = runningBalances([{ id: 'x', posted: '2026-06-01', amount: 'oops' }], 200);
    expect(bal.get('x')).toBe(200);
  });
});
