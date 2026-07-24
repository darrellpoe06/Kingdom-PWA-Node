// @vitest-environment node
//
// Large-print gate, app-wide (DR-0076, sibling of the contrast gate).
// Triggered by COLG staff feedback from the church computer (2026-07-24,
// Eldris Moore, with screenshots): church-tab and lesson surfaces had print
// "so small you can't see no matter what font you have it at" — because
// fixed-px font sizes (a text-…px arbitrary class, an inline px fontSize)
// do NOT inherit the root scale the A/A+/A++/A+++/A44 large-print control
// sets (lib/text-size.js). The church surfaces were converted first
// (PR #1038), then the app-wide sweep converted every remaining surface;
// this gate holds the WHOLE app at zero so the class cannot recur anywhere.
// Logic lives in scripts/large-print-guard.mjs (also a CLI).
import { describe, it, expect } from 'vitest';
import {
  scanSourceForFixedPx, scanAppSurfaces, listScannedFiles, EXCLUSIONS,
} from '../../../scripts/large-print-guard.mjs';

describe('large-print guard — every app surface scales with the text-size control', () => {
  it('actually scans the app (not vacuously empty)', () => {
    const files = listScannedFiles();
    expect(files.length).toBeGreaterThan(150);
    expect(files).toContain('components/ChurchLearn.jsx');
    expect(files).toContain('poe-financial-mvp-v28.jsx');
    expect(files).toContain('components/Rentals.jsx');
  });

  it('no app surface carries a fixed-px font size', () => {
    const { violations } = scanAppSurfaces();
    const msg = violations.map(v => `${v.file}:${v.line} ${v.match}`).join('; ');
    expect(violations, msg).toEqual([]);
  });

  it('every exclusion carries a written reason (no silent carve-outs)', () => {
    const { badExclusions } = scanAppSurfaces();
    expect(badExclusions).toEqual([]);
    for (const reason of Object.values(EXCLUSIONS)) {
      expect(typeof reason).toBe('string');
      expect(reason.trim().length).toBeGreaterThanOrEqual(10);
    }
  });

  // Anti-theater (DR-0076 §3): proven to CATCH the break — the exact classes
  // Eldris's screenshots reported.
  it('CATCHES a fixed-px Tailwind class (text-[10px])', () => {
    const bad = '<div className="text-[10px] uppercase tracking-[0.3em]">Order of Service</div>';
    const v = scanSourceForFixedPx(bad);
    expect(v.length).toBe(1);
    expect(v[0].match).toBe('text-[10px]');
  });

  it('CATCHES inline px font sizes (quoted and bare-numeric)', () => {
    const bad = [
      "<h1 style={{ fontSize: '20px', fontWeight: 700 }}>Lesson</h1>",
      '<span style={{ fontSize: 11, color: "#5A5751" }}>caption</span>',
    ].join('\n');
    expect(scanSourceForFixedPx(bad).length).toBe(2);
  });

  it('PASSES the rem-authored equivalents (not always-failing)', () => {
    const good = [
      '<div className="text-[0.625rem] uppercase tracking-[0.3em]">Order of Service</div>',
      "<h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Lesson</h1>",
      "<span style={{ fontSize: '0.6875rem' }}>caption</span>",
      '<div className="text-xs min-h-[36px] border-[#E8E4DC]">chip</div>',
    ].join('\n');
    expect(scanSourceForFixedPx(good)).toEqual([]);
  });

  it('IGNORES comments that name the bug pattern (docs stay truthful)', () => {
    const doc = [
      '// small fixed-px labels (text-[10px] etc.) are absolute px and do not scale;',
      '/* author as rem: a 10px label becomes text-[0.625rem] (fontSize: 10 is the bug) */',
      ' * legacy note: fontSize: \'11px\' ignored the control',
      'const ok = true;',
    ].join('\n');
    expect(scanSourceForFixedPx(doc)).toEqual([]);
  });
});
