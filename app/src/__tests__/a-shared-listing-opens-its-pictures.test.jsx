// =============================================================================
// A shared listing opens on its card with the pictures open (DR-1006)
// =============================================================================
// Darrell: the link opens the app with that unit's pictures open. Tested by
// USING it: the door is mounted at the address the preview page hands over,
// and the card is expected to have scrolled into view and opened its first
// picture; a link to a unit that is gone is told so from the path alone.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const UNIT_A = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const UNIT_B = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const VACANCIES = [
  { id: UNIT_A, label: '805 North Prospect Avenue Apt 2', unit: 'Apt 2', city: 'Champaign', state: 'Illinois', property_type: 'multi-family', rent: 800, weekly_rate: 200, offering: 'long-term', address_shown: false },
  { id: UNIT_B, label: '1003 Koehn Dr', unit: '', city: 'Danville', state: 'IL', property_type: 'single-family', rent: 680, bedrooms: 3, address_shown: true },
];
const PHOTOS = { [UNIT_A]: [{ id: 'p1', storage_path: 'data:image/jpeg;base64,/9j/4AAQ', caption: 'The kitchen' }] };

vi.mock('../lib/supabase.js', () => {
  function queryStub() {
    const q = {};
    const self = () => q;
    for (const m of ['select', 'eq', 'neq', 'in', 'order', 'limit', 'range', 'gte', 'lte', 'is', 'not', 'upsert', 'insert', 'update', 'delete', 'match']) q[m] = self;
    q.maybeSingle = async () => ({ data: null, error: null });
    q.single = async () => ({ data: null, error: null });
    q.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    return q;
  }
  const rpc = async (name, args) => (name === 'public_vacancies'
    ? { data: VACANCIES, error: null }
    : name === 'public_vacancy_photos' || name === 'public_vacancy_photo_list'
      ? { data: PHOTOS[args?.p_rental] || [], error: null }
      // One picture at a time (DR-1016): the bytes by id.
      : name === 'public_vacancy_picture'
        ? { data: (PHOTOS[args?.p_rental] || []).find((p) => p.id === args?.p_id)?.storage_path || null, error: null }
        : { data: null, error: null });
  const auth = { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), signOut: async () => ({}) };
  return {
    supabase: { auth, from: () => queryStub(), rpc },
    onAuthChange: (cb) => { cb(null); return () => {}; },
    default: { auth, from: () => queryStub(), rpc },
    phoneLoginEmail: () => '',
    normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
    readPersistedSession: () => null,
    resolveInitialSession: (emit) => { emit(null); },
    signOut: async () => ({}),
  };
});

const PropertiesDoor = (await import('../components/PropertiesDoor.jsx')).default;

let container; let root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  try { window.history.replaceState(null, '', '/'); } catch { /* ignore */ }
});
const settle = async (n = 8) => { for (let i = 0; i < n; i += 1) await act(async () => { await Promise.resolve(); }); };

async function arrive(url) {
  window.history.replaceState(null, '', url);
  container = document.createElement('div');
  document.body.appendChild(container);
  const scrolled = [];
  window.HTMLElement.prototype.scrollIntoView = function stub(opts) { scrolled.push({ el: this, opts }); };
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesDoor)); });
  await settle();
  return scrolled;
}

describe('a shared listing', () => {
  it('PROVEN-TO-CATCH: ?listing=<id> lands on the applicant step, scrolls to that card and opens its pictures — the form stays closed', async () => {
    const scrolled = await arrive(`/properties/app/?properties=1&listing=${UNIT_A}`);
    expect(container.querySelector('[data-testid="vacancies-panel"]'), 'the door did not open on the listings').toBeTruthy();
    const card = container.querySelector(`[data-testid="vacancy-card-${UNIT_A}"]`);
    expect(card, 'the shared unit has no card').toBeTruthy();
    expect(scrolled.some((s) => s.el === card), 'the card was not scrolled into view').toBe(true);
    expect(document.querySelector('[role="dialog"][aria-modal="true"]'), 'the pictures did not open').toBeTruthy();
    expect(container.querySelector('[data-testid="apply-form"]'), 'a shared link opened the application form').toBeNull();
    expect(container.textContent).toMatch(/805 North Prospect Avenue Apt 2/);
  });

  it('the preview page\'s own path, when the page is gone and the shell booted on it, still opens the unit', async () => {
    await arrive(`/properties/l/${UNIT_A}/`);
    expect(document.querySelector('[role="dialog"][aria-modal="true"]')).toBeTruthy();
  });

  it('a unit that is gone is said so from the path, with everything that is listed', async () => {
    await arrive('/properties/l/00000000-0000-4000-c000-00000000dead/');
    expect(container.querySelector('[data-testid="listing-gone"]').textContent).toMatch(/not available right now/i);
    expect(container.querySelectorAll('[data-testid^="vacancy-card-"]').length).toBe(2);
    expect(document.querySelector('[role="dialog"][aria-modal="true"]')).toBeNull();
  });

  it('every card offers Share this listing', async () => {
    await arrive('/properties/app/?properties=1');
    const looking = [...container.querySelectorAll('button')].find((b) => /Looking for a place/i.test(b.textContent));
    await act(async () => { looking.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await settle();
    expect(container.querySelectorAll('[data-testid="vacancy-share"] button').length).toBe(2);
  });
});
