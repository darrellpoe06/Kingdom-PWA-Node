// @vitest-environment node
// A PRODUCT PUSH CARRIES A RECORD — AND THE GUARD SAYS SO OUT LOUD.
// =============================================================================
// Darrell 2026-09-14: "Check all lanes today for when to get back to our Ways
// and documentation!!!!!!" then "I want our workflow back!!!!!!"
//
// Three merges that evening rewrote the lesson reading surface with no decision
// record behind any of them. The cause was already written down -- the INDEX's
// ledger-drift finding of 2026-09-13 named it exactly -- and recurred the next
// day, which is the proof that prose is not a safeguard (DR-0250).
//
// Proven-to-catch (DR-0076 section 3): the guard was run against the REAL push
// it was written for and refused it, naming four product files and no record.
// These cases pin that behaviour so it cannot quietly invert.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const GUARD = resolve(import.meta.dirname, '../../../scripts/decision-record-guard.mjs');

function repo() {
  const dir = mkdtempSync(join(tmpdir(), 'dr-guard-'));
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 't@t');
  git('config', 'user.name', 'T');
  writeFileSync(join(dir, 'README.md'), 'base\n');
  git('add', '-A'); git('commit', '-qm', 'base');
  git('branch', 'base-ref');
  return { dir, git };
}

function run(dir) {
  try {
    const out = execFileSync('node', [GUARD], {
      cwd: dir, encoding: 'utf8', env: { ...process.env, DR_GUARD_BASE: 'base-ref' },
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

const add = (dir, git, path, body = 'x\n') => {
  mkdirSync(join(dir, path.split('/').slice(0, -1).join('/')), { recursive: true });
  writeFileSync(join(dir, path), body);
  git('add', '-A'); git('commit', '-qm', `add ${path}`);
};

describe('decision-record-guard', () => {
  it('REFUSES a product change with no record — the real incident', () => {
    const { dir, git } = repo();
    add(dir, git, 'app/src/components/ChurchLearn.jsx');
    const r = run(dir);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/CARRIES NO DECISION RECORD/);
    expect(r.out).toMatch(/ChurchLearn\.jsx/);
    rmSync(dir, { recursive: true, force: true });
  });

  it('passes the same change once a record rides along', () => {
    const { dir, git } = repo();
    add(dir, git, 'app/src/components/ChurchLearn.jsx');
    add(dir, git, 'docs/decisions/DR-9999-a-record.md', '# DR-9999\n');
    const r = run(dir);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/OK/);
    rmSync(dir, { recursive: true, force: true });
  });

  it('a README touch is not a record', () => {
    const { dir, git } = repo();
    add(dir, git, 'infra/supabase/migrations-auto/0999-x.sql');
    add(dir, git, 'docs/decisions/README.md', 'convention\n');
    expect(run(dir).code).toBe(1);
    rmSync(dir, { recursive: true, force: true });
  });

  it('leaves a docs-only or session-note-only push alone', () => {
    const { dir, git } = repo();
    add(dir, git, 'docs/99-session-notes/2026-09-14-note.md');
    const r = run(dir);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/none of it product/);
    rmSync(dir, { recursive: true, force: true });
  });

  it('guards scripts and infra, not only the app', () => {
    for (const f of ['scripts/some-guard.mjs', 'infra/nas-loops/x.yml']) {
      const { dir, git } = repo();
      add(dir, git, f);
      expect(run(dir).code, f).toBe(1);
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('UNKNOWN is never green — a missing base exits 2, never 0', () => {
    const { dir, git } = repo();
    add(dir, git, 'app/src/components/ChurchLearn.jsx');
    let r;
    try {
      execFileSync('node', [GUARD], {
        cwd: dir, encoding: 'utf8', env: { ...process.env, DR_GUARD_BASE: 'no-such-ref' },
      });
      r = { code: 0, out: '' };
    } catch (e) { r = { code: e.status, out: `${e.stdout || ''}${e.stderr || ''}` }; }
    expect(r.code).toBe(2);
    expect(r.out).toMatch(/not read this as safe to push/);
    rmSync(dir, { recursive: true, force: true });
  });
});
