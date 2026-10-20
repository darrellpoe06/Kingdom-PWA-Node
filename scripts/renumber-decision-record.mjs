#!/usr/bin/env node
// =============================================================================
// renumber-decision-record — move one decision off a number another took
// =============================================================================
// WHY THIS EXISTS, MEASURED. On 2026-10-14 a single session paid this cost FOUR
// times by hand: DR-1003 -> 1004 (main's #2153 took 1003), DR-1013 -> 1016
// (main took 1013 and 1014 while the branch was under test), DR-1016 -> 1019
// (#2165 merged and took 1016), and DR-1017 -> 1018 (a concurrent branch held
// 1017). Each renumber is the same four edits — rename the file, relink its
// INDEX row, rewrite every citation of it, move the pointer — and each one was
// done with a throwaway one-liner. That is recurring friction, which this house
// turns into a fix rather than paying again (DR-0075).
//
// WHAT THIS IS NOT. It does NOT change resolve-ledger-conflicts.mjs, whose
// refusal on a number collision is deliberate: DR-0644 made it refuse because
// folding two rows with one number silently DELETED a real decision from the
// ledger, twice, on 2026-10-06. That refusal stays exactly as it is. This
// script is the other half of the remedy the refusal already names in its own
// message ("Renumber the newer file to DR-nnnn ... then run this again") — it
// performs that rename, and nothing else.
//
// WHAT IT TOUCHES. The decision file's name; its own `# DR-nnnn:` heading; the
// INDEX row's link and label; and every citation of the old id across docs/,
// app/src/, scripts/, infra/ and .github/. The pointer is left to
// resolve-ledger-conflicts.mjs, which already owns it and computes it from the
// files on disk.
//
// WHAT IT REFUSES, so it can never be the thing that loses a decision:
//   · a target number that any file on disk already holds — the whole point is
//     to leave a collision, not create one;
//   · a source number no file holds;
//   · a source id that two files hold WITHOUT being told which record moves.
//     Straight after a base merge BOTH records are on disk, so the tool asks to
//     be told rather than guessing: pass --file. FOUND BY USING IT.
//
// AND THE HARD PART, ALSO FOUND BY USING IT. When two records hold one number,
// a bare `DR-nnnn` citation is GENUINELY AMBIGUOUS — it may mean either record
// — so rewriting every occurrence corrupts the other decision's citations. The
// first real invocation did exactly that: it renamed this record correctly and
// then rewrote main's own DR-1020 record and four of main's files, turning
// their legitimate ids into the new number. So the rewrite is scoped by what is
// UNAMBIGUOUS:
//   · the moved record's own `# DR-nnnn:` heading, inside the moved file only;
//   · references that name the FILE (`DR-nnnn-its-slug.md`), anywhere;
//   · the moved record's INDEX row, found by its LINK to the old file name
//     rather than by the bare id;
//   · and bare ids elsewhere ONLY when a single record holds the number, which
//     is the pre-merge case and is unambiguous by definition.
// When two hold it, every remaining bare citation is REPORTED for a person to
// read, never rewritten.
//   · a dirty working tree for the files it would rewrite, unless --force.
// Every refusal exits non-zero and changes nothing.
//
// Pure where it can be: planRenumber() takes its data as arguments and returns
// the edits, so the decisions are testable without touching a repository.
import { readFileSync, writeFileSync, readdirSync, existsSync, renameSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DECISIONS_DIR = 'docs/decisions';
export const INDEX_REL = 'docs/decisions/INDEX.md';

// Where a decision id can be cited. Kept in step with decision-citation-guard's
// own scope, plus docs/ (which that guard does not read but this must rewrite).
//
// app/functions WAS MISSING, found by using it (2026-10-17, DR-1092). Moving
// that record off 1090 rewrote its INDEX row, its gate, and both workflows —
// and left the stale id in app/functions/_lib/funnel-proxy.js, the factory the
// record is ABOUT. Every same-origin NAS road lives in app/functions and none
// of it is under app/src, so the one directory the change touched hardest was
// the one directory the sweep could not see.
export const CITATION_DIRS = ['docs', 'app/src', 'app/functions', 'scripts', 'infra', '.github'];
const TEXT_EXT = /\.(md|mjs|js|jsx|ts|tsx|json|sql|sh|yml|yaml|py)$/;

export const pad = (n) => String(n).padStart(4, '0');
export const idOf = (n) => `DR-${pad(n)}`;

/** Every DR file on disk, as number -> file name. */
export function recordsOnDisk(dir) {
  const out = new Map();
  for (const f of readdirSync(dir)) {
    const m = /^DR-(\d{4})-(.+)\.md$/.exec(f);
    if (!m) continue;
    const n = Number(m[1]);
    if (out.has(n)) out.set(n, [].concat(out.get(n), f));
    else out.set(n, f);
  }
  return out;
}

/** The lowest number no file on disk holds, at or above `from`. */
export function firstFreeNumber(onDisk, from) {
  let n = from;
  while (onDisk.has(n)) n += 1;
  return n;
}

/**
 * Decide the rename without performing it. Returns {from, to, oldFile, newFile}
 * or throws with the reason, so a refusal is testable and has one wording.
 */
export function planRenumber(onDisk, from, to = null, { file = null } = {}) {
  const have = onDisk.get(from);
  if (!have) throw new Error(`renumber: no decision file holds ${idOf(from)}`);
  let moving;
  if (Array.isArray(have)) {
    // Straight after a base merge BOTH records sit on disk, which is the case
    // this tool is FOR rather than a broken ledger. It will not guess which one
    // moves; it asks. (The first real use of this script refused here, wrongly.)
    if (!file) {
      throw new Error(
        `renumber: two files hold ${idOf(from)} — ${have.join(' and ')}. `
        + 'That is expected right after a base merge, and this will not guess which one moves: '
        + `name it, e.g. --file ${have[0]}`);
    }
    if (!have.includes(file)) {
      throw new Error(`renumber: --file ${file} does not hold ${idOf(from)}; the files that do are ${have.join(' and ')}`);
    }
    moving = file;
  } else {
    if (file && file !== have) {
      throw new Error(`renumber: --file ${file} does not hold ${idOf(from)}; ${have} does`);
    }
    moving = have;
  }
  const target = to ?? firstFreeNumber(onDisk, from + 1);
  if (target === from) throw new Error(`renumber: ${idOf(from)} is already its own number`);
  if (onDisk.has(target)) {
    throw new Error(
      `renumber: ${idOf(target)} is already held by ${onDisk.get(target)}. `
      + 'Renumbering onto it would create the collision this exists to clear.');
  }
  const slug = /^DR-\d{4}-(.+)\.md$/.exec(moving)[1];
  return { from, to: target, oldFile: moving, newFile: `DR-${pad(target)}-${slug}.md` };
}

/**
 * Rewrite one file's text for the rename. Returns the new text, or null when
 * nothing changed.
 *
 * `exclusive` says whether this number belongs to the moved record ALONE. When
 * it does (the pre-merge case) a bare id is unambiguous and is rewritten. When
 * it does not (two records hold it, straight after a merge) only the file name
 * is rewritten, because a bare id may belong to the other record.
 */
export function rewriteText(text, plan, { exclusive = true } = {}) {
  const oldId = idOf(plan.from);
  const newId = idOf(plan.to);
  let next = text.split(plan.oldFile).join(plan.newFile);
  if (exclusive) {
    // The id itself, but never as part of a longer number (DR-1016 must not
    // match inside DR-10160; the ledger reaches five digits eventually).
    next = next.replace(new RegExp(`${oldId}(?!\\d)`, 'g'), newId);
  }
  return next === text ? null : next;
}

/** The moved record's own INDEX row, found by its link rather than its id. */
export function rewriteIndexRow(text, plan) {
  const newId = idOf(plan.to);
  const lines = text.split('\n');
  let hit = false;
  const out = lines.map((line) => {
    if (!line.startsWith('| [DR-') || !line.includes(plan.newFile)) return line;
    hit = true;
    return line.replace(/^\| \[DR-\d{4}\]/, `| [${newId}]`);
  });
  return hit ? out.join('\n') : null;
}

/** Bare citations of a number two records share: reported, never rewritten. */
export function ambiguousCitations(text, plan) {
  const oldId = idOf(plan.from);
  const re = new RegExp(`${oldId}(?!\\d)`, 'g');
  return (text.match(re) || []).length;
}

function listTextFiles(root, rel) {
  const abs = join(root, rel);
  if (!existsSync(abs)) return [];
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (TEXT_EXT.test(e.name)) out.push(p);
    }
  };
  walk(abs);
  return out;
}

