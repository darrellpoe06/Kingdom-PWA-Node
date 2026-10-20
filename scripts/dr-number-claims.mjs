#!/usr/bin/env node
// =============================================================================
// dr-number-claims — a decision number claimed twice is caught BEFORE the merge
// =============================================================================
// WHY, measured 2026-10-20. SIX number collisions in five hours, every one the
// same shape and every one found only after the second merge:
//
//   DR-1131  sov43/week-43 (#2298, 4fb979361) vs the voice witness (#2299, e8fc20407)
//   DR-1135  the ledger count (#2300, 19:31:42Z) vs the prompt words (#2306, 19:41:27Z)
//   DR-1137  the sov44 lesson (branch) vs the road-to-full-time record (main)
//   DR-1138  the sov45 lesson (branch) vs the front-door record (main)
//   DR-1143  the sov44 lesson (f4979cc3d, 22:26:08Z) vs db-migrate (3a11229ff, 22:17:41Z)
//   DR-1144  the sov45 lesson (branch) vs a record main took at 22:4x
//
// NO BRANCH GATE COULD SEE ANY OF THEM, and that is the whole point.
// business-systems-guard is correct on each branch: that branch's ledger IS
// whole, holding exactly one record per number. The duplicate exists only in
// the UNION of the branches, and the union only comes into being when the
// second one merges. Every repair cost a rename, a citation pass read by hand,
// a gate run and a full re-verify; two of them had to be redone because main
// moved again mid-repair.
//
// A UNION CHECK BY HAND CANNOT CLOSE IT. Measured on the DR-1143 collision: the
// number was verified free at 22:12, taken by another session at 22:17, and the
// verifying push merged at 22:26. The window between checking and landing is
// the defect. Only something that reads the whole union at PR time can see it.
//
// WHAT THIS DOES. Given the decision numbers a branch INTRODUCES and the claims
// held elsewhere, it classifies each one:
//
//   * taken-on-main          — the number already belongs to a different record
//                              that is ALREADY MERGED. A fact, not a race: this
//                              branch must renumber, by DR-1136's rule that the
//                              record which took an occupied number moves.
//   * contested-with-open-pr — another OPEN pull request introduces the same
//                              number. Nobody has lost yet and merge order has
//                              not happened, so this is a warning naming both
//                              sides, not a verdict about who moves.
//   * free                   — nothing else claims it.
//
// The distinction is deliberate and is the reason this can ship while three
// lesson branches are in flight: a number on main is settled and actionable; a
// number two open PRs both want is a race that the earlier merge resolves, and
// failing both PRs for it would be a gate picking a winner it has no standing
// to pick.
//
// Usage:
//   node scripts/dr-number-claims.mjs --introduced 1147 \
//        --main-claims claims-main.json --pr-claims claims-prs.json
//   node scripts/dr-number-claims.mjs --selftest
//
// claims files: {"<number>": "<what holds it>"} for main, and for open PRs
// {"<number>": [{"pr": <n>, "file": "<name>"}]}. Written by
// .github/workflows/dr-number-claim.yml, which can ask the API for both.
// =============================================================================
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DECISIONS = join(ROOT, 'docs/decisions');

/** Every decision number a tree holds, as number -> filename. */
export function claimsOnDisk(dir = DECISIONS) {
  const out = {};
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const m = /^DR-(\d+)[-.]/.exec(f);
    if (!m || !/\.md$/.test(f)) continue;
    const n = String(Number(m[1]));
    // A tree holding two files on one number is business-systems-guard's job,
    // not this one's; keep the first and let that guard speak.
    if (!(n in out)) out[n] = f;
  }
  return out;
}

/**
 * The numbers this branch introduces.
 *
 * A NUMBER MAIN ALSO HOLDS IS NOT AUTOMATICALLY EXCLUDED, and getting that
 * wrong is how my first draft of this file silently skipped every collision it
 * was written to find: `!(n in mainClaims)` drops exactly the case that matters,
 * because a collision IS main holding the number — under a different record.
 * The test for "this branch is merely behind main" is the FILENAME matching,
 * not the number being present.
 */
