// =============================================================================
// The family's app places its doors on the map by itself (DR-0998)
// =============================================================================
// Darrell, 2026-10-13: "I love that it shows what's close!!! Shouldn't this be
// default?" -- so the family's own session places every door not yet on the
// map, once, in the background. A tenant's or a stranger's never does.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Controlled cloud: NO tenancy for this person, but he OWNS two doors, and there
// is one public vacancy. Both the owner path and the listing path are exercised.
// vi.hoisted so the mutable state is reachable inside the hoisted mock factory.
const H = vi.hoisted(() => ({ rentals: [], vacancies: [], doors: [], placeCalls: [], saves: [], areasRead: 0 }));
vi.mock('../modules/properties/cloud.js', () => {
  const noop = async () => ({ ok: true });
  return {
    claimPropertyAccess: async () => ({ ok: true }),
    loadMyDoors: async () => ({ ok: true, doors: H.doors }),
    loadInvites: async () => ({ ok: true, invites: [] }),
    loadMyGrants: async () => ({ ok: true, grants: [] }),
    loadMyHousehold: async () => ({ ok: true, memberships: [] }),
    loadMyRentals: async () => ({ ok: true, rentals: H.rentals }),
    // The landlord seat beside the spine (DR-1007): none, the ordinary family case.
    loadMyLandlordSeat: async () => ({ ok: true, seat: null }),
    addRental: async () => ({ ok: true, row: null }),
    loadPublicVacancies: async () => ({ ok: true, vacancies: H.vacancies }),
    loadVacancyPhotos: async () => ({ ok: true, photos: H.listingPhotos || [] }),
    loadAllPhotos: async () => ({ ok: true, photos: [] }),
    loadPhotoImages: async () => ({ ok: true, images: {} }),
    hydrateLegacyImages: async (photos) => photos,
    loadDoorRecord: async () => ({ ok: false }),
    loadRooms: async () => ({ ok: true, rooms: [] }),
    // The rest of the apartment (DR-0963). Stubbed empty: these suites are
    // about a single door, and a door with no siblings is the ordinary case.
    loadSiblingPhotos: async () => ({ ok: true, photos: [], siblings: [] }),
    loadDoorPhotoOrders: async () => ({ ok: true, orders: {} }),
    loadDoorAreas: async () => { H.areasRead += 1; return { ok: true, placed: new Set(['r2']) }; }, saveDoorPhotoOrder: async () => ({ ok: true, saved: 0 }),
    loadDoorArchives: async () => ({ ok: true, channels: {}, heldAt: {} }),
    loadDoorPhotoSources: async () => ({ ok: true, sources: {} }),
    loadDoorPhotos: async () => ({ ok: true, photos: [] }),
    loadPhotoThumbs: async () => ({ ok: true, thumbs: {} }), loadStayPayment: async () => ({ ok: true, payment: null }), loadDoorNotes: async () => ({ ok: true, notes: [] }), loadVacancyAddress: async () => ({ ok: false }), loadGuestDoor: async () => ({ ok: false }), loadJobVideo: async () => ({ ok: false }),
    loadSystems: async () => ({ ok: true, systems: [] }), loadSystemEvents: async () => ({ ok: true, events: [] }), loadPropertyNotes: async () => ({ ok: true, notes: [] }),
    loadDoorTenancies: async () => ({ ok: true, tenancies: [] }),
    loadDocuments: async () => ({ ok: true, documents: [] }),
    // The guest card on the Work board (DR-0898): off on every door here.
    loadGuestLink: async () => ({ ok: true, token: null }), openGuestLink: async () => ({ ok: true, token: null }), closeGuestLink: async () => ({ ok: true }),
    // Rent hand-off and the change clock (DR-0899): nothing set, nothing logged.
    loadRecordEvents: async () => ({ ok: true, events: [] }), loadDoorMoney: async () => ({ ok: true, months: [] }),
    loadDoorPapers: async () => ({ ok: true, documents: [] }), loadSignatures: async () => ({ ok: true, signatures: [] }),
    requestSignatures: async () => ({ ok: true }), signDocument: async () => ({ ok: true }),
    doorOfMyTenancy: async () => ({ ok: true, rentalId: null }), loadDoorStays: async () => ({ ok: true, rows: [] }), loadBookedNights: async () => ({ ok: true, ranges: [] }), loadDoorArea: async () => ({ ok: true, area: null, nearby: [] }), requestAStay: async () => ({ ok: true }), addDoorStay: async () => ({ ok: true }), decideStay: async () => ({ ok: true }), loadCameraMenu: async () => ({ ok: true, menu: [] }), loadCameraAccess: async () => ({ ok: true, rows: [] }),
    saveCameraMenu: async () => ({ ok: true }), askForCameras: async () => ({ ok: true }), decideCameraAccess: async () => ({ ok: true }), giveCameraAccess: async () => ({ ok: true }), loadPayeeForTenancy: async () => ({ ok: true, payee: null }),
    loadRentPayee: async () => ({ ok: true, payee: null }), saveRentPayee: async () => ({ ok: true }),
    fileWorkOrder: noop, setWorkOrderStatus: noop, assignWorkOrder: noop,
    postMessage: noop, postNote: noop, postJobDoc: noop,
    recordRent: noop, confirmRent: noop, markRentPosted: noop,
    inviteToProperties: noop, createTenancy: noop,
    addRoom: noop, patchRoom: noop, updateTenancy: noop, updateRental: async (id, patch, opts) => { H.saves.push({ id, patch, opts }); return { ok: true }; },
    addPhoto: noop, patchPhoto: noop, addDocument: noop, patchDocument: noop,
  };
});

