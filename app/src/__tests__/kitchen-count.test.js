// =============================================================================
// kitchen-count.test — the food-cost / variance / value math, pinned to the digit
// =============================================================================
// The count math is the load-bearing claim of the kitchen vertical ("a real
// count computes value and variance"). It is verified here against hand-computed
// numbers, including an END-TO-END proof that a count reconciles the append-only
// ledger so derived on-hand equals the counted shelf reality.
import { describe, it, expect } from 'vitest';
import {
  makeCount, makeCountLine, lineVariance, lineCountedValue, lineExpectedValue,
  lineVarianceValue, varianceStatus, summarizeCount, countLineToMovement,
  reconcileCount, foodCostPercent, compareToPrevious,
} from '../lib/kitchen-count.js';
import { onHandFor, signedQty, decorateItems } from '../lib/inventory.js';

describe('kitchen-count — normalization', () => {
  it('makeCount defaults to an open whole-kitchen session', () => {
    const c = makeCount();
    expect(c.status).toBe('open');
    expect(c.storageArea).toBeNull();
    expect(c.label).toBe('Inventory count');
  });

  it('makeCount coerces an unknown status to open and trims the label', () => {
    expect(makeCount({ status: 'bogus' }).status).toBe('open');
    expect(makeCount({ label: '  Weekly  ' }).label).toBe('Weekly');
  });

  it('makeCountLine coerces numerics and clamps mode', () => {
    const ln = makeCountLine({ countedQty: '8', expectedQty: '10', unitCost: '2.5', countMode: 'nope' });
    expect(ln.countedQty).toBe(8);
    expect(ln.expectedQty).toBe(10);
    expect(ln.unitCost).toBe(2.5);
    expect(ln.countMode).toBe('unit');
    expect(makeCountLine({ countMode: 'weight' }).countMode).toBe('weight');
  });
});

describe('kitchen-count — per-line math', () => {
  // 8 counted vs 10 expected at $2.50/each — a 2-unit short, $5.00 shrink.
  const short = makeCountLine({ itemId: 'inv-1', countedQty: 8, expectedQty: 10, unitCost: 2.5 });
  // 14 counted vs 12 expected at $3.00 — a 2-unit overage, $6.00 over.
  const over = makeCountLine({ itemId: 'inv-2', countedQty: 14, expectedQty: 12, unitCost: 3 });
  // exact match.
  const match = makeCountLine({ itemId: 'inv-3', countedQty: 5, expectedQty: 5, unitCost: 9.99 });

  it('lineVariance is counted minus expected (signed)', () => {
    expect(lineVariance(short)).toBe(-2);
    expect(lineVariance(over)).toBe(2);
    expect(lineVariance(match)).toBe(0);
  });

  it('lineCountedValue and lineExpectedValue use unit cost', () => {
    expect(lineCountedValue(short)).toBe(20);   // 8 * 2.50
    expect(lineExpectedValue(short)).toBe(25);  // 10 * 2.50
    expect(lineCountedValue(over)).toBe(42);    // 14 * 3
  });

  it('lineVarianceValue is the signed dollar variance', () => {
    expect(lineVarianceValue(short)).toBe(-5);  // -2 * 2.50
    expect(lineVarianceValue(over)).toBe(6);    //  2 * 3
    expect(lineVarianceValue(match)).toBe(0);
  });

  it('varianceStatus classifies match / over / short with a tolerance band', () => {
    expect(varianceStatus(short)).toBe('short');
    expect(varianceStatus(over)).toBe('over');
    expect(varianceStatus(match)).toBe('match');
    // a 2-unit short is within a tolerance of 2 -> reads as a match
    expect(varianceStatus(short, { tolerance: 2 })).toBe('match');
    expect(varianceStatus(short, { tolerance: 1 })).toBe('short');
  });
});

describe('kitchen-count — summarizeCount (a real multi-line count)', () => {
  // Three items counted in one session:
  //   chicken: 18 lb counted vs 20 expected @ $2.00  -> -2 lb, -$4.00 (shrink)
  //   tomato:  30 ea counted vs 24 expected @ $0.50  -> +6 ea, +$3.00 (overage)
  //   rice:    12 ea counted vs 12 expected @ $1.25  ->  0,     $0     (match)
  const lines = [
    makeCountLine({ itemId: 'chicken', countedQty: 18, expectedQty: 20, unitCost: 2,    countUnit: 'lb', countMode: 'weight' }),
    makeCountLine({ itemId: 'tomato',  countedQty: 30, expectedQty: 24, unitCost: 0.5,  countUnit: 'each' }),
    makeCountLine({ itemId: 'rice',    countedQty: 12, expectedQty: 12, unitCost: 1.25, countUnit: 'each' }),
  ];
  const s = summarizeCount(lines);

  it('counted value = sum of counted * cost', () => {
    // 18*2 + 30*0.5 + 12*1.25 = 36 + 15 + 15 = 66
    expect(s.countedValue).toBe(66);
  });
  it('expected value = sum of expected * cost', () => {
    // 20*2 + 24*0.5 + 12*1.25 = 40 + 12 + 15 = 67
    expect(s.expectedValue).toBe(67);
  });
  it('variance value = counted value - expected value', () => {
    expect(s.varianceValue).toBe(-1);             // 66 - 67
    expect(s.varianceValue).toBeCloseTo(s.countedValue - s.expectedValue, 10);
  });
  it('separates shrink (loss) from overage (gain)', () => {
    expect(s.shrinkValue).toBe(-4);               // chicken only
    expect(s.overageValue).toBe(3);               // tomato only
  });
  it('counts lines by variance status', () => {
    expect(s).toMatchObject({ lineCount: 3, matched: 1, over: 1, short: 1 });
  });
});

