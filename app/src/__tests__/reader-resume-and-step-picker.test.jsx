// @vitest-environment jsdom
// =============================================================================
// Resume where I left off, start at any paragraph, and the headset's skip
// buttons step paragraphs (Darrell 2026-09-24)
// =============================================================================
// "start where I left off" in the player, and "starting at any chapter or
// step, not just beginning to end." This mounts the ACTUAL reader over a real
// lesson element and drives the three paths a person takes:
//   1. the panel offers "Resume · Paragraph N of M" and pressing it reads from
//      that paragraph;
//   2. "Start at a paragraph…" lists the paragraphs and reading starts at the
//      one picked;
//   3. the OS 'nexttrack' / 'previoustrack' (headset double tap, car wheel,
//      lock screen) move one paragraph, like the bar's own buttons.
// Proven-to-catch: (1) fails with no bookmark wiring, (2) with no picker, and
// (3) if the reader never hands its paragraph step to the hook (the handler
// stays empty and nothing is read).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const readSpy = vi.fn();
const hook = { skip: null };
const state = { isReading: false, isPaused: false };
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: state.isReading, isPaused: state.isPaused, rate: 1,
    read: (...a) => readSpy(...a), pause: () => {}, resume: () => {}, stop: () => {}, claimAudio: () => {},
    setRate: () => {}, segmentIndex: 0, deviceRead: true, setBoundaryHandler: null, cloudProgress: 0,
    setSkipHandlers: (h) => { hook.skip = h; },
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');
const { setReadTarget, clearReadTarget } = await import('../lib/read-target.js');
const { saveBookmark, clearBookmark } = await import('../lib/reader-bookmarks.js');
const { sentenceKeyOf } = await import('../lib/learn-resume.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const OWNER = 'lesson-resume-test';
const PARAS = [
  'The first paragraph opens the lesson. It says two things.',
  'The second paragraph teaches the middle. It has its own words.',
  'The third paragraph closes the lesson. It is the end.',
];
let container, root, lessonEl;

beforeEach(() => {
  readSpy.mockClear(); hook.skip = null;
  state.isReading = false; state.isPaused = false;
  try { localStorage.clear(); } catch { /* ignore */ }
  lessonEl = document.createElement('main');
  lessonEl.innerHTML = `<div id="lesson-el">${PARAS.map((p) => `<p>${p}</p>`).join('')}</div>`;
  document.body.appendChild(lessonEl);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove(); lessonEl.remove();
  try { clearReadTarget(OWNER); } catch { /* ignore */ }
  clearBookmark(OWNER);
});

const render = () => act(() => root.render(createElement(TTSControl, { view: 'church' })));
const openPanel = () => {
  render();
  act(() => { setReadTarget(OWNER, { label: 'this lesson', text: PARAS.join(' '), elementId: 'lesson-el' }); });
  const fab = container.querySelector('button[aria-label*="read-aloud controls"]');
  act(() => { fab.click(); });
};
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 400)); });
const q = (id) => container.querySelector(`[data-testid="${id}"]`);

describe('Resume — where this reading was left', () => {
  it('offers "Resume · Paragraph 2 of 3" and reads from there', async () => {
    saveBookmark(OWNER, { sentence: 2, key: sentenceKeyOf('The second paragraph teaches the middle.'), para: 1, paras: 3 });
    openPanel();
    const btn = q('reader-resume');
    expect(btn, 'no Resume button for a saved place').toBeTruthy();
    expect(btn.textContent).toMatch(/Resume · Paragraph 2 of 3/);
    act(() => { btn.click(); });
    await settle();
    expect(readSpy).toHaveBeenCalled();
    expect(String(readSpy.mock.calls.at(-1)[0])).toMatch(/^The second paragraph teaches the middle\./);
  });

  it('offers nothing for a reading never started', () => {
    openPanel();
    expect(q('reader-resume')).toBeNull();
  });
});

describe('Start at any paragraph', () => {
  it('lists the paragraphs and starts at the one picked', async () => {
    openPanel();
    act(() => { q('reader-start-at-open').click(); });
    await settle();
    const sel = q('reader-start-at');
    expect(sel, 'no paragraph list').toBeTruthy();
    const opts = [...sel.querySelectorAll('option')].filter((o) => o.value !== '');
    expect(opts.map((o) => o.textContent)).toEqual([
      expect.stringMatching(/^1\. The first paragraph/),
      expect.stringMatching(/^2\. The second paragraph/),
      expect.stringMatching(/^3\. The third paragraph/),
    ]);
    expect(readSpy).not.toHaveBeenCalled(); // listing reads nothing
    act(() => {
      sel.value = opts[2].value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await settle();
    expect(String(readSpy.mock.calls.at(-1)[0])).toMatch(/^The third paragraph closes the lesson\./);
  });
});

describe('the headset, car and lock-screen skip buttons step paragraphs', () => {
  it('nexttrack moves one paragraph forward, previoustrack one back', async () => {
    openPanel();
    act(() => { q('reader-start-at-open').click(); });
    await settle();
    const sel = q('reader-start-at');
    const first = [...sel.querySelectorAll('option')].find((o) => o.value !== '');
    act(() => { sel.value = first.value; sel.dispatchEvent(new Event('change', { bubbles: true })); });
    await settle();
    state.isReading = true;
    render();
    expect(hook.skip && typeof hook.skip.next, 'the reader never handed its paragraph step to the OS buttons').toBe('function');
    readSpy.mockClear();
    act(() => { hook.skip.next(); });
    expect(String(readSpy.mock.calls.at(-1)[0])).toMatch(/^The second paragraph/);
    act(() => { hook.skip.prev(); });
    expect(readSpy).toHaveBeenCalledTimes(2);
  });
});
