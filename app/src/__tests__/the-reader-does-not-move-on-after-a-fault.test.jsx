// =============================================================================
// The reader does not move on after a fault
// =============================================================================
// The hands-free run (reader-hands-free.test.jsx) turns the page when a piece
// ends on its own. A device-voice fault the engine could not retry past used
// to look exactly like that — reading stopped, status idle — and the run
// moved to the NEXT piece, leaving the rest of the faulted lesson unheard
// (DR-1251; Darrell 2026-10-27: "will not play all the way through"). With
// the engine now holding the sentence (`engineHeldAt`), the run stays where
// it is: the next play continues the same piece from its bookmark.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { setReadTarget, clearReadTarget, getReadTarget } from '../lib/read-target.js';

const readSpy = vi.fn();
const state = { isReading: false, isPaused: false, engineHeldAt: null };
let rerender = () => {};
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: state.isReading, isPaused: state.isPaused, rate: 1,
    engineHeldAt: state.engineHeldAt,
    read: (...a) => { readSpy(...a); state.isReading = true; },
    pause: () => {}, resume: () => {},
    stop: () => { state.isReading = false; },
    claimAudio: () => {},
    setRate: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PIECES = ['one', 'two', 'three'];
let openIndex = 0;
function openPiece(i) {
  openIndex = i;
  const id = PIECES[i];
  setReadTarget(id, {
    label: 'this pattern',
    text: `The text of pattern ${id}.`,
    elementId: `piece-${id}`,
    next: () => { if (i >= PIECES.length - 1) return false; openPiece(i + 1); return true; },
  });
}
let container, root;
beforeEach(() => {
  readSpy.mockClear();
  state.isReading = false; state.isPaused = false; state.engineHeldAt = null;
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
const byText = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent || ''));
const settle = async () => {
  await act(async () => { rerender(); });
  await act(async () => { await new Promise((r) => setTimeout(r, 300)); rerender(); });
};
const startRun = async () => {
  openPiece(0);
  rerender();
  act(() => { container.querySelector('button[aria-label*="read-aloud controls"]').click(); });
  const btn = byText(/start to finish/);
  expect(btn).toBeTruthy();
  await act(async () => { btn.click(); await new Promise((r) => setTimeout(r, 300)); });
  await act(async () => { rerender(); });
};

describe('a fault is not an ended piece', () => {
  it('when the engine stops holding a sentence, the run stays on the same piece and nothing new is read', async () => {
    await startRun();
    expect(readSpy).toHaveBeenCalledTimes(1);
    state.engineHeldAt = 4;        // the engine faulted at sentence 5 and held
    state.isReading = false;
    await settle();
    expect(openIndex, 'the page did not turn').toBe(0);
    expect(readSpy, 'and no other piece was started').toHaveBeenCalledTimes(1);
  });
  it('proven-to-catch: the same stop with no hold still turns the page', async () => {
    await startRun();
    state.isReading = false;       // ended on its own
    await settle();
    expect(openIndex).toBe(1);
    expect(readSpy).toHaveBeenCalledTimes(2);
  });
});
