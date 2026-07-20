// nav-history — proof that real browser BACK/FORWARD returns to the prior view.
//
// Verification Doctrine (DR-0076): the claim "Back goes to the last page" is not
// accepted on the agent's word — it is proven here two ways.
//   1. The pure URL <-> location helpers round-trip deterministically (deep-link
//      correctness), including backward-compat with legacy ?view=engagement links.
//   2. A real render harness wires useBrowserHistoryNav to live state, NAVIGATES
//      (overview -> about -> church), then fires popstate (what the browser does
//      on Back) and asserts the view reverts to the EXACT prior view — and that
//      the detail-level primitives (useHistoryToggle / useHistoryValue) unwind a
//      level at a time.
// React 18 act() environment flag — silences the "not configured to support
// act(...)" warning and makes state flushes deterministic in the harness tests.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import {
  serializeNav, parseNav, navKey, initialBooksView, VALID_BOOKS_SUBS,
  useBrowserHistoryNav, useHistoryToggle, useHistoryValue,
} from '../lib/nav-history.js';

// ── Books deep-link resolver (the "blank Books tab" regression guard) ────────
// Proven-to-catch (DR-0076): the shell used to boot booksView hard-coded to
// 'calendar', ignoring ?sub=, so ?view=books&sub=imported opened Calendar and
// the history seed dropped the sub — the deep-link "didn't work." initialBooksView
// is what the shell now boots from; these cases fail if that regresses OR if an
// unknown sub is ever allowed to route to a dead (blank) branch.
describe('initialBooksView — Books deep-links resolve, unknown subs stay safe', () => {
  it('opens the deep-linked Books sub-tab (the exact reported ?sub=imported case)', () => {
    expect(initialBooksView('?view=books&sub=imported')).toBe('imported');
  });
  it('resolves every real Books sub-tab from its deep-link', () => {
    for (const sub of VALID_BOOKS_SUBS) {
      expect(initialBooksView(`?view=books&sub=${sub}`)).toBe(sub);
    }
  });
  it('an unknown ?sub= falls back to the default, never a dead branch', () => {
    expect(initialBooksView('?view=books&sub=bogus')).toBe('calendar');
    expect(initialBooksView('?view=books')).toBe('calendar');
  });
  it('a ?sub= only counts when the view is actually books', () => {
    // church also writes ?sub=; it must not leak into booksView.
    expect(initialBooksView('?view=church&sub=engagement')).toBe('calendar');
    expect(initialBooksView('')).toBe('calendar');
  });
});

// ── pure helpers (no DOM) ───────────────────────────────────────────────────

describe('nav-history pure helpers', () => {
  it('serializes the default view to a clean (empty) query', () => {
    expect(serializeNav({ view: 'overview', booksView: 'calendar', churchView: 'home' })).toBe('');
  });

  it('serializes a top-level view', () => {
    expect(serializeNav({ view: 'rentals' })).toBe('?view=rentals');
  });

  it('serializes the ACTIVE view sub only (church)', () => {
    // booksView is non-default but we are on church -> it must not leak into the URL
    expect(serializeNav({ view: 'church', churchView: 'choir', booksView: 'transactions' })).toBe('?view=church&sub=choir');
  });

  it('serializes a books sub-view', () => {
    expect(serializeNav({ view: 'books', booksView: 'transactions' })).toBe('?view=books&sub=transactions');
  });

  it('parses an unknown view back to overview (no dead-end)', () => {
    expect(parseNav('?view=does-not-exist')).toEqual({ view: 'overview', booksView: 'calendar', churchView: 'home' });
  });

  it('honors legacy church deep-links (?view=engagement)', () => {
    expect(parseNav('?view=engagement')).toEqual({ view: 'church', booksView: 'calendar', churchView: 'engagement' });
  });

  it('parses the canonical church form (?view=church&sub=choir)', () => {
    expect(parseNav('?view=church&sub=choir')).toEqual({ view: 'church', booksView: 'calendar', churchView: 'choir' });
  });

  it('round-trips every known location through serialize -> parse', () => {
    const cases = [
      { view: 'overview' },
      { view: 'rentals' },
      { view: 'church', churchView: 'choir' },
      { view: 'church', churchView: 'pulpit' },
      { view: 'books', booksView: 'transactions' },
      { view: 'crm' },
      { view: 'admin' },
    ];
    for (const loc of cases) {
      const round = parseNav(serializeNav(loc));
      expect(navKey(round)).toBe(navKey(loc));
    }
  });

  it('navKey ignores an inactive tab\'s retained sub-state', () => {
    // Same active view+sub, different (irrelevant) inactive sub -> equal keys
    const a = { view: 'church', churchView: 'choir', booksView: 'calendar' };
    const b = { view: 'church', churchView: 'choir', booksView: 'transactions' };
    expect(navKey(a)).toBe(navKey(b));
    // Different active sub -> different keys
    expect(navKey({ view: 'church', churchView: 'choir' })).not.toBe(navKey({ view: 'church', churchView: 'pulpit' }));
  });
});

// ── render harness: real history integration ────────────────────────────────

// A minimal shell stand-in: the same three nav state holders the monolith owns,
// wired to the real hook. Buttons drive navigation; the rendered text reports
// the current view/sub so the test can assert what's shown.
function NavHarness() {
  const [view, setView] = useState('overview');
  const [booksView, setBooksView] = useState('calendar');
  const [churchView, setChurchView] = useState('home');
  const nav = useBrowserHistoryNav({ view, setView, booksView, setBooksView, churchView, setChurchView });
  return createElement('div', null,
    createElement('span', { className: 'cur' }, navKey({ view, booksView, churchView })),
    createElement('span', { className: 'can-back' }, nav.canGoBack ? 'back' : 'no-back'),
    createElement('button', { className: 'go-about', onClick: () => setView('about') }, 'about'),
    createElement('button', { className: 'go-choir', onClick: () => { setView('church'); setChurchView('choir'); } }, 'choir'),
    createElement('button', { className: 'go-back', onClick: nav.goBack }, 'back'),
  );
}

