// =============================================================================
// The reviewer lens is a stranger in Properties (DR-1240)
// =============================================================================
// Darrell, 2026-10-27, in reviewer mode on his phone, on Properties → Landlord
// → "805 North Prospect Avenue · Apt 4" → Pictures (37 pictures): "How is the
// new person or users able to see our assets and not just their own or what
// we allow?!" The database never leaked — RLS shows a stranger 0 doors (the
// 0150/0309 smokes). The LENS leaked: the shell narrowed every privilege it
// derives and then mounted PropertiesApp with the real session, and the module
// read his seat and doors as him. Then: "I want both... as myself and as a
// new user... a toggle or choices." So the lens has two modes (DR-1240):
// 'self' still reads his rows (and the banner says so); 'stranger' boots this
// module as a person with no invite and says so here.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The steward's REAL rows, as the mocked database would hand them to him.
const DOOR = { id: 'r-805-4', slug: 'r-805-north-prospect-apt-4', address: '805 North Prospect Avenue', unit: 'Apt 4', city: 'Champaign', state: 'IL', label: '805 North Prospect Avenue · Apt 4', display_name: '805 North Prospect Avenue · Apt 4', monthly_rent: 900, status: 'vacant' };
const SEAT = { instance_id: 'i-poe', instance_slug: 'poe-properties', instance_type: 'landlord', role: 'owner' };

const H = vi.hoisted(() => ({
  spies: {},
  reads: { seat: null, doors: [], rentals: [], photos: [] },
}));

vi.mock('../modules/properties/cloud.js', () => {
  const noop = async () => ({ ok: true });
  const spy = (name, impl) => { const f = vi.fn(impl); H.spies[name] = f; return f; };
  return {
    claimPropertyAccess: spy('claimPropertyAccess', async () => ({ ok: true })),
    loadMyDoors: spy('loadMyDoors', async () => ({ ok: true, doors: H.reads.doors })),
    loadMyGrants: spy('loadMyGrants', async () => ({ ok: true, grants: [] })),
    loadMyHousehold: spy('loadMyHousehold', async () => ({ ok: true, memberships: [] })),
    loadMyRentals: spy('loadMyRentals', async () => ({ ok: true, rentals: H.reads.rentals })),
    loadMyLandlordSeat: spy('loadMyLandlordSeat', async () => ({ ok: !!H.reads.seat, seat: H.reads.seat })),
    loadInvites: spy('loadInvites', async () => ({ ok: true, invites: [] })),
    loadAllPhotos: spy('loadAllPhotos', async () => ({ ok: true, photos: H.reads.photos })),
    loadDoorPhotoOrders: spy('loadDoorPhotoOrders', async () => ({ ok: true, orders: {} })),
    loadDoorArchives: spy('loadDoorArchives', async () => ({ ok: true, channels: {}, heldAt: {} })),
    loadPublicVacancies: spy('loadPublicVacancies', async () => ({ ok: true, vacancies: [] })),
    addRental: async () => ({ ok: false }),
    loadVacancyPhotos: async () => ({ ok: true, photos: [] }),
    loadPhotoImages: async () => ({ ok: true, images: {} }),
    hydrateLegacyImages: async (p) => p,
    loadDoorRecord: async () => ({ ok: false }),
    loadRooms: async () => ({ ok: true, rooms: [] }),
    loadSiblingPhotos: async () => ({ ok: true, photos: [], siblings: [] }),
    // The building's picture pool (DR-1290), empty: a door with no other apartments.
    loadBuildingPool: async () => ({ ok: true, photos: [], doors: [], placed: {} }),
    placeBuildingPhoto: async () => ({ ok: true, saved: 1 }), unplaceBuildingPhoto: async () => ({ ok: true, removed: 1 }),
    loadDoorAreas: async () => ({ ok: false }), saveDoorPhotoOrder: async () => ({ ok: true, saved: 0 }),
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
    loadUnpostedRent: async () => ({ ok: true, rows: [] }),
    loadJobVideo: async () => ({ ok: false }), setWorkOrderProof: noop,
    fileWorkOrder: noop, setWorkOrderStatus: noop, assignWorkOrder: noop,
    postMessage: noop, postNote: noop, postJobDoc: noop,
    recordRent: noop, confirmRent: noop, markRentPosted: noop,
    inviteToProperties: noop, createTenancy: noop,
    addRoom: noop, patchRoom: noop, updateTenancy: noop, updateRental: noop,
    addPhoto: noop, patchPhoto: noop, addDocument: noop, patchDocument: noop,
  };
});
// The STEWARD'S real session — the lens keeps him signed in as himself.
const SESSION = { access_token: 't', user: { id: 'u-darrell', email: 'darrell@example.com' } };
vi.mock('../lib/supabase.js', () => {
  const client = { auth: { getSession: async () => ({ data: { session: SESSION } }), getUser: async () => ({ data: { user: SESSION.user } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) } };
  return { default: client, supabase: client, phoneLoginEmail: () => '', onAuthChange: (cb) => { cb(SESSION); return () => {}; } };
});

const { default: PropertiesApp } = await import('../modules/properties/PropertiesApp.jsx');
const { REVIEWER_MODE_KEY } = await import('../lib/reviewer-mode.jsx');

const OWN_ROWS = ['claimPropertyAccess', 'loadMyLandlordSeat', 'loadMyDoors', 'loadMyGrants', 'loadMyHousehold', 'loadMyRentals', 'loadInvites', 'loadAllPhotos', 'loadDoorPhotoOrders', 'loadDoorArchives'];

let container; let root;
beforeEach(() => {
  H.reads = { seat: SEAT, doors: [], rentals: [DOOR], photos: [{ id: 'p1', rental_id: DOOR.id, kind: 'listing' }] };
  Object.values(H.spies).forEach((f) => f.mockClear());
  try { window.localStorage.removeItem(REVIEWER_MODE_KEY); } catch { /* jsdom */ }
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => { vi.useRealTimers(); if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; try { window.localStorage.removeItem(REVIEWER_MODE_KEY); } catch { /* jsdom */ } });
const settle = async (seconds = 8) => { for (let i = 0; i < seconds; i += 1) await act(async () => { await vi.advanceTimersByTimeAsync(1000); }); };

async function boot(props = {}) {
  window.history.replaceState(null, '', `${window.location.pathname}?properties=1`);
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesApp, { surface: 'poetech', ...props })); });
  await settle();
}
const faceLabel = () => [...container.querySelectorAll('span')].map((s) => s.textContent.trim()).find((t) => ['Landlord', 'Tenant', 'Property manager', '1099 worker', 'Household member'].includes(t));

