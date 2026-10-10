// @vitest-environment jsdom
// =============================================================================
// EVERY DOOR HAS A WAY IN THAT NEEDS NO EMAIL
// =============================================================================
// Darrell, 2026-10-10, locked out of Poe Properties on his own phone:
// "Never sent an email link to let me in!!!!!!?!" and "I can't login using my
// email... why".
//
// WHAT WAS TRUE. SMTP has never been wired on the family server, so the
// Royalty Link cannot arrive — the app knew that well enough to SAY it on the
// "Link requested" screen, and still offered the link as a door. Worse, the
// Poe Properties door (PropertiesDoor.jsx:422) renders PasswordAuth, and
// PasswordAuth offered email and phone and NOTHING ELSE. Google was already
// built, already guarded by the GoTrue probe, already proven in AuthModal,
// DeviceLinkApprove and ConferenceAccountOnRamp — and was absent from the one
// door he was standing at, while his own address is a gmail address.
//
// So the lockout was not a server problem he had to wait on. It was a door
// this component never drew.
//
// WHAT THIS PINS:
//   * every screen of PasswordAuth offers a door that needs no email —
//     the password screen, the link-request screen, and above all the
//     "Link requested" dead end, which is the screen he was actually on;
//   * the copy never claims a password works when the reader may not have
//     one, and never tells the reader to go and find a particular person;
//   * the Google door asks GoTrue what is ON before navigating, so a disabled
//     provider explains itself instead of dead-ending (the 2026-09-11 raw-JSON
//     incident that auth-providers.js was born from).
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import PasswordAuth from '../components/PasswordAuth.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(HERE, '..', ...p), 'utf8');

let container, root;
afterEach(() => {
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
  vi.restoreAllMocks();
});

async function mount(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(el); });
  return container;
}
const at = (sel) => container.querySelector(`[data-testid="${sel}"]`);

describe('the door Poe Properties actually renders', () => {
  it('PROVEN-TO-CATCH: the password screen offers a door that needs no email', async () => {
    await mount(createElement(PasswordAuth, { mode: 'signin', embedded: true, startWith: 'email' }));
    const google = at('google-door');
    expect(google, 'no email-free door on the screen Poe Properties opens').toBeTruthy();
    expect(google.textContent).toContain('no email needed');
  });

  it('PROVEN-TO-CATCH: the "Link requested" dead end offers it too', async () => {
    // This is the exact screen Darrell was standing on. Before this change it
    // offered a password he might not have, and a person to go and ask.
    await mount(createElement(PasswordAuth, { mode: 'signin', embedded: true, startWith: 'email' }));
    // Switch to the link door and request one; the send is stubbed so no
    // network is touched and the dead-end screen renders.
    const sb = await import('../lib/supabase.js');
    vi.spyOn(sb, 'sendRoyaltyLink').mockResolvedValue({ data: {}, error: null });
    const toLink = [...container.querySelectorAll('button')]
      .find((b) => /email me a link instead/i.test(b.textContent));
    expect(toLink, 'the link door should be reachable').toBeTruthy();
    await act(async () => { toLink.click(); });
    const email = container.querySelector('input[type="email"]');
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(email, 'someone@example.com');
      email.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const send = [...container.querySelectorAll('button[type="submit"]')].pop();
    await act(async () => { send.click(); });
    expect(container.textContent).toContain('Link requested');
    expect(at('google-door'), 'the dead end must carry the working door').toBeTruthy();
  });
});

describe('the copy says only what is true', () => {
  const src = read('components', 'PasswordAuth.jsx');

  it('never claims a password works when the reader may not have one', () => {
    // "Your password works without email." was false for anyone whose account
    // was created by a Royalty Link — there is no password on such an account.
    expect(src).not.toContain('Your password works without email.');
    expect(src).toContain('IF you set a password when you signed up');
  });

  it('does not send the reader to find one named person', () => {
    // The screen told Darrell to "ask Darrell".
    expect(src).not.toMatch(/ask Darrell/);
  });

  it('says plainly that the link cannot arrive, not that it might be slow', () => {
    expect(src).toContain('the link cannot arrive at all');
  });
});

describe('the Google door asks before it navigates', () => {
  const src = read('components', 'PasswordAuth.jsx');

  it('consults the GoTrue probe, popup first, redirect as the fallback', () => {
    // The 2026-09-11 incident: supabase-js builds the /authorize URL locally
    // and never errors, so an app that does not ask hands the browser a dead
    // endpoint and shows the member raw JSON.
    expect(src).toContain('guardProviderCached(\'google\')');
    expect(src).toContain('signInWithGooglePopup');
    expect(src).toContain('signInWithGoogle()');
    expect(src).toContain('resetAuthProvidersCache');
  });

  it('primes the probe on mount, so the check is ready before the tap', () => {
    expect(src).toContain('primeAuthProviders()');
  });
});
