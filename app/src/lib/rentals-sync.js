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
import { createTableSync, getInstanceId } from './table-sync.js';
import supabase from './supabase.js';
import { syncLeaseForRental, syncAllLeases } from './lease-sync.js';

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

// What a door rents (0160). The database CHECK allows these three or NULL;
// this set keeps anything else from being sent in the first place.
const RENTABLE_LEVELS = new Set(['unit', 'room', 'bed']);

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
      // THE STRUCTURE SYNCS NOW (0160). `unit` has existed on this table the
      // whole time and toRow never wrote it; `building` and the room/level were
      // device-local with no columns at all. So a multi-unit building looked
      // like unrelated doors on a second device, and Apt 4's two beds lost every
      // trace of being beds that share a room. Measured 2026-08-28.
      unit:                 item.unitLabel || null,
      building_label:       item.building || null,
      room_label:           item.roomLabel || null,
      // NULL, never a guess. An unset level means nobody has said yet, and the
      // app infers from the label; writing 'unit' here would turn that honest
      // silence into a claim about twelve doors (DR-0076 §8).
      rentable_level:       RENTABLE_LEVELS.has(item.rentableLevel) ? item.rentableLevel : null,
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
      unitLabel:      row.unit ?? '',
      building:       row.building_label ?? '',
      roomLabel:      row.room_label ?? '',
      rentableLevel:  RENTABLE_LEVELS.has(row.rentable_level) ? row.rentable_level : '',
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

// Structure fields (0160): they overlay from remote like the rest, EXCEPT that
// a blank remote value never erases a local one — the twelve doors that predate
// these columns hold their labels locally and must not be flattened by a row
// that simply has not been written yet. Same discipline as FILL_FIELDS.
const STRUCTURE_FIELDS = ['unitLabel', 'building', 'roomLabel', 'rentableLevel'];

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
//     device → drop it. EXCEPT when the remote list is empty while local
//     synced items exist: RLS returns 200 with 0 rows on a membership or
//     visibility hiccup (LESSONS-LEARNED 2026-06-11: "treat 0-rows-returned
//     as failure, not success"), and interpreting that as "every property
//     was deleted elsewhere" would destroy rooms, photo galleries, and
//     maintenance/conversation logs that exist nowhere else. An empty read
//     against a non-empty synced local list aborts the merge unchanged —
//     real single-property deletions still propagate (the read returns the
//     remaining rows, not zero rows).
//   - remote row with no local match → new from another device → adopt the
//     fromRow shape as-is.
export function mergeRemoteRentals(localItems = [], remoteItems = []) {
  if ((remoteItems || []).length === 0 && (localItems || []).some((l) => l.remoteUuid)) {
    return localItems;
  }
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
      for (const f of STRUCTURE_FIELDS) if (remote[f]) next[f] = remote[f];
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

// -----------------------------------------------------------------------------
// LEASE SYNC RIDES THE DOOR SYNC (Darrell 2026-07-27: "Start the lease sync
// build now" — per-door paid-vs-due step a). The monolith's call sites stay
// untouched (budget-frozen shell): upload() and initialSync() are decorated
// HERE so a door that reaches the cloud carries its complete lease sub-object
// with it (lease-sync.js: renter find-or-create + active-lease upsert,
// idempotent, honest skips). Fire-and-forget — lease sync can never break the
// door sync it rides on.
// -----------------------------------------------------------------------------
async function leaseIds() {
  try {
    const [tenantId, u] = await Promise.all([getInstanceId(), supabase.auth.getUser()]);
    return { tenantId, userId: u && u.data && u.data.user ? u.data.user.id : null };
  } catch { return { tenantId: null, userId: null }; }
}

const baseUpload = rentalsSync.upload.bind(rentalsSync);
rentalsSync.upload = async (item) => {
  const res = await baseUpload(item);
  try {
    const ids = await leaseIds();
    const withUuid = res && res.remoteId ? { ...item, remoteUuid: res.remoteId } : item;
    if (ids.tenantId && ids.userId) syncLeaseForRental(supabase, withUuid, ids);
  } catch { /* lease sync never blocks the door upload */ }
  return res;
};

const baseInitialSync = rentalsSync.initialSync.bind(rentalsSync);
rentalsSync.initialSync = async (localItems) => {
  const merged = await baseInitialSync(localItems);
  try {
    const ids = await leaseIds();
    if (ids.tenantId && ids.userId) syncAllLeases(supabase, merged, ids);
  } catch { /* boot lease sweep is best-effort; next boot retries */ }
  return merged;
};
