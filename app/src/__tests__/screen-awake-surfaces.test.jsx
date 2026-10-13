// @vitest-environment jsdom
// =============================================================================
// The screen stays on while a lesson is read, and ▶ Continue when it went dark
// (DR-0439) — the SURFACES, in the real component tree.
// =============================================================================
// Darrell 2026-09-16: "my Zfold 7 allows 10 minutes until it goes black... A
// prompt to users... so it doesn't cut out their lesson and they can push play
// and it will continue." Three things a reader meets:
//   • the Read Aloud panel carries the per-device switch (On by default);
//   • the reader holds the wake lock WHILE reading and lets go after;
//   • if the page hid mid-reading and the reading did not come back, a
//     ▶ Continue prompt appears; it never appears for a reader's own pause;
//   • in a browser without a wake lock, a touch device sees the honest hint
//     under the lesson bar, naming the phone's own setting.
// PROVEN-TO-CATCH: each assertion fails against the pre-DR-0439 components.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const ra = {
  supported: true, isReading: false, isPaused: false, rate: 1,
  read: vi.fn(), pause: vi.fn(), resume: vi.fn(), stop: vi.fn(), claimAudio: vi.fn(), setRate: () => {},
  catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
  voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  segmentIndex: 0, setBoundaryHandler: () => {}, deviceRead: true, cloudProgress: null,
};
vi.mock('../lib/use-read-aloud.js', () => ({ useReadAloud: () => ({ ...ra }) }));

import TTSControl, { INTERRUPT_GRACE_MS } from '../components/TTSControl.jsx';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { _resetScreenAwakeForTests, SCREEN_AWAKE_KEY } from '../lib/screen-awake.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root, vis, sentinels, requestSpy;
const setVisibility = (v) => { vis = v; act(() => { document.dispatchEvent(new Event('visibilitychange')); }); };
function installWakeLock() {
  sentinels = [];
  requestSpy = vi.fn(async () => { const s = { released: false, release: vi.fn(async () => { s.released = true; }), addEventListener: () => {} }; sentinels.push(s); return s; });
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: requestSpy } });
}
function removeWakeLock() { Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: undefined }); }

beforeEach(() => {
  window.localStorage.clear();
  _resetScreenAwakeForTests();
  vis = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => vis });
  ra.isReading = false; ra.isPaused = false; ra.resume.mockClear(); ra.claimAudio.mockClear();
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); removeWakeLock(); vi.useRealTimers(); });

const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
const renderReader = () => act(() => root.render(createElement(TTSControl, { view: 'church' })));
const openPanel = () => {
  renderReader();
  const fab = container.querySelector('button[aria-label="Open read-aloud controls"]');
  act(() => fab.dispatchEvent(new MouseEvent('click', { bubbles: true })));
};

describe('the Read Aloud panel: the per-device switch', () => {
  it('shows "Keeps the screen on while it reads" with the switch On by default; Off persists per device', () => {
    installWakeLock();
    openPanel();
    const row = container.querySelector('[data-testid="screen-awake-row"]');
    expect(row).toBeTruthy();
    expect(row.textContent).toContain('Keeps the screen on while it reads');
    const sw = row.querySelector('[role="switch"]');
    expect(sw.getAttribute('aria-checked')).toBe('true');
    act(() => sw.click());
    expect(row.querySelector('[role="switch"]').getAttribute('aria-checked')).toBe('false');
    expect(window.localStorage.getItem(SCREEN_AWAKE_KEY)).toBe('off');
  });
  it('without a wake lock the row says so honestly and names the phone setting; no switch is offered', () => {
    removeWakeLock();
    openPanel();
    const row = container.querySelector('[data-testid="screen-awake-row"]');
    expect(row.textContent).toMatch(/cannot keep the screen on/);
    expect(row.textContent).toMatch(/Screen timeout/);
    expect(row.querySelector('[role="switch"]')).toBeNull();
  });
});

