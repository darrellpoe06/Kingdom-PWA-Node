// surface-not-blank — the blank-surface assertion, pinned both ways.
import { describe, it, expect } from 'vitest';
import { assessSurface, MIN_SURFACE_TEXT } from '../lib/surface-not-blank.js';

describe('assessSurface — refuses the "renders blank" class', () => {
  it('fails on truly empty output', () => {
    expect(assessSurface('', false).ok).toBe(false);
    expect(assessSurface('   \n  ', true).ok).toBe(false);
  });

  it('fails on a near-blank strip (a word or two, no substance)', () => {
    expect(assessSurface('Imported', true).ok).toBe(false);
  });

  it('fails on floating text with no visible container', () => {
    const longText = 'x'.repeat(MIN_SURFACE_TEXT + 10);
    expect(assessSurface(longText, false).ok).toBe(false);
  });

  it('passes a real empty/denied state: substantive text inside a card', () => {
    const denied = 'Imported transactions — this view is private to your family and shows only when signed in.';
    expect(assessSurface(denied, true)).toEqual({ ok: true, reason: 'ok' });
  });
});
