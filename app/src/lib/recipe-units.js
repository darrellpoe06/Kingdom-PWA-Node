// =============================================================================
// recipe-units — dimension-aware unit conversion for Chef's Corner
// =============================================================================
// Chef Mario's hard rule (this is where computers fail — get it right):
//
//   1. MEASUREMENT DIMENSIONS ARE DISTINCT. Every amount is WEIGHT (g, kg, oz,
//      lb), VOLUME (ml, L, tsp, tbsp, cup), or COUNT (3 eggs, 2 cloves).
//   2. CONVERT WITHIN A DIMENSION EXACTLY (pure factors). weight<->weight and
//      volume<->volume are exact.
//   3. CONVERT ACROSS DIMENSIONS (volume<->weight) ONLY WITH DENSITY. You cannot
//      say 100 g = 100 ml except for water. Cross-conversion uses an
//      ingredient-specific density; if the density is UNKNOWN we DO NOT fabricate
//      a number — we keep the amount in its given dimension and flag it.
//   4. BAKING/PASTA PRECISION: scale at full precision, round ONLY for display so
//      a scale-up never drifts the ratio; approximate conversions are marked "~".
//   5. SCALE FIRST (in the ingredient's own unit), THEN offer unit display — never
//      convert-then-scale (that loses precision).
//
// Everything here is pure + exact (no rounding in the math; rounding lives in the
// formatters) so every factor is unit-testable to the digit.
//
// FACTOR SOURCES (exact, US customary):
//   - 1 lb = 453.59237 g (international avoirdupois, exact by definition);
//     1 oz = 1/16 lb = 28.349523125 g.
//   - 1 US fl oz = 29.5735295625 ml (exact); 1 tsp = 1/6 fl oz; 1 tbsp = 3 tsp;
//     1 cup = 8 fl oz = 48 tsp = 236.5882365 ml; pint/quart/gallon scale from cup.
// DENSITY SOURCES (see DENSITY table below): King Arthur Baking Ingredient Weight
//   Chart (cup weights), USDA FoodData Central (egg/onion item weights), water by
//   definition (~1.0 g/ml). g/ml is derived as gramsPerCup / 236.5882365 so the
//   density and the volume base stay internally consistent.
// =============================================================================
import { parseLeadingQuantity, formatQuantity } from './chefs-corner.js';

export const DIMENSION = { WEIGHT: 'weight', VOLUME: 'volume', COUNT: 'count' };

const ML_PER_CUP = 236.5882365; // exact (8 US fl oz)

// Unit registry. `base` is the exact factor to the dimension's base unit:
//   weight base = gram, volume base = millilitre.
export const UNITS = {
  // ── weight ────────────────────────────────────────────────────────────────
  g:  { dim: DIMENSION.WEIGHT, base: 1,             system: 'metric',   label: 'g'  },
  kg: { dim: DIMENSION.WEIGHT, base: 1000,          system: 'metric',   label: 'kg' },
  oz: { dim: DIMENSION.WEIGHT, base: 28.349523125,  system: 'american', label: 'oz' },
  lb: { dim: DIMENSION.WEIGHT, base: 453.59237,     system: 'american', label: 'lb' },
  // ── volume ──────────────────────────────────────────────────────────────────
  ml:     { dim: DIMENSION.VOLUME, base: 1,                system: 'metric',   label: 'ml'    },
  l:      { dim: DIMENSION.VOLUME, base: 1000,             system: 'metric',   label: 'L'     },
  tsp:    { dim: DIMENSION.VOLUME, base: 4.92892159375,    system: 'american', label: 'tsp'   },
  tbsp:   { dim: DIMENSION.VOLUME, base: 14.78676478125,   system: 'american', label: 'tbsp'  },
  floz:   { dim: DIMENSION.VOLUME, base: 29.5735295625,    system: 'american', label: 'fl oz' },
  cup:    { dim: DIMENSION.VOLUME, base: ML_PER_CUP,       system: 'american', label: 'cup'   },
  pint:   { dim: DIMENSION.VOLUME, base: 473.176473,       system: 'american', label: 'pint'  },
  quart:  { dim: DIMENSION.VOLUME, base: 946.352946,       system: 'american', label: 'quart' },
  gallon: { dim: DIMENSION.VOLUME, base: 3785.411784,      system: 'american', label: 'gallon'},
};

