// @vitest-environment node
//
// Large-print gate for the Church tab + lesson surfaces (DR-0076, sibling of
// the contrast gate). Triggered by COLG staff feedback from the church
// computer (2026-07-24, Eldris Moore, with screenshots): the Church tab and
// lesson surfaces had print "so small you can't see no matter what font you
// have it at" — because fixed-px font sizes (text-[10px], fontSize: '11px')
// do NOT inherit the root scale the A/A+/A++/A+++/A44 large-print control
// sets (lib/text-size.js). The 2026-06-17 coverage rule already named this a
// bug class; this gate makes it a build failure on every church/lesson
// surface so it cannot recur. Logic lives in scripts/large-print-guard.mjs
// (also a CLI).
import { describe, it, expect } from 'vitest';
import {
  GUARDED_FILES, scanSourceForFixedPx, scanGuardedSurfaces,
} from '../../../scripts/large-print-guard.mjs';

describe('large-print guard — church/lesson surfaces scale with the text-size control', () => {
  it('actually scans the guarded surfaces (not vacuously empty)', () => {
    const { scanned, missing } = scanGuardedSurfaces();
    expect(GUARDED_FILES.length).toBeGreaterThan(20);
    expect(scanned.length).toBeGreaterThan(20);
    // A renamed/deleted guarded file must update GUARDED_FILES, never rot silently.
    expect(missing, `guarded files missing: ${missing.join(', ')}`).toEqual([]);
  });

  it('no church/lesson surface carries a fixed-px font size', () => {
    const { violations } = scanGuardedSurfaces();
    const msg = violations.map(v => `${v.file}:${v.line} ${v.match}`).join('; ');
    expect(violations, msg).toEqual([]);
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
    const v = scanSourceForFixedPx(bad);
    expect(v.length).toBe(2);
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
});
