// =============================================================================
// The shelf shows its pictures to a stranger (DR-1236)
// =============================================================================
// Darrell, 2026-10-27, signed out on poetech.us: "the images don't populate
// when we are advertising the apartment... it does when you go into the first
// tab however... if you don't have an account you should be able to just see
// the images". And on the branded door: "Images below for the advertised
// apartments?"
//
// MEASURED before the fix (the anon probe, Chromium, signed out): the front
// door rendered state=ok cards=2 pictures=0 and never asked
// public_vacancy_photo_list — it handed the card the raw row, which has no
// rentalId. These cases mount the REAL VacancyCard behind both doors and
// prove the ask happens, the picture renders, the row is thumb-sized, and a
// read that failed says what failed instead of "nothing is listed".
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const DOOR = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const ROW = { id: DOOR, label: 'Bed in a shared multi-family in Champaign, Illinois', unit: '', city: 'Champaign', state: 'Illinois', property_type: 'multi-family', rent: 500, offering: 'long-term', address_shown: false, shared_home: true, rentable_level: 'bed' };
const LIST = [
  { id: 'p1', caption: 'The kitchen', taken_at: null, from_sibling: true, has_thumb: true },
  { id: 'p2', caption: 'The porch', taken_at: null, from_sibling: true, has_thumb: false },
  { id: 'p3', caption: '', taken_at: null, from_sibling: true, has_thumb: true },
];
const BYTES = { p1: 'data:image/jpeg;base64,KITCHEN', p2: 'data:image/jpeg;base64,PORCH', p3: 'data:image/jpeg;base64,THREE' };

const loadPublicVacancies = vi.fn();
const loadVacancyPhotos = vi.fn();
const loadVacancyPicture = vi.fn();

vi.mock('../lib/supabase.js', () => {
  function queryStub() {
    const q = {}; const self = () => q;
    for (const m of ['select', 'eq', 'neq', 'in', 'order', 'limit', 'range', 'gte', 'lte', 'is', 'not', 'upsert', 'insert', 'update', 'delete', 'match']) q[m] = self;
    q.maybeSingle = async () => ({ data: null, error: null });
    q.single = async () => ({ data: null, error: null });
    q.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    return q;
  }
  const auth = { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), signOut: async () => ({}) };
  const client = { auth, from: () => queryStub(), rpc: async () => ({ data: null, error: null }) };
  return {
    supabase: client, default: client,
    onAuthChange: (cb) => { cb(null); return () => {}; },
    phoneLoginEmail: () => '', normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
    readPersistedSession: () => null,
    resolveInitialSession: (emit, io) => { emit(io.readStored ? io.readStored() : null); },
    signOut: async () => ({}),
  };
});
vi.mock('../modules/properties/cloud.js', async (orig) => ({
  ...(await orig()),
  loadPublicVacancies: (...a) => loadPublicVacancies(...a),
  loadVacancyPhotos: (...a) => loadVacancyPhotos(...a),
  loadVacancyPicture: (...a) => loadVacancyPicture(...a),
}));
vi.mock('../modules/properties/PropertiesApp.jsx', () => ({ default: () => createElement('div', { 'data-testid': 'properties-app' }, 'module') }));
vi.mock('../components/PasswordAuth.jsx', () => ({ default: () => createElement('div', { 'data-testid': 'password-auth' }, 'Create your profile') }));

const { default: PublicFrontDoor } = await import('../components/PublicFrontDoor.jsx');
const { default: PropertiesDoor } = await import('../components/PropertiesDoor.jsx');
const { vacancyUnit, vacancyUnits, readFailureLine } = await import('../modules/properties/vacancy-unit.js');

let container; let root;
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove(); root = container = null;
  loadPublicVacancies.mockReset(); loadVacancyPhotos.mockReset(); loadVacancyPicture.mockReset();
  try { window.localStorage.clear(); } catch { /* noop */ }
});
async function flush(n = 8) { for (let i = 0; i < n; i += 1) await act(async () => { await Promise.resolve(); }); }
async function mount(Component, props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(Component, props)); });
  await flush();
  return container;
}
const click = (el) => act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
function shelfIsUp() {
  loadPublicVacancies.mockResolvedValue({ ok: true, vacancies: [ROW] });
  loadVacancyPhotos.mockResolvedValue({ ok: true, photos: LIST });
  loadVacancyPicture.mockImplementation(async (rentalId, id) => ({ ok: true, src: BYTES[id] || null }));
}