function gitDirty(cwd, paths) {
  try {
    const out = execFileSync('git', ['status', '--porcelain', '--', ...paths], { cwd, encoding: 'utf8' });
    return out.split('\n').map((l) => l.slice(3)).filter(Boolean);
  } catch {
    return [];
  }
}

export function renumberInTree(cwd, from, to, { force = false, file = null, log = console.log } = {}) {
  const dir = join(cwd, DECISIONS_DIR);
  const plan = planRenumber(recordsOnDisk(dir), from, to, { file });

  const oldAbs = join(dir, plan.oldFile);
  const newAbs = join(dir, plan.newFile);

  const files = new Set([join(cwd, INDEX_REL), oldAbs]);
  for (const d of CITATION_DIRS) for (const f of listTextFiles(cwd, d)) files.add(f);

  const oldId = idOf(plan.from);
  // Does the moved record hold this number ALONE? If another file holds it too
  // (the post-merge case), bare ids are ambiguous and are left for a person.
  const holders = recordsOnDisk(dir).get(from);
  const exclusive = !Array.isArray(holders);
  const touched = [];
  for (const f of files) {
    if (f === oldAbs) continue; // renamed below, then rewritten at its new path
    let text;
    try { text = readFileSync(f, 'utf8'); } catch { continue; }
    if (!text.includes(oldId) && !text.includes(plan.oldFile)) continue;
    touched.push(f);
  }

  if (!force) {
    const dirty = gitDirty(cwd, [DECISIONS_DIR, ...CITATION_DIRS]);
    const clash = dirty.filter((p) => touched.some((t) => relative(cwd, t) === p) || p === `${DECISIONS_DIR}/${plan.oldFile}`);
    if (clash.length) {
      throw new Error(
        `renumber: these files it would rewrite already have uncommitted changes:\n  ${clash.join('\n  ')}\n`
        + 'Commit or stash them first so the rename is reviewable on its own, or pass --force.');
    }
  }

  renameSync(oldAbs, newAbs);
  // The moved record's OWN text: its heading and self-references are its own,
  // so a bare id inside it is unambiguous even when another record shares the
  // number.
  const body = rewriteText(readFileSync(newAbs, 'utf8'), plan, { exclusive: true });
  if (body !== null) writeFileSync(newAbs, body, 'utf8');
  log(`renamed  ${plan.oldFile}`);
  log(`      -> ${plan.newFile}`);

  let rewrote = 0;
  let ambiguous = 0;
  const ambiguousFiles = [];
  for (const f of touched) {
    const before = readFileSync(f, 'utf8');
    let next = rewriteText(before, plan, { exclusive }) ?? before;
    if (f === join(cwd, INDEX_REL)) next = rewriteIndexRow(next, plan) ?? next;
    if (next !== before) {
      writeFileSync(f, next, 'utf8');
      rewrote += 1;
      log(`rewrote  ${relative(cwd, f)}`);
    }
    if (!exclusive) {
      const left = ambiguousCitations(next, plan);
      if (left) { ambiguous += left; ambiguousFiles.push(`${relative(cwd, f)} (${left})`); }
    }
  }
  log(`renumber: ${oldId} -> ${idOf(plan.to)}; 1 file renamed, ${rewrote} file(s) rewritten.`);
  if (!exclusive) {
    log(`NOT rewritten: ${ambiguous} bare ${oldId} citation(s) remain, because two records held that`);
    log('number and a bare id may belong to either. Read these and fix the ones that meant the moved record:');
    for (const a of ambiguousFiles) log(`  ${a}`);
  }
  log('The pointer is resolve-ledger-conflicts.mjs\'s to set — run it next.');
  return { ...plan, rewrote, ambiguous, ambiguousFiles };
}

