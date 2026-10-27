#!/usr/bin/env node
// =============================================================================
// claim-decision-number — the next FREE decision number, not just the next one
// =============================================================================
// MEASURED, 2026-10-16: 19 renumber events in seven days. DR-1021 recorded the
// fourth hand-renumber and asked for exactly this count -- "count the week's
// collisions; if the rate holds, that convention is the next conversation."
// The rate holds at about 2.7 a day, which makes a collision the normal
// operating condition of a repo with concurrent sessions, not an edge case.
//
// WHY IT HAPPENS. `**Next ID:**` is one shared line, and the resolver computes
// it as `maxRowId(INDEX) + 1` -- from what is ON DISK. Two sessions branching
// off the same main both read the same number, both take it, and the second to
// merge renumbers by hand. Nothing is wrong with either session; the number was
// simply free when each of them looked.
//
// WHAT THIS CHANGES: nothing about the convention. `**Next ID:**` stays one
// line, the resolver still owns it, DR-0644's refusal still refuses, and no
// past record moves. This only widens the QUESTION asked before a number is
// taken -- from "what is free on disk?" to "what is free on disk AND not
// already claimed by a branch still in flight?"
//
// WHY UNMERGED BRANCHES ONLY. A merged branch's decision files are already in
// main, so `maxRowId` has counted them. Only a branch whose work has not landed
// can be holding a number that disk cannot see. That makes the scan small
// however many branches exist -- there are 892 in this repo and a handful in
// flight.
//
// IT DECIDES NOTHING AND WRITES NOTHING. It reports the lowest free number and
// who holds the ones it skipped, so a session (or a person) takes it knowingly.
// The resolver remains the only thing that writes the pointer, because two
// things computing one line is how they drift.
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DECISIONS = join(ROOT, 'docs', 'decisions');

/** How many recently-touched branches to look at. Bounded on purpose. */
export const SCAN_LIMIT = 60;

const git = (args, opts = {}) => {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], ...opts });
  } catch {
    return '';
  }
};

/** Is `ref`'s work already in `base`? Answered by exit code (git prints nothing). */
function isAncestor(ref, base) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ref, base], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Pure. Every DR number named by a list of file paths. */
export function numbersInPaths(paths = []) {
  const out = new Set();
  for (const p of paths) {
    const m = /(?:^|\/)DR-(\d{4})-/.exec(String(p || ''));
    if (m) out.add(Number(m[1]));
  }
  return out;
}

/** Pure. The lowest number that is free, at or above `from`. */
export function lowestFree(from, taken) {
  let n = Math.max(1, Number(from) || 1);
  while (taken.has(n)) n += 1;
  return n;
}

/** Numbers already on disk, from the decision files themselves. */
export function onDisk() {
  return numbersInPaths(readdirSync(DECISIONS));
}

/**
 * Numbers the BASE holds, read from the base ref and not from this tree.
 *
 * onDisk() reads the working tree, which is only main-inclusive when the
 * branch has merged main. Run from a branch cut days ago, the tree is MISSING
 * every record main has landed since -- and those numbers were counted nowhere
 * else, because claimedInFlight() skips merged refs on the grounds that disk
 * already has them. So the one number a stale branch must never be handed is
 * exactly the number it got handed.
 *
 * MEASURED, 2026-10-27: asked from the sov51 branch (pre-merge), this tool
 * answered DR-1244 -- a number main had already landed. Taking it would have
 * put two decisions on one number, which is the collision
 * resolve-ledger-conflicts.mjs refuses rather than folds (DR-0644), because
 * folding silently DELETED a real decision twice on 2026-10-06. The tool
 * written to prevent the renumber was recommending one.
 *
 * Reading the base ref costs one `ls-tree` and does not care what the tree
 * has checked out.
 *
 * A READ THAT FAILED MUST NOT READ AS A CLEAN RESULT (DR-1249). git() above
 * swallows failure and returns '', so a ref that does not exist here yielded an
 * empty set -- indistinguishable from "main holds no decision records", which
 * cannot be true of this repository. MEASURED, 2026-10-27: a GitHub Actions
 * checkout has no `origin/main` remote-tracking ref at all, so in CI this read
 * returned NOTHING and the tool's floor fell back to disk alone -- the DR-1247
 * collision again, through a different door, in the one environment where the
 * first case for it was supposed to be proving it fixed.
 *
 * So the two outcomes are now distinct. `ls-tree` on a valid ref with no such
 * directory exits 0 and prints nothing; on an invalid ref it exits non-zero.
 * That is the whole discrimination, and it is git's, not a guess.
 */
export const BASE_CANDIDATES = ['origin/main', 'refs/remotes/origin/main', 'main'];

