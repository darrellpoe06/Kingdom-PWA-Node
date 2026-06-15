// @vitest-environment node
//
// church-classes — the timeline math behind the COLG youth A.I. class must be
// REAL, never painted (DR-0076). These prove: week dates compute from the cohort
// start, the weekday reported is the true day of the chosen start (a wrong start
// shows the wrong day, it does not lie), a missing start yields null (the UI then
// says "set a date"), and a student's progress is counted from their real record.
import { describe, it, expect } from 'vitest';
import {
  MODULES, CLASS_META, PROPOSED_COHORT_START,
  weekToDate, weekday, buildSchedule, progressSummary, toMs,
} from '../lib/church-classes.js';

describe('curriculum shape', () => {
  it('has the full 8-week module set with anchors', () => {
    expect(MODULES).toHaveLength(CLASS_META.weeks);
    expect(MODULES.every((m) => m.id && m.title && m.bigIdea && m.inApp && m.anchor?.ref)).toBe(true);
  });
});

describe('timeline is computed, not painted', () => {
  it('weekToDate steps forward one cadence per week from the start', () => {
    const wk1 = weekToDate('2026-07-11', 0);
    const wk3 = weekToDate('2026-07-11', 2);
    expect(wk1.toISOString().slice(0, 10)).toBe('2026-07-11');
    // two weeks later = +14 days
    expect(Math.round((wk3 - wk1) / 86400000)).toBe(14);
  });
  it('reports the TRUE weekday of the start (a wrong day is not hidden)', () => {
    // 2026-07-11 is a Saturday; 2026-07-12 is a Sunday — the function must tell the truth.
    expect(weekday(weekToDate('2026-07-11', 0))).toBe('Saturday');
    expect(weekday(weekToDate('2026-07-12', 0))).toBe('Sunday');
  });
  it('returns null for a missing/bad start so the UI never shows a fake date', () => {
    expect(weekToDate(null, 0)).toBe(null);
    expect(weekToDate('not-a-date', 0)).toBe(null);
    expect(toMs('')).toBe(null);
  });
  it('the proposed default start is a real, parseable Saturday', () => {
    expect(weekday(weekToDate(PROPOSED_COHORT_START, 0))).toBe('Saturday');
  });
  it('buildSchedule yields one dated row per module, in order', () => {
    const rows = buildSchedule('2026-07-11');
    expect(rows).toHaveLength(8);
    expect(rows[0].week).toBe(1);
    expect(rows[7].week).toBe(8);
    expect(rows[0].weekday).toBe('Saturday');
  });
});

describe('student progress counts the real record', () => {
  it('an empty record is 0%', () => {
    expect(progressSummary({})).toEqual({ done: 0, total: 8, pct: 0 });
  });
  it('counts only modules actually marked done', () => {
    const p = { [MODULES[0].id]: '2026-07-11T00:00:00Z', [MODULES[1].id]: '2026-07-18T00:00:00Z' };
    const s = progressSummary(p);
    expect(s.done).toBe(2);
    expect(s.pct).toBe(25);
  });
});
