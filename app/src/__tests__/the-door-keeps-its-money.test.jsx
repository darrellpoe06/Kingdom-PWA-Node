// =============================================================================
// THE DOOR KEEPS ITS MONEY, WITH OR WITHOUT A TENANT (DR-0903, migration 0265)
// =============================================================================
// Darrell, 2026-10-10, on the Rent tab: "How to add payments to the historical
// events?" — and: "We want the historical money for each property to be
// available... with or without the tenants information... so the door always
// pays... the most important thing is to see how much money is being
// accumulated by each asset."
//
// The pure half: confirmed money is received, a reported payment is never
// added to it, a door with nothing says so and never reads $0, a day not yet
// come is refused. The mounted half: the landlord on an EMPTY door records a
// payment received months ago and it is written on the door, confirmed, on
// the day it came; the board and the door header carry each asset's total.
// The database half is infra/supabase/tests/0265-door-money-smoke.sql.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { doorMoney, moneyByDoor, moneyLine, buildReceivedPayment } from '../modules/properties/door-money.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({
  rentals: [], doors: [], grants: [], household: [], invites: [], record: null, session: null,
  assigns: [], statuses: [], notes: [], filed: [], recordCalls: [], jobDocs: [], proofs: [],
  money: [], rentWrites: [],
}));

vi.mock('../modules/properties/cloud.js', () => {
  const noop = async () => ({ ok: true });
  return {
    claimPropertyAccess: async () => ({ ok: true }),
    loadMyDoors: async () => ({ ok: true, doors: H.doors }),
    loadMyGrants: async () => ({ ok: true, grants: H.grants, byScope: {}, roleLabel: null }),
    loadMyHousehold: async () => ({ ok: true, memberships: H.household }),
    loadMyRentals: async () => ({ ok: true, rentals: H.rentals }),
    loadInvites: async () => ({ ok: true, invites: H.invites }),
    loadPublicVacancies: async () => ({ ok: true, vacancies: [] }),
    loadVacancyPhotos: async () => ({ ok: true, photos: [] }),
    loadAllPhotos: async () => ({ ok: true, photos: [] }),
    loadPhotoImages: async () => ({ ok: true, images: {} }),
    hydrateLegacyImages: async (photos) => photos,
    loadDoorRecord: async (tenancyId, opts) => { H.recordCalls.push([tenancyId, opts]); return ({ ok: true, requests: [], messages: [], notes: [], docs: [], rent: [], notices: [], ...(H.record || {}) }); },
    loadRooms: async () => ({ ok: true, rooms: [] }),
    loadDoorPhotos: async () => ({ ok: true, photos: [] }),
    loadDoorTenancies: async () => ({ ok: true, tenancies: [] }),
    loadDocuments: async () => ({ ok: true, documents: [] }),
    loadSystems: async () => ({ ok: true, systems: [] }),
    loadSystemEvents: async () => ({ ok: true, events: [] }),
    loadDoorNotes: async () => ({ ok: true, notes: [] }),
    addSystem: noop, patchSystem: noop, addSystemEvent: noop,
    // The guest card on the Work board (DR-0898): off on every door here.
    loadGuestLink: async () => ({ ok: true, token: null }), openGuestLink: async () => ({ ok: true, token: null }), closeGuestLink: async () => ({ ok: true }),
    // Rent hand-off and the change clock (DR-0899): nothing set, nothing logged.
    loadRecordEvents: async () => ({ ok: true, events: [] }), loadDoorMoney: async () => ({ ok: true, months: H.money }),
    loadDoorPapers: async () => ({ ok: true, documents: [] }), loadSignatures: async () => ({ ok: true, signatures: [] }),
    requestSignatures: async () => ({ ok: true }), signDocument: async () => ({ ok: true }),
    doorOfMyTenancy: async () => ({ ok: true, rentalId: null }), loadDoorStays: async () => ({ ok: true, rows: [] }), loadBookedNights: async () => ({ ok: true, ranges: [] }), requestAStay: async () => ({ ok: true }), addDoorStay: async () => ({ ok: true }), decideStay: async () => ({ ok: true }), loadCameraMenu: async () => ({ ok: true, menu: [] }), loadCameraAccess: async () => ({ ok: true, rows: [] }),
    saveCameraMenu: async () => ({ ok: true }), askForCameras: async () => ({ ok: true }), decideCameraAccess: async () => ({ ok: true }), giveCameraAccess: async () => ({ ok: true }), loadPayeeForTenancy: async () => ({ ok: true, payee: null }),
    loadRentPayee: async () => ({ ok: true, payee: null }), saveRentPayee: async () => ({ ok: true }),
    fileWorkOrder: async (row) => { H.filed.push(row); return { ok: true, row: { id: 'req-new', ...row } }; },
    setWorkOrderStatus: async (id, status) => { H.statuses.push([id, status]); return { ok: true }; },
    assignWorkOrder: async (id, a) => { H.assigns.push({ id, ...a }); return { ok: true }; },
    postMessage: noop,
    postNote: async (row) => { H.notes.push(row); return { ok: true }; },
    postJobDoc: async (row) => { H.jobDocs.push(row); return { ok: true }; },
    setWorkOrderProof: async (id, proof) => { H.proofs.push([id, proof]); return { ok: true }; },
    loadJobVideo: async () => ({ ok: true, video: 'data:video/mp4;base64,AAAA' }),
    recordRent: async (row) => { H.rentWrites.push(row); return { ok: true }; }, confirmRent: noop, markRentPosted: noop,
    inviteToProperties: noop, createTenancy: noop,
    addRoom: noop, patchRoom: noop, updateTenancy: noop, updateRental: noop,
    addPhoto: noop, patchPhoto: noop, addDocument: noop, patchDocument: noop,
    submitApplication: noop,
  };
});

