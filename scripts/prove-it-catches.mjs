#!/usr/bin/env node
// =============================================================================
// prove-it-catches — a proven-to-catch run that restores what it breaks
// =============================================================================
// WHY, MEASURED ON MY OWN FAILURE, 2026-10-22. DR-0076 §3 requires a new gate
// to be SHOWN to catch the break before it is trusted: "a gate that always
// passes is itself a lie." The way that proof is run in this repo is by hand —
// patch the implementation, run the suite, watch it go red, restore, re-run.
// Four breaks were proven that way on 2026-10-22 for DR-1206, which generalized
// the DR-1051 intake-witness gate, and the FIRST attempt proved nothing at all:
//
//   the loop restored each break with `git checkout <file>`, which reverted the
//   IMPLEMENTATION along with the break, because the implementation was not yet
//   committed. Breaks 2, 3 and 4 therefore ran against a file with no feature
//   in it. All three reported the same 13 failures, I read three "catches" that
//   were one unimplemented baseline, and only the identical failure COUNTS gave
//   it away.
//
// Three proofs that proved nothing, and they looked exactly like proofs. That
// is the same class of failure DR-0076 was written against, one level up: not a
// gate that lies, but a PROOF that lies. A hand-written restore step is where
// it enters, and a hand-written step repeated four times per gate is the
// recurring friction DR-1021 says becomes a tool.
//
// WHAT THIS REFUSES TO DO, which is the whole point:
//
//   1. It will not call a break "caught" unless the suite was GREEN first.
//      An already-red baseline cannot prove anything about a break, and this
//      single check is what would have stopped my bad run on break 2.
//   2. It restores from a byte SNAPSHOT taken in memory before patching —
//      never from git, which cannot know whether the thing it restores to
//      contains the work — and verifies the restored file by sha256. A restore
//      that does not match is a hard error naming the file it may have left
//      modified, not a warning.
//   3. It refuses a `find` string that appears zero times (the break does not
//      apply; the proof would be vacuous) or more than once (which half was
//      patched is ambiguous).
//   4. It refuses a no-op break, where `replace` equals `find`.
//   5. It runs the suite once more at the END and requires green, so a run
//      cannot leave the tree broken and still report success.
//
// A break that does NOT turn the suite red is reported as unproven and exits
// non-zero. That is the finding, not an error: it means the check under test
// does not actually catch the thing it claims to.
//
// NOT a replacement for writing the proof. It is the operator that runs it
// honestly, so the evidence in a decision record is evidence.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export const sha256 = (text) => createHash('sha256').update(String(text), 'utf8').digest('hex');

/** Pure. Every index at which `needle` occurs in `text`. */
export function occurrences(text, needle) {
  const t = String(text ?? '');
  const n = String(needle ?? '');
  if (!n) return [];
  const at = [];
  for (let i = t.indexOf(n); i !== -1; i = t.indexOf(n, i + 1)) at.push(i);
  return at;
}

/**
 * Pure. Patch `text` for one break, or say exactly why it cannot be patched.
 * Returns { ok: true, text } or { ok: false, why }. It never guesses: a find
 * string that is absent or repeated is refused rather than applied to a
 * best-guess location, because the proof's whole value is knowing WHICH line
 * was broken.
 */
export function applyBreak(text, brk) {
  const { find, replace, name } = brk || {};
  const label = name ? `break "${name}"` : 'break';
  if (typeof find !== 'string' || !find) return { ok: false, why: `${label} has no "find" string` };
  if (typeof replace !== 'string') return { ok: false, why: `${label} has no "replace" string` };
  if (replace === find) return { ok: false, why: `${label} replaces its find string with itself — a no-op cannot break anything` };
  const at = occurrences(text, find);
  if (at.length === 0) {
    return { ok: false, why: `${label}: its "find" string is not in the file. The break does not apply, so running it would prove nothing` };
  }
  if (at.length > 1) {
    return { ok: false, why: `${label}: its "find" string appears ${at.length} times. Which one is broken decides what the proof means, so narrow it` };
  }
  return { ok: true, text: text.slice(0, at[0]) + replace + text.slice(at[0] + find.length) };
}

/**
 * Pure. Given what happened, did this break prove anything? Separated from the
 * IO so the refusals can be tested without running a suite or touching a file.
 *
 * `baselineGreen` — was the suite green BEFORE the patch (step 1 above)
 * `brokenRed`     — did the patch turn it red
 * `restored`      — did the file come back byte-identical
 */
