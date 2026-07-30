// @vitest-environment jsdom
// =============================================================================
// The Church TAB is not the Love Corner DOOR (DR-0174 collision, fixed).
// Darrell 2026-07-30: "When inside the PoeTech App on the Church Tab... it will
// automatically move me to the Love Corner App instead of the PoeTech App...
// why?" The cause: the door signal was bare `view=church` — the SAME URL
// nav-history writes when the Church tab is tapped inside full PoeTech — so
// any reload/restore of that tab booted church-door-only. Two halves, both
// pinned here (proven-to-catch, DR-0076):
//   1. lib/church-own-door.js — the reload-in-a-browser-tab case is asserted
//      in lovecorner-door.test.js (the door needs ?lovecorner=1 or a
//      standalone-display legacy install).
//   2. lib/nav-history.js — the REVERSE half: a real door visitor's param must
//      SURVIVE in-app navigation, or their own next reload falls out of the
//      church app the same way. This harness proves the pushed URLs keep it.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, useState } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useBrowserHistoryNav, PRESERVED_PARAMS } from '../lib/nav-history.js';
import { isChurchDoorContext, DOOR_PARAM } from '../lib/church-own-door.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root, api;
function Harness() {
  const [view, setView] = useState('church');
  const [booksView, setBooksView] = useState('calendar');
  const [churchView, setChurchView] = useState('home');
  api = { view, setView, churchView, setChurchView };
  useBrowserHistoryNav({ view, setView, booksView, setBooksView, churchView, setChurchView });
  return null;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe('a church-door visitor keeps the door through navigation', () => {
  it('?lovecorner=1 survives every nav push, so THEIR reload stays the church app', () => {
    window.history.replaceState(null, '', '/poetech-app/?view=church&lovecorner=1');
    act(() => root.render(createElement(Harness)));
    // Navigate inside the church: home -> learn (what rewrote the URL bare before).
    act(() => api.setChurchView('learn'));
    expect(window.location.search).toContain('sub=learn');
    expect(window.location.search).toContain(`${DOOR_PARAM}=1`);
    // And the boot signal still reads as the church door on that URL.
    expect(isChurchDoorContext(window.location.search, { standalone: false })).toBe(true);
  });

  it('a PoeTech member tapping the Church tab gets a URL that does NOT boot as the door', () => {
    window.history.replaceState(null, '', '/poetech-app/');
    act(() => root.render(createElement(Harness)));
    act(() => { api.setView('church'); });
    act(() => { api.setChurchView('learn'); });
    // The rewritten URL carries the church view/sub — but NO door param...
    expect(window.location.search).toContain('view=church');
    expect(window.location.search).not.toContain(`${DOOR_PARAM}=`);
    // ...so a reload of this browser tab stays full PoeTech (THE reported bug).
    expect(isChurchDoorContext(window.location.search, { standalone: false })).toBe(false);
  });

  it('the door param roster covers every launch-scoped door (lovecorner joins moore/tlc/biz)', () => {
    for (const p of ['lovecorner', 'moore', 'tlc', 'biz']) expect(PRESERVED_PARAMS).toContain(p);
  });
});
