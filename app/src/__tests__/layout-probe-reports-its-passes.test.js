// =============================================================================
// The layout probe reports its PASSES, not just its failures — REV-0248
// =============================================================================
// Found while reading this probe's own output on 2026-08-14.
//
// The chrome pass printed its "layout ok" line under `if (!failures)` — the
// GLOBAL running count. So the moment ANY surface failed, every later surface
// that passed perfectly went unprinted, and a run with 1 real failure and 37
// clean passes produced output indistinguishable in shape from 38 failures.
//
// That is the surface-says-truth defect class (DR-0239 dimension 3) applied to
// a gate's own report. The exit code stayed correct throughout — but a reader
// of the output, including me, could not tell a localized defect from a total
// one, and I misread this probe's output before finding the cause.
//
// The text-scale pass one function below ALREADY did this correctly with a
// per-case `const before = failures`. The fix makes the chrome pass match its
// own sibling rather than inventing a convention.
//
// PROVEN-TO-CATCH (DR-0076 §3): restoring `if (!failures)` fails the first case.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(HERE, '../../../scripts/chrome-layout-probe.mjs'), 'utf8');

describe('chrome-layout-probe output is readable', () => {
  it('never gates a pass line on the CUMULATIVE failure count', () => {
    // `if (!failures)` means "nothing has failed anywhere yet", which is not a
    // statement about the case being reported.
    const offenders = SRC.split('\n')
      .map((l, i) => [i + 1, l])
      .filter(([, l]) => /if \(!failures\)/.test(l) && !l.trim().startsWith('//'));
    expect(
      offenders.map(([n, l]) => `${n}: ${l.trim()}`),
      'a pass line gated on the global count hides every later success',
    ).toEqual([]);
  });

  it('both passes decide per case, against a snapshot taken before their checks', () => {
    // Two passes (chrome + text-scale), so two snapshot/compare pairs.
    const snapshots = [...SRC.matchAll(/const before = failures;/g)];
    const compares = [...SRC.matchAll(/if \(failures === before\)/g)];
    expect(snapshots.length, 'each pass snapshots the count before its checks').toBe(2);
    expect(compares.length, 'each pass compares against its own snapshot').toBe(2);
  });

  it('still reports both an ok line and a fail line for each pass', () => {
    expect(SRC).toMatch(/layout ok /);
    expect(SRC).toMatch(/textscale ok /);
    expect(SRC).toMatch(/LAYOUT FAIL/);
  });
});
