// =============================================================================
// recipe-costing — what a recipe COSTS, from the kitchen's real item costs
// =============================================================================
// The tie that makes recipes + inventory living together under Chef's Corner pay
// off: a recipe's ingredient lines, priced from the inventory items' real unit
// costs (lib/inventory.js items). This is the seed of menu profitability — cost a
// plate, see the margin — and it reuses the dimension-aware unit engine
// (lib/recipe-units.js) rather than reinventing conversion.
//
// HONEST BY CONSTRUCTION (Verification Doctrine, DR-0076):
//   * An ingredient is matched to an item by name; an UNMATCHED line is reported,
//     never silently priced at $0.
//   * A matched line is only COSTED when the recipe's amount can be converted into
//     the item's stock unit: same dimension (exact), or cross-dimension via a
//     KNOWN density (flagged approximate). No density / no quantity / a pack unit
//     with no pack size -> reported as not-costable, never fabricated.
//   * coverage = costable lines / total lines. When coverage < 1 the batch cost is
//     a LOWER BOUND (partial), and the UI must say so.
//
// Pure + dependency-free of React. Unit-tested in __tests__/recipe-costing.test.js.
// =============================================================================
import { parseAmount, convert, toBase, fromBase, volumeToGrams, weightToMl, normalizeUnit } from './recipe-units.js';

// recipe-units' normalized unit keys, grouped by dimension. (parseAmount returns
// the ingredient's dim directly; this is for resolving the ITEM's stock unit.)
const WEIGHT_KEYS = new Set(['oz', 'lb', 'kg', 'g']);
const VOLUME_KEYS = new Set(['tsp', 'tbsp', 'floz', 'cup', 'pint', 'quart', 'gallon', 'ml', 'l']);
// Raw item units that mean "one piece" — the only count unit we can price a bare
// count ingredient ("2 onions") against without a pack size.
const EACH_UNITS = new Set(['each', 'ea', 'unit', 'piece', 'pc', 'count']);

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

// The recipe-units dimension of an item's raw stock unit ('lb' -> weight,
// 'gal' -> volume, 'each'/'case' -> count).
function itemUnitDim(rawUnit) {
  const k = normalizeUnit(rawUnit);
  if (k && WEIGHT_KEYS.has(k)) return 'weight';
  if (k && VOLUME_KEYS.has(k)) return 'volume';
  return 'count';
}

