// @vitest-environment node
// =============================================================================
// The fleet census reaches the board (DR-1148)
// =============================================================================
// Darrell brought back a job-migration census — 149 jobs, 131 enabled, 78 with
// a last run date — and asked the two questions nobody could answer about our
// OWN automation. scripts/fleet-census.mjs answers them (DR-1140) and
// .github/workflows/fleet-census.yml asks GitHub the half the repository
// cannot know. Then the answer landed in a step summary, an artifact, and an
// incident issue filed ONLY when something was broken: three places he does
// not read. A report nobody can see is not a report (DR-0065).
//
// WHAT THESE CASES PIN, and why each one is here rather than being obvious:
//   1. The board reads the census's OWN numbers out of the fenced json block.
//      It never re-derives a figure, because a second computation is a second
//      answer that can disagree with the one that was measured.
//   2. "Enabled with no last run date" stays THREE populations. That is the
//      entire answer to Darrell's second question, and merging them is how a
//      census becomes a confident wrong answer.
//   3. Every way the read can fail says WHICH way, and none of them renders as
//      a healthy fleet (DR-0076). A missing report, an unparseable block, a
//      body with no block, a rate limit and a stale census are five different
//      states and the strip must not flatten them into one green dot.
//   4. The workflow actually writes the thing this file reads — a reader
//      pointed at a file nothing writes reports "no data" for ever, which is
//      the mistake made with lesson-mail's witness the day before.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseCensusBody, theThreeWayAnswer, censusFreshness, censusVerdict,
  fetchFleetCensus, CENSUS_STALE_MS,
} from '../lib/fleet-census-live.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const WF = join(REPO, '.github/workflows/fleet-census.yml');

// A census shaped exactly like `fleet-census.mjs --json` produces, with one
// job of each population so the three-way split has something to split.
const CENSUS = {
  window: 'the GitHub Actions run history retained for this repository, read at 2026-10-21T00:00:00Z',
  readAt: '2026-10-21T00:00:00Z',
  total: 5, enabled: 4, disabled: 1,
  withALastRun: 1, neverRun: 1, unknownLastRun: 2,
  byKind: { scheduled: 3, 'on-demand': 1, 'event-driven': 1 },
  jobs: [
    { name: 'ci.yml', kind: 'event-driven', onDemandOnly: false, lastRunClass: 'ran', lastRun: '2026-10-20T23:00:00Z' },
    { name: 'android-package.yml', kind: 'on-demand', onDemandOnly: true, lastRunClass: 'unknown', lastRun: null },
    { name: 'a-clock-with-nothing-behind-it.yml', kind: 'scheduled', onDemandOnly: false, lastRunClass: 'never', lastRun: null },
    { name: 'nobody-asked.yml', kind: 'scheduled', onDemandOnly: false, lastRunClass: 'unknown', lastRun: null },
    { name: 'disabled-one.yml', kind: 'scheduled', onDemandOnly: false, lastRunClass: 'ran', lastRun: '2026-10-01T00:00:00Z' },
  ],
};

const bodyWith = (doc) => [
  '**The fleet census.** Read at 2026-10-21T00:00:00Z.',
  '', '| measured | count |', '|---|---|', `| total jobs | ${doc.total} |`,
  '', '```json', JSON.stringify(doc, null, 1), '```',
].join('\n');

describe('the census arrives on the board as the census, not as prose', () => {
  it('reads the fenced block, not the human table beside it', () => {
    const c = parseCensusBody(bodyWith(CENSUS));
    expect(c.ok).toBe(true);
    expect(c.total).toBe(5);
    expect(c.enabled).toBe(4);
    expect(c.unknownLastRun).toBe(2);
    expect(c.jobs).toHaveLength(5);
    expect(c.window).toMatch(/retained/);
  });

  it('a body with no census block is unread, not an empty fleet', () => {
    const c = parseCensusBody('Somebody edited this issue and wrote a paragraph.');
    expect(c.ok).toBe(false);
    expect(c.why).toMatch(/no census block/);
    expect(c.total).toBeUndefined();
  });

  it('a block that will not parse says so instead of reporting zero jobs', () => {
    const c = parseCensusBody('```json\n{"total": 5,\n```');
    expect(c.ok).toBe(false);
    expect(c.why).toMatch(/does not parse/);
  });

  it('a parsed object that is not a census is refused', () => {
    // An object that parses is not thereby a census. Without a total there is
    // nothing to show, and showing nothing as "0 jobs" is a false green.
    const c = parseCensusBody('```json\n{"hello": "world"}\n```');
    expect(c.ok).toBe(false);
    expect(c.why).toMatch(/not a census/);
  });
});

