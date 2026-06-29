// =============================================================================
// inventory — proven-to-catch gate (Verification Doctrine, DR-0076).
// =============================================================================
// The core promise of a system of record over a spreadsheet: on-hand is DERIVED
// from an append-only movement ledger, never stored — so it can't silently
// drift. Each test FAILS if that promise regresses, asserting the catch:
//   1. DERIVED on-hand — sum of signed movements; per-location too.
//   2. NO-NEGATIVE control — an over-draw issue is rejected.
//   3. BALANCED transfer — out+in nets to zero across the item, splits locations.
//   4. STATUS workflow — ok -> low -> out from the reorder point.
//   5. VALUATION + roll-ups — value and per-category consolidation.
//   6. DEDUP by SKU — the same SKU twice is surfaced, not piled.
//   7. LEDGER audit — running on-hand after each movement is correct + ordered.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  signedQty, onHandFor, onHandByItem, onHandByItemLocation, statusOf, valueOf,
  lowStockItems, validateMovement, buildTransfer, rollupByCategory, dedupeBySku,
  summarizeInventory, decorateItems, filterItems, itemHistoryFromMovements,
} from '../lib/inventory.js';

const item = (over = {}) => ({ id: 'inv-1', sku: 'AV-MIC-058', name: 'SM58 mic', category: 'Audio', location: 'Booth', unit: 'each', reorderPoint: 2, unitCost: 99, active: true, ...over });

const mv = (over = {}) => ({ id: `mv-${Math.random()}`, itemId: 'inv-1', kind: 'in', qty: 1, location: 'Booth', occurredAt: '2026-06-01T00:00:00.000Z', ...over });

describe('inventory — derived on-hand', () => {
  it('on-hand is the signed sum of movements, never a stored field', () => {
    const moves = [
      mv({ kind: 'in', qty: 10, occurredAt: '2026-06-01T00:00:00Z' }),
      mv({ kind: 'out', qty: 3, occurredAt: '2026-06-02T00:00:00Z' }),
      mv({ kind: 'adjust', qty: -1, occurredAt: '2026-06-03T00:00:00Z' }),
    ];
    expect(onHandFor(moves, 'inv-1')).toBe(6); // 10 - 3 - 1
    expect(onHandByItem(moves)['inv-1']).toBe(6);
  });

  it('signedQty applies the right direction per kind', () => {
    expect(signedQty(mv({ kind: 'in', qty: 5 }))).toBe(5);
    expect(signedQty(mv({ kind: 'out', qty: 5 }))).toBe(-5);
    expect(signedQty(mv({ kind: 'transfer-out', qty: 5 }))).toBe(-5);
    expect(signedQty(mv({ kind: 'transfer-in', qty: 5 }))).toBe(5);
    expect(signedQty(mv({ kind: 'adjust', qty: -2 }))).toBe(-2);
  });

  it('tracks on-hand per location', () => {
    const moves = [
      mv({ kind: 'in', qty: 8, location: 'Booth' }),
      mv({ kind: 'in', qty: 4, location: 'Storage' }),
      mv({ kind: 'out', qty: 2, location: 'Booth' }),
    ];
    const byLoc = onHandByItemLocation(moves)['inv-1'];
    expect(byLoc.Booth).toBe(6);
    expect(byLoc.Storage).toBe(4);
    expect(onHandFor(moves, 'inv-1', 'Booth')).toBe(6);
  });
});

describe('inventory — corporate controls', () => {
  it('rejects an issue that would drive on-hand negative (no-negative guard)', () => {
    const res = validateMovement(item(), 3, { itemId: 'inv-1', kind: 'out', qty: 5 });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/on hand/i);
  });

  it('allows the over-draw only when the item opts into negative stock', () => {
    const res = validateMovement(item({ allowNegative: true }), 3, { itemId: 'inv-1', kind: 'out', qty: 5 });
    expect(res.ok).toBe(true);
  });

  it('rejects a zero/blank quantity and an unknown kind', () => {
    expect(validateMovement(item(), 10, { itemId: 'inv-1', kind: 'in', qty: 0 }).ok).toBe(false);
    expect(validateMovement(item(), 10, { itemId: 'inv-1', kind: 'nope', qty: 1 }).ok).toBe(false);
    expect(validateMovement(item(), 10, { itemId: 'inv-1', kind: 'adjust', qty: 0 }).ok).toBe(false);
  });

  it('a transfer is a balanced pair: nets to zero on the item, splits locations', () => {
    const pair = buildTransfer({ itemId: 'inv-1', qty: 4, fromLocation: 'Storage', toLocation: 'Sanctuary', idBase: 't1' });
    expect(pair).toHaveLength(2);
    expect(signedQty(pair[0]) + signedQty(pair[1])).toBe(0); // balanced
    expect(pair[0].transferId).toBe(pair[1].transferId); // linked
    // Seed 4 in storage, then transfer 4 to sanctuary.
    const moves = [mv({ kind: 'in', qty: 4, location: 'Storage' }), ...pair];
    expect(onHandFor(moves, 'inv-1')).toBe(4); // total unchanged
    const byLoc = onHandByItemLocation(moves)['inv-1'];
    expect(byLoc.Storage).toBe(0);
    expect(byLoc.Sanctuary).toBe(4);
  });
});

