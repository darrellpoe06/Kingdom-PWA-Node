// cohort-programs — proven-to-catch tests for the Academy cohort-operations
// model. Every assertion guards a doctrine promise: real-derived economics
// (nothing painted), honest payment math, the deepening schedule, the sourced
// ROI framing, and seed integrity. Pure lib → no DOM/localStorage to mock.
import { describe, it, expect } from 'vitest';
import {
  makeProgram, makeEnrollment, makeTeamMember, makeInterest, validateInterest,
  startReadiness, programFormats,
  defaultPaymentPlans, installmentSchedule, planById,
  enrollmentPaymentState, programStats, teamStats, breakEvenStudents,
  programSchedule, cycleProgress, trackROI, trackAccessTier, trackCatalog,
  validateEnrollment, validatePayment, mergeSeed,
  ACADEMY_TIERS, INDUSTRY_TRACKS, WEEKDAYS, ALL_OCCUPATIONS_MEDIAN_CENTS,
  SEED_PROGRAMS, SEED_ENROLLMENTS, SEED_TEAM, DEFAULT_TUITION_CENTS,
} from '../lib/cohort-programs.js';

const NOW = '2026-07-20T00:00:00.000Z';

const prog = (over = {}) => makeProgram({ id: 'p1', tuitionCents: 100000, capacity: 500, monthlyCostCents: 4200000, ...over }, { now: NOW });
const enr = (over = {}) => makeEnrollment({ programId: 'p1', studentName: 'A', status: 'enrolled', planId: 'full', ...over }, { now: NOW });

describe('cohort-programs — payment math (honest tuition + installments)', () => {
  it('installments sum EXACTLY to the plan total (no rounding drift)', () => {
    const plans = defaultPaymentPlans(100000); // $1,000
    const mo3 = plans.find((p) => p.id === 'mo3');
    const sched = installmentSchedule(mo3);
    expect(sched).toHaveLength(3);
    expect(sched.reduce((a, b) => a + b, 0)).toBe(mo3.totalCents);
  });

  it('balance owed = plan total minus real payments; paidInFull only when covered', () => {
    const p = prog();
    const partial = enr({ planId: 'mo3', payments: [{ amountCents: 40000, iso: NOW }] });
    const st = enrollmentPaymentState(partial, p);
    expect(st.totalCents).toBe(planById(p, 'mo3').totalCents);
    expect(st.paidCents).toBe(40000);
    expect(st.balanceCents).toBe(st.totalCents - 40000);
    expect(st.paidInFull).toBe(false);

    const full = enr({ planId: 'full', payments: [{ amountCents: 100000, iso: NOW }] });
    expect(enrollmentPaymentState(full, p).paidInFull).toBe(true);
  });

  it('a payment larger than the balance is rejected (no overpay)', () => {
    const p = prog();
    const e = enr({ payments: [{ amountCents: 90000, iso: NOW }] });
    expect(validatePayment(20000, e, p).ok).toBe(false); // only $100 left
    expect(validatePayment(10000, e, p).ok).toBe(true);
  });
});

describe('cohort-programs — start-readiness (minimum roster triggers a cohort)', () => {
  it('a program is FORMING below the minimum and READY at/above it', () => {
    const p = prog({ minStart: 10 });
    const nine = Array.from({ length: 9 }, (_, i) => enr({ id: `e${i}`, status: 'enrolled' }));
    let r = startReadiness(p, nine);
    expect(r.ready).toBe(false);
    expect(r.needed).toBe(1);
    expect(r.enrolledCount).toBe(9);
    r = startReadiness(p, [...nine, enr({ id: 'e9', status: 'enrolled' })]);
    expect(r.ready).toBe(true);
    expect(r.needed).toBe(0);
  });
  it('waitlisted / invited sign-ups do NOT count toward the start minimum', () => {
    const p = prog({ minStart: 3 });
    const r = startReadiness(p, [
      enr({ id: 'a', status: 'enrolled' }),
      enr({ id: 'b', status: 'waitlist' }),
      enr({ id: 'c', status: 'invited' }),
    ]);
    expect(r.enrolledCount).toBe(1);
    expect(r.ready).toBe(false);
  });
  it('defaults the minimum to 10 when unset', () => {
    expect(makeProgram({}, { now: NOW }).minStart).toBe(10);
  });
});

