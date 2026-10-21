// @vitest-environment node
// =============================================================================
// The jobs ledger — every clocked workflow, by name, with what it ran (DR-1189)
// =============================================================================
// Darrell 2026-10-21: "Actual job names... Number of jobs, last ran, never
// ran... sequence of things, logs... Cyclical calendars... Reminders." The
// pure half: the cron reader, the two normalisers, and the ledger's verdicts,
// each PROVEN TO CATCH on fixtures before the real registry is trusted:
//   - a workflow with no run in the window is "no run in the window", never
//     "never once fired" and never green;
//   - a workflow whose last run is older than two cycles is "missed";
//   - a failed read is unknown with its reason, never a painted ledger.
import { describe, it, expect } from 'vitest';
import {
  parseCron, cronNextFires, cronPeriodMs, normalizeWorkflows, normalizeRuns, jobState, buildJobsLedger,
  stateWords, ledgerLine, periodWords, fetchJobsLedger, JOBS_RUN_WINDOW, MISSED_FLOOR_MS,
} from '../lib/jobs-ledger.js';
import registry from '../lib/job-registry.json';

const T0 = Date.UTC(2026, 9, 21, 18, 0, 0); // 2026-10-21 18:00 UTC
const H = 60 * 60 * 1000;
const iso = (ms) => new Date(ms).toISOString();

describe('the cron reader', () => {
  it('reads the shapes this repo uses: fixed minutes, lists, hourly steps, daily', () => {
    expect([...parseCron('17 14 * * *').minute]).toEqual([17]);
    expect([...parseCron('7,37 * * * *').minute]).toEqual([7, 37]);
    expect([...parseCron('17 */6 * * *').hour]).toEqual([0, 6, 12, 18]);
    expect(parseCron('0 9 * * 1').dow.has(1)).toBe(true);
    expect(parseCron('0 9 * * 7').dow.has(0)).toBe(true); // 7 is Sunday too
  });
  it('refuses what it does not understand instead of guessing', () => {
    expect(parseCron('every monday')).toBe(null);
    expect(parseCron('61 * * * *')).toBe(null);
    expect(parseCron('* * * *')).toBe(null);
    expect(cronNextFires('nonsense', T0)).toEqual([]);
    expect(cronPeriodMs('nonsense', T0)).toBe(null);
  });
  it('gives the next fire times after a moment, in order', () => {
    expect(cronNextFires('7,37 * * * *', T0, 3).map(iso)).toEqual(['2026-10-21T18:07:00.000Z', '2026-10-21T18:37:00.000Z', '2026-10-21T19:07:00.000Z']);
    expect(cronNextFires('17 14 * * *', T0, 2).map(iso)).toEqual(['2026-10-22T14:17:00.000Z', '2026-10-23T14:17:00.000Z']);
    expect(cronNextFires('0 9 * * 1', Date.UTC(2026, 9, 21), 1).map(iso)).toEqual(['2026-10-26T09:00:00.000Z']); // the next Monday
  });
  it('reads the cycle as the smallest gap between fires', () => {
    expect(cronPeriodMs('7,37 * * * *', T0)).toBe(30 * 60 * 1000);
    expect(cronPeriodMs('17 */6 * * *', T0)).toBe(6 * H);
    expect(cronPeriodMs('17 14 * * *', T0)).toBe(24 * H);
    expect(periodWords(30 * 60 * 1000)).toBe('every 30 min');
    expect(periodWords(6 * H)).toBe('every 6 h');
    expect(periodWords(24 * H)).toBe('daily');
    expect(periodWords(7 * 24 * H)).toBe('weekly');
    expect(periodWords(null)).toBe('cron not understood');
  });
});

