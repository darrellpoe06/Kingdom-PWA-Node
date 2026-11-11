// @vitest-environment node
// =============================================================================
// What waits in the lesson queue, read from the house's own count (DR-1360)
// =============================================================================
// The reader for infra/nas-loops/lesson-queue-census.py. The two failures it
// exists to make impossible, both of them real on 2026-11-10:
//
//   1. AN UNREAD QUEUE READING AS AN EMPTY ONE (DR-1186). The runner's road to
//      the NAS died with an expired key and `inbox-lessons-waiting.yml` failed
//      three runs straight. That workflow already records UNKNOWN rather than
//      zero; this reader must do the same, so an absent or unreadable census
//      never renders as "nothing is waiting".
//   2. A COUNT TAKEN UNDER A DIFFERENT QUESTION. A census taken that day used
//      an abbreviated exclusion list and counted rows a person had marked
//      not-a-lesson or WITHDRAWN (DR-1142) as work waiting to be built. The
//      census carries the list it used, and this reader names the difference
//      rather than showing the number as if it answered the house's question.
import { describe, it, expect } from 'vitest';
import {
  CENSUS_TAG,
  EXPECTED_EXCLUDES,
  LATE_AFTER_MIN,
  SILENT_AFTER_MIN,
  censusOf,
  censusStatus,
  definitionDrift,
  oldestWaitDays,
  fetchLessonQueueCensus,
} from '../lib/lesson-queue-census.js';

const AT = '2026-11-10T23:00:00Z';
const NOW = Date.parse('2026-11-10T23:05:00Z');
const body = (over = {}) =>
  JSON.stringify({
    at: AT,
    host: 'poetech',
    cycle: 'services-sync',
    total: 6,
    by_road: { 'thinking-space': 2, 'research-inbox': 3, other: 1 },
    by_shape: { plain: 2, 'build-failed': 3, 'voice-transcript': 1 },
    oldest_waiting: '2026-09-29T17:59:56Z',
    excludes: [...EXPECTED_EXCLUDES],
    ...over,
  });
const row = (over = {}) => ({ id: 'r1', body: body(over), tags: [CENSUS_TAG], created_at: AT });

describe('the census the NAS wrote', () => {
  it('parses the counts, the oldest wait and the definition it used', () => {
    const c = censusOf(row());
    expect(c.total).toBe(6);
    expect(c.host).toBe('poetech');
    expect(c.byRoad).toEqual({ 'thinking-space': 2, 'research-inbox': 3, other: 1 });
    expect(c.byShape['build-failed']).toBe(3);
    expect(c.oldest).toBe(Date.parse('2026-09-29T17:59:56Z'));
    expect(c.excludes).toEqual([...EXPECTED_EXCLUDES]);
  });

  it('drops counts that are not plain non-negative integers under safe names', () => {
    const c = censusOf(row({ by_road: { ok: 2, bad: -1, worse: 1.5, 'NOT A NAME': 3, nope: 'many' } }));
    expect(c.byRoad).toEqual({ ok: 2 });
  });

  it('says how long the oldest row has waited, in whole days', () => {
    expect(oldestWaitDays(censusOf(row()), NOW)).toBe(42);
    expect(oldestWaitDays(censusOf(row({ oldest_waiting: null })), NOW)).toBeNull();
    expect(oldestWaitDays(null, NOW)).toBeNull();
  });

  it('a body that is not the census reads as no census at all', () => {
    expect(censusOf(null)).toBeNull();
    expect(censusOf({ body: 'not json', created_at: '' })).toBeNull();
    expect(censusOf({ body: JSON.stringify({ total: 3 }), created_at: 'nonsense' })).toBeNull();
  });
});

describe('an unread queue is never an empty queue (DR-1186)', () => {
  it('no row at all reads as NEVER COUNTED, and says so', () => {
    const s = censusStatus(null, { now: NOW });
    expect(s.state).toBe('never');
    expect(s.total).toBeNull();
    expect(s.label).toMatch(/never counted/i);
    expect(s.label).not.toMatch(/\b0\b|none|empty/i);
    expect(s.kpi).toBe('attention');
  });

  it('a table that could not be read says why, and claims no number', () => {
    const s = censusStatus(null, { now: NOW, reason: 'permission denied' });
    expect(s.state).toBe('unreadable');
    expect(s.total).toBeNull();
    expect(s.label).toBe('Lesson queue unreadable: permission denied');
    expect(s.kpi).toBe('attention');
  });

  it('PROVEN TO CATCH: a genuinely empty queue is a DIFFERENT answer from an uncounted one', () => {
    const empty = censusStatus(row({ total: 0, by_road: {}, by_shape: {}, oldest_waiting: null }), { now: NOW });
    expect(empty.state).toBe('fresh');
    expect(empty.total).toBe(0);
    expect(empty.kpi).toBe('good');
    const uncounted = censusStatus(null, { now: NOW });
    expect(uncounted.total).toBeNull();
    expect(uncounted.kpi).toBe('attention');
    // The two must never render the same way.
    expect(empty.label).not.toBe(uncounted.label);
  });
});

