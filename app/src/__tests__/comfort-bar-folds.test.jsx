// @vitest-environment jsdom
// =============================================================================
// The big-text bottom block folds to one slim row, and stays folded (DR-0716)
// =============================================================================
// Darrell 2026-10-01, at A44 on his Fold 7: "How do I get rid of the below
// header?!!!!! I need a button!!!!" Pins: the toggle hides and restores the
// block (through <html data-comfort-bar>, which index.css folds on), the choice
// persists across a reload, nothing unmounts, the collapsed row keeps the way
// back and the text-size control, and the buttons wear the family look and
// the focus ring. The folded HEIGHT is measured in a real browser by
// scripts/chrome-layout-probe.mjs (the COMFORT pass).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ComfortBarToggle from '../components/ComfortBarToggle.jsx';
import { COMFORT_BAR_KEY, reloadComfortCollapsed, setComfortCollapsed } from '../lib/comfort-bar.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const attr = () => document.documentElement.getAttribute('data-comfort-bar');

beforeEach(() => {
  try { localStorage.clear(); } catch { /* ignore */ }
  act(() => { reloadComfortCollapsed(); });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); act(() => { setComfortCollapsed(false); }); });

const render = () => act(() => root.render(createElement(ComfortBarToggle)));

describe('Hide folds the block, Show controls brings it back', () => {
  it('starts open with a Hide button', () => {
    render();
    expect(attr()).toBe('open');
    expect(q('comfort-hide').textContent).toMatch(/Hide/);
    expect(q('comfort-show')).toBeNull();
  });

  it('Hide folds it: the page is told collapsed, and the slim row keeps the way back + text size', () => {
    render();
    act(() => { q('comfort-hide').click(); });
    expect(attr()).toBe('collapsed');
    expect(q('comfort-show').textContent).toMatch(/Show controls/);
    expect(q('text-size-compact'), 'big text must stay reversible while folded').toBeTruthy();
  });

  it('Show controls restores it', () => {
    render();
    act(() => { q('comfort-hide').click(); });
    act(() => { q('comfort-show').click(); });
    expect(attr()).toBe('open');
    expect(q('comfort-hide')).toBeTruthy();
  });

  it('the choice persists across a reload (per device)', () => {
    render();
    act(() => { q('comfort-hide').click(); });
    expect(localStorage.getItem(COMFORT_BAR_KEY)).toBe('1');
    act(() => root.unmount());
    root = createRoot(container);
    act(() => { reloadComfortCollapsed(); }); // a fresh page load reads the stored choice
    render();
    expect(attr()).toBe('collapsed');
    expect(q('comfort-show')).toBeTruthy();
  });

  it('both buttons are square family chips at 44px with the focus ring', () => {
    render();
    const check = (b) => {
      expect(b.className).toMatch(/rounded-md/);
      expect(b.className).toMatch(/border-2 border-\[#E8E4DC\]/);
      expect(b.className).toMatch(/min-h-\[2\.75rem\]/);
      expect(b.className).toMatch(/focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-\[#B85838\]/);
    };
    check(q('comfort-hide'));
    act(() => { q('comfort-hide').click(); });
    check(q('comfort-show'));
  });
});

describe('the fold is CSS over a mounted block, scoped to the A44 bottom block', () => {
  const CSS = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
  const SHELL = readFileSync(resolve(__dirname, '../poe-financial-mvp-v28.jsx'), 'utf8');
  it('the header controls row carries the toggle first', () => {
    expect(SHELL).toMatch(/className="[^"]*ts-escape-hatch header-comfort-row[^"]*">\s*\{\/\*[^*]*\*\/\}\s*<ComfortBarToggle \/>/);
  });
  it('folded hides every other item in the row, only at Largest and Big Print', () => {
    expect(CSS).toMatch(/html\[data-text-size='bigprint'\]\[data-comfort-bar='collapsed'\] \.ts-safe-sticky \.header-comfort-row > :not\(\.comfort-toggle-row\)/);
    expect(CSS).toMatch(/html\[data-text-size='largest'\]\[data-comfort-bar='collapsed'\] \.ts-safe-sticky \.header-comfort-row > :not\(\.comfort-toggle-row\)/);
    expect(CSS).toMatch(/\.comfort-toggle-row \{\s*display: none;/);
  });
});