/** The numbers a ref holds, or null if the ref itself could not be read. */
export function readRef(ref) {
  try {
    const out = execFileSync('git', ['ls-tree', '--name-only', String(ref), 'docs/decisions/'],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return numbersInPaths(out.split('\n').map((s) => s.trim()).filter(Boolean));
  } catch {
    return null;
  }
}

export function onBase(base = null) {
  const tried = [];
  for (const ref of base ? [String(base)] : BASE_CANDIDATES) {
    tried.push(ref);
    const got = readRef(ref);
    if (got === null) continue; // the ref does not exist here; try the next name
    if (got.size === 0) {
      return {
        ok: false, ref, numbers: got, tried,
        reason: `${ref} was read but holds no decision records under docs/decisions/, `
          + 'which cannot be true of this repository',
      };
    }
    return { ok: true, ref, numbers: got, tried, reason: '' };
  }
  return {
    ok: false, ref: null, numbers: new Set(), tried,
    reason: `no base ref could be read (tried ${tried.join(', ')}) — without main's own records `
      + 'this tool cannot tell a free number from a taken one',
  };
}

/**
 * Numbers claimed by branches whose work has NOT landed on main.
 * Returns a Map of number -> branch that holds it (first one wins).
 */
export function claimedInFlight({ limit = SCAN_LIMIT, base = 'origin/main' } = {}) {
  const held = new Map();
  const refs = git(['for-each-ref', '--sort=-committerdate', '--format=%(refname)',
    `--count=${limit}`, 'refs/remotes/origin/']).split('\n').map((s) => s.trim()).filter(Boolean);

  for (const ref of refs) {
    if (ref === `refs/remotes/${base}` || ref.endsWith('/HEAD')) continue;
    // Merged work is already counted on disk, so skip it. `--is-ancestor`
    // signals by EXIT CODE, not output — it prints nothing either way, which
    // is why this one call cannot go through git() above.
    if (isAncestor(ref, base)) continue;

    // Only the decision files this branch has that main does not.
    const added = git(['diff', '--name-only', '--diff-filter=A', `${base}...${ref}`, '--', 'docs/decisions/'])
      .split('\n').map((s) => s.trim()).filter(Boolean);
    for (const n of numbersInPaths(added)) {
      if (!held.has(n)) held.set(n, ref.replace('refs/remotes/', ''));
    }
  }
  return held;
}

export function main() {
  const disk = onDisk();
  const read = onBase();
  if (!read.ok) {
    // No number is printed. A number computed without main's own records is
    // exactly what DR-1247 was written to stop, and a tool that answers anyway
    // is more dangerous than one that will not answer at all.
    console.error(`claim-decision-number: REFUSING — ${read.reason}.`);
    console.error('  Nothing is recommended. Fetch main and ask again:');
    console.error('    git fetch origin main');
    return 1;
  }
  const base = read.numbers;
  const inFlight = claimedInFlight({ base: read.ref });
  const taken = new Set([...disk, ...base, ...inFlight.keys()]);
  // What a session would take today, and what is actually free. The landed
  // floor is disk OR base, whichever is higher: a stale tree is behind main,
  // and main's numbers are taken whether or not this tree can see them.
  const diskNext = Math.max(0, ...disk, ...base) + 1;
  const free = lowestFree(diskNext, taken);
  const unseen = [...base].filter((n) => !disk.has(n)).sort((a, b) => a - b);

  const pad = (n) => `DR-${String(n).padStart(4, '0')}`;
  console.log(`next free decision number: ${pad(free)}`);
  console.log(`  on disk:   ${disk.size} record(s), highest ${pad(Math.max(...disk))}`);
  console.log(`  on ${read.ref}: ${base.size} record(s), highest ${pad(Math.max(...base))}`);
  if (unseen.length) {
    // Say it plainly: this tree is behind main, and that is the condition under
    // which this tool used to hand out a number main already held.
    console.log(`  NOTE: this tree has not merged main — it cannot see ${unseen.length} landed record(s): ${unseen.map(pad).join(', ')}`);
    console.log('        They are counted as taken anyway. Merge main to make the tree agree.');
  }

  if (inFlight.size === 0) {
    console.log('  in flight: none — no unmerged branch holds a decision number.');
    return 0;
  }

  // Only the ones AT OR ABOVE the pointer can actually collide. The rest are
  // held by old unmerged branches whose numbers main has long since passed —
  // reported as a total so the figure is not mistaken for the risk.
  const skipped = [...inFlight.keys()].filter((n) => n >= diskNext).sort((a, b) => a - b);
  console.log(`  in flight: ${inFlight.size} number(s) held by unlanded branches, ${skipped.length} of them at or above ${pad(diskNext)}`);
  for (const n of skipped) console.log(`    ${pad(n)} — ${inFlight.get(n)}`);
  if (skipped.length) {
    console.log(`\n  Taking ${pad(diskNext)} would collide. ${pad(free)} is free on disk AND in flight.`);
    console.log('  This is the renumber DR-1021 recorded four times and this week recorded nineteen.');
  }
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main());