vi.mock('../lib/supabase.js', () => ({
  default: { auth: { getSession: async () => ({ data: { session: null } }) } },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
}));

// The placement itself is tested on its own (every-door-is-on-the-map.test.js);
// here only WHO starts it, with WHAT, and through which save path.
vi.mock('../modules/properties/place-on-map.js', () => ({
  placeDoorsOnTheMap: async (args) => {
    H.placeCalls.push(args);
    await args.save('r1', { area_lat: 40.125, area_lng: -88.26, nearby: null }, 'Placed on the map from its address (automatic): the area');
    return { placed: ['r1'], missed: [], looked: 1 };
  },
}));

import PropertiesApp from '../modules/properties/PropertiesApp.jsx';

let container, root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; H.rentals = []; H.vacancies = []; });

async function mount(props = {}) {
  // A FRESH ADDRESS PER MOUNT (DR-0901). The module now writes the page it is
  // on into the URL, and one jsdom document is shared by every case in this
  // file -- so without this, case 2 opens at the address case 1 navigated to
  // and lands on a door-scoped tab pointing at a door that only existed in
  // case 1's fixture. A real page load always starts from the link that was
  // opened; this is that.
  window.history.replaceState(null, '', `${window.location.pathname}`);
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesApp, { surface: 'poetech', ...props })); });
  for (let i = 0; i < 4; i++) await act(async () => { await Promise.resolve(); });
}


const doors = () => [
  { id: 'r1', slug: 'a1', instance_id: 'inst', display_name: '805 North Prospect Avenue', address: '805 North Prospect Avenue', unit: 'Apt 2', city: 'Champaign', state: 'Illinois', status: 'vacant', property_type: 'multi-family' },
  { id: 'r2', slug: 'a2', instance_id: 'inst', display_name: '12 Oak Street', address: '12 Oak Street', unit: '', city: 'Danville', state: 'Illinois', status: 'vacant', property_type: 'single-family' },
];

describe('every door with an address is on the map, by default', () => {
  afterEach(() => { H.placeCalls = []; H.saves = []; H.areasRead = 0; H.doors = []; });

  it('the family\'s session places its doors once, with what is already on the map, through the door edit path', async () => {
    H.rentals = doors();
    await mount();
    for (let i = 0; i < 6; i++) await act(async () => { await Promise.resolve(); });
    expect(H.areasRead).toBe(1);
    expect(H.placeCalls).toHaveLength(1);
    expect(H.placeCalls[0].rentals.map((r) => r.id)).toEqual(['r1', 'r2']);
    expect([...H.placeCalls[0].placed]).toEqual(['r2']);
    // The same edit path as the editor, so the trace lands in the door's notes.
    // The record is held whole FIRST (DR-0999: both doors already in their
    // parts, so each is marked held), then the door is placed.
    expect(H.saves.map((s) => s.id)).toEqual(['r1', 'r2', 'r1']);
    expect(H.saves[0].patch.address_held_at).toBeTruthy();
    expect(H.saves[0].opts.summary).toBe('Address held in its parts');
    expect(H.saves[2]).toEqual({ id: 'r1', patch: { area_lat: 40.125, area_lng: -88.26, nearby: null }, opts: { summary: 'Placed on the map from its address (automatic): the area' } });
  });

  it('PROVEN-TO-CATCH: a session that owns no doors (a tenant\'s) places nothing', async () => {
    H.rentals = [];
    H.doors = [{ id: 't1', rental_ref: 'a1', property_label: '805 North Prospect Avenue', unit_label: 'Apt 2', status: 'active' }];
    await mount();
    for (let i = 0; i < 6; i++) await act(async () => { await Promise.resolve(); });
    expect(H.areasRead).toBe(0);
    expect(H.placeCalls).toHaveLength(0);
  });
});
