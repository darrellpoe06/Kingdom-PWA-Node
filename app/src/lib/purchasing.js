// =============================================================================
// purchasing — par-based "what to order" drafts (the approve-to-purchase engine)
// =============================================================================
// Mario's north star, P4 (docs/kitchen-inventory/PRD.md sec 9): from the LIVE
// inventory + par levels, generate purchase-order DRAFTS grouped by vendor — the
// quantity to bring each below-par item back up to par. A human REVIEWS and
// APPROVES; PLACING the order / spending money stays the owner's hand. This module
// only computes drafts + the snapshots an approved order records, and the receive
// movements that reconcile a delivery back into stock. It never places an order
// or moves money.
//
// Built on the same derived-on-hand base: on-hand comes from the append-only
// movement ledger (lib/inventory.js onHandByItem), par = the item's reorderPoint.
// Pure + dependency-light; unit-tested in __tests__/purchasing.test.js.
// =============================================================================
import { onHandByItem } from './inventory.js';

export const PO_STATUSES = ['draft', 'approved', 'placed', 'received'];
export const UNASSIGNED_VENDOR = 'Unassigned';

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

// suggestOrderQty — quantity to bring on-hand up to par, optionally padded by a
// usage buffer %. Never negative (at/above par -> 0). Rounded to 2dp to avoid
// float dust; the chef can adjust before approving.
export function suggestOrderQty(onHand, par, { bufferPct = 0 } = {}) {
  const need = num(par) - num(onHand);
  if (need <= 0) return 0;
  const padded = need * (1 + num(bufferPct) / 100);
  return Math.round(padded * 100) / 100;
}

// buildPurchaseDrafts — from the catalog + the movement ledger, the draft POs:
// one per vendor, listing each below-par item with its qty-to-par and a cost
// estimate. Items with no par (reorderPoint <= 0) are never auto-ordered. Pure.
// Returns [{ vendor, lines:[{itemId,name,onHand,par,orderQty,unit,unitCost,lineCost}],
//            totalQty, totalCost }] sorted by spend (largest first).
export function buildPurchaseDrafts(items, movements, { bufferPct = 0 } = {}) {
  const onHand = onHandByItem(movements);
  const byVendor = new Map();
  for (const it of items || []) {
    if (!it || it.active === false) continue;
    const par = num(it.reorderPoint);
    if (par <= 0) continue;                       // no par set -> not ordered
    const have = onHand[it.id] || 0;
    const orderQty = suggestOrderQty(have, par, { bufferPct });
    if (orderQty <= 0) continue;                  // at/above par -> skip
    const vendor = (it.vendor || '').trim() || UNASSIGNED_VENDOR;
    const unitCost = num(it.unitCost);
    const line = {
      itemId: it.id, name: it.name || 'Untitled item',
      onHand: have, par, orderQty, unit: it.unit || 'each',
      unitCost, lineCost: orderQty * unitCost,
    };
    if (!byVendor.has(vendor)) byVendor.set(vendor, { vendor, lines: [], totalQty: 0, totalCost: 0 });
    const group = byVendor.get(vendor);
    group.lines.push(line);
    group.totalQty += orderQty;
    group.totalCost += line.lineCost;
  }
  return Array.from(byVendor.values()).sort((a, b) => b.totalCost - a.totalCost);
}

// draftSummary — totals across all vendor drafts (for the dashboard / header).
export function draftSummary(drafts) {
  const list = drafts || [];
  return {
    vendorCount: list.length,
    lineCount: list.reduce((n, d) => n + d.lines.length, 0),
    totalQty: list.reduce((n, d) => n + d.totalQty, 0),
    totalCost: list.reduce((n, d) => n + d.totalCost, 0),
  };
}

// makePurchaseOrder / makePurchaseOrderLine — normalize a vendor draft into the
// persistable order header + lines (the snapshot recorded when a human approves).
export function makePurchaseOrder(draft, { status = 'draft' } = {}) {
  return {
    vendor: draft?.vendor || UNASSIGNED_VENDOR,
    label: `${draft?.vendor || UNASSIGNED_VENDOR} order`,
    status: PO_STATUSES.includes(status) ? status : 'draft',
    totalQty: num(draft?.totalQty),
    totalCost: num(draft?.totalCost),
  };
}

export function makePurchaseOrderLine(line, poId) {
  return {
    poId: poId || null,
    itemId: line?.itemId || null,
    itemName: line?.name || null,
    orderQty: num(line?.orderQty),
    unit: line?.unit || 'each',
    unitCost: num(line?.unitCost),
    lineCost: num(line?.lineCost ?? (num(line?.orderQty) * num(line?.unitCost))),
  };
}

// poToReceiveMovements — when a placed order ARRIVES, each line becomes a
// 'Received' (in) movement into the append-only ledger, so on-hand updates
// (the perpetual-inventory tie). Receiving is an explicit human action.
export function poToReceiveMovements(lines, po) {
  return (lines || [])
    .filter((l) => l && l.itemId && num(l.orderQty) > 0)
    .map((l) => ({
      itemId: l.itemId,
      kind: 'in',
      qty: num(l.orderQty),
      reason: `PO received: ${po?.vendor || ''}`.trim(),
      ref: po?.id || null,
    }));
}

// canAdvance — the approve-to-purchase state machine guard. Forward-only:
// draft -> approved -> placed -> received. Never auto-advances; the UI calls this
// to validate a human-initiated transition.
export function canAdvance(from, to) {
  const order = ['draft', 'approved', 'placed', 'received'];
  const fi = order.indexOf(from);
  const ti = order.indexOf(to);
  return fi >= 0 && ti === fi + 1;
}
