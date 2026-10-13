// =============================================================================
// road-to-150-program — the FIRST program template on the generic engine
// =============================================================================
// Darrell 2026-08-30. The paper/PDF plan becomes an interactive digital program.
// This file is the version-controlled CONTENT (the 0052-recipes precedent: the
// canonical program ships in the repo so it can never be lost; the database holds
// what the USER records against it). lib/health-program.js is the engine and
// knows nothing about these numbers.
//
// WHAT IS HERE, AND WHAT IS HONESTLY NOT (DR-0076):
//
//   PRESENT -- given directly by Darrell, and verified internally consistent by
//   road-to-150-program.test.js: start 202 lb, goal 150 lb, 26 weeks, 64 oz of
//   water a day, and all 26 weekly target weights.
//
//   ABSENT -- the per-day MEAL PLAN, WALKING schedule and STRENGTH schedule. Those
//   live in the PDF ("Road to 150 - Complete Tracking Plan"), which is not in the
//   repository. They are left as EMPTY arrays with `dataSource: 'pdf-pending'`
//   rather than invented. Fabricated calorie, protein, pace or exercise figures
//   would be a health claim this file has no basis for, and Darrell's own brief
//   says "do not randomly change the foods from the source program." The surfaces
//   read `pdfPending()` and say plainly that the schedule has not been imported
//   yet -- they never render a placeholder meal as if it were the plan.
//
// The 2 lb/week figures are PLANNING TARGETS. Nothing in this file or its callers
// promises the user will lose 2 lb in a week.
// =============================================================================

/** The 26-week roadmap exactly as Darrell listed it (week -> target weight, lb). */
const WEEKLY_TARGETS = [
  200, 198, 196, 194, 192, 190, 188, 186, 184, 182, 180, 178, 176,
  174, 172, 170, 168, 166, 164, 162, 160, 158, 156, 154, 152, 150,
].map((targetWeightLb, i) => ({ week: i + 1, targetWeightLb }));

/**
 * The template. `startDate` is deliberately NOT baked in -- a program is started
 * by a user, so the stored program row carries the real start date and this
 * default only seeds the form. Anything an admin may vary for another person
 * (weights, length, water goal, schedules) is a field here, never a constant in
 * a component.
 */
export const ROAD_TO_150 = Object.freeze({
  slug: 'road-to-150',
  name: 'Road to 150',
  subtitle: 'A 26-week plan, tracked honestly',
  startWeightLb: 202,
  goalWeightLb: 150,
  weeks: 26,
  waterGoalOz: 64,
  // Planning target only -- surfaced as "target", never as a prediction.
  plannedWeeklyLossLb: 2,
  startDate: null,
  weeklyTargets: Object.freeze(WEEKLY_TARGETS.map((t) => Object.freeze(t))),

  // Awaiting the PDF import. Empty, never invented -- see the header.
  dataSource: 'pdf-pending',
  days: Object.freeze([]),
  meals: Object.freeze([]),
  walkingSchedule: Object.freeze([]),
  strengthSchedule: Object.freeze([]),
});

/**
 * True while the day-level schedule has not been imported from the PDF. The
 * surfaces call this to show an honest "not imported yet" state instead of an
 * empty plan that reads like a rest day.
 */
export function pdfPending(program = ROAD_TO_150) {
  return !((program?.days || []).length);
}

/** Start a program on a real date -- the row a user actually tracks against. */
export function startProgram(startDate, program = ROAD_TO_150) {
  return { ...program, startDate };
}

/** The planned total loss across the whole program (52 lb for Road to 150). */
export function plannedTotalLossLb(program = ROAD_TO_150) {
  return (program.startWeightLb || 0) - (program.goalWeightLb || 0);
}
