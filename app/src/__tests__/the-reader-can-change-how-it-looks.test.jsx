// @vitest-environment jsdom
// =============================================================================
// THE READER CAN CHANGE HOW IT LOOKS — from inside the lesson (DR-0524)
// =============================================================================
// Darrell, 2026-09-19, reading L179 on his phone with the Read Aloud panel
// open on screen:
//
//   "Can't change the text side nor etc on o cellphone reader fix it"
//
// MEASURED, and the first reading of the code was WRONG — which is the more
// useful half of this record. The first trace said the header scrolls away
// while the lesson's own bar is `sticky top-0`, so nothing was reachable. The
// header is position:sticky at top 0. With the top bar OPEN, five text-size
// controls stay on screen the whole way down a lesson.
//
// The real trap is the HIDEAWAY, and it is the state his screenshot shows —
// the lesson bar at the very top with no comfort row above it. Measured at
// 360px, mid-lesson, Normal size (chrome-layout-probe, the lesson pass):
//
//     header OPEN        -> 5 text-size controls, all 5 on screen
//     header TUCKED AWAY -> ZERO text-size controls in the DOM
//
// The hideaway unmounts the comfort row, and TextSizeEscapeHatch rendered
// nothing at Normal on the reasoning that "at 1x there is no trap" — true of
// getting OUT of big text, false of getting INTO it. ChurchLearn.jsx never
// rendered a text-size control at all.
//
// And the instrument was blind to it twice over: the textscale pass loads the
// app at page top and never opens a lesson, and the lesson pass only ever
// loaded with the header OPEN — the one state where the controls survive. Its
// own law, "a state the user can reach is a state the probe must load in," was
// written about this exact class and had not been applied here. The lesson pass
// now runs collapsed cases too; this file is the cheap half that runs in every
// vitest pass.
//
// TWO DEFECTS CAME OUT OF THE FIX ITSELF, and both are pinned below:
//
//   1. useTextSize kept its own useState, which was harmless while ONE control
//      existed. A second control would have shown a stale highlighted chip —
//      a comfort control telling the reader a size he is not on. Both now read
//      one published value (subscribeTextSize).
//   2. The header's theme row was a hardcoded list of FIVE and CREAM WAS NOT IN
//      IT — and cream is the first-run default, so a reader who chose any other
//      palette could never get back. Measured against lib/theme-css.js: six in
//      the registry, five in the header. The header now maps the registry.
//
// PROVEN-TO-CATCH (DR-0076 §3): the first block breaks each mechanism on
// purpose, including the exact shape of Darrell's report.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// jsdom has no speechSynthesis and the panel returns null when unsupported, so
// the reader's own panel would never mount and this file would measure nothing.
// The mock reports a ready, idle reader — the same stub tts-control-chrome-cap
// uses, for the same reason.
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: false, isPaused: false, rate: 1,
    read: () => {}, pause: () => {}, resume: () => {}, stop: () => {},
    claimAudio: () => {}, setRate: () => {},
    catalog: [
      { id: 'sys', label: 'System voice', group: 'Default', usable: true },
      { id: 'dp', label: 'Darrell Poe', group: 'Your voices', usable: true, ai: true, standIn: true },
    ],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));

import TTSControl from '../components/TTSControl.jsx';
import { TEXT_SIZE_STEPS, loadTextSize, setTextSize, subscribeTextSize, useTextSize } from '../lib/text-size.js';
import { THEMES, readThemePref, setThemePref, subscribeThemePref } from '../lib/theme-css.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SRC = (rel) => readFileSync(join(process.cwd(), 'src', rel), 'utf8');

let container, root;
async function mountPanel() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(TTSControl, {}));
  });
  // The panel starts collapsed to the floating button; open it the way a reader
  // does, by tapping it — mounting the open state directly would test a state
  // no reader can reach.
  const fab = [...container.querySelectorAll('button')]
    .find((b) => /read-aloud controls/i.test(b.getAttribute('aria-label') || ''));
  if (fab) await act(async () => { fab.click(); });
  return container;
}

beforeEach(() => {
  try { localStorage.clear(); } catch { /* private mode */ }
  setTextSize('normal');
  setThemePref('cream');
});
afterEach(async () => {
  if (root) await act(async () => { root.unmount(); });
  if (container) container.remove();
  container = null; root = null;
  setTextSize('normal');
  setThemePref('cream');
});

const sizeButtons = (el) => [...el.querySelectorAll('button')]
  .filter((b) => /text size/i.test(b.getAttribute('aria-label') || ''));
const themeButtons = (el) => [...el.querySelectorAll('button')]
  .filter((b) => / theme/i.test(b.getAttribute('aria-label') || ''));

