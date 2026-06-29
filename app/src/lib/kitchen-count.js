// =============================================================================
// kitchen-count — physical-count sessions: value, variance, and reconciliation
// =============================================================================
// A COUNT is the moment the kitchen checks the shelf against the system. The
// system already knows what it EXPECTED on hand (derived from the append-only
// movement ledger, lib/inventory.js); the chef enters what is PHYSICALLY there.
// From those two numbers everything a chef cares about falls out, derived — never
// painted:
//
//   variance       = counted - expected         (per line; + overage, - shrink)
//   variance value = variance * unit_cost        (the dollars over / under)
//   counted value  = counted  * unit_cost        (what's actually on the shelf)
//   shrink value   = the negative portion only   (loss: theft, waste, spoilage)
//
// Closing a count RECONCILES the ledger: each non-zero line becomes one 'adjust'
// movement whose signed qty is the variance, exactly what signedQty('adjust')
// consumes. After close, derived on-hand equals the counted reality — the count
// is the reconciliation engine, never a parallel store of truth.
//
// MONEY STAYS THE OWNER'S HAND: this tracks COST and value, it never processes a
// payment. foodCostPercent takes owner-supplied sales and returns null rather
// than dividing by zero or fabricating a number when sales is absent.
//
// Pure + dependency-free, so the value/variance/food-cost math is unit-tested on
// its own (see app/src/__tests__/kitchen-count.test.js). Cloud persistence is
// lib/kitchen-counts-sync.js + lib/kitchen-count-lines-sync.js; surfaced by
// components/KitchenInventory.jsx.
// =============================================================================

export const COUNT_MODES = ['unit', 'weight'];
export const COUNT_STATUSES = ['open', 'closed'];

// makeCount — normalize a partial count-session into the canonical shape.
export function makeCount(partial = {}) {
  return {
    id: partial.id || null,
    label: (partial.label || '').trim() || 'Inventory count',
    storageArea: partial.storageArea || null,            // null = whole kitchen
    status: COUNT_STATUSES.includes(partial.status) ? partial.status : 'open',
    countedBy: partial.countedBy || null,
    note: partial.note || '',
    startedAt: partial.startedAt || null,
    closedAt: partial.closedAt || null,
  };
}

// makeCountLine — normalize a partial counted line. expectedQty and unitCost are
// SNAPSHOTS taken at count time, so a later catalog edit can't rewrite a closed
// count's variance or value.
export function makeCountLine(partial = {}) {
  return {
    id: partial.id || null,
    countId: partial.countId || null,
    itemId: partial.itemId || null,
    countedQty: num(partial.countedQty),
    countUnit: partial.countUnit || 'each',
    countMode: COUNT_MODES.includes(partial.countMode) ? partial.countMode : 'unit',
    expectedQty: num(partial.expectedQty),
    unitCost: num(partial.unitCost),
    countedAt: partial.countedAt || null,
  };
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// lineVariance — counted minus expected. Positive = more on the shelf than the
// system thought (overage); negative = less (shrink / loss).
export function lineVariance(line) {
  return num(line?.countedQty) - num(line?.expectedQty);
}

// lineCountedValue — the dollar value physically on the shelf for this line.
export function lineCountedValue(line) {
  return num(line?.countedQty) * num(line?.unitCost);
}

// lineExpectedValue — the dollar value the system expected for this line.
export function lineExpectedValue(line) {
  return num(line?.expectedQty) * num(line?.unitCost);
}

// lineVarianceValue — the signed dollar variance (counted value - expected value).
export function lineVarianceValue(line) {
  return lineVariance(line) * num(line?.unitCost);
}

// varianceStatus — 'match' | 'over' | 'short' for a line, with an optional
// tolerance band (a half-pound rounding on a weigh-in shouldn't read as shrink).
export function varianceStatus(line, { tolerance = 0 } = {}) {
  const v = lineVariance(line);
  if (Math.abs(v) <= Math.abs(num(tolerance))) return 'match';
  return v > 0 ? 'over' : 'short';
}

// summarizeCount — roll a session's lines into the figures a chef reads. Every
// figure derived from the lines; nothing stored.
//   countedValue   — total $ physically on the shelf
//   expectedValue  — total $ the system expected
//   varianceValue  — net $ over/under (countedValue - expectedValue)
//   shrinkValue    — the loss portion only (sum of negative line variances; <= 0)
//   overageValue   — the gain portion only (sum of positive line variances; >= 0)
//   matched/over/short — line counts by variance status
export function summarizeCount(lines, { tolerance = 0 } = {}) {
  let countedValue = 0;
  let expectedValue = 0;
  let varianceValue = 0;
  let shrinkValue = 0;
  let overageValue = 0;
  let matched = 0;
  let over = 0;
  let short = 0;
  for (const ln of lines || []) {
    countedValue += lineCountedValue(ln);
    expectedValue += lineExpectedValue(ln);
    const vv = lineVarianceValue(ln);
    varianceValue += vv;
    if (vv < 0) shrinkValue += vv;
    else if (vv > 0) overageValue += vv;
    const st = varianceStatus(ln, { tolerance });
    if (st === 'match') matched += 1;
    else if (st === 'over') over += 1;
    else short += 1;
  }
  return {
    lineCount: (lines || []).length,
    countedValue,
    expectedValue,
    varianceValue,
    shrinkValue,
    overageValue,
    matched,
    over,
    short,
  };
}

// countLineToMovement — the append-only 'adjust' movement that reconciles the
// ledger to a counted line. qty is the SIGNED variance (the delta to reach the
// counted quantity), exactly what inventory.js signedQty('adjust') consumes.
// Returns null for a line with no item or zero variance (nothing to post).
export function countLineToMovement(line, count) {
  const delta = lineVariance(line);
  if (!line?.itemId || delta === 0) return null;
  return {
    itemId: line.itemId,
    kind: 'adjust',
    qty: delta,                                          // signed delta
    location: count?.storageArea || null,
    reason: `Count: ${count?.label || 'Inventory count'}`,
    ref: count?.id || null,
  };
}

// reconcileCount — every non-zero line becomes one adjust movement. Hand the
// array straight to recordMovements; on-hand recomputes from the ledger, so after
// a count the system agrees with the shelf.
export function reconcileCount(lines, count) {
  return (lines || [])
    .map((ln) => countLineToMovement(ln, count))
    .filter(Boolean);
}

// foodCostPercent — the classic restaurant metric: cost of goods / sales, as a
// percentage. Sales is OWNER-SUPPLIED (the kitchen tracks cost, not the till).
// Returns null when sales is absent/zero rather than dividing by zero or
// fabricating a number — an honest "we can't compute this yet."
export function foodCostPercent(cogs, sales) {
  const s = num(sales);
  if (s <= 0) return null;
  return (num(cogs) / s) * 100;
}

// compareToPrevious — variance-value delta between this count and the prior one
// for the same scope, so "are we getting tighter?" is answerable. Returns null
// when there's no prior to compare against (honest, not zero).
export function compareToPrevious(currentSummary, previousSummary) {
  if (!previousSummary) return null;
  const cur = num(currentSummary?.varianceValue);
  const prev = num(previousSummary?.varianceValue);
  return {
    current: cur,
    previous: prev,
    delta: cur - prev,
    // tightening = the absolute net variance shrank toward zero
    tightening: Math.abs(cur) < Math.abs(prev),
  };
}
