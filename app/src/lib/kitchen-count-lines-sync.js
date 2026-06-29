// =============================================================================
// kitchen-count-lines-sync — cross-device sync for `inventory_count_lines` (0053)
// =============================================================================
// The counted lines of a session, synced the same proven way as their parent
// count header (kitchen-counts-sync.js). expected_qty + unit_cost are SNAPSHOTS
// stored at count time so a later catalog edit can't rewrite a closed count's
// variance or value.
//
// Local shape (lib/kitchen-count.js makeCountLine):
//   { id, countId, itemId, countedQty, countUnit, countMode, expectedQty,
//     unitCost, countedAt, remoteUuid?, createdBy? }
// Remote shape: the 0053 inventory_count_lines row.
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';

export function countLineToRow(item, { tenantId, userId }) {
  return {
    instance_id:  tenantId,
    created_by:   userId,
    slug:         item.id,
    count_slug:   item.countId,
    item_slug:    item.itemId,
    counted_qty:  Number(item.countedQty) || 0,
    count_unit:   item.countUnit ?? 'each',
    count_mode:   item.countMode === 'weight' ? 'weight' : 'unit',
    expected_qty: Number(item.expectedQty) || 0,
    unit_cost:    Number(item.unitCost) || 0,
    counted_at:   item.countedAt ?? new Date().toISOString(),
  };
}

export function countLineFromRow(row) {
  return {
    id:          row.slug ?? `cl-remote-${row.id}`,
    remoteUuid:  row.id,
    tenantId:    row.instance_id,
    createdBy:   row.created_by ?? null,
    countId:     row.count_slug,
    itemId:      row.item_slug,
    countedQty:  Number(row.counted_qty) || 0,
    countUnit:   row.count_unit ?? 'each',
    countMode:   row.count_mode === 'weight' ? 'weight' : 'unit',
    expectedQty: Number(row.expected_qty) || 0,
    unitCost:    Number(row.unit_cost) || 0,
    countedAt:   row.counted_at ?? row.created_at,
  };
}

export const kitchenCountLinesSync = createTableSync({
  localKey: 'inventoryCountLines',
  remoteTable: 'inventory_count_lines',
  toRow: countLineToRow,
  fromRow: countLineFromRow,
  idOf: (item) => item.id,
});

export const COUNT_LINE_COLUMN_OF = {
  countedQty:  'counted_qty',
  countUnit:   'count_unit',
  countMode:   'count_mode',
  expectedQty: 'expected_qty',
  unitCost:    'unit_cost',
  countedAt:   'counted_at',
};

export function mergeRemoteCountLines(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}
