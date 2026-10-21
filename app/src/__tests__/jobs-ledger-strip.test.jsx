// =============================================================================
// The Jobs strip on the OpsBoard says what ran, what did not, and what it
// could not read (DR-1189)
// =============================================================================
// Rendered with a built ledger (no network): the rows that need a look show by
// default, every job opens in place, the words are the ledger's own, and a
// failed read says unknown with its reason and never draws a job as run.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import JobsLedgerStrip from '../components/JobsLedgerStrip.jsx';
import { buildJobsLedger } from '../lib/jobs-ledger.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const T0 = Date.UTC(2026, 9, 21, 18, 0, 0);
const H = 60 * 60 * 1000;
const iso = (ms) => new Date(ms).toISOString();
const JOBS = [
  { file: 'camera-health.yml', name: 'camera-health', crons: ['7,37 * * * *'] },
  { file: 'voice-health.yml', name: 'voice-health', crons: ['17 14 * * *'] },
  { file: 'never.yml', name: 'never', crons: ['0 3 * * *'] },
];
const run = (file, at, conclusion = 'success') => ({ id: file + at, workflowId: 0, file, at: iso(at), status: 'completed', conclusion, url: `https://x/${file}`, number: 1 });

let container; let root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const mount = (jobs) => act(() => root.render(React.createElement(JobsLedgerStrip, { jobs })));
const q = (sel) => container.querySelector(sel);
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });

describe('with a ledger', () => {
  const ledger = buildJobsLedger({ jobs: JOBS, workflows: [{ id: 1, name: 'camera-health', file: 'camera-health.yml', state: 'active', url: 'https://x/wf' }], runs: [run('camera-health.yml', T0 - 3 * H, 'failure'), run('voice-health.yml', T0 - 2 * H)], now: T0 });
  const jobs = { ok: true, ledger, notice: null, registry: { scheduled: 3, derivedFrom: '.github/workflows' } };

  it('shows what needs a look by default, by actual name, with the cycle, the next fire, the last run and the logs', () => {
    mount(jobs);
    expect(q('[data-testid="jobs-ledger-line"]').textContent).toContain('3 scheduled workflows · 1 ran on cycle · 1 missed a cycle · 1 with no run in the window');
    const rows = [...container.querySelectorAll('[data-testid="jobs-ledger-rows"] li')];
    expect(rows.map((r) => r.getAttribute('data-state'))).toEqual(['missed', 'no-run-in-window']);
    const missed = rows[0];
    expect(missed.textContent).toContain('camera-health');
    expect(missed.textContent).toContain('7,37 * * * *');
    expect(missed.textContent).toContain('every 30 min');
    expect(missed.textContent).toContain('next 2026-10-21 18:07 UTC');
    expect(missed.textContent).toContain('missed a cycle: last ran 3 h ago');
    expect(missed.querySelector('a[href="https://x/camera-health.yml"]').textContent).toBe('logs');
    expect(missed.querySelector('a[href="https://x/wf"]').textContent).toBe('all runs');
    expect(rows[1].textContent).toContain('no run in the last 100 scheduled runs');
    expect(rows[1].textContent).not.toMatch(/never ran/);
  });
  it('opens every job in place, and closes again', () => {
    mount(jobs);
    const toggle = q('[data-testid="jobs-ledger-toggle"]');
    expect(toggle.textContent).toBe('Show every job · 3');
    expect(toggle.className).toMatch(/min-h-\[36px\]/);
    expect(toggle.className).toMatch(/focus:outline/);
    click(toggle);
    expect(container.querySelectorAll('[data-testid="jobs-ledger-rows"] li')).toHaveLength(3);
    expect(q('[data-testid="jobs-ledger-rows"] li[data-state="ran"]').textContent).toContain('ran 2 h ago, success');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    click(toggle);
    expect(container.querySelectorAll('[data-testid="jobs-ledger-rows"] li')).toHaveLength(2);
  });
  it('says plainly when every job is on cycle', () => {
    const clean = buildJobsLedger({ jobs: JOBS.slice(0, 1), workflows: [], runs: [run('camera-health.yml', T0 - 10 * 60 * 1000)], now: T0 });
    mount({ ok: true, ledger: clean, notice: null, registry: { scheduled: 1, derivedFrom: '.github/workflows' } });
    expect(q('[data-testid="jobs-ledger-all-clear"]').textContent).toBe('Every scheduled job ran within its cycle.');
  });
});

describe('without a read', () => {
  it('says unknown with the reason, names what the registry still knows, and draws no job as run (PROVEN: no row, no green)', () => {
    mount({ ok: false, ledger: null, notice: 'Could not read the jobs from GitHub: http 500.', registry: { scheduled: 38, derivedFrom: '.github/workflows' } });
    const notice = q('[data-testid="jobs-ledger-notice"]');
    expect(notice.textContent).toContain('State unknown: Could not read the jobs from GitHub: http 500.');
    expect(notice.textContent).toContain('The registry knows 38 scheduled workflows');
    expect(q('[data-testid="jobs-ledger-rows"]')).toBe(null);
    expect(container.textContent).not.toMatch(/on cycle|ran \d/);
  });
  it('renders nothing at all before the read starts, never a painted strip', () => {
    mount(null);
    expect(q('[data-testid="jobs-ledger-strip"]')).toBe(null);
  });
});
