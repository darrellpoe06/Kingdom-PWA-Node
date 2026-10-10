// =============================================================================
// The work is an option of the door, and a dispatch is a record (DR-0837)
// =============================================================================
// Darrell, 2026-10-09, over the Work Board and Dispatch tabs on the Poe
// Properties door: "How does this work... this seems to be not evaluated end to
// end... does the workflow work with sending data driven review" and "they
// should be options inside the apartment... doesn't make sense separate."
//
// Pure cases over the roster, the text, the record and the worker's own jobs;
// then the real app mounted as the landlord and as the worker, with only what
// the database would return for them: the door comes first, the work tabs
// carry the door's header and its open-work count, the dispatch picks a real
// invited worker, and "Text it" assigns, schedules and writes the note.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { workerRoster, someoneElse, dispatchText, dispatchRecord, nextStatusOnDispatch, myJobs, dispatchable } from '../modules/properties/dispatch-roster.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({
  rentals: [], doors: [], grants: [], household: [], invites: [], record: null, session: null,
  assigns: [], statuses: [], notes: [],
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
    loadDoorRecord: async () => ({ ok: true, requests: [], messages: [], notes: [], docs: [], rent: [], notices: [], ...(H.record || {}) }),
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
    loadRecordEvents: async () => ({ ok: true, events: [] }), loadDoorMoney: async () => ({ ok: true, months: [] }),
    loadDoorPapers: async () => ({ ok: true, documents: [] }), loadSignatures: async () => ({ ok: true, signatures: [] }),
    requestSignatures: async () => ({ ok: true }), signDocument: async () => ({ ok: true }),
    doorOfMyTenancy: async () => ({ ok: true, rentalId: null }), loadDoorStays: async () => ({ ok: true, rows: [] }), loadBookedNights: async () => ({ ok: true, ranges: [] }), loadDoorArea: async () => ({ ok: true, area: null, nearby: [] }), requestAStay: async () => ({ ok: true }), addDoorStay: async () => ({ ok: true }), decideStay: async () => ({ ok: true }), loadCameraMenu: async () => ({ ok: true, menu: [] }), loadCameraAccess: async () => ({ ok: true, rows: [] }),
    // The Applications tab (DR-0903/DR-0944) reads these three. A tab added
    // to MANAGER_TABS renders in this suite's every-tab sweep, so its
    // loaders belong in the mock — a true consequence, not a workaround.
    loadApplications: async () => ({ ok: true, applications: [], unreadable: [] }),
    loadApplicationChecks: async () => ({ ok: true, checks: [], unreadable: [] }),
    addApplicationCheck: async () => ({ ok: true, check: {} }),
    decideApplication: async () => ({ ok: true }),
    saveCameraMenu: async () => ({ ok: true }), askForCameras: async () => ({ ok: true }), decideCameraAccess: async () => ({ ok: true }), giveCameraAccess: async () => ({ ok: true }), loadPayeeForTenancy: async () => ({ ok: true, payee: null }),
    loadRentPayee: async () => ({ ok: true, payee: null }), saveRentPayee: async () => ({ ok: true }),
    fileWorkOrder: noop,
    setWorkOrderStatus: async (id, status) => { H.statuses.push([id, status]); return { ok: true }; },
    assignWorkOrder: async (id, a) => { H.assigns.push({ id, ...a }); return { ok: true }; },
    postMessage: noop,
    postNote: async (row) => { H.notes.push(row); return { ok: true }; },
    postJobDoc: noop,
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

import PropertiesApp from '../modules/properties/PropertiesApp.jsx';

let container, root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  Object.assign(H, { rentals: [], doors: [], grants: [], household: [], invites: [], record: null, session: null, assigns: [], statuses: [], notes: [] });
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

const KOEHN = { id: 'r-koehn', slug: 'r-1003koehn', instance_id: 'i1', address: '1003 Koehn Dr', city: 'Danville', state: 'IL', zip: '61832', status: 'paying', property_type: 'single-family', monthly_rent: 680, display_name: '1003 Koehn Dr, Danville' };
const TENANCY = { id: 't1', instance_id: 'i1', rental_ref: 'r-1003koehn', property_label: '1003 Koehn Dr', unit_label: null, tenant_name: 'A. Tenant', lease_start: '2026-01-01', lease_end: null, monthly_rent: 680, status: 'active' };
const INVITE_MIKE = { id: 'inv1', instance_id: 'i1', email: '15550100142@phone.poetech.us', invited_phone: '5550100142', role_label: 'field_worker', display_name: 'Mike', claimed_at: '2026-10-01T00:00:00Z', claimed_by: 'u-mike', revoked: false, created_at: '2026-09-30T00:00:00Z' };
const REQ_OPEN = { id: 'req1', tenancy_id: 't1', title: 'Leaking kitchen faucet', detail: 'drips all night', area: 'kitchen', priority: 'high', status: 'submitted', created_at: '2026-10-08T12:00:00Z', assigned_to: null, assigned_to_label: null };
const REQ_DONE = { id: 'req2', tenancy_id: 't1', title: 'Porch light', status: 'resolved', created_at: '2026-10-01T12:00:00Z' };

