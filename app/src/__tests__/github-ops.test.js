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
  OPS_TTL_MS,
  __resetEtagCacheForTests,
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
  it('judges from the last COMPLETED run while a new run is in flight — never "CI UNKNOWN" for a busy lane (2026-07-10 board)', () => {
    const out = normalizeMainRuns({ workflow_runs: [
      { status: 'in_progress', conclusion: null, head_sha: 'fresh01234', name: 'CI' },
      { status: 'completed', conclusion: 'success', head_sha: 'green56789', name: 'CI' },
    ] });
    expect(out.status).toBe('good');                 // trunk health = the finished run's verdict
    expect(out.label).toMatch(/CI green/);
    expect(out.label).toMatch(/new run in flight/);  // the busy lane is told beside it, honestly
    expect(out.latest.sha).toBe('green56');
    expect(out.inFlight).toBe(true);
    expect(out.inFlightSha).toBe('fresh01');
  });
  it('a genuinely un-judged trunk (every run still in flight) reads attention, not a fake verdict', () => {
    const out = normalizeMainRuns({ workflow_runs: [{ status: 'in_progress', conclusion: null, head_sha: 'x' }] });
    expect(out.status).toBe('attention');
    expect(out.inFlight).toBe(true);
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

describe('the lane budget is spent on the LIVE PRs first (2026-07-10 "first 8 of 24" board)', () => {
  it('file lookups go to the most recently updated PRs; untouched stale ones read unknown, honestly', async () => {
    const okJson = (body) => ({ status: 200, ok: true, headers: { get: () => null }, json: async () => body });
    // Twelve open PRs, oldest-first from the API on purpose — #12 is the freshest.
    const prs = Array.from({ length: 12 }, (_, i) => ({
      number: i + 1, title: `pr${i + 1}`, head: { ref: `b${i + 1}`, sha: 's' }, base: { ref: 'main' },
      labels: [], updated_at: `2026-06-${String(10 + i).padStart(2, '0')}T00:00:00Z`,
    }));
    const fileCalls = [];
    const fakeFetch = async (url) => {
      const m = url.match(/\/pulls\/(\d+)\/files/);
      if (m) { fileCalls.push(Number(m[1])); return okJson([{ filename: 'app/src/components/Foo.jsx' }]); }
      if (url.includes('/pulls?state=open')) return okJson(prs);
      if (url.includes('/actions/runs')) return okJson({ workflow_runs: [] });
      return okJson([]);
    };
    const out = await fetchOps({ fetch: fakeFetch });
    // The 8-lookup budget lands on PRs 5..12 (freshest), never the stale head of the list.
    expect(fileCalls.slice().sort((a, b) => a - b)).toEqual([5, 6, 7, 8, 9, 10, 11, 12]);
    expect(out.notice).toMatch(/most recently updated/);
    expect(out.pulls.find((p) => p.number === 1).lane).toBe('unknown');   // stale: honest unknown
    expect(out.pulls.find((p) => p.number === 12).lane).toBe('parallel-safe'); // live: real lane
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

describe('rate-budget discipline (2026-07-03 "GitHub capped us")', () => {
  // A window-like localStorage is present under jsdom; clear the etag cache
  // between assertions so each starts from a known state.
  const ETAG_KEY = 'poe-gh-etag-cache';
  const okJson = (body, etag) => ({
    status: 200, ok: true,
    headers: { get: (k) => (k.toLowerCase() === 'etag' ? etag : null) },
    json: async () => body,
  });

  it('caches ETags and serves the cached body on a 304 (a free request)', async () => {
    localStorage.removeItem(ETAG_KEY);
    __resetEtagCacheForTests();
    const calls = [];
    // First pass: everything 200s with an etag. Second pass: pulls endpoint
    // 304s — the cached body must come back, not an error, not a refetch body.
    let pass = 1;
    const fakeFetch = async (url, init) => {
      calls.push({ url, inm: init.headers['If-None-Match'] || null });
      if (pass === 2 && url.includes('/pulls?state=open')) return { status: 304, ok: false, headers: { get: () => null }, json: async () => { throw new Error('304 has no body'); } };
      if (url.includes('/pulls?state=open')) return okJson([{ number: 7, title: 'cached-pr', head: { ref: 'b', sha: 's' }, base: { ref: 'main' }, labels: [] }], 'W/"pulls-v1"');
      if (url.includes('/commits?sha=main')) return okJson([], 'W/"commits-v1"');
      if (url.includes('/actions/runs')) return okJson({ workflow_runs: [] }, null);
      return okJson([], null);
    };
    const first = await fetchOps({ fetch: fakeFetch });
    expect(first.pulls[0].title).toBe('cached-pr');
    pass = 2;
    const second = await fetchOps({ fetch: fakeFetch });
    expect(second.pulls[0].title).toBe('cached-pr'); // served from the 304 cache
    // And the second pulls request actually carried the stored ETag.
    const pullsCalls = calls.filter((c) => c.url.includes('/pulls?state=open'));
    expect(pullsCalls[1].inm).toBe('W/"pulls-v1"');
  });

  it('the etag cache prunes to its cap instead of growing forever', () => {
    const big = {};
    for (let i = 0; i < 40; i++) big[`u${i}`] = { etag: `e${i}`, body: [], at: i };
    localStorage.setItem(ETAG_KEY, JSON.stringify(big));
    __resetEtagCacheForTests(); // hydrate the seeded 40-entry cache
    // Trigger a write through the public path: one fetch that stores an etag.
    return fetchOps({ fetch: async (url) => okJson([], 'W/"x"') }).then(() => {
      const cache = JSON.parse(localStorage.getItem(ETAG_KEY) || '{}');
      expect(Object.keys(cache).length).toBeLessThanOrEqual(24);
      // Oldest entries were pruned first (u0 gone, newest survivors present).
      expect(cache.u0).toBeUndefined();
    });
  });

  it('exposes the share seam: OPS_TTL_MS is a real bound and injected-fetch calls bypass the share', async () => {
    expect(OPS_TTL_MS).toBeGreaterThan(0);
    // Two injected-fetch calls must NOT share results (fixtures stay isolated).
    const a = await fetchOps({ fetch: async () => okJson([], null) });
    const b = await fetchOps({ fetch: async () => ({ status: 403, ok: false, headers: { get: () => null }, json: async () => ({}) }) });
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(false); // the 403 was not masked by a shared cache
  });
});
