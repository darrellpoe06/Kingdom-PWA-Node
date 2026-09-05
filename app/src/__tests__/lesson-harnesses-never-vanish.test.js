// @vitest-environment node
// =============================================================================
// A per-lesson Scripture harness must never silently disappear
// =============================================================================
// THE INCIDENT (2026-09-05, mine). Authoring L125 I first wrote its verse test
// to `living-lessons-l124-verses.test.js`, not knowing that number was already
// taken. The write CLOBBERED an existing 380-line harness — the Scripture
// integrity gate for Bishop Gwin's "Equipped to Win" lesson — and the rename
// that followed turned the clobber into a clean DELETE. Nothing objected:
//
//   • Every other test still passed, because a deleted test simply stops running.
//   • The lesson-number collision gate passed — numbering was never the problem.
//   • Lint passed. The build passed. The diff read as "renamed a file I created."
//
// It surfaced only because a diffstat against the real merge base showed a
// 380-line deletion I could not account for. That was attention, not a check —
// and attention is exactly what this house refuses to rely on (DR-0076 §2,
// gate-the-class). Losing a verse harness is the worst quiet failure available
// here: the lesson keeps shipping, and the gate that proved every quotation
// verbatim is simply gone.
//
// THE GATE. Each lesson number that has ever had a harness keeps one. The
// manifest below was MEASURED from the tree, not guessed. Adding a lesson is
// free — new numbers need no edit here. REMOVING one fails, loudly, with the
// number named. If a harness is ever legitimately retired or merged into
// another (as l80+l81 already share one), this list is the one place that
// decision has to be written down.
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(HERE);

// Measured 2026-09-05: every lesson number carrying a verse harness today.
// l80 and l81 deliberately share one file, so both map to that shared harness.
const REQUIRED = [
  68, 78, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
  90, 91, 92, 93, 94, 95, 96, 97, 98, 99,
  100, 101, 102, 103, 104, 105, 106, 107, 108, 109,
  110, 111, 112, 113, 114, 115, 116, 117, 118, 119,
  120, 121, 122, 123, 124, 125, 126,
];

// A harness "covers" a number when its filename carries that number — either
// alone (`living-lessons-l124-verses.test.js`) or in a shared range
// (`living-lessons-l80-l81-verses.test.js`).
const harnessesFor = (n) => files.filter(
  (f) => /^living-lessons-l[\d-]*\d.*verses\.test\.js$/.test(f)
    && new RegExp(`(^|[^0-9])l${n}([^0-9]|$)`).test(f.replace(/\.test\.js$/, '')),
);

describe('every lesson that had a Scripture harness still has one', () => {
  for (const n of REQUIRED) {
    it(`L${n} keeps its verse harness`, () => {
      expect(
        harnessesFor(n).length,
        `The Scripture-integrity harness for L${n} is GONE. A deleted test does not fail — it just stops running, so nothing else will tell you. Restore it (git checkout origin/main -- app/src/__tests__/living-lessons-l${n}-verses.test.js), or, if it was retired on purpose, remove ${n} from REQUIRED in this file and say why in the commit.`,
      ).toBeGreaterThan(0);
    });
  }

  it('the manifest is not silently shrinking — the floor holds', () => {
    const present = files.filter((f) => /^living-lessons-l[\d-]*\d.*verses\.test\.js$/.test(f));
    expect(present.length).toBeGreaterThanOrEqual(48);
  });
});

describe('PROVEN-TO-CATCH — the gate fails on the shape that actually happened', () => {
  it('a missing number is detected, not shrugged at', () => {
    // The real incident: L124's harness vanished while every other check stayed
    // green. Simulated against a file list with that one entry removed.
    const without124 = files.filter((f) => f !== 'living-lessons-l124-verses.test.js');
    const covers = (list, n) => list.filter(
      (f) => /^living-lessons-l[\d-]*\d.*verses\.test\.js$/.test(f)
        && new RegExp(`(^|[^0-9])l${n}([^0-9]|$)`).test(f.replace(/\.test\.js$/, '')),
    );
    expect(covers(without124, 124).length, 'the gate must see the deletion').toBe(0);
    expect(covers(files, 124).length, 'and must see the file when it is there').toBeGreaterThan(0);
  });

  it('a shared-range harness still counts for both of its lessons', () => {
    // l80+l81 share one file; a naive exact-name check would fail them both and
    // teach the next reader to delete the rule instead of trusting it.
    expect(harnessesFor(80).length).toBeGreaterThan(0);
    expect(harnessesFor(81).length).toBeGreaterThan(0);
    expect(harnessesFor(80)).toEqual(harnessesFor(81));
  });

  it('a number that never had a harness is not demanded', () => {
    expect(harnessesFor(1).length).toBe(0);
    expect(REQUIRED).not.toContain(1);
  });
});