describe('the roster, the text, the record, the worker\'s jobs (pure)', () => {
  it('the roster is the invited 1099 workers: by phone or phone-door email, named, deduplicated, sorted; revoked and other roles left out', () => {
    const r = workerRoster([
      INVITE_MIKE,
      { id: 'inv2', instance_id: 'i1', email: '15550100777@phone.poetech.us', role_label: 'field_worker', display_name: '', claimed_at: null, claimed_by: null },
      { id: 'inv3', instance_id: 'i1', email: 'ana@example.org', role_label: 'field_worker', display_name: 'Ana', claimed_at: null },
      { id: 'inv4', instance_id: 'i1', email: 'x@example.org', role_label: 'manager', display_name: 'Not a worker' },
      { id: 'inv5', instance_id: 'i1', email: '15550100142@phone.poetech.us', role_label: 'field_worker', display_name: 'Mike again', revoked: true },
      { id: 'inv6', instance_id: 'other', email: 'far@example.org', role_label: 'field_worker', display_name: 'Elsewhere' },
    ], { instanceId: 'i1' });
    expect(r.map((w) => w.name)).toEqual(['(555) 010-0777', 'Ana', 'Mike']);
    const mike = r.find((w) => w.name === 'Mike');
    expect(mike).toMatchObject({ phone: '5550100142', userId: 'u-mike', claimed: true, email: '' });
    expect(r.find((w) => w.name === '(555) 010-0777')).toMatchObject({ phone: '15550100777', userId: null, claimed: false });
    expect(r.find((w) => w.name === 'Ana')).toMatchObject({ phone: '', email: 'ana@example.org' });
    expect(someoneElse('(555) 010-0199', '')).toMatchObject({ name: '(555) 010-0199', phone: '5550100199', userId: null });
    expect(someoneElse('', 'Nobody')).toBeNull();
  });

  it('the text carries the door\'s real address, the job, how urgent, and the detail', () => {
    const t = dispatchText({ door: TENANCY, rental: KOEHN, request: REQ_OPEN });
    expect(t).toContain('Work order — 1003 Koehn Dr');
    expect(t).toContain('Where: 1003 Koehn Dr, Danville, IL, 61832');
    expect(t).toContain('Job: kitchen — Leaking kitchen faucet');
    expect(t).toContain('Priority: High: within 3 days');
    expect(t).toContain('Notes: drips all night');
    expect(dispatchText({ door: { ...TENANCY, unit_label: 'B' }, rental: null, request: { title: 'x' } })).toContain('1003 Koehn Dr · B');
  });

  it('a dispatch writes the assignment, the status and the note; a closed job cannot be sent', () => {
    expect(nextStatusOnDispatch('submitted')).toBe('scheduled');
    expect(nextStatusOnDispatch('received')).toBe('scheduled');
    expect(nextStatusOnDispatch('in-progress')).toBe('in-progress');
    expect(nextStatusOnDispatch('resolved')).toBeNull();
    const rec = dispatchRecord({ request: REQ_OPEN, worker: { name: 'Mike', phone: '5550100142', userId: 'u-mike' } });
    expect(rec.assign).toEqual({ assignedTo: 'u-mike', assignedToLabel: 'Mike' });
    expect(rec.status).toBe('scheduled');
    expect(rec.note).toBe('Dispatched to Mike ((555) 010-0142) by text: Leaking kitchen faucet');
    expect(dispatchRecord({ request: REQ_OPEN, worker: someoneElse('5550100199') }).assign).toEqual({ assignedTo: null, assignedToLabel: '(555) 010-0199' });
    expect(dispatchRecord({ request: REQ_DONE, worker: { name: 'Mike' } })).toBeNull();
    expect(dispatchable([REQ_OPEN, REQ_DONE, { id: 'c', status: 'cancelled' }]).map((r) => r.id)).toEqual(['req1']);
  });

  it('a worker\'s jobs are the ones assigned to them, by user id or by the name they were invited under', () => {
    const rows = [
      { id: 'a', assigned_to: 'u-mike', assigned_to_label: 'Mike' },
      { id: 'b', assigned_to: null, assigned_to_label: 'mike' },
      { id: 'c', assigned_to: 'u-ana', assigned_to_label: 'Ana' },
      { id: 'd', assigned_to: null, assigned_to_label: null },
    ];
    expect(myJobs(rows, { userId: 'u-mike', label: 'Mike' }).map((r) => r.id)).toEqual(['a', 'b']);
    expect(myJobs(rows, { userId: null, label: 'Ana' }).map((r) => r.id)).toEqual(['c']);
    expect(myJobs(rows, {})).toEqual([]);
  });
});

