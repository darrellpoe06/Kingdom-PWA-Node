#!/usr/bin/env node
// =============================================================================
// re-review-ratchet-guard — a parked thing's date is a promise, so it is checked
// =============================================================================
// DR-0075, in Darrell's own words: "everything must get better perpetually; if
// not, why — and if the why makes sense it's a decision and a re-review date
// that makes sense for the issue." The rule's teeth are the last clause:
// "Nothing parked is parked forever; the date is the promise it is revisited."
//
// NOTHING CHECKED WHETHER THE DATE HAD PASSED. The one gate that reads these
// dates checks only that they are SHAPED like a date:
//
//   system-flow-graph.mjs:205
//   const openOk = (o) => !!(o && String(o.blocker || '').trim()
//                            && /^\d{4}-\d{2}-\d{2}$/.test(String(o.reReview || '')));
//
// A format check is not a date check, so a parked item keeps its promise
// forever and the lane stays green. Measured 2026-11-12: of 25 machine-readable
// re-review dates, EIGHT were already past due, the oldest by 103 days — and
// that oldest one is a real accessibility debt (brand rust on the cream base at
// ~4.2-4.4:1, sub-AA for every reader in a light theme), not a bookkeeping nit.
//
// WHAT THIS GATE HOLDS
//   1. Every past-due date is in the baseline. A NEW one fails the build, so
//      today's drift stops today instead of waiting for a clean slate.
//   2. The baseline may only SHRINK. `maxOverdue` is a down-only ratchet, the
//      same shape as the YAML line ceiling (DR-1342/DR-1343), so a ninth
//      overdue item cannot be admitted by editing the baseline — it must be
//      re-reviewed, or clear one that is already there.
//   3. A baseline entry that is no longer past due must be REMOVED. Keeping a
//      cleared promise on the list is how a baseline turns into furniture.
//   4. Every entry says what would clear it. Parked is never silent about its
//      blocker.
//
// WHY PROSE IS OUT OF SCOPE, SAID RATHER THAN SILENTLY OMITTED. docs/ carries
// 2,356 `re-review:` dates and 1,892 of them are past due — but that is not
// 1,892 open promises, and a gate over them would hand the house a number
// nobody can act on. Most are HISTORY: a record written in July carrying
// `re-review: 2026-08-01` whose review happened and was written down in a later
// record, and 314 of them are INDEX rows quoting those same record dates back.
// An open promise is one where the thing is still PARKED, and that state lives
// in code and config — a disabled service, a registry gap, a guard allow-list —
// which is what this gate reads. If the records' prose dates are ever to be
// held, it needs a way to tell a live promise from a finished one; that is a
// different instrument and it does not exist yet (DR-1444 carries the date).
//
// Proven to catch in re-review-ratchet-guard.test.js (DR-0076 section 3).
import { readFileSync, existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
export const BASELINE = 'scripts/re-review-baseline.json';

// Where a PARKED state lives: code and config, never prose (see the header).
const ROOTS = ['scripts', 'infra', 'app/src/lib'];
const READABLE = /\.(mjs|js|json)$/;
const SKIP_DIRS = new Set(['node_modules', '__tests__', 'dist', 'build', '.git']);

// Both spellings: a bare key with single quotes, and a JSON key with double
// quotes. (The example is described rather than written out: an earlier draft
// spelled a real date here and the guard dutifully reported ITSELF.)
const DATE_RE = /reReview["']?\s*:\s*["'](\d{4}-\d{2}-\d{2})["']/g;

export function today() {
  const t = process.env.RE_REVIEW_TODAY;
  return t && /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : new Date().toISOString().slice(0, 10);
}

function walk(dir, out) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (SKIP_DIRS.has(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (READABLE.test(e)) out.push(p);
  }
  return out;
}

/** Every machine-readable re-review date in the tree, with its file. */
export function collect(root = ROOT) {
  const files = [];
  for (const r of ROOTS) walk(join(root, r), files);
  const found = [];
  for (const p of files) {
    const rel = relative(root, p).split('\\').join('/');
    // The baseline QUOTES the dates it tracks, and this guard's own header
    // describes them; neither is a parked promise.
    if (rel === BASELINE || rel.endsWith('re-review-ratchet-guard.mjs')) continue;
    const src = readFileSync(p, 'utf8');
    for (const m of src.matchAll(DATE_RE)) found.push({ where: rel, reReview: m[1] });
  }
  return found;
}

/** The findings, given what is in the tree and what the baseline admits. */
export function judge(found, baseline, now) {
  const findings = [];
  const max = Number.isInteger(baseline.maxOverdue) ? baseline.maxOverdue : null;
  const files = Array.isArray(baseline.files) ? baseline.files : [];
  if (max === null) findings.push(`${BASELINE} has no integer maxOverdue — the ratchet has nothing to hold`);

  // What the tree actually carries, per file.
  const overdue = found.filter((f) => f.reReview < now);
  const actual = new Map();
  for (const o of overdue) actual.set(o.where, (actual.get(o.where) || 0) + 1);

  const allowed = new Map();
  for (const f of files) {
    if (!String(f.blockersLiveIn || '').trim()) {
      findings.push(`${BASELINE}: ${f.where} does not say where its blockers live — parked is never silent about its blocker (DR-0075)`);
    }
    if (!Number.isInteger(f.overdue)) {
      findings.push(`${BASELINE}: ${f.where} has no integer overdue count`);
      continue;
    }
    allowed.set(f.where, (allowed.get(f.where) || 0) + f.overdue);
  }

  const sum = [...allowed.values()].reduce((a, b) => a + b, 0);
  if (max !== null && sum !== max) {
    findings.push(
      `${BASELINE}: the per-file counts add to ${sum} but maxOverdue is ${max} — ` + 'the ceiling is the sum of what is parked, so these cannot disagree'
    );
  }

  // RULE 1 — NEW DRIFT FAILS, per file, so one cannot be swapped for another.
  for (const [where, n] of actual) {
    const cap = allowed.get(where);
    if (cap === undefined) {
      findings.push(
        `${where} carries ${n} re-review date(s) that have passed and the file is not in ${BASELINE} — ` +
          'either re-review them and move the dates, or record the file with where its blockers live (DR-0075)'
      );
    } else if (n > cap) {
      findings.push(
        `${where} now has ${n} past-due re-review date(s), up from ${cap} — a promise went past its date and nothing moved it. ` +
          'Re-review it, or clear another in the same file; the ceiling never rises (DR-0075)'
      );
    }
  }

  // RULE 3 — A CLEARED FILE COMES OFF THE LIST, so the baseline cannot become
  // furniture that outlives the work it was tracking.
  for (const [where, cap] of allowed) {
    const n = actual.get(where) || 0;
    if (n < cap) {
      findings.push(
        `${BASELINE}: ${where} is allowed ${cap} past-due date(s) but now has only ${n} — ` +
          'work was done, so re-freeze the ceiling lower: node scripts/re-review-ratchet-guard.mjs --generate'
      );
    }
  }

  // RULE 2 is the two above plus the ceiling: one more overdue item cannot pass,
  // because admitting it means raising a count, which --generate refuses to do
  // and which a reviewer sees in the diff.
  return { findings, overdue: overdue.length, total: found.length, perFile: actual };
}

function main() {
  const now = today();
  const bPath = join(ROOT, BASELINE);
  if (!existsSync(bPath)) {
    console.error(`re-review-ratchet-guard: ${BASELINE} is missing — nothing holds the parked promises`);
    process.exit(1);
  }
  const baseline = JSON.parse(readFileSync(bPath, 'utf8'));
  const found = collect();
  const { findings, overdue, total } = judge(found, baseline, now);

  if (process.argv.includes('--generate')) {
    // DOWN ONLY. Each file's count re-freezes at what the tree really carries,
    // never above it, and a file that cleared entirely leaves the list.
    const { perFile } = judge(found, baseline, now);
    baseline.files = (baseline.files || []).map((f) => ({ ...f, overdue: Math.min(f.overdue ?? 0, perFile.get(f.where) || 0) })).filter((f) => f.overdue > 0);
    const next = Math.min(
      baseline.maxOverdue ?? overdue,
      baseline.files.reduce((a, f) => a + f.overdue, 0)
    );
    baseline.maxOverdue = next;
    writeFileSync(bPath, `${JSON.stringify(baseline, null, 2)}\n`);
    console.log(`re-review-ratchet-guard: re-froze the overdue ceiling at ${next}, down only.`);
    return 0;
  }

  if (findings.length) {
    console.error('re-review-ratchet-guard: FAIL — a parked promise is past its date\n');
    for (const f of findings) console.error(`  - ${f}`);
    console.error(`\nDR-0075: nothing parked is parked forever; the date IS the promise it is revisited.`);
    console.error(`Baseline: ${BASELINE} (maxOverdue only ever goes down)`);
    return 1;
  }
  console.log(
    `re-review-ratchet-guard: OK — ${total} parked promise(s) dated, ${overdue} past due ` +
      `and every one on the baseline (ceiling ${baseline.maxOverdue}), each saying what would clear it.`
  );
  return 0;
}

if (process.argv[1] && process.argv[1].endsWith('re-review-ratchet-guard.mjs')) process.exit(main());
