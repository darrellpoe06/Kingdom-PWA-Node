// recipe-units — the math that CANNOT be wrong (a bad multiply ruins a 130-person
// cook). Every conversion factor + density + the scaler is pinned to the digit.
// Test-until-tight: a failing case names the exact ingredient/conversion.
import { describe, it, expect } from 'vitest';
import {
  UNITS, normalizeUnit, toBase, fromBase, convert,
  DENSITY, densityFor, volumeToGrams, weightToMl,
  parseAmount, scaleAmount, describeIngredient,
} from '../lib/recipe-units.js';

const approx = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

describe('EXACT within-dimension factors (pure, to the digit)', () => {
  it('weight base factors are exact (g)', () => {
    expect(UNITS.oz.base).toBe(28.349523125);   // 1/16 lb, exact
    expect(UNITS.lb.base).toBe(453.59237);       // international avoirdupois, exact
    expect(UNITS.kg.base).toBe(1000);
  });
  it('volume base factors are internally consistent (cup = 8 fl oz = 16 tbsp = 48 tsp)', () => {
    expect(UNITS.cup.base).toBe(236.5882365);
    expect(approx(UNITS.floz.base * 8, UNITS.cup.base)).toBe(true);
    expect(approx(UNITS.tbsp.base * 16, UNITS.cup.base)).toBe(true);
    expect(approx(UNITS.tsp.base * 48, UNITS.cup.base)).toBe(true);
    expect(approx(UNITS.tbsp.base, UNITS.tsp.base * 3)).toBe(true);
  });
  it('weight<->weight conversions', () => {
    expect(convert(1, 'lb', 'g')).toBe(453.59237);
    expect(convert(1, 'lb', 'oz')).toBe(16);
    expect(convert(1, 'oz', 'g')).toBe(28.349523125);
    expect(convert(1, 'kg', 'lb').toFixed(5)).toBe('2.20462'); // 1000 / 453.59237
    expect(convert(1, 'kg', 'oz').toFixed(5)).toBe('35.27396'); // 1000 / 28.349523125
  });
  it('volume<->volume conversions', () => {
    expect(convert(1, 'cup', 'tbsp')).toBe(16);
    expect(convert(1, 'cup', 'tsp')).toBe(48);
    expect(convert(1, 'tbsp', 'tsp')).toBe(3);
    expect(convert(16, 'tbsp', 'cup')).toBe(1);
    expect(convert(1, 'cup', 'ml')).toBe(236.5882365);
    expect(convert(1, 'l', 'cup').toFixed(5)).toBe('4.22675'); // 1000 / 236.5882365
    expect(convert(1, 'floz', 'ml')).toBe(29.5735295625);
  });
  it('toBase / fromBase round-trip exactly', () => {
    expect(fromBase(toBase(3, 'cup'), 'cup')).toBe(3);
    expect(fromBase(toBase(2.5, 'lb'), 'lb')).toBe(2.5);
  });
  it('REFUSES a cross-dimension convert (must go through density)', () => {
    expect(() => convert(1, 'cup', 'g')).toThrow(/density/i);
    expect(() => convert(1, 'lb', 'ml')).toThrow(/density/i);
  });
});

describe('unit normalization (aliases, plurals, the t/T trap)', () => {
  it('maps common spellings', () => {
    expect(normalizeUnit('lbs')).toBe('lb');
    expect(normalizeUnit('pounds')).toBe('lb');
    expect(normalizeUnit('grams')).toBe('g');
    expect(normalizeUnit('Tablespoons')).toBe('tbsp');
    expect(normalizeUnit('cups')).toBe('cup');
    expect(normalizeUnit('milliliters')).toBe('ml');
    expect(normalizeUnit('oz.')).toBe('oz');
  });
  it('distinguishes lowercase t (tsp) from capital T (tbsp)', () => {
    expect(normalizeUnit('t')).toBe('tsp');
    expect(normalizeUnit('T')).toBe('tbsp');
  });
  it('returns null for non-units (bag, packet, clove)', () => {
    expect(normalizeUnit('bag')).toBeNull();
    expect(normalizeUnit('clove')).toBeNull();
  });
});

