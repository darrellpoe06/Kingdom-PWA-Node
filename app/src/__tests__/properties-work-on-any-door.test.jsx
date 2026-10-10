// =============================================================================
// Work is filed on the DOOR, not only on a tenancy (DR-0897)
// =============================================================================
// Darrell, 2026-10-10, on the Work Board for 805 North Prospect Avenue Apt 2
// ("No tenancy on this door"), with the job typed and File it greyed out:
// "Can't file a workorder in the Poe Properties App?!!!! Fix it!!!!!!" and
// "Any property including our home... if we want to have a 1099 worker come
// take care of work... right?!!!!!" and "even a person walking through an
// Airbnb or short-term rental works great for getting work done or issues
// with systems or cleaning done asap".
//
// The real app mounted with only what the database returns for each seat:
// the landlord files on a vacant door and on the family's own home with NO
// tenancy and the row names the door; a vacant door picked by its rentals id
// never borrows another door's tenancy; a 1099 worker walking a door he was
// granted files what he sees and documents it, and the rows name that door.
// The database half is proven by infra/supabase/tests/0260-door-work-orders-smoke.sql.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({
  rentals: [], doors: [], grants: [], household: [], invites: [], record: null, session: null,
  assigns: [], statuses: [], notes: [], filed: [], recordCalls: [], jobDocs: [],
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
    loadRecordEvents: async () => ({ ok: true, events: [] }), loadPayeeForTenancy: async () => ({ ok: true, payee: null }),
    loadRentPayee: async () => ({ ok: true, payee: null }), saveRentPayee: async () => ({ ok: true }),
    fileWorkOrder: async (row) => { H.filed.push(row); return { ok: true, row: { id: 'req-new', ...row } }; },
    setWorkOrderStatus: async (id, status) => { H.statuses.push([id, status]); return { ok: true }; },
    assignWorkOrder: async (id, a) => { H.assigns.push({ id, ...a }); return { ok: true }; },
    postMessage: noop,
    postNote: async (row) => { H.notes.push(row); return { ok: true }; },
    postJobDoc: async (row) => { H.jobDocs.push(row); return { ok: true }; },
    recordRent: noop, confirmRent: noop, markRentPosted: noop,
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
  Object.assign(H, { rentals: [], doors: [], grants: [], household: [], invites: [], record: null, session: null, assigns: [], statuses: [], notes: [], filed: [], recordCalls: [], jobDocs: [] });
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
const HOME = { id: 'r-home', slug: 'r-home', instance_id: 'i1', address: '2 Home Lane', city: 'Champaign', state: 'IL', status: 'owner-occupied', property_type: 'primary-home', display_name: 'Our Home' };
const KOEHN = { id: 'r-koehn', slug: 'r-1003koehn', instance_id: 'i1', address: '1003 Koehn Dr', city: 'Danville', state: 'IL', status: 'paying', property_type: 'single-family', monthly_rent: 680, display_name: '1003 Koehn Dr, Danville' };
const KOEHN_TENANCY = { id: 't1', instance_id: 'i1', rental_ref: 'r-1003koehn', property_label: '1003 Koehn Dr', unit_label: null, tenant_name: 'A. Tenant', lease_start: '2026-01-01', monthly_rent: 680, status: 'active' };
const JOB = 'Add a microwave and cabinet with exhaust fan inside the kitchen.';

