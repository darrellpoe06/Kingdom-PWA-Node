// =============================================================================
// STILL-SCREEN GUARD (DR-0274; grounds DR-0131 — "humans can get dizzy").
// Gate-the-class: on 2026-08-05 Darrell reported the TV Time wall flying the
// screen when a poster was tapped; the audit found 16 files hardcoding
// `behavior: 'smooth'` with zero reduced-motion respect outside SpinnerWheel.
// This scan fails the build if any source file animates a programmatic scroll
// without coming through lib/gentle-motion.js (motionBehavior/gentleReveal),
// so a new surface cannot quietly reintroduce the class. Proven-to-catch: run
// against the pre-sweep tree it named all 16 offenders red.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SRC = join(process.cwd(), 'src'); // vitest runs with cwd = app/

// The one file allowed to say 'smooth': the helper that gates it on the
// user's reduced-motion preference. Tests are exempt (they pin behavior).
const ALLOWED = new Set(['lib/gentle-motion.js']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === '__tests__' || name === 'node_modules') continue;
      walk(p, out);
    } else if (/\.(js|jsx)$/.test(name)) out.push(p);
  }
  return out;
}

describe('the still screen (DR-0274)', () => {
  it('no source file hardcodes an animated scroll — motion rides gentle-motion.js', () => {
    const offenders = [];
    for (const file of walk(SRC)) {
      const rel = relative(SRC, file).split(sep).join('/');
      if (ALLOWED.has(rel)) continue;
      const text = readFileSync(file, 'utf8');
      if (/behavior:\s*['"`]smooth['"`]/.test(text)) offenders.push(rel);
    }
    expect(offenders).toEqual([]);
  });

  it('the helper itself gates smooth on the reduced-motion preference', () => {
    const text = readFileSync(join(SRC, 'lib/gentle-motion.js'), 'utf8');
    expect(text).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(text).toMatch(/prefersReducedMotion\(\)\s*\?\s*'auto'\s*:\s*'smooth'/);
  });
});
