// =============================================================================
// A shared home says so on the card (DR-0952)
// =============================================================================
// Darrell, 2026-10-11: "It should be noted this is a co-living situation!!!!!"
// and "All utilities paid..." — and, on where this is going, "Eventually we
// will have all co-living... I believe... Just want to be ready."
//
// HIS OWN CARD READ "1-bed multi-family in Champaign, Illinois" for 805 North
// Prospect Room 1 - Bed A. That is a BED in an apartment with housemates. The
// label came from public_vacancies() counting BEDROOMS and never reading
// rentable_level, which 0160 added for exactly this. Somebody books that
// expecting their own place and arrives with their things in a car; the cost
// is not a lost click.
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

const BED = {
  id: 'u1', rentalId: 'r1', label: 'Bed in a shared multi-family in Champaign, Illinois',
  where: 'Champaign, Illinois', unit: '', rent: 750, beds: 1, baths: 1,
  offering: 'long-term', nightly: null, note: '', addressShown: false,
  area: null, nearby: [], sharedHome: true, rentableLevel: 'bed', utilities: true,
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

describe('a bed in a shared home', () => {
  it('PROVEN-TO-CATCH: says it is shared, and that there are housemates', async () => {
    const text = await show(BED);
    expect(at('vacancy-shared-home'), 'the card never said this is a shared home').toBeTruthy();
    expect(text).toMatch(/private bed in a shared home/i);
    expect(text).toMatch(/housemates/i);
    expect(text).toMatch(/kitchen and bathroom are shared/i);
  });

  it('a private room says room, not bed', async () => {
    await show({ ...BED, rentableLevel: 'room' });
    expect(at('vacancy-shared-home').textContent).toMatch(/private room in a shared home/i);
  });

  it('a whole unit says nothing of the kind — this is not a blanket banner', async () => {
    await show({ ...BED, sharedHome: false, rentableLevel: 'unit' });
    expect(at('vacancy-shared-home'), 'a whole apartment was advertised as shared').toBeFalsy();
  });
});

describe('utilities, with three states and not two', () => {
  it('says so when they are included', async () => {
    await show(BED);
    expect(at('vacancy-utilities').textContent).toMatch(/all utilities paid/i);
  });

  it('says so when they are not', async () => {
    await show({ ...BED, utilities: false });
    expect(at('vacancy-utilities').textContent).toMatch(/not included/i);
  });

  it('PROVEN-TO-CATCH: says NOTHING when nobody has said', async () => {
    // A listing that answers a question nobody answered is lying by
    // omission, and "not included" would be the costly guess.
    await show({ ...BED, utilities: null });
    expect(at('vacancy-utilities'), 'the card answered a question nobody had answered').toBeFalsy();
  });
});
