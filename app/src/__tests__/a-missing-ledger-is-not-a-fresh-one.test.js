// @vitest-environment node
// =============================================================================
// A missing ledger is not a fresh one (DR-1152)
// =============================================================================
// DR-1151 gave the fleet census the NAS half by publishing loops-health's own
// witness. The FIRST LIVE RUN of it published this, for six of ten loops:
//
//     family-key           its own ledger, 0s old
//     agent-consumer       its own ledger, 0s old
//     db-backup            its own ledger, 0s old
//     ...
//
// Every one of those timestamps equalled the read time, and none of those loops
// has a ledger at all. `loops-health` writes `ledger_age_s: None` for a loop
// with no ledger; that is `null` in JSON; `Number(null)` is **0**; 0 is finite
// and `>= 0`. So the mapping invented "ran just now" and attached the words
// `its own ledger` to a file that does not exist.
//
// A FABRICATED MEASUREMENT WEARING FALSE PROVENANCE — the single thing this
// whole road was built to prevent, shipped inside the change whose own record
// argues against it. Two things had to change, not one:
//
//   1. the guard checks the TYPE, so a null cannot pass as a zero, and demands
//      `age > 0`, because a ledger written in the same second as the read
//      cannot be told apart from the absent case;
//   2. the rule moved OUT of the workflow's inline script into
//      `scripts/loops-witness-services.mjs`, because inline the only available
//      test was a grep of its source text — and a source-text assertion
//      survives the break it is meant to catch (DR-1147 §3). This file runs the
//      function.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { servicesFromWitness, ledgerAge } from '../../../scripts/loops-witness-services.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');

const NOW = Date.parse('2026-10-21T03:23:04.711Z');
const CLOCK = { last_run_at: '2026-10-21T03:16:50Z', age_s: 374 };

const witness = (loops) => ({ clock: CLOCK, loops });

describe('the null that wore a zero', () => {
  it('a loop with NO ledger gets no ledger timestamp — the live defect', () => {
    // The exact shape loops-health publishes for a loop it found no ledger for.
    const s = servicesFromWitness(witness({
      'family-key': { last_run: 'ok', ledger: null, ledger_age_s: null },
    }), { now: NOW });
    expect(s['family-key'].from).not.toMatch(/its own ledger/);
    expect(s['family-key'].last_run_at).not.toBe(new Date(NOW).toISOString());
  });

  it('ledgerAge refuses null, undefined, a string and a zero', () => {
    expect(ledgerAge({ ledger_age_s: null })).toBe(null);
    expect(ledgerAge({})).toBe(null);
    expect(ledgerAge({ ledger_age_s: '479' })).toBe(null);
    expect(ledgerAge({ ledger_age_s: 0 })).toBe(null);
    expect(ledgerAge({ ledger_age_s: NaN })).toBe(null);
    expect(ledgerAge({ ledger_age_s: -5 })).toBe(null);
    expect(ledgerAge(null)).toBe(null);
    // And accepts the real thing.
    expect(ledgerAge({ ledger_age_s: 479 })).toBe(479);
  });

  it('a real ledger age wins, and the arithmetic is the ledger’s own', () => {
    const s = servicesFromWitness(witness({
      'lesson-mail': { last_run: 'ok', ledger_age_s: 482 },
    }), { now: NOW });
    expect(s['lesson-mail'].from).toBe('its own ledger, 482s old');
    expect(s['lesson-mail'].last_run_at).toBe(new Date(NOW - 482_000).toISOString());
  });
});