vi.mock('../lib/supabase.js', () => ({
  default: { auth: { getSession: async () => ({ data: { session: H.session } }) } },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
}));

// Phone photos are shrunk on a canvas jsdom does not have; the shrink is its
// own unit's business, so here it answers with a fixed small JPEG.
vi.mock('../lib/image.js', () => ({
  compressImageFile: async () => 'data:image/jpeg;base64,SMALL',
  isLikelyImageFile: (f) => /^image\//.test((f && f.type) || ''),
  compressImageToFile: async (f) => f,
  fileToDataUrl: async () => 'data:image/jpeg;base64,SMALL',
}));
import PropertiesApp from '../modules/properties/PropertiesApp.jsx';

let container, root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  Object.assign(H, { rentals: [], doors: [], grants: [], household: [], invites: [], record: null, session: null, assigns: [], statuses: [], notes: [], filed: [], recordCalls: [], jobDocs: [], proofs: [], money: [], rentWrites: [] });
});

async function mount(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesApp, { surface: 'door', ...props })); });
  for (let i = 0; i < 8; i += 1) await act(async () => { await Promise.resolve(); });
}
const text = () => container.textContent || '';
const buttons = () => [...container.querySelectorAll('button')];
async function tap(re) {
  const b = buttons().find((x) => re.test((x.textContent || '').trim()));
  if (!b) throw new Error(`no button matching ${re}. Saw: ${buttons().map((x) => x.textContent.trim()).join(' | ')}`);
  await act(async () => { b.click(); });
  for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); });
}

