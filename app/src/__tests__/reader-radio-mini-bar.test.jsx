// @vitest-environment jsdom
// =============================================================================
// The radio's mini-player, its dark-screen hand-over and "Show the text"
// (Darrell 2026-09-24: "It is like a radio in the background"; "need to be able
// to go back to the reading page to see the text when I want or any user")
// =============================================================================
// Mounts the ACTUAL reader (the shell's one instance) and drives:
//   • the mini-bar on every tab while the Word plays: its play/pause and
//     paragraph buttons call the SAME engine functions as the panel;
//   • a lesson leaving the page (its target cleared) never stops the reader;
//   • the screen going dark while the AUDIO voice plays changes nothing, and
//     while the PHONE voice plays it hands the same sentence to the audio voice;
//   • "Show the text" on another tab asks the reading's own page to open.
// Proven-to-catch: each fails against the behavior it replaced (no mini-bar;
// a hidden page ignored; no opener asked).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const spy = { read: vi.fn(), pause: vi.fn(), resume: vi.fn(), stop: vi.fn() };
const state = { isReading: false, isPaused: false, audioVoice: '', deviceRead: true };
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: state.isReading, isPaused: state.isPaused, rate: 1,
    read: (...a) => spy.read(...a), pause: (...a) => spy.pause(...a), resume: (...a) => spy.resume(...a), stop: (...a) => spy.stop(...a),
    claimAudio: () => {}, setRate: () => {}, segmentIndex: 0, deviceRead: state.deviceRead, setBoundaryHandler: null, cloudProgress: 0,
    audioVoice: state.audioVoice, setSkipHandlers: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');
const { setReadTarget, clearReadTarget } = await import('../lib/read-target.js');
const { registerReadingOpener, _resetReadingOpenersForTests } = await import('../lib/reading-source.js');
const { _resetLiteVoiceForTests } = await import('../lib/voice-service.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const OWNER = 'lesson-radio-test';
const PARAS = ['The first paragraph opens it. Two sentences here.', 'The second paragraph follows. It has words.'];
let container, root, lessonEl, vis = 'visible';

beforeEach(() => {
  Object.values(spy).forEach((f) => f.mockClear());
  state.isReading = false; state.isPaused = false; state.audioVoice = ''; state.deviceRead = true;
  vis = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => vis });
  try { localStorage.clear(); } catch { /* ignore */ }
  _resetReadingOpenersForTests();
  _resetLiteVoiceForTests();
  lessonEl = document.createElement('main');
  lessonEl.innerHTML = `<div id="lesson-radio">${PARAS.map((p) => `<p>${p}</p>`).join('')}</div>`;
  document.body.appendChild(lessonEl);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  if (lessonEl.isConnected) lessonEl.remove();
  try { clearReadTarget(OWNER); } catch { /* ignore */ }
});

const render = () => act(() => root.render(createElement(TTSControl, { view: 'church' })));
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 400)); });
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const setVisibility = (v) => { vis = v; act(() => { document.dispatchEvent(new Event('visibilitychange')); }); };

/** Start a real lesson reading through the panel, then close the panel. */
async function startLessonReading() {
  render();
  act(() => { setReadTarget(OWNER, { label: 'this lesson', text: PARAS.join(' '), elementId: 'lesson-radio' }); });
  act(() => { container.querySelector('button[aria-label*="read-aloud controls"]').click(); });
  const readBtn = [...container.querySelectorAll('button')].find((b) => /Read this lesson — start to finish/.test(b.textContent));
  act(() => { readBtn.click(); });
  await settle();
  state.isReading = true;
  render();
  const hide = container.querySelector('button[aria-label="Hide reading controls — keeps reading"]')
    || [...container.querySelectorAll('button')].find((b) => /× Close/.test(b.textContent));
  act(() => { hide.click(); });
}

describe('the mini-player is on every tab while the Word plays', () => {
  it('shows play/pause, paragraph steps and Show the text; they drive the same engine', async () => {
    await startLessonReading();
    const bar = q('reader-mini-bar');
    expect(bar, 'no mini-player while reading with the panel closed').toBeTruthy();
    expect(q('reader-show-text')).toBeTruthy();
    act(() => { q('reader-mini-playpause').click(); });
    expect(spy.pause).toHaveBeenCalledTimes(1);
    spy.read.mockClear();
    act(() => { q('reader-mini-forward').click(); });
    expect(String(spy.read.mock.calls.at(-1)[0])).toMatch(/^The second paragraph/);
    // The panel is still one tap away, with the honest reading label.
    expect(container.querySelector('button[aria-label*="Reading aloud — open read-aloud controls"]')).toBeTruthy();
  });

  it('is not there when nothing is playing (the plain speaker button is)', () => {
    render();
    expect(q('reader-mini-bar')).toBeNull();
    expect(container.querySelector('button[aria-label="Open read-aloud controls"]')).toBeTruthy();
  });

  it('a lesson leaving the page never stops the reader', async () => {
    await startLessonReading();
    act(() => { clearReadTarget(OWNER); });
    lessonEl.remove();
    render();
    expect(spy.stop).not.toHaveBeenCalled();
    expect(q('reader-mini-bar')).toBeTruthy();
  });
});

describe('the dark screen', () => {
  it('with the AUDIO voice playing, the screen going dark changes nothing', async () => {
    await startLessonReading();
    state.audioVoice = 'audio'; state.deviceRead = false;
    render();
    spy.read.mockClear();
    setVisibility('hidden');
    expect(spy.read).not.toHaveBeenCalled();
    expect(spy.pause).not.toHaveBeenCalled();
    expect(spy.stop).not.toHaveBeenCalled();
  });

  it('with the PHONE voice playing, the same sentence is handed to the audio voice', async () => {
    await startLessonReading();
    state.audioVoice = 'device'; state.deviceRead = true;
    render();
    spy.read.mockClear();
    setVisibility('hidden');
    expect(spy.read, 'the phone voice was left to be killed by the OS').toHaveBeenCalledTimes(1);
    expect(String(spy.read.mock.calls[0][0])).toMatch(/^The first paragraph opens it\./);
  });
});

describe('Show the text', () => {
  it('from another tab, asks the reading’s own page to open at the spoken sentence', async () => {
    const opener = vi.fn(() => true);
    registerReadingOpener(opener);
    await startLessonReading();
    lessonEl.remove(); // the listener is on another tab
    render();
    act(() => { q('reader-show-text').click(); });
    expect(opener).toHaveBeenCalledWith({ owner: OWNER, sentence: 0 });
  });

  it('on the page being read, brings the spoken words back without asking anyone', async () => {
    const opener = vi.fn(() => true);
    registerReadingOpener(opener);
    await startLessonReading();
    act(() => { q('reader-show-text').click(); });
    expect(opener).not.toHaveBeenCalled();
  });

  it('scrolling away offers "Back to the voice" instead of yanking the page back', async () => {
    await startLessonReading();
    expect(q('reader-back-to-voice')).toBeNull();
    act(() => { window.dispatchEvent(new Event('wheel')); });
    expect(q('reader-back-to-voice')).toBeTruthy();
    act(() => { q('reader-back-to-voice').click(); });
    expect(q('reader-back-to-voice')).toBeNull();
  });
});
