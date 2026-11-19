// =============================================================================
// CI runs only the legs a change needs (DR-1601)
// =============================================================================
// Measured 2026-11-19: a lesson PR started 24 jobs, 13 of them PostgreSQL walls
// and the door journeys, which read nothing a lesson changes. scripts/ci-legs.mjs
// names the legs a branch push may skip; the aggregator counts a skip as a pass
// ONLY when the classifier named that leg. These tests read the REAL ci.yml and
// run the REAL aggregator script, and each rule is shown to catch its break.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { classify, pinnedCourses, SKIPPABLE, WALL_LEGS, LAYOUT_LEGS, FILE_CAP } from '../../../scripts/ci-legs.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CI = readFileSync(join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8');
const COURSES = pinnedCourses(ROOT);
const branch = (paths) => classify({ event: 'push', ref: 'refs/heads/claude/x', paths, courses: COURSES });

// The real lesson PR #2789 (sov98), file for file.
const SOV98 = [
  'app/src/__tests__/course-band-coverage.test.js',
  'app/src/__tests__/sovereign-ai-sov98-verses.test.js',
  'app/src/lib/ai-usage-ledger.json',
  'app/src/lib/course-band-coverage-baseline.json',
  'app/src/lib/lesson-dates.json',
  'app/src/lib/sovereign-ai-class.js',
  'docs/decisions/DR-1576-he-wrought-a-work-on-the-wheels-sov98.md',
  'docs/decisions/INDEX.md',
  'scripts/file-budgets.json',
  'scripts/sov98-fill.mjs',
];

describe('the classifier (scripts/ci-legs.mjs)', () => {
  it('a lesson PR (the real #2789 file list) skips the walls, the door journeys and the layout probe', () => {
    expect(branch(SOV98).skip).toEqual(SKIPPABLE);
  });

  it('a living lesson keeps the layout leg, because the layout probe opens that course', () => {
    expect(COURSES).toContain('living-lessons');
    const r = branch(['app/src/lib/living-lessons/ll340-x.js', 'docs/decisions/INDEX.md']);
    expect(r.skip).toEqual(WALL_LEGS);
    expect(r.skip).not.toContain('layout');
  });

  it('one unrecognised path runs every leg (fail safe)', () => {
    expect(branch([...SOV98, 'app/src/components/ChurchHome.jsx']).skip).toEqual([]);
    expect(branch(['README.md']).skip).toEqual([]);
  });

  it('a PR adding a smoke under infra/supabase/tests runs every leg', () => {
    expect(branch(['infra/supabase/tests/0342-new-smoke.sql', 'docs/decisions/INDEX.md']).skip).toEqual([]);
  });

  it('ci.yml, the classifier itself or a CI script changing runs every leg', () => {
    expect(branch(['.github/workflows/ci.yml']).skip).toEqual([]);
    expect(branch(['scripts/ci-legs.mjs']).skip).toEqual([]);
    expect(branch(['scripts/chrome-layout-probe.mjs']).skip).toEqual([]);
  });

  it('main, merge_group, a dispatch, no list and a truncated list run every leg', () => {
    expect(classify({ event: 'push', ref: 'refs/heads/main', paths: SOV98, courses: COURSES }).skip).toEqual([]);
    expect(classify({ event: 'merge_group', ref: 'refs/heads/gh-readonly-queue/x', paths: SOV98, courses: COURSES }).skip).toEqual([]);
    expect(classify({ event: 'workflow_dispatch', ref: 'refs/heads/claude/x', paths: SOV98, courses: COURSES }).skip).toEqual([]);
    expect(branch(null).skip).toEqual([]);
    expect(branch([]).skip).toEqual([]);
    expect(branch(Array.from({ length: FILE_CAP }, (_, i) => `docs/n${i}.md`)).skip).toEqual([]);
  });

  it('the CLI prints a GITHUB_OUTPUT line, and an empty stdin skips nothing', () => {
    const run = (input, ref = 'refs/heads/claude/x') =>
      execFileSync('node', [join(ROOT, 'scripts/ci-legs.mjs'), '--event', 'push', '--ref', ref], { input, stdio: ['pipe', 'pipe', 'ignore'] })
        .toString()
        .trim();
    expect(run(SOV98.join('\n'))).toBe(`skip=${JSON.stringify(SKIPPABLE)}`);
    expect(run('\n')).toBe('skip=[]');
    expect(run(SOV98.join('\n'), 'refs/heads/main')).toBe('skip=[]');
  });
});

/** A top-level job's block in ci.yml. */
function jobBlock(id) {
  const m = new RegExp(`\\n  ${id}:\\n([\\s\\S]*?)(?=\\n  [a-z0-9-]+:\\n|$)`).exec(CI);
  return m ? m[1] : '';
}

