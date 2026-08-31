// =============================================================================
// health-program — the engine holds planned/actual apart and never shames
// =============================================================================
// Three things are pinned here, and they are the three Darrell stated as rules
// rather than features (2026-08-30):
//
//   1. PLANNED and ACTUAL never merge. Recording an actual weigh-in cannot move
//      a target; an un-recorded actual reads null, never the planned value and
//      never 0 (a painted number on a trust-bearing surface, DR-0076).
//   2. The roadmap he gave is internally consistent (202 - 2N), so a typo in the
//      26 hand-listed targets fails the build rather than shipping.
//   3. The language is neutral. deltaPhrase is the only place a difference from
//      target becomes words, so "behind"/"should have" cannot creep in surface
//      by surface.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  toDayKey, fromDayKey, daysBetween, addDays,
  weekForDay, weekRange, targetWeightFor,
  sortWeighIns, latestWeighIn, weighInForWeek,
  programProgress, deltaPhrase, waterTotalFor, waterProgress, roadmap, round1,
} from '../lib/health-program.js';
import { ROAD_TO_150, startProgram, plannedTotalLossLb, pdfPending } from '../lib/road-to-150-program.js';

// A program started on a known Monday, so week math is checkable by hand.
const P = startProgram('2026-09-07', ROAD_TO_150);

describe('the roadmap Darrell listed is internally consistent', () => {
  it('has one target per program week', () => {
    expect(P.weeklyTargets.length).toBe(P.weeks);
    expect(P.weeklyTargets.map((t) => t.week)).toEqual(
      Array.from({ length: 26 }, (_, i) => i + 1),
    );
  });

  it('every listed target equals startWeight - 2*week (a typo fails the build)', () => {
    for (const { week, targetWeightLb } of P.weeklyTargets) {
      expect(targetWeightLb, `week ${week}`).toBe(P.startWeightLb - 2 * week);
    }
  });

  it('lands exactly on the goal in the final week', () => {
    expect(targetWeightFor(P, 26)).toBe(P.goalWeightLb);
    expect(plannedTotalLossLb(P)).toBe(52);
  });
});

describe('dates and program weeks', () => {
  it('round-trips a day key through local midnight (never UTC-shifted)', () => {
    expect(toDayKey(fromDayKey('2026-09-07'))).toBe('2026-09-07');
    expect(fromDayKey('2026-09-07').getDate()).toBe(7);
  });
  it('counts whole days between keys, across a month boundary', () => {
    expect(daysBetween('2026-09-07', '2026-09-14')).toBe(7);
    expect(daysBetween('2026-08-30', '2026-09-01')).toBe(2);
  });
  it('numbers the first seven days as week 1', () => {
    expect(weekForDay(P, '2026-09-07')).toBe(1);
    expect(weekForDay(P, '2026-09-13')).toBe(1);
    expect(weekForDay(P, '2026-09-14')).toBe(2);
  });
  it('reads 0 before the start and past-the-end after the last week', () => {
    expect(weekForDay(P, '2026-09-06')).toBe(0);
    expect(weekForDay(P, addDays(P.startDate, 26 * 7))).toBe(27);
  });
  it('gives each week a seven-day range', () => {
    expect(weekRange(P, 1)).toEqual({ from: '2026-09-07', to: '2026-09-13' });
    expect(weekRange(P, 2).from).toBe('2026-09-14');
  });
  it('survives a garbage date instead of doing Invalid Date math', () => {
    expect(fromDayKey('not-a-date')).toBeNull();
    expect(daysBetween('2026-09-07', 'nope')).toBeNull();
    expect(weekForDay(P, null)).toBeNull();
  });
});

describe('actual never overwrites planned', () => {
  const weighIns = [{ day: '2026-09-13', weightLb: 199.4 }];

  it('leaves the week target untouched when an actual is recorded', () => {
    const before = targetWeightFor(P, 1);
    programProgress(P, weighIns, '2026-09-13');
    expect(targetWeightFor(P, 1)).toBe(before);
    expect(before).toBe(200);
  });

  it('reports actual and target as separate readings', () => {
    const p = programProgress(P, weighIns, '2026-09-13');
    expect(p.targetWeightLb).toBe(200);        // planned
    expect(p.currentWeightLb).toBe(199.4);     // actual
    expect(p.targetRunningLossLb).toBe(2);     // planned
    expect(p.actualRunningLossLb).toBe(2.6);   // actual
  });

  it('the program template is frozen against accidental writes', () => {
    expect(Object.isFrozen(ROAD_TO_150)).toBe(true);
    expect(Object.isFrozen(ROAD_TO_150.weeklyTargets)).toBe(true);
  });
});

