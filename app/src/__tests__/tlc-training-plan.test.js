import { describe, it, expect } from 'vitest';
import { allCourses, makeCourse } from '../lib/tlc-training-library.js';
import {
  buildTrainingPlan, rotateByField, monthLabel, planToRequirementNote,
  DEFAULT_HOURS_PER_MONTH,
} from '../lib/tlc-training-plan.js';

describe('training plan — 24 hrs/month, multi-year, non-repeating, by field', () => {
  const plan = buildTrainingPlan(allCourses(), { hoursPerMonth: 24, months: 36, startISO: '2026-07-01T00:00:00Z' });

  it('targets 24 hours per month across 36 months by default args', () => {
    expect(plan.hoursPerMonth).toBe(24);
    expect(plan.months).toBe(36);
    expect(plan.plan.length).toBe(36);
    expect(DEFAULT_HOURS_PER_MONTH).toBe(24);
  });

  it('PROVEN-TO-CATCH: NO course is scheduled twice across the whole plan', () => {
    const scheduledIds = plan.plan.flatMap((m) => m.courses.map((c) => c.id));
    expect(new Set(scheduledIds).size).toBe(scheduledIds.length);
  });

  it('no scheduled month exceeds the 24-hour target', () => {
    for (const m of plan.plan) expect(m.hours).toBeLessThanOrEqual(24);
  });

  it('a covered month rotates across MULTIPLE fields (not lopsided to one)', () => {
    const covered = plan.plan.filter((m) => m.courses.length >= 2);
    expect(covered.length).toBeGreaterThan(0);
    // At least one filled month draws on more than one field.
    expect(covered.some((m) => m.fields.length >= 2)).toBe(true);
  });

  it('reports an HONEST runway + shortfall — gaps surfaced, not painted', () => {
    expect(plan.summary.libraryHours).toBeGreaterThan(0);
    expect(plan.summary.runwayMonths).toBe(Math.floor(plan.summary.libraryHours / 24));
    // The multi-year target exceeds the current library, so there is a real shortfall.
    expect(plan.summary.targetHours).toBe(24 * 36);
    expect(plan.summary.shortfallTotal).toBeGreaterThan(0);
    // Later months are honest open gaps (no painted content).
    const lastMonth = plan.plan[plan.plan.length - 1];
    expect(lastMonth.courses.length).toBe(0);
    expect(lastMonth.shortfallHours).toBe(24);
  });

  it('scheduled hours never exceed what the library actually supplies (no fabrication)', () => {
    expect(plan.summary.scheduledHours).toBeLessThanOrEqual(plan.summary.libraryHours + 0.01);
  });

  it('byField rollup covers all ten fields', () => {
    expect(plan.summary.byField.length).toBe(10);
    expect(plan.summary.byField.every((f) => f.available >= 1)).toBe(true);
  });

  it('a bigger library extends coverage with the SAME plan (the YouTube/SME path grows it)', () => {
    const extra = Array.from({ length: 40 }, (_, i) =>
      makeCourse({ id: `extra-${i}`, field: 'Documentation', title: `Extra ${i}`, trainingHours: 3 }));
    const bigger = buildTrainingPlan([...allCourses(), ...extra], { hoursPerMonth: 24, months: 36 });
    expect(bigger.summary.monthsFullyCovered).toBeGreaterThan(plan.summary.monthsFullyCovered);
  });
});

describe('approved-only scheduling', () => {
  it('isApproved predicate restricts the plan to publishable courses', () => {
    const approvedIds = new Set(allCourses().slice(0, 3).map((c) => c.id));
    const plan = buildTrainingPlan(allCourses(), { isApproved: (c) => approvedIds.has(c.id) });
    const scheduled = plan.plan.flatMap((m) => m.courses.map((c) => c.id));
    for (const id of scheduled) expect(approvedIds.has(id)).toBe(true);
  });
});

describe('helpers', () => {
  it('rotateByField interleaves fields so consecutive picks differ where possible', () => {
    const ordered = rotateByField(allCourses());
    expect(ordered.length).toBe(allCourses().length);
    let adjacentSameField = 0;
    for (let i = 1; i < ordered.length; i += 1) if (ordered[i].field === ordered[i - 1].field) adjacentSameField += 1;
    // Rotation keeps most neighbors in different fields.
    expect(adjacentSameField).toBeLessThan(ordered.length / 2);
  });

  it('monthLabel derives Year/Month + calendar from the start date', () => {
    expect(monthLabel('2026-07-01T00:00:00Z', 0)).toMatch(/Year 1 · Month 1 \(Jul 2026\)/);
    expect(monthLabel('2026-07-01T00:00:00Z', 12)).toMatch(/Year 2 · Month 1 \(Jul 2027\)/);
  });

  it('planToRequirementNote is honest about the runway', () => {
    const plan = buildTrainingPlan(allCourses(), {});
    expect(planToRequirementNote(plan)).toMatch(/runway|author/i);
  });
});
