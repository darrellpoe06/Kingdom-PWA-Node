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
import { proofState, proofNotice } from '../modules/properties/proof.js';
import { dispatchText } from '../modules/properties/dispatch-roster.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({
  rentals: [], doors: [], grants: [], household: [], invites: [], record: null, session: null,
  assigns: [], statuses: [], notes: [], filed: [], recordCalls: [], jobDocs: [], proofs: [],
  // The pictures of a door and its rooms, and the door a tenancy resolves to
  // (door_of_my_tenancy) — what 0309 lets a tenant read (DR-1199).
  doorPhotos: [], rooms: [], askDoor: null, claimGate: null,
}));

vi.mock('../modules/properties/cloud.js', () => {
  const noop = async () => ({ ok: true });
  return {
    // A gate the reload waits on, so a test can hold a boot mid-way (DR-1199).
    claimPropertyAccess: async () => { if (H.claimGate) await H.claimGate; return { ok: true }; },
    loadMyDoors: async () => ({ ok: true, doors: H.doors }),
    loadMyGrants: async () => ({ ok: true, grants: H.grants, byScope: {}, roleLabel: null }),
    loadMyHousehold: async () => ({ ok: true, memberships: H.household }),
    loadMyRentals: async () => ({ ok: true, rentals: H.rentals }),
    // The landlord seat beside the spine (DR-1007): none, the ordinary family case.
    loadMyLandlordSeat: async () => ({ ok: true, seat: null }),
    addRental: async () => ({ ok: true, row: null }),
    loadInvites: async () => ({ ok: true, invites: H.invites }),
    loadPublicVacancies: async () => ({ ok: true, vacancies: [] }),
    loadVacancyPhotos: async () => ({ ok: true, photos: [] }),
    loadAllPhotos: async () => ({ ok: true, photos: H.doorPhotos }),
    loadPhotoImages: async () => ({ ok: true, images: {} }),
    hydrateLegacyImages: async (photos) => photos,
    loadDoorRecord: async (tenancyId, opts) => { H.recordCalls.push([tenancyId, opts]); return ({ ok: true, requests: [], messages: [], notes: [], docs: [], rent: [], notices: [], ...(H.record || {}) }); },
    loadRooms: async () => ({ ok: true, rooms: H.rooms }),
    // The rest of the apartment (DR-0963). Stubbed empty: these suites are
    // about a single door, and a door with no siblings is the ordinary case.
    loadSiblingPhotos: async () => ({ ok: true, photos: [], siblings: [] }),
    loadDoorPhotoOrders: async () => ({ ok: true, orders: {} }),
  loadDoorAreas: async () => ({ ok: false }), saveDoorPhotoOrder: async () => ({ ok: true, saved: 0 }),
  loadDoorArchives: async () => ({ ok: true, channels: {}, heldAt: {} }),
  loadDoorPhotoSources: async () => ({ ok: true, sources: {} }),
    loadDoorPhotos: async (ref) => (ref ? { ok: true, photos: H.doorPhotos } : { ok: true, photos: [] }),
    loadDoorTenancies: async () => ({ ok: true, tenancies: [] }),
    loadDocuments: async () => ({ ok: true, documents: [] }),
    loadSystems: async () => ({ ok: true, systems: [] }),
    loadSystemEvents: async () => ({ ok: true, events: [] }),
    loadDoorNotes: async () => ({ ok: true, notes: [] }),
    addSystem: noop, patchSystem: noop, addSystemEvent: noop,
    // The guest card on the Work board (DR-0898): off on every door here.
    loadGuestLink: async () => ({ ok: true, token: null }), openGuestLink: async () => ({ ok: true, token: null }), closeGuestLink: async () => ({ ok: true }),
    // Rent hand-off and the change clock (DR-0899): nothing set, nothing logged.
    loadRecordEvents: async () => ({ ok: true, events: [] }), loadDoorMoney: async () => ({ ok: true, months: [] }),
    loadDoorPapers: async () => ({ ok: true, documents: [] }), loadSignatures: async () => ({ ok: true, signatures: [] }),
    requestSignatures: async () => ({ ok: true }), signDocument: async () => ({ ok: true }),
    doorOfMyTenancy: async () => ({ ok: true, rentalId: H.askDoor }), loadDoorStays: async () => ({ ok: true, rows: [] }), loadBookedNights: async () => ({ ok: true, ranges: [] }), loadDoorArea: async () => ({ ok: true, area: null, nearby: [] }), requestAStay: async () => ({ ok: true }), addDoorStay: async () => ({ ok: true }), decideStay: async () => ({ ok: true }), loadCameraMenu: async () => ({ ok: true, menu: [] }), loadCameraAccess: async () => ({ ok: true, rows: [] }),
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
  Object.assign(H, { rentals: [], doors: [], grants: [], household: [], invites: [], record: null, session: null, assigns: [], statuses: [], notes: [], filed: [], recordCalls: [], jobDocs: [], proofs: [] , doorPhotos: [], rooms: [], askDoor: null , claimGate: null });
});

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
    expect(H.recordCalls.at(-1)).toEqual([null, { rentalId: 'r-apt2', earlierTenancyIds: [] }]);
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
    expect(H.recordCalls.at(-1)).toEqual(['t1', { rentalId: 'r-koehn', earlierTenancyIds: [] }]);
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

describe('a picture on a work order (DR-0936: "pictures for documentation... For workorders")', () => {
  it('a report filed with several pictures (one taken, two chosen) lands each on the new job, as documentation with no outcome', async () => {
    H.rentals = [APT2]; H.doors = [];
    await mount();
    await pickDoor('805 North Prospect Avenue');
    await tap(/^Work board$/);
    await typeJob('Water under the sink');
    const put = async (label, files) => {
      const el = container.querySelector(`input[aria-label="${label}"]`);
      await act(async () => { Object.defineProperty(el, 'files', { value: files, configurable: true }); el.dispatchEvent(new Event('change', { bubbles: true })); });
    };
    const jpg = (n) => new File([new Uint8Array([1, 2, 3])], n, { type: 'image/jpeg' });
    await put('Add a picture to this report', [jpg('sink.jpg')]);
    await put('Choose pictures for this report', [jpg('pipe.jpg'), jpg('floor.jpg')]);
    expect(container.querySelector('[data-testid="report-pictures"]').textContent).toContain('3 pictures ready');
    await tap(/^File it$/i);
    for (let i = 0; i < 10; i += 1) await act(async () => { await Promise.resolve(); });
    expect(H.filed[0]).toMatchObject({ rental_id: 'r-apt2', title: 'Water under the sink' });
    expect(H.jobDocs).toHaveLength(3);
    expect(H.jobDocs.every((d) => d.request_id === 'req-new' && d.rental_id === 'r-apt2' && d.tenancy_id === null && d.outcome === null && d.image_data === 'data:image/jpeg;base64,SMALL')).toBe(true);
    expect(text()).toContain('Work order filed with 3 pictures.');
  });
  it('an empty unit\'s own record reads "Empty", never "Rented"', async () => {
    H.rentals = [APT2];
    H.doors = [{ id: 't-unit', instance_id: 'i1', rental_ref: 'r-805-apt2', property_label: '805 North Prospect Avenue', unit_label: 'Apt 2', tenant_name: null, tenant_user_id: null, status: 'pending' }];
    await mount();
    await tap(/^Work board$/);
    expect(text()).toContain('Empty \u2014 nobody living here yet');
    expect(text()).not.toContain('Rented');
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

describe('proof before payment (DR-0937: "pictures to document the work... mandatory for payment... video when necessary")', () => {
  const JOB = { id: 'req7', title: 'Install microwave', proof_required: 'photos-and-video', proof_note: 'the microwave mounted and the fan running', status: 'scheduled' };
  it('says what is required, counts it, and says ready to pay only when the proof is in AND it is fixed', () => {
    expect(proofNotice(JOB)).toBe('Pictures and a video of the microwave mounted and the fan running are required for payment. Add them on the job before marking it fixed.');
    expect(proofNotice({ proof_required: 'none' })).toBe('');
    expect(proofState(JOB, []).line).toBe('Proof for payment: 0 pictures, 0 videos. Still needed: a picture of the finished work and a video of the finished work');
    const pic = { request_id: 'req7', image_data: 'data:image/jpeg;base64,A' };
    const vid = { request_id: 'req7', has_video: true };
    expect(proofState(JOB, [pic]).missing).toEqual(['a video of the finished work']);
    expect(proofState(JOB, [pic, vid]).line).toBe('Proof complete (1 picture, 1 video); waiting for "Fixed"');
    expect(proofState(JOB, [pic, vid, { request_id: 'req7', outcome: 'fixed' }]).payable).toBe(true);
    expect(proofState({ ...JOB, proof_required: 'none' }, []).line).toBe('');
  });
  it('the dispatch text tells the worker before he starts', () => {
    const t = dispatchText({ door: null, rental: APT2, request: JOB });
    expect(t).toContain('Install microwave');
    expect(t.split('\n').pop()).toBe(proofNotice(JOB));
  });
  it('the family sets the proof on a job, and the board shows the notice and what is still needed', async () => {
    H.rentals = [APT2]; H.doors = [];
    H.record = { requests: [{ ...JOB, rental_id: 'r-apt2', created_at: '2026-10-10T12:00:00Z' }], docs: [{ id: 'p1', request_id: 'req7', image_data: 'data:image/jpeg;base64,A', created_at: '2026-10-10T12:05:00Z' }] };
    await mount();
    await pickDoor('805 North Prospect Avenue');
    await tap(/^Work board$/);
    expect(container.querySelector('[data-testid="proof-notice"]').textContent).toBe(proofNotice(JOB));
    expect(container.querySelector('[data-testid="proof-state"]').textContent).toBe('Proof for payment: 1 picture, 0 videos. Still needed: a video of the finished work');
    expect(container.querySelector('input[aria-label="Add a video to Install microwave"]')).not.toBeNull();
    const sel = container.querySelector('select[aria-label="Proof for Install microwave"]');
    await act(async () => { sel.value = 'photos'; sel.dispatchEvent(new Event('change', { bubbles: true })); });
    for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); });
    expect(H.proofs).toEqual([['req7', { proofRequired: 'photos', proofNote: 'the microwave mounted and the fan running' }]]);
  });
});

describe('a message on an empty unit stays (2026-10-10: "Didn\'t stay" / "Message Didn\'t save")', () => {
  it('PROVEN-TO-CATCH: picking the door from Doors lands on its own pending record, so the saved thread is there', async () => {
    const UNIT = { id: 't-unit', instance_id: 'i1', rental_ref: 'r-805-apt2', property_label: '805 North Prospect Avenue', unit_label: 'Apt 2', tenant_name: null, tenant_user_id: null, status: 'pending' };
    H.rentals = [APT2, KOEHN]; H.doors = [KOEHN_TENANCY, UNIT];
    H.record = { messages: [{ id: 'm1', tenancy_id: 't-unit', from_role: 'landlord', body: 'Testing the process....', sent_at: '2026-10-10T18:34:40Z' }] };
    await mount();
    await pickDoor('805 North Prospect Avenue');
    expect(H.recordCalls.at(-1)[0]).toBe('t-unit');
    await tap(/^Messages$/);
    expect(text()).toContain('Testing the process....');
    expect(text()).toContain('Empty — nobody living here yet');
    expect(text()).not.toContain('Rented');
  });
});

// THE OWNER WALKS THE TENANT'S DOOR (Darrell, 2026-10-21: "I want the landlords
// to get the same or almost the same experience as tenants... Because then
// they will already know their tenants experience before they send them into
// the Poe Properties App"). viewAs renders the tenant's face over the owner's
// doors; what is sent from it is still recorded as the owner.
describe('the owner sees a door the way its tenant does', () => {
  it('PROVEN TO CATCH: viewAs="tenant" shows the tenant\'s tabs, not the landlord\'s, over the owner\'s own door', async () => {
    H.rentals = [KOEHN]; H.doors = [KOEHN_TENANCY];
    await mount({ surface: 'poetech', viewAs: 'tenant' });
    const labels = buttons().map((b) => (b.textContent || '').trim());
    expect(labels).toContain('My place');
    expect(labels).toContain('Work orders');
    expect(labels).toContain('Payments');
    expect(labels).not.toContain('Work board');
    expect(labels).not.toContain('Dispatch');
  });

  it('PROVEN TO CATCH: a work order filed from the tenant\'s view is recorded as the landlord, never as the tenant', async () => {
    H.rentals = [KOEHN]; H.doors = [KOEHN_TENANCY];
    await mount({ surface: 'poetech', viewAs: 'tenant' });
    await tap(/^Work orders$/);
    await typeJob('Leaking kitchen faucet');
    await tap(/^File it$/i);
    expect(H.filed).toHaveLength(1);
    expect(H.filed[0]).toMatchObject({ tenancy_id: 't1', created_by_role: 'landlord' });
  });

  it('without viewAs the owner keeps the landlord\'s face', async () => {
    H.rentals = [KOEHN]; H.doors = [KOEHN_TENANCY];
    await mount({ surface: 'poetech' });
    expect(buttons().map((b) => (b.textContent || '').trim())).toContain('Work board');
  });
});

// THE PICTURES OF THE PLACE THEY LIVE IN (DR-1199). Darrell, 2026-10-21: "We
// have images on multiple doors, and those images should be able to be seen by
// the people we are adding to the system." The tenant's face has a Pictures
// tab; it reads the door 0309 opens (door_of_my_tenancy), draws its listing
// pictures room by room, and says the honest thing when the door is not known
// or the read failed.
describe('a tenant sees the pictures of the place they live in', () => {
  const KITCHEN = { id: 'rm-k', rental_ref: 'r-koehn', name: 'Kitchen', kind: 'kitchen', sort_order: 1 };
  const SHOTS = [
    { id: 'p-front', rental_ref: 'r-koehn', tenancy_id: null, kind: 'listing', caption: 'The front', room_id: null, thumb_path: 'data:image/jpeg;base64,AAAA' },
    { id: 'p-kitchen', rental_ref: 'r-koehn', tenancy_id: null, kind: 'listing', caption: 'Kitchen', room_id: 'rm-k', thumb_path: 'data:image/jpeg;base64,AAAA' },
    { id: 'p-mine', rental_ref: 'r-koehn', tenancy_id: 't1', kind: 'move-in-condition', caption: 'My move-in', room_id: null, thumb_path: 'data:image/jpeg;base64,AAAA' },
  ];

  it('PROVEN TO CATCH: the Pictures tab is on the tenant\'s face and shows every shared picture, then only the chosen room\'s', async () => {
    H.doors = [KOEHN_TENANCY]; H.rentals = []; H.askDoor = 'r-koehn'; H.rooms = [KITCHEN]; H.doorPhotos = SHOTS;
    await mount({ surface: 'door' });
    await tap(/^Pictures$/);
    const section = container.querySelector('[data-testid="door-pictures"]');
    expect(section, 'no Pictures section rendered').toBeTruthy();
    expect(section.getAttribute('data-phase')).toBe('ready');
    expect(container.querySelector('[data-testid="door-pictures-count"]').textContent).toBe('3 pictures');
    expect(container.querySelectorAll('[data-testid="door-pictures-grid"] li')).toHaveLength(3);
    // The room dropdown names THIS apartment's rooms, and the grid follows it.
    const pick = container.querySelector('[data-testid="door-pictures-room"]');
    expect([...pick.options].map((o) => o.textContent)).toEqual(['Every room', 'Kitchen', 'Not a specific room']);
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    await act(async () => { setter.call(pick, 'rm-k'); pick.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelectorAll('[data-testid="door-pictures-grid"] li')).toHaveLength(1);
    expect(container.querySelector('[data-testid="door-pictures-count"]').textContent).toBe('1 picture · Kitchen');
    // A tapped picture opens in place, and closes on the second tap (the
    // button is a glyph: its name is its aria-label, UX-PATTERNS 2g.3).
    const tile = container.querySelector('[data-testid="door-picture-p-kitchen"]');
    expect(tile.getAttribute('aria-label')).toBe('Open Kitchen');
    await act(async () => { tile.click(); });
    expect(container.querySelector('[data-testid="door-pictures-open"]')).toBeTruthy();
    expect(tile.getAttribute('aria-label')).toBe('Close Kitchen');
    await act(async () => { tile.click(); });
    expect(container.querySelector('[data-testid="door-pictures-open"]')).toBe(null);
  });

  it('says plainly when the landlord has shared nothing, and when the door is not known', async () => {
    H.doors = [KOEHN_TENANCY]; H.rentals = []; H.askDoor = 'r-koehn'; H.rooms = []; H.doorPhotos = [];
    await mount({ surface: 'door' });
    await tap(/^Pictures$/);
    expect(container.querySelector('[data-testid="door-pictures-none"]').textContent).toMatch(/has not shared pictures of this place yet/);
    act(() => root.unmount()); container.remove(); root = container = null;
    H.askDoor = null;
    await mount({ surface: 'door' });
    await tap(/^Pictures$/);
    expect(container.querySelector('[data-testid="door-pictures-no-door"]').textContent).toMatch(/not known on this device yet/);
    expect(container.querySelector('[data-testid="door-pictures-grid"]')).toBe(null);
  });

  it('the landlord\'s face has no tenant Pictures tab; its pictures stay on the Pictures (gallery) desk', async () => {
    H.rentals = [KOEHN]; H.doors = [KOEHN_TENANCY];
    await mount({ surface: 'poetech' });
    expect(container.querySelector('[data-testid="door-pictures"]')).toBe(null);
  });
});

// THE PREVIEW IS ONE DOOR, THROUGH THAT PERSON'S WALL (DR-1199). Darrell,
// 2026-10-21: "the photos don't align with that person's perspective... the
// drop down needs to work effectively within that specific apartment."
describe('a "seen as" preview stands on one door and reads what that person would', () => {
  const T_APT2 = { id: 't-apt2', instance_id: 'i1', rental_ref: 'r-805-apt2', property_label: '805 North Prospect Avenue', unit_label: 'Apt 2', tenant_name: 'B. Tenant', status: 'active', lease_start: '2026-02-01', monthly_rent: 900 };
  const PHOTOS = [
    { id: 'k-listing', rental_ref: 'r-koehn', tenancy_id: null, kind: 'listing', caption: 'Koehn kitchen', room_id: null, thumb_path: 'data:image/jpeg;base64,AAAA' },
    { id: 'k-turn', rental_ref: 'r-koehn', tenancy_id: null, kind: 'turn', caption: 'Koehn turn', room_id: null, thumb_path: 'data:image/jpeg;base64,AAAA' },
    { id: 'k-mine', rental_ref: 'r-koehn', tenancy_id: 't1', kind: 'move-in-condition', caption: 'Koehn move-in', room_id: null, thumb_path: 'data:image/jpeg;base64,AAAA' },
    { id: 'a2-listing', rental_ref: 'r-apt2', tenancy_id: null, kind: 'listing', caption: 'Apt 2 kitchen', room_id: null, thumb_path: 'data:image/jpeg;base64,AAAA' },
  ];

  it('PROVEN TO CATCH: as a tenant, the owner sees ONE tenancy, no door picker over the whole board, and only that door\'s listing shot and the tenancy\'s own picture', async () => {
    H.rentals = [KOEHN, APT2]; H.doors = [KOEHN_TENANCY, T_APT2]; H.askDoor = 'r-koehn'; H.doorPhotos = PHOTOS;
    await mount({ surface: 'poetech', viewAs: 'tenant' });
    // The preview chooser names both doors; the ordinary picker (whole board) is gone.
    const chooser = container.querySelector('[data-testid="preview-door"]');
    expect(chooser, 'no Their-door chooser').toBeTruthy();
    expect(chooser.options.length).toBe(2);
    expect(container.querySelector('[data-testid="door-picker"]')).toBe(null);
    // Its Pictures tab: the listing shot and the tenancy's own, never the turn shot, never Apt 2.
    await tap(/^Pictures$/);
    const grid = container.querySelector('[data-testid="door-pictures-grid"]');
    expect(grid, 'no pictures grid').toBeTruthy();
    const alts = [...grid.querySelectorAll('img')].map((i) => i.getAttribute('alt'));
    expect(alts).toContain('Koehn kitchen');
    expect(alts).toContain('Koehn move-in');
    expect(alts).not.toContain('Koehn turn');
    expect(alts).not.toContain('Apt 2 kitchen');
  });

  it('choosing the other door moves the preview there, tenancy and all', async () => {
    H.rentals = [KOEHN, APT2]; H.doors = [KOEHN_TENANCY, T_APT2]; H.askDoor = 'r-apt2'; H.doorPhotos = PHOTOS;
    await mount({ surface: 'poetech', viewAs: 'tenant' });
    const chooser = container.querySelector('[data-testid="preview-door"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    await act(async () => { setter.call(chooser, 'r-apt2'); chooser.dispatchEvent(new Event('change', { bubbles: true })); });
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
    expect(text()).toContain('B. Tenant');
    expect(text()).not.toContain('A. Tenant');
  });

  it('as a 1099 worker, My doors shows the one door they are sent to, with its pictures, and nothing of the other', async () => {
    H.rentals = [KOEHN, APT2]; H.doors = [KOEHN_TENANCY]; H.doorPhotos = PHOTOS;
    await mount({ surface: 'poetech', viewAs: 'field_worker' });
    const chooser = container.querySelector('[data-testid="preview-door"]');
    expect(chooser).toBeTruthy();
    expect(container.querySelector('[data-testid="door-picker"]')).toBe(null);
    // The chooser itself names both doors (it is the owner's hand); the board
    // beneath it names only the one the worker is sent to.
    const body = text().replace(chooser.textContent, '');
    expect(body).toContain('1003 Koehn Dr');
    expect(body).not.toContain('805 North Prospect Avenue');
  });

  it('a work order filed from the one-door tenant preview is still the landlord\'s', async () => {
    H.rentals = [KOEHN, APT2]; H.doors = [KOEHN_TENANCY, T_APT2];
    await mount({ surface: 'poetech', viewAs: 'tenant' });
    await tap(/^Work orders$/);
    await typeJob('Porch light out');
    await tap(/^File it$/i);
    expect(H.filed).toHaveLength(1);
    expect(H.filed[0]).toMatchObject({ tenancy_id: 't1', created_by_role: 'landlord' });
  });
});

// AN ADVERTISED DOOR WITH NO LISTING PICTURES SAYS SO ON THE BOARD (DR-1199).
// Darrell, 2026-10-21: the "Available now" shelf "is not publishing well". The
// public card draws only 'listing' shots (public_vacancy_photos), so a door
// advertised with none is advertised with a blank card — and the board must
// say that where the Advertise button is, not leave it to the visitor.
describe('the board says when an advertised door has no listing pictures', () => {
  const LISTED = { ...APT2, listed_at: '2026-10-20T00:00:00Z', listed_rent: 900 };
  it('PROVEN TO CATCH: advertised + only a turn shot → the notice; a listing shot → no notice', async () => {
    H.rentals = [LISTED]; H.doors = [];
    H.doorPhotos = [{ id: 'turn', rental_ref: 'r-apt2', tenancy_id: null, kind: 'turn', caption: 'Turn', thumb_path: 'data:image/jpeg;base64,AAAA' }];
    await mount({ surface: 'poetech' });
    const notice = container.querySelector('[data-testid="listing-no-pictures"]');
    expect(notice, 'no notice on an advertised door with no listing shot').toBeTruthy();
    expect(notice.textContent).toMatch(/Advertised with no listing pictures/);
    act(() => root.unmount()); container.remove(); root = container = null;
    H.doorPhotos = [{ id: 'shot', rental_ref: 'r-apt2', tenancy_id: null, kind: 'listing', caption: 'Front', thumb_path: 'data:image/jpeg;base64,AAAA' }];
    await mount({ surface: 'poetech' });
    expect(container.querySelector('[data-testid="listing-no-pictures"]')).toBe(null);
  });
  it('a door that is not advertised carries no such notice', async () => {
    H.rentals = [APT2]; H.doors = []; H.doorPhotos = [];
    await mount({ surface: 'poetech' });
    expect(container.querySelector('[data-testid="listing-no-pictures"]')).toBe(null);
  });
});

// WHO SEES WHAT, ON THE PEOPLE TAB (DR-1198): the family reads the evaluated
// matrix where they invite people; a tenant's face carries no such thing.
describe('the People tab carries the access matrix for the family', () => {
  it('the landlord sees it, one face at a time, opening on the 1099 worker', async () => {
    H.rentals = [KOEHN]; H.doors = [KOEHN_TENANCY];
    await mount({ surface: 'poetech' });
    await tap(/^People$/);
    const m = container.querySelector('[data-testid="access-matrix"]');
    expect(m, 'no matrix on the People tab').toBeTruthy();
    expect(m.getAttribute('data-role')).toBe('worker');
    expect(container.querySelector('[data-testid="access-row-cameras"]').textContent).toMatch(/any cameras/);
    const pick = container.querySelector('[data-testid="access-matrix-role"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    await act(async () => { setter.call(pick, 'tenant'); pick.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(m.getAttribute('data-role')).toBe('tenant');
    expect(container.querySelector('[data-testid="access-row-pictures-condition"]').textContent).toMatch(/only their own tenancy/);
  });
  it('a tenant\'s face has no People tab and no matrix', async () => {
    H.doors = [KOEHN_TENANCY]; H.rentals = [];
    await mount({ surface: 'door' });
    expect(buttons().map((b) => (b.textContent || '').trim())).not.toContain('People');
    expect(container.querySelector('[data-testid="access-matrix"]')).toBe(null);
  });
});

// A RELOAD NEVER BLANKS THE PAGE (DR-1199). The door-journeys leg caught a
// half-typed payment wiped by a background reload on 2026-10-21: every boot
// after the first set "Opening your properties…" and unmounted the page.
describe('a reload behind the family keeps the page on screen', () => {
  it('PROVEN TO CATCH: advertising a door reloads the board without ever drawing the loading screen over it', async () => {
    H.rentals = [APT2]; H.doors = [];
    await mount({ surface: 'poetech' });
    // Open the Rent tab on the door and type an amount.
    await pickDoor('805 North Prospect Avenue');
    await tap(/^Rent$/);
    const amount = container.querySelector('input[aria-label="Amount received"]');
    expect(amount, 'no payment form on the Rent tab').toBeTruthy();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    await act(async () => { setter.call(amount, '300'); amount.dispatchEvent(new Event('input', { bubbles: true })); });
    // Hold the next boot mid-way, then reload the board the way a save does.
    let release; H.claimGate = new Promise((r) => { release = r; });
    const reload = buttons().find((b) => /^Try again$/.test((b.textContent || '').trim()));
    expect(reload, 'the reload under test must not be the Try-again card').toBe(undefined);
    await tap(/^Doors$/);
    await tap(/^List$/);
    await tap(/^Advertise$/);
    expect(text(), 'a reload drew the loading screen over the page').not.toContain('Opening your properties');
    await act(async () => { release(); });
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
    expect(text()).not.toContain('Opening your properties');
    await tap(/^Rent$/);
    const again = container.querySelector('input[aria-label="Amount received"]');
    expect(again).toBeTruthy();
  });
});
