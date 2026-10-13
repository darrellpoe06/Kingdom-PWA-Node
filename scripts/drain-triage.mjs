#!/usr/bin/env node
// =============================================================================
// drain-triage — which open pull requests can be DRAINED, and which must be
// REBUILT (DR-0990; amends DR-0986)
// =============================================================================
// DR-0986 decided the 52-PR backlog is drained oldest-first and said to start
// with "the 8 PRs that touch 1-3 files, because those are where a conflict
// resolution is reviewable in a sitting." Measured 2026-10-13, that premise is
// wrong, and both proxies in it are wrong:
//
//   * TITLE lies. #286 is titled "docs(hardware): sharpen toward private/
//     sovereign/air-gappable" and carries a whole Concerns Board feature --
//     1,106 insertions, a 286-line component, two new libs, and a migration
//     numbered 0039 while main is at 0282.
//   * FILE COUNT lies. #592 touches 12 files for 256 insertions; #286 touches
//     8 for 1,106. The count measures neither size nor risk.
//
// THE REAL HAZARD, which neither proxy can see: these are PRE-EXTRACTION-ERA
// branches. The hybrid-modular cutover has been RATCHETING the shell down
// (monolith-budget-guard: "this line count may only go DOWN"). #592's own
// scripts/monolith-budget.json says 5913; main's says 5302. Its shell hunk
// still carries the full inline theme CSS block that main has since EXTRACTED
// behind `${THEME_CSS}`. Merging it mechanically would reinstate ~611 lines the
// extraction lane already peeled out AND raise the frozen ceiling to permit it
// -- undoing the cutover one old PR at a time, quietly, while every check
// stayed green.
//
// THE RULE THIS ENCODES. Three questions. Any YES means the PR is a REBUILD
// (its work re-done against today's structure), not a DRAIN (rebase, resolve,
// ship):
//
//   1. Does it touch the frozen monolith (app/src/poe-financial-mvp-v28.jsx)?
//      Then it predates the extraction of whatever it edits.
//   2. Does it carry scripts/monolith-budget.json? Then it carries a ceiling
//      from its own era, and applying it moves the ratchet backwards.
//   3. Does it add a migration whose ordinal is far behind main's newest?
//      Then its schema position is wrong and replay order is not what it
//      assumed.
//
// PR #1217 drained cleanly (DR-0989) precisely because it answered NO to all
// three: catalog content, verse text and a test. That is the shape that drains.
//
// A FOURTH QUESTION, added 2026-10-13 after PR #789 (DR-0991):
//
//   4. Is every file it adds ALREADY on main? Then its content may have landed
//      by another route, and merging it can REGRESS what is there.
//
// #789 is the case. Its own body says "shipped via PR #787", which merged
// 2026-07-11T21:49:37Z -- the same day #789 was opened. Every line of it is on
// main (SHARE_DOOR_URL, the aliases, INSTALL_MANIFEST, status 'verified', the
// door page, the manifest, 23 redirect lines, and a byte-identical DR-0174).
// And main has moved PAST it: its test differs by 165 lines and
// church-own-door.js by 66, in main's favour. Merging it would have dragged the
// church's door back to its July shape.
//
// NEITHER EXISTING TOOL SEES THIS. pr-janitor closes only PROVABLY EMPTY PRs
// (`git diff --quiet origin/main...branch`), and #789 is not empty -- its diff
// against its own merge-base is real; it is MAIN that moved. The three
// structural questions above ask about the monolith, the budget and migration
// ordinals, none of which notices that the work already shipped.
//
// This question FLAGS for a human read rather than deciding on its own:
// "every added file already exists" is strong evidence of supersession, but
// whether the PR still carries something main lacks needs eyes. The verdict is
// 'superseded?' -- a question mark, deliberately.
//
// NOT A BUILD GATE. This reads the GitHub API, so it cannot live in
// verify:gates alongside the $0/no-network guards. It is a triage TOOL, run
// when choosing the next drain. Its classification logic is pure and tested.
//
//   node scripts/drain-triage.mjs            # classify every open PR
//   node scripts/drain-triage.mjs --drains   # only the drainable ones
// =============================================================================
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const MONOLITH = 'app/src/poe-financial-mvp-v28.jsx';
export const BUDGET_FILE = 'scripts/monolith-budget.json';
/** How far behind main's newest a migration ordinal may sit and still drain. */
export const ORDINAL_SLACK = 20;

/** The newest migration ordinal on disk. */
export function newestOrdinal(dir = join(ROOT, 'infra/supabase/migrations-auto')) {
  const ns = readdirSync(dir)
    .map((f) => /^(\d{4})-/.exec(f))
    .filter(Boolean)
    .map((m) => Number(m[1]));
  return ns.length ? Math.max(...ns) : 0;
}

