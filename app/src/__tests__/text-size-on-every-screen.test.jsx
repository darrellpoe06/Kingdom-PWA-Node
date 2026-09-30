// @vitest-environment jsdom
// =============================================================================
// TEXT SIZE ON EVERY SCREEN, WITHOUT OPENING THE READER (DR-0698)
// =============================================================================
// Darrell 2026-09-30: "Text sizes are the main reason why I keep opening the
// reader... give an option for that on each screen even without the other
// controls... make sense?"
//
// Inside an open lesson the header flows away with the page (DR-0652), so the
// only text-size control left on screen mid-lesson was inside the read-aloud
// panel. The A- / A+ pair now rides beside the read-aloud button, which the
// app shell renders on every route, and it drives the SAME store the panel's
// row and the header's row drive (lib/text-size.js): one switch, three faces.
//
// PROVEN-TO-CATCH (DR-0076 §3): remove <TextSizeQuick> from TTSControl's idle
// row and the render, sync and no-speech cases below all fail.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const reader = vi.hoisted(() => ({ supported: true }));
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: reader.supported, isReading: false, isPaused: false, rate: 1,
    read: () => {}, pause: () => {}, resume: () => {}, stop: () => {},
    claimAudio: () => {}, setRate: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));

import TTSControl from '../components/TTSControl.jsx';
import { TextSizeQuick } from '../components/TextSizeControl.jsx';
import { TEXT_SIZE_STEPS, loadTextSize, setTextSize, stepTextSizeKey } from '../lib/text-size.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const SRC = (rel) => readFileSync(join(process.cwd(), 'src', rel), 'utf8');

let host; let root;
const mount = async (el) => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root.render(el); });
};
const q = (id) => host.querySelector(`[data-testid="${id}"]`);
const click = async (el) => { await act(async () => { el.click(); }); };

beforeEach(() => {
  reader.supported = true;
  try { localStorage.clear(); } catch (e) { /* */ }
  setTextSize('normal');
});
afterEach(async () => {
  if (root) await act(async () => { root.unmount(); });
  if (host) host.remove();
  root = null; host = null;
  setTextSize('normal');
});

describe('stepTextSizeKey walks the one ladder', () => {
  it('steps up and down through the five steps and clamps at both ends', () => {
    const keys = TEXT_SIZE_STEPS.map((s) => s.key);
    expect(stepTextSizeKey('normal', 1)).toBe(keys[1]);
    expect(stepTextSizeKey(keys[1], -1)).toBe('normal');
    expect(stepTextSizeKey('normal', -1)).toBe('normal');
    expect(stepTextSizeKey(keys[keys.length - 1], 1)).toBe(keys[keys.length - 1]);
    expect(stepTextSizeKey('nonsense', 1)).toBe(keys[1]);
  });
});

describe('the pair is on screen beside the read-aloud button, reader CLOSED', () => {
  it('renders A- / A+ with the panel closed, with labels a screen reader can say', async () => {
    await mount(createElement(TTSControl));
    expect(q('reader-look-and-feel')).toBeNull(); // the reader is not open
    const pair = q('text-size-quick');
    expect(pair).not.toBeNull();
    expect(q('reader-idle-row').contains(pair)).toBe(true);
    expect(pair.getAttribute('role')).toBe('group');
    expect(pair.getAttribute('aria-label')).toMatch(/text size/i);
    expect(q('text-size-quick-smaller').getAttribute('aria-label')).toMatch(/smaller text/i);
    expect(q('text-size-quick-bigger').getAttribute('aria-label')).toMatch(/bigger text size/i);
  });

  it('A+ changes the SHARED setting: stored, applied to the root, and the reader panel shows it', async () => {
    await mount(createElement(TTSControl));
    await click(q('text-size-quick-bigger'));
    expect(loadTextSize()).toBe('large');
    expect(document.documentElement.getAttribute('data-text-size')).toBe('large');
    expect(q('text-size-quick').getAttribute('data-text-size-now')).toBe('large');
    // Open the reader: its own row reflects the size the pair just set.
    const fab = [...host.querySelectorAll('button')].find((b) => /open read-aloud controls/i.test(b.getAttribute('aria-label') || ''));
    await click(fab);
    const pressed = [...q('reader-text-size').querySelectorAll('button')].filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed.map((b) => b.getAttribute('aria-label'))).toEqual(['Large text size (current)']);
  });

  it('a change made in the reader panel moves the pair too (one switch)', async () => {
    await mount(createElement(TTSControl));
    const fab = [...host.querySelectorAll('button')].find((b) => /open read-aloud controls/i.test(b.getAttribute('aria-label') || ''));
    await click(fab);
    const larger = [...q('reader-text-size').querySelectorAll('button')].find((b) => /^Larger text size/.test(b.getAttribute('aria-label')));
    await click(larger);
    await act(async () => { root.unmount(); });
    host.remove();
    await mount(createElement(TTSControl));
    expect(q('text-size-quick').getAttribute('data-text-size-now')).toBe('larger');
  });

  it('is still there on a device that cannot speak', async () => {
    reader.supported = false;
    await mount(createElement(TTSControl));
    expect(q('text-size-quick')).not.toBeNull();
    await click(q('text-size-quick-bigger'));
    expect(loadTextSize()).toBe('large');
  });
});

describe('the pair itself', () => {
  it('reset shows only above Normal, and the ends are disabled, never hidden', async () => {
    await mount(createElement(TextSizeQuick));
    expect(q('text-size-quick-reset')).toBeNull();
    expect(q('text-size-quick-smaller').disabled).toBe(true);
    await click(q('text-size-quick-bigger'));
    expect(q('text-size-quick-reset')).not.toBeNull();
    await click(q('text-size-quick-reset'));
    expect(loadTextSize()).toBe('normal');
    await act(async () => { setTextSize('bigprint'); });
    expect(q('text-size-quick-bigger').disabled).toBe(true);
    expect(q('text-size-quick-smaller').disabled).toBe(false);
  });

  it('is chrome with 44px targets and labels that never compound with the setting', () => {
    const src = SRC('components/TextSizeControl.jsx');
    const quick = src.slice(src.indexOf('export function TextSizeQuick'), src.indexOf('// THE BRAND LOCKUP'));
    expect(quick).toMatch(/ts-chrome-region/);
    expect(quick).toMatch(/w-11 h-11/); // 2.75rem inside the chrome cap = 44px
    const sizes = quick.match(/fontSize: '[^']+'/g) || [];
    expect(sizes.length).toBe(3);
    for (const s of sizes) expect(s).toMatch(/calc\(\d+px \/ var\(--ts-chrome-scale, 1\)\)/);
  });
});

describe('every route carries it', () => {
  it('the app shell renders the read-aloud control outside every view branch', () => {
    const shell = SRC('poe-financial-mvp-v28.jsx');
    const i = shell.indexOf('<TTSControl isOwner=');
    expect(i).toBeGreaterThan(-1);
    // Right after </main>, not inside any `view === ...` condition.
    const before = shell.slice(Math.max(0, i - 200), i);
    expect(before).toMatch(/<\/main>\s*$/);
  });
});
