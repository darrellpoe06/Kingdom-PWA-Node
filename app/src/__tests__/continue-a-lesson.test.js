// =============================================================================
// Continue a lesson — one place per LESSON, not one per device (DR-0623)
// =============================================================================
// Darrell 2026-09-24, from the live app: "Continuing a lesson doesn't work
// well... it needs to be way better..."
//
// Measured in a real browser before the fix: starting a second lesson (in
// another course) overwrote the first lesson's place — the device kept ONE
// record — so going back to the first lesson reopened it at part one, and no
// Continue for it existed anywhere. These pins hold the per-lesson record.
//
// PROVEN-TO-CATCH (DR-0076 §3): the first test below uses ONLY the API the
// old module had (recordPlace / getPlace). Against the pre-DR-0623
// learn-resume.js it fails — reopening lesson A after lesson B reads stage 0,
// because B's write replaced A's. See the DR for the recorded run.
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPlace, recordPlace, clearPlace, finishPlace, refreshPlace,
  getPlaceFor, listPlaces, placeInProgress, placeAgo, placeWhere, clearAllPlaces, PLACES_CAP,
} from '../lib/learn-resume.js';

function memStorage(seed = {}) {
  const m = new Map(Object.entries(seed));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    raw: m,
  };
}

let storage;
beforeEach(() => { storage = memStorage(); });

describe('a second lesson never costs the first its place', () => {
  it('going back to lesson A after lesson B picks up A where it was (old API only)', () => {
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll1', stage: 1, step: 2 }, { storage, now: 1000 });
    // A second lesson, in another course, is started and moved in.
    recordPlace({ courseKey: 'ai', lessonId: 'wk1', stage: 2 }, { storage, now: 2000 });
    // The reader goes back to lesson A — exactly what opening a lesson writes.
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll1' }, { storage, now: 3000 });
    const p = getPlace({ storage });
    expect(p.lessonId).toBe('ll1');
    expect(p.stage).toBe(1);
    expect(p.step).toBe(2);
  });

  it('each lesson keeps its own place, and the latest is still "the place"', () => {
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll1', stage: 1, step: 2, sentence: 4, sentenceKey: 'aaa' }, { storage, now: 1000 });
    recordPlace({ courseKey: 'ai', lessonId: 'wk1', stage: 2 }, { storage, now: 2000 });
    expect(getPlaceFor('living-lessons', 'll1', { storage })).toMatchObject({ stage: 1, step: 2, sentence: 4, sentenceKey: 'aaa' });
    expect(getPlaceFor('ai', 'wk1', { storage })).toMatchObject({ stage: 2, step: 0 });
    expect(getPlace({ storage }).lessonId).toBe('wk1');
    // The course may be omitted: a lesson id names one home.
    expect(getPlaceFor(null, 'll1', { storage }).courseKey).toBe('living-lessons');
  });

  it("the reader's sentence write lands on the lesson it names as latest, not on another", () => {
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll1', stage: 1 }, { storage, now: 1000 });
    recordPlace({ courseKey: 'ai', lessonId: 'wk1' }, { storage, now: 2000 });
    recordPlace({ sentence: 7, sentenceKey: 'bbb' }, { storage, now: 3000 }); // what TTSControl writes
    expect(getPlaceFor('ai', 'wk1', { storage })).toMatchObject({ sentence: 7, sentenceKey: 'bbb' });
    expect(getPlaceFor('living-lessons', 'll1', { storage })).toMatchObject({ sentence: 0, sentenceKey: '' });
  });
});

describe('what counts as "in progress"', () => {
  it('a glance at a card is not starting it; Start, a move, or a sentence is', () => {
    recordPlace({ courseKey: 'c', lessonId: 'browse' }, { storage, now: 1 });
    recordPlace({ courseKey: 'c', lessonId: 'started', started: true }, { storage, now: 2 });
    recordPlace({ courseKey: 'c', lessonId: 'moved', step: 1 }, { storage, now: 3 });
    recordPlace({ courseKey: 'c', lessonId: 'read', sentence: 2, sentenceKey: 'k' }, { storage, now: 4 });
    recordPlace({ courseKey: 'c', lessonId: 'over', stage: 3 }, { storage, now: 5 });
    finishPlace({ courseKey: 'c', lessonId: 'over' }, { storage, now: 6 });
    const ids = listPlaces({ storage, inProgress: true }).map((p) => p.lessonId);
    expect(ids).toEqual(['read', 'moved', 'started']); // newest first; browse and finished excluded
    expect(placeInProgress(getPlaceFor('c', 'browse', { storage }))).toBe(false);
    expect(getPlaceFor('c', 'over', { storage }).done).toBe(true);
  });

  it('listPlaces narrows to one course', () => {
    recordPlace({ courseKey: 'a', lessonId: 'a1', step: 1 }, { storage, now: 1 });
    recordPlace({ courseKey: 'b', lessonId: 'b1', step: 1 }, { storage, now: 2 });
    expect(listPlaces({ storage, courseKey: 'a' }).map((p) => p.lessonId)).toEqual(['a1']);
  });
});

