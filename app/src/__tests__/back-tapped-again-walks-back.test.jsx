// @vitest-environment jsdom
// =============================================================================
// Back, tapped again, walks to the paragraph BEFORE — and the step buttons do
// not vanish while a step is in flight
// =============================================================================
// Darrell 2026-10-07: "Can't go back using the back button buffers so it can't
// be pushed again before it reads the exact same paragraph... fix it."
//
// Two defects, measured against the code as it was (DR-0764 had just landed):
//
//   1. `canJump` followed `isReading`. A paragraph jump restarts the voice, and
//      the NAS voice spends seconds preparing, during which isReading is false
//      — so Back and Next DISAPPEARED the moment they were tapped and came back
//      only once the new paragraph was being read. "Can't be pushed again
//      before it reads."
//
//   2. Back was judged from where the voice IS. The first Back re-listens the
//      current paragraph (by design); but by the time the button was back, the
//      voice had passed the paragraph's first sentence, so the second Back
//      re-listened the SAME paragraph. At 3x a sentence is about a second. The
//      paragraph before was unreachable from the bar.
//
// Proven-to-catch: the first test fails on (1) — no Back button in the DOM
// while the jump is in flight; the second fails on (2) — the second Back
// re-reads "The third paragraph" instead of reaching "The second paragraph".
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { paragraphBackTarget, paragraphJumpTarget, BACK_AGAIN_MS } from '../lib/read-follow.js';

describe('paragraphBackTarget — the music-player rule, pure', () => {
  const starts = [0, 2, 4, 6];
  it('a first Back mid-paragraph re-listens this paragraph (unchanged)', () => {
    expect(paragraphBackTarget(starts, 5, null, 1000)).toBe(4);
    expect(paragraphBackTarget(starts, 5, null, 1000)).toBe(paragraphJumpTarget(starts, 5, -1));
  });
  it('a Back within the window of the previous Back goes to the one BEFORE where that Back landed, wherever the voice is now', () => {
    const last = { at: 1000, target: 4 };
    expect(paragraphBackTarget(starts, 5, last, 1000 + 1500)).toBe(2);   // the voice already moved on; still walks back
    expect(paragraphBackTarget(starts, 4, last, 1000 + 3999)).toBe(2);
  });
  it('after the window, Back is judged from the voice again', () => {
    const last = { at: 1000, target: 4 };
    expect(paragraphBackTarget(starts, 5, last, 1000 + BACK_AGAIN_MS)).toBe(4);
  });
  it('walks all the way to the top and stays there; a clock that ran backwards is not a window', () => {
    expect(paragraphBackTarget(starts, 1, { at: 1000, target: 0 }, 1500)).toBe(0);
    expect(paragraphBackTarget(starts, 5, { at: 5000, target: 4 }, 1000)).toBe(4);
    expect(paragraphBackTarget([], 5, null, 0)).toBeNull();
  });
});

