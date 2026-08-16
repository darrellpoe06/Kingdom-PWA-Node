// @vitest-environment node
// =============================================================================
// A capped sticky header must subtract its own offset
// =============================================================================
// Found 2026-08-16 while chasing a CI check that flipped 3-and-3 across six
// runs of the same code: `textscale church@360px` / `library@360px` —
// "text-size controls exist but none is on screen — reader trapped in big
// text." Three diagnoses were guesses (environmental, flaky, font-swap) and
// two were provably wrong.
//
// THE REAL DEFECT, and it is arithmetic rather than timing:
//   • the shell header is `sticky` with `top: var(--lwb-h, 0px)` — offset by
//     the LiveWorshipBar's height (poe-financial-mvp-v28.jsx);
//   • `.ts-safe-sticky` capped it at a flat `100dvh`;
//   • so its BOTTOM could sit `--lwb-h` px BELOW the viewport, carrying the
//     last control in the header — the text-size escape hatch — off screen.
//
// It presented as flakiness because `--lwb-h` is only non-zero inside a real
// service window (LiveWorshipBar: `visible = !!src && live.live && !dismissed`),
// so the same commit passed or failed depending on the wall clock of the run.
// A time-dependent layout bug looks exactly like a flaky gate, which is why it
// survived three wrong diagnoses.
//
// The CSS comment states the invariant; this pins it, because a comment cannot
// fail a build.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '../index.css'), 'utf8');
const shell = readFileSync(join(here, '../poe-financial-mvp-v28.jsx'), 'utf8');

describe('.ts-safe-sticky', () => {
  it('caps to the space REMAINING under its offset, not the whole viewport', () => {
    expect(css, 'a flat 100dvh cap overflows by exactly the offset').toMatch(
      /max-height:\s*calc\(100dvh\s*-\s*var\(--lwb-h,\s*0px\)\)/,
    );
  });

  it('never reverts to the flat cap that caused the trap', () => {
    expect(css).not.toMatch(/\.ts-safe-sticky[^}]*max-height:\s*100dvh\s*;/s);
  });

  it('the offset it subtracts is the one the shell header actually uses', () => {
    // If the shell ever changes which variable positions the header, the cap
    // must move with it — otherwise this silently goes wrong again.
    expect(shell).toMatch(/ts-safe-sticky/);
    expect(shell).toMatch(/top:\s*'var\(--lwb-h, 0px\)'/);
  });

  it('still applies at every enlarged text size, not just Big Print', () => {
    for (const size of ['larger', 'largest', 'bigprint']) {
      expect(css).toContain(`html[data-text-size='${size}'] .ts-safe-sticky`);
    }
  });
});
