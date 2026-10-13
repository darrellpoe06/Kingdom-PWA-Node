// @vitest-environment node
// =============================================================================
// THE BAND EXCUSE LIST ONLY SHRINKS — a second witness, in the suite (DR-0692)
// =============================================================================
// `course-band-four-allowlist.json` is the EXCUSE list: the lessons that do not
// yet carry child, youth, teen and senior, pinned by id so a known debt does
// not fail the build while a NEW gap does. `ratchetFourBands` enforces the
// per-lesson half and `shrinkFourBandAllowlist` never adds, and
// scripts/curriculum-gates.mjs:165 already runs both on every push.
//
// WHAT WAS MISSING, and why this file is not a duplicate. Nothing in the Vitest
// suite watched the SIZE of the excuse list. The per-lesson rule catches a new
// gap on a lesson nobody excused; it does not notice the list itself getting
// longer. An excuse list that may grow is not a ratchet, it is a waiting room.
//
// HOW THIS CAME UP, recorded because the near-miss is the useful part. PR #1875
// proposed exactly this assertion with a ceiling of 378, carried over from
// 2026-09-30. By the time it was read the real count was 174, because the
// Mathematics, Development, Rent-to-Own and Sovereign A.I. band work had taken
// their lessons off the list. Merging that ceiling would have licensed the list
// to re-grow by ~204 lessons — it would have READ as adding a guard while
// removing its teeth, which is the lie DR-0076 §3 forbids. So the assertion is
// written here against the MEASURED count instead, and #1875 was closed.
//
// THE CEILING IS A HIGH-WATER MARK AND MOVES ONE WAY. When band work lands and
// the list shrinks, lower CEILING to the new measured count in the same commit
// (scripts/course-band-baseline-write.mjs rewrites the list; this number is the
// receipt). RAISING it is the one edit this file exists to make impossible to
// do quietly: a lesson that regresses out of four-band coverage is a product
// regression, and the honest move is to fix the lesson, never the ceiling.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { loadFourBandAllowlist, shrinkFourBandAllowlist } from '../../../scripts/course-band-coverage.mjs';

// MEASURED 2026-10-09 against the real file, not carried over from a branch:
// 174 lessons pinned across 43 course blocks, 16 of which still owe a band.
// 346 was this list's size on the 2026-09-30 branch; 378 was that branch's
// ceiling. Both are history, and neither may come back.
const CEILING = 174;

const allowlist = loadFourBandAllowlist();
const pinnedCount = (a) => Object.values((a && a.courses) || {})
  .reduce((t, ids) => t + ids.length, 0);

describe('the excuse list only shrinks', () => {
  it('pins no more lessons than the recorded high-water mark', () => {
    expect(
      pinnedCount(allowlist),
      'the four-band excuse list GREW. A lesson that regressed out of child, '
      + 'youth, teen and senior is a product regression: fix the lesson, do not '
      + 'raise CEILING. Lower CEILING only when the list has genuinely shrunk.',
    ).toBeLessThanOrEqual(CEILING);
  });

  it('keeps the ceiling honest — it is a high-water mark, not a target', () => {
    // A ceiling left far above the truth stops being a ratchet, because the
    // list could double before anything complained. It is re-pinned as the
    // list shrinks, so it must stay within reach of the real count.
    expect(pinnedCount(allowlist)).toBeGreaterThan(CEILING - 25);
  });

  it('every pinned course is a real block in the list', () => {
    for (const key of Object.keys(allowlist.courses)) {
      expect(Array.isArray(allowlist.courses[key]), `${key} is not a list of ids`).toBe(true);
    }
  });

  // PROVEN-TO-CATCH (DR-0076 §3). An assertion about a number nobody can move
  // in a test is worthless, so the growth is simulated rather than described.
  it('PROVEN-TO-CATCH: one more excused lesson breaks the ceiling', () => {
    const key = Object.keys(allowlist.courses)[0];
    const grown = {
      courses: {
        ...allowlist.courses,
        [key]: [...allowlist.courses[key], 'mat-regressed-out-of-four-bands'],
      },
    };
    expect(pinnedCount(grown)).toBe(pinnedCount(allowlist) + 1);
    expect(pinnedCount(grown)).toBeGreaterThan(CEILING);
  });

  it('PROVEN-TO-CATCH: shrinking never adds, so the list cannot grow through it', () => {
    // A lesson excused but no longer missing a band must drop off, and a course
    // with a real gap that was never excused must not be written in.
    const scan = { missing: { [Object.keys(allowlist.courses)[0]]: [] } };
    const shrunk = shrinkFourBandAllowlist(scan, allowlist);
    expect(pinnedCount({ courses: shrunk })).toBeLessThanOrEqual(pinnedCount(allowlist));
  });
});
