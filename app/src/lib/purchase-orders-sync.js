// =============================================================================
// purchase-orders-sync — cross-device sync for the `purchase_orders` table (0054)
// =============================================================================
// A draft a chef approves on the line tablet opens, approved, on the owner's
// phone — the same proven table-sync path the count tables ride. The status
// column IS the approve-to-purchase gate (draft → approved → placed → received);
// this layer just persists it cross-device, it never advances it.
//
// Local shape (lib/purchasing.js makePurchaseOrder + stamps):
//   { id:'po-...', vendor, label, status, totalQty, totalCost, note,
//     approvedBy, approvedAt, placedAt, receivedAt, remoteUuid?, createdBy? }
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';

export function purchaseOrderToRow(item, { tenantId, userId }) {
  return {
    instance_id: tenantId,
    created_by:  userId,
    slug:        item.id,
    vendor:      item.vendor ?? null,
    label:       item.label ?? 'Purchase order',
    status:      ['draft', 'approved', 'placed', 'received'].includes(item.status) ? item.status : 'draft',
    total_qty:   Number(item.totalQty) || 0,
    total_cost:  Number(item.totalCost) || 0,
    note:        item.note ?? null,
    approved_by: item.approvedBy ?? null,
    approved_at: item.approvedAt ?? null,
    placed_at:   item.placedAt ?? null,
    received_at: item.receivedAt ?? null,
  };
}

export function purchaseOrderFromRow(row) {
  return {
    id:         row.slug ?? `po-remote-${row.id}`,
    remoteUuid: row.id,
    tenantId:   row.instance_id,
    createdBy:  row.created_by ?? null,
    vendor:     row.vendor ?? null,
    label:      row.label ?? 'Purchase order',
    status:     row.status ?? 'draft',
    totalQty:   Number(row.total_qty) || 0,
    totalCost:  Number(row.total_cost) || 0,
    note:       row.note ?? '',
    approvedBy: row.approved_by ?? null,
    approvedAt: row.approved_at ?? null,
    placedAt:   row.placed_at ?? null,
    receivedAt: row.received_at ?? null,
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
  };
}

export const purchaseOrdersSync = createTableSync({
  localKey: 'purchaseOrders',
  remoteTable: 'purchase_orders',
  toRow: purchaseOrderToRow,
  fromRow: purchaseOrderFromRow,
  idOf: (item) => item.id,
});

export const PURCHASE_ORDER_COLUMN_OF = {
  vendor:     'vendor',
  label:      'label',
  status:     'status',
  totalQty:   'total_qty',
  totalCost:  'total_cost',
  note:       'note',
  approvedBy: 'approved_by',
  approvedAt: 'approved_at',
  placedAt:   'placed_at',
  receivedAt: 'received_at',
};

export function mergeRemotePurchaseOrders(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}
