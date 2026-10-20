// @vitest-environment node
// =============================================================================
// A census that cannot tell "never ran" from "nobody asked" gives wrong answers
// (DR-1140)
// =============================================================================
// Darrell brought back a job-migration census in this shape and asked for
// reports like it:
//
//     Total jobs: 149 / Enabled jobs: 131 / Enabled jobs with a last run date: 78
//     "Do the disabled jobs need to be migrated? Are these maybe jobs that are
//      only used at certain times?"
//     "Have the enabled jobs with no run dates never been run? Do they need to move?"
//
// Both questions turn on a distinction the headline numbers destroy. "Enabled
// with no last run date" silently merges three populations with three OPPOSITE
// migration decisions:
//
//   1. nothing can fire it on a clock      -> correct and healthy; migrate it
//   2. the history was asked and is empty  -> a real candidate to retire
//   3. nobody asked the history            -> not a finding at all, just a gap
//      in the report
//
// So the gate here is not "does the count look right". It is that the
// instrument keeps those three apart and NEVER lets the third read as the
// second. That is DR-0076's rule applied to a census: unknown never reads as
// an answer.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { census, lastRunClass, kindOf, triggersOf } from '../../../scripts/fleet-census.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');

describe('unknown is not never — the distinction the whole report rests on', () => {
  it('a job the history was asked about, with zero runs, is NEVER', () => {
    expect(lastRunClass({ runs_counted: 0, last_run_at: null })).toBe('never');
  });

  it('a job with a run is RAN', () => {
    expect(lastRunClass({ runs_counted: 412, last_run_at: '2026-10-20T18:50:00Z' })).toBe('ran');
  });

  it('a job nobody asked about is UNKNOWN, never never', () => {
    // No entry at all: the report simply did not cover it.
    expect(lastRunClass(undefined)).toBe('unknown');
    expect(lastRunClass({})).toBe('unknown');
  });

  it('a job the API refused to answer for is UNKNOWN, never never', () => {
    // runs_counted null means asked and not answered. Mapping this to "never"
    // would retire a job on the strength of a failed HTTP call.
    expect(lastRunClass({ runs_counted: null, why_unknown: 'HTTP 502' })).toBe('unknown');
  });

  it('the three classes are disjoint — no input lands in two of them', () => {
    const inputs = [
      undefined, {}, { runs_counted: 0, last_run_at: null },
      { runs_counted: null }, { runs_counted: 7, last_run_at: '2026-01-01T00:00:00Z' },
    ];
    for (const i of inputs) {
      expect(['ran', 'never', 'unknown']).toContain(lastRunClass(i));
    }
  });
});

describe('question 1 — the disabled jobs, and whether they are seasonal', () => {
  it('every disabled job is listed with the reason its own record gives', () => {
    const c = census();
    const dis = c.jobs.filter((j) => j.state.startsWith('disabled'));
    // Being disabled is not by itself a verdict: the report has to hand over
    // the description so a person can say "seasonal" or "dead".
    for (const j of dis) expect(typeof j.name).toBe('string');
    const services = dis.filter((j) => j.fleet === 'nas-service');
    for (const j of services) expect(j.why, `${j.name} has no stated purpose`).toBeTruthy();
  });

  it('a disabled job is never counted among the enabled', () => {
    const c = census();
    expect(c.enabled + c.disabled).toBe(c.total);
    const enabledNames = new Set(c.jobs.filter((j) => !j.state.startsWith('disabled')).map((j) => j.name));
    for (const j of c.jobs.filter((x) => x.state.startsWith('disabled'))) {
      expect(enabledNames.has(j.name) && c.jobs.filter((x) => x.name === j.name).length === 1).toBe(false);
    }
  });
});

describe('question 2 — "enabled, no last run date" is three different things', () => {
  it('a job with no schedule at all is marked on-demand, not broken', () => {
    // This is the population that makes the raw headline misleading: nothing is
    // supposed to fire these on a clock, so a blank last-run is correct.
    expect(kindOf(triggersOf('on:\n  workflow_dispatch: {}\n'))).toBe('on-demand');
    const c = census();
    const od = c.jobs.filter((j) => j.onDemandOnly);
    expect(od.length).toBeGreaterThan(0);
    for (const j of od) expect(j.kind).toBe('on-demand');
  });

  it('a scheduled job is told apart from an on-demand one by its own trigger block', () => {
    const sched = triggersOf("on:\n  schedule:\n    - cron: '7 * * * *'\n  workflow_dispatch: {}\n");
    expect(kindOf(sched)).toBe('scheduled');
    expect(sched.cron).toEqual(['7 * * * *']);
    const ev = triggersOf('on:\n  push:\n    branches: [main]\n');
    expect(kindOf(ev)).toBe('event-driven');
  });

  it('a cron line in a comment or under a job is not a trigger', () => {
    // A false "scheduled" would hide a job that nothing fires, which is the
    // one class in this report that is genuinely alarming.
    const notATrigger = 'on:\n  workflow_dispatch: {}\n\njobs:\n  x:\n    steps:\n      - run: |\n          # schedule:\n          #   - cron: 0 0 * * *\n          echo hi\n';
    expect(kindOf(triggersOf(notATrigger))).toBe('on-demand');
  });

  it('a job nothing can fire is called INERT and is its own class', () => {
    expect(kindOf(triggersOf('on:\n  nothing_real: {}\n'))).toBe('inert');
  });
});

