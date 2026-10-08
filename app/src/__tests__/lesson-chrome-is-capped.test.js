// =============================================================================
// The lesson's sticky block is CHROME, and chrome never gets bigger (DR-0816)
// =============================================================================
// Darrell 2026-10-08, with a photograph of L218 on the television: "Fix it."
// The block pinned over the reading — nav row, two-line title, STEP x OF y bar
// — had grown into the words at the big text sizes.
//
// DR-0438 settled the rule in his own words on 2026-09-16: "the controls should
// never get bigger," and CHROME_SCALE_FACTOR has been 0 since. Only the nav row
// was ever held to it. MEASURED at 1280x720 with Chromium before this change:
// the sticky block was 93px at Normal and 194px at Big Print 44, and the
// progress block alone went 43px -> 118px. After: 93px -> 108px, and 43px at
// every size.
//
// The geometry itself is measured by scripts/chrome-layout-probe.mjs, which is
// the only instrument that can measure it (jsdom has no layout). This file pins
// the three source facts that probe depends on, so a revert fails here in
// milliseconds instead of only in the browser pass.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromeMultFor, chromeScaleFor } from '../lib/text-size.js';

const SRC = readFileSync(join(process.cwd(), 'src/components/ChurchLearn.jsx'), 'utf8');

describe('the lesson sticky block is capped like the chrome it is', () => {
  it('the three things that decide the row height ride the chrome scale', () => {
    expect(SRC).toMatch(/const capped = \(size\) => `calc\(\$\{size\} \* var\(--ts-chrome-scale, 1\)\)`/);
    expect(SRC).toContain("export const STICKY_TITLE_SIZE = capped('0.875rem')");
    expect(SRC).toContain("export const STICKY_TOGGLE_SIZE = capped('0.75rem')");
    expect(SRC).toContain("export const STICKY_ROW_PAD_Y = capped('0.375rem')");
    // Both branches of the title — folded to two lines and opened whole.
    const uses = SRC.match(/fontSize: STICKY_TITLE_SIZE/g) || [];
    expect(uses.length, 'the folded title and the opened title both take the cap').toBe(2);
    expect(SRC).toContain('paddingTop: STICKY_ROW_PAD_Y, paddingBottom: STICKY_ROW_PAD_Y');
    expect(SRC).toContain('fontSize: STICKY_TOGGLE_SIZE');
    // The row's own py-* class is gone, or it would fight the capped padding.
    const row = SRC.indexOf('data-testid="lesson-space-title-row"');
    const open = SRC.lastIndexOf('<div', row);
    expect(SRC.slice(open, row), 'the title row has no uncapped vertical padding').not.toMatch(/\bpy-[0-9.]/);
  });

  it('the progress block takes the chrome cap', () => {
    const at = SRC.indexOf('data-testid="lesson-space-progress"');
    expect(at, 'the progress block is still there').toBeGreaterThan(0);
    const className = SRC.slice(at, at + 1400).match(/className="([^"]*)"/);
    expect(className, 'the progress block has a className').toBeTruthy();
    expect(className[1]).toContain('ts-chrome-region');
  });

  it('nothing firmed up was taken away', () => {
    // DR-0605 and Darrell 2026-10-02: "half is shown and the drop down if and
    // when we need to see the whole thing.... don't take away what I've already
    // discussed and firmed up!!!!!"
    expect(SRC).toContain('WebkitLineClamp: 2');
    expect(SRC).toMatch(/data-testid="lesson-space-title-toggle"/);
    // The fold button is a 44px target and the cap must never shrink it, which
    // is why the title takes the cap on its TYPE and not as a .ts-chrome-region
    // (index.css: never zoom a row holding fixed-px controls).
    const at = SRC.indexOf('data-testid="lesson-space-title-toggle"');
    expect(SRC.slice(at - 400, at + 800)).toContain('min-h-[44px]');
    expect(SRC.slice(at - 400, at + 800)).toContain('min-w-[44px]');
    const row = SRC.indexOf('data-testid="lesson-space-title-row"');
    const open = SRC.lastIndexOf('<div', row);
    expect(SRC.slice(open, row), 'the title row is NOT zoomed as a region').not.toContain('ts-chrome-region');
    // The nav row's own cap is untouched.
    const bar = SRC.indexOf('data-testid="lesson-space-bar"');
    expect(SRC.slice(bar - 400, bar)).toContain('ts-chrome-region');
    // The bar still spans the reading width and still cannot scroll away.
    expect(SRC).toMatch(/aria-label="How far through this lesson"/);
  });

  it('the cap it rides is exactly Normal size at every step (DR-0438)', () => {
    for (const mult of [1, 1.2, 1.5, 2, 2.75]) {
      expect(chromeMultFor(mult), `chrome at ${mult}x content`).toBe(1);
      expect(chromeScaleFor(mult) * mult, `net chrome size at ${mult}x`).toBeCloseTo(1, 10);
    }
  });
});
