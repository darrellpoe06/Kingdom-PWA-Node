// =============================================================================
// The Life Hub is OPT-IN, wired to real records, and reversible
// =============================================================================
// Darrell 2026-09-17, relaying three home-view mockups from his wife Christina
// with three decisions: the CURRENT VIEW STAYS THE DEFAULT front door, the two
// tiles with no record behind them get real records, and the phone nav folds.
//
// FIVE PLACES THIS COULD HAVE GONE WRONG, and every one is a checked property
// rather than a note in a record nobody reads.
//
//   1. SOMEBODY'S FRONT DOOR CHANGING WITHOUT THEM CHOOSING IT. The default is
//      'current', including when storage is blocked, and `Home` renders the
//      existing dashboard until a reader picks otherwise.
//   2. A TILE THAT OPENS NOTHING. Two of the six would have: there is no
//      `view === 'learn'` route in this app (Learn is the church door with
//      churchView 'learn'). Every destination is checked AGAINST THE HOST FILE
//      itself, so a renamed route fails here instead of under a family
//      member's thumb (DR-0330).
//   3. A PAINTED NUMBER ON THE FAMILY'S FRONT SCREEN. Her mockup carries a
//      literal 4 on Messages, as mockups do. Counts come from records or do
//      not appear, and zero unread draws no badge (DR-0061).
//   4. TWO RECORDS THAT EXIST IN CODE AND NOWHERE IN THE APP. Today's Focus and
//      My Goals shipped as a tested lib with no surface; these checks prove the
//      hub actually writes them into the world.
//   5. CHROME THAT GROWS WITH THE TEXT. The switches are fixed-size chrome and
//      the file declares no width cap, so the reader's text size moves the
//      words and not the furniture (DR-0410 / DR-0438 / DR-0246).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

// A controlled React input ignores a plain `el.value = x`: React's own value
// tracker sees no change, so the state never updates. This is the standard
// native-setter route. Without it every write check below would fail for a
// reason that has nothing to do with the code under test.
const typeInto = (el, value) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
};
import LifeHub from '../components/LifeHub.jsx';
import { Home } from '../components/BigPictureDashboard.jsx';
import {
  HOME_VIEWS, HUB_DENSITIES, DENSITY_ACTIONS, HOME_VIEW_KEY,
  getHomeView, setHomeView, setHubDensity, __resetHomePrefs, readPref, DEFAULT_HOME_VIEW,
} from '../lib/home-view-prefs.js';
import { HUB_TILES, HOST_VIEWS, hubTiles, actionsFor, hasRealCount, openProjectCount, doorCount } from '../lib/life-hub.js';
import { PROJECT_STATUSES_ACTIVE } from '../lib/opportunity-capacity.js';
import { DM_UNREAD_EVENT } from '../lib/notify-readiness.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const HOST = readFileSync(join(ROOT, 'app', 'src', 'poe-financial-mvp-v28.jsx'), 'utf8');
const HUB_SRC = readFileSync(join(ROOT, 'app', 'src', 'components', 'LifeHub.jsx'), 'utf8');
// Comments are stripped before any wiring claim is checked: a commented-out
// mount must never satisfy a check about what the app does.
const codeOnly = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  __resetHomePrefs();
  try { localStorage.clear(); } catch { /* blocked storage is a case this must survive */ }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); __resetHomePrefs(); });

const noop = () => {};
const world = {
  debts: [], accounts: [], transactions: [],
  inflows: { rentals: [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }] },
  // 'on-hold' is deliberately here: it is neither active nor complete, so a
  // count that used `status !== 'complete'` instead of the shared active list
  // diverges by one. Without it the two definitions agreed by accident and the
  // check had no teeth.
  projects: [{ id: 'p1', status: 'active' }, { id: 'p2', status: 'planning' }, { id: 'p3', status: 'complete' }, { id: 'p4', status: 'on-hold' }],
  dailyFocus: [], goals: [],
};
const hubProps = (over = {}) => ({ data: world, setData: noop, setView: noop, setChurchView: noop, setBooksView: noop, ...over });
const render = (el) => { act(() => root.render(el)); };
const text = () => container.textContent || '';

