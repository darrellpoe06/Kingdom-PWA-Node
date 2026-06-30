// =============================================================================
// purchasing.test — the par-based "what to order" engine, pinned to the digit
// =============================================================================
// The reorder math + the draft→approve→placed→received state machine are the
// load-bearing claims of the inventory→purchasing loop. Verified here against
// hand-computed numbers (Verification Doctrine, DR-0076).
import { describe, it, expect } from 'vitest';
import {
  suggestOrderQty, buildPurchaseDrafts, draftSummary, makePurchaseOrder,
  makePurchaseOrderLine, poToReceiveMovements, canAdvance, PO_STATUSES, UNASSIGNED_VENDOR,
} from '../lib/purchasing.js';
import { onHandFor } from '../lib/inventory.js';

describe('suggestOrderQty', () => {
  it('orders the gap up to par', () => {
    expect(suggestOrderQty(4, 10)).toBe(6);
    expect(suggestOrderQty(0, 5)).toBe(5);
  });
  it('orders nothing at or above par', () => {
    expect(suggestOrderQty(10, 10)).toBe(0);
    expect(suggestOrderQty(12, 10)).toBe(0);
  });
  it('pads by a usage buffer %', () => {
    expect(suggestOrderQty(4, 10, { bufferPct: 50 })).toBe(9);   // 6 * 1.5
    expect(suggestOrderQty(0, 8, { bufferPct: 25 })).toBe(10);   // 8 * 1.25
  });
});

describe('buildPurchaseDrafts — live inventory below par → drafts grouped by vendor', () => {
  const items = [
    { id: 'chicken', name: 'Chicken breast', unit: 'lb',   reorderPoint: 20, vendor: 'Sysco',      unitCost: 3,    active: true },
    { id: 'tomato',  name: 'Tomato',         unit: 'each', reorderPoint: 24, vendor: 'Local Farm', unitCost: 0.5,  active: true },
    { id: 'rice',    name: 'Rice',           unit: 'lb',   reorderPoint: 10, vendor: 'Sysco',      unitCost: 1.25, active: true },
    { id: 'salt',    name: 'Salt',           unit: 'lb',   reorderPoint: 0,  vendor: 'Sysco',      unitCost: 1,    active: true }, // no par -> never ordered
    { id: 'napkins', name: 'Napkins',        unit: 'pack', reorderPoint: 5,  vendor: '',           unitCost: 2,    active: true }, // unassigned vendor
    { id: 'retired', name: 'Old item',       unit: 'each', reorderPoint: 9,  vendor: 'Sysco',      unitCost: 9,    active: false }, // inactive -> skip
  ];
  const movements = [
    { id: 'm1', itemId: 'chicken', kind: 'in', qty: 14 },  // 14 < 20 -> order 6
    { id: 'm2', itemId: 'tomato',  kind: 'in', qty: 30 },  // 30 >= 24 -> skip
    { id: 'm3', itemId: 'rice',    kind: 'in', qty: 2 },   // 2 < 10 -> order 8
    // napkins: no movements -> on-hand 0 < 5 -> order 5
  ];
  const drafts = buildPurchaseDrafts(items, movements);

  it('groups below-par items by vendor and skips no-par / above-par / inactive', () => {
    const vendors = drafts.map((d) => d.vendor);
    expect(vendors).toEqual(['Sysco', UNASSIGNED_VENDOR]); // sorted by spend desc
    const sysco = drafts.find((d) => d.vendor === 'Sysco');
    expect(sysco.lines.map((l) => l.itemId).sort()).toEqual(['chicken', 'rice']);
    expect(drafts.flatMap((d) => d.lines.map((l) => l.itemId))).not.toContain('tomato'); // above par
    expect(drafts.flatMap((d) => d.lines.map((l) => l.itemId))).not.toContain('salt');   // no par
    expect(drafts.flatMap((d) => d.lines.map((l) => l.itemId))).not.toContain('retired');// inactive
  });

  it('computes order qty to par and line/vendor cost', () => {
    const sysco = drafts.find((d) => d.vendor === 'Sysco');
    const chicken = sysco.lines.find((l) => l.itemId === 'chicken');
    expect(chicken).toMatchObject({ onHand: 14, par: 20, orderQty: 6, unitCost: 3, lineCost: 18 });
    const rice = sysco.lines.find((l) => l.itemId === 'rice');
    expect(rice).toMatchObject({ orderQty: 8, lineCost: 10 });
    expect(sysco.totalQty).toBe(14);   // 6 + 8
    expect(sysco.totalCost).toBe(28);  // 18 + 10
    const unassigned = drafts.find((d) => d.vendor === UNASSIGNED_VENDOR);
    expect(unassigned.lines[0]).toMatchObject({ itemId: 'napkins', orderQty: 5, lineCost: 10 });
  });

  it('draftSummary rolls up across vendors', () => {
    const s = draftSummary(drafts);
    expect(s).toMatchObject({ vendorCount: 2, lineCount: 3, totalQty: 19, totalCost: 38 });
  });
});

