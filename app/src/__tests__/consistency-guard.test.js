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
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  fileCounts, ratchet, collectLiveCounts, loadBaseline, scanConsistency,
} from '../../../scripts/consistency-guard.mjs';
import { stripCommentLines } from '../../../scripts/large-print-guard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

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

  // ── the fixed-overlay exemption (added 2026-09-17, DR-0455) ──────────────
  // DR-0246's target is the TAB WRAPPER, as the violation's own fix text says:
  // "prose measure and modals live INSIDE the full-width container, never as
  // the tab wrapper." A `fixed` element is lifted out of the tab's flow and
  // painted over the app — it is the modal/toast class the rule allows, and it
  // MUST carry a cap, because a banner stretched edge-to-edge on a 27"
  // monitor is the defect rather than the standard. The tell that the COUNT
  // was wrong and not the code: PwaPrompts' UpdatePrompt and InstallPrompt are
  // both grandfathered in the baseline for exactly this shape.
  it('does NOT count a width cap on a FIXED overlay — that is a toast, not a tab wrapper', () => {
    expect(fileCounts('className="fixed bottom-3 left-1/2 z-50 max-w-md"', 'X.jsx').widthCap).toBe(0);
    expect(fileCounts('className="fixed bottom-4 left-4 right-20 max-w-xs"', 'X.jsx').widthCap).toBe(0);
  });

  it('STILL counts a tab wrapper one line away from an overlay', () => {
    // The exemption is per CLASS SPAN. Nothing about having a toast in the file
    // forgives the container the tab actually renders into.
    const src = [
      'const toast = <div className="fixed top-3 left-1/2 max-w-md" />;',
      'const tab = <div className="mx-auto max-w-3xl p-4" />;',
    ].join('\n');
    expect(fileCounts(src, 'X.jsx').widthCap).toBe(1);
  });

  it('a cap written OUTSIDE any quoted span is still counted — no dodging the string form', () => {
    expect(fileCounts('const w = clsx(fixed, maxw); // x\nconst k = max-w-md;', 'X.jsx').widthCap).toBe(1);
  });

  it('does NOT count a cap that a COMMENT merely names (documentation, not drift)', () => {
    // Same reasoning as the fixedPx comment-strip and the UiIcon emoji exemption:
    // a header that explains the rule must not fail for explaining it.
    expect(fileCounts('// never write max-w-md as the tab wrapper\n<div />', 'X.jsx').widthCap).toBe(0);
  });

  it('the app-wide alert layer is counted at ZERO, and its caps are really there', () => {
    // Proves the exemption against the REAL file rather than a fixture — and
    // that the file genuinely carries caps, so a zero is the exemption working
    // and not an empty read.
    const src = readFileSync(join(ROOT, 'app/src/components/AppAlerts.jsx'), 'utf8');
    const code = stripCommentLines(src);
    // Three in the raw file: two real caps, plus one its header NAMES while
    // explaining this very rule. Two survive the comment strip, and both sit
    // in a `fixed` span — so the counted total is zero because the exemption
    // works, not because the read came back empty.
    expect(src.match(/max-w-/g) || []).toHaveLength(3);
    expect(code.match(/max-w-/g) || []).toHaveLength(2);
    expect(fileCounts(src, 'AppAlerts.jsx').widthCap).toBe(0);
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
