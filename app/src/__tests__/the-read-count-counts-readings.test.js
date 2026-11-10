// =============================================================================
// the-read-count-counts-readings — READ ×38 on a lesson written that day (DR-1409)
// =============================================================================
// Darrell 2026-11-10, with L292 to L297 each showing READ ×29 to ×41 on the
// day they were written: "Read count is off... fix it..."
//
// THE LOOP, reproduced here on the real place store: a reading is credited at
// the evidence floor (0.9, DR-1384), before its last sentences. Each sentence
// after that is a move, a move cleared `done`, the move's own heard position
// put the evidence back over the floor at once, and the reader finished it
// again. A re-read now counts only when it went back near the start, or when a
// whole lesson was presented end to end; the counts the loop inflated are
// collapsed once to a single read.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { recordPlace, finishPlace, getPlaceFor, placeFinishes, placeIsFinished, readingIsFresh, INFLATED_SINCE, RESTART_FLOOR } from '../lib/learn-resume.js';
import { hasReadEvidence, READ_FLOOR } from '../lib/test-integrity.js';
import { readMark, readMarkLabel } from '../lib/lesson-read-mark.js';

const C = 'living-lessons';
const L = 'll297-precept-upon-precept';
function store(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const place = (storage) => getPlaceFor(C, L, { storage });

// The reader's own rule for crediting a reading (ChurchLearn finishRead).
function finishRead(storage, { guard = true } = {}) {
  const p = place(storage);
  if (placeIsFinished(p) || !hasReadEvidence(p)) return;
  if (guard && !readingIsFresh(p)) return;
  finishPlace({ courseKey: C, lessonId: L, version: 'adult' }, { storage });
}

/** Read the lesson aloud sentence by sentence to its end, crediting as the reader does. */
function readThrough(storage, from, sentences, opts) {
  for (let i = from; i <= sentences; i += 1) {
    recordPlace({ courseKey: C, lessonId: L, stage: 0, step: 0, sentence: i, heard: i / sentences }, { storage });
    finishRead(storage, opts);
  }
}

describe('a reading is counted once, however many sentences follow the floor', () => {
  it('reading one lesson to its end counts one read, not one per sentence past the floor', () => {
    const s = store();
    readThrough(s, 1, 50);
    expect(READ_FLOOR).toBe(0.9);
    expect(placeFinishes(place(s))).toBe(1);
    expect(place(s).versions).toEqual({ adult: 1 });
  });

  it('PROVEN TO CATCH: without the guard the reader re-finishes after every sentence past the floor', () => {
    const s = store();
    let finishes = 0;
    const edges = [];
    for (let i = 1; i <= 50; i += 1) {
      recordPlace({ courseKey: C, lessonId: L, stage: 0, step: 0, sentence: i, heard: i / 50 }, { storage: s });
      const before = placeIsFinished(place(s));
      finishRead(s, { guard: false });
      if (!before && placeIsFinished(place(s))) edges.push(i);
      finishes = placeFinishes(place(s));
    }
    // The old rule counted every one of these edges: sentences 45 to 50.
    expect(edges.length).toBeGreaterThan(1);
    // The new count rule holds even when the reader's guard is missing.
    expect(finishes).toBe(1);
  });

  it('a real re-read, back at the top and through again, counts as the second read', () => {
    const s = store();
    readThrough(s, 1, 40);
    recordPlace({ courseKey: C, lessonId: L, stage: 0, step: 0, sentence: 0, heard: 0 }, { storage: s });
    expect(place(s).low).toBe(0);
    readThrough(s, 1, 40);
    expect(placeFinishes(place(s))).toBe(2);
  });

  it('going back only to the last paragraph is not a new reading', () => {
    const s = store();
    readThrough(s, 1, 40);
    readThrough(s, 35, 40);
    expect(RESTART_FLOOR).toBe(0.25);
    expect(placeFinishes(place(s))).toBe(1);
  });

  it('a whole lesson presented end to end on the deck counts by its own evidence', () => {
    const s = store();
    readThrough(s, 1, 40);
    recordPlace({ courseKey: C, lessonId: L, stage: 0, step: 3, sentence: 38, heard: 0.95 }, { storage: s });
    finishPlace({ courseKey: C, lessonId: L, version: 'adult', whole: true }, { storage: s });
    expect(placeFinishes(place(s))).toBe(2);
  });
});

describe('the counts the loop inflated are collapsed once, and only those', () => {
  const MAP = 'poe-learn-places';
  const seeded = (p) =>
    store({
      [MAP]: JSON.stringify({
        v: 1,
        last: `${C}::${L}`,
        mirror: '',
        byLesson: { [`${C}::${L}`]: { courseKey: C, lessonId: L, stage: 0, step: 0, done: true, ...p } },
      }),
    });

  it('a lesson finished x38 since the loop landed reads as one read of its version', () => {
    const s = seeded({ finishes: 38, versions: { adult: 38 }, lastFinishedAt: INFLATED_SINCE + 60 * 60 * 1000 });
    expect(placeFinishes(place(s))).toBe(1);
    expect(place(s).versions).toEqual({ adult: 1 });
    expect(readMarkLabel(readMark({ place: place(s), versions: ['child', 'youth', 'teen', 'adult', 'senior'] }))).toBe('✓ READ · Adult');
  });

  it('a count last finished before the loop landed is left exactly as it was', () => {
    const s = seeded({ finishes: 3, versions: { adult: 3 }, lastFinishedAt: INFLATED_SINCE - 60 * 1000 });
    expect(placeFinishes(place(s))).toBe(3);
  });

  it('the collapse happens once: a real re-read after it counts again and is never collapsed', () => {
    const s = seeded({ finishes: 38, versions: { adult: 38 }, lastFinishedAt: INFLATED_SINCE + 1000, seen: 1, heard: 1 });
    expect(placeFinishes(place(s))).toBe(1);
    recordPlace({ courseKey: C, lessonId: L, stage: 0, step: 0, sentence: 0, heard: 0 }, { storage: s });
    readThrough(s, 1, 30);
    expect(placeFinishes(place(s))).toBe(2);
    expect(place(s).recounted).toBe(true);
  });
});
