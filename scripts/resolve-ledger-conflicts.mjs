#!/usr/bin/env node
// =============================================================================
// resolve-ledger-conflicts — the two ledger files merge themselves (DR-0644)
// =============================================================================
// MEASURED 2026-09-24 23:15 UTC: every open agent PR (#1782, #1793, #1795,
// #1796 ...) was green on CI and could not merge — GitHub's update-branch said
// "merge conflict between base and head" on all four, and the conflict was only
// ever in the two files nearly every PR touches:
//
//   docs/decisions/INDEX.md          every PR appends a DR row and edits the
//                                    single "**Next ID:** DR-NNNN." line
//   app/src/lib/legibility-health.json   generated; must be byte-identical to
//                                    a fresh `legibility-guard.mjs --health`
//
// Each merge to main knocked every other PR out of date, the same two files
// were resolved BY HAND, CI re-ran (~20 min), and another merge landed in the
// meantime. Hand resolution also once shipped conflict markers inside INDEX.md.
//
// This script resolves ONLY those two files, and refuses if anything else is
// in conflict (a real conflict is a human's / the owning agent's call).
//
//   INDEX.md   union of every line from both sides; DR rows de-duplicated by
//              id (first kept, table order kept); every "**Next ID:**" line
//              folded into ONE, the pointer RECOMPUTED as newest-DR-file-on-
//              disk + 1, every parenthetical annotation from both sides kept.
//   health     regenerated with `node scripts/legibility-guard.mjs --health`.
//
// Then it VERIFIES, loudly: `node scripts/business-systems-guard.mjs` must
// pass, and no merge-touched file may carry a conflict marker.
//
// Modes:
//   node scripts/resolve-ledger-conflicts.mjs
//       Run in a working tree mid-merge (after `git merge --no-commit`).
//       Exit 0 = resolved + verified (files staged); 2 = refused (other files
//       conflict; they are named); 1 = verification failed.
//   node scripts/resolve-ledger-conflicts.mjs --driver %O %A %B
//       Git merge-driver mode for INDEX.md (.gitattributes `merge=dr-ledger`).
//       Writes the resolved text to %A. The pointer here is rows-max + 1
//       (the tree is mid-checkout, so disk is not yet authoritative); the
//       post-merge mode above re-derives it from disk.
//
// Pure functions exported for vitest (proven-to-catch in
// app/src/__tests__/resolve-ledger-conflicts.test.js).
// =============================================================================
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const LEDGER_INDEX = 'docs/decisions/INDEX.md';
export const LEGIBILITY_HEALTH = 'app/src/lib/legibility-health.json';
export const LEDGER_FILES = [LEDGER_INDEX, LEGIBILITY_HEALTH];

const ROW_RE = /^\| \[DR-(\d{4})\]/;
const NEXT_RE = /^\*\*Next ID:\*\*/;
const MARKER_RE = /^(<{7}|>{7}|\|{7})(?: |$)/;

// -----------------------------------------------------------------------------
// Pure text functions.
// -----------------------------------------------------------------------------

/** Lines (1-based numbers) that are conflict markers. `=======` alone is not
 * counted (it is legal Markdown); the opening/closing markers always pair it. */
export function conflictMarkerLines(text) {
  const out = [];
  text.split('\n').forEach((line, i) => { if (MARKER_RE.test(line)) out.push(i + 1); });
  return out;
}

/**
 * The union of two line sequences that keeps BOTH orders: the shortest common
 * supersequence over their longest common subsequence. Lines the two sides
 * share anchor the merge, so a row theirs added before a shared blank line +
 * pointer stays above them (a plain "ours, then theirs" put it BELOW the
 * pointer — caught in the sweep simulation, 2026-09-24). Blank lines only one
 * side has are taken from ours only.
 */
export function unionKeepingOrder(ours, theirs) {
  const n = ours.length; const m = theirs.length;
  const L = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      L[i][j] = ours[i] === theirs[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    }
  }
  const out = [];
  const have = new Set(ours);
  const takeTheirs = (line) => { if (line.trim() !== '' && !have.has(line)) out.push(line); };
  let i = 0; let j = 0;
  while (i < n && j < m) {
    if (ours[i] === theirs[j]) { out.push(ours[i]); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) out.push(ours[i++]);
    else takeTheirs(theirs[j++]);
  }
  while (i < n) out.push(ours[i++]);
  while (j < m) takeTheirs(theirs[j++]);
  return out;
}