// Spelling/abbreviation aliases -> canonical unit key. Matched case-insensitively
// with a trailing-period and plural-'s' tolerated by normalizeUnit.
const UNIT_ALIASES = {
  g: 'g', gram: 'g', grams: 'g', gr: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg', kilo: 'kg', kilos: 'kg',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  ml: 'ml', milliliter: 'ml', millilitre: 'ml', milliliters: 'ml', millilitres: 'ml', cc: 'ml',
  l: 'l', liter: 'l', litre: 'l', liters: 'l', litres: 'l',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp', t: 'tsp',
  tbsp: 'tbsp', tbs: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp', T: 'tbsp',
  floz: 'floz',
  cup: 'cup', cups: 'cup', c: 'cup',
  pint: 'pint', pints: 'pint', pt: 'pint',
  quart: 'quart', quarts: 'quart', qt: 'quart',
  gallon: 'gallon', gallons: 'gallon', gal: 'gallon',
};

// A non-unit leading word (e.g. "bag", "clove", "packet") simply isn't in the
// unit registry, so normalizeUnit returns null and parseAmount tags it COUNT — we
// scale the number but never invent a weight/volume for it (unless an item-weight
// entry exists, surfaced separately + flagged approximate).

// Normalize a raw unit token to a canonical key, or null if not a known unit.
// Note: 'T' (tablespoon) is the ONLY case-sensitive alias; everything else lowercases.
export function normalizeUnit(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim().replace(/\.$/, '');
  if (trimmed === 'T') return 'tbsp'; // capital T = tablespoon (lowercase t = tsp)
  const lower = trimmed.toLowerCase();
  if (UNIT_ALIASES[lower]) return UNIT_ALIASES[lower];
  // tolerate a stray trailing plural that an alias didn't list
  if (lower.endsWith('s') && UNIT_ALIASES[lower.slice(0, -1)]) return UNIT_ALIASES[lower.slice(0, -1)];
  return null;
}

// -----------------------------------------------------------------------------
// EXACT within-dimension conversion. Throws on a cross-dimension request — that
// path must go through density (crossToWeight / crossToVolume).
// -----------------------------------------------------------------------------
export function toBase(qty, unitKey) {
  const u = UNITS[unitKey];
  if (!u) throw new Error(`unknown unit: ${unitKey}`);
  return qty * u.base;
}
export function fromBase(baseQty, unitKey) {
  const u = UNITS[unitKey];
  if (!u) throw new Error(`unknown unit: ${unitKey}`);
  return baseQty / u.base;
}
export function convert(qty, fromUnit, toUnit) {
  const a = UNITS[fromUnit];
  const b = UNITS[toUnit];
  if (!a || !b) throw new Error(`unknown unit in convert: ${fromUnit} -> ${toUnit}`);
  if (a.dim !== b.dim) {
    throw new Error(`cross-dimension convert needs density: ${fromUnit} (${a.dim}) -> ${toUnit} (${b.dim})`);
  }
  return (qty * a.base) / b.base; // exact
}

// =============================================================================
// DENSITY — g/ml, ingredient-specific. Cross-dimension (volume<->weight) ONLY.
// gramsPerCup is the cited source value; gPerMl = gramsPerCup / 236.5882365.
// `match` is an ordered keyword list (longest/most-specific first) used to map a
// free-text ingredient name to its density. Water is the one clean 1:1 case.
// =============================================================================
export const DENSITY = {
  water:        { gPerMl: 1.0,                 gramsPerCup: 236.5882365, source: 'definition (~1.0 g/ml)' },
  flour:        { gPerMl: 120 / ML_PER_CUP,    gramsPerCup: 120, source: 'King Arthur (AP flour 120 g/cup)' },
  'bread flour':{ gPerMl: 120 / ML_PER_CUP,    gramsPerCup: 120, source: 'King Arthur (120 g/cup)' },
  sugar:        { gPerMl: 200 / ML_PER_CUP,    gramsPerCup: 200, source: 'King Arthur (granulated 200 g/cup)' },
  'brown sugar':{ gPerMl: 213 / ML_PER_CUP,    gramsPerCup: 213, source: 'King Arthur (packed 213 g/cup)' },
  'powdered sugar': { gPerMl: 113 / ML_PER_CUP, gramsPerCup: 113, source: 'King Arthur (113 g/cup)' },
  milk:         { gPerMl: 242 / ML_PER_CUP,    gramsPerCup: 242, source: 'King Arthur (242 g/cup, ~1.03)' },
  butter:       { gPerMl: 227 / ML_PER_CUP,    gramsPerCup: 227, source: 'King Arthur (1 cup = 227 g)' },
  oil:          { gPerMl: 0.92,                gramsPerCup: 0.92 * ML_PER_CUP, source: 'standard cooking oil ~0.92 g/ml' },
  honey:        { gPerMl: 340 / ML_PER_CUP,    gramsPerCup: 340, source: 'King Arthur (340 g/cup, ~1.44)' },
  'maple syrup':{ gPerMl: 322 / ML_PER_CUP,    gramsPerCup: 322, source: 'King Arthur (322 g/cup, ~1.36)' },
  salt:         { gPerMl: 6 / UNITS.tsp.base,  gramsPerCup: (6 / UNITS.tsp.base) * ML_PER_CUP, source: 'King Arthur (table salt 6 g/tsp, ~1.22)' },
  rice:         { gPerMl: 185 / ML_PER_CUP,    gramsPerCup: 185, source: 'King Arthur (long-grain 185 g/cup)' },
  'cocoa powder': { gPerMl: 85 / ML_PER_CUP,   gramsPerCup: 85, source: 'King Arthur (85 g/cup)' },
};