describe('the answer to the question Darrell actually asked', () => {
  it('"enabled, no last run date" stays THREE populations with three decisions', () => {
    // THE CASE THIS WHOLE FILE EXISTS FOR. One number here is a wrong answer
    // delivered confidently: 40 of our own jobs are on-demand and correctly
    // have no run date, while a scheduled job with an empty history is a
    // retire-or-fix candidate, and one nobody asked about is a gap in the
    // REPORT. Same empty column, opposite decisions.
    const a = theThreeWayAnswer(parseCensusBody(bodyWith(CENSUS)));
    expect(a.nothingFiresIt.map((j) => j.name)).toEqual(['android-package.yml']);
    expect(a.askedAndEmpty.map((j) => j.name)).toEqual(['a-clock-with-nothing-behind-it.yml']);
    expect(a.nobodyAsked.map((j) => j.name)).toEqual(['nobody-asked.yml']);
    // And the three never overlap: a job belongs to exactly one of them.
    const all = [...a.nothingFiresIt, ...a.askedAndEmpty, ...a.nobodyAsked].map((j) => j.name);
    expect(new Set(all).size).toBe(all.length);
  });

  it('a job nobody asked about is never counted as a job that never ran', () => {
    const a = theThreeWayAnswer(parseCensusBody(bodyWith(CENSUS)));
    expect(a.askedAndEmpty.some((j) => j.lastRunClass === 'unknown')).toBe(false);
    expect(a.nobodyAsked.every((j) => j.lastRunClass === 'unknown')).toBe(true);
  });

  it('the verdict names the clock with nothing behind it before anything else', () => {
    const c = parseCensusBody(bodyWith(CENSUS));
    const v = censusVerdict(c, theThreeWayAnswer(c));
    expect(v.tone).toBe('bad');
    expect(v.line).toMatch(/1 job\(s\) on a clock with no run in retained history/);
  });

  it('an unanswered census is "unknown", never a clean bill of health', () => {
    const quiet = { ...CENSUS, jobs: [], neverRun: 0, unknownLastRun: 3, withALastRun: 0 };
    const c = parseCensusBody(bodyWith(quiet));
    const v = censusVerdict(c, theThreeWayAnswer(c));
    expect(v.tone).toBe('unknown');
    expect(v.line).toMatch(/no last-run answer yet/);
  });

  it('and a fleet with every job accounted for is allowed to read good', () => {
    const clean = {
      ...CENSUS, unknownLastRun: 0, neverRun: 0, withALastRun: 2,
      jobs: [
        { name: 'ci.yml', kind: 'event-driven', onDemandOnly: false, lastRunClass: 'ran' },
        { name: 'deploy.yml', kind: 'scheduled', onDemandOnly: false, lastRunClass: 'ran' },
      ],
    };
    const c = parseCensusBody(bodyWith(clean));
    expect(censusVerdict(c, theThreeWayAnswer(c)).tone).toBe('good');
  });
});

describe('freshness — an old census shown as current is a lie with a digit on it', () => {
  const NOW = Date.parse('2026-10-21T00:00:00Z');
  const run = (at, conclusion = 'success') => ({
    workflow_runs: [{ status: 'completed', conclusion, run_started_at: at, html_url: 'u' }],
  });

  it('a recent run is fresh', () => {
    const f = censusFreshness(run('2026-10-20T13:38:00Z'), { now: NOW });
    expect(f.known).toBe(true);
    expect(f.stale).toBe(false);
  });

  it('a run older than the window is stale', () => {
    const f = censusFreshness(run('2026-09-01T13:38:00Z'), { now: NOW });
    expect(f.stale).toBe(true);
    expect(f.ageMs).toBeGreaterThan(CENSUS_STALE_MS);
  });

  it('a census whose age cannot be computed is STALE, not fresh', () => {
    // Unknown freshness never reads as fresh (DR-0076 / DR-0125's own rule).
    expect(censusFreshness(run('not-a-date'), { now: NOW }).stale).toBe(true);
    expect(censusFreshness(run('2026-10-20T13:38:00Z'), {}).stale).toBe(true);
  });

  it('no completed run at all is "not known", and says nothing about the fleet', () => {
    const f = censusFreshness({ workflow_runs: [{ status: 'in_progress', conclusion: null }] }, { now: NOW });
    expect(f.known).toBe(false);
    expect(f.lastRunAt).toBe(null);
  });
});