describe('nobody is moved off the front door they already have', () => {
  it('defaults to the current view', () => {
    // Checked at the SINGLE source the module actually reads, because a break
    // that flipped the real default used to hide behind the test reset.
    expect(DEFAULT_HOME_VIEW).toBe('current');
    expect(getHomeView()).toBe('current');
    const src = readFileSync(join(ROOT, 'app', 'src', 'lib', 'home-view-prefs.js'), 'utf8');
    expect(src).toMatch(/homeView: read\(HOME_VIEW_KEY, HOME_VIEWS, DEFAULT_HOME_VIEW\)/);
  });

  it('and defaults to current when storage throws, rather than guessing', () => {
    // A private window, blocked site data, or a browser that throws on access
    // must not flip somebody's front door. Tested on the pure reader, because
    // the module-level read happens once at import and cannot be re-run.
    expect(readPref(() => { throw new Error('blocked'); }, HOME_VIEWS, 'current')).toBe('current');
    expect(readPref(() => null, HOME_VIEWS, 'current')).toBe('current');
    expect(readPref(() => 'lifehub', HOME_VIEWS, 'current')).toBe('lifehub');
    expect(readPref(() => 'nonsense', HOME_VIEWS, 'current')).toBe('current');
    // The allowed list's first entry is deliberately NOT the fallback here: a
    // catch that returned allowed[0] instead of the fallback passed the earlier
    // version of this check by coincidence.
    expect(readPref(() => { throw new Error('blocked'); }, ['a', 'b'], 'z')).toBe('z');
  });

  it('Home renders the existing dashboard until the reader chooses otherwise', () => {
    render(createElement(Home, { data: world, setView: noop, dismissWelcome: noop, totals: {}, entityRollups: [], reserves: {}, upcomingEvents: [] }));
    expect(text()).toContain('Try the Life Hub');
    expect(text()).not.toContain('Life Hub’s');
  });

  it('rides at the end of the Overview tab row, never on a line of its own', () => {
    // Darrell 2026-09-24, of the button alone on a full-width row above the
    // tabs: "Try the hub is taking up a lot of space... why?!"
    render(createElement(Home, { data: world, setView: noop, dismissWelcome: noop, totals: {}, entityRollups: [], reserves: {}, upcomingEvents: [] }));
    const btn = container.querySelector('[data-testid="try-life-hub"]');
    const row = container.querySelector('[data-testid="overview-tab-row"]');
    expect(btn).toBeTruthy();
    expect(row).toBeTruthy();
    expect(row.contains(btn)).toBe(true);
    expect(row.querySelector('[role="tab"]')).toBeTruthy();
  });

  it('and switches to the hub only when the preference says so', () => {
    act(() => setHomeView('lifehub'));
    render(createElement(Home, { data: world, setView: noop, setData: noop }));
    expect(text()).toContain('Life Hub');
    expect(text()).toContain("Today's Focus");
  });

  it('is reversible from both sides without hunting for a setting', () => {
    // The TRANSITION is the property, not the end state. Checking only that
    // the preference reads 'current' after the click passed even when the
    // setter REFUSED it — because it had never left 'current' in that test.
    act(() => setHomeView('lifehub'));
    expect(getHomeView(), 'the hub was never entered, so going back proves nothing').toBe('lifehub');
    render(createElement(LifeHub, hubProps()));
    // A BUTTON, not the sentence in the header that also says "Current View" —
    // a break that renamed the control passed the earlier version of this
    // check on that prose alone.
    const back = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Current View');
    expect(back, 'the hub has no way back to the current view').toBeTruthy();
    act(() => back.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(getHomeView()).toBe('current');
    act(() => root.render(createElement(Home, { data: world, setView: noop, dismissWelcome: noop })));
    expect(text()).toContain('Try the Life Hub');
  });
});

describe('the switch passes the wiring through, not just the screen', () => {
  // The write and navigation checks elsewhere render LifeHub directly, so they
  // cannot see a prop that Home stops forwarding. These render the real switch.
  it('forwards the world setter, so a focus item still lands', () => {
    let written = null;
    act(() => setHomeView('lifehub'));
    render(createElement(Home, { data: world, setData: (fn) => { written = fn(world); }, setView: noop, setChurchView: noop }));
    const input = container.querySelector('#hub-focus-new');
    act(() => typeInto(input, 'Through the switch'));
    act(() => input.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(written, 'Home did not forward setData').toBeTruthy();
    expect(written.dailyFocus[0].label).toBe('Through the switch');
  });

  it('forwards the church setter, so the Learn tile lands both halves', () => {
    const calls = [];
    act(() => setHomeView('lifehub'));
    render(createElement(Home, {
      data: world, setData: noop,
      setView: (v) => calls.push(['view', v]),
      setChurchView: (v) => calls.push(['churchView', v]),
    }));
    const btn = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Learn & Grow'));
    act(() => btn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(calls, 'Home did not forward setChurchView').toEqual([['view', 'church'], ['churchView', 'learn']]);
  });
});

describe('every tile opens something that exists in this app', () => {
  it('names only real top-level views, checked against the host file', () => {
    for (const t of HUB_TILES) {
      expect(HOST_VIEWS, `${t.key} names ${t.view}`).toContain(t.view);
      expect(HOST.includes(`view === '${t.view}'`), `the host has no route for ${t.view}`).toBe(true);
    }
  });

  it('ROUTES LEARN THROUGH THE CHURCH DOOR, because there is no learn view', () => {
    // The defect this check exists for: `view === 'learn'` does not exist, and
    // a Learn tile pointing at it would have opened nothing at all.
    expect(HOST.includes("view === 'learn'")).toBe(false);
    const learn = HUB_TILES.find((t) => t.key === 'learn');
    expect(learn.view).toBe('church');
    expect(learn.churchView).toBe('learn');
    expect(HOST.includes("churchView === 'learn'")).toBe(true);
  });

  it('drives both setters when a tile needs a sub-view', () => {
    const calls = [];
    render(createElement(LifeHub, hubProps({
      setView: (v) => calls.push(['view', v]),
      setChurchView: (v) => calls.push(['churchView', v]),
    })));
    const btn = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Learn & Grow'));
    expect(btn, 'the Learn tile did not render').toBeTruthy();
    act(() => btn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(calls).toEqual([['view', 'church'], ['churchView', 'learn']]);
  });
});

describe('a number appears only when a record produced it', () => {
  it('shows NO count on the tiles this app has no record for', () => {
    const tiles = hubTiles(world, { unread: 0 });
    for (const key of ['bigPicture', 'learn', 'tlc']) {
      expect(hasRealCount(tiles.find((t) => t.key === key)), `${key} painted a number`).toBe(false);
    }
  });

  it('counts doors and active projects from the records themselves', () => {
    const tiles = hubTiles(world, { unread: 0 });
    expect(tiles.find((t) => t.key === 'realEstate').count).toBe(doorCount(world));
    expect(tiles.find((t) => t.key === 'realEstate').count).toBe(3);
    expect(tiles.find((t) => t.key === 'projects').count).toBe(openProjectCount(world.projects));
    expect(tiles.find((t) => t.key === 'projects').count).toBe(2); // active + planning, not on-hold
  });

  it('and uses the SAME active-status list as the capacity layer', () => {
    // If the hub and the Action Queue ever disagreed about "open", one of them
    // would be lying to the same reader on the same screen.
    const only = world.projects.filter((p) => PROJECT_STATUSES_ACTIVE.includes(p.status)).length;
    expect(openProjectCount(world.projects)).toBe(only);
  });

  it('DRAWS NO MESSAGES BADGE AT ZERO UNREAD — the mockup literal never ships', () => {
    render(createElement(LifeHub, hubProps()));
    const tile = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Stay Connected'));
    expect(tile.textContent).not.toMatch(/\d/);
    expect(hubTiles(world, { unread: 0 }).find((t) => t.key === 'messages').count).toBeNull();
  });

  it("and shows the watcher's real count when it reports one", () => {
    render(createElement(LifeHub, hubProps()));
    act(() => {
      window.dispatchEvent(new window.CustomEvent(DM_UNREAD_EVENT, { detail: { prev: 0, next: 2, visible: true } }));
    });
    const tile = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Stay Connected'));
    expect(tile.textContent).toContain('2');
  });

  it('never trusts a junk count', () => {
    for (const bad of [undefined, null, NaN, -4, 'four']) {
      expect(hubTiles(world, { unread: bad }).find((t) => t.key === 'messages').count).toBeNull();
    }
  });
});

describe("Today's Focus and My Goals are written into the world", () => {
  it('adds a focus item through the record, not into component state', () => {
    let written = null;
    render(createElement(LifeHub, hubProps({ setData: (fn) => { written = fn(world); } })));
    const input = container.querySelector('#hub-focus-new');
    const form = input.closest('form');
    act(() => typeInto(input, 'Call the plumber'));
    act(() => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(written, 'nothing was written to the world').toBeTruthy();
    expect(written.dailyFocus).toHaveLength(1);
    // `label`, which is the record's real field name. The first version of the
    // view rendered {f.text} and would have shown an empty row for every item
    // the family added; this check is why that never shipped.
    expect(written.dailyFocus[0].label).toBe('Call the plumber');
    expect(written.dailyFocus[0].done).toBe(false);
    expect(written.dailyFocus[0].day, 'a focus item with no day recycles yesterday').toBeTruthy();
  });

  it('and renders the item by its real field, not an invented one', () => {
    const withFocus = { ...world, dailyFocus: [{ id: 'f1', label: 'Call the plumber', done: false, day: new Date().toISOString().slice(0, 10) }] };
    render(createElement(LifeHub, hubProps({ data: withFocus })));
    expect(text()).toContain('Call the plumber');
  });

  it('adds a goal through the record', () => {
    let written = null;
    render(createElement(LifeHub, hubProps({ setData: (fn) => { written = fn(world); } })));
    const input = container.querySelector('#hub-goal-new');
    const form = input.closest('form');
    act(() => typeInto(input, 'Pay off the truck'));
    act(() => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(written.goals).toHaveLength(1);
    expect(written.goals[0].title).toBe('Pay off the truck');
  });

  it('refuses an empty submission rather than writing a blank row', () => {
    let calls = 0;
    render(createElement(LifeHub, hubProps({ setData: () => { calls += 1; } })));
    const form = container.querySelector('#hub-focus-new').closest('form');
    act(() => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(calls).toBe(0);
  });

  it('NO GOAL CARRIES A TYPED PERCENTAGE — a self-reported number is invented', () => {
    const withGoal = { ...world, goals: [{ id: 'g1', title: 'Finish the deck', status: 'active' }] };
    render(createElement(LifeHub, hubProps({ data: withGoal })));
    const section = [...container.querySelectorAll('section')].find((s) => (s.textContent || '').includes('My Goals'));
    expect(section.textContent).not.toMatch(/%/);
  });

  it('and the hub is the FIRST surface to reach these records', () => {
    // They shipped as a tested lib with no caller. If a second surface ever
    // renders them this can be relaxed — but silently having none again is the
    // failure this catches.
    expect(codeOnly(HUB_SRC)).toMatch(/from '\.\.\/lib\/daily-focus\.js'/);
  });
});

describe('her three looks all ship, as density', () => {
  it('gives each density the number of Quick Actions her mockup showed', () => {
    expect(HUB_DENSITIES).toEqual(['airy', 'photo', 'compact']);
    expect(DENSITY_ACTIONS).toEqual({ airy: 4, photo: 8, compact: 6 });
    for (const d of HUB_DENSITIES) expect(actionsFor(d)).toHaveLength(DENSITY_ACTIONS[d]);
  });

  it('and every one of them is reachable from the hub itself', () => {
    render(createElement(LifeHub, hubProps()));
    for (const d of HUB_DENSITIES) {
      const btn = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === d);
      expect(btn, `${d} has no control`).toBeTruthy();
    }
  });

  it('changes the rendered action count when the density changes', () => {
    render(createElement(LifeHub, hubProps()));
    const count = () => {
      const s = [...container.querySelectorAll('section')].find((x) => (x.textContent || '').includes('Quick Actions'));
      return s.querySelectorAll('button').length;
    };
    expect(count()).toBe(4);
    act(() => setHubDensity('photo'));
    expect(count()).toBe(8);
    act(() => setHubDensity('compact'));
    expect(count()).toBe(6);
  });

  it('and every action either routes somewhere real or lands on a record here', () => {
    for (const a of actionsFor('photo')) {
      if (a.view) {
        expect(HOST.includes(`view === '${a.view}'`), `${a.key} routes to a missing view`).toBe(true);
      } else {
        expect(['focus', 'goal']).toContain(a.key);
      }
    }
  });
});

describe('the furniture stays furniture', () => {
  it('declares no width cap, so the words keep the width', () => {
    expect(HUB_SRC.includes('max-w-')).toBe(false);
  });

  it('sizes its own chrome in fixed units rather than with the reader’s text', () => {
    const chrome = HUB_SRC.match(/className=\{?[`"][^`"]*uppercase tracking-wider[^`"]*[`"]/g) || [];
    expect(chrome.length, 'no chrome control found to check').toBeGreaterThan(0);
    // rem, never px: a fixed-px size does not scale with the text-size control
    // and consistency-guard hard-fails any new one. The chrome stays SMALL, in
    // the same unit as the prose, so it never outgrows the words.
    for (const c of chrome) expect(c, c).toMatch(/text-\[0\.625rem\]/);
    // Small type, full-size thumb. The house target is 36px (ui-standards-set),
    // and the first version of this view used 32 — so the property checked here
    // is that no control declares a target BELOW it. Written as the property
    // rather than "every chrome class has min-h", which also caught a heading
    // that needs no thumb target at all.
    for (const m of HUB_SRC.match(/min-h-\[(\d+)px\]/g) || []) {
      expect(Number(m.match(/\d+/)[0]), m).toBeGreaterThanOrEqual(36);
    }
    expect(HUB_SRC, 'a fixed-px font size does not scale with the reader').not.toMatch(/text-\[\d+px\]/);
  });

  it('USES NO INLINE COLOR, so every surface follows the theme', () => {
    // An inline hex cannot be remapped per theme, which is how a midnight
    // accent once rendered at 2.84:1 on black (contrast-guard's founding bug).
    expect(HUB_SRC).not.toMatch(/style=\{\{[^}]*(color|background)/i);
  });

  it('keeps the tiles two-up on a phone and three-up above it', () => {
    expect(HUB_SRC).toMatch(/grid-cols-2 sm:grid-cols-3/);
  });
});

describe('the preference is remembered on the device, honestly', () => {
  it('writes the choice under a namespaced key', () => {
    act(() => setHomeView('lifehub'));
    let stored = null;
    try { stored = localStorage.getItem(HOME_VIEW_KEY); } catch { /* blocked */ }
    expect(HOME_VIEW_KEY).toBe('poetech:home-view');
    expect(stored).toBe('lifehub');
  });

  it('refuses a value it does not know', () => {
    act(() => setHomeView('whatever'));
    expect(getHomeView()).toBe('current');
  });

  it('and says out loud that per-person means per-device here', () => {
    const src = readFileSync(join(ROOT, 'app', 'src', 'lib', 'home-view-prefs.js'), 'utf8');
    expect(src.replace(/\s*\n\s*\/\/\s*/g, ' ')).toMatch(/per person here means per device/i);
    expect(src).toMatch(/profile row|schema change/i);
  });
});
