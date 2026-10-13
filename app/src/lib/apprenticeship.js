// =============================================================================
// apprenticeship — every seat a person holds, and every seat they have walked
// =============================================================================
// Darrell, 2026-10-09: "I want my kids to see how to manage these systems from
// all positions so they can learn how to navigate life and experience running
// our businesses... make sense? Before they need to..."
//
// A seat is a real position in a real space: tenant, household, 1099 worker or
// manager on Poe Properties (an invite the door claims from, 0150), landlord
// (owner of the properties space), church member, business member, family.
// Held = the rows say so (instance_members, property_access_invites). Walked =
// the person opened the views that seat lives in (usage_events, 0145). Not yet
// = the seats they do not hold, with the way to grant each (DR-0839). Pure:
// rows in, seats out; nothing is painted.
export const SEATS = Object.freeze([
  { key: 'tenant', label: 'Tenant', where: 'Poe Properties', how: 'People you know → Poe Properties → Tenant', does: ['report a work order and watch it move', 'read the lease, the notices and the history', 'report rent paid', 'message the landlord'], views: ['properties'] },
  { key: 'household', label: 'Household member', where: 'Poe Properties', how: 'People you know → Poe Properties → Household member', does: ['the same door as the lease signer', 'work orders, the thread and notices, never the rent write'], views: ['properties'] },
  { key: 'field_worker', label: '1099 worker', where: 'Poe Properties', how: 'People you know → Poe Properties → 1099 worker', does: ['see the jobs assigned to them', 'document fixed or not fixed, with a photo', 'read the door’s history'], views: ['properties'] },
  { key: 'manager', label: 'Property manager', where: 'Poe Properties', how: 'People you know → Poe Properties → Property manager', does: ['the work board and the dispatch', 'confirm rent received', 'review applications'], views: ['properties'] },
  { key: 'landlord', label: 'Landlord', where: 'Poe Properties (owner)', how: 'Admin → Role & stewardship → Poe Properties → Owner (the governor’s hand)', does: ['every door, every tenancy', 'share a door’s cameras', 'post rent to the books'], views: ['properties', 'realestate'] },
  { key: 'church', label: 'Church member', where: 'a church space', how: 'People you know → the church → Member', does: ['the roster and the ministries', 'the lessons and the Word', 'the choir and the bus'], views: ['church', 'learn', 'bible', 'choir'] },
  { key: 'business', label: 'Business member', where: 'a business space', how: 'People you know → the business → Member', does: ['the books and the inbound', 'projects and the 1099s', 'the real estate'], views: ['books', 'inbound', 'projects', 'realestate', 'bigpicture'] },
  { key: 'family', label: 'Family', where: 'Poe Family', how: 'People you know → Poe Family → Member', does: ['the big picture', 'the cameras and the house', 'the admin, as a viewer first'], views: ['bigpicture', 'cameras', 'admin', 'house'] },
]);

const low = (v) => String(v || '').trim().toLowerCase();

function seatForMembership(m) {
  const slug = low(m.slug); const type = low(m.instanceType); const role = low(m.role);
  if (slug === 'poe-properties' || /poe properties/.test(low(m.displayName))) return role === 'owner' ? 'landlord' : 'manager';
  if (slug === 'poe-family') return 'family';
  if (type === 'church') return 'church';
  if (type === 'business') return 'business';
  if (type === 'family') return 'family';
  return null;
}

/**
 * The seats the rows say this person holds.
 * memberships: [{ instanceId, slug, displayName, instanceType, role, userId }]
 * propertyInvites: property_access_invites rows (theirs by claimed_by or email)
 */
export function seatsHeld({ userId = null, email = null } = {}, { memberships = [], propertyInvites = [] } = {}) {
  const out = [];
  const e = low(email);
  for (const m of Array.isArray(memberships) ? memberships : []) {
    if (!m || (userId && m.userId && m.userId !== userId)) continue;
    const key = seatForMembership(m);
    if (!key) continue;
    out.push({ key, where: m.displayName || m.slug || m.instanceType || 'a space', role: m.role || null, since: m.joinedAt || null, claimed: true });
  }
  for (const i of Array.isArray(propertyInvites) ? propertyInvites : []) {
    if (!i || i.revoked) continue;
    const mine = (userId && i.claimed_by === userId) || (e && low(i.email) === e);
    if (!mine) continue;
    const key = ['tenant', 'household', 'field_worker', 'manager'].includes(low(i.role_label)) ? low(i.role_label) : null;
    if (!key) continue;
    out.push({ key, where: i.property_label || (i.scope_ref === '*' ? 'every door' : (i.scope_ref || 'a door')), role: key, since: i.claimed_at || i.created_at || null, claimed: !!i.claimed_at });
  }
  // one entry per seat and place
  const seen = new Set();
  return out.filter((s) => { const k = `${s.key}|${low(s.where)}`; if (seen.has(k)) return false; seen.add(k); return true; });
}

/** For each held seat, how far it has been walked: opens of the views it lives in, and when last. */
export function seatsWalked(held = [], usageRows = []) {
  const rows = (Array.isArray(usageRows) ? usageRows : []).map((r) => ({ name: low(r && r.name), views: Number((r && r.views) || 0), lastAt: (r && r.last_at) || null }));
  return (Array.isArray(held) ? held : []).map((s) => {
    const seat = SEATS.find((x) => x.key === s.key);
    const hits = rows.filter((r) => seat && seat.views.some((v) => r.name === v || r.name.startsWith(`${v}:`) || r.name.startsWith(`${v}-`)));
    const opens = hits.reduce((n, r) => n + r.views, 0);
    const lastAt = hits.reduce((b, r) => ((r.lastAt && (!b || r.lastAt > b)) ? r.lastAt : b), null);
    return { ...s, opens, lastAt, walked: opens > 0 };
  });
}

/** The seats not yet held, each with the way to grant it. */
export function seatsToWalk(held = []) {
  const have = new Set((Array.isArray(held) ? held : []).map((s) => s.key));
  return SEATS.filter((s) => !have.has(s.key)).map((s) => ({ key: s.key, label: s.label, where: s.where, how: s.how, does: s.does }));
}

/** One honest line. usageRows null means the server would not say (not a steward of their spaces). */
export function apprenticeshipLine(held = [], walked = [], usageRows = undefined) {
  const n = held.length;
  if (n === 0) return 'Holds no seat yet; every seat below is one placement away.';
  const w = walked.filter((s) => s.walked).length;
  const usage = usageRows === null ? 'what they have walked is theirs alone until they are in a space you steward' : `${w} of ${n} walked in the last 30 days`;
  return `Holds ${n} seat${n === 1 ? '' : 's'} · ${usage} · ${SEATS.length - new Set(held.map((s) => s.key)).size} not yet.`;
}