describe('one reading of the row, for every door', () => {
  it('names rentalId from the row id — the key the card asks for its pictures with', () => {
    const u = vacancyUnit(ROW);
    expect(u.rentalId).toBe(DOOR);
    expect(u.id).toBe(DOOR);
    expect(u.label).toMatch(/^Bed in a shared/);
    expect(u.sharedHome).toBe(true);
    expect(u.rentableLevel).toBe('bed');
  });
  it('a field the row does not carry stays null, never 0 or an invented answer', () => {
    const u = vacancyUnit({ id: 'x', label: 'A door' });
    expect(u.rent).toBeNull(); expect(u.beds).toBeNull(); expect(u.weekly).toBeNull(); expect(u.nightly).toBeNull();
    expect(u.utilities).toBeNull(); expect(u.area).toBeNull(); expect(u.street).toBe('');
    expect(u.addressShown).toBe(true); // an older RPC: shown, which is what it always was
  });
  it('an older row names its door by address, and a row with no name is left off the shelf', () => {
    expect(vacancyUnit({ id: 'y', address: '12 Example Road' }).label).toBe('12 Example Road');
    expect(vacancyUnits([{ id: 'z' }, ROW, null])).toHaveLength(1);
  });
  it('the failure line carries the read, the reason and the code — never a key', () => {
    const line = readFailureLine({ reason: 'rpc-error', error: 'PGRST301 bearer eyJabcdefghijk.eyJzdWIiOiIxIn0.sig' });
    expect(line).toMatch(/^Read failed: public_vacancies · rpc-error · PGRST301/);
    expect(line).not.toMatch(/eyJ/);
    expect(readFailureLine(undefined)).toBe('Read failed: public_vacancies · read-failed');
  });
});

