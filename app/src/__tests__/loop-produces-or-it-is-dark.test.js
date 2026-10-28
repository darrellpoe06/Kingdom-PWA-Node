// @vitest-environment node
// =============================================================================
// A loop that ships nothing is not healthy, however ready it is (DR-1219)
// =============================================================================
// MEASURED ON OUR OWN WITNESS, 2026-10-26. Fifteen of Darrell's lesson rows sat
// in the in-app queue for up to 102 hours, every one claimed by the NAS
// builder, written, gated and FAILED inside two seconds, twice each. Nothing
// shipped for four days. `lesson-builder-health.yml` ran daily through all of
// it and printed "verdict passed -- nothing to diagnose", because it judges
// unit/stopped/writer-ready/credential and `--status` has no outcome field to
// report. The stale alarm rang five times on the oldest row; the witness wired
// to the `incident` label said green.
//
// So the cases below are weighted at that exact shape: READY AND PRODUCING
// NOTHING must never read as healthy, and an unread queue must never read as
// an empty one.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  verdictOf, exitCodeOf, problemsOf,
  HEALTHY, DARK_IN_EFFECT, UNKNOWN, NOT_READY, ALARM_HOURS,
} from '../../../scripts/loop-produces-or-it-is-dark.mjs';

// AND THE WIRING THAT FEEDS IT (DR-1238), because judging well on numbers
// nobody fetched is worth nothing.
//
// DR-1219 shipped the verdict function with fifteen cases and NOTHING covering
// the read that hands it the numbers, and the read it shipped could not succeed:
// `scripts/live-sql.sh` requires NAS_SSH_KEY and opens its OWN connection to the
// NAS, so it is a RUNNER-side tool, and DR-1219 called it from inside the `sh -s`
// heredoc already running ON the NAS, where it exits 10 at its first line. Three
// runs read UNKNOWN before anyone noticed (40423587612, 40425627048,
// 40431353829). DR-1232 fixed it by adding a runner step that holds the key.
//
// NOTHING STOPS THAT REGRESSING. These cases are the missing half: not another
// assertion about the judgement, but about WHERE the read runs.
//
// They are written against the workflow AS IT IS, not as one might assume:
// `live-sql.sh` is invoked FOUR times on purpose (the probe, the re-offer, the
// runner outcome read, and the in-heredoc read DR-1232 deliberately KEPT as a
// documented fallback). So these do NOT demand a single invocation — an earlier
// draft of this gate did, which was simply wrong about the system and would have
// forced that fallback out. What they demand is that the read which ANSWERS runs
// on the runner, carries the key, and keeps its stderr.
const WF = readFileSync(join(process.cwd(), '..', '.github', 'workflows', 'lesson-builder-health.yml'), 'utf8');

