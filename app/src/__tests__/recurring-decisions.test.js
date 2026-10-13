// @vitest-environment node
//
// recurring-decisions — the keep/review/cancel audit on the auto-detected
// Recurring payments KPI. Proven-to-catch: set + persist + toggle-off, the
// potential-savings math (review+cancel amounts), fail-soft on a broken store,
// and hostile/unknown values dropped.
import { describe, it, expect } from 'vitest';
import {
  loadRecurringDecisions, setRecurringDecision, summarizeDecisions, RECURRING_DECISIONS_KEY,
} from '../lib/recurring-decisions.js';

function memStore(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}
const throwing = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };

describe('recurring-decisions', () => {
  it('set persists a decision; load reads it back', () => {
    const store = memStore();
    const m = setRecurringDecision('wf-mtg', 'cancel', store, {});
    expect(m['wf-mtg']).toBe('cancel');
    expect(loadRecurringDecisions(store)['wf-mtg']).toBe('cancel');
  });

  it('setting the SAME decision again toggles it off (back to undecided)', () => {
    const store = memStore();
    let m = setRecurringDecision('netflix', 'review', store, {});
    expect(m.netflix).toBe('review');
    m = setRecurringDecision('netflix', 'review', store, m); // toggle off
    expect(m.netflix).toBeUndefined();
    expect(loadRecurringDecisions(store).netflix).toBeUndefined();
  });

  it('potential savings sums REVIEW + CANCEL amounts; keep does not count', () => {
    const patterns = [
      { key: 'a', amount: 100 }, // cancel
      { key: 'b', amount: 40 },  // review
      { key: 'c', amount: 2623 }, // keep
      { key: 'd', amount: 15 },  // undecided
    ];
    const decisions = { a: 'cancel', b: 'review', c: 'keep' };
    const s = summarizeDecisions(patterns, decisions);
    expect(s.total).toBe(2778);
    expect(s.keep).toBe(1);
    expect(s.review).toBe(1);
    expect(s.cancel).toBe(1);
    expect(s.undecided).toBe(1);
    expect(s.flagged).toBe(2);
    expect(s.potentialSavings).toBe(140); // 100 + 40, not the kept 2623
  });

  it('is fail-soft on a throwing store and drops hostile values', () => {
    expect(() => loadRecurringDecisions(throwing)).not.toThrow();
    expect(loadRecurringDecisions(throwing)).toEqual({});
    expect(loadRecurringDecisions(memStore({ [RECURRING_DECISIONS_KEY]: JSON.stringify({ a: 'keep', b: 'nonsense', c: 5 }) }))).toEqual({ a: 'keep' });
    expect(setRecurringDecision('', 'keep', memStore(), { x: 'keep' })).toEqual({ x: 'keep' }); // empty key = no-op
  });

  it('empty inputs summarize to zeros (no throw)', () => {
    expect(summarizeDecisions([], {})).toEqual({ total: 0, keep: 0, review: 0, cancel: 0, undecided: 0, flagged: 0, potentialSavings: 0 });
    expect(summarizeDecisions()).toMatchObject({ total: 0, flagged: 0 });
  });
});
