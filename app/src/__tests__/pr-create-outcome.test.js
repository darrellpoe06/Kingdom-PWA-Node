// pr-create-outcome -- proven-to-catch (DR-0076 Section 3; DR-1668). The merge
// lane called a correct state a failure: 15 of the 30 most recent failed
// auto-open-pr runs are "a pull request already exists", because the
// idempotency guard read GitHub's lagging SEARCH index. This classifier decides
// which refusals are that race (adopt the PR) and which are real (fail loudly).
//
// Every string below is a REAL log line, copied from the named run, not a
// paraphrase -- the test is only worth its green if it runs on what GitHub
// actually printed.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '../../..', 'scripts/pr-create-outcome.sh');
const verdict = (output, code) => execFileSync('bash', [SCRIPT, String(code)], { input: output, encoding: 'utf8' });

// --- the race: both refusal shapes GitHub returns -------------------------
const GRAPHQL_EXISTS = // run 44308027454, 2026-11-18
  'pull request create failed: GraphQL: A pull request already exists for ' +
  'darrellpoe06:fix/words-read-and-the-app-does-what-it-advertises. (createPullRequest)';
const GH_PRECHECK_EXISTS = // run 43228136302, 2026-11-12
  'a pull request for branch "ccr-9828ca3e-88puaw" into branch "main" already exists:\n' + 'https://github.com/darrellpoe06/Kingdom-PWA-Node/pull/2611';

// --- real failures that must NEVER be adopted ----------------------------
const RESET = // run 40811913559, 2026-10-29
  'pull request create failed: Post "https://api.github.com/graphql": read tcp ' + '10.1.1.116:45996->140.82.112.6:443: read: connection reset by peer';
const HTTP_499 = 'pull request create failed: HTTP 499: 499  (https://api.github.com/graphql)'; // run 34525462333, 2026-09-10
const TITLE_TOO_LONG = 'pull request create failed: GraphQL: Title is too long';
const NO_COMMITS = 'pull request create failed: GraphQL: No commits between main and claude/at-mains-tip';

describe('pr-create-outcome -- the merge lane adopts a raced PR and still fails on a real fault', () => {
  it('a successful create yields its number from the PR URL', () => {
    expect(verdict('https://github.com/darrellpoe06/Kingdom-PWA-Node/pull/2917\n', 0)).toBe('created 2917');
  });

  it('a zero exit with NO number is an error -- auto-merge cannot be armed without one', () => {
    expect(verdict('something unexpected but cheerful\n', 0)).toBe('error');
  });

  it('the GraphQL already-exists refusal reads as the race', () => {
    expect(verdict(GRAPHQL_EXISTS, 1)).toBe('exists');
  });

  it("gh's own pre-check already-exists refusal reads as the race", () => {
    expect(verdict(GH_PRECHECK_EXISTS, 1)).toBe('exists');
  });

  // PROVEN TO CATCH: the whole danger of this change is a transport fault being
  // swallowed as "the PR must already exist". These four pin that it is not.
  it('PROVEN TO CATCH: a reset connection is an error, never adopted', () => {
    expect(verdict(RESET, 1)).toBe('error');
  });

  it('PROVEN TO CATCH: HTTP 499 is an error, never adopted', () => {
    expect(verdict(HTTP_499, 1)).toBe('error');
  });

  it('PROVEN TO CATCH: a title too long is an error, never adopted', () => {
    expect(verdict(TITLE_TOO_LONG, 1)).toBe('error');
  });

  it('PROVEN TO CATCH: no commits between is an error, never adopted', () => {
    expect(verdict(NO_COMMITS, 1)).toBe('error');
  });

  it('empty output on a non-zero exit is an error', () => {
    expect(verdict('', 1)).toBe('error');
  });

  it('the word "exists" alone does not buy adoption -- the phrase must be about a pull request', () => {
    expect(verdict('pull request create failed: the branch no longer exists', 1)).toBe('error');
  });
});
