// @vitest-environment jsdom
// =============================================================================
// Closing the panel is not silencing the Word (DR-0285)
// =============================================================================
// Darrell 2026-08-10, from the phone with the panel open mid-reading: "The
// reader can't be closed after opening to change speed of the reader... we need
// that." Close called stop(), so a listener who opened the panel to change the
// speed had to choose between putting the controls away and keeping the
// reading. The law now: ONE thing stops the voice — Stop.
//
// Proven-to-catch: the first test fails against the old close() (it called
// stop), and the reading-state assertions fail against the old collapsed
// button, which looked identical whether or not the Word was playing.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const stopSpy = vi.fn();
const state = { isReading: false, isPaused: false };
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: state.isReading, isPaused: state.isPaused, rate: 1.5,
    read: () => {}, pause: () => {}, resume: () => {}, stop: (...a) => stopSpy(...a), setRate: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  stopSpy.mockClear();
  state.isReading = false; state.isPaused = false;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const render = () => act(() => root.render(createElement(TTSControl, { view: 'church' })));
const fab = () => container.querySelector('button[aria-label*="read-aloud controls"]');
const openPanel = () => { render(); act(() => { fab().click(); }); };
const byText = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent || ''));
const byLabel = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.getAttribute('aria-label') || ''));

describe('while reading, Close puts the panel away and keeps the Word playing', () => {
  // The panel's reading state: the full card (Pause/Stop + speed + a way out),
  // which collapses to the slim pill via "Smaller".
  const openWhileReading = () => { openPanel(); state.isReading = true; render(); };

  it('Close does NOT stop the reading', () => {
    openWhileReading();
    const close = byText(/× Close/);
    expect(close).toBeTruthy();
    act(() => { close.click(); });
    expect(stopSpy).not.toHaveBeenCalled();
    expect(fab()).toBeTruthy();              // the panel really did close
  });

  it('the slim pill can be dismissed without silencing anything', () => {
    openWhileReading();
    act(() => { byText(/⌄ Smaller/).click(); });   // collapse to the pill
    const hide = byLabel(/Hide reading controls/);
    expect(hide).toBeTruthy();
    act(() => { hide.click(); });
    expect(stopSpy).not.toHaveBeenCalled();
    expect(fab()).toBeTruthy();
  });

  it('the collapsed button then SHOWS that the Word is still playing', () => {
    openWhileReading();
    act(() => { byText(/× Close/).click(); });
    expect(fab().getAttribute('aria-label')).toMatch(/Reading aloud/);
    state.isPaused = true;
    render();
    expect(fab().getAttribute('aria-label')).toMatch(/Reading paused/);
  });

  it('the speed control is reachable while reading — the whole reason the panel was opened', () => {
    openWhileReading();
    expect([...container.querySelectorAll('button')].some((b) => /1\.5×/.test(b.textContent))).toBe(true);
    expect(byText(/⏹ Stop/)).toBeTruthy();   // the one control that ends it
    expect(byText(/× Close/)).toBeTruthy();  // and the one that does not
  });
});

describe('when nothing is reading, Close still tidies up', () => {
  it('closes the panel and stands the reader down', () => {
    openPanel();
    act(() => { byText(/× Close/).click(); });
    expect(stopSpy).toHaveBeenCalled();     // idle: also disarms tap-to-start
    expect(container.querySelector('button[aria-label="Open read-aloud controls"]')).toBeTruthy();
  });
});
