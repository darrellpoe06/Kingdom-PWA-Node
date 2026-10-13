// =============================================================================
// header-layout — the brand column keeps a floor; the toolbar wraps, never
// crushes (Darrell 2026-07-28: "The PoeTech App Title or Header is always
// messed up cellphone or laptop", with the screenshot: the wordmark collapsed
// to a one-letter-wide column and LOG OUT overlapped it).
//
// Root cause pinned here so it cannot silently return: the title block was
// `min-w-0` with no minimum while the controls row was `lg:flex-nowrap
// lg:shrink-0` — an unshrinkable toolbar wider than the row forces the ONLY
// shrinkable sibling (the brand) to ~zero width. jsdom cannot measure layout,
// so this is a source-pinned gate (the reviewer-mode pattern): the classes
// that constitute the fix must stay, and the classes that constituted the bug
// must stay gone.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');

// The header's title/controls flex row (the Round-14 stacking block).
const rowStart = src.indexOf('flex flex-col-reverse lg:flex-row lg:items-baseline');
const block = src.slice(rowStart, rowStart + 4000);

describe('header layout — the 2026-07-28 collapse fix holds', () => {
  it('locates the header title/controls row', () => {
    expect(rowStart).toBeGreaterThan(-1);
  });

  it('the brand column carries a large-screen minimum width and cannot be crushed', () => {
    const titleDiv = block.match(/<div className="min-w-0[^"]*lg:min-w-\[[^"]*">/);
    expect(titleDiv, 'brand column div not found where expected').toBeTruthy();
    expect(titleDiv[0]).toMatch(/lg:shrink-0/);
  });

  it('the wordmark sits ABOVE the tagline (Darrell 2026-07-29: the lower area has more room for text)', () => {
    // The short brand h1 rides the tight upper row beside the controls; the
    // longer "PoeTech · Life, Soul & Money" tagline gets the roomy lower row.
    const h1At = block.indexOf('<h1 className="ts-chrome-region');
    const taglineAt = block.indexOf('tracking-[0.3em]');
    expect(h1At, 'header h1 not found in the title row').toBeGreaterThan(-1);
    expect(taglineAt, 'tagline div not found in the title row').toBeGreaterThan(-1);
    expect(h1At, 'wordmark h1 must come before the tagline in the brand column').toBeLessThan(taglineAt);
  });

  it('the controls row is allowed to wrap at every width (the bug classes stay gone)', () => {
    const controlsRow = block.match(/<div className="flex items-center gap-2 sm:gap-3 [^"]*justify-end[^"]*">/);
    expect(controlsRow, 'controls row not found where expected').toBeTruthy();
    expect(controlsRow[0]).toMatch(/flex-wrap/);
    expect(controlsRow[0]).not.toMatch(/lg:flex-nowrap/);
    expect(controlsRow[0]).not.toMatch(/lg:shrink-0/);
  });

  it('the display title still never ellipsis-cuts (the 2026-07-06 rule rides along)', () => {
    // The h1 keeps whitespace-nowrap with the full-name / clean-brand swap.
    expect(block).toMatch(/<h1 className="ts-chrome-region[^"]*whitespace-nowrap/);
    expect(block).toContain('Family Operating Systems');
  });
});
