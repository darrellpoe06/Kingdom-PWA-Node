// =============================================================================
// keep-prs-current-lane.test — the sweep RUNS the way Actions runs it (DR-0644)
// =============================================================================
// The first two real runs (2026-09-25, runs 36079894560 / 36079894564) died
// at their first PR: the Actions default shell is `bash -e`, so the conflicting
// `git merge` the job exists for ended the run. The local simulation had run
// the script under plain `bash` and passed. So this test runs the script out
// of the workflow file under `bash -e`, against a throwaway origin with a
// stubbed `gh`, and pins the triggers that were measured not to fire.
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, copyFileSync, rmSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const WF = (n) => readFileSync(join(REPO, '.github/workflows', n), 'utf8');
const KEEP = WF('keep-prs-current.yml');

/** The sweep step's script, exactly as Actions would receive it. */
function sweepScript(yml) {
  const lines = yml.split('\n');
  const at = lines.findIndex((l) => /^\s+run: \|\s*$/.test(l));
  const body = lines.slice(at + 1);
  const indent = /^(\s*)/.exec(body.find((l) => l.trim()))[1].length;
  const out = [];
  for (const l of body) {
    if (l.trim() && l.search(/\S/) < indent) break;
    out.push(l.slice(indent));
  }
  return out.join('\n');
}

describe('keep-prs-current — triggers and brakes (measured, not assumed)', () => {
  it('turns `bash -e` off before the first merge (runs 1 and 2 died without it)', () => {
    const s = sweepScript(KEEP);
    expect(s.indexOf('set +e')).toBeGreaterThanOrEqual(0);
    expect(s.indexOf('set +e')).toBeLessThan(s.indexOf('git merge --no-ff'));
  });

  it('does not rely on workflow_run from the token-dispatched deploy (measured: it never fired)', () => {
    const on = KEEP.slice(KEEP.indexOf('\non:'), KEEP.indexOf('\npermissions:'));
    expect(on).not.toMatch(/workflow_run/);
    expect(on).toMatch(/schedule:\s*\n\s*- cron: '7,37 \* \* \* \*'/);
    expect(on).toMatch(/push:\s*\n\s*branches: \[main\]/);
    expect(on).toMatch(/workflow_dispatch:/);
  });

  it('is dispatched wherever an auto-merge is seen landing (auto-merge heal-deploy, deploy-freshness)', () => {
    for (const f of ['auto-merge.yml', 'deploy-freshness.yml']) {
      expect(WF(f), f).toMatch(/gh workflow run keep-prs-current\.yml --repo "\$REPO" --ref main/);
    }
  });

  it('carries its brakes: budget, deadline, job timeout, and a non-cancelling lock', () => {
    expect(KEEP).toMatch(/MAX_PRS: \$\{\{ inputs\.max_prs \|\| '6' \}\}/);
    expect(KEEP).toMatch(/DEADLINE_MIN: '15'/);
    expect(KEEP).toMatch(/timeout-minutes: 20/);
    expect(KEEP).toMatch(/concurrency:\s*\n\s*group: keep-prs-current\s*\n\s*cancel-in-progress: false/);
  });

  it('CI can be dispatched on a refreshed branch', () => {
    expect(WF('ci.yml')).toMatch(/^ {2}workflow_dispatch:/m);
  });
});

