// =============================================================================
// Christina's Homemade Juice — his table, derived not typed
// =============================================================================
// He supplied 18.3 cal/oz and a preloaded serving table. Every row he listed is
// checked here against the FORMULA, because the servings are derived from the
// two rates rather than stored as a parallel list — a typed list can silently
// drift from the formula it claims to follow.
import { describe, it, expect } from 'vitest';
import {
  CHRISTINAS_JUICE, JUICE_CALORIES_PER_OZ, juiceServing, juiceServingOptions, servingsPerBatch,
} from '../lib/juice-recipes.js';

describe('the recipe he gave', () => {
  it('carries his ingredients verbatim, in his order', () => {
    expect(CHRISTINAS_JUICE.ingredients).toEqual([
      '5 apples', '5 oranges', '1 whole pineapple', '1/2 bag baby carrots',
      '1/2 bag celery', 'Lots of spinach', '1 piece/stick fresh ginger',
      '1 whole cucumber', '1/3 head red lettuce',
    ]);
  });
  it('is his batch size, his default serving, and his rate', () => {
    expect(CHRISTINAS_JUICE.batchOz).toBe(72);
    expect(CHRISTINAS_JUICE.defaultServingOz).toBe(18);
    expect(JUICE_CALORIES_PER_OZ).toBe(18.3);
  });
  it('is marked an ESTIMATE, in his own reasoning', () => {
    expect(CHRISTINAS_JUICE.estimate).toBe(true);
    expect(CHRISTINAS_JUICE.estimateNote).toMatch(/pulp/i);
  });
});

describe('every serving he listed, checked against the formula', () => {
  // oz -> the calories HE stated
  const HIS_TABLE = [[6, 110], [8, 146], [12, 220], [16, 293], [18, 329], [24, 439], [36, 659]];
  it.each(HIS_TABLE)('%i oz is %i calories', (oz, cal) => {
    expect(juiceServing(oz).calories).toBe(cal);
  });
  it('protein tracks 3 g at 18 oz', () => {
    expect(juiceServing(18).proteinG).toBe(3);
    expect(juiceServing(6).proteinG).toBe(1);
    expect(juiceServing(12).proteinG).toBe(2);
    expect(juiceServing(24).proteinG).toBe(4);
    expect(juiceServing(36).proteinG).toBe(6);
  });
  it('preloads exactly his seven options, with 18 oz default', () => {
    const opts = juiceServingOptions();
    expect(opts.map((o) => o.oz)).toEqual([6, 8, 12, 16, 18, 24, 36]);
    expect(opts.filter((o) => o.isDefault).map((o) => o.oz)).toEqual([18]);
  });
});

describe('custom ounces use the SAME formula — no second source of truth', () => {
  it('9 oz is half of 18 oz, exactly as he said', () => {
    const nine = juiceServing(9);
    const eighteen = juiceServing(18);
    expect(nine.calories).toBe(165);              // 329 / 2, rounded
    expect(nine.proteinG).toBe(eighteen.proteinG / 2);
  });
  it('an arbitrary amount still follows oz x 18.3', () => {
    expect(juiceServing(20).calories).toBe(Math.round(20 * 18.3));
    expect(juiceServing(1).calories).toBe(18);
  });
  it('PROVEN-TO-CATCH: a nonsense amount is NULL, never a 0-calorie serving', () => {
    expect(juiceServing(0)).toBeNull();
    expect(juiceServing(-5)).toBeNull();
    expect(juiceServing('abc')).toBeNull();
    expect(juiceServing(null)).toBeNull();
  });
  it('carries the estimate flag onto every serving it produces', () => {
    expect(juiceServing(18).estimate).toBe(true);
  });
});

describe('a batch', () => {
  it('is four 18 oz servings', () => {
    expect(servingsPerBatch()).toBe(4);
  });
  it('answers for any serving size', () => {
    expect(servingsPerBatch(CHRISTINAS_JUICE, 12)).toBe(6);
  });
  it('refuses nonsense rather than dividing by zero', () => {
    expect(servingsPerBatch(CHRISTINAS_JUICE, 0)).toBeNull();
  });
});
