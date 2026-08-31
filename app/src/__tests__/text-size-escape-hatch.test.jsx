// =============================================================================
// TextSizeEscapeHatch — the way OUT of big text survives the header hideaway
// =============================================================================
// Darrell, 2026-08-30, at Big Print 44 on his phone: "large font block the
// ability to change it afterwards after selecting it...!!!!!!!!??????"
//
// The defect, MEASURED by chrome-layout-probe before the fix (360px + 412px,
// Big Print and Largest): header expanded = 5 text-size controls, all on
// screen; header COLLAPSED = ZERO controls in the DOM. The hideaway unmounts
// the whole comfort row, so DR-0276's "big text is ALWAYS reversible" held
// only from a state the reader may have already left.
//
// The layout probe is the real instrument for this class (jsdom cannot measure
// geometry), and it now sweeps both header states. This suite is the CHEAP
// half that runs in every vitest pass: it pins the render contract the probe
// would otherwise have to catch minutes later in CI.
//
// PROVEN-TO-CATCH (DR-0076 §3): each assertion fails on the real regression —
// deleting the component's `collapsed` branch, or dropping the .ts-escape-hatch
// class the index.css rules key on, trips this file.
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { TextSizeEscapeHatch } from '../components/TextSizeControl.jsx';
import { TEXT_SIZE_STEPS, DEFAULT_TEXT_SIZE } from '../lib/text-size.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(TextSizeEscapeHatch, props));
  });
  return container;
}
// The component reads the live per-device setting, so drive it through storage.
function setSize(key) {
  try { localStorage.setItem('poe-text-size', key); } catch { /* jsdom always has it */ }
}
beforeEach(() => { setSize(DEFAULT_TEXT_SIZE); });
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  root = null; container = null;
});

// Every step above Normal — the sizes a reader can actually get stuck at.
const BIG_STEPS = TEXT_SIZE_STEPS.filter((s) => s.key !== DEFAULT_TEXT_SIZE).map((s) => s.key);

describe('the collapsed header still offers a way back', () => {
  it('renders the size stepper at EVERY step above Normal when collapsed', async () => {
    for (const key of BIG_STEPS) {
      setSize(key);
      const el = await mount({ collapsed: true });
      const buttons = [...el.querySelectorAll('button')]
        .filter((b) => /text size/i.test(b.getAttribute('aria-label') || ''));
      expect(buttons.length, `no way out of ${key} with the header collapsed`).toBe(TEXT_SIZE_STEPS.length);
      // The way back to Normal specifically must be one tap away.
      expect(buttons.some((b) => /^normal text size/i.test(b.getAttribute('aria-label') || ''))).toBe(true);
      if (root) await act(async () => root.unmount());
      container.remove(); root = null;
    }
  });

  it('carries the classes index.css keys on to keep it on screen at the trapping sizes', async () => {
    setSize('bigprint');
    const el = await mount({ collapsed: true });
    const row = el.firstElementChild;
    // .ts-escape-hatch = sticky at Larger, a fixed bottom bar at Largest/Big
    // Print. .ts-chrome-region = the control never compounds with its own
    // setting. Losing either silently re-traps the reader.
    expect(row.className).toContain('ts-escape-hatch');
    expect(row.className).toContain('ts-chrome-region');
  });

  it('names itself in plain words, not an icon the trapped reader must decode', async () => {
    setSize('bigprint');
    const el = await mount({ collapsed: true });
    expect(el.textContent).toContain('Text size');
  });
});

describe('it stays out of the way when nothing is trapped', () => {
  it('renders nothing at Normal, so the tucked-away header stays clean', async () => {
    setSize(DEFAULT_TEXT_SIZE);
    const el = await mount({ collapsed: true });
    expect(el.innerHTML).toBe('');
  });

  it('renders nothing while the header is open — that row already has the control', async () => {
    for (const key of BIG_STEPS) {
      setSize(key);
      const el = await mount({ collapsed: false });
      expect(el.innerHTML, `duplicate control at ${key} with the header open`).toBe('');
      if (root) await act(async () => root.unmount());
      container.remove(); root = null;
    }
  });
});
