// =============================================================================
// The reader keeps its place through a hand-off, and the place never walks
// backwards on its own (DR-1254)
// =============================================================================
// Darrell 2026-10-27, L263 at paragraph 13, the panel offering "Resume ·
// paragraph 2 of 224": "It cuts off the reader while I was in the lesson and
// then starts me from the beginning instead of the 13 part!!!" And: "Words
// don't read in alignment after the male voice changes mid-lesson to a female
// voice."
//
// The control keeps a sentence as base + local. A hand-off (the NAS voice
// failing a piece, a reading held in the dark and resumed) plays the REST as
// a new run whose pieces count from 0 — so the lit sentence, the scroll and
// the bookmark fell back to the top while the audio went on. Now the hook
// reports how many pieces come before the text playing (`pieceOffset`) and
// the control adds it; and within one run the place only moves forward.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { setReadTarget, clearReadTarget, getReadTarget } from '../lib/read-target.js';
import { getBookmark } from '../lib/reader-bookmarks.js';

const state = { isReading: false, isPaused: false, cloudPiece: -1, pieceOffset: 0, segmentIndex: 0, deviceRead: false };
let rerender = () => {};
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: state.isReading, isPaused: state.isPaused, rate: 1,
    cloudPiece: state.cloudPiece, cloudProgress: 0, pieceOffset: state.pieceOffset,
    segmentIndex: state.segmentIndex, deviceRead: state.deviceRead,
    read: () => { state.isReading = true; },
    pause: () => {}, resume: () => {},
    stop: () => { state.isReading = false; },
    claimAudio: () => {},
    setRate: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
import { vi } from 'vitest';
const { default: TTSControl } = await import('../components/TTSControl.jsx');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const OWNER = 'll263-not-one-stone';
const SENTENCES = ['One sentence here.', 'Two sentence here.', 'Three sentence here.', 'Four sentence here.', 'Five sentence here.', 'Six sentence here.', 'Seven sentence here.', 'Eight sentence here.'];
let container, root, lesson;
beforeEach(() => {
  window.localStorage.clear();
  Object.assign(state, { isReading: false, isPaused: false, cloudPiece: -1, pieceOffset: 0, segmentIndex: 0, deviceRead: false });
  const t = getReadTarget();
  if (t) clearReadTarget(t.owner);
  lesson = document.createElement('div');
  lesson.id = `learn-read-${OWNER}`;
  for (const s of SENTENCES) { const p = document.createElement('p'); p.textContent = s; lesson.appendChild(p); }
  document.body.appendChild(lesson);
  setReadTarget(OWNER, { label: 'this lesson', text: SENTENCES.join(' '), elementId: lesson.id, next: () => false });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  rerender = () => act(() => root.render(createElement(TTSControl, { view: 'church' })));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  lesson.remove();
  const t = getReadTarget();
  if (t) clearReadTarget(t.owner);
});
const byText = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent || ''));
const startReading = async () => {
  rerender();
  act(() => { container.querySelector('button[aria-label*="read-aloud controls"]').click(); });
  const btn = byText(/start to finish/);
  expect(btn).toBeTruthy();
  await act(async () => { btn.click(); await new Promise((r) => setTimeout(r, 300)); });
  await act(async () => { rerender(); });
};
const piece = async (cloudPiece, pieceOffset = state.pieceOffset) => {
  state.cloudPiece = cloudPiece; state.pieceOffset = pieceOffset;
  await act(async () => { rerender(); });
};
const sentence = () => (getBookmark(OWNER) || {}).sentence;

describe('the place follows the audio through a hand-off', () => {
  it('the NAS pieces before a hand-off are added to the pieces after it: sentence 5 stays 5, then 6', async () => {
    await startReading();
    await piece(0);
    expect(sentence()).toBe(0);
    await piece(5);
    expect(sentence(), 'sentence 5 is heard and kept').toBe(5);
    // The NAS voice fails piece 5; the rest (from piece 5) plays as a new run
    // whose pieces count from 0. The hook says 5 pieces came before it.
    await piece(0, 5);
    expect(sentence(), 'the hand-off does not send the place back to the top').toBe(5);
    await piece(1, 5);
    expect(sentence()).toBe(6);
  });
  it('proven-to-catch: a run that forgets its offset and says piece 0 again cannot drag the place back', async () => {
    await startReading();
    await piece(6);
    expect(sentence()).toBe(6);
    await piece(0, 0);
    expect(sentence(), 'the place never walks backwards on its own').toBe(6);
    await piece(3, 0);
    expect(sentence(), 'three behind is still refused').toBe(6);
    await piece(5, 0);
    expect(sentence(), 'within two sentences is the voice settling, not a fall').toBe(5);
  });
});