describe('the landlord, inside the door', () => {
  it('the doors come first; the work board and the dispatch carry the door\'s header and its open-work count', async () => {
    H.rentals = [KOEHN]; H.doors = [TENANCY]; H.invites = [INVITE_MIKE];
    H.record = { requests: [REQ_OPEN, REQ_DONE] };
    await mount();
    const labels = buttons().map((b) => (b.textContent || '').trim());
    expect(labels.indexOf('Doors')).toBeGreaterThan(-1);
    expect(labels.indexOf('Doors')).toBeLessThan(labels.indexOf('Work board'));
    expect(labels.indexOf('Work board')).toBeLessThan(labels.indexOf('Dispatch'));
    await tap(/^Work board$/);
    expect(text()).toContain('You are in');
    expect(text()).toContain('1003 Koehn Dr');
    expect(text()).toContain('1 open work order');
    expect(text()).toContain('Open (1)');
    await tap(/^Dispatch$/);
    expect(text()).toContain('You are in');
    expect(text()).toContain('Jobs to send (1)');
    expect(text()).not.toContain('Porch light');
  });

  it('Text it goes to the invited worker with the address written, and records the assignment, the schedule and the note', async () => {
    H.rentals = [KOEHN]; H.doors = [TENANCY]; H.invites = [INVITE_MIKE];
    H.record = { requests: [REQ_OPEN, REQ_DONE] };
    await mount();
    await tap(/^Dispatch$/);
    const pick = container.querySelector('[data-testid="dispatch-worker"]');
    expect(Array.from(pick.options).map((o) => o.textContent)).toEqual(['Mike · (555) 010-0142', 'Someone else, by phone']);
    const a = container.querySelector('[data-testid="dispatch-text"]');
    expect(a.getAttribute('href')).toMatch(/^sms:5550100142\?&body=/);
    const body = decodeURIComponent(a.getAttribute('href').split('body=')[1]);
    expect(body).toContain('Leaking kitchen faucet');
    expect(body).toContain('1003 Koehn Dr, Danville, IL, 61832');
    a.addEventListener('click', (e) => e.preventDefault());
    await act(async () => { a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); });
    for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
    expect(H.assigns).toEqual([{ id: 'req1', assignedTo: 'u-mike', assignedToLabel: 'Mike' }]);
    expect(H.statuses).toEqual([['req1', 'scheduled']]);
    expect(H.notes).toHaveLength(1);
    expect(H.notes[0]).toMatchObject({ tenancy_id: 't1', request_id: 'req1', author_role: 'landlord' });
    expect(H.notes[0].body).toBe('Dispatched to Mike ((555) 010-0142) by text: Leaking kitchen faucet');
    expect(text()).toContain('sent to Mike');
  });

  it('with nobody invited, the dispatch says so and still sends to a typed number, recorded by that number', async () => {
    H.rentals = [KOEHN]; H.doors = [TENANCY]; H.invites = [];
    H.record = { requests: [REQ_OPEN] };
    await mount();
    await tap(/^Dispatch$/);
    expect(text()).toContain('No 1099 worker has been invited to this door yet');
    const a = container.querySelector('[data-testid="dispatch-text"]');
    expect(a.getAttribute('href')).toBeNull();
    const phone = container.querySelector('input[aria-label="Worker\'s phone"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    await act(async () => { setter.call(phone, '(555) 010-0199'); phone.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(container.querySelector('[data-testid="dispatch-text"]').getAttribute('href')).toMatch(/^sms:5550100199/);
  });
});

describe('the worker, inside the door', () => {
  it('My jobs is what is assigned to them, and says how many others on the door are not', async () => {
    H.doors = [TENANCY]; H.grants = ['docs.add', 'property.history'];
    H.invites = [INVITE_MIKE]; H.session = { user: { id: 'u-mike' } };
    H.record = { requests: [{ ...REQ_OPEN, assigned_to: 'u-mike', assigned_to_label: 'Mike', status: 'scheduled' }, { id: 'req3', tenancy_id: 't1', title: 'Broken step', status: 'submitted', created_at: '2026-10-08T13:00:00Z' }] };
    await mount();
    await tap(/^My jobs$/);
    expect(text()).toContain('You are in');
    expect(text()).toContain('My jobs (1)');
    expect(text()).toContain('Leaking kitchen faucet');
    expect(text()).not.toContain('Broken step');
    expect(text()).toContain('1 other open work order on this door is not assigned to you.');
  });
});
