// =============================================================================
// recipe-costing.test — recipe cost from real inventory item costs, honestly
// =============================================================================
import { describe, it, expect } from 'vitest';
import { matchItem, convertToItemUnit, costLine, costRecipe, foodCostMargin } from '../lib/recipe-costing.js';

const items = [
  { id: 'inv-chk', name: 'Chicken breast', unit: 'lb', unitCost: 3, active: true },
  { id: 'inv-flr', name: 'Flour',          unit: 'lb', unitCost: 0.5, active: true },
  { id: 'inv-oni', name: 'Onion',          unit: 'each', unitCost: 0.4, active: true },
  { id: 'inv-oil', name: 'Olive oil',      unit: 'l',  unitCost: 8, active: true },
  { id: 'inv-old', name: 'Old stock',      unit: 'lb', unitCost: 99, active: false },
];

describe('matchItem', () => {
  it('matches an item whose name is contained in the ingredient text', () => {
    expect(matchItem('2 lb chicken breast, diced', items).id).toBe('inv-chk');
    expect(matchItem('1 onion, chopped', items).id).toBe('inv-oni');
  });
  it('returns null for an unmatched ingredient and skips inactive items', () => {
    expect(matchItem('3 cloves garlic', items)).toBeNull();
    expect(matchItem('old stock', items)).toBeNull(); // inactive
  });
});

describe('convertToItemUnit', () => {
  it('same-dimension weight conversion is exact (oz -> lb)', () => {
    const r = convertToItemUnit({ qty: 8, ingUnitKey: 'oz', ingDim: 'weight', ingName: 'chicken', itemUnitRaw: 'lb' });
    expect(r).toMatchObject({ approximate: false });
    expect(r.qty).toBeCloseTo(0.5, 10);
  });
  it('cross-dimension volume->weight uses density and flags approximate (flour)', () => {
    // 2 cups flour: 2 * 236.5882365 ml * (120/236.5882365 g/ml) = 240 g; /453.59237 = 0.52911 lb
    const r = convertToItemUnit({ qty: 2, ingUnitKey: 'cup', ingDim: 'volume', ingName: 'flour', itemUnitRaw: 'lb' });
    expect(r.approximate).toBe(true);
    expect(r.qty).toBeCloseTo(240 / 453.59237, 6);
  });
  it('returns null when cross-dimension has no known density', () => {
    expect(convertToItemUnit({ qty: 1, ingUnitKey: 'cup', ingDim: 'volume', ingName: 'diced tomatoes', itemUnitRaw: 'lb' })).toBeNull();
  });
  it('prices a bare count against an each item, but not against a case', () => {
    expect(convertToItemUnit({ qty: 2, ingUnitKey: null, ingDim: 'count', ingName: 'onion', itemUnitRaw: 'each' })).toEqual({ qty: 2, approximate: false });
    expect(convertToItemUnit({ qty: 2, ingUnitKey: null, ingDim: 'count', ingName: 'onion', itemUnitRaw: 'case' })).toBeNull();
  });
});

describe('costLine', () => {
  it('prices a matched, convertible line (2 lb chicken @ $3 = $6)', () => {
    const l = costLine('2 lb chicken breast', items);
    expect(l).toMatchObject({ matched: true, costable: true, reason: null });
    expect(l.lineCost).toBe(6);
  });
  it('scales by the serving factor', () => {
    expect(costLine('2 lb chicken breast', items, 1.5).lineCost).toBe(9); // 3 lb * $3
  });
  it('reports an unmatched ingredient (never $0 silently)', () => {
    expect(costLine('3 cloves garlic', items)).toMatchObject({ matched: false, costable: false, reason: 'no-item' });
  });
  it('reports a matched-but-quantityless line', () => {
    expect(costLine('salt to taste', [{ id: 'inv-salt', name: 'salt', unit: 'lb', unitCost: 1, active: true }]))
      .toMatchObject({ matched: true, costable: false, reason: 'no-quantity' });
  });
  it('prices an each ingredient (1 onion @ $0.40)', () => {
    expect(costLine('1 onion, diced', items).lineCost).toBeCloseTo(0.4, 10);
  });
});

describe('costRecipe', () => {
  const recipe = {
    servingsBase: 4,
    ingredientSections: [
      { title: null, items: [
        '2 lb chicken breast',   // $6
        '1 onion, diced',        // $0.40
        '3 cloves garlic',       // unmatched
        'salt to taste',         // matched-no-qty (no salt item here -> unmatched)
      ] },
    ],
  };
  const r = costRecipe(recipe, items);

  it('sums only the costable lines into the batch cost', () => {
    expect(r.perBatch).toBeCloseTo(6.4, 10); // 6 + 0.40
  });
  it('computes per-serving from the recipe servings base', () => {
    expect(r.perServing).toBeCloseTo(6.4 / 4, 10);
  });
  it('reports honest coverage and flags partial', () => {
    expect(r.totalLines).toBe(4);
    expect(r.costableLines).toBe(2);
    expect(r.coverage).toBeCloseTo(0.5, 10);
    expect(r.partial).toBe(true);
  });
  it('per-serving is invariant to the serving factor (cost and servings scale together)', () => {
    const scaled = costRecipe(recipe, items, { factor: 3 });
    expect(scaled.perBatch).toBeCloseTo(6.4 * 3, 10);
    expect(scaled.perServing).toBeCloseTo(r.perServing, 10);
  });
});

describe('foodCostMargin', () => {
  it('computes food-cost % and margin from a menu price', () => {
    const m = foodCostMargin(3, 12);
    expect(m.foodCostPct).toBeCloseTo(25, 10);
    expect(m.marginDollars).toBeCloseTo(9, 10);
    expect(m.marginPct).toBeCloseTo(75, 10);
  });
  it('returns null fields when no menu price (money stays the owner\'s hand)', () => {
    expect(foodCostMargin(3, 0)).toEqual({ foodCostPct: null, marginDollars: null, marginPct: null });
  });
});