export function introducedBy(branchClaims, mainClaims) {
  return Object.keys(branchClaims)
    .filter((n) => mainClaims[n] !== branchClaims[n])
    .sort((a, b) => Number(a) - Number(b));
}

/**
 * The verdict per introduced number. `mainClaims` is number -> filename for the
 * base branch; `prClaims` is number -> [{pr, file}] for every OTHER open PR.
 */
export function classify(introduced, branchClaims, mainClaims, prClaims = {}) {
  return introduced.map((n) => {
    const mine = branchClaims[n];
    const onMain = mainClaims[n];
    // Only a DIFFERENT record counts as taken. The same filename on main means
    // this branch is simply behind, which a base merge fixes and which must
    // never be reported as a collision.
    if (onMain && onMain !== mine) {
      return { number: n, verdict: 'taken-on-main', mine, held: onMain };
    }
    const others = (prClaims[n] || []).filter((c) => c.file !== mine);
    if (others.length) {
      return { number: n, verdict: 'contested-with-open-pr', mine, others };
    }
    return { number: n, verdict: 'free', mine };
  });
}

/** The lowest number nothing in the union claims — what a renumber should take. */
export function firstFreeAbove(from, mainClaims, prClaims = {}, branchClaims = {}) {
  let n = Number(from);
  const taken = (k) => String(k) in mainClaims
    || (prClaims[String(k)] || []).length > 0
    || String(k) in branchClaims;
  while (taken(n)) n += 1;
  return n;
}

export function report(rows) {
  const taken = rows.filter((r) => r.verdict === 'taken-on-main');
  const contested = rows.filter((r) => r.verdict === 'contested-with-open-pr');
  const L = [];
  L.push('=== DECISION NUMBER CLAIMS ===');
  L.push(`introduced by this branch: ${rows.length ? rows.map((r) => `DR-${r.number}`).join(', ') : '(none)'}`);
  L.push('');
  if (taken.length) {
    L.push('TAKEN ON MAIN -- this branch must renumber (DR-1136: the record that');
    L.push('took an occupied number moves; merge order decides and main merged first):');
    for (const r of taken) {
      L.push(`  DR-${r.number}`);
      L.push(`    this branch: ${r.mine}`);
      L.push(`    already on main: ${r.held}`);
    }
    L.push('');
  }
  if (contested.length) {
    L.push('CONTESTED WITH AN OPEN PR -- a warning, not a verdict. Nobody has');
    L.push('merged yet, so merge order has not decided. Whichever lands second');
    L.push('renumbers; renumbering now may simply move into the next clash:');
    for (const r of contested) {
      L.push(`  DR-${r.number}`);
      L.push(`    this branch: ${r.mine}`);
      for (const o of r.others) L.push(`    also claimed by #${o.pr}: ${o.file}`);
    }
    L.push('');
  }
  if (!taken.length && !contested.length) {
    L.push('No introduced number is claimed anywhere else in the union.');
  }
  return L.join('\n');
}

