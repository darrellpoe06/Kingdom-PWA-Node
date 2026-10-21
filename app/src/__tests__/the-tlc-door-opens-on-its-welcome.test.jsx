// The TLC door opens on its WELCOME SCREEN (DR-1197). Darrell, 2026-10-21,
// with DR-1171 live on his phone and the reference beside it: "Still does not
// look like this." The reference's first screen is the brand alone with Sign
// In / Create Account and a way past; DR-1171 had drawn that as a card UNDER
// the door's header, so the phone still opened on the old bar. These pin:
// when the welcome stands in front (a guest, a fresh open), when it never
// does (signed in, a link that lands somewhere), that the whole door stays
// mounted beneath it, and that every way off it is a thing the door already
// did. Same harness as tlc-public-door-render (react-dom/client + act).
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
vi.mock('../lib/tlc-assignments.js', async (orig) => ({ ...(await orig()), listMyAssignments: async () => ({ ok: true, rows: [] }), listAssignedToMe: async () => ({ ok: true, rows: [] }) }));
vi.mock('../lib/tlc-office-data.js', async (orig) => ({ ...(await orig()), useTlcOfficeData: () => ({ inquiries: [], practiceLeads: [], loaded: true, signedIn: false }), startTlcOfficeData: async () => ({}) }));
vi.mock('../lib/tlc-roster.js', async (orig) => { const real = await orig(); return { ...real, fetchPublicRoster: async () => [] }; });
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import TlcPublicDoor from '../components/TlcPublicDoor.jsx';
import TlcHome, { greetingFor } from '../components/TlcHome.jsx';
import TlcDoorDock from '../components/TlcDoorDock.jsx';
import { TLC_BRAND } from '../lib/tlc-practice.js';
import { welcomeShows, readEntered, writeEntered, firstHeaderCollapsed, TLC_WELCOME_KEY } from '../lib/tlc-welcome.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
async function mount(el = createElement(TlcPublicDoor)) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(el); });
}
beforeEach(() => { try { sessionStorage.removeItem(TLC_WELCOME_KEY); localStorage.removeItem('poe-header-collapsed'); } catch { /* no storage */ } });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  try { sessionStorage.removeItem(TLC_WELCOME_KEY); } catch { /* no storage */ }
});
const click = (el) => act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const button = (re, scope = container) => Array.from(scope.querySelectorAll('button')).find((b) => re.test(b.textContent.trim()));

describe('when the welcome stands in front of the door (pure)', () => {
  it('a guest on a fresh open meets it; a signed-in person, a returning visitor, and anyone a link already lands somewhere never do', () => {
    expect(welcomeShows({})).toBe(true);
    expect(welcomeShows({ signedIn: true })).toBe(false);
    expect(welcomeShows({ entered: true })).toBe(false);
    expect(welcomeShows({ onboardToken: 'abc' })).toBe(false);
    expect(welcomeShows({ deepLink: { lesson: 'x' } })).toBe(false);
    expect(welcomeShows({ jobs: true })).toBe(false);
  });
  it('going past it is remembered for the SESSION, fail-soft', () => {
    const store = new Map();
    const s = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) };
    expect(readEntered(s)).toBe(false);
    writeEntered(s);
    expect(readEntered(s)).toBe(true);
    expect(readEntered({ getItem: () => { throw new Error('blocked'); } })).toBe(false);
    expect(() => writeEntered({ setItem: () => { throw new Error('blocked'); } })).not.toThrow();
    expect(readEntered(null)).toBe(readEntered());
  });
  it('the top space starts tucked on a phone and open on a wider screen; a saved choice is not this function’s to override', () => {
    expect(firstHeaderCollapsed(true)).toBe(true);
    expect(firstHeaderCollapsed(false)).toBe(false);
  });
  it('the hour greets', () => {
    expect(greetingFor(8)).toBe('Good morning');
    expect(greetingFor(14)).toBe('Good afternoon');
    expect(greetingFor(20)).toBe('Good evening');
    expect(greetingFor(NaN)).toBe('Good afternoon');
  });
});