// Per-ITEM weights for count ingredients (approximate, always flagged ~).
export const ITEM_WEIGHT_G = {
  egg:   { grams: 50, source: 'USDA large egg ~50 g' },
  clove: { grams: 3,  source: 'garlic clove ~3 g' },
  onion: { grams: 110, source: 'USDA medium onion ~110 g' },
};

// Ordered density keyword matchers (most specific first so "brown sugar" beats
// "sugar", "bread flour" beats "flour"). Returns the density entry + key or null.
const DENSITY_MATCHERS = [
  ['brown sugar', 'brown sugar'], ['powdered sugar', 'powdered sugar'], ['confectioner', 'powdered sugar'],
  ['bread flour', 'bread flour'], ['maple syrup', 'maple syrup'], ['cocoa', 'cocoa powder'],
  ['flour', 'flour'], ['sugar', 'sugar'], ['butter', 'butter'], ['olive oil', 'oil'], ['oil', 'oil'],
  ['milk', 'milk'], ['honey', 'honey'], ['water', 'water'], ['salt', 'salt'], ['rice', 'rice'],
];

export function densityFor(name) {
  const n = String(name || '').toLowerCase();
  for (const [needle, key] of DENSITY_MATCHERS) {
    if (n.includes(needle)) return { key, ...DENSITY[key] };
  }
  return null;
}

export function itemWeightFor(name) {
  const n = String(name || '').toLowerCase();
  for (const key of Object.keys(ITEM_WEIGHT_G)) {
    if (n.includes(key)) return { key, ...ITEM_WEIGHT_G[key] };
  }
  return null;
}

// Cross-dimension conversions — DENSITY REQUIRED. Return null (never a fabricated
// number) when no density is known.
export function volumeToGrams(ml, name) {
  const d = densityFor(name);
  if (!d) return null;
  return { grams: ml * d.gPerMl, density: d };
}
export function weightToMl(grams, name) {
  const d = densityFor(name);
  if (!d) return null;
  return { ml: grams / d.gPerMl, density: d };
}

// =============================================================================
// PARSE — split an ingredient line into { qty, unit, dim, name, raw, hadQuantity }.
// Reuses chefs-corner's leading-quantity parser, then claims a unit token.
// =============================================================================
export function parseAmount(text) {
  const raw = String(text || '');
  const q = parseLeadingQuantity(raw);
  if (!q) {
    return { qty: null, unit: null, dim: null, name: raw.trim(), raw, hadQuantity: false };
  }
  const rest = q.rest;
  // Try the first token (and the two-token "fl oz") as a unit.
  const tokens = rest.split(/\s+/);
  let unit = null;
  let nameStart = 0;
  if (tokens.length >= 2 && normalizeUnit(`${tokens[0]} ${tokens[1]}`.replace(/\s+/, '')) === 'floz') {
    unit = 'floz'; nameStart = 2;
  } else if (tokens[0] && /^fl$/i.test(tokens[0]) && /^oz\.?$/i.test(tokens[1] || '')) {
    unit = 'floz'; nameStart = 2;
  } else {
    const u = normalizeUnit(tokens[0]);
    if (u) { unit = u; nameStart = 1; }
  }
  const name = tokens.slice(nameStart).join(' ').trim();
  const dim = unit ? UNITS[unit].dim : DIMENSION.COUNT;
  return { qty: q.value, unit, dim, name, raw, hadQuantity: true };
}

// Scale an amount by a factor — at FULL precision, in its OWN unit (scale first).
export function scaleAmount(parsed, factor) {
  if (parsed.qty == null || !Number.isFinite(factor)) return parsed;
  return { ...parsed, qty: parsed.qty * factor };
}

// =============================================================================
// DISPLAY FORMATTERS — rounding lives HERE only, never in the math above.
// =============================================================================
function trimNum(n, dp) {
  const r = Number(n.toFixed(dp));
  return String(r);
}