describe('DENSITY — cross-dimension ONLY with an ingredient-specific density', () => {
  it('matches most-specific name first', () => {
    expect(densityFor('all-purpose flour').key).toBe('flour');
    expect(densityFor('bread flour').key).toBe('bread flour');
    expect(densityFor('granulated sugar').key).toBe('sugar');
    expect(densityFor('packed brown sugar').key).toBe('brown sugar');
    expect(densityFor('extra-virgin olive oil').key).toBe('oil');
    expect(densityFor('vegan butter, softened').key).toBe('butter');
    expect(densityFor('water').key).toBe('water');
  });
  it('returns null (NEVER a guess) for an unknown ingredient', () => {
    expect(densityFor('mushrooms, sliced')).toBeNull();
    expect(densityFor('taco seasoning')).toBeNull();
    expect(volumeToGrams(236.5882365, 'mushrooms')).toBeNull();
    expect(weightToMl(100, 'mushrooms')).toBeNull();
  });
  it('water is the clean 1:1 volume<->weight case', () => {
    const v = volumeToGrams(236.5882365, 'water'); // 1 cup water
    expect(approx(v.grams, 236.5882365)).toBe(true);
  });
  it('1 cup flour ~= 120 g, 1 cup sugar ~= 200 g, 1 cup oil ~= 218 g (cited)', () => {
    expect(approx(volumeToGrams(UNITS.cup.base, 'flour').grams, 120)).toBe(true);
    expect(approx(volumeToGrams(UNITS.cup.base, 'sugar').grams, 200)).toBe(true);
    expect(approx(volumeToGrams(UNITS.cup.base, 'oil').grams, 0.92 * UNITS.cup.base)).toBe(true);
    expect(DENSITY.flour.source).toMatch(/King Arthur/);
  });
});

describe('parseAmount — dimension tagging', () => {
  it('weight: "2 lbs mushrooms, sliced"', () => {
    expect(parseAmount('2 lbs mushrooms, sliced')).toMatchObject({ qty: 2, unit: 'lb', dim: 'weight', name: 'mushrooms, sliced' });
  });
  it('volume: "1/2 cup vegan butter" and unicode "½ cup ketchup"', () => {
    expect(parseAmount('1/2 cup vegan butter')).toMatchObject({ qty: 0.5, unit: 'cup', dim: 'volume', name: 'vegan butter' });
    expect(parseAmount('½ cup ketchup')).toMatchObject({ qty: 0.5, unit: 'cup', dim: 'volume', name: 'ketchup' });
  });
  it('count: "3 eggs" / "3 cloves garlic" / "1 packet taco seasoning"', () => {
    expect(parseAmount('3 eggs')).toMatchObject({ qty: 3, unit: null, dim: 'count', name: 'eggs' });
    expect(parseAmount('3 cloves garlic, minced')).toMatchObject({ qty: 3, unit: null, dim: 'count' });
    expect(parseAmount('1 packet taco seasoning')).toMatchObject({ qty: 1, unit: null, dim: 'count' });
  });
  it('weight in grams (pasta): "200 g pasta"', () => {
    expect(parseAmount('200 g pasta')).toMatchObject({ qty: 200, unit: 'g', dim: 'weight', name: 'pasta' });
  });
  it('no quantity: "Salt, to taste" parses as un-quantified', () => {
    expect(parseAmount('Salt, to taste')).toMatchObject({ hadQuantity: false });
  });
});

describe('SCALING — full precision, scale-first, ratio-preserving', () => {
  it('scales the raw value at full float precision (no display rounding in the math)', () => {
    const p = scaleAmount(parseAmount('1 oz spice'), 35 / 6); // serves 6 -> 35
    expect(p.qty).toBe(35 / 6); // exact float, not pre-rounded
  });
  it('a scale-up does NOT drift the ratio between two ingredients', () => {
    const factor = 130 / 6; // serves 6 -> 130
    const flour = scaleAmount(parseAmount('2 cup flour'), factor).qty;
    const sugar = scaleAmount(parseAmount('1 cup sugar'), factor).qty;
    expect(approx(flour / sugar, 2)).toBe(true); // 2:1 preserved exactly
  });
});

