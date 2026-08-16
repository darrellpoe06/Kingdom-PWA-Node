// @vitest-environment node
// =============================================================================
// A surface uses the width it is given — no stranded gutter
// =============================================================================
// Darrell 2026-08-16, looking at Lesson 9 of Made in Time with a wide empty
// column down the right side of the screen:
//
//   "I don't like the empty space on the right ever!!!!???"
//   "the next button is only on the left side of the screen"
//
// BOTH COMPLAINTS WERE ONE BUG. ChurchLearn's root was
// `<section className="max-w-3xl">` — a 768px cap with NO `mx-auto`. On any
// viewport wider than 768px the entire surface hugged the LEFT edge: dead space
// on the right, and every control in the lesson-space bar — including Next → —
// stranded in the left portion of the screen. He was reading one defect and
// describing it twice.
//
// It was also an OUTLIER, not a convention: ChurchLearn was the only top-level
// surface in the codebase carrying a width cap. Projects and the rest return a
// bare <section> and use the width they are given.
//
// WHY THIS IS A SOURCE-LEVEL PIN AND NOT A BROWSER MEASUREMENT. The house
// already measures rendered geometry in CI (scripts/chrome-layout-probe.mjs,
// COMPREHENSIVE-REVIEW-STANDARD dimension 4) — but that probe checks for
// OVERFLOW (scrollWidth > clientWidth) and cannot see the opposite failure, a
// surface that fits easily and wastes a third of the viewport. Under-use is
// invisible to an overflow check, which is exactly why this shipped and stayed.
// The cap is a source fact, so it is pinned as one; widening the probe to
// measure used-width is the better long-term instrument and is not done here.
//
// PROVEN-TO-CATCH (DR-0076 §3): restoring `max-w-3xl` on the root fails the
// first case; adding a cap to any other top-level surface fails the sweep.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(join(here, '..', p), 'utf8');

/**
 * The root element a component returns. A file can hold several components, so
 * match by the LAST `return (` at component indentation — the default export's
 * — rather than the first one found.
 */
function rootTag(code) {
  const re = /\n {2}return \(\n(?:\s*\/\/[^\n]*\n)*\s*(<[a-zA-Z]+[^>]*>)/g;
  let last = null, m;
  while ((m = re.exec(code))) last = m[1];
  return last;
}
/** The specific root of a named landmark, when a file has more than one. */
function taggedRoot(code, aria) {
  const m = code.match(new RegExp(`<section[^>]*aria-labelledby="${aria}"[^>]*>`));
  return m ? m[0] : null;
}

describe('ChurchLearn uses the width it is given', () => {
  const code = src('components/ChurchLearn.jsx');

  it('its root section carries NO width cap — the gutter Darrell saw is gone', () => {
    const root = taggedRoot(code, 'learn-h');
    expect(root, 'the learn-h <section> must be findable').toBeTruthy();
    expect(root, `root still caps its width: ${root}`).not.toMatch(/max-w-/);
  });

  it('a capped root would strand the right side — the exact defect, named', () => {
    // If someone reinstates a cap, they must also centre it; an uncentred cap
    // is what put every control in the left portion of a wide screen.
    const capped = '<section className="max-w-3xl" aria-labelledby="learn-h">';
    expect(code, 'the uncentred cap must not come back').not.toContain(capped);
  });

  it('the why is recorded at the source, so nobody "tidies" the cap back in', () => {
    expect(code).toMatch(/empty space on the right/i);
    expect(code).toMatch(/next button is only on the left/i);
  });

  it('no top-level tab surface caps its width — ChurchLearn was the only outlier', () => {
    const surfaces = ['components/ChurchLearn.jsx', 'components/Projects.jsx'];
    const offenders = [];
    for (const f of surfaces) {
      const root = rootTag(src(f));
      if (root && /max-w-/.test(root)) offenders.push(`${f} → ${root}`);
    }
    expect(offenders, 'a main surface must use the width it is given').toEqual([]);
  });
});
