// =============================================================================
// AuthModal — live render proof (Verification Doctrine: observe the REAL surface).
// Mounts the actual quiet sign-in dialog in jsdom and proves the behavior Darrell
// asked for: opens in place (no full-page jump), Google is primary, email is
// there, ESC + backdrop close it, focus lands inside, and a blocked popup falls
// back to the redirect (no lockout). Network-free: supabase + popup are mocked.
// =============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const h = vi.hoisted(() => ({ popupResult: { ok: true }, redirectErr: null }));

vi.mock('../lib/supabase.js', () => {
  const supabase = { auth: {} };
  return {
    default: supabase,
    supabase,
    signInWithGoogle: vi.fn(async () => ({ error: h.redirectErr })),
    signUpWithPassword: vi.fn(async () => ({ data: { session: null }, error: null })),
    signInWithPassword: vi.fn(async () => ({ data: { session: null }, error: null })),
    sendRoyaltyLink: vi.fn(async () => ({ error: null })),
    validateCredentials: (email, password) =>
      email && email.includes('@') && password && password.length >= 8 ? { email } : { error: { message: 'bad' } },
  };
});

vi.mock('../lib/oauth-popup.js', () => ({
  signInWithGooglePopup: vi.fn(async () => h.popupResult),
}));

import AuthModal from '../components/AuthModal.jsx';
import { signInWithGooglePopup } from '../lib/oauth-popup.js';
import { signInWithGoogle } from '../lib/supabase.js';

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(AuthModal, { open: true, onClose: () => {}, ...props }));
  });
}
const q = (re) => [...document.body.querySelectorAll('button, a')].find((b) => re.test(b.textContent));

beforeEach(() => { h.popupResult = { ok: true }; h.redirectErr = null; vi.clearAllMocks(); });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  document.body.style.overflow = '';
});

describe('AuthModal — the quiet in-app sign-in dialog', () => {
  it('renders as a labelled modal dialog with Google primary + email path', async () => {
    await mount({});
    const dialog = document.body.querySelector('[role="dialog"][aria-modal="true"]');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-labelledby')).toBe('auth-modal-h');
    const text = document.body.textContent;
    expect(text).toMatch(/Sign in or create your profile/i);
    expect(text).toMatch(/Continue with Google/i);
    // Phone+PIN leads since 2026-08-19 (DR-0307 §3: the sovereign stack has
    // no SMTP, so the email link cannot be the first door). The email path
    // stays one tap away — no lockout.
    expect(text).toMatch(/PIN/i);
    expect(text).toMatch(/Use email instead/i);
  });

  it('focus lands on the primary action inside the dialog (not loose on the page)', async () => {
    await mount({});
    // The focus move is deferred one tick (setTimeout 0) so the dialog is painted first.
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(/Continue with Google/i.test(document.activeElement.textContent)).toBe(true);
  });

  it('ESC closes the dialog (acts in place, dismissed cleanly)', async () => {
    let closed = false;
    await mount({ onClose: () => { closed = true; } });
    const dialog = document.body.querySelector('[role="dialog"]');
    await act(async () => {
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(closed).toBe(true);
  });

  it('clicking the backdrop closes; clicking the panel does NOT', async () => {
    let closes = 0;
    await mount({ onClose: () => { closes += 1; } });
    const backdrop = document.body.querySelector('[role="dialog"]').parentElement;
    const panel = document.body.querySelector('[role="dialog"]');
    await act(async () => { panel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); });
    expect(closes).toBe(0);
    await act(async () => { backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); });
    expect(closes).toBe(1);
  });

  it('Google popup success signs in and closes the dialog in place', async () => {
    h.popupResult = { ok: true };
    let signedIn = false; let closed = false;
    await mount({ onSignedIn: () => { signedIn = true; }, onClose: () => { closed = true; } });
    await act(async () => { q(/Continue with Google/i).click(); });
    expect(signInWithGooglePopup).toHaveBeenCalled();
    expect(signedIn).toBe(true);
    expect(closed).toBe(true);
    expect(signInWithGoogle).not.toHaveBeenCalled(); // no full-page redirect needed
  });

  it('a BLOCKED popup falls back to the full-page redirect — no lockout', async () => {
    h.popupResult = { blocked: true, url: 'https://google/auth' };
    await mount({});
    await act(async () => { q(/Continue with Google/i).click(); });
    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when closed', async () => {
    await mount({ open: false });
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });
});
