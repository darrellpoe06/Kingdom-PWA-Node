// =============================================================================
// road-to-150-plan — the program's PLANNED side, taken from his document
// =============================================================================
// Darrell, 2026-08-31: "you create a tracking plan based on the pdf my wife gave
// you!!!!!!!!! obviously!!!!!!!"
//
// He is right, and I was too rigid. I had been holding the Plan tab empty
// waiting for a differently-named file while the plan's real content sat in the
// document his wife wrote: the strength routine in full, the walking target, the
// food list, the meal structure, the weekly weights, the water goal, and the
// planned daily totals. Withholding all of that because one section said
// "import ... from the PDF" was withholding HIS OWN WORK from him.
//
// WHAT IS TAKEN VERBATIM (his words, his numbers -- nothing here is invented):
//   * the strength round, exercise for exercise and rep for rep
//   * the walking target: 28 minutes at 2.5 mph, about 135 calories
//   * the nineteen foods, in his order, under "Do not randomly change the foods"
//   * the four meals: Morning, Lunch, Snack, Dinner
//   * the planned daily totals: 1,604 calories and 141.7 g protein
//
// WHAT IS STILL ABSENT, AND STAYS ABSENT: a per-food calorie/protein table and a
// day-by-day 26-week meal assignment. He never wrote those, so inventing them
// would put fabricated nutrition into a weight-loss log -- the one lie that
// actually hurts (DR-0076/DR-0319). The pantry below therefore names WHAT the
// program eats and lets each food's numbers arrive the honest way every other
// food does: her own confirmed entry, remembered thereafter.
//
// So the Plan tab stops saying "not imported yet" and starts showing the real
// program, while still refusing to make up a number.
// =============================================================================

/** The planned daily totals he stated, to compare ACTUALS against. */
export const PLANNED_DAILY = {
  calories: 1604,
  proteinG: 141.7,
  waterOz: 64,
  source: 'the Road to 150 plan',
};

/** The walking target he gave, verbatim. */
export const PLANNED_WALK = {
  minutes: 28,
  mph: 2.5,
  estimatedCalories: 135,
  estimate: true,   // "Estimated calories" is his own word
};

/**
 * The strength round, exactly as written. `eachSide` carries his "each leg" /
 * "each side" rather than flattening it into the rep count, so the checklist
 * reads the way he wrote it.
 */
export const PLANNED_STRENGTH = {
  rounds: 2,
  exercises: [
    { name: 'Chair squats',  reps: 10, eachSide: false },
    { name: 'Wall push-ups', reps: 10, eachSide: false },
    { name: 'Glute bridges', reps: 12, eachSide: false },
    { name: 'Knee raises',   reps: 10, eachSide: true, sideLabel: 'each leg' },
    { name: 'Calf raises',   reps: 15, eachSide: false },
    { name: 'Bird dogs',     reps: 8,  eachSide: true, sideLabel: 'each side' },
  ],
};

/** The four meals of the program day, in his order. */
export const PLAN_MEALS = ['morning', 'lunch', 'snack', 'dinner'];

/**
 * The program's pantry — his nineteen foods, in his order, under his rule "Do
 * not randomly change the foods from the source program."
 *
 * NO NUMBERS HERE ON PURPOSE. He listed the foods, not their nutrition. Each
 * one's calories and protein arrive the same honest way as any other food: she
 * confirms it once and it is remembered (0166). `meal` is the meal the food
 * plainly belongs to where his own plan makes that obvious, and null where it
 * does not -- a guess about placement is still a guess.
 */
export const PROGRAM_PANTRY = [
  { name: 'Homemade juice',          meal: 'morning' },
  { name: 'Eggs',                    meal: 'morning' },
  { name: 'Egg whites',              meal: 'morning' },
  { name: 'Orgain plant protein',    meal: 'morning' },
  { name: 'Unsweetened almond milk', meal: 'morning' },
  { name: 'Salmon',                  meal: null },
  { name: 'Chicken breast',          meal: null },
  { name: 'Tuna',                    meal: null },
  { name: 'Lean turkey',             meal: null },
  { name: 'White fish',              meal: null },
  { name: 'Broccoli',                meal: null },
  { name: 'Quinoa',                  meal: null },
  { name: 'Black beans',             meal: null },
  { name: 'Mixed vegetables',        meal: null },
  { name: 'Roasted vegetables',      meal: null },
  { name: 'Large salad',             meal: null },
  { name: 'Small baked potato',      meal: null },
  { name: 'Almonds',                 meal: 'snack' },
  { name: 'Dressing',                meal: null },
];

/** The pantry, with anything she has already confirmed filled in. */
export function pantryWithKnown(library) {
  const byName = new Map();
  for (const e of library || []) {
    const k = String((e && e.name) || '').toLowerCase().trim();
    if (k && !byName.has(k)) byName.set(k, e);
  }
  return PROGRAM_PANTRY.map((f) => {
    const hit = byName.get(f.name.toLowerCase());
    return hit
      ? { ...f, serving: hit.serving || '', calories: hit.calories ?? null, proteinG: hit.proteinG ?? null, known: hit.calories != null || hit.proteinG != null }
      : { ...f, serving: '', calories: null, proteinG: null, known: false };
  });
}

/**
 * Planned vs actual for a day. Planned comes from the program and is NEVER
 * written by anything the user does; actual is passed in from her own rows.
 * `gap` is plain arithmetic, and null when the actual is not recorded — an
 * unrecorded day is not a day she ate nothing.
 */
export function plannedVsActual(actual = {}) {
  const pair = (planned, got) => {
    const a = got == null || !Number.isFinite(Number(got)) ? null : Number(got);
    return {
      planned,
      actual: a,
      gap: a == null ? null : Math.round((a - planned) * 10) / 10,
      recorded: a != null,
    };
  };
  return {
    calories: pair(PLANNED_DAILY.calories, actual.calories),
    protein:  pair(PLANNED_DAILY.proteinG, actual.proteinG),
    water:    pair(PLANNED_DAILY.waterOz, actual.waterOz),
  };
}

/** "10 knee raises each leg" — his phrasing, rebuilt for the checklist. */
export function exerciseLabel(ex) {
  if (!ex) return '';
  return `${ex.reps} ${String(ex.name).toLowerCase()}${ex.eachSide ? ` ${ex.sideLabel || 'each side'}` : ''}`;
}

/** Every checkbox for the round: one per exercise per round. */
export function strengthChecklist(plan = PLANNED_STRENGTH) {
  const out = [];
  for (let round = 1; round <= (plan.rounds || 1); round += 1) {
    for (const ex of plan.exercises || []) {
      out.push({ id: `r${round}-${String(ex.name).toLowerCase().replace(/\s+/g, '-')}`, round, label: exerciseLabel(ex), ...ex });
    }
  }
  return out;
}