describe('the door on a fresh open', () => {
  it('shows the welcome in front — the brand, Sign in, Create an account, Continue — with the WHOLE door still mounted beneath it', async () => {
    await mount();
    const w = container.querySelector('[data-testid="tlc-welcome"]');
    expect(w, 'no welcome screen').toBeTruthy();
    expect(w.getAttribute('role')).toBe('dialog');
    expect(w.textContent).toContain('TLC');
    expect(w.textContent).toContain(TLC_BRAND.tagline);
    expect(w.textContent).toContain(TLC_BRAND.blurb);
    expect(button(/^Sign in$/, w)).toBeTruthy();
    expect(button(/^Create an account$/, w)).toBeTruthy();
    expect(button(/^Continue without an account$/, w)).toBeTruthy();
    // nothing removed: the door is all there under it
    expect(container.querySelector('header h1').textContent).toBe(TLC_BRAND.name);
    expect(container.textContent).toContain('Match a Preferred Provider');
    expect(container.textContent).toContain('Insurance Accepted');
    expect(container.querySelector('[data-testid="tlc-home"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="tlc-dock"]')).toBeTruthy();
    // the welcome carries no anchors (every outbound link on the door is target=_blank; the welcome's three are buttons)
    expect(w.querySelectorAll('a').length).toBe(0);
  });
  it('Continue lowers it, remembers that for the session, and a remount in the same session opens on the home', async () => {
    await mount();
    await click(button(/^Continue without an account$/, container.querySelector('[data-testid="tlc-welcome"]')));
    expect(container.querySelector('[data-testid="tlc-welcome"]')).toBeNull();
    expect(sessionStorage.getItem(TLC_WELCOME_KEY)).toBe('1');
    expect(container.querySelector('[data-testid="tlc-home"]').textContent).toContain('Welcome');
    act(() => root.unmount()); container.remove(); root = container = null;
    await mount();
    expect(container.querySelector('[data-testid="tlc-welcome"]')).toBeNull();
  });
  it('Sign in opens the door’s own entry in the bar, on sign-in; Create an account opens it on sign-up — the welcome leaves either way', async () => {
    await mount();
    await click(button(/^Sign in$/, container.querySelector('[data-testid="tlc-welcome"]')));
    expect(container.querySelector('[data-testid="tlc-welcome"]')).toBeNull();
    expect(container.querySelector('header').textContent).toContain('Clients and staff sign in here');
    act(() => root.unmount()); container.remove(); root = container = null;
    try { sessionStorage.removeItem(TLC_WELCOME_KEY); } catch { /* no storage */ }
    await mount();
    await click(button(/^Create an account$/, container.querySelector('[data-testid="tlc-welcome"]')));
    expect(container.querySelector('[data-testid="tlc-welcome"]')).toBeNull();
    expect(container.querySelector('header').textContent).toContain('Create your account');
  });
  it('a careers link lands on Join the team with no welcome in the way', async () => {
    const prev = window.location.href;
    window.history.replaceState({}, '', '/?tlc=1&jobs=1');
    try {
      await mount();
      expect(container.querySelector('[data-testid="tlc-welcome"]')).toBeNull();
    } finally { window.history.replaceState({}, '', prev); }
  });
});

describe('the home and the bar, the reference’s shape', () => {
  it('the quick actions sit two across; the quote card is the Learn space’s KJV line with its reference; a picture replaces the mark when the person has one', async () => {
    const tiles = [{ id: 'a', label: 'A', icon: 'users', onOpen: () => {} }, { id: 'b', label: 'B', icon: 'calendar', href: 'https://example.test/' }];
    await mount(createElement(TlcHome, { signedIn: true, name: 'Christina', photo: 'data:image/png;base64,x', tiles, hour: 9 }));
    const home = container.querySelector('[data-testid="tlc-home"]');
    expect(home.textContent).toContain('Good morning');
    expect(home.textContent).toContain('Christina');
    expect(home.querySelector('img').getAttribute('src')).toContain('data:image');
    const grid = home.querySelector('[aria-label="Quick actions"] > div');
    expect(grid.className).toContain('grid-cols-2');
    expect(grid.className).not.toContain('grid-cols-1');
    expect(home.querySelectorAll('[data-testid^="tlc-home-tile-"]').length).toBe(2);
    expect(home.querySelector('[aria-label="A word for today"]').textContent).toContain('Get wisdom, and with all thy getting get understanding');
    expect(home.querySelector('[aria-label="A word for today"]').textContent).toContain('Proverbs 4:7');
    expect(home.querySelector('[data-testid="tlc-home-schedule"]').getAttribute('href')).toBe(TLC_BRAND.bookingUrl);
  });
  it('a guest’s home says Welcome and the way to keep a place', async () => {
    await mount(createElement(TlcHome, { signedIn: false, tiles: [], hour: 15 }));
    const home = container.querySelector('[data-testid="tlc-home"]');
    expect(home.textContent).toContain('Good afternoon');
    expect(home.textContent).toContain('Welcome');
    expect(home.textContent).toContain('Sign in to keep your place');
    expect(home.querySelector('img')).toBeNull();
  });
  it('the bar has exactly as many columns as items plus More, and the More sheet is a list of rows that rises above the floaters while open', async () => {
    const items = [{ id: 'find', label: 'Find', dockLabel: 'Home', icon: 'home' }, { id: 'learn', label: 'Learn', icon: 'bookOpen' }, { id: 'jobs', label: 'Jobs', icon: 'pencil' }];
    await mount(createElement(TlcDoorDock, { items, activeId: 'find', onSelect: () => {}, more: [{ id: 'book', label: 'Book', icon: 'calendar', href: 'https://example.test/' }] }));
    const row = container.querySelector('[data-testid="tlc-dock-row"]');
    expect(row.style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
    const nav = container.querySelector('[data-testid="tlc-dock"]');
    expect(nav.className).toContain('z-40');
    await click(container.querySelector('[data-testid="tlc-dock-more"]'));
    expect(nav.className).toContain('z-[85]');
    const menu = container.querySelector('[role="menu"]');
    expect(menu.querySelectorAll('[role="menuitem"]').length).toBe(1);
    expect(menu.querySelector('a').getAttribute('target')).toBe('_blank');
  });
});
