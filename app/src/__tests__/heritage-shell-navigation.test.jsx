// =============================================================================
// The Heritage redesign, Phase 2: one list, three places (DR-1046)
// =============================================================================
// The tab strip, the sidebar at laptop width and the phone's five-tab bottom
// bar all draw lib/nav-items.jsx. These tests pin the contract the plan wrote
// down: every id survives, the groups are presentation only, the bottom bar
// changes NOTHING inside a lesson, and the copy and the behavior are checked
// together (press it, see where it went).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { navItems, navGroups, NAV_GROUPS, NAV_ICONS, NAV_WORDS, BOTTOM_NAV } from '../lib/nav-items.jsx';
import SideNav from '../components/shell/SideNav.jsx';
import ChromeDock from '../components/ChromeDock.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));

const FAMILY = { isFamilyMember: true, authSession: { user: { email: 'x@y' } }, isStudyCircle: true, healthPrograms: null, userTier: 'business', reviewerMode: false };

describe('nav-items: the list the shell used to hold inline', () => {
  it('a family steward sees every section the shell listed, in the shell order, ids unchanged', () => {
    const ids = navItems(FAMILY).map(([id]) => id);
    expect(ids).toEqual([
      'overview', 'books', 'inbound', 'rentals', 'properties', 'projects', 'tlc', 'opportunities', 'about', '__sep__',
      'messages', 'notes', 'create', 'voice', 'scribe', 'library', 'recipes', 'health', 'games', 'tvtime', 'advocacy', 'databack',
      'cameras', 'vault', 'study', 'church', 'markets', 'center', 'crm', 'relationships', 'inventory', 'moore', 'forecast',
      'cohorts', 'admin',
    ]);
  });

  it('the gates still gate: a plain signed-out visitor, an assistant account, the church door', () => {
    const plain = navItems({}).map(([id]) => id);
    expect(plain).toContain('practice');
    for (const gated of ['tlc', 'scribe', 'cameras', 'vault', 'study', 'center', 'crm', 'relationships', 'inventory', 'moore', 'forecast']) {
      expect(plain, `${gated} hidden from a plain visitor`).not.toContain(gated);
    }
    // The assistant's three, in the list's own order (About sits before the separator).
    expect(navItems({ isAssistantAcct: true, authSession: { user: {} } }).map(([id]) => id)).toEqual(['tlc-assistant', 'about', 'messages']);
    expect(navItems({ ...FAMILY, churchDoorOnly: true }).map(([id]) => id)).toEqual(['church']);
  });

  it('every id the list can produce renders a surface in the shell (nothing is dropped)', () => {
    const shell = readFileSync(join(HERE, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    for (const [id] of navItems({ ...FAMILY, healthPrograms: [{ id: 'p' }] })) {
      if (id === '__sep__') continue;
      expect(shell, `${id} has a render branch`).toMatch(new RegExp(`view === '${id}'`));
    }
    expect(shell).toMatch(/view === 'tlc-assistant'/);
  });

  it('every id has words and an icon (DR-0198: chrome icons are UiIcon, never emoji)', () => {
    for (const [id] of navItems({ ...FAMILY, isAssistantAcct: false })) {
      if (id === '__sep__') continue;
      expect(NAV_WORDS[id], `${id} words`).toBeTruthy();
      expect(NAV_ICONS[id], `${id} icon`).toBeTruthy();
    }
    expect(NAV_ICONS['tlc-assistant']).toBeTruthy();
    expect(NAV_WORDS.practice).toBe('Practice');
  });

  it('navGroups places every item exactly once and drops nothing — including an id the groups do not know', () => {
    const items = [...navItems(FAMILY), ['brand-new', 'Brand New']];
    const groups = navGroups(items);
    const placed = groups.flatMap((g) => g.items.map(([id]) => id));
    const expected = items.map(([id]) => id).filter((id) => id !== '__sep__');
    expect([...placed].sort()).toEqual([...expected].sort());
    expect(new Set(placed).size).toBe(placed.length);
    expect(groups[0].items.map(([id]) => id)).toContain('brand-new');
    expect(groups.every((g) => g.items.length > 0)).toBe(true);
    expect(NAV_GROUPS.map((g) => g.key)).toEqual(['family', 'soul', 'create', 'life', 'business', 'system']);
  });

  it('the bottom bar is Home, Big Picture, Books, Messages — Home opens the Life Hub, Big Picture the dashboard', () => {
    expect(BOTTOM_NAV.map((t) => t.key)).toEqual(['home', 'bigpicture', 'books', 'messages']);
    expect(BOTTOM_NAV[0]).toMatchObject({ view: 'overview', home: 'lifehub' });
    expect(BOTTOM_NAV[1]).toMatchObject({ view: 'overview', home: 'current' });
  });
});

describe('SideNav: the rail draws the same list, grouped, every item visible', () => {
  let container, root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  it('renders every allowed section as a button, marks the current one, and says the brand and tagline', () => {
    const items = navItems(FAMILY);
    const setView = vi.fn();
    act(() => root.render(createElement(SideNav, { items, view: 'books', setView, brandName: 'PoeTech', brandTagline: 'Life · Soul · Money · Family' })));
    const ids = items.map(([id]) => id).filter((id) => id !== '__sep__');
    for (const id of ids) expect(container.querySelector(`[data-testid="side-nav-${id}"]`), `rail has ${id}`).toBeTruthy();
    expect(container.querySelector('[data-testid="side-nav-books"]').getAttribute('aria-current')).toBe('page');
    expect(container.querySelector('[data-testid="side-nav-overview"]').getAttribute('aria-current')).toBeNull();
    expect(container.querySelector('[data-testid="side-nav-brand"]').textContent).toBe('PoeTech');
    expect(container.querySelector('[data-testid="side-nav-tagline"]').textContent).toBe('Life · Soul · Money · Family');
    act(() => { container.querySelector('[data-testid="side-nav-church"]').click(); });
    expect(setView).toHaveBeenCalledWith('church');
    // Every rail button is at the 36px house floor and carries a focus ring (ui-standards).
    for (const b of container.querySelectorAll('button')) {
      expect(b.className).toMatch(/min-h-\[36px\]/);
      expect(b.className).toMatch(/focus:outline/);
    }
  });

  it('Settings says what it opens, opens it, and reports its state (copy and behavior together)', () => {
    const onSettings = vi.fn();
    act(() => root.render(createElement(SideNav, { items: navItems(FAMILY), view: 'overview', setView: () => {}, onSettings, settingsOpen: false })));
    const btn = container.querySelector('[data-testid="side-nav-settings"]');
    expect(btn.textContent).toMatch(/Settings/);
    expect(btn.textContent).toMatch(/text · voice · colors/);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    act(() => { btn.click(); });
    expect(onSettings).toHaveBeenCalledTimes(1);
    act(() => root.render(createElement(SideNav, { items: navItems(FAMILY), view: 'overview', setView: () => {}, onSettings, settingsOpen: true })));
    expect(container.querySelector('[data-testid="side-nav-settings"]').getAttribute('aria-expanded')).toBe('true');
  });

  it('renders nothing for a door with no sections (the one-tab brand row carries that door)', () => {
    act(() => root.render(createElement(SideNav, { items: [], view: 'church', setView: () => {} })));
    expect(container.querySelector('[data-testid="side-nav"]')).toBeNull();
  });

  it('is hidden below lg and a chrome region, so it never grows with the text size (DR-0438)', () => {
    act(() => root.render(createElement(SideNav, { items: navItems(FAMILY), view: 'overview', setView: () => {} })));
    const aside = container.querySelector('[data-testid="side-nav"]');
    expect(aside.className).toMatch(/\bhidden\b/);
    expect(aside.className).toMatch(/lg:flex/);
    expect(aside.className).toMatch(/ts-chrome-region/);
  });
});

describe('ChromeDock: five tabs on a phone outside the reader, untouched inside it', () => {
  let container, root, onNavigate;
  const phone = (matches) => vi.stubGlobal('matchMedia', vi.fn((q) => ({ matches: matches && /639\.98px/.test(q), media: q, addEventListener() {}, removeEventListener() {} })));
  const nav = () => ({ groups: navGroups(navItems(FAMILY)), view: 'books', homeView: 'current', onNavigate });
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, headers: new Headers(), text: async () => '', json: async () => ({}) })));
    try { localStorage.clear(); } catch { /* ignore */ }
    document.documentElement.removeAttribute('data-lesson-space');
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    onNavigate = vi.fn();
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); document.documentElement.removeAttribute('data-lesson-space'); vi.unstubAllGlobals(); });
  const render = (props = {}) => act(() => root.render(createElement(ChromeDock, { onFeedback: () => {}, nav: nav(), ...props })));

  it('on a phone, off a lesson: Home, Big Picture, Books, Messages, then More — and Books is the current one', () => {
    phone(true);
    render();
    expect(container.querySelector('[data-testid="dock-tabs"]')).toBeTruthy();
    for (const k of ['home', 'bigpicture', 'books', 'messages']) expect(container.querySelector(`[data-testid="dock-tab-${k}"]`), k).toBeTruthy();
    expect(container.querySelector('[data-testid="dock-tab-books"]').getAttribute('aria-current')).toBe('page');
    expect(container.querySelector('[data-testid="dock-tab-home"]').getAttribute('aria-current')).toBeNull();
    expect(container.querySelector('[data-testid="dock-more"]').getAttribute('aria-label')).toMatch(/every other section/);
    act(() => { container.querySelector('[data-testid="dock-tab-home"]').click(); });
    expect(onNavigate).toHaveBeenCalledWith('overview', 'lifehub');
    act(() => { container.querySelector('[data-testid="dock-tab-bigpicture"]').click(); });
    expect(onNavigate).toHaveBeenCalledWith('overview', 'current');
  });

  it('More holds every other section, grouped as the sidebar groups them, above Feedback and Top', () => {
    phone(true);
    render();
    act(() => { container.querySelector('[data-testid="dock-more"]').click(); });
    for (const [id] of navItems(FAMILY)) {
      if (id === '__sep__') continue;
      expect(container.querySelector(`[data-testid="dock-more-${id}"]`), `More has ${id}`).toBeTruthy();
    }
    expect(container.querySelector('[data-testid="dock-more-group-soul"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="dock-feedback"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="dock-more-top"]')).toBeTruthy();
    act(() => { container.querySelector('[data-testid="dock-more-church"]').click(); });
    expect(onNavigate).toHaveBeenCalledWith('church', null);
    // Pressing a section closes More.
    expect(container.querySelector('[data-testid="dock-more"]').getAttribute('aria-expanded')).toBe('false');
  });

  it('inside a lesson the bar is exactly the one-row reader bar: no tabs (DR-0716 / DR-0744)', async () => {
    phone(true);
    render();
    expect(container.querySelector('[data-testid="dock-tabs"]')).toBeTruthy();
    // The reader opens (ChurchLearn sets the attribute; lib/comfort-bar.js watches it).
    act(() => { document.documentElement.setAttribute('data-lesson-space', 'open'); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(container.querySelector('[data-testid="dock-tabs"]')).toBeNull();
    expect(container.querySelector('[data-testid="dock-more"]').getAttribute('aria-label')).not.toMatch(/every other section/);
  });

  it('wider than a phone the bar is what it was: no tabs (the strip or the sidebar is the nav)', () => {
    phone(false);
    render();
    expect(container.querySelector('[data-testid="dock-tabs"]')).toBeNull();
  });

  it('without a nav prop (a door that passes none) the bar is unchanged', () => {
    phone(true);
    render({ nav: null });
    expect(container.querySelector('[data-testid="dock-tabs"]')).toBeNull();
  });
});
