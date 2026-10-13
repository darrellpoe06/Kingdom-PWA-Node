// @vitest-environment node
//
// report-usage — the deterministic "learning" that ranks the standard KPI
// reports by how often the family uses them, so the most-used surfaces first
// (Darrell 2026-07-20). Proven-to-catch: ranking must be by usage DESC with a
// STABLE registry-order tiebreak, storage must be fail-soft, and malformed
// stored values must never poison the ranking.
import { describe, it, expect } from 'vitest';
import {
  loadReportUsage, bumpReportUsage, rankReports, STANDARD_REPORTS, REPORT_USAGE_KEY,
} from '../lib/report-usage.js';

// A minimal in-memory localStorage stand-in.
function memStore(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    _dump: () => Object.fromEntries(m),
  };
}
// A store that throws on every access (private mode / quota / disabled).
const throwingStore = {
  getItem() { throw new Error('blocked'); },
  setItem() { throw new Error('blocked'); },
};

describe('report-usage — learning ranks the most-used report first', () => {
  it('rankReports orders by usage DESC, stable on the registry order for ties', () => {
    const reports = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    // b used most, a and c tied at 0 → b first, then a, then c (registry order).
    const ranked = rankReports(reports, { b: 5 });
    expect(ranked.map((r) => r.id)).toEqual(['b', 'a', 'c']);
  });

  it('a tie never reshuffles — equal usage keeps original order (deterministic)', () => {
    const reports = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(rankReports(reports, { a: 3, b: 3, c: 3 }).map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(rankReports(reports, {}).map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('bump increments and persists; load reads it back', () => {
    const store = memStore();
    const u1 = bumpReportUsage('recurring', store, {});
    expect(u1.recurring).toBe(1);
    const u2 = bumpReportUsage('recurring', store, u1);
    expect(u2.recurring).toBe(2);
    // persisted, and load reflects it
    expect(loadReportUsage(store).recurring).toBe(2);
    // the most-used now ranks first among the real registry
    const ranked = rankReports(STANDARD_REPORTS.map((r) => ({ ...r })), loadReportUsage(store));
    expect(ranked[0].id).toBe('recurring');
  });

  it('is fail-soft: a throwing store never throws, load returns {}, bump returns prev', () => {
    expect(() => loadReportUsage(throwingStore)).not.toThrow();
    expect(loadReportUsage(throwingStore)).toEqual({});
    const prev = { material: 2 };
    expect(bumpReportUsage('material', throwingStore, prev).material).toBe(3); // still computes new map
    expect(() => bumpReportUsage('material', throwingStore, prev)).not.toThrow();
  });

  it('malformed / hostile stored values are dropped, not trusted', () => {
    expect(loadReportUsage(memStore({ [REPORT_USAGE_KEY]: 'not json' }))).toEqual({});
    expect(loadReportUsage(memStore({ [REPORT_USAGE_KEY]: '[1,2,3]' }))).toEqual({}); // array, not a map
    // negative / non-finite / zero counts are dropped; only positive ints survive
    const cleaned = loadReportUsage(memStore({ [REPORT_USAGE_KEY]: JSON.stringify({ a: -4, b: 0, c: 2.9, d: 3, e: 'x' }) }));
    expect(cleaned).toEqual({ c: 2, d: 3 });
  });

  it('bump with an empty/invalid id is a no-op (returns prev unchanged)', () => {
    const prev = { material: 1 };
    expect(bumpReportUsage('', memStore(), prev)).toBe(prev);
    expect(bumpReportUsage(null, memStore(), prev)).toBe(prev);
  });

  it('the registry is a known, non-empty set with stable ids', () => {
    expect(STANDARD_REPORTS.length).toBeGreaterThanOrEqual(3);
    for (const r of STANDARD_REPORTS) {
      expect(typeof r.id).toBe('string');
      expect(r.id.length).toBeGreaterThan(0);
      expect(typeof r.label).toBe('string');
    }
  });
});