describe('the PoeTech front door, signed out', () => {
  it('PROVEN TO CATCH: the card asks for the door\'s pictures by its id and shows one', async () => {
    shelfIsUp();
    const el = await mount(PublicFrontDoor);
    await flush(12);
    // The ask that never happened before the fix (pictures=0, measured).
    expect(loadVacancyPhotos).toHaveBeenCalledWith(DOOR);
    const shelf = el.querySelector('[data-testid="front-door-shelf"]');
    expect(shelf?.tagName).toBe('UL');
    const img = el.querySelector(`[data-testid="vacancy-card-${DOOR}"] img`);
    expect(img, 'a picture on the public card').toBeTruthy();
    expect(img.getAttribute('src')).toMatch(/^data:image\//);
    expect(img.getAttribute('alt')).toBeTruthy();
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('the swipeable row: a thumb-sized tap for each picture, lazy, with alt text', async () => {
    shelfIsUp();
    const el = await mount(PublicFrontDoor);
    await flush(12);
    const strip = el.querySelector('[data-testid="vacancy-picture-strip"]');
    expect(strip, 'the row').toBeTruthy();
    expect(strip.className).toMatch(/overflow-x-auto/);
    expect(strip.className).toMatch(/snap-x/);
    const taps = strip.querySelectorAll('button');
    expect(taps.length).toBe(LIST.length);
    for (const b of taps) {
      expect(b.className).toMatch(/min-w-\[44px\]/);
      expect(b.className).toMatch(/min-h-\[44px\]/);
      expect(b.getAttribute('aria-label')).toMatch(/Show photo \d of 3/);
    }
    const imgs = strip.querySelectorAll('img');
    expect(imgs.length).toBe(LIST.length);
    for (const i of imgs) { expect(i.getAttribute('alt')).toBeTruthy(); expect(i.getAttribute('loading')).toBe('lazy'); }
    // Tapping the second thumb shows the second picture large.
    await click(taps[1]);
    const big = el.querySelector(`[data-testid="vacancy-card-${DOOR}"] [data-testid="vacancy-photo-open"] img`);
    expect(big.getAttribute('alt')).toBe('The porch');
    expect(taps[1].getAttribute('aria-current')).toBe('true');
  });

  it('never the street: a held door shows the town and no street line (DR-0933)', async () => {
    shelfIsUp();
    const el = await mount(PublicFrontDoor);
    await flush(12);
    expect(el.querySelector('[data-testid="vacancy-street"]')).toBeNull();
    expect(el.textContent).toContain('Champaign, Illinois');
  });

  it('a read that failed says WHAT failed in one line, and Try again asks once more', async () => {
    loadPublicVacancies.mockResolvedValueOnce({ ok: false, reason: 'rpc-error', error: 'PGRST000 could not connect' });
    const el = await mount(PublicFrontDoor);
    const box = el.querySelector('[data-testid="front-door-unreadable"]');
    expect(box).toBeTruthy();
    expect(box.textContent).toMatch(/could not be loaded/);
    expect(el.querySelector('[data-testid="front-door-unreadable-why"]').textContent).toBe('Read failed: public_vacancies · rpc-error · PGRST000 could not connect');
    const again = el.querySelector('[data-testid="front-door-try-again"]');
    expect(again.className).toMatch(/min-h-\[44px\]/);
    shelfIsUp();
    await click(again);
    await flush(12);
    expect(loadPublicVacancies).toHaveBeenCalledTimes(2);
    expect(el.querySelector('[data-testid="front-door-unreadable"]')).toBeNull();
    expect(el.querySelector(`[data-testid="vacancy-card-${DOOR}"]`)).toBeTruthy();
  });
});

describe('the branded Poe Properties door, signed out', () => {
  it('PROVEN TO CATCH: the advertised apartments and their pictures sit UNDER the portals', async () => {
    shelfIsUp();
    const el = await mount(PropertiesDoor);
    await flush(12);
    const portals = el.querySelector('[data-testid="properties-portal-cards"]');
    const shelf = el.querySelector('[data-testid="advertised-now-shelf"]');
    expect(portals, 'the six portals').toBeTruthy();
    expect(shelf, 'the shelf on the chooser page').toBeTruthy();
    expect(portals.compareDocumentPosition(shelf) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(loadVacancyPhotos).toHaveBeenCalledWith(DOOR);
    const img = shelf.querySelector(`[data-testid="vacancy-card-${DOOR}"] img`);
    expect(img?.getAttribute('src')).toMatch(/^data:image\//);
    expect(el.querySelector('[data-testid="vacancy-street"]')).toBeNull();
    expect(el.querySelector('[data-testid="advertised-now"]').textContent).toMatch(/1 place to live — no account needed to look/);
  });

  it('a read that failed on this door is never "Nothing is listed" (DR-0946), and says why', async () => {
    loadPublicVacancies.mockResolvedValue({ ok: false, reason: 'rpc-error', error: '57014 canceling statement due to statement timeout' });
    const el = await mount(PropertiesDoor);
    await flush(12);
    expect(el.textContent).not.toMatch(/Nothing is listed/);
    expect(el.querySelector('[data-testid="advertised-now"] [data-testid="front-door-unreadable"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="front-door-unreadable-why"]').textContent).toMatch(/57014/);
    // The same truth once "Looking for a Place" is tapped.
    const tap = Array.from(el.querySelectorAll('button')).find((b) => /Looking for a Place/i.test(b.textContent));
    await click(tap);
    await flush(6);
    expect(el.querySelector('[data-testid="vacancies-panel"] [data-testid="front-door-unreadable"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="front-door-none"]')).toBeNull();
    expect(el.textContent).not.toMatch(/Nothing is listed/);
  });

  it('an empty shelf says so only on the applicant step; the chooser page stays the portals', async () => {
    loadPublicVacancies.mockResolvedValue({ ok: true, vacancies: [] });
    const el = await mount(PropertiesDoor);
    await flush(6);
    expect(el.querySelector('[data-testid="advertised-now"]')).toBeNull();
    const tap = Array.from(el.querySelectorAll('button')).find((b) => /Looking for a Place/i.test(b.textContent));
    await click(tap);
    await flush(6);
    expect(el.querySelector('[data-testid="front-door-none"]')).toBeTruthy();
  });
});