/**
 * Replace every conflict hunk with the order-keeping UNION of its two sides
 * (unionKeepingOrder). A diff3 base section (`|||||||`) is dropped. Throws on
 * an unbalanced hunk rather than guess.
 */
export function unionConflictHunks(text) {
  const lines = text.split('\n');
  const out = [];
  let state = 'out';
  let ours = []; let theirs = [];
  for (const line of lines) {
    if (state === 'out') {
      if (/^<{7}(?: |$)/.test(line)) { state = 'ours'; ours = []; theirs = []; continue; }
      if (/^(>{7}|\|{7})(?: |$)/.test(line)) throw new Error(`unbalanced conflict marker: ${line.slice(0, 40)}`);
      out.push(line);
    } else if (state === 'ours') {
      if (/^\|{7}(?: |$)/.test(line)) { state = 'base'; continue; }
      if (line === '=======') { state = 'theirs'; continue; }
      if (/^(<{7}|>{7})(?: |$)/.test(line)) throw new Error(`unbalanced conflict marker: ${line.slice(0, 40)}`);
      ours.push(line);
    } else if (state === 'base') {
      if (line === '=======') { state = 'theirs'; continue; }
      if (/^(<{7}|>{7})(?: |$)/.test(line)) throw new Error(`unbalanced conflict marker: ${line.slice(0, 40)}`);
    } else if (state === 'theirs') {
      if (/^>{7}(?: |$)/.test(line)) {
        out.push(...unionKeepingOrder(ours, theirs));
        state = 'out';
        continue;
      }
      if (/^(<{7}|\|{7})(?: |$)/.test(line) || line === '=======') throw new Error(`unbalanced conflict marker: ${line.slice(0, 40)}`);
      theirs.push(line);
    }
  }
  if (state !== 'out') throw new Error('conflict hunk never closed (no >>>>>>> marker)');
  return out.join('\n');
}

/** Split the text after "**Next ID:** DR-NNNN." into its annotation groups:
 * each balanced top-level "( ... )" is one group; loose text between groups is
 * kept as its own group. Unbalanced text is kept whole (never dropped). */
export function nextIdAnnotations(line) {
  const rest = line.replace(/^\*\*Next ID:\*\*\s*(?:DR-\d{4})?\.?\s*/, '');
  const groups = [];
  let depth = 0; let buf = ''; let loose = '';
  for (const ch of rest) {
    if (depth === 0) {
      if (ch === '(') {
        if (loose.trim()) groups.push(loose.trim());
        loose = ''; buf = '('; depth = 1;
      } else loose += ch;
    } else {
      buf += ch;
      if (ch === '(') depth++;
      else if (ch === ')') { depth--; if (depth === 0) { groups.push(buf); buf = ''; } }
    }
  }
  if (depth !== 0) loose += buf; // unbalanced tail: keep it verbatim
  if (loose.trim()) groups.push(loose.trim());
  return groups;
}

/** Union annotation lists: the first list's order, then each later list's new
 * groups — the ones that come BEFORE its first shared group go to the front
 * (they are the newest, as every PR prepends), the rest to the end. */
export function unionAnnotations(lists) {
  let merged = [...(lists[0] || [])];
  for (const list of lists.slice(1)) {
    const have = new Set(merged);
    const firstShared = list.findIndex((g) => have.has(g));
    const head = []; const tail = [];
    list.forEach((g, i) => {
      if (have.has(g) || head.includes(g) || tail.includes(g)) return;
      (firstShared === -1 || i < firstShared ? head : tail).push(g);
    });
    merged = [...head, ...merged, ...tail];
  }
  return merged;
}

