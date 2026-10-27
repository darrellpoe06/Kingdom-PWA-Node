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
import { writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  numbersInPaths, lowestFree, onDisk, onBase, readRef, claimedInFlight,
  SCAN_LIMIT, BASE_CANDIDATES,
} from '../../../scripts/claim-decision-number.mjs';

const DECISIONS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'decisions');

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

describe('what MAIN holds, read from the ref and not from this tree (DR-1247)', () => {
  // The comment on the case above -- "a merged branch holds nothing, its
  // numbers are already on disk" -- is true ONLY of a tree that has merged
  // main. That premise is what broke: asked from the sov51 branch on
  // 2026-10-27, this tool answered DR-1244, which main had already landed.
  // Main's records were counted NOWHERE: absent from a stale disk, and
  // skipped by the in-flight scan as already-merged.
  // THIS CASE USED TO ASSERT `onBase().size > 0` AND WAS RED IN CI, which is
  // how the second defect was found: a GitHub Actions checkout has no
  // `origin/main` remote-tracking ref, so the read returned nothing, and the
  // tool quietly fell back to a disk-only floor -- the DR-1247 collision again.
  // The property that actually matters does not need that ref to exist: the
  // numbers must come from a REF, not from the working tree. HEAD always
  // exists, so it proves exactly that, everywhere.
  it('reads through a ref and not from this tree, so a stale checkout cannot hide a number', () => {
    const read = onBase('HEAD');
    expect(read.ok, read.reason).toBe(true);
    expect(read.ref).toBe('HEAD');
    expect(read.numbers.size).toBeGreaterThan(0);

    // The discriminator: a file present on DISK but not in the commit must be
    // absent from the ref read. If onBase() were reading the tree, it would
    // appear in both.
    const planted = join(DECISIONS, 'DR-9998-a-file-no-commit-has.md');
    writeFileSync(planted, '# planted by claim-decision-number.test.js\n');
    try {
      expect(onDisk().has(9998), 'the planted file is on disk').toBe(true);
      expect(onBase('HEAD').numbers.has(9998), 'but HEAD has never held it').toBe(false);
    } finally {
      rmSync(planted, { force: true });
    }
  });

  it('a base ref that cannot be read is a REFUSAL, not an empty ledger (DR-1249)', () => {
    // The old case asserted only `.size === 0` here -- it pinned the ambiguity
    // AS the behaviour. An empty set has two meanings and they are opposites:
    // "main holds nothing" (impossible) and "the ref is not here" (ordinary).
    const missing = onBase('refs/heads/no-such-ref-exists-here');
    expect(missing.ok).toBe(false);
    expect(missing.numbers.size).toBe(0);
    expect(missing.reason).toMatch(/no base ref could be read/);
    expect(missing.reason).toMatch(/no-such-ref-exists-here/);
    expect(missing.tried).toEqual(['refs/heads/no-such-ref-exists-here']);
  });

  it('readRef separates "the ref is not here" from "the ref holds nothing"', () => {
    // git's own discrimination, by exit code: ls-tree on a bad ref fails;
    // on a good ref with no such path it exits 0 and prints nothing.
    expect(readRef('refs/heads/no-such-ref-exists-here')).toBe(null);
    const here = readRef('HEAD');
    expect(here).not.toBe(null);
    expect(here.size).toBeGreaterThan(0);
  });

  it('falls through the candidate names rather than failing on the first absent one', () => {
    // A worktree may have `origin/main`, or only the full remote-tracking
    // path, or only a local `main`. All three are tried before refusing, and
    // the one actually used is reported so the output never names a ref it
    // did not read.
    expect(BASE_CANDIDATES).toEqual(['origin/main', 'refs/remotes/origin/main', 'main']);
    const read = onBase();
    if (read.ok) {
      expect(BASE_CANDIDATES).toContain(read.ref);
      expect(read.tried[read.tried.length - 1]).toBe(read.ref);
    } else {
      // The CI condition: none of the three is present. It must REFUSE, and
      // say which names it tried.
      expect(read.tried).toEqual(BASE_CANDIDATES);
      expect(read.reason).toMatch(/no base ref could be read/);
    }
  });

  it('PROVEN TO CATCH: the old arithmetic lands inside main; the new one clears it', () => {
    // A tree cut before main's two newest records landed.
    const stale = new Set([1, 2, 3]);
    const base = new Set([1, 2, 3, 4, 5]);

    // What the tool did: floor and taken-set from disk alone.
    const oldWay = lowestFree(Math.max(...stale) + 1, new Set([...stale]));
    expect(oldWay).toBe(4);
    expect(base.has(oldWay), 'the regression this case exists for').toBe(true);

    // What it does now: the floor is disk OR base, whichever is higher, and
    // base is in the taken set.
    const newWay = lowestFree(Math.max(...stale, ...base) + 1, new Set([...stale, ...base]));
    expect(newWay).toBe(6);
    expect(base.has(newWay)).toBe(false);
  });
});
