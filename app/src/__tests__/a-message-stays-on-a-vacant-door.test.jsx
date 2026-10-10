// =============================================================================
// A MESSAGE STAYS — on a door nobody lives in yet
// =============================================================================
// Darrell, 2026-10-10: "Messages didn't stay either all your test have been
// superficial!!!"
//
// Both halves are fair. This file is written to settle the first by REPRODUCING
// it, not by reading the code and reasoning about it — the habit that has been
// failing him all day.
//
// WHAT IS MODELLED, and why it is modelled this way. The stub below is not a
// convenience; the whole value of the test is in one schema fact:
//
//   migration 0260 added `rental_id` to tenant_maintenance_requests,
//   request_documentation and tenancy_notes — AND TO NOTHING ELSE.
//   tenant_messages, rent_records and tenant_notices have no such column.
//
// So a message can only ever be found by its tenancy_id. loadDoorRecord knows
// this and skips those three reads entirely when there is no tenancy. That is
// correct, and it is also the trap: on a vacant door `workDoor.tenancyId` is
// null, sendMessage calls ensureDoor() which MINTS a tenancy and writes the
// message against it, and the reload then has to be carrying that brand-new
// id or the message cannot be found by anything.
//
// The stub therefore stores messages keyed by tenancy_id and answers a read
// the way Postgres would: by tenancy_id or not at all. If the app reloads with
// a stale null, the message is written and never seen again — which is exactly
// "messages didn't stay".
//
// The existing vacant-door harness could not catch this: it stubs
// `createTenancy` as a no-op returning no row at all, so the minted-tenancy
// path it would have had to exercise does not exist there.
// =============================================================================
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const RENTAL = {
  id: 'aaaaaaaa-0000-4000-8000-000000000001',
  slug: 'r-805-apt2',
  instance_id: 'i1',
  address: '805 North Prospect Avenue',
  unit: 'Apt 2',
  city: 'Champaign',
  state: 'IL',
  status: 'vacant',
  property_type: 'multi-family',
  display_name: '805 North Prospect Avenue Apt 2',
};

const H = vi.hoisted(() => ({
  doors: [],            // rental_tenancies rows the database holds
  messages: [],         // tenant_messages rows, each with a tenancy_id
  reads: [],            // every (tenancyId, rentalId) the app asked for
  minted: 0,
}));

vi.mock('../modules/properties/cloud.js', () => {
  const noop = async () => ({ ok: true });
  return {
    claimPropertyAccess: async () => ({ ok: true }),
    loadMyDoors: async () => ({ ok: true, doors: H.doors }),
    loadMyGrants: async () => ({ ok: true, grants: [], byScope: {}, roleLabel: null }),
    loadMyHousehold: async () => ({ ok: true, memberships: [] }),
    loadMyRentals: async () => ({ ok: true, rentals: [RENTAL] }),
    loadInvites: async () => ({ ok: true, invites: [] }),
    loadPublicVacancies: async () => ({ ok: true, vacancies: [] }),
    loadVacancyPhotos: async () => ({ ok: true, photos: [] }),
    loadAllPhotos: async () => ({ ok: true, photos: [] }),
    loadPhotoImages: async () => ({ ok: true, images: {} }),
    hydrateLegacyImages: async (p) => p,

    // THE DATABASE'S OWN RULE, modelled: a message is found by tenancy_id or
    // not at all, because tenant_messages has no rental_id column (0260).
    loadDoorRecord: async (tenancyId, opts = {}) => {
      H.reads.push({ tenancyId: tenancyId || null, rentalId: (opts && opts.rentalId) || null });
      const messages = tenancyId ? H.messages.filter((m) => m.tenancy_id === tenancyId) : [];
      return { ok: true, requests: [], messages, notes: [], docs: [], rent: [], notices: [], unreadable: [] };
    },

    // The REAL contract: a row comes back, and it is the row the app must then
    // be reading against.
    createTenancy: async (row) => {
      H.minted += 1;
      const made = { ...row, id: `t-minted-${H.minted}`, instance_id: row.instance_id || 'i1' };
      H.doors.push(made);
      return { ok: true, row: made };
    },
    postMessage: async ({ instanceId, tenancyId, body, fromRole }) => {
      // Postgres would refuse a null tenancy_id here: the column is NOT NULL
      // on tenant_messages and 0260 never touched it.
      if (!tenancyId) return { ok: false, reason: 'null-tenancy' };
      H.messages.push({
        id: `m${H.messages.length + 1}`, instance_id: instanceId, tenancy_id: tenancyId,
        body, from_role: fromRole, sent_at: new Date().toISOString(),
      });
      return { ok: true };
    },

    loadRooms: async () => ({ ok: true, rooms: [] }),
    loadDoorPhotos: async () => ({ ok: true, photos: [] }),
    loadDoorTenancies: async () => ({ ok: true, tenancies: [] }),
    loadDocuments: async () => ({ ok: true, documents: [] }),
    loadSystems: async () => ({ ok: true, systems: [] }),
    loadSystemEvents: async () => ({ ok: true, events: [] }),
    loadDoorNotes: async () => ({ ok: true, notes: [] }),
    loadApplications: async () => ({ ok: true, applications: [], unreadable: [] }),
    decideApplication: noop,
    addSystem: noop, patchSystem: noop, addSystemEvent: noop,
    fileWorkOrder: async (row) => ({ ok: true, row }),
    setWorkOrderStatus: noop, assignWorkOrder: noop,
    postNote: noop, postJobDoc: noop,
    recordRent: noop, confirmRent: noop, markRentPosted: noop,
    inviteToProperties: noop, revokeInvite: noop,
    addRoom: noop, patchRoom: noop, updateTenancy: noop, updateRental: noop,
    addPhoto: noop, patchPhoto: noop, addDocument: noop, patchDocument: noop,
    submitApplication: noop,
  };
});