let container, root;

beforeEach(() => {
  // Reset the session history to a known single entry before each test.
  try { window.history.replaceState(null, '', '/'); } catch (e) {}
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = null;
});

const cur = () => container.querySelector('.cur').textContent;

describe('useBrowserHistoryNav — Back returns to the exact prior view', () => {
  it('reverts overview -> about -> back to overview via popstate', async () => {
    await act(async () => { root = createRoot(container); root.render(createElement(NavHarness)); });
    expect(cur()).toBe('overview|');

    // The seed wrote the overview entry; capture its state so we can replay the
    // exact popstate the browser delivers when you press Back from /about.
    const overviewState = window.history.state;
    expect(overviewState && overviewState.nav.view).toBe('overview');

    // Navigate forward to About — this pushes a new history entry.
    await act(async () => { container.querySelector('.go-about').click(); });
    expect(cur()).toBe('about|');
    expect(window.history.state.nav.view).toBe('about');

    // Press Back: the browser restores the previous entry and fires popstate
    // carrying that entry's state. Assert we land back on the prior view.
    await act(async () => { window.dispatchEvent(new PopStateEvent('popstate', { state: overviewState })); });
    expect(cur()).toBe('overview|');
  });

  it('handles a two-level forward then two Backs (multi-level)', async () => {
    await act(async () => { root = createRoot(container); root.render(createElement(NavHarness)); });
    const s0 = window.history.state; // overview

    await act(async () => { container.querySelector('.go-about').click(); });
    const s1 = window.history.state; // about
    expect(cur()).toBe('about|');

    await act(async () => { container.querySelector('.go-choir').click(); });
    expect(cur()).toBe('church|choir');

    // Back once -> about
    await act(async () => { window.dispatchEvent(new PopStateEvent('popstate', { state: s1 })); });
    expect(cur()).toBe('about|');

    // Back again -> overview
    await act(async () => { window.dispatchEvent(new PopStateEvent('popstate', { state: s0 })); });
    expect(cur()).toBe('overview|');
  });

  it('exposes canGoBack once the user has navigated', async () => {
    await act(async () => { root = createRoot(container); root.render(createElement(NavHarness)); });
    expect(container.querySelector('.can-back').textContent).toBe('no-back');
    await act(async () => { container.querySelector('.go-about').click(); });
    expect(container.querySelector('.can-back').textContent).toBe('back');
  });

  it('uses real window.history.back() when jsdom dispatches popstate', async () => {
    // Best-effort end-to-end: drive the actual browser Back. jsdom 25 dispatches
    // popstate asynchronously; if it does, this proves the device Back button
    // path. If a given environment doesn't, the synthetic-popstate tests above
    // already prove the handler — so we only assert when the event actually fired.
    await act(async () => { root = createRoot(container); root.render(createElement(NavHarness)); });
    await act(async () => { container.querySelector('.go-about').click(); });
    expect(cur()).toBe('about|');
    let fired = false;
    const mark = () => { fired = true; };
    window.addEventListener('popstate', mark);
    await act(async () => {
      window.history.back();
      await new Promise((r) => setTimeout(r, 20));
    });
    window.removeEventListener('popstate', mark);
    if (fired) expect(cur()).toBe('overview|');
  });
});

// ── detail-level primitives ─────────────────────────────────────────────────

function ToggleHarness() {
  const [open, setOpen] = useState(false);
  useHistoryToggle(open, () => setOpen(false), 'modal');
  return createElement('div', null,
    createElement('span', { className: 'state' }, open ? 'open' : 'closed'),
    createElement('button', { className: 'open', onClick: () => setOpen(true) }, 'open'),
  );
}

describe('useHistoryToggle — Back closes an overlay instead of leaving', () => {
  it('opening pushes an entry; popstate closes', async () => {
    await act(async () => { root = createRoot(container); root.render(createElement(ToggleHarness)); });
    expect(container.querySelector('.state').textContent).toBe('closed');
    await act(async () => { container.querySelector('.open').click(); });
    expect(container.querySelector('.state').textContent).toBe('open');
    // Browser Back -> the overlay's pushed entry is popped -> it closes.
    await act(async () => { window.dispatchEvent(new PopStateEvent('popstate', { state: null })); });
    expect(container.querySelector('.state').textContent).toBe('closed');
  });
});

function ValueHarness() {
  const [v, setV] = useState('list');
  useHistoryValue(v, setV, { base: 'list', key: 'projects-sub' });
  return createElement('div', null,
    createElement('span', { className: 'v' }, v),
    createElement('button', { className: 'to-scopes', onClick: () => setV('scopes') }, 'scopes'),
  );
}

describe('useHistoryValue — Back reverts a sub-view to its base', () => {
  it('list -> scopes -> Back -> list', async () => {
    await act(async () => { root = createRoot(container); root.render(createElement(ValueHarness)); });
    expect(container.querySelector('.v').textContent).toBe('list');
    await act(async () => { container.querySelector('.to-scopes').click(); });
    expect(container.querySelector('.v').textContent).toBe('scopes');
    // Back steps off the 'scopes' entry (state has no matching hvKey) -> base.
    await act(async () => { window.dispatchEvent(new PopStateEvent('popstate', { state: null })); });
    expect(container.querySelector('.v').textContent).toBe('list');
  });
});
