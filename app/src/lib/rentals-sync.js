// =============================================================================
// rentals-sync — cross-device sync for the LIVE rentals table
// =============================================================================
// LIVE-SHAPE NOTE (2026-06-10, discovered during the signed-in migration
// session): the cloud rentals table is the v1.2-numeric-sync shape evolved
// (instance_id, slug, entity_slug, address, unit, monthly_rent,
// mortgage_payment, reserves, status, notes, tenant_name) — the v2.2
// rentals CREATE never applied (the v1.2 table already existed, so
// IF NOT EXISTS no-opped). The repo's schema files are NOT the applied
// state; this wrapper maps to the columns verified live via catalog
// queries, plus the twelve added by schema-v2.13-family-data-sync.sql
// (applied 2026-06-10): display_name, city, state, zip, property_type,
// purchase_date, purchase_price, current_market_value, mortgage_balance,
// mortgage_rate, mortgage_escrow, rent_actual.
//
// What this buys vs the old plan: slug and entity_slug are NATIVE columns
// (no links jsonb ride-along), status/property_type have NO CHECKs (the
// app's real vocab stores as-is), and the FULL numeric picture syncs —
// rent, actual collected, tenant name, and the whole mortgage object
// (balance, rate, P&I via mortgage_payment, escrow) — so Christina's
// device computes the same snowball math as Darrell's.
//
// Still device-local (no columns): rooms, equipment, maintenanceLog,
// conversationLog, lat/lon, market/lease/tenant sub-objects. Because of
// that, the monolith merges remote rows INTO the local shape
// (mergeRemoteRentals below) instead of replacing the list wholesale.
import { createTableSync } from './table-sync.js';

// The UI vocab (Rentals.jsx selects). The live table has no CHECKs; these
// passthrough-with-fallback helpers exist so garbage never syncs and the
// monolith's patch mapping has one place to normalize.
const PROPERTY_TYPES = new Set([
  'single-family', 'duplex', 'multi-family', 'condo', 'townhouse',
  'commercial', 'land', 'primary-home', 'secondary-home', 'vacation', 'other',
]);

export function toRemotePropertyType(t) {
  return PROPERTY_TYPES.has(t) ? t : 'single-family';
}

const LOCAL_STATUSES = new Set([
  'paying', 'late', 'vacant', 'rehab', 'for-sale', 'sold',
  'owner-occupied', 'seasonal', 'unrented',
]);

// Legacy occupancy vocab (in case any tool ever wrote v2.2-style values).
const LEGACY_REMOTE_TO_LOCAL_STATUS = {
  occupied: 'paying',
  listed: 'for-sale',
  'off-market': 'unrented',
};

export function toRemoteStatus(s) {
  return LOCAL_STATUSES.has(s) || LEGACY_REMOTE_TO_LOCAL_STATUS[s] ? s : 'paying';
}

export function fromRemoteStatus(s) {
  if (LOCAL_STATUSES.has(s)) return s;
  return LEGACY_REMOTE_TO_LOCAL_STATUS[s] || 'paying';
}

export const rentalsSync = createTableSync({
  localKey: 'rentals',
  remoteTable: 'rentals',

  toRow(item, { tenantId, userId }) {
    return {
      instance_id:          tenantId,
      created_by:           userId,
      slug:                 item.id,
      entity_slug:          item.entityId || null,
      display_name:         item.name || item.address || '',
      address:              item.address || item.name || '',
      city:                 item.city || null,
      state:                item.state || null,
      zip:                  item.zip || null,
      tenant_name:          item.tenantName || null,
      property_type:        toRemotePropertyType(item.propertyType),
      status:               toRemoteStatus(item.status),
      monthly_rent:         Number(item.rent) || 0,
      rent_actual:          Number(item.actual) || 0,
      purchase_date:        item.purchaseDate || null,
      purchase_price:       Number(item.purchasePrice) || 0,
      current_market_value: Number(item.estimatedValue) || 0,
      mortgage_balance:     Number(item.mortgage?.balance) || 0,
      mortgage_rate:        Number(item.mortgage?.rate) || 0,
      mortgage_payment:     Number(item.mortgage?.monthlyPI) || 0,
      mortgage_escrow:      Number(item.mortgage?.escrow) || 0,
      notes:                item.notes ?? null,
    };
  },

  fromRow(row) {
    return {
      id:             row.slug || `r-remote-${row.id}`,
      remoteUuid:     row.id,
      entityId:       row.entity_slug || 'e-poeprops',
      name:           row.display_name || row.address,
      address:        row.address,
      city:           row.city ?? '',
      state:          row.state ?? '',
      zip:            row.zip ?? '',
      tenantName:     row.tenant_name ?? '',
      propertyType:   PROPERTY_TYPES.has(row.property_type) ? row.property_type : 'single-family',
      status:         fromRemoteStatus(row.status),
      rent:           Number(row.monthly_rent) || 0,
      actual:         Number(row.rent_actual) || 0,
      purchasePrice:  Number(row.purchase_price) || 0,
      purchaseDate:   row.purchase_date || '',
      estimatedValue: Number(row.current_market_value) || 0,
      mortgage: {
        balance:   Number(row.mortgage_balance) || 0,
        rate:      Number(row.mortgage_rate) || 0,
        monthlyPI: Number(row.mortgage_payment) || 0,
        escrow:    Number(row.mortgage_escrow) || 0,
        estimated: false,
      },
      notes:          row.notes ?? '',
      updatedAt:      row.updated_at,
      createdAt:      row.created_at,
    };
  },

  idOf(item) {
    return item.id; // the local slug; the DB's (instance_id, slug) unique index enforces dedup
  },
});

// Fields where the remote column is the source of truth across devices.
const SYNCED_FIELDS = [
  'name', 'address', 'notes', 'purchasePrice', 'purchaseDate',
  'estimatedValue', 'status', 'propertyType', 'rent', 'actual',
  'tenantName', 'entityId',
];

// Location fields fill in from remote but a blank remote value never
// erases locally-typed detail.
const FILL_FIELDS = ['city', 'state', 'zip'];

// Merge remote rows into the local list, preserving device-local detail:
//   - local item matched remotely (by slug or remoteUuid) → overlay the
//     synced columns + the full mortgage object; keep rooms, equipment,
//     logs, market/lease sub-objects, lat/lon.
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
      // The whole mortgage object syncs now (v2.13 added rate / P&I /
      // escrow columns); only the local 'estimated' flag is preserved.
      next.mortgage = local.mortgage
        ? { ...remote.mortgage, estimated: local.mortgage.estimated }
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
