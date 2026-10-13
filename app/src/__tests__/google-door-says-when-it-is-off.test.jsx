// @vitest-environment jsdom
// =============================================================================
// The Google door says when the family server has it switched off (DR-0900)
// =============================================================================
// Darrell, 2026-10-10, on the "Link requested" screen with "Continue with
// Google — no email needed" under his cursor: "Need to work with Google...
// doesn't work!!!!!!!"
//
// WHAT WAS TRUE. The door offered Google on every screen whatever the family
// server said, and on "Link requested" the guard's refusal went to an error
// that screen never drew, so the tap did nothing at all. DR-0361's rule is
// that a provider switched off is never offered. These pin it: when GoTrue
// reports google:false the button is replaced by a sentence that says so and
// names the doors that work, the screen's copy stops promising Google, and a
// refusal at tap time is drawn under the door, never swallowed.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import PasswordAuth from '../components/PasswordAuth.jsx';
import { resetAuthProvidersCache } from '../lib/auth-providers.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
afterEach(() => {
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  resetAuthProvidersCache();
});

const settings = (google) => vi.fn(async (url) => (String(url).includes('/auth/v1/settings')
  ? { ok: true, json: async () => ({ external: { email: true, phone: false, google } }) }
  : { ok: false, json: async () => ({}) }));

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(PasswordAuth, { mode: 'signin', embedded: true, startWith: 'email' })); });
  for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
}
const at = (id) => container.querySelector(`[data-testid="${id}"]`);

async function toLinkRequested() {
  const sb = await import('../lib/supabase.js');
  vi.spyOn(sb, 'sendRoyaltyLink').mockResolvedValue({ data: {}, error: null });
  const toLink = [...container.querySelectorAll('button')].find((b) => /email me a link instead/i.test(b.textContent));
  await act(async () => { toLink.click(); });
  const email = container.querySelector('input[type="email"]');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => { setter.call(email, 'darrell@example.com'); email.dispatchEvent(new Event('input', { bubbles: true })); });
  const send = [...container.querySelectorAll('button[type="submit"]')].pop();
  await act(async () => { send.click(); });
  for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); });
}

describe('the Google door when the family server has Google OFF', () => {
  it('is not offered: a sentence says it is off and names the doors that work', async () => {
    vi.stubGlobal('fetch', settings(false));
    await mount();
    expect(at('google-door')).toBeNull();
    expect(at('google-door-off').textContent).toBe('Google sign-in is not switched on at the family server yet. Use your password, or your phone number and PIN.');
  });

  it('PROVEN-TO-CATCH: "Link requested" stops promising Google when it is off', async () => {
    vi.stubGlobal('fetch', settings(false));
    await mount();
    await toLinkRequested();
    expect(container.textContent).toContain('Link requested');
    expect(container.textContent).not.toContain('Google needs no email');
    expect(container.textContent).not.toContain('Continue with Google above needs no email at all');
    expect(at('google-door-off')).not.toBeNull();
  });
});

describe('the Google door when the family server has Google ON', () => {
  it('is offered, and "Link requested" names it', async () => {
    vi.stubGlobal('fetch', settings(true));
    await mount();
    expect(at('google-door')).not.toBeNull();
    await toLinkRequested();
    expect(container.textContent).toContain('Google needs no email');
    expect(at('google-door')).not.toBeNull();
  });
});
