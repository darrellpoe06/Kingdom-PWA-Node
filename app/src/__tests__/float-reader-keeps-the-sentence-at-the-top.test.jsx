// @vitest-environment jsdom
// =============================================================================
// The floating reader keeps the spoken sentence at the TOP of its box (DR-0659)
// =============================================================================
// Darrell 2026-09-25: "the reader should keep the reading at the top of the
// page as much as possible... currently it's almost at the bottom of the page."
// The float's word box moved only when the sentence had left it, so a sentence
// still inside it — however low — stayed where it was, and each next one sat
// lower. Pinned: a sentence near the bottom of the box is brought to the top
// (14 px under the box's top), and "Centre" centres it. Fails on the old box.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import FloatingReader from '../components/FloatingReader.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const BOX = { top: 100, height: 300 };
const orig = {
  rect: Element.prototype.getBoundingClientRect,
  rects: Element.prototype.getClientRects,
  ch: Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight'),
};
let lowAt = 0; // where the current sentence sits inside the box, px from its top

function stubLayout() {
  Element.prototype.getBoundingClientRect = function r() {
    if (this.getAttribute && this.getAttribute('data-testid') === 'float-words') return { top: BOX.top, bottom: BOX.top + BOX.height, left: 0, right: 300, width: 300, height: BOX.height };
    if (this.getAttribute && this.getAttribute('data-current') === 'true') return { top: BOX.top + lowAt, bottom: BOX.top + lowAt + 40, left: 0, right: 300, width: 300, height: 40 };
    return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };
  };
  Element.prototype.getClientRects = function rs() { return [this.getBoundingClientRect()]; };
  Object.defineProperty(Element.prototype, 'clientHeight', { configurable: true, get() { return this.getAttribute && this.getAttribute('data-testid') === 'float-words' ? BOX.height : 0; } });
}
afterEach(() => {
  Element.prototype.getBoundingClientRect = orig.rect;
  Element.prototype.getClientRects = orig.rects;
  if (orig.ch) Object.defineProperty(Element.prototype, 'clientHeight', orig.ch); else delete Element.prototype.clientHeight;
});

const sentences = (cur) => ['One.', 'Two.', 'Three.', 'Four.', 'Five.'].map((text, i) => ({ text, current: i === cur }));
async function renderAt(cur, place) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(createElement(FloatingReader, {
    rect: { x: 10, y: 10, w: 320, h: 420 }, onMove: () => {}, onCommit: () => {}, onReset: () => {}, onDock: () => {},
    sentences: sentences(cur), place, playing: true, canJump: true, onBack: () => {}, onForward: () => {}, onPlayPause: () => {}, rate: 1, rateSteps: [1, 1.5], onRate: () => {},
  })));
  const box = document.querySelector('[data-testid="float-words"]'); // it portals to the body
  return { box, done: () => { act(() => root.unmount()); host.remove(); } };
}

describe('the floating reader’s word box', () => {
  it('a sentence still in the box but near its bottom is brought to the top', async () => {
    stubLayout();
    lowAt = 240; // inside the 300 px box, 20 px from its bottom
    const { box, done } = await renderAt(3, 'top');
    // It moves up by (240 - 14): its top now 14 px under the box's top.
    expect(box.scrollTop).toBe(240 - 14);
    done();
  });

  it('centre, when chosen, centres it', async () => {
    stubLayout();
    lowAt = 240;
    const { box, done } = await renderAt(3, 'centre');
    // band 8..292 (margin 8), a 40 px sentence centred: top at 8 + (284 - 40) / 2 = 130
    expect(box.scrollTop).toBe(240 - 130);
    done();
  });
});
