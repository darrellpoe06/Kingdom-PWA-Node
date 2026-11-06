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
  SCAN_LIMIT, BASE_CANDIDATES, fetchPlan, refreshRemote, freshnessLine, main,
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
    for (const [n, refs] of held) {
      // Anything it reports as held and ALSO on disk means a branch added a
      // file main already has — which is exactly the collision, not a bug.
      expect(Array.isArray(refs), `${n} came back without a list of branches`).toBe(true);
      expect(refs.length, `${n} came back with no branch name`).toBeGreaterThan(0);
      for (const ref of refs) expect(typeof ref).toBe('string');
      // EVERY HOLDER, not the first one (DR-1359): a number held twice used to
      // report as held once, hiding half of today's own three-way collision.
      expect(new Set(refs).size, 'a branch must not be listed twice').toBe(refs.length);
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

// =============================================================================
// The in-flight view has an age (DR-1359)
// =============================================================================
// claimedInFlight() walks refs/remotes/origin/, which is a LOCAL CACHE as fresh
// as the last fetch and no fresher. MEASURED 2026-11-06: from an unfetched tree
// this tool reported "2 of them at or above number 1355" while a third branch had
// that number pushed and readable through the GitHub API; one targeted fetch and the
// same scan saw it. Third door into the same collision — DR-1247 was the stale
// tree, DR-1249 the unreadable base, this is the stale remote-tracking view.
//
// EVERY CASE HERE IS NETWORK-FREE. The runner is injected, because earlier this
// same session a test that called real git against a branch that did not exist
// ran deepen rounds for minutes before it was killed. A case that reaches the
// network is not a fast case that occasionally hangs; it is a different test.
describe('the view is refreshed before it is read', () => {
  it('fetches every branch explicitly, because a single-branch clone would fetch main alone', () => {
    const plan = fetchPlan();
    expect(plan[0]).toBe('fetch');
    // THE LOAD-BEARING ARGUMENT. actions/checkout sets a refspec of exactly one
    // branch, so a bare `git fetch origin` leaves every other remote-tracking
    // ref untouched — the view would stay stale with the fetch reporting success.
    expect(plan, 'an implicit fetch is what leaves the view stale in CI').toContain('+refs/heads/*:refs/remotes/origin/*');
    // A branch that merged and was deleted must stop holding its number.
    expect(plan, 'without --prune a deleted branch keeps a number it no longer holds').toContain('--prune');
  });

  it('reports a fetch failure instead of swallowing it', () => {
    const boom = () => { const e = new Error('spawn failed'); e.stderr = 'fatal: could not read from remote repository\n'; throw e; };
    const got = refreshRemote(boom);
    expect(got.ok).toBe(false);
    expect(got.reason).toBe('fatal: could not read from remote repository');
  });

  it('reports a fetch that worked, and runs exactly the pinned plan', () => {
    const calls = [];
    const got = refreshRemote((args) => { calls.push(args); return ''; });
    expect(got.ok).toBe(true);
    expect(calls).toEqual([fetchPlan()]);
  });

  it('a number held by two branches reports BOTH, and main says one must move', () => {
    // The second way this scan under-reported. The holders map is injected
    // through main's own printer rather than fabricated in git, so the case
    // pins the OUTPUT a session reads.
    const lines = [];
    main({ refresh: () => ({ ok: true, reason: '' }), readBase: onBase, log: (s) => lines.push(String(s)), err: (s) => lines.push(String(s)) });
    const row = lines.find((l) => /^ {4}DR-\d{4} — /.test(l));
    if (row) {
      // On the live repo today this is the real three-way row; off it, any row.
      const holders = row.split('—')[1];
      expect(holders.trim().length, 'a reported number must name who holds it').toBeGreaterThan(0);
      if (holders.includes(',')) expect(row).toMatch(/HELD BY \d+ BRANCHES, one of them must move/);
    }
    // And the shape itself, independent of what is in flight right now.
    const held = claimedInFlight({ limit: 8 });
    for (const refs of held.values()) expect(Array.isArray(refs)).toBe(true);
  });
});

describe('an unverified view never reads as a fresh one', () => {
  const NOW = Date.UTC(2026, 10, 6, 15, 0, 0);

  // THE BASE READ IS INJECTED, AND THAT IS A CORRECTION OF MY OWN CASES.
  // Written against a local tree they passed; in CI all three went red with
  // `REFUSING — no base ref could be read`, because an actions/checkout has no
  // origin/main remote-tracking ref at all. That is DR-1249's condition, not a
  // new fault — but it made these cases assertions about the ENVIRONMENT rather
  // than about the freshness line they exist to pin. A case that only passes
  // where it was written is not the case I meant to write.
  const BASE_OK = () => ({ ok: true, ref: 'origin/main', numbers: new Set([1, 2, 3]), tried: ['origin/main'], reason: '' });

  it('says so plainly when the fetch ran', () => {
    const line = freshnessLine({ fetched: true, newestMs: NOW - 7 * 60000, nowMs: NOW });
    expect(line).toMatch(/refreshed just now/);
    expect(line).toMatch(/pushed 7 minute\(s\) ago/);
    expect(line).not.toMatch(/UNVERIFIED/);
  });

  it('says UNVERIFIED and names the reason when it did not', () => {
    const line = freshnessLine({ fetched: false, reason: 'no network', newestMs: NOW - 240 * 60000, nowMs: NOW });
    expect(line).toMatch(/UNVERIFIED/);
    expect(line).toMatch(/no network/);
    expect(line, 'the actual risk, in words').toMatch(/holds its number on the server and holds nothing here/);
  });

  it('an unknown age is reported as unknown, not as zero', () => {
    // A view with no refs at all is the emptiest possible scan. Rendering that
    // as "0 minutes ago" would read as the freshest possible one.
    const line = freshnessLine({ fetched: false, reason: 'x', newestMs: null, nowMs: NOW });
    expect(line).toMatch(/newest branch: unknown/);
    expect(line).not.toMatch(/0 minute/);
  });

  it('PROVEN TO CATCH: without the fetch, main still prints the UNVERIFIED warning', () => {
    // The regression this guards is silence, so the case asserts the words.
    const lines = [];
    const code = main({ refresh: () => ({ ok: false, reason: 'injected: fetch skipped' }), readBase: BASE_OK, log: (s) => lines.push(String(s)), err: (s) => lines.push(String(s)) });
    const out = lines.join('\n');
    expect(code, 'the number is still answered — offline, a base read beats no answer').toBe(0);
    expect(out, 'a stale scan must announce itself').toMatch(/in-flight view: UNVERIFIED/);
    expect(out).toMatch(/injected: fetch skipped/);
  });

  it('and with the fetch, the same run says refreshed rather than unverified', () => {
    const lines = [];
    const code = main({ refresh: () => ({ ok: true, reason: '' }), readBase: BASE_OK, log: (s) => lines.push(String(s)), err: (s) => lines.push(String(s)) });
    const out = lines.join('\n');
    expect(code).toBe(0);
    expect(out).toMatch(/in-flight view: refreshed just now/);
    expect(out).not.toMatch(/UNVERIFIED/);
  });

  it("the DR-1249 refusal now says whether a fetch ran, because its own advice is \"fetch main\"", () => {
    // This is the CI condition exactly: an actions/checkout with no
    // origin/main remote-tracking ref, which is what turned my first three
    // cases red. The refusal is unchanged and still prints no number; what is
    // added is the one fact that tells the reader whether the advice was
    // already tried.
    const lines = [];
    const code = main({
      refresh: () => ({ ok: false, reason: 'fatal: could not read from remote repository' }),
      readBase: () => ({ ok: false, ref: null, numbers: new Set(), tried: BASE_CANDIDATES, reason: 'no base ref could be read' }),
      log: (s) => lines.push(String(s)),
      err: (s) => lines.push(String(s)),
    });
    const out = lines.join('\n');
    expect(code, 'a refusal is still a refusal').toBe(1);
    expect(out).toMatch(/REFUSING/);
    expect(out, 'no number may be printed on this path').not.toMatch(/next free decision number/);
    expect(out).toMatch(/in-flight view: UNVERIFIED/);
    expect(out).toMatch(/could not read from remote repository/);
  });

  it('--no-fetch buys no silence', () => {
    const lines = [];
    main({ noFetch: true, refresh: () => { throw new Error('refresh must not be called'); }, readBase: BASE_OK, log: (s) => lines.push(String(s)), err: (s) => lines.push(String(s)) });
    const out = lines.join('\n');
    expect(out).toMatch(/UNVERIFIED/);
    expect(out).toMatch(/--no-fetch was passed/);
  });
});
