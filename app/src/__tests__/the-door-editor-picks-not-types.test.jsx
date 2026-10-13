// =============================================================================
// The door editor PICKS the building and the archive, never types them (DR-0997)
// =============================================================================
// Darrell, 2026-10-13: "Drop down with addresses... instead of letting someone
// else mistyped" and "Hold the whole address so everyone can see the correct
// pattern for each property". The NAS's list is a stub here (the real server
// is walked in scripts/e2e/door-journeys.mjs G1); this pins the screen.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({ rentals: [], vacancies: [], doors: [], saves: [], channels: [{ name: '805NProspect', total: 121 }, { name: '709CommercialSt', total: 0 }], reachable: true }));
vi.mock('../modules/properties/cloud.js', () => {
  const noop = async () => ({ ok: true });
  return {
    claimPropertyAccess: async () => ({ ok: true }),
    loadMyDoors: async () => ({ ok: true, doors: H.doors }),
    loadInvites: async () => ({ ok: true, invites: [] }),
    loadMyGrants: async () => ({ ok: true, grants: [] }),
    loadMyHousehold: async () => ({ ok: true, memberships: [] }),
    loadMyRentals: async () => ({ ok: true, rentals: H.rentals }),
    loadPublicVacancies: async () => ({ ok: true, vacancies: H.vacancies }),
    loadVacancyPhotos: async () => ({ ok: true, photos: [] }),
    loadAllPhotos: async () => ({ ok: true, photos: [] }),
    loadPhotoImages: async () => ({ ok: true, images: {} }),
    hydrateLegacyImages: async (photos) => photos,
    loadDoorRecord: async () => ({ ok: false }),
    loadRooms: async () => ({ ok: true, rooms: [] }),
    loadSiblingPhotos: async () => ({ ok: true, photos: [], siblings: [] }),
    loadDoorPhotoOrders: async () => ({ ok: true, orders: {} }),
    loadDoorAreas: async () => ({ ok: true, placed: new Set(['r1', 'r2']), areas: {} }),
    loadDoorArchives: async () => ({ ok: true, channels: { r1: '805NProspect' }, heldAt: { r1: 'x', r2: 'x' } }),
    saveDoorPhotoOrder: async () => ({ ok: true, saved: 0 }),
    loadDoorPhotos: async () => ({ ok: true, photos: [] }),
    loadPhotoThumbs: async () => ({ ok: true, thumbs: {} }), loadStayPayment: async () => ({ ok: true, payment: null }), loadDoorNotes: async () => ({ ok: true, notes: [] }), loadVacancyAddress: async () => ({ ok: false }), loadGuestDoor: async () => ({ ok: false }), loadJobVideo: async () => ({ ok: false }),
    loadSystems: async () => ({ ok: true, systems: [] }), loadSystemEvents: async () => ({ ok: true, events: [] }), loadPropertyNotes: async () => ({ ok: true, notes: [] }),
    loadDoorTenancies: async () => ({ ok: true, tenancies: [] }),
    loadDocuments: async () => ({ ok: true, documents: [] }),
    loadGuestLink: async () => ({ ok: true, token: null }), openGuestLink: async () => ({ ok: true, token: null }), closeGuestLink: async () => ({ ok: true }),
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
    addRoom: noop, patchRoom: noop, updateTenancy: noop,
    updateRental: async (id, patch, opts) => { H.saves.push({ id, patch, summary: opts?.summary }); return { ok: true }; },
    addPhoto: noop, patchPhoto: noop, addDocument: noop, patchDocument: noop,
  };
});
vi.mock('../lib/supabase.js', () => ({
  default: { auth: { getSession: async () => ({ data: { session: null } }) } },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
}));
vi.mock('../modules/properties/place-on-map.js', () => ({ placeDoorsOnTheMap: async () => ({ placed: [], missed: [], looked: 0 }) }));
vi.mock('../lib/nas-photos.js', async (orig) => {
  const real = await orig();
  return {
    ...real,
    hasBridgeToken: () => true,
    fetchChannels: async () => (H.reachable ? H.channels : null),
    nasRoad: () => 'same-origin',
  };
});

