// @vitest-environment node
// moore inventory — pinned (DR-0076): value is DERIVED (qty × unit cost),
// seeds never inflate it, and the sync round-trip keeps the numbers honest.
import { vi, describe, it, expect } from 'vitest';

vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn(),
    rpc: vi.fn(async () => ({ data: null, error: null })),
    auth: { getSession: vi.fn(async () => ({ data: { session: null } })) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

import { normalizeInventoryItem, inventoryValueCents } from '../lib/moore-divahs.js';
import { toInventoryRow, fromInventoryRow } from '../lib/moore-inventory-sync.js';

const CTX = { tenantId: 'inst-moore', userId: 'user-shay' };

describe('inventory value — derived, honest', () => {
  it('sums qty × unit cost across real items only', () => {
    const items = [
      normalizeInventoryItem({ name: 'Ankara fabric', category: 'fabric', qty: 10, unit: 'yards', unitCostCents: 800 }),
      normalizeInventoryItem({ name: 'Blank tees', category: 'blanks', qty: 20, unitCostCents: 450 }),
      normalizeInventoryItem({ name: 'Demo roll', qty: 100, unitCostCents: 9999, seed: true }),
    ];
    expect(inventoryValueCents(items)).toBe(10 * 800 + 20 * 450); // seed excluded
    expect(inventoryValueCents([])).toBe(0);
  });
  it('normalization refuses negative qty/cost and junk categories', () => {
    const i = normalizeInventoryItem({ name: 'X', category: 'rocket', qty: -5, unitCostCents: -100 });
    expect(i.qty).toBe(0);
    expect(i.unitCostCents).toBe(0);
    expect(i.category).toBe('other');
  });
});

describe('round-trip', () => {
  it('an item survives the cloud loop whole', () => {
    const i = normalizeInventoryItem({ name: 'Satin', category: 'fabric', qty: 12.5, unit: 'yards', unitCostCents: 650, notes: 'for caps' }, { id: 'mi-1' });
    const back = fromInventoryRow({ ...toInventoryRow(i, CTX), id: 'uuid-i', created_at: i.createdAt });
    expect(back.id).toBe('mi-1');
    expect(back.qty).toBe(12.5);
    expect(back.unitCostCents).toBe(650);
    expect(back.category).toBe('fabric');
    expect(back.remoteUuid).toBe('uuid-i');
  });
});
