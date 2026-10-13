// =============================================================================
// tenants — add / list the people who live in a door (rentals build step b2)
// =============================================================================
// Darrell 2026-07-27: "we also need to be able to add tenants to the apts."
// The cloud schema already models this (schema-v2.2-rentals.sql) — no migration:
//
//   door → its ACTIVE lease → a PRIMARY renter (the household head, created by
//   lease-sync from the Lease & Tenant panel) → renter_household_members (the
//   co-tenants: spouse, roommate, adult child, …), each its own portal row.
//
// So "add a tenant to this apartment" = add a renter_household_members row under
// the door's household head. The head IS the lease signer and the renter the
// rent_payments ledger already hangs on — so tenants are INTEGRATED with the
// paid-vs-due history, not a parallel list (DR-0061 one river). RLS on both
// tables is user_in_instance → any instance member may read/add/update; only the
// owner may hard-delete, so "remove" here is a truthful moved-out (an update),
// never a silent destroy (DR-0076).
//
// HONEST LIMIT: a door with no synced lease has no household head yet — adding a
// co-tenant needs the primary set first (save Lease & Tenant while signed in).
// The surface says exactly that rather than inventing a headless household.
//
// PURE mappers + injectable I/O (same discipline as lease-sync / rent-payments):
// tests prove the mapping and the add/list/moved-out paths with a fake client.
// =============================================================================

// The relationships the schema's CHECK constraint allows, in UI order.
export const TENANT_RELATIONSHIPS = [
  ['roommate', 'Roommate'],
  ['spouse', 'Spouse'],
  ['partner', 'Partner'],
  ['child', 'Child'],
  ['parent', 'Parent'],
  ['sibling', 'Sibling'],
  ['dependent', 'Dependent'],
  ['guest-long-term', 'Long-term guest'],
  ['other', 'Other'],
];
const RELATIONSHIP_SET = new Set(TENANT_RELATIONSHIPS.map(([v]) => v));

/** A trimmed, cloud-safe household-member row from a form. Pure. */
export function toHouseholdMemberRow({ tenantId, userId, headRenterId, name, email, phone, relationship, isLeaseSigner, moveIn }) {
  const rel = RELATIONSHIP_SET.has(relationship) ? relationship : 'other';
  return {
    instance_id: tenantId,
    created_by: userId,
    household_id: headRenterId,
    display_name: String(name || '').trim(),
    relationship: rel,
    contact_email: String(email || '').trim() || null,
    contact_phone: String(phone || '').trim() || null,
    is_lease_signer: Boolean(isLeaseSigner),
    moved_in_at: moveIn || null,
    can_submit_requests: true,
  };
}

/**
 * Resolve the door's household: the head renter (the active lease's renter) and
 * its members. Returns { head: { id, name, email, phone } | null, members: [] }.
 * Never throws.
 */
export async function loadDoorHousehold(client, { tenantId, rentalUuid }) {
  const empty = { head: null, members: [] };
  if (!client || !tenantId || !rentalUuid) return empty;
  try {
    const leaseRes = await client.from('leases')
      .select('id, renter_id, status')
      .eq('instance_id', tenantId).eq('rental_id', rentalUuid).eq('status', 'active').limit(1);
    if (leaseRes.error || !leaseRes.data || !leaseRes.data.length) return empty;
    const headId = leaseRes.data[0].renter_id;
    if (!headId) return empty;

    const headRes = await client.from('renters')
      .select('id, display_name, contact_email, contact_phone')
      .eq('id', headId).limit(1);
    const headRow = (!headRes.error && headRes.data && headRes.data[0]) || null;
    const head = headRow ? {
      id: headRow.id,
      name: headRow.display_name || 'Primary tenant',
      email: headRow.contact_email || null,
      phone: headRow.contact_phone || null,
    } : { id: headId, name: 'Primary tenant', email: null, phone: null };

    const memRes = await client.from('renter_household_members')
      .select('id, display_name, relationship, contact_email, contact_phone, is_lease_signer, moved_in_at, moved_out_at')
      .eq('instance_id', tenantId).eq('household_id', headId)
      .order('created_at', { ascending: true });
    const members = (!memRes.error && Array.isArray(memRes.data)) ? memRes.data.map((m) => ({
      id: m.id,
      name: m.display_name || 'Household member',
      relationship: m.relationship || 'other',
      email: m.contact_email || null,
      phone: m.contact_phone || null,
      isLeaseSigner: Boolean(m.is_lease_signer),
      moveIn: m.moved_in_at || null,
      movedOut: m.moved_out_at || null,
    })) : [];
    return { head, members };
  } catch { return empty; }
}

/**
 * Add a co-tenant under the door's household head. Requires a name and a head
 * (the primary tenant / lease renter). Returns { ok, action:'insert'|'refused',
 * reason?, memberId? }. Never throws.
 */
export async function addHouseholdTenant(client, args) {
  try {
    const { tenantId, userId, headRenterId, name } = args || {};
    if (!client || !tenantId || !userId) return { ok: false, action: 'refused', reason: 'signed-out' };
    if (!headRenterId) return { ok: false, action: 'refused', reason: 'no-primary-tenant' };
    if (!String(name || '').trim()) return { ok: false, action: 'refused', reason: 'no-name' };
    const row = toHouseholdMemberRow(args);
    const ins = await client.from('renter_household_members').insert(row).select('id').single();
    if (ins.error) return { ok: false, action: 'refused', reason: 'insert-failed' };
    return { ok: true, action: 'insert', memberId: ins.data.id };
  } catch { return { ok: false, action: 'refused', reason: 'unexpected' }; }
}

/**
 * Truthful "remove" = record a move-out date (an UPDATE any member may make),
 * never a silent destroy (hard-delete is owner-only by RLS). Returns tagged.
 */
export async function markTenantMovedOut(client, { memberId, when, userId }) {
  try {
    if (!client || !memberId) return { ok: false, reason: 'no-id' };
    const date = when || new Date().toISOString().slice(0, 10);
    const upd = await client.from('renter_household_members')
      .update({ moved_out_at: date, updated_by: userId || null, updated_at: new Date().toISOString() })
      .eq('id', memberId);
    return upd.error ? { ok: false, reason: 'update-failed' } : { ok: true, movedOut: date };
  } catch { return { ok: false, reason: 'unexpected' }; }
}
