// =============================================================================
// properties/access-matrix — who sees what, by role, and how the family
// widens or narrows it (DR-1198)
// =============================================================================
// Darrell, 2026-10-21: "We need to be able to give 1099 workers more access
// and or different access than a short term renters or even a tenant... All
// access to the different options per user needs to be evaluated for correct
// access and flexibility that gives us options to do what we want."
//
// This is the evaluated matrix: for every face at a door and every thing a
// door holds, what that face READS, what it WRITES, by what MECHANISM, and
// the family's HAND on it — the lever that widens or narrows that cell. Each
// cell names the wall that enforces it (a migration, the NAS forwarder, or
// the module), so a change to a wall is a change here (the same discipline
// as model.js's mirror of 0150 and preview.js's mirror of 0309).
//
// It is rendered on the People tab (AccessMatrix.jsx) so the landlord reads
// the rules where they invite people, and pinned in access-matrix.test.js
// against the policy text it describes.
// =============================================================================

export const ROLES = Object.freeze([
  { id: 'family', label: 'Family (owner, admin, member)', signsIn: true },
  { id: 'manager', label: 'Manager', signsIn: true },
  { id: 'worker', label: '1099 worker', signsIn: true },
  { id: 'tenant', label: 'Tenant', signsIn: true },
  { id: 'household', label: 'Household member', signsIn: true },
  { id: 'guest', label: 'Short-stay guest (no account)', signsIn: false },
  { id: 'visitor', label: 'Visitor / applicant (no account)', signsIn: false },
]);

const cell = (reads, writes, by, hand = '', wall = '') => ({ reads, writes, by, hand, wall });

/**
 * Every row is a thing a door holds. Every column is a face. The words are
 * the family's plain English; `wall` is where the rule lives.
 */
