// =============================================================================
// DR-1600 — the PoeTech door carries the person's picture at the top right,
// and its menu goes where each row says.
// =============================================================================
// Darrell 2026-11-19, the PoeTech app on his tablet (?view=admin) beside the
// Love Corner on his phone: "What happened to the image in the top right
// corner of PoeTech App for getting access like the Love Corner App?" His
// screenshot was the COLLAPSED header ("Show header | Family Operating
// Systems | Text size"), where the account did not render at all: it lived
// only inside the open header, as a face-and-name chip with Log out under it.
//
// Each rule here fails on the old header (proven by running this file against
// the pre-change HeaderAuthButton, TopNavRow and shell): the old chip has no
// picture button and no menu, the old row has no account slot, and the old
// shell mounts the chip inside the wrapping controls row.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let currentSession = null;
const signOutSpy = vi.fn();
vi.mock('../lib/supabase.js', () => ({
  default: {},
  onAuthChange: (cb) => {
    cb(currentSession);
    return () => {};
  },
  signOut: (...a) => signOutSpy(...a),
}));
vi.mock('../components/AuthModal.jsx', () => ({
  default: ({ open }) => (open ? createElement('div', { 'data-testid': 'auth-modal' }) : null),
}));
let myProfile = null;
vi.mock('../lib/profiles-sync.js', () => ({
  loadMyProfile: async () => myProfile,
  initialsOf: (n) =>
    String(n || '?')
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
}));
vi.mock('../components/Modal.jsx', () => ({
  default: ({ open, children, label }) => (open ? createElement('div', { 'data-testid': `dialog-${label}` }, children) : null),
}));
vi.mock('../components/MyProfile.jsx', () => ({
  default: () => createElement('div', { 'data-testid': 'my-profile-editor' }, 'Take or choose a picture'),
}));
vi.mock('../components/shell/PersonalizeSheet.jsx', () => ({
  default: ({ open, door }) => (open ? createElement('div', { 'data-testid': 'personalize-sheet', 'data-door': door }) : null),
}));

const { default: HeaderAuthButton } = await import('../components/HeaderAuthButton.jsx');
const { default: TopNavRow } = await import('../components/TopNavRow.jsx');
const { floatingMenuBox } = await import('../components/shell/AccountMenu.jsx');
const { POETECH_ACCOUNT_ROWS, poetechAccountRows, rowHasPlace, viewIdsOf } = await import('../lib/poetech-account-rows.js');

const SHELL = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'poe-financial-mvp-v28.jsx'), 'utf8');

// The reader's tabs as the shell hands them: [id, label] pairs with the separator.
const FAMILY_TABS = [
  ['overview', 'Big Picture'],
  ['about', 'About'],
  ['__sep__', null],
  ['messages', 'Messages'],
  ['church', 'Church'],
  ['admin', 'Admin'],
];
const MEMBER_TABS = [
  ['overview', 'Big Picture'],
  ['about', 'About'],
  ['__sep__', null],
  ['messages', 'Messages'],
];

let container, root;
const mount = (el) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(el));
};
const settle = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
const q = (id) => container.querySelector(`[data-testid="${id}"]`) || document.querySelector(`[data-testid="${id}"]`);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

beforeEach(() => {
  window.scrollTo = () => {};
});
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = null;
  container = null;
  currentSession = null;
  myProfile = null;
  signOutSpy.mockClear();
});

function door(tabs = FAMILY_TABS) {
  return { navTabs: tabs, setView: vi.fn(), setChurchView: vi.fn(), theme: 'heritage', setTheme: vi.fn(), isOwner: true };
}