describe('the count is judged against the clock, never assumed fresh', () => {
  it('within two cycles it is fresh and names the number and the oldest wait', () => {
    const s = censusStatus(row(), { now: NOW });
    expect(s.state).toBe('fresh');
    expect(s.total).toBe(6);
    expect(s.label).toMatch(/6 lesson row\(s\) waiting/);
    expect(s.label).toMatch(/oldest waiting 42 days/);
    expect(s.kpi).toBe('attention');
  });

  it('past two cycles it is late, past four it is stale', () => {
    const late = censusStatus(row(), { now: Date.parse(AT) + (LATE_AFTER_MIN + 5) * 60000 });
    expect(late.state).toBe('late');
    expect(late.kpi).toBe('attention');
    const stale = censusStatus(row(), { now: Date.parse(AT) + (SILENT_AFTER_MIN + 5) * 60000 });
    expect(stale.state).toBe('stale');
    expect(stale.kpi).toBe('problem');
    expect(stale.label).toMatch(/stale/);
  });

  it('a stale count still never presents its number as current', () => {
    const stale = censusStatus(row(), { now: Date.parse(AT) + 3 * 86400000 });
    expect(stale.state).toBe('stale');
    expect(stale.label).toMatch(/last counted 3 days ago/);
  });
});

describe('a count taken under a different question is named as such', () => {
  it('the house definition matches, so there is no drift', () => {
    expect(definitionDrift(censusOf(row()))).toBe('');
    expect(censusStatus(row(), { now: NOW }).drift).toBe('');
  });

  it('PROVEN TO CATCH: the exact 2026-11-10 mistake is named, not silently shown', () => {
    const shortened = EXPECTED_EXCLUDES.filter((t) => t !== 'not-a-lesson' && t !== 'withdrawn');
    const s = censusStatus(row({ excludes: shortened }), { now: NOW });
    expect(s.state).toBe('fresh');
    expect(s.drift).toBe('counted under a different question: it did not exclude not-a-lesson, withdrawn');
    // The number is still reported — but never without the difference beside it.
    expect(s.total).toBe(6);
  });

  it('names an extra exclusion too, so a narrower count is not read as the house question', () => {
    const s = censusStatus(row({ excludes: [...EXPECTED_EXCLUDES, 'voice'] }), { now: NOW });
    expect(s.drift).toMatch(/also excluded voice/);
  });

  it('a census with no definition at all is drift, not a match', () => {
    expect(definitionDrift(censusOf(row({ excludes: [] })))).toMatch(/did not exclude/);
  });
});

describe('reading the row', () => {
  it('asks for the newest census row by its tag', async () => {
    const calls = [];
    const q = {
      select() {
        return this;
      },
      contains(col, val) {
        calls.push([col, val]);
        return this;
      },
      order() {
        return this;
      },
      limit() {
        return Promise.resolve({ data: [row()], error: null });
      },
    };
    const supabase = {
      from(t) {
        calls.push(['from', t]);
        return q;
      },
    };
    const out = await fetchLessonQueueCensus({ supabase });
    expect(calls[0]).toEqual(['from', 'agent_inbox']);
    expect(calls[1]).toEqual(['tags', JSON.stringify([CENSUS_TAG])]);
    expect(out.reason).toBe('');
    expect(censusOf(out.row).total).toBe(6);
  });

  it('with no client, and on an error, it gives a reason and no row', async () => {
    expect(await fetchLessonQueueCensus({})).toEqual({ row: null, reason: 'no database client' });
    const supabase = {
      from() {
        return {
          select() {
            return this;
          },
          contains() {
            return this;
          },
          order() {
            return this;
          },
          limit: () => Promise.resolve({ data: null, error: { message: 'nope' } }),
        };
      },
    };
    expect(await fetchLessonQueueCensus({ supabase })).toEqual({ row: null, reason: 'nope' });
  });
});