describe('the live read, and every way it can fail', () => {
  const okRes = (body) => ({
    ok: true, status: 200, json: async () => body, headers: { get: () => null },
  });

  const fakeFetch = (routes) => async (url) => {
    for (const [frag, res] of routes) if (String(url).includes(frag)) return res;
    throw new Error(`unrouted ${url}`);
  };

  it('reads the report issue and the census workflow in one bounded pass', async () => {
    const out = await fetchFleetCensus({
      now: Date.parse('2026-10-21T00:00:00Z'),
      fetch: fakeFetch([
        ['labels=fleet-census-report', okRes([{ number: 7, body: bodyWith(CENSUS), html_url: 'https://x/7' }])],
        ['fleet-census.yml/runs', okRes({ workflow_runs: [{ status: 'completed', conclusion: 'success', run_started_at: '2026-10-20T13:38:00Z' }] })],
      ]),
    });
    expect(out.ok).toBe(true);
    expect(out.census.total).toBe(5);
    expect(out.answer.askedAndEmpty).toHaveLength(1);
    expect(out.freshness.stale).toBe(false);
    expect(out.reportUrl).toBe('https://x/7');
    expect(out.notice).toBe(null);
  });

  it('no report issue yet is a state of the REPORT, not of the fleet', async () => {
    const out = await fetchFleetCensus({
      now: Date.parse('2026-10-21T00:00:00Z'),
      fetch: fakeFetch([
        ['labels=fleet-census-report', okRes([])],
        ['fleet-census.yml/runs', okRes({ workflow_runs: [] })],
      ]),
    });
    expect(out.ok).toBe(false);
    expect(out.census.why).toMatch(/has not filed a report yet/);
    expect(out.verdict.tone).toBe('unknown');
  });

  it('a pull request wearing the label is not mistaken for the report', async () => {
    const out = await fetchFleetCensus({
      now: Date.parse('2026-10-21T00:00:00Z'),
      fetch: fakeFetch([
        ['labels=fleet-census-report', okRes([{ number: 9, pull_request: {}, body: bodyWith(CENSUS) }])],
        ['fleet-census.yml/runs', okRes({ workflow_runs: [] })],
      ]),
    });
    expect(out.ok).toBe(false);
  });

  it('a failed read says so and invents nothing', async () => {
    const out = await fetchFleetCensus({
      now: 1, fetch: async () => { throw new Error('socket hang up'); },
    });
    expect(out.ok).toBe(false);
    expect(out.census).toBe(null);
    expect(out.notice).toMatch(/socket hang up/);
    expect(out.notice).toMatch(/Nothing is invented/);
    expect(out.verdict.tone).toBe('unknown');
  });

  it('a rate limit is named as a rate limit, so nobody reads it as a fault', async () => {
    const out = await fetchFleetCensus({
      now: 1,
      fetch: async () => ({ ok: false, status: 403, headers: { get: () => null }, json: async () => ({}) }),
    });
    expect(out.notice).toMatch(/rate limit/i);
    expect(out.ok).toBe(false);
  });
});

describe('the writing half — a reader pointed at nothing reports nothing for ever', () => {
  const text = readFileSync(WF, 'utf8');

  it('the workflow writes the label this module reads', () => {
    // The lesson-mail witness was aimed at a path nothing wrote, the day
    // before this was built, and reported "no ledger" indefinitely. The reader
    // and the writer have to name the same thing, and a test is the only place
    // that stays true about it.
    expect(text).toMatch(/const label = 'fleet-census-report'/);
  });

  it('it writes the fenced json block the parser looks for', () => {
    expect(text).toMatch(/'```json'/);
    expect(text).toMatch(/JSON\.stringify\(c, null, 1\)/);
  });

  it('the report runs BEFORE the step that can fail the job', () => {
    // The ledger step calls core.setFailed when a clock has nothing behind it.
    // If the report came after it, the board would go dark exactly when there
    // was something worth showing.
    const report = text.indexOf('Report: the census on the board');
    const ledger = text.indexOf('a clock set with nothing behind it is an incident');
    expect(report).toBeGreaterThan(0);
    expect(ledger).toBeGreaterThan(report);
  });

  it('it does NOT label its report an incident — a healthy census is not an outage', () => {
    // The uptime strip reads `incident`. Filing a routine census there would
    // put a false outage on the board that reads the real ones.
    const step = text.slice(text.indexOf('Report: the census on the board'),
      text.indexOf('a clock set with nothing behind it is an incident'));
    expect(step).not.toMatch(/'incident'/);
    expect(step).toMatch(/labels: \[label\]/);
  });

  it('it stays read-only over the repository and the fleet', () => {
    expect(text).toMatch(/contents: read/);
    expect(text).not.toMatch(/contents: write/);
    expect(text).not.toMatch(/git push/);
  });
});
