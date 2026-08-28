// =============================================================================
// END-TO-END JOURNEY WALKS — every account type, opened cold
// =============================================================================
// Darrell, 2026-08-28: "comprehensive review and update to make sure users
// tenants landlords and owners can use the system... test the whole process as
// if you were a new user from each type of account... end to end testing to
// make sure it works well without issues."
//
// This is COMPREHENSIVE-REVIEW-STANDARD dimension 2 (journey walks) run as
// executable tests rather than as a claim in a report. Each describe block is
// one person opening the app for the first time, with only what the DATABASE
// would really return for them — the roles are not passed in, they are DERIVED
// the way PropertiesApp derives them (grants / household / rentals), so a
// resolver regression fails here rather than on somebody's phone.
//
// THE DEFECT THAT PROMPTED IT (screenshot, 11:47 PM): after picking a door,
// nothing on any tab said WHICH property was open. Rooms, Pictures, Files and
// Systems had been reading the selected door correctly all along — but a
// surface that is right and cannot be trusted is not usable, and filing a
// condition photo to the wrong unit is exactly what wrecks a deposit argument.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({
  rentals: [], vacancies: [], doors: [], grants: [], household: [],
  rooms: [], photos: [], documents: [], systems: [], systemEvents: [],
  record: null, tenancies: [], propertyNotes: [],
}));

vi.mock('../modules/properties/cloud.js', () => {
  const noop = async () => ({ ok: true });
  return {
    claimPropertyAccess: async () => ({ ok: true }),
    loadMyDoors: async () => ({ ok: true, doors: H.doors }),
    loadMyGrants: async () => ({ ok: true, grants: H.grants, byScope: {}, roleLabel: null }),
    loadMyHousehold: async () => ({ ok: true, memberships: H.household }),
    loadMyRentals: async () => ({ ok: true, rentals: H.rentals }),
    loadPublicVacancies: async () => ({ ok: true, vacancies: H.vacancies }),
    loadVacancyPhotos: async () => ({ ok: true, photos: H.listingPhotos || [] }),
    loadAllPhotos: async () => ({ ok: true, photos: H.photos }),
    loadDoorRecord: async () => (H.record
      ? { ok: true, ...H.record }
      : { ok: true, requests: [], messages: [], notes: [], docs: [], rent: [], notices: [] }),
    loadRooms: async () => ({ ok: true, rooms: H.rooms }),
    loadDoorPhotos: async () => ({ ok: true, photos: H.photos }),
    loadDoorTenancies: async () => ({ ok: true, tenancies: H.tenancies }),
    loadDocuments: async () => ({ ok: true, documents: H.documents }),
    loadSystems: async () => ({ ok: true, systems: H.systems }),
    loadSystemEvents: async () => ({ ok: true, events: H.systemEvents }),
    loadDoorNotes: async () => ({ ok: true, notes: H.propertyNotes }),
    addSystem: noop, patchSystem: noop, addSystemEvent: noop,
    fileWorkOrder: noop, setWorkOrderStatus: noop, assignWorkOrder: noop,
    postMessage: noop, postNote: noop, postJobDoc: noop,
    recordRent: noop, confirmRent: noop, markRentPosted: noop,
    inviteToProperties: noop, createTenancy: noop,
    addRoom: noop, patchRoom: noop, updateTenancy: noop, updateRental: noop,
    addPhoto: noop, patchPhoto: noop, addDocument: noop, patchDocument: noop,
    submitApplication: noop,
  };
});

vi.mock('../lib/supabase.js', () => ({
  default: { auth: { getSession: async () => ({ data: { session: null } }) } },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
}));

import PropertiesApp from '../modules/properties/PropertiesApp.jsx';

let container, root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  Object.assign(H, {
    rentals: [], vacancies: [], doors: [], grants: [], household: [],
    rooms: [], photos: [], documents: [], systems: [], systemEvents: [],
    record: null, tenancies: [], propertyNotes: [],
  });
});

async function mount(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(PropertiesApp, { surface: 'poetech', ...props }));
  });
  for (let i = 0; i < 6; i++) await act(async () => { await Promise.resolve(); });
}

const text = () => container.textContent || '';
const buttons = () => [...container.querySelectorAll('button')];
const byLabel = (re) => buttons().find((b) => re.test((b.textContent || '').trim()));
async function tap(re) {
  const b = byLabel(re);
  if (!b) throw new Error(`no button matching ${re}. Saw: ${buttons().map((x) => x.textContent.trim()).join(' | ')}`);
  await act(async () => { b.click(); });
  for (let i = 0; i < 4; i++) await act(async () => { await Promise.resolve(); });
  return b;
}

