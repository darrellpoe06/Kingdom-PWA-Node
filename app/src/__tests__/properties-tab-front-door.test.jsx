// @vitest-environment jsdom
// =============================================================================
// PoeTech's Properties tab opens on the tenants' own front door (2026-10-21)
// =============================================================================
// Darrell: "Poe Properties should show the same front door that the Poe
// Properties Apps show our tenants... Owners should have an edit tab that lets
// them see the backend... they will see the tenants version inside the PoeTech
// App on Properties tab... just like the other one."
//
// Pinned here: the tab opens on the door's own SignedOutDoor (the same welcome,
// portals and live listings), Edit is the backend with every prop the shell
// handed it, a deep link into the backend opens Edit, and the preview never
// acts as someone else (no application sent, no second sign-in).
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

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
return {
  supabase: {
    auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    from: () => queryStub(),
    rpc: async () => ({ data: null, error: null }),
  },
  onAuthChange: (cb) => { cb(null); return () => {}; },
  default: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({}),
    },
    from: () => queryStub(),
    rpc: async () => ({ data: [], error: null }),
  },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
  readPersistedSession: () => null,
  resolveInitialSession: (emit, io) => { emit(io.readStored ? io.readStored() : null); },
  signOut: async () => ({}),
}; });
const appProps = [];
vi.mock('../modules/properties/PropertiesApp.jsx', () => ({
  default: (props) => { appProps.push(props); return createElement('div', { 'data-testid': 'properties-app' }, 'backend'); },
  PREVIEW_ROLES: ['tenant', 'household', 'field_worker', 'manager'],
}));
const sent = [];
vi.mock('../modules/properties/cloud.js', async (importOriginal) => ({
  ...(await importOriginal()),
  loadPublicVacancies: async () => ({ ok: true, vacancies: [{ id: 'r1', label: '805 North Prospect Avenue', unit: 'Apt 3', city: 'Champaign', state: 'Illinois', rent: 900, bedrooms: 1, bathrooms: 1, offering: 'long-term' }] }),
  submitApplication: async (a) => { sent.push(a); return { ok: true }; },
}));

import PropertiesTab, { initialPane, PROPERTIES_PANE_KEY } from '../modules/properties/PropertiesTab.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
const settle = () => act(async () => { for (let i = 0; i < 12; i += 1) await new Promise((r) => setTimeout(r, 0)); });
async function mount(props = { surface: 'poetech', books: { postEntry() {} } }) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesTab, props)); });
  // The front door is lazily loaded (one chunk, the door's own); wait for it.
  for (let i = 0; i < 100 && !container.querySelector('[data-testid="properties-portal-cards"], [data-testid="properties-app"]'); i += 1) {
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  }
  await settle();
  return container;
}
const click = async (el) => { await act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }); await settle(); };
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  root = null;
  appProps.length = 0;
  sent.length = 0;
  try { window.localStorage.clear(); } catch { /* noop */ }
});

