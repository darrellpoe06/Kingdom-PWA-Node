// @vitest-environment jsdom
// =============================================================================
// The words being read are VISIBLE — not under the banner, at any font size
// =============================================================================
// Darrell 2026-08-13, reading a lesson on his phone with the reader running:
//   "the words are blocked at the top of the highlighted text while reading
//    possibly because of the banner or whatever."
//   "Account for different font sizes as well..."
//
// TWO DEFECTS IN ONE LINE. The follow-scroll was
// `el.scrollIntoView({ block: 'center' })`:
//
//   1. It scrolled the ELEMENT, not the RANGE. The element is the whole
//      paragraph; the range is the sentence actually being spoken. Centring a
//      TALL paragraph puts its opening lines above the viewport — so on exactly
//      the long teaching paragraphs this app is built from, the words being
//      read sat off-screen while the paragraph looked correctly "centred".
//   2. It knew nothing about the fixed/sticky chrome. This app stacks a session
//      bar, the church banner and a sub-tab strip at the top, so the top of the
//      viewport is not where content becomes readable.
//
// And the size rule matters as much as the inset: five reading sizes ship
// (A → A44), so a fixed gap that looks generous at A is thinner than one line
// at A44 — jamming the sentence against the chrome for precisely the readers
// who need the most room.
//
// jsdom has NO LAYOUT, so a render test could only ever assert zeros here. The
// arithmetic is therefore split into pure functions and tested directly with
// the rects a real browser would produce — which is the only way this rule is
// checkable at all.
import { describe, it, expect } from 'vitest';
import { readingScrollDelta, readingMargin, stickyTopInset } from '../lib/read-follow.js';

const VH = 900;

describe('THE BUG: a sentence hidden under the sticky chrome', () => {
  it('a sentence behind the banner is pulled down below it', () => {
    // The chrome is 180px tall; the sentence starts at y=100 — under it.
    const d = readingScrollDelta({ rangeTop: 100, rangeBottom: 140, topInset: 180, viewportHeight: VH, margin: 24 });
    expect(d, 'a hidden sentence must move').not.toBe(0);
    expect(d).toBeLessThan(0); // scroll UP (negative) so the text comes down
    // After scrolling by the delta, the sentence clears the chrome + margin.
    expect(100 - d).toBe(180 + 24);
  });

  it('a sentence already in the reading band is left alone — no twitching', () => {
    expect(readingScrollDelta({ rangeTop: 400, rangeBottom: 440, topInset: 180, viewportHeight: VH, margin: 24 })).toBe(0);
  });

  it('with no chrome at all, the top of the viewport is still respected', () => {
    const d = readingScrollDelta({ rangeTop: 4, rangeBottom: 40, topInset: 0, viewportHeight: VH, margin: 24 });
    expect(4 - d).toBe(24);
  });

  it('a sentence below the fold is lifted into view', () => {
    const d = readingScrollDelta({ rangeTop: 880, rangeBottom: 920, topInset: 180, viewportHeight: VH, margin: 24 });
    expect(d).toBeGreaterThan(0);
    expect(920 - d).toBe(VH - 24);
  });

  it('a sentence TALLER than the reading band lands top-first, never centred', () => {
    // The centring bug in miniature: a very tall range must show its FIRST
    // line, because centring it would put the opening back under the chrome.
    const d = readingScrollDelta({ rangeTop: 500, rangeBottom: 1600, topInset: 180, viewportHeight: VH, margin: 24 });
    expect(500 - d, 'the first line of a long sentence must be the visible one').toBe(180 + 24);
  });
});

describe('the gap scales with the reader’s chosen font size', () => {
  const win = (styles) => ({ getComputedStyle: () => styles });

  it('a resolved line-height becomes the margin', () => {
    expect(readingMargin({}, win({ lineHeight: '48px', fontSize: '32px' }))).toBe(48);
  });

  it('large print gets a LARGER gap than small print — the whole point', () => {
    const small = readingMargin({}, win({ lineHeight: '20px', fontSize: '14px' }));
    const huge = readingMargin({}, win({ lineHeight: '72px', fontSize: '48px' }));
    expect(huge).toBeGreaterThan(small);
    expect(huge).toBe(72);
  });

  it('"line-height: normal" falls back to the font size, not to a constant', () => {
    // The default in most of this app's prose — it does not resolve to px, and
    // treating that as "no information" would silently pin large print to 24.
    expect(readingMargin({}, win({ lineHeight: 'normal', fontSize: '40px' }))).toBe(56);
  });

  it('never smaller than the 24px floor', () => {
    expect(readingMargin({}, win({ lineHeight: '8px', fontSize: '6px' }))).toBe(24);
    expect(readingMargin(null, null)).toBe(24);
  });

  it('a bigger margin really does move the text further from the chrome', () => {
    const at_A = readingScrollDelta({ rangeTop: 100, rangeBottom: 140, topInset: 180, viewportHeight: VH, margin: 24 });
    const at_A44 = readingScrollDelta({ rangeTop: 100, rangeBottom: 140, topInset: 180, viewportHeight: VH, margin: 72 });
    expect(100 - at_A).toBe(204);
    expect(100 - at_A44, 'large print must clear the banner by a full line').toBe(252);
  });
});

describe('the chrome height is measured, never assumed', () => {
  it('with no elementsFromPoint (or no window) the inset is 0, not a guess', () => {
    expect(stickyTopInset(null, null)).toBe(0);
    expect(stickyTopInset({ innerHeight: VH, innerWidth: 400 }, {})).toBe(0);
  });

  it('only chrome pinned at the TOP counts', () => {
    const bar = { getBoundingClientRect: () => ({ top: 0, bottom: 150 }) };
    const footer = { getBoundingClientRect: () => ({ top: 800, bottom: 900 }) };
    const doc = { elementsFromPoint: () => [bar, footer] };
    const win = {
      innerHeight: VH,
      innerWidth: 400,
      getComputedStyle: (el) => ({ position: el === bar || el === footer ? 'fixed' : 'static' }),
    };
    expect(stickyTopInset(win, doc), 'a fixed FOOTER must never push the reading down').toBe(150);
  });

  it('a static element at the top is not chrome', () => {
    const el = { getBoundingClientRect: () => ({ top: 0, bottom: 300 }) };
    const doc = { elementsFromPoint: () => [el] };
    const win = { innerHeight: VH, innerWidth: 400, getComputedStyle: () => ({ position: 'static' }) };
    expect(stickyTopInset(win, doc)).toBe(0);
  });

  it('a full-screen overlay cannot claim the whole viewport', () => {
    const el = { getBoundingClientRect: () => ({ top: 0, bottom: VH }) };
    const doc = { elementsFromPoint: () => [el] };
    const win = { innerHeight: VH, innerWidth: 400, getComputedStyle: () => ({ position: 'fixed' }) };
    expect(stickyTopInset(win, doc), 'honouring it would scroll the reading OUT of view').toBe(VH * 0.45);
  });

  it('a measurement that throws degrades to 0 rather than breaking the read', () => {
    const doc = { elementsFromPoint: () => { throw new Error('detached'); } };
    expect(stickyTopInset({ innerHeight: VH, innerWidth: 400, getComputedStyle: () => ({}) }, doc)).toBe(0);
  });
});
