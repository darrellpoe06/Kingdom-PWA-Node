// @vitest-environment node
// =============================================================================
// The goal, the gap, and the date this pace reaches it (DR-1422)
// =============================================================================
// Darrell, 2026-11-11: "Fully completed courses... x amount x to go... on pace
// for completing by x date at this pace".
//
// The two failures these checks exist to make impossible:
//   1. A DATE INVENTED FROM NOTHING. One finished lesson is not a pace. A
//      projection with no basis is the painted number DR-0061/P15 forbids, and
//      it is worse than silence because a reader plans around it.
//   2. READ COUNTED AS DONE. "Read and tested" is his definition. A lesson
//      read but never tested, or passed before it was ever read, must not
//      close a course — the second case is already its own figure (DR-1386).
import { describe, it, expect } from 'vitest';
import { standing, pace, courseStanding, doneAt, masteredAt, MIN_FOR_PACE } from '../lib/course-pace.js';

const DAY = 86400000;
const T0 = Date.UTC(2026, 9, 1, 12, 0, 0);
const iso = (t) => new Date(t).toISOString();
/** A record: read at `read`, attempts at the given [offsetDays, pct] pairs. */
const rec = (courseKey, lessonId, read, attempts = []) => ({
  courseKey,
  lessonId,
  completedAt: read === null ? null : iso(read),
  quizHistory: attempts.map(([t, pct]) => ({ at: iso(t), pct, passed: pct >= 70 })),
});
const IDS = { alpha: ['a1', 'a2'], beta: ['b1'] };

describe('done means read AND tested', () => {
  it('a lesson read and passed is done, at the later of the two moments', () => {
    expect(doneAt(rec('alpha', 'a1', T0, [[T0 + DAY, 100]]))).toBe(T0 + DAY);
    expect(doneAt(rec('alpha', 'a1', T0 + DAY, [[T0, 100]]))).toBe(T0 + DAY);
  });

  it('PROVEN TO CATCH: read but never tested is NOT done, and never closes a course', () => {
    expect(doneAt(rec('alpha', 'a1', T0, []))).toBeNull();
    const s = standing([rec('alpha', 'a1', T0, []), rec('alpha', 'a2', T0, [])], { alpha: IDS.alpha });
    expect(s.lessonsDone).toBe(0);
    expect(s.coursesComplete).toBe(0);
    expect(s.courses[0].complete).toBe(false);
  });

  it('PROVEN TO CATCH: tested but never read is NOT done either', () => {
    expect(doneAt(rec('alpha', 'a1', null, [[T0, 100]]))).toBeNull();
    expect(standing([rec('alpha', 'a1', null, [[T0, 100]])], { alpha: IDS.alpha }).lessonsDone).toBe(0);
  });

  it('a failed exam is not a pass', () => {
    expect(doneAt(rec('alpha', 'a1', T0, [[T0 + DAY, 50]]))).toBeNull();
  });
});

describe('mastery at 100% is counted beside done, never folded into it', () => {
  it('a pass under 100 is done but not mastered', () => {
    const r = rec('alpha', 'a1', T0, [[T0 + DAY, 80]]);
    expect(doneAt(r)).not.toBeNull();
    expect(masteredAt(r)).toBeNull();
  });

  it('every answer right is mastered, and both figures show', () => {
    const s = standing([rec('alpha', 'a1', T0, [[T0 + DAY, 100]]), rec('alpha', 'a2', T0, [[T0 + DAY, 80]])], { alpha: IDS.alpha });
    expect(s.lessonsDone).toBe(2);
    expect(s.mastered).toBe(1);
  });
});

describe('fully completed courses, and how many to go', () => {
  it('counts the courses whose every lesson is read and tested', () => {
    const s = standing(
      [rec('alpha', 'a1', T0, [[T0, 100]]), rec('alpha', 'a2', T0, [[T0, 100]]), rec('beta', 'b1', T0, [])],
      IDS,
    );
    expect(s.coursesTotal).toBe(2);
    expect(s.coursesComplete).toBe(1);
    expect(s.coursesToGo).toBe(1);
    expect(s.lessonsTotal).toBe(3);
    expect(s.lessonsDone).toBe(2);
    expect(s.lessonsToGo).toBe(1);
  });

  it('PROVEN TO CATCH: a course whose lesson ids are unknown is not counted as reached', () => {
    // An unknown goal must never read as a met one.
    const s = standing([rec('ghost', 'g1', T0, [[T0, 100]])], { ghost: [] });
    expect(s.coursesTotal).toBe(0);
    expect(s.coursesComplete).toBe(0);
    expect(s.lessonsTotal).toBe(0);
  });

  it('a lesson not in the course’s list does not inflate the count', () => {
    const s = standing([rec('beta', 'not-in-course', T0, [[T0, 100]])], { beta: IDS.beta });
    expect(s.lessonsDone).toBe(0);
    expect(s.courses[0].toGo).toBe(1);
  });
});