describe('cohort-programs — flexible delivery formats + $250 plan', () => {
  it('offers all three delivery formats by default; each keeps the full curriculum', () => {
    const p = makeProgram({}, { now: NOW });
    const ids = programFormats(p).map((f) => f.id);
    expect(ids).toEqual(['weekend-4h', 'afterschool-2h', 'dropin-1h']);
    expect(programFormats(p).find((f) => f.id === 'weekend-4h').hours).toBe(4);
  });
  it('the 4-payment plan is $250 increments at $1,000 tuition and sums to the total', () => {
    const plans = defaultPaymentPlans(100000);
    const four = plans.find((p) => p.id === 'mo4');
    expect(four.installments).toBe(4);
    const sched = installmentSchedule(four);
    expect(sched).toEqual([25000, 25000, 25000, 25000]); // $250 x 4
    expect(sched.reduce((a, b) => a + b, 0)).toBe(100000);
  });
});

describe('cohort-programs — economics are DERIVED from real records, nothing painted', () => {
  it('only seat-holding (enrolled) students count toward seats + committed revenue', () => {
    const p = prog({ capacity: 10 });
    const enrollments = [
      enr({ id: 'e1', status: 'enrolled', payments: [{ amountCents: 100000, iso: NOW }] }),
      enr({ id: 'e2', status: 'enrolled', payments: [] }),
      enr({ id: 'e3', status: 'waitlist' }),   // no seat
      enr({ id: 'e4', status: 'invited' }),    // no seat
      enr({ id: 'e5', status: 'withdrawn' }),  // no seat
    ];
    const s = programStats(p, enrollments);
    expect(s.enrolledCount).toBe(2);
    expect(s.waitlistCount).toBe(1);
    expect(s.seatsLeft).toBe(8);
    expect(s.committedCents).toBe(200000); // 2 enrolled x $1,000 plan
    expect(s.collectedCents).toBe(100000); // only one actually paid
    expect(s.outstandingCents).toBe(100000);
  });

  it('potential-at-capacity is capacity x tuition — a projection distinct from collected', () => {
    const p = prog({ capacity: 500, tuitionCents: 100000 });
    const s = programStats(p, [enr({ payments: [] })]);
    expect(s.potentialCents).toBe(500 * 100000); // $500,000 potential
    expect(s.collectedCents).toBe(0);            // and $0 actually collected
    expect(s.potentialCents).not.toBe(s.collectedCents);
  });

  it('age-band breakdown counts only real seat holders', () => {
    const p = prog();
    const s = programStats(p, [
      enr({ id: 'a', ageBandId: 'k-2', status: 'enrolled' }),
      enr({ id: 'b', ageBandId: 'k-2', status: 'enrolled' }),
      enr({ id: 'c', ageBandId: '9-12', status: 'enrolled' }),
      enr({ id: 'd', ageBandId: '9-12', status: 'waitlist' }), // excluded
    ]);
    expect(s.byAge['k-2']).toBe(2);
    expect(s.byAge['9-12']).toBe(1);
  });
});

describe('cohort-programs — team, ratio, break-even', () => {
  it('students-per-staff uses staff (not volunteers) and coverage flags uncovered days', () => {
    const p = prog();
    const team = [
      makeTeamMember({ id: 't1', programId: 'p1', name: 'Dir', roleId: 'director' }),
      makeTeamMember({ id: 't2', programId: 'p1', name: 'Mon', roleId: 'lead', trackDay: 'Monday' }),
      makeTeamMember({ id: 't3', programId: 'p1', name: 'Vol', roleId: 'volunteer' }),
    ];
    const ts = teamStats(p, team, 20);
    expect(ts.staffCount).toBe(2);       // director + lead
    expect(ts.volunteerCount).toBe(1);
    expect(ts.studentsPerStaff).toBe(10); // 20 / 2
    expect(ts.daysCovered).toBe(1);       // only Monday has a lead
  });

  it('break-even = ceil(monthly cost / tuition); null when no cost is set', () => {
    expect(breakEvenStudents(prog({ monthlyCostCents: 4200000, tuitionCents: 100000 }))).toBe(42);
    expect(breakEvenStudents(prog({ monthlyCostCents: 0 }))).toBe(null);
  });
});

describe('cohort-programs — the weekly deepening + cycle', () => {
  it('schedule is five weekdays, each with one focus per week (the deepening)', () => {
    const p = prog({ weeksPerCycle: 3 });
    const grid = programSchedule(p);
    expect(grid).toHaveLength(5);
    expect(grid.map((r) => r.day)).toEqual(WEEKDAYS);
    for (const row of grid) expect(row.weekFocuses).toHaveLength(3);
  });

  it('cycle phase: week 4 is the retrospective, before-start is scheduled', () => {
    const p = prog({ startIso: '2026-07-06T00:00:00.000Z', weeksPerCycle: 3 });
    // 2026-07-06 + ~22 days => week 4 (retro)
    expect(cycleProgress(p, '2026-07-28T00:00:00.000Z').phase).toBe('retro');
    expect(cycleProgress(p, '2026-07-08T00:00:00.000Z').phase).toBe('running');
    expect(cycleProgress(prog({ startIso: null }), NOW).phase).toBe('scheduled');
  });
});

