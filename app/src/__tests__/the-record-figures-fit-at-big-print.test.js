// =============================================================================
// the-record-figures-fit-at-big-print — the record's figures never run into
// each other (DR-1412)
// =============================================================================
// Darrell 2026-11-10, a Big Print screenshot of his record: "LESSONSVERSIONS",
// "Child,35", "attempts100%" — "Fix it". The figure rows counted columns by the
// SCREEN (sm:grid-cols-5 / sm:grid-cols-4), so a wide screen kept five columns
// while Big Print made the words 2.75 times larger. Measured in Chromium with
// the tiles' own CSS at Big Print 44: the old rule spilled 3 tiles at 768px and
// all 5 at 360px; the text-sized rule spilled none at 1920, 1280, 768 or 360px.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIGURE_GRID, FIGURE_MIN_EM } from '../components/LearnersPanel.jsx';

const SRC = readFileSync(join(process.cwd(), 'src', 'components', 'LearnersPanel.jsx'), 'utf8');

describe('the record’s figures are sized by their text, not the screen', () => {
  it('every figure row uses the text-sized grid', () => {
    expect(FIGURE_GRID.gridTemplateColumns).toBe(`repeat(auto-fit, minmax(min(100%, ${FIGURE_MIN_EM}em), 1fr))`);
    expect(FIGURE_MIN_EM).toBeGreaterThanOrEqual(8);
    // DERIVED, NOT PINNED (DR-0677; corrected 2026-11-11 when a fourth figure
    // row landed). This asserted "exactly 3", so adding a legitimate row broke
    // it while the property it guards — every figure row sized by its TEXT and
    // never by the screen — was never in danger. A hand-written count fails on
    // growth instead of on the defect. Note one row carries extra classes
    // ("grid gap-2 mb-4"), so the check matches the prefix.
    const rows = SRC.match(/className="grid gap-2[^"]*"\s*style=\{FIGURE_GRID\}/g) || [];
    const grids = SRC.match(/className="grid gap-2[^"]*"/g) || [];
    expect(grids.length, 'no figure rows found; has the panel been restructured?').toBeGreaterThan(0);
    expect(rows.length, 'a figure row does not carry FIGURE_GRID, so Big Print would size it by the screen').toBe(grids.length);
  });
  it('PROVEN TO CATCH: no figure row counts its columns by the screen again', () => {
    expect(SRC).not.toMatch(/grid-cols-2 sm:grid-cols-[45]/);
    const old = SRC.replace('style={FIGURE_GRID} data-testid="record-figures"', 'data-testid="record-figures"').replace(
      'className="grid gap-2"',
      'className="grid grid-cols-2 sm:grid-cols-5 gap-2"'
    );
    expect(old).toMatch(/grid-cols-2 sm:grid-cols-[45]/);
  });
  it('a figure never lets a long word cross into its neighbour', () => {
    expect(SRC).toMatch(/className="border border-\[#E8E4DC\] p-3 min-w-0 \[overflow-wrap:anywhere\]" data-testid="record-figure"/);
  });
});
