// @vitest-environment node
// =============================================================================
// The lesson preflight refuses a shallow clone and links node_modules (DR-1477)
// =============================================================================
// Every lesson builder brief carried two hand steps: unshallow the clone, and
// symlink app/node_modules into the worktree. new-lesson.mjs now runs both
// through scripts/lib/lesson-preflight.mjs. Proven where it RUNS (DR-1474
// decision 3): inside a real `git worktree` of a real shallow clone, where the
// old `test -f .git/shallow` check reads clean because .git is a file there.
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, lstatSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { preflight, shallowState, ensureNodeModules, UNSHALLOW } from '../../../scripts/lib/lesson-preflight.mjs';

const ID = { GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
const git = (cwd, ...args) =>
  execFileSync('git', ['-c', 'commit.gpgsign=false', '-c', 'protocol.file.allow=always', ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...ID },
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 20_000,
  });

let dir;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'lesson-preflight-'));
  git(dir, 'init', '-q', '-b', 'main', 'src');
  for (const n of [1, 2, 3]) {
    writeFileSync(join(dir, 'src', 'f'), `${n}\n`);
    git(join(dir, 'src'), 'add', 'f');
    git(join(dir, 'src'), 'commit', '-qm', `c${n}`);
  }
  // A shallow clone, and a worktree of it: the shape every builder works in.
  git(dir, 'clone', '-q', '--depth', '1', `file://${join(dir, 'src')}`, 'shallow');
  git(join(dir, 'shallow'), 'worktree', 'add', '-q', '-b', 'wt', join(dir, 'wt'));
  // A full clone with app/node_modules installed, and a worktree without one.
  git(dir, 'clone', '-q', `file://${join(dir, 'src')}`, 'full');
  mkdirSync(join(dir, 'full', 'app', 'node_modules'), { recursive: true });
  git(join(dir, 'full'), 'worktree', 'add', '-q', '-b', 'wt2', join(dir, 'wt2'));
  mkdirSync(join(dir, 'wt2', 'app'), { recursive: true });
}, 60_000);
afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe('a shallow clone is refused, with the one command that fixes it', () => {
  it('PROVEN TO CATCH: inside a worktree of a shallow clone, where `test -f .git/shallow` reads clean', () => {
    const wt = join(dir, 'wt');
    expect(lstatSync(join(wt, '.git')).isFile(), 'in a worktree .git is a file').toBe(true);
    expect(existsSync(join(wt, '.git', 'shallow')), 'the old check: reads clean, wrongly').toBe(false);
    expect(shallowState({ cwd: wt }).shallow, 'the new check: shallow, rightly').toBe(true);
    const said = [];
    expect(preflight({ cwd: wt, log: (s) => said.push(s), err: (s) => said.push(s) })).toBe(1);
    expect(said.join('\n')).toContain(UNSHALLOW);
  }, 30_000);

  it('a full clone passes, and git that cannot answer is not read as "not shallow"', () => {
    expect(shallowState({ cwd: join(dir, 'full') }).shallow).toBe(false);
    const said = [];
    expect(preflight({ cwd: join(dir, 'full'), log: (s) => said.push(s), err: (s) => said.push(s) })).toBe(0);
    const unknown = shallowState({
      run: () => {
        throw Object.assign(new Error('x'), { stderr: 'fatal: not a git repository' });
      },
    });
    expect(unknown.shallow).toBe(null);
    expect(preflight({ cwd: dir, run: () => 'maybe', log: () => {}, err: () => {} }), 'unknown is a stop, not a pass').toBe(1);
  }, 30_000);
});

describe('a worktree with no node_modules is linked to the main checkout, and says so', () => {
  it('links app/node_modules to the main checkout’s, and a second run finds it present', () => {
    const wt2 = join(dir, 'wt2');
    expect(existsSync(join(wt2, 'app', 'node_modules'))).toBe(false);
    const said = [];
    expect(preflight({ cwd: wt2, log: (s) => said.push(s), err: (s) => said.push(s) })).toBe(0);
    expect(lstatSync(join(wt2, 'app', 'node_modules')).isSymbolicLink()).toBe(true);
    expect(realpathSync(join(wt2, 'app', 'node_modules'))).toBe(realpathSync(join(dir, 'full', 'app', 'node_modules')));
    expect(said.join('\n')).toMatch(/linked it to .*full\/app\/node_modules/);
    expect(ensureNodeModules({ cwd: wt2 }).action).toBe('present');
  }, 30_000);

  it('PROVEN TO CATCH: with nothing to link to, it stops and names `cd app && npm ci`', () => {
    const lone = join(dir, 'lone');
    git(dir, 'clone', '-q', `file://${join(dir, 'src')}`, 'lone');
    const said = [];
    expect(preflight({ cwd: lone, log: (s) => said.push(s), err: (s) => said.push(s) })).toBe(1);
    expect(said.join('\n')).toContain('cd app && npm ci');
    expect(existsSync(join(lone, 'app', 'node_modules'))).toBe(false);
  }, 30_000);
});
