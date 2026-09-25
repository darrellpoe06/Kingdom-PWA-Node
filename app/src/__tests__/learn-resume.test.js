// =============================================================================
// learn-resume — the device-local "your place" record for the Learn space
// (lib/learn-resume.js). Pure over injected storage (DR-0076): every behavior
// the resume banner and the reopened lesson depend on is pinned here —
// round-trip, merge, the different-lesson reset, validation, and fail-soft.
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { getPlace, recordPlace, clearPlace, backUpPlace, refreshPlace, REFRESH_BACK_STEPS } from '../lib/learn-resume.js';

// A minimal in-memory Storage double.
function memStorage(seed = {}) {
  const m = new Map(Object.entries(seed));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

let storage;
beforeEach(() => { storage = memStorage(); });

describe('learn-resume — record and read the place', () => {
  it('round-trips a full place', () => {
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll3', stage: 1, step: 2 }, { storage, now: 1000 });
    expect(getPlace({ storage })).toEqual({ courseKey: 'living-lessons', lessonId: 'll3', sentence: 0, sentenceKey: '', stage: 1, step: 2, done: false, started: true, at: 1000 });
  });

  it('merges a partial patch into the SAME lesson (a step move keeps the stage)', () => {
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll3', stage: 1, step: 2 }, { storage, now: 1000 });
    recordPlace({ lessonId: 'll3', step: 4 }, { storage, now: 2000 });
    expect(getPlace({ storage })).toEqual({ courseKey: 'living-lessons', lessonId: 'll3', sentence: 0, sentenceKey: '', stage: 1, step: 4, done: false, started: true, at: 2000 });
  });

  it('opening a DIFFERENT lesson resets stage/step — a stale step never leaks into a fresh lesson', () => {
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll3', stage: 3, step: 5 }, { storage, now: 1000 });
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll7' }, { storage, now: 2000 });
    expect(getPlace({ storage })).toEqual({ courseKey: 'living-lessons', lessonId: 'll7', sentence: 0, sentenceKey: '', stage: 0, step: 0, done: false, started: false, at: 2000 });
  });

  it('a stage move on the same lesson keeps the course key without re-passing it', () => {
    recordPlace({ courseKey: 'world-issues', lessonId: 'wi1', stage: 0 }, { storage, now: 1000 });
    recordPlace({ lessonId: 'wi1', stage: 2 }, { storage, now: 2000 });
    const p = getPlace({ storage });
    expect(p.courseKey).toBe('world-issues');
    expect(p.stage).toBe(2);
  });

  it('never stores a half place (no lessonId → no record)', () => {
    recordPlace({ courseKey: 'living-lessons' }, { storage, now: 1000 });
    expect(getPlace({ storage })).toBeNull();
  });

  it('clamps hostile indexes (negative, NaN, huge) instead of storing them raw', () => {
    recordPlace({ courseKey: 'c', lessonId: 'l', stage: -4, step: Number.NaN }, { storage, now: 1 });
    expect(getPlace({ storage })).toMatchObject({ stage: 0, step: 0 });
    recordPlace({ courseKey: 'c', lessonId: 'l', stage: 5000, step: 3.9 }, { storage, now: 2 });
    expect(getPlace({ storage })).toMatchObject({ stage: 999, step: 3 });
  });

  it('fail-soft: malformed stored JSON / wrong shapes read as null, never throw', () => {
    for (const raw of ['not json', '[]', '"str"', '{"courseKey":7,"lessonId":"x"}', '{"courseKey":"c"}']) {
      const s = memStorage({ 'poe-learn-place': raw });
      expect(getPlace({ storage: s })).toBeNull();
    }
  });

  it('no storage at all: readers return null, writers no-op (never break a render)', () => {
    expect(getPlace({ storage: null })).toBeNull();
    expect(() => recordPlace({ courseKey: 'c', lessonId: 'l' }, { storage: null })).not.toThrow();
    expect(() => clearPlace({ storage: null })).not.toThrow();
  });

  it('clearPlace forgets the place (the "Start fresh" control)', () => {
    recordPlace({ courseKey: 'c', lessonId: 'l' }, { storage, now: 1 });
    clearPlace({ storage });
    expect(getPlace({ storage })).toBeNull();
  });
});

// REFRESH FIRST (DR-0418; Darrell 2026-09-15: "start where they left last
// time... so it can be a refresher if they wanted it"). Proven-to-catch: with
// backUpPlace returning the place unchanged, the first assertion fails.
describe('learn-resume — refresh first backs the place up a couple of steps', () => {
  it('backs the step up by REFRESH_BACK_STEPS inside the same stage and clears the sentence', () => {
    const p = { courseKey: 'living-lessons', lessonId: 'll151', stage: 1, step: 7, sentence: 4, sentenceKey: 'abc', at: 1 };
    expect(REFRESH_BACK_STEPS).toBe(2);
    expect(backUpPlace(p)).toEqual({ ...p, step: 5, sentence: 0, sentenceKey: '' });
  });
  it('never goes below the first step, and a custom distance is honoured', () => {
    const p = { courseKey: 'c', lessonId: 'l', stage: 2, step: 1 };
    expect(backUpPlace(p).step).toBe(0);
    expect(backUpPlace({ ...p, step: 9 }, 4).step).toBe(5);
    expect(backUpPlace(null)).toBeNull();
    expect(backUpPlace({ stage: 0, step: 3 })).toBeNull(); // no lesson → nothing to refresh
  });
  it('refreshPlace records the backed-up place so an ordinary resume lands on the refresher', () => {
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll151', stage: 1, step: 7 }, { storage, now: 1000 });
    const out = refreshPlace({ storage, now: 2000 });
    expect(out.step).toBe(5);
    expect(out.stage).toBe(1);
    expect(getPlace({ storage }).step).toBe(5);
  });
  it('refreshPlace with nothing saved is a no-op that returns null', () => {
    expect(refreshPlace({ storage })).toBeNull();
    expect(getPlace({ storage })).toBeNull();
  });
});
