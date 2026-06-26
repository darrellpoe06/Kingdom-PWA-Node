// =============================================================================
// inventory-movements-sync — cross-device sync for the inventory_movements log.
// =============================================================================
// The append-only stock ledger: receipts, issues, count adjustments, transfers.
// On-hand is DERIVED from this log (lib/inventory.js), never stored — so the
// ledger IS the audit trail and the source of truth at once.
//
// APPEND-ONLY. The shell only ever calls upload()/subscribe() on this
// controller; it never calls updateRow/deleteRow. The DB enforces the same: the
// inventory_movements table grants only SELECT + INSERT and has no UPDATE/DELETE
// policy (migration 0052), so a posted movement can never be altered or removed.
// A mistake is corrected by posting a NEW movement (a count adjustment or a
// reversing issue), exactly as a real general ledger works.
//
// Local shape:
//   { id: 'mv-...', itemId: 'inv-...', kind: 'in'|'out'|'adjust'|
//     'transfer-out'|'transfer-in', qty, location, toLocation, fromLocation,
//     reason, ref, actor, transferId, occurredAt, createdBy }
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';

export function movementToRow(item, { tenantId, userId }) {
  return {
    instance_id:   tenantId,
    created_by:    userId,
    slug:          item.id,
    item_slug:     item.itemId,
    kind:          item.kind,
    qty:           Number(item.qty) || 0,
    location:      item.location ?? null,
    to_location:   item.toLocation ?? null,
    from_location: item.fromLocation ?? null,
    reason:        item.reason ?? null,
    ref:           item.ref ?? null,
    actor:         item.actor ?? null,
    transfer_id:   item.transferId ?? null,
    occurred_at:   item.occurredAt ?? new Date().toISOString(),
  };
}

export function movementFromRow(row) {
  return {
    id:           row.slug ?? `mv-remote-${row.id}`,
    remoteUuid:   row.id,
    tenantId:     row.instance_id,
    createdBy:    row.created_by ?? null,
    itemId:       row.item_slug,
    kind:         row.kind,
    qty:          Number(row.qty) || 0,
    location:     row.location ?? null,
    toLocation:   row.to_location ?? null,
    fromLocation: row.from_location ?? null,
    reason:       row.reason ?? null,
    ref:          row.ref ?? null,
    actor:        row.actor ?? null,
    transferId:   row.transfer_id ?? null,
    occurredAt:   row.occurred_at ?? row.created_at,
  };
}

export const inventoryMovementsSync = createTableSync({
  localKey: 'inventoryMovements',
  remoteTable: 'inventory_movements',
  toRow: movementToRow,
  fromRow: movementFromRow,
  idOf: (item) => item.id,
});

// Append-only: a refetch unions, never replaces, so a movement posted offline
// (non-UUID id) survives the first cloud refetch.
export function mergeRemoteMovements(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}