async function pickDoor(label) {
  const b = buttons().find((x) => (x.textContent || '').includes(label));
  if (!b) throw new Error(`no door button containing ${label}. Saw: ${buttons().map((x) => x.textContent.trim()).join(' | ')}`);
  await act(async () => { b.click(); });
  for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
}
async function typeJob(value) {
  const input = container.querySelector('input[aria-label="What is wrong"]');
  if (!input) throw new Error('no "What is wrong" field on this tab');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => { setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
}
const fileIt = () => buttons().find((b) => /^File it$/i.test((b.textContent || '').trim()));

describe('the landlord files on a door nobody lives in', () => {
  it('805 Apt 2, no tenancy: File it is live, and the work order names the door, not a tenancy', async () => {
    H.rentals = [APT2]; H.doors = [];
    await mount();
    await pickDoor('805 North Prospect Avenue');
    await tap(/^Work board$/);
    expect(text()).toContain('You are in');
    expect(H.recordCalls.at(-1)).toEqual([null, { rentalId: 'r-apt2' }]);
    expect(fileIt().disabled).toBe(true);
    await typeJob(JOB);
    expect(fileIt().disabled).toBe(false);
    await tap(/^File it$/i);
    expect(H.filed).toHaveLength(1);
    expect(H.filed[0]).toMatchObject({ instance_id: 'i1', tenancy_id: null, rental_id: 'r-apt2', created_by_role: 'landlord', title: JOB, status: 'submitted' });
    expect(text()).toContain('Work order filed.');
  });

  it('a vacant door picked beside a rented one never borrows the rented door\'s tenancy', async () => {
    H.rentals = [APT2, KOEHN]; H.doors = [KOEHN_TENANCY];
    await mount();
    await pickDoor('805 North Prospect Avenue');
    await tap(/^Work board$/);
    await typeJob(JOB);
    await tap(/^File it$/i);
    expect(H.filed[0]).toMatchObject({ tenancy_id: null, rental_id: 'r-apt2' });
    expect(H.filed[0].tenancy_id).not.toBe('t1');
  });

  it('a rented door files through its tenancy and still names the door', async () => {
    H.rentals = [KOEHN]; H.doors = [KOEHN_TENANCY];
    await mount();
    await tap(/^Work board$/);
    expect(H.recordCalls.at(-1)).toEqual(['t1', { rentalId: 'r-koehn' }]);
    await typeJob('Leaking kitchen faucet');
    await tap(/^File it$/i);
    expect(H.filed[0]).toMatchObject({ tenancy_id: 't1', rental_id: 'r-koehn', created_by_role: 'landlord' });
  });

  it('the family\'s own home takes a work order too', async () => {
    H.rentals = [APT2, HOME]; H.doors = [];
    await mount();
    await pickDoor('Our Home');
    await tap(/^Work board$/);
    await typeJob('Replace the furnace filter');
    await tap(/^File it$/i);
    expect(H.filed[0]).toMatchObject({ tenancy_id: null, rental_id: 'r-home', instance_id: 'i1' });
  });
});

describe('the 1099 worker walking a door he was granted', () => {
  it('files what he sees as a worker, and his "fixed" documents the job on that door', async () => {
    H.rentals = [APT2]; H.doors = []; H.grants = ['docs.add', 'property.history'];
    H.session = { user: { id: 'u-mike' } };
    H.record = { requests: [{ id: 'req9', rental_id: 'r-apt2', tenancy_id: null, title: 'Stain on the couch', status: 'submitted', assigned_to: 'u-mike', assigned_to_label: 'Mike', created_at: '2026-10-10T12:00:00Z' }] };
    await mount();
    await pickDoor('805 North Prospect Avenue');
    await tap(/^My jobs$/);
    await typeJob('Exhaust fan rattles');
    await tap(/^File it$/i);
    expect(H.filed[0]).toMatchObject({ tenancy_id: null, rental_id: 'r-apt2', created_by_role: 'worker' });
    await tap(/^Fixed$/);
    expect(H.jobDocs).toHaveLength(1);
    expect(H.jobDocs[0]).toMatchObject({ request_id: 'req9', rental_id: 'r-apt2', tenancy_id: null, outcome: 'fixed' });
  });
});

describe('a picture on a work order (DR-0901: "pictures for documentation... For workorders")', () => {
  it('a report filed with a picture lands the picture on the new job, as documentation with no outcome', async () => {
    H.rentals = [APT2]; H.doors = [];
    await mount();
    await pickDoor('805 North Prospect Avenue');
    await tap(/^Work board$/);
    await typeJob('Water under the sink');
    const pic = container.querySelector('input[aria-label="Add a picture to this report"]');
    const file = new File([new Uint8Array([1, 2, 3])], 'sink.jpg', { type: 'image/jpeg' });
    await act(async () => { Object.defineProperty(pic, 'files', { value: [file] }); pic.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(text()).toContain('Picture: sink.jpg');
    await tap(/^File it$/i);
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
    expect(H.filed[0]).toMatchObject({ rental_id: 'r-apt2', title: 'Water under the sink' });
    expect(H.jobDocs).toHaveLength(1);
    expect(H.jobDocs[0]).toMatchObject({ request_id: 'req-new', rental_id: 'r-apt2', tenancy_id: null, outcome: null, image_data: 'data:image/jpeg;base64,SMALL' });
    expect(text()).toContain('Work order filed with its picture.');
  });
  it('a picture already on a job shows on the board with its time', async () => {
    H.rentals = [APT2]; H.doors = [];
    H.record = {
      requests: [{ id: 'req9', rental_id: 'r-apt2', title: 'Stain on the couch', status: 'submitted', created_at: '2026-10-10T12:00:00Z' }],
      docs: [{ id: 'doc1', request_id: 'req9', outcome: null, note: 'Left cushion', image_data: 'data:image/jpeg;base64,SEEN', created_at: '2026-10-10T12:03:00Z' }],
    };
    await mount();
    await pickDoor('805 North Prospect Avenue');
    await tap(/^Work board$/);
    const doc = container.querySelector('[data-testid="job-doc"]');
    expect(doc.textContent).toContain('Picture: Left cushion');
    expect(doc.querySelector('img').getAttribute('src')).toBe('data:image/jpeg;base64,SEEN');
    expect(container.querySelector('input[aria-label="Add a picture to Stain on the couch"]')).not.toBeNull();
  });
});
