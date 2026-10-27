// @vitest-environment node
// =============================================================================
// A loop that ships nothing is not healthy, however ready it is (DR-1219)
// =============================================================================
// MEASURED ON OUR OWN WITNESS, 2026-10-26. Fifteen of Darrell's lesson rows sat
// in the in-app queue for up to 102 hours, every one claimed by the NAS
// builder, written, gated and FAILED inside two seconds, twice each. Nothing
// shipped for four days. `lesson-builder-health.yml` ran daily through all of
// it and printed "verdict passed -- nothing to diagnose", because it judges
// unit/stopped/writer-ready/credential and `--status` has no outcome field to
// report. The stale alarm rang five times on the oldest row; the witness wired
// to the `incident` label said green.
//
// So the cases below are weighted at that exact shape: READY AND PRODUCING
// NOTHING must never read as healthy, and an unread queue must never read as
// an empty one.
import { describe, it, expect } from 'vitest';
import {
  verdictOf, exitCodeOf, problemsOf,
  HEALTHY, DARK_IN_EFFECT, UNKNOWN, NOT_READY, ALARM_HOURS,
} from '../../../scripts/loop-produces-or-it-is-dark.mjs';

/** The live shape on 2026-10-26, from the witness log and the bell. */
const THE_REAL_FOUR_DAYS = {
  writerReady: true, waiting: 15, oldestWaitHours: 102, shippedLastDay: 0,
};

describe('verdictOf — readiness is not production', () => {
  it('PROVEN-TO-CATCH: ready with a starving queue is DARK, not healthy — the four days themselves', () => {
    // This is the precise input the health witness had available on each of the
    // four days it passed. Every readiness field was true; nothing shipped.
    const v = verdictOf(THE_REAL_FOUR_DAYS);
    expect(v.verdict, 'a ready loop that ships nothing is not healthy').toBe(DARK_IN_EFFECT);
    expect(v.why).toMatch(/READY AND PRODUCING NOTHING/);
    expect(v.why, 'it names the counts a reader needs').toMatch(/15 row\(s\) waiting, the oldest 102h/);
    expect(v.why, 'and says plainly why readiness did not save it').toMatch(/Readiness is not production/);
    expect(exitCodeOf(v.verdict), 'and it must not exit 0').not.toBe(0);
  });

  it('PROVEN-TO-CATCH: readiness ALONE can never reach healthy while the queue starves', () => {
    // The bug was readiness standing in for the outcome. No combination of
    // ready-flags may produce a pass when rows are past the alarm and nothing
    // shipped — only a real shipped count or a real empty queue can.
    for (const waiting of [1, 3, 15, 400]) {
      for (const oldest of [ALARM_HOURS, ALARM_HOURS + 1, 102]) {
        const v = verdictOf({ writerReady: true, waiting, oldestWaitHours: oldest, shippedLastDay: 0 });
        expect(v.verdict, `waiting=${waiting} oldest=${oldest}`).toBe(DARK_IN_EFFECT);
      }
    }
  });

  it('nothing waiting is the one honest silence', () => {
    const v = verdictOf({ writerReady: true, waiting: 0, oldestWaitHours: 0, shippedLastDay: 0 });
    expect(v.verdict).toBe(HEALTHY);
    expect(v.why).toMatch(/nothing is waiting, so nothing is owed/);
  });

  it('a queue inside the alarm is healthy — a row in flight is not a failure', () => {
    const v = verdictOf({ writerReady: true, waiting: 2, oldestWaitHours: 1, shippedLastDay: 0 });
    expect(v.verdict).toBe(HEALTHY);
    expect(v.why).toMatch(/inside the 4h alarm/);
  });

  it('a backlog that is moving is healthy — something shipped in the window', () => {
    const v = verdictOf({ ...THE_REAL_FOUR_DAYS, shippedLastDay: 3 });
    expect(v.verdict).toBe(HEALTHY);
    expect(v.why).toMatch(/3 shipped in the window/);
  });

  it('the alarm threshold is configurable and is applied as given', () => {
    const base = { writerReady: true, waiting: 1, oldestWaitHours: 6, shippedLastDay: 0 };
    expect(verdictOf({ ...base, alarmHours: 12 }).verdict, 'inside a wider alarm').toBe(HEALTHY);
    expect(verdictOf({ ...base, alarmHours: 2 }).verdict, 'past a tighter one').toBe(DARK_IN_EFFECT);
  });
});

