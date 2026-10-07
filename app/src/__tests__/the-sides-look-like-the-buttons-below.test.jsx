// @vitest-environment jsdom
// =============================================================================
// The small side spaces carry the bottom bar's own buttons, and only what the
// bar is missing (DR-0796)
// =============================================================================
// Darrell, on the Firestick, looking at the first cut of the rails
// (2026-10-07): "The sides are larger and not like the buttons below... the
// user just needs the functions to look like the buttons below... just the
// missing ones I specified in the small side spaces... until we say full
// screen... make sense?"
//
// Two rules, and this file is the gate on both:
//   1. A rail control LOOKS LIKE a bottom-bar button — the same DOCK_BTN
//      square, an icon and one word — never a heading with prose and a row
//      of chips.
//   2. A rail carries ONLY what the bar does not.
// The pure half (which ids stand where) is in lib/reader-controller.js and is
// tested with the real list; the render half mounts the real reader under
// data-device="tv".
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  DOCK_CARRIES, RAIL_BUTTONS, railButtonIds, nextInCycle, railWord,
  RAIL_WIDTH_REM, FULLSCREEN_ATTR, RAILS_ATTR,
} from '../lib/reader-controller.js';
import { DOCK_BTN, DOCK_LABEL } from '../lib/chrome-dock.js';

vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: false, isPaused: false, rate: 1,
    read: () => {}, pause: () => {}, resume: () => {}, stop: () => {},
    claimAudio: () => {}, setRate: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));

import TTSControl from '../components/TTSControl.jsx';
import { setReadTarget, clearReadTarget } from '../lib/read-target.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const LESSON = 'the-sides-test';

describe('which functions stand in the side spaces', () => {
  it('every rail id is on one side, named once, and the sides do not overlap', () => {
    const ids = RAIL_BUTTONS.filter((b) => !b.dock).map((b) => b.id);
    expect(new Set(ids).size, 'no id is listed twice').toBe(ids.length);
    for (const b of RAIL_BUTTONS) expect(['left', 'right'], b.id).toContain(b.side);
    const left = railButtonIds('left');
    const right = railButtonIds('right');
    expect(left.length).toBeGreaterThan(0);
    expect(right.length).toBeGreaterThan(0);
    expect(left.filter((id) => right.includes(id)), 'nothing stands on both sides').toEqual([]);
  });

  it('nothing the bottom bar carries is repeated on a rail', () => {
    const onRails = [...railButtonIds('left'), ...railButtonIds('right')];
    for (const id of DOCK_CARRIES) expect(onRails, `${id} is in the bar`).not.toContain(id);
    // and the ones the bar is missing ARE there — the point of the whole change
    for (const id of ['speed', 'colors', 'highlight', 'place', 'word', 'full', 'stop', 'level']) {
      expect(onRails, id).toContain(id);
    }
  });

  it('PROVEN TO CATCH: give the bottom bar a function and it leaves the rail that day', () => {
    expect(railButtonIds('right')).toContain('speed');
    const moved = railButtonIds('right', { carries: [...DOCK_CARRIES, 'speed'] });
    expect(moved, 'speed moved into the bar, so the rail drops it').not.toContain('speed');
    expect(moved.length).toBe(railButtonIds('right').length - 1);
  });

  it('PROVEN TO CATCH: a rail wide enough for prose is a rail that went back to being a panel', () => {
    // The first cut was 15rem of headings, sentences and chip rows. One column
    // of 2.75rem squares plus its word does not need half of that.
    expect(RAIL_WIDTH_REM).toBeLessThan(10);
    expect(RAIL_WIDTH_REM).toBeGreaterThanOrEqual(5);
  });

  it('the word under an icon is one word, not a setting\'s full name', () => {
    expect(railWord('Midnight · OLED black')).toBe('Midnight');
    expect(railWord('Cream · warm light')).toBe('Cream');
    expect(railWord('Glacier · cool light')).toBe('Glacier');
    expect(railWord('Sapphire')).toBe('Sapphire');
    expect(railWord('Young children (5-8)')).toBe('Young');
    expect(railWord('A very long voice name indeed')).toBe('A very long');
    expect(railWord('')).toBe('');
    expect(railWord(null)).toBe('');
  });

  it('a cycling control walks its settings and wraps; an unknown setting starts at the first', () => {
    expect(nextInCycle(['a', 'b', 'c'], 'a')).toBe('b');
    expect(nextInCycle(['a', 'b', 'c'], 'c')).toBe('a');
    expect(nextInCycle(['a', 'b', 'c'], 'zzz')).toBe('a');
    expect(nextInCycle([], 'a')).toBeUndefined();
    expect(nextInCycle(null, 'a')).toBeUndefined();
  });
});

