// =============================================================================
// A read that failed is not a door that is empty (DR-0946)
// =============================================================================
// Darrell, 2026-10-10: "What happened to the pictures in Apartment 2?!"
//
// WHAT WAS MEASURED, in PropertiesApp.loadDoorData. All seven door reads did
// `x.ok ? x.rows : []`, so a FAILED read became an EMPTY list, and the gallery
// then printed "No pictures on this property yet." about a landlord's move-out
// evidence. The app invented the absence — DR-0876's exact failure, arriving
// on the one surface where a false absence costs the most, because move-out
// photographs are what a deposit dispute turns on.
//
// IT IS NOT HYPOTHETICAL. PHOTO_LIST_COLUMNS carries thumb_path, which is a
// base64 data URL, so a full gallery is roughly a megabyte in ONE response.
// With Cloudflare Pages Functions dark (#2057, measured 2026-10-09 and still
// red tonight) the app runs on the absolute Funnel URL, which CLAUDE.md's own
// standing note says throttles cross-origin. Small reads pass. That one need
// not. The rows sit untouched on the NAS while the screen says they are gone.
//
// Written by MOUNTING and READING THE SCREEN, per the standing correction
// ("Testing needs to be respected!!!"): the fake simply refuses the photo
// read, the way the throttled road refuses it, and the case asserts what a
// person actually sees.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const RENTAL = {
  id: '11111111-1111-4111-8111-111111111111',
  instance_id: '22222222-2222-4222-8222-222222222222',
  slug: '805-north-prospect-apt-2',
  display_name: '805 North Prospect Apt 2',
  address: '805 N Prospect Ave Apt 2',
  property_type: 'multi-family',
  status: 'vacant',
};

// The one lever: whether the photo read succeeds.
const H = { photosRead: 'ok' };

