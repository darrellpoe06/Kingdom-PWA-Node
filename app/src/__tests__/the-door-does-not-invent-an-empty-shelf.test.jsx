// =============================================================================
// A scan that could not be checked is never told its unit is gone (DR-0953)
// =============================================================================
// Darrell, 2026-10-11: "Why didn't it pop up right away when scanning the
// qrcode?"
//
// His two screenshots are the whole case. At 7:59 the scanned card landed on
// "That unit is not available right now." and "Nothing is listed right now."
// At 8:00, the same page showed TWO listings. Nothing changed but the network.
//
// The cause was one line: `setVacancies(r.ok ? r.vacancies : [])`. A FAILED
// read became an EMPTY LIST, and the page stated that emptiness as fact.
//
// This is the third surface tonight with that exact shape and by far the
// worst, because the reader is a STRANGER STANDING AT THE DOOR with a camera.
// They are told the unit is taken, and they leave; we never hear about it.
//
// Also covered here: the application can be CLOSED, and the unit picker's
// options can be told apart.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { applyOptionLabel } from '../modules/properties/apply-link.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const UNIT = {
  id: '11111111-1111-4111-8111-111111111111',
  label: 'Bed in a shared multi-family in Champaign, Illinois',
  unit: 'Apt 4', city: 'Champaign', state: 'Illinois', property_type: 'multi-family',
  rent: 750, note: '', listed_at: '2026-10-01T00:00:00Z', bedrooms: 1, bathrooms: 1,
  offering: 'long-term', nightly_rate: null, min_stay_nights: null, showcase_order: 1,
  address_shown: false, area_lat: null, area_lng: null, nearby: [],
  rentable_level: 'bed', shared_home: true, utilities_included: true,
};

const H = { ok: true };
vi.mock('../modules/properties/cloud.js', () => ({
  loadPublicVacancies: async () => (H.ok
    ? { ok: true, vacancies: [UNIT] }
    : { ok: false, reason: 'rpc-error' }),
  loadVacancyPhotos: async () => ({ ok: true, photos: [] }),
  submitApplication: async () => ({ ok: true, id: 'a1' }),
}));

const { default: PropertiesDoor } = await import('../components/PropertiesDoor.jsx');

let container; let root;
const settle = async (n = 14) => {
  for (let i = 0; i < n; i += 1) await act(async () => { await Promise.resolve(); });
};
beforeEach(() => { H.ok = true; });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

async function scanTheCard() {
  window.history.replaceState(null, '', `${window.location.pathname}?apply=${UNIT.id}`);
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(PropertiesDoor, {}));
  });
  await settle();
  return container.textContent || '';
}
const at = (id) => container.querySelector(`[data-testid="${id}"]`);

describe('a QR scan when the listings could not be read', () => {
  it('PROVEN-TO-CATCH: never says the unit is unavailable, and never says nothing is listed', async () => {
    H.ok = false;
    const text = await scanTheCard();

    expect(
      /not available right now/i.test(text),
      'a stranger at the door was told the unit is taken, when we simply had no answer',
    ).toBe(false);
    expect(
      /Nothing is listed right now/i.test(text),
      'the page announced an empty shelf it had never successfully read',
    ).toBe(false);
  });

  it('says what actually happened, and offers the way through', async () => {
    H.ok = false;
    await scanTheCard();
    const said = at('vacancies-unreachable');
    expect(said, 'nothing told the visitor the read had failed').toBeTruthy();
    expect(said.textContent).toMatch(/not an empty list/i);
    expect(at('vacancies-retry'), 'no way to try again').toBeTruthy();
  });

  it('a real empty shelf still says so — the honest sentence is preserved', async () => {
    // Not a blanket suppression: when the read SUCCEEDS and there is nothing,
    // the page must still say nothing is listed.
    const mod = await import('../modules/properties/cloud.js');
    vi.spyOn(mod, 'loadPublicVacancies').mockResolvedValue({ ok: true, vacancies: [] });
    H.ok = true;
    const text = await scanTheCard();
    expect(/Nothing is listed right now/i.test(text)).toBe(true);
    expect(at('vacancies-unreachable')).toBeFalsy();
    vi.restoreAllMocks();
  });
});

describe('the application can be closed', () => {
  it('PROVEN-TO-CATCH: a scan opens it, and there is a way out', async () => {
    H.ok = true;
    await scanTheCard();
    expect(at('apply-form'), 'the scan did not open the application').toBeTruthy();
    const close = at('apply-close');
    expect(close, 'the form opened with no way to close it').toBeTruthy();

    await act(async () => { close.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await settle(6);
    expect(at('apply-form'), 'Close did not close the form').toBeFalsy();
  });
});

describe('the unit picker names the unit', () => {
  // Darrell's screenshot: "1-bed multi-family in Champaign, Illinois" and
  // "multi-family in Champaign, Illinois" — an applicant cannot choose from
  // that, and choosing wrong files on the wrong door.
  it('PROVEN-TO-CATCH: two doors of the same kind are tellable apart', async () => {
    const a = applyOptionLabel({ label: 'multi-family in Champaign, Illinois', unit: 'Apt 4', rent: 750, shared_home: true });
    const b = applyOptionLabel({ label: 'multi-family in Champaign, Illinois', unit: 'Apt 2', rent: 1200 });
    expect(a).not.toBe(b);
    expect(a).toMatch(/Apt 4/);
    expect(b).toMatch(/Apt 2/);
  });

  it('falls back to the rent when there is no unit designator', async () => {
    const a = applyOptionLabel({ label: 'multi-family in Champaign, Illinois', rent: 750 });
    const b = applyOptionLabel({ label: 'multi-family in Champaign, Illinois', rent: 1400 });
    expect(a).not.toBe(b);
    expect(a).toMatch(/\$750\/mo/);
  });

  it('does not say "shared" twice when the label already does', async () => {
    const l = applyOptionLabel({ label: 'Bed in a shared multi-family in Champaign, Illinois', unit: 'Apt 4', rent: 750, shared_home: true });
    expect((l.match(/shared/gi) || []).length).toBe(1);
  });

  it('a door with nothing to add is left exactly as its label', async () => {
    expect(applyOptionLabel({ label: 'multi-family in Champaign, Illinois' })).toBe('multi-family in Champaign, Illinois');
  });
});