describe('the two reads, normalised', () => {
  it('keeps a workflow by its file, name, state and page', () => {
    const w = normalizeWorkflows({ workflows: [{ id: 1, name: 'camera-health', path: '.github/workflows/camera-health.yml', state: 'active', html_url: 'u' }, { id: 2, name: 'x', path: '' }] });
    expect(w).toEqual([{ id: 1, name: 'camera-health', file: 'camera-health.yml', state: 'active', url: 'u' }]);
  });
  it('keeps a run by its file, start, status and logs; drops a run with no time', () => {
    const r = normalizeRuns({ workflow_runs: [{ id: 9, workflow_id: 1, path: '.github/workflows/camera-health.yml', run_started_at: iso(T0), status: 'completed', conclusion: 'success', html_url: 'l', run_number: 4 }, { id: 10, path: 'x.yml' }] });
    expect(r).toEqual([{ id: 9, workflowId: 1, file: 'camera-health.yml', at: iso(T0), status: 'completed', conclusion: 'success', url: 'l', number: 4 }]);
    expect(normalizeRuns(null)).toEqual([]);
    expect(normalizeWorkflows(undefined)).toEqual([]);
  });
});

const JOBS = [
  { file: 'camera-health.yml', name: 'camera-health', crons: ['7,37 * * * *'] },
  { file: 'voice-health.yml', name: 'voice-health', crons: ['17 14 * * *'] },
  { file: 'never.yml', name: 'never', crons: ['0 3 * * *'] },
];
const run = (file, at, conclusion = 'success') => ({ id: Math.random(), workflowId: 0, file, at: iso(at), status: 'completed', conclusion, url: `https://x/${file}`, number: 1 });

describe('the verdicts', () => {
  it('ran: a job inside its cycle', () => {
    const s = jobState(JOBS[0], [run('camera-health.yml', T0 - 20 * 60 * 1000)], { now: T0 });
    expect(s.state).toBe('ran');
    expect(s.since).toBe(20 * 60 * 1000);
    expect(stateWords({ ...s }, null)).toBe('ran 20 min ago, success');
  });
  it('missed: a job whose last run is older than two cycles (or an hour, whichever is longer)', () => {
    const s = jobState(JOBS[0], [run('camera-health.yml', T0 - 2 * H)], { now: T0 });
    expect(s.state).toBe('missed');
    expect(stateWords(s, null)).toBe('missed a cycle: last ran 2 h ago, cycle every 30 min');
    // 50 minutes is past two 30-minute cycles but inside the hour floor: GitHub throttles crons.
    expect(jobState(JOBS[0], [run('camera-health.yml', T0 - 50 * 60 * 1000)], { now: T0 }).state).toBe('ran');
    expect(MISSED_FLOOR_MS).toBe(H);
    // a daily job three days silent is missed; one day silent is not
    expect(jobState(JOBS[1], [run('voice-health.yml', T0 - 72 * H)], { now: T0 }).state).toBe('missed');
    expect(jobState(JOBS[1], [run('voice-health.yml', T0 - 26 * H)], { now: T0 }).state).toBe('ran');
  });
  it('no run in the window: said exactly, with the window named, never "never ran" and never green', () => {
    const runs = [run('camera-health.yml', T0 - 5 * H)];
    const ledger = buildJobsLedger({ jobs: JOBS, workflows: [], runs, now: T0 });
    const never = ledger.rows.find((r) => r.file === 'never.yml');
    expect(never.state).toBe('no-run-in-window');
    expect(never.last).toBe(null);
    expect(stateWords(never, ledger)).toBe(`no run in the last ${JOBS_RUN_WINDOW} scheduled runs (window back to 2026-10-21)`);
    expect(stateWords(never, ledger)).not.toMatch(/never ran/);
    expect(ledger.window).toEqual({ size: JOBS_RUN_WINDOW, runs: 1, oldest: T0 - 5 * H });
  });
  it('orders what needs a look first: missed, then no run in the window, then on cycle by recency', () => {
    const runs = [run('camera-health.yml', T0 - 3 * H), run('voice-health.yml', T0 - 2 * H)];
    const ledger = buildJobsLedger({ jobs: JOBS, workflows: [{ id: 1, name: 'Camera health (renamed on GitHub)', file: 'camera-health.yml', state: 'active', url: 'w' }], runs, now: T0 });
    expect(ledger.rows.map((r) => [r.file, r.state])).toEqual([['camera-health.yml', 'missed'], ['never.yml', 'no-run-in-window'], ['voice-health.yml', 'ran']]);
    // the live name wins over the derived one; the logs page comes from the live read
    expect(ledger.rows[0].name).toBe('Camera health (renamed on GitHub)');
    expect(ledger.rows[0].logsUrl).toBe('w');
    expect(ledger.counts).toEqual({ scheduled: 3, ran: 1, missed: 1, noRunInWindow: 1, disabled: 0 });
    expect(ledgerLine(ledger)).toBe('3 scheduled workflows · 1 ran on cycle · 1 missed a cycle · 1 with no run in the window');
  });
  it('the sequence is the job’s own runs, newest first', () => {
    const runs = [run('camera-health.yml', T0 - 3 * H, 'failure'), run('camera-health.yml', T0 - 20 * 60 * 1000), run('voice-health.yml', T0 - H)];
    const s = jobState(JOBS[0], runs, { now: T0 });
    expect(s.runs.map((r) => r.conclusion)).toEqual(['success', 'failure']);
    expect(s.last.conclusion).toBe('success');
  });
  it('PROVEN TO CATCH: a run that lands moves a job out of the window-silent state, and a stale run lands it in missed', () => {
    const silent = buildJobsLedger({ jobs: JOBS, workflows: [], runs: [], now: T0 });
    expect(silent.rows.every((r) => r.state === 'no-run-in-window')).toBe(true);
    const landed = buildJobsLedger({ jobs: JOBS, workflows: [], runs: [run('never.yml', T0 - 10 * 60 * 1000)], now: T0 });
    expect(landed.rows.find((r) => r.file === 'never.yml').state).toBe('ran');
    const stale = buildJobsLedger({ jobs: JOBS, workflows: [], runs: [run('never.yml', T0 - 10 * 24 * H)], now: T0 });
    expect(stale.rows.find((r) => r.file === 'never.yml').state).toBe('missed');
  });
});