/** Split a workflow's steps on the step indent, so a claim is made about ONE step. */
export function stepsOf(text) {
  return text.split(/\n {6}- (?=name:|uses:)/).slice(1);
}
/** Comment lines dropped: this file explains the wiring in prose, and prose is not a command. */
const commandsOnly = (s) => s.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
/** An invocation of the OUTCOME read specifically, not any live-sql call. */
const READS_OUTCOME = /(^|[\s;&|(=$"])(bash|sh|\.\/)?\s*scripts\/live-sql\.sh[^\n]*lesson-loop-outcome\.sql/m;

export function outcomeReadWiring(text) {
  const steps = stepsOf(text).map(commandsOnly);
  const reads = steps.filter((s) => READS_OUTCOME.test(s));
  const onRunner = reads.filter((s) => !s.includes("'sh -s'"));
  return {
    reads: reads.length,
    onRunner: onRunner.length,
    runnerHasKey: onRunner.some((s) => s.includes('NAS_SSH_KEY')),
    runnerKeepsStderr: onRunner.some((s) => /2>\s*\/tmp\/\S+/.test(s) && !/lesson-loop-outcome\.sql[^\n]*2>\s*\/dev\/null/.test(s)),
  };
}

/** The live shape on 2026-10-26, from the witness log and the bell. */
const THE_REAL_FOUR_DAYS = {
  writerReady: true, waiting: 15, oldestWaitHours: 102, shippedLastDay: 0,
};

describe('verdictOf — readiness is not production', () => {
  it('PROVEN-TO-CATCH: ready with a starving queue is DARK, not healthy — the four days themselves', () => {
    // This is the precise input the health witness had available on each of the
    // four days it passed. Every readiness field was true; nothing shipped.
    const v = verdictOf(THE_REAL_FOUR_DAYS);
    expect(v.verdict, 'a ready loop that ships nothing is not healthy').toBe(DARK_IN_EFFECT);
    expect(v.why).toMatch(/READY AND PRODUCING NOTHING/);
    expect(v.why, 'it names the counts a reader needs').toMatch(/15 row\(s\) waiting, the oldest 102h/);
    expect(v.why, 'and says plainly why readiness did not save it').toMatch(/Readiness is not production/);
    expect(exitCodeOf(v.verdict), 'and it must not exit 0').not.toBe(0);
  });

  it('PROVEN-TO-CATCH: readiness ALONE can never reach healthy while the queue starves', () => {
    // The bug was readiness standing in for the outcome. No combination of
    // ready-flags may produce a pass when rows are past the alarm and nothing
    // shipped — only a real shipped count or a real empty queue can.
    for (const waiting of [1, 3, 15, 400]) {
      for (const oldest of [ALARM_HOURS, ALARM_HOURS + 1, 102]) {
        const v = verdictOf({ writerReady: true, waiting, oldestWaitHours: oldest, shippedLastDay: 0 });
        expect(v.verdict, `waiting=${waiting} oldest=${oldest}`).toBe(DARK_IN_EFFECT);
      }
    }
  });

  it('nothing waiting is the one honest silence', () => {
    const v = verdictOf({ writerReady: true, waiting: 0, oldestWaitHours: 0, shippedLastDay: 0 });
    expect(v.verdict).toBe(HEALTHY);
    expect(v.why).toMatch(/nothing is waiting, so nothing is owed/);
  });

  it('a queue inside the alarm is healthy — a row in flight is not a failure', () => {
    const v = verdictOf({ writerReady: true, waiting: 2, oldestWaitHours: 1, shippedLastDay: 0 });
    expect(v.verdict).toBe(HEALTHY);
    expect(v.why).toMatch(/inside the 4h alarm/);
  });

  it('a backlog that is moving is healthy — something shipped in the window', () => {
    const v = verdictOf({ ...THE_REAL_FOUR_DAYS, shippedLastDay: 3 });
    expect(v.verdict).toBe(HEALTHY);
    expect(v.why).toMatch(/3 shipped in the window/);
  });

  it('the alarm threshold is configurable and is applied as given', () => {
    const base = { writerReady: true, waiting: 1, oldestWaitHours: 6, shippedLastDay: 0 };
    expect(verdictOf({ ...base, alarmHours: 12 }).verdict, 'inside a wider alarm').toBe(HEALTHY);
    expect(verdictOf({ ...base, alarmHours: 2 }).verdict, 'past a tighter one').toBe(DARK_IN_EFFECT);
  });
});

describe('verdictOf — an unread queue is not an empty one', () => {
  it('PROVEN-TO-CATCH: a queue that could not be read is UNKNOWN, never healthy', () => {
    // DR-1186 / DR-0125, and the same rule DR-1210 pinned for the deploy
    // proof. The dangerous direction is a failed read becoming a zero.
    for (const waiting of [null, undefined, NaN, 'none']) {
      const v = verdictOf({ writerReady: true, waiting, oldestWaitHours: 10, shippedLastDay: 0 });
      expect(v.verdict, String(waiting)).toBe(UNKNOWN);
      expect(v.why).toMatch(/an unread queue is NOT an empty one/);
    }
  });

  it('an unreadable shipped count is UNKNOWN, not zero — zero would read as DARK', () => {
    // Worth keeping apart: a missing shipped count must not be assumed 0 and
    // raise a false alarm, any more than it may be assumed positive and hide a
    // real one. Either guess is a claim the witness did not measure.
    const v = verdictOf({ writerReady: true, waiting: 15, oldestWaitHours: 102, shippedLastDay: null });
    expect(v.verdict).toBe(UNKNOWN);
  });

  it('a waiting queue of unknown age is UNKNOWN', () => {
    const v = verdictOf({ writerReady: true, waiting: 15, oldestWaitHours: null, shippedLastDay: 0 });
    expect(v.verdict).toBe(UNKNOWN);
    expect(v.why).toMatch(/how long could not be read/);
  });

  it('unreadable readiness is UNKNOWN, and is not the same as not ready', () => {
    expect(verdictOf({ writerReady: null, waiting: 0, shippedLastDay: 0 }).verdict).toBe(UNKNOWN);
    expect(verdictOf({}).verdict).toBe(UNKNOWN);
    expect(verdictOf().verdict).toBe(UNKNOWN);
  });
});

describe('verdictOf — "it cannot build" and "every build fails" are different cures', () => {
  it('no writer ready is NOT_READY, kept apart from DARK', () => {
    const v = verdictOf({ writerReady: false, waiting: 15, oldestWaitHours: 102, shippedLastDay: 0 });
    expect(v.verdict).toBe(NOT_READY);
    expect(v.why).toMatch(/cannot build at all/);
    expect(NOT_READY).not.toBe(DARK_IN_EFFECT);
    expect(exitCodeOf(NOT_READY)).not.toBe(exitCodeOf(DARK_IN_EFFECT));
  });

  it('PROVEN-TO-CATCH: DARK says restarting the unit is not the cure', () => {
    // The wrong cure is the expensive part of a misread: on these inputs every
    // readiness field is already green, so a reader who treats DARK as a
    // readiness problem restarts a healthy unit and the gate keeps failing.
    const v = verdictOf(THE_REAL_FOUR_DAYS);
    expect(v.why).toMatch(/every writer can be ready while every build fails the gate/);
  });
});

describe('exitCodeOf — "producing nothing" is not "cannot build", and neither is a pass', () => {
  it('maps the outcomes to distinct codes', () => {
    expect(exitCodeOf(HEALTHY)).toBe(0);
    expect(exitCodeOf(DARK_IN_EFFECT)).toBe(1);
    expect(exitCodeOf(UNKNOWN)).toBe(2);
    expect(exitCodeOf(NOT_READY)).toBe(3);
    expect(new Set([0, 1, 2, 3]).size).toBe(4);
  });

  it('PROVEN-TO-CATCH: nothing unrecognised maps to 0', () => {
    for (const v of ['HEALTHY', 'pass', 'ok', '', null, undefined, 'passed']) {
      expect(exitCodeOf(v), `${String(v)} must not read as healthy`).not.toBe(0);
    }
  });
});

describe('problemsOf — it reinforces the existing judgement rather than replacing it', () => {
  it('gives the health witness a line for every non-pass, and none for a pass', () => {
    expect(problemsOf(verdictOf(THE_REAL_FOUR_DAYS))).toHaveLength(1);
    expect(problemsOf(verdictOf({ writerReady: false }))).toHaveLength(1);
    expect(problemsOf(verdictOf({}))).toHaveLength(1);
    expect(problemsOf(verdictOf({ writerReady: true, waiting: 0, shippedLastDay: 0 }))).toEqual([]);
    expect(problemsOf(null)).toEqual([]);
  });
});

describe('the outcome read stays on the runner — the wiring, not the judgement (DR-1238)', () => {
  it('the read that answers runs on the runner, holds the key, and keeps its stderr', () => {
    const w = outcomeReadWiring(WF);
    expect(w.reads, 'something must read the outcome at all').toBeGreaterThan(0);
    expect(w.onRunner, 'at least one outcome read must be OUTSIDE the ssh heredoc').toBeGreaterThan(0);
    expect(w.runnerHasKey, 'the runner-side read must carry NAS_SSH_KEY, which the NAS does not hold for itself').toBe(true);
    expect(w.runnerKeepsStderr, 'the runner-side read must keep stderr, so a failed read says WHY').toBe(true);
  });

  it('PROVEN-TO-CATCH: the exact DR-1219 shape — the only outcome read inside the heredoc — is flagged', () => {
    const broken = [
      '',
      '      - name: Ask the builder for its own status',
      '        run: |',
      "          $SSH 'sh -s' <<'EOS' > /tmp/witness.json",
      '          OUTCOME="$(cd "$REPO" && bash scripts/live-sql.sh \'|\' < scripts/lesson-loop-outcome.sql 2>/dev/null || true)"',
      '          EOS',
      '',
      '      - name: Judge and report',
      '        run: |',
      '          echo judging',
    ].join('\n');
    const w = outcomeReadWiring(broken);
    expect(w.reads, 'the read is there').toBe(1);
    expect(w.onRunner, 'but none of it is on the runner — this is the break that shipped green').toBe(0);
    expect(w.runnerHasKey).toBe(false);
    expect(w.runnerKeepsStderr).toBe(false);
  });

  it('PROVEN-TO-CATCH: a runner read that throws its stderr away is flagged', () => {
    const silent = [
      '',
      '      - name: Read the outcome from the runner',
      '        env:',
      '          NAS_SSH_KEY: ${{ secrets.NAS_SSH_KEY }}',
      '        run: |',
      "          OUTCOME=\"$(bash scripts/live-sql.sh '|' < scripts/lesson-loop-outcome.sql 2>/dev/null || true)\"",
      '',
      '      - name: Judge and report',
      '        run: |',
      '          echo judging',
    ].join('\n');
    const w = outcomeReadWiring(silent);
    expect(w.onRunner).toBe(1);
    expect(w.runnerHasKey).toBe(true);
    expect(w.runnerKeepsStderr, 'a swallowed error is why the first failure said nothing').toBe(false);
  });

  it('does NOT demand a single invocation — the kept fallback and the two probes are deliberate', () => {
    // The real workflow calls live-sql.sh four times. A gate that insisted on one
    // would be wrong about the system, and would force out the fallback DR-1232
    // chose to keep. Only the OUTCOME read is the subject here.
    expect((WF.match(/scripts\/live-sql\.sh/g) || []).length).toBeGreaterThan(1);
    expect(outcomeReadWiring(WF).onRunner).toBeGreaterThan(0);
  });
});