describe('DR-1600 rows: each one has a real place on the PoeTech door, or it is not offered', () => {
  it('a family reader with every tab gets the seven rows, in order', () => {
    expect(poetechAccountRows(viewIdsOf(FAMILY_TABS)).map((r) => r.key)).toEqual([
      'profile',
      'church',
      'messages',
      'subscription',
      'personalize',
      'admin',
      'logout',
    ]);
  });
  it('a row whose view the reader is not drawn is left out (no Admin, no My Church for a member without them)', () => {
    const keys = poetechAccountRows(viewIdsOf(MEMBER_TABS)).map((r) => r.key);
    expect(keys).not.toContain('admin');
    expect(keys).not.toContain('church');
    expect(keys).toEqual(['profile', 'messages', 'subscription', 'personalize', 'logout']);
  });
  it('every declared row has a proven place for the reader who has every tab: a row added with no place fails here', () => {
    const all = viewIdsOf(FAMILY_TABS);
    for (const r of POETECH_ACCOUNT_ROWS) expect(rowHasPlace(r, all), `${r.key} has no place`).toBe(true);
    expect(rowHasPlace({ key: 'x', to: { view: 'nowhere' } }, all)).toBe(false);
    expect(rowHasPlace({ key: 'x', to: { dialog: 'give' } }, all)).toBe(false);
    expect(rowHasPlace({ key: 'x', to: { sheet: 'all' } }, all)).toBe(false);
    expect(rowHasPlace({ key: 'x' }, all)).toBe(false);
  });
  it("the church's own rows and the rows whose controls sit in the open header are not on this door", () => {
    const keys = POETECH_ACCOUNT_ROWS.map((r) => r.key);
    for (const k of ['give', 'contact', 'notifications', 'all']) expect(keys).not.toContain(k);
  });
  it('viewIdsOf drops the separator and anything that is not an id', () => {
    expect(viewIdsOf([['a', 'A'], ['__sep__', null], [null, 'x'], 'b'])).toEqual(['a', 'b']);
    expect(viewIdsOf(null)).toEqual([]);
  });
});

describe('DR-1600 the picture: signed in, a round button at the top right opens the menu', () => {
  it('signed in: the picture is a 40px button that opens a menu with the person, and My Profile first', async () => {
    currentSession = { user: { id: 'u1', email: 'christina@example.com' } };
    myProfile = { displayName: 'Christina Poe', photoThumb: 'data:image/png;base64,AAAA' };
    mount(createElement(HeaderAuthButton, { door: door() }));
    await settle();
    const pic = q('door-avatar');
    expect(pic, 'no picture button on the PoeTech door').toBeTruthy();
    expect(pic.getAttribute('aria-haspopup')).toBe('menu');
    expect(pic.querySelector('img').getAttribute('width')).toBe('40');
    expect(q('door-account-menu')).toBeNull();
    click(pic);
    const menu = q('door-account-menu');
    expect(menu).toBeTruthy();
    expect(menu.textContent).toContain('Christina Poe');
    expect(menu.textContent).toContain('christina@example.com');
    expect([...menu.querySelectorAll('[role="menuitem"]')].map((b) => b.textContent)).toEqual([
      'My Profile',
      'My Church',
      'Messages',
      'SubscriptionPoeTech+',
      'Appearance & Accessibility',
      'Admin',
      'Log Out',
    ]);
  });

  it('every row goes where it says', async () => {
    currentSession = { user: { id: 'u1', email: 'a@example.com' } };
    const d = door();
    mount(createElement(HeaderAuthButton, { door: d }));
    await settle();
    const press = (key) => {
      if (!q('door-account-menu')) click(q('door-avatar'));
      click(q(`door-menu-${key}`));
    };
    press('messages');
    expect(d.setView).toHaveBeenLastCalledWith('messages');
    expect(q('door-account-menu'), 'the menu closes when a row leaves').toBeNull();
    press('subscription');
    expect(d.setView).toHaveBeenLastCalledWith('about');
    press('admin');
    expect(d.setView).toHaveBeenLastCalledWith('admin');
    press('church');
    expect(d.setChurchView).toHaveBeenLastCalledWith('my-record');
    expect(d.setView).toHaveBeenLastCalledWith('church');
    press('personalize');
    expect(q('personalize-sheet')).toBeTruthy();
    expect(q('personalize-sheet').getAttribute('data-door')).toBe('poetech');
    press('profile');
    expect(q('dialog-My profile')).toBeTruthy();
    expect(q('my-profile-editor')).toBeTruthy();
    expect(q('door-account-menu'), 'the menu holds while My profile is open').toBeTruthy();
    click(q('door-menu-logout'));
    expect(signOutSpy).toHaveBeenCalledTimes(1);
  });

  it('Escape closes the menu', async () => {
    currentSession = { user: { id: 'u1', email: 'a@example.com' } };
    mount(createElement(HeaderAuthButton, { door: door() }));
    await settle();
    click(q('door-avatar'));
    expect(q('door-account-menu')).toBeTruthy();
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(q('door-account-menu')).toBeNull();
  });

  it('signed out: the same Log in box, a full 36px control, and it opens sign-in', async () => {
    currentSession = null;
    mount(createElement(HeaderAuthButton, { door: door() }));
    await settle();
    expect(q('door-avatar')).toBeNull();
    const login = q('door-login');
    expect(login.textContent).toBe('Log in');
    expect(login.className).toMatch(/min-h-\[2\.25rem\]/);
    click(login);
    expect(q('auth-modal')).toBeTruthy();
  });

  it('without a door (TLC public door) the chip is unchanged: face, name, Log out under it', async () => {
    currentSession = { user: { id: 'u1', email: 'a@example.com' } };
    myProfile = { displayName: 'Shay' };
    mount(createElement(HeaderAuthButton));
    await settle();
    expect(q('door-avatar')).toBeNull();
    expect([...container.querySelectorAll('button')].map((b) => b.textContent)).toContain('Log out');
  });
});

