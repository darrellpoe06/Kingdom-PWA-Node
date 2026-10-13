// =============================================================================
// AuthBanner — account status as two compact icons, the raw PII off the chrome
// =============================================================================
// Darrell 2026-09-14 (with a screenshot at the largest text size showing his
// phone number and email in plain sight): "the Signed in as cellphone number and
// email address can be represented by... a green phone or a not green phone and
// same with email... so the users information isn't exposed... then all the
// real-estate that bar is taking up can be incorporated into the header."
//
// PROVEN-TO-CATCH: the raw number/email must NOT render on the always-visible
// chrome — it lives only inside the tapped dialog. Revert the component to
// printing the label on the strip and tests 2 and 6 fail (the digits/address
// reappear in the chrome's textContent). The DR-0311 branches (linked door gets
// the "one library" reassurance and NEVER Add-email; a phone-only account gets
// Add-email) are pinned in the dialog. This amends DR-0253 §2 (which chose to
// show the number on the strip): the number is preserved, moved off the chrome.
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Session + identity swapped per test.
let currentSession = null;
let phoneUser = false;
let linked = false;
let labelVal = '';
vi.mock('../lib/supabase.js', () => ({
  default: {},
  onAuthChange: (cb) => { cb(currentSession); return () => {}; },
  isPhoneLoginSession: () => phoneUser,
  identityLabel: () => labelVal,
  promoteEmailToLogin: async () => ({ error: null }),
}));
vi.mock('../lib/person-links.js', () => ({
  isLinkedDoor: () => linked,
  linkedPrimary: () => 'darrellpoe06@gmail.com',
}));
vi.mock('../lib/auth-error-message.js', () => ({
  authErrorMessage: (_e, fb) => ({ text: fb }),
}));
// Icon → a marker carrying its name so we can assert both icons render.
vi.mock('../components/UiIcon.jsx', () => ({
  default: ({ name }) => createElement('span', { 'data-icon': name }),
}));
// The quiet Modal renders children ONLY when open — so anything inside it is,
// by construction, off the always-visible chrome until the user taps.
vi.mock('../components/Modal.jsx', () => ({
  default: ({ open, children, label }) =>
    (open ? createElement('div', { 'data-testid': 'account-dialog', 'aria-label': label }, children) : null),
}));

const { default: AuthBanner } = await import('../components/AuthBanner.jsx');

let container, root;
const mount = () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(createElement(AuthBanner)));
};
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  currentSession = null; phoneUser = false; linked = false; labelVal = '';
});

const openBtn = () => container.querySelector('button[aria-haspopup="dialog"]');
const open = () => act(() => openBtn().dispatchEvent(new window.MouseEvent('click', { bubbles: true })));
const dialog = () => container.querySelector('[data-testid="account-dialog"]');
const PHONE = { user: { email: '5636502416@phone.poetech.us' } };

describe('AuthBanner — status as icons, PII off the chrome', () => {
  it('1. signed out: renders nothing', () => {
    currentSession = null;
    mount();
    expect(container.textContent).toBe('');
    expect(container.querySelector('button')).toBeFalsy();
  });

  it('2. phone user: the raw number is NOT on the always-visible chrome', () => {
    currentSession = PHONE; phoneUser = true; linked = false; labelVal = '(563) 650-2416';
    mount();
    expect(dialog(), 'dialog should be closed at rest').toBeFalsy();
    expect(container.textContent, 'the number must not be visible on the chrome').not.toContain('563');
    expect(container.querySelector('[data-icon="phone"]')).toBeTruthy();
    expect(container.querySelector('[data-icon="mail"]')).toBeTruthy();
    const b = openBtn();
    expect(b.getAttribute('aria-label')).toMatch(/signed in by phone/i);
    expect(b.getAttribute('aria-label')).toMatch(/no email added yet/i);
    expect(b.getAttribute('aria-label'), 'the label must not leak the digits').not.toContain('563');
  });

  it('3. tapping opens the dialog, where the number lives', () => {
    currentSession = PHONE; phoneUser = true; labelVal = '(563) 650-2416';
    mount();
    open();
    expect(dialog()).toBeTruthy();
    expect(dialog().textContent).toContain('(563) 650-2416');
  });

  it('4. linked door: the one-library reassurance in the dialog, never Add-email (DR-0311)', () => {
    currentSession = PHONE; phoneUser = true; linked = true; labelVal = '(563) 650-2416';
    mount();
    // reassurance is not on the chrome before opening
    expect(container.textContent).not.toMatch(/one library, both doors/);
    open();
    expect(dialog().textContent).toMatch(/one library, both doors/);
    expect([...dialog().querySelectorAll('button')].some((b) => /add email/i.test(b.textContent || '')))
      .toBe(false);
  });

  it('5. phone-only account: offers Add email inside the dialog (DR-0253)', () => {
    currentSession = PHONE; phoneUser = true; linked = false; labelVal = '(563) 650-2416';
    mount();
    open();
    expect([...dialog().querySelectorAll('button')].some((b) => /add email/i.test(b.textContent || '')))
      .toBe(true);
  });

  it('6. email account: address off the chrome, "email attached" in the label', () => {
    currentSession = { user: { email: 'darrellpoe06@gmail.com' } };
    phoneUser = false; linked = false; labelVal = 'darrellpoe06@gmail.com';
    mount();
    expect(container.textContent, 'the address must not be visible on the chrome').not.toContain('darrellpoe06');
    const b = openBtn();
    expect(b.getAttribute('aria-label')).toMatch(/signed in by email/i);
    expect(b.getAttribute('aria-label')).toMatch(/email attached/i);
    open();
    expect(dialog().textContent).toContain('darrellpoe06@gmail.com');
  });
});
