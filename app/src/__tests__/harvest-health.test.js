// @vitest-environment node
// =============================================================================
// The witness tells the truth, and says WHICH failure it is
// =============================================================================
// Darrell 2026-08-11: "fix the witness too... in app surface... etc."
//
// harvest-health.yml existed and DID ring — roughly four times a day for five
// days — while the transcript corpus sat at 81 of 860 for 35 days. Three faults
// made that ringing worthless, and these pin all three fixes.
//
// FAULT 1 — it could report a FALSE GREEN. Freshness was max(created_at) over
// ALL rows of video_transcripts, and that table stores FAILURES as rows too (56
// of its 137 rows were errors). So the documented most-likely cause — a YouTube
// IP block — writes error rows steadily, holds the age near zero, and the probe
// reports ADVANCING and CLOSES the incident while producing zero transcripts.
// LESSONS P22 ("a green run must mean the target state MOVED; recorded-my-own-
// failure is not progress") living inside the instrument built to enforce it.
//
// FAULT 2 — "stalled" was one state with three hardcoded guesses appended. On
// 2026-08-11 all three were wrong: the NAS was up, YouTube was not blocking,
// the secrets were fine. A python module had simply never been installed.
//
// FAULT 3 — no in-app readout and no actuator, against DR-0135's explicit
// standard (probe → readout → actuator → announce; "a detector without an
// actuator is a named debt").
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifyHarvestPulse, normalizeHarvestRuns, harvestStats, parseHarvestComment,
} from '../lib/harvest-health.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const wf = () => readFileSync(join(ROOT, '.github/workflows/harvest-health.yml'), 'utf8');

describe('FAULT 1 — error rows can never read as progress', () => {
  it('PROVEN-TO-CATCH: a pipeline writing ONLY failures is BLOCKED, never advancing', () => {
    // The exact shape that would have fooled the old measure: the newest ROW is
    // one hour old, so max(created_at) over all rows says "fresh" — but nothing
    // has SUCCEEDED in 900 hours.
    const r = classifyHarvestPulse({
      transcribed: 81, total: 860, successAgeH: 900, attemptAgeH: 1, recentErrors: 40,
    });
    expect(r.stalled).toBe(true);
    expect(r.state).toBe('blocked');

    // And the old rule, stated plainly, to show what it would have done.
    const oldRule = ({ gaps, anyRowAgeH }) => gaps > 0 && anyRowAgeH >= 48;
    expect(oldRule({ gaps: 779, anyRowAgeH: 1 })).toBe(false); // "advancing" — the lie
  });

  it('the workflow measures freshness on rows WITH TEXT', () => {
    const src = wf();
    // The success-age subquery must be filtered; the unfiltered one may exist
    // only as the separately-labelled attempt age.
    expect(src).toMatch(/FROM video_transcripts WHERE length\(trim\(coalesce\(text,''\)\)\) > 0\), -1\)/);
    expect(src).toMatch(/hours since the newest SUCCESS/);
  });

  it('real success is still reported as advancing', () => {
    const r = classifyHarvestPulse({ transcribed: 500, total: 860, successAgeH: 2, attemptAgeH: 2 });
    expect(r.stalled).toBe(false);
    expect(r.state).toBe('advancing');
  });
});

