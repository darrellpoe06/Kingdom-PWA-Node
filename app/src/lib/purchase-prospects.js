// =============================================================================
// purchase-prospects — a property we are weighing, kept with its figures
// =============================================================================
// Darrell, 2026-11-10, the hour the calculator shipped: "I also want to be able
// to use it for potential properties we are looking to potentially purchase and
// other users will also want that type of functionality." (DR-1415)
//
// A prospect is NOT a property on the books: it has no door, no tenant, no
// mortgage, and it enters no total, no debt list and no Safe to Spend figure.
// It is a name and the figures a person typed while weighing it (price, down
// payment, rate, term, costs, expected rent, any extra principal), so the
// calculator can bring them back.
//
// WHERE IT LIVES: data.moneyPlan.prospects. That key rides the household's own
// snapshot (lib/money-plan.js, lib/snapshot-sync.js), one row per instance, so
// every household on the platform keeps its own list and no household can see
// another's. Nothing here writes; the shell's setData does.
//
// Pure. Every figure is what the person entered; a blank stays blank.
// =============================================================================

export const MAX_PROSPECTS = 50;
// The calculator's own form fields, kept as entered.
export const FIGURE_KEYS = [
  'value',
  'down',
  'principal',
  'rate',
  'mode',
  'years',
  'payment',
  'insurance',
  'tax',
  'monthlyCost',
  'rent',
  'xMonthly',
  'xMonthlyStart',
  'xSemi',
  'xSemiStart',
  'xAnnual',
  'xAnnualStart',
  'xOnce',
  'xOnceMonth',
];

const clean = (s) =>
  String(s == null ? '' : s)
    .trim()
    .slice(0, 120);

export function prospectsOf(data) {
  const list = data && data.moneyPlan && Array.isArray(data.moneyPlan.prospects) ? data.moneyPlan.prospects : [];
  return list.filter((p) => p && typeof p === 'object' && p.id && clean(p.name));
}

/** What still stops this from being saved, in words; empty when it can be. */
export function missingForSave({ name, figures } = {}) {
  const missing = [];
  if (!clean(name)) missing.push('a name or address for the property');
  const f = figures || {};
  if (!(Number(f.value) > 0) && !(Number(f.principal) > 0)) missing.push('the price or the amount borrowed');
  return missing;
}

/** A stored prospect from the form: only the known fields, each as entered. */
export function toProspect({ id, name, entityId = null, figures = {} }, now = new Date()) {
  const kept = {};
  for (const k of FIGURE_KEYS) if (figures[k] != null && String(figures[k]).trim() !== '') kept[k] = String(figures[k]).trim().slice(0, 24);
  return { id, name: clean(name), entityId: entityId || null, figures: kept, updatedAt: now.toISOString() };
}

/** The list with this prospect added, or replaced when its id is already there. */
export function upsertProspect(list, prospect) {
  const rest = (list || []).filter((p) => p && p.id !== prospect.id);
  return [prospect, ...rest].slice(0, MAX_PROSPECTS);
}

export function removeProspect(list, id) {
  return (list || []).filter((p) => p && p.id !== id);
}
