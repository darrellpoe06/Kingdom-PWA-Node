// =============================================================================
// CI runs once per commit (DR-1297)
// =============================================================================
// THE WASTE (measured 2026-10-29). ci.yml fired on `pull_request` AND on
// `push`, and the two runs carry different refs, so the superseded-run cancel
// (DR-0645) never caught one with the other. Every commit pushed to a branch
// with an open PR ran the whole suite twice on the same SHA: #2490's head
// 29c84ff3 had push run 40816305549 and pull_request run 40816309086, ~19 jobs
// each. Four PRs refreshed at once queued ~150 jobs, and the deploy-freshness
// healer waited behind them. DR-0645 named the doubling and dated its fix for
// 2026-10-08; this is that fix.
//
// THE TRAP (DR-0645): skipping one of the two runs leaves a SKIPPED
// `app — lint + vitest` on the same SHA, and a skipped required check reads as
// passing. So nothing is skipped: the pull_request trigger is gone, and push
// runs on every branch, so a PR from any branch still gets the required check
// on its head SHA, from exactly one run.
//
// These properties read the REAL workflow file.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CI = readFileSync(join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8');

/** The `on:` block's lines, comments and blanks dropped. */
export function triggerBlock(text) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^on:\s*$/.test(l));
  if (start < 0) return [];
  const out = [];
  for (const l of lines.slice(start + 1)) {
    if (/^\S/.test(l)) break;
    const bare = l.replace(/\s+#.*$/, '');
    if (bare.trim() && !bare.trim().startsWith('#')) out.push(bare);
  }
  return out;
}

/** The events the workflow fires on (the two-space keys of `on:`). */
export function triggerEvents(text) {
  return triggerBlock(text)
    .map((l) => l.match(/^ {2}([a-z_]+):/))
    .filter(Boolean)
    .map((m) => m[1]);
}

/** The push trigger's branch filter, as written. */
export function pushBranches(text) {
  const block = triggerBlock(text);
  const at = block.findIndex((l) => /^ {2}push:/.test(l));
  if (at < 0) return null;
  for (const l of block.slice(at + 1)) {
    if (/^ {2}\S/.test(l)) break;
    const m = l.match(/^ {4}branches:\s*\[(.*)\]/);
    if (m) return m[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
  }
  return null;
}

describe('CI runs once per commit, on every branch (DR-1297)', () => {
  it('fires on push, merge_group and workflow_dispatch, and never on pull_request', () => {
    const events = triggerEvents(CI);
    expect(events).not.toContain('pull_request');
    expect(events).not.toContain('pull_request_target');
    expect(events).toEqual(expect.arrayContaining(['push', 'merge_group', 'workflow_dispatch']));
  });

  it('a push to any branch runs it, so a PR from outside the old lane list still gets the required check', () => {
    expect(pushBranches(CI)).toEqual(['**']);
  });

  it('every run of a branch shares one concurrency group, and main is never cancelled', () => {
    expect(CI).toMatch(/^concurrency:\n {2}group: ci-\$\{\{ github\.ref \}\}\n {2}cancel-in-progress: \$\{\{ github\.ref != 'refs\/heads\/main' \}\}/m);
  });

  it('the required check keeps its name, as the aggregator that fails on a non-success leg', () => {
    expect(CI).toMatch(/^ {4}name: app — lint \+ vitest$/m);
    expect(CI).toMatch(/if: always\(\)/);
  });
});

describe('PROVEN-TO-CATCH: the readers see the old double trigger', () => {
  const OLD = [
    'on:',
    '  pull_request:',
    '  push:',
    '    # main, plus the release lanes',
    "    branches: [main, 'feat/**', 'fix/**', 'merge/**', 'docs/**', 'claude/**', 'ccr-**']  # ccr-**: DR-0773",
    '  merge_group:',
    '  workflow_dispatch:',
    '',
    'concurrency:',
  ].join('\n');

  it('the old trigger is read as firing on pull_request', () => {
    expect(triggerEvents(OLD)).toContain('pull_request');
  });

  it('the old branch list is read as the lanes, not every branch', () => {
    expect(pushBranches(OLD)).toEqual(['main', 'feat/**', 'fix/**', 'merge/**', 'docs/**', 'claude/**', 'ccr-**']);
  });

  it('a commented-out pull_request is not a trigger', () => {
    expect(triggerEvents('on:\n  # pull_request:\n  push:\n    branches: [\'**\']\n')).toEqual(['push']);
  });
});
