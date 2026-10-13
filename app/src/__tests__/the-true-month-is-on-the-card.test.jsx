// =============================================================================
// The true month is on the card (DR-1003)
// =============================================================================
// Darrell, 2026-10-13: "$800 a monthly however $200 weekly... sounds the same
// until you get a 5 week month." The card says what each cadence comes to in
// a month, names the better deal, says the bedroom is shared two to a room,
// and says what the building offers.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { VacancyCard } from '../modules/properties/Storefront.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
const settle = async (n = 6) => {
  for (let i = 0; i < n; i += 1) await act(async () => { await Promise.resolve(); });
};
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

const APT = {
  id: 'u2', rentalId: 'r2', label: '805 North Prospect Avenue Apt 2', where: 'Champaign, Illinois', unit: 'Apt 2',
  rent: 800, beds: 2, baths: 1, offering: 'long-term', nightly: null, weekly: 200, biweekly: 400, buildingNote: 'Laundry in the entry',
  note: '', addressShown: true, area: null, nearby: [], sharedHome: false, rentableLevel: 'unit', utilities: null,
};

async function show(unit) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement('ul', null, createElement(VacancyCard, { unit })));
  });
  await settle();
  return container.textContent || '';
}
const at = (id) => container.querySelector(`[data-testid="${id}"]`);

describe('any cadence, the true month beside each', () => {
  it('prints the month beside the weekly and every-two-weeks prices, and names the better deal', async () => {
    await show(APT);
    expect(at('vacancy-cadence').textContent).toBe('Monthly $800 · Weekly $200 ($867 a month on average, $1,000 in a five-week month) · Every two weeks $400 ($867 a month on average, $1,200 in a month with three paydays)');
    expect(at('vacancy-deal').textContent).toBe('Monthly is the better deal: $67 a month less than weekly on average.');
  });

  it('PROVEN-TO-CATCH: a door priced monthly and no other way prints no comparison', async () => {
    await show({ ...APT, weekly: null, biweekly: null });
    expect(at('vacancy-cadence')).toBeFalsy();
    expect(at('vacancy-deal')).toBeFalsy();
  });

  it('a short-stay door counts its nights into the line; a lease-only door does not print a nightly figure it was never offered at', async () => {
    await show({ ...APT, offering: 'both', nightly: 150, biweekly: null });
    expect(at('vacancy-cadence').textContent).toMatch(/Nightly \$150 \(\$4,563 a month on average, \$4,650 in a 31-night month\)/);
    await show({ ...APT, offering: 'long-term', nightly: 150, biweekly: null });
    expect(at('vacancy-cadence').textContent).not.toMatch(/Nightly/);
  });

  it('says what the building offers', async () => {
    await show(APT);
    expect(at('vacancy-building').textContent).toBe('The building: Laundry in the entry');
    await show({ ...APT, buildingNote: null });
    expect(at('vacancy-building')).toBeFalsy();
  });

  it('a bed says the bedroom is shared, two to a room; a room stays a private room', async () => {
    await show({ ...APT, sharedHome: true, rentableLevel: 'bed' });
    expect(at('vacancy-shared-home').textContent).toMatch(/^A bed in a shared bedroom, two to a room, in a shared home\./);
    await show({ ...APT, sharedHome: true, rentableLevel: 'room' });
    expect(at('vacancy-shared-home').textContent).toMatch(/^A private room in a shared home\./);
  });
});
