// =============================================================================
// tlc-training-plan — the 24-hours-per-month, multi-year TRAINING MAP
// =============================================================================
// Declared by Darrell 2026-06-29 (deliverable #3): organize the course library so it
// SUPPLIES 24 training hours per MONTH for a TLC MSW student, across MULTIPLE YEARS,
// NON-REPEATING, BY FIELD — mapped to the Illinois MSW → LCSW training record.
//
// This is the PURE scheduler over lib/tlc-training-library.js. It lays a multi-year,
// 24-hours/month plan that:
//   * never repeats a course (each course is scheduled at most once),
//   * ROTATES across the ten fields so a student grows broadly, not lopsidedly,
//   * fills each month toward the 24-hour target from the available library, and
//   * is HONEST about the runway: when the real library runs short of a month's
//     target, the remaining hours are surfaced as a `shortfallHours` GAP — never
//     painted with content that doesn't exist (DR-0076). The gap is exactly the work
//     the YouTube-distill path (lib/tlc-course-ingest.js) + Christina-authored
//     courses fill: as the library grows, the same plan covers more months.
//
// MAPPING TO THE IL REQUIREMENT (honest, no moralizing): these are professional-
// development TRAINING hours. The plan reports how the training-hours record
// accumulates month over month; the supervised CLINICAL (client-facing) hours that
// make up the bulk of the IL experience target are a separate bucket logged in the
// supervised-hours ledger (lib/practice-academy.js). The plan COMPLEMENTS that
// ledger — it does not claim to satisfy the clinical-hours requirement by itself.
//
// PURE + DETERMINISTIC: the caller passes `startISO` (month labels derive from it);
// no Date.now() / Math.random(). Same inputs → same plan, so it is fully testable.
// =============================================================================
import {
  TRAINING_FIELDS, allCourses, courseTrainingHours, libraryByField,
} from './tlc-training-library.js';

export const DEFAULT_HOURS_PER_MONTH = 24;
export const DEFAULT_PLAN_MONTHS = 36; // three years

// Month label like "Year 1 · Month 3 (Sep 2026)" — derived from a start ISO date.
// Pure; falls back to a plain "Month N" when startISO is missing/invalid.
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function monthLabel(startISO, index) {
  const year = Math.floor(index / 12) + 1;
  const monthInYear = (index % 12) + 1;
  let calendar = '';
  if (startISO) {
    const d = new Date(startISO);
    if (!isNaN(d.getTime())) {
      const m = (d.getUTCMonth() + index) % 12;
      const y = d.getUTCFullYear() + Math.floor((d.getUTCMonth() + index) / 12);
      calendar = ` (${MONTH_NAMES[m]} ${y})`;
    }
  }
  return `Year ${year} · Month ${monthInYear}${calendar}`;
}

// ---------------------------------------------------------------------------
// Order the library so consecutive picks ROTATE across fields. We round-robin the
// fields, taking one not-yet-used course from each in turn, so a flat scheduler that
// just fills months in order naturally spreads fields across (and within) months.
// Within a field, larger courses come first so months pack tightly toward 24h.
// Pure + deterministic (stable sort by hours desc, then id).
// ---------------------------------------------------------------------------
export function rotateByField(courses = allCourses()) {
  const byField = libraryByField(courses); // canonical field order, every field present
  const queues = byField.map(({ field, courses: list }) => ({
    field,
    items: [...list].sort((a, b) => (courseTrainingHours(b) - courseTrainingHours(a)) || String(a.id).localeCompare(String(b.id))),
  }));
  const ordered = [];
  let remaining = queues.reduce((t, q) => t + q.items.length, 0);
  while (remaining > 0) {
    for (const q of queues) {
      if (q.items.length) { ordered.push(q.items.shift()); remaining -= 1; }
    }
  }
  return ordered;
}