describe('ci.yml wiring', () => {
  const gated = [
    ...CI.matchAll(
      /\n {2}([a-z0-9-]+):\n(?: {4}.*\n)*? {4}if: \$\{\{ !contains\(fromJSON\(needs\.classify\.outputs\.skip \|\| '\[\]'\), '([a-z0-9-]+)'\) \}\}/g
    ),
  ];

  it('exactly the skippable legs are gated, each on its own name, each needing the classifier', () => {
    expect(gated.map((m) => m[1]).sort()).toEqual([...SKIPPABLE].sort());
    for (const m of gated) {
      expect(m[2], `${m[1]} is gated on its own id`).toBe(m[1]);
      expect(jobBlock(m[1])).toMatch(/^ {4}needs: classify$/m);
    }
  });

  it('every skippable leg and the classifier are in the aggregator needs list', () => {
    const needs = /needs: \[([^\]]*)\]\s*\n\s*runs-on: ubuntu-latest\s*\n\s*steps:\s*\n\s*- name: Every leg passed/.exec(CI)[1].split(/,\s*/);
    for (const l of ['classify', ...SKIPPABLE]) expect(needs).toContain(l);
  });

  it('vitest, guards, probes, surface-sweep and curriculum are never gated', () => {
    for (const l of ['guards', 'vitest', 'probes', 'surface-sweep', 'curriculum']) expect(jobBlock(l)).not.toMatch(/needs\.classify/);
    expect(LAYOUT_LEGS).toEqual(['layout']);
  });
});

/** The aggregator's run script, exactly as ci.yml has it. */
function aggregatorScript(text = CI) {
  const block = /\n {2}app:\n[\s\S]*?\n {8}run: \|\n([\s\S]*?)(?=\n {2}[a-z#]|\n\n {2}#)/.exec(text)[1];
  return block
    .split('\n')
    .map((l) => l.slice(10))
    .join('\n');
}

function judge(script, needs, { classify: c = 'success', skip = '[]' } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'agg-'));
  const f = join(dir, 'agg.sh');
  writeFileSync(f, script);
  try {
    execFileSync('bash', ['-e', f], { env: { ...process.env, NEEDS: JSON.stringify(needs), CLASSIFY: c, SKIP: skip }, stdio: 'pipe' });
    return 0;
  } catch (e) {
    return e.status;
  }
}

const legs = (over = {}) => {
  const all = { classify: 'success', guards: 'success', vitest: 'success', ...Object.fromEntries(SKIPPABLE.map((l) => [l, 'success'])), ...over };
  return Object.fromEntries(Object.entries(all).map(([k, v]) => [k, { result: v, outputs: {} }]));
};
const skippedAll = Object.fromEntries(SKIPPABLE.map((l) => [l, 'skipped']));

describe('the aggregator (the required check "app — lint + vitest")', () => {
  const SCRIPT = aggregatorScript();

  it('passes when every leg passed', () => {
    expect(judge(SCRIPT, legs())).toBe(0);
  });

  it('passes when the skipped legs are exactly the ones the classifier named', () => {
    expect(judge(SCRIPT, legs(skippedAll), { skip: JSON.stringify(SKIPPABLE) })).toBe(0);
  });

  it('FAILS when a leg was skipped that the classifier did not name', () => {
    expect(judge(SCRIPT, legs({ 'door-work': 'skipped' }), { skip: '[]' })).toBe(1);
    expect(judge(SCRIPT, legs({ vitest: 'skipped' }), { skip: JSON.stringify(SKIPPABLE) })).toBe(1);
  });

  it('FAILS when the classifier failed, whatever it would have skipped', () => {
    expect(judge(SCRIPT, legs({ classify: 'failure', ...skippedAll }), { classify: 'failure', skip: '[]' })).toBe(1);
  });

  it('a cancelled classifier reads as "did not finish", still red', () => {
    expect(judge(SCRIPT, legs({ classify: 'cancelled', ...skippedAll }), { classify: 'cancelled', skip: '[]' })).toBe(1);
  });

  it('a named leg that ran and failed is still a failure', () => {
    expect(judge(SCRIPT, legs({ 'door-work': 'failure' }), { skip: JSON.stringify(SKIPPABLE) })).toBe(1);
  });

  it('PROVEN TO CATCH: an aggregator that waves every skip through passes the unnamed skip, and this suite sees it', () => {
    const lax = SCRIPT.replace(/elif \.value\.result == "skipped" and \$c == "success" then \.value\.result = "failure" /, '');
    const laxer = lax.replace(/\.value\.result == "skipped" and \(\.key as \$k \| \$skip \| index\(\$k\)\)/, '.value.result == "skipped"');
    expect(laxer).not.toBe(SCRIPT);
    expect(judge(laxer, legs({ 'door-work': 'skipped' }), { skip: '[]' })).toBe(0);
  });
});