vi.mock('../modules/properties/cloud.js', () => {
  const noop = async () => ({ ok: true });
  return {
    claimPropertyAccess: async () => ({ ok: true }),
    loadMyDoors: async () => ({ ok: true, doors: [] }),
    loadInvites: async () => ({ ok: true, invites: [] }),
    loadMyGrants: async () => ({ ok: true, grants: [] }),
    loadMyHousehold: async () => ({ ok: true, memberships: [] }),
    loadMyRentals: async () => ({ ok: true, rentals: [RENTAL] }),
    loadPublicVacancies: async () => ({ ok: true, vacancies: [] }),
    loadVacancyPhotos: async () => ({ ok: true, photos: [] }),
    loadAllPhotos: async () => ({ ok: true, photos: [] }),
    loadPhotoImages: async () => ({ ok: true, images: {} }),
    hydrateLegacyImages: async (photos) => photos,
    loadDoorRecord: async () => ({ ok: false }),
    loadRooms: async () => ({ ok: true, rooms: [] }),
    // THE SINGLE LEVER. Exactly what cloud.js returns when the request is
    // refused or times out on the throttled cross-origin road.
    loadDoorPhotos: async () => (H.photosRead === 'ok'
      ? { ok: true, photos: [] }
      : { ok: false, reason: 'read-failed', error: 'fetch failed' }),
    loadSystems: async () => ({ ok: true, systems: [] }),
    loadSystemEvents: async () => ({ ok: true, events: [] }),
    loadDoorNotes: async () => ({ ok: true, notes: [] }),
    loadRequests: async () => ({ ok: true, requests: [] }),
    loadMessages: async () => ({ ok: true, messages: [] }),
    loadNotes: async () => ({ ok: true, notes: [] }),
    loadRentRecords: async () => ({ ok: true, rent: [] }),
    loadNotices: async () => ({ ok: true, notices: [] }),
    loadApplications: async () => ({ ok: true, applications: [], unreadable: [] }),
    loadApplicationChecks: async () => ({ ok: true, checks: [], unreadable: [] }),
    addApplicationCheck: async () => ({ ok: true, check: {} }),
    decideApplication: async () => ({ ok: true }),
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
vi.mock('../lib/supabase.js', () => ({
  default: { auth: { getSession: async () => ({ data: { session: null } }) } },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
}));

// The picker compresses through lib/image.js, which needs a canvas jsdom has
// not got. Stubbed so the REAL pick -> queue -> submit path can run; the thing
// under test is how many times the screen refreshes, not how a JPEG is made.
vi.mock('../lib/image.js', () => ({
  compressImageFile: async () => 'data:image/jpeg;base64,AAAA',
  isLikelyImageFile: (f) => /\.(jpe?g|png|heic|heif|webp)$/i.test(f.name || ''),
}));

const { default: PropertiesApp } = await import('../modules/properties/PropertiesApp.jsx');

let container; let root;
const settle = async (n = 14) => {
  for (let i = 0; i < n; i += 1) await act(async () => { await Promise.resolve(); });
};

beforeEach(() => { H.photosRead = 'ok'; });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

async function openThePictures() {
  window.history.replaceState(null, '', `${window.location.pathname}?properties=1&door=${RENTAL.id}&p=gallery`);
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(PropertiesApp, { surface: 'poetech' }));
  });
  await settle();
  // Reach the Pictures tab however this build lands — the address above should
  // open it, and the tab control is the fallback.
  if (!container.querySelector('[data-testid="gallery-unread"]') && !/pictures on this property/i.test(container.textContent || '')) {
    const tab = [...container.querySelectorAll('button')].find((b) => /^Pictures$/i.test((b.textContent || '').trim()));
    if (tab) {
      await act(async () => { tab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      await settle(8);
    }
  }
  return container.textContent || '';
}

describe('a door whose pictures could not be read', () => {
  it('PROVEN-TO-CATCH: never says there are none', async () => {
    H.photosRead = 'fail';
    const text = await openThePictures();

    // The sentence that sent him looking for lost evidence must not appear.
    expect(
      /No pictures on this property yet/i.test(text),
      'the app told him the door has no pictures when it had simply failed to read them',
    ).toBe(false);
  });

  it('says plainly that it could not load them, and that nothing is lost', async () => {
    H.photosRead = 'fail';
    await openThePictures();
    const said = container.querySelector('[data-testid="gallery-unread"]');
    expect(said, 'nothing told him the read had failed').toBeTruthy();
    expect(said.textContent).toMatch(/not the same as there being none/i);
    expect(said.textContent).toMatch(/nothing has been lost/i);
  });

  it('still says "none yet" when the read SUCCEEDED and the door really is empty', async () => {
    // The guarantee being preserved: this is not a blanket suppression of the
    // empty state. A door with no pictures must still read as a door with no
    // pictures, or the fix trades one false sentence for another.
    H.photosRead = 'ok';
    const text = await openThePictures();
    expect(container.querySelector('[data-testid="gallery-unread"]')).toBeFalsy();
    expect(/No pictures on this property yet/i.test(text)).toBe(true);
  });
});

// ===========================================================================
// The upload flow: one refresh per SET, and never two contradictory sentences
// (DR-0947) — both read straight off the screenshots of his 2026-10-10 run.
// ===========================================================================
const { GalleryTab } = await import('../modules/properties/DoorTabs.jsx');

const SHOTS = Array.from({ length: 10 }, (_, n) => ({
  id: `p${n}`, kind: 'listing', caption: `listing ${n}`, thumb_path: 'data:image/jpeg;base64,AAAA',
  taken_at: null, uploaded_at: '2026-10-01T12:00:00Z', sort_order: n, archived_at: null,
}));

async function mountGallery(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(GalleryTab, {
      door: { id: RENTAL.id, instance_id: RENTAL.instance_id },
      doorLabel: '805 North Prospect Apt 2',
      rooms: [], photos: SHOTS, canManage: true, canAdd: true,
      ...props,
    }));
  });
  await settle(6);
}

