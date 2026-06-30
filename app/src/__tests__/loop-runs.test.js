// @vitest-environment jsdom
//
// loop-runs — the run-state CONTRACT loops emit + the read-only store (DR-0083).
// Proven-to-catch: appendRun caps to the newest N; latestRun picks the newest by
// `at`; recordLoopRun round-trips through localStorage; and — the load-bearing
// guarantee — recording is NON-BLOCKING (a broken store can never throw into the
// loop that's doing the real work). Observing must never break doing.
import { describe, it, expect, beforeEach } from 'vitest';
import { appendRun, latestRun, recordLoopRun, readLoopRuns } from '../lib/loop-runs.js';

beforeEach(() => { try { window.localStorage.clear(); } catch (e) { /* ignore */ } });

describe('appendRun (pure)', () => {
  it('appends newest-last', () => {
    const out = appendRun([{ key: 'a', at: '1' }], { key: 'a', at: '2' });
    expect(out.map((r) => r.at)).toEqual(['1', '2']);
  });
  it('caps to the most recent N', () => {
    let runs = [];
    for (let i = 0; i < 60; i++) runs = appendRun(runs, { key: 'k', at: String(i) }, 50);
    expect(runs).toHaveLength(50);
    expect(runs[0].at).toBe('10');   // oldest 10 dropped
    expect(runs[49].at).toBe('59');  // newest kept
  });
  it('tolerates a non-array prior value', () => {
    expect(appendRun(null, { key: 'a', at: '1' })).toHaveLength(1);
  });
});

describe('latestRun (pure)', () => {
  it('returns the newest record for a key, ignoring other keys', () => {
    const runs = [
      { key: 'import', at: '2026-06-01T00:00:00Z', processed: 1 },
      { key: 'other', at: '2026-06-09T00:00:00Z', processed: 9 },
      { key: 'import', at: '2026-06-05T00:00:00Z', processed: 5 },
    ];
    expect(latestRun(runs, 'import').processed).toBe(5);
    expect(latestRun(runs, 'missing')).toBe(null);
    expect(latestRun(null, 'import')).toBe(null);
  });
});

describe('recordLoopRun / readLoopRuns round-trip (localStorage)', () => {
  it('records a run and reads it back with a real timestamp', () => {
    const rec = recordLoopRun({ key: 'upload-import', status: 'success', processed: 47, detail: 'Main Checking · CSV/Excel' });
    expect(rec).toMatchObject({ key: 'upload-import', status: 'success', processed: 47 });
    expect(rec.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const back = readLoopRuns();
    expect(back).toHaveLength(1);
    expect(latestRun(back, 'upload-import').processed).toBe(47);
  });
  it('coerces an unknown status to success and clamps processed to a number', () => {
    const rec = recordLoopRun({ key: 'k', status: 'bogus', processed: 'x' });
    expect(rec.status).toBe('success');
    expect(rec.processed).toBe(0);
  });
  it('readLoopRuns returns [] on a corrupt store (never throws)', () => {
    window.localStorage.setItem('poe-loop-runs', '{not json');
    expect(readLoopRuns()).toEqual([]);
  });
  it('recordLoopRun is non-blocking: skips (returns null) with no key, never throws', () => {
    expect(recordLoopRun({})).toBe(null);
    expect(() => recordLoopRun(undefined)).not.toThrow();
  });
});
