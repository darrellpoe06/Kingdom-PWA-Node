// =============================================================================
// The PoeTech Properties tab is never a blank space — the landlord sees his doors
// =============================================================================
// Darrell 2026-08-27 (on build d44484d, which claimed "the landlord can see his
// own doors"): opened Properties and got "no door assigned to you yet" — because
// the render dead-ended on `!doors.length` (TENANCIES) before it ever showed his
// `rentals` (the doors he OWNS). "No one, not even a non-user, should see an
// empty space."
//
// Proven-to-catch: put the `!doors.length` dead-end back (drop the `&&
// !rentals.length`) and the landlord meets the empty screen again — this fails.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Controlled cloud: NO tenancy for this person, but he OWNS two doors, and there
// is one public vacancy. Both the owner path and the listing path are exercised.
// vi.hoisted so the mutable state is reachable inside the hoisted mock factory.
const H = vi.hoisted(() => ({ rentals: [], vacancies: [] }));
vi.mock('../modules/properties/cloud.js', () => {
  const noop = async () => ({ ok: true });
  return {
    claimPropertyAccess: async () => ({ ok: true }),
    loadMyDoors: async () => ({ ok: true, doors: [] }),
    loadMyGrants: async () => ({ ok: true, grants: [] }),
    loadMyHousehold: async () => ({ ok: true, memberships: [] }),
    loadMyRentals: async () => ({ ok: true, rentals: H.rentals }),
    loadPublicVacancies: async () => ({ ok: true, vacancies: H.vacancies }),
    loadVacancyPhotos: async () => ({ ok: true, photos: H.listingPhotos || [] }),
    loadAllPhotos: async () => ({ ok: true, photos: [] }),
    loadDoorRecord: async () => ({ ok: false }),
    loadRooms: async () => ({ ok: true, rooms: [] }),
    loadDoorPhotos: async () => ({ ok: true, photos: [] }),
    loadDoorTenancies: async () => ({ ok: true, tenancies: [] }),
    loadDocuments: async () => ({ ok: true, documents: [] }),
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
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesApp, { surface: 'poetech', ...props })); });
  for (let i = 0; i < 4; i++) await act(async () => { await Promise.resolve(); });
}

describe('the landlord opens Properties', () => {
  it('sees his OWN doors (apartments), not the "no door assigned" dead-end', async () => {
    H.rentals = [
      { id: 'u1', slug: '805-np-1', address: '805 North Prospect Avenue', city: 'Champaign', state: 'IL', unit: 'Apt 1', status: 'unrented', monthly_rent: 950 },
      { id: 'u2', slug: '1003-koehn', address: '1003 Koehn Dr', city: 'Danville', state: 'IL', status: 'unrented', monthly_rent: 800 },
    ];
    await mount();
    expect(container.textContent).not.toMatch(/no door assigned to you yet/i);
    expect(container.textContent).toContain('805 North Prospect Avenue');
    expect(container.textContent).toContain('1003 Koehn Dr');
  });
});

describe('a prospective renter opens Properties', () => {
  it('sees the places to live, never a blank space', async () => {
    H.rentals = [];
    H.vacancies = [{ id: 'v1', address: '12 Maple', city: 'Davenport', state: 'IA', monthly_rent: 800, listed_note: 'Available Sept 1' }];
    await mount();
    expect(container.textContent).toMatch(/Places to Live/i);
    expect(container.textContent).toContain('12 Maple');
    expect(container.textContent).toMatch(/\$800\/mo/);
    expect(container.textContent).toMatch(/Available/);
    expect(container.textContent).not.toMatch(/no door assigned to you yet/i);
  });

  it('with no doors, no rentals, and no listings, still greets — never blank', async () => {
    H.rentals = []; H.vacancies = [];
    await mount();
    expect(container.textContent).toMatch(/Places to Live/i);
    expect(container.textContent).toMatch(/coming to this door|posted here as they come/i);
    expect(container.textContent).not.toMatch(/no door assigned to you yet/i);
  });
});
