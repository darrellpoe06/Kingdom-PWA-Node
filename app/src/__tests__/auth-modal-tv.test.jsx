// =============================================================================
// The sign-in dialog on a television leads with the phone (DR-0658)
// =============================================================================
// Darrell on the Fire TV, 2026-09-25: "Hard to sign in on a Firestick... what
// happened to the qr code ways?" His dialog offered Google and a phone number
// + PIN typed with a D-pad, and ran off the bottom of the screen. This proves
// the dialog he will meet now: on a TV the phone door is first, focus lands on
// it, one press shows a QR and a code, and the typed doors wait behind one
// button. Everywhere else the phone door is still there, at the top.
// The 960x540 fit is MEASURED in a real browser (scripts/device-link-e2e.mjs).
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const h = vi.hoisted(() => ({ rpc: null }));

vi.mock('../lib/supabase.js', () => {
  const supabase = {
    auth: {},
    rpc: (...a) => h.rpc(...a),
  };
  return {
    default: supabase,
    supabase,
    signInWithGoogle: vi.fn(async () => ({ error: null })),
    signUpWithPassword: vi.fn(async () => ({ data: { session: null }, error: null })),
    signInWithPassword: vi.fn(async () => ({ data: { session: null }, error: null })),
    sendRoyaltyLink: vi.fn(async () => ({ error: null })),
    validateCredentials: () => ({ error: { message: 'bad' } }),
  };
});
vi.mock('../lib/oauth-popup.js', () => ({ signInWithGooglePopup: vi.fn(async () => ({ ok: true })) }));

import AuthModal from '../components/AuthModal.jsx';

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(AuthModal, { open: true, onClose: () => {}, ...props }));
  });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  document.body.style.overflow = '';
});

describe('on a television', () => {
  it('focus lands on "Sign in with your phone", before any other door', async () => {
    h.rpc = vi.fn(async () => ({ data: [], error: null }));
    await mount({ tv: true });
    const active = document.activeElement;
    expect(active && active.getAttribute('data-testid')).toBe('phone-signin-button');
    expect(active.textContent).toMatch(/Sign in with your phone/);
    const buttons = [...document.querySelectorAll('[role="dialog"] button')].filter((b) => !/Close/.test(b.getAttribute('aria-label') || ''));
    expect(buttons[0].getAttribute('data-testid')).toBe('phone-signin-button');
  });

  it('the typed doors wait behind one button, so the dialog is short enough for a TV', async () => {
    h.rpc = vi.fn(async () => ({ data: [], error: null }));
    await mount({ tv: true });
    expect(document.querySelector('input[type="password"]')).toBe(null);
    const more = document.querySelector('[data-testid="auth-typed-doors"]');
    await act(async () => { more.click(); });
    expect(document.body.textContent).toMatch(/PIN/);
  });

  it('pressing it shows a QR and an 8-character code, and asks the database with the hash only', async () => {
    h.rpc = vi.fn(async (name, args) => ({ data: [{ user_code: args.p_user_code, expires_at: new Date(Date.now() + 600000).toISOString() }], error: null }));
    await mount({ tv: true });
    await act(async () => { document.activeElement.click(); });
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(h.rpc).toHaveBeenCalledWith('device_link_start', expect.objectContaining({ p_device_hash: expect.stringMatching(/^[0-9a-f]{64}$/) }));
    expect(document.querySelector('[data-testid="phone-signin-qr"] svg')).toBeTruthy();
    expect(document.querySelector('[data-testid="phone-signin-code"]').textContent).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    // Focus did not fall off the panel when the QR appeared.
    expect(document.activeElement.getAttribute('data-testid')).toBe('phone-signin-button');
  });
});

describe('everywhere else', () => {
  it('the phone door is at the top, and Google keeps the focus', async () => {
    h.rpc = vi.fn(async () => ({ data: [], error: null }));
    await mount({ tv: false });
    const dialog = document.querySelector('[role="dialog"]');
    const panel = dialog.querySelector('[data-testid="phone-signin"]');
    const google = [...dialog.querySelectorAll('button')].find((b) => /Continue with Google/.test(b.textContent));
    expect(panel).toBeTruthy();
    expect(panel.compareDocumentPosition(google) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.activeElement).toBe(google);
  });
});
