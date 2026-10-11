// =============================================================================
// A slow road is not a dead one (DR-0950)
// =============================================================================
// Darrell, 2026-10-11 00:20: "Properties tab in PoeTech App is frozen!!!"
//
// His card showed all four spine reads 'not-reached'. In the same minute
// site-health measured poetech.us at 200 and the backend at 200 from a GitHub
// runner, and a read of the live database counted all 67 of his photographs.
// Nothing was wrong with the data or the server: his phone could not finish
// four round trips inside the 6s ceiling, because with Pages Functions dark
// the app runs on the absolute Funnel URL (which throttles cross-origin) and
// he had just pushed forty photographs through it in ten minutes.
//
// boundedRead's timeout never cancels the request — "a late answer is simply
// ignored" — so the answer was very likely already in flight when the UI gave
// up on it. One retry, with room.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const RENTAL = {
  id: '11111111-1111-4111-8111-111111111111',
  instance_id: '22222222-2222-4222-8222-222222222222',
  slug: 'apt-2', display_name: '805 North Prospect Avenue',
  address: '805 N Prospect Ave Apt 2', property_type: 'multi-family', status: 'vacant',
};

// How many times each spine read has been asked, and how slow the road is.
const H = { calls: 0, slowFirstRound: false };
const spine = async (payload) => {
  H.calls += 1;
  // The throttled road: the first round never answers inside its ceiling.
  if (H.slowFirstRound && H.calls <= 4) return new Promise(() => {});
  return payload;
};

vi.mock('../modules/properties/cloud.js', () => {
  const noop = async () => ({ ok: true });
  return {
    claimPropertyAccess: async () => ({ ok: true }),
    loadMyDoors: () => spine({ ok: true, doors: [] }),
    loadMyGrants: () => spine({ ok: true, grants: [] }),
    loadMyHousehold: () => spine({ ok: true, memberships: [] }),
    loadMyRentals: () => spine({ ok: true, rentals: [RENTAL] }),
    loadInvites: async () => ({ ok: true, invites: [] }),
    loadPublicVacancies: async () => ({ ok: true, vacancies: [] }),
    loadVacancyPhotos: async () => ({ ok: true, photos: [] }),
    loadAllPhotos: async () => ({ ok: true, photos: [] }),
    loadPhotoImages: async () => ({ ok: true, images: {} }),
    hydrateLegacyImages: async (p) => p,
    loadDoorRecord: async () => ({ ok: false }),
    loadRooms: async () => ({ ok: true, rooms: [] }),
    loadDoorPhotos: async () => ({ ok: true, photos: [] }),
    loadDoorTenancies: async () => ({ ok: true, tenancies: [] }),
    loadDocuments: async () => ({ ok: true, documents: [] }),
    loadSystems: async () => ({ ok: true, systems: [] }),
    loadSystemEvents: async () => ({ ok: true, events: [] }),
    loadDoorNotes: async () => ({ ok: true, notes: [] }),
    loadGuestLink: async () => ({ ok: true, token: null }), openGuestLink: async () => ({ ok: true, token: null }), closeGuestLink: async () => ({ ok: true }),
    loadRecordEvents: async () => ({ ok: true, events: [] }), loadDoorMoney: async () => ({ ok: true, months: [] }),
    loadDoorPapers: async () => ({ ok: true, documents: [] }), loadSignatures: async () => ({ ok: true, signatures: [] }),
    requestSignatures: async () => ({ ok: true }), signDocument: async () => ({ ok: true }),
    doorOfMyTenancy: async () => ({ ok: true, rentalId: null }), loadDoorStays: async () => ({ ok: true, rows: [] }),
    loadBookedNights: async () => ({ ok: true, ranges: [] }), loadDoorArea: async () => ({ ok: true, area: null, nearby: [] }),
    requestAStay: async () => ({ ok: true }), addDoorStay: async () => ({ ok: true }), decideStay: async () => ({ ok: true }),
    loadCameraMenu: async () => ({ ok: true, menu: [] }), loadCameraAccess: async () => ({ ok: true, rows: [] }),
    saveCameraMenu: async () => ({ ok: true }), askForCameras: async () => ({ ok: true }),
    decideCameraAccess: async () => ({ ok: true }), giveCameraAccess: async () => ({ ok: true }),
    loadPayeeForTenancy: async () => ({ ok: true, payee: null }),
    loadRentPayee: async () => ({ ok: true, payee: null }), saveRentPayee: async () => ({ ok: true }),
    loadApplications: async () => ({ ok: true, applications: [], unreadable: [] }),
    loadApplicationChecks: async () => ({ ok: true, checks: [], unreadable: [] }),
    addApplicationCheck: async () => ({ ok: true, check: {} }), decideApplication: async () => ({ ok: true }),
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
}));

const { default: PropertiesApp } = await import('../modules/properties/PropertiesApp.jsx');

let container; let root;
beforeEach(() => { H.calls = 0; H.slowFirstRound = false; vi.useFakeTimers({ shouldAdvanceTime: true }); });
afterEach(() => {
  vi.useRealTimers();
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

async function boot() {
  window.history.replaceState(null, '', `${window.location.pathname}?properties=1`);
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(PropertiesApp, { surface: 'poetech' }));
  });
  // Walk past both ceilings: the 6s first round, then the 12s retry.
  for (let i = 0; i < 40; i += 1) {
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  }
}

describe('a boot on a throttled road', () => {
  it('PROVEN-TO-CATCH: all four timing out is retried, and the page comes up', async () => {
    H.slowFirstRound = true;
    await boot();

    // Asked twice: four reads that timed out, then four that answered.
    expect(H.calls, 'the spine was not asked a second time').toBe(8);
    expect(
      /could not be reached/i.test(container.textContent || ''),
      'the page still declared itself unreachable after the road answered',
    ).toBe(false);
  });

  it('a healthy road is never retried — the second round costs nothing', async () => {
    H.slowFirstRound = false;
    await boot();
    expect(H.calls, 'a healthy boot asked the spine more than once').toBe(4);
  });
});