export function verdictOf({ baselineGreen, brokenRed, restored }) {
  if (!restored) {
    return { proved: false, fatal: true, reason: 'the file did NOT come back byte-identical after the break — the tree may be left modified, and nothing this run says can be trusted' };
  }
  if (!baselineGreen) {
    return { proved: false, fatal: true, reason: 'the suite was already RED before the break, so this proves nothing about the break. (This is the check that catches a restore which reverted the implementation.)' };
  }
  if (!brokenRed) {
    return { proved: false, fatal: false, reason: 'the suite stayed GREEN with the break in place — the check under test does not catch it' };
  }
  return { proved: true, fatal: false, reason: 'green before, red with the break, restored byte-identical' };
}

/**
 * Run every break in a manifest. IO is injected so the whole flow is testable
 * without a real suite: `run()` returns true for green, `read`/`write` are the
 * file accessors.
 *
 * Returns { ok, results: [{ name, proved, reason, failures }] }.
 */
export function proveBreaks({ breaks, run, read, write }) {
  const results = [];
  let ok = true;
  for (const brk of breaks) {
    const before = read(brk.file);
    const snapshot = { text: before, hash: sha256(before) };
    const patched = applyBreak(before, brk);
    if (!patched.ok) {
      results.push({ name: brk.name, proved: false, fatal: true, reason: patched.why });
      ok = false;
      // Nothing was written, so there is nothing to restore; the next break is
      // independent and still worth running.
      continue;
    }

    // Step 1, and the reason this tool exists: the baseline is measured for
    // EVERY break, not once at the top. A break that restores badly, or an
    // unrelated edit landing mid-run, shows up here instead of being read as a
    // catch three breaks later.
    const baselineGreen = run({ phase: 'baseline', brk });

    write(brk.file, patched.text);
    const broken = run({ phase: 'broken', brk });

    // Step 2: restore from the snapshot taken above — never from git.
    write(brk.file, snapshot.text);
    const after = read(brk.file);
    const restored = sha256(after) === snapshot.hash;

    const verdict = verdictOf({ baselineGreen, brokenRed: broken === false, restored });
    results.push({ name: brk.name, file: brk.file, ...verdict });
    if (!verdict.proved) ok = false;
    if (verdict.fatal && !restored) break; // never keep patching a tree we cannot restore
  }
  return { ok, results };
}

/** The real suite runner: vitest over the manifest's files, green = true. */
function vitestRunner(appDir, suite) {
  return () => {
    const r = spawnSync('npx', ['vitest', 'run', ...suite, '--reporter=basic'], {
      cwd: appDir, env: { ...process.env, CI: '1' }, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    });
    return r.status === 0;
  };
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('prove-it-catches.mjs');
if (invokedDirectly) {
  const arg = (flag) => {
    const i = process.argv.indexOf(flag);
    return i === -1 ? null : process.argv[i + 1];
  };
  const manifestPath = arg('--manifest');
  if (!manifestPath) {
    console.error('usage: node scripts/prove-it-catches.mjs --manifest <path to .json>');
    console.error('  { "suite": ["src/__tests__/x.test.js"],');
    console.error('    "breaks": [ { "name": "...", "file": "scripts/x.mjs", "find": "...", "replace": "..." } ] }');
    process.exit(2);
  }
  const root = join(HERE, '..');
  const manifest = JSON.parse(readFileSync(resolve(manifestPath), 'utf8'));
  const suite = manifest.suite || [];
  const breaks = manifest.breaks || [];
  if (!suite.length || !breaks.length) {
    console.error('prove-it-catches: a manifest needs at least one suite file and one break.');
    process.exit(2);
  }
  const runSuite = vitestRunner(join(root, 'app'), suite);
  let n = 0;
  const { ok, results } = proveBreaks({
    breaks,
    run: ({ phase, brk }) => {
      if (phase === 'baseline') n += 1;
      process.stdout.write(`  [${n}] ${brk.name} — ${phase}... `);
      const green = runSuite();
      process.stdout.write(`${green ? 'green' : 'red'}\n`);
      return green;
    },
    read: (f) => readFileSync(join(root, f), 'utf8'),
    write: (f, t) => writeFileSync(join(root, f), t, 'utf8'),
  });

  console.log('');
  for (const r of results) {
    console.log(`${r.proved ? 'PROVED  ' : 'UNPROVEN'} ${r.name}\n           ${r.reason}`);
  }
  // Step 5: the tree is green when this run ends, or the run did not succeed.
  process.stdout.write('\nfinal check — the tree is as it was... ');
  const finalGreen = runSuite();
  console.log(finalGreen ? 'green' : 'RED');
  if (!finalGreen) {
    console.error('prove-it-catches: the suite is RED after restoring every break. The tree is NOT as it was found; read `git diff` before trusting anything above.');
    process.exit(1);
  }
  console.log(ok
    ? `\nall ${results.length} break(s) proven to catch, and the tree is byte-identical.`
    : `\n${results.filter((r) => !r.proved).length} of ${results.length} break(s) NOT proven — read the reasons above.`);
  process.exit(ok ? 0 : 1);
}
