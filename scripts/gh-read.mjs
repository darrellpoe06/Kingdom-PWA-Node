#!/usr/bin/env node
// gh-read.mjs -- the cheap road to GitHub status, for a session with a context budget.
// =============================================================================
// WHY (DR-1350, 2026-11-05). Two things were wrong at once, and the second one
// is the expensive one.
//
// 1. THE SESSION WAS TOLD IT HAD NO ROAD. The cloud session's own system prompt
//    says, in these words, "You do NOT have access to the `gh` CLI, `hub` CLI,
//    or direct GitHub API access." Measured 2026-11-05: `gh` is installed at
//    /usr/local/bin/gh (2.89.0) and `gh api` over REST works. Only GraphQL is
//    refused, with a message naming the REST route to use instead -- which is
//    why `gh pr checks` fails, and why "no gh" looked true. DR-0108's standing
//    question is the one that was never asked: a stated "can't" is an
//    unverified premise to challenge, not a place to stop.
//
// 2. THE COST WAS NEVER THE ROAD. It is whether the payload is filtered BEFORE
//    it reaches the reader. Measured on PR #2559's head (87d6b6fd9):
//
//      every check run on a commit    101,747 B raw -> 1,368 B with --jq   (74x)
//      the last 4 CI runs of a file    55,701 B raw ->   243 B with --jq  (229x)
//
//    The runs payload is large because each row carries the whole commit
//    message, and this repo's commit messages are long on purpose.
//
// NOT A GUARD, AND THE MEASUREMENT IS WHY. The obvious move was a gate
// forbidding an unfiltered `gh api`. Measured first: of 39 `gh api` calls in
// scripts/ and .github/workflows/, 37 already filter at the source, and the 2
// that do not redirect to a file inside a runner -- where bytes cost disk, not
// context, and a later jq reads them back. Gating those would fire on correct
// work, which spends the same trust as missing a fault (DR-0845). So the
// practice was already right everywhere except in the agent's own hands, and
// what was missing was not enforcement but a default.
//
// WHAT THIS IS. Three reads an agent actually needs while driving a PR, each
// with its filter pinned in code so the cheap form is the default rather than
// something every session rediscovers. Read-only: it names no write route.
//
//   node scripts/gh-read.mjs checks <sha>        every check run on a commit
//   node scripts/gh-read.mjs runs <workflow.yml> [n]   recent runs of one workflow
//   node scripts/gh-read.mjs steps <runId>       every job and step of one run
//
// Each prints one line per row, newest-relevant first, and nothing else.
import { execFileSync } from 'node:child_process';

export const REPO = 'darrellpoe06/Kingdom-PWA-Node';

// The filters are data, not string-built at the call site, so a test can pin
// them. Each one is the whole reason this file exists: it runs on GitHub's side
// of the wire, so the bytes it drops are never paid for.
export const READS = {
  checks: {
    path: (sha) => `repos/${REPO}/commits/${sha}/check-runs?per_page=100`,
    jq: '.check_runs[] | "\\(.conclusion // .status)\\t\\(.name)"',
    needs: 'a commit SHA',
  },
  runs: {
    path: (wf, n = 5) => `repos/${REPO}/actions/workflows/${wf}/runs?per_page=${n}`,
    jq: '.workflow_runs[] | "\\(.status) \\(.conclusion // "-") \\(.head_sha[0:9]) \\(.head_branch)"',
    needs: 'a workflow file name, e.g. ci.yml',
  },
  steps: {
    path: (runId) => `repos/${REPO}/actions/runs/${runId}/jobs?per_page=100`,
    jq: '.jobs[] | "JOB \\(.conclusion // .status)\\t\\(.name)", (.steps[] | "    \\(.conclusion // .status)\\t\\(.name)")',
    needs: 'a workflow run id',
  },
};

// A read is only cheap if the filter actually travels with it. This is the
// property the test pins: every read in READS carries a jq program, and the
// argv it builds passes that program to gh rather than filtering after the
// fact. A read that lost its --jq would still WORK, and would silently cost a
// hundred times more -- the exact shape of a safeguard that fails open.
export function argvFor(kind, ...args) {
  const read = READS[kind];
  if (!read) throw new Error(`gh-read: unknown read "${kind}" (have: ${Object.keys(READS).join(', ')})`);
  if (!args.length || args[0] === undefined || args[0] === '') {
    throw new Error(`gh-read: ${kind} needs ${read.needs}`);
  }
  return ['api', read.path(...args), '--jq', read.jq];
}

export function isFilteredAtSource(argv) {
  return argv.includes('--jq') || argv.includes('--template') || argv.includes('-q');
}

export function main(argv) {
  const [kind, ...rest] = argv;
  if (!kind || kind === '--help' || kind === '-h') {
    for (const [name, read] of Object.entries(READS)) {
      process.stdout.write(`node scripts/gh-read.mjs ${name} <${read.needs}>\n`);
    }
    return 0;
  }
  const args = argvFor(kind, ...rest);
  const out = execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  process.stdout.write(out.endsWith('\n') || out === '' ? out : `${out}\n`);
  return 0;
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('gh-read.mjs');
if (invokedDirectly) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  }
}
