// =============================================================================
// re-review-timeline — the Way's timeline, read from the ledger (DR-0832)
// =============================================================================
// Pure cases over a fixture ledger, then the real section rendered over the
// same fixture (renderToStaticMarkup, no browser): passed first and named as
// passed, today, then weeks with the first two open; the summary counts only
// what is there; a record with no date is counted, never dated.
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { weekStartOf, daysBetween, shortDay, rowOf, buildReReviewTimeline, timelineSummary } from '../lib/re-review-timeline.js';
import ReReviewTimeline from '../components/ReReviewTimeline.jsx';

const TODAY = '2026-10-09'; // a Friday
const LEDGER = [
  { id: 'DR-0809', num: 809, title: 'The Wyze bridge on the NAS', status: 'accepted', chain: { reReview: '2026-10-15' } },
  { id: 'DR-0831', num: 831, title: 'The isolation legs apply the pre-step group atomically', status: 'accepted', chain: { reReview: '2026-10-16' } },
  { id: 'DR-0827', num: 827, title: 'The Poe Properties door looks like PoeTech', status: 'accepted', chain: { reReview: '2026-10-23' } },
  { id: 'DR-0748', num: 748, title: 'Nothing interrupts your words', status: 'accepted', chain: { reReview: '2026-10-09' } },
  { id: 'DR-0700', num: 700, title: 'An old parked thing', status: 'accepted', chain: { reReview: '2026-10-01' } },
  { id: 'DR-0640', num: 640, title: 'Even older', status: 'accepted', chain: { reReview: '2026-09-20' } },
  { id: 'DR-0824', num: 824, title: 'A decided thing with no date', status: 'accepted', chain: { reReview: '' } },
  { id: 'DR-0020', num: 20, title: 'An index-only row', status: 'accepted' },
];

describe('the day arithmetic', () => {
  it('weeks start on Monday', () => {
    expect(weekStartOf('2026-10-09')).toBe('2026-10-05');   // Friday -> that Monday
    expect(weekStartOf('2026-10-05')).toBe('2026-10-05');   // Monday stays
    expect(weekStartOf('2026-10-11')).toBe('2026-10-05');   // Sunday belongs to the week before
    expect(weekStartOf('')).toBe('');
  });
  it('days between, and the short day', () => {
    expect(daysBetween('2026-10-01', '2026-10-09')).toBe(8);
    expect(daysBetween('2026-10-15', '2026-10-09')).toBe(-6);
    expect(daysBetween('', '2026-10-09')).toBeNull();
    expect(shortDay('2026-10-21')).toBe('21 Oct');
  });
});

describe('buildReReviewTimeline', () => {
  const tl = buildReReviewTimeline(LEDGER, TODAY);
  it('a row carries the date, how late it is, and whether it has passed', () => {
    expect(rowOf(LEDGER[4], TODAY)).toMatchObject({ id: 'DR-0700', date: '2026-10-01', daysLate: 8, passed: true });
    expect(rowOf(LEDGER[0], TODAY)).toMatchObject({ date: '2026-10-15', daysLate: -6, passed: false });
    expect(rowOf(LEDGER[6], TODAY)).toBeNull();
    expect(rowOf(LEDGER[7], TODAY)).toBeNull();
  });
  it('passed first and oldest first; today apart; the rest by week, Monday to Sunday', () => {
    expect(tl.passed.map((r) => r.id)).toEqual(['DR-0640', 'DR-0700']);
    expect(tl.today.map((r) => r.id)).toEqual(['DR-0748']);
    expect(tl.weeks.map((w) => [w.start, w.end, w.label, w.rows.map((r) => r.id)])).toEqual([
      ['2026-10-12', '2026-10-18', '12 Oct to 18 Oct', ['DR-0809', 'DR-0831']],
      ['2026-10-19', '2026-10-25', '19 Oct to 25 Oct', ['DR-0827']],
    ]);
    expect(tl.weeks.every((w) => w.isThisWeek === false)).toBe(true);
    expect(tl.heaviest).toEqual({ start: '2026-10-12', label: '12 Oct to 18 Oct', count: 2 });
  });
  it('counts only what is there: dated, undated, total', () => {
    expect(tl.dated).toBe(6);
    expect(tl.undated).toBe(2);
    expect(tl.total).toBe(8);
    expect(timelineSummary(tl)).toBe('6 of 8 records carry a re-review date · 2 have passed and not been re-reviewed · 1 is due today · 3 ahead across 2 weeks · the heaviest week is 12 Oct to 18 Oct with 2.');
  });
  it('an empty ledger says so', () => {
    const e = buildReReviewTimeline([], TODAY);
    expect(e.total).toBe(0);
    expect(timelineSummary(e)).toBe('No records in this build.');
    expect(timelineSummary(buildReReviewTimeline([LEDGER[6]], TODAY))).toBe('0 of 1 records carry a re-review date · none has passed unreviewed · none ahead.');
  });
  it('a week that holds today reads as this week', () => {
    const t = buildReReviewTimeline([{ id: 'DR-0001', title: 'x', chain: { reReview: '2026-10-10' } }], TODAY);
    expect(t.weeks[0].isThisWeek).toBe(true);
  });
});

describe('the section, rendered', () => {
  const html = renderToStaticMarkup(createElement(ReReviewTimeline, { items: LEDGER, today: TODAY }));
  it('names the passed ones as passed, with the days, before anything else', () => {
    const passedAt = html.indexOf('Passed, not yet re-reviewed · 2');
    const todayAt = html.indexOf('Due today · 9 Oct · 1');
    const weekAt = html.indexOf('12 Oct to 18 Oct · 2');
    expect(passedAt).toBeGreaterThan(-1);
    expect(todayAt).toBeGreaterThan(passedAt);
    expect(weekAt).toBeGreaterThan(todayAt);
    expect(html).toContain('passed 8d');
    expect(html).toContain('passed 19d');
  });
  it('the first two weeks are open, later weeks fold, and the undated count is said', () => {
    expect((html.match(/<details[^>]*open/g) || []).length).toBe(2);
    expect(html).toContain('2 records carry no re-review date');
    expect(html).toContain('6 of 8 records carry a re-review date');
  });
  it('an empty ledger renders its own empty state, never a painted week', () => {
    const e = renderToStaticMarkup(createElement(ReReviewTimeline, { items: [], today: TODAY }));
    expect(e).toContain('No records in this build.');
    expect(e).not.toContain('<details');
  });
});
