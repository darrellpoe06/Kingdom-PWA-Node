// =============================================================================
// HeaderAuthButton — the obvious top-right Log in / Log out box (Darrell
// 2026-07-14, "like this" [TLC], "for all apps", "top right"). Proven-to-catch:
// signed OUT -> a real bordered button labelled "Log in"; signed IN -> "Log out".
// The label toggles by session state; it is a <button> (bordered box), never a
// faint text link.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The session onAuthChange reports is swapped per test via this holder.
let currentSession = null;
const signOutSpy = vi.fn();
vi.mock('../lib/supabase.js', () => ({
  default: {},
  onAuthChange: (cb) => { cb(currentSession); return () => {}; },
  signOut: (...a) => signOutSpy(...a),
}));
// AuthModal is heavy (focus trap, supabase auth UI); stub it to a marker so this
// test stays about the button, not the modal.
vi.mock('../components/AuthModal.jsx', () => ({
  default: ({ open }) => (open ? createElement('div', { 'data-testid': 'auth-modal' }) : null),
}));

const { default: HeaderAuthButton } = await import('../components/HeaderAuthButton.jsx');

let container, root;
const mount = () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(createElement(HeaderAuthButton)));
};
afterEach(() => { act(() => root.unmount()); container.remove(); signOutSpy.mockClear(); });

const button = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent || ''));

describe('HeaderAuthButton — obvious top-right Log in / Log out', () => {
  it('signed OUT: shows a bordered "Log in" button (not a faint link)', () => {
    currentSession = null;
    mount();
    const btn = button(/^log in$/i);
    expect(btn, 'no obvious "Log in" button when signed out').toBeTruthy();
    // It is a real bordered box (has a border utility), not a bare link.
    expect(btn.className).toMatch(/border/);
  });

  it('signed OUT: clicking Log in opens the auth modal', () => {
    currentSession = null;
    mount();
    expect(container.querySelector('[data-testid="auth-modal"]')).toBeFalsy();
    act(() => button(/^log in$/i).dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(container.querySelector('[data-testid="auth-modal"]')).toBeTruthy();
  });

  it('signed IN: shows "Log out" and calls signOut on click', () => {
    currentSession = { user: { email: 'someone@example.com' } };
    mount();
    const btn = button(/^log out$/i);
    expect(btn, 'no "Log out" button when signed in').toBeTruthy();
    expect(button(/^log in$/i)).toBeFalsy();
    act(() => btn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(signOutSpy).toHaveBeenCalledTimes(1);
  });
});
