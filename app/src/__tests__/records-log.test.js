// @vitest-environment node
//
// records-log — the app-wide "filing office" list core must sort newest-first,
// window to a chosen period, and group/index by month or day so a human lands
// on the exact date instead of death-scrolling (Darrell 2026-07-01). These prove
// the accessor-based core on non-financial record shapes (a sermon library) as
// well as amounts, so The Word / Choir / Harvest reuse the SAME verified logic.
import { describe, it, expect } from 'vitest';
import {
  toMsValue, recordMs, recordTotals, sortRecords, filterRecordsByRange,
  groupRecords, resolvePeriod, dayKeyOf, dayLabelOf,
} from '../lib/records-log.js';

// A sermon-library slice (choir_sermons shape): date field is `serviceDate`,
// no amount. Deliberately unsorted + one duplicate service date.
const SERMONS = [
  { id: 's1', serviceDate: '2023-11-26', title: "I'm On The Lord's Side", speaker: 'Bishop Gwin' },
  { id: 's2', serviceDate: '2026-06-21', title: 'Latest word', speaker: 'Bishop Gwin' },
  { id: 's3', serviceDate: '2026-06-07', title: 'Earlier June', speaker: 'Pastor A' },
  { id: 's4', serviceDate: '2026-06-28', title: 'Newest June', speaker: 'Bishop Gwin' },
];
const getDate = (r) => r.serviceDate;
const NOW = Date.parse('2026-07-01T12:00:00');

describe('toMsValue / recordMs — accessor-based date resolution', () => {
  it('parses YYYY-MM-DD, ISO, and numbers; null for junk', () => {
    expect(toMsValue('2026-06-28')).toBe(Date.parse('2026-06-28T00:00:00'));
    expect(toMsValue('2026-06-28T09:00:00Z')).toBe(Date.parse('2026-06-28T09:00:00Z'));
    expect(toMsValue(1234)).toBe(1234);
    expect(toMsValue('nope')).toBe(null);
    expect(toMsValue(null)).toBe(null);
  });
  it('recordMs works with a function accessor and a field-name accessor', () => {
    expect(recordMs(SERMONS[0], getDate)).toBe(Date.parse('2023-11-26T00:00:00'));
    expect(recordMs(SERMONS[0], 'serviceDate')).toBe(Date.parse('2023-11-26T00:00:00'));
  });
});

describe('sortRecords — newest-first by default (no more death scroll)', () => {
  it('desc puts the newest service date first', () => {
    expect(sortRecords(SERMONS, getDate, 'desc').map(r => r.id)).toEqual(['s4', 's2', 's3', 's1']);
  });
  it('asc restores oldest-first', () => {
    expect(sortRecords(SERMONS, getDate, 'asc').map(r => r.id)).toEqual(['s1', 's3', 's2', 's4']);
  });
  it('undated records sink to the end, stably', () => {
    const rows = [{ id: 'a', d: '2026-06-01' }, { id: 'b', d: null }, { id: 'c', d: '2026-06-02' }];
    expect(sortRecords(rows, 'd', 'desc').map(r => r.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('filterRecordsByRange + resolvePeriod — jump straight to a month', () => {
  it('a month key lands on exactly that month', () => {
    const { sinceMs, untilMs } = resolvePeriod('2026-06', null, NOW);
    expect(filterRecordsByRange(SERMONS, getDate, sinceMs, untilMs).map(r => r.id).sort())
      .toEqual(['s2', 's3', 's4']);
  });
  it('This Month (July, after the data) is honestly empty', () => {
    const { sinceMs, untilMs } = resolvePeriod('month', null, NOW);
    expect(filterRecordsByRange(SERMONS, getDate, sinceMs, untilMs)).toEqual([]);
  });
  it('a custom range keeps only rows inside it', () => {
    const { sinceMs, untilMs } = resolvePeriod('custom', { from: '2023-01-01', to: '2023-12-31' }, NOW);
    expect(filterRecordsByRange(SERMONS, getDate, sinceMs, untilMs).map(r => r.id)).toEqual(['s1']);
  });
  it('All keeps everything', () => {
    const { sinceMs, untilMs } = resolvePeriod('all', null, NOW);
    expect(filterRecordsByRange(SERMONS, getDate, sinceMs, untilMs)).toHaveLength(4);
  });
});

describe('groupRecords — indexed by month (default) or day', () => {
  it('groups desc-sorted sermons newest-month-first, count-only when no amount', () => {
    const groups = groupRecords(sortRecords(SERMONS, getDate, 'desc'), getDate);
    expect(groups.map(g => g.key)).toEqual(['2026-06', '2023-11']);
    expect(groups[0].label).toBe('June 2026');
    expect(groups[0].totals).toEqual({ in: 0, out: 0, net: 0, count: 3, hasAmount: false });
  });
  it('day grain indexes to the exact date', () => {
    const groups = groupRecords(sortRecords(SERMONS, getDate, 'desc'), getDate, { grain: 'day' });
    expect(groups.map(g => g.key)).toEqual(['2026-06-28', '2026-06-21', '2026-06-07', '2023-11-26']);
    expect(dayKeyOf(Date.parse('2026-06-28T00:00:00'))).toBe('2026-06-28');
    expect(dayLabelOf('2026-06-28')).toContain('June 28, 2026');
  });
});

describe('recordTotals — in/out/net only when a getAmount accessor is given', () => {
  it('financial records split in/out/net', () => {
    const txns = [{ amt: 500 }, { amt: -15 }, { amt: -80 }];
    expect(recordTotals(txns, (t) => t.amt)).toEqual({ in: 500, out: 95, net: 405, count: 3, hasAmount: true });
  });
  it('non-financial records report count only, hasAmount false', () => {
    expect(recordTotals(SERMONS, null)).toEqual({ in: 0, out: 0, net: 0, count: 4, hasAmount: false });
  });
});
