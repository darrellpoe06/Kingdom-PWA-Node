#!/usr/bin/env node
// =============================================================================
// prove-deploy — a deploy is proved for ONE sha, or it is UNKNOWN. Never a pass.
// =============================================================================
// WHY, MEASURED ON MY OWN WATCHER, 2026-10-22. DR-0107 is the hardest-won rule
// in this repo: on 2026-07-06 poetech.us served a stale build for about nine
// hours because the deploy silently stopped firing and every safeguard watched
// the pipeline instead of the product. The rule it left is "NEVER ship a change
// to the merge/CI/deploy lane without PROVING the site still deploys," and
// DR-0125 added the outside-in witness, with "unknown freshness NEVER reads as
// fresh."
//
// I then wrote that proof by hand five times in one night, and the fourth copy
// lied. It looked for the deploy by SCANNING the 20 most recent workflow runs;
// under that night's volume the run scrolled out of the window, so it printed
// `deploy=none` forty times, FELL OUT OF ITS WAIT LOOP, dispatched the site
// probe anyway, reported "UP · fresh", and exited 0. Read from its tail — which
// is how a summary gets read — it said the deploy was proved. It had never seen
// one. The real state at that moment was a deploy still QUEUED and the
// freshness healer firing repeatedly, i.e. the site up but a merge behind.
//
// A false deploy proof is worse than no proof, because DR-0107 exists to stop
// exactly the thing it would be hiding.
//
// SO THE THREE OUTCOMES ARE KEPT APART, and only one of them is a pass:
//
//   PROVED  (exit 0) — a run named "Deploy (Cloudflare Pages)" whose head_sha
//                      IS this sha completed with conclusion success.
//   FAILED  (exit 1) — such a run completed with any other conclusion. The
//                      conclusion is named; a cancelled deploy is not a success
//                      and is not a mystery either.
//   UNKNOWN (exit 2) — no such run exists yet, or it has not completed inside
//                      the budget. This is the one the hand-written loop got
//                      wrong, and it is NOT a failure of the deploy: it is this
//                      tool declining to answer. Exit 2 is distinct from 1 so a
//                      caller can tell "it broke" from "I do not know".
//
// IT MATCHES BY head_sha, NEVER BY RECENCY. The scan bug is the reason: a
// successful deploy of a DIFFERENT commit is not evidence about this one, and a
// tool that takes the newest green run it can find will happily prove the wrong
// thing on a busy night.
//
// AND IT SAYS WHEN THE SHA ITSELF IS NOT A COMMIT (added within the hour, on
// its first real use). I asked it about `85607d6036e1ba5c93f20b5a0ddc92f0a1aa1fc2`
// — nine characters of a real sha and a tail I typed from memory. It answered
// "no Deploy run exists for that sha", which is TRUE and which I read as "the
// deploy never fired", so I dispatched one that was not needed; the real tip,
// `85607d603b8e6d…`, had deployed successfully all along. The tool behaved
// correctly and still pointed me the wrong way, because "no run for this
// commit" and "that is not a commit" are different facts and only one of them
// is about the deploy. `git cat-file -t` separates them in one call.
import { execFileSync } from 'node:child_process';

export const PROVED = 'proved';
export const FAILED = 'failed';
export const UNKNOWN = 'unknown';
/** Not a verdict about the deploy at all — the question was malformed. */
export const NO_SUCH_COMMIT = 'no-such-commit';

/** The workflow whose success means the site actually advanced (DR-0054). */
export const DEPLOY_WORKFLOW = 'Deploy (Cloudflare Pages)';

/**
 * Pure. Given the runs the API returned and the sha we care about, what do we
 * actually know? `runs` is a list of { name, head_sha, status, conclusion }.
 *
 * Takes the sha explicitly and filters on it rather than trusting the caller to
 * have queried correctly — the scan bug came from a query, so the verdict does
 * not assume the query was right.
 */
export function verdictOf(runs, sha) {
  const list = Array.isArray(runs) ? runs : [];
  const mine = list.filter((r) => r && r.name === DEPLOY_WORKFLOW && r.head_sha === sha);
  if (!mine.length) {
    const others = list.filter((r) => r && r.name === DEPLOY_WORKFLOW).length;
    return {
      verdict: UNKNOWN,
      why: `no ${DEPLOY_WORKFLOW} run exists for ${sha}`
        + (others ? ` — ${others} run(s) of it exist for OTHER commits, which prove nothing about this one` : ''),
    };
  }
  const done = mine.find((r) => r.status === 'completed');
  if (!done) {
    return { verdict: UNKNOWN, why: `the deploy for ${sha} is ${mine[0].status}, not completed` };
  }
  if (done.conclusion === 'success') {
    return { verdict: PROVED, why: `${DEPLOY_WORKFLOW} completed successfully on ${sha}` };
  }
  return { verdict: FAILED, why: `the deploy for ${sha} ended ${done.conclusion}, which is not a success` };
}

