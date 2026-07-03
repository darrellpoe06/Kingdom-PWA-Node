// =============================================================================
// ReactionBar — the "works like social media" gate (Verification Doctrine DR-0076):
// prove the AGGREGATE count pill shows on the card WITHOUT opening the picker, and
// that the interaction is the TEXTING-APP contract (Darrell 2026-07-03: "long
// hold gives options not a touch the choose... it's clunky... makes it feel
// cheap"):
//   TAP the chip  -> reacts instantly (Love by default; tap again removes);
//   HOLD the chip -> the palette opens under the finger;
//   TAP a tile    -> picks it, ONE touch (the old two-tap arm flow is gone);
//   HOLD a tile   -> previews meaning + Scripture without reacting;
//   the ▾ opens the same palette on a plain click (keyboard + discoverability).
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ReactionBar from '../components/ReactionBar.jsx';
import { HOLD_MS } from '../lib/use-press-hold.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
afterEach(() => {
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
  vi.useRealTimers();
});

async function render(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(el); });
}
const click = async (el) => { await act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }); };
// A press-and-hold: pointerdown, the hold timer elapses, pointerup, then the
// browser's synthesized click (which the hook must swallow).
async function hold(el) {
  vi.useFakeTimers();
  await act(async () => {
    el.dispatchEvent(new window.Event('pointerdown', { bubbles: true }));
    vi.advanceTimersByTime(HOLD_MS + 40);
  });
  vi.useRealTimers();
  await act(async () => {
    el.dispatchEvent(new window.Event('pointerup', { bubbles: true }));
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  });
}
const menuOpen = () => !!container.querySelector('[role="menu"]');
const chip = () => [...container.querySelectorAll('button')].find((b) => /tap for Love|Tap to remove/i.test(b.getAttribute('title') || ''));
const caret = () => container.querySelector('button[aria-haspopup="menu"]');
// The compact counts pill lives OUTSIDE the popover; find it by its "N reactions" title.
const countsPill = () => [...container.querySelectorAll('button')].find((b) => /^(See who reacted|\d+ reactions?)$/.test(b.getAttribute('title') || ''));
const paletteItem = (label) => [...container.querySelectorAll('[role="menuitem"]')]
  .find((b) => (b.getAttribute('title') || '').startsWith(label));

describe('ReactionBar aggregates + displays like social media', () => {
  it('shows a per-reaction count pill + total on the card without opening the picker', async () => {
    await render(createElement(ReactionBar, {
      entry: { counts: { lion: 2, lamb: 1 }, total: 3, myKey: null, score: 9,
        top: [{ key: 'lion', count: 2 }, { key: 'lamb', count: 1 }] },
      onReact: async () => ({ added: true }),
    }));
    expect(menuOpen()).toBe(false);            // picker is CLOSED
    const pill = countsPill();
    expect(pill, 'no aggregate counts pill on the card').toBeTruthy();
    expect(pill.textContent).toMatch(/2/);      // Lion count
    expect(pill.textContent).toMatch(/1/);      // Lamb count
    expect(pill.textContent).toMatch(/3/);      // running total
  });

  it('TAP on the chip reacts instantly with the default (Love) — no menu required', async () => {
    let sent = null;
    await render(createElement(ReactionBar, {
      entry: { counts: {}, total: 0, myKey: null, score: 0, top: [] },
      onReact: async (k) => { sent = k; return { added: true }; },
    }));
    await click(chip());
    expect(sent).toBe('love');                 // one touch, done
    expect(menuOpen()).toBe(false);            // no palette detour
  });

  it('TAP on the chip when I already reacted removes my reaction (toggle)', async () => {
    let sent = null;
    await render(createElement(ReactionBar, {
      entry: { counts: { lion: 3 }, total: 3, myKey: 'lion', score: 9, top: [{ key: 'lion', count: 3 }] },
      onReact: async (k) => { sent = k; return { removed: true }; },
    }));
    await click(chip());
    expect(sent).toBe('lion');                 // toggling my own pick
    // Optimistic aggregate: Lion 3 -> 2 (my vote removed).
    expect(countsPill().textContent).toMatch(/2/);
  });

  it('HOLD on the chip opens the palette (the texting-app options reveal)', async () => {
    await render(createElement(ReactionBar, {
      entry: { counts: {}, total: 0, myKey: null, score: 0, top: [] },
      onReact: async () => ({ added: true }),
    }));
    expect(menuOpen()).toBe(false);
    await hold(chip());
    expect(menuOpen()).toBe(true);             // options under the finger
  });

  it('inside the palette ONE tap picks — the two-tap arm flow is gone', async () => {
    let sent = null;
    await render(createElement(ReactionBar, {
      entry: { counts: { lion: 1 }, total: 1, myKey: null, score: 3, top: [{ key: 'lion', count: 1 }] },
      onReact: async (k) => { sent = k; return { added: true, reactionKey: k }; },
    }));
    await click(caret());                       // keyboard/discoverable route
    expect(menuOpen()).toBe(true);
    await click(paletteItem('Lion of Judah'));
    expect(sent).toBe('lion');                  // ONE tap picked
    expect(menuOpen()).toBe(false);             // picker closed after the tap
    expect(countsPill().textContent).toMatch(/2/); // optimistic 1 -> 2
  });

  it('HOLD on a tile previews meaning + Scripture WITHOUT reacting', async () => {
    let sent = null;
    await render(createElement(ReactionBar, {
      entry: { counts: {}, total: 0, myKey: null, score: 0, top: [] },
      onReact: async (k) => { sent = k; return { added: true }; },
    }));
    await click(caret());
    await hold(paletteItem('Lamb of God'));
    expect(sent).toBe(null);                    // did NOT react
    expect(menuOpen()).toBe(true);              // palette stays open
    expect(container.textContent).toMatch(/John 1:29/); // the Scripture preview
  });

  it('every palette tile shows its name visibly (meaning never hides behind hover)', async () => {
    await render(createElement(ReactionBar, { entry: { counts: {}, total: 0, myKey: null, score: 0, top: [] }, onReact: async () => ({}) }));
    await click(caret());
    const lamb = paletteItem('Lamb of God');
    expect(lamb, 'Lamb of God tile missing').toBeTruthy();
    expect(lamb.textContent).toMatch(/Lamb of God/); // visible label, not just a title attr
  });
});
