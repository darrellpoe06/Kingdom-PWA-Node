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
// The person's own row (DR-0342): the header reads it to show the face + name.
let myProfile = null;
vi.mock('../lib/profiles-sync.js', () => ({
  loadMyProfile: async () => myProfile,
  initialsOf: (n) => String(n || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
}));
// The quiet Modal + the editor are heavy; markers keep this about the header.
vi.mock('../components/Modal.jsx', () => ({
  default: ({ open, children }) => (open ? createElement('div', { 'data-testid': 'profile-dialog' }, children) : null),
}));
vi.mock('../components/MyProfile.jsx', () => ({
  default: () => createElement('div', { 'data-testid': 'my-profile-editor' }, 'Take or choose a picture'),
}));

const { default: HeaderAuthButton } = await import('../components/HeaderAuthButton.jsx');

let container, root;
const mount = () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(createElement(HeaderAuthButton)));
};
afterEach(() => { act(() => root.unmount()); container.remove(); signOutSpy.mockClear(); myProfile = null; });
const settle = () => act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });

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

// Darrell 2026-09-09: "All apps users profile shows and has login or out under
// it... so it is looked at... or seen... And upload a photo spot." The box
// carries the person: picture (or initials + a "+ photo" spot), chosen name,
// Log out beneath; tapping the face opens My profile on any app.
describe('HeaderAuthButton — the person is seen: face + name above Log out, and a photo spot', () => {
  it('signed IN with a saved picture: shows the picture and the chosen name, Log out under it', async () => {
    currentSession = { user: { id: 'u1', email: 'darrellpoe06@gmail.com' } };
    myProfile = { userId: 'u1', displayName: 'Darrell Poe', photoThumb: 'data:image/jpeg;base64,/9j/4AAQ' };
    mount(); await settle();
    const chip = container.querySelector('[data-header-account] button[aria-haspopup="dialog"]');
    expect(chip).toBeTruthy();
    expect(chip.textContent).toMatch(/Darrell Poe/);
    expect(chip.querySelector('img')?.getAttribute('src')).toMatch(/^data:image\/jpeg/);
    expect(chip.textContent).not.toMatch(/\+ photo/);
    // Log out sits under it, still the obvious bordered box.
    const out = button(/Log out/);
    expect(out).toBeTruthy();
    expect(out.className).toMatch(/border/);
    expect(chip.compareDocumentPosition(out) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('signed IN without a picture: initials, the sign-in handle, and a "+ photo" spot', async () => {
    currentSession = { user: { id: 'u1', email: 'darrellpoe06@gmail.com' } };
    myProfile = null;
    mount(); await settle();
    const chip = container.querySelector('[data-header-account] button[aria-haspopup="dialog"]');
    expect(chip.textContent).toMatch(/darrellpoe06/);
    expect(chip.textContent).toMatch(/\+ photo/);
    expect(chip.querySelector('img')).toBeFalsy();
    expect(chip.getAttribute('aria-label')).toMatch(/add your picture/i);
  });

  it('tapping the face opens My profile — the upload spot — on whatever app this is', async () => {
    currentSession = { user: { id: 'u1', email: 'darrellpoe06@gmail.com' } };
    mount(); await settle();
    expect(container.querySelector('[data-testid="profile-dialog"]')).toBeFalsy();
    const chip = container.querySelector('[data-header-account] button[aria-haspopup="dialog"]');
    act(() => { chip.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    expect(container.querySelector('[data-testid="profile-dialog"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="my-profile-editor"]')?.textContent).toMatch(/Take or choose a picture/);
  });

  it('signed OUT: no chip, only the Log in box', () => {
    currentSession = null;
    mount();
    expect(container.querySelector('[data-header-account]')).toBeFalsy();
    expect(button(/Log in/)).toBeTruthy();
  });
});
