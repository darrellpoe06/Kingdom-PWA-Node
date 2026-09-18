// @vitest-environment node
// =============================================================================
// A WITNESS WHOSE SILENCE IS AMBIGUOUS IS NOT A WITNESS
// =============================================================================
// WHY THIS EXISTS, measured rather than theorised. On 2026-09-18 site-health.yml
// was dispatched on main to answer one question — had the merge that just landed
// actually reached the live site? — and it produced NO observable record. Not a
// failure, not a pass: nothing. The question had no answer.
//
// The cause was structural and it was the same cause DR-0125 was written about.
// site-health.yml filed to the incident ledger on FAILURE and closed a recovered
// incident, and that was all. A run that passed left nothing behind, so "no
// issue filed" meant either "the site is fine" or "the witness never ran" —
// two different answers that cannot be told apart. DR-0125's own rule is that
// unknown freshness must NEVER read as fresh, and the instrument created to
// enforce it was itself breaking it.
//
// level-witness.yml had already learned this one day earlier, on its first clean
// run, and carries a rolling run log (issue #1687). This gate makes that the
// RULE for the class rather than a habit two workflows happen to share: any
// workflow that files a finding to the incident ledger must also append to a
// rolling run log on every run, pass or fail, so that silence on the log is
// itself the finding.
//
// SHRINK-ONLY, not a retrofit. Four workflows still file only on failure and are
// recorded in the baseline. Writing four run-log steps in one pass would mean
// naming outputs nobody has measured, and a log line that reads "unknown" for
// every field is exactly the gate-that-always-passes DR-0076 §3 forbids. The
// list may only shrink; a NEW incident-filing workflow must carry one from its
// first commit.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import baseline from '../lib/witness-run-log-baseline.json';

const DIR = join(process.cwd(), '..', '.github', 'workflows');
const FILES = readdirSync(DIR).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
const read = (f) => readFileSync(join(DIR, f), 'utf8');

