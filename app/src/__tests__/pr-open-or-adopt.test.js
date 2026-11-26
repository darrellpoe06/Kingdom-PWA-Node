// pr-open-or-adopt -- proven-to-catch (DR-0076 Section 3; DR-1668), end to end.
// The merge lane filed its own correct state as a failure: 15 of the 30 most
// recent failed auto-open-pr runs are "a pull request already exists", because
// the idempotency guard read GitHub's lagging SEARCH index.
//
// pr-create-outcome.test.js pins the classifier on real log lines. THIS suite
// drives the whole resolution with a stub `gh`, so the adopt path, the retry
// and the two refusals are exercised as the runner will run them -- a test of
// the classifier alone could not catch a mis-wired adopt.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, chmodSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '../../..', 'scripts/pr-open-or-adopt.sh');
const REPO = 'darrellpoe06/Kingdom-PWA-Node';
const BRANCH = 'claude/a-branch';

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'pr-adopt-')); });
afterEach(() => rmSync(dir, { recursive: true, force: true }));

/**
 * Write a stub `gh` that answers the two calls the script makes.
 * @param opts.pullsAnswers  one line per `gh api .../pulls?head=...` call, in order
 *                           (empty string = no PR open)
 * @param opts.createOut     what `gh pr create` prints
 * @param opts.createRc      its exit code
 */
function stubGh({ pullsAnswers = [''], createOut = '', createRc = 0 }) {
  const answersFile = join(dir, 'answers');
  writeFileSync(answersFile, pullsAnswers.join('\n') + '\n');
  const gh = join(dir, 'gh');
  writeFileSync(gh, `#!/usr/bin/env bash
# calls are counted so a test can assert the retry actually re-read
echo "$@" >> ${JSON.stringify(join(dir, 'calls'))}
if [ "$1" = "api" ]; then
  n=$(grep -c '^api ' ${JSON.stringify(join(dir, 'calls'))})
  sed -n "\${n}p" ${JSON.stringify(answersFile)}
  exit 0
fi
if [ "$1" = "pr" ] && [ "$2" = "create" ]; then
  printf '%s\\n' ${JSON.stringify(createOut)}
  exit ${createRc}
fi
exit 9
`);
  chmodSync(gh, 0o755);
  return gh;
}

const run = (args, gh) =>
  execFileSync('bash', [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, REPO, BRANCH, GH: gh, SLEEP: 'true', RETRIES: '3' },
  });

const apiCalls = () =>
  (existsSync(join(dir, 'calls')) ? readFileSync(join(dir, 'calls'), 'utf8') : '')
    .split('\n').filter((l) => l.startsWith('api ')).length;

const EXISTS_GRAPHQL = // run 44308027454, 2026-11-18 -- a real log line
  'pull request create failed: GraphQL: A pull request already exists for ' +
  'darrellpoe06:fix/words-read-and-the-app-does-what-it-advertises. (createPullRequest)';
const RESET = // run 40811913559, 2026-10-29 -- a real log line
  'pull request create failed: Post "https://api.github.com/graphql": read tcp ' +
  '10.1.1.116:45996->140.82.112.6:443: read: connection reset by peer';

describe('pr-open-or-adopt -- the lane resolves a PR without calling a correct state a failure', () => {
  it('--probe asks the pulls API (the database), not the search index', () => {
    const gh = stubGh({ pullsAnswers: ['2917'] });
    expect(run(['--probe'], gh)).toBe('2917\n');
    const calls = readFileSync(join(dir, 'calls'), 'utf8');
    expect(calls).toContain(`repos/${REPO}/pulls?head=darrellpoe06:${BRANCH}&state=open`);
    expect(calls).not.toContain('pr list');
  });

  it('--probe prints nothing when no PR is open', () => {
    expect(run(['--probe'], stubGh({ pullsAnswers: [''] })).trim()).toBe('');
  });

  it('a successful create yields the new number', () => {
    const gh = stubGh({ createOut: `https://github.com/${REPO}/pull/2918`, createRc: 0 });
    expect(run(['--open', 'A title', 'A body'], gh)).toBe('2918');
  });

  it('ADOPTS the PR a concurrent run opened, instead of failing on it', () => {
    const gh = stubGh({ pullsAnswers: ['2919'], createOut: EXISTS_GRAPHQL, createRc: 1 });
    expect(run(['--open', 'A title', 'A body'], gh)).toBe('2919');
  });

  it('RE-READS while the winner\'s PR is still being written', () => {
    // first two reads come back empty, the third answers
    const gh = stubGh({ pullsAnswers: ['', '', '2920'], createOut: EXISTS_GRAPHQL, createRc: 1 });
    expect(run(['--open', 'A title', 'A body'], gh)).toBe('2920');
    expect(apiCalls()).toBe(3);
  });

  // PROVEN TO CATCH: the whole danger of this change is a real fault being
  // swallowed as "the PR must already exist", or an adopt passing with no PR.
  it('PROVEN TO CATCH: a reset connection FAILS -- it is never adopted', () => {
    const gh = stubGh({ pullsAnswers: ['2921'], createOut: RESET, createRc: 1 });
    expect(() => run(['--open', 'A title', 'A body'], gh)).toThrow();
  });

  it('PROVEN TO CATCH: already-exists with no number readable back FAILS, never a silent pass', () => {
    const gh = stubGh({ pullsAnswers: ['', '', ''], createOut: EXISTS_GRAPHQL, createRc: 1 });
    expect(() => run(['--open', 'A title', 'A body'], gh)).toThrow();
    expect(apiCalls()).toBe(3); // it did exhaust its retries before failing
  });

  it('refuses an unknown mode rather than guessing one', () => {
    expect(() => run(['--whatever'], stubGh({}))).toThrow();
  });
});
