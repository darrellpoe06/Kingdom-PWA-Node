// @vitest-environment jsdom
// =============================================================================
// On a TV the whole lesson list is reachable (2026-10-07)
// =============================================================================
// Darrell, on the Firestick, in Church → Learn: "Can't scroll lists of lessons
// on Firestick... how can we choose from the whole list in a Firestick?!!!"
// OCTOBER 2026 · 7 lessons, four on screen, the box cut at the fourth.
//
// Silk drives a pointer and scrolls only the page, at its edge. An inner box
// with max-height + overflow-y: auto cannot be scrolled by it at all. Two
// structural answers, both proven here: index.css flattens every such box
// inside <main> on a TV, and the dock grows ▲ Up / ▼ Down chips that page by
// clicking. The lesson list this came from is checked by name so the rule is
// known to reach it.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pageStep, pageBy, showsPageChips, PAGE_FRACTION } from '../lib/tv-paging.js';

vi.mock('../components/NetworkStatus.jsx', () => ({ default: () => createElement('div', { 'data-stub': 'network' }) }));
vi.mock('../components/ArrivalsBell.jsx', () => ({ default: () => createElement('div', { 'data-stub': 'bell' }) }));
vi.mock('../components/ChurchGiving.jsx', () => ({ ChurchGiveDockButton: () => createElement('div', { 'data-stub': 'give' }) }));

import ChromeDock from '../components/ChromeDock.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const SRC = (rel) => readFileSync(join(process.cwd(), 'src', rel), 'utf8');

describe('the step', () => {
  it('is most of a screen, so lines carry over and nothing is skipped', () => {
    expect(PAGE_FRACTION).toBeLessThan(1);
    expect(pageStep(1080)).toBe(864);
    expect(pageStep(0)).toBe(0);
    expect(pageStep('x')).toBe(0);
  });

  it('scrolls the window by the step, up or down, and never throws on an old engine', () => {
    const calls = [];
    const win = { innerHeight: 1000, scrollBy: (o) => calls.push(o) };
    expect(pageBy('down', { win })).toBe(800);
    expect(pageBy('up', { win, behavior: 'smooth' })).toBe(-800);
    expect(calls).toEqual([{ top: 800, left: 0, behavior: 'auto' }, { top: -800, left: 0, behavior: 'smooth' }]);
    const old = { innerHeight: 1000, scrollBy: (a, b) => { if (typeof a === 'object') throw new Error('no options'); calls.push(['old', a, b]); } };
    expect(pageBy('down', { win: old })).toBe(800);
    expect(calls[2]).toEqual(['old', 0, 800]);
    // A window that cannot say its height moves nothing (and throws nothing).
    expect(pageBy('down', { win: { innerHeight: 0, scrollBy: () => { throw new Error('never'); } } })).toBe(0);
  });

  it('the chips are for a TV only', () => {
    expect(showsPageChips('tv')).toBe(true);
    for (const c of ['phone', 'tablet', 'laptop', undefined]) expect(showsPageChips(c)).toBe(false);
  });
});

describe('the CSS reaches the list that was cut off', () => {
  const css = SRC('index.css');
  it('flattens inner scroll boxes inside main on a TV, with an opt-out class', () => {
    expect(css).toMatch(/html\[data-device-class="tv"\] main \.overflow-y-auto:not\(\.tv-keep-scroll\)\s*\{[^}]*max-height:\s*none\s*!important;[^}]*overflow-y:\s*visible\s*!important;/);
  });
  it('the Learn tree lesson list and the browse-all shelf are overflow-y-auto boxes under the shell’s main', () => {
    const learn = SRC('components/ChurchLearn.jsx');
    expect(learn).toMatch(/max-h-\[45vh\] overflow-y-auto[^>]*data-testid="course-lesson-list"/);
    expect(learn).toMatch(/data-testid="lesson-browse-all"[\s\S]{0,600}max-h-\[55vh\] overflow-y-auto/);
    expect(SRC('poe-financial-mvp-v28.jsx')).toMatch(/<main className=/);
    // The class the rule keys on is written at boot, before anything paints.
    expect(SRC('main.jsx')).toMatch(/markDeviceClass\(window\)/);
  });
});

describe('the dock pages by clicking on a TV', () => {
  let container, root;
  async function mount() {
    container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(ChromeDock, { onFeedback: () => {} }));
    });
    return container;
  }
  beforeEach(() => { document.documentElement.removeAttribute('data-device'); });
  afterEach(async () => {
    if (root) await act(async () => { root.unmount(); });
    if (container && container.parentNode) container.parentNode.removeChild(container);
    root = null; container = null;
    document.documentElement.removeAttribute('data-device');
  });

  it('on a TV: ▲ Up and ▼ Down are in the bar and each moves the page most of a screen', async () => {
    document.documentElement.setAttribute('data-device', 'tv');
    const calls = [];
    const orig = window.scrollBy;
    window.scrollBy = (o) => calls.push(o);
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1080 });
    try {
      const el = await mount();
      const down = el.querySelector('[data-testid="dock-page-down"]');
      const up = el.querySelector('[data-testid="dock-page-up"]');
      expect(down && up, 'both chips').toBeTruthy();
      await act(async () => { down.click(); });
      await act(async () => { up.click(); });
      expect(calls.map((c) => c.top)).toEqual([864, -864]);
      // Focus rings, as every dock chip (ui-standards).
      expect(down.className).toContain('focus:outline');
    } finally { window.scrollBy = orig; }
  });

  it('on a phone the chips are absent — a thumb already pages', async () => {
    const el = await mount();
    expect(el.querySelector('[data-testid="dock-page-down"]')).toBeNull();
    expect(el.querySelector('[data-testid="dock-page-up"]')).toBeNull();
  });
});
