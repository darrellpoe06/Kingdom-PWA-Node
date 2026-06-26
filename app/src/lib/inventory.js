// =============================================================================
// inventory — a real inventory CONTROL system (system-of-record, not a list).
// =============================================================================
// The concrete demonstration of what enterprise software is genuinely good at
// and a spreadsheet is not: on-hand quantity is NEVER a stored number you edit.
// It is DERIVED from the full, append-only history of stock movements — every
// receipt, issue, count adjustment, and transfer. The same shape as the Books
// rule "a balance is opening + the sum of settled transactions": current truth
// is computed from an immutable ledger, so it can never silently drift.
//
// Two records:
//   * ITEM     — the catalog entry (sku, name, category, home location, unit,
//                reorder point, unit cost). Editable; its edit history is kept
//                via the record-history primitive (a versioned living record).
//   * MOVEMENT — one immutable in/out/adjust/transfer event against an item.
//                Append-only by design (and by DB policy, migration 0052):
//                you never edit history; you post a NEW correcting movement.
//
// CORPORATE CONTROLS embodied here:
//   * No-negative guard — an 'out' that would drive on-hand below zero is
//     rejected by validateMovement (overridable per item for consignment cases).
//   * Balanced transfer — a transfer is a PAIR (out at source, in at dest) that
//     nets to zero across locations: double-entry discipline for stock.
//   * Status workflow — OK -> LOW (<= reorder point) -> OUT (<= 0), derived.
//   * Dedup by SKU — the same SKU entered twice is surfaced, not silently piled.
//
// Pure + dependency-free. The Supabase side is inventory-items-sync.js (full
// CRUD) + inventory-movements-sync.js (append-only). Surfaced by Inventory.jsx.
// =============================================================================

export const MOVEMENT_KINDS = ['in', 'out', 'adjust', 'transfer-out', 'transfer-in'];

// Canonical, friendly labels for the movement kinds (UI + audit lines).
export const MOVEMENT_LABEL = {
  in: 'Received',
  out: 'Issued',
  adjust: 'Count adjust',
  'transfer-out': 'Transfer out',
  'transfer-in': 'Transfer in',
};

// signedQty — a movement's effect on on-hand. 'out' and 'transfer-out' subtract;
// 'in' and 'transfer-in' add; 'adjust' carries a signed delta (a physical count
// correction can be + or -). qty is otherwise stored as a positive magnitude.
export function signedQty(mv) {
  if (!mv) return 0;
  const q = Number(mv.qty) || 0;
  switch (mv.kind) {
    case 'in':
    case 'transfer-in':
      return Math.abs(q);
    case 'out':
    case 'transfer-out':
      return -Math.abs(q);
    case 'adjust':
      return q; // signed: the delta to reach the counted quantity
    default:
      return 0;
  }
}

function movementsForItem(movements, itemId) {
  return (movements || []).filter((m) => m && m.itemId === itemId);
}

// onHandFor — current quantity on hand for one item (optionally at one
// location). Derived: the sum of every movement's signed effect. This is the
// single source of truth for "how many do we have"; nothing stores it.
export function onHandFor(movements, itemId, location = null) {
  return movementsForItem(movements, itemId).reduce((sum, m) => {
    if (location != null && (m.location || null) !== location) return sum;
    return sum + signedQty(m);
  }, 0);
}

// onHandByItem — { itemId: qty } across all locations, derived from the ledger.
export function onHandByItem(movements) {
  const out = {};
  for (const m of movements || []) {
    if (!m || !m.itemId) continue;
    out[m.itemId] = (out[m.itemId] || 0) + signedQty(m);
  }
  return out;
}

// onHandByItemLocation — { itemId: { location: qty } }, so a transfer's two
// legs show stock leaving one room and arriving in another.
export function onHandByItemLocation(movements) {
  const out = {};
  for (const m of movements || []) {
    if (!m || !m.itemId) continue;
    const loc = m.location || 'unspecified';
    out[m.itemId] = out[m.itemId] || {};
    out[m.itemId][loc] = (out[m.itemId][loc] || 0) + signedQty(m);
  }
  return out;
}

// statusOf — the derived stock status for an item given its on-hand.
//   'out'  — nothing on hand (<= 0)
//   'low'  — at or below the reorder point (reorder point > 0)
//   'ok'   — healthy
export function statusOf(item, onHand) {
  const qty = Number(onHand) || 0;
  if (qty <= 0) return 'out';
  const reorder = Number(item?.reorderPoint) || 0;
  if (reorder > 0 && qty <= reorder) return 'low';
  return 'ok';
}