describe('verdictOf — an unread queue is not an empty one', () => {
  it('PROVEN-TO-CATCH: a queue that could not be read is UNKNOWN, never healthy', () => {
    // DR-1186 / DR-0125, and the same rule DR-1210 pinned for the deploy
    // proof. The dangerous direction is a failed read becoming a zero.
    for (const waiting of [null, undefined, NaN, 'none']) {
      const v = verdictOf({ writerReady: true, waiting, oldestWaitHours: 10, shippedLastDay: 0 });
      expect(v.verdict, String(waiting)).toBe(UNKNOWN);
      expect(v.why).toMatch(/an unread queue is NOT an empty one/);
    }
  });

  it('an unreadable shipped count is UNKNOWN, not zero — zero would read as DARK', () => {
    // Worth keeping apart: a missing shipped count must not be assumed 0 and
    // raise a false alarm, any more than it may be assumed positive and hide a
    // real one. Either guess is a claim the witness did not measure.
    const v = verdictOf({ writerReady: true, waiting: 15, oldestWaitHours: 102, shippedLastDay: null });
    expect(v.verdict).toBe(UNKNOWN);
  });

  it('a waiting queue of unknown age is UNKNOWN', () => {
    const v = verdictOf({ writerReady: true, waiting: 15, oldestWaitHours: null, shippedLastDay: 0 });
    expect(v.verdict).toBe(UNKNOWN);
    expect(v.why).toMatch(/how long could not be read/);
  });

  it('unreadable readiness is UNKNOWN, and is not the same as not ready', () => {
    expect(verdictOf({ writerReady: null, waiting: 0, shippedLastDay: 0 }).verdict).toBe(UNKNOWN);
    expect(verdictOf({}).verdict).toBe(UNKNOWN);
    expect(verdictOf().verdict).toBe(UNKNOWN);
  });
});

describe('verdictOf — "it cannot build" and "every build fails" are different cures', () => {
  it('no writer ready is NOT_READY, kept apart from DARK', () => {
    const v = verdictOf({ writerReady: false, waiting: 15, oldestWaitHours: 102, shippedLastDay: 0 });
    expect(v.verdict).toBe(NOT_READY);
    expect(v.why).toMatch(/cannot build at all/);
    expect(NOT_READY).not.toBe(DARK_IN_EFFECT);
    expect(exitCodeOf(NOT_READY)).not.toBe(exitCodeOf(DARK_IN_EFFECT));
  });

  it('PROVEN-TO-CATCH: DARK says restarting the unit is not the cure', () => {
    // The wrong cure is the expensive part of a misread: on these inputs every
    // readiness field is already green, so a reader who treats DARK as a
    // readiness problem restarts a healthy unit and the gate keeps failing.
    const v = verdictOf(THE_REAL_FOUR_DAYS);
    expect(v.why).toMatch(/every writer can be ready while every build fails the gate/);
  });
});

describe('exitCodeOf — "producing nothing" is not "cannot build", and neither is a pass', () => {
  it('maps the outcomes to distinct codes', () => {
    expect(exitCodeOf(HEALTHY)).toBe(0);
    expect(exitCodeOf(DARK_IN_EFFECT)).toBe(1);
    expect(exitCodeOf(UNKNOWN)).toBe(2);
    expect(exitCodeOf(NOT_READY)).toBe(3);
    expect(new Set([0, 1, 2, 3]).size).toBe(4);
  });

  it('PROVEN-TO-CATCH: nothing unrecognised maps to 0', () => {
    for (const v of ['HEALTHY', 'pass', 'ok', '', null, undefined, 'passed']) {
      expect(exitCodeOf(v), `${String(v)} must not read as healthy`).not.toBe(0);
    }
  });
});

describe('problemsOf — it reinforces the existing judgement rather than replacing it', () => {
  it('gives the health witness a line for every non-pass, and none for a pass', () => {
    expect(problemsOf(verdictOf(THE_REAL_FOUR_DAYS))).toHaveLength(1);
    expect(problemsOf(verdictOf({ writerReady: false }))).toHaveLength(1);
    expect(problemsOf(verdictOf({}))).toHaveLength(1);
    expect(problemsOf(verdictOf({ writerReady: true, waiting: 0, shippedLastDay: 0 }))).toEqual([]);
    expect(problemsOf(null)).toEqual([]);
  });
});