describe('the report refuses to imply an answer it does not have', () => {
  it('with no run history supplied, nothing is reported as never run', () => {
    const c = census();
    expect(c.neverRun).toBe(0);
    expect(c.unknownLastRun).toBe(c.total);
    expect(c.window).toBeNull();
  });

  it('and it says so in words, so the headline cannot be read as a finding', () => {
    const src = readFileSync(join(REPO, 'scripts/fleet-census.mjs'), 'utf8');
    expect(src).toMatch(/UNKNOWN, not "never"/);
  });

  it('supplied history moves jobs out of unknown and into the right class', () => {
    const runs = {
      window: 'a test window',
      workflows: {
        'site-health.yml': { state: 'active', runs_counted: 412, last_run_at: '2026-10-20T18:50:00Z' },
        'pr-janitor.yml': { state: 'active', runs_counted: 0, last_run_at: null },
      },
    };
    const c = census(runs);
    expect(c.window).toBe('a test window');
    expect(c.withALastRun).toBe(1);
    expect(c.neverRun).toBe(1);
    expect(c.jobs.find((j) => j.name === 'site-health.yml').lastRunClass).toBe('ran');
    expect(c.jobs.find((j) => j.name === 'pr-janitor.yml').lastRunClass).toBe('never');
  });

  it("GitHub's own disabled state wins over the file's existence", () => {
    // A workflow file present in the repo can still be switched off at GitHub,
    // and only the API knows. The census must take its word.
    const c = census({ workflows: { 'site-health.yml': { state: 'disabled_inactivity', runs_counted: 0, last_run_at: null } } });
    expect(c.jobs.find((j) => j.name === 'site-health.yml').state).toBe('disabled_inactivity');
    expect(c.disabled).toBeGreaterThanOrEqual(1);
  });
});

describe('it reads the real fleet, so a stopped parse cannot read as success', () => {
  it('all three fleets are counted, at the magnitude they actually are', () => {
    const c = census();
    expect(c.total).toBeGreaterThan(100);
    expect(c.jobs.filter((j) => j.fleet === 'github-workflow').length).toBeGreaterThan(80);
    expect(c.jobs.filter((j) => j.fleet === 'nas-service').length).toBeGreaterThan(20);
    expect(c.byKind.scheduled).toBeGreaterThan(50);
  });

  it('the asking half exists and asks for every workflow, not a page of them', () => {
    const wf = join(REPO, '.github/workflows/fleet-census.yml');
    expect(existsSync(wf)).toBe(true);
    const text = readFileSync(wf, 'utf8');
    // Paginates rather than reading the first 100 and calling it the fleet.
    expect(text).toMatch(/per_page=100&page=/);
    expect(text).toMatch(/total_count/);
    // Writes unknown as unknown on an error instead of falling through.
    expect(text).toMatch(/row\["runs_counted"\] = None/);
    // Says the retention caveat with the verdict, not in a footnote nobody reads.
    expect(text).toMatch(/retained history/);
    // It may keep its own ledger issue and nothing else: no write to the
    // repository, no write to the fleet, no dispatching anything.
    expect(text).toMatch(/contents: read/);
    expect(text).toMatch(/actions: read/);
    expect(text).not.toMatch(/contents: write/);
    expect(text).not.toMatch(/actions: write/);
  });

  it('it files only the genuinely broken class, never "unknown" and never on-demand', () => {
    // The ledger step is the census's consumer (the interconnect guard refused
    // it without one), and the discipline is which jobs reach it. A clock set
    // with nothing behind it is a fault. A job nothing is meant to fire is not,
    // and neither is a job the report could not ask about.
    const text = readFileSync(join(REPO, '.github/workflows/fleet-census.yml'), 'utf8');
    const step = text.slice(text.indexOf('a clock set with nothing behind it is an incident'));
    expect(step).toMatch(/j\.kind === 'inert'/);
    expect(step).toMatch(/j\.kind === 'scheduled' && j\.lastRunClass === 'never'/);
    // Neither of the two classes that must never be filed appears in the filter.
    const filter = step.slice(step.indexOf('const broken'), step.indexOf('const { owner'));
    expect(filter).not.toMatch(/unknown/);
    expect(filter).not.toMatch(/onDemandOnly|'on-demand'/);
  });

  it('and the flow graph carries it, with GitHub named as the outside source', () => {
    // DR-0621: a new workflow joins the flow at birth. The guard refused this
    // one twice — first for having no node, then for reading a resource nobody
    // writes — and the honest answer to the second is that GitHub writes it.
    const reg = readFileSync(join(REPO, 'scripts/system-flow-registry.mjs'), 'utf8');
    expect(reg).toMatch(/wf\('fleet-census\.yml'/);
    const at = reg.indexOf("'gh:actions-fleet': {");
    expect(at).toBeGreaterThan(0);
    expect(reg.slice(at, at + 420)).toMatch(/source: 'Written by GitHub itself/);
  });

  it('the scheduled fleet is the majority, which is why last-run matters at all', () => {
    const c = census();
    const sched = c.jobs.filter((j) => j.kind === 'scheduled').length;
    expect(sched).toBeGreaterThan(c.total / 3);
  });
});
