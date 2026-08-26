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
  },
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

describe('the signed-out door', () => {
  it('carries the Poe Properties name, not PoeTech', async () => {
    await mount();
    expect(container.querySelector('h1').textContent).toBe('Poe Properties');
  });

  it('asks for the EMAIL the landlord invited — the identity the claim actually matches', async () => {
    await mount();
    const labels = [...container.querySelectorAll('label')].map((l) => l.textContent);
    expect(labels.some((l) => /email/i.test(l)), `email field missing; saw: ${labels.join(', ')}`).toBe(true);
    // The phone+PIN way stays REACHABLE (DR-0172 — not everyone has email), it
    // just does not lead here.
    const text = container.textContent;
    expect(/phone number \+ (a )?PIN/i.test(text)).toBe(true);
  });

  it('tells the person what the email is FOR, so a mismatch is not a mystery', async () => {
    await mount();
    expect(container.textContent).toMatch(/email address your landlord used to invite you/i);
  });
});
