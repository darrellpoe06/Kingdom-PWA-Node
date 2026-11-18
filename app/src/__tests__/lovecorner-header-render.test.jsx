// @vitest-environment jsdom
// =============================================================================
// LoveCornerHeader — the door's one compact header (DR-1483): menu, brand,
// search, bell, sign-in / picture; the All Features sheet lists every gated
// church tab in its group and finds tabs and courses; the profile menu's rows
// call the existing handlers; Personalize lists the real themes and picks
// through the same setter the swatches used.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../lib/supabase.js', () => {
  const answer = async () => ({ data: [], error: null });
  const chain = () => {
    const c = {
      select: () => c,
      eq: () => c,
      order: () => c,
      limit: () => c,
      in: () => c,
      maybeSingle: async () => ({ data: null, error: null }),
      then: (res) => answer().then(res),
    };
    return c;
  };
  const fakeSupabase = {
    from: () => chain(),
    rpc: async () => ({ data: null, error: null }),
    auth: { getSession: async () => ({ data: { session: null } }) },
    channel: () => ({
      on() {
        return this;
      },
      subscribe() {
        return this;
      },
    }),
    removeChannel: () => {},
  };
  return {
    default: fakeSupabase,
    supabase: fakeSupabase,
    onAuthChange: (cb) => {
      cb(globalThis.__lchSession || null);
      return () => {};
    },
    signOut: vi.fn(async () => {}),
  };
});
vi.mock('../lib/profiles-sync.js', () => ({
  loadMyProfile: async () => ({ displayName: 'Darrell', photoThumb: null }),
  initialsOf: (name) =>
    String(name || '?')
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
}));
vi.mock('../lib/arrivals-watch.js', () => ({ startArrivalsWatch: () => () => {}, readArrivals: () => ({ count: 0, items: [] }) }));

import LoveCornerHeader, { ChurchTabStrip } from '../components/shell/LoveCornerHeader.jsx';
import { searchCourses, searchTabs } from '../components/shell/LoveCornerMenus.jsx';
import PersonalizeSheet, { orderedThemes } from '../components/shell/PersonalizeSheet.jsx';
import { churchSubTabs, churchTabGroups } from '../lib/church-tabs.jsx';
import { THEMES } from '../lib/theme-css.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const flush = () =>
  act(async () => {
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
  });
let container, root;
beforeEach(() => {
  globalThis.__lchSession = null;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.querySelectorAll('[role="dialog"]').forEach((d) => d.remove());
});
const q = (sel) => document.querySelector(sel);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const publicTabs = churchSubTabs({ signedIn: false });
const mount = (props = {}) =>
  act(() => root.render(createElement(LoveCornerHeader, { churchTabs: publicTabs, churchView: 'home', setChurchView: () => {}, ...props })));

describe('the header bar', () => {
  it('carries menu, the brand with the tagline, search, the bell and Sign in when signed out', async () => {
    mount();
    await flush();
    expect(q('[data-testid="lch-menu"]')).toBeTruthy();
    expect(q('[data-testid="lch-brand"]').textContent).toContain('The Love Corner');
    expect(q('[data-testid="lch-brand"]').textContent).toContain('The Church of the Living God');
    expect(q('[data-testid="lch-brand"]').textContent).toContain('Where Love Lives');
    expect(q('[data-testid="lch-brand"] img').getAttribute('src')).toContain('love-corner-experience-logo');
    expect(q('[data-testid="lch-search"]')).toBeTruthy();
    expect(q('[data-testid="lch-bell"] [data-testid="arrivals-bell"]')).toBeTruthy();
    expect(q('[data-testid="lch-signin"]')).toBeTruthy();
    expect(q('[data-testid="lch-avatar"]')).toBeNull();
    for (const b of container.querySelectorAll('.lch-bar button')) expect(b.className, b.textContent).toMatch(/focus:outline/);
  });
  it('the brand tap goes home; the strip draws the same gated list the dock draws', async () => {
    const setChurchView = vi.fn();
    mount({ setChurchView, churchView: 'youth' });
    await flush();
    click(q('[data-testid="lch-brand"]'));
    expect(setChurchView).toHaveBeenCalledWith('home');
    expect(container.querySelectorAll('[data-testid^="lch-strip-tab-"]').length).toBe(publicTabs.length);
    expect(q('[data-testid="lch-strip-tab-youth"]').getAttribute('aria-current')).toBe('page');
  });
  it('signed in, the picture opens the profile menu; its rows call the existing doors', async () => {
    globalThis.__lchSession = { user: { id: 'u1', email: 'd@example.com' } };
    const setChurchView = vi.fn();
    const setView = vi.fn();
    mount({ setChurchView, setView, isOffice: true, canAdmin: true });
    await flush();
    expect(q('[data-testid="lch-signin"]')).toBeNull();
    click(q('[data-testid="lch-avatar"]'));
    await flush();
    const menu = q('[data-testid="lch-profile-menu"]');
    expect(menu).toBeTruthy();
    expect(menu.textContent).toContain('Darrell');
    for (const id of ['profile', 'church', 'notifications', 'subscription', 'contact', 'give', 'all', 'personalize', 'admin', 'logout']) {
      expect(q(`[data-testid="lch-menu-${id}"]`), id).toBeTruthy();
    }
    click(q('[data-testid="lch-menu-church"]'));
    expect(setChurchView).toHaveBeenCalledWith('my-record');
    click(q('[data-testid="lch-avatar"]'));
    await flush();
    click(q('[data-testid="lch-menu-subscription"]'));
    expect(setView).toHaveBeenCalledWith('about');
  });
});