// -----------------------------------------------------------------------------
// The script itself, under `bash -e`, against a real (throwaway) origin.
// -----------------------------------------------------------------------------
function world(script) {
  const root = mkdtempSync(join(tmpdir(), 'keep-current-'));
  const seed = join(root, 'seed');
  mkdirSync(seed);
  const g = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const w = (p, s) => { mkdirSync(dirname(join(seed, p)), { recursive: true }); writeFileSync(join(seed, p), s); };
  g(seed, 'init', '-q', '-b', 'main');
  g(seed, 'config', 'user.email', 't@t'); g(seed, 'config', 'user.name', 't'); g(seed, 'config', 'commit.gpgsign', 'false');
  // A LONG, OLD history (8,000 commits dated 2020): `git log` of a branch then
  // overflows a pipe buffer, which is what made the real run's
  // `git log | grep | head` die with "Broken pipe". 26 idle PR branches sit on it.
  const HISTORY = 8000;
  let fi = '';
  for (let i = 1; i <= HISTORY; i++) {
    const data = `${i}\n`;
    fi += `commit refs/heads/main\nmark :${i}\ncommitter t <t@t> ${1577836800 + i} +0000\ndata 1\nc\n${i > 1 ? `from :${i - 1}\n` : ''}M 644 inline old.txt\ndata ${Buffer.byteLength(data)}\n${data}\n`;
  }
  execFileSync('git', ['fast-import', '--quiet'], { cwd: seed, input: fi });
  g(seed, 'checkout', '-qf', 'main');
  for (let k = 1; k <= 26; k++) g(seed, 'branch', `claude/idle-${k}`, 'main');
  mkdirSync(join(seed, 'scripts'), { recursive: true });
  for (const f of ['business-systems-guard.mjs', 'resolve-ledger-conflicts.mjs']) copyFileSync(join(REPO, 'scripts', f), join(seed, 'scripts', f));
  w('scripts/legibility-guard.mjs', "import { readdirSync, writeFileSync } from 'node:fs';\nconst pages = readdirSync('app/src/pages').sort();\nwriteFileSync('app/src/lib/legibility-health.json', JSON.stringify({ pages }, null, 2) + '\\n');\nconsole.log('# legibility-guard --health');\n");
  w('app/src/pages/a.jsx', '1;\n');
  w('app/src/lib/legibility-health.json', JSON.stringify({ pages: ['a.jsx'] }, null, 2) + '\n');
  w('docs/decisions/DR-0100-a.md', '# a\n');
  w('docs/decisions/INDEX.md', '| [DR-0100](DR-0100-a.md) | a |\n\n**Next ID:** DR-0101.\n');
  g(seed, 'add', '-A'); g(seed, 'commit', '-qm', 'base');
  // PR one: ledger-only conflict. PR two: a third file conflicts too.
  g(seed, 'checkout', '-qb', 'claude/one');
  w('docs/decisions/DR-0101-one.md', '# one\n');
  w('docs/decisions/INDEX.md', '| [DR-0100](DR-0100-a.md) | a |\n| [DR-0101](DR-0101-one.md) | one |\n\n**Next ID:** DR-0102. (DR-0101 = one.)\n');
  g(seed, 'add', '-A'); g(seed, 'commit', '-qm', 'one');
  g(seed, 'checkout', '-qb', 'claude/two', 'main');
  w('app/src/pages/a.jsx', '"two";\n');
  g(seed, 'add', '-A'); g(seed, 'commit', '-qm', 'two');
  g(seed, 'checkout', '-q', 'main');
  w('docs/decisions/DR-0102-main.md', '# main\n');
  w('docs/decisions/INDEX.md', '| [DR-0100](DR-0100-a.md) | a |\n| [DR-0102](DR-0102-main.md) | main |\n\n**Next ID:** DR-0103. (DR-0102 = main.)\n');
  w('app/src/pages/a.jsx', '"main";\n');
  g(seed, 'add', '-A'); g(seed, 'commit', '-qm', 'main');
  g(root, 'clone', '-q', '--bare', seed, 'origin.git');
  g(root, 'clone', '-q', join(root, 'origin.git'), 'runner');
  mkdirSync(join(root, 'bin')); mkdirSync(join(root, 'tmp'));
  // 28 candidates like the real run: the 26 idle ones FIRST (the stub ignores
  // --jq, so this is the worst order), then the two live ones.
  const prs = [...Array.from({ length: 26 }, (_, k) => `${100 + k} claude/idle-${k + 1}`), '1 claude/one', '2 claude/two'];
  writeFileSync(join(root, 'prs.txt'), prs.join('\n') + '\n');
  writeFileSync(join(root, 'bin', 'gh'), [
    '#!/bin/bash', 'echo "gh $*" >> "$SIMLOG"',
    'case "$1 $2" in',
    '  "pr list") cat "$PRLIST" ;;',
    '  "pr comment") printf "%s\\n" "${@: -1}" >> "$COMMENTS" ;;',
    '  "api repos/o/r/issues/"*) cat "$COMMENTS" 2>/dev/null ;;',
    'esac', 'exit 0',
  ].join('\n'));
  chmodSync(join(root, 'bin', 'gh'), 0o755);
  writeFileSync(join(root, 'sweep.sh'), script);
  const run = () => spawnSync('bash', ['-e', join(root, 'sweep.sh')], {
    cwd: join(root, 'runner'), encoding: 'utf8',
    env: {
      ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH}`, SIMLOG: join(root, 'gh.log'),
      PRLIST: join(root, 'prs.txt'), COMMENTS: join(root, 'comments.txt'),
      RUNNER_TEMP: join(root, 'tmp'), GITHUB_STEP_SUMMARY: join(root, 'summary.md'),
      REPO: 'o/r', OWNER: 'o', HAS_PUSH_TOKEN: 'false', ONLY_PR: '', MAX_PRS: '6', IDLE_HOURS: '72', DEADLINE_MIN: '15',
      GIT_AUTHOR_NAME: 'github-actions[bot]', GIT_COMMITTER_NAME: 'github-actions[bot]',
    },
  });
  const origin = (...a) => g(root, '--git-dir', join(root, 'origin.git'), ...a);
  return { root, run, origin, log: () => readFileSync(join(root, 'gh.log'), 'utf8'), cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

describe('keep-prs-current — the sweep script under `bash -e`, end to end', () => {
  it('brings the ledger-only PR current, dispatches its CI, names the other PR\'s file once', () => {
    const w = world(sweepScript(KEEP));
    try {
      const r = w.run();
      expect(r.status, r.stdout + r.stderr).toBe(0);
      expect(r.stdout).toMatch(/#1 claude\/one: updated to [0-9a-f]{8} .*CI dispatched/);
      expect(r.stdout).toMatch(/#2 claude\/two: left alone: other files conflict \(app\/src\/pages\/a\.jsx/);
      expect(w.origin('log', '-1', '--format=%s', 'claude/one')).toMatch(/^Merge main into claude\/one/);
      const index = w.origin('show', 'claude/one:docs/decisions/INDEX.md');
      expect(index).toContain('| [DR-0101](DR-0101-one.md) | one |\n| [DR-0102](DR-0102-main.md) | main |');
      expect(index).toContain('**Next ID:** DR-0103.');
      expect(w.log()).toContain('gh workflow run ci.yml --repo o/r --ref claude/one');
      expect(w.log()).toContain('gh pr comment 2');
      expect(w.log()).toContain('gh workflow run auto-merge.yml');
      // The 26 idle PRs are skipped, and cost no budget (both live PRs still attempted).
      expect(r.stdout.match(/idle > 72h/g)).toHaveLength(26);
      // A second fire finds #1 current and does not comment on #2 again.
      const again = w.run();
      expect(again.status).toBe(0);
      expect(again.stdout).toMatch(/#1 claude\/one: current/);
      expect(w.log().match(/gh pr comment 2/g)).toHaveLength(1);
    } finally { w.cleanup(); }
  }, 60000);

  it('orders the candidates most-recently-updated first, so the budget reaches live PRs', () => {
    expect(sweepScript(KEEP)).toMatch(/--jq "sort_by\(\.updatedAt\) \| reverse \| \.\[\]/);
  });

  // The two scripts that ran on main 75402c9f (runs 36079894560 / 36079894564):
  // no `set +e`, and the idle check piped `git log` into `grep | head`.
  const SHIPPED_IDLE = `              last_human=$(git log --format='%ct %an' "origin/$b" | grep -v -E '^[0-9]+ github-actions' | head -1 | cut -d' ' -f1)`;
  const asShipped = (s) => s
    .replace(/^set \+e$/m, ': no set +e')
    .replace(/^( *)git log -n 200 .*\n.*last_human=.*$/m, (_, pad) => pad + SHIPPED_IDLE.trimStart());

  it('CATCHES run 2\'s death: the shipped idle check dies of a broken pipe under -e/pipefail before any PR', () => {
    const shipped = asShipped(sweepScript(KEEP));
    expect(shipped).toContain("| grep -v -E '^[0-9]+ github-actions' | head -1"); // the substitution took
    const w = world(shipped);
    try {
      const r = w.run();
      expect(r.status).not.toBe(0);
      expect(r.stdout).toMatch(/Candidates: 28/);
      expect(r.stdout).not.toMatch(/^#/m); // died before touching a single PR
    } finally { w.cleanup(); }
  }, 60000);

  it('CATCHES run 1\'s death: without `set +e` the first conflicting merge ends the run', () => {
    const w = world(sweepScript(KEEP).replace(/^set \+e$/m, ': no set +e'));
    try {
      const r = w.run();
      expect(r.status).not.toBe(0);
      expect(r.stdout).not.toMatch(/claude\/one: updated/);
    } finally { w.cleanup(); }
  }, 60000);
});
