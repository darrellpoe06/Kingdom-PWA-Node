// @vitest-environment node
//
// extractClassRoster — a parishioner's "I want to join" rides the cross-tenant
// FEEDBACK pipe so it reaches the Governor even from another instance. These prove
// the roster is pulled from the REAL merged feedback stream (local + remote), the
// tag marks only class-interest rows (not other feedback), the name is recovered,
// and a row that appears in both local and remote isn't double-counted.
import { describe, it, expect } from 'vitest';
import { extractClassRoster, CLASS_INTEREST_TAG } from '../lib/church-classes.js';

const interest = (who, extra = {}) => ({ text: `${CLASS_INTEREST_TAG} ${who} wants to join the youth A.I. class.`, ...extra });

describe('extractClassRoster', () => {
  it('returns only class-interest rows, not other feedback', () => {
    const feed = [
      interest('Jayden', { id: 'a', createdAt: '2026-06-16T00:00:00Z' }),
      { id: 'b', text: 'The buttons are too small', createdAt: '2026-06-16' }, // unrelated feedback
      interest('Maria', { id: 'c', submittedAt: '2026-06-15T00:00:00Z' }),
    ];
    const r = extractClassRoster(feed);
    expect(r).toHaveLength(2);
    expect(r.map((x) => x.who).sort()).toEqual(['Jayden', 'Maria']);
  });

  it('recovers the name from the tagged text', () => {
    const [row] = extractClassRoster([interest('Jayden', { id: 'x', createdAt: '2026-06-16T12:00:00Z' })]);
    expect(row.who).toBe('Jayden');
    expect(row.at).toBe('2026-06-16T12:00:00Z');
  });

  it('falls back to displayName when the text has no name', () => {
    const [row] = extractClassRoster([{ id: 'y', text: `${CLASS_INTEREST_TAG}  wants to join the youth A.I. class.`, displayName: 'mrspoe06' }]);
    expect(row.who).toBe('mrspoe06');
  });

  it('does not double-count a row present by the same id', () => {
    const row = interest('Jayden', { id: 'dup', createdAt: '2026-06-16' });
    expect(extractClassRoster([row, row])).toHaveLength(1);
  });

  it('is empty for an empty / missing feed', () => {
    expect(extractClassRoster([])).toEqual([]);
    expect(extractClassRoster(null)).toEqual([]);
  });
});