/** A workflow is a WITNESS when it files a finding to the incident ledger. */
const filesIncident = (src) => src.includes('--label incident');
/** It leaves a readable trail when it appends to a rolling log on every run. */
const hasRunLog = (src) => /name:\s*Record the run \(rolling log/.test(src);

const WITNESSES = FILES.filter((f) => filesIncident(read(f)));

describe('every witness that files a finding also leaves a run log', () => {
  it('the scan finds the real witnesses — it is not measuring nothing', () => {
    expect(FILES.length, 'no workflows found; the path is wrong').toBeGreaterThan(10);
    expect(WITNESSES, 'site-health must be counted as a witness').toContain('site-health.yml');
    expect(WITNESSES, 'level-witness must be counted as a witness').toContain('level-witness.yml');
    expect(WITNESSES.length).toBeGreaterThanOrEqual(5);
  });

  it('no witness is missing a run log except the ones recorded as debt', () => {
    const missing = WITNESSES.filter((f) => !hasRunLog(read(f)));
    const unrecorded = missing.filter((f) => !baseline.withoutRunLog.includes(f));
    expect(unrecorded, `these file findings with no run log, and are NOT recorded debt:\n${unrecorded.join('\n')}`).toEqual([]);
  });

  it('reports healing, so the baseline can be shrunk deliberately', () => {
    const healed = baseline.withoutRunLog.filter((f) => FILES.includes(f) && hasRunLog(read(f)));
    expect(healed, `these now carry a run log — remove them from the baseline:\n${healed.join('\n')}`).toEqual([]);
  });

  it('no baseline entry is a ghost — a workflow that is gone can never heal', () => {
    const gone = baseline.withoutRunLog.filter((f) => !FILES.includes(f));
    expect(gone, `baseline names workflows that no longer exist: ${gone.join(', ')}`).toEqual([]);
  });
});

describe('a run log that exists must actually be readable', () => {
  const withLog = WITNESSES.filter((f) => hasRunLog(read(f)));

  it('at least two witnesses carry one, and each one is checked', () => {
    expect(withLog.length).toBeGreaterThanOrEqual(2);
  });

  for (const f of WITNESSES.filter((x) => hasRunLog(read(x)))) {
    it(`${f}: the run log fires on EVERY run and says what silence means`, () => {
      const src = read(f);
      // the step itself, sliced out — checking the whole file would let the
      // incident step's wording satisfy an assertion about the run log, which
      // is the exact defect the level-witness test found in its own first draft.
      const from = src.indexOf('name: Record the run (rolling log');
      const rest = src.slice(from);
      const to = rest.indexOf('- name: ', 10);
      const step = to > 0 ? rest.slice(0, to) : rest;

      expect(step, 'a run log that only fires on success cannot report a crash').toMatch(/if:\s*always\(\)/);
      expect(step, 'it must append rather than only create').toMatch(/gh issue comment/);
      expect(step, 'and create the log the first time').toMatch(/gh issue create/);
      expect(step, 'it must find its own log, not another workflow’s').toMatch(/in:title[^\n]*run log/);
      expect(step, 'every line needs a timestamp or it cannot be read as a sequence').toMatch(/date -u \+%FT%TZ/);
      expect(step, 'and a link back to the run that wrote it').toContain('actions/runs/${GITHUB_RUN_ID}');
      expect(src, 'silence on the log must be documented as meaning NOT RUN')
        .toMatch(/SILENCE on this log means the witness did not run/);
    });
  }

  it('site-health’s log answers the question it was dispatched to answer', () => {
    // The question on 2026-09-18 was "did the merge reach the live site?", so
    // the served build and main's head must BOTH appear on the line. A log that
    // says only "UP" does not answer it.
    const src = read('site-health.yml');
    const from = src.indexOf('name: Record the run (rolling log');
    const step = src.slice(from, src.indexOf('- name: ', from + 10));
    expect(step).toContain('Served build: ${SERVED:-unknown}');
    expect(step).toContain('main: ${MAIN:-unknown}');
    expect(step, 'a stale-but-up run must read differently from a fresh one').toMatch(/UP but STALE/);
    expect(step, 'and a fresh one must say so plainly').toMatch(/UP\. Fresh/);
  });
});

describe('the gate can actually fail', () => {
  it('catches a witness with no run log at all', () => {
    const fake = 'run: gh issue create --label incident --title x';
    expect(filesIncident(fake), 'a witness was not recognised').toBe(true);
    expect(hasRunLog(fake), 'a workflow with no run log passed').toBe(false);
  });

  it('catches a run log that would only fire on success', () => {
    const step = '- name: Record the run (rolling log, pass or fail)\n  if: success()\n  run: gh issue comment\n';
    expect(/if:\s*always\(\)/.test(step), 'a success-only run log passed').toBe(false);
  });

  it('catches a log step that searches for ANOTHER workflow’s log', () => {
    const step = 'gh issue list --search "in:title level-witness run log"';
    expect(/in:title[^\n]*run log/.test(step)).toBe(true);
    // and the site-health step must not be the one searching for it
    const src = read('site-health.yml');
    const from = src.indexOf('name: Record the run (rolling log');
    const own = src.slice(from, src.indexOf('- name: ', from + 10));
    expect(own.includes('in:title level-witness run log'),
      'site-health would append to the level witness’s log').toBe(false);
  });
});

describe('a witness switched off still says so', () => {
  // The hole this closes, found the hard way: both witnesses carry a job-level
  // `if` on a repository variable. When that variable is 'false' the whole job
  // is SKIPPED, so the run-log step inside it never runs — and the log then
  // looks identical to a workflow that was never dispatched. That makes
  // "switched off on purpose" indistinguishable from "never fired", which is
  // the same ambiguity the run log was built to remove. A separate job that
  // runs only when the main one was skipped leaves the line it could not.
  for (const f of ['site-health.yml', 'level-witness.yml']) {
    it(`${f}: a skipped probe still appends a DISABLED line`, () => {
      const src = read(f);
      const from = src.indexOf('log_disabled:');
      expect(from, 'no log_disabled job').toBeGreaterThan(0);
      const job = src.slice(from);
      expect(job, 'it must run even when the job it watches did not').toMatch(/always\(\)/);
      expect(job, 'and only when that job was skipped').toMatch(/result == 'skipped'/);
      expect(job, 'the line must name the state plainly').toMatch(/DISABLED/);
      expect(job, 'and name the switch that has to be flipped back').toMatch(/_ENABLED/);
      expect(job, 'it appends to the same rolling log the probe uses').toMatch(/in:title[^\n]*run log/);
      // the dependency must name a job that actually exists, or the whole
      // workflow file is invalid — caught exactly this way on the first draft,
      // where level-witness's job is `witness` and not `probe`.
      const needs = /log_disabled:[\s\S]*?needs:\s*(\w+)/.exec(src);
      expect(needs, 'no needs: on log_disabled').toBeTruthy();
      expect(src, `needs: ${needs[1]} names no such job`).toMatch(new RegExp(`\\n  ${needs[1]}:`));
    });
  }

  it('PROVEN-TO-CATCH: a needs: pointing at a job that does not exist', () => {
    const bad = '\n  witness:\n    runs-on: x\n  log_disabled:\n    needs: probe\n';
    const needs = /log_disabled:[\s\S]*?needs:\s*(\w+)/.exec(bad);
    expect(needs[1]).toBe('probe');
    expect(new RegExp(`\\n  ${needs[1]}:`).test(bad), 'a dangling needs passed').toBe(false);
  });
});
