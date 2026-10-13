// @vitest-environment jsdom
// =============================================================================
// The way back is REAL on the reader — it renders, and its button works
// =============================================================================
// DR-0552's decider was pure and proven, and a pure decider nothing calls is
// not a feature. This file is the difference: it mounts the ACTUAL reader,
// drives the ACTUAL departure — a lesson registering a reading, then its
// unmount clearing the target, which is exactly what in-app navigation does —
// and requires the way back to appear and to do something when pressed.
//
// WHY THIS FILE EXISTS AT ALL, recorded because it caught a real one the
// moment it was written: the handler called requestRead() and requestRead WAS
// NOT IN THE IMPORT LIST. Every existing reader render test stayed green,
// because none of them press this button — the break lived only on the path a
// person actually takes. That is the whole argument for a render test over one
// more unit test of the decider.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const state = { isReading: false, isPaused: false };
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: state.isReading, isPaused: state.isPaused, rate: 1.5,
    read: () => {}, pause: () => {}, resume: () => {}, stop: () => {}, claimAudio: () => {},
    setRate: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');
const { setReadTarget, clearReadTarget, pendingRead, clearRead } = await import('../lib/read-target.js');
const { recordPlace, clearPlace } = await import('../lib/learn-resume.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const LESSON = 'll181-run-it-through-the-word';
let container, root;

beforeEach(() => {
  state.isReading = false; state.isPaused = false;
  try { clearPlace(); } catch { /* already clean */ }
  try { clearRead(); } catch { /* already clean */ }
  try { clearReadTarget(LESSON); } catch { /* already clean */ }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const render = () => act(() => root.render(createElement(TTSControl, { view: 'church' })));
const wayBack = () => container.querySelector('[data-testid="reading-way-back"]');
const goBtn = () => container.querySelector('[data-testid="reading-way-back-go"]');

/** Open a lesson and start listening to it — the real registration path. */
const listening = () => {
  render();
  act(() => {
    setReadTarget(LESSON, { label: 'Lesson', text: 'A sentence. Another one.', elementId: 'lesson-el' });
    recordPlace({ courseKey: 'living-lessons', lessonId: LESSON, sentence: 3, sentenceKey: 'abc123' });
  });
  state.isReading = true;
  render();
};

/** Navigate away inside the app: the lesson unmounts, clearing its target. */
const leaveThePage = () => {
  act(() => { clearReadTarget(LESSON); });
  state.isReading = false;
  render();
};

describe('the way back appears only when it is honest', () => {
  it('is NOT offered while the lesson is still open', () => {
    listening();
    expect(wayBack()).toBeNull();
  });

  it('IS offered after leaving the page mid-listen', () => {
    listening();
    leaveThePage();
    expect(wayBack(), 'he left mid-listen and was offered nothing').toBeTruthy();
    expect(wayBack().textContent).toMatch(/Back to where it was reading/);
  });

  it('a saved place with no reading never pops a prompt on navigation', () => {
    // An old place from days ago must not make every route change nag.
    render();
    act(() => { recordPlace({ courseKey: 'living-lessons', lessonId: LESSON, sentence: 3, sentenceKey: 'abc123' }); });
    act(() => { clearReadTarget(LESSON); });
    render();
    expect(wayBack()).toBeNull();
  });

  it('the dismiss × takes it away and it does not come back on its own', () => {
    listening();
    leaveThePage();
    const dismiss = [...wayBack().querySelectorAll('button')]
      .find((b) => /Dismiss/.test(b.getAttribute('aria-label') || ''));
    act(() => { dismiss.click(); });
    expect(wayBack()).toBeNull();
    render();
    expect(wayBack(), 'a dismissed offer re-appeared by itself').toBeNull();
  });
});

describe('PROVEN-TO-CATCH: pressing it actually asks for the lesson', () => {
  it('requests the read for the lesson he was listening to', () => {
    // This is the assertion that would have failed on the missing import —
    // the handler threw, and nothing was ever requested.
    listening();
    leaveThePage();
    expect(pendingRead()).toBeFalsy();
    act(() => { goBtn().click(); });
    const want = pendingRead();
    expect(want, 'the button did nothing — nothing was requested').toBeTruthy();
    expect(String(want && (want.owner || want))).toContain(LESSON);
  });

  it('and the offer is spent once taken', () => {
    listening();
    leaveThePage();
    act(() => { goBtn().click(); });
    expect(wayBack()).toBeNull();
  });
});
