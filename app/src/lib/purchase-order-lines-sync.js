// =============================================================================
// purchase-order-lines-sync — cross-device sync for `purchase_order_lines` (0054)
// =============================================================================
// The ordered lines of an approved PO, synced the same way as their header
// (purchase-orders-sync.js). order_qty / unit_cost / line_cost are SNAPSHOTS at
// approval time so a later catalog edit can't rewrite a recorded order.
//
// Local shape (lib/purchasing.js makePurchaseOrderLine + stamps):
//   { id:'pol-...', poId, itemId, itemName, orderQty, unit, unitCost, lineCost }
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';

export function purchaseOrderLineToRow(item, { tenantId, userId }) {
  return {
    instance_id: tenantId,
    created_by:  userId,
    slug:        item.id,
    po_slug:     item.poId,
    item_slug:   item.itemId,
    item_name:   item.itemName ?? null,
    order_qty:   Number(item.orderQty) || 0,
    unit:        item.unit ?? 'each',
    unit_cost:   Number(item.unitCost) || 0,
    line_cost:   Number(item.lineCost) || 0,
  };
}

export function purchaseOrderLineFromRow(row) {
  return {
    id:         row.slug ?? `pol-remote-${row.id}`,
    remoteUuid: row.id,
    tenantId:   row.instance_id,
    createdBy:  row.created_by ?? null,
    poId:       row.po_slug,
    itemId:     row.item_slug,
    itemName:   row.item_name ?? null,
    orderQty:   Number(row.order_qty) || 0,
    unit:       row.unit ?? 'each',
    unitCost:   Number(row.unit_cost) || 0,
    lineCost:   Number(row.line_cost) || 0,
    createdAt:  row.created_at,
  };
}

export const purchaseOrderLinesSync = createTableSync({
  localKey: 'purchaseOrderLines',
  remoteTable: 'purchase_order_lines',
  toRow: purchaseOrderLineToRow,
  fromRow: purchaseOrderLineFromRow,
  idOf: (item) => item.id,
});

export function mergeRemotePurchaseOrderLines(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}
