// @vitest-environment node
//
// Consistency gate (CONSISTENCY-STANDARD.md, DR-0079). Darrell, 2026-06-25:
// "we need consistency." Each same-day bug shared one root — no ENFORCED shared
// standard, so surfaces drifted (tofu emoji on one device, fixed-px text that
// ignored the large-print control, per-tab width caps). A standard is a slogan
// until it is a check; this runs the guard inside the required `app — lint +
// vitest` so NEW drift over the frozen baseline fails the build. Logic +
// the ratchet live in scripts/consistency-guard.mjs (also a CLI).
import { describe, it, expect } from 'vitest';
import {
  fileCounts, ratchet, collectLiveCounts, loadBaseline, scanConsistency,
} from '../../../scripts/consistency-guard.mjs';

describe('consistency guard — drift counters', () => {
  it('counts a device-font emoji used as a UI glyph (the tofu mechanism)', () => {
    expect(fileCounts('<span>📓 Study</span>', 'X.jsx').emoji).toBe(1);
    expect(fileCounts('<span>🕊 Notes</span><span>🎛 Center</span>', 'X.jsx').emoji).toBe(2);
  });

  it('does NOT count typographic arrows or geometric status glyphs (render cross-device)', () => {
    // "→" and "○/◐/✓" are not device-font emoji — banning them would punish copy.
    expect(fileCounts('<span>Open → Apply</span>', 'X.jsx').emoji).toBe(0);
    expect(fileCounts('<span>○ ◐ ✓</span>', 'X.jsx').emoji).toBe(0);
  });

  it('exempts UiIcon.jsx (its comment legitimately names the emoji it replaced)', () => {
    expect(fileCounts('// book (was 📓), dove (was 🕊)', 'UiIcon.jsx').emoji).toBe(0);
  });

  it('counts a fixed-px font size but not a rem one', () => {
    expect(fileCounts('className="text-[10px]"', 'X.jsx').fixedPx).toBe(1);
    expect(fileCounts('className="text-[0.625rem]"', 'X.jsx').fixedPx).toBe(0);
  });

  it('counts a per-surface width cap (any max-w form)', () => {
    expect(fileCounts('className="max-w-md mx-auto"', 'X.jsx').widthCap).toBe(1);
    expect(fileCounts('className="max-w-[640px]"', 'X.jsx').widthCap).toBe(1);
  });
});

describe('consistency guard — the ratchet (proven to CATCH new drift)', () => {
  const baseline = { 'components/A.jsx': { emoji: 2, fixedPx: 3, widthCap: 1 } };

  it('CATCHES a NEW emoji over the baseline (hard fail)', () => {
    const live = { 'components/A.jsx': { emoji: 3, fixedPx: 3, widthCap: 1 } };
    const { violations } = ratchet(live, baseline);
    expect(violations.some((v) => v.kind === 'emoji-as-icon' && v.file === 'components/A.jsx')).toBe(true);
  });

  it('CATCHES a NEW file (baseline 0) that introduces an emoji or fixed-px', () => {
    const live = { 'components/New.jsx': { emoji: 1, fixedPx: 0, widthCap: 0 } };
    expect(ratchet(live, baseline).violations.some((v) => v.kind === 'emoji-as-icon')).toBe(true);
    const live2 = { 'components/New.jsx': { emoji: 0, fixedPx: 1, widthCap: 0 } };
    expect(ratchet(live2, baseline).violations.some((v) => v.kind === 'fixed-px-font')).toBe(true);
  });

  it('CATCHES a NEW fixed-px font over the baseline (hard fail)', () => {
    const live = { 'components/A.jsx': { emoji: 2, fixedPx: 4, widthCap: 1 } };
    expect(ratchet(live, baseline).violations.some((v) => v.kind === 'fixed-px-font')).toBe(true);
  });

  it('PASSES when a surface REDUCES drift (count below baseline — the ratchet)', () => {
    const live = { 'components/A.jsx': { emoji: 0, fixedPx: 1, widthCap: 0 } };
    expect(ratchet(live, baseline).violations).toEqual([]);
  });

  it('PASSES when counts are unchanged (grandfathered, not failing)', () => {
    const live = { 'components/A.jsx': { emoji: 2, fixedPx: 3, widthCap: 1 } };
    expect(ratchet(live, baseline).violations).toEqual([]);
  });

  it('width-cap over baseline is a HARD violation (DR-0246 — graduated from WARN 2026-07-29)', () => {
    // The full-width sweep converted every app-tab container; a NEW per-surface
    // max-w is the regression Darrell had to name twice. The gate, not a
    // session's memory, is what makes saying it once enough.
    const live = { 'components/A.jsx': { emoji: 2, fixedPx: 3, widthCap: 2 } };
    const { violations } = ratchet(live, baseline);
    expect(violations.some((v) => v.kind === 'width-cap')).toBe(true);
  });

  it('CATCHES a width cap in a NEW file (baseline 0)', () => {
    const live = { 'components/Fresh.jsx': { emoji: 0, fixedPx: 0, widthCap: 1 } };
    expect(ratchet(live, baseline).violations.some((v) => v.kind === 'width-cap')).toBe(true);
  });
});

describe('consistency guard — the LIVE tree holds the frozen baseline', () => {
  it('the baseline is real (not vacuously empty) and the live tree is parsed', () => {
    const baseline = loadBaseline();
    const live = collectLiveCounts();
    expect(Object.keys(baseline).length).toBeGreaterThan(20);
    expect(Object.keys(live).length).toBeGreaterThan(20);
  });

  it('main carries NO new emoji-as-icon or fixed-px drift over the frozen baseline', () => {
    const { violations } = scanConsistency();
    const msg = violations.map((v) => `${v.file}: ${v.kind} ${v.live} > ${v.baseline}`).join('; ');
    expect(violations, msg).toEqual([]);
  });
});