const tapText = async (re) => {
  const b = [...container.querySelectorAll('button')].find((x) => re.test((x.textContent || '').trim()));
  expect(b, `no button matching ${re}`).toBeTruthy();
  await act(async () => { b.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await settle(6);
};

describe('a door with ten listing shots, filtered to a kind it has none of', () => {
  it('PROVEN-TO-CATCH: never says the property has no pictures while it has ten', async () => {
    await mountGallery({});
    // His screenshot: EVERY KIND (10) · LISTING (10) · MOVE OUT CONDITION (0).
    // Any zero-count kind reproduces it identically; the strip offers the
    // door's own kinds plus the one being added, which here is the remembered
    // record kind at (0).
    await tapText(/\(0\)$/);
    const text = container.textContent || '';

    expect(
      /No pictures on this property yet/i.test(text),
      'the door holds ten pictures and the screen said it holds none',
    ).toBe(false);
    // The accurate sentence is still there, exactly once.
    // The accurate, filtered sentence is still there.
    expect(/No .* pictures at this door yet/i.test(text)).toBe(true);
  });

  it('still says it plainly when the door genuinely holds nothing', async () => {
    await mountGallery({ photos: [] });
    expect(/No pictures on this property yet/i.test(container.textContent || '')).toBe(true);
  });
});


describe('uploading a set refreshes the screen ONCE, not once per picture', () => {
  it('PROVEN-TO-CATCH: twelve pictures, twelve saves, ONE refresh', async () => {
    // Darrell, 2026-10-10: "it keeps flashing... and pausing the coming back
    // with new images about 20 seconds later". The refresh used to sit inside
    // onAdd, which is awaited PER PICTURE, and it ran boot() — the whole app
    // bootstrap (doors, grants, household, rentals). Twelve pictures meant
    // twelve of them interleaved with the writes, seconds each on the
    // throttled road.
    const saves = [];
    let refreshes = 0;
    await mountGallery({
      photos: [],
      onAdd: async (row) => { saves.push(row.storage_path); return { ok: true }; },
      onDone: async () => { refreshes += 1; },
    });

    // Through the REAL picker: twelve files onto the real <input type="file">.
    const input = container.querySelector('input[type="file"]');
    expect(input, 'the picker has no file input').toBeTruthy();
    const files = Array.from({ length: 12 }, (_, n) =>
      new File([new Uint8Array([1, 2, 3])], `66${40 + n}.heic`, { type: 'image/heic' }));
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
    await settle(12);

    await tapText(/^Add 12 to the gallery$/i);
    await settle(24);

    expect(saves.length, 'every picture should still be saved, one at a time').toBe(12);
    expect(refreshes, 'the screen reloaded more than once for one set').toBe(1);
  });
});

describe('choosing the room AFTER the pictures are in (DR-0948)', () => {
  // Darrell, 2026-10-10, twelve move-out photographs just landed, this editor
  // open: "Need to be able to choose the rooms after.... make sense?" His
  // screenshot shows the dead end — the list offered "Not a specific room"
  // and "Bedroom", and every picture on his screen was a BATHROOM.
  const SHOT = {
    id: 'p-bath', kind: 'move-out-condition', caption: '', thumb_path: 'data:image/jpeg;base64,AAAA',
    taken_at: null, uploaded_at: '2026-10-10T18:45:00Z', sort_order: 0, archived_at: null, room_id: null,
  };
  const BEDROOM = { id: 'r-bed', name: 'Bedroom', sort_order: 0 };

  it('PROVEN-TO-CATCH: a room that does not exist yet can be made from the editor, and is chosen', async () => {
    const made = [];
    const patches = [];
    await mountGallery({
      photos: [SHOT], rooms: [BEDROOM],
      onAddRoom: async (name) => { const r = { id: 'r-bath', name }; made.push(name); return r; },
      onPatch: async (id, patch) => { patches.push([id, patch]); return { ok: true }; },
    });

    await tapText(/^Edit$/i);
    const room = container.querySelector('[data-testid="photo-edit-room"]');
    expect(room, 'the editor has no room picker').toBeTruthy();

    // The dead end his screenshot shows: Bathroom is simply not on the list.
    const names = [...room.options].map((o) => o.textContent);
    expect(names).not.toContain('Bathroom');
    expect(
      names.some((n) => /add a room/i.test(n)),
      'the editor offered no way to make the missing room',
    ).toBe(true);

    // Make it from here, without leaving the grid.
    const proto = window.HTMLSelectElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(room, '__add__');
    await act(async () => { room.dispatchEvent(new Event('change', { bubbles: true })); });
    await settle(4);

    const name = container.querySelector('[data-testid="photo-edit-new-room"]');
    expect(name, 'no box to name the new room').toBeTruthy();
    const ip = window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(ip, 'value').set.call(name, 'Bathroom');
    await act(async () => { name.dispatchEvent(new Event('input', { bubbles: true })); });
    await settle(2);

    await tapText(/^Add room$/i);
    expect(made, 'the room was never created').toEqual(['Bathroom']);

    // And it is SELECTED — the picture he is editing lands in the room he
    // just made, which is the entire point of doing it from here.
    await tapText(/^Save$/i);
    expect(patches.length, 'nothing was saved').toBe(1);
    expect(patches[0][1].room_id, 'the new room was made but not applied to the picture').toBe('r-bath');
  });
});