function normName(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// matchItem — the most specific inventory item whose name overlaps the ingredient
// name (longest matching item name wins, so "bread flour" beats "flour").
export function matchItem(ingredientName, items) {
  const ning = normName(ingredientName);
  if (!ning) return null;
  let best = null;
  let bestLen = 0;
  for (const it of items || []) {
    if (!it || it.active === false) continue;
    const nit = normName(it.name);
    if (!nit) continue;
    if ((ning.includes(nit) || nit.includes(ning)) && nit.length > bestLen) {
      best = it;
      bestLen = nit.length;
    }
  }
  return best;
}

// Convert a recipe amount (qty in ingUnitKey, dimension ingDim) into an item's
// stock unit. Returns { qty, approximate } or null when it cannot be done
// honestly. ingUnitKey is a normalized recipe-units key (or null for a bare
// count); ingName carries the density lookup for cross-dimension.
export function convertToItemUnit({ qty, ingUnitKey, ingDim, ingName, itemUnitRaw }) {
  const itemKey = normalizeUnit(itemUnitRaw);
  const itemDim = itemUnitDim(itemUnitRaw);

  if (itemDim === 'count') {
    // Only a bare count ingredient priced against an each-style item is sound.
    const rawNorm = String(itemUnitRaw || '').toLowerCase().replace(/\.$/, '');
    if (ingDim === 'count' && !ingUnitKey && EACH_UNITS.has(rawNorm)) {
      return { qty, approximate: false };
    }
    return null; // case/box/etc. need a pack size we don't have
  }

  if (!ingUnitKey || ingDim === 'count') return null; // count ingredient into weight/volume item

  if (ingDim === itemDim) {
    return { qty: convert(qty, ingUnitKey, itemKey), approximate: false }; // exact, same dimension
  }

  // cross-dimension — density required (flagged approximate)
  if (ingDim === 'volume' && itemDim === 'weight') {
    const ml = toBase(qty, ingUnitKey);
    const g = volumeToGrams(ml, ingName);
    if (!g) return null;
    return { qty: fromBase(g.grams, itemKey), approximate: true };
  }
  if (ingDim === 'weight' && itemDim === 'volume') {
    const grams = toBase(qty, ingUnitKey);
    const r = weightToMl(grams, ingName);
    if (!r) return null;
    return { qty: fromBase(r.ml, itemKey), approximate: true };
  }
  return null;
}

// costLine — price one ingredient line against the inventory. `factor` scales the
// recipe (serving scaler). Always returns a row; `costable` says whether lineCost
// is real, and `reason` says why not when it isn't.
export function costLine(ingredientText, items, factor = 1) {
  const parsed = parseAmount(ingredientText);
  const item = matchItem(parsed.name || ingredientText, items);
  const base = { raw: ingredientText, name: parsed.name || ingredientText, matched: !!item, item: item || null };

  if (!item) return { ...base, costable: false, reason: 'no-item', lineCost: 0 };
  if (!parsed.hadQuantity || !parsed.qty) return { ...base, costable: false, reason: 'no-quantity', lineCost: 0 };

  const conv = convertToItemUnit({
    qty: parsed.qty * (Number(factor) || 1),
    ingUnitKey: parsed.unit,
    ingDim: parsed.dim,
    ingName: parsed.name,
    itemUnitRaw: item.unit,
  });
  if (!conv) return { ...base, costable: false, reason: 'no-conversion', lineCost: 0 };

  const lineCost = conv.qty * num(item.unitCost);
  return {
    ...base,
    costable: true,
    reason: null,
    qtyInItemUnit: conv.qty,
    itemUnit: item.unit,
    approximate: conv.approximate,
    lineCost,
  };
}

// costRecipe — price a whole recipe from the inventory. Returns batch + per-serving
// cost plus the honest coverage (how much of the recipe we could actually price).
export function costRecipe(recipe, items, { factor = 1 } = {}) {
  const lines = [];
  for (const sec of recipe?.ingredientSections || []) {
    for (const raw of sec.items || []) {
      if (String(raw || '').trim()) lines.push(costLine(raw, items, factor));
    }
  }
  const costable = lines.filter((l) => l.costable);
  const perBatch = costable.reduce((sum, l) => sum + l.lineCost, 0);
  const servingsBase = num(recipe?.servingsBase);
  const servings = servingsBase * (Number(factor) || 1);
  const perServing = servings > 0 ? perBatch / servings : null;
  const totalLines = lines.length;
  const coverage = totalLines > 0 ? costable.length / totalLines : 0;

  return {
    perBatch,
    perServing,
    servingsBase,
    totalLines,
    costableLines: costable.length,
    matchedLines: lines.filter((l) => l.matched).length,
    coverage,
    partial: coverage < 1,
    approximate: costable.some((l) => l.approximate),
    lines,
  };
}

// foodCostMargin — given a menu price, the food-cost % and gross margin for a
// per-serving cost. Returns null fields when price is absent (money stays the
// owner's hand; we never invent a price). Ties to lib/kitchen-count foodCostPercent.
export function foodCostMargin(perServingCost, menuPrice) {
  const price = num(menuPrice);
  const cost = num(perServingCost);
  if (price <= 0) return { foodCostPct: null, marginDollars: null, marginPct: null };
  return {
    foodCostPct: (cost / price) * 100,
    marginDollars: price - cost,
    marginPct: ((price - cost) / price) * 100,
  };
}
