// =============================================================================
// The big full-screen reader says, once, when a lesson was read to the end
// =============================================================================
// Darrell 2026-10-27: "are we counting the reading of students accurately and
// effectively?" Measured first: ▶ Play opens the Presenter deck, and the deck
// wrote nothing to the learner's place — walking every part to the last
// point left no mark, and the read-aloud's target is owned per slide, so
// TTSControl's own end-of-lesson mark never matched the lesson either. A
// lesson read whole through Play counted for nothing.
//
// The deck now carries `onFinished`, called at most once per presentable:
// every point of the last part shown after moving through the deck, Next
// pressed on the last point, or the read-aloud asking for the part after the
// last one. It is never called on opening, so a one-part deck is not "read"
// by being looked at.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import Presenter from '../components/Presenter.jsx';
import { getReadTarget } from '../lib/read-target.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const deck = (n) => ({
  id: `test:deck-${n}`,
  title: 'Test deck',
  targetMin: 10,
  scenes: Array.from({ length: n }, (_, i) => ({
    id: `s${i + 1}`, indexLabel: `${i + 1} of ${n}`, estimatedMin: 5, minMin: 2, priority: 'core',
    audience: { title: `Part ${i + 1}` }, notes: [],
  })),
});
const memStorage = () => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; } }; };
const key = (k) => act(() => { window.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true })); });

let container, root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe('the deck says when it was read to the end', () => {
  it('is silent on opening, says so once when the last part is reached, and not again', () => {
    const onFinished = vi.fn();
    act(() => root.render(createElement(Presenter, { presentable: deck(3), storage: memStorage(), onFinished })));
    expect(onFinished).not.toHaveBeenCalled();
    key('ArrowRight');
    expect(onFinished, 'part 2 of 3 is not the end').not.toHaveBeenCalled();
    key('ArrowRight');
    expect(onFinished, 'the last part, reached by moving through the deck').toHaveBeenCalledTimes(1);
    key('ArrowRight');
    key('ArrowLeft');
    key('ArrowRight');
    expect(onFinished, 'once per deck, however the reader moves after').toHaveBeenCalledTimes(1);
  });

  it('a one-part deck is not read by being looked at — Next on the last point is', () => {
    const onFinished = vi.fn();
    act(() => root.render(createElement(Presenter, { presentable: deck(1), storage: memStorage(), onFinished })));
    expect(onFinished).not.toHaveBeenCalled();
    key('ArrowRight');
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('the read-aloud asking for the part after the last one is heard to the end', () => {
    const onFinished = vi.fn();
    act(() => root.render(createElement(Presenter, { presentable: deck(2), storage: memStorage(), onFinished })));
    let t = getReadTarget();
    expect(t && typeof t.next === 'function', 'the deck registers a read target with next()').toBe(true);
    act(() => { t.next(); });
    expect(onFinished, 'part 1 -> part 2 is not the end').not.toHaveBeenCalled();
    t = getReadTarget();
    let more;
    act(() => { more = t.next(); });
    expect(more).toBe(false);
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('proven-to-catch: a deck nobody moves through never says it was read', () => {
    const onFinished = vi.fn();
    act(() => root.render(createElement(Presenter, { presentable: deck(2), storage: memStorage(), onFinished })));
    key('ArrowLeft');
    expect(onFinished).not.toHaveBeenCalled();
  });
});