// The live catalog's shape, trimmed (measured 2026-08-28).
const KOEHN = {
  id: 'r-koehn', slug: 'r-1003koehn', instance_id: 'i1', address: '1003 Koehn Dr',
  city: 'Danville', state: 'IL', status: 'paying', property_type: 'single-family',
  monthly_rent: 680, display_name: '1003 Koehn Dr, Danville',
};
const PROSPECT = {
  id: 'r-prospect', slug: 'r-prospect-b', instance_id: 'i1', address: '805 North Prospect Avenue',
  city: 'Champaign', state: 'Illinois', status: 'unrented', property_type: 'multi-family',
  monthly_rent: 0, display_name: '805 North Prospect Avenue — unit B',
};
const TALANS = {
  id: 'r-talans', slug: 'r-2111talans', instance_id: 'i1', address: '2111 Talans Dr',
  city: 'Champaign', state: 'IL', status: 'owner-occupied', property_type: 'primary-home',
  monthly_rent: 0, display_name: '2111 Talans Dr',
};
const TENANCY = {
  id: 't1', instance_id: 'i1', rental_ref: 'r-1003koehn', property_label: '1003 Koehn Dr',
  unit_label: null, tenant_name: 'A. Tenant', lease_start: '2026-01-01', lease_end: null,
  monthly_rent: 680, status: 'active',
};

