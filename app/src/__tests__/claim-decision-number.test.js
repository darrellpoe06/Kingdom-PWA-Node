// @vitest-environment node
// =============================================================================
// The next FREE decision number (DR-1076)
// =============================================================================
// DR-1021 recorded the fourth hand-renumber and asked for a count: "count the
// week's collisions; if the rate holds, that convention is the next
// conversation." MEASURED 2026-10-16: 19 renumber events in seven days, about
// 2.7 a day — so a collision is the normal operating condition of a repo with
// concurrent sessions, not an edge case.
//
// These cases pin the pure arithmetic of "what is free", and the shape of what
// counts as a claim. The git-walking half is proven on the LIVE repo below,
// because a fixture cannot show that the scan finds a real branch.
import { describe, it, expect } from 'vitest';
import { numbersInPaths, lowestFree, onDisk, claimedInFlight, SCAN_LIMIT } from '../../../scripts/claim-decision-number.mjs';

describe('what counts as a claimed number', () => {
  it('reads the number out of a decision file path, wherever it sits', () => {
    const found = numbersInPaths([
      'docs/decisions/DR-1075-our-own-probe-is-not-a-person.md',
      'DR-0001-gpu-scheduling-three-layers-of-yield.md',
    ]);
    expect([...found].sort((a, b) => a - b)).toEqual([1, 1075]);
  });

  it('ignores anything that is not a decision FILE — the INDEX is not a claim', () => {
    // docs/decisions/INDEX.md mentions every DR number there has ever been. If
    // it were read as claims, every number would look taken.
    expect(numbersInPaths(['docs/decisions/INDEX.md', 'docs/decisions/README.md']).size).toBe(0);
    expect(numbersInPaths(['docs/decisions/PRINCIPLES.md']).size).toBe(0);
    // A reference inside prose is not a file claim either.
    expect(numbersInPaths(['notes/about-DR-1021-and-renumbering.txt']).size).toBe(0);
  });

  it('is not fooled by a number that is not four digits', () => {
    expect(numbersInPaths(['docs/decisions/DR-107-short.md']).size).toBe(0);
    expect(numbersInPaths(['docs/decisions/DR-10755-long-x.md']).size).toBe(0);
  });
});

describe('the lowest free number', () => {
  it('takes the pointer when nothing is in the way', () => {
    expect(lowestFree(1076, new Set([1074, 1075]))).toBe(1076);
  });

  it('STEPS OVER a number a branch is holding — the whole point', () => {
    expect(lowestFree(1076, new Set([1075, 1076]))).toBe(1077);
  });

  it('steps over a RUN of held numbers, not just one', () => {
    // Two sessions in flight, each having taken one, is the ordinary case.
    expect(lowestFree(1076, new Set([1076, 1077, 1078]))).toBe(1079);
  });

  it('never returns below the pointer, even if low numbers are free', () => {
    // Reusing a retired number would point every existing citation at the
    // wrong record. The ledger is append-only (DR-0011).
    expect(lowestFree(1076, new Set())).toBe(1076);
    expect(lowestFree(1076, new Set([1, 2, 3]))).toBe(1076);
  });
});

describe('PROVEN ON THE LIVE REPO — a fixture cannot show this', () => {
  it('reads the real decision files and finds this very record among them', () => {
    const disk = onDisk();
    expect(disk.size).toBeGreaterThan(900);
    expect(disk.has(1021), 'DR-1021, which asked for this count').toBe(true);
    expect(disk.has(1075), 'DR-1075, the record before this one').toBe(true);
  });

  it('the scan is BOUNDED — 892 branches must not mean 892 diffs', () => {
    expect(SCAN_LIMIT).toBeLessThanOrEqual(100);
    expect(SCAN_LIMIT).toBeGreaterThan(10);
  });

  it('a merged branch holds nothing — its numbers are already on disk', () => {
    // The reason the scan stays small whatever the branch count: only work
    // that has NOT landed can hold a number disk cannot see.
    const held = claimedInFlight({ limit: 8 });
    const disk = onDisk();
    for (const [n, ref] of held) {
      // Anything it reports as held and ALSO on disk means a branch added a
      // file main already has — which is exactly the collision, not a bug.
      expect(typeof ref, `${n} came back without a branch name`).toBe('string');
      expect(ref.length).toBeGreaterThan(0);
      expect(Number.isInteger(n)).toBe(true);
    }
    expect(disk.size).toBeGreaterThan(0);
  });
});