export const ACCESS_MATRIX = Object.freeze([
  {
    id: 'door', label: 'The door itself (address, rent, listing)',
    cells: {
      family: cell('every door', 'everything', 'instance membership', '', '0150 rentals_select'),
      manager: cell('the doors they are delegated on', 'listings and edits on those doors', 'a delegation on the door', 'People → invite as manager; capabilities per door', '0185 rentals_delegate_read'),
      worker: cell('the doors they are sent to', 'nothing on the door record', 'a delegation on the door (docs.add / property.history)', 'People → invite as 1099 worker, per door', '0185 rentals_delegate_read'),
      tenant: cell('their own tenancy, not the rentals row', 'nothing on the door record', 'the tenancy that names them', 'People → invite as tenant', '0150 rental_tenancies_read'),
      household: cell('as the tenant', 'nothing', 'membership on that tenancy', 'People → invite as household', '0150 tenancy_household'),
      guest: cell('the public card of an advertised door', 'a stay request, a guest report', 'a link; no account', 'Advertise; the stay desk', '0152 public_vacancies, 0261'),
      visitor: cell('the public card of an advertised door', 'an application', 'no account', 'Advertise; the street held or shown', '0152, 0158'),
    },
  },
  {
    id: 'pictures-listing', label: 'The door’s listing pictures and its rooms',
    cells: {
      family: cell('every picture', 'file, caption, arrange, archive', 'instance membership', '', '0153 property_photos_read'),
      manager: cell('every picture filed to the door', 'file new ones', 'a delegation on the door', 'per door', '0185 property_photos_delegate_read'),
      worker: cell('every picture filed to the door', 'file new ones (before/after)', 'a delegation on the door', 'per door; never arranging the landlord’s record', '0185 property_photos_delegate_read'),
      tenant: cell('the listing pictures and the rooms, while the switch is on', 'nothing', 'their tenancy on that door', 'Edit door → Who sees the listing pictures (ON by default)', '0309 property_photos_door_people_read'),
      household: cell('as the tenant', 'nothing', 'membership on that tenancy', 'the same switch', '0309'),
      guest: cell('the listing pictures on the public card', 'nothing', 'no account', 'mark shots “Listing”', '0291 public_vacancy_photos'),
      visitor: cell('the listing pictures on the public card', 'nothing', 'no account', 'mark shots “Listing”', '0291 public_vacancy_photos'),
    },
  },
  {
    id: 'pictures-condition', label: 'Condition pictures (move-in, move-out, turn, damage)',
    cells: {
      family: cell('all', 'all', 'instance membership', '', '0153'),
      manager: cell('the door’s', 'file', 'a delegation on the door', 'per door', '0185'),
      worker: cell('the door’s', 'file (a job’s before and after)', 'a delegation on the door', 'per door', '0185'),
      tenant: cell('only their own tenancy’s', 'file their own evidence', 'their tenancy', 'never widened: a previous tenant’s turn is not theirs', '0153 (the tenancy_id guard), 0309 keeps it'),
      household: cell('only their tenancy’s', 'file evidence', 'membership', 'never widened', '0153'),
      guest: cell('none', 'a guest report with a picture', 'a link', '', '0261'),
      visitor: cell('none', 'none', '', '', ''),
    },
  },
  {
    id: 'cameras', label: 'Cameras at the door',
    cells: {
      family: cell('every camera', 'gives, takes back, offers the menu', 'the family key on the device', '', 'cams_forwarder /grants (owner only); 0266'),
      manager: cell('what they are given by name', 'nothing', 'a grant of their own, by link', 'Cameras → Give access to anyone, as Manager', '0266 given; cams_forwarder grant'),
      worker: cell('what they are given by name — any cameras, as many as the family picks (the basement included), not limited to what the door offers tenants', 'nothing', 'a grant of their own, by name: on their Poe Properties Cameras tab when signed in, else by link; for its days; giving again replaces it', 'Cameras → Give access to anyone, as 1099 worker: pick them (signed in) or type their name, tick any cameras', '0266 door_camera_access (given, person_user_id = their account; read by person_user_id = auth.uid()); cams_forwarder grant_normalize (any valid ids); DR-1210'),
      tenant: cell('what is shared with the door; may ask for what the door offers', 'an ask', 'the door’s grant, once signed in', 'Cameras → Share with this door; the ask menu', '0266 door grant; door_camera_menu'),
      household: cell('as the tenant', 'an ask', 'the door’s grant', 'the same', '0266'),
      guest: cell('what they are given by name', 'nothing', 'a grant of their own, by link; ends on its day', 'Give access to anyone, as Short-stay guest', '0266 given'),
      visitor: cell('none', 'none', '', '', ''),
    },
  },
  {
    id: 'work', label: 'Work orders and their documentation',
    cells: {
      family: cell('all', 'file, assign, move, close', 'instance membership', '', '0150, 0260'),
      manager: cell('the door’s', 'manage and dispatch', 'request.manage', 'capabilities on the invite', '0075 delegated'),
      worker: cell('the jobs opened to them', 'document: fixed, or not and why', 'enabled on the job', 'Dispatch → assign', '0150 user_is_enabled_worker, 0264 proof'),
      tenant: cell('their tenancy’s, from the day it became theirs', 'file and watch', 'their tenancy', '', '0150; 0306 window'),
      household: cell('as the tenant', 'file and watch', 'membership', '', '0150; 0306'),
      guest: cell('none', 'a guest report', 'a link', 'the stay desk', '0261'),
      visitor: cell('none', 'none', '', '', ''),
    },
  },
  {
    id: 'thread', label: 'Messages',
    cells: {
      family: cell('all', 'write', 'instance membership', '', '0150'),
      manager: cell('the door’s, with the capability', 'write', 'message.tenant', 'capabilities on the invite', '0075'),
      worker: cell('the job threads the landlord opened to them', 'write on those', 'enabled on the job', 'Dispatch', '0150'),
      tenant: cell('their thread, from the day it became theirs', 'write', 'their tenancy', '', '0150; 0306'),
      household: cell('as the tenant', 'write', 'membership', '', '0150'),
      guest: cell('none', 'none', '', '', ''),
      visitor: cell('none', 'none', '', '', ''),
    },
  },
  {
    id: 'rent', label: 'Rent and payments',
    cells: {
      family: cell('all', 'record, confirm, post to the books', 'instance membership', '', '0150, 0262, 0265'),
      manager: cell('with the capability', 'confirm with rent.confirm', 'rentroll.view / rent.confirm', 'capabilities on the invite', '0075'),
      worker: cell('none', 'none', '', 'never: payments are not a worker’s', '0150'),
      tenant: cell('their own, from the day it became theirs', 'report a payment', 'their tenancy', '', '0150; 0306'),
      household: cell('their tenancy’s', 'nothing (read only)', 'membership', '', '0150'),
      guest: cell('their stay’s price', 'pay for asked-for nights', 'a link', '', '0277'),
      visitor: cell('the asking rent on the card', 'none', '', '', '0152'),
    },
  },
  {
    id: 'papers', label: 'Papers, the lease, notices',
    cells: {
      family: cell('all', 'file, send for signature', 'instance membership', '', '0154, 0263'),
      manager: cell('the door’s', 'file', 'docs.add', 'capabilities', '0185'),
      worker: cell('what is filed to the door', 'file a paper to the door', 'docs.add', 'per door', '0185'),
      tenant: cell('their tenancy’s papers and notices, from the day it became theirs', 'sign; file a paper of their own', 'their tenancy', '', '0154, 0263; 0306'),
      household: cell('as the tenant', 'sign if named', 'membership', '', '0263'),
      guest: cell('none', 'none', '', '', ''),
      visitor: cell('none', 'none', '', '', ''),
    },
  },
  {
    id: 'notes', label: 'The landlord’s private notes on the door',
    cells: {
      family: cell('all', 'write', 'instance membership', '', '0150 property notes'),
      manager: cell('the door’s', 'write', 'a delegation on the door', '', 'model.js doorNotes'),
      worker: cell('none', 'none', '', 'never', 'model.js unseenByThisFace'),
      tenant: cell('none', 'none', '', 'never', 'model.js unseenByThisFace'),
      household: cell('none', 'none', '', 'never', ''),
      guest: cell('none', 'none', '', '', ''),
      visitor: cell('none', 'none', '', '', ''),
    },
  },
]);

/** The cells of one face, in matrix order, for a per-role view. */
export function accessFor(roleId) {
  return ACCESS_MATRIX.map((row) => ({ id: row.id, label: row.label, ...(row.cells[roleId] || cell('', '', '')) }));
}

/** The faces that read a thing at all (words other than "none"). */
export function whoReads(rowId) {
  const row = ACCESS_MATRIX.find((r) => r.id === rowId);
  if (!row) return [];
  return ROLES.filter((r) => row.cells[r.id] && row.cells[r.id].reads && row.cells[r.id].reads !== 'none').map((r) => r.id);
}

/** Where a face is given MORE than the door's household gets: the levers the family holds. */
export function widerThanTenant(roleId) {
  return ACCESS_MATRIX.filter((row) => {
    const mine = row.cells[roleId]; const theirs = row.cells.tenant;
    return mine && theirs && mine.reads !== 'none' && mine.reads !== theirs.reads && mine.hand;
  }).map((row) => ({ id: row.id, label: row.label, hand: row.cells[roleId].hand }));
}
