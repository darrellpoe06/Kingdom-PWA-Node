// =============================================================================
// kitchen-dispatchers — the kitchen vertical's write handlers, OUT of the shell
// =============================================================================
// The optimistic-local-then-cloud writers for kitchen counts (0053) + purchasing
// (0054), extracted from poe-financial-mvp-v28.jsx so the monolith stays FROZEN
// (DR-0078 modular cutover; monolith-budget-guard). The shell calls
// createKitchenDispatchers(ctx) once and spreads the returned handlers — same
// behavior as the former inline closures, just owned by a module.
//
// ctx supplies live shell state (read at call time, not captured once):
//   setData(updater)  — the shell's React state setter
//   userId()          — current auth user id, or null
//   syncReady()       — whether cloud sync should run now (signed in + verified +
//                       not a demo). When false, writes stay device-local.
//
// APPROVE-TO-PURCHASE: these only persist records + advance status. Nothing here
// places an order or moves money — that stays the owner's hand (the surface
// derives drafts live and the owner approves/places). Receiving posts 'in'
// movements via the shell's recordInventoryMovements, not here.
// =============================================================================
import { kitchenCountsSync, COUNT_COLUMN_OF } from './kitchen-counts-sync.js';
import { kitchenCountLinesSync, COUNT_LINE_COLUMN_OF } from './kitchen-count-lines-sync.js';
import { purchaseOrdersSync, PURCHASE_ORDER_COLUMN_OF } from './purchase-orders-sync.js';
import { purchaseOrderLinesSync } from './purchase-order-lines-sync.js';

const rid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function createKitchenDispatchers(ctx) {
  const { setData } = ctx;
  const ready = () => (typeof ctx.syncReady === 'function' ? ctx.syncReady() : false);

  // optimistic add: write locally now, upload best-effort, backfill remoteUuid.
  const makeAdd = (key, sync, seedFn, errLabel) => (input) => {
    const seeded = seedFn(input);
    setData((d) => ({ ...d, [key]: [...(d[key] || []), seeded] }));
    if (ready()) {
      sync.upload(seeded)
        .then((res) => {
          if (res && res.uploaded && res.remoteId) {
            setData((d) => ({ ...d, [key]: (d[key] || []).map((x) => (x.id === seeded.id ? { ...x, remoteUuid: res.remoteId } : x)) }));
          }
        })
        .catch((e) => console.warn(errLabel, e));
    }
    return seeded.id;
  };

  // optimistic update: patch locally, push the mapped columns if already synced.
  const makeUpdate = (key, sync, columnOf, errLabel, stampUpdatedAt = true) => (id, updates) => setData((d) => {
    const stamped = stampUpdatedAt ? { ...updates, updatedAt: new Date().toISOString() } : { ...updates };
    const next = (d[key] || []).map((x) => (x.id === id ? { ...x, ...stamped } : x));
    if (ready()) {
      const updated = next.find((x) => x.id === id);
      if (updated && updated.remoteUuid) {
        const patch = {};
        for (const [localKey, column] of Object.entries(columnOf)) {
          if (updates[localKey] !== undefined) patch[column] = updates[localKey];
        }
        if (Object.keys(patch).length > 0) sync.updateRow(updated.remoteUuid, patch).catch((e) => console.warn(errLabel, e));
      }
    }
    return { ...d, [key]: next };
  });

  const userId = () => (typeof ctx.userId === 'function' ? ctx.userId() : null);

  return {
    // Counts (0053)
    addInventoryCount: makeAdd('inventoryCounts', kitchenCountsSync,
      (count) => ({ ...count, id: rid('count'), startedAt: count?.startedAt || new Date().toISOString(), createdBy: userId() }),
      '[kitchen-counts-sync] add upload failed'),
    updateInventoryCount: makeUpdate('inventoryCounts', kitchenCountsSync, COUNT_COLUMN_OF, '[kitchen-counts-sync] update failed'),
    addInventoryCountLine: makeAdd('inventoryCountLines', kitchenCountLinesSync,
      (line) => ({ ...line, id: rid('cl'), countedAt: line?.countedAt || new Date().toISOString(), createdBy: userId() }),
      '[kitchen-count-lines-sync] add upload failed'),
    updateInventoryCountLine: makeUpdate('inventoryCountLines', kitchenCountLinesSync, COUNT_LINE_COLUMN_OF, '[kitchen-count-lines-sync] update failed', false),

    // Purchasing (0054)
    addPurchaseOrder: makeAdd('purchaseOrders', purchaseOrdersSync,
      (po) => ({ ...po, id: rid('po'), createdAt: new Date().toISOString(), createdBy: userId() }),
      '[purchase-orders-sync] add upload failed'),
    updatePurchaseOrder: makeUpdate('purchaseOrders', purchaseOrdersSync, PURCHASE_ORDER_COLUMN_OF, '[purchase-orders-sync] update failed'),
    addPurchaseOrderLine: makeAdd('purchaseOrderLines', purchaseOrderLinesSync,
      (line) => ({ ...line, id: rid('pol'), createdBy: userId() }),
      '[purchase-order-lines-sync] add upload failed'),
  };
}