describe('THE MEASURE CATCHES WHAT IT EXISTS TO CATCH (DR-0076 §3)', () => {
  it('catches the reported defect: a reader panel with no text-size control', () => {
    // The panel source BEFORE this change had no such control. If the block is
    // ever deleted, the mounted panel goes back to zero and this trips.
    const panel = SRC('components/TTSControl.jsx');
    expect(panel).toContain('data-testid="reader-text-size"');
    expect(panel).toContain('data-testid="reader-theme"');
  });

  it('catches a size control whose highlight would go stale', () => {
    // Two independent consumers of the hook. Before the store, each kept its
    // own useState and the second would still report `normal` after the first
    // changed it — the stale-chip defect. Proven here on the primitive.
    const seen = [];
    const off = subscribeTextSize((k) => seen.push(k));
    setTextSize('largest');
    off();
    setTextSize('large');
    expect(seen, 'setTextSize must publish to every subscriber').toEqual(['largest']);
    expect(typeof useTextSize).toBe('function');
  });

  it('catches the header list that had lost cream', () => {
    // The registry is the one source. Cream is the first-run default, so its
    // absence from any picker is a one-way door.
    expect(THEMES.map((t) => t.key)).toContain('cream');
    const header = SRC('poe-financial-mvp-v28.jsx');
    expect(header, 'the header must map the shared registry, never a second copy')
      .toContain('{THEMES.map(t => (');
    expect(header).not.toMatch(/\{ key: 'midnight',\s+color: '#000000'/);
  });
});

describe('the reading panel carries text size, reachable while reading', () => {
  it('renders one chip per step, labelled the way the layout probe looks for them', async () => {
    const el = await mountPanel();
    const btns = sizeButtons(el);
    expect(btns).toHaveLength(TEXT_SIZE_STEPS.length);
    expect(btns.map((b) => b.textContent.trim())).toEqual(TEXT_SIZE_STEPS.map((s) => s.label));
    // The probe filters on /text size/i in aria-label; if this drifts, the
    // layout probe silently measures nothing.
    for (const b of btns) expect(b.getAttribute('aria-label')).toMatch(/text size/i);
  });

  it('a tap really changes the applied size, not just the chip', async () => {
    const el = await mountPanel();
    const big = sizeButtons(el).find((b) => b.textContent.trim() === 'A44');
    await act(async () => { big.click(); });
    expect(loadTextSize()).toBe('bigprint');
    expect(document.documentElement.getAttribute('data-text-size')).toBe('bigprint');
  });

  it('marks the current step, and moves the mark when it changes', async () => {
    const el = await mountPanel();
    const current = () => sizeButtons(el).find((b) => b.getAttribute('aria-pressed') === 'true');
    expect(current().textContent.trim()).toBe('A');
    await act(async () => { sizeButtons(el).find((b) => b.textContent.trim() === 'A++').click(); });
    expect(current().textContent.trim()).toBe('A++');
  });

  it('follows a change made anywhere else — one size, every control', async () => {
    const el = await mountPanel();
    await act(async () => { setTextSize('large'); });
    const on = sizeButtons(el).find((b) => b.getAttribute('aria-pressed') === 'true');
    expect(on.textContent.trim()).toBe('A+');
  });
});

describe('the reading panel carries the colours too', () => {
  it('offers every theme in the registry, cream included', async () => {
    const el = await mountPanel();
    expect(themeButtons(el)).toHaveLength(THEMES.length);
    const labels = themeButtons(el).map((b) => b.getAttribute('aria-label'));
    expect(labels.some((l) => /cream/i.test(l))).toBe(true);
    expect(labels.some((l) => /midnight/i.test(l))).toBe(true);
  });

  it('a tap persists the choice and publishes it', async () => {
    const el = await mountPanel();
    const seen = [];
    const off = subscribeThemePref((k) => seen.push(k));
    const midnight = themeButtons(el).find((b) => /midnight/i.test(b.getAttribute('aria-label') || ''));
    await act(async () => { midnight.click(); });
    off();
    expect(readThemePref()).toBe('midnight');
    expect(seen).toContain('midnight');
  });

  it('can get back to cream, which the header alone could not do', async () => {
    setThemePref('midnight');
    const el = await mountPanel();
    const cream = themeButtons(el).find((b) => /cream/i.test(b.getAttribute('aria-label') || ''));
    expect(cream, 'no way back to the default palette').toBeTruthy();
    await act(async () => { cream.click(); });
    expect(readThemePref()).toBe('cream');
  });

  it('refuses a key that is not a real palette rather than applying nonsense', () => {
    setThemePref('cream');
    expect(setThemePref('chartreuse')).toBe('cream');
    expect(readThemePref()).toBe('cream');
  });
});

describe('the controls are chrome, sized like the rest of this panel', () => {
  it('sizes in em so it rides the CAPPED chrome multiplier', () => {
    // The panel's own comment records the defect this prevents: rem-sized
    // controls inside this em-sized box balloon at A+++/A44 and clip off
    // screen. A raw rem/px class in this block is that defect returning.
    const panel = SRC('components/TTSControl.jsx');
    const block = panel.slice(
      panel.indexOf('data-testid="reader-look-and-feel"'),
      panel.indexOf('WHO IS LEARNING'),
    );
    expect(block.length).toBeGreaterThan(400);
    expect(block).not.toMatch(/text-\[\d+(\.\d+)?rem\]/);
    expect(block).not.toMatch(/min-h-\[\d+(\.\d+)?rem\]/);
    expect(block).toMatch(/text-\[0\.625em\]/);
    expect(block).toMatch(/min-h-\[2\.25em\]/);
  });

  it('does not import the rem-sized control it deliberately re-renders', () => {
    const panel = SRC('components/TTSControl.jsx');
    expect(panel).not.toMatch(/import\s+TextSizeControl/);
    expect(panel).toContain("from '../lib/text-size.js'");
  });
});