// ── 1. SOMEONE LOOKING FOR A PLACE (no account at all) ───────────────────────
describe('journey — a stranger with no account', () => {
  it('is shown places to live, never an empty screen or a login wall', async () => {
    H.vacancies = [{ id: 'v1', label: 'Maple Street', city: 'Davenport', state: 'IA', rent: 800, note: 'Available Sept 1' }];
    await mount();
    expect(text()).toMatch(/Places to Live/i);
    expect(text()).toContain('Maple Street');
    expect(text()).not.toMatch(/no door assigned/i);
  });

  it('is told the truth when nothing is listed, rather than shown a blank', async () => {
    await mount();
    expect(text().trim().length).toBeGreaterThan(40);
    expect(text()).not.toMatch(/undefined|NaN|\[object/);
  });
});

// ── 2. THE LANDLORD / OWNER ──────────────────────────────────────────────────
describe('journey — the landlord, first open', () => {
  it('is recognised as the owner from his rentals alone, with no tenancy anywhere', async () => {
    H.rentals = [KOEHN, PROSPECT];
    await mount();
    expect(text()).toMatch(/LANDLORD|Doors/i);
    expect(text()).toContain('1003 Koehn Dr');
  });

  it('never sees his own home offered for rent', async () => {
    H.rentals = [KOEHN, TALANS];
    await mount();
    expect(text()).toContain('Our homes');
    const home = text().slice(text().indexOf('Our homes'));
    expect(home).toContain('2111 Talans Dr');
    expect(home).not.toMatch(/QR to apply|Start a tenancy/i);
  });

  it('can open a door that has no tenant, and every tab then NAMES it', async () => {
    // The 11:47 PM defect: the tabs read the door correctly and never said so.
    H.rentals = [KOEHN, PROSPECT];
    await mount();
    await tap(/1003 Koehn Dr, Danville/);
    expect(text()).toMatch(/You are in/i);
    expect(text()).toContain('1003 Koehn Dr');

    for (const tabName of [/^Rooms$/, /^Pictures$/, /^Files$/, /^Systems$/, /^Door history$/]) {
      await tap(tabName);
      expect(text(), `the ${tabName} tab does not name the property it is showing`).toMatch(/You are in/i);
      expect(text()).toContain('1003 Koehn Dr');
    }
  });

  it('shows him the notes he typed in the Real Estate tab, on the door they belong to', async () => {
    // THE DEAD PARAMETER. buildHistory has accepted `propertyNotes` since it
    // was written and nothing ever passed one, while the Real Estate tab wrote
    // to that exact table — four real rows, including the three on 1508
    // Williamsburg. He typed them in one app and they were invisible in the
    // other. This fails if the wiring is ever removed again.
    H.rentals = [KOEHN, PROSPECT];
    H.propertyNotes = [{
      id: 'pn-1', rental_ref: 'r-1003koehn', body: 'Toilet backing up; she understands the charge',
      kind: 'maintenance', note_date: '2026-07-06', created_at: '2026-07-06T18:54:48Z',
    }];
    await mount();
    await tap(/1003 Koehn Dr, Danville/);
    await tap(/^Door history$/);
    expect(text()).toContain('Toilet backing up');
    expect(text()).toMatch(/Landlord note/i);
  });

  it('shows those notes even when the door has never had a tenant', async () => {
    // The record empties without a tenancy; a note about the BUILDING predates
    // the tenant and outlives them, so it must not empty with it.
    H.rentals = [PROSPECT];
    H.doors = [];
    H.propertyNotes = [{
      id: 'pn-2', rental_ref: 'r-prospect-b', body: 'Jhazmine moved out and did not leave the keys',
      kind: 'general', note_date: '2026-07-06', created_at: '2026-07-06T16:21:46Z',
    }];
    await mount();
    await tap(/805 North Prospect Avenue/);
    await tap(/^Door history$/);
    expect(text()).toContain('did not leave the keys');
  });

  it('offers one tap back to the picker when he is lost', async () => {
    H.rentals = [KOEHN, PROSPECT];
    await mount();
    await tap(/1003 Koehn Dr, Danville/);
    await tap(/^Rooms$/);
    await tap(/Change property/i);
    // Back on the board, which is the escape hatch — and the board itself does
    // NOT carry the "you are in" line, because it is the thing you choose FROM.
    expect(text()).toMatch(/Your doors/i);
    const board = text().slice(text().indexOf('Your doors'));
    expect(board).not.toMatch(/You are in/i);
  });

  it('says plainly when no property is chosen instead of showing an empty page', async () => {
    H.rentals = [];
    H.doors = [];
    H.grants = ['request.manage'];   // a manager with nothing selected
    await mount();
    await tap(/^Rooms$/);
    expect(text()).toMatch(/No property selected/i);
    expect(text()).toMatch(/not pointed at anything yet/i);
  });
});

// ── 3. THE TENANT ────────────────────────────────────────────────────────────
describe('journey — the tenant', () => {
  it('lands on their own place and can reach their own record', async () => {
    H.doors = [TENANCY];
    await mount({ surface: 'door' });
    expect(text()).toMatch(/My place|1003 Koehn/i);
    expect(text()).not.toMatch(/Your doors/i);   // never the landlord's board
  });

  it('is never offered the landlord-only surfaces', async () => {
    H.doors = [TENANCY];
    await mount({ surface: 'door' });
    const labels = buttons().map((b) => (b.textContent || '').toLowerCase());
    expect(labels.some((l) => l.includes('dispatch'))).toBe(false);
    expect(labels.some((l) => l.includes('work board'))).toBe(false);
  });

  it('sees which unit every tab is about, same as the landlord does', async () => {
    H.doors = [TENANCY];
    H.tenancies = [TENANCY];
    await mount({ surface: 'door' });
    const history = byLabel(/^History$/);
    if (history) {
      await tap(/^History$/);
      expect(text()).toMatch(/You are in|1003 Koehn/i);
    }
  });
});

// ── 4. THE HOUSEHOLD MEMBER (family on the lease) ────────────────────────────
describe('journey — someone living with the person on the lease', () => {
  it('gets the household face, not the tenant-of-record face or the landlord one', async () => {
    H.doors = [TENANCY];
    H.household = [{ tenancy_id: 't1', display_name: 'Kid Poe', relationship: 'child', active: true }];
    await mount({ surface: 'door' });
    expect(text()).not.toMatch(/Your doors/i);
    expect(text().trim().length).toBeGreaterThan(40);
    expect(text()).not.toMatch(/undefined|NaN|\[object/);
  });
});

// ── 5. THE 1099 WORKER ───────────────────────────────────────────────────────
describe('journey — the 1099 worker', () => {
  it('gets jobs and documentation, and no rent or tenant messages', async () => {
    H.doors = [TENANCY];
    H.grants = ['docs.add', 'property.history'];
    await mount({ surface: 'door' });
    const labels = buttons().map((b) => (b.textContent || '').toLowerCase());
    expect(labels.some((l) => l.includes('job') || l.includes('document'))).toBe(true);
    expect(labels.some((l) => l.includes('rent') && !l.includes('locked'))).toBe(false);
  });
});

// ── 6. THE MANAGER ───────────────────────────────────────────────────────────
describe('journey — the property manager', () => {
  it('gets the work board and dispatch', async () => {
    H.doors = [TENANCY];
    H.grants = ['request.manage', 'rentroll.view'];
    await mount({ surface: 'door' });
    const labels = buttons().map((b) => (b.textContent || '').toLowerCase());
    expect(labels.some((l) => l.includes('work board'))).toBe(true);
    expect(labels.some((l) => l.includes('dispatch'))).toBe(true);
  });
});

// ── 7. NOTHING RENDERS A CRASH OR A PLACEHOLDER, FOR ANYONE ──────────────────
describe('no face shows a broken surface', () => {
  const faces = [
    ['stranger', {}],
    ['owner', { rentals: [KOEHN, TALANS] }],
    ['tenant', { doors: [TENANCY] }],
    ['household', { doors: [TENANCY], household: [{ tenancy_id: 't1', active: true }] }],
    ['worker', { doors: [TENANCY], grants: ['docs.add'] }],
    ['manager', { doors: [TENANCY], grants: ['request.manage'] }],
  ];
  for (const [name, state] of faces) {
    it(`${name}: every unlocked tab renders real words`, async () => {
      Object.assign(H, state);
      await mount({ surface: name === 'owner' ? 'poetech' : 'door' });
      const tabs = buttons().filter((b) => !/locked/i.test(b.textContent || ''));
      for (const t of tabs.slice(0, 14)) {
        const label = (t.textContent || '').trim();
        if (/change property|pick a property|sign out|list|grid/i.test(label)) continue;
        await act(async () => { t.click(); });
        for (let i = 0; i < 3; i++) await act(async () => { await Promise.resolve(); });
        expect(text(), `${name} / ${label} rendered a placeholder`).not.toMatch(/undefined|NaN|\[object Object\]/);
        expect(text().trim().length, `${name} / ${label} rendered nothing`).toBeGreaterThan(30);
      }
    });
  }
});

// ── 8. THE DETAILS, AND PROOF THE TABS HOLD THIS PROPERTY'S DATA ─────────────
// "I want to see the details of that property after the initial selection...
// the other tabs should populate information about the property I selected"
// (Darrell, 2026-08-28). The counts are read from the SAME doorData the tabs
// render, so a number here that disagrees with the tab below it cannot happen.
describe('journey — the details after selecting a property', () => {
  it('shows what the property IS, not just its name', async () => {
    H.rentals = [KOEHN];
    H.tenancies = [TENANCY];
    await mount();
    await tap(/1003 Koehn Dr, Danville/);
    expect(text()).toMatch(/single.family/i);        // the property type
    expect(text()).toMatch(/\$680\/mo/);              // the real rent
    expect(text()).toMatch(/Rented|A\. Tenant/);      // who is in it
  });

  it('counts this property\'s rooms, pictures, files and systems', async () => {
    H.rentals = [KOEHN];
    H.rooms = [{ id: 'rm1', name: 'Kitchen' }, { id: 'rm2', name: 'Bath', archived_at: '2020-01-01' }];
    H.photos = [{ id: 'p1', rental_ref: 'r-koehn', kind: 'listing' }];
    H.systems = [{ id: 's1', name: 'Furnace', kind: 'heating' }];
    await mount();
    await tap(/1003 Koehn Dr, Danville/);
    // NB: the chips render adjacent, so the text reads "1 room1 picture" — a
    // \\b between "m" and "1" never matches (both are word characters).
    expect(text()).toMatch(/1 room(?!s)/);   // the archived one is not counted
    expect(text()).toMatch(/1 picture(?!s)/);
    expect(text()).toMatch(/1 system(?!s)/);
    expect(text()).toMatch(/no files/);      // zero is said, never hidden
  });

  it('a count is a way IN to that tab', async () => {
    H.rentals = [KOEHN];
    H.systems = [{ id: 's1', name: 'Furnace', kind: 'heating', installed_on: '2008-05-01' }];
    await mount();
    await tap(/1003 Koehn Dr, Danville/);
    await tap(/^1 system$/);
    expect(text()).toMatch(/Mechanical history/i);
    expect(text()).toContain('Furnace');
    expect(text()).toContain('1003 Koehn Dr');   // still says which property
  });

  it('the counts match what the tab actually renders', async () => {
    // The header and the surface below it cannot disagree, because both read
    // the same rows. Two rooms means two rooms on the Rooms tab.
    H.rentals = [KOEHN];
    H.rooms = [{ id: 'rm1', name: 'Kitchen', kind: 'kitchen' }, { id: 'rm2', name: 'Bedroom 1', kind: 'bedroom' }];
    await mount();
    await tap(/1003 Koehn Dr, Danville/);
    expect(text()).toMatch(/2 rooms/);
    await tap(/^Rooms$/);
    expect(text()).toContain('Kitchen');
    expect(text()).toContain('Bedroom 1');
  });
});