describe('the Properties tab: the front door, then Edit', () => {
  it('PROVEN TO CATCH: it opens on the tenants\' own front door (welcome, the six portals), not the backend', async () => {
    const el = await mount();
    expect(el.querySelector('[data-testid="properties-front-door"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="properties-portal-cards"]')).toBeTruthy();
    expect(el.textContent).toMatch(/Welcome to/);
    expect(el.querySelector('[data-portal="tenant"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="properties-app"]')).toBeNull();
    // the pp-door look and its theme ride with it
    expect(el.querySelector('.pp-door style').textContent).toMatch(/\.pp-door\{/);
  });

  it('Edit is the backend, with every prop the shell handed the tab, and the choice is kept on the device', async () => {
    const props = { surface: 'poetech', books: { postEntry() {} }, onFeedback() {} };
    const el = await mount(props);
    await click(el.querySelector('[data-testid="properties-pane-edit"]'));
    expect(el.querySelector('[data-testid="properties-app"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="properties-front-door"]')).toBeNull();
    expect(appProps.at(-1).surface).toBe('poetech');
    expect(appProps.at(-1).books).toBe(props.books);
    expect(appProps.at(-1).onFeedback).toBe(props.onFeedback);
    expect(window.localStorage.getItem(PROPERTIES_PANE_KEY)).toBe('edit');
  });

  it('a deep link into the backend opens Edit; otherwise the last choice, else the front door', () => {
    const mem = (v) => ({ getItem: () => v });
    expect(initialPane({ address: { tab: 'doors', door: null }, storage: mem('front') })).toBe('edit');
    expect(initialPane({ address: { tab: null, door: 'r1' }, storage: mem(null) })).toBe('edit');
    expect(initialPane({ address: { tab: null, door: null }, storage: mem('edit') })).toBe('edit');
    expect(initialPane({ address: { tab: null, door: null }, storage: mem('front') })).toBe('front');
    expect(initialPane({ address: { tab: null, door: null }, storage: mem('junk') })).toBe('front');
    expect(initialPane({ address: { tab: null, door: null }, storage: { getItem() { throw new Error('blocked'); } } })).toBe('front');
  });

  it('PROVEN TO CATCH: "I live here" never signs the owner in again, and opens the tenant\'s own signed-in screens over the owner\'s doors', async () => {
    const el = await mount();
    await click(el.querySelector('[data-portal="tenant"]'));
    expect(el.querySelector('[data-testid="sign-in-panel"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="preview-sign-in"]').textContent).toMatch(/held in this preview/);
    expect(el.querySelector('input[type="email"], input[type="password"]')).toBeNull();
    expect([...el.querySelectorAll('button')].some((b) => /Sign in \/ create a profile/.test(b.textContent))).toBe(false);
    await click(el.querySelector('[data-testid="preview-view-as"]'));
    expect(el.querySelector('[data-testid="properties-view-as"]').getAttribute('data-role')).toBe('tenant');
    expect(el.querySelector('[data-testid="properties-view-as-banner"]').textContent).toMatch(/Seen as a tenant[\s\S]*recorded as you, the owner/);
    expect(appProps.at(-1).viewAs).toBe('tenant');
    expect(appProps.at(-1).surface).toBe('poetech');
    await click(el.querySelector('[data-testid="properties-view-as-back"]'));
    expect(el.querySelector('[data-testid="properties-portal-cards"]')).toBeTruthy();
  });

  it('the 1099 worker and the manager open their own faces too; "I own properties" opens the backend', async () => {
    const el = await mount();
    await click(el.querySelector('[data-portal="field_worker"]'));
    await click(el.querySelector('[data-testid="preview-view-as"]'));
    expect(appProps.at(-1).viewAs).toBe('field_worker');
    await click(el.querySelector('[data-testid="properties-pane-front"]'));
    await click(el.querySelector('[data-portal="landlord"]'));
    expect(el.querySelector('[data-testid="preview-view-as"]')).toBeNull();
    await click(el.querySelector('[data-testid="preview-to-edit"]'));
    expect(el.querySelector('[data-testid="properties-app"]')).toBeTruthy();
    expect(appProps.at(-1).viewAs ?? null).toBe(null);
  });

  it('PROVEN TO CATCH: "Looking for a place" shows the live listings and the full application, and nothing is sent from the owner\'s seat', async () => {
    const el = await mount();
    await click(el.querySelector('[data-portal="applicant"]'));
    expect(el.querySelector('[data-testid="vacancies-panel"]').textContent).toMatch(/Available now/);
    expect(el.textContent).toMatch(/805 North Prospect Avenue/);
    const apply = el.querySelector('[data-testid="vacancy-apply"]');
    expect(apply).toBeTruthy();
    await click(apply);
    expect(el.querySelector('[data-testid="preview-apply-held"]')).toBeTruthy();
    expect([...el.querySelectorAll('button')].some((b) => b.textContent === 'Send my application')).toBe(false);
    expect(sent).toEqual([]);
  });
});