/**
 * Classify ONE pull request from the facts about it. Pure — no network, no git.
 *
 * facts: { number, created, files: [path], insertions, newest }
 * Returns { verdict: 'drain'|'rebuild', reasons: [string] }
 */
export function classify(facts) {
  const files = facts.files || [];
  const reasons = [];
  // THE FOURTH QUESTION FIRST, because it changes what the others mean: if the
  // work already shipped, "can this be drained?" is the wrong question
  // entirely. Reported as a QUESTION (superseded?), never an auto-verdict --
  // only a reader can say whether anything here is still missing (DR-0991).
  // Reported ALONGSIDE the structural reasons, not instead of them. The first
  // version returned early here, which threw away the fact that (say) #286 also
  // touches the frozen monolith — exactly what a reader who RULES OUT
  // supersession needs next. Caught by reading the tool's own output.
  const added = facts.added || null;      // files the PR ADDS, that exist on main
  const superseded = Boolean(added && added.total > 0 && added.alreadyOnMain === added.total);
  if (superseded) {
    reasons.push(`every one of the ${added.total} file(s) it adds already exists on main — its content may have landed by another route, and merging it could REGRESS what is there; read it before any merge`);
  }
  if (files.includes(MONOLITH)) {
    reasons.push(`touches the frozen monolith (${MONOLITH}) — predates the extraction of whatever it edits`);
  }
  if (files.includes(BUDGET_FILE)) {
    reasons.push(`carries ${BUDGET_FILE} — a ceiling from its own era; applying it moves the ratchet backwards`);
  }
  for (const f of files) {
    const m = /^infra\/supabase\/migrations-auto\/(\d{4})-/.exec(f);
    if (!m) continue;
    const behind = facts.newest - Number(m[1]);
    if (behind > ORDINAL_SLACK) {
      reasons.push(`adds migration ${m[1]} while main is at ${String(facts.newest).padStart(4, '0')} — ${behind} behind, so its replay position is wrong`);
    }
  }
  if (superseded) return { verdict: 'superseded?', reasons };
  return { verdict: reasons.length ? 'rebuild' : 'drain', reasons };
}

const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }).trim();

/** Facts about one PR, from the local `refs/remotes/pr/*` refs. */
export function factsFor(number, newest) {
  const ref = `refs/remotes/pr/${number}`;
  const base = git('merge-base', ref, 'origin/main');
  const files = git('diff', '--name-only', base, ref).split('\n').filter(Boolean);
  const insertions = git('diff', '--numstat', base, ref)
    .split('\n').filter(Boolean)
    .reduce((t, l) => t + (Number(l.split('\t')[0]) || 0), 0);
  // Which of the files this PR ADDS are already present on main. A PR whose
  // every addition is already there is the #789 shape (DR-0991).
  const addedPaths = git('diff', '--diff-filter=A', '--name-only', base, ref).split('\n').filter(Boolean);
  let alreadyOnMain = 0;
  for (const f of addedPaths) {
    try { git('cat-file', '-e', `origin/main:${f}`); alreadyOnMain += 1; } catch { /* not there */ }
  }
  return { number, files, insertions, newest, added: { total: addedPaths.length, alreadyOnMain } };
}

if (process.argv[1] && process.argv[1].endsWith('drain-triage.mjs')) {
  const onlyDrains = process.argv.includes('--drains');
  const newest = newestOrdinal();
  const raw = execFileSync('gh', [
    'api', 'repos/darrellpoe06/Kingdom-PWA-Node/pulls?state=open&per_page=100',
    '-q', '.[] | select(.draft==false) | select([.labels[].name]|index("hold")|not) | "\\(.number)\\t\\(.created_at[0:10])\\t\\(.title)"',
  ], { encoding: 'utf8' });
  const rows = raw.split('\n').filter(Boolean).map((l) => l.split('\t'));
  const out = [];
  for (const [n, created, title] of rows) {
    let facts;
    try { facts = factsFor(n, newest); } catch { continue; }
    const { verdict, reasons } = classify({ ...facts, created });
    out.push({ n, created, title, verdict, reasons, insertions: facts.insertions, files: facts.files.length });
  }
  out.sort((a, b) => a.created.localeCompare(b.created));
  const drains = out.filter((r) => r.verdict === 'drain');
  const sup = out.filter((r) => r.verdict === 'superseded?');
  for (const r of out) {
    if (onlyDrains && r.verdict !== 'drain') continue;
    console.log(`#${r.n}  ${r.created}  ${String(r.files).padStart(3)}f ${String(r.insertions).padStart(5)}+  ${r.verdict.toUpperCase()}  ${r.title.slice(0, 48)}`);
    for (const why of r.reasons) console.log(`        · ${why}`);
  }
  console.log(`\n${out.length} open (not hold, not draft): ${drains.length} drain, ${out.length - drains.length - sup.length} rebuild, ${sup.length} superseded? (read before merging). Newest migration on disk: ${String(newest).padStart(4, '0')}.`);
}
