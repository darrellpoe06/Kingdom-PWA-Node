// @vitest-environment node
//
// Floating-button overlap gate (DR-0076). The bottom-corner buttons piled on
// top of each other and only the user's eyes caught it — twice. This is the
// "should have been caught" gate: two corner-anchored `fixed` elements at the
// SAME bottom corner stack, and that now fails the build. Logic in
// scripts/fab-overlap-guard.mjs (also a CLI).
import { describe, it, expect } from 'vitest';
import { cornerAnchor, tallyAnchors, checkOverlaps, scanFabs } from '../../../scripts/fab-overlap-guard.mjs';

describe('cornerAnchor — identify corner-anchored floating buttons', () => {
  it('reads the bottom-corner anchor', () => {
    expect(cornerAnchor('fixed bottom-4 right-4 z-40')).toBe('right-4 bottom-4');
    expect(cornerAnchor('fixed bottom-20 left-4')).toBe('left-4 bottom-20');
  });
  it('skips non-corner fixed elements (modals, top bars, full-width bars)', () => {
    expect(cornerAnchor('fixed inset-0 z-50')).toBe(null);          // modal
    expect(cornerAnchor('fixed top-0 right-4')).toBe(null);          // top, not bottom
    expect(cornerAnchor('fixed bottom-4 left-4 right-20')).toBe(null); // full-width bar
    expect(cornerAnchor('px-4 py-2 bg-white')).toBe(null);           // not fixed
  });
});

describe('the real app has no two corner buttons at the same anchor', () => {
  it('the scanner actually sees the FABs (not vacuously empty)', () => {
    const { byAnchor } = scanFabs();
    expect(Object.keys(byAnchor).length).toBeGreaterThan(1);
  });
  it('no overlapping bottom-corner anchors', () => {
    const { violations } = scanFabs();
    const msg = violations.map(v => `[${v.anchor}] x${v.count}: ${v.where.map(w => w.label).join(', ')}`).join('; ');
    expect(violations, msg).toEqual([]);
  });
});

describe('proven-to-catch (anti-theater)', () => {
  it('CATCHES three buttons piled at the same corner (the actual 2026-06-15 bug)', () => {
    const sources = [{ label: 'monolith', src: `
      <button className="fixed bottom-4 right-4 z-40">Suggest</button>
      <div className="tts-controls fixed bottom-4 right-4 z-40">TTS</div>
      <div className="fixed bottom-4 right-4 z-30">NetworkStatus</div>
    ` }];
    const violations = checkOverlaps(tallyAnchors(sources));
    expect(violations.length).toBe(1);
    expect(violations[0].count).toBe(3);
    expect(violations[0].anchor).toBe('right-4 bottom-4');
  });
  it('PASSES the fixed layout (distinct offsets) — not just always-failing', () => {
    const sources = [{ label: 'fixed', src: `
      <div className="fixed bottom-4 right-4">TTS</div>
      <button className="fixed bottom-20 right-4">Suggest</button>
      <button className="fixed bottom-4 left-4">Feedback</button>
      <div className="fixed bottom-20 left-4">NetworkStatus</div>
    ` }];
    expect(checkOverlaps(tallyAnchors(sources))).toEqual([]);
  });
});