describe('the lens OFF, and the SELF mode — his own rows are read and shown', () => {
  it('PROVEN-TO-CATCH: lens off, his own seat and door are read and the Landlord face shows his address', async () => {
    await boot({ stranger: false });
    expect(H.spies.loadMyLandlordSeat).toHaveBeenCalled();
    expect(H.spies.loadMyDoors).toHaveBeenCalled();
    expect(faceLabel()).toBe('Landlord');
    expect(container.textContent).toContain('805 North Prospect Avenue');
    expect(container.querySelector('[data-testid="properties-reviewer-lens"]')).toBeNull();
  });
  it("SELF mode ('self' on the device, no prop): the seat and doors are still read — privileges hidden, his rows shown", async () => {
    window.localStorage.setItem(REVIEWER_MODE_KEY, 'self');
    await boot();
    expect(H.spies.loadMyLandlordSeat).toHaveBeenCalled();
    expect(H.spies.loadMyDoors).toHaveBeenCalled();
    expect(faceLabel()).toBe('Landlord');
    expect(container.textContent).toContain('805 North Prospect Avenue');
    expect(container.querySelector('[data-testid="properties-reviewer-lens"]')).toBeNull();
  });
  it("the legacy '1' every device already holds is SELF — exactly what it did before", async () => {
    window.localStorage.setItem(REVIEWER_MODE_KEY, '1');
    await boot();
    expect(H.spies.loadMyLandlordSeat).toHaveBeenCalled();
    expect(faceLabel()).toBe('Landlord');
  });
});

describe('the STRANGER mode — a new user, and told so', () => {
  it('never reads his own seat, doors, grants, household, properties, invites or pictures', async () => {
    await boot({ stranger: true });
    for (const name of OWN_ROWS) expect(H.spies[name], `${name} was read under the lens`).not.toHaveBeenCalled();
    // The public shelf — what a person with no invite is shown — is still read.
    expect(H.spies.loadPublicVacancies).toHaveBeenCalled();
  });

  it('renders the no-invite face: places to live, no Landlord face, his address nowhere, and the honest line', async () => {
    await boot({ stranger: true });
    expect(container.textContent).toMatch(/Places to live, coming to this door/);
    expect(faceLabel()).toBeUndefined();
    expect(container.textContent).not.toContain('805 North Prospect Avenue');
    expect(container.querySelector('[data-testid="add-door"]')).toBeNull();
    const line = container.querySelector('[data-testid="properties-reviewer-lens"]');
    expect(line, 'the honest line is missing').toBeTruthy();
    expect(line.textContent).toMatch(/Reviewer lens: your own doors are hidden here; a person with no invite sees this/);
  });

  it('ONE SOURCE: with no prop, the module asks the same per-device value the shell reads', async () => {
    window.localStorage.setItem(REVIEWER_MODE_KEY, 'stranger');
    await boot();
    expect(H.spies.loadMyLandlordSeat).not.toHaveBeenCalled();
    expect(H.spies.loadMyDoors).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="properties-reviewer-lens"]')).toBeTruthy();
    expect(container.textContent).not.toContain('805 North Prospect Avenue');
  });

  it('the lens only ever narrows: a value that is not a mode is the normal app', async () => {
    window.localStorage.setItem(REVIEWER_MODE_KEY, 'governor');
    await boot();
    expect(H.spies.loadMyDoors).toHaveBeenCalled();
    expect(faceLabel()).toBe('Landlord');
  });
});
