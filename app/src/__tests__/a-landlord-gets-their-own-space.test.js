// =============================================================================
// A landlord gets their own space, by their own hand (DR-1007) — the pure parts
// =============================================================================
// The intent that survives the sign-in reload, the two paths and where each
// lands, the seat as the proof, and the cloud helpers' contracts: a read that
// failed is never "no seat"; the claim passes the path through; a new door is
// filed on the space with the signed-in person as its author and a slug the
// address decides, numbered when taken.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  WHO_PARAM, readWhoIntent, withWhoIntent, withoutWhoIntent,
  LANDLORD_PATHS, landlordPath, landingFor, holdsSeat, seatIsOwner,
} from '../modules/properties/own-space.js';
import { loadMyLandlordSeat, claimLandlordSpace, addRental, doorSlug } from '../modules/properties/cloud.js';

describe('the intent in the address', () => {
  it('reads landlord and nothing else', () => {
    expect(WHO_PARAM).toBe('who');
    expect(readWhoIntent('?properties=1&who=landlord')).toBe('landlord');
    expect(readWhoIntent('?who=tenant')).toBeNull();
    expect(readWhoIntent('')).toBeNull();
    expect(readWhoIntent(undefined)).toBeNull();
  });
  it('is written beside every other key and taken out cleanly', () => {
    expect(withWhoIntent('?properties=1')).toBe('?properties=1&who=landlord');
    expect(withWhoIntent('')).toBe('?who=landlord');
    expect(withoutWhoIntent('?properties=1&who=landlord')).toBe('?properties=1');
    expect(withoutWhoIntent('?who=landlord')).toBe('');
  });
});

describe('the two paths', () => {
  it('are exactly properties and poetech, each landing on its own door', () => {
    expect(LANDLORD_PATHS.map((p) => p.id)).toEqual(['properties', 'poetech']);
    expect(landingFor('properties')).toBe('/properties/app/?properties=1');
    expect(landingFor('poetech')).toBe('/?view=properties');
    expect(landingFor('everything')).toBeNull();
    expect(landlordPath('poetech').title).toBe('The full PoeTech app');
    for (const p of LANDLORD_PATHS) expect(p.blurb.length).toBeGreaterThan(20);
  });
});

describe('the seat is the proof', () => {
  it('any seat means the app; owner or admin means the owner\'s face', () => {
    expect(holdsSeat(null)).toBe(false);
    expect(holdsSeat({})).toBe(false);
    expect(holdsSeat({ instance_id: 'x', role: 'member' })).toBe(true);
    expect(seatIsOwner({ instance_id: 'x', role: 'member' })).toBe(false);
    expect(seatIsOwner({ instance_id: 'x', role: 'admin' })).toBe(true);
    expect(seatIsOwner({ instance_id: 'x', role: 'owner' })).toBe(true);
  });
});

function client({ rpc = async () => ({ data: null, error: null }), insert = null } = {}) {
  const calls = [];
  return {
    calls,
    auth: { getUser: async () => ({ data: { user: { id: 'u-1' } } }), getSession: async () => ({ data: { session: { user: { id: 'u-1' } } } }) },
    rpc: async (name, args) => { calls.push([name, args]); return rpc(name, args); },
    from: (table) => ({
      insert: (row) => ({
        select: () => ({ single: async () => { calls.push([`insert:${table}`, row]); return insert ? insert(row) : { data: { id: 'r-new', ...row }, error: null }; } }),
      }),
    }),
  };
}

describe('the cloud helpers', () => {
  it('a seat read that returns nothing is no seat; one that FAILS is a failure, never no seat (PROVEN-TO-CATCH)', async () => {
    const none = await loadMyLandlordSeat(client({ rpc: async () => ({ data: null, error: null }) }));
    expect(none).toMatchObject({ ok: true, seat: null });
    const held = await loadMyLandlordSeat(client({ rpc: async () => ({ data: { instance_id: 'i-1', role: 'owner' }, error: null }) }));
    expect(held.seat).toMatchObject({ instance_id: 'i-1', role: 'owner' });
    const failed = await loadMyLandlordSeat(client({ rpc: async () => ({ data: null, error: { message: 'boom' } }) }));
    expect(failed.ok).toBe(false);
    expect(failed.reason).toBe('read-failed');
    expect(failed.seat).toBeUndefined();
  });

  it('the claim passes the path and the name through, and reports the receipt', async () => {
    const c = client({ rpc: async (name) => ({ data: name === 'claim_landlord_space' ? { status: 'created', path: 'poetech' } : null, error: null }) });
    const r = await claimLandlordSpace({ path: 'poetech', name: 'Alice' }, c);
    expect(r.ok).toBe(true);
    expect(r.receipt).toMatchObject({ status: 'created', path: 'poetech' });
    expect(c.calls[0]).toEqual(['claim_landlord_space', { display_name_in: 'Alice', path_in: 'poetech' }]);
    const bad = await claimLandlordSpace({ path: 'properties' }, client({ rpc: async () => ({ data: null, error: { message: 'no' } }) }));
    expect(bad).toMatchObject({ ok: false, reason: 'rpc-error' });
  });

  it('a new door needs a space and an address, is filed as the signed-in person, and carries the slug the address decides', async () => {
    expect((await addRental({ address: '12 Elm' })).reason).toBe('no-space');
    expect((await addRental({ instanceId: 'i-1', address: '  ' })).reason).toBe('no-address');
    expect(doorSlug({ address: '12 Elm Street', unit: 'Apt 2' })).toBe('r-12elmstreetapt2');
    const c = client();
    const r = await addRental({ instanceId: 'i-1', address: '12 Elm Street', unit: 'Apt 2', city: 'Urbana', state: 'Illinois', propertyType: 'duplex', monthlyRent: '900' }, c);
    expect(r.ok).toBe(true);
    const [, row] = c.calls.find(([k]) => k === 'insert:rentals');
    expect(row).toMatchObject({
      instance_id: 'i-1', created_by: 'u-1', slug: 'r-12elmstreetapt2', address: '12 Elm Street', unit: 'Apt 2',
      city: 'Urbana', state: 'Illinois', display_name: '12 Elm Street Apt 2', property_type: 'duplex', status: 'vacant', monthly_rent: 900,
    });
  });

  it('a slug already taken on the space gets the next number, and a real refusal is said', async () => {
    let n = 0;
    const taken = client({ insert: (row) => { n += 1; return n === 1 ? { data: null, error: { code: '23505', message: 'dup' } } : { data: { id: 'r-2', ...row }, error: null }; } });
    const r = await addRental({ instanceId: 'i-1', address: '12 Elm Street' }, taken);
    expect(r.ok).toBe(true);
    expect(r.row.slug).toBe('r-12elmstreet-2');
    const refused = await addRental({ instanceId: 'i-1', address: '12 Elm Street' }, client({ insert: () => ({ data: null, error: { code: '42501', message: 'rls' } }) }));
    expect(refused).toMatchObject({ ok: false, reason: 'write-failed' });
  });
});
