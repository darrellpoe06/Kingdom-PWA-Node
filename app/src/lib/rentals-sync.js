// =============================================================================
// rentals-sync — cross-device sync for the rentals table (schema v2.2.2)
// =============================================================================
// Real Estate properties live nested at data.inflows.rentals and carry far
// more local detail than the rentals table models: mortgage rate / P&I /
// escrow, rooms, equipment, maintenance + conversation logs, lease / tenant /
// market-facts sub-objects, and the per-month collection field (actual).
// Only the top-level property columns travel (one row per property);
// everything else stays device-local. Because of that, the monolith merges
// remote rows INTO the local shape (mergeRemoteRentals below) instead of
// replacing the list wholesale like the flat v1.2 tables do. Leases /
// rent_payments sync is the planned follow-up.
//
// Local shape (seed + Rentals.jsx submitProp payload):
//   { id: 'r1', name: '1402 Maple St', address: '1402 Maple St',
//     city: 'Cedar Heights', state: 'IL', zip: '', tenantName: '',
//     propertyType: <one of PROPERTY_TYPES>, rent: 1100, actual: 1100,
//     status: <one of LOCAL_STATUSES>, entityId: 'e-poeprops',
//     purchasePrice: 0, purchaseDate: '', estimatedValue: 0,
//     mortgage: { balance, rate, monthlyPI, escrow, estimated },
//     notes: '', ...device-local sub-records }
//
// Remote shape (schema v2.2 + v2.2.2 amendments):
//   { id (uuid), instance_id, created_by, created_at, updated_at, lifecycle,
//     links, entity_id, slug, address, unit, city, state, zip, display_name,
//     property_type, purchase_date, purchase_price, current_market_value,
//     mortgage_amount, mortgage_paid_off, property_taxes_annual,
//     insurance_annual, hoa_monthly, notes, status }
//
// v2.2.2 contract (REQUIRES schema-v2.2.2-rentals-sync-amendments.sql):
//   - `slug` is a real column with a per-instance unique index, so
//     cross-device dedup is enforced by the database, not just the client.
//     The links { type: 'local-slug', id } entry is still written for
//     back-compat and read as a fallback for rows from the v0 soak client.
//   - city / state / zip travel with the property so the Zillow / Realtor /
//     county-assessor lookups work on every device, not just the one that
//     typed them. On merge they FILL (a remote value lands locally) but a
//     blank remote value never erases local detail.
//   - status and property_type store the app's real vocab — the CHECKs
//     were widened to the union, so nothing is flattened to a fake value
//     and both fields sync two-way like any other column. fromRemoteStatus
//     still normalizes the six v2.2 occupancy values written by the v0
//     soak client into the app's vocab.
//
// Columns intentionally not mapped (no local equivalent yet): unit,
// property_taxes_annual, insurance_annual, hoa_monthly, mortgage_paid_off,
// entity_id (uuid FK — local entityId is a slug and v2.2 has no entity_slug
// + trigger like accounts; the slug stays device-local for now).
//
// RLS note: rentals_owner_delete requires the instance 'owner' role; a
// non-owner's delete still works locally and logs a warn on the remote leg.
// Tier note: rentals_tier_enforce caps Family-tier instances at 1 active
// door and landlord-tier at 10 — since v2.2.2 the family's own homes
// (property_type primary-home / secondary-home, status owner-occupied) do
// NOT count against the caps. A refused insert is skipped with a warn and
// the app keeps working from localStorage.
// =============================================================================
import { createTableSync } from './table-sync.js';

// The full property-type vocab — identical to the Rentals.jsx select list
// and, since v2.2.2, to the remote CHECK. Nothing gets flattened.
const PROPERTY_TYPES = new Set([
  'single-family', 'duplex', 'multi-family', 'condo', 'townhouse',
  'commercial', 'land', 'primary-home', 'secondary-home', 'vacation', 'other',
]);

export function toRemotePropertyType(t) {
  return PROPERTY_TYPES.has(t) ? t : 'single-family';
}

// The app's status vocab — identical to the Rentals.jsx select list.
const LOCAL_STATUSES = new Set([
  'paying', 'late', 'vacant', 'rehab', 'for-sale', 'sold',
  'owner-occupied', 'seasonal', 'unrented',
]);

// The remote CHECK (v2.2.2) = LOCAL_STATUSES plus the original v2.2
// occupancy values, kept valid for rows written by the v0 soak client.
const REMOTE_STATUS_CHECK = new Set([...LOCAL_STATUSES, 'occupied', 'listed', 'off-market']);

export function toRemoteStatus(s) {
  return REMOTE_STATUS_CHECK.has(s) ? s : 'paying';
}

// Rows written by the v0 soak client carry the old flattened occupancy
// vocab — normalize those into the app's vocab; pass real values through.
const LEGACY_REMOTE_TO_LOCAL_STATUS = {
  occupied: 'paying',
  listed: 'for-sale',
  'off-market': 'unrented',
};

