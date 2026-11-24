// @vitest-environment jsdom
// =============================================================================
// DR-1627 — every app has a map of where you can go
// =============================================================================
// Darrell 2026-11-24, with two screenshots of the Love Corner's menu: "I want
// this type of menu to be inside each app as a quick way to identify where the
// users can go... like the Love Corner App has currently... make sense?"
//
// What is pinned:
//   1. The map lists ONLY the places the app already gave this reader: a tab
//      the reader does not hold, and a locked tab, never appear.
//   2. Search finds a place by its words, its id or its group.
//   3. A tap goes there and closes the sheet; the current place is marked.
//   4. All four doors mount it (PoeTech, Poe Properties, Moore Divahs, TLC).
// Each is shown to CATCH the break, not only to pass.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { searchPlaces, countPlaces } from '../components/shell/AppMapSheet.jsx';
import DoorMapButton from '../components/shell/DoorMapButton.jsx';
import { poetechMapGroups, doorMapGroup, UNNAMED_GROUP_LABEL } from '../lib/app-map.js';
import { navGroups } from '../lib/nav-items.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const src = (...p) => readFileSync(join(__dirname, '..', ...p), 'utf8');
const pairs = (ids) => ids.map((id) => [id, id]);

describe('1. the PoeTech map is the reader’s own gated tabs, nothing more', () => {
  const mine = pairs(['overview', 'books', 'church', 'games']);
  const groups = poetechMapGroups(navGroups(mine), { view: 'books' });
  const ids = groups.flatMap((g) => g.items.map((it) => it.id));

  it('lists every tab the reader holds, once, under its group', () => {
    expect(ids.filter((id) => !id.startsWith('link-')).sort()).toEqual(['books', 'church', 'games', 'overview']);
    expect(groups.map((g) => g.label)).toEqual([UNNAMED_GROUP_LABEL, 'Soul', 'Life']);
    expect(countPlaces(groups)).toBe(ids.length);
  });

  it('never lists a tab the reader was not given (Admin, Dev/Ops, Vault)', () => {
    for (const hidden of ['admin', 'center', 'vault', 'inbound']) expect(ids).not.toContain(hidden);
  });

  it('PROVEN TO CATCH: a map built from the whole catalogue would show Admin to this reader', () => {
    const everything = poetechMapGroups(navGroups(pairs(['overview', 'books', 'church', 'games', 'admin'])), {});
    expect(everything.flatMap((g) => g.items.map((it) => it.id))).toContain('admin');
  });

  it('marks the place the reader is on, and only that one', () => {
    const on = groups.flatMap((g) => g.items).filter((it) => it.on);
    expect(on.map((it) => it.id)).toEqual(['books']);
  });

  it('a quick link shows only with its section, and wins the mark over the section when the reader is on it', () => {
    expect(ids).toContain('link-learn');
    const noChurch = poetechMapGroups(navGroups(pairs(['overview'])), {});
    expect(noChurch.flatMap((g) => g.items.map((it) => it.id))).not.toContain('link-learn');
    const onLearn = poetechMapGroups(navGroups(mine), { view: 'church', churchView: 'learn' })
      .flatMap((g) => g.items)
      .filter((it) => it.on);
    expect(onLearn.map((it) => it.id)).toEqual(['link-learn']);
  });

  it('nothing in, nothing out', () => {
    expect(poetechMapGroups(null)).toEqual([]);
    expect(poetechMapGroups([])).toEqual([]);
  });
});

describe('2. a door’s map is that door’s own tabs', () => {
  const tabs = [
    { id: 'doors', label: 'Doors' },
    { id: 'rent', label: 'Rent', locked: true },
    { id: 'work', label: 'Work orders' },
  ];

  it('lists the tabs in order, marks the current one, and leaves a locked tab off', () => {
    const [g] = doorMapGroup('Poe Properties', tabs, 'work');
    expect(g.label).toBe('Poe Properties');
    expect(g.items.map((it) => `${it.id}${it.on ? '*' : ''}`)).toEqual(['doors', 'work*']);
  });

  it('PROVEN TO CATCH: without the locked check the map would offer a place the reader cannot open', () => {
    const unlocked = doorMapGroup(
      'Poe Properties',
      tabs.map((t) => ({ ...t, locked: false })),
      'work'
    );
    expect(unlocked[0].items.map((it) => it.id)).toContain('rent');
    expect(doorMapGroup('Poe Properties', tabs, 'work')[0].items.map((it) => it.id)).not.toContain('rent');
  });

  it('no tabs means no group, so no empty menu', () => {
    expect(doorMapGroup('X', [])).toEqual([]);
    expect(doorMapGroup('X', [{ id: 'a', label: 'A', locked: true }])).toEqual([]);
  });
});