// Weight -> a readable string in the requested system (exact dimension).
export function formatWeight(grams, system) {
  if (system === 'metric') {
    if (grams >= 1000) return `${trimNum(grams / 1000, 2)} kg`;
    if (grams >= 10) return `${Math.round(grams)} g`;
    return `${trimNum(grams, 1)} g`;
  }
  // american: oz, rolling up to lb at >= 1 lb
  const oz = grams / UNITS.oz.base;
  if (oz >= 16) return `${trimNum(grams / UNITS.lb.base, 2)} lb`;
  return `${trimNum(oz, oz >= 10 ? 1 : 2)} oz`;
}

// Volume -> a readable string in the requested system (exact dimension). American
// volume uses traditional fraction glyphs via formatQuantity.
export function formatVolume(ml, system) {
  if (system === 'metric') {
    if (ml >= 1000) return `${trimNum(ml / 1000, 2)} L`;
    if (ml >= 10) return `${Math.round(ml)} ml`;
    return `${trimNum(ml, 1)} ml`;
  }
  // Prefer cups at >= 1/4 cup (how recipes read), then tbsp, then tsp.
  const cupVal = ml / UNITS.cup.base;
  if (cupVal >= 0.25) return `${formatQuantity(cupVal)} cup`;
  const tbspVal = ml / UNITS.tbsp.base;
  if (tbspVal >= 1) return `${formatQuantity(tbspVal)} tbsp`;
  return `${formatQuantity(ml / UNITS.tsp.base)} tsp`;
}

// =============================================================================
// describeIngredient — the one call the UI makes per line. Scales (full precision)
// then renders BOTH systems within the amount's dimension, plus an approximate
// cross-dimension hint when density is known. Honest: unknown cross-conversions
// are never fabricated — `note` says so.
//
// Returns:
//   { raw, name, dim, hadQuantity,
//     american, metric,          // formatted "amount + name" strings (within-dim, exact)
//     altHint,                   // "~120 g" cross-dim equivalent (approximate) | null
//     approximate,               // true if any "~" value is shown
//     note }                     // honest note (e.g. density unknown) | null
// =============================================================================
export function describeIngredient(text, factor = 1) {
  const parsed = scaleAmount(parseAmount(text), factor);
  const { qty, unit, dim, name, raw, hadQuantity } = parsed;

  const withName = (amount) => `${amount} ${name}`.trim();

  // No parseable quantity (e.g. "Salt, to taste") — nothing to scale or convert.
  if (!hadQuantity) {
    const r = raw.trim();
    return { raw, name, dim: null, hadQuantity: false, american: r, metric: r, americanAmount: '', metricAmount: '', altHint: null, approximate: false, note: null };
  }

  // Count (no metric/imperial unit): scale the number, keep the words. Offer a
  // flagged approximate gram-equivalent for known items (eggs, cloves).
  if (!unit) {
    const amount = formatQuantity(qty);
    const line = withName(amount);
    const item = itemWeightFor(name);
    const altHint = item ? `~${formatWeight(qty * item.grams, 'metric')} (${item.source})` : null;
    return { raw, name, dim: DIMENSION.COUNT, hadQuantity: true, american: line, metric: line, americanAmount: amount, metricAmount: amount, altHint, approximate: !!altHint, note: null };
  }

  if (dim === DIMENSION.WEIGHT) {
    const grams = toBase(qty, unit);
    const americanAmount = formatWeight(grams, 'american');
    const metricAmount = formatWeight(grams, 'metric');
    const alt = weightToMl(grams, name); // approximate volume, only if density known
    const altHint = alt ? `~${formatVolume(alt.ml, 'american')} (${alt.density.source})` : null;
    return { raw, name, dim, hadQuantity: true, american: withName(americanAmount), metric: withName(metricAmount), americanAmount, metricAmount, altHint, approximate: !!altHint, note: null };
  }

  if (dim === DIMENSION.VOLUME) {
    const ml = toBase(qty, unit);
    const americanAmount = formatVolume(ml, 'american');
    const metricAmount = formatVolume(ml, 'metric');
    const alt = volumeToGrams(ml, name); // approximate weight, only if density known
    const altHint = alt ? `~${formatWeight(alt.grams, 'metric')} (${alt.density.source})` : null;
    const note = alt ? null : 'no density on file — kept by volume (not guessed)';
    return { raw, name, dim, hadQuantity: true, american: withName(americanAmount), metric: withName(metricAmount), americanAmount, metricAmount, altHint, approximate: !!altHint, note };
  }

  // Fallback (shouldn't happen): echo the raw line.
  const r = raw.trim();
  return { raw, name, dim: null, hadQuantity: true, american: r, metric: r, americanAmount: '', metricAmount: '', altHint: null, approximate: false, note: null };
}