describe('kitchen-count — reconciliation to the append-only ledger', () => {
  it('countLineToMovement emits a signed adjust; zero-variance and item-less lines emit null', () => {
    const count = makeCount({ id: 'count-1', label: 'Weekly', storageArea: 'walk-in' });
    const mv = countLineToMovement(makeCountLine({ itemId: 'inv-1', countedQty: 8, expectedQty: 10 }), count);
    expect(mv).toMatchObject({ itemId: 'inv-1', kind: 'adjust', qty: -2, location: 'walk-in', ref: 'count-1' });
    expect(mv.reason).toContain('Weekly');
    expect(countLineToMovement(makeCountLine({ itemId: 'inv-1', countedQty: 5, expectedQty: 5 }), count)).toBeNull();
    expect(countLineToMovement(makeCountLine({ itemId: null, countedQty: 9, expectedQty: 1 }), count)).toBeNull();
  });

  it('reconcileCount drops zero-variance lines', () => {
    const count = makeCount({ id: 'count-1' });
    const movements = reconcileCount([
      makeCountLine({ itemId: 'a', countedQty: 8, expectedQty: 10 }),
      makeCountLine({ itemId: 'b', countedQty: 5, expectedQty: 5 }),  // match -> dropped
      makeCountLine({ itemId: 'c', countedQty: 7, expectedQty: 4 }),
    ], count);
    expect(movements).toHaveLength(2);
    expect(movements.map((m) => m.itemId)).toEqual(['a', 'c']);
    expect(movements.map((m) => m.qty)).toEqual([-2, 3]);
  });

  it('END-TO-END: a real count computes value/variance AND reconciles on-hand to the shelf', () => {
    // Real item + a real ledger: received 20, issued 6 -> derived on-hand 14.
    const item = { id: 'chicken', name: 'Chicken breast', unit: 'lb', unitCost: 2 };
    const movements = [
      { id: 'mv-1', itemId: 'chicken', kind: 'in',  qty: 20, occurredAt: '2026-06-20T00:00:00Z' },
      { id: 'mv-2', itemId: 'chicken', kind: 'out', qty: 6,  occurredAt: '2026-06-22T00:00:00Z' },
    ];
    const expected = onHandFor(movements, 'chicken');
    expect(expected).toBe(14);

    // Chef walks the walk-in: only 11 lb are physically there (3 lb shrink).
    const count = makeCount({ id: 'count-walkin', label: 'Walk-in', storageArea: 'walk-in' });
    const line = makeCountLine({
      itemId: 'chicken', countedQty: 11, expectedQty: expected,
      unitCost: item.unitCost, countUnit: 'lb', countMode: 'weight',
    });

    // VALUE + VARIANCE are computed, not painted.
    const s = summarizeCount([line]);
    expect(s.countedValue).toBe(22);     // 11 * 2
    expect(s.expectedValue).toBe(28);    // 14 * 2
    expect(s.varianceValue).toBe(-6);    // 3 lb short * $2
    expect(s.shrinkValue).toBe(-6);

    // CLOSE: reconcile posts the adjust movement, the ledger now agrees with the shelf.
    const adjusts = reconcileCount([line], count).map((m, i) => ({ ...m, id: `adj-${i}`, occurredAt: '2026-06-25T00:00:00Z' }));
    expect(adjusts).toHaveLength(1);
    expect(signedQty(adjusts[0])).toBe(-3);

    const afterLedger = [...movements, ...adjusts];
    expect(onHandFor(afterLedger, 'chicken')).toBe(11);  // derived on-hand == counted reality

    // and decorateItems re-derives the same truth + value for the surface.
    const [decorated] = decorateItems([item], afterLedger);
    expect(decorated.onHand).toBe(11);
    expect(decorated.value).toBe(22);
  });
});

describe('kitchen-count — food cost % (money stays the owner\'s hand)', () => {
  it('cogs / sales as a percent', () => {
    expect(foodCostPercent(300, 1000)).toBe(30);
    expect(foodCostPercent(2800, 8000)).toBe(35);
  });
  it('returns null (honest) when sales is absent or zero — never divides by zero', () => {
    expect(foodCostPercent(300, 0)).toBeNull();
    expect(foodCostPercent(300, null)).toBeNull();
    expect(foodCostPercent(300, undefined)).toBeNull();
  });
});

describe('kitchen-count — compareToPrevious (are we getting tighter?)', () => {
  it('returns null when there is no prior count', () => {
    expect(compareToPrevious(summarizeCount([]), null)).toBeNull();
  });
  it('reports the variance-value delta and whether net variance tightened toward zero', () => {
    const prev = { varianceValue: -20 };
    const cur = { varianceValue: -6 };
    const cmp = compareToPrevious(cur, prev);
    expect(cmp).toMatchObject({ current: -6, previous: -20, delta: 14, tightening: true });
    // a bigger absolute variance is NOT tightening
    expect(compareToPrevious({ varianceValue: -30 }, prev).tightening).toBe(false);
  });
});
