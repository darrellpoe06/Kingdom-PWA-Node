// =============================================================================
// VerseHighlighter — live render proof the in-app color picker works and reports
// picks (Darrell 2026-07-04). Mounts the real component, opens the palette,
// proves every semantic color renders, and that clicking one reports its key
// (and that Clear reports 'none'). No device-font emoji in the control.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import VerseHighlighter from '../components/VerseHighlighter.jsx';
import { HIGHLIGHT_STYLES } from '../lib/scripture-highlights.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
afterEach(() => {
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
});

async function mount(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(el); });
  return container;
}

function click(el) {
  return act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
}

describe('VerseHighlighter', () => {
  it('opens the palette and offers every style (grouped) plus Clear', async () => {
    const c = await mount(createElement(VerseHighlighter, { value: 'none', onPick: () => {}, refLabel: 'Luke 2:26' }));
    // closed: a clean, quiet swatch trigger — labelled for a11y (no clunky text).
    expect(c.querySelector('button').getAttribute('aria-label')).toMatch(/Highlight/);
    await click(c.querySelector('button'));
    // Each style is a menuitemradio whose accessible label carries its name +
    // meaning (the chip itself previews the look on a sample "Aa").
    const items = [...c.querySelectorAll('[role="menuitemradio"]')];
    for (const s of HIGHLIGHT_STYLES) {
      expect(items.some((b) => (b.getAttribute('aria-label') || '').startsWith(`${s.label}:`)),
        `palette missing ${s.label}`).toBe(true);
    }
    // The Logos-style groups are labelled sections.
    expect(c.textContent).toMatch(/Colored text/);
    expect(c.textContent).toMatch(/Highlighter/);
    expect(c.textContent).toMatch(/Emphasis/);
    expect(items.some((b) => /Clear/.test(b.getAttribute('aria-label') || ''))).toBe(true);
  });

  it('reports the picked color key, then reports none on Clear', async () => {
    const picks = [];
    const c = await mount(createElement(VerseHighlighter, { value: 'none', onPick: (k) => picks.push(k), refLabel: 'Luke 4:18' }));
    await click(c.querySelector('button')); // open
    // the coral (Promise) swatch is a menuitemradio labelled with its meaning
    const coral = [...c.querySelectorAll('[role="menuitemradio"]')].find((b) => /Promise/.test(b.getAttribute('aria-label') || ''));
    expect(coral).toBeTruthy();
    await click(coral);
    expect(picks).toEqual(['coral']);

    await click(c.querySelector('button')); // reopen
    const clear = [...c.querySelectorAll('[role="menuitemradio"]')].find((b) => /Clear/.test(b.getAttribute('aria-label') || ''));
    await click(clear);
    expect(picks).toEqual(['coral', 'none']);
  });

  it('when a color is set, the trigger reflects that color (via its accessible label)', async () => {
    const c = await mount(createElement(VerseHighlighter, { value: 'emerald', onPick: () => {}, refLabel: 'Luke 2:40' }));
    // The clean dot carries the color's meaning in its aria-label, not as clunky text.
    expect(c.querySelector('button').getAttribute('aria-label')).toMatch(/Life/);
  });
});