describe('3. search', () => {
  const groups = [
    { key: 'family', label: 'Family', items: [{ id: 'books', label: 'Money' }, { id: 'overview', label: 'Big Picture' }] },
    { key: 'soul', label: 'Soul', items: [{ id: 'church', label: 'Church' }] },
  ];

  it('finds by the words on the tile, by the id, and by the group', () => {
    expect(searchPlaces('mon', groups).map((h) => h.id)).toEqual(['books']);
    expect(searchPlaces('BOOKS', groups).map((h) => h.id)).toEqual(['books']);
    expect(searchPlaces('soul', groups).map((h) => h.id)).toEqual(['church']);
    expect(searchPlaces('mon', groups)[0].group).toBe('Family');
  });

  it('an empty search and a word nothing has both return nothing', () => {
    expect(searchPlaces('', groups)).toEqual([]);
    expect(searchPlaces('   ', groups)).toEqual([]);
    expect(searchPlaces('zzz', groups)).toEqual([]);
  });
});

describe('4. the button opens the sheet, a tap goes there and closes it', () => {
  let host;
  let root;
  const q = (id) => document.querySelector(`[data-testid="${id}"]`);
  const tap = (el) => act(async () => el.click());
  const type = (el, value) =>
    act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

  beforeEach(() => {
    window.scrollTo = vi.fn();
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });
  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  const groups = doorMapGroup(
    'Moore Divahs',
    [
      { id: 'moore', label: 'Moore Divahs' },
      { id: 'practice', label: 'The Practice' },
    ],
    'moore'
  );

  it('is closed until asked, then shows the places with the current one marked', async () => {
    const onGo = vi.fn();
    act(() => root.render(createElement(DoorMapButton, { groups, onGo, appName: 'Moore Divahs' })));
    expect(q('app-map')).toBeNull();
    expect(q('app-map-button').getAttribute('aria-label')).toBe('Menu: everywhere you can go in Moore Divahs');
    await tap(q('app-map-button'));
    expect(q('app-map')).not.toBeNull();
    expect(q('app-map-tile-moore').getAttribute('aria-current')).toBe('page');
    expect(q('app-map-tile-practice').getAttribute('aria-current')).toBeNull();
    await tap(q('app-map-tile-practice'));
    expect(onGo).toHaveBeenCalledTimes(1);
    expect(onGo.mock.calls[0][0].id).toBe('practice');
    expect(q('app-map')).toBeNull();
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('search narrows to the match, says so when nothing matches, and a hit goes there', async () => {
    const onGo = vi.fn();
    act(() => root.render(createElement(DoorMapButton, { groups, onGo, appName: 'Moore Divahs' })));
    await tap(q('app-map-button'));
    await type(q('app-map-search'), 'zzz');
    expect(q('app-map-results').textContent).toMatch(/Nothing by that name/);
    await type(q('app-map-search'), 'prac');
    expect(q('app-map-hit-practice')).not.toBeNull();
    expect(q('app-map-hit-moore')).toBeNull();
    await tap(q('app-map-hit-practice'));
    expect(onGo.mock.calls[0][0].id).toBe('practice');
  });

  it('Back to top closes the sheet and scrolls', async () => {
    act(() => root.render(createElement(DoorMapButton, { groups, onGo: vi.fn() })));
    await tap(q('app-map-button'));
    await tap(q('app-map-top'));
    expect(q('app-map')).toBeNull();
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('a door with no places draws no button', () => {
    act(() => root.render(createElement(DoorMapButton, { groups: [] })));
    expect(q('app-map-button')).toBeNull();
  });
});

describe('5. all four doors mount it, each from the list it already shows', () => {
  it('PoeTech: the tab row carries the button, fed the shell’s own gated nav', () => {
    expect(src('components', 'TopNavRow.jsx')).toMatch(/<AppMapButton map=\{map\} \/>/);
    expect(src('poe-financial-mvp-v28.jsx')).toMatch(/<TopNavRow account=.* map=\{\{ \.\.\.navForDock, theme, setTheme, isOwner: isFamilyMember \}\}/);
    expect(src('components', 'shell', 'AppMapButton.jsx')).toMatch(/poetechMapGroups\(navGroupsIn, \{ view, churchView \}\)/);
  });

  it('Poe Properties: on the door only, from the face’s tabs', () => {
    expect(src('modules', 'properties', 'PropertiesApp.jsx')).toMatch(
      /surface === 'door' && <DoorMapButton appName="Poe Properties" groups=\{doorMapGroup\('Poe Properties', face\.tabs, activeTab/
    );
  });

  it('Moore Divahs: from the business row’s tabs', () => {
    expect(src('components', 'MooreDoor.jsx')).toMatch(/<DoorMapButton appName=\{BIZ\.brand\.label\} theme=\{theme\} groups=\{doorMapGroup\(BIZ\.brand\.label, BIZ\.tabs, tab/);
  });

  it('TLC: from the same sections the dock and the tabs read, signed in or not', () => {
    expect(src('components', 'TlcPublicDoor.jsx')).toMatch(/groups=\{doorMapGroup\(TLC_DOOR_BRAND\.name, dockItems, signedIn \? activeTab : visitorTab\)\}/);
  });

  it('the Love Corner keeps its own sheet, the one this was modelled on', () => {
    expect(src('components', 'shell', 'LoveCornerMenus.jsx')).toMatch(/export function AllFeaturesSheet/);
  });
});
