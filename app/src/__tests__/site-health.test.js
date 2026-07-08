// @vitest-environment node
//
// site-health — the live uptime record derives from the probe's REAL runs and
// the incident ledger (DR-0125, DR-0121). Pins: verdicts map from run
// conclusions (never invented), "today" is injected (no hidden clock), the
// incident ledger counts observations honestly, freshness compares the last
// successful deploy's head_sha to main's tip, and a failed read degrades to
// ok:false with a notice instead of a painted green (DR-0076).
import { describe, it, expect } from 'vitest';
import {
  normalizeProbeRuns, probeStats, normalizeIncidents, freshness, fetchSiteHealth,
} from '../lib/site-health.js';

const run = (over) => ({
  id: 1, status: 'completed', conclusion: 'success', event: 'schedule',
  created_at: '2026-07-08T02:00:00Z', html_url: 'https://x/run/1', ...over,
});

describe('normalizeProbeRuns + probeStats', () => {
  it('maps completed runs to up/down verdicts and counts today honestly', () => {
    const runs = normalizeProbeRuns({ workflow_runs: [
      run({ id: 3, conclusion: 'failure', created_at: '2026-07-08T03:00:00Z' }),
      run({ id: 2, created_at: '2026-07-08T02:00:00Z' }),
      run({ id: 1, created_at: '2026-07-07T22:00:00Z' }),
    ] });
    expect(runs.map((r) => r.verdict)).toEqual(['down', 'up', 'up']);
    const stats = probeStats(runs, { today: '2026-07-08' });
    expect(stats).toMatchObject({ measured: true, checksToday: 2, downToday: 1 });
    expect(stats.latest.verdict).toBe('down');
    expect(stats.lastDown.id).toBe(3);
  });
  it('drops in-progress runs — only a COMPLETED observation is a verdict', () => {
    const runs = normalizeProbeRuns({ workflow_runs: [run({ status: 'in_progress', conclusion: null })] });
    expect(runs).toEqual([]);
    expect(probeStats(runs, { today: '2026-07-08' })).toMatchObject({ measured: false, latest: null, checksToday: 0 });
  });
  it('degrades honestly on a missing payload', () => {
    expect(normalizeProbeRuns(null)).toEqual([]);
    expect(normalizeProbeRuns({})).toEqual([]);
  });
});

describe('normalizeIncidents', () => {
  it('shapes the incident ledger: open state, observation count = comments + 1', () => {
    const out = normalizeIncidents([
      { number: 7, title: 'site-health: failing', state: 'open', comments: 3, created_at: '2026-07-08T03:05:00Z', html_url: 'https://x/7' },
      { number: 5, title: 'older', state: 'closed', comments: 0, created_at: '2026-07-06T01:00:00Z', closed_at: '2026-07-06T02:00:00Z' },
    ]);
    expect(out[0]).toMatchObject({ number: 7, state: 'open', observations: 4, openedDay: '2026-07-08' });
    expect(out[1]).toMatchObject({ state: 'closed', observations: 1 });
  });
  it('excludes PRs (the issues endpoint returns both)', () => {
    const out = normalizeIncidents([{ number: 9, state: 'open', pull_request: { url: 'x' }, created_at: '2026-07-08T00:00:00Z' }]);
    expect(out).toEqual([]);
  });
});

describe('freshness', () => {
  const deploys = (sha) => ({ workflow_runs: [{ head_sha: sha, updated_at: '2026-07-08T02:31:00Z' }] });
  it('fresh only when the last successful deploy head_sha IS main tip', () => {
    expect(freshness(deploys('abc1234ffffffff'), 'abc1234ffffffff')).toMatchObject({ fresh: true, known: true, deployedSha: 'abc1234' });
    expect(freshness(deploys('abc1234ffffffff'), 'def5678ffffffff')).toMatchObject({ fresh: false, known: true, mainSha: 'def5678' });
  });
  it('unknown (never fresh-by-default) when either side is missing', () => {
    expect(freshness(null, 'abc')).toMatchObject({ known: false, fresh: false });
    expect(freshness(deploys('abc'), '')).toMatchObject({ known: false, fresh: false });
  });
});

describe('fetchSiteHealth (injected fetch — bypasses the shared TTL)', () => {
  const payloads = {
    'site-health.yml/runs': { workflow_runs: [run({ id: 11, created_at: '2026-07-08T02:40:00Z' })] },
    'issues?labels=incident': [],
    'deploy-cloudflare-pages.yml/runs': { workflow_runs: [{ head_sha: '13577b7000000', updated_at: '2026-07-08T02:31:00Z' }] },
    'commits/main': { sha: '13577b7000000' },
  };
  const fakeFetch = async (url) => {
    const key = Object.keys(payloads).find((k) => url.includes(k));
    return {
      ok: true, status: 200,
      headers: { get: () => null },
      json: async () => payloads[key],
    };
  };
  it('assembles probe + incidents + freshness from the live endpoints', async () => {
    const out = await fetchSiteHealth({ fetch: fakeFetch, today: '2026-07-08' });
    expect(out.ok).toBe(true);
    expect(out.probe).toMatchObject({ measured: true, checksToday: 1, downToday: 0 });
    expect(out.freshness).toMatchObject({ fresh: true, deployedSha: '13577b7' });
    expect(out.incidents).toEqual([]);
  });
  it('a failed read is ok:false with a notice — never a painted green', async () => {
    const out = await fetchSiteHealth({ fetch: async () => { throw new Error('offline'); }, today: '2026-07-08' });
    expect(out.ok).toBe(false);
    expect(out.probe).toBe(null);
    expect(String(out.notice)).toContain('offline');
  });
  it('a rate-limited read says so', async () => {
    const out = await fetchSiteHealth({
      fetch: async () => ({ ok: false, status: 403, headers: { get: () => null }, json: async () => ({}) }),
      today: '2026-07-08',
    });
    expect(out.ok).toBe(false);
    expect(String(out.notice)).toContain('rate limit');
  });
});
