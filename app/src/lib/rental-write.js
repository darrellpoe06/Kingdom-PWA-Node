// =============================================================================
// rental-write — one door, two tabs, one change
// =============================================================================
// Darrell, 2026-08-28: "I edited the addresses in property and they did not
// update Real Estate.... fix it! perpetually.... obviously..."
//
// MEASURED. There are TWO functions called updateRental, and they write two
// different stores:
//
//   Real Estate  poe-financial-mvp-v28.jsx:3078  → localStorage, then uploads
//   Properties   modules/properties/cloud.js:456 → the Postgres row, by UUID
//
// Neither tells the other. The Properties tab re-reads the cloud after a save
// so IT looks correct; the Real Estate tab reads its own device list and never
// hears that anything happened. Editing a door in one tab and looking for it in
// the other is the most ordinary thing a landlord does, and it has never worked.
//
// This is the bridge, and it goes in a module rather than in either tab so that
// "perpetually" means something: a guard asserts that the Properties save path
// announces, so the next person to add a write cannot quietly skip it.
//
// WHY ANNOUNCE RATHER THAN WRITE THE OTHER STORE DIRECTLY. The Real Estate list
// lives inside the monolith's `data.inflows.rentals`, behind its own setState,
// its own persistence and its own upload rules (including a merge that
// deliberately refuses to let an empty remote erase local detail, after a past
// incident). Reaching into that from here would fork those rules. The tab that
// owns the list applies the patch itself; this module only carries the news.
//
// PURE except for the event bus, which is injectable for tests.
// =============================================================================

import { toRemoteStatus, toRemotePropertyType } from './rentals-sync.js';

export const RENTAL_CHANGED = 'poe-rental-changed';

// -----------------------------------------------------------------------------
// The two vocabularies. The cloud row uses snake_case column names; the device
// list uses the app's camelCase fields. The monolith already maps local→cloud
// when IT saves; this is the direction nobody had written, which is exactly why
// a Properties edit had no way to reach the other tab.
// -----------------------------------------------------------------------------
export const CLOUD_TO_LOCAL = Object.freeze({
  display_name: 'name',
  address: 'address',
  unit: 'unitLabel',
  city: 'city',
  state: 'state',
  zip: 'zip',
  tenant_name: 'tenantName',
  entity_slug: 'entityId',
  monthly_rent: 'rent',
  rent_actual: 'actual',
  status: 'status',
  property_type: 'propertyType',
  notes: 'notes',
  building_label: 'building',
  room_label: 'roomLabel',
  rentable_level: 'rentableLevel',
});

const NUMERIC = new Set(['rent', 'actual']);

/**
 * Translate a cloud patch into the fields the device list understands.
 *
 * Unknown columns are DROPPED rather than passed through: the device list is a
 * different shape, and writing `listed_at` or `showcase_order` into it would
 * put a column name where a field belongs and quietly corrupt the record the
 * portfolio maths reads.
 */
export function cloudPatchToLocal(patch = {}) {
  const out = {};
  for (const [col, value] of Object.entries(patch || {})) {
    const field = CLOUD_TO_LOCAL[col];
    if (!field) continue;
    if (NUMERIC.has(field)) {
      const n = Number(value);
      out[field] = Number.isFinite(n) ? n : 0;
      continue;
    }
    // A cleared cloud field is an empty string locally, never the literal
    // "null" a naive String() would produce.
    out[field] = value === null || value === undefined ? '' : value;
  }
  return out;
}

/** Nothing worth telling anybody about. */
export const isEmptyPatch = (p) => !p || Object.keys(p).length === 0;

/**
 * Tell every surface on this device that one door changed.
 *
 * Carries the SLUG and the UUID both, because the two tabs key on different
 * ones and a listener must be able to find its own row either way — the same
 * two-keys trap that has already caused silent no-op writes twice in this
 * module's neighbours.
 */
export function announceRentalChange({ slug = null, uuid = null, patch = {} } = {}, bus) {
  const local = cloudPatchToLocal(patch);
  if (isEmptyPatch(local)) return { ok: false, reason: 'nothing-to-announce' };
  if (!slug && !uuid) return { ok: false, reason: 'no-key' };
  const target = bus || (typeof window !== 'undefined' ? window : null);
  if (!target || typeof target.dispatchEvent !== 'function') {
    return { ok: false, reason: 'no-bus', patch: local };
  }
  try {
    target.dispatchEvent(new CustomEvent(RENTAL_CHANGED, {
      detail: { slug, uuid, patch: local },
    }));
    return { ok: true, patch: local };
  } catch (e) {
    // A surface that cannot broadcast must not take the save down with it: the
    // cloud row is already written by the time this runs.
    return { ok: false, reason: 'dispatch-failed', error: e && e.message, patch: local };
  }
}

