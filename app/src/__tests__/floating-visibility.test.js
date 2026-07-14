// =============================================================================
// floating-visibility — the corner floaters "leave, then come back" reducer.
// Darrell 2026-07-12: the Feedback/Give/TTS pills BLOCK content; they should
// hide and return when wanted (scroll-up, giving time, a live service).
//
// PROVEN-TO-CATCH: scroll DOWN past the threshold hides; scroll UP reveals; the
// top zone always reveals; jitter under the threshold changes nothing. Break the
// direction logic and these go red. hiddenFloaterClass tucks the pill off the
// correct edge only when hidden.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { scrollAction, hiddenFloaterClass } from '../lib/floating-visibility.js';

describe('scrollAction — direction decides visibility', () => {
  it('hides when scrolling DOWN past the threshold', () => {
    expect(scrollAction(100, 200)).toBe('hide');
  });
  it('reveals when scrolling UP past the threshold', () => {
    expect(scrollAction(300, 200)).toBe('reveal');
  });
  it('always reveals near the top of the page (top zone)', () => {
    expect(scrollAction(500, 4)).toBe('reveal');   // jumped to top
    expect(scrollAction(0, 0)).toBe('reveal');
  });
  it('ignores jitter under the threshold (no flicker)', () => {
    expect(scrollAction(200, 205)).toBe('none');
    expect(scrollAction(200, 190)).toBe('none');
  });
  it('honors a custom threshold', () => {
    expect(scrollAction(200, 230, { threshold: 40 })).toBe('none');
    expect(scrollAction(200, 250, { threshold: 40 })).toBe('hide');
  });
});

describe('hiddenFloaterClass — tucks off the nearest edge only when hidden', () => {
  it('is empty when visible (no transform)', () => {
    expect(hiddenFloaterClass(true, 'left')).toBe('');
    expect(hiddenFloaterClass(true, 'right')).toBe('');
  });
  it('slides left/right/bottom off-screen when hidden', () => {
    expect(hiddenFloaterClass(false, 'left')).toContain('translate-x-[-140%]');
    expect(hiddenFloaterClass(false, 'right')).toContain('translate-x-[140%]');
    expect(hiddenFloaterClass(false, 'bottom')).toContain('translate-y-[140%]');
  });
  it('always removes pointer events + fades when hidden (never blocks a tap)', () => {
    const c = hiddenFloaterClass(false, 'left');
    expect(c).toContain('opacity-0');
    expect(c).toContain('pointer-events-none');
  });
});