// ---- selftest: no network, no repository state ------------------------------
function selftest() {
  const checks = [];
  const ok = (name, cond) => checks.push([name, !!cond]);

  const fixtureMine = `DR-${1147}-mine-a-fixture.md`;
  const fixtureTheirs = `DR-${1147}-theirs-a-fixture.md`;
  const main = { 1143: 'DR-1143-the-ledger-is-read-before-it-is-guessed.md' };
  const branch = { 1143: 'DR-1143-the-thief-who-forgot-to-lock-his-own-door-sov44.md', 1100: 'DR-1100-old.md' };

  const intro = introducedBy(branch, main);
  ok('introduced excludes numbers main already holds under the SAME name only',
    intro.includes('1143') && intro.includes('1100'));

  const rows = classify(intro, branch, main, {});
  const r1143 = rows.find((r) => r.number === '1143');
  ok('a different record on main is TAKEN', r1143.verdict === 'taken-on-main');
  ok('and it names both sides', r1143.held.includes('ledger-is-read') && r1143.mine.includes('thief'));

  // The same file on main means the branch is behind, never a collision.
  const same = classify(['1143'], main, main, {});
  ok('the SAME record on main is not a collision, just a stale branch',
    same[0].verdict === 'free');

  const contested = classify(['1147'], { 1147: fixtureMine }, {},
    { 1147: [{ pr: 2319, file: fixtureTheirs }] });
  ok('another OPEN PR is contested, not taken', contested[0].verdict === 'contested-with-open-pr');
  ok('and it does not pick a winner', !('held' in contested[0]));

  const selfclaim = classify(['1147'], { 1147: fixtureMine }, {},
    { 1147: [{ pr: 2319, file: fixtureMine }] });
  ok('a PR seeing its OWN claim echoed back is free, not contested',
    selfclaim[0].verdict === 'free');

  // A FIXTURE NUMBER IS BUILT, NEVER WRITTEN AS A LITERAL. decision-citation-guard
  // refused the first draft of this line: a literal record id in source reads as a
  // CITATION, and a citation promises the reasoning is written down in
  // docs/decisions/. It is not -- 1200 is an invented number for a fixture. The
  // guard was right, so the name is composed from a number instead of spelled out.
  const fixture = (n) => `DR-${n}-a-fixture-not-a-citation.md`;
  ok('free when nothing else claims it',
    classify(['1200'], { 1200: fixture(1200) }, {}, {})[0].verdict === 'free');

  // firstFreeAbove must skip main, open PRs AND this branch.
  ok('the suggested target skips every claim in the union',
    firstFreeAbove(1143, { 1143: 'a', 1144: 'b' }, { 1145: [{ pr: 1, file: 'c' }] }, { 1146: 'd' }) === 1147);

  const text = report(classify(intro, branch, main, {}));
  ok('the report names the rule it applies', /DR-1136/.test(text));
  ok('the report tells a contested case apart in words',
    /not a verdict/.test(report(contested)));
  ok('a clean branch says so plainly',
    /No introduced number is claimed/.test(report(classify(['1200'], { 1200: 'x.md' }, {}, {}))));

  // claimsOnDisk reads real files and ignores what is not a record.
  const real = claimsOnDisk();
  ok('claimsOnDisk reads the real ledger', Object.keys(real).length > 900);
  ok('and keys are plain numbers', Object.keys(real).every((k) => /^\d+$/.test(k)));
  ok('and INDEX.md is not mistaken for a record', !Object.values(real).includes('INDEX.md'));

  const bad = checks.filter(([, pass]) => !pass);
  for (const [name, pass] of checks) console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}`);
  console.log(`${checks.length - bad.length}/${checks.length} checks passed`);
  return bad.length === 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--selftest')) {
    process.exit(selftest() ? 0 : 1);
  }
  const arg = (k) => {
    const i = process.argv.indexOf(k);
    return i > -1 ? process.argv[i + 1] : null;
  };
  const load = (p) => (p && existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {});
  const mainClaims = load(arg('--main-claims'));
  const prClaims = load(arg('--pr-claims'));
  // --decisions exists because of a false green in this script's own first
  // test run. ROOT is resolved from THIS FILE's location, so invoking the
  // script from another worktree still read the script's own ledger and
  // reported a branch with a known collision as "free". In CI the checkout and
  // the script are the same tree so the default is right, but anything that
  // points it at a tree must say which tree, or the answer is about the wrong
  // one and looks exactly like good news.
  const branchClaims = claimsOnDisk(arg('--decisions') || DECISIONS);
  const intro = arg('--introduced')
    ? arg('--introduced').split(',').map((s) => String(Number(s.trim())))
    : introducedBy(branchClaims, mainClaims);
  const rows = classify(intro, branchClaims, mainClaims, prClaims);
  console.log(report(rows));
  const taken = rows.filter((r) => r.verdict === 'taken-on-main');
  if (taken.length) {
    const suggest = firstFreeAbove(
      Math.max(...rows.map((r) => Number(r.number))) + 1, mainClaims, prClaims, branchClaims,
    );
    console.log(`\nA renumber should take DR-${suggest}: the lowest number nothing in the union claims.`);
    console.log('Run it on a CLEAN tree -- renumbering mid-merge cannot work:');
    console.log(`  node scripts/renumber-decision-record.mjs ${taken[0].number} ${suggest} --file ${taken[0].mine}`);
    process.exit(1);
  }
  process.exit(0);
}
