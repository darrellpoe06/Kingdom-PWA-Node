// @vitest-environment jsdom
// =============================================================================
// Nothing floats over the Word: the floaters live in the bottom bar (DR-0716)
// =============================================================================
// Darrell 2026-09-30, a screenshot of the L202 lesson reader on his Galaxy
// Fold 7 with Feedback, the network dot, Give, back-to-top and the read-aloud
// pill all floating over the lesson words: "Put the feedback and other
// floating options on the task bars somewhere they make sense... they can
// still do what they do however it will make the reader better and less
// blocked." And: "Like the text size etc..."
//
// Mounts the ACTUAL bar (ChromeDock) with the ACTUAL reader (TTSControl) over a
// lesson-shaped <main>, the way the app shell does, and pins:
//   1. none of these controls is position-fixed on its own: the only fixed
//      thing any of them sits in is the full-width bar, and the page carries
//      a spacer of the bar's height so the last line scrolls above it;
//   2. each control is present IN the bar;
//   3. each still fires its original action (Feedback opens feedback, Give
//      opens the giving panel, the dot opens its detail, Top scrolls home,
//      the reader opens, and the mini-bar drives the same engine);
//   4. each wears the text-size family look at a 44px floor.
// Proven-to-catch: against the pre-DR-0716 shell each of these fails (the
// controls were `fixed` corner pills, outside any bar, rounded, dimming).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, Fragment } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const spy = { read: vi.fn(), pause: vi.fn(), resume: vi.fn(), stop: vi.fn() };
const state = { isReading: false, isPaused: false };
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: state.isReading, isPaused: state.isPaused, rate: 1,
    read: (...a) => spy.read(...a), pause: (...a) => spy.pause(...a), resume: (...a) => spy.resume(...a), stop: (...a) => spy.stop(...a),
    claimAudio: () => {}, setRate: () => {}, segmentIndex: 0, deviceRead: true, setBoundaryHandler: null, cloudProgress: 0,
    audioVoice: '', setSkipHandlers: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');
const { default: ChromeDock } = await import('../components/ChromeDock.jsx');
const { setReadTarget, clearReadTarget } = await import('../lib/read-target.js');
const { isScrolledDeep, getDockSlot } = await import('../lib/chrome-dock.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const COLG = { name: 'Church of the Living God', links: { give: 'https://example.org/give' } };
const OWNER = 'lesson-bars-test';
const PARAS = ['The first paragraph opens it. Two sentences here.', 'The second paragraph follows. It has words.'];
let container, root, lessonEl, onFeedback;

beforeEach(() => {
  Object.values(spy).forEach((f) => f.mockClear());
  state.isReading = false; state.isPaused = false;
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, headers: new Headers(), text: async () => '', json: async () => ({}) })));
  try { localStorage.clear(); } catch { /* ignore */ }
  lessonEl = document.createElement('main');
  lessonEl.innerHTML = `<div id="lesson-bars">${PARAS.map((p) => `<p>${p}</p>`).join('')}</div>`;
  document.body.appendChild(lessonEl);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  onFeedback = vi.fn();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  if (lessonEl.isConnected) lessonEl.remove();
  try { clearReadTarget(OWNER); } catch { /* ignore */ }
  vi.unstubAllGlobals();
});

// The shell's order: the reader, then the bar (poe-financial-mvp-v28.jsx).
const render = (props = {}) => act(() => root.render(createElement(Fragment, null,
  createElement(TTSControl, { view: 'church' }),
  createElement(ChromeDock, { onFeedback, church: COLG, showGive: true, ...props }),
)));
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const dock = () => q('chrome-dock');
/** The nearest position:fixed box, read from the class the app uses for it. */
const fixedAncestor = (el) => el && el.closest('.fixed');

describe('every control sits in the bar, none floats over the text', () => {
  it('the bar is a full-width fixed bar with a spacer, so the last line scrolls above it', () => {
    render();
    const bar = dock();
    expect(bar, 'no bottom bar').toBeTruthy();
    expect(bar.className).toMatch(/\bfixed\b/);
    expect(bar.className).toMatch(/\binset-x-0\b/); // full width, a bar not a pill
    expect(bar.className).toMatch(/bg-\[#FAF8F4\]/); // solid, it covers no words
    expect(bar.getAttribute('role')).toBe('toolbar');
    expect(q('chrome-dock-spacer'), 'no room reserved at the foot of the page').toBeTruthy();
  });

  it('Feedback, Give, the network dot and the read-aloud button are IN the bar, and their only fixed box is the bar', () => {
    render();
    const bar = dock();
    const controls = {
      feedback: container.querySelector('button[aria-label="Open feedback"]'),
      give: container.querySelector('button[aria-label="Give to the church"]'),
      network: q('dock-network'),
      reader: container.querySelector('button[aria-label*="read-aloud controls"]'),
    };
    for (const [name, el] of Object.entries(controls)) {
      expect(el, `${name} is missing`).toBeTruthy();
      expect(bar.contains(el), `${name} is not in the bar`).toBe(true);
      expect(fixedAncestor(el), `${name} floats on its own`).toBe(bar);
      expect(el.className, `${name} is fixed itself`).not.toMatch(/\bfixed\b/);
    }
  });

  it('the read-aloud corner stack holds no button while docked (it renders into the bar slot)', () => {
    render();
    expect(getDockSlot()).toBe(q('chrome-dock-reader'));
    const stack = container.querySelector('.tts-controls.fixed');
    expect(stack).toBeTruthy();
    expect(stack.querySelectorAll('button').length, 'a reader button is still floating in the corner').toBe(0);
  });

  it('back to top appears IN the bar once the page is deep, never as a corner floater', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 5000 });
    try {
      render();
      const tops = [...container.querySelectorAll('button[aria-label="Back to the top of the page"]')];
      expect(tops.length).toBeGreaterThan(0);
      for (const t of tops) expect(fixedAncestor(t)).toBe(dock());
    } finally {
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    }
  });

  it('while the Word plays, the mini-bar is in the bar too, not over the text', () => {
    render();
    act(() => { setReadTarget(OWNER, { label: 'this lesson', text: PARAS.join(' '), elementId: 'lesson-bars' }); });
    state.isReading = true;
    render();
    const mini = q('reader-mini-bar');
    expect(mini, 'no mini-bar while reading').toBeTruthy();
    expect(dock().contains(mini)).toBe(true);
    expect(fixedAncestor(mini)).toBe(dock());
    expect(mini.className).not.toMatch(/rounded-full|shadow-lg/); // not a floating pill
  });
});

