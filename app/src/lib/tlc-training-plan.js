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
import { IL_LCSW_REQUIREMENT } from './practice-academy.js';
import { STATE_RULESETS } from './ceu-tracker.js';

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

// ---------------------------------------------------------------------------
// THE WEEKLY PLAN (DR-0345). Darrell 2026-09-10: "We also want the 24
// trainings for therapists to be for the week." One training a week, in the
// field-rotated order, each with its hours and its Illinois lesson; the
// month-based runway above stays as the multi-year record. Pure + deterministic
// (week labels derive from startISO; no Date.now()).
// ---------------------------------------------------------------------------
export const DEFAULT_PLAN_WEEKS = 24;

function weekLabel(startISO, index) {
  let calendar = '';
  if (startISO) {
    const d = new Date(startISO);
    if (!isNaN(d.getTime())) {
      const w = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + index * 7));
      calendar = ` (week of ${MONTH_NAMES[w.getUTCMonth()]} ${w.getUTCDate()}, ${w.getUTCFullYear()})`;
    }
  }
  return `Week ${index + 1}${calendar}`;
}

export function buildWeeklyPlan(courses = allCourses(), opts = {}) {
  const { weeks = DEFAULT_PLAN_WEEKS, startISO = null, isApproved = null } = opts;
  const n = Math.max(1, Math.round(Number(weeks) || DEFAULT_PLAN_WEEKS));
  const pool = (isApproved ? (courses || []).filter((c) => isApproved(c)) : (courses || [])).slice();
  const ordered = rotateByField(pool);
  const plan = [];
  for (let i = 0; i < n; i += 1) {
    const course = ordered[i] || null;
    plan.push({
      index: i,
      label: weekLabel(startISO, i),
      course,
      hours: course ? courseTrainingHours(course) : 0,
      field: course ? course.field : null,
      lessons: course ? course.modules.length : 0,
      illinois: !!(course && course.modules.some((m) => m && m.illinois)),
      open: !course, // an honest gap: no course exists yet for this week
    });
  }
  const scheduled = plan.filter((w) => w.course);
  return {
    weeks: n,
    plan,
    summary: {
      scheduledCourses: scheduled.length,
      scheduledHours: round1(scheduled.reduce((t, w) => t + w.hours, 0)),
      openWeeks: n - scheduled.length,
      unscheduledCourses: Math.max(0, pool.length - scheduled.length),
      withIllinois: scheduled.filter((w) => w.illinois).length,
      fields: [...new Set(scheduled.map((w) => w.field))].length,
    },
  };
}

// ---------------------------------------------------------------------------
// THE STATE PLAN (DR-0345 amendment). Darrell 2026-09-10, on the 36-month
// "795.5 hours to author" screen: "These lessons should be laid out over the
// 24 month period the state expects or whatever number of months." The
// window is the state's own minimum for the LCSW supervised experience
// (IL_LCSW_REQUIREMENT.minMonths, 24; 225 ILCS 20 / 68 Ill. Adm. Code
// 1470.20), and the courses are spread evenly across it, one a week where a
// course exists: every course lands once, the field rotation holds, and the
// weeks with no course yet are open — never painted. The CE minimum the
// state asks per two-year cycle (STATE_RULESETS.IL.totalHours, 30) is shown
// against the library's hours, with the honest note that only hours from an
// approved sponsor count. Pure + deterministic (startISO drives the labels).
// ---------------------------------------------------------------------------
export function buildStatePlan(courses = allCourses(), opts = {}) {
  const {
    months = IL_LCSW_REQUIREMENT.minMonths,
    startISO = null,
    isApproved = null,
    ceHoursPerCycle = STATE_RULESETS.IL.totalHours,
  } = opts;
  const monthCount = Math.max(1, Math.round(Number(months) || IL_LCSW_REQUIREMENT.minMonths));
  const weekCount = Math.round(monthCount * 52 / 12);
  const pool = (isApproved ? (courses || []).filter((c) => isApproved(c)) : (courses || [])).slice();
  const ordered = rotateByField(pool);
  const n = ordered.length;
  // Spread evenly: course i lands on week floor(i * weeks / n); never two on a week.
  const byWeek = new Map();
  ordered.forEach((course, i) => {
    let w = n > 0 ? Math.floor((i * weekCount) / n) : 0;
    while (byWeek.has(w) && w < weekCount - 1) w += 1;
    byWeek.set(w, course);
  });
  const monthsOut = [];
  for (let m = 0; m < monthCount; m += 1) {
    const w0 = Math.round((m * weekCount) / monthCount);
    const w1 = Math.round(((m + 1) * weekCount) / monthCount);
    const weeks = [];
    for (let w = w0; w < w1; w += 1) {
      const course = byWeek.get(w) || null;
      weeks.push({ index: w, label: `Week ${w + 1}`, course, hours: course ? courseTrainingHours(course) : 0, field: course ? course.field : null, open: !course });
    }
    const hours = round1(weeks.reduce((t, x) => t + x.hours, 0));
    monthsOut.push({ index: m, label: monthLabel(startISO, m), weeks, courses: weeks.filter((x) => x.course).map((x) => x.course), hours, fields: [...new Set(weeks.filter((x) => x.field).map((x) => x.field))] });
  }
  let running = 0;
  for (const m of monthsOut) { running = round1(running + m.hours); m.cumulativeHours = running; }
  const libraryHours = round1(pool.reduce((t, c) => t + courseTrainingHours(c), 0));
  return {
    months: monthCount,
    weeks: weekCount,
    window: { state: IL_LCSW_REQUIREMENT.state, credential: IL_LCSW_REQUIREMENT.credential, minMonths: IL_LCSW_REQUIREMENT.minMonths, supervisedClinicalHours: IL_LCSW_REQUIREMENT.supervisedClinicalHours, confirmed: IL_LCSW_REQUIREMENT.confirmed },
    plan: monthsOut,
    summary: {
      courses: n,
      libraryHours,
      weeksWithTraining: byWeek.size,
      openWeeks: weekCount - byWeek.size,
      monthsWithTraining: monthsOut.filter((m) => m.courses.length).length,
      fields: [...new Set(pool.map((c) => c.field))].length,
      ceHoursPerCycle,
      // The library's hours against the state's CE minimum per two-year cycle;
      // true only in hours, since only an approved sponsor's hours count.
      libraryCoversCeMinimum: libraryHours >= ceHoursPerCycle,
    },
  };
}

export function statePlanNote(plan) {
  const s = plan && plan.summary;
  if (!s) return '';
  return `${s.courses} trainings (${s.libraryHours} hours) laid across the ${plan.months}-month window Illinois sets as the minimum for the LCSW supervised experience: ${s.weeksWithTraining} of ${plan.weeks} weeks carry a training, ${s.openWeeks} are open for the courses authored next. The state asks ${s.ceHoursPerCycle} CE hours per two-year renewal cycle; the library holds ${s.libraryHours}, and only hours earned from an IDFPR-approved sponsor count toward it.`;
}