const APT2 = { id: 'r-apt2', slug: 'r-805-apt2', instance_id: 'i1', address: '805 North Prospect Avenue', unit: 'Apt 2', city: 'Champaign', state: 'IL', zip: '61820', status: 'vacant', property_type: 'multi-family', monthly_rent: null, display_name: '805 North Prospect Avenue Apt 2' };
const KOEHN = { id: 'r-koehn', slug: 'r-1003koehn', instance_id: 'i1', address: '1003 Koehn Dr', city: 'Danville', state: 'IL', status: 'paying', property_type: 'single-family', monthly_rent: 680, display_name: '1003 Koehn Dr, Danville' };
const KOEHN_TENANCY = { id: 't1', instance_id: 'i1', rental_ref: 'r-1003koehn', property_label: '1003 Koehn Dr', unit_label: null, tenant_name: 'A. Tenant', lease_start: '2026-01-01', monthly_rent: 680, status: 'active' };

async function pickDoor(label) {
  const b = buttons().find((x) => (x.textContent || '').includes(label));
  if (!b) throw new Error(`no door button containing ${label}`);
  await act(async () => { b.click(); });
  for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
}
async function type(label, value) {
  const input = container.querySelector(`input[aria-label="${label}"]`);
  if (!input) throw new Error(`no field labelled ${label}`);
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => { setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
}

const MONTHS = [
  { rental_id: 'r-apt2', instance_id: 'i1', month: '2025-01-01', received: '400.00', payments: 1, awaiting: 0, awaiting_count: 0, without_tenant: 1 },
  { rental_id: 'r-koehn', instance_id: 'i1', month: '2025-06-01', received: 650, payments: 1, awaiting: 0, awaiting_count: 0, without_tenant: 0 },
  { rental_id: 'r-koehn', instance_id: 'i1', month: '2026-09-01', received: 680, payments: 1, awaiting: 0, awaiting_count: 0, without_tenant: 0 },
  { rental_id: 'r-koehn', instance_id: 'i1', month: '2026-10-01', received: 0, payments: 0, awaiting: 700, awaiting_count: 1, without_tenant: 0 },
];
const TODAY = new Date('2026-10-10T12:00:00');

describe('what each door has brought in (pure)', () => {
  it('confirmed money is received; a reported payment is named beside it, never added', () => {
    const k = doorMoney(MONTHS, 'r-koehn', TODAY);
    expect(k.received).toBe(1330);
    expect(k.awaiting).toBe(700);
    expect(k.thisYear).toBe(680);
    expect(k.years).toEqual([{ year: '2026', received: 680, payments: 1 }, { year: '2025', received: 650, payments: 1 }]);
    expect(k.months.map((m) => m.month)).toEqual(['2026-10', '2026-09', '2025-06']);
    expect(k.firstMonth).toBe('2025-06');
    expect(k.lastMonth).toBe('2026-09');
  });

  it('the door with no tenant keeps its money too, and the portfolio adds every door', () => {
    const all = moneyByDoor(MONTHS, TODAY);
    expect(all.doors.get('r-apt2').received).toBe(400);
    expect(all.doors.get('r-apt2').withoutTenant).toBe(1);
    expect(all.received).toBe(1730);
    expect(all.thisYear).toBe(680);
    expect(all.doorsWithMoney).toBe(2);
  });

  it('PROVEN-TO-CATCH: a door with nothing recorded never reads as $0', () => {
    const none = doorMoney(MONTHS, 'r-nothing', TODAY);
    expect(none.known).toBe(false);
    expect(moneyLine(none)).toBe('no money recorded yet');
    expect(moneyLine(undefined)).toBe('no money recorded yet');
    expect(moneyLine(none)).not.toMatch(/\$0/);
    expect(moneyLine(doorMoney(MONTHS, 'r-koehn', TODAY))).toBe('$1,330.00 brought in since 2025-06');
  });

  it('a payment received: past days are the point, a day not yet come is refused', () => {
    const ok = buildReceivedPayment({ amount: '400', paidOn: '2025-01-15', period: '', method: 'cash', from: 'Short stay guest', note: 'Two weeks', today: '2026-10-10' });
    expect(ok.ok).toBe(true);
    expect(ok.row).toEqual({ amount: 400, paid_on: '2025-01-15', for_period: '2025-01', method: 'cash', memo: 'From Short stay guest \u2014 Two weeks' });
    const future = buildReceivedPayment({ amount: '10', paidOn: '2026-11-01', period: '2026-11', method: 'cash', today: '2026-10-10' });
    expect(future.ok).toBe(false);
    expect(future.errors.paidOn).toMatch(/not come/);
    expect(buildReceivedPayment({ amount: '0', paidOn: '2026-10-01', method: 'cash', today: '2026-10-10' }).errors.amount).toBeTruthy();
    expect(buildReceivedPayment({ amount: '5', paidOn: '2026-10-01', method: 'bitcoin', today: '2026-10-10' }).errors.method).toBeTruthy();
  });
});

describe('the landlord records money on a door nobody lives in', () => {
  it('805 Apt 2, no tenancy: a payment received in January is written on the door, confirmed, on the day it came', async () => {
    H.rentals = [APT2]; H.doors = []; H.money = MONTHS;
    await mount();
    await pickDoor('805 North Prospect Avenue');
    await tap(/^Rent$/);
    expect(text()).toContain('Record a payment received');
    expect(text()).toContain('$400.00');
    await type('Amount received', '400');
    await type('The day it came', '2025-01-15');
    await type('From whom', 'Short stay guest');
    await tap(/^Cash$/);
    await tap(/^Record it$/);
    expect(H.rentWrites).toHaveLength(1);
    const w = H.rentWrites[0];
    expect(w).toMatchObject({
      instanceId: 'i1', tenancyId: null, rentalId: 'r-apt2', amount: 400, paidOn: '2025-01-15',
      forPeriod: '2025-01', method: 'cash', status: 'confirmed', role: 'landlord',
    });
    expect(w.memo).toContain('Short stay guest');
    expect(text()).toContain('It is in Payment history, History, and the totals.');
  });

  it('a rented door records against its tenancy and still names the door', async () => {
    H.rentals = [KOEHN]; H.doors = [KOEHN_TENANCY]; H.money = MONTHS;
    await mount();
    await pickDoor('1003 Koehn');
    await tap(/^Rent$/);
    await type('Amount received', '680');
    await tap(/^Zelle$/);
    await tap(/^Record it$/);
    expect(H.rentWrites[0]).toMatchObject({ tenancyId: 't1', rentalId: 'r-koehn', amount: 680, status: 'confirmed' });
    // Who paid is the tenancy; the form does not ask again.
    expect(container.querySelector('input[aria-label="From whom"]')).toBeNull();
  });

  it('the Doors board carries each asset\'s total and the whole portfolio', async () => {
    H.rentals = [APT2, KOEHN]; H.doors = [KOEHN_TENANCY]; H.money = MONTHS;
    await mount();
    const board = container.querySelector('[data-testid="portfolio-money"]');
    expect(board && board.textContent).toContain('$1,730.00 brought in across 2 doors');
    expect(board.textContent).toContain('$700.00 reported, not yet confirmed');
    const cards = [...container.querySelectorAll('[data-testid="door-card-money"]')].map((n) => n.textContent);
    expect(cards).toContain('$400.00 brought in since 2025-01');
    expect(cards).toContain('$1,330.00 brought in since 2025-06');
  });

  it('a tenant never sees the family\'s money card or the record form', async () => {
    H.rentals = []; H.doors = [{ ...KOEHN_TENANCY, tenant_user_id: 'u-t' }]; H.money = MONTHS;
    H.session = { user: { id: 'u-t' } };
    await mount();
    const rent = buttons().find((b) => /^Payments$/.test((b.textContent || '').trim()));
    if (rent) { await act(async () => { rent.click(); }); for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); }); }
    expect(text()).not.toContain('Record a payment received');
    expect(container.querySelector('[data-testid="door-money"]')).toBeNull();
    expect(container.querySelector('[data-testid="portfolio-money"]')).toBeNull();
  });
});
