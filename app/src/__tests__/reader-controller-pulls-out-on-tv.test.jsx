// @vitest-environment jsdom
// =============================================================================
// The reader's controls sit on the sides of a TV, and full screen takes them away
// =============================================================================
// Darrell, on the Firestick (2026-10-07): "I can't change reading speed nor
// other items inside the reader tab because it's hard to scroll the reader
// section... it doesn't show all control options... maybe we need to pull
// out the controller for TV? And bigger screens when detected or on
// Firestick." Then: "put the other reader options on the sides in the black
// space... so all options are always there... unless we go to full screen
// then the controls are not there just listen to the app and seeing the Word."
//
// A Firestick's pointer scrolls only the page, never a 260px box. So on a TV
// the SAME panel is split across the two margins beside the Word — play on
// the left rail, how-it-sounds-and-looks on the right — always there. The
// pure decision lives in lib/reader-controller.js and is tested with real
// numbers; the render half mounts the real reader under data-device="tv" and
// proves the rails, the toggle kept on the device, and full screen.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CONTROLLER_KEY, SIDES_MIN_WIDTH, TV_FLOOR_WIDTH, RAIL_WIDTH_CSS, RAIL_WIDTH_REM, WORD_MIN_REM, RAILS_ATTR, FULLSCREEN_ATTR,
  controllerLayout, loadControllerPref, saveControllerPref, flippedControllerPref, controllerToggleLabel,
  normalizeControllerPref, railWidth, mainInset, markRails, enterFullScreen, exitFullScreen, leavesFullScreen,
} from '../lib/reader-controller.js';

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
const SRC = (rel) => readFileSync(join(process.cwd(), 'src', rel), 'utf8');

