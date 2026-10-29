// =============================================================================
// A short-stays-only season advertises the night alone (DR-1009)
// =============================================================================
// Darrell, 2026-10-13: "a check box for if/when we offer something more than
// short stays... so it won't have to advertise all options specifically for
// the seasons we decided"; "all of the above can also be an option... so we
// can get the first opportunity to get revenue."
// The card: a door offered short-term says "Short stays only", prints no
// month and no cadence, offers no application, and keeps the night and the
// calendar. "All of the above" prints everything. The share page says the
// same. Proven to catch each way.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { describeListing } from '../../../scripts/listing-share-pages.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../modules/properties/cloud.js', () => ({
  loadVacancyPhotos: async () => ({ ok: true, photos: [] }),
  loadPhotoImages: async () => ({ ok: true, images: {} }),
  loadSiblingPhotos: async () => ({ ok: true, photos: [], siblings: [] }),
  // The building's picture pool (DR-1290), empty: a door with no other apartments.
  loadBuildingPool: async () => ({ ok: true, photos: [], doors: [], placed: {} }),
  placeBuildingPhoto: async () => ({ ok: true, saved: 1 }), unplaceBuildingPhoto: async () => ({ ok: true, removed: 1 }),
  loadBookedNights: async () => ({ ok: true, ranges: [] }),
  requestAStay: async () => ({ ok: true }),
  loadDoorArea: async () => ({ ok: true, area: null, nearby: [] }),
}));
vi.mock('../lib/supabase.js', () => ({ default: { auth: { getSession: async () => ({ data: { session: null } }) } }, phoneLoginEmail: () => '' }));

const { VacancyCard } = await import('../modules/properties/Storefront.jsx');

let container; let root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });

const DOOR = {
  id: 'd1', rentalId: 'd1', label: '805 North Prospect Avenue', unit: 'Apt 2', where: 'Champaign, Illinois',
  rent: 800, weekly: 200, biweekly: null, nightly: 150, beds: 1, baths: 1, addressShown: true, street: '805 North Prospect Avenue',
  note: '', buildingNote: null, area: null, nearby: [], sharedHome: false, rentableLevel: 'unit', utilities: null,
};
async function show(unit) {
  if (root) { act(() => root.unmount()); container.remove(); }
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement('ul', null, createElement(VacancyCard, { unit, onApply: () => {} }))); });
  await act(async () => { await Promise.resolve(); });
}
const at = (id) => container.querySelector(`[data-testid="${id}"]`);

describe('the card', () => {
  it('short stays only: says so, no month, no cadence, no application; the night and the calendar stay', async () => {
    // the shelf reads no lease price for this season (0288); the card says why
    await show({ ...DOOR, offering: 'short-term', rent: null, weekly: null });
    expect(at('vacancy-rent').textContent).toMatch(/^Short stays only/);
    expect(at('vacancy-rent').textContent).not.toMatch(/Rent on request|\/mo/);
    expect(at('vacancy-cadence')).toBeNull();
    expect(at('vacancy-apply')).toBeNull();
    expect(at('book-a-stay-open')).toBeTruthy();
    expect(container.textContent).toMatch(/Short stay welcome · \$150\/night/);
  });

  it('PROVEN-TO-CATCH: "all of the above" prints the month, the cadence, the application AND the night', async () => {
    await show({ ...DOOR, offering: 'both' });
    expect(at('vacancy-rent').textContent).toMatch(/^\$800\/mo/);
    expect(at('vacancy-cadence').textContent).toMatch(/Weekly \$200/);
    expect(at('vacancy-apply')).toBeTruthy();
    expect(at('book-a-stay-open')).toBeTruthy();
    expect(container.textContent).toMatch(/\$150\/night/);
  });

  it('a lease-only door prints the month and the application, and no night', async () => {
    await show({ ...DOOR, offering: 'long-term' });
    expect(at('vacancy-rent').textContent).toMatch(/^\$800\/mo/);
    expect(at('vacancy-apply')).toBeTruthy();
    expect(at('book-a-stay-open')).toBeNull();
    expect(container.textContent).not.toMatch(/\/night/);
  });
});

describe('the share page', () => {
  const ROW = { city: 'Champaign', state: 'Illinois', rent: null, weekly_rate: null, biweekly_rate: null, nightly_rate: 150, offering: 'short-term', shared_home: false, building_note: 'Laundry in the entry' };
  it('says short stays only, the night, and never a month', () => {
    expect(describeListing(ROW)).toBe('Champaign, Illinois · Short stays only · Short stay $150/night · The building: Laundry in the entry');
  });
  it('PROVEN-TO-CATCH: "all of the above" says everything', () => {
    expect(describeListing({ ...ROW, offering: 'both', rent: 800, weekly_rate: 200 })).toBe('Champaign, Illinois · $800/mo · Monthly $800 · Weekly $200 ($867 a month on average, $1,000 in a five-week month) · Short stay $150/night · The building: Laundry in the entry');
  });
});