// ---------------------------------------------------------------------------
// buildTrainingPlan — the multi-year map. Pure.
//   courses        — the library subset to schedule (default: full library).
//   hoursPerMonth  — target training hours per month (default 24).
//   months         — how many months to lay out (default 36 = 3 years).
//   startISO       — anchors the calendar labels (optional).
//   approvedOnly   — when an `isApproved(course)` predicate is given, only schedule
//                    courses it returns true for (Christina-approved). Default: all.
//
// Returns:
//   {
//     hoursPerMonth, months,
//     plan: [ { index, label, courses:[...], hours, fields:[...], shortfallHours, full } ],
//     summary: { libraryHours, scheduledHours, monthsFullyCovered, targetHours,
//                coveragePct, runwayMonths, byField, unscheduledCourses, shortfallTotal }
//   }
// ---------------------------------------------------------------------------
export function buildTrainingPlan(courses = allCourses(), opts = {}) {
  const {
    hoursPerMonth = DEFAULT_HOURS_PER_MONTH,
    months = DEFAULT_PLAN_MONTHS,
    startISO = null,
    isApproved = null,
  } = opts;

  const target = Math.max(1, Number(hoursPerMonth) || DEFAULT_HOURS_PER_MONTH);
  const monthCount = Math.max(1, Math.round(Number(months) || DEFAULT_PLAN_MONTHS));

  const pool = (isApproved ? (courses || []).filter((c) => isApproved(c)) : (courses || [])).slice();
  const ordered = rotateByField(pool);

  // Greedy fill: walk the field-rotated order, dropping each course into the current
  // month until the month reaches its target, then advancing. A course never repeats
  // (we consume the ordered list once). When a course would overflow the month, it
  // still goes in if the month is empty (so an oversized course is never orphaned),
  // otherwise it starts the next month — packing tightly without splitting a course.
  const plan = [];
  let mi = 0;
  let current = newMonth(mi, startISO);
  for (const course of ordered) {
    if (mi >= monthCount) break;
    const h = courseTrainingHours(course);
    if (current.hours > 0 && current.hours + h > target) {
      finalizeMonth(current, target);
      plan.push(current);
      mi += 1;
      if (mi >= monthCount) break;
      current = newMonth(mi, startISO);
    }
    current.courses.push(course);
    current.hours += h;
    if (!current.fields.includes(course.field)) current.fields.push(course.field);
    if (current.hours >= target) {
      finalizeMonth(current, target);
      plan.push(current);
      mi += 1;
      if (mi >= monthCount) { current = null; break; }
      current = newMonth(mi, startISO);
    }
  }
  if (current && current.courses.length) { finalizeMonth(current, target); plan.push(current); }

  // Pad out remaining months as honest, fully-open gaps (no painted content) so the
  // multi-year target is visible and the runway is explicit.
  for (let i = plan.length; i < monthCount; i += 1) {
    const m = newMonth(i, startISO);
    finalizeMonth(m, target);
    plan.push(m);
  }

  const scheduledCourses = plan.reduce((t, m) => t + m.courses.length, 0);
  const scheduledHours = plan.reduce((t, m) => t + m.hours, 0);
  const monthsFullyCovered = plan.filter((m) => m.full).length;
  const shortfallTotal = plan.reduce((t, m) => t + m.shortfallHours, 0);
  const libraryHours = pool.reduce((t, c) => t + courseTrainingHours(c), 0);
  const targetHours = target * monthCount;

  // Per-field scheduled rollup (how the plan spreads across competencies).
  const byField = TRAINING_FIELDS.map((field) => {
    const list = pool.filter((c) => c.field === field);
    return {
      field,
      scheduled: scheduledCoursesInField(plan, field),
      available: list.length,
      hours: list.reduce((t, c) => t + courseTrainingHours(c), 0),
    };
  });

  return {
    hoursPerMonth: target,
    months: monthCount,
    plan,
    summary: {
      libraryHours,
      scheduledHours,
      scheduledCourses,
      monthsFullyCovered,
      targetHours,
      // % of the multi-year target the real library currently covers.
      coveragePct: targetHours > 0 ? Math.round((scheduledHours / targetHours) * 100) : 0,
      // Whole months the library can fully supply at the target rate (the runway).
      runwayMonths: Math.floor(libraryHours / target),
      unscheduledCourses: Math.max(0, pool.length - scheduledCourses),
      shortfallTotal,
      byField,
    },
  };
}

function newMonth(index, startISO) {
  return { index, label: monthLabel(startISO, index), courses: [], hours: 0, fields: [], shortfallHours: 0, full: false };
}

function finalizeMonth(month, target) {
  month.shortfallHours = Math.max(0, round1(target - month.hours));
  month.hours = round1(month.hours);
  month.full = month.hours >= target;
  return month;
}

function scheduledCoursesInField(plan, field) {
  let n = 0;
  for (const m of plan) for (const c of m.courses) if (c.field === field) n += 1;
  return n;
}

function round1(n) { return Math.round((Number(n) || 0) * 10) / 10; }

// A one-line, honest readout of how the plan maps to the IL training record.
export function planToRequirementNote(plan) {
  const s = plan && plan.summary;
  if (!s) return '';
  return `The library currently supplies ${s.libraryHours} training hours — about ${s.runwayMonths} full month(s) at ${plan.hoursPerMonth}/month. The plan lays out ${plan.months} months toward the multi-year target; the remaining ${s.shortfallTotal} hours are the runway to author next (YouTube-distilled + Christina-authored courses extend it).`;
}
