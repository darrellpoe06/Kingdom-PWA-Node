// THE LITTLE ONES GROW TOO — the small-text floor at Larger / Largest / Big Print.
// =============================================================================
// Darrell 2026-09-15: "Also want all text to be able to be big!!! Even the
// green space... when the text is enlarged... some text are way bigger than
// others well we want to see the little ones too!!!"
//
// Every rem label already scales with the root, and stays the little one:
// at Big Print a 0.5625rem meta line is 24px beside 33px prose. DR-0427 floors
// the small CONTENT sizes at the prose size (0.75rem) from Larger up, and
// leaves chrome capped (.ts-chrome-region) so big text stays reversible.
//
// This pins the shipped stylesheet carries the rule for every step and every
// small class, with the chrome exclusion; the pixel truth is measured in a
// real browser by scripts/chrome-layout-probe.mjs's Big Print pass and was
// verified by hand at authoring (33px on a step marker at Big Print).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.css'), 'utf8');
const block = css.slice(css.indexOf('THE LITTLE ONES GROW TOO'));
const rule = block.slice(0, block.indexOf('}') + 1);

describe('the small-text floor (DR-0427)', () => {
  it('exists, and floors at the prose size', () => {
    expect(rule).toMatch(/font-size:\s*0\.75rem/);
  });
  it('covers every big step and every small content class, and excludes chrome', () => {
    for (const step of ['larger', 'largest', 'bigprint']) {
      for (const size of ['0\\.5rem', '0\\.5625rem', '0\\.625rem', '0\\.6875rem']) {
        const sel = `html[data-text-size='${step}'] .text-\\[${size}\\]:not(.ts-chrome-region *)`;
        expect(rule, `${step} ${size}`).toContain(sel);
      }
    }
  });
  it('does NOT floor at Normal or Large (nothing changes for a reader who chose the default)', () => {
    expect(rule).not.toContain("data-text-size='normal'");
    expect(rule).not.toContain("data-text-size='large']");
  });
});