describe('the decision — measured, not guessed', () => {
  it('a TV gets the rails; a phone, tablet and laptop keep the column, however wide', () => {
    expect(controllerLayout({ deviceClass: 'tv', width: 1920 })).toBe('sides');
    expect(controllerLayout({ deviceClass: 'tv', width: 960 })).toBe('sides'); // a Firestick’s Silk viewport
    expect(controllerLayout({ deviceClass: 'tv', width: TV_FLOOR_WIDTH - 1 })).toBe('tall');
    expect(controllerLayout({ deviceClass: 'phone', width: 390 })).toBe('tall');
    expect(controllerLayout({ deviceClass: 'tablet', width: 1024 })).toBe('tall');
    expect(controllerLayout({ deviceClass: 'laptop', width: 1440 })).toBe('tall');
    // The CI layout probe found rails on a 1920px laptop covering the header’s
    // tab row: a mouse already reaches every control, so width alone never decides.
    expect(controllerLayout({ deviceClass: 'laptop', width: 1920 })).toBe('tall');
  });

  it('an explicit choice wins — except that the rails need room', () => {
    expect(controllerLayout({ pref: 'tall', deviceClass: 'tv', width: 1920 })).toBe('tall');
    expect(controllerLayout({ pref: 'sides', deviceClass: 'laptop', width: SIDES_MIN_WIDTH })).toBe('sides');
    expect(controllerLayout({ pref: 'sides', deviceClass: 'laptop', width: SIDES_MIN_WIDTH - 1 })).toBe('tall');
    expect(controllerLayout({ pref: 'sides', deviceClass: 'phone', width: 390 })).toBe('tall');
    // A TV with no measured width (a test, SSR) is still a TV.
    expect(controllerLayout({ deviceClass: 'tv', width: 0 })).toBe('sides');
  });

  it('the pref is one of three words, falls back to auto, and the first build’s word still means the rails', () => {
    expect(normalizeControllerPref('sides')).toBe('sides');
    expect(normalizeControllerPref('wide')).toBe('sides');
    expect(normalizeControllerPref('sideways')).toBe('auto');
    expect(flippedControllerPref('sides')).toBe('tall');
    expect(flippedControllerPref('tall')).toBe('sides');
    expect(controllerToggleLabel('sides')).toMatch(/Tall/);
    expect(controllerToggleLabel('tall')).toMatch(/Sides/);
  });

  it('the rails have a width that leaves the Word 32rem, and <main> AND the header are inset by exactly that width while they are on', () => {
    // The shell’s <main> is full width (measured: "window 1440, <main> 1440"), so
    // the rails cannot sit in an empty margin; the page must make the margin —
    // and the sticky header too, or a rail covers its tab row (the CI probe).
    expect(SRC('poe-financial-mvp-v28.jsx')).toMatch(/<main className="w-full /);
    expect(SRC('poe-financial-mvp-v28.jsx')).toMatch(/<header [^>]*data-read-skip/);
    expect(RAIL_WIDTH_REM).toBeGreaterThanOrEqual(13);
    // A 960px TV (60rem): two rails of (60 - 32) / 2 = 14rem leave the Word 32rem.
    expect(WORD_MIN_REM).toBe(32);
    expect(RAIL_WIDTH_CSS).toBe('calc(min(15rem, (100vw - 32rem) / 2) * var(--ts-chrome-scale, 1))');
    expect(railWidth()).toBe(RAIL_WIDTH_CSS);
    expect(mainInset()).toBe(`calc(${RAIL_WIDTH_CSS} + 1.5rem)`);
    const css = SRC('index.css');
    const rule = css.match(/html\[data-reader-rails="sides"\] main,\s*html\[data-reader-rails="sides"\] header\[data-read-skip\] \{([^}]*)\}/);
    expect(rule, 'the inset rule, for main and the header').toBeTruthy();
    expect(rule[1]).toContain(`padding-left: ${mainInset()} !important`);
    expect(rule[1]).toContain(`padding-right: ${mainInset()} !important`);
    expect(RAILS_ATTR).toBe('data-reader-rails');
    const doc = { documentElement: { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; } } };
    markRails(doc, true); expect(doc.documentElement.attrs[RAILS_ATTR]).toBe('sides');
    markRails(doc, false); expect(doc.documentElement.attrs[RAILS_ATTR]).toBeUndefined();
  });

  it('is kept on the device, auto clears it, and a broken storage never throws', () => {
    const mem = new Map();
    const st = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) };
    expect(loadControllerPref(st)).toBe('auto');
    expect(saveControllerPref('sides', st)).toBe('sides');
    expect(mem.get(CONTROLLER_KEY)).toBe('sides');
    saveControllerPref('auto', st);
    expect(mem.has(CONTROLLER_KEY)).toBe(false);
    const broken = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } };
    expect(loadControllerPref(broken)).toBe('auto');
    expect(saveControllerPref('tall', broken)).toBe('tall');
  });

  it('full screen: the attribute is set and the browser asked, best-effort; Esc and the remote’s Back leave it', () => {
    const asked = [];
    const doc = { documentElement: { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; }, requestFullscreen() { asked.push('in'); return Promise.resolve(); } }, exitFullscreen() { asked.push('out'); return Promise.resolve(); } };
    expect(enterFullScreen(doc)).toBe(true);
    expect(doc.documentElement.attrs[FULLSCREEN_ATTR]).toBe('true');
    doc.fullscreenElement = doc.documentElement;
    expect(exitFullScreen(doc)).toBe(true);
    expect(doc.documentElement.attrs[FULLSCREEN_ATTR]).toBeUndefined();
    expect(asked).toEqual(['in', 'out']);
    // A browser without the API: the attribute still does the work, nothing throws.
    const bare = { documentElement: { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; } } };
    expect(enterFullScreen(bare)).toBe(false);
    expect(bare.documentElement.attrs[FULLSCREEN_ATTR]).toBe('true');
    expect(exitFullScreen(bare)).toBe(false);
    expect(leavesFullScreen('Escape')).toBe(true);
    expect(leavesFullScreen('GoBack')).toBe(true);
    expect(leavesFullScreen('ArrowDown')).toBe(false);
  });

  it('the CSS hides the dock, the shell header and the docked bar while the attribute holds', () => {
    const css = SRC('index.css');
    expect(css).toMatch(/html\[data-reader-fullscreen="true"\] \.chrome-dock,\s*html\[data-reader-fullscreen="true"\] header\[data-read-skip\],\s*html\[data-reader-fullscreen="true"\] \.tts-docked \{\s*display: none !important;/);
    expect(SRC('poe-financial-mvp-v28.jsx')).toMatch(/<header [^>]*data-read-skip/);
    expect(SRC('components/ChromeDock.jsx')).toMatch(/className="chrome-dock /);
  });
});