describe('inventory — status, valuation, roll-ups', () => {
  it('derives the status workflow from on-hand vs reorder point', () => {
    expect(statusOf(item({ reorderPoint: 2 }), 10)).toBe('ok');
    expect(statusOf(item({ reorderPoint: 2 }), 2)).toBe('low');
    expect(statusOf(item({ reorderPoint: 2 }), 0)).toBe('out');
  });

  it('values a position as on-hand * unit cost', () => {
    expect(valueOf(item({ unitCost: 99 }), 4)).toBe(396);
  });

  it('flags low/out items for reorder', () => {
    const items = [item({ id: 'inv-1', reorderPoint: 5 }), item({ id: 'inv-2', name: 'Cable', reorderPoint: 2 })];
    const moves = [mv({ itemId: 'inv-1', kind: 'in', qty: 3 }), mv({ itemId: 'inv-2', kind: 'in', qty: 10 })];
    const lows = lowStockItems(items, moves);
    expect(lows.map((r) => r.item.id)).toEqual(['inv-1']); // 3 <= 5 reorder
  });

  it('rolls up by category: items, units, value, low/out counts', () => {
    const items = [item({ id: 'inv-1', category: 'Audio', unitCost: 100, reorderPoint: 5 }), item({ id: 'inv-2', category: 'Audio', unitCost: 10 })];
    const moves = [mv({ itemId: 'inv-1', kind: 'in', qty: 2 }), mv({ itemId: 'inv-2', kind: 'in', qty: 50 })];
    const roll = rollupByCategory(items, moves).Audio;
    expect(roll.items).toBe(2);
    expect(roll.units).toBe(52);
    expect(roll.value).toBe(2 * 100 + 50 * 10); // 700
    expect(roll.low).toBe(1); // inv-1 at 2 <= reorder 5
  });

  it('summary totals are derived across the catalog', () => {
    const items = [item({ id: 'inv-1', unitCost: 100, reorderPoint: 5 }), item({ id: 'inv-2', unitCost: 0 })];
    const moves = [mv({ itemId: 'inv-1', kind: 'in', qty: 2 })];
    const s = summarizeInventory(items, moves);
    expect(s.itemCount).toBe(2);
    expect(s.totalUnits).toBe(2);
    expect(s.totalValue).toBe(200);
    expect(s.lowCount).toBe(1); // inv-1 low
    expect(s.outCount).toBe(1); // inv-2 has 0 on hand
  });
});

describe('inventory — integrity + queries', () => {
  it('dedupes by SKU: a second identical SKU is surfaced, not silently piled', () => {
    const items = [item({ id: 'inv-1', sku: 'AV-MIC-058' }), item({ id: 'inv-2', sku: 'av-mic-058' }), item({ id: 'inv-3', sku: null })];
    const { unique, duplicates } = dedupeBySku(items);
    expect(unique.map((i) => i.id)).toEqual(['inv-1', 'inv-3']); // dup dropped from unique
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].item.id).toBe('inv-2');
  });

  it('filters by text, category, location, and low-only (using DERIVED status)', () => {
    const items = [item({ id: 'inv-1', name: 'SM58', category: 'Audio', reorderPoint: 5 }), item({ id: 'inv-2', name: 'HDMI cable', category: 'Video', location: 'Booth' })];
    const moves = [mv({ itemId: 'inv-1', kind: 'in', qty: 2 }), mv({ itemId: 'inv-2', kind: 'in', qty: 20 })];
    expect(filterItems(items, moves, { q: 'hdmi' }).map((i) => i.id)).toEqual(['inv-2']);
    expect(filterItems(items, moves, { category: 'Audio' }).map((i) => i.id)).toEqual(['inv-1']);
    expect(filterItems(items, moves, { lowOnly: true }).map((i) => i.id)).toEqual(['inv-1']);
  });

  it('decorates items with the derived facts a table needs', () => {
    const items = [item({ id: 'inv-1', unitCost: 99, reorderPoint: 5 })];
    const moves = [mv({ kind: 'in', qty: 3 })];
    const [d] = decorateItems(items, moves);
    expect(d.onHand).toBe(3);
    expect(d.status).toBe('low');
    expect(d.value).toBe(297);
    expect(d.movementCount).toBe(1);
  });
});

describe('inventory — immutable ledger as the audit trail', () => {
  it('itemHistoryFromMovements gives the running on-hand after each movement, chronologically', () => {
    const moves = [
      mv({ id: 'm1', kind: 'in', qty: 10, occurredAt: '2026-06-01T00:00:00Z' }),
      mv({ id: 'm3', kind: 'out', qty: 4, occurredAt: '2026-06-03T00:00:00Z' }),
      mv({ id: 'm2', kind: 'in', qty: 5, occurredAt: '2026-06-02T00:00:00Z' }),
    ];
    // Newest-first for display; running on-hand is computed in time order.
    const rows = itemHistoryFromMovements(moves, 'inv-1');
    expect(rows.map((r) => r.id)).toEqual(['m3', 'm2', 'm1']); // newest first
    const byId = Object.fromEntries(rows.map((r) => [r.id, r.onHandAfter]));
    expect(byId.m1).toBe(10);
    expect(byId.m2).toBe(15);
    expect(byId.m3).toBe(11); // 15 - 4
  });
});
