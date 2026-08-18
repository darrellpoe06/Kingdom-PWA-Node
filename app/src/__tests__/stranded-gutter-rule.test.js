// @vitest-environment node
// =============================================================================
// The stranded-gutter rule — the check that would have caught Lesson 9
// =============================================================================
// Darrell 2026-08-16, on a phone: "I don't like the empty space on the right
// ever!!!!???" and "the next button is only on the left side of the screen."
// One defect: ChurchLearn's root was `max-w-3xl` (768px) with NO `mx-auto`, so
// on a wide viewport the whole surface hugged the left edge.
//
// IT SURVIVED EVERY GATE, and the reason is the point of this file. The CI
// layout probe measures OVERFLOW — scrollWidth > clientWidth. Under-use is the
// OPPOSITE failure: a surface that fits easily and abandons a third of the
// screen overflows nothing, so no instrument in the repo could see it. Half the
// failure space was unmeasured.
//
// WHY THE RULE IS EXTRACTED. The browser measures; `strandedGutter()` decides.
// The in-page measurement cannot be unit tested, and on 2026-08-16 the probe's
// own --selftest-break "passed" while never reaching this check at all — it
// tripped earlier on `header h1 never rendered` (the app does not boot in the
// cloud sandbox) and `continue`d past it. A rule exercised only by a live
// render is a rule nobody has actually checked. So the decision is pure and
// pinned here, and CI's real Chromium proves the measurement.
//
// THE DISTINCTION THAT MATTERS: a CENTRED narrow column is good typography and
// must pass. The defect is a ONE-SIDED gutter. That is why the rule compares
// the two margins instead of the column width.
import { describe, it, expect } from 'vitest';
import { strandedGutter } from '../../../scripts/layout-rules.mjs';

describe('strandedGutter', () => {
  it('catches the REAL Lesson 9 defect — a 768px cap pinned left on a wide screen', () => {
    // Darrell's screenshot: ~1153px viewport, 768px column at the left edge.
    expect(strandedGutter({ left: 0, right: 385, vw: 1153, width: 1153 })).toBe(true);
  });

  it('passes a CENTRED narrow column — good typography is not a defect', () => {
    // Same 768px column, mx-auto on a 1440px screen: 336px each side.
    expect(strandedGutter({ left: 336, right: 336, vw: 1440, width: 1440 })).toBe(false);
  });

  it('passes full-bleed content with ordinary page padding', () => {
    expect(strandedGutter({ left: 24, right: 24, vw: 1440, width: 1440 })).toBe(false);
  });

  it('catches an uncentred cap even when the left margin is non-zero', () => {
    // 1440 viewport, content 24..700 → right gutter 740 vs left 24.
    expect(strandedGutter({ left: 24, right: 740, vw: 1440, width: 1440 })).toBe(true);
  });

  it('does NOT fire below 900px — a narrow column on a phone is normal', () => {
    expect(strandedGutter({ left: 0, right: 200, vw: 390, width: 390 })).toBe(false);
    expect(strandedGutter({ left: 0, right: 300, vw: 768, width: 768 })).toBe(false);
  });

  it('needs BOTH conditions — a big-but-balanced gutter is not stranding', () => {
    // right exceeds 25% of the viewport, but left is comparable → centred-ish.
    expect(strandedGutter({ left: 300, right: 400, vw: 1440, width: 1440 })).toBe(false);
    // lopsided, but the gutter is small → not worth failing a build over.
    expect(strandedGutter({ left: 2, right: 100, vw: 1440, width: 1440 })).toBe(false);
  });

  it('is safe on missing or unmeasurable input rather than failing blind', () => {
    expect(strandedGutter({ left: Infinity, right: 0, vw: 1440, width: 1440 })).toBe(false);
    expect(strandedGutter({ left: 0, right: 500, vw: 0, width: 1440 })).toBe(false);
    expect(strandedGutter({})).toBe(false);
  });
});
