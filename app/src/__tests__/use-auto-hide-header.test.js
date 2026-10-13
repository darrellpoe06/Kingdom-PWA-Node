// @vitest-environment node
// Pins the pure scroll math behind the standard PoeTech collapsing top bar
// (Darrell: "drop up then back down ... when needed"). Proven-to-catch (DR-0076):
// each row is a real gesture and the WRONG answer would be visible on screen.
import { describe, it, expect } from 'vitest';
import { nextHidden } from '../lib/use-auto-hide-header.js';

describe('nextHidden — the header hides on scroll-down, shows on scroll-up', () => {
  it('is always SHOWN at/near the very top (drops back down when you scroll home)', () => {
    expect(nextHidden(true, 0, 500)).toBe(false);   // slammed to top => reveal
    expect(nextHidden(true, 4, 900)).toBe(false);   // within revealAtTop => reveal
  });

  it('HIDES when scrolling down past the jitter threshold', () => {
    expect(nextHidden(false, 200, 100)).toBe(true); // +100 down => hide
  });

  it('SHOWS again the moment you scroll up', () => {
    expect(nextHidden(true, 300, 400)).toBe(false); // -100 up => show
  });

  it('holds its current state inside the jitter threshold (no flicker)', () => {
    expect(nextHidden(true, 205, 200)).toBe(true);  // +5 <= 8 => keep hidden
    expect(nextHidden(false, 200, 205)).toBe(false); // -5 <= 8 => keep shown
  });

  it('is safe against garbage / negative scroll values', () => {
    expect(nextHidden(false, -50, 100)).toBe(false); // clamps to top => shown
    expect(nextHidden(true, NaN, 100)).toBe(false);  // NaN => treated as top
  });

  it('honors custom threshold + revealAtTop options', () => {
    expect(nextHidden(false, 30, 0, { revealAtTop: 40 })).toBe(false); // still "top"
    expect(nextHidden(false, 120, 100, { threshold: 30 })).toBe(false); // +20 <= 30 => hold
  });
});
