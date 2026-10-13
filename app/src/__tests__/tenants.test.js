// @vitest-environment node
// =============================================================================
// tenants — add / list the people in a door, proven (rentals build step b2)
// =============================================================================
// The household model under test: a door's active lease has a PRIMARY renter
// (the head); co-tenants are renter_household_members under that head, and are
// therefore integrated with the same lease the rent_payments ledger uses. Add
// is refused with a NAMED reason when there's no head or no name (DR-0076);
// "remove" is a truthful moved-out update, never a silent destroy. Fake client.
import { describe, it, expect } from 'vitest';
import {
  TENANT_RELATIONSHIPS, toHouseholdMemberRow, loadDoorHousehold,
  addHouseholdTenant, markTenantMovedOut,
} from '../lib/tenants.js';

// Fake client: each table resolves its query to scripted rows; records inserts.
function fakeClient(tables, sink) {
  return {
    from(table) {
      const rows = tables[table];
      const chain = {
        _payload: null,
        select() { return chain; },
        eq() { return chain; },
        order() { return Promise.resolve({ data: typeof rows === 'function' ? rows() : (rows || []), error: null }); },
        limit() { return Promise.resolve({ data: typeof rows === 'function' ? rows() : (rows || []), error: null }); },
        insert(payload) { chain._payload = payload; if (sink) sink.push({ table, op: 'insert', payload }); return chain; },
        update(payload) { chain._payload = payload; if (sink) sink.push({ table, op: 'update', payload }); return chain; },
        single() { return Promise.resolve({ data: { id: 'new-member' }, error: null }); },
        then(resolve) { resolve({ data: null, error: null }); },
      };
      return chain;
    },
  };
}

describe('toHouseholdMemberRow — pure, cloud-safe mapping', () => {
  it('trims, coerces an unknown relationship to "other", and keeps the head link', () => {
    const row = toHouseholdMemberRow({
      tenantId: 'inst-1', userId: 'u1', headRenterId: 'head-1',
      name: '  Jordan  ', email: ' j@x.com ', phone: ' 217-555-0100 ',
      relationship: 'cousin', isLeaseSigner: true, moveIn: '2026-06-01',
    });
    expect(row).toMatchObject({
      instance_id: 'inst-1', household_id: 'head-1', display_name: 'Jordan',
      contact_email: 'j@x.com', contact_phone: '217-555-0100',
      relationship: 'other', is_lease_signer: true, moved_in_at: '2026-06-01',
      can_submit_requests: true,
    });
  });
  it('keeps a valid relationship and nulls empty contact fields', () => {
    const row = toHouseholdMemberRow({ tenantId: 'i', userId: 'u', headRenterId: 'h', name: 'Sam', relationship: 'spouse' });
    expect(row.relationship).toBe('spouse');
    expect(row.contact_email).toBeNull();
    expect(row.contact_phone).toBeNull();
    expect(row.is_lease_signer).toBe(false);
  });
  it('every offered relationship is one the schema CHECK allows', () => {
    const allowed = new Set(['spouse', 'partner', 'child', 'parent', 'sibling', 'roommate', 'dependent', 'guest-long-term', 'other']);
    for (const [v] of TENANT_RELATIONSHIPS) expect(allowed.has(v)).toBe(true);
  });
});

describe('loadDoorHousehold — the head + members, integrated with the lease', () => {
  it('returns the lease renter as head and its household members', async () => {
    const client = fakeClient({
      leases: [{ id: 'L1', renter_id: 'head-1', status: 'active' }],
      renters: [{ id: 'head-1', display_name: 'Alex Primary', contact_email: 'a@x.com', contact_phone: '555' }],
      renter_household_members: [
        { id: 'm1', display_name: 'Jordan', relationship: 'roommate', contact_email: null, contact_phone: null, is_lease_signer: false, moved_in_at: '2026-06-01', moved_out_at: null },
      ],
    });
    const { head, members } = await loadDoorHousehold(client, { tenantId: 'inst-1', rentalUuid: 'door-a' });
    expect(head).toMatchObject({ id: 'head-1', name: 'Alex Primary', email: 'a@x.com' });
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ id: 'm1', name: 'Jordan', relationship: 'roommate', moveIn: '2026-06-01' });
  });
  it('a door with no active lease has no head (honest empty, not a crash)', async () => {
    const client = fakeClient({ leases: [] });
    expect(await loadDoorHousehold(client, { tenantId: 'i', rentalUuid: 'd' })).toEqual({ head: null, members: [] });
  });
});

describe('addHouseholdTenant — named refusals, real insert', () => {
  it('CATCHES no primary tenant (no head) and no name', async () => {
    const c = fakeClient({});
    expect((await addHouseholdTenant(c, { tenantId: 'i', userId: 'u', headRenterId: null, name: 'X' })).reason).toBe('no-primary-tenant');
    expect((await addHouseholdTenant(c, { tenantId: 'i', userId: 'u', headRenterId: 'h', name: '  ' })).reason).toBe('no-name');
    expect((await addHouseholdTenant(c, { tenantId: 'i', userId: null, headRenterId: 'h', name: 'X' })).reason).toBe('signed-out');
  });
  it('inserts a household-member row and returns its id', async () => {
    const sink = [];
    const c = fakeClient({}, sink);
    const r = await addHouseholdTenant(c, { tenantId: 'inst-1', userId: 'u1', headRenterId: 'head-1', name: 'Jordan', relationship: 'roommate' });
    expect(r).toMatchObject({ ok: true, action: 'insert', memberId: 'new-member' });
    expect(sink[0]).toMatchObject({ table: 'renter_household_members', op: 'insert' });
    expect(sink[0].payload).toMatchObject({ household_id: 'head-1', display_name: 'Jordan', relationship: 'roommate' });
  });
});

describe('markTenantMovedOut — a truthful update, not a destroy', () => {
  it('writes a moved_out_at date via update', async () => {
    const sink = [];
    const c = fakeClient({}, sink);
    const r = await markTenantMovedOut(c, { memberId: 'm1', when: '2026-07-31', userId: 'u1' });
    expect(r).toMatchObject({ ok: true, movedOut: '2026-07-31' });
    expect(sink[0]).toMatchObject({ table: 'renter_household_members', op: 'update' });
    expect(sink[0].payload.moved_out_at).toBe('2026-07-31');
  });
  it('CATCHES a missing id', async () => {
    expect((await markTenantMovedOut(fakeClient({}), { memberId: null })).reason).toBe('no-id');
  });
});