describe('what a loop without its own ledger may still be credited with', () => {
  it('a loop that ran ok falls back to the cycle it ran ok in, named as such', () => {
    const s = servicesFromWitness(witness({
      'family-key': { last_run: 'ok', ledger_age_s: null },
    }), { now: NOW });
    expect(s['family-key'].last_run_at).toBe(CLOCK.last_run_at);
    expect(s['family-key'].from).toMatch(/services-sync cycle it last ran ok in/);
  });

  it('a loop that did NOT run ok gets no timestamp and says why', () => {
    const s = servicesFromWitness(witness({
      a: { last_run: 'failed', ledger_age_s: null },
      b: { last_run: 'degraded', ledger_age_s: null },
      c: { last_run: 'unknown', ledger_age_s: null },
      d: { ledger_age_s: null },
    }), { now: NOW });
    for (const k of ['a', 'b', 'c', 'd']) {
      expect(s[k].last_run_at, k).toBe(null);
      expect(s[k].from, k).toMatch(/no timestamp available/);
    }
    expect(s.a.from).toMatch(/last run failed/);
    expect(s.d.verdict).toBe('unknown');
  });

  it('with no clock recorded, an ok loop still gets nothing invented for it', () => {
    const s = servicesFromWitness({ clock: {}, loops: { x: { last_run: 'ok', ledger_age_s: null } } },
      { now: NOW });
    expect(s.x.last_run_at).toBe(null);
    expect(s.x.from).toMatch(/no timestamp available/);
  });

  it('an empty or malformed witness yields nothing, never a guess', () => {
    expect(servicesFromWitness(null, { now: NOW })).toEqual({});
    expect(servicesFromWitness({}, { now: NOW })).toEqual({});
    expect(servicesFromWitness({ loops: 'not an object' }, { now: NOW })).toEqual({});
  });
});

describe('the whole live witness, replayed', () => {
  // The ten loops exactly as the first live run reported them: four with real
  // ledger ages, six with none. Before the fix all ten claimed a ledger.
  const LIVE = {
    'lesson-voice': { last_run: 'ok', ledger_age_s: 479 },
    'lesson-parity': { last_run: 'ok', ledger_age_s: 479 },
    'church-mail': { last_run: 'ok', ledger_age_s: 482 },
    'lesson-mail': { last_run: 'ok', ledger_age_s: 482 },
    'family-key': { last_run: 'ok', ledger_age_s: null },
    'agent-consumer': { last_run: 'ok', ledger_age_s: null },
    'db-backup': { last_run: 'ok', ledger_age_s: null },
    'choir-dates': { last_run: 'ok', ledger_age_s: null },
    'stream-length': { last_run: 'ok', ledger_age_s: null },
    'worship-song-harvest': { last_run: 'ok', ledger_age_s: null },
  };

  it('exactly four claim a ledger, and it is the four that have one', () => {
    const s = servicesFromWitness(witness(LIVE), { now: NOW });
    const byLedger = Object.entries(s).filter(([, v]) => /its own ledger/.test(v.from));
    expect(byLedger.map(([k]) => k).sort())
      .toEqual(['church-mail', 'lesson-mail', 'lesson-parity', 'lesson-voice']);
  });

  it('the other six are credited to the cycle, not to a file they do not have', () => {
    const s = servicesFromWitness(witness(LIVE), { now: NOW });
    const byClock = Object.entries(s).filter(([, v]) => /services-sync cycle/.test(v.from));
    expect(byClock).toHaveLength(6);
    for (const [, v] of byClock) expect(v.last_run_at).toBe(CLOCK.last_run_at);
  });

  it('no loop is left with a timestamp whose provenance is unstated', () => {
    const s = servicesFromWitness(witness(LIVE), { now: NOW });
    for (const [k, v] of Object.entries(s)) {
      expect(typeof v.from, k).toBe('string');
      expect(v.from.length, k).toBeGreaterThan(10);
      if (v.last_run_at) expect(v.from, k).not.toMatch(/no timestamp available/);
    }
  });
});

describe('the workflow calls this file rather than keeping its own copy', () => {
  const LOOPS = readFileSync(join(REPO, '.github/workflows/loops-health.yml'), 'utf8');

  it('loops-health imports the shared rule', () => {
    expect(LOOPS).toMatch(/servicesFromWitness/);
    expect(LOOPS).toMatch(/scripts\/loops-witness-services\.mjs/);
  });

  it('and keeps no inline copy of the arithmetic to drift from it', () => {
    // Two implementations of one rule is how the inline version got away with
    // being wrong in the first place.
    expect(LOOPS).not.toMatch(/Number\(e && e\.ledger_age_s\)/);
    expect(LOOPS).not.toMatch(/its own ledger, \$\{age\}s old/);
  });
});