describe('the real reader', () => {
  let container, root;
  const setWidth = (w) => Object.defineProperty(window, 'innerWidth', { configurable: true, value: w });

  const LESSON = 'test-lesson-on-screen';
  async function mount({ lesson = true, open = true } = {}) {
    // A lesson on screen registers a read target; the rails stand beside it.
    if (lesson) setReadTarget(LESSON, { label: 'this lesson', text: 'Yahweh asked Moses a question once. It was just a stick.' });
    container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(TTSControl, {}));
    });
    // On a phone the panel starts collapsed to the floating button; open it
    // the way a reader does. On a TV beside a lesson the rails need no opening.
    if (open) {
      const fab = [...container.querySelectorAll('button')]
        .find((b) => /read-aloud controls/i.test(b.getAttribute('aria-label') || ''));
      if (fab) await act(async () => { fab.click(); });
    }
    return container;
  }

  beforeEach(() => {
    try { localStorage.clear(); } catch { /* private mode */ }
    document.documentElement.removeAttribute('data-device');
    document.documentElement.removeAttribute(FULLSCREEN_ATTR);
    document.documentElement.removeAttribute(RAILS_ATTR);
    setWidth(1024);
  });
  afterEach(async () => {
    if (root) await act(async () => { root.unmount(); });
    if (container && container.parentNode) container.parentNode.removeChild(container);
    root = null; container = null;
    clearReadTarget(LESSON);
    document.documentElement.removeAttribute('data-device');
    document.documentElement.removeAttribute(FULLSCREEN_ATTR);
  });

  it('on a TV beside a lesson the rails are there without opening anything: play on the left, Speed and Voice on the right', async () => {
    document.documentElement.setAttribute('data-device', 'tv');
    const el = await mount({ open: false });
    expect(el.querySelector('[data-testid="reader-panel"]'), 'no corner panel').toBeNull();
    const rails = document.querySelector('[data-testid="reader-rails"]');
    expect(rails, 'the rails').toBeTruthy();
    const left = rails.querySelector('[data-testid="reader-rail-left"]');
    const right = rails.querySelector('[data-testid="reader-rail-right"]');
    // jsdom normalises the calc; the rail carries the width, and it is the one expression.
    expect(left.style.width.replace(/\s+/g, '')).toContain('100vw');
    expect(right.style.width.replace(/\s+/g, '')).toContain('var(--ts-chrome-scale,1)');
    expect(document.documentElement.getAttribute(RAILS_ATTR), '<main> makes room').toBe('sides');
    expect(left.className).toMatch(/\bfixed\b.*\bleft-2\b/);
    expect(right.className).toMatch(/\bfixed\b.*\bright-2\b/);
    // What the Firestick never showed is on the right rail.
    expect(right.querySelector('[aria-label="Reading speed"]')).toBeTruthy();
    expect(right.querySelector('[data-testid="reader-follow-options"]')).toBeTruthy();
    expect(right.querySelector('[data-testid="reader-text-size"]')).toBeTruthy();
    // The header and the play controls are on the left.
    expect(left.querySelector('[data-testid="tts-header-top"]')).toBeTruthy();
    expect(left.querySelector('[data-testid="reader-controller-toggle"]').textContent).toMatch(/Tall/);
    expect(left.querySelector('[data-testid="reader-fullscreen"]')).toBeTruthy();
    // Nothing is duplicated: one speed group in the whole document.
    expect(document.querySelectorAll('[aria-label="Reading speed"]')).toHaveLength(1);
  });

  it('on a TV page with nothing to read (the Create station, the Learn tree) there are no rails and the page keeps its width; opening the reader brings them', async () => {
    document.documentElement.setAttribute('data-device', 'tv');
    const el = await mount({ lesson: false, open: false });
    expect(document.querySelector('[data-testid="reader-rails"]')).toBeNull();
    expect(document.documentElement.getAttribute(RAILS_ATTR)).toBeNull();
    const fab = [...el.querySelectorAll('button')].find((b) => /read-aloud controls/i.test(b.getAttribute('aria-label') || ''));
    expect(fab, 'the ordinary button').toBeTruthy();
    await act(async () => { fab.click(); });
    expect(document.querySelector('[data-testid="reader-rails"]')).toBeTruthy();
    expect(document.documentElement.getAttribute(RAILS_ATTR)).toBe('sides');
  });

  it('on a phone the panel stays the column in the corner, with Close and no full-screen button', async () => {
    setWidth(390);
    const el = await mount();
    const panel = el.querySelector('[data-testid="reader-panel"]');
    expect(panel.getAttribute('data-layout')).toBe('tall');
    expect(panel.className).toContain('w-[16.25em]');
    expect(document.querySelector('[data-testid="reader-rails"]')).toBeNull();
    expect(panel.querySelector('[data-testid="reader-fullscreen"]')).toBeNull();
    expect(panel.querySelector('[aria-label="Reading speed"]')).toBeTruthy();
  });

  it('one header tap flips rails to column and back, and the choice is kept on this device', async () => {
    document.documentElement.setAttribute('data-device', 'tv');
    const el = await mount();
    await act(async () => { document.querySelector('[data-testid="reader-controller-toggle"]').click(); });
    expect(document.querySelector('[data-testid="reader-rails"]')).toBeNull();
    expect(document.documentElement.getAttribute(RAILS_ATTR), 'the room is given back').toBeNull();
    expect(localStorage.getItem(CONTROLLER_KEY)).toBe('tall');
    // The column is the corner panel now — open it and flip back.
    const fab = [...el.querySelectorAll('button')].find((b) => /read-aloud controls/i.test(b.getAttribute('aria-label') || ''));
    if (fab) await act(async () => { fab.click(); });
    await act(async () => { el.querySelector('[data-testid="reader-controller-toggle"]').click(); });
    expect(document.querySelector('[data-testid="reader-rails"]')).toBeTruthy();
    expect(localStorage.getItem(CONTROLLER_KEY)).toBe('sides');
  });

  it('full screen: the rails go, the html attribute is set, a faint mark brings them back; Esc does too', async () => {
    document.documentElement.setAttribute('data-device', 'tv');
    await mount();
    await act(async () => { document.querySelector('[data-testid="reader-fullscreen"]').click(); });
    expect(document.documentElement.getAttribute(FULLSCREEN_ATTR)).toBe('true');
    expect(document.querySelector('[data-testid="reader-rails"]')).toBeNull();
    expect(document.documentElement.getAttribute(RAILS_ATTR), 'full width for the Word').toBeNull();
    const back = document.querySelector('[data-testid="reader-fullscreen-exit"]');
    expect(back).toBeTruthy();
    expect(back.className).toContain('focus:outline');
    await act(async () => { back.click(); });
    expect(document.documentElement.getAttribute(FULLSCREEN_ATTR)).toBeNull();
    expect(document.querySelector('[data-testid="reader-rails"]')).toBeTruthy();
    // And the keyboard / remote way out.
    await act(async () => { document.querySelector('[data-testid="reader-fullscreen"]').click(); });
    expect(document.querySelector('[data-testid="reader-rails"]')).toBeNull();
    await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(document.querySelector('[data-testid="reader-rails"]')).toBeTruthy();
    expect(document.documentElement.getAttribute(FULLSCREEN_ATTR)).toBeNull();
  });
});