/** Subscribe. Returns the unsubscribe, so a component can clean up. */
export function onRentalChange(handler, bus) {
  const target = bus || (typeof window !== 'undefined' ? window : null);
  if (!target || typeof target.addEventListener !== 'function') return () => {};
  const fn = (e) => {
    const d = (e && e.detail) || {};
    if (isEmptyPatch(d.patch)) return;
    if (!d.slug && !d.uuid) return;
    try { handler(d); } catch { /* one bad listener never breaks the others */ }
  };
  target.addEventListener(RENTAL_CHANGED, fn);
  return () => target.removeEventListener(RENTAL_CHANGED, fn);
}

/**
 * Apply an announced change to a device-list of rentals.
 *
 * Matches on the UUID first and the slug second — a door that has synced has
 * both, one that has not has only the slug. Returns the SAME array reference
 * when nothing matched, so a caller can skip a re-render it does not need.
 */
export function applyRentalChange(rentals = [], { slug, uuid, patch } = {}) {
  if (isEmptyPatch(patch) || (!slug && !uuid)) return rentals;
  let hit = false;
  const next = (rentals || []).map((r) => {
    if (!r) return r;
    const match = (uuid && r.remoteUuid === uuid) || (slug && r.id === slug);
    if (!match) return r;
    hit = true;
    return { ...r, ...patch };
  });
  return hit ? next : rentals;
}

// -----------------------------------------------------------------------------
// THE OTHER DIRECTION — a device-list patch, as cloud columns.
//
// EXTRACTED VERBATIM from poe-financial-mvp-v28.jsx (2026-08-28). It had lived
// as 22 lines inside the monolith's updateRental, which is a file frozen to
// bug-fixes only — and its own budget guard caught the first draft of this
// bridge at +22 over. That guard is right, and the right answer to "the
// monolith needs something" is a module it calls, not an exemption.
//
// It also belongs beside CLOUD_TO_LOCAL: the two directions of the same
// translation had been living in two files that did not know about each other,
// which is the shape of the bug this whole module exists to close.
//
// CHARACTERIZED BEFORE MOVED (DR-0076 §5): the tests pin the exact prior
// behaviour — which fields coerce to a number, which fall back to null rather
// than an empty string, and that an ABSENT key writes nothing at all. A patch
// that names no cloud column returns {}, and the caller skips the round-trip.
// -----------------------------------------------------------------------------
const num = (v) => parseFloat(v) || 0;

export function localPatchToCloud(updates = {}) {
  const u = updates || {};
  const patch = {};
  if (u.name !== undefined)           patch.display_name = u.name;
  if (u.address !== undefined)        patch.address = u.address;
  if (u.city !== undefined)           patch.city = u.city || null;
  if (u.state !== undefined)          patch.state = u.state || null;
  if (u.zip !== undefined)            patch.zip = u.zip || null;
  if (u.tenantName !== undefined)     patch.tenant_name = u.tenantName || null;
  if (u.entityId !== undefined)       patch.entity_slug = u.entityId || null;
  if (u.propertyType !== undefined)   patch.property_type = toRemotePropertyType(u.propertyType);
  if (u.status !== undefined)         patch.status = toRemoteStatus(u.status);
  if (u.rent !== undefined)           patch.monthly_rent = num(u.rent);
  if (u.actual !== undefined)         patch.rent_actual = num(u.actual);
  if (u.purchasePrice !== undefined)  patch.purchase_price = num(u.purchasePrice);
  if (u.purchaseDate !== undefined)   patch.purchase_date = u.purchaseDate || null;
  if (u.estimatedValue !== undefined) patch.current_market_value = num(u.estimatedValue);
  if (u.mortgage !== undefined) {
    patch.mortgage_balance = num(u.mortgage?.balance);
    patch.mortgage_rate    = num(u.mortgage?.rate);
    patch.mortgage_payment = num(u.mortgage?.monthlyPI);
    patch.mortgage_escrow  = num(u.mortgage?.escrow);
  }
  if (u.notes !== undefined)          patch.notes = u.notes;
  return patch;
}
