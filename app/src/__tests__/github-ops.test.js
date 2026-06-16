// Locks the in-app Ops surface's REAL-data shapers (2026-06-16). These turn raw
// GitHub API JSON into the orchestration picture the OpsBoard renders. If the
// lane rule, the hold/auto-merge parse, or the land order regress, the surface
// would mislead about what's safe to land — so they're gated here.
import { describe, it, expect } from 'vitest';
import {
  classifyLane,
  normalizePulls,
  normalizeCommits,
  normalizeMainRuns,
  landOrder,
  fetchOps,
  MONOLITH_PATH,
} from '../lib/github-ops.js';

describe('classifyLane — mirrors conflict-map.sh', () => {
  it('monolith touch => must-serialize', () => {
    expect(classifyLane([MONOLITH_PATH, 'app/src/components/Foo.jsx'])).toBe('must-serialize');
  });
  it('a migration => must-serialize', () => {
    expect(classifyLane(['infra/supabase/migrations-auto/0027-x.sql'])).toBe('must-serialize');
  });
  it('disjoint files => parallel-safe', () => {
    expect(classifyLane(['app/src/components/Foo.jsx', '.github/workflows/x.yml'])).toBe('parallel-safe');
  });
  it('empty/garbage => parallel-safe (never throws)', () => {
    expect(classifyLane(null)).toBe('parallel-safe');
    expect(classifyLane(undefined)).toBe('parallel-safe');
  });
});

describe('normalizePulls', () => {
  it('reads branch, auto-merge armed, and the hold label', () => {
    const out = normalizePulls([
      { number: 7, title: 'X', head: { ref: 'feat/x', sha: 'abc123' }, base: { ref: 'main' }, draft: false, auto_merge: { enabled_by: {} }, labels: [{ name: 'hold' }] },
      { number: 8, title: 'Y', head: { ref: 'fix/y', sha: 'def456' }, base: { ref: 'main' }, draft: true, auto_merge: null, labels: [] },
    ]);
    expect(out[0]).toMatchObject({ number: 7, branch: 'feat/x', autoMerge: true, hold: true, draft: false });
    expect(out[1]).toMatchObject({ number: 8, branch: 'fix/y', autoMerge: false, hold: false, draft: true });
  });
  it('never throws on garbage', () => {
    expect(normalizePulls(null)).toEqual([]);
    expect(normalizePulls(undefined)).toEqual([]);
  });
});

describe('normalizeCommits', () => {
  it('extracts short SHA + first message line', () => {
    const out = normalizeCommits([{ sha: '1234567890abcdef', commit: { message: 'feat: thing (#9)\n\nbody', author: { date: '2026-06-16T00:00:00Z' } } }]);
    expect(out[0].shortSha).toBe('1234567');
    expect(out[0].title).toBe('feat: thing (#9)');
  });
});

describe('normalizeMainRuns', () => {
  it('maps a green run to good', () => {
    expect(normalizeMainRuns({ workflow_runs: [{ conclusion: 'success', head_sha: 'aaa', name: 'CI' }] }).status).toBe('good');
  });
  it('maps a failed run to problem', () => {
    expect(normalizeMainRuns({ workflow_runs: [{ conclusion: 'failure', head_sha: 'bbb' }] }).status).toBe('problem');
  });
  it('idle when no runs', () => {
    expect(normalizeMainRuns({ workflow_runs: [] }).status).toBe('idle');
  });
});

describe('landOrder — parallel-safe first, then serialized; incident>governance>feature; held excluded', () => {
  it('orders by lane then priority and drops held/draft', () => {
    const pulls = [
      { number: 1, branch: 'feat/a', lane: 'must-serialize', hold: false, draft: false },
      { number: 2, branch: 'fix/b', lane: 'must-serialize', hold: false, draft: false },
      { number: 3, branch: 'feat/c', lane: 'parallel-safe', hold: false, draft: false },
      { number: 4, branch: 'feat/held', lane: 'parallel-safe', hold: true, draft: false },
      { number: 5, branch: 'feat/draft', lane: 'parallel-safe', hold: false, draft: true },
    ];
    const order = landOrder(pulls).map((p) => p.number);
    // #3 (parallel-safe) first; then serialized lane with fix/ before feat/.
    expect(order).toEqual([3, 2, 1]);
    expect(order).not.toContain(4); // held excluded
    expect(order).not.toContain(5); // draft excluded
  });
});

describe('fetchOps — honest degradation on rate limit (injected fetch)', () => {
  it('surfaces a rate-limit notice instead of inventing rows', async () => {
    const fakeFetch = async () => ({ status: 403, ok: false, json: async () => ({}) });
    const out = await fetchOps({ fetch: fakeFetch });
    expect(out.ok).toBe(false);
    expect(out.pulls).toEqual([]);
    expect(out.notice).toMatch(/rate limit/i);
  });
});