describe('what the side spaces look like, in the real reader on a TV', () => {
  let root = null;
  let container = null;
  const setWidth = (w) => { window.innerWidth = w; };

  async function mount() {
    setReadTarget(LESSON, { label: 'this lesson', text: 'Yahweh asked Moses a question once. It was just a stick.' });
    container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(TTSControl, {}));
    });
    return document.querySelector('[data-testid="reader-rails"]');
  }

  beforeEach(() => {
    try { localStorage.clear(); } catch { /* private mode */ }
    document.documentElement.setAttribute('data-device', 'tv');
    setWidth(1920);
  });
  afterEach(async () => {
    if (root) await act(async () => { root.unmount(); });
    if (container && container.parentNode) container.parentNode.removeChild(container);
    root = null; container = null;
    clearReadTarget(LESSON);
    document.documentElement.removeAttribute('data-device');
    document.documentElement.removeAttribute(FULLSCREEN_ATTR);
    document.documentElement.removeAttribute(RAILS_ATTR);
  });

  it('every control in a side space is one bottom-bar button: the bar\'s own class, an icon, one word', async () => {
    const rails = await mount();
    expect(rails).toBeTruthy();
    const buttons = [...rails.querySelectorAll('button')];
    expect(buttons.length, 'the rails carry controls').toBeGreaterThanOrEqual(6);
    const square = DOCK_BTN.split(' ').filter((c) => /min-h-|min-w-|flex-col|rounded-md/.test(c));
    for (const b of buttons) {
      for (const cls of square) expect(b.className, `${b.dataset.testid} is a bar button`).toContain(cls);
      const label = b.querySelector(`.${DOCK_LABEL.split(' ')[0].replace(/[[\]().]/g, '\\$&')}`) || b.lastElementChild;
      expect(label, `${b.dataset.testid} has a word under its icon`).toBeTruthy();
      expect(label.textContent.trim().length, `${b.dataset.testid}'s word is short`).toBeLessThanOrEqual(14);
      expect(b.getAttribute('aria-label'), `${b.dataset.testid} says what it does`).toBeTruthy();
    }
  });

  it('PROVEN TO CATCH: no prose, no section headings, no chip rows are left in the side spaces', async () => {
    const rails = await mount();
    // The panel's own groups, by the testids they carry in the tall column.
    for (const id of ['reader-look-and-feel', 'reader-follow-options', 'reader-offline', 'reader-text-size', 'reader-theme', 'reader-level-control', 'screen-awake-row']) {
      expect(rails.querySelector(`[data-testid="${id}"]`), `${id} belongs in the tall panel, not a rail`).toBeNull();
    }
    // Nothing in a rail is a paragraph or a select.
    expect(rails.querySelector('p'), 'no prose').toBeNull();
    expect(rails.querySelector('select'), 'no lists — a remote cannot drive one').toBeNull();
    // Every child of a rail is a button.
    for (const side of ['left', 'right']) {
      const rail = rails.querySelector(`[data-testid="reader-rail-${side}"]`);
      for (const el of [...rail.children]) expect(el.tagName, `${side} rail holds buttons only`).toBe('BUTTON');
    }
  });

  it('a tap on a cycling control moves it one setting on, and the word says which', async () => {
    const rails = await mount();
    const colors = rails.querySelector('[data-testid="reader-rail-colors"]');
    expect(colors).toBeTruthy();
    const before = colors.textContent;
    await act(async () => { colors.click(); });
    const after = document.querySelector('[data-testid="reader-rail-colors"]').textContent;
    expect(after, 'the word changed with the setting').not.toBe(before);
    const place = document.querySelector('[data-testid="reader-rail-place"]');
    expect(place.textContent).toMatch(/Top/);
    await act(async () => { place.click(); });
    expect(document.querySelector('[data-testid="reader-rail-place"]').textContent).toMatch(/Centre/);
  });

  it('full screen still takes the side spaces away — "until we say full screen"', async () => {
    const rails = await mount();
    await act(async () => { rails.querySelector('[data-testid="reader-rail-full"]').click(); });
    expect(document.querySelector('[data-testid="reader-rails"]')).toBeNull();
    expect(document.documentElement.getAttribute(FULLSCREEN_ATTR)).toBe('true');
  });

  it('the full panel is one tap away from a rail, for everything a rail does not hold', async () => {
    const rails = await mount();
    const panel = rails.querySelector('[data-testid="reader-rail-panel"]');
    expect(panel, 'a way back to the whole panel').toBeTruthy();
    await act(async () => { panel.click(); });
    expect(document.querySelector('[data-testid="reader-rails"]'), 'the rails stand down').toBeNull();
  });
});