export function maxRowId(text) {
  let max = 0;
  for (const line of text.split('\n')) {
    const m = ROW_RE.exec(line);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

/**
 * Normalize a (marker-free) INDEX.md: DR rows de-duplicated by id (first kept),
 * all "**Next ID:**" lines folded into one at the first one's position with the
 * pointer set to `nextId` (default: highest row id + 1).
 */
export function normalizeLedger(text, { nextId } = {}) {
  if (conflictMarkerLines(text).length) throw new Error('normalizeLedger: text still carries conflict markers');
  const lines = text.split('\n');
  const seen = new Set();
  const removedRows = [];
  const out = [];
  const annotationLists = [];
  let nextAt = -1;
  for (const line of lines) {
    const row = ROW_RE.exec(line);
    if (row) {
      if (seen.has(row[1])) { removedRows.push(`DR-${row[1]}`); continue; }
      seen.add(row[1]);
      out.push(line);
      continue;
    }
    if (NEXT_RE.test(line)) {
      annotationLists.push(nextIdAnnotations(line));
      if (nextAt === -1) { nextAt = out.length; out.push(line); }
      continue;
    }
    out.push(line);
  }
  const id = nextId ?? maxRowId(text) + 1;
  const pointer = `**Next ID:** DR-${String(id).padStart(4, '0')}.`;
  if (nextAt === -1) throw new Error('normalizeLedger: INDEX.md has no "**Next ID:**" line');
  const ann = unionAnnotations(annotationLists);
  out[nextAt] = ann.length ? `${pointer} ${ann.join(' ')}` : pointer;
  return { text: out.join('\n'), removedRows, foldedNextIdLines: annotationLists.length };
}

/** The whole INDEX resolution: union the hunks, then normalize. */
export function resolveLedgerText(conflictedText, { nextId } = {}) {
  return normalizeLedger(unionConflictHunks(conflictedText), { nextId });
}

export function nextIdFromDisk(decisionsDir) {
  let max = 0;
  for (const f of readdirSync(decisionsDir)) {
    const m = /^DR-(\d{4})-/.exec(f);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

// -----------------------------------------------------------------------------
// Git plumbing.
// -----------------------------------------------------------------------------
function git(args, opts = {}) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
}

function stage(n, path, cwd) {
  const r = spawnSync('git', ['show', `:${n}:${path}`], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : null;
}

/** 3-way text merge of the index stages with standard markers (no config). */
function mergeStages(path, cwd) {
  const base = stage(1, path, cwd) ?? '';
  const ours = stage(2, path, cwd);
  const theirs = stage(3, path, cwd);
  if (ours === null || theirs === null) return null; // modify/delete: not ours to guess
  const dir = mkdtempSync(join(tmpdir(), 'ledger-'));
  try {
    writeFileSync(join(dir, 'ours'), ours);
    writeFileSync(join(dir, 'base'), base);
    writeFileSync(join(dir, 'theirs'), theirs);
    const r = spawnSync('git', ['merge-file', '-p', '-L', 'ours', '-L', 'base', '-L', 'theirs',
      join(dir, 'ours'), join(dir, 'base'), join(dir, 'theirs')], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.status < 0 || r.status === null || r.status > 127) throw new Error(`git merge-file failed: ${r.stderr}`);
    return r.stdout;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

function isTextFile(abs) {
  try {
    if (!statSync(abs).isFile()) return false;
    const buf = readFileSync(abs);
    return !buf.subarray(0, 8000).includes(0);
  } catch { return false; }
}

/** Files the merge touched (staged vs HEAD, plus the unstaged working tree). */
function touchedFiles(cwd) {
  const a = git(['diff', '--cached', '--name-only'], { cwd }).split('\n');
  const b = git(['diff', '--name-only'], { cwd }).split('\n');
  return [...new Set([...a, ...b].filter(Boolean))];
}

export function resolveInTree(cwd, { log = console.log, err = console.error } = {}) {
  const unmerged = [...new Set(git(['diff', '--name-only', '--diff-filter=U'], { cwd }).split('\n').filter(Boolean))];
  const others = unmerged.filter((f) => !LEDGER_FILES.includes(f));
  if (others.length) {
    err('resolve-ledger-conflicts: REFUSED — files other than the two ledger files are in conflict:');
    for (const f of others) err(`  - ${f}`);
    return { code: 2, others };
  }

  // 1. INDEX.md
  const indexAbs = join(cwd, LEDGER_INDEX);
  if (existsSync(indexAbs) || unmerged.includes(LEDGER_INDEX)) {
    let text;
    if (unmerged.includes(LEDGER_INDEX)) {
      text = mergeStages(LEDGER_INDEX, cwd);
      if (text === null) {
        err(`resolve-ledger-conflicts: REFUSED — ${LEDGER_INDEX} was deleted on one side; that is a human's call.`);
        return { code: 2, others: [LEDGER_INDEX] };
      }
    } else {
      text = readFileSync(indexAbs, 'utf8');
    }
    const nextId = nextIdFromDisk(join(cwd, 'docs/decisions'));
    const r = resolveLedgerText(text, { nextId });
    writeFileSync(indexAbs, r.text);
    git(['add', '--', LEDGER_INDEX], { cwd });
    log(`INDEX.md: pointer DR-${String(nextId).padStart(4, '0')}, ${r.foldedNextIdLines} Next-ID line(s) folded into one` +
      (r.removedRows.length ? `, duplicate rows dropped: ${r.removedRows.join(', ')}` : ', no duplicate rows') + '.');
  }

  // 2. legibility-health.json — always regenerated from the merged sources.
  const guard = join(cwd, 'scripts/legibility-guard.mjs');
  if (existsSync(guard)) {
    if (unmerged.includes(LEGIBILITY_HEALTH)) git(['checkout', '--ours', '--', LEGIBILITY_HEALTH], { cwd });
    const r = spawnSync(process.execPath, [guard, '--health'], { cwd, encoding: 'utf8' });
    if (r.status !== 0) {
      err(`resolve-ledger-conflicts: FAIL — legibility-guard --health exited ${r.status}\n${r.stdout}${r.stderr}`);
      return { code: 1 };
    }
    git(['add', '--', LEGIBILITY_HEALTH], { cwd });
    log(`legibility-health.json: regenerated (${r.stdout.trim().split('\n').pop()})`);
  } else if (unmerged.includes(LEGIBILITY_HEALTH)) {
    err('resolve-ledger-conflicts: FAIL — legibility-health.json conflicts but scripts/legibility-guard.mjs is missing.');
    return { code: 1 };
  }

  // 3. Verify, loudly.
  const still = git(['diff', '--name-only', '--diff-filter=U'], { cwd }).split('\n').filter(Boolean);
  if (still.length) {
    err(`resolve-ledger-conflicts: FAIL — still unmerged: ${still.join(', ')}`);
    return { code: 1 };
  }
  const marked = [];
  for (const f of touchedFiles(cwd)) {
    const abs = join(cwd, f);
    if (!isTextFile(abs)) continue;
    const at = conflictMarkerLines(readFileSync(abs, 'utf8'));
    if (at.length) marked.push(`${f}:${at.join(',')}`);
  }
  if (marked.length) {
    err('resolve-ledger-conflicts: FAIL — conflict markers left behind:');
    for (const m of marked) err(`  - ${m}`);
    return { code: 1, marked };
  }
  const bsg = join(cwd, 'scripts/business-systems-guard.mjs');
  if (!existsSync(bsg)) {
    err('resolve-ledger-conflicts: FAIL — scripts/business-systems-guard.mjs is missing; the ledger cannot be verified.');
    return { code: 1 };
  }
  const g = spawnSync(process.execPath, [bsg], { cwd, encoding: 'utf8' });
  if (g.status !== 0) {
    err(`resolve-ledger-conflicts: FAIL — business-systems-guard did not pass:\n${g.stdout}${g.stderr}`);
    return { code: 1 };
  }
  log(g.stdout.trim());
  log('resolve-ledger-conflicts: OK — ledger files resolved, zero conflict markers, guard green.');
  return { code: 0 };
}

// -----------------------------------------------------------------------------
// CLI.
// -----------------------------------------------------------------------------
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const args = process.argv.slice(2);
  if (args[0] === '--driver') {
    // git merge driver: %O (base) %A (ours; the result goes here) %B (theirs)
    const [, O, A, B] = args;
    const r = spawnSync('git', ['merge-file', '-p', '-L', 'ours', '-L', 'base', '-L', 'theirs', A, O, B],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.status === null || r.status > 127) { console.error(`dr-ledger driver: git merge-file failed: ${r.stderr}`); process.exit(1); }
    try {
      writeFileSync(A, resolveLedgerText(r.stdout).text);
      process.exit(0);
    } catch (e) {
      // Leave a normal conflict for a human rather than write a guess.
      console.error(`dr-ledger driver: ${e.message}`);
      writeFileSync(A, r.stdout);
      process.exit(1);
    }
  }
  const cwd = git(['rev-parse', '--show-toplevel']).trim();
  process.exit(resolveInTree(cwd).code);
}
