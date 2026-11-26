// =============================================================================
// One tap to Learn and to the Institute, inside PoeTech (Darrell 2026-11-26)
// =============================================================================
// "Inside PoeTech make sure we can get to the learn and theology space with
// one click." Before: Learn was a quick link inside More (two taps) and the TLC
// Theological Institute sat behind Church, then its tab. Now each is a door of
// its own in every place PoeTech draws its sections: the phone's bottom bar,
// the tablet's tab strip and the laptop's sidebar. Pressed, each opens the
// Church section on that tab, and each shows only where Church is in the
// reader's list (a door with no Church gets neither).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { navItems, navGroups, BOTTOM_NAV, NAV_QUICK_LINKS } from '../lib/nav-items.jsx';
import ChromeDock from '../components/ChromeDock.jsx';
import SideNav from '../components/shell/SideNav.jsx';
import TopNavRow from '../components/TopNavRow.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const FAMILY = {
  isFamilyMember: true,
  authSession: { user: { email: 'x@y' } },
  isStudyCircle: true,
  healthPrograms: null,
  userTier: 'business',
  reviewerMode: false,
};
const DOORS = [
  ['learn', 'Learn'],
  ['institute', 'Institute'],
];

let container, root, onNavigate;
const phone = (matches) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn((q) => ({ matches: matches && /639\.98px/.test(q), media: q, addEventListener() {}, removeEventListener() {} }))
  );
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, status: 200, headers: new Headers(), text: async () => '', json: async () => ({}) }))
  );
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  onNavigate = vi.fn();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('the lists name both doors, each opening Church on its own tab', () => {
  it('the bar and the quick links carry Learn and the Institute', () => {
    for (const [key] of DOORS) {
      expect(
        BOTTOM_NAV.find((t) => t.key === key),
        key
      ).toMatchObject({ view: 'church', churchView: key });
      expect(
        NAV_QUICK_LINKS.find((q) => q.key === key),
        key
      ).toMatchObject({ view: 'church', churchView: key, group: 'soul' });
    }
  });
});

describe('phone: one tap on the bottom bar', () => {
  const nav = (over = {}) => ({ groups: navGroups(navItems(FAMILY)), view: 'books', homeView: 'current', churchView: 'home', onNavigate, ...over });

  it('each door is on the bar, and pressing it opens Church on that tab', () => {
    phone(true);
    act(() => root.render(createElement(ChromeDock, { onFeedback: () => {}, nav: nav() })));
    for (const [key, words] of DOORS) {
      const btn = container.querySelector(`[data-testid="dock-tab-${key}"]`);
      expect(btn, key).toBeTruthy();
      expect(btn.textContent).toContain(words);
      act(() => btn.click());
      expect(onNavigate).toHaveBeenLastCalledWith('church', null, key);
    }
  });

  it('lights only the door that is open, not Church itself as both', () => {
    phone(true);
    act(() => root.render(createElement(ChromeDock, { onFeedback: () => {}, nav: nav({ view: 'church', churchView: 'institute' }) })));
    expect(container.querySelector('[data-testid="dock-tab-institute"]').getAttribute('aria-current')).toBe('page');
    expect(container.querySelector('[data-testid="dock-tab-learn"]').getAttribute('aria-current')).toBeNull();
  });

  it('the older tabs still navigate exactly as before (no church tab passed)', () => {
    phone(true);
    act(() => root.render(createElement(ChromeDock, { onFeedback: () => {}, nav: nav() })));
    act(() => container.querySelector('[data-testid="dock-tab-home"]').click());
    expect(onNavigate).toHaveBeenLastCalledWith('overview', 'lifehub');
  });
});

describe('tablet: one tap on the tab strip', () => {
  it('both doors follow the section tabs, and pressing one opens Church on it', () => {
    const map = { groups: navGroups(navItems(FAMILY)), view: 'books', churchView: 'home', onNavigate };
    act(() => root.render(createElement(TopNavRow, { map }, createElement('button', { key: 'a' }, 'Money'), createElement('button', { key: 'b' }, 'Church'))));
    for (const [key, words] of DOORS) {
      const btn = container.querySelector(`[data-testid="top-nav-quick-${key}"]`);
      expect(btn, key).toBeTruthy();
      expect(btn.textContent).toBe(words);
      act(() => btn.click());
      expect(onNavigate).toHaveBeenLastCalledWith('church', null, key);
    }
  });
});

describe('laptop: one click in the sidebar', () => {
  it('both doors sit in Soul and open Church on their tab', () => {
    const onQuickLink = vi.fn();
    act(() => root.render(createElement(SideNav, { items: navItems(FAMILY), view: 'books', setView: () => {}, onQuickLink })));
    for (const [key] of DOORS) {
      const btn = container.querySelector(`[data-testid="side-nav-quick-${key}"]`);
      expect(btn, key).toBeTruthy();
      act(() => btn.click());
      expect(onQuickLink).toHaveBeenLastCalledWith(expect.objectContaining({ view: 'church', churchView: key }));
    }
  });
});

describe('PROVEN TO CATCH: no Church in the list, no door to a locked room', () => {
  it('a reader without Church sees neither door on the bar, the strip or the sidebar', () => {
    phone(true);
    const items = navItems(FAMILY).filter(([id]) => id !== 'church');
    const groups = navGroups(items);
    act(() => root.render(createElement(ChromeDock, { onFeedback: () => {}, nav: { groups, view: 'books', homeView: 'current', onNavigate } })));
    for (const [key] of DOORS) expect(container.querySelector(`[data-testid="dock-tab-${key}"]`), key).toBeNull();
    act(() =>
      root.render(
        createElement(
          TopNavRow,
          { map: { groups, view: 'books', onNavigate } },
          createElement('button', { key: 'a' }, 'Money'),
          createElement('button', { key: 'b' }, 'Notes')
        )
      )
    );
    for (const [key] of DOORS) expect(container.querySelector(`[data-testid="top-nav-quick-${key}"]`), key).toBeNull();
    act(() => root.render(createElement(SideNav, { items, view: 'books', setView: () => {}, onQuickLink: () => {} })));
    for (const [key] of DOORS) expect(container.querySelector(`[data-testid="side-nav-quick-${key}"]`), key).toBeNull();
  });
});