vi.mock('../lib/supabase.js', () => ({
  default: { auth: { getSession: async () => ({ data: { session: { user: { id: 'u-landlord' } } } }) } },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
}));

const PropertiesApp = (await import('../modules/properties/PropertiesApp.jsx')).default;

let container; let root;
beforeEach(() => {
  H.doors = []; H.messages = []; H.reads = []; H.minted = 0;
});
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

async function settle(n = 10) {
  for (let i = 0; i < n; i += 1) await act(async () => { await Promise.resolve(); });
}

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesApp, { surface: 'poetech' })); });
  await settle();
}

const buttons = () => [...container.querySelectorAll('button')];
const tapText = async (re) => {
  const b = buttons().find((x) => re.test((x.textContent || '').trim()));
  expect(b, `no button matching ${re}. Saw: ${buttons().map((x) => (x.textContent || '').trim()).join(' | ')}`).toBeTruthy();
  await act(async () => { b.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await settle(8);
};

async function openMessagesOnTheVacantDoor() {
  await mount();
  // Pick the vacant unit, then its Messages tab.
  const pick = buttons().find((b) => /805 North Prospect/.test(b.textContent || ''));
  if (pick) { await act(async () => { pick.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await settle(8); }
  await tapText(/^Messages$/i);
}

// ARRIVE WITH THE UNIT ALREADY CHOSEN, which is what every reload and every
// shared link now does (DR-0901 put the door in the URL). This is the state
// his report lives in: activeId is the RENTAL's id, because that is what the
// board and the link name, and no tenancy carries a rental's id.
//
// Mounting with only one door in `doors` would hide the bug entirely — the
// app falls back to doors[0] and the tenancy resolves by accident. The
// address is what makes the test faithful.
async function mountAtUnit() {
  window.history.replaceState(null, '', `${window.location.pathname}?properties=1&door=${RENTAL.id}`);
  await mount();
}

const typeInto = async (el, text) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
    || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
  setter.set.call(el, text);
  await act(async () => { el.dispatchEvent(new Event('input', { bubbles: true })); });
  await settle(2);
};

describe('a message sent on a door nobody lives in yet', () => {
  it('PROVEN-TO-CATCH: it is still there after it is sent', async () => {
    await openMessagesOnTheVacantDoor();

    const box = container.querySelector('textarea');
    expect(box, 'no message box on the Messages tab').toBeTruthy();
    await typeInto(box, 'Microwave and exhaust fan go in Thursday.');
    await tapText(/^Send$/i);

    // It reached the database…
    expect(H.messages, 'the message was never written at all').toHaveLength(1);
    const writtenTo = H.messages[0].tenancy_id;
    expect(writtenTo, 'written with no tenancy — Postgres would have refused it').toBeTruthy();

    // …and the RELOAD has to be carrying that same brand-new id, or nothing
    // can ever find it again: tenant_messages has no rental_id to fall back on.
    const last = H.reads[H.reads.length - 1];
    expect(
      last.tenancyId,
      `the record was re-read with tenancyId=${last.tenancyId} but the message was written to ${writtenTo}; `
      + 'a message written to a tenancy the app is not reading is a message that vanished',
    ).toBe(writtenTo);

    // The one that matters to the person: it is on screen.
    expect(container.textContent).toContain('Microwave and exhaust fan go in Thursday.');
  });

  it('PROVEN-TO-CATCH: a message sent EARLIER is still there when the unit is picked again', async () => {
    // The real shape of his report. A tenancy already exists for this unit —
    // minted the first time anyone messaged — and a message is already on it.
    // This is every session after the first, and every reload of the PWA.
    H.doors = [{
      id: 't-existing', instance_id: 'i1', rental_ref: RENTAL.slug,
      property_label: '805 North Prospect Avenue', unit_label: 'Apt 2', status: 'pending',
    }];
    H.messages = [{
      id: 'm0', instance_id: 'i1', tenancy_id: 't-existing',
      body: 'Crew comes Thursday for the microwave.', from_role: 'landlord',
      sent_at: '2026-10-09T15:00:00Z',
    }];

    await mountAtUnit();
    await tapText(/^Messages$/i);

    // Before the fix activeDoor resolved to null here, tenancyId stayed null,
    // loadDoorRecord skipped tenant_messages, and this message — sitting in
    // the database, correctly written — could never be seen again.
    const last = H.reads[H.reads.length - 1];
    expect(
      last.tenancyId,
      'the unit was picked but the record was read with no tenancy, so messages were never asked for',
    ).toBe('t-existing');
    expect(container.textContent).toContain('Crew comes Thursday for the microwave.');
  });

  it('and it still never borrows ANOTHER door\u2019s tenancy', async () => {
    // The guarantee the null was added for (#2095) has to survive the fix: a
    // work order filed against a different property is worse than a hidden
    // message.
    H.doors = [{
      id: 't-somewhere-else', instance_id: 'i1', rental_ref: 'r-1003koehn',
      property_label: '1003 Koehn Dr', unit_label: null, status: 'active',
    }];
    H.messages = [{
      id: 'm9', instance_id: 'i1', tenancy_id: 't-somewhere-else',
      body: 'This belongs to Koehn, not to Prospect.', from_role: 'landlord',
      sent_at: '2026-10-09T15:00:00Z',
    }];

    await mountAtUnit();
    await tapText(/^Messages$/i);

    const last = H.reads[H.reads.length - 1];
    expect(last.tenancyId, 'borrowed a different property\u2019s tenancy').toBeNull();
    expect(container.textContent).not.toContain('This belongs to Koehn');
  });
});
