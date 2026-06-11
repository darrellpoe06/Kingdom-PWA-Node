// =============================================================================
// rentals-sync — cross-device sync for the rentals table (schema v2.2)
// =============================================================================
// Real Estate properties live nested at data.inflows.rentals and carry far
// more local detail than the v2.2 rentals table models: mortgage rate / P&I /
// escrow, rooms, equipment, maintenance + conversation logs, lease / tenant /
// market-facts sub-objects, and rent-collection fields (rent, actual). Only
// the top-level property columns travel (one row per property); everything
// else stays device-local. Because of that, the monolith merges remote rows
// INTO the local shape (mergeRemoteRentals below) instead of replacing the
// list wholesale like the flat v1.2 tables do. Leases / rent_payments sync
// is the planned follow-up.
//
// Local shape (seed + Rentals.jsx submitProp payload):
//   { id: 'r1', name: '1402 Maple St', address: '1402 Maple St',
//     city: 'Cedar Heights', state: 'IL', zip: '', tenantName: '',
//     propertyType: 'single-family'|...|'primary-home'|'vacation'|'other',
//     rent: 1100, actual: 1100, status: 'paying'|'late'|'vacant'|...,
//     entityId: 'e-poeprops', purchasePrice: 0, purchaseDate: '',
//     estimatedValue: 0, mortgage: { balance, rate, monthlyPI, escrow,
//     estimated }, notes: '', ...device-local sub-records }
//
// Remote shape (schema v2.2 rentals row):
//   { id (uuid), instance_id, created_by, created_at, updated_at, lifecycle,
//     links, entity_id, address, unit, display_name, property_type,
//     purchase_date, purchase_price, current_market_value, mortgage_amount,
//     mortgage_paid_off, property_taxes_annual, insurance_annual,
//     hoa_monthly, notes, status }
//
// v2.2 has no slug column (unlike the v1.2 tables), so the local slug rides
// in the `links` jsonb as { type: 'local-slug', id } — that keeps the
// initialSync dedup working across devices that share the same seed.
//
// Lossy-vocab note: local status ('paying','late','owner-occupied',...) is
// rent-collection state; the remote status CHECK is occupancy state
// ('occupied','vacant','rehab','listed','sold','off-market'). We push a
// mapped occupancy up, but never overwrite a present local status from
// remote — the richer local meaning wins on this device. Same one-way
// treatment for propertyType: the remote CHECK lacks 'primary-home' /
// 'secondary-home' / 'vacation' / 'other'.
//
// Columns intentionally not mapped (no local equivalent yet): unit,
// property_taxes_annual, insurance_annual, hoa_monthly, mortgage_paid_off,
// entity_id (uuid FK — local entityId is a slug and v2.2 has no entity_slug
// + trigger like accounts; the slug stays device-local for now).
//
// RLS note: rentals_owner_delete requires the instance 'owner' role; a
// non-owner's delete still works locally and logs a warn on the remote leg.
// Tier note: rentals_tier_enforce caps landlord-tier instances at 10 active
// doors — an insert past the cap is skipped with a warn, app keeps working
// from localStorage.
// =============================================================================
import { createTableSync } from './table-sync.js';

const REMOTE_PROPERTY_TYPES = new Set([
  'single-family', 'duplex', 'multi-family', 'condo', 'townhouse', 'commercial', 'land',
]);

// Local-only types ('primary-home','secondary-home','vacation','other') have
// no remote equivalent — they store as single-family; the local field keeps
// the truth (mergeRemoteRentals never overwrites a present local value).
export function toRemotePropertyType(t) {
  return REMOTE_PROPERTY_TYPES.has(t) ? t : 'single-family';
}

// local rent-collection status → remote occupancy status (CHECK constraint)
const LOCAL_TO_REMOTE_STATUS = {
  paying: 'occupied',
  late: 'occupied',
  'owner-occupied': 'occupied',
  seasonal: 'occupied',
  occupied: 'occupied',
  vacant: 'vacant',
  unrented: 'vacant',
  rehab: 'rehab',
  'for-sale': 'listed',
  listed: 'listed',
  sold: 'sold',
  'off-market': 'off-market',
};

export function toRemoteStatus(s) {
  return LOCAL_TO_REMOTE_STATUS[s] || 'occupied';
}

// remote occupancy → a sensible local default for rows born on another device
const REMOTE_TO_LOCAL_STATUS = {
  occupied: 'paying',
  vacant: 'vacant',
  rehab: 'rehab',
  listed: 'for-sale',
  sold: 'sold',
  'off-market': 'unrented',
};

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
      links:                [{ type: 'local-slug', id: item.id }],
      address:              item.address || item.name || '',
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
      id:             slugFromLinks(row.links) ?? `r-remote-${row.id}`,
      remoteUuid:     row.id,
      tenantId:       row.instance_id,
      name:           row.display_name,
      address:        row.address,
      propertyType:   row.property_type,
      rent:           0,
      actual:         0,
      status:         REMOTE_TO_LOCAL_STATUS[row.status] || 'paying',
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
    return item.id; // the local slug; dedup at initialSync time via links
  },
});

// Fields where the remote column is the source of truth across devices.
// status / propertyType / mortgage are handled specially below.
const SYNCED_FIELDS = ['name', 'address', 'notes', 'purchasePrice', 'purchaseDate', 'estimatedValue'];

// Merge remote rows into the local list, preserving device-local detail:
//   - local item matched remotely (by slug or remoteUuid) → overlay only the
//     synced columns; keep rent/actual, mortgage rate/P&I/escrow, rooms,
//     equipment, logs, city/state/zip, entityId, etc.
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
      // status / propertyType vocab is richer locally — a present local value wins.
      if (!local.status) next.status = remote.status;
      if (!local.propertyType) next.propertyType = remote.propertyType;
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