describe('an unrecorded actual is null, never 0 and never the planned value', () => {
  it('returns nulls before the first weigh-in', () => {
    const p = programProgress(P, [], '2026-09-10');
    expect(p.currentWeightLb).toBeNull();
    expect(p.actualRunningLossLb).toBeNull();
    expect(p.remainingLb).toBeNull();
    expect(p.pctComplete).toBeNull();
    expect(p.deltaFromTargetLb).toBeNull();
  });
  it('still reports the PLANNED side, which is known', () => {
    const p = programProgress(P, [], '2026-09-10');
    expect(p.week).toBe(1);
    expect(p.targetWeightLb).toBe(200);
    expect(p.targetRunningLossLb).toBe(2);
    expect(p.startWeightLb).toBe(202);
    expect(p.goalWeightLb).toBe(150);
  });
});

describe('progress arithmetic', () => {
  const weighIns = [
    { day: '2026-09-13', weightLb: 199.4 },
    { day: '2026-09-20', weightLb: 200.4 },  // a gain week -- must not break
  ];
  it('uses the most recent weigh-in on or before today', () => {
    expect(programProgress(P, weighIns, '2026-09-15').currentWeightLb).toBe(199.4);
    expect(programProgress(P, weighIns, '2026-09-21').currentWeightLb).toBe(200.4);
  });
  it('computes lost / remaining / percent from the actual', () => {
    const p = programProgress(P, weighIns, '2026-09-13');
    expect(p.actualRunningLossLb).toBe(2.6);
    expect(p.remainingLb).toBe(49.4);
    expect(p.pctComplete).toBe(5);  // 2.6 / 52
  });
  it('floors the progress bar at 0% on a net gain rather than going negative', () => {
    const p = programProgress(P, [{ day: '2026-09-08', weightLb: 204 }], '2026-09-08');
    expect(p.actualRunningLossLb).toBe(-2);   // the real number is still told
    expect(p.pctComplete).toBe(0);            // the BAR just does not invert
  });
  it('rounds to one decimal without float dust', () => {
    expect(round1(0.15)).toBe(0.2);
    expect(round1(202 - 199.4)).toBe(2.6);
  });
});

describe('neutral language (Darrell: do NOT shame the user)', () => {
  it('phrases a miss as distance from target, not as failure', () => {
    expect(deltaPhrase(2.4)).toBe('2.4 lb from this week’s target');
    expect(deltaPhrase(-2.4)).toBe('2.4 lb from this week’s target');
  });
  it('says so plainly when the target is met exactly', () => {
    expect(deltaPhrase(0)).toBe('On this week’s target');
  });
  it('returns null rather than inventing a sentence with no data', () => {
    expect(deltaPhrase(null)).toBeNull();
    expect(deltaPhrase(NaN)).toBeNull();
  });
  it('never uses shaming or promissory words', () => {
    const forbidden = /behind|should have|failed|guaranteed|expected result|you will lose/i;
    for (const d of [5, 2.4, 0, -2.4, -5]) {
      expect(deltaPhrase(d)).not.toMatch(forbidden);
    }
  });
});

describe('water: a day rolls over without destroying history', () => {
  const entries = [
    { day: '2026-09-07', oz: 16, at: '2026-09-07T08:00:00Z' },
    { day: '2026-09-07', oz: 24, at: '2026-09-07T13:00:00Z' },
    { day: '2026-09-08', oz: 8,  at: '2026-09-08T08:00:00Z' },
  ];
  it('totals only the requested day', () => {
    expect(waterTotalFor(entries, '2026-09-07')).toBe(40);
    expect(waterTotalFor(entries, '2026-09-08')).toBe(8);
  });
  it('a new day reads 0 while yesterday is still in history', () => {
    expect(waterTotalFor(entries, '2026-09-09')).toBe(0);
    expect(waterTotalFor(entries, '2026-09-07')).toBe(40);  // preserved
  });
  it('reports actual against the goal, and when the goal is met', () => {
    const w = waterProgress(P, entries, '2026-09-07');
    expect(w.goalOz).toBe(64);
    expect(w.actualOz).toBe(40);
    expect(w.remainingOz).toBe(24);
    expect(w.met).toBe(false);
    expect(waterProgress(P, [{ day: 'd', oz: 70 }], 'd').met).toBe(true);
  });
  it('caps the ring at 100% when the user drinks past the goal', () => {
    expect(waterProgress(P, [{ day: 'd', oz: 96 }], 'd').pct).toBe(100);
  });
  it('ignores a blank entry instead of counting it as 0 oz', () => {
    // Number(null) and Number('') are both 0 -- a bare isFinite check would let
    // a half-filled custom-amount form count as a real (zero) entry.
    expect(waterTotalFor([{ day: 'd', oz: null }, { day: 'd', oz: '' }, { day: 'd', oz: 12 }], 'd'))
      .toBe(12);
  });
});

