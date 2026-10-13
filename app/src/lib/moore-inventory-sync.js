// =============================================================================
// moore-inventory-sync — cross-device sync for Moore Divahs shop inventory
// =============================================================================
// Mirrors moore-orders-sync over shop_inventory (0086). Pure mappers exported
// for the round-trip pin; on-hand value stays DERIVED (engine), never a column.
// =============================================================================
import { createTableSync } from './table-sync.js';
import { normalizeInventoryItem } from './moore-divahs.js';

export function toInventoryRow(item, { tenantId, userId } = {}) {
  return {
    instance_id:     tenantId ?? null,
    created_by:      userId ?? null,
    slug:            item.id ?? null,
    name:            item.name ?? '',
    category:        item.category ?? 'other',
    qty:             item.qty == null ? 0 : item.qty,
    unit:            item.unit || 'each',
    unit_cost_cents: item.unitCostCents == null ? 0 : item.unitCostCents,
    notes:           item.notes || null,
    seed:            item.seed === true,
  };
}
export function fromInventoryRow(row) {
  return { ...normalizeInventoryItem({
    id:            row.slug ?? `mi-remote-${row.id}`,
    name:          row.name,
    category:      row.category,
    qty:           row.qty == null ? 0 : Number(row.qty),
    unit:          row.unit,
    unitCostCents: row.unit_cost_cents,
    notes:         row.notes,
    seed:          row.seed === true,
    createdAt:     row.created_at,
  }), remoteUuid: row.id };
}
export const mooreInventorySync = createTableSync({
  localKey: 'mooreShopInventory',
  remoteTable: 'shop_inventory',
  toRow: toInventoryRow,
  fromRow: fromInventoryRow,
  idOf: (item) => item.id,
});
