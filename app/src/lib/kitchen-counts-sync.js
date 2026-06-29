// =============================================================================
// kitchen-counts-sync — cross-device sync for the `inventory_counts` table (0053)
// =============================================================================
// A count session started on the line tablet opens, unchanged, on the chef's
// phone — the same proven table-sync path recipes / inventory_items ride. Built
// on the generic createTableSync + unionPreservingLocal helpers.
//
// Local shape (lib/kitchen-count.js makeCount):
//   { id, label, storageArea, status, countedBy, note, startedAt, closedAt,
//     remoteUuid?, createdBy?, createdAt?, updatedAt? }
// Remote shape: the 0053 inventory_counts row (text/timestamptz scalars).
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';

export function countToRow(item, { tenantId, userId }) {
  return {
    instance_id:  tenantId,
    created_by:   userId,
    slug:         item.id,
    label:        item.label ?? 'Inventory count',
    storage_area: item.storageArea ?? null,
    status:       item.status === 'closed' ? 'closed' : 'open',
    counted_by:   item.countedBy ?? null,
    note:         item.note ?? null,
    started_at:   item.startedAt ?? null,
    closed_at:    item.closedAt ?? null,
  };
}

export function countFromRow(row) {
  return {
    id:          row.slug ?? `count-remote-${row.id}`,
    remoteUuid:  row.id,
    tenantId:    row.instance_id,
    createdBy:   row.created_by ?? null,
    label:       row.label ?? 'Inventory count',
    storageArea: row.storage_area ?? null,
    status:      row.status === 'closed' ? 'closed' : 'open',
    countedBy:   row.counted_by ?? null,
    note:        row.note ?? '',
    startedAt:   row.started_at ?? null,
    closedAt:    row.closed_at ?? null,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

export const kitchenCountsSync = createTableSync({
  localKey: 'inventoryCounts',
  remoteTable: 'inventory_counts',
  toRow: countToRow,
  fromRow: countFromRow,
  idOf: (item) => item.id,
});

// Local field -> column, for the monolith's updateCount patch builder. Only
// editable columns; instance_id / created_by / slug are never patched.
export const COUNT_COLUMN_OF = {
  label:       'label',
  storageArea: 'storage_area',
  status:      'status',
  countedBy:   'counted_by',
  note:        'note',
  startedAt:   'started_at',
  closedAt:    'closed_at',
};

export function mergeRemoteCounts(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}
