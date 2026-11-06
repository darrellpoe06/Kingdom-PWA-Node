// =============================================================================
// format-guard (DR-1343, DR-1330 D10): a file born into the repo is formatted.
// The partition is pinned; Prettier is proven to catch on an unformatted
// fixture through the repo's own config; the Prettier pin and the ruff pin
// are where the guard expects them.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { partition, ensureBase } from '../../../scripts/format-guard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('format-guard: which added files each tool judges', () => {
  it('sends app, functions, scripts and backend JavaScript to prettier and infra Python to ruff; skips vendor, dist and minified', () => {
    const { js, py } = partition([
      'app/src/lib/a.js',
      'app/src/components/B.jsx',
      'scripts/c.mjs',
      'app/functions/api/d.js',
      'backend/voice-worker/src/e.js',
      'infra/svc/server.py',
      'infra/svc/vendor/x.py',
      'app/dist/assets/f.js',
      'app/src/lib/g.min.js',
      'docs/h.md',
      'app/src/lib/i.json',
    ]);
    expect(js).toEqual(['app/src/lib/a.js', 'app/src/components/B.jsx', 'scripts/c.mjs', 'app/functions/api/d.js', 'backend/voice-worker/src/e.js']);
    expect(py).toEqual(['infra/svc/server.py']);
  });
});

describe('format-guard: proven to catch', () => {
  it('prettier, through the repo config, refuses an unformatted file and accepts a formatted one', () => {
    const dir = mkdtempSync(join(tmpdir(), 'format-guard-'));
    try {
      const bad = join(dir, 'bad.js');
      writeFileSync(bad, 'const x = {a:1,b:2}\nfunction f( a,b ){return a+b}\n');
      const r1 = spawnSync('npx', ['--no-install', 'prettier', '--check', '--config', join(ROOT, '.prettierrc.json'), bad], {
        cwd: join(ROOT, 'app'),
        encoding: 'utf8',
      });
      expect(r1.status).not.toBe(0);
      const good = join(dir, 'good.js');
      writeFileSync(good, 'const x = { a: 1, b: 2 };\nfunction f(a, b) {\n  return a + b;\n}\n');
      const r2 = spawnSync('npx', ['--no-install', 'prettier', '--check', '--config', join(ROOT, '.prettierrc.json'), good], {
        cwd: join(ROOT, 'app'),
        encoding: 'utf8',
      });
      expect(r2.status, r2.stdout + r2.stderr).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it('the pins are where the guard expects them', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'app/package.json'), 'utf8'));
    expect(pkg.devDependencies.prettier).toMatch(/^\^?3\./);
    expect(readFileSync(join(ROOT, 'infra/requirements-ci.txt'), 'utf8')).toMatch(/^ruff==\d/m);
    expect(JSON.parse(readFileSync(join(ROOT, '.prettierrc.json'), 'utf8')).singleQuote).toBe(true);
  });
});

// DR-1350. The guard used to CRASH -- not report "no findings" -- whenever a
// branch had not merged main in first, because `origin/main` did not exist as a
// ref and, once it did, depth 1 on both sides had no merge base. It now fetches
// its own base. These cases are offline and pin the parts that can be: the
// no-network path, the message, and the fact that the workflow no longer
// carries the fetch. The end-to-end proof is in DR-1350: a fresh
// `git clone --depth=1` where origin/main is ABSENT now resolves the merge base
// to 3e9efd896, the true branch point, and reports correctly.
describe('the guard ensures its own merge base (DR-1350)', () => {
  it('is a no-op when a merge base already exists, and does not need the network', () => {
    // This checkout has full history, so ensureBase must answer true without
    // fetching anything. A guard that fetched on every run would be a new cost
    // on every CI job.
    expect(ensureBase('HEAD')).toBe(true);
  });

  // The git runner is injected so these cases never touch the network. My first
  // draft of them DID -- it called the real git against a branch that does not
  // exist, which fired three deepen rounds and an unshallow against the real
  // remote and ran for minutes. A suite that reaches the network is the thing
  // this file elsewhere claims not to be, so the seam exists now.
  const fake = (answers) => {
    const calls = [];
    const run = (args) => {
      calls.push(args.join(' '));
      if (args[0] === 'merge-base') return answers.shift() ?? false;
      return true;
    };
    return { run, calls };
  };

  it('names the destination ref explicitly, which is the fault that crashed CI', () => {
    const { run, calls } = fake([false, false, false, false, true]);
    ensureBase('origin/main', run);
    expect(calls[1]).toBe('fetch --no-tags --depth=1 origin +refs/heads/main:refs/remotes/origin/main');
  });

  it('deepens BOTH sides, because deepening only the base cannot help a depth-1 HEAD', () => {
    const { run, calls } = fake([false, false, false, false, false, false, false, false, false]);
    ensureBase('origin/main', run);
    const deepens = calls.filter((c) => c.includes('--deepen'));
    expect(deepens).toContain('fetch --no-tags --deepen=50 origin +refs/heads/main:refs/remotes/origin/main');
    expect(deepens).toContain('fetch --no-tags --deepen=50 origin');
    expect(calls, 'unshallow is the last resort, not the first move').toContain('fetch --no-tags --unshallow origin');
    expect(calls.indexOf('fetch --no-tags --unshallow origin')).toBeGreaterThan(calls.indexOf('fetch --no-tags --deepen=50 origin'));
  });

  it('fetches nothing at all when a merge base is already there', () => {
    const { run, calls } = fake([true]);
    expect(ensureBase('origin/main', run)).toBe(true);
    expect(calls.filter((c) => c.startsWith('fetch')), 'a guard that fetches every run is a new cost on every job').toEqual([]);
  });

  it('answers false rather than throwing when nothing can resolve it', () => {
    const { run } = fake([]);
    expect(ensureBase('origin/a-branch-that-does-not-exist-1350', run)).toBe(false);
  });

  it('and the fetch is no longer in the workflow, so the knowledge sits with the command', () => {
    const ci = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8');
    const step = ci.slice(ci.indexOf('format-guard over the files added since main'));
    const body = step.slice(0, step.indexOf('working-directory'));
    expect(body, 'ci.yml still fetches the base itself').not.toMatch(/git fetch/);
    expect(body).toContain('node scripts/format-guard.mjs --base origin/main');
  });
});