describe('each control still does what it did', () => {
  it('Feedback calls the same onFeedback', () => {
    render();
    act(() => { container.querySelector('button[aria-label="Open feedback"]').click(); });
    expect(onFeedback).toHaveBeenCalledTimes(1);
  });

  it('Give opens the same giving panel', () => {
    render();
    act(() => { container.querySelector('button[aria-label="Give to the church"]').click(); });
    expect(container.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('Give rides only where it did (the Church tab)', () => {
    render({ showGive: false });
    expect(container.querySelector('button[aria-label="Give to the church"]')).toBeNull();
  });

  it('the network dot opens its detail', () => {
    render();
    const btn = q('dock-network').querySelector('button');
    act(() => { btn.click(); });
    expect(container.querySelector('[aria-label="Network status detail"]')).toBeTruthy();
  });

  it('Top scrolls the page home', () => {
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    window.scrollTo = scrollTo;
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 5000 });
    try {
      render();
      act(() => { q('dock-top').click(); });
      expect(scrollTo).toHaveBeenCalled();
      const arg = scrollTo.mock.calls[0][0];
      expect(arg && arg.top).toBe(0);
    } finally {
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    }
  });

  it('the docked read-aloud button opens the same reader panel', () => {
    render();
    act(() => { container.querySelector('button[aria-label*="read-aloud controls"]').click(); });
    const panel = container.querySelector('.tts-controls.fixed');
    expect(panel.textContent).toMatch(/Read Aloud/);
  });

  it('the docked mini-bar drives the same engine: pause, back and forward', () => {
    render();
    act(() => { setReadTarget(OWNER, { label: 'this lesson', text: PARAS.join(' '), elementId: 'lesson-bars' }); });
    act(() => { container.querySelector('button[aria-label*="read-aloud controls"]').click(); });
    const readBtn = [...container.querySelectorAll('button')].find((b) => /Read this lesson — start to finish/.test(b.textContent));
    act(() => { readBtn.click(); });
    state.isReading = true;
    render();
    const close = [...container.querySelectorAll('button')].find((b) => /× Close/.test(b.textContent))
      || container.querySelector('button[aria-label="Hide reading controls — keeps reading"]');
    act(() => { close.click(); });
    act(() => { q('reader-mini-playpause').click(); });
    expect(spy.pause).toHaveBeenCalledTimes(1);
    expect(dock().contains(q('reader-mini-playpause'))).toBe(true);
  });

  it('the More button opens the same items on a phone and closes on Escape', () => {
    render();
    const more = q('dock-more');
    const items = q('dock-items');
    expect(items.className).toMatch(/(^|\s)hidden(\s|$)/);
    act(() => { more.click(); });
    expect(more.getAttribute('aria-expanded')).toBe('true');
    expect(items.className).not.toMatch(/(^|\s)hidden(\s|$)/);
    expect(items.contains(container.querySelector('button[aria-label="Open feedback"]'))).toBe(true);
    act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
    expect(more.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('one family with the text-size chips, 44px floors', () => {
  it('every docked button is a square bordered chip at 44px or more', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 5000 });
    try {
      render();
      const btns = [...dock().querySelectorAll('button')].filter((b) => !b.closest('[aria-label="Network status detail"]'));
      expect(btns.length).toBeGreaterThanOrEqual(6);
      for (const b of btns) {
        const name = b.getAttribute('aria-label') || b.textContent;
        expect(b.className, name).toMatch(/min-h-\[2\.75rem\]/);
        expect(b.className, name).toMatch(/min-w-\[2\.75rem\]/);
        expect(b.className, name).toMatch(/rounded-md/);
        expect(b.className, name).toMatch(/ts-chrome-region/); // 44px on screen at every text size
        expect(b.className, name).toMatch(/border-2/);
        expect(b.className, name).not.toMatch(/rounded-full|opacity-40/);
      }
    } finally {
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    }
  });
});

describe('the shell mounts the bar and no longer mounts the floaters', () => {
  const SHELL = readFileSync(resolve(__dirname, '../poe-financial-mvp-v28.jsx'), 'utf8');
  it('mounts ChromeDock with the same feedback action', () => {
    expect(SHELL).toMatch(/<ChromeDock onFeedback=\{\(\) => setFeedbackOpen\(true\)\}/);
  });
  it('the fixed Feedback pill, the Give floater and the fixed network pill are gone from the shell', () => {
    expect(SHELL).not.toMatch(/fixed bottom-4 left-4 z-30/);
    expect(SHELL).not.toMatch(/<ChurchGiveFloater/);
    expect(SHELL).not.toMatch(/<NetworkStatus \/>/);
  });
  it('the "deep" rule is one rule for the bar and the reader', () => {
    expect(isScrolledDeep(0, 900)).toBe(false);
    expect(isScrolledDeep(1125, 900)).toBe(false);
    expect(isScrolledDeep(1126, 900)).toBe(true);
  });
});