// valueOf — the inventory value of an item's position (on-hand * unit cost).
export function valueOf(item, onHand) {
  return (Number(onHand) || 0) * (Number(item?.unitCost) || 0);
}

// lowStockItems — items whose derived status is low OR out (active items only).
// The whole point of reorder points: the system flags what to reorder, you do
// not eyeball a spreadsheet.
export function lowStockItems(items, movements) {
  const onHand = onHandByItem(movements);
  return (items || [])
    .filter((it) => it && it.active !== false)
    .map((it) => ({ item: it, onHand: onHand[it.id] || 0, status: statusOf(it, onHand[it.id] || 0) }))
    .filter((r) => r.status === 'low' || r.status === 'out');
}

// validateMovement — the integrity gate every movement passes before it is
// posted. Returns { ok, error }. Rejects bad magnitudes and, for issues, an
// over-draw that would make on-hand negative (unless the item opts into
// negative stock, e.g. consignment). `currentOnHand` is the derived on-hand
// for the relevant scope (item, or item+location for a transfer/issue).
export function validateMovement(item, currentOnHand, mv, { allowNegative = false } = {}) {
  if (!mv || !mv.kind || !MOVEMENT_KINDS.includes(mv.kind)) {
    return { ok: false, error: 'Unknown movement type.' };
  }
  if (!mv.itemId) return { ok: false, error: 'Movement is not tied to an item.' };
  const q = Number(mv.qty);
  if (!Number.isFinite(q)) return { ok: false, error: 'Quantity must be a number.' };
  if (mv.kind !== 'adjust' && Math.abs(q) <= 0) {
    return { ok: false, error: 'Quantity must be greater than zero.' };
  }
  if (mv.kind === 'adjust' && q === 0) {
    return { ok: false, error: 'A count adjustment of zero changes nothing.' };
  }
  const itemAllowsNegative = allowNegative || item?.allowNegative === true;
  const after = (Number(currentOnHand) || 0) + signedQty(mv);
  if (after < 0 && !itemAllowsNegative) {
    return {
      ok: false,
      error: `Only ${Number(currentOnHand) || 0} on hand — this would go to ${after}. Post a count adjustment if the shelf says otherwise.`,
    };
  }
  return { ok: true };
}

// buildTransfer — a transfer is two balanced, linked movements: stock leaves the
// source location and the same quantity arrives at the destination. They share a
// transferId so the pair is auditable as one act and nets to zero across the
// item. Double-entry discipline for inventory.
export function buildTransfer({ itemId, qty, fromLocation, toLocation, reason, actor, at, idBase }) {
  const magnitude = Math.abs(Number(qty) || 0);
  const when = at || new Date().toISOString();
  const transferId = `xfer-${idBase || when}`;
  const base = { itemId, qty: magnitude, reason: reason || 'Transfer', actor: actor || null, occurredAt: when, transferId };
  return [
    { ...base, id: `mv-${idBase || when}-out`, kind: 'transfer-out', location: fromLocation || null, toLocation: toLocation || null },
    { ...base, id: `mv-${idBase || when}-in`, kind: 'transfer-in', location: toLocation || null, fromLocation: fromLocation || null },
  ];
}

// rollupByCategory — consolidation across many entries into clear truth, the
// thing a pile of rows cannot give you: per-category item count, units on hand,
// total value, and how many lines are low/out.
export function rollupByCategory(items, movements) {
  return rollupBy(items, movements, (it) => it.category || 'Uncategorized');
}

// rollupByLocation — per home-location consolidation (same shape).
export function rollupByLocation(items, movements) {
  return rollupBy(items, movements, (it) => it.location || 'Unspecified');
}

function rollupBy(items, movements, keyOf) {
  const onHand = onHandByItem(movements);
  const out = {};
  for (const it of items || []) {
    if (!it) continue;
    const key = keyOf(it);
    const qty = onHand[it.id] || 0;
    const status = statusOf(it, qty);
    out[key] = out[key] || { key, items: 0, units: 0, value: 0, low: 0, out: 0 };
    out[key].items += 1;
    out[key].units += qty;
    out[key].value += valueOf(it, qty);
    if (status === 'low') out[key].low += 1;
    if (status === 'out') out[key].out += 1;
  }
  return out;
}