describe('FAULT 2 — it says WHICH way it is broken', () => {
  it('SILENT: nothing written at all, not even a failure → not executing', () => {
    // The real 2026-08-11 reading: 35 days, zero rows of any kind.
    const r = classifyHarvestPulse({
      transcribed: 81, total: 860, successAgeH: 948, attemptAgeH: 861, recentErrors: 0,
    });
    expect(r.state).toBe('silent');
    expect(r.stalled).toBe(true);
    expect(r.nextAction).toMatch(/not EXECUTING/);
  });

  it('BLOCKED and SILENT give OPPOSITE next actions — that is the whole point', () => {
    const silent = classifyHarvestPulse({ transcribed: 81, total: 860, successAgeH: 900, attemptAgeH: 900, recentErrors: 0 });
    const blocked = classifyHarvestPulse({ transcribed: 81, total: 860, successAgeH: 900, attemptAgeH: 2, recentErrors: 9 });
    expect(silent.nextAction).not.toEqual(blocked.nextAction);
    expect(blocked.nextAction).toMatch(/being refused|IS running/);
  });

  it('the workflow no longer pastes the three guesses that were all wrong', () => {
    const src = wf();
    expect(src).not.toMatch(/the usual causes are the NAS being off the tailnet/);
    expect(src).toMatch(/SILENT/);
    expect(src).toMatch(/BLOCKED/);
  });

  it('never invents a verdict it could not measure', () => {
    const r = classifyHarvestPulse({ transcribed: null, total: null });
    expect(r.state).toBe('unknown');
    expect(r.stalled).toBe(false);
    expect(r.headline).toMatch(/could not be measured/i);
  });

  it('a finished corpus is not a stall, and an empty one is not either', () => {
    expect(classifyHarvestPulse({ transcribed: 860, total: 860, successAgeH: 999 }).state).toBe('complete');
    expect(classifyHarvestPulse({ transcribed: 0, total: 0 }).state).toBe('no-corpus');
  });
});

describe('FAULT 3 — the actuator DR-0135 requires', () => {
  it('a SILENT pipeline gets one services-sync heal', () => {
    const src = wf();
    expect(src).toMatch(/gh workflow run nas-bootstrap\.yml/);
    expect(src).toMatch(/steps\.probe\.outputs\.shape == 'SILENT'/);
  });

  it('a BLOCKED pipeline is NOT healed — that would spend budget against a self-clearing block', () => {
    const src = wf();
    const heal = src.slice(src.indexOf('Heal a SILENT pipeline'), src.indexOf('Record the stall'));
    // The CONDITION is the thing: it fires on SILENT only. (The step's name
    // says "never for BLOCKED", so assert the guard, not the absence of a word.)
    const cond = heal.split('\n').find((l) => l.trim().startsWith('if:'));
    expect(cond).toMatch(/== 'SILENT'/);
    expect(cond).not.toMatch(/BLOCKED/);
    expect(heal).toMatch(/never for BLOCKED/);
  });

  it('the heal keeps its brakes — one dispatch, and it cannot fail the record', () => {
    const src = wf();
    expect(src).toMatch(/continue-on-error: true/);
    expect(src).toMatch(/concurrency:/);
  });
});

describe('the in-app readout shows the probe’s OWN numbers', () => {
  it('parses the counts the workflow writes', () => {
    const p = parseHarvestComment('2026-08-11T00:00:00Z — SILENT: transcribed 81/860, 779 still owed. NOTHING has been written in 948h — not even a failure row');
    expect(p).toMatchObject({ transcribed: 81, total: 860, owed: 779, state: 'silent' });
  });

  it('returns null rather than guessing when there is nothing to parse', () => {
    expect(parseHarvestComment('')).toBeNull();
    expect(parseHarvestComment('a comment about something else')).toBeNull();
  });

  it('counts the failing streak so a MONTH is visible, not just the last check', () => {
    const runs = normalizeHarvestRuns({
      workflow_runs: Array.from({ length: 20 }, (_, i) => ({
        id: i, status: 'completed', conclusion: 'failure', created_at: `2026-08-${10 - (i % 9)}T00:00:00Z`,
      })),
    });
    const s = harvestStats(runs);
    expect(s.measured).toBe(true);
    expect(s.ok).toBe(false);
    expect(s.streak).toBe(20);
    expect(s.failing).toBe(20);
  });

  it('an unmeasured pipeline reads as unmeasured, never as healthy', () => {
    const s = harvestStats([]);
    expect(s.measured).toBe(false);
    expect(s.ok).toBeNull();
  });

  it('the OpsBoard mounts the strip', () => {
    const board = readFileSync(join(ROOT, 'app/src/components/OpsBoard.jsx'), 'utf8');
    expect(board).toMatch(/<HarvestStrip harvest=\{harvest\} \/>/);
    expect(board).toMatch(/fetchHarvestHealth/);
  });
});
