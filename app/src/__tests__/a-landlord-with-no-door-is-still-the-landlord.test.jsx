// =============================================================================
// A landlord with no door yet is still the landlord (DR-1007)
// =============================================================================
// PropertiesApp's face used to be earned only by reading a rentals row; a
// person who had just been given their own landlord space, with no door on
// it, fell through to the tenant face. The seat (0207's resolver) is the same
// membership proof RLS reads, so it earns the owner's face — and the empty
// board offers Add a door, which files the first door on the seat's space.
// =============================================================================
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = { seat: { ok: true, seat: null }, rentals: [], added: [] };

vi.mock('../modules/properties/cloud.js', () => {
  const noop = async () => ({ ok: true });
  return {
    claimPropertyAccess: async () => ({ ok: true }),
    loadMyDoors: async () => ({ ok: true, doors: [] }),
    loadMyGrants: async () => ({ ok: true, grants: [] }),
    loadMyHousehold: async () => ({ ok: true, memberships: [] }),
    loadMyRentals: async () => ({ ok: true, rentals: H.rentals }),
    loadMyLandlordSeat: async () => H.seat,
    addRental: async (fields) => { H.added.push(fields); return { ok: true, row: { id: 'r-1', slug: 'r-12elmstreet', ...fields } }; },
    loadInvites: async () => ({ ok: true, invites: [] }),
    loadPublicVacancies: async () => ({ ok: true, vacancies: [] }),
    loadVacancyPhotos: async () => ({ ok: true, photos: [] }),
    loadAllPhotos: async () => ({ ok: true, photos: [] }),
    loadPhotoImages: async () => ({ ok: true, images: {} }),
    hydrateLegacyImages: async (p) => p,
    loadDoorRecord: async () => ({ ok: false }),
    loadRooms: async () => ({ ok: true, rooms: [] }),
    loadSiblingPhotos: async () => ({ ok: true, photos: [], siblings: [] }),
    // The building's picture pool (DR-1290), empty: a door with no other apartments.
    loadBuildingPool: async () => ({ ok: true, photos: [], doors: [], placed: {} }),
    placeBuildingPhoto: async () => ({ ok: true, saved: 1 }), unplaceBuildingPhoto: async () => ({ ok: true, removed: 1 }),
    loadDoorPhotoOrders: async () => ({ ok: true, orders: {} }),
    loadDoorAreas: async () => ({ ok: false }), saveDoorPhotoOrder: async () => ({ ok: true, saved: 0 }),
    loadDoorArchives: async () => ({ ok: true, channels: {}, heldAt: {} }),
    loadDoorPhotoSources: async () => ({ ok: true, sources: {} }),
    loadDoorPhotos: async () => ({ ok: true, photos: [] }),
    loadDoorTenancies: async () => ({ ok: true, tenancies: [] }),
    loadDocuments: async () => ({ ok: true, documents: [] }),
    loadSystems: async () => ({ ok: true, systems: [] }),
    loadSystemEvents: async () => ({ ok: true, events: [] }),
    loadDoorNotes: async () => ({ ok: true, notes: [] }),
    loadGuestLink: async () => ({ ok: true, token: null }), openGuestLink: async () => ({ ok: true, token: null }), closeGuestLink: async () => ({ ok: true }),
    loadRecordEvents: async () => ({ ok: true, events: [] }), loadDoorMoney: async () => ({ ok: true, months: [] }),
    loadDoorPapers: async () => ({ ok: true, documents: [] }), loadSignatures: async () => ({ ok: true, signatures: [] }),
    requestSignatures: async () => ({ ok: true }), signDocument: async () => ({ ok: true }),
    doorOfMyTenancy: async () => ({ ok: true, rentalId: null }), loadDoorStays: async () => ({ ok: true, rows: [] }),
    loadBookedNights: async () => ({ ok: true, ranges: [] }), loadDoorArea: async () => ({ ok: true, area: null, nearby: [] }),
    requestAStay: async () => ({ ok: true }), addDoorStay: async () => ({ ok: true }), decideStay: async () => ({ ok: true }),
    loadCameraMenu: async () => ({ ok: true, menu: [] }), loadCameraAccess: async () => ({ ok: true, rows: [] }),
    saveCameraMenu: async () => ({ ok: true }), askForCameras: async () => ({ ok: true }),
    decideCameraAccess: async () => ({ ok: true }), giveCameraAccess: async () => ({ ok: true }),
    loadPayeeForTenancy: async () => ({ ok: true, payee: null }),
    loadRentPayee: async () => ({ ok: true, payee: null }), saveRentPayee: async () => ({ ok: true }),
    loadApplications: async () => ({ ok: true, applications: [], unreadable: [] }),
    loadApplicationChecks: async () => ({ ok: true, checks: [], unreadable: [] }),
    addApplicationCheck: async () => ({ ok: true, check: {} }), decideApplication: async () => ({ ok: true }),
    loadJobVideo: async () => ({ ok: false }), setWorkOrderProof: noop,
    fileWorkOrder: noop, setWorkOrderStatus: noop, assignWorkOrder: noop,
    postMessage: noop, postNote: noop, postJobDoc: noop,
    recordRent: noop, confirmRent: noop, markRentPosted: noop,
    inviteToProperties: noop, createTenancy: noop,
    addRoom: noop, patchRoom: noop, updateTenancy: noop, updateRental: noop,
    addPhoto: noop, patchPhoto: noop, addDocument: noop, patchDocument: noop,
  };
});
// A SIGNED-IN person: with no session the app is the public shelf, which is
// not the surface under test.
const SESSION = { access_token: 't', user: { id: 'u-new', email: 'alice@example.com' } };
vi.mock('../lib/supabase.js', () => {
  const client = { auth: { getSession: async () => ({ data: { session: SESSION } }), getUser: async () => ({ data: { user: SESSION.user } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) } };
  return { default: client, supabase: client, phoneLoginEmail: () => '', onAuthChange: (cb) => { cb(SESSION); return () => {}; } };
});

const { default: PropertiesApp } = await import('../modules/properties/PropertiesApp.jsx');

let container; let root;
beforeEach(() => { H.seat = { ok: true, seat: null }; H.rentals = []; H.added = []; vi.useFakeTimers({ shouldAdvanceTime: true }); });
afterEach(() => { vi.useRealTimers(); if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });
// The spine reads are bounded by timers (bounded-read.js); walk the clock so
// the boot settles the way a-slow-road-is-not-a-dead-one walks it.
const settle = async (seconds = 8) => { for (let i = 0; i < seconds; i += 1) await act(async () => { await vi.advanceTimersByTimeAsync(1000); }); };

async function boot(surface = 'door') {
  window.history.replaceState(null, '', `${window.location.pathname}?properties=1`);
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesApp, { surface })); });
  await settle();
}
const faceLabel = () => [...container.querySelectorAll('span')].map((s) => s.textContent.trim()).find((t) => ['Landlord', 'Tenant', 'Property manager', '1099 worker', 'Household member'].includes(t));

