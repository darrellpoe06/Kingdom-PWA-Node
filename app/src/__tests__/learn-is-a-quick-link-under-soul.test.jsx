// @vitest-environment jsdom
// =============================================================================
// learn-is-a-quick-link-under-soul — Learn opens from the Soul group (DR-1424)
// =============================================================================
// Darrell 2026-11-11, with a screenshot of the phone's More menu (Soul: Church,
// Study, Library, Academy): he wanted the Learn tab, the lessons and courses,
// as a quick link there too. Learn is Church's tab (view 'church', churchView
// 'learn'), so the quick link is a door, not a new section: no new id in the
// nav contract, gated exactly as Church is, and it lands on Learn itself.
// Press it, see where it went.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { navItems, navGroups, NAV_QUICK_LINKS } from '../lib/nav-items.jsx';
import SideNav from '../components/shell/SideNav.jsx';
import ChromeDock from '../components/ChromeDock.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));
const FAMILY = { isFamilyMember: true, authSession: { user: { email: 'x@y' } }, isStudyCircle: true, userTier: 'business' };
const soul = (items) => navGroups(items).find((g) => g.key === 'soul');

describe('the Soul group carries a Learn quick link', () => {
  it('Learn sits in Soul beside Church, Study, Library and Academy, and opens Church on its Learn tab', () => {
    const g = soul(navItems(FAMILY));
    expect(g.items.map(([id]) => id)).toEqual(['church', 'study', 'library', 'store', 'cohorts']); // 'store' joined Soul beside Library (DR-1449)
    expect(g.links.map((q) => q.key)).toEqual(['learn']);
    expect(g.links[0]).toMatchObject({ view: 'church', churchView: 'learn', words: 'Learn' });
  });

  it('a quick link is not a section: the nav contract gains no id', () => {
    const ids = navItems(FAMILY).map(([id]) => id);
    for (const q of NAV_QUICK_LINKS) expect(ids, q.key).not.toContain(q.key);
  });

  it('the church door alone still gets Learn, because it opens Church', () => {
    expect(soul(navItems({ ...FAMILY, churchDoorOnly: true })).links.map((q) => q.key)).toEqual(['learn']);
  });

  it("PROVEN TO CATCH: without Church in the reader's list there is no Learn door to a locked room", () => {
    const noChurch = navItems(FAMILY).filter(([id]) => id !== 'church');
    expect(navGroups(noChurch).flatMap((g) => g.links.map((q) => q.key))).toEqual([]);
    expect(navGroups(navItems({ isAssistantAcct: true, authSession: { user: {} } })).flatMap((g) => g.links)).toEqual([]);
  });
});

describe('pressing it lands on Learn', () => {
  let container, root;
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, status: 200, headers: new Headers(), text: async () => '', json: async () => ({}) }))
    );
    vi.stubGlobal(
      'matchMedia',
      vi.fn((q) => ({ matches: /639\.98px/.test(q), media: q, addEventListener() {}, removeEventListener() {} }))
    );
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("the phone's More menu: Learn is in the Soul row after Academy; it opens Church on Learn and closes More", () => {
    const onNavigate = vi.fn();
    const nav = { groups: navGroups(navItems(FAMILY)), view: 'books', homeView: 'current', churchView: 'home', onNavigate };
    act(() => root.render(createElement(ChromeDock, { onFeedback: () => {}, nav })));
    act(() => {
      container.querySelector('[data-testid="dock-more"]').click();
    });
    const row = container.querySelector('[data-testid="dock-more-group-soul"]');
    const order = [...row.querySelectorAll('button')].map((b) => b.getAttribute('data-testid'));
    expect(order).toEqual(['dock-more-church', 'dock-more-study', 'dock-more-library', 'dock-more-store', 'dock-more-cohorts', 'dock-more-quick-learn']);
    const learn = row.querySelector('[data-testid="dock-more-quick-learn"]');
    expect(learn.textContent).toBe('Learn');
    expect(learn.getAttribute('aria-current')).toBeNull();
    act(() => {
      learn.click();
    });
    expect(onNavigate).toHaveBeenCalledWith('church', null, 'learn');
    expect(container.querySelector('[data-testid="dock-more"]').getAttribute('aria-expanded')).toBe('false');
  });

  it('the More menu marks Learn current while Learn is open', () => {
    const nav = { groups: navGroups(navItems(FAMILY)), view: 'church', homeView: 'current', churchView: 'learn', onNavigate: () => {} };
    act(() => root.render(createElement(ChromeDock, { onFeedback: () => {}, nav })));
    act(() => {
      container.querySelector('[data-testid="dock-more"]').click();
    });
    expect(container.querySelector('[data-testid="dock-more-quick-learn"]').getAttribute('aria-current')).toBe('page');
  });

  it('the laptop rail: Learn sits under Soul and opens Church on Learn', () => {
    const onQuickLink = vi.fn();
    act(() => root.render(createElement(SideNav, { items: navItems(FAMILY), view: 'church', churchView: 'learn', setView: () => {}, onQuickLink })));
    const learn = container.querySelector('[data-testid="side-nav-quick-learn"]');
    expect(learn).toBeTruthy();
    expect(learn.getAttribute('aria-current')).toBe('page');
    act(() => {
      learn.click();
    });
    expect(onQuickLink).toHaveBeenCalledWith(expect.objectContaining({ view: 'church', churchView: 'learn' }));
  });

  it("the shell routes the door: both bars set Church's tab, and Church renders Learn on that tab", () => {
    const shell = readFileSync(join(HERE, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toMatch(/onNavigate: \(v, home, sub\) => \{ if \(home\) setHomeView\(home\); if \(sub\) setChurchView\(sub\); setView\(v\); \}/);
    expect(shell).toMatch(/onQuickLink=\{\(q\) => \{ setChurchView\(q\.churchView\); setView\(q\.view\); \}\}/);
    expect(shell).toMatch(/\['learn','Learn'\]/);
    expect(shell).toMatch(/return <ChurchLearn/);
  });
});
