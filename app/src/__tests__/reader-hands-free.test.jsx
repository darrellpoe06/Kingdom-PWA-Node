// @vitest-environment jsdom
// =============================================================================
// The reader turns the page itself (DR-0287)
// =============================================================================
// Darrell 2026-08-10, in a 36-pattern course: "can't read the whole lesson...
// without a human turning the page!!!!!!????? fix it!!!! users should be able
// to listen to the whole thing without needing to intervene."
//
// The reading of ONE piece ended and the app went silent until someone tapped
// Next — which is precisely what the listener this feature exists for cannot do:
// driving, cooking, eyes closed, or unable to read the screen at all
// (COMMUNITY-FIRST-MISSION). A read-aloud that needs a finger every few minutes
// is not read-aloud.
//
// These pin the run: it advances by itself, it keeps advancing, it stops at the
// end of the series, and STOP is the one thing that ends it — the difference
// between "it ended" and "you ended it".
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { setReadTarget, clearReadTarget, getReadTarget } from '../lib/read-target.js';

// A reader whose "reading" can be ended on demand, so a finished piece is a
// thing this test can cause — the exact event the run reacts to.
const readSpy = vi.fn();
const state = { isReading: false, isPaused: false };
let rerender = () => {};
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: state.isReading, isPaused: state.isPaused, rate: 1,
    read: (...a) => { readSpy(...a); state.isReading = true; },
    pause: () => {}, resume: () => {},
    stop: () => { state.isReading = false; },
      // claimAudio: the synchronous audio-session claim the play handler makes
      // inside the tap (background listening). A mock that omits it makes the
      // handler throw before it ever reads — which is exactly how the real
      // regression surfaced, so it is a no-op here rather than absent.
      claimAudio: () => {},
    setRate: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// A three-piece "course" that behaves like the real Learn space: each piece
// registers its own target and knows how to advance to the next one.
const PIECES = ['one', 'two', 'three'];
let openIndex = 0;
function openPiece(i) {
  openIndex = i;
  const id = PIECES[i];
  setReadTarget(id, {
    label: 'this pattern',
    text: `The text of pattern ${id}.`,
    elementId: `piece-${id}`,
    next: () => {
      if (i >= PIECES.length - 1) return false;
      openPiece(i + 1);
      return true;
    },
  });
}

let container, root;
beforeEach(() => {
  readSpy.mockClear();
  state.isReading = false; state.isPaused = false;
  openIndex = 0;
  const t = getReadTarget();
  if (t) clearReadTarget(t.owner);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  rerender = () => act(() => root.render(createElement(TTSControl, { view: 'church' })));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  const t = getReadTarget();
  if (t) clearReadTarget(t.owner);
});

const openPanel = () => {
  rerender();
  act(() => { container.querySelector('button[aria-label*="read-aloud controls"]').click(); });
};
const byText = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent || ''));

/** The piece finishes on its own (not a Stop). */
const finishPiece = async () => {
  state.isReading = false;
  // Two act scopes on purpose: React defers a passive effect until the scope
  // exits, so the first scope is where the run notices the piece ended and the
  // second is where its advance actually gets its frames. A browser flushes
  // both in one breath; the test has to make the same room.
  await act(async () => { rerender(); });
  await act(async () => { await new Promise((r) => setTimeout(r, 300)); rerender(); });
};

const startRun = async () => {
  openPiece(0);
  openPanel();
  const btn = byText(/start to finish/);
  expect(btn).toBeTruthy();
  await act(async () => { btn.click(); await new Promise((r) => setTimeout(r, 300)); });
  await act(async () => { rerender(); }); // the reading state reaches the panel
};

describe('the whole thing plays without a finger', () => {
  it('when a piece ends, the reader advances and reads the NEXT one by itself', async () => {
    await startRun();
    expect(readSpy).toHaveBeenCalledTimes(1);
    expect(openIndex).toBe(0);

    await finishPiece();
    expect(openIndex).toBe(1);                 // it turned the page
    expect(readSpy).toHaveBeenCalledTimes(2);  // and started reading again
    expect(readSpy.mock.calls[1][0]).toContain('two');
  });

  it('it keeps going — piece after piece — to the end of the series', async () => {
    await startRun();
    await finishPiece();
    await finishPiece();
    expect(openIndex).toBe(2);
    expect(readSpy).toHaveBeenCalledTimes(3);
    expect(readSpy.mock.calls[2][0]).toContain('three');
  });

  it('at the END of the series it stops — it does not loop or hang', async () => {
    await startRun();
    await finishPiece();
    await finishPiece();
    const before = readSpy.mock.calls.length;
    await finishPiece();                        // the last piece finishes
    expect(readSpy.mock.calls.length).toBe(before);
    expect(state.isReading).toBe(false);
  });

  it('STOP ends the run — the reader does not helpfully start the next one', async () => {
    await startRun();
    act(() => { (byText(/⏹ Stop/) || byText(/⏹/)).click(); });
    await act(async () => { rerender(); await new Promise((r) => setTimeout(r, 250)); });
    expect(openIndex).toBe(0);                  // no page was turned
    expect(readSpy).toHaveBeenCalledTimes(1);
  });

  it('a surface with no next piece reads once and stops', async () => {
    setReadTarget('solo', { label: 'this lesson', text: 'A single piece.' });
    openPanel();
    await act(async () => { byText(/start to finish/).click(); await new Promise((r) => setTimeout(r, 250)); });
    expect(readSpy).toHaveBeenCalledTimes(1);
    await finishPiece();
    expect(readSpy).toHaveBeenCalledTimes(1);
  });

  it('the panel says it keeps going, so the listener is not guessing', async () => {
    await startRun();
    rerender();
    expect(container.textContent).toMatch(/keeps going/i);
  });
});
