// =============================================================================
// juice-recipes — Christina's Homemade Juice, and the math for a serving
// =============================================================================
// Darrell, 2026-08-31: "ADD MY EXISTING HOMEMADE JUICE RECIPE TO THE DATABASE...
// I should NOT have to enter the ingredients every time... in no more than 1-2
// taps."
//
// SHIPPED AS VERSION-CONTROLLED CONTENT, the 0052-recipes precedent: the founding
// recipe lives here so it can never be lost and is available the moment the tab
// opens — no seeding step, no empty dropdown on a fresh device. Edits belong in a
// table; the content is the floor, not the ceiling.
//
// THE NUMBERS ARE HIS, AND THEY CHECK OUT. He gave 18.3 calories per ounce and a
// serving table; every row he listed matches oz x 18.3 exactly (6->110, 8->146,
// 12->220, 16->293, 18->329, 24->439, 36->659), and every protein figure matches
// 3 g at 18 oz (0.1667 g/oz). Verified before this file was written, which is why
// the servings below are DERIVED from the two rates rather than typed in as a
// parallel list — a typed list can drift from the formula it claims to follow;
// a derived one cannot.
//
// ESTIMATES, AND LABELLED AS SUCH. His own words: "Because this is fresh juice
// and the amount of pulp removed during juicing varies, nutrition values are
// estimates." The surface says so; we do not present a planning value as a
// measurement (DR-0076).
//
// HISTORY IS IMMUTABLE. Editing this recipe must never rewrite a past log. That
// is already structural: a food_entries row stores the calories and protein it
// was logged with, so it keeps the values recorded on the day it was consumed no
// matter what the recipe later says.
// =============================================================================

/** The established planning rates. Everything else is derived from these two. */
export const JUICE_CALORIES_PER_OZ = 18.3;
export const JUICE_PROTEIN_G_PER_OZ = 3 / 18;   // 3 g at the 18 oz serving

export const CHRISTINAS_JUICE = {
  id: 'juice-christinas',
  name: "Christina's Homemade Juice",
  category: 'Juice',
  batchOz: 72,                    // approximate finished volume of a full batch
  defaultServingOz: 18,
  caloriesPerOz: JUICE_CALORIES_PER_OZ,
  proteinGPerOz: JUICE_PROTEIN_G_PER_OZ,
  estimate: true,
  estimateNote: 'Fresh juice — the pulp removed varies, so these are estimates, not measurements.',
  ingredients: [
    '5 apples',
    '5 oranges',
    '1 whole pineapple',
    '1/2 bag baby carrots',
    '1/2 bag celery',
    'Lots of spinach',
    '1 piece/stick fresh ginger',
    '1 whole cucumber',
    '1/3 head red lettuce',
  ],
  // The presets he asked to preload. Values are DERIVED, never typed.
  servingOptions: [6, 8, 12, 16, 18, 24, 36],
};

/** Round the way a food log should: calories whole, protein to a tenth. */
const roundCal = (n) => Math.round(n);
const roundPro = (n) => Math.round(n * 10) / 10;

/**
 * Nutrition for a serving of juice. Custom ounces use the SAME formula as the
 * presets, so a typed 9 oz cannot disagree with the 18 oz it is half of.
 * Returns null for a nonsense amount rather than 0 — "not a serving" is not
 * "a serving of nothing".
 */
export function juiceServing(oz, recipe = CHRISTINAS_JUICE) {
  const amount = Number(oz);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const calPerOz = Number(recipe.caloriesPerOz) || JUICE_CALORIES_PER_OZ;
  const proPerOz = Number(recipe.proteinGPerOz) || JUICE_PROTEIN_G_PER_OZ;
  return {
    name: recipe.name,
    serving: `${amount} oz`,
    oz: amount,
    calories: roundCal(amount * calPerOz),
    proteinG: roundPro(amount * proPerOz),
    estimate: recipe.estimate !== false,
    source: 'recipe',
    recipeId: recipe.id,
  };
}

/** The preloaded dropdown, derived from the rates. Default flagged for 1-tap. */
export function juiceServingOptions(recipe = CHRISTINAS_JUICE) {
  return (recipe.servingOptions || []).map((oz) => ({
    ...juiceServing(oz, recipe),
    isDefault: oz === recipe.defaultServingOz,
  }));
}

/** How much of a batch one serving is — the practical "will it last" question. */
export function servingsPerBatch(recipe = CHRISTINAS_JUICE, oz = null) {
  // `oz == null` means "not asked, use the default". An explicit 0 is a real
  // (bad) answer and must be refused -- `oz || default` would quietly turn it
  // into the default and report the default's number for a question nobody
  // asked. Caught by its own test before this shipped.
  const per = Number(oz == null ? recipe.defaultServingOz : oz);
  const batch = Number(recipe.batchOz);
  if (!Number.isFinite(per) || per <= 0 || !Number.isFinite(batch) || batch <= 0) return null;
  return Math.round((batch / per) * 10) / 10;
}

/** Every recipe the app ships with. One today; the shape takes more. */
export const JUICE_RECIPES = [CHRISTINAS_JUICE];
