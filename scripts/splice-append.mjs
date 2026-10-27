#!/usr/bin/env node
// =============================================================================
// splice-append — resolve a "both sides appended one lesson" merge conflict by
// KEEPING BOTH, deterministically, without hand-stitching interleaved hunks.
// =============================================================================
// WHY THIS EXISTS. Living Lessons are built in parallel from one waiting queue,
// each branch appending its own lesson object at the same point in
// `app/src/lib/living-lessons-class.js`. Merging main into the next branch
// therefore conflicts there EVERY time, and git interleaves the two lesson
// objects into several hunks because they share structural lines (`"title":`,
// `"q":`). Measured 2026-10-27 landing ll259 → ll262: 5 hunks in the catalog, 1
// in the dates map, 1 in the ledger, on every single landing.
//
// `keep-prs-current.yml` meets the same three files and says so plainly: the
// ledger files "resolve themselves", and these are "the owner's call". That
// hand-resolution, repeated once per lesson across interleaved hunks inside
// JSON-ish objects, is how a lesson silently loses a brace or an age band.
//
// WHY THIS IS SAFE RATHER THAN CLEVER. Each branch's change to these files is a
// PURE, CONTIGUOUS INSERTION against the merge base — measured, 166 added / 0
// removed for the catalog, 6 / 0 for the dates map. So the union is exactly
// computable from the three merge stages with NO PARSING of the file at all:
//   base   = git show :1:FILE   (what both sides started from)
//   ours   = git show :2:FILE   (this branch: base + OUR lesson)
//   theirs = git show :3:FILE   (main: base + the siblings already landed)
// Take the common prefix and common suffix of base vs ours; our block is what
// sits between them. Insert that block into `theirs` immediately before the
// same suffix. Because the sibling's block also sits before that suffix, ours
// lands AFTER it — which is ascending lesson order, the order the contiguity
// gate wants.
//
// WHAT IT REFUSES, so it can never be the thing that loses a lesson:
//   * a change that is not a pure insertion (any deletion) — a person reads that;
//   * a base/ours pair that does not reconstruct as prefix + suffix;
//   * a `theirs` whose trailing anchor is not the base's — the insertion point moved;
//   * a block that does not hold exactly one lesson id, for the catalog.
// It writes NOTHING when it refuses, and it never touches the ledger files
// (`docs/decisions/INDEX.md`, `legibility-health.json`) — those belong to
// `scripts/resolve-ledger-conflicts.mjs`, which owns the `Next ID` pointer.
// Two things computing one line is how they drift (DR-1021).
//
// Usage, from the worktree, DURING a conflicted merge:
//   node scripts/splice-append.mjs app/src/lib/living-lessons-class.js [more…]
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

/** The ledger owns itself; naming one here is a mistake, not a request. */
export const LEDGER_FILES = Object.freeze([
  'docs/decisions/INDEX.md',
  'app/src/lib/legibility-health.json',
]);

const commonPrefix = (a, b) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  return i;
};
const commonSuffix = (a, b, cap) => {
  let i = 0;
  while (i < cap && a[a.length - 1 - i] === b[b.length - 1 - i]) i += 1;
  return i;
};

/**
 * The whole decision, as a pure function of the three merge stages, so it can
 * be tested without a git repository.
 *
 * @returns {{ok: true, text: string, blockLines: number, anchorLines: number}
 *          | {ok: false, reason: string}}
 */
