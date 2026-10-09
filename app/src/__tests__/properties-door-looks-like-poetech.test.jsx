// @vitest-environment jsdom
// =============================================================================
// The Poe Properties door looks like PoeTech, the tenants' version (DR-0827)
// =============================================================================
// Darrell 2026-10-09, two screenshots of the door: "Poe Properties App for
// tenants and workers etc... should look like PoeTech App just the tenants
// version... Lost features that are low hanging fruit for our tenants." The
// door used to be a bare header over the module. Now it carries the platform
// staples from the SAME shared libs the PoeTech shell and the TLC door use:
// the five themes (data-theme on the root), text size with its escape hatch,
// the hideaway top space, Install, Share · QR, and read-aloud. The two sign-out
// links keep their door semantics. Proven on the real component in jsdom.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../lib/supabase.js', () => {
// A query stub that answers any chain (select/eq/order/limit/maybeSingle...)
// with an empty, error-free result: the chrome's libs (voices, readers) ask
// the client on mount and none of them is what this test is about.
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
    rpc: async () => ({ data: [], error: null }),
  },
  phoneLoginEmail: () => '',
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
  readPersistedSession: () => null,
  resolveInitialSession: (emit, io) => { emit(io.readStored ? io.readStored() : null); },
  signOut: async () => ({}),
}; });
// The module under the chrome is not what this test is about.
vi.mock('../modules/properties/PropertiesApp.jsx', () => ({ default: () => createElement('div', { 'data-testid': 'properties-app' }, 'module') }));

import PropertiesDoor, { PROPERTIES_SHARE_URL } from '../components/PropertiesDoor.jsx';
import { THEMES } from '../lib/theme-css.js';
import { TEXT_SIZE_STEPS } from '../lib/text-size.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesDoor)); });
  await act(async () => { for (let i = 0; i < 4; i += 1) await Promise.resolve(); });
  return container;
}
const click = (el) => act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  root = null;
  try { window.localStorage.clear(); } catch { /* noop */ }
});

describe('the Poe Properties door carries the platform staples', () => {
  it('the five themes, from the shared palette, and a pick sets data-theme on the root', async () => {
    const el = await mount();
    const comfort = el.querySelector('[data-testid="properties-door-comfort"]');
    expect(comfort, 'the comfort controls render').toBeTruthy();
    const swatches = Array.from(comfort.querySelectorAll('button[aria-label$=" theme"]'));
    expect(swatches.length).toBe(THEMES.length);
    const midnight = swatches.find((b) => /midnight/i.test(b.getAttribute('aria-label')));
    expect(midnight, 'the midnight theme is offered').toBeTruthy();
    await click(midnight);
    expect(el.firstElementChild.getAttribute('data-theme')).toBe('midnight');
    expect(midnight.getAttribute('aria-pressed')).toBe('true');
  });

  it('text size steps, the same steps the PoeTech shell offers', async () => {
    const el = await mount();
    const steps = Array.from(el.querySelectorAll('[data-testid="properties-door-comfort"] button[aria-label^="Text size "]'));
    expect(steps.length).toBe(TEXT_SIZE_STEPS.length);
    const big = steps[steps.length - 1];
    await click(big);
    expect(big.getAttribute('aria-pressed')).toBe('true');
  });

  it('the hideaway tucks the top space away and brings it back, and the brand bar stays', async () => {
    const el = await mount();
    const chevron = el.querySelector('[data-testid="properties-door-hideaway"]');
    expect(chevron.getAttribute('aria-expanded')).toBe('true');
    await click(chevron);
    expect(chevron.getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelector('[data-testid="properties-door-comfort"]')).toBeNull();
    expect(el.querySelector('h1').textContent).toBe('Poe Properties');
    await click(chevron);
    expect(el.querySelector('[data-testid="properties-door-comfort"]')).toBeTruthy();
  });

  it('Install and Share · QR are on the door, and the QR carries the door\'s own address', async () => {
    const el = await mount();
    const install = Array.from(el.querySelectorAll('button')).find((b) => /install/i.test(b.textContent || ''));
    expect(install, 'the Install control renders when not installed').toBeTruthy();
    const share = el.querySelector('[data-testid="properties-door-share"]');
    expect(share.textContent).toMatch(/Share · QR/);
    await click(share);
    expect(share.textContent).toMatch(/Hide QR/);
    expect(PROPERTIES_SHARE_URL).toBe('https://poetech.us/properties/app/');
    expect(el.textContent).toContain('poetech.us/properties/app');
  });

  it('the header is sticky and the door name, not PoeTech, is the wordmark', async () => {
    const el = await mount();
    const header = el.querySelector('[data-testid="properties-door-header"]');
    expect(header.className).toMatch(/sticky/);
    expect(header.className).toMatch(/ts-safe-sticky/);
    expect(el.querySelector('h1').textContent).toBe('Poe Properties');
    expect(el.textContent).not.toMatch(/Sign out of PoeTech/);
  });
});
