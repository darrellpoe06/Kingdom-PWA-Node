// =============================================================================
// inventory-items-sync — cross-device sync for the inventory_items catalog.
// =============================================================================
// An item entered on the sound-booth tablet shows up on the office laptop — the
// same proven table-sync path accounts / projects / workspaces ride. Full CRUD:
// the catalog entry (name, reorder point, location, unit cost) is editable, and
// each edit is also captured as an immutable record-history event by the shell
// so the item is a versioned living record (record-events-sync.js).
//
// Local shape:
//   { id: 'inv-...', sku, name, category, location, unit, reorderPoint,
//     unitCost, allowNegative, notes, active, authorPersona,
//     createdBy, createdAt, updatedAt }
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';

export function inventoryItemToRow(item, { tenantId, userId }) {
  return {
    instance_id:   tenantId,
    created_by:    userId,
    slug:          item.id,
    sku:           item.sku ?? null,
    name:          item.name ?? 'Untitled item',
    category:      item.category ?? null,
    location:      item.location ?? null,
    unit:          item.unit ?? 'each',
    reorder_point: Number(item.reorderPoint) || 0,
    unit_cost:     Number(item.unitCost) || 0,
    allow_negative: item.allowNegative === true,
    notes:         item.notes ?? null,
    active:        item.active !== false,
    author_persona: item.authorPersona ?? null,
  };
}

export function inventoryItemFromRow(row) {
  return {
    id:            row.slug ?? `inv-remote-${row.id}`,
    remoteUuid:    row.id,
    tenantId:      row.instance_id,
    createdBy:     row.created_by ?? null,
    sku:           row.sku ?? null,
    name:          row.name ?? 'Untitled item',
    category:      row.category ?? null,
    location:      row.location ?? null,
    unit:          row.unit ?? 'each',
    reorderPoint:  Number(row.reorder_point) || 0,
    unitCost:      Number(row.unit_cost) || 0,
    allowNegative: row.allow_negative === true,
    notes:         row.notes ?? null,
    active:        row.active !== false,
    authorPersona: row.author_persona ?? null,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}

export const inventoryItemsSync = createTableSync({
  localKey: 'inventoryItems',
  remoteTable: 'inventory_items',
  toRow: inventoryItemToRow,
  fromRow: inventoryItemFromRow,
  idOf: (item) => item.id,
});

// Local field -> column, for the shell's updateInventoryItem patch builder.
// instance_id / created_by / slug are identity and never patched.
export const INVENTORY_ITEM_COLUMN_OF = {
  sku:           'sku',
  name:          'name',
  category:      'category',
  location:      'location',
  unit:          'unit',
  reorderPoint:  'reorder_point',
  unitCost:      'unit_cost',
  allowNegative: 'allow_negative',
  notes:         'notes',
  active:        'active',
};

export function mergeRemoteInventoryItems(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}