describe('the face', () => {
  it('PROVEN-TO-CATCH: no seat and no door is the places-to-live card, as before — no board, no form', async () => {
    await boot();
    expect(container.textContent).toMatch(/Places to live, coming to this door/);
    expect(faceLabel()).toBeUndefined();
    expect(container.querySelector('[data-testid="add-door"]')).toBeNull();
  });

  it('an owner seat with no door is the Landlord face, with Add a door open on the empty board', async () => {
    H.seat = { ok: true, seat: { instance_id: 'i-new', instance_slug: 'll-u', instance_type: 'landlord', role: 'owner' } };
    await boot();
    expect(faceLabel()).toBe('Landlord');
    expect(container.textContent).toMatch(/No properties are on your account yet/);
    expect(container.querySelector('[data-testid="add-door"]')).toBeTruthy();
  });

  it('a MEMBER seat with nothing else is not the owner\'s face and gets no form', async () => {
    H.seat = { ok: true, seat: { instance_id: 'i-d', role: 'member' } };
    await boot();
    expect(faceLabel()).toBeUndefined();
    expect(container.querySelector('[data-testid="add-door"]')).toBeNull();
  });
});

describe('the first door', () => {
  it('is filed on the seat\'s space with what was typed, and the board reads it back', async () => {
    H.seat = { ok: true, seat: { instance_id: 'i-new', role: 'owner' } };
    await boot();
    const form = container.querySelector('[data-testid="add-door"]');
    const type = async (label, value) => {
      const el = form.querySelector(`[aria-label="${label}"]`);
      expect(el, `no field ${label}`).toBeTruthy();
      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set;
        setter.call(el, value);
        el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
      });
    };
    await type('Street address', '12 Elm Street');
    await type('Unit', 'Apt 2');
    await type('City', 'Urbana');
    await type('State', 'Illinois');
    await type('What it is', 'duplex');
    await type('Monthly rent', '900');
    // the board reads the new door back on the reboot
    H.rentals = [{ id: 'r-1', instance_id: 'i-new', slug: 'r-12elmstreet', address: '12 Elm Street', unit: 'Apt 2', city: 'Urbana', state: 'Illinois', display_name: '12 Elm Street Apt 2', property_type: 'duplex', status: 'vacant', monthly_rent: 900 }];
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    await settle();
    expect(H.added).toEqual([{ instanceId: 'i-new', address: '12 Elm Street', unit: 'Apt 2', city: 'Urbana', state: 'Illinois', propertyType: 'duplex', monthlyRent: '900' }]);
    expect(container.textContent).toMatch(/12 Elm Street/);
    expect(container.textContent).not.toMatch(/No properties are on your account yet/);
  });

  it('an empty address is refused before any write', async () => {
    H.seat = { ok: true, seat: { instance_id: 'i-new', role: 'owner' } };
    await boot();
    const form = container.querySelector('[data-testid="add-door"]');
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    await act(async () => { await Promise.resolve(); });
    expect(H.added).toEqual([]);
    expect(form.querySelector('[data-testid="add-door-said"]').textContent).toMatch(/The address is the one thing a door needs/);
  });
});