describe('DR-1600 the menu floats over the page, outside the zoomed header, inside the screen', () => {
  it('it opens under the picture, right edges lined up, 272px wide', () => {
    expect(floatingMenuBox({ bottom: 100, right: 700 }, 768, 1024)).toEqual({ top: 106, left: 428, width: 272, maxHeight: 910 });
  });
  it('at 320px it fits whole; on a narrower screen it narrows, never starting left of the screen', () => {
    const p = floatingMenuBox({ bottom: 60, right: 280 }, 320, 640);
    expect(p).toMatchObject({ width: 272, left: 8 });
    const b = floatingMenuBox({ bottom: 60, right: 240 }, 260, 640);
    expect(b.width).toBe(244);
    expect(b.left).toBe(8);
    expect(b.left + b.width).toBeLessThanOrEqual(260 - 8);
  });
  it('with little room below, it scrolls rather than running off the bottom', () => {
    expect(floatingMenuBox({ bottom: 600, right: 300 }, 360, 700).maxHeight).toBe(120);
    expect(floatingMenuBox({ bottom: 200, right: 300 }, 360, 700).maxHeight).toBe(486);
  });
  it('the PoeTech menu is drawn in a layer on <body> carrying the theme, not inside the header', async () => {
    currentSession = { user: { id: 'u1', email: 'a@example.com' } };
    mount(createElement(HeaderAuthButton, { door: { ...door(), theme: 'midnight' } }));
    await settle();
    click(q('door-avatar'));
    const menu = document.querySelector('[data-testid="door-account-menu"]');
    expect(container.contains(menu), 'the menu is inside the header (the zoom shrinks it)').toBe(false);
    expect(menu.closest('[data-theme]').getAttribute('data-theme')).toBe('midnight');
    expect(menu.style.position).toBe('fixed');
  });
});

describe('DR-1600 the collapsed header keeps the picture', () => {
  const row = (collapsed) =>
    createElement(
      TopNavRow,
      { collapsed, onToggleHeader: () => {}, account: createElement('span', { 'data-testid': 'the-picture' }) },
      createElement('button', { key: 'a', type: 'button' }, 'Money'),
      createElement('button', { key: 'b', type: 'button' }, 'Admin')
    );
  it('collapsed: the row carries the account, right of the tabs and left of the chevron', () => {
    mount(row(true));
    const slot = q('top-nav-account');
    expect(slot, 'the collapsed row drops the picture').toBeTruthy();
    expect(slot.querySelector('[data-testid="the-picture"]')).toBeTruthy();
    // From lg the sidebar takes the tabs and nothing else in the row grows; the
    // slot takes the slack so the picture holds the right edge (measured: x=377 at 1812px without it).
    expect(slot.className).toMatch(/\bml-auto\b/);
    const chevron = container.querySelector('button[aria-expanded="false"]');
    expect(slot.compareDocumentPosition(chevron) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(q('top-nav-tabs').compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('open: the row does not carry it (the open header does), so it is never drawn twice', () => {
    mount(row(false));
    expect(q('top-nav-account')).toBeNull();
  });
});

describe('DR-1600 the shell mounts the picture at the top right, open and collapsed', () => {
  it('open: the picture sits OUTSIDE the wrapping controls row, as its last item, so it holds the top right', () => {
    expect(SHELL).toContain(
      '<div className="flex items-start justify-end gap-2 sm:gap-3 min-w-0"><div className="flex items-center gap-2 sm:gap-3 flex-1 flex-wrap justify-end'
    );
    expect(SHELL).toContain('</div>{!isIsolatedPreview() && <HeaderAuthButton door={accountDoor} />}</div>');
  });
  it('collapsed: the nav row is handed the compact picture', () => {
    expect(SHELL).toContain('<TopNavRow account={!isIsolatedPreview() && <HeaderAuthButton door={accountDoor} compact />}');
  });
  it("the door is the reader's own tab list and the shell's own setters", () => {
    expect(SHELL).toContain('const accountDoor = { navTabs, setView, setChurchView, theme, setTheme, isOwner: isFamilyMember };');
  });
});
