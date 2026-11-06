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
//
// THE IN-FLIGHT VIEW HAS AN AGE, AND SILENCE ABOUT IT IS THE THIRD DOOR INTO
// THE SAME COLLISION (DR-1359). claimedInFlight() walks `refs/remotes/origin/`,
// which is a LOCAL CACHE: it is exactly as fresh as the last `git fetch` and not
// one second fresher. A branch pushed five minutes ago holds its number on the
// server and holds nothing at all in this view.
//
// MEASURED, 2026-11-06: asked from a tree that had not fetched, this tool said
// "2 of them at or above number 1355" and named two branches. A third, #2565
// (claude/integrity-lesson-n55fvt), had that number pushed and visible through the
// GitHub API at that moment. After one targeted fetch the same scan saw it. So
// for a second time the tool written to prevent a renumber was recommending one
// -- DR-1247 was the stale TREE, DR-1249 the unreadable BASE, and this is the
// stale REMOTE-TRACKING VIEW. Same failure, third door.
//
// SO THE VIEW IS REFRESHED FIRST, AND ITS AGE IS ALWAYS PRINTED. A fetch that
// could not run does not read as a clean scan (DR-0076 sec. 8, and the rule
// DR-0125 set for site health: unknown freshness NEVER reads as fresh). The
// number is still printed -- offline and in CI a base read alone is better than
// no answer -- but the in-flight half is marked UNVERIFIED in plain words, so a
// session takes the number knowing which half of the question went unanswered.
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
 * The exact fetch that makes the in-flight view current. Pure, so the argv is
 * pinned rather than described: an explicit refspec because a single-branch
 * clone (every `actions/checkout`) has a refspec that would otherwise fetch
 * main alone, and --prune so a merged-and-deleted branch stops holding a number
 * it no longer holds.
 */
export function fetchPlan() {
  return ['fetch', '--quiet', '--prune', '--no-tags', 'origin', '+refs/heads/*:refs/remotes/origin/*'];
}

/**
 * Bring the remote-tracking view up to date. `run` is injected so the tests
 * never touch the network -- a lesson this session paid for once already, when
 * a test calling real git against a branch that did not exist ran for minutes.
 *
 * Returns { ok, reason }. A failure is REPORTED, never swallowed: the whole
 * point is that an unfetched scan must not read like a clean one.
 */
export function refreshRemote(run = null) {
  const exec = run || ((args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  try {
    exec(fetchPlan());
    return { ok: true, reason: '' };
  } catch (err) {
    const why = String(err?.stderr || err?.message || err).trim().split('\n')[0] || 'git fetch failed';
    return { ok: false, reason: why };
  }
}

/**
 * Pure. How old the scanned view is, in words. `newestMs` is the committer date
 * of the most recent remote-tracking ref; null when there is none to read.
 *
 * An age is never rendered as "fresh" on its own -- it is rendered with whether
 * the fetch that would have made it fresh actually ran.
 */
export function freshnessLine({ fetched, reason = '', newestMs = null, nowMs = Date.now() }) {
  const age = newestMs == null ? null : Math.max(0, Math.round((nowMs - newestMs) / 60000));
  const newest = age == null ? 'newest branch: unknown' : `newest branch pushed ${age} minute(s) ago`;
  if (fetched) return `  in-flight view: refreshed just now (${newest}).`;
  return `  in-flight view: UNVERIFIED — the fetch did not run (${reason || 'no reason given'}), so this view is `
    + `only as fresh as the last fetch (${newest}). A branch pushed since then holds its number on the server `
    + 'and holds nothing here. Fetch and ask again before taking a number.';
}

/** The committer date (ms) of the most recently updated remote-tracking ref. */
export function newestRefMs() {
  const out = git(['for-each-ref', '--sort=-committerdate', '--format=%(committerdate:unix)', '--count=1', 'refs/remotes/origin/']).trim();
  const n = Number(out);
  return Number.isFinite(n) && n > 0 ? n * 1000 : null;
}

/**
 * Numbers claimed by branches whose work has NOT landed on main.
 * Returns a Map of number -> EVERY branch holding it, newest push first.
 *
 * IT USED TO KEEP THE FIRST HOLDER AND DROP THE REST, which is the second way
 * this scan under-reported. MEASURED 2026-11-06: number 1355 was held by two live
 * branches at once and the tool named one, so a session on the unnamed branch
 * could read the output and never learn its number was contested. A number held
 * twice is not a tie to be broken quietly; it is the collision itself, and both
 * holders belong in the answer.
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
      const name = ref.replace('refs/remotes/', '');
      const holders = held.get(n) || [];
      if (!holders.includes(name)) holders.push(name);
      held.set(n, holders);
    }
  }
  return held;
}

export function main({ refresh = refreshRemote, noFetch = false, log = console.log, err = console.error, now = Date.now() } = {}) {
  // The view is refreshed BEFORE anything is read from it, so the base read and
  // the in-flight scan answer about the same moment. --no-fetch is for a caller
  // that has just fetched, or has no network; it does not buy silence.
  const fetched = noFetch ? { ok: false, reason: '--no-fetch was passed' } : refresh();

  const disk = onDisk();
  const read = onBase();
  if (!read.ok) {
    // No number is printed. A number computed without main's own records is
    // exactly what DR-1247 was written to stop, and a tool that answers anyway
    // is more dangerous than one that will not answer at all.
    err(`claim-decision-number: REFUSING — ${read.reason}.`);
    err('  Nothing is recommended. Fetch main and ask again:');
    err('    git fetch origin main');
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
  log(`next free decision number: ${pad(free)}`);
  log(`  on disk:   ${disk.size} record(s), highest ${pad(Math.max(...disk))}`);
  log(`  on ${read.ref}: ${base.size} record(s), highest ${pad(Math.max(...base))}`);
  if (unseen.length) {
    // Say it plainly: this tree is behind main, and that is the condition under
    // which this tool used to hand out a number main already held.
    log(`  NOTE: this tree has not merged main — it cannot see ${unseen.length} landed record(s): ${unseen.map(pad).join(', ')}`);
    log('        They are counted as taken anyway. Merge main to make the tree agree.');
  }
  // ALWAYS, whichever way the fetch went: the in-flight half of the answer is
  // only worth what its freshness is worth, and that is not the reader's to
  // guess (DR-1359).
  log(freshnessLine({ fetched: fetched.ok, reason: fetched.reason, newestMs: newestRefMs(), nowMs: now }));

  if (inFlight.size === 0) {
    log('  in flight: none — no unmerged branch holds a decision number.');
    return 0;
  }

  // Only the ones AT OR ABOVE the pointer can actually collide. The rest are
  // held by old unmerged branches whose numbers main has long since passed —
  // reported as a total so the figure is not mistaken for the risk.
  const skipped = [...inFlight.keys()].filter((n) => n >= diskNext).sort((a, b) => a - b);
  log(`  in flight: ${inFlight.size} number(s) held by unlanded branches, ${skipped.length} of them at or above ${pad(diskNext)}`);
  for (const n of skipped) {
    const holders = inFlight.get(n) || [];
    // Held twice is said out loud. It is the collision, not a detail.
    const tail = holders.length > 1 ? ` — HELD BY ${holders.length} BRANCHES, one of them must move` : '';
    log(`    ${pad(n)} — ${holders.join(', ')}${tail}`);
  }
  if (skipped.length) {
    log(`\n  Taking ${pad(diskNext)} would collide. ${pad(free)} is free on disk AND in flight.`);
    log('  This is the renumber DR-1021 recorded four times and this week recorded nineteen.');
  }
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main({ noFetch: process.argv.includes('--no-fetch') }));
}