export function spliceAppend({ base: baseT, ours: oursT, theirs: theirsT, file = '' }) {
  if (LEDGER_FILES.some((f) => file.endsWith(f))) {
    return { ok: false, reason: 'this is a ledger file — resolve-ledger-conflicts.mjs owns it, including the pointer' };
  }
  if (baseT == null || oursT == null || theirsT == null) {
    return { ok: false, reason: 'not a three-stage conflict (is it actually conflicted?)' };
  }
  const base = baseT.split('\n');
  const ours = oursT.split('\n');
  const theirs = theirsT.split('\n');

  if (ours.length <= base.length) {
    return { ok: false, reason: `our side is not longer than the base (${ours.length} vs ${base.length}) — not a pure insertion` };
  }

  const P = commonPrefix(base, ours);
  const S = commonSuffix(base, ours, Math.min(base.length - P, ours.length - P));
  const block = ours.slice(P, ours.length - S);

  // The insertion must fully explain the difference: base === prefix + suffix.
  const rebuilt = [...ours.slice(0, P), ...ours.slice(ours.length - S)];
  if (rebuilt.length !== base.length || rebuilt.some((l, i) => l !== base[i])) {
    return { ok: false, reason: 'our change is not one contiguous pure insertion against the base — a person reads this one' };
  }
  if (!block.length) return { ok: false, reason: 'our inserted block is empty' };

  // The anchor must still exist on main's side, identically.
  const theirsSuffix = theirs.slice(theirs.length - S);
  const baseSuffix = base.slice(base.length - S);
  if (S === 0 || theirsSuffix.length !== baseSuffix.length || theirsSuffix.some((l, i) => l !== baseSuffix[i])) {
    return { ok: false, reason: 'main does not end with the same anchor region — the insertion point moved' };
  }

  if (/living-lessons-class\.js$/.test(file)) {
    // The catalog writes ids JSON-style ("id": "ll258-…"), not as bare keys with
    // single quotes. Accept either, so this check cannot pass by failing to match.
    //
    // THE SLUG IS MATCHED PERMISSIVELY ON PURPOSE. This read `ll\d+-[a-z0-9-]+`,
    // which silently fails to see any id whose slug is not lowercase-kebab — and
    // an id it cannot see is an id it does not COUNT, so a block holding two
    // lessons could report "1 id" and be spliced as if it held one. Measured
    // 2026-10-27 on a fixture id `ll262-alsoOurs`: the block held two lessons and
    // the guard counted one. Real ids are lowercase-kebab, so this was not a live
    // defect — but a guard that under-counts is a guard that can wave the thing
    // through, which is the one thing this file must never do. Anything after
    // `llNNN` now counts.
    const ids = block.join('\n').match(/["']?id["']?:\s*["'](ll\d+[^"']*)["']/g) || [];
    if (ids.length !== 1) {
      return { ok: false, reason: `our block holds ${ids.length} lesson ids, expected exactly 1` };
    }
  }

  const out = [...theirs.slice(0, theirs.length - S), ...block, ...theirs.slice(theirs.length - S)];
  return { ok: true, text: out.join('\n'), blockLines: block.length, anchorLines: S };
}

const stage = (n, f) => {
  try {
    return execFileSync('git', ['show', `:${n}:${f}`], { encoding: 'utf8', maxBuffer: 1 << 28 });
  } catch {
    return null;
  }
};

function main(files) {
  let failed = 0;
  for (const file of files) {
    const r = spliceAppend({
      base: stage(1, file), ours: stage(2, file), theirs: stage(3, file), file,
    });
    if (!r.ok) {
      console.error(`REFUSING ${file}: ${r.reason}`);
      failed += 1;
      continue;
    }
    writeFileSync(file, r.text);
    execFileSync('git', ['add', file]);
    console.log(`spliced ${file}: kept both — ${r.blockLines} of our line(s) placed after main's, before a ${r.anchorLines}-line anchor`);
  }
  if (failed) {
    console.error(`\nsplice-append: ${failed} file(s) REFUSED and left conflicted. Nothing was guessed.`);
    return 2;
  }
  console.log('splice-append: OK — verify the catalog count and the lesson id before committing.');
  return 0;
}

const invokedDirectly = process.argv[1] && /splice-append\.mjs$/.test(process.argv[1]);
if (invokedDirectly) {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('usage: node scripts/splice-append.mjs <conflicted file> [more files…]');
    process.exit(64);
  }
  process.exit(main(files));
}