export function fromRemoteStatus(s) {
  if (LOCAL_STATUSES.has(s)) return s;
  return LEGACY_REMOTE_TO_LOCAL_STATUS[s] || 'paying';
}

function slugFromLinks(links) {
  const hit = Array.isArray(links)
    ? links.find((l) => l && l.type === 'local-slug' && l.id)
    : null;
  return hit ? hit.id : null;
}

export const rentalsSync = createTableSync({
  localKey: 'rentals',
  remoteTable: 'rentals',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id:          tenantId,
      created_by:           userId,
      slug:                 item.id,
      links:                [{ type: 'local-slug', id: item.id }],
      address:              item.address || item.name || '',
      city:                 item.city || null,
      state:                item.state || null,
      zip:                  item.zip || null,
      display_name:         item.name || item.address || '',
      property_type:        toRemotePropertyType(item.propertyType),
      purchase_date:        item.purchaseDate || null,
      purchase_price:       Number(item.purchasePrice) || 0,
      current_market_value: Number(item.estimatedValue) || 0,
      mortgage_amount:      Number(item.mortgage?.balance) || 0,
      notes:                item.notes ?? null,
      status:               toRemoteStatus(item.status),
    };
  },

  fromRow(row) {
    return {
      id:             row.slug || slugFromLinks(row.links) || `r-remote-${row.id}`,
      remoteUuid:     row.id,
      tenantId:       row.instance_id,
      name:           row.display_name,
      address:        row.address,
      city:           row.city ?? '',
      state:          row.state ?? '',
      zip:            row.zip ?? '',
      propertyType:   PROPERTY_TYPES.has(row.property_type) ? row.property_type : 'single-family',
      rent:           0,
      actual:         0,
      status:         fromRemoteStatus(row.status),
      purchasePrice:  Number(row.purchase_price) || 0,
      purchaseDate:   row.purchase_date || '',
      estimatedValue: Number(row.current_market_value) || 0,
      mortgage: {
        balance:   Number(row.mortgage_amount) || 0,
        rate:      0,
        monthlyPI: 0,
        escrow:    0,
        estimated: true,
      },
      notes:          row.notes ?? '',
      updatedAt:      row.updated_at,
      createdAt:      row.created_at,
    };
  },

  idOf(item) {
    return item.id; // the local slug; the DB enforces (instance_id, slug) unique
  },
});

// Fields where the remote column is the source of truth across devices.
// Since v2.2.2 that includes status and propertyType — the CHECKs accept
// the app's real vocab, so they sync two-way like any other column.
const SYNCED_FIELDS = [
  'name', 'address', 'notes', 'purchasePrice', 'purchaseDate',
  'estimatedValue', 'status', 'propertyType',
];

// Location fields fill in from remote but a blank remote value never
// erases local detail (rows from the v0 soak client predate the columns).
const FILL_FIELDS = ['city', 'state', 'zip'];

// Merge remote rows into the local list, preserving device-local detail:
//   - local item matched remotely (by slug or remoteUuid) → overlay the
//     synced columns; keep rent/actual, mortgage rate/P&I/escrow, rooms,
//     equipment, logs, entityId, etc.
//   - local item never uploaded (no remoteUuid, no match) → keep it;
//     initialSync / addRental will push it.
//   - local item with a remoteUuid whose row is gone → deleted on another
//     device → drop it.
//   - remote row with no local match → new from another device → adopt the
//     fromRow shape as-is.
export function mergeRemoteRentals(localItems = [], remoteItems = []) {
  const remoteById = new Map();
  const remoteByUuid = new Map();
  for (const r of remoteItems) {
    remoteById.set(r.id, r);
    remoteByUuid.set(r.remoteUuid, r);
  }
  const claimed = new Set();
  const merged = [];
  for (const local of localItems) {
    const remote = remoteById.get(local.id)
      || (local.remoteUuid ? remoteByUuid.get(local.remoteUuid) : null);
    if (remote) {
      claimed.add(remote.remoteUuid);
      const next = { ...local, remoteUuid: remote.remoteUuid, updatedAt: remote.updatedAt };
      for (const f of SYNCED_FIELDS) next[f] = remote[f];
      for (const f of FILL_FIELDS) if (remote[f]) next[f] = remote[f];
      // Only the balance column syncs; rate / P&I / escrow stay device-local.
      next.mortgage = local.mortgage
        ? { ...local.mortgage, balance: remote.mortgage.balance }
        : remote.mortgage;
      merged.push(next);
    } else if (!local.remoteUuid) {
      merged.push(local);
    }
  }
  for (const r of remoteItems) {
    if (!claimed.has(r.remoteUuid)) merged.push(r);
  }
  return merged;
}
