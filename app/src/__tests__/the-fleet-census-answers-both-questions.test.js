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

// =============================================================================
// THE NAS HALF GETS ASKED TOO (DR-1155)
// =============================================================================
// This census printed 28 of 118 jobs blank and the code said why:
//   lastRun: null,
//   // The loop ledgers hold this and loops-health.yml reads them; it is not
//   // in the repo, so from here it is unknown, never "never".
// True of the REPO, false of the FLEET. loops-health.yml measures every one of
// those loops on the same tailnet, fifteen minutes apart — `readServices()`
// simply never accepted the `runs` argument. A missing parameter, not a
// missing road, and the deferral written beside it ("data, not code") was
// wrong twice over.
describe('the NAS half is asked, and still never says "never"', () => {
  const RUNS = {
    services: {
      'lesson-mail': { last_run_at: '2026-10-21T02:50:00Z', from: 'its own ledger, 600s old' },
      'church-mail': { last_run_at: null, from: 'no timestamp available (last run unknown)' },
    },
  };

  it('a loop the witness timestamped reads RAN, with its provenance carried', () => {
    const j = census(RUNS).jobs.find((x) => x.name === 'lesson-mail');
    expect(j.fleet).toBe('nas-service');
    expect(j.lastRunClass).toBe('ran');
    expect(j.lastRun).toBe('2026-10-21T02:50:00Z');
    // WHICH witness said so travels with the number, so no reader has to guess.
    expect(j.lastRunFrom).toMatch(/its own ledger/);
  });

  it('a loop the witness could not timestamp stays UNKNOWN', () => {
    const j = census(RUNS).jobs.find((x) => x.name === 'church-mail');
    expect(j.lastRunClass).toBe('unknown');
    expect(j.lastRun).toBe(null);
  });

  it('a NAS loop can NEVER be reported "never", even if a count is handed in', () => {
    // THE DELIBERATE ASYMMETRY, and the case that pins it. "Never" means the
    // system holding the history was asked and had no run. Nothing we can ask
    // holds a NAS loop's run COUNT — only its most recent evidence — so a
    // count arriving in the services map is dropped rather than believed. A
    // workflow with the same input IS "never", and that difference is the
    // whole point.
    const withCount = { services: { 'lesson-mail': { last_run_at: null, runs_counted: 0 } } };
    const j = census(withCount).jobs.find((x) => x.name === 'lesson-mail');
    expect(j.lastRunClass).toBe('unknown');
    expect(lastRunClass({ last_run_at: null, runs_counted: 0 })).toBe('never');
  });

  it('with no runs file at all the NAS half is unchanged — unknown, not never', () => {
    const c = census();
    const nas = c.jobs.filter((j) => j.fleet === 'nas-service');
    expect(nas.length).toBeGreaterThan(20);
    expect(nas.every((j) => j.lastRunClass === 'unknown')).toBe(true);
    expect(nas.some((j) => j.lastRunClass === 'never')).toBe(false);
  });

  it('a timestamped loop moves withALastRun, and the totals still add up', () => {
    const before = census();
    const after = census(RUNS);
    expect(after.withALastRun).toBe(before.withALastRun + 1);
    expect(after.total).toBe(before.total);
    expect(after.neverRun).toBe(before.neverRun);
    for (const c of [before, after]) {
      expect(c.withALastRun + c.neverRun + c.unknownLastRun).toBe(c.total);
    }
  });
});

describe('one road to one truth — the two halves of the fold', () => {
  const LOOPS = readFileSync(join(REPO, '.github/workflows/loops-health.yml'), 'utf8');
  const CENSUS = readFileSync(join(REPO, '.github/workflows/fleet-census.yml'), 'utf8');

  it('the loops witness publishes where the census reads, same label', () => {
    // A reader aimed at something nothing writes reports "no data" for ever.
    expect(LOOPS).toMatch(/const label = 'loops-report'/);
    expect(CENSUS).toMatch(/labels=loops-report/);
  });

  it('publishing can never change the loops witness’s own verdict', () => {
    // It runs AFTER the verdict and cannot fail the job: a healthy witness must
    // not go red because an issue write failed, and a dark one must not go
    // green. The gate is this workflow's judgement, not its reporting.
    const judge = LOOPS.indexOf('Judge each loop on what it wrote');
    const publish = LOOPS.indexOf('Report: publish the per-loop witness');
    expect(judge).toBeGreaterThan(0);
    expect(publish).toBeGreaterThan(judge);
    const step = LOOPS.slice(publish, publish + 400);
    expect(step).toMatch(/continue-on-error: true/);
  });

  it('it is not filed as an incident — a healthy witness is not an outage', () => {
    const publish = LOOPS.indexOf('Report: publish the per-loop witness');
    const diagnose = LOOPS.indexOf('Diagnose the dark loops');
    const step = LOOPS.slice(publish, diagnose);
    expect(step).toMatch(/labels: \[label\]/);
    expect(step).not.toMatch(/'incident'/);
  });

  it('the census needs no tailnet of its own to read it', () => {
    // Two roads to one truth drift. The census stays a reader.
    const fold = CENSUS.indexOf('Fold in the loops witness');
    expect(fold).toBeGreaterThan(0);
    const step = CENSUS.slice(fold, fold + 2600);
    expect(step).not.toMatch(/tailscale|NAS_SSH_KEY|ssh /i);
  });

  it('every way the fold can fail leaves the NAS half UNKNOWN, loudly', () => {
    // DR-0076. A report that cannot be read is not "no loops ran".
    const fold = CENSUS.indexOf('Fold in the loops witness');
    const step = CENSUS.slice(fold, CENSUS.indexOf('The census, and the two questions'));
    for (const why of [
      /could not read the loops report/,
      /no loops-report issue yet/,
      /carries no witness block/,
      /does not parse/,
      /names no services/,
    ]) expect(step).toMatch(why);
    expect((step.match(/stays UNKNOWN/g) || []).length).toBeGreaterThanOrEqual(4);
  });

  it('no run COUNT crosses the road, so the asymmetry holds end to end', () => {
    const fold = CENSUS.indexOf('Fold in the loops witness');
    const step = CENSUS.slice(fold, CENSUS.indexOf('The census, and the two questions'));
    expect(step).toMatch(/"last_run_at": e\.get\("last_run_at"\), "from": e\.get\("from"\)/);
    expect(step).not.toMatch(/runs_counted["']?\s*:/);
  });
});