describe('roadmap feeds the graph and the week list from one derivation', () => {
  const weighIns = [
    { day: '2026-09-13', weightLb: 199.4 },
    { day: '2026-09-20', weightLb: 197.0 },
  ];
  const rows = roadmap(P, weighIns);

  it('returns every program week', () => {
    expect(rows.length).toBe(26);
  });
  it('pairs the planned target with the actual weigh-in for that week', () => {
    expect(rows[0]).toMatchObject({ week: 1, targetWeightLb: 200, actualWeightLb: 199.4 });
    expect(rows[1]).toMatchObject({ week: 2, targetWeightLb: 198, actualWeightLb: 197 });
  });
  it('leaves un-weighed weeks null so the actual line breaks instead of guessing', () => {
    expect(rows[2].actualWeightLb).toBeNull();
    expect(rows[2].targetWeightLb).toBe(196);   // the plan is still drawn
    expect(rows[2].weeklyChangeLb).toBeNull();
  });
  it('computes weekly change between recorded weigh-ins only', () => {
    expect(rows[0].weeklyChangeLb).toBeNull();   // nothing before it
    expect(rows[1].weeklyChangeLb).toBe(-2.4);
  });
  it('carries both running losses side by side', () => {
    expect(rows[1].targetRunningLossLb).toBe(4);
    expect(rows[1].actualRunningLossLb).toBe(5);
  });
});

describe('the PDF-sourced schedule is absent, not invented', () => {
  it('reports pdfPending until the day plan is imported', () => {
    expect(pdfPending(ROAD_TO_150)).toBe(true);
  });
  it('ships no fabricated meals, walks or workouts', () => {
    expect(ROAD_TO_150.days).toEqual([]);
    expect(ROAD_TO_150.meals).toEqual([]);
    expect(ROAD_TO_150.walkingSchedule).toEqual([]);
    expect(ROAD_TO_150.strengthSchedule).toEqual([]);
    expect(ROAD_TO_150.dataSource).toBe('pdf-pending');
  });
});

describe('weigh-in list handling', () => {
  it('sorts oldest first and drops unusable rows', () => {
    const sorted = sortWeighIns([
      { day: '2026-09-20', weightLb: 197 },
      { day: 'bad', weightLb: 1 },
      { day: '2026-09-13', weightLb: 199.4 },
      { day: '2026-09-14', weightLb: null },
    ]);
    expect(sorted.map((e) => e.day)).toEqual(['2026-09-13', '2026-09-20']);
  });
  it('finds the weigh-in inside a given week', () => {
    const w = weighInForWeek(P, [{ day: '2026-09-13', weightLb: 199.4 }], 1);
    expect(w.weightLb).toBe(199.4);
    expect(weighInForWeek(P, [{ day: '2026-09-13', weightLb: 199.4 }], 2)).toBeNull();
  });
  it('returns null latest when there are no weigh-ins at all', () => {
    expect(latestWeighIn([])).toBeNull();
    expect(latestWeighIn(null)).toBeNull();
  });
});

// =============================================================================
// canSeeHealthTab — the DOOR, not the data
// =============================================================================
// Regression pin. The first cut of the nav entry was ungated: on merge, every
// signed-in user -- church members, COLG, self-serve -- would have found a
// "Road to 150" weight-loss tab in their nav that was not theirs. RLS (0164)
// scopes the ROWS and never had this problem; the tab was the leak.
//
// The surfaces.js registry ALSO claimed `gate: 'family/governor'` while the
// render applied none, so the registry was documenting a gate that did not
// exist -- the "looks reviewed but isn't" class DR-0076 exists to stop.
import { canSeeHealthTab } from '../lib/health-program.js';

describe('canSeeHealthTab — the tab is earned by real state', () => {
  it('CLOSES for a signed-in non-steward with no program (the original bug)', () => {
    expect(canSeeHealthTab(false, [])).toBe(false);
    expect(canSeeHealthTab(false, null)).toBe(false);
    expect(canSeeHealthTab(false, undefined)).toBe(false);
  });

  it('opens for a steward, who can start a program', () => {
    expect(canSeeHealthTab(true, [])).toBe(true);
  });

  it('opens for a non-steward actually enrolled — the admin-programs future', () => {
    expect(canSeeHealthTab(false, [{ id: 'p1' }])).toBe(true);
    expect(canSeeHealthTab(false, [{ id: 'p1', active: true }])).toBe(true);
  });

  it('stays closed when the only program is retired', () => {
    expect(canSeeHealthTab(false, [{ id: 'p1', active: false }])).toBe(false);
  });

  it('ignores malformed rows rather than opening on them', () => {
    expect(canSeeHealthTab(false, [null, undefined])).toBe(false);
  });
});