describe('describeIngredient — the hard cases, in BOTH unit systems', () => {
  it('Taco recipe 6 -> 30 (x5): cup volume scales + shows both systems', () => {
    const d = describeIngredient('1 cup vegetable stock', 5);
    expect(d.dim).toBe('volume');
    expect(d.american).toBe('5 cup vegetable stock');
    expect(d.metric).toBe('1.18 L vegetable stock'); // 5 * 236.5882365 = 1182.94 ml
  });
  it('Taco x5: "½ cup mustard" -> 2.5 cup / 591 ml', () => {
    const d = describeIngredient('½ cup mustard', 5);
    expect(d.american).toBe('2 ½ cup mustard');
    expect(d.metric).toBe('591 ml mustard'); // 2.5 * 236.5882365 = 591.47
  });
  it('Taco x5: "2 tbsp olive oil" stays sensible + offers approximate weight via density', () => {
    const d = describeIngredient('2 tbsp olive oil', 5); // 10 tbsp
    expect(d.american).toBe('⅝ cup olive oil');          // 10 tbsp = 0.625 cup
    expect(d.metric).toBe('148 ml olive oil');           // 10 * 14.78676 = 147.87
    expect(d.altHint).toMatch(/^~136 g/);                // 147.87 ml * 0.92 = 136 g, approximate
    expect(d.approximate).toBe(true);
  });
  it('"1 oz" x5.8333 (serves 6 -> 35) = 5.83 oz / ~165 g', () => {
    const d = describeIngredient('1 oz seasoning', 35 / 6);
    expect(d.american).toBe('5.83 oz seasoning');
    expect(d.metric).toBe('165 g seasoning'); // 5.8333 * 28.349523 = 165.37 -> 165
  });
  it('pasta by WEIGHT: "200 g pasta" x5 = 1 kg / 2.2 lb', () => {
    const d = describeIngredient('200 g pasta', 5);
    expect(d.metric).toBe('1 kg pasta');
    expect(d.american).toBe('2.2 lb pasta');
  });
  it('eggs by COUNT: "3 eggs" x5 = 15 eggs, with a flagged ~750 g equivalent', () => {
    const d = describeIngredient('3 eggs', 5);
    expect(d.dim).toBe('count');
    expect(d.american).toBe('15 eggs');
    expect(d.metric).toBe('15 eggs');
    expect(d.altHint).toMatch(/^~750 g/);
    expect(d.approximate).toBe(true);
  });
  it('water is the clean 1:1 case: "1 cup water" -> ~237 g', () => {
    const d = describeIngredient('1 cup water', 1);
    expect(d.american).toBe('1 cup water');
    expect(d.metric).toBe('237 ml water');
    expect(d.altHint).toMatch(/^~237 g/);
  });
  it('BAKING precision: "1 cup flour" -> ~120 g (cited density)', () => {
    const d = describeIngredient('1 cup all-purpose flour', 1);
    expect(d.altHint).toMatch(/^~120 g/);
    expect(d.altHint).toMatch(/King Arthur/);
  });
  it('UNKNOWN density is NEVER guessed: volume kept + flagged', () => {
    const d = describeIngredient('1 cup diced tomatoes', 1);
    expect(d.american).toBe('1 cup diced tomatoes');
    expect(d.altHint).toBeNull();
    expect(d.note).toMatch(/no density on file/i);
  });
  it('un-quantified lines pass through untouched ("Salt, to taste")', () => {
    const d = describeIngredient('Salt, to taste', 5);
    expect(d.american).toBe('Salt, to taste');
    expect(d.hadQuantity).toBe(false);
  });
  it('a non-standard count unit ("4 bags crumbles") scales but is not converted', () => {
    const d = describeIngredient('4 bags vegan protein crumbles', 5);
    expect(d.american).toBe('20 bags vegan protein crumbles');
    expect(d.altHint).toBeNull();
  });
});