// dedupeBySku — surface duplicate SKUs (the same item entered twice). Returns
// { unique, duplicates } where `unique` keeps the first occurrence of each SKU
// and `duplicates` are the later collisions (so the UI can warn + offer a
// merge), instead of a spreadsheet silently carrying two "Shure SM58" rows that
// each track half the stock. Items without a SKU are always kept as unique.
export function dedupeBySku(items) {
  const seen = new Map();
  const unique = [];
  const duplicates = [];
  for (const it of items || []) {
    const sku = (it?.sku || '').trim().toUpperCase();
    if (!sku) { unique.push(it); continue; }
    if (seen.has(sku)) {
      duplicates.push({ item: it, conflictsWith: seen.get(sku) });
    } else {
      seen.set(sku, it);
      unique.push(it);
    }
  }
  return { unique, duplicates };
}

// summarizeInventory — the header roll-up: totals across the whole catalog,
// every figure derived from the movement ledger.
export function summarizeInventory(items, movements) {
  const onHand = onHandByItem(movements);
  let totalUnits = 0;
  let totalValue = 0;
  let lowCount = 0;
  let outCount = 0;
  const active = (items || []).filter((it) => it && it.active !== false);
  for (const it of active) {
    const qty = onHand[it.id] || 0;
    totalUnits += qty;
    totalValue += valueOf(it, qty);
    const status = statusOf(it, qty);
    if (status === 'low') lowCount += 1;
    if (status === 'out') outCount += 1;
  }
  return {
    itemCount: active.length,
    totalUnits,
    totalValue,
    lowCount,
    outCount,
    movementCount: (movements || []).length,
  };
}

// decorateItems — attach the derived facts (on-hand, status, value, movement
// count) to each item, ready for a table. Keeps the view dumb: all truth comes
// from here, derived, never painted.
export function decorateItems(items, movements) {
  const onHand = onHandByItem(movements);
  const counts = (movements || []).reduce((acc, m) => {
    if (m && m.itemId) acc[m.itemId] = (acc[m.itemId] || 0) + 1;
    return acc;
  }, {});
  return (items || []).map((it) => {
    const qty = onHand[it.id] || 0;
    return {
      ...it,
      onHand: qty,
      status: statusOf(it, qty),
      value: valueOf(it, qty),
      movementCount: counts[it.id] || 0,
    };
  });
}

// filterItems — queryable/filterable records (the spreadsheet-can't-do-it-well
// part done well): free-text over name/sku/category, exact category/location,
// and a "low stock only" lens. Operates on decorated items so the low filter
// uses the DERIVED status.
export function filterItems(items, movements, { q = '', category = null, location = null, lowOnly = false } = {}) {
  const decorated = decorateItems(items, movements);
  const needle = (q || '').trim().toLowerCase();
  return decorated.filter((it) => {
    if (it.active === false) return false;
    if (category && (it.category || 'Uncategorized') !== category) return false;
    if (location && (it.location || 'Unspecified') !== location) return false;
    if (lowOnly && it.status === 'ok') return false;
    if (needle) {
      const hay = `${it.name || ''} ${it.sku || ''} ${it.category || ''} ${it.location || ''}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

// itemHistoryFromMovements — the immutable stock-movement audit for one item, as
// timeline rows (newest first): every in/out/adjust/transfer with who, when,
// why, the delta, and the running on-hand AFTER that movement. This is the
// "full history of a record and how it changed" for a quantity.
export function itemHistoryFromMovements(movements, itemId, { newestFirst = true } = {}) {
  const chron = movementsForItem(movements, itemId)
    .slice()
    .sort((a, b) => {
      const at = a.occurredAt || '';
      const bt = b.occurredAt || '';
      if (at < bt) return -1;
      if (at > bt) return 1;
      return String(a.id).localeCompare(String(b.id));
    });
  let running = 0;
  const rows = chron.map((m) => {
    const delta = signedQty(m);
    running += delta;
    return {
      id: m.id,
      at: m.occurredAt || null,
      kind: m.kind,
      label: MOVEMENT_LABEL[m.kind] || m.kind,
      delta,
      qty: Math.abs(Number(m.qty) || 0),
      location: m.location || null,
      toLocation: m.toLocation || null,
      reason: m.reason || null,
      actor: m.actor || null,
      ref: m.ref || null,
      onHandAfter: running,
    };
  });
  return newestFirst ? rows.reverse() : rows;
}