describe('Start fresh forgets ONE lesson', () => {
  it('only the named lesson is forgotten; the latest moves to the next most recent', () => {
    recordPlace({ courseKey: 'a', lessonId: 'a1', step: 3 }, { storage, now: 1 });
    recordPlace({ courseKey: 'b', lessonId: 'b1', step: 1 }, { storage, now: 2 });
    clearPlace({ courseKey: 'b', lessonId: 'b1', storage });
    expect(getPlaceFor('b', 'b1', { storage })).toBeNull();
    expect(getPlaceFor('a', 'a1', { storage }).step).toBe(3);
    expect(getPlace({ storage }).lessonId).toBe('a1');
  });

  it('clearAllPlaces empties the device', () => {
    recordPlace({ courseKey: 'a', lessonId: 'a1', step: 3 }, { storage, now: 1 });
    clearAllPlaces({ storage });
    expect(getPlace({ storage })).toBeNull();
    expect(listPlaces({ storage })).toEqual([]);
  });

  it('Refresh first can name its lesson', () => {
    recordPlace({ courseKey: 'a', lessonId: 'a1', stage: 1, step: 4 }, { storage, now: 1 });
    recordPlace({ courseKey: 'b', lessonId: 'b1', step: 1 }, { storage, now: 2 });
    const p = refreshPlace({ courseKey: 'a', lessonId: 'a1', storage, now: 3 });
    expect(p).toMatchObject({ lessonId: 'a1', stage: 1, step: 2 });
    expect(getPlace({ storage }).lessonId).toBe('a1');
  });
});

describe('the old single record is honoured, both ways', () => {
  it('a device that only has the legacy record is migrated on read, as a started place', () => {
    const s = memStorage({ 'poe-learn-place': JSON.stringify({ courseKey: 'living-lessons', lessonId: 'll3', stage: 1, step: 2, at: 5 }) });
    expect(getPlace({ storage: s })).toMatchObject({ lessonId: 'll3', stage: 1, step: 2, started: true });
    expect(listPlaces({ storage: s, inProgress: true }).map((p) => p.lessonId)).toEqual(['ll3']);
  });

  it('the legacy key mirrors the latest place, so an older tab still reads it', () => {
    recordPlace({ courseKey: 'a', lessonId: 'a1', step: 2 }, { storage, now: 1 });
    expect(JSON.parse(storage.getItem('poe-learn-place'))).toMatchObject({ courseKey: 'a', lessonId: 'a1', step: 2 });
  });

  it("an older tab's write to the legacy key is folded in as the newest word", () => {
    recordPlace({ courseKey: 'a', lessonId: 'a1', step: 2 }, { storage, now: 1 });
    storage.setItem('poe-learn-place', JSON.stringify({ courseKey: 'b', lessonId: 'b9', stage: 3, at: 9 }));
    expect(getPlace({ storage }).lessonId).toBe('b9');
    expect(getPlaceFor('a', 'a1', { storage }).step).toBe(2);
  });
});

describe('the record stays small', () => {
  it(`keeps at most ${PLACES_CAP} lessons, begun ones ahead of glances, and never drops the latest`, () => {
    for (let i = 0; i < PLACES_CAP + 20; i += 1) {
      recordPlace({ courseKey: 'c', lessonId: `glance${i}` }, { storage, now: 100 + i });
    }
    recordPlace({ courseKey: 'c', lessonId: 'begun', step: 1 }, { storage, now: 10 });
    recordPlace({ courseKey: 'c', lessonId: 'latest' }, { storage, now: 999 });
    const all = listPlaces({ storage });
    expect(all.length).toBe(PLACES_CAP);
    expect(all.some((p) => p.lessonId === 'begun')).toBe(true);
    expect(getPlace({ storage }).lessonId).toBe('latest');
  });
});

describe('the words a person reads', () => {
  it('placeWhere names the part, and the step only when past the first', () => {
    expect(placeWhere({ stage: 1, step: 2 })).toBe('part 2, step 3');
    expect(placeWhere({ stage: 0, step: 0 })).toBe('part 1');
  });

  it('placeAgo says how long, and nothing when it does not know', () => {
    const now = 10 * 24 * 3600 * 1000;
    expect(placeAgo(now - 30 * 1000, now)).toBe('just now');
    expect(placeAgo(now - 5 * 60 * 1000, now)).toBe('5 min ago');
    expect(placeAgo(now - 3 * 3600 * 1000, now)).toBe('3 hr ago');
    expect(placeAgo(now - 30 * 3600 * 1000, now)).toBe('yesterday');
    expect(placeAgo(now - 4 * 24 * 3600 * 1000, now)).toBe('4 days ago');
    expect(placeAgo(0, now)).toBe('');
  });
});