describe('the All Features sheet', () => {
  it('lists every gated church tab exactly once, in its group, and opens it', async () => {
    const setChurchView = vi.fn();
    mount({ setChurchView });
    await flush();
    click(q('[data-testid="lch-menu"]'));
    await flush();
    const sheet = q('[data-testid="lch-all-features"]');
    expect(sheet).toBeTruthy();
    const ids = [...document.querySelectorAll('[data-testid^="lch-tab-"]')].map((b) => b.getAttribute('data-testid').replace('lch-tab-', ''));
    expect(ids.sort()).toEqual(publicTabs.map(([id]) => id).sort());
    for (const g of churchTabGroups(publicTabs)) expect(q(`[data-testid="lch-group-${g.key}"]`), g.key).toBeTruthy();
    click(q('[data-testid="lch-tab-institute"]'));
    expect(setChurchView).toHaveBeenCalledWith('institute');
    expect(q('[data-testid="lch-personalize"]')).toBeNull(); // the sheet closed
  });
  it('search finds tabs by label and courses by title; nothing invented', () => {
    expect(searchTabs('youth', publicTabs).map(([id]) => id)).toEqual(['youth']);
    expect(searchTabs('', publicTabs)).toEqual([]);
    const hits = searchCourses('little');
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits[0].key).toBe('little-learners');
    expect(searchCourses('zzz-not-a-course')).toEqual([]);
    expect(searchCourses('a', [{ key: 'broken', meta: null }, null])).toEqual([]);
  });
});

describe('Personalize My App', () => {
  it('lists every registered theme once, the Love Corner first, and picks through setTheme', async () => {
    const setTheme = vi.fn();
    act(() => root.render(createElement(PersonalizeSheet, { open: true, onClose: () => {}, theme: 'night', setTheme })));
    await flush();
    const cards = [...document.querySelectorAll('[data-testid^="lch-theme-"]')];
    expect(cards.length).toBe(THEMES.length);
    expect(cards[0].getAttribute('data-testid')).toBe('lch-theme-night');
    expect(cards[1].getAttribute('data-testid')).toBe('lch-theme-lovecorner');
    expect(q('[data-testid="lch-theme-night"]').getAttribute('aria-checked')).toBe('true');
    click(q('[data-testid="lch-theme-heritage"]'));
    expect(setTheme).toHaveBeenCalledWith('heritage');
    expect(q('[data-testid="lch-rate-1"]')).toBeTruthy();
    click(q('[data-testid="lch-reset"]'));
    expect(setTheme).toHaveBeenCalledWith('night');
    expect(document.body.textContent).toContain("The church's colors stay the same for everyone else");
  });
  it("orderedThemes keeps every key and puts the church's own first", () => {
    const o = orderedThemes();
    expect(o.map((t) => t.key).sort()).toEqual(THEMES.map((t) => t.key).sort());
    expect(o[0].key).toBe('night');
  });
});

describe('ChurchTabStrip', () => {
  it('renders nothing without tabs', () => {
    act(() => root.render(createElement(ChurchTabStrip, { churchTabs: [] })));
    expect(container.innerHTML).toBe('');
  });
});
