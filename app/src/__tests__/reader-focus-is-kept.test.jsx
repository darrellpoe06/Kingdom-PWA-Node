// @vitest-environment jsdom
// =============================================================================
// The reader keeps the remote's place when it folds (DR-0657)
// =============================================================================
// Measured on a Fire-TV-shaped Chromium: "Read this lesson" folds the panel
// into its small bar, the button holding focus is unmounted, focus falls to
// <body>, and the next D-pad press jumps to the Give button at the top of the
// page. A remote has no Tab to come back with. Proven-to-catch: both checks
// find focus on <body> without lib/focus-keeper.js.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { focusWasDropped } from '../lib/focus-keeper.js';

const state = { isReading: true, isPaused: false };
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: state.isReading, isPaused: state.isPaused, rate: 1,
    read: () => {}, pause: () => {}, resume: () => {}, stop: () => {}, claimAudio: () => {}, setRate: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container; let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const render = () => act(() => root.render(createElement(TTSControl, { view: 'church' })));
const settle = async () => { for (let i = 0; i < 4; i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const byText = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent || ''));
const byLabel = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.getAttribute('aria-label') || ''));
const inReader = () => !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('.tts-controls'));

describe('focus is never dropped to the page when the reader folds', () => {
  it('folding the panel to the small bar puts focus on the small bar', async () => {
    render();
    act(() => { byLabel(/read-aloud controls/).click(); });
    const smaller = byText(/⌄ Smaller/);
    expect(smaller).toBeTruthy();
    smaller.focus();
    act(() => { smaller.click(); });
    await settle();
    expect(document.activeElement, 'focus fell to <body>; the next D-pad press jumps to the top of the page').not.toBe(document.body);
    expect(inReader()).toBe(true);
  });

  it('hiding the small bar puts focus on the mini-player\'s pause', async () => {
    render();
    act(() => { byLabel(/read-aloud controls/).click(); });
    act(() => { byText(/⌄ Smaller/).click(); });
    const hide = byLabel(/Hide reading controls/);
    hide.focus();
    act(() => { hide.click(); });
    await settle();
    expect(document.activeElement && document.activeElement.getAttribute('data-testid')).toBe('reader-mini-playpause');
  });

  it('pure: only a focus that was dropped is restored', () => {
    const b = document.createElement('button');
    expect(focusWasDropped(b, document.body, document.body)).toBe(true);   // detached, focus on body
    document.body.appendChild(b);
    expect(focusWasDropped(b, document.body, document.body)).toBe(false);  // still there: a plain blur
    b.remove();
    expect(focusWasDropped(b, container, document.body)).toBe(false);      // focus moved somewhere real
  });
});
