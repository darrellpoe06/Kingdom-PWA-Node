// =============================================================================
// church-devices-sync — gated fetch + CRUD for the church device register
// =============================================================================
// The asset register (church_devices, 0056) is church infrastructure — staff
// only, scoped to the church instance by RLS. This module is the single door the
// DeviceInventory surface uses to read/write it, modeled on video-wall-sync.js
// (the same getXAccess + church-instance pattern) and the generic table-sync
// controller (the same path accounts/inventory ride).
//
// ACCESS: read = owner/admin/member (any church staff); write = owner/admin
// (governors add/retire devices; members see the register). getDeviceAccess()
// resolves signedIn / canSee / canEdit + the tenant. RLS enforces it regardless
// of the client; canSee just hides the empty register from non-staff, and canEdit
// gates the sensitive fields (serial, ip_address) in the UI.
//
// The pure derivations (taxonomy, capability index, the seed register) live in
// church-devices.js so they are proven by the gate without a DB.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { createTableSync, unionPreservingLocal } from './table-sync.js';
import { makeDevice } from './church-devices.js';

// --- Pure mappers (local <-> DB row; exported for tests) ---------------------
export function deviceToRow(device, { tenantId, userId }) {
  return {
    instance_id:          tenantId,
    created_by:           userId,
    slug:                 device.id,
    name:                 device.name ?? 'Untitled device',
    device_type:          device.deviceType ?? 'other',
    location:             device.location ?? null,
    status:               device.status ?? 'planned',
    steward:              device.steward ?? null,
    make_model:           device.makeModel ?? null,
    serial:               device.serial ?? null,
    ip_address:           device.ipAddress ?? null,
    specs:                device.specs && typeof device.specs === 'object' ? device.specs : {},
    capabilities:         Array.isArray(device.capabilities) ? device.capabilities : [],
    capital_project_slug: device.capitalProjectSlug ?? null,
    sme_needed:           device.smeNeeded === true,
    confirmed:            device.confirmed === true,
    notes:                device.notes ?? null,
    active:               device.active !== false,
    author_persona:       device.authorPersona ?? null,
    sort_order:           Number.isFinite(device.sortOrder) ? device.sortOrder : 0,
  };
}

export function deviceFromRow(row) {
  return makeDevice({
    id:                 row.slug ?? `dev-remote-${row.id}`,
    name:               row.name,
    deviceType:         row.device_type,
    location:           row.location,
    status:             row.status,
    steward:            row.steward,
    makeModel:          row.make_model,
    serial:             row.serial,
    ipAddress:          row.ip_address,
    specs:              row.specs,
    capabilities:       row.capabilities,
    capitalProjectSlug: row.capital_project_slug,
    smeNeeded:          row.sme_needed,
    confirmed:          row.confirmed,
    notes:              row.notes,
    active:             row.active,
    authorPersona:      row.author_persona,
    sortOrder:          row.sort_order,
  });
}

// Local field -> column, for the surface's update patch builder. instance_id /
// created_by / slug are identity and never patched.
export const DEVICE_COLUMN_OF = {
  name:               'name',
  deviceType:         'device_type',
  location:           'location',
  status:             'status',
  steward:            'steward',
  makeModel:          'make_model',
  serial:             'serial',
  ipAddress:          'ip_address',
  specs:              'specs',
  capabilities:       'capabilities',
  capitalProjectSlug: 'capital_project_slug',
  smeNeeded:          'sme_needed',
  confirmed:          'confirmed',
  notes:              'notes',
  active:             'active',
  sortOrder:          'sort_order',
};

export function mergeRemoteDevices(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}

// The generic cross-device sync controller (upload/updateRow/subscribe/…).
export const churchDevicesSync = createTableSync({
  localKey: 'churchDevices',
  remoteTable: 'church_devices',
  toRow: deviceToRow,
  fromRow: deviceFromRow,
  idOf: (item) => item.id,
});

// --- Access (mirror getVideoWallAccess) --------------------------------------
async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

// Read for any staff (owner/admin/member); edit for governors (owner/admin).
export function deriveAccess(role) {
  const canSee  = role === 'owner' || role === 'admin' || role === 'member';
  const canEdit = role === 'owner' || role === 'admin';
  return { canSee, canEdit };
}

export async function getDeviceAccess(displayName) {
  const session = await currentSession();
  if (!session) return { signedIn: false, canSee: false, canEdit: false, tenantId: null, role: null };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { signedIn: true, canSee: false, canEdit: false, tenantId: null, role: null };
  const { data: role } = await supabase.rpc('user_role_in_instance', { tenant_uuid: tenantId });
  const { canSee, canEdit } = deriveAccess(role);
  return { signedIn: true, canSee, canEdit, tenantId, role: role ?? null };
}

// Realtime register subscription. onChange(devices) fires with the mapped list
// each time it changes. Returns an unsubscribe fn. (Delegates to the controller.)
export function subscribeDevices(onChange) {
  return churchDevicesSync.subscribe(onChange);
}

// --- Writes (RLS-enforced; fail soft) ----------------------------------------
export async function saveDevice(device) {
  if (device && device.remoteUuid) {
    const patch = {};
    for (const [local, col] of Object.entries(DEVICE_COLUMN_OF)) {
      if (device[local] !== undefined) patch[col] = device[local];
    }
    return churchDevicesSync.updateRow(device.remoteUuid, patch);
  }
  return churchDevicesSync.upload(device);
}