/**
 * The command line, read. Exported because it was NOT, and the defect below
 * lived in an `if (invokedDirectly)` block no test could reach: everything
 * this file is careful about was proven, and the three lines that decide WHICH
 * NUMBER MOVES were the only unproven ones in it.
 *
 * The bug, found by using it (2026-10-17, DR-1092): the filter skips the value
 * belonging to `--file`, and with the flag absent `indexOf` returns -1, so
 * `k !== fi + 1` skipped ARGUMENT ZERO — the source number. `renumber 1092
 * 1094` read 1094 as the source and refused with "no decision file holds
 * DR-1094", which blames the ledger for a parse. Not computing an index when
 * there is no flag to skip is the whole fix.
 */
export function parseArgs(args) {
  const force = args.includes('--force');
  const fi = args.indexOf('--file');
  const file = fi === -1 ? null : args[fi + 1] || null;
  const fileValueAt = fi === -1 ? -1 : fi + 1;
  const nums = args.filter((a, k) => /^\d{1,4}$/.test(a.replace(/^DR-/, '')) && k !== fileValueAt)
    .map((a) => Number(a.replace(/^DR-/, '')));
  return { from: nums[0] ?? null, to: nums[1] ?? null, file, force };
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('renumber-decision-record.mjs');
if (invokedDirectly) {
  const { from, to, file, force } = parseArgs(process.argv.slice(2));
  if (from === null) {
    console.error('usage: renumber-decision-record.mjs <from> [to] [--file NAME.md] [--force]');
    console.error('  <from>  the number a decision must move OFF');
    console.error('  [to]    the number to take; omitted, the lowest free one above <from>');
    console.error('  --file  which record moves, when two hold <from> (the usual case after a merge)');
    process.exit(2);
  }
  try {
    renumberInTree(join(HERE, '..'), from, to, { force, file });
  } catch (e) {
    console.error(String(e.message || e));
    process.exit(1);
  }
}
