#!/usr/bin/env node
// rebuild-witness — prove a rebuild carried everything, instead of trusting it.
//
// THE QUESTION THIS ANSWERS. Darrell, 2026-09-22: "When you rebuild how do you
// know if you missed something?" The honest answer was: from the rebuild
// itself, you don't. This makes the answer measurable.
//
// WHY A REBUILD LOSES THINGS. Main moves under this repo constantly, so work
// started on one base is regularly re-applied to another: save a diff, reset,
// branch from the new origin/main, re-apply. Three holes in that sequence, all
// of them real and two of them already paid for today:
//
//   1. `git diff` DOES NOT SEE UNTRACKED FILES. A brand-new test or module is
//      invisible to the patch. It survives only if a human remembers to copy
//      it, which is memory, not measurement.
//   2. A CLEAN `git apply` IS NOT CORRECTNESS. It means the context lines
//      matched. It says nothing about whether the result is right against a
//      base whose neighbouring code moved.
//   3. COUNT PINS AND BASELINES DRIFT WITH THE BASE. A ratchet measured at 349
//      on the old main is simply wrong on a main that gained a course. This is
//      not hypothetical: it turned a PR red on 2026-09-22.
//
// This tool closes hole 1 completely and makes holes 2 and 3 visible, which is
// all a snapshot can honestly do. The FULL SUITE remains the instrument that
// answers correctness, because it re-measures from scratch and does not know or
// care that a rebuild happened. That independence is the whole point; a checker
// that shared the rebuild's assumptions would inherit its blind spots.
//
//   node scripts/rebuild-witness.mjs save     # before you reset
//   node scripts/rebuild-witness.mjs verify   # after you re-apply
//
// Exit 0 = everything the snapshot saw is present and byte-identical.
// Exit 1 = something is missing or changed, named exactly.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';

const STATE = resolve(process.cwd(), '.git', 'rebuild-witness.json');

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

// Every file the working tree has changed OR added, which is the union
// `git diff` alone does not give you. -o --exclude-standard is the half that
// catches new files; --name-only covers tracked edits.
function changedAndUntracked() {
  const tracked = git('diff', '--name-only', 'HEAD').split('\n').filter(Boolean);
  const untracked = git('ls-files', '--others', '--exclude-standard').split('\n').filter(Boolean);
  return [...new Set([...tracked, ...untracked])].sort();
}

function sha(file) {
  if (!existsSync(file)) return null;
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

const mode = process.argv[2];

if (mode === 'save') {
  const files = changedAndUntracked();
  const snap = {
    savedAt: new Date().toISOString(),
    base: git('rev-parse', 'HEAD').trim(),
    branch: git('rev-parse', '--abbrev-ref', 'HEAD').trim(),
    files: Object.fromEntries(files.map((f) => [f, sha(f)])),
  };
  mkdirSync(dirname(STATE), { recursive: true });
  writeFileSync(STATE, JSON.stringify(snap, null, 2));
  const trackedCount = git('diff', '--name-only', 'HEAD').split('\n').filter(Boolean).length;
  const newCount = files.length - trackedCount;
  console.log(`rebuild-witness: saved ${files.length} file(s) — ${trackedCount} modified, ${newCount} NEW`);
  console.log(`  base ${snap.base.slice(0, 8)} on ${snap.branch}`);
  if (newCount > 0) {
    console.log('  NEW files are the ones a `git diff` patch would silently drop:');
    for (const f of git('ls-files', '--others', '--exclude-standard').split('\n').filter(Boolean)) {
      console.log(`    ${f}`);
    }
  }
  process.exit(0);
}

if (mode === 'verify') {
  if (!existsSync(STATE)) {
    console.error('rebuild-witness: no snapshot. Run `save` BEFORE the reset, not after.');
    process.exit(1);
  }
  const snap = JSON.parse(readFileSync(STATE, 'utf8'));
  const missing = [];
  const changed = [];
  for (const [f, want] of Object.entries(snap.files)) {
    const got = sha(f);
    if (got === null) missing.push(f);
    else if (got !== want) changed.push(f);
  }

  const now = git('rev-parse', 'HEAD').trim();
  console.log(`rebuild-witness: snapshot had ${Object.keys(snap.files).length} file(s), base ${snap.base.slice(0, 8)}`);
  if (now !== snap.base) console.log(`  base moved ${snap.base.slice(0, 8)} -> ${now.slice(0, 8)} (expected after a rebuild)`);

  if (missing.length) {
    console.error(`\n  MISSING — present before the rebuild, absent now (${missing.length}):`);
    for (const f of missing) console.error(`    ${f}`);
  }
  if (changed.length) {
    // Not automatically a fault: re-applying to a moved base legitimately
    // changes a count pin. But it must be a change someone MEANT.
    console.log(`\n  CHANGED — carried across but not byte-identical (${changed.length}):`);
    for (const f of changed) console.log(`    ${f}`);
    console.log('  Each of these is either a deliberate re-measurement against the new');
    console.log('  base (a count pin, a baseline) or an accident. This tool cannot tell');
    console.log('  the difference — the full suite can, and is what decides.');
  }
  if (!missing.length && !changed.length) {
    console.log('\n  OK — every file the snapshot saw is present and byte-identical.');
  }
  console.log('\n  This proves NOTHING about correctness. A clean carry onto a moved base');
  console.log('  can still be wrong. Run the full suite; it is the instrument that does');
  console.log('  not share this tool\'s assumptions.');
  process.exit(missing.length ? 1 : 0);
}

console.error('usage: rebuild-witness.mjs save|verify');
process.exit(1);