describe('the date is measured, or it is not given', () => {
  it('PROVEN TO CATCH: one finished lesson yields NO date and says why', () => {
    const s = standing([rec('alpha', 'a1', T0, [[T0, 100]])], IDS);
    const p = pace(s, T0 + 10 * DAY);
    expect(p.finishAt).toBeNull();
    expect(p.perWeek).toBeNull();
    expect(p.why).toMatch(/two are needed before a pace can be measured/);
    expect(MIN_FOR_PACE).toBe(2);
  });

  it('PROVEN TO CATCH: finished lessons all in one moment yield no date', () => {
    const s = standing([rec('alpha', 'a1', T0, [[T0, 100]]), rec('alpha', 'a2', T0, [[T0, 100]])], IDS);
    const p = pace(s, T0);
    expect(p.finishAt).toBeNull();
    expect(p.why).toMatch(/more than one day/);
  });

  it('projects from this learner’s own rate: two in ten days, one to go, ten days out', () => {
    const s = standing(
      [rec('alpha', 'a1', T0, [[T0, 100]]), rec('alpha', 'a2', T0 + 10 * DAY, [[T0 + 10 * DAY, 100]]), rec('beta', 'b1', T0, [])],
      IDS,
    );
    const now = T0 + 10 * DAY;
    const p = pace(s, now);
    expect(p.basisCount).toBe(2);
    expect(p.basisDays).toBe(10);
    expect(p.perWeek).toBe(0.7); // one lesson per ten days
    // one lesson to go at one per ten days
    expect(Math.round((p.finishAt - now) / DAY)).toBe(10);
  });

  it('a finished record offers no date, and says it is finished', () => {
    const s = standing([rec('beta', 'b1', T0, [[T0, 100]])], { beta: IDS.beta });
    const p = pace(s, T0 + DAY);
    expect(s.lessonsToGo).toBe(0);
    expect(p.finishAt).toBeNull();
    expect(p.why).toMatch(/every lesson on every course is read and tested/);
  });

  it('PROVEN TO CATCH: an unreachable pace says so instead of naming a year in the next century', () => {
    // Two lessons a decade apart, many to go: a precise date would be absurd.
    const many = Array.from({ length: 400 }, (_, i) => `x${i}`);
    const s = standing([rec('big', 'x0', T0, [[T0, 100]]), rec('big', 'x1', T0 + 3650 * DAY, [[T0 + 3650 * DAY, 100]])], { big: many });
    const p = pace(s, T0 + 3650 * DAY);
    expect(p.far).toBe(true);
    expect(p.finishAt).toBeNull();
    expect(p.perWeek).toBeGreaterThan(0);
  });
});

describe('the whole answer in one call', () => {
  it('carries the standing and the pace together', () => {
    const out = courseStanding([rec('alpha', 'a1', T0, [[T0, 100]]), rec('alpha', 'a2', T0 + 2 * DAY, [[T0 + 2 * DAY, 100]])], IDS, T0 + 2 * DAY);
    expect(out.coursesComplete).toBe(1);
    expect(out.coursesToGo).toBe(1);
    expect(out.pace.basisCount).toBe(2);
    expect(out.pace.finishAt).toBeGreaterThan(T0);
  });

  it('no records at all: no date, no zero pretending to be an answer', () => {
    const out = courseStanding([], IDS, T0);
    expect(out.lessonsDone).toBe(0);
    expect(out.coursesComplete).toBe(0);
    expect(out.pace.finishAt).toBeNull();
    expect(out.pace.why).toMatch(/0 lessons read and tested so far/);
  });
});

describe('a real rate never renders as none', () => {
  it('PROVEN TO CATCH: a slow pace keeps significant figures instead of rounding to zero', async () => {
    const { roundRate } = await import('../lib/course-pace.js');
    expect(roundRate(0.0019230769)).toBeCloseTo(0.0019, 5);
    expect(roundRate(0.7)).toBe(0.7);
    expect(roundRate(3.46)).toBe(3.5);
    // The defect this replaces: one decimal place made a real rate read as none.
    expect(Math.round(0.0019230769 * 10) / 10).toBe(0);
    expect(roundRate(0.0019230769)).toBeGreaterThan(0);
    // Stopped is still zero, and must stay distinguishable from slow.
    expect(roundRate(0)).toBe(0);
  });
});

describe('a record that keeps only the summary columns still counts', () => {
  it('PROVEN TO CATCH: an empty quizHistory with quizPassed is a pass, not a false zero', async () => {
    const { doneAt: d, masteredAt: m, attemptsOf } = await import('../lib/course-pace.js');
    const summary = { courseKey: 'alpha', lessonId: 'a1', completedAt: iso(T0), quizHistory: [], quizPassed: true, quizPct: 100, quizAt: iso(T0 + DAY) };
    // Reading only the array is the defect this replaces.
    expect(summary.quizHistory.length).toBe(0);
    expect(attemptsOf(summary)).toHaveLength(1);
    expect(d(summary)).toBe(T0 + DAY);
    expect(m(summary)).toBe(T0 + DAY);
    // A summary that did not pass is still not done.
    expect(d({ ...summary, quizPassed: false, quizPct: 40 })).toBeNull();
  });
});