describe('the live read', () => {
  const json = (body) => ({ ok: true, status: 200, json: async () => body, headers: { get: () => null } });
  it('spends two requests for the whole board and builds the ledger from them', async () => {
    const urls = [];
    const fetchImpl = async (url) => {
      urls.push(url);
      if (/\/actions\/workflows\?/.test(url)) return json({ workflows: [{ id: 1, name: 'camera-health', path: '.github/workflows/camera-health.yml', state: 'active', html_url: 'w' }] });
      if (/\/actions\/runs\?event=schedule/.test(url)) return json({ workflow_runs: [{ id: 9, workflow_id: 1, path: '.github/workflows/camera-health.yml', run_started_at: iso(T0 - 10 * 60 * 1000), status: 'completed', conclusion: 'success', html_url: 'l', run_number: 1 }] });
      throw new Error('unexpected ' + url);
    };
    const out = await fetchJobsLedger({ fetch: fetchImpl, now: T0, jobs: JOBS });
    expect(urls).toHaveLength(2);
    expect(urls[1]).toMatch(new RegExp(`per_page=${JOBS_RUN_WINDOW}$`));
    expect(out.ok).toBe(true);
    expect(out.ledger.rows.find((r) => r.file === 'camera-health.yml').state).toBe('ran');
    expect(out.registry.scheduled).toBe(registry.scheduled);
  });
  it('a failed read is unknown with its reason, and a rate limit says so', async () => {
    const out = await fetchJobsLedger({ fetch: async () => ({ ok: false, status: 500, json: async () => ({}), headers: { get: () => null } }), now: T0 });
    expect(out.ok).toBe(false);
    expect(out.ledger).toBe(null);
    expect(out.notice).toMatch(/Could not read the jobs from GitHub: http 500/);
    const limited = await fetchJobsLedger({ fetch: async () => ({ ok: false, status: 403, json: async () => ({}), headers: { get: () => null } }), now: T0 });
    expect(limited.notice).toMatch(/rate limit/);
  });
});

describe('the real registry', () => {
  it('every derived job carries a cron the reader understands, so no row can be drawn as "cron not understood" by accident', () => {
    const bad = registry.jobs.flatMap((j) => j.crons.filter((c) => parseCron(c) == null).map((c) => `${j.file}: ${c}`));
    expect(bad).toEqual([]);
    expect(registry.jobs.length).toBe(registry.scheduled);
    expect(registry.scheduled).toBeGreaterThanOrEqual(30);
  });
});
