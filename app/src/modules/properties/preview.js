// =============================================================================
// properties/preview — "Seen as" is one door, through that person's wall
// =============================================================================
// Darrell, 2026-10-21, on the Properties tab: "when we go through to look at
// it as a tenant, as a person that lives in the home, or as a 1099 worker, the
// photos don't align with that person's perspective... If the 1099 worker
// needs to be able to see the pictures in that specific apartment, the drop
// down needs to work effectively within that specific apartment."
//
// `viewAs` (PropertiesApp) used to change only the FACE: the tabs were the
// tenant's, the data stayed the owner's — every door, every picture of every
// door, the rest of the apartment. A real tenant reads one tenancy and no
// rentals row; a real worker reads the doors they are delegated on. So the
// preview is now a view of ONE chosen door, cut to what that role would read
// there, by the same rules the database applies (DR-1199):
//
//   tenant / household   their tenancy on that door (0150), the door's listing
//                        pictures while the landlord's switch is on (0309), the
//                        pictures filed to their own tenancy (0153); no rentals
//                        row, no other door, no condition picture from before
//                        their time, none of the landlord's private notes.
//   field_worker /       the door they are delegated on (0185 rentals read),
//   manager              every picture filed to that door (0185), the door's
//                        tenancies for a manager; nothing of any other door.
//
// This mirrors the read policies deliberately, the way model.js mirrors 0150
// (capabilitiesFor, unseenByThisFace): stated here so the duplication is a
// decision, pinned by the-preview-is-one-door tests against the same scenario
// the 0309 smoke proves in SQL. If a policy moves, this moves with it.
// =============================================================================
import { doorPickerOptions } from './showcase.js';

const TENANT_LIKE = new Set(['tenant', 'household']);
const DELEGATE_LIKE = new Set(['field_worker', 'manager']);

/** The tenancy a person on this door would hold: active first, then pending, then the newest. */
export function tenancyOnDoor(doors = [], rental = null) {
  if (!rental) return null;
  const rank = { active: 0, pending: 1 };
  const mine = (Array.isArray(doors) ? doors : [])
    .filter((d) => d && d.rental_ref && (d.rental_ref === rental.slug || d.rental_ref === rental.id))
    .sort((a, b) => ((rank[a.status] ?? 2) - (rank[b.status] ?? 2))
      || String(b.created_at || '').localeCompare(String(a.created_at || '')));
  return mine[0] || null;
}

/**
 * The door a preview stands on: the one chosen, else (for a tenant-like face)
 * the first door somebody lives on, else the first door in the board's order.
 */
export function pickPreviewDoor(role, chosenId = '', rentals = [], doors = []) {
  const list = (Array.isArray(rentals) ? rentals : []).filter(Boolean);
  if (!list.length) return null;
  const chosen = chosenId ? list.find((r) => r.id === chosenId) : null;
  if (chosen) return chosen;
  if (TENANT_LIKE.has(role)) {
    const lived = list.find((r) => tenancyOnDoor(doors, r));
    if (lived) return lived;
  }
  const first = doorPickerOptions(list)[0];
  return (first && list.find((r) => r.id === first.id)) || list[0];
}

/** Would this role, on this door, read this picture? The 0153 / 0185 / 0309 rules, in order. */
export function previewSeesPhoto(role, scope = {}, photo = null) {
  if (!photo) return false;
  const { rental = null, tenancy = null } = scope;
  const onDoor = Boolean(rental && photo.rental_ref === rental.id);
  const own = Boolean(tenancy && photo.tenancy_id === tenancy.id);
  if (TENANT_LIKE.has(role)) {
    if (own) return true;                                             // 0153: their own tenancy's pictures
    return onDoor && !photo.tenancy_id && photo.kind === 'listing'    // 0309: the door's listing shots...
      && !photo.archived_at && rental.pictures_shared_with_door !== false; // ...while the switch is on
  }
  if (DELEGATE_LIKE.has(role)) return onDoor;                         // 0185: every picture filed to the delegated door
  return true;
}

/**
 * What the owner's full read becomes for this face on this door.
 * Returns the cut lists plus the door and tenancy the preview stands on and
 * the id the picker should be set to.
 */
export function previewScope(role, rental = null, { doors = [], rentals = [], household = [], photos = [], photoOrders = {} } = {}) {
  const tenancy = tenancyOnDoor(doors, rental);
  const scope = { role, rental, tenancy };
  const seen = (Array.isArray(photos) ? photos : []).filter((p) => previewSeesPhoto(role, scope, p));
  if (TENANT_LIKE.has(role)) {
    return {
      ...scope,
      doors: tenancy ? [tenancy] : [],
      rentals: [],                                                    // a tenant reads no rentals row
      household: role === 'household' && tenancy ? [{ tenancy_id: tenancy.id, preview: true }] : [],
      photos: seen,
      photoOrders: {},
      activeId: tenancy ? tenancy.id : (rental ? rental.id : ''),
    };
  }
  const orders = rental && photoOrders && photoOrders[rental.id] ? { [rental.id]: photoOrders[rental.id] } : {};
  return {
    ...scope,
    doors: role === 'manager' && rental
      ? (Array.isArray(doors) ? doors : []).filter((d) => d && (d.rental_ref === rental.slug || d.rental_ref === rental.id))
      : [],
    rentals: rental ? [rental] : [],
    household: [],
    photos: seen,
    photoOrders: orders,
    activeId: rental ? rental.id : '',
  };
}

/** The per-door read (rooms, pictures, the rest of the apartment, tenancies, papers, notes), cut the same way. */
export function previewDoorData(role, scope = {}, data = {}) {
  const { tenancy = null } = scope;
  const tenantish = TENANT_LIKE.has(role);
  const photos = (Array.isArray(data.photos) ? data.photos : []).filter((p) => previewSeesPhoto(role, scope, p));
  return {
    ...data,
    photos,
    // The rest of the apartment belongs to OTHER doors; nobody but the family
    // reads another door's pictures (0185 is per door, 0309 is per door).
    sharedPhotos: [],
    sharedDoors: [],
    sharedOrder: {},
    tenancies: tenantish
      ? (tenancy ? (data.tenancies || []).filter((t) => t && t.id === tenancy.id) : [])
      : (data.tenancies || []),
    documents: tenantish
      ? (data.documents || []).filter((d) => d && tenancy && d.tenancy_id === tenancy.id)
      : (data.documents || []),
    // The landlord's private notes are never a tenant's or a worker's (model.js unseenByThisFace).
    propertyNotes: role === 'manager' ? (data.propertyNotes || []) : [],
  };
}