describe('the reader holds the screen while reading', () => {
  it('requests the wake lock when reading starts and releases it when reading stops', async () => {
    installWakeLock();
    renderReader();
    await flush();
    expect(requestSpy).not.toHaveBeenCalled();
    ra.isReading = true; renderReader(); await flush();
    expect(requestSpy).toHaveBeenCalledTimes(1);
    ra.isReading = false; renderReader(); await flush();
    expect(sentinels[0].release).toHaveBeenCalled();
  });
});

describe('▶ Continue after the screen went dark', () => {
  it('hidden while reading, back with the reading gone → the prompt; Continue starts it again and the prompt leaves', () => {
    installWakeLock();
    vi.useFakeTimers();
    ra.isReading = true; renderReader();
    setVisibility('hidden');
    ra.isReading = false; renderReader();
    setVisibility('visible');
    expect(container.querySelector('[data-testid="reading-interrupted"]')).toBeNull(); // the grace period first
    act(() => { vi.advanceTimersByTime(INTERRUPT_GRACE_MS + 50); });
    const prompt = container.querySelector('[data-testid="reading-interrupted"]');
    expect(prompt).toBeTruthy();
    expect(prompt.textContent).toContain('The screen went dark and the reading stopped');
    const cont = [...prompt.querySelectorAll('button')].find((b) => /Continue/.test(b.textContent));
    act(() => cont.click());
    expect(ra.claimAudio).toHaveBeenCalled(); // start() claims the audio session first — the reading is restarted
    expect(container.querySelector('[data-testid="reading-interrupted"]')).toBeNull();
  });
  it('the engine recovered by itself (still reading on return) → no prompt', () => {
    installWakeLock();
    vi.useFakeTimers();
    ra.isReading = true; renderReader();
    setVisibility('hidden');
    setVisibility('visible');
    act(() => { vi.advanceTimersByTime(INTERRUPT_GRACE_MS + 50); });
    expect(container.querySelector('[data-testid="reading-interrupted"]')).toBeNull();
  });
  it('a reader who was not reading when the screen hid is never prompted', () => {
    installWakeLock();
    vi.useFakeTimers();
    renderReader();
    setVisibility('hidden');
    setVisibility('visible');
    act(() => { vi.advanceTimersByTime(INTERRUPT_GRACE_MS + 50); });
    expect(container.querySelector('[data-testid="reading-interrupted"]')).toBeNull();
  });
});

describe('the lesson space, on a touch device without a wake lock', () => {
  const extraCourses = buildCatalogCourseDescriptors();
  const mountLearn = () => act(() => root.render(createElement(ChurchLearn, {
    extraCourses, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
    learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
  })));
  const withPointer = (coarse) => { window.matchMedia = vi.fn((q) => ({ matches: coarse && /pointer: coarse/.test(q), media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} })); };
  it('shows the honest hint under the lesson bar once a lesson is open, naming the phone setting', () => {
    removeWakeLock(); withPointer(true);
    mountLearn();
    expect(container.querySelector('[data-testid="screen-timeout-hint"]')).toBeNull(); // nothing until a lesson is open
    const title = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Bodybuilding Christ'));
    act(() => title.click()); // the lesson's own space (DR-0264)
    const hint = container.querySelector('[data-testid="screen-timeout-hint"]');
    expect(hint).toBeTruthy();
    expect(hint.textContent).toMatch(/Screen timeout/);
    expect(hint.className).toContain('ts-chrome-region'); // chrome, never a scaling line over the lesson
  });
  it('a mouse device (a laptop browser without the API) is not told about a phone setting', () => {
    removeWakeLock(); withPointer(false);
    mountLearn();
    const title = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Bodybuilding Christ'));
    act(() => title.click()); // the lesson's own space (DR-0264)
    expect(container.querySelector('[data-testid="screen-timeout-hint"]')).toBeNull();
  });
});