// --- the real reader, driven -------------------------------------------------
const readSpy = vi.fn();
const hook = { skip: null };
const state = { isReading: false, deviceRead: true, cloudPiece: -1, segmentIndex: 0 };
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: state.isReading, isPaused: false, rate: 1,
    read: (...a) => readSpy(...a), pause: () => {}, resume: () => {}, stop: () => {}, claimAudio: () => {},
    setRate: () => {}, segmentIndex: state.segmentIndex, deviceRead: state.deviceRead,
    setBoundaryHandler: null, cloudProgress: 0, cloudPiece: state.cloudPiece,
    setSkipHandlers: (h) => { hook.skip = h; },
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');
const { setReadTarget, clearReadTarget } = await import('../lib/read-target.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const OWNER = 'lesson-back-again';
const PARAS = [
  'The first paragraph opens the lesson. It says two things.',
  'The second paragraph teaches the middle. It has its own words.',
  'The third paragraph closes the lesson. It is the end.',
  'The fourth paragraph adds a coda. It also ends.',
];

describe('Back on the live reader', () => {
  let container; let root; let lessonEl;
  beforeEach(() => {
    readSpy.mockClear(); hook.skip = null;
    state.isReading = false; state.deviceRead = true; state.cloudPiece = -1; state.segmentIndex = 0;
    try { localStorage.clear(); } catch { /* ignore */ }
    lessonEl = document.createElement('main');
    lessonEl.innerHTML = `<li id="lesson-el">${PARAS.map((p) => `<p>${p}</p>`).join('')}</li>`;
    document.body.appendChild(lessonEl);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove(); lessonEl.remove();
    try { clearReadTarget(OWNER); } catch { /* ignore */ }
  });

  const render = () => act(() => root.render(createElement(TTSControl, { view: 'church' })));
  const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 300)); });
  const spoken = () => String((readSpy.mock.calls.at(-1) || [''])[0]);
  // Whichever Back the reader is showing — the mini bar's or the panel's.
  const backBtn = () => [...container.querySelectorAll('button')].find((b) => /^Back( |$)/.test(b.getAttribute('aria-label') || '') && !/top/i.test(b.getAttribute('aria-label') || '')) || null;

  /** Start the lesson reading and put the NAS voice on its sixth piece (paragraph 3, sentence 2). */
  const readingParagraphThree = async () => {
    render();
    act(() => { setReadTarget(OWNER, { label: 'this lesson', text: PARAS.join(' '), elementId: 'lesson-el' }); });
    act(() => { container.querySelector('button[aria-label*="read-aloud controls"]').click(); });
    const readBtn = [...container.querySelectorAll('button')].find((b) => /start to finish/.test(b.textContent));
    act(() => { readBtn.click(); });
    await settle();
    expect(spoken()).toMatch(/^The first paragraph/);
    state.isReading = true; state.deviceRead = false; state.cloudPiece = 5;
    render();
    await settle();
  };

  it('the step buttons stay on screen while the jump is in flight (the voice not yet reading)', async () => {
    await readingParagraphThree();
    expect(backBtn()).not.toBeNull();
    readSpy.mockClear();
    act(() => { backBtn().click(); });
    expect(spoken()).toMatch(/^The third paragraph/);
    // The NAS voice is now preparing: the hook reports not reading for seconds.
    state.isReading = false; state.cloudPiece = -1;
    render();
    expect(backBtn(), 'Back vanished while the jump was in flight').not.toBeNull();
  });

  it('Back, then Back again while the voice is already into the paragraph, reaches the paragraph BEFORE', async () => {
    await readingParagraphThree();
    readSpy.mockClear();
    act(() => { hook.skip.prev(); });
    expect(spoken(), 'the first Back re-listens the current paragraph').toMatch(/^The third paragraph/);
    // The new read has started and is already on the paragraph's SECOND
    // sentence (a fast voice gets there in about a second).
    state.isReading = true; state.cloudPiece = 1;
    render();
    await settle();
    readSpy.mockClear();
    act(() => { hook.skip.prev(); });
    expect(spoken(), 'the second Back re-read the same paragraph').toMatch(/^The second paragraph/);
    // And a third, still inside the window, keeps walking.
    readSpy.mockClear();
    act(() => { hook.skip.prev(); });
    expect(spoken()).toMatch(/^The first paragraph/);
  });

  it('Forward closes the window: Back after Next re-listens the paragraph Next landed on', async () => {
    await readingParagraphThree();
    act(() => { hook.skip.prev(); });
    readSpy.mockClear();
    act(() => { hook.skip.next(); });
    expect(spoken()).toMatch(/^The fourth paragraph/);
    state.isReading = true; state.cloudPiece = 1;
    render();
    await settle();
    readSpy.mockClear();
    act(() => { hook.skip.prev(); });
    expect(spoken()).toMatch(/^The fourth paragraph/);
  });
});
