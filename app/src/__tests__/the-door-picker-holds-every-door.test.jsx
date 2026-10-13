// =============================================================================
// The door picker holds every door, by the board's name (DR-0978)
// =============================================================================
// Darrell, 2026-10-12: a screenshot of the landlord picker holding two doors
// ("805 North Prospect Avenue · Apt 2", "805 North Prospect Avenue Apt 1")
// under "Your doors (12)". The picker listed TENANCIES, and only two of the
// twelve doors have one, so ten doors could not be picked from it, and the two
// it did list were named by the tenancy's label rather than the board's.
//
// Proven-to-catch: put back `doors.map(...)` as the picker's options and the
// first case sees 2 options, not 12.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Controlled cloud: NO tenancy for this person, but he OWNS two doors, and there
// is one public vacancy. Both the owner path and the listing path are exercised.
// vi.hoisted so the mutable state is reachable inside the hoisted mock factory.
const H = vi.hoisted(() => ({ rentals: [], vacancies: [], doors: [] }));
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
  loadDoorAreas: async () => ({ ok: false }), saveDoorPhotoOrder: async () => ({ ok: true, saved: 0 }),
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
    addRoom: noop, patchRoom: noop, updateTenancy: noop, updateRental: noop,
    addPhoto: noop, patchPhoto: noop, addDocument: noop, patchDocument: noop,
  };
});

vi.mock('../lib/supabase.js', () => ({
  default: { auth: { getSession: async () => ({ data: { session: null } }) } },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
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


const twelve = () => Array.from({ length: 12 }, (_, i) => ({
  id: `r${i + 1}`, slug: `805-np-${i + 1}`, instance_id: 'inst',
  display_name: '805 North Prospect Avenue', address: '805 North Prospect Avenue', unit: `Apt ${i + 1}`,
  city: 'Champaign', state: 'Illinois', status: 'vacant', property_type: 'multi-family',
  showcase_order: 12 - i, // the board's order is NOT the load order
}));

describe('the landlord door picker', () => {
  it('lists all twelve doors, not the two that have a tenancy', async () => {
    H.rentals = twelve();
    H.doors = [
      { id: 't2', rental_ref: '805-np-2', property_label: '805 North Prospect Avenue', unit_label: 'Apt 2', status: 'pending' },
      { id: 't1', rental_ref: '805-np-1', property_label: '805 North Prospect Avenue Apt 1', unit_label: null, status: 'active', tenant_name: 'A Tenant' },
    ];
    await mount();
    const picker = container.querySelector('[data-testid="door-picker"]');
    expect(picker).not.toBeNull();
    const options = [...picker.querySelectorAll('option')].map((o) => o.textContent);
    expect(options).toHaveLength(12);
    // The board's order (showcase_order), and the board's name for every door.
    expect(options[0]).toBe('805 North Prospect Avenue · Apt 12');
    expect(options[11]).toBe('805 North Prospect Avenue · Apt 1');
    expect(options).not.toContain('805 North Prospect Avenue Apt 1');
  });

  it('picking a door with no tenancy selects it', async () => {
    H.rentals = twelve();
    H.doors = [];
    await mount();
    const picker = container.querySelector('[data-testid="door-picker"]');
    await act(async () => {
      picker.value = 'r7';
      picker.dispatchEvent(new Event('change', { bubbles: true }));
    });
    for (let i = 0; i < 3; i++) await act(async () => { await Promise.resolve(); });
    expect(container.querySelector('[data-testid="door-picker"]').value).toBe('r7');
  });

  it('DR-0985: picking a door opens its Pictures, not the landing tab', async () => {
    H.rentals = twelve();
    H.doors = [];
    await mount();
    const picker = container.querySelector('[data-testid="door-picker"]');
    await act(async () => {
      picker.value = 'r7';
      picker.dispatchEvent(new Event('change', { bubbles: true }));
    });
    for (let i = 0; i < 4; i++) await act(async () => { await Promise.resolve(); });
    const pictures = [...container.querySelectorAll('button')].find((b) => /^Pictures$/i.test(b.textContent.trim()));
    expect(pictures, 'no Pictures tab on the landlord face').toBeTruthy();
    // The active tab is the primary-toned one.
    expect(pictures.className).toMatch(/bg-\[#2F5D50\]/);
    expect(window.location.search + window.location.hash).toMatch(/gallery/);
  });
});