/**
 * Pure. 0 proved, 1 failed, 2 unknown, 3 the sha is not a commit.
 * "I do not know" is not "it broke", and "you asked about nothing" is neither.
 */
export const exitCodeOf = (verdict) => (
  verdict === PROVED ? 0
    : verdict === FAILED ? 1
      : verdict === NO_SUCH_COMMIT ? 3
        : 2
);

/**
 * Does this sha name a commit the local repository has? A sha that does not
 * exist cannot have a deploy, and saying "no deploy run exists for it" invites
 * exactly the wrong conclusion — measured on myself, see the header.
 *
 * A repository that simply has not fetched the commit yet would also answer
 * no, so this is reported as its own outcome rather than folded into UNKNOWN:
 * the caller is told to check the sha, not to go looking at the deploy.
 */
export function commitExists(sha, runGit = defaultRunGit) {
  try {
    return String(runGit(['cat-file', '-t', sha])).trim() === 'commit';
  } catch {
    return false;
  }
}

function defaultRunGit(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

/**
 * Pure. The verdict after the wait budget is spent. THIS IS THE BUG, ISOLATED:
 * the hand-written loop fell through its iteration limit and continued as if
 * the condition had been met. Falling through yields UNKNOWN, always.
 */
export function afterBudget(last) {
  if (last && last.verdict === PROVED) return last;
  if (last && last.verdict === FAILED) return last;
  return {
    verdict: UNKNOWN,
    why: `${last && last.why ? `${last.why}; ` : ''}the wait budget ran out before the deploy completed`
      + ' — this is NOT a proof, and the site may be serving an older build',
  };
}

const gh = (path) => JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8', maxBuffer: 1 << 28 }));

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('prove-deploy.mjs');
if (invokedDirectly) {
  const arg = (f) => { const i = process.argv.indexOf(f); return i === -1 ? null : process.argv[i + 1]; };
  const sha = arg('--sha');
  const repo = arg('--repo') || process.env.GITHUB_REPOSITORY || 'darrellpoe06/Kingdom-PWA-Node';
  const budget = Number(arg('--wait') || 1800);
  if (!sha || !/^[0-9a-f]{40}$/.test(sha)) {
    console.error('usage: node scripts/prove-deploy.mjs --sha <full 40-char sha> [--wait <seconds>] [--repo owner/name]');
    console.error('  exit 0 PROVED, 1 FAILED, 2 UNKNOWN. A full sha is required: a short one cannot be compared to head_sha.');
    process.exit(2);
  }
  // Asked before anything else: a sha that is not a commit is a bad QUESTION,
  // and answering it about the deploy is how I misread this tool on its first
  // real use. It exits 3 so it cannot be mistaken for either "unknown" or a
  // deploy failure.
  if (!commitExists(sha)) {
    console.log(`\n${NO_SUCH_COMMIT.toUpperCase()}: ${sha} is not a commit in this repository.`);
    console.log('Nothing is being said about any deploy. Re-read the sha (git rev-parse origin/main)');
    console.log('rather than typing it: nine matching characters and a wrong tail reads exactly like a');
    console.log('deploy that never fired.');
    process.exit(exitCodeOf(NO_SUCH_COMMIT));
  }
  const deadline = Date.now() + budget * 1000;
  let last = null;
  for (;;) {
    let runs = [];
    try {
      runs = gh(`repos/${repo}/actions/runs?head_sha=${sha}&per_page=100`).workflow_runs || [];
    } catch (e) {
      // A read that failed is UNKNOWN, never zero (DR-1186's wording, same rule).
      last = { verdict: UNKNOWN, why: `the runs could not be read: ${e.message.split('\n')[0]}` };
      console.log(`  ${last.verdict}: ${last.why}`);
    }
    if (runs.length || !last) {
      last = verdictOf(runs, sha);
      console.log(`  ${last.verdict}: ${last.why}`);
      if (last.verdict !== UNKNOWN) break;
    }
    if (Date.now() >= deadline) break;
    await new Promise((r) => setTimeout(r, 30000));
  }
  const final = afterBudget(last);
  console.log(`\n${final.verdict.toUpperCase()}: ${final.why}`);
  if (final.verdict !== PROVED) {
    console.log('The site witness is NOT dispatched on anything but a proof: an outside-in "fresh" reading');
    console.log('taken while the deploy is still queued is a reading of the PREVIOUS build (DR-0107 / DR-0125).');
  }
  process.exit(exitCodeOf(final.verdict));
}
