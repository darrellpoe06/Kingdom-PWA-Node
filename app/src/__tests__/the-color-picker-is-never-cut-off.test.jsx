// =============================================================================
// The color picker is never cut off (Darrell 2026-10-18, on Psalms 110 in the
// reader: "we can't adjust the color of the text because it's cut off... make
// sense!?"). His screenshot: the last verse's palette opened DOWN from the dot,
// and its EMPHASIS row and Clear slid under the bottom dock (FEEDBACK · GIVE ·
// READ), out of reach at large print. The palette now measures the room it has,
// down to the dock's top edge (--chrome-dock-h), and opens up, or scrolls inside
// itself, when it would not fit.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import VerseHighlighter, { placeMenu, MENU_GAP_PX } from '../components/VerseHighlighter.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('placeMenu: where the palette opens', () => {
  const at = (o) => placeMenu({ viewportHeight: 800, dockHeight: 90, menuHeight: 300, ...o });

  it('opens down when it fits above the dock', () => {
    expect(at({ triggerTop: 100, triggerBottom: 124 })).toEqual({ up: false, maxHeight: null });
  });

  it('opens UP on the last verses, where down would run under the dock (the screenshot)', () => {
    expect(at({ triggerTop: 600, triggerBottom: 624 })).toEqual({ up: true, maxHeight: null });
  });

  it('counts the dock: the same spot with no dock would fit below (proven to catch)', () => {
    // 800 - 0 - 460 - 8 = 332 ≥ 300 fits; with the 90px dock only 242 is left
    expect(at({ triggerTop: 436, triggerBottom: 460, dockHeight: 0 }).up).toBe(false);
    expect(at({ triggerTop: 436, triggerBottom: 460 }).up).toBe(true);
  });

  it('when neither side holds it (big print, short screen), it scrolls inside the larger side', () => {
    const p = placeMenu({ viewportHeight: 500, dockHeight: 90, menuHeight: 600, triggerTop: 200, triggerBottom: 224 });
    expect(p.up).toBe(true);
    expect(p.maxHeight).toBe(200 - MENU_GAP_PX);
    const q = placeMenu({ viewportHeight: 500, dockHeight: 90, menuHeight: 600, triggerTop: 60, triggerBottom: 84 });
    expect(q).toEqual({ up: false, maxHeight: 500 - 90 - 84 - MENU_GAP_PX });
  });
});

describe('the real picker on the last verse opens up and keeps Clear in reach', () => {
  let container; let root;
  const saved = {};
  afterEach(() => {
    try { act(() => root && root.unmount()); } catch { /* noop */ }
    if (container) container.remove();
    container = null; root = null;
    if (saved.rect) HTMLElement.prototype.getBoundingClientRect = saved.rect;
    if (saved.sh) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', saved.sh);
    document.documentElement.style.removeProperty('--chrome-dock-h');
  });

  it('measures the dot near the dock and opens the palette upward', async () => {
    saved.rect = HTMLElement.prototype.getBoundingClientRect;
    saved.sh = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight')
      || { configurable: true, get() { return 0; } };
    HTMLElement.prototype.getBoundingClientRect = function rect() {
      return { top: window.innerHeight - 150, bottom: window.innerHeight - 126, left: 0, right: 24, width: 24, height: 24 };
    };
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get() { return this.getAttribute('role') === 'menu' ? 320 : 0; } });
    document.documentElement.style.setProperty('--chrome-dock-h', '96px');

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(createElement(VerseHighlighter, { value: 'none', onPick: () => {}, refLabel: 'Psalms 110:7' })); });
    await act(async () => { container.querySelector('button').dispatchEvent(new MouseEvent('click', { bubbles: true })); });

    const menu = container.querySelector('[role="menu"]');
    expect(menu.getAttribute('data-opens')).toBe('up');
    expect(menu.className).toMatch(/bottom-full/);
    expect(menu.className).not.toMatch(/top-full/);
    expect([...menu.querySelectorAll('[role="menuitemradio"]')].some((b) => /Clear/.test(b.getAttribute('aria-label') || ''))).toBe(true);
  });
});