describe('makePurchaseOrder / makePurchaseOrderLine — the approval snapshot', () => {
  it('normalizes a vendor draft into a persistable order + lines', () => {
    const draft = { vendor: 'Sysco', totalQty: 14, totalCost: 28, lines: [{ itemId: 'chicken', name: 'Chicken breast', orderQty: 6, unit: 'lb', unitCost: 3, lineCost: 18 }] };
    const po = makePurchaseOrder(draft, { status: 'approved' });
    expect(po).toMatchObject({ vendor: 'Sysco', status: 'approved', totalQty: 14, totalCost: 28 });
    const line = makePurchaseOrderLine(draft.lines[0], 'po-1');
    expect(line).toMatchObject({ poId: 'po-1', itemId: 'chicken', itemName: 'Chicken breast', orderQty: 6, unit: 'lb', unitCost: 3, lineCost: 18 });
  });
  it('defaults an unknown status to draft', () => {
    expect(makePurchaseOrder({ vendor: 'X' }, { status: 'bogus' }).status).toBe('draft');
  });
});

describe('poToReceiveMovements — receiving reconciles back into the ledger', () => {
  it('turns ordered lines into Received (in) movements that raise on-hand', () => {
    const lines = [
      { itemId: 'chicken', orderQty: 6 },
      { itemId: 'rice', orderQty: 8 },
      { itemId: null, orderQty: 5 },   // no item -> dropped
      { itemId: 'x', orderQty: 0 },    // zero -> dropped
    ];
    const mv = poToReceiveMovements(lines, { id: 'po-1', vendor: 'Sysco' });
    expect(mv).toHaveLength(2);
    expect(mv[0]).toMatchObject({ itemId: 'chicken', kind: 'in', qty: 6, ref: 'po-1' });
    // applying them raises derived on-hand
    const before = [{ id: 'a', itemId: 'chicken', kind: 'in', qty: 14 }];
    const after = [...before, ...mv.map((m, i) => ({ ...m, id: `r${i}` }))];
    expect(onHandFor(after, 'chicken')).toBe(20); // 14 + 6, back up to par
  });
});

describe('canAdvance — the approve-to-purchase state machine (forward-only)', () => {
  it('allows each forward step', () => {
    expect(canAdvance('draft', 'approved')).toBe(true);
    expect(canAdvance('approved', 'placed')).toBe(true);
    expect(canAdvance('placed', 'received')).toBe(true);
  });
  it('rejects skips, reversals, and unknowns (never auto-jumps to placed/paid)', () => {
    expect(canAdvance('draft', 'placed')).toBe(false);
    expect(canAdvance('approved', 'draft')).toBe(false);
    expect(canAdvance('received', 'placed')).toBe(false);
    expect(canAdvance('bogus', 'approved')).toBe(false);
  });
  it('PO_STATUSES is the canonical ordered set', () => {
    expect(PO_STATUSES).toEqual(['draft', 'approved', 'placed', 'received']);
  });
});