import PropertiesApp from '../modules/properties/PropertiesApp.jsx';

let container, root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; H.saves = []; H.reachable = true; });

async function mount() {
  window.history.replaceState(null, '', `${window.location.pathname}`);
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesApp, { surface: 'poetech' })); });
  for (let i = 0; i < 8; i++) await act(async () => { await Promise.resolve(); });
}
async function tap(el) { await act(async () => { el.click(); }); for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); }); }
const button = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent));

const doors = () => [
  { id: 'r1', slug: 'r-805nprospect', instance_id: 'inst', display_name: '805 North Prospect Avenue Apt 2', address: '805 North Prospect Avenue', unit: 'Apt 2', city: 'Champaign', state: 'Illinois', status: 'vacant', property_type: 'multi-family', showcase_order: 1 },
  { id: 'r2', slug: 'r-1213koehn', instance_id: 'inst', display_name: '1213 Koehn Dr', address: '1213 Koehn Dr', unit: '', city: 'Danville', state: 'IL', zip: '61832', status: 'paying', property_type: 'single-family', showcase_order: 2 },
];

describe('the door editor', () => {
  it('offers the family\'s buildings under the street, names the archive from the NAS\'s list, and prints the one pattern', async () => {
    H.rentals = doors();
    await mount();
    await tap(button(/^Edit( door)?$/));
    const options = [...container.querySelectorAll('datalist#known-buildings option')].map((o) => o.value);
    expect(options).toEqual(['1213 Koehn Dr, Danville, IL 61832', '805 North Prospect Avenue, Champaign, Illinois']);
    expect(container.querySelector('[data-testid="door-address-line"]').textContent).toContain('805 North Prospect Avenue, Apt 2, Champaign, Illinois');
    const sel = container.querySelector('[data-testid="door-archive"]');
    expect(sel).not.toBeNull();
    expect(sel.value).toBe('805NProspect'); // the record's own, read from the row
    expect([...sel.options].map((o) => o.textContent)).toEqual(['None named', '805NProspect (121 pictures)', '709CommercialSt (0 pictures)']);
    // Picking a known building fills the town and state from the pick.
    const addr = container.querySelector('[data-testid="door-address"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    await act(async () => { setter.call(addr, '1213 Koehn Dr, Danville, IL 61832'); addr.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(container.querySelector('[data-testid="door-address-line"]').textContent).toContain('1213 Koehn Dr, Apt 2, Danville, IL');
  });

  it('PROVEN-TO-CATCH: with the NAS unreachable the archive is shown and kept, never typed', async () => {
    H.rentals = doors(); H.reachable = false;
    await mount();
    await tap(button(/^Edit( door)?$/));
    expect(container.querySelector('[data-testid="door-archive"]')).toBeNull();
    const state = container.querySelector('[data-testid="door-archive-state"]');
    expect(state.getAttribute('data-state')).toBe('unreachable');
    expect(state.textContent).toContain('805NProspect');
    expect(state.textContent).toContain('could not be reached');
  });

  it('a changed archive saves through the door edit path with its summary', async () => {
    H.rentals = doors();
    await mount();
    await tap(button(/^Edit( door)?$/));
    const sel = container.querySelector('[data-testid="door-archive"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    await act(async () => { setter.call(sel, '709CommercialSt'); sel.dispatchEvent(new Event('change', { bubbles: true })); });
    await tap(button(/^Save the change$/));
    const save = H.saves.find((s) => s.id === 'r1' && s.patch.photo_channel);
    expect(save.patch.photo_channel).toBe('709CommercialSt');
    expect(save.summary).toMatch(/Picture archive on the NAS/);
  });
});
