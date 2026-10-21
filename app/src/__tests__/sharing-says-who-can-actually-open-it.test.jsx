// =============================================================================
// Sharing says who can actually open it (DR-1179)
// =============================================================================
// Darrell, 2026-10-21:
//   "Also I gave apt 2 and 1 camera access in way that allowed me too... they
//    didn't get it... why not.... fix it!!!!!"
//   "What about the landlords and owners... etc..."
//   "I checked the anyone can see section for apt 2 cameras including short
//    stays... did it work?!!!!!!!!!!!!!!!!!!!!!"
import { describe, it, expect } from 'vitest';
import { whoCanOpen, whoSeesDoorCameras, menuReach, cameraReach, CAMERA_REACH } from '../modules/properties/door-cameras.js';

const NAMED_ONLY = { id: 't2', tenant_name: 'Delores Tracy', tenant_user_id: null };
const JOINED = { id: 't1', tenant_name: 'Delores Tracy', tenant_user_id: 'u-1' };

describe('a name on the door is not an account that can open a camera', () => {
  it('a tenant who never signed in CANNOT open, however correct the grant is', () => {
    // Why Apt 1 and Apt 2 did not get it: rental_tenancies_read (migration
    // 0150) admits a tenant through tenant_user_id = auth.uid() or
    // tenancy_household; a bare tenant_name satisfies neither, so loadMyDoors
    // returns them no row and there is no door to carry the grant.
    const r = whoCanOpen({ door: NAMED_ONLY, people: [] });
    expect(r.canOpen).toBe(false);
    expect(r.words).toMatch(/Delores Tracy/);
    expect(r.words).toMatch(/not signed in/);
    expect(r.words).toMatch(/Invite/);
  });

  it('THE TEST THAT USED TO MISS: that same door has a viewer, so a count never caught it', () => {
    // The old notice asked `viewers.length === 0`. whoSeesDoorCameras counts a
    // lease name as a viewer with joined:false, so the count is 1 and the
    // warning never rendered — under a cheerful "Shared with this door".
    expect(whoSeesDoorCameras({ door: NAMED_ONLY, people: [] }).length).toBe(1);
    expect(whoCanOpen({ door: NAMED_ONLY, people: [] }).canOpen).toBe(false);
  });

  it('says yes, by name, once somebody has actually joined', () => {
    const r = whoCanOpen({ door: JOINED, people: [] });
    expect(r.canOpen).toBe(true);
    expect(r.words).toMatch(/Delores Tracy is signed into this door/);
  });

  it('a household member who joined is enough on their own', () => {
    const r = whoCanOpen({ door: NAMED_ONLY, people: [{ name: 'Ada', roleLabel: 'household', joined: true }] });
    expect(r.canOpen).toBe(true);
    expect(r.joined.map((v) => v.name)).toContain('Ada');
  });

  it('an empty door says to add the tenant first', () => {
    const r = whoCanOpen({ door: { id: 't3' }, people: [] });
    expect(r.canOpen).toBe(false);
    expect(r.words).toMatch(/Nobody is on this door yet/);
  });
});

describe('the ask menu is a MENU, and says so', () => {
  it('states plainly that saving it grants nothing', () => {
    const m = menuReach({ saved: 3 });
    expect(m.grants).toBe(false);
    expect(m.words).toMatch(/MENU, not access/);
    expect(m.words).toMatch(/Give it/);
  });

  it('says a short-stay guest and a 1099 worker CANNOT see this list', () => {
    // The question he asked. resolveFace gives the `cameras` face to
    // TENANT_TABS only; WORKER_TABS has none and a guest is not a door role.
    for (const saved of [0, 3]) {
      const w = menuReach({ saved }).words;
      expect(w).toMatch(/short-stay guest/);
      expect(w).toMatch(/Give access to anyone/);
    }
    expect(menuReach({ saved: 3 }).words).toMatch(/1099 worker/);
  });

  it('does NOT repeat the old claim that a worker sees these names', () => {
    // The line it replaces said "a tenant, their household, a 1099 worker sent
    // here) sees these names and can ask" — wrong about the worker.
    expect(menuReach({ saved: 3 }).words).not.toMatch(/worker[^.]*sees these names/);
  });
});

describe('every face at a door is reached a different way, and it is named', () => {
  it('the landlord and owner need nothing shared with them at all', () => {
    expect(cameraReach('owner').by).toBe('family key');
    expect(cameraReach('owner').words).toMatch(/without anything being shared with you/);
    expect(cameraReach('admin').by).toBe('family key');
    expect(cameraReach('member').by).toBe('family key');
  });

  it('the household is reached by the DOOR’S grant, once signed in', () => {
    expect(cameraReach('tenant').by).toBe('door grant');
    expect(cameraReach('household').by).toBe('door grant');
    expect(cameraReach('tenant').words).toMatch(/once they have signed in/);
  });

  it('a worker and a guest are reached ONLY by a grant of their own', () => {
    expect(cameraReach('worker').by).toBe('own grant');
    expect(cameraReach('guest').by).toBe('own grant');
    expect(cameraReach('guest').words).toMatch(/never signs into the door/);
    expect(cameraReach('guest').words).toMatch(/send the link/);
  });

  it('an unknown role falls to the safe answer, never to the family key', () => {
    // A role nobody anticipated must not be told it holds the family key.
    expect(cameraReach('somebody-new').by).toBe('own grant');
    expect(cameraReach(undefined).by).toBe('own grant');
    expect(Object.keys(CAMERA_REACH)).toContain('guest');
  });
});