describe('cohort-programs — the parent ROI framing (sourced, real)', () => {
  it('a career track exposes a real BLS median and a tuition-multiple; foundation track has none', () => {
    const ai = trackROI(trackCatalog('ai'), DEFAULT_TUITION_CENTS);
    expect(ai.medianCents).toBe(13308000);       // software developers, BLS May 2024
    expect(ai.yearsOfTuition).toBeGreaterThan(100); // $133k / $1k
    expect(ai.premiumOverAllJobsCents).toBe(13308000 - ALL_OCCUPATIONS_MEDIAN_CENTS);
    expect(trackROI(trackCatalog('faith'), DEFAULT_TUITION_CENTS)).toBe(null); // faith is not a salary line
  });

  it('every non-foundation track carries a sourced earning figure with a URL', () => {
    for (const t of INDUSTRY_TRACKS) {
      if (t.foundation || t.id === 'custom') continue;
      expect(t.earning, `track ${t.id} must have earning data`).toBeTruthy();
      expect(t.earning.medianCents).toBeGreaterThan(0);
      expect(t.earning.url).toMatch(/bls\.gov/);
    }
  });
});

describe('cohort-programs — the parent-facing invite pipeline', () => {
  it('interest capture requires a name and a valid email (a real pipeline end)', () => {
    expect(validateInterest({ parentName: '', email: 'a@b.com' }).ok).toBe(false);
    expect(validateInterest({ parentName: 'Parent', email: 'not-an-email' }).ok).toBe(false);
    expect(validateInterest({ parentName: 'Parent', email: 'parent@example.com' }).ok).toBe(true);
  });
  it('an interest normalizes to a real record tied to a program + age band', () => {
    const i = makeInterest({ programId: 'p1', parentName: 'Parent', email: 'p@x.com', childAgeBandId: '6-8' }, { now: NOW });
    expect(i.programId).toBe('p1');
    expect(i.childAgeBandId).toBe('6-8');
    expect(i.id).toMatch(/^int-/);
  });
});

describe('cohort-programs — the three-tier access ladder', () => {
  it('Yahweh is always free; cutting-edge is entry-tier; hands-on is the cohort', () => {
    const free = ACADEMY_TIERS.find((t) => t.id === 'free');
    expect(free.priceCents).toBe(0);
    expect(trackAccessTier('faith').id).toBe('free');       // faith => free
    expect(trackAccessTier('ai').id).toBe('digital');       // cutting-edge knowledge => entry tier
    expect(ACADEMY_TIERS.find((t) => t.id === 'hands-on').priceCents).toBe(100000);
  });
});

describe('cohort-programs — validation + seed integrity', () => {
  it('enrollment requires a name, an age band, and a valid plan', () => {
    const p = prog();
    expect(validateEnrollment({ studentName: '', ageBandId: 'k-2', planId: 'full' }, p).ok).toBe(false);
    expect(validateEnrollment({ studentName: 'X', ageBandId: 'nope', planId: 'full' }, p).ok).toBe(false);
    expect(validateEnrollment({ studentName: 'X', ageBandId: 'k-2', planId: 'full' }, p).ok).toBe(true);
  });

  it('seed rows are seed-prefixed and merge as baseline (user rows win by id)', () => {
    expect(SEED_PROGRAMS.every((p) => p.id.startsWith('seed-'))).toBe(true);
    expect(SEED_ENROLLMENTS.every((e) => e.id.startsWith('seed-'))).toBe(true);
    expect(SEED_TEAM.every((m) => m.id.startsWith('seed-'))).toBe(true);
    const merged = mergeSeed([{ id: 'seed-prog-flagship', name: 'Edited' }], SEED_PROGRAMS);
    expect(merged.find((p) => p.id === 'seed-prog-flagship').name).toBe('Edited'); // user wins
    expect(merged).toHaveLength(SEED_PROGRAMS.length); // no dup
  });

  it('the flagship seed renders real derived numbers (not painted)', () => {
    const p = SEED_PROGRAMS[0];
    const s = programStats(p, SEED_ENROLLMENTS);
    expect(s.enrolledCount).toBe(SEED_ENROLLMENTS.filter((e) => e.status === 'enrolled').length);
    expect(s.collectedCents).toBeGreaterThan(0);          // some sample payments are real
    expect(s.collectedCents).toBeLessThanOrEqual(s.committedCents); // never collect more than committed
    expect(s.potentialCents).toBe(500 * DEFAULT_TUITION_CENTS); // aspiration shown as projection
  });
});
