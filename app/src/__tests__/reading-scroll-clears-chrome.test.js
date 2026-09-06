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
import { readingScrollDelta, readingMargin, stickyTopInset, stickyBottomInset } from '../lib/read-follow.js';

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

  it('a full-screen overlay is the SURFACE the reading is on, not chrome — it contributes nothing', () => {
    // 2026-09-06: the presenter's full-screen mode is `position: fixed; inset: 0`.
    // Capping it at 45% (the old rule) still pushed every followed sentence
    // into the lower half of the screen; an element covering the viewport is
    // where the words ARE, not a bar above them.
    const el = { getBoundingClientRect: () => ({ top: 0, bottom: VH }) };
    const doc = { elementsFromPoint: () => [el] };
    const win = { innerHeight: VH, innerWidth: 400, getComputedStyle: () => ({ position: 'fixed' }) };
    expect(stickyTopInset(win, doc), 'a surface is not chrome').toBe(0);
  });

  it('a tall bar that is NOT the whole viewport is still capped at 45%, so it cannot scroll the reading out of view', () => {
    const el = { getBoundingClientRect: () => ({ top: 0, bottom: VH * 0.6 }) };
    const doc = { elementsFromPoint: () => [el] };
    const win = { innerHeight: VH, innerWidth: 400, getComputedStyle: () => ({ position: 'fixed' }) };
    expect(stickyTopInset(win, doc)).toBe(VH * 0.45);
  });

  it('a measurement that throws degrades to 0 rather than breaking the read', () => {
    const doc = { elementsFromPoint: () => { throw new Error('detached'); } };
    expect(stickyTopInset({ innerHeight: VH, innerWidth: 400, getComputedStyle: () => ({}) }, doc)).toBe(0);
  });
});

describe('the reader’s OWN panel is chrome too', () => {
  // Darrell 2026-08-13, after the top fix landed: "now blocked by the reader."
  // Clearing the banner only to park the sentence under the reading pill is the
  // same defect upside down — and this fix introduced it, so it ships with it.
  it('a sentence under the reading pill is lifted clear of it', () => {
    // Pill is 120px tall at the bottom; the sentence ends inside it.
    const d = readingScrollDelta({
      rangeTop: 800, rangeBottom: 860, topInset: 180, bottomInset: 120, viewportHeight: VH, margin: 24,
    });
    expect(d).toBeGreaterThan(0);
    expect(860 - d, 'the sentence must end above the pill, not behind it').toBe(VH - 120 - 24);
  });

  it('without the pill the same sentence would NOT have moved', () => {
    // The witness: this is the case the top-only fix left broken.
    expect(readingScrollDelta({
      rangeTop: 800, rangeBottom: 860, topInset: 180, bottomInset: 0, viewportHeight: VH, margin: 24,
    })).toBe(0);
  });

  it('the reading band is squeezed from BOTH ends, and top still wins for a tall sentence', () => {
    const d = readingScrollDelta({
      rangeTop: 100, rangeBottom: 1400, topInset: 180, bottomInset: 120, viewportHeight: VH, margin: 24,
    });
    expect(100 - d, 'a long sentence still shows its first line').toBe(180 + 24);
  });

  it('THE MISS: the reading pill is INSET and RIGHT-aligned, and is still found', () => {
    // `fixed bottom-4 right-4` — its bottom is vh-16, not vh, and it hugs the
    // right edge. The first version of this measurement probed the bottom EDGE
    // at 25/50/75% width and missed it on both axes, reporting no bottom chrome
    // while it sat on top of the sentence being read. Asking the element by
    // class is what makes it reliable.
    const pill = {
      className: 'tts-controls',
      getBoundingClientRect: () => ({ top: VH - 136, bottom: VH - 16, height: 120 }),
    };
    const doc = {
      querySelectorAll: (sel) => (/tts-controls/.test(sel) ? [pill] : []),
      elementsFromPoint: () => [],            // deliberately blind, as it was
    };
    const win = { innerHeight: VH, innerWidth: 400, getComputedStyle: () => ({ position: 'fixed' }) };
    expect(stickyBottomInset(win, doc), 'the inset pill was missed again').toBe(136);
  });

  it('any control can declare itself with data-reading-chrome', () => {
    const el = { getBoundingClientRect: () => ({ top: VH - 100, bottom: VH - 20, height: 80 }) };
    const doc = {
      querySelectorAll: (sel) => (/data-reading-chrome/.test(sel) ? [el] : []),
      elementsFromPoint: () => [],
    };
    const win = { innerHeight: VH, innerWidth: 400, getComputedStyle: () => ({ position: 'fixed' }) };
    expect(stickyBottomInset(win, doc)).toBe(100);
  });

  it('a TOP banner is never counted as bottom chrome — no double charge', () => {
    const banner = { getBoundingClientRect: () => ({ top: 0, bottom: 180, height: 180 }) };
    const doc = { querySelectorAll: () => [banner], elementsFromPoint: () => [banner] };
    const win = { innerHeight: VH, innerWidth: 400, getComputedStyle: () => ({ position: 'fixed' }) };
    expect(stickyBottomInset(win, doc)).toBe(0);
  });

  it('the LOWEST floating control wins when several overlap', () => {
    const pill = { getBoundingClientRect: () => ({ top: VH - 120, bottom: VH - 16, height: 104 }) };
    const give = { getBoundingClientRect: () => ({ top: VH - 260, bottom: VH - 200, height: 60 }) };
    const doc = { querySelectorAll: () => [pill, give], elementsFromPoint: () => [] };
    const win = { innerHeight: VH, innerWidth: 400, getComputedStyle: () => ({ position: 'fixed' }) };
    expect(stickyBottomInset(win, doc), 'the highest intruding control sets the band').toBe(260);
  });

  it('a static bottom element is not chrome, and a failure degrades to 0', () => {
    const el = { getBoundingClientRect: () => ({ top: VH - 200, bottom: VH, height: 200 }) };
    expect(stickyBottomInset(
      { innerHeight: VH, innerWidth: 400, getComputedStyle: () => ({ position: 'static' }) },
      { querySelectorAll: () => [el], elementsFromPoint: () => [] },
    )).toBe(0);
    expect(stickyBottomInset(null, null)).toBe(0);
    expect(stickyBottomInset(
      { innerHeight: VH, innerWidth: 400, getComputedStyle: () => ({}) },
      { querySelectorAll: () => { throw new Error('detached'); } },
    )).toBe(0);
  });
});
