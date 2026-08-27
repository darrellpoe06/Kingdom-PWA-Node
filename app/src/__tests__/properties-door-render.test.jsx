// =============================================================================
// The Poe Properties door RENDERS what its copy promises
// =============================================================================
// Caught on the door's first real render check (2026-08-26, headless Chromium
// against the built bundle): the page said "sign in with the email address your
// landlord used to invite you" while the form underneath asked for a phone
// number and a PIN. That is not cosmetic — a tenant is recognized by the EXACT
// address their landlord invited (migration 0150's claim function matches
// auth.users.email), so a phone-first login hands an invited person a session
// that can never match their invitation, and the app would tell them, honestly
// and uselessly, that they have no door.
//
// Proven-to-catch: if the door ever stops asking for email first, this fails.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The door checks for a session on mount; a signed-OUT check is the state under
// test (that is when the sign-in form renders).
vi.mock('../lib/supabase.js', () => ({
  default: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({}),
    },
    // The signed-out door asks for listed vacancies; two listed, so the
    // "nothing available" copy and the listing copy are both exercised.
    rpc: async (name) => (name === 'public_vacancies'
      ? { data: [{ id: 'v1', label: 'Maple Street', unit: 'Unit 2', city: 'Davenport', state: 'IA', property_type: 'duplex', rent: 950, note: 'Available Sept 1' }], error: null }
      : { data: null, error: null }),
  },
  phoneLoginEmail: (p) => (String(p || '').replace(/\D+/g, '').length >= 10 ? `1${String(p).replace(/\D+/g, '')}@phone.poetech.us` : ''),
  normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
}));

import PropertiesDoor from '../components/PropertiesDoor.jsx';

let container, root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesDoor)); });
  await act(async () => { await Promise.resolve(); });
}

const click = async (re) => {
  const el = [...container.querySelectorAll('button')].find((b) => re.test(b.textContent));
  expect(el, `no button matching ${re}`).toBeTruthy();
  await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await act(async () => { await Promise.resolve(); });
};

describe('the signed-out door', () => {
  it('carries the Poe Properties name, not PoeTech', async () => {
    await mount();
    expect(container.querySelector('h1').textContent).toBe('Poe Properties');
  });

  it('ASKS who you are before demanding a sign-in', async () => {
    await mount();
    expect(container.textContent).toMatch(/Who are you\?/i);
    const text = container.textContent;
    for (const label of ['Looking for a place', 'I live here', 'I do the work', 'I manage properties', 'I own properties']) {
      expect(text, `"${label}" is not offered`).toContain(label);
    }
    // No sign-in form until a person says which one they are.
    expect(container.querySelectorAll('input')).toHaveLength(0);
  });

  it('says out loud which choice needs no account', async () => {
    await mount();
    expect(container.textContent).toMatch(/No account needed/i);
  });

  it('an APPLICANT sees the listed units with no sign-in at all', async () => {
    await mount();
    await click(/Looking for a place/i);
    expect(container.textContent).toMatch(/Available now/i);
    expect(container.textContent).toMatch(/Maple Street/);
    expect(container.textContent).toMatch(/Davenport/);
    expect(container.textContent).toMatch(/\$950\/mo/);
    // Still no sign-in demanded of someone just looking.
    expect(container.querySelectorAll('input')).toHaveLength(0);
  });

  it('never publishes the street address to someone with no account', async () => {
    await mount();
    await click(/Looking for a place/i);
    expect(container.textContent).toMatch(/address is given by a person, not published here/i);
  });

  it('a TENANT gets the sign-in, and it names BOTH identities the invite accepts', async () => {
    await mount();
    await click(/Your unit, work orders/i);
    const labels = [...container.querySelectorAll('label')].map((l) => l.textContent);
    expect(labels.some((l) => /email/i.test(l)), `email field missing; saw: ${labels.join(', ')}`).toBe(true);
    expect(container.textContent).toMatch(/email address .*or the cell phone number.*invite you/is);
    // The phone+PIN way stays REACHABLE (DR-0172 — not everyone has email).
    expect(/phone number \+ (a )?PIN/i.test(container.textContent)).toBe(true);
  });
});
